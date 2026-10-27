import {createRemapPreview} from './measurement-remap-preview.js';
import {remapCandidates,remapMeasurement} from './measurement-remap.js';
import {relationshipsFor} from './component-relationships.js';
import {partId,findPart} from './model-part-id.js';
import {createEvidenceView,evidenceCoverage} from './model-evidence.js';
import {buildCaps,clearCaps} from './section-caps.js';
import {createMeasurement} from './model-measurement.js';
import {installRenderRecovery} from './render-recovery.js';
import { createCrtPresentation } from "./crt-presentation.js";
import { createDriveSceneState } from "./drive-scene-state.js";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { loadRobotron } from "./robotron-model.js";
// Three.js raycasting does not skip invisible objects. Prune whole hidden
// assemblies before testing triangles, while retaining transparent-cover rules.
export function visiblePickTargets(root) {
  const targets = [];
  function visit(node) {
    if (!node.visible || (node.material?.transparent && node.material.opacity < 0.2 && node.userData.protectUnit === undefined)) return;
    if (node.geometry) targets.push(node);
    for (const child of node.children) visit(child);
  }
  visit(root);
  return targets;
}

// Keep per-instance identity: hundreds of chips share a handful of meshes.
export function inspectionForHit(hit) {
  return hit?.object.userData.componentDetails?.[hit.instanceId]
    ?? hit?.object.userData.detail;
}

const videoFrustum = new THREE.Frustum(), videoProjection = new THREE.Matrix4();
export function inCameraView(object, camera) {
  for (let node = object; node; node = node.parent) if (!node.visible) return false;
  camera.updateMatrixWorld();
  object.updateWorldMatrix(true, false);
  videoFrustum.setFromProjectionMatrix(videoProjection.multiplyMatrices(
    camera.projectionMatrix, camera.matrixWorldInverse));
  return videoFrustum.intersectsObject(object);
}

