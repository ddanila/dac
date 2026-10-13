import { componentDetail } from "./component-detail.js";
import { createDriveMotion } from "./robotron-drives.js";
import { createFanMotion } from "./robotron-fan.js";
import { modelAsset } from "./model-assets.js";
import { loadPcbPhotos, loadPcbComponents } from "./robotron-interior.js";
import { crtGeometry, crtMaterial } from "./robotron-crt.js";
import * as THREE from "three";
import {
  specimenMaterial,
  legendAtlas,
  legendLayout,
  markingTexture,
} from "./robotron-materials.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

// Project a unit square into the photographed quadrilateral. Subdivision keeps
// the perspective correction smooth across triangles rather than one diagonal.
export function photoProjection(q, u, v) {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1[0] - p2[0],
    dx2 = p3[0] - p2[0],
    dx3 = p0[0] - p1[0] + p2[0] - p3[0];
  const dy1 = p1[1] - p2[1],
    dy2 = p3[1] - p2[1],
    dy3 = p0[1] - p1[1] + p2[1] - p3[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g =
    Math.abs(determinant) > 1e-10 ? (dx3 * dy2 - dx2 * dy3) / determinant : 0;
  const h =
    Math.abs(determinant) > 1e-10 ? (dx1 * dy3 - dx3 * dy1) / determinant : 0;
  return [0, 1].map(
    (i) =>
      ((p1[i] - p0[i] + g * p1[i]) * u +
        (p3[i] - p0[i] + h * p3[i]) * v +
        p0[i]) /
      (g * u + h * v + 1),
  );
}
function surface(width, height, radius = 0, bulge = 0) {
  const geometry = new THREE.PlaneGeometry(
    width,
    height,
    width > 100 || bulge ? 24 : 12,
    width > 100 || bulge ? 18 : 8,
  );
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    let x = positions.getX(i),
      y = positions.getY(i);
    const cx = THREE.MathUtils.clamp(
      x,
      -width / 2 + radius,
      width / 2 - radius,
    );
    const cy = THREE.MathUtils.clamp(
      y,
      -height / 2 + radius,
      height / 2 - radius,
    );
    const d = Math.hypot(x - cx, y - cy);
    if (radius && d > radius) {
      x = cx + ((x - cx) * radius) / d;
      y = cy + ((y - cy) * radius) / d;
    }
    positions.setXYZ(
      i,
      x,
      y,
      bulge * (1 - ((2 * x) / width) ** 2) * (1 - ((2 * y) / height) ** 2),
    );
    geometry.attributes.uv.setXY(i, x / width + 0.5, y / height + 0.5);
  }
  geometry.computeVertexNormals();
  return geometry;
}
export async function loadRobotron(displayTexture, onProgress = () => {}, onDetails = () => {}) {
  onProgress(0);
  const base = new URL(
    "models/robotron-1715m/",
    new URL(import.meta.env.BASE_URL, location.origin),
  );
  const response = await fetch(modelAsset("model.json", base), {
    cache: "no-cache",
  });
  if (!response.ok) throw Error(`Model manifest: ${response.status}`);
  const data = await response.json();
  const group = new THREE.Group();
  group.rotation.x = -Math.PI / 2;
  group.scale.setScalar(data.scale);
  const stl = new STLLoader(),
    loader = new THREE.TextureLoader();
  const textures = new Map(),
    objects = new Map(),
    keyObjects = new Map(),
    keyGeometry = new Map();
  const filenames = new Map(data.patches.map(p => [p.texture || `photos/${p.photo}`, p.textureSha256]));
  // Fixed denominator across all load phases: no resets when a new batch starts.
  const deferred = data.parts.filter(p => p.section === "monitor-interior" ||
    (p.section === "interior" && p.name.startsWith("keyboard-")));
  const deferredNames = new Set(deferred.map(p => p.name));
  const total = 2 + filenames.size + data.parts.length - deferred.length + data.keyMeshes.length;
  let completed = 1;
  const advance = () => onProgress(Math.min(99, Math.floor(++completed * 100 / total)));
  onProgress(Math.floor(completed * 100 / total));
  await Promise.all(
    [...filenames].map(async ([name, hash]) => {
      const texture = await loader.loadAsync(
        modelAsset(name, base, hash).href,
      );
      textures.set(name, texture);
      advance();
    }),
  );
  await Promise.all(
    data.parts.map(async (part) => {
      const lazy=deferredNames.has(part.name);
      const geometry = lazy ? new THREE.BufferGeometry() : toCreasedNormals(
        await stl.loadAsync(modelAsset(part.file, base, part.sha256).href), Math.PI / 4);

      const mesh = new THREE.Mesh(
        geometry,
        specimenMaterial(part.color, data.materials[part.material]),
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = part.name;
      mesh.userData.board = part.board;
      mesh.userData.detail = part.board || componentDetail(part.name);
      mesh.userData.interior = part.section === "interior";
      mesh.userData.monitorInterior = part.section === "monitor-interior";
      if (mesh.userData.interior || mesh.userData.monitorInterior)
        mesh.visible = false;
      mesh.userData.prototype = part.section === "prototype";
      if (mesh.userData.prototype) mesh.visible = false;
      group.add(mesh);
      mesh.userData.loaded=!lazy;
      objects.set(part.name, mesh);
      if(!lazy) advance();
    }),
  );
  await Promise.all(data.keyMeshes.map(async (part) => {
    const geometry = toCreasedNormals(
      await stl.loadAsync(modelAsset(part.file, base, part.sha256).href), Math.PI / 2.1);
    keyGeometry.set(part.name, geometry);
    advance();
  }));
  function photoPlane(
    name,
    width,
    height,
    uv,
    photo,
    radius = 0,
    options = {},
  ) {
    // Extract only the small marking into its own texture. Full owner photos
    // remain reference files, never whole-panel GPU skins.
    const source = textures.get(options.texture || `photos/${photo}`).image;
    uv = options.textureUv || uv;
    const x = Math.max(
      0,
      Math.floor(Math.min(...uv.map((p) => p[0])) * source.width) - 2,
    );
    const y = Math.max(
      0,
      Math.floor(Math.min(...uv.map((p) => p[1])) * source.height) - 2,
    );
    const right = Math.min(
      source.width,
      Math.ceil(Math.max(...uv.map((p) => p[0])) * source.width) + 2,
    );
    const bottom = Math.min(
      source.height,
      Math.ceil(Math.max(...uv.map((p) => p[1])) * source.height) + 2,
    );
    const cropWidth = right - x,
      cropHeight = bottom - y;
    const ratio = Math.min(1, 1024 / Math.max(cropWidth, cropHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(cropWidth * ratio));
    canvas.height = Math.max(1, Math.round(cropHeight * ratio));
    canvas
      .getContext("2d")
      .drawImage(
        source,
        x,
        y,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const geometry = surface(width, height, radius);
    geometry.setAttribute("surfaceUv", geometry.attributes.uv.clone());
    const coords = geometry.attributes.uv,
      positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const [u, v] = photoProjection(
        uv,
        positions.getX(i) / width + 0.5,
        0.5 - positions.getY(i) / height,
      );
      coords.setXY(
        i,
        (u * source.width - x) / cropWidth,
        1 - (v * source.height - y) / cropHeight,
      );
    }
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      transparent: !!(options.ink || options.feather),
      depthWrite: !(options.ink || options.feather),
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    if (options.feather) {
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\nvec2 edge=min(vMapUv,1.0-vMapUv); diffuseColor.a*=smoothstep(0.0,0.2,min(edge.x,edge.y));",
        );
      };
      material.customProgramCacheKey = () => "photo-wear-feather";
    }
    if (options.ink) {
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\nfloat ink=smoothstep(0.32,0.58,max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b)); diffuseColor=vec4(vec3(0.75),diffuseColor.a*ink);",
        );
      };
      material.customProgramCacheKey = () => "photo-wordmark";
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
  }
  for (const kind of ["pad", "solder"]) {
    const prototype = objects.get(`prototype-pcb-${kind}`);
    if (!prototype) continue;
    for (const board of ["motherboard", "floppy-controller"]) {
      const points = data.pcbComponents.footprints.filter(
        (p) => p[3] === board,
      );
      const mesh = new THREE.InstancedMesh(
        prototype.geometry,
        prototype.material,
        points.length,
      );
      const matrix = new THREE.Matrix4();
      points.forEach((p, i) =>
        mesh.setMatrixAt(i, matrix.makeTranslation(...p.slice(0, 3))),
      );
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
      mesh.name = `logic-${kind}-${board}`;
      mesh.userData = { interior: true, board, detail: board };
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.visible = false;
      group.add(mesh);
      objects.set(mesh.name, mesh);
    }
  }
  const pcbPhotos=[];
  let detailPromise;
  function loadDetails() {
    if(detailPromise)return detailPromise;
    onDetails("loading");
    detailPromise=Promise.all([loadPcbComponents(data,base),loadPcbPhotos(data,base),
      Promise.all(deferred.map(async part=>{
        const geometry=toCreasedNormals(await stl.loadAsync(modelAsset(part.file,base,part.sha256).href),Math.PI/4);
        const mesh=objects.get(part.name);mesh.geometry.dispose();mesh.geometry=geometry;mesh.userData.loaded=true;
      }))]).then(([packages,photos])=>{
      for(const mesh of packages){group.add(mesh);objects.set(mesh.name,mesh);}
      for(const mesh of photos){mesh.visible=false;group.add(mesh);pcbPhotos.push(mesh);}
      inspectionDirty=true;group.userData.newDetails=true;onDetails("ready");
    }).catch(error=>{onDetails("error");throw error;});
    return detailPromise;
  }
  function requestDetails(){loadDetails().catch(error=>console.error("Interior details unavailable",error));}
  const keyboard = new THREE.Group();
  keyboard.position.set(0, data.keyboard.y, data.keyboard.z);
  keyboard.rotation.x = THREE.MathUtils.degToRad(data.keyboard.slope);
  group.add(keyboard);
  const keyMaterials = [0x252a29, 0xffffff, 0xb82e35].map((color, i) =>
    specimenMaterial(color, data.materials[i === 1 ? "clear-key" : "key"]),
  );
  const insertMaterial = new THREE.MeshStandardMaterial({
    color: 0xa3a7a8, metalness: 0.75, roughness: 0.32,
  });
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0xdedecf, roughness: 0.48 });
  const atlas = legendAtlas(data.keys, data.keyboard.pitch);
  const legendMaterial = new THREE.MeshStandardMaterial({
    map: atlas.texture,
    transparent: true,
    depthWrite: false,
    roughness: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  for (const [index, key] of data.keys.entries()) {
    const cap = new THREE.Group();
    cap.position.set(key.x, key.y, 0);
    cap.userData.key = key;
    const body = new THREE.Mesh(
      keyGeometry.get(key.mesh),
      keyMaterials[key.style],
    );
    body.userData.key = key;
    body.receiveShadow = true;
    body.name = key.style === 1 ? "clear-key-shell" : "opaque-key-cap";
    cap.add(body);
    if (key.coreMesh) {
      const core = new THREE.Mesh(keyGeometry.get(key.coreMesh), coreMaterial);
      core.name = "keycap-pale-core";
      core.userData.key = key;
      core.receiveShadow = true;
      core.visible = false;
      cap.add(core);
    }
    if (key.insertMesh) {
      const insert = new THREE.Mesh(keyGeometry.get(key.insertMesh), insertMaterial);
      insert.name = "silver-key-inlay";
      insert.userData.key = key;
      cap.add(insert);
    }
    // A small transparent legend follows the actual OpenSCAD dish surface:
    // New opaque caps use the shallow R132 dish at 11.4 mm; legacy clear/red
    // profiles retain R60. Clear-key ink
    // sits on the silver liner, beneath the transparent shell.
    const { width: w, height: h } = legendLayout(key, data.keyboard.pitch);
    const faceGeometry = surface(w, h);
    const p = faceGeometry.attributes.position,
      uv = faceGeometry.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x =
          p.getX(i) / Math.max(1, (key.topWidth || key.width * data.keyboard.pitch - 5.2) / 16),
        y =
          p.getY(i) /
          Math.max(1, (key.height * data.keyboard.pitch - 5.2) / 16);
      const sag = Math.sqrt(60 * 60 - x * x - y * y);
      if (key.style === 0) {
        const dx = p.getX(i) / ((key.topWidth || key.width * data.keyboard.pitch - 5.2) / 13.8);
        const dy = p.getY(i) / ((key.height * data.keyboard.pitch - 5.2) / 13.8);
        p.setZ(i, Math.min(11.4, 143.22 - Math.sqrt(132 * 132 - dx * dx - dy * dy)) + 0.04);
      } else p.setZ(i, key.style === 1 ? Math.min(8.9, 68.2 - sag) + 0.04 : Math.min(9.5, 69 - sag) + 0.09);
      uv.setXY(
        i,
        ((index % atlas.columns) + uv.getX(i)) / atlas.columns,
        1 - (Math.floor(index / atlas.columns) + 1 - uv.getY(i)) / atlas.rows,
      );
    }
    faceGeometry.computeVertexNormals();
    const face = new THREE.Mesh(faceGeometry, legendMaterial);
    face.name = key.id;
    face.userData.key = key;
    cap.add(face);
    keyboard.add(cap);
    keyObjects.set(key.id, cap);
  }
  const mechanism = new THREE.Group();
  mechanism.position.set(0, data.keyboard.y, data.keyboard.z);
  mechanism.rotation.x = keyboard.rotation.x;
  group.add(mechanism);
  const mechanisms = ["spring", "stem", "rubber"].map((name) => {
    const source = objects.get(data.keyboardMechanism[name]);
    const mesh = new THREE.InstancedMesh(
      source.geometry,
      source.material,
      data.keys.length,
    );
    mesh.name = `keyboard-${name}s`;
    mesh.userData.detail = "component-keyboard";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Matrices change on keypress and separation; avoid a stale bounding sphere.
    mesh.frustumCulled = false;
    mechanism.add(mesh);
    return mesh;
  });
  const instance = new THREE.Object3D();
  const cableRest = new Map();
  for (const [name, mesh] of objects) {
    if (name.startsWith("ribbon-") || name.startsWith("power-wires"))
      cableRest.set(name, mesh.geometry.attributes.position.array.slice());
  }
  const monitorCableRest = new Map(
    ["monitor-power-lead", "monitor-signal-lead"].map(name =>
      [name, objects.get(name).geometry.attributes.position.array.slice()]),
  );
  let monitorCablePose = "";
  let inspection = {
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
  };
  let inspectionDirty = true;
  let fineDetails = true;
  let highlightedFocus,
    demoClock = 0,
    demoLast;
  function belongs(name, wanted) {
    if (wanted === "keyboard") return /^(keyboard|keys-|prototype-)/.test(name);
    if (wanted === "drives")
      return name === "drives" || name.startsWith("drive-");
    if (["motherboard", "floppy-controller"].includes(wanted))
      return name.endsWith("-" + wanted);
    if (wanted === "logic")
      return /^(logic-|reference-(motherboard|floppy))/.test(name);
    if (wanted === "monitor")
      return /^(monitor-|tube-|crt-|bezel|pedestal|ring|reference-monitor)/.test(
        name,
      );
    return /^(psu-|fan-)/.test(name);
  }
  const covers = new Set([
    "case-lid",
    "fascia",
    "monitor-shell-upper",
    "monitor-shell-lower",
    "keyboard-shell",
    "keyboard-deck",
  ]);
  for (const u of [0,1]) for (const name of [`drive-latch-${u}`,`drive-latch-trim-${u}`])
    if (objects.has(name)) objects.get(name).userData.driveUnit = u;
  const patches = [];
  for (const p of data.patches) {
    const mesh = photoPlane(p.name, ...p.size, p.uv, p.photo, 0, p);
    mesh.position.set(...p.position);
    mesh.rotation.set(...p.rotation.map(THREE.MathUtils.degToRad));
    mesh.userData.rest = mesh.position.clone();
    mesh.userData.assembly = p.assembly;
    mesh.userData.disketteUnit = p.disketteUnit;
    mesh.userData.detail =
      p.name.includes("robotron") || p.name === "drive-label-country"
        ? "plate-robotron"
        : p.name.includes("ratan")
          ? "plate-ratan"
          : p.name.includes("2064")
            ? "board-2064"
            : p.name.includes("2092")
              ? "board-2092"
              : undefined;
    if (p.disketteUnit !== undefined) mesh.userData.detail = "diskette";
    mesh.visible = p.section !== "interior";
    group.add(mesh);
    patches.push(mesh);
  }
  for (const texture of textures.values()) texture.dispose();
  textures.clear();
  const display = objects.get("crt-glass");
  display.geometry.dispose();
  display.material.dispose();
  display.geometry = crtGeometry(data.screen);
  display.geometry.rotateX(Math.PI / 2);
  display.geometry.translate(...data.screen.position);
  display.material = crtMaterial(displayTexture);
  const lampMaterials = [0, 1].map(
    (u) => objects.get(`drive-led-${u}`).material,
  );
  function marking(name, size, position, texture) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(...size),
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        roughness: 0.85,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    mesh.name = name;
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(...position);
    group.add(mesh);
    return mesh;
  }
  if (data.rearMarkings) {
    // The CAD keeps editable outline geometry. The browser uses the very same
    // text/coordinates in a mipmapped decal so subpixel strokes stay readable.
    const mesh = objects.get("rear-legends");
    const texture = markingTexture((c, w, h) => {
      c.scale(w / 500, h / 130);
      c.strokeStyle = "#57564c";
      c.lineWidth = 0.16;
      c.lineJoin = "round";
      c.textAlign = "center";
      c.textBaseline = "alphabetic";
      for (const mark of data.rearMarkings) {
        c.font = `${mark.size * 1.35}px Arial, sans-serif`;
        c.strokeText(mark.text, 250 - mark.x, 130 - mark.z);
      }
    }, 4096, 1064);
    texture.anisotropy = 8;
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh.geometry = new THREE.PlaneGeometry(500, 130);
    mesh.geometry.rotateY(Math.PI);
    mesh.geometry.rotateX(Math.PI / 2);
    mesh.geometry.translate(0, 198.27, 65);
    mesh.material = new THREE.MeshStandardMaterial({ map: texture,
      transparent: true, depthWrite: false, roughness: 0.86,
      polygonOffset: true, polygonOffsetFactor: -1 });
    mesh.castShadow = false;
  }
  if (data.driveLabels?.reconstructedText) {
    const p = data.driveLabels.reconstructedText;
    const mesh = marking(
      p.name,
      p.size,
      p.position,
      markingTexture(
        (c, w, h) => {
          c.fillStyle = "#24251f";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.font = "bold 74px Arial";
          c.fillText(p.text, w / 2, h / 2, w - 12);
        },
        1024,
        144,
      ),
    );
    mesh.rotation.set(...p.rotation.map(THREE.MathUtils.degToRad));
    mesh.userData.rest = mesh.position.clone();
    mesh.userData.assembly = p.assembly;
    mesh.userData.disketteUnit = p.disketteUnit;
    mesh.userData.detail =
      p.name.includes("robotron") || p.name === "drive-label-country"
        ? "plate-robotron"
        : p.name.includes("ratan")
          ? "plate-ratan"
          : p.name.includes("2064")
            ? "board-2064"
            : p.name.includes("2092")
              ? "board-2092"
              : undefined;
    mesh.visible = false;
    patches.push(mesh);
  }
  const arrow = markingTexture((c) => {
    c.lineWidth = 9;
    c.lineCap = "round";
    c.beginPath();
    c.arc(98, 25, 66, 0.1, Math.PI / 2);
    c.stroke();
    c.beginPath();
    c.moveTo(165, 14);
    c.lineTo(145, 36);
    c.lineTo(177, 37);
    c.closePath();
    c.fill();
  });
  for (const x of [-158, -4])
    marking("drive-direction", [21, 16], [x + 43, -208.6, 72], arrow);
  for (const [name, x, text] of [
    ["reset-label", -208, "RESET"],
    ["power-label", 207, "POWER"],
  ]) {
    marking(
      name,
      [name === "reset-label" ? 14 : 22, name === "reset-label" ? 3.2 : 4.3],
      [x, -200.05, 4.8],
      markingTexture(
        (c, w, h) => {
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.font = "500 74px Arial";
          c.fillText(text, w / 2, h / 2, w - 4);
        },
        512,
        128,
      ),
    );
  }
  const indicatorMaterials = [0, 1].map(() => new THREE.MeshStandardMaterial({
    color: 0x89621d, roughness: 0.3, emissiveIntensity: 2.5,
  }));
  let keyboardIndicators = { caps: false, siso: false };
  function updateIndicators() {
    for (const [i, name] of ["caps", "siso"].entries())
      indicatorMaterials[i].emissive.set(power && keyboardIndicators[name] ? 0xff9c16 : 0);
  }
  // Fixed indicator carriers belong to the deck, not the moving keycaps.
  for (const [x, y, material, name] of [
    [-225.25, -16, indicatorMaterials[0], "keyboard-caps-lamp"],
    [69.25, 22, indicatorMaterials[1], "keyboard-si-so-lamp"],
  ]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 8), material);
    lamp.name = name;
    lamp.position.set(x, y, 3.5).applyAxisAngle(new THREE.Vector3(1, 0, 0), keyboard.rotation.x);
    lamp.position.add(new THREE.Vector3(0, data.keyboard.y, data.keyboard.z));
    objects.get("keyboard-fillers").add(lamp);
  }
  let power = false,
    activityUntil = 0,
    split = 0,
    splitTarget = 0,
    inside = false,
    wasInside = false,
    monitorOpen = false,
    wasMonitorOpen = false;
  let driveStates = [0, 0],
    driveMechanics = null,
    drivesDirty = false;
  const dropHighlight=new THREE.Mesh(new THREE.PlaneGeometry(146,46),new THREE.MeshBasicMaterial({transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));
  dropHighlight.rotation.x=Math.PI/2;dropHighlight.visible=false;
  let driveAvailable = null, mediaLabels=[];
  const diskTags = [0,1].map(unit => {
    const canvas = document.createElement("canvas"); canvas.width=128; canvas.height=48;
    const c=canvas.getContext("2d"); c.fillStyle="#182624"; c.fillRect(0,0,128,48);
    c.fillStyle="#ffffff"; c.font="bold 28px sans-serif"; c.textAlign="center"; c.fillText(`Disk ${unit+1}`,64,34);
    const tag=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));
    tag.scale.set(70,26,1); tag.position.set(330+unit*145,-175,8); group.add(tag); tag.userData.context=c; return tag;
  });
  const moveDrives = createDriveMotion(objects, data.driveMotion);
  const moveFan = createFanMotion(objects.get("fan-rotor"));
  const pressed = new Set();
  function releaseKeys() {
    pressed.clear();
    for (const key of keyObjects.values()) key.userData.pulseUntil = 0;
  }
  function keyState(id, down) {
    if (down) pressed.add(id);
    else pressed.delete(id);
  }
  function tick() {
    const now = performance.now();
    const demoDt =
      demoLast === undefined ? 0 : Math.min(0.05, (now - demoLast) / 1000);
    demoLast = now;
    if (highlightedFocus !== inspection.focus) {
      highlightedFocus = inspection.focus;
      for (const mesh of [...objects.values(), ...pcbPhotos]) {
        const name = mesh.name,
          focus = inspection.focus;
        const selected =
          focus === "head"
            ? name.startsWith("drive-head-")
            : focus === "spindle"
              ? name.startsWith("drive-spindle-")
              : focus === "clamp"
                ? name.startsWith("drive-clamp-") ||
                  name.startsWith("drive-latch-")
                : focus !== "none" && mesh.userData.board === focus;
        if (mesh.userData.baseMaterial) {
          mesh.material.dispose();
          mesh.material = mesh.userData.baseMaterial;
          delete mesh.userData.baseMaterial;
        }
        mesh.userData.highlighted = !!selected;
        if (selected && mesh.material?.emissive) {
          const base = mesh.material;
          mesh.userData.baseMaterial = base;
          mesh.material = base.clone();
          mesh.material.onBeforeCompile = base.onBeforeCompile;
          mesh.material.customProgramCacheKey = base.customProgramCacheKey;
          mesh.material.emissive.setHex(0xb87718);
          mesh.material.emissiveIntensity = 0.55;
        }
      }
    }
    let dirty =
      inside !== wasInside ||
      monitorOpen !== wasMonitorOpen ||
      drivesDirty ||
      inspectionDirty;
    inspectionDirty = false;
    drivesDirty = false;
    const changedInside = dirty;
    wasInside = inside;
    wasMonitorOpen = monitorOpen;
    for (const mesh of objects.values())
      if (
        !mesh.userData.interior &&
        !mesh.userData.monitorInterior &&
        !mesh.userData.prototype
      )
        mesh.visible = true;
    for (const mesh of objects.values())
      if (mesh.userData.interior)
        mesh.visible =
          inside ||
          split > 0.01 ||
          inspection.transparent ||
          inspection.isolated !== "all" ||
          (inspection.keyboardOpen && mesh.name.startsWith("keyboard-")) ||
          ["psu-chassis", "keyboard-plate", "keyboard-switches"].includes(mesh.name);
    for (const mesh of objects.values())
      if (mesh.userData.monitorInterior) {
        mesh.visible =
          monitorOpen ||
          inspection.transparent ||
          inspection.isolated === "monitor";
        mesh.position.set(0, inside ? 400 : 0, inside ? 180 : 0);
      }
    for (const mesh of pcbPhotos) {
      if (mesh.userData.artwork) {
        const source = inspection.referencePhoto
          ? mesh.userData.original
          : mesh.userData.artwork;
        if (mesh.material.map !== source.texture) {
          mesh.geometry = source.geometry;
          mesh.material.map = source.texture;
          mesh.material.transparent = !inspection.referencePhoto;
          mesh.material.alphaTest = inspection.referencePhoto ? 0 : 0.08;
          mesh.material.needsUpdate = true;
        }
        for (const child of mesh.children)
          child.visible = !inspection.referencePhoto;
      }
      const monitor = mesh.userData.section === "monitor-interior";
      mesh.visible = monitor
        ? monitorOpen ||
          inspection.transparent ||
          inspection.isolated === "monitor"
        : inside ||
          split > 0.01 ||
          inspection.transparent ||
          ["logic", "motherboard", "floppy-controller"].includes(
            inspection.isolated,
          );
      if (monitor) mesh.position.set(0, inside ? 400 : 0, inside ? 180 : 0);
    }
    const beforeSplit = split;
    for (const [id, key] of keyObjects) {
      const z =
        pressed.has(id) || performance.now() < (key.userData.pulseUntil || 0)
          ? -2.2
          : 0;
      if (key.position.z !== z) {
        key.position.z = z;
        dirty = true;
      }
    }
    for (const [u, material] of lampMaterials.entries()) {
      const before = material.emissive.getHex();
      material.emissive.set(
        power &&
          (driveStates[u] & 2 ||
            (u === 0 &&
              !(driveStates[1] & 2) &&
              performance.now() < activityUntil))
          ? 0xff2404
          : 0,
      );
      dirty ||= before !== material.emissive.getHex();
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const demoActive = inspection.demo && inspection.isolated === "drives";
    const demoAnimate =
      demoActive && inspection.demoAnimate && !reduced && !document.hidden;
    if (demoAnimate) demoClock += demoDt / 12;
    const fanMoved = moveFan(
      performance.now(),
      power,
      objects.get("fan-rotor").visible &&
        ["all", "psu"].includes(inspection.isolated),
      reduced,
    );
    dirty = fanMoved || dirty;
    split = reduced
      ? splitTarget
      : THREE.MathUtils.lerp(split, splitTarget, 0.15);
    if (Math.abs(split - splitTarget) < 0.001) split = splitTarget;
    const monitor = [
      "monitor-shell-lower",
      "monitor-joint-lip",
      "monitor-shell-upper",
      "bezel",
      "crt-rim",
      "crt-glass",
      "pedestal",
      "ring",
      "monitor-tape",
      "monitor-under-controls",
      "monitor-stand-metal",
    ];
    for (const name of monitor) {
      objects.get(name).position.set(0, inside ? 400 : 0, inside ? 180 : 0);
      objects.get(name).visible = true;
    }
    if (monitorOpen) {
      objects.get("monitor-shell-upper").position.z += 155;
      objects.get("monitor-shell-upper").position.y -= 210;
      objects.get("monitor-tape").position.z += 155;
      objects.get("monitor-tape").position.y -= 210;
    }
    // Captive ends follow the monitor; rear plugs stay with the system unit.
    // Exploded-view extension is illustrative, not a cable-length measurement.
    const monitorPlugPark = inspection.disconnectCables && (inside || split > 0.01) ? 24 : 0;
    const cablePose = `${inside}:${monitorPlugPark}`;
    if (cablePose !== monitorCablePose) {
      monitorCablePose = cablePose;
      for (const [name, rest] of monitorCableRest) {
        const mesh = objects.get(name), vertices = mesh.geometry.attributes.position;
        for (let i = 0; i < vertices.count; i++) {
          const z = rest[i * 3 + 2];
          const t = THREE.MathUtils.clamp((z - 100) / 60, 0, 1);
          const w = t * t * (3 - 2 * t);
          vertices.setXYZ(i, rest[i * 3], rest[i * 3 + 1] + (inside ? 400 * w : 0) + monitorPlugPark * (1 - w), z + (inside ? 180 * w : 0));
        }
        vertices.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        mesh.geometry.computeBoundingBox();
        mesh.geometry.computeBoundingSphere();
      }
      for (const name of ["monitor-plug-bodies", "monitor-plug-metal", "monitor-plug-collars"])
        objects.get(name).position.y = monitorPlugPark;
      dirty = true;
    }
    objects.get("case-lid").visible = true;
    objects.get("case-lid").position.set(0, inside ? 400 : 0, inside ? 180 : 0);
    for (const [name, mesh] of objects) {
      if (name === "drives" || name.startsWith("drive-")) {
        mesh.position.z = split * 115;
        mesh.position.y = -split * 145;
      }
      if (name === "drive-cable-plugs" && inspection.disconnectCables)
        mesh.position.set(0, split * (data.cableParking?.[1] || 18), 0);
      if (cableRest.has(name)) {
        mesh.visible = inside || inspection.transparent;
        // Inspection deformation: retain fixed board/PSU ends while moving drive ends.
        // This is an explanatory extension, not a claim about available cable slack.
        const rest = cableRest.get(name),
          pos = mesh.geometry.attributes.position;
        if (beforeSplit !== split || changedInside) {
          for (let i = 0; i < pos.count; i++) {
            const weight = name.startsWith("ribbon-")
              ? THREE.MathUtils.clamp((40 - rest[i * 3 + 1]) / 20, 0, 1) *
                THREE.MathUtils.clamp((rest[i * 3 + 2] - 53) / 13, 0, 1)
              : THREE.MathUtils.clamp((-30 - rest[i * 3]) / 23, 0, 1);
            pos.setXYZ(
              i,
              rest[i * 3],
              rest[i * 3 + 1] +
                split *
                  (inspection.disconnectCables
                    ? data.cableParking?.[1] || 18
                    : -145) *
                  weight,
              rest[i * 3 + 2] +
                (inspection.disconnectCables ? 0 : split * 115 * weight),
            );
          }
          pos.needsUpdate = true;
          mesh.geometry.computeVertexNormals();
          mesh.geometry.computeBoundingSphere();
        }
      }
    }
    for (const mesh of group.children)
      if (mesh.name === "drive-direction") {
        if (!mesh.userData.rest) mesh.userData.rest = mesh.position.clone();
        mesh.position.copy(mesh.userData.rest);
        mesh.position.y -= split * 145;
        mesh.position.z += split * 115;
      }
    objects.get("fascia").position.y = -split * 40;
    const keyboardLift = Math.max(split, inspection.keyboardOpen ? 1 : 0);
    objects.get("keyboard-entry-wires").visible &&= keyboardLift === 0;
    // Detach the narrow controller as a unit so both boards can be inspected.
    for (const [name, mesh] of objects) {
      if (name.startsWith("keyboard-controller-") || name === "keyboard-entry-choke")
        mesh.position.set(0, keyboardLift * 160, keyboardLift * 70);
    }
    objects
      .get("keyboard-deck")
      .position.set(0, keyboardLift * 110, keyboardLift * 55);
    objects
      .get("keyboard-fillers")
      .position.set(0, keyboardLift * 110, keyboardLift * 55);
    objects.get("keyboard-plate").position.set(0, -keyboardLift * 155, keyboardLift * 55);
    objects.get("keyboard-switches").position.set(0, -keyboardLift * 155, keyboardLift * 55);
    objects.get("keyboard-guides").position.set(0, -keyboardLift * 155, keyboardLift * 55);
    // Keep the contact face up; orbit underneath to inspect the solder buses.
    const boardAngle = 0;
    for (const name of ["keyboard-pcb", "keyboard-matrix-artwork", "keyboard-pcb-metal", "keyboard-insulators", "keyboard-contact-pads", "keyboard-pcb-supports", "keyboard-pcb-fasteners", "keyboard-contact-routes"]) {
      const mesh = objects.get(name);
      mesh.rotation.x = boardAngle;
      mesh.position.set(0,
        data.keyboard.y * (1 - Math.cos(boardAngle)) + 13 * Math.sin(boardAngle),
        keyboardLift * 22 + 13 * (1 - Math.cos(boardAngle)) - data.keyboard.y * Math.sin(boardAngle));
    }
    objects.get("cable").visible = true;
    keyboard.position.set(0, data.keyboard.y + keyboardLift * 110, data.keyboard.z + keyboardLift * 110);
    mechanism.position.set(0, data.keyboard.y - keyboardLift * 155, data.keyboard.z + keyboardLift * 55);
    mechanism.visible =
      inside ||
      keyboardLift > 0 ||
      inspection.transparent ||
      inspection.isolated === "keyboard";
    // Instance transforms only change on input or disassembly, not every idle frame.
    if (dirty || beforeSplit !== split) {
      for (const [i, key] of data.keys.entries()) {
        const down = keyObjects.get(key.id).position.z;
        instance.rotation.set(0, 0, 0);
        const { installedHeight, freeHeight, springBase } = data.keyboardMechanism;
        instance.position.set(key.x, key.y, springBase);
        instance.scale.set(1, 1, (installedHeight + down + keyboardLift * (freeHeight - installedHeight)) / installedHeight);
        instance.updateMatrix();
        mechanisms[0].setMatrixAt(i, instance.matrix);
        instance.position.set(key.x, key.y, down + keyboardLift * 28);
        instance.scale.set(1, 1, 1);
        instance.updateMatrix();
        mechanisms[1].setMatrixAt(i, instance.matrix);
        mechanisms[2].setMatrixAt(i, instance.matrix);
      }
      for (const mesh of mechanisms) mesh.instanceMatrix.needsUpdate = true;
    }
    for (const mesh of patches) {
      mesh.position.copy(mesh.userData.rest);
      mesh.visible = true;
      if (mesh.name === "brand") mesh.position.y -= split * 40;
      if (mesh.userData.assembly === "drives") {
        mesh.visible =
          inside ||
          split > 0.01 ||
          inspection.transparent ||
          inspection.isolated === "drives";
        mesh.position.y -= split * 145;
        mesh.position.z += split * 115;
      }
      if (mesh.userData.disketteUnit !== undefined)
        mesh.visible &&= !!(driveStates[mesh.userData.disketteUnit] & 8);
    }
    for (const d of data.driveMotion)
      objects.get(d.spindle).visible &&= ["all", "drives"].includes(
        inspection.isolated,
      );
    diskTags.forEach((tag,u) => { tag.visible = !!driveAvailable?.[u] && !(driveStates[u]&8) && inspection.isolated === "all"; });
    const drivesMoved = moveDrives(
      performance.now(),
      driveStates,
      power,
      split,
      reduced,
      inspection.clamps,
      demoActive
        ? { phase: inspection.demoPhase + demoClock, animate: demoAnimate }
        : null,
      driveMechanics,
      driveAvailable,
      mediaLabels.map((label,u)=>label === "Disk 1"?0:label === "Disk 2"?1:u),
    );
    for (const mesh of patches) if (mesh.userData.disketteUnit !== undefined) {
      const jacket = objects.get(`drive-diskette-${mesh.userData.disketteUnit}`);
      mesh.position.copy(mesh.userData.rest).add(jacket.position);
      mesh.visible = jacket.visible;
      mesh.userData.removedDisk = jacket.userData.removedDisk;
    }
    for(const u of [0,1]) {
      const tab=objects.get(`drive-protect-tab-${u}`),jacket=objects.get(`drive-diskette-${u}`);
      if(tab){tab.position.copy(jacket.position);tab.visible=jacket.visible;tab.material.transparent=true;tab.material.opacity=(driveStates[u]&4)?0:1;tab.material.depthWrite=!(driveStates[u]&4);tab.castShadow=!(driveStates[u]&4);tab.userData.protectUnit=jacket.userData.removedDisk;}
    }
    for (const mesh of [...objects.values(), ...pcbPhotos, ...patches]) {
      if (inspection.isolated !== "all")
        mesh.visible &&= belongs(mesh.name, inspection.isolated);
      if (
        inspection.referencePhoto &&
        mesh.userData.board &&
        !mesh.name.startsWith("reference-") &&
        !mesh.name.startsWith("logic-boards-")
      )
        mesh.visible = false;
      if (
        !fineDetails &&
        /^(logic-pad-|logic-solder-|logic-connector-contacts-|logic-package-.*-leads-|ribbon-ridges)/.test(
          mesh.name,
        )
      )
        mesh.visible = false;
      if (covers.has(mesh.name)) {
        mesh.material.transparent = inspection.transparent;
        mesh.material.opacity = inspection.transparent ? 0.16 : 1;
        mesh.material.depthWrite = !inspection.transparent;
        mesh.castShadow = !inspection.transparent;
      }
    }
    keyboard.visible =
      inspection.isolated === "all" || inspection.isolated === "keyboard";
    mechanism.visible &&= keyboard.visible;
    // Pale cores are enclosed by the opaque caps and keyboard shell at rest.
    // Avoid an extra draw per key until disassembly exposes their undersides.
    for (const key of keyObjects.values()) {
      const core = key.getObjectByName("keycap-pale-core");
      if (core) core.visible = keyboardLift > 0 || inspection.transparent;
    }
    for (const mesh of group.children) {
      if (mesh.name === "drive-direction")
        mesh.visible =
          inspection.isolated === "all" || inspection.isolated === "drives";
      if (["reset-label", "power-label"].includes(mesh.name))
        mesh.visible = inspection.isolated === "all";
    }
    const newDetails=!!group.userData.newDetails;group.userData.newDetails=false;
    return {
      dirty: newDetails || dirty || beforeSplit !== split || drivesMoved,
      shadows:
        newDetails || changedInside || beforeSplit !== split || fanMoved || drivesMoved,
    };
  }
  onProgress(100);
  return {
    group,
    annotations: data.annotations || [],
    loadDetails,
    detailDistance(distance) {
      const next = distance < (fineDetails ? 2.0 : 1.7);
      if (next !== fineDetails) {
        fineDetails = next;
        inspectionDirty = true;
      }
    },
    inspect(value) {
      if(value.keyboardOpen || value.transparent || value.referencePhoto || ["keyboard","monitor","logic","motherboard","floppy-controller"].includes(value.isolated) || ["motherboard","floppy-controller"].includes(value.focus)) requestDetails();
      if (
        (value.demoPhase !== undefined &&
          value.demoPhase !== inspection.demoPhase) ||
        (value.demo !== undefined && value.demo !== inspection.demo)
      )
        demoClock = 0;
      inspection = { ...inspection, ...value };
      inspectionDirty = true;
      releaseKeys();
    },
    diskDragCopy(unit) {
      const copy=new THREE.Group();
      copy.rotation.copy(group.rotation); copy.scale.copy(group.scale);
      for(const source of [objects.get(`drive-diskette-${unit}`),objects.get(`drive-medium-${unit}`),objects.get(`drive-diskette-label-${unit}`),objects.get(`drive-protect-tab-${unit}`),...patches.filter(p=>p.userData.disketteUnit===unit)]) {
        const mesh=source.clone();mesh.visible=true;mesh.userData={};copy.add(mesh);
      }
      return copy;
    },
    diskDropHighlight(unit, allowed=false) {
      if(!dropHighlight.parent) group.add(dropHighlight);
      dropHighlight.visible=unit!==null;
      if(unit!==null){dropHighlight.position.set([-158,-4][unit],-215-split*145,80+split*115);dropHighlight.material.color.set(allowed?0x6cf3ac:0xf77b65);}
    },
    diskDropTarget(ray) {
      const local = ray.clone().applyMatrix4(group.matrixWorld.clone().invert());
      const target = local.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0), 213 + split*145), new THREE.Vector3());
      if(!target || target.z < 55+split*115 || target.z >108+split*115) return null;
      for(const unit of [0,1]) if(target.x >= [-231,-77][unit] && target.x <= [-231,-77][unit]+146) return unit;
      return null;
    },
    objects,
    keys: data.keys,
    keyObjects,
    keyState,
    releaseKeys,
    tick,
    pulse(id) {
      const key = keyObjects.get(id);
      if (key) key.userData.pulseUntil = performance.now() + 140;
    },
    power(on) {
      power = on;
      if (!on) {
        activityUntil = 0;
        releaseKeys();
      }
      updateIndicators();
      objects.get("power").material.emissive.set(on ? 0x152417 : 0);
    },
    media(present) {
      driveStates = [0, 1].map(u => (driveStates[u] & ~8) | (present[u] ? 8 : 0));
      drivesDirty = true;
    },
    drives(states, mechanics = null, available = null, labels = []) {
      for(const [u,label] of labels.entries()) if(label!==mediaLabels[u]){
        const tag=diskTags[u],c=tag.userData.context;c.fillStyle="#182624";c.fillRect(0,0,128,48);c.fillStyle="white";c.fillText(label,64,34);tag.material.map.needsUpdate=true;tag.position.x=330+(label === "Disk 1"?0:label === "Disk 2"?1:u)*145;drivesDirty=true;
      }
      mediaLabels=labels.slice();
      drivesDirty ||= JSON.stringify(available) !== JSON.stringify(driveAvailable);
      driveAvailable = available;
      drivesDirty ||=
        states.some((s, u) => s !== driveStates[u]) ||
        (mechanics || []).some(
          (d, u) =>
            d.position !== driveMechanics?.[u]?.position ||
            d.headLoad !== driveMechanics?.[u]?.headLoad,
        ) ||
        (!matchMedia("(prefers-reduced-motion: reduce)").matches &&
          (mechanics || []).some(
            (d, u) =>
              objects.get(data.driveMotion[u].spindle).visible &&
              d.phase !== driveMechanics?.[u]?.phase,
          ));
      driveStates = states;
      driveMechanics = mechanics;
    },
    activity(active) {
      if (active && power) activityUntil = performance.now() + 140;
    },
    modifiers(state) {
      keyboardIndicators = { caps: !!state.caps, siso: !!state.siso };
      updateIndicators();
    },
    openMonitor(value) {
      if(value) requestDetails();
      monitorOpen = value;
      releaseKeys();
    },
    interior(value) {
      if(value) requestDetails();
      inside = value;
      releaseKeys();
    },
    separate(value) {
      if(value) requestDetails();
      splitTarget = value ? 1 : 0;
      releaseKeys();
    },
  };
}