export function createScene(
  container,
  screen,
  onPower,
  onReset,
  interaction = {},
) {
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(36, 1, 0.01, 40);
  camera.position.set(2.3, 2.2, 3.3);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : "";
  const softwareRendering =
    /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(rendererName);
  // Keep all geometry/materials on software WebGL, but avoid forcing a CPU to
  // shade a high-DPI framebuffer. This also serves remote desktops and VMs.
  renderer.setPixelRatio(
    softwareRendering ? 0.75 : Math.min(devicePixelRatio, 2),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let renderRequested = true;
  let selectedPart=null,partOutline;const relatedOutlines=[];
  function clearRelated(){for(const h of relatedOutlines){h.removeFromParent();h.geometry.dispose();h.material.dispose();}relatedOutlines.length=0;}

  let caseOpen = false;
  let assembliesLifted = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.append(renderer.domElement);
  let environment;
  function rebuildEnvironment(){environment?.dispose();const studio=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(studio,.04);scene.environment=environment.texture;scene.environmentIntensity=.55;studio.dispose();pmrem.dispose();}
  rebuildEnvironment();
  const controls = new OrbitControls(camera, renderer.domElement);
  let evidenceView,evidenceEnabled=false;
  let section={axis:'off',position:0,reverse:false},sectionRoot,lastHit;
  const remapPreview=createRemapPreview(scene);
  const measurement=createMeasurement(scene,value=>window.dispatchEvent(new CustomEvent('model-measurement',{detail:value})));
  function inspectionMode(mode){
    cancelGesture();evidenceEnabled=mode==='evidence';evidenceView?.set(evidenceEnabled);measurement.set(mode==='measure');
    window.dispatchEvent(new CustomEvent('dac-inspection-mode',{detail:mode}));renderRequested=true;
  }
  const capGroup=new THREE.Group();scene.add(capGroup);
  const sectionHandle=new THREE.Object3D();scene.add(sectionHandle);
  const sectionGizmo=new TransformControls(camera,renderer.domElement);sectionGizmo.enabled=false;sectionGizmo.size=.65;sectionGizmo.showXY=sectionGizmo.showYZ=sectionGizmo.showXZ=sectionGizmo.showXYZE=false;scene.add(sectionGizmo.getHelper());
  sectionGizmo.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;if(e.value){down=undefined;robotron?.releaseKeys();}else applySection();});
  sectionGizmo.addEventListener('change',()=>{renderRequested=true;});
  sectionGizmo.addEventListener('objectChange',()=>{section.position=Math.max(-2,Math.min(2,sectionHandle.position[section.axis]));applySection();window.dispatchEvent(new CustomEvent('section-position-change',{detail:section.position}));});
  const sectionPlane=new THREE.Plane();renderer.localClippingEnabled=true;
  const planeHelper=new THREE.PlaneHelper(sectionPlane,2,0xe9aa3c);planeHelper.visible=false;scene.add(planeHelper);
  function sectionVisible(point){return section.axis==='off'||sectionPlane.distanceToPoint(point)>=0;}
  function applySection(){
    if(!robotron)return;sectionRoot=robotron.group;
    const normal=new THREE.Vector3();normal[section.axis==='off'?'x':section.axis]=section.reverse?-1:1;
    sectionPlane.set(normal,-section.position*(section.reverse?-1:1));
    robotron.group.traverse(o=>{for(const m of [o.material].flat().filter(Boolean)){m.clippingPlanes=section.axis==='off'?[]:[sectionPlane];m.clipShadows=true;m.needsUpdate=true;}});
    planeHelper.visible=kind===2&&section.axis!=='off'&&!!section.showPlane;
    capGroup.visible=kind===2;
    sectionGizmo.enabled=kind===2&&section.axis!=='off'&&section.drag;
    if(sectionGizmo.enabled){sectionGizmo.showX=section.axis==='x';sectionGizmo.showY=section.axis==='y';sectionGizmo.showZ=section.axis==='z';if(!sectionGizmo.dragging){const box=new THREE.Box3();for(const o of visiblePickTargets(robotron.group))box.expandByObject(o);if(!box.isEmpty())box.getCenter(sectionHandle.position);sectionHandle.position[section.axis]=section.position;}if(!sectionGizmo.object)sectionGizmo.attach(sectionHandle);}else sectionGizmo.detach();
    const caps=section.axis!=='off'&&section.caps&&!sectionGizmo.dragging?buildCaps(robotron.group,sectionPlane,capGroup):(clearCaps(capGroup),0);
    window.dispatchEvent(new CustomEvent('section-caps',{detail:{count:caps,skipped:capGroup.userData.skipped||[]}}));
    renderRequested=true;renderer.shadowMap.needsUpdate=true;
  }
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.addEventListener("change", () => {
    renderRequested = true;
  });
  controls.minDistance = 0.35;
  controls.maxDistance = 5;
  controls.maxPolarAngle = Math.PI;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xe9eef5, 0x68716d, 0.8));
  const light = new THREE.DirectionalLight(0xfff4e8, 2.6);
  light.position.set(-2, 4, 3);
  light.castShadow = true;
  light.shadow.bias = -0.0001;
  light.shadow.normalBias = 0.0003;
  const shadowSize = softwareRendering ? 1024 : 2048;
  light.shadow.mapSize.set(shadowSize, shadowSize);
  light.shadow.camera.left = light.shadow.camera.bottom = -1.35;
  light.shadow.camera.right = light.shadow.camera.top = 1.35;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 10;
  renderer.shadowMap.type = softwareRendering ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  scene.add(light);
  const inspectionLight = new THREE.DirectionalLight(0xe4eeff, 0.65);
  inspectionLight.position.set(1, -2, 2);
  scene.add(inspectionLight);
  // A grazing rear light reveals connector lips, metal plates and the shell
  // joint. CPU renderers retain one cached shadow map; GPU renderers add the rear map.
  const rearLight = new THREE.DirectionalLight(0xf2f4ff, 1.5);
  rearLight.position.set(-1.5, 2.2, -3);
  rearLight.target.position.set(0, 0.3, -0.3);
  rearLight.castShadow = !softwareRendering;
  rearLight.shadow.mapSize.set(shadowSize / 2, shadowSize / 2);
  rearLight.shadow.bias = -0.0001;
  rearLight.shadow.normalBias = 0.0002;
  rearLight.shadow.camera.left = rearLight.shadow.camera.bottom = -0.85;
  rearLight.shadow.camera.right = rearLight.shadow.camera.top = 0.85;
  rearLight.shadow.camera.near = 0.5;
  rearLight.shadow.camera.far = 6;
  scene.add(rearLight, rearLight.target);
  const machine = new THREE.Group();
  scene.add(machine);
  const beige = new THREE.MeshStandardMaterial({
      color: 0xc4c1a8,
      roughness: 0.8,
    }),
    dark = new THREE.MeshStandardMaterial({ color: 0x303936, roughness: 0.7 }),
    keyMat = new THREE.MeshStandardMaterial({
      color: 0xd9d5bc,
      roughness: 0.7,
    }),
    black = new THREE.MeshStandardMaterial({ color: 0x101b16 });
  function box(w, h, d, mat, x, y, z, parent = machine) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box(1.34, 0.23, 0.94, beige, 0, 0.25, 0);
  box(1.29, 0.014, 0.9, dark, 0, 0.129, 0);
  for (const x of [-0.52, 0.52])
    for (const z of [-0.34, 0.34]) box(0.09, 0.045, 0.09, dark, x, 0.106, z);
  // Separate monitor, keyboard, disk openings and underside details.
  box(0.82, 0.67, 0.63, beige, 0, 0.76, -0.08);
  box(0.77, 0.6, 0.022, dark, 0, 0.76, 0.247);
  box(0.19, 0.09, 0.21, dark, 0, 0.39, -0.08);
  const presentation = createCrtPresentation(screen);
  presentation.tick(performance.now());
  const texture = new THREE.CanvasTexture(presentation.canvas);
  let textureWidth=presentation.canvas.width,textureHeight=presentation.canvas.height;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 4;
  texture.magFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.67, 0.42),
    new THREE.MeshBasicMaterial({ map: texture }),
  );
  display.position.set(0, 0.79, 0.262);
  machine.add(display);
  for (const x of [-0.3, 0.14]) {
    box(0.34, 0.04, 0.024, dark, x, 0.27, 0.48);
    box(0.025, 0.06, 0.02, keyMat, x + 0.13, 0.27, 0.499);
  }
  const powerMat = new THREE.MeshStandardMaterial({
    color: 0xc36e3f,
    roughness: 0.5,
  });
  const power = box(0.07, 0.075, 0.04, powerMat, 0.53, 0.25, 0.485);
  const keyboard = new THREE.Group();
  keyboard.position.set(0, 0.12, 0.85);
  keyboard.rotation.x = 0.09;
  machine.add(keyboard);
  box(1.05, 0.06, 0.39, beige, 0, 0, 0, keyboard);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 13; col++)
      box(
        0.058,
        0.026,
        0.059,
        keyMat,
        (col - 6) * 0.071,
        0.045,
        (row - 1.5) * 0.077,
        keyboard,
      );
  box(0.34, 0.026, 0.055, keyMat, -0.1, 0.045, 0.168, keyboard);
  for (let i = 0; i < 16; i++)
    box(0.018, 0.065, 0.006, dark, -0.43 + i * 0.057, 0.79, -0.399);
  for (let i = 0; i < 5; i++)
    box(0.12, 0.055, 0.014, dark, -0.46 + i * 0.23, 0.25, -0.477);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3531,
    roughness: 0.85,
  });
  new STLLoader().load(
    new URL(
      "models/monitor-ring.stl",
      new URL(import.meta.env.BASE_URL, location.origin),
    ).href,
    (g) => {
      const ring = new THREE.Mesh(g, ringMaterial);
      ring.scale.setScalar(0.001);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.367, -0.08);
      machine.add(ring);
      renderRequested = true;
      renderer.shadowMap.needsUpdate = true;
    },
    undefined,
    () => {},
  );
  let kind = 2,
    robotron,
    powered = false,
    modelError = false;
  let modifiers = {}, mediaPresent = [false, false];
  const driveState = createDriveSceneState();
  const loading = document.getElementById("model-loading"),
    loadingBar = document.getElementById("model-loading-bar"),
    loadingPercent = document.getElementById("model-loading-percent");
  function loadingProgress(percent) {
    if (modelError) return;
    loadingPercent.textContent = `${percent}%`;
    loadingBar.setAttribute("aria-valuenow", String(percent));
    loadingBar.firstElementChild.style.width = `${percent}%`;
    document.getElementById("model-loading-detail").textContent =
      percent === 100 ? "Ready to explore" : "Preparing the exhibit…";
  }
  function visibility() {
    if(kind!==2){sectionGizmo.enabled=false;sectionGizmo.detach();}
    capGroup.visible=kind===2;
    planeHelper.visible=kind===2&&section.axis!=='off'&&!!section.showPlane;
    renderRequested = true;
    renderer.shadowMap.needsUpdate = true;
    machine.visible = kind !== 2 || !robotron;
    loading.hidden = kind !== 2 || !!robotron;
    container.setAttribute("aria-busy", String(kind === 2 && !robotron && !modelError));
    if (modelError) {
      loading.dataset.error = "true";
      loadingBar.hidden = loadingPercent.hidden = true;
      document.getElementById("model-loading-title").textContent = "3D model couldn’t load";
      document.getElementById("model-loading-detail").textContent = "You can still use the computer controls below.";
    }
    if (robotron) robotron.group.visible = kind === 2;
    container.dataset.model =
      kind === 2
        ? robotron
          ? "robotron-photo"
          : modelError
            ? "unavailable"
            : "loading"
        : "provisional";
    document.getElementById("model-note").textContent =
      kind !== 2
        ? "PROVISIONAL GEOMETRY · NOT A SCAN"
        : robotron
          ? "PHOTO-REFERENCED MODEL · DANILA’S MACHINE"
          : modelError
            ? "MODEL UNAVAILABLE · PROVISIONAL GEOMETRY"
            : "LOADING DANILA’S MACHINE…";
  }
  visibility();
  let crtSettings={};
  const soundPoint=new THREE.Vector3();
  const detailLoading=document.createElement("div");detailLoading.id="detail-loading";detailLoading.hidden=true;detailLoading.setAttribute("role","status");container.append(detailLoading);
  loadRobotron(texture, loadingProgress, state=>{
    sectionRoot=null;container.dataset.details=state;detailLoading.hidden=state==="ready";
    detailLoading.textContent=state==="error"?"Some interior details could not load. Reopen this assembly to retry.":"Loading interior details…";
    renderRequested=true;renderer.shadowMap.needsUpdate=true;
  },keys=>interaction.onKeysReady?.(keys,false))
    .then((model) => {
      evidenceView=createEvidenceView(model);evidenceView.set(evidenceEnabled);
      robotron = model;measurement.scale(model.group.scale.x);
      model.displaySettings(crtSettings);
      scene.add(model.group);measurement.configure(model.group,model.identity);measurement.options({visible:sectionVisible});
      window.dispatchEvent(new CustomEvent("dac-model-ready",{detail:{evidence:model.evidence}}));
      model.power(powered);
      model.modifiers(modifiers);
      model.media(mediaPresent);
      if (driveState.snapshot) model.drives(...driveState.snapshot);
      interaction.onKeysReady?.(model.keys);
      visibility();
      fitRearView();
    })
    .catch((error) => {
      console.error("Robotron model failed to load", error);
      modelError = true;
      visibility();
      fitRearView();
    });
  const ray = new THREE.Raycaster(),
    point = new THREE.Vector2();
  let down;
  function pointerRay(e) {
    const r = renderer.domElement.getBoundingClientRect();
    point.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    // Picking must not depend on whether an on-demand render has happened yet.
    camera.updateMatrixWorld();
    ray.setFromCamera(point, camera);
  }
  function hitAt(e) {
    pointerRay(e);
    // Apply queued key/media/inspection state before picking, even when a
    // software-rendered frame has not caught up with the input event yet.
    const changed = robotron?.tick();
    if (changed?.dirty) renderRequested = true;
    if (changed?.shadows) renderer.shadowMap.needsUpdate = true;
    machine.updateWorldMatrix(true, true);
    robotron?.group.updateWorldMatrix(true, true);
    const hit = kind === 2 && robotron
      ? ray.intersectObjects(visiblePickTargets(robotron.group), false).find(hit=>sectionVisible(hit.point))
      : ray.intersectObject(power)[0];
    lastHit=hit;
    if (hit) hit.object.userData.pickedDetail = inspectionForHit(hit);
    return hit?.object;
  }
  function cancelGesture() {
    robotron?.resetPressed(false);
    if (down?.key)
      robotron?.keyState(down.key.id, false);
    if (down?.ghost) scene.remove(down.ghost);
    robotron?.diskDropHighlight(null);
    renderRequested = true;
    down = undefined;
    controls.enabled = true;
    document.getElementById("disk-drag-hint")?.remove();
  }
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) {
      cancelGesture();
      return;
    }
    if(sectionGizmo.enabled&&sectionGizmo.axis)return;
    const hit = hitAt(e);
    down = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      key: measurement.enabled||evidenceView?.active?undefined:hit?.userData.key,
      object: hit,
      detail: hit?.userData.pickedDetail,
      disk: measurement.enabled||evidenceView?.active?undefined:hit?.userData.removedDisk,
      dragged: false,
    };
    if (down.disk !== undefined) {
      controls.enabled = false;
      down.ghost=robotron.diskDragCopy(down.disk);scene.add(down.ghost);
      const center=new THREE.Box3().setFromObject(hit).getCenter(new THREE.Vector3());
      down.plane=new THREE.Plane().setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),center);
      down.origin=ray.ray.intersectPlane(down.plane,new THREE.Vector3());
      const hint=document.createElement("div"); hint.id="disk-drag-hint"; hint.textContent="Drag to an open, empty drive";
      hint.style.left=e.clientX+12+"px"; hint.style.top=e.clientY+12+"px"; document.body.append(hint);
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    if (down.key) robotron.keyState(down.key.id, true);
    if (!measurement.enabled && !evidenceView?.active && hit && hit===robotron?.objects.get("reset")) robotron.resetPressed(true);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
      down.dragged = true;
      if (down.key) robotron?.keyState(down.key.id, false);
      robotron?.resetPressed(false);
    }
    if (down) {
      if(down.ghost && down.origin){
        // Drag placement needs only the ray/plane intersection, not a pick
        // against every triangle inside the museum machine.
        pointerRay(e);
        const p=ray.ray.intersectPlane(down.plane,new THREE.Vector3());
        if(p){down.ghost.position.copy(p.sub(down.origin));renderRequested=true;}
      }
      const hint=document.getElementById("disk-drag-hint");
      if(hint){
        hint.style.left=e.clientX+12+"px";hint.style.top=e.clientY+12+"px";
        const target=robotron.diskDropTarget(ray.ray);
        const reason=target===null?"Move over a drive":interaction.diskDropStatus?.(down.disk,target);
        hint.textContent=reason||`Release to insert in drive ${target?"B":"A"}`;
        hint.dataset.allowed=String(target!==null&&!reason);
        robotron.diskDropHighlight(target,target!==null&&!reason);renderRequested=true;
      }
      return;
    }
    const hit = hitAt(e),
      key = hit?.userData.key;
    renderer.domElement.style.cursor =
      hit &&
      (key ||
        hit.userData.driveUnit !== undefined ||
        hit.userData.detail ||
        hit === robotron?.objects.get("power") ||
        hit === robotron?.objects.get("reset"))
        ? "pointer"
        : "grab";
    interaction.onHover?.(
      evidenceView?.active && hit ? "Click to inspect this surface’s evidence" : hit?.userData.protectUnit !== undefined
        ? "Click the notch to cover/uncover write protection"
        : hit?.userData.removedDisk !== undefined
        ? "Drag this disk into an open, empty drive, or click to inspect"
        : key
        ? `${key.label}${key.input.unsupported ? " · mapping unverified" : ""}`
        : hit?.userData.driveUnit !== undefined
          ? `Click to operate drive ${hit.userData.driveUnit ? "B" : "A"} lever`
        : hit?.userData.detail
          ? (hit.userData.pickedDetail?.title || "Click to inspect this component and its evidence")
          : "",
    );
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || down.id !== e.pointerId) return;
    const gesture = down,
      hit = hitAt(e);
    cancelGesture();
    if (gesture.disk !== undefined && gesture.dragged) {
      const target=robotron.diskDropTarget(ray.ray);
      if(target!==null && !interaction.diskDropStatus?.(gesture.disk,target)) interaction.onInsertDisk?.(gesture.disk,target);
      return;
    }
    if (
      gesture.dragged ||
      Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 5
    )
      return;
    container.focus({ preventScroll: true });
    if (!hit) return;
    if(evidenceView?.active){interaction.onEvidence?.(evidenceView.info(hit));return;}
    if(measurement.enabled){try{measurement.pick(lastHit);}catch(error){window.dispatchEvent(new CustomEvent("measurement-error",{detail:error.message}));}renderRequested=true;return;}
    if (gesture.key && hit?.userData.key?.id === gesture.key.id) {
      if (interaction.onKey?.(gesture.key)) robotron.pulse(gesture.key.id);
    } else if (hit.userData.driveUnit !== undefined && gesture.object === hit)
      interaction.onDriveLever?.(hit.userData.driveUnit);
    else if (hit.userData.protectUnit !== undefined && gesture.object === hit)
      interaction.onProtect?.(hit.userData.protectUnit);
    else if (hit.userData.detail && gesture.object === hit &&
             gesture.detail === hit.userData.pickedDetail)
      interaction.onInspect?.(hit.userData.pickedDetail, hit.name);
    else if (hit === robotron?.objects.get("power") || hit === power) onPower();
    else if (hit === robotron?.objects.get("reset")) onReset?.();
  });
  renderer.domElement.addEventListener("pointercancel", cancelGesture);
  renderer.domElement.addEventListener("lostpointercapture", cancelGesture);
  renderer.domElement.addEventListener("pointerleave", () =>
    interaction.onHover?.(""),
  );
  window.addEventListener("blur", cancelGesture);
  let fittedView;
  controls.addEventListener("start", () => { fittedView = undefined; });
  function fitRearView() {
    if (!robotron || !["back", "rear-panel"].includes(fittedView)) return;
    robotron.group.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3(), corners = [];
    robotron.group.traverseVisible((mesh) => {
      if (!mesh.isMesh || (fittedView === "rear-panel" && !mesh.name.startsWith("rear-"))) return;
      if (mesh.isInstancedMesh) mesh.computeBoundingBox();
      else if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const box = mesh.isInstancedMesh ? mesh.boundingBox : mesh.geometry.boundingBox;
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const p = new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld);
            corners.push(p);
            bounds.expandByPoint(p);
          }
    });
    if (bounds.isEmpty()) return;
    const center = bounds.getCenter(new THREE.Vector3());
    const direction = camera.position.clone().sub(controls.target).normalize();
    controls.target.copy(center);
    camera.position.copy(center).add(direction);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    const inverse = camera.quaternion.clone().invert();
    const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.zoom;
    const tanX = tanY * camera.aspect;
    let distance = 0;
    for (const corner of corners) {
      const p = corner.sub(center).applyQuaternion(inverse);
      distance = Math.max(distance, p.z + Math.max(Math.abs(p.x) / tanX, Math.abs(p.y) / tanY) * 1.1);
    }
    camera.position.copy(center).addScaledVector(direction, distance);
    controls.update();
  }
  const observer = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    camera.zoom = width < 500 && !container.closest(".typing") ? 0.56 : 1;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    fitRearView();
    renderRequested = true;
  });
  observer.observe(container);
  const labelLayer=document.createElement("div");labelLayer.className="inspection-label-layer";container.append(labelLayer);
  let labelsEnabled=false;
  const labelButtons=new Map();
  function drawLabels(){
    const occupied=[],blockers=[];
    if(labelsEnabled)robotron?.group.traverseVisible(m=>{
      if(m.isMesh && /^(case-lid|fascia|logic-boards|psu-cover|psu-chassis|keyboard-shell|keyboard-deck|keycap-|silver-key-inlay|monitor-shell|drive-frames|drive-mechanisms)/.test(m.name) && (m.material?.opacity ?? 1)>.95)blockers.push(m);
    });
    for(const annotation of robotron?.annotations || []){
      let button=labelButtons.get(annotation.id);
      if(!button){button=document.createElement("button");button.className="inspection-label";button.dataset.annotation=annotation.id;button.textContent=annotation.title;button.title=annotation.evidence+" · "+annotation.dimensions;button.onclick=()=>interaction.onAnnotation?.(annotation);labelLayer.append(button);labelButtons.set(annotation.id,button);}
      const mesh=robotron.objects.get(annotation.part);
      button.hidden=true;
      if(!labelsEnabled || kind!==2 || !mesh?.visible || mesh.userData.loaded===false)continue;
      mesh.updateWorldMatrix(true,false);mesh.geometry.computeBoundingBox();
      const point=annotation.position?new THREE.Vector3(...annotation.position):mesh.geometry.boundingBox?.getCenter(new THREE.Vector3());
      if(!point)continue;point.applyMatrix4(mesh.matrixWorld);if(!sectionVisible(point))continue;
      const direction=point.clone().sub(camera.position),distance=direction.length();
      const ray=new THREE.Raycaster(camera.position,direction.normalize(),0,Math.max(0,distance-.0005));
      if(ray.intersectObjects(blockers,false).some(hit=>sectionVisible(hit.point)))continue;
      point.project(camera);
      if(Math.abs(point.x)>.94||Math.abs(point.y)>.94||point.z< -1||point.z>1)continue;
      button.hidden=false;
      const anchorX=(point.x+1)*container.clientWidth/2,anchorY=(1-point.y)*container.clientHeight/2;
      const width=button.offsetWidth,height=button.offsetHeight;
      const x=Math.max(14,Math.min(container.clientWidth-width-4,anchorX+9));
      let y=anchorY-height/2,found=false;
      for(const offset of [0,32,-32,64,-64,96,-96,128,-128]){
        const candidate=Math.max(4,Math.min(container.clientHeight-height-4,y+offset));
        if(!occupied.some(r=>x<r.x+r.w+5&&x+width+5>r.x&&candidate<r.y+r.h+5&&candidate+height+5>r.y)){
          y=candidate;found=true;break;
        }
      }
      if(!found){button.hidden=true;continue;}
      occupied.push({x,y,w:width,h:height});
      button.style.left=`${x}px`;button.style.top=`${y}px`;
      const dx=anchorX-x,dy=anchorY-y-height/2;
      button.style.setProperty('--leader-length',`${Math.hypot(dx,dy)}px`);
      button.style.setProperty('--leader-angle',`${Math.atan2(dy,dx)}rad`);
    }
  }
  const drawFrame = () => {
    controls.update();
    if(presentation.tick(performance.now())){
      if(textureWidth!==presentation.canvas.width||textureHeight!==presentation.canvas.height){
        texture.dispose();textureWidth=presentation.canvas.width;textureHeight=presentation.canvas.height;
      }
      texture.needsUpdate=true;renderRequested ||= kind !== 2 || !robotron || inCameraView(robotron.objects.get("crt-glass"), camera);}
    robotron?.detailDistance(camera.position.distanceTo(controls.target));
    const changed = robotron?.tick();
    if (changed?.shadows) renderer.shadowMap.needsUpdate = true;
    if (renderRequested || changed?.dirty) {
      if(sectionRoot!==robotron?.group)applySection();
      if(partOutline)partOutline.update();for(const h of relatedOutlines)h.update();
      measurement.update();remapPreview.update();evidenceView?.refresh();
      renderer.render(scene, camera);
      drawLabels();
      if(robotron && interaction.onSoundPosition) {
        const pan=(x,y,z)=>{soundPoint.set(x,y,z);robotron.group.localToWorld(soundPoint);soundPoint.project(camera);return Math.max(-.8,Math.min(.8,soundPoint.x));};
        interaction.onSoundPosition({keyboard:pan(0,-330,30),case:pan(0,0,100)});
      }
      renderRequested = false;
    }
  };
  let inViewport=true;
  function updateRendering(){
    const active=inViewport&&!document.hidden&&!recovery.lost;
    container.dataset.rendering=active?"active":"paused";
    renderRequested=true;
    renderer.setAnimationLoop(active?drawFrame:null);
  }
  const recovery=installRenderRecovery(renderer,container,ready=>{cancelGesture();if(ready){rebuildEnvironment();applySection();presentation.update();}updateRendering();});
  const intersection=new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;updateRendering();});intersection.observe(container);
  document.addEventListener("visibilitychange",updateRendering);
  updateRendering();
  return {
    section(value){if(!['off','x','y','z'].includes(value.axis)||!Number.isFinite(value.position)||Math.abs(value.position)>4)return;section={axis:value.axis,position:value.position,reverse:!!value.reverse,showPlane:!!value.showPlane,caps:!!value.caps,drag:!!value.drag};applySection();},
    navigate(key){const offset=camera.position.clone().sub(controls.target),sphere=new THREE.Spherical().setFromVector3(offset);if(key==='ArrowLeft')sphere.theta-=.12;if(key==='ArrowRight')sphere.theta+=.12;if(key==='ArrowUp')sphere.phi-=.12;if(key==='ArrowDown')sphere.phi+=.12;if(key==='+'||key==='=')sphere.radius*=.9;if(key==='-')sphere.radius*=1.1;sphere.radius=Math.max(.1,Math.min(15,sphere.radius));sphere.makeSafe();camera.position.copy(controls.target).add(offset.setFromSpherical(sphere));controls.update();renderRequested=true;},
    focusCircuit(ref,related){robotron?.focusCircuit(ref,related);renderRequested=true;},
    keyboardControllerSelection(points,routes=[]){robotron?.keyboardControllerSelection(points,routes);renderRequested=true;},
    annotations(on){labelsEnabled=on;renderRequested=true;},
    markTrack(value){robotron?.markTrack(value);renderRequested=true;},
    sectionRange(axis){if(!robotron||!["x","y","z"].includes(axis))return null;robotron.tick();robotron.group.updateWorldMatrix(true,true);const box=new THREE.Box3();for(const o of visiblePickTargets(robotron.group))box.expandByObject(o);return box.isEmpty()?null:[box.min[axis],box.max[axis]];},
    evidenceCoverage(){return robotron?evidenceCoverage(robotron):[];},
    evidenceMode(on){inspectionMode(on?'evidence':'operate');},
    measurement(on){inspectionMode(on?'measure':'operate');},
    measurementEndpoint(slot){inspectionMode('measure');measurement.endpoint(slot);},
    measurementOptions(value){measurement.options(value);renderRequested=true;},
    measurementRemapCandidates(record){if(!robotron||kind!==2)throw Error("Load the Robotron model first.");return remapCandidates(robotron.group,record);},
    previewMeasurementRemap(record,ids){const proposal=remapMeasurement(robotron.group,robotron.identity,record,ids);remapPreview.show(robotron.group,record,proposal.record);renderRequested=true;return proposal;},
    clearMeasurementRemap(){remapPreview.clear();renderRequested=true;},
    restoreMeasurement(value){measurement.restore(value);inspectionMode('measure');},
    clearMeasurement(){remapPreview.clear();measurement.clear();renderRequested=true;},
    measurementParts(){if(kind!==2)return [];return [...(robotron?.objects.values()||[])].filter(o=>o.isMesh&&!o.isInstancedMesh&&o.geometry).map(o=>o.name);},
    measureCentre(name,slot){if(kind!==2)return;const object=robotron?.objects.get(name);if(object){inspectionMode('measure');measurement.centre(object,slot);renderRequested=true;}},
    modelIdentity(){return kind===2?robotron?.identity:null;},
    selectedPart(){return selectedPart;},
    inspectionParts(){if(kind!==2||!robotron)return [];const rows=[];function walk(o,path){if(o.isMesh&&o.name)rows.push({id:partId(robotron.group,o),name:o.userData?.pickedDetail?.title||o.name});o.children.forEach((c,i)=>walk(c,[...path,i]));}walk(robotron.group,[]);return rows.sort((a,b)=>a.name.localeCompare(b.name));},
    relatedParts(){if(!robotron||!selectedPart)return [];const object=findPart(robotron.group,selectedPart);return relationshipsFor(object.name);},
    highlightRelated(on){clearRelated();if(on&&robotron&&selectedPart){const selected=findPart(robotron.group,selectedPart),names=new Set(relationshipsFor(selected.name).flatMap(g=>g.members));robotron.group.traverse(o=>{if(o.isMesh&&o!==selected&&names.has(o.name)){const h=new THREE.BoxHelper(o,0x58c9f3);h.material.depthTest=false;h.renderOrder=100;scene.add(h);relatedOutlines.push(h);}});}renderRequested=true;},
    selectPart(id,focus=false){
      clearRelated();partOutline?.removeFromParent();partOutline?.geometry.dispose();partOutline?.material.dispose();partOutline=null;selectedPart=null;
      if(!id){renderRequested=true;return;}
      if(kind!==2||!robotron)throw Error('Load the Robotron first.');
      const object=findPart(robotron.group,id);
      selectedPart=id;robotron.group.updateWorldMatrix(true,true);partOutline=new THREE.BoxHelper(object,0xffd34d);partOutline.material.depthTest=false;partOutline.renderOrder=101;partOutline.userData.target=object;scene.add(partOutline);
      if(focus){const box=new THREE.Box3().setFromObject(object),center=box.getCenter(new THREE.Vector3()),radius=box.getSize(new THREE.Vector3()).length()/2,direction=camera.position.clone().sub(controls.target).normalize();const fov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/camera.zoom);const distance=Math.max(.06,radius/Math.sin(fov/2)/Math.min(1,camera.aspect)*1.25);controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.update();}
      window.dispatchEvent(new CustomEvent('dac-part-selected',{detail:{id,name:object.name,evidence:evidenceView?.info(object)}}));renderRequested=true;
    },
    cameraState(){return {position:camera.position.toArray(),target:controls.target.toArray()};},
    restoreCamera(value){if(!value || ![value.position,value.target].every(a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isFinite(n)&&Math.abs(n)<40)))return;const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;camera.position.fromArray(value.position);controls.target.fromArray(value.target);controls.update();renderRequested=true;},
    onCameraChange(fn){controls.addEventListener("change",fn);},
    activity: (active) => robotron?.activity(active),
    drives: (states, mechanics, available, labels) => {
      driveState.frame(states, mechanics, available, labels);
      mediaPresent = [0,1].map(u => !!(states[u] & 8));
      robotron?.drives(...driveState.snapshot);
    },
    media: (present) => { mediaPresent = present.slice(); driveState.media(present); robotron?.media(present); renderRequested = true; },
    modifiers: (state) => {
      modifiers = state;
      renderRequested = true;
      robotron?.modifiers(state);
      // Latched electrical modifiers do not hold their spring-return keycaps down.
      // Physical travel is driven only by pointer/key down and release events.
    },
    releaseKeys: () => robotron?.releaseKeys(),
    pulse: (id) => robotron?.pulse(id),
    keyState: (id, pressed) => robotron?.keyState(id, pressed),
    inspect: (value) => {
      sectionRoot=null;
      cancelGesture();
      robotron?.inspect(value);
      renderRequested = true;
    },
    openMonitor: (on) => {
      sectionRoot=null;
      cancelGesture();
      robotron?.openMonitor(on);
      renderRequested = true;
    },
    interior: (on) => {
      sectionRoot=null;
      caseOpen = on;
      cancelGesture();
      robotron?.interior(on);
      renderRequested = true;
    },
    separate: (on) => {
      sectionRoot=null;
      assembliesLifted = on;
      cancelGesture();
      robotron?.separate(on);
    },
    displaySettings: value => {crtSettings=value;presentation.settings(value);robotron?.displaySettings(value);renderRequested=true;},
    update: () => {
      // Keep the latest raster for the next render, but do not redraw the whole
      // machine for offscreen CRT updates (for example, while typing below it).
      presentation.update();
      renderRequested ||= kind !== 2 || !robotron ||
        inCameraView(robotron.objects.get("crt-glass"), camera);
    },
    setMachine: (value) => {
      clearRelated();partOutline?.removeFromParent();partOutline?.geometry.dispose();partOutline?.material.dispose();partOutline=null;selectedPart=null;
      remapPreview.clear();measurement.clear();inspectionMode('operate');sectionRoot=null;
      cancelGesture();
      robotron?.releaseKeys();
      robotron?.separate(false);
      robotron?.interior(false);
      robotron?.inspect({
        focus: "none",
        demo: false,
        demoAnimate: false,
        demoPhase: 0,
        disconnectCables: true,
        referencePhoto: false,
        isolated: "all",
        transparent: false,
        keyboardOpen: false,
        clamps: false,
      });
      robotron?.openMonitor(false);
      caseOpen = false;
      assembliesLifted = false;
      kind = value;
      visibility();
    },
    resetFeedback: () => {robotron?.resetFeedback();renderRequested=true;},
    power: (on) => {
      powered = on;
      renderRequested = true;
      robotron?.power(on);
      powerMat.emissive.set(on ? 0x724023 : 0);
    },
    view: (name) => {
      cancelGesture();
      const views = {
        overview: [
          [2.3, 2.2, 3.3],
          [0, 0.55, 0],
        ],
        front: [
          [0, 1.9, 3.8],
          [0, 0.5, 0],
        ],
        back: [
          [-1.4, 1.3, -2.5],
          [0, 0.55, 0.1],
        ],
        "rear-panel": [
          [-0.15, 0.4, -2.1],
          [0, 0.13, -0.5],
        ],
        under: [
          [0.45, -1.35, 1.8],
          [0, 0.03, 0.65],
        ],
        keyboard: [
          [0, 1.55, 1.45],
          [0, 0.07, 0.88],
        ],
        logic: [
          [0.48, 1.25, 0.86],
          [-0.27, 0.06, 0],
        ],
        motherboard: [
          [0.4, 1.35, 0.75],
          [-0.27, 0.034, 0],
        ],
        "fan-detail": [[-.35,.48,-.25],[.2,.17,-.27]],
        "adapter-detail": [[-.25,.58,-.7],[-.2,.19,-.02]],
        "case-cover": [[1.6,-.7,.4],[0,.65,-1]],
        "display-controller": [
          [0.12, 0.94, 0.43],
          [-0.28, 0.107, -0.23],
        ],
        "motherboard-under": [
          [0.4, -1.25, 0.75],
          [-0.27, 0.034, 0],
        ],
        "display-controller-under": [
          [0.12, -0.84, 0.43],
          [-0.28, 0.107, -0.23],
        ],
        "keyboard-inside": [
          [0.2, 2.7, 1.28],
          [0, 0.16, 0.88],
        ],
        "drive-labels": [
          [-0.22, 0.75, -0.42],
          [-0.22, 0.49, 0.36],
        ],
        connector: [
          [-1.08, 0.38, 0.72],
          [-0.66, 0.055, 0.36],
        ],
        "drive-top": [
          [-0.15, 1.55, 0.34],
          [-0.2, 0.2, 0.25],
        ],
        "drive-rear": [
          [-0.2, 0.63, -0.9],
          [-0.2, 0.2, 0.04],
        ],
        drives: [
          [0.45, 1.15, 1.1],
          [-0.2, 0.2, 0.25],
        ],
        monitor: [
          [0.9, 1.4, 1.7],
          [0, 0.85, 0],
        ],
        "monitor-inside": [
          [1.05, 1.65, -1.95],
          [0, 1, 0.05],
        ],
        inside: [
          [1.5, 2.0, 2.8],
          [0, 0.6, -0.2],
        ],
        assembly: [
          [2.1, 2.3, 3.1],
          [0, 0.6, -0.1],
        ],
      };
      if (caseOpen) {
        views.drives = assembliesLifted
          ? [
              [0.65, 1.45, 1.7],
              [-0.2, 0.5, 0.6],
            ]
          : [
              [0.65, 1.1, 1.25],
              [-0.2, 0.18, 0.25],
            ];
        views.monitor = [
          [0.9, 1.85, 0.7],
          [0, 1.3, -1],
        ];
        views["monitor-inside"] = [
          [1.05, 2.1, -2.95],
          [0, 1.45, -0.95],
        ];
        views.overview = views.assembly;
      }
      const view = views[name] || views.overview;
      const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;
      camera.position.set(...view[0]);
      controls.target.set(...view[1]);
      fittedView = name;
      fitRearView();
      controls.update();
    },
  };
}
