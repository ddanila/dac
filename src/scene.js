import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { loadRobotron } from "./robotron-model.js";
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
  let caseOpen = false;
  let assembliesLifted = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.append(renderer.domElement);
  const studio = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio, 0.04).texture;
  scene.environmentIntensity = 0.35;
  studio.dispose();
  pmrem.dispose();
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.addEventListener("change", () => {
    renderRequested = true;
  });
  controls.minDistance = 0.35;
  controls.maxDistance = 5;
  controls.maxPolarAngle = Math.PI;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xe9eef5, 0x68716d, 1.2));
  const light = new THREE.DirectionalLight(0xfff4e8, 3);
  light.position.set(-2, 4, 3);
  light.castShadow = true;
  light.shadow.bias = -0.0001;
  light.shadow.normalBias = 0.001;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = light.shadow.camera.bottom = -1.8;
  light.shadow.camera.right = light.shadow.camera.top = 1.8;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 10;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene.add(light);
  const inspectionLight = new THREE.DirectionalLight(0xe4eeff, 1.4);
  inspectionLight.position.set(1, -2, 2);
  scene.add(inspectionLight);
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
  const texture = new THREE.CanvasTexture(screen);
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
  let modifiers = {};
  function visibility() {
    renderRequested = true;
    renderer.shadowMap.needsUpdate = true;
    machine.visible = kind !== 2 || !robotron;
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
  loadRobotron(texture)
    .then((model) => {
      robotron = model;
      scene.add(model.group);
      model.power(powered);
      interaction.onKeysReady?.(model.keys);
      visibility();
    })
    .catch((error) => {
      console.error("Robotron model failed to load", error);
      modelError = true;
      visibility();
    });
  const ray = new THREE.Raycaster(),
    point = new THREE.Vector2();
  let down;
  function hitAt(e) {
    const r = renderer.domElement.getBoundingClientRect();
    point.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    // Picking must not depend on whether an on-demand render has happened yet.
    camera.updateMatrixWorld();
    machine.updateWorldMatrix(true, true);
    robotron?.group.updateWorldMatrix(true, true);
    ray.setFromCamera(point, camera);
    return kind === 2 && robotron
      ? ray.intersectObject(robotron.group, true).find((hit) => {
          for (let node = hit.object; node; node = node.parent)
            if (!node.visible) return false;
          return true;
        })?.object
      : ray.intersectObject(power)[0]?.object;
  }
  function cancelGesture() {
    if (down?.key)
      robotron?.keyState(down.key.id, !!modifiers[down.key.input.modifier]);
    down = undefined;
  }
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) {
      cancelGesture();
      return;
    }
    const hit = hitAt(e);
    down = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      key: hit?.userData.key,
      object: hit,
      dragged: false,
    };
    if (down.key && powered) robotron.keyState(down.key.id, true);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) {
      down.dragged = true;
      if (down.key) robotron?.keyState(down.key.id, false);
    }
    if (down) return;
    const hit = hitAt(e),
      key = hit?.userData.key;
    renderer.domElement.style.cursor =
      hit &&
      (key ||
        hit === robotron?.objects.get("power") ||
        hit === robotron?.objects.get("reset"))
        ? "pointer"
        : "grab";
    interaction.onHover?.(
      key
        ? `${key.label}${key.input.unsupported ? " · mapping unverified" : ""}`
        : "",
    );
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || down.id !== e.pointerId) return;
    const gesture = down,
      hit = hitAt(e);
    cancelGesture();
    if (
      gesture.dragged ||
      Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 5
    )
      return;
    container.focus({ preventScroll: true });
    if (!hit) return;
    if (gesture.key && hit?.userData.key?.id === gesture.key.id) {
      if (interaction.onKey?.(gesture.key)) robotron.pulse(gesture.key.id);
    } else if (hit === robotron?.objects.get("power") || hit === power)
      onPower();
    else if (hit === robotron?.objects.get("reset")) onReset?.();
  });
  renderer.domElement.addEventListener("pointercancel", cancelGesture);
  renderer.domElement.addEventListener("lostpointercapture", cancelGesture);
  renderer.domElement.addEventListener("pointerleave", () =>
    interaction.onHover?.(""),
  );
  window.addEventListener("blur", cancelGesture);
  const observer = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    camera.aspect = width / height;
    camera.zoom = width < 500 ? 0.56 : 1;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderRequested = true;
  });
  observer.observe(container);
  renderer.setAnimationLoop(() => {
    controls.update();
    const changed = robotron?.tick();
    if (changed?.shadows) renderer.shadowMap.needsUpdate = true;
    if (renderRequested || changed?.dirty) {
      renderer.render(scene, camera);
      renderRequested = false;
    }
  });
  return {
    activity: (active) => robotron?.activity(active),
    modifiers: (state) => {
      modifiers = state;
      renderRequested = true;
      robotron?.modifiers(state);
      for (const key of robotron?.keys || [])
        if (key.input.modifier)
          robotron.keyState(key.id, state[key.input.modifier]);
    },
    releaseKeys: () => robotron?.releaseKeys(),
    pulse: (id) => robotron?.pulse(id),
    openMonitor: (on) => {
      cancelGesture();
      robotron?.openMonitor(on);
      renderRequested = true;
    },
    interior: (on) => {
      caseOpen = on;
      cancelGesture();
      robotron?.interior(on);
      renderRequested = true;
    },
    separate: (on) => {
      assembliesLifted = on;
      cancelGesture();
      robotron?.separate(on);
    },
    update: () => {
      texture.needsUpdate = true;
      renderRequested = true;
    },
    setMachine: (value) => {
      cancelGesture();
      robotron?.releaseKeys();
      robotron?.separate(false);
      robotron?.interior(false);
      robotron?.openMonitor(false);
      caseOpen = false;
      assembliesLifted = false;
      kind = value;
      visibility();
    },
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
          [-1.1, 0.9, -1.7],
          [0, 0.32, -0.2],
        ],
        under: [
          [0.45, -1.35, 1.8],
          [0, 0.03, 0.65],
        ],
        keyboard: [
          [0, 1.55, 1.45],
          [0, 0.07, 0.88],
        ],
        connector: [
          [-1.08, 0.38, 0.72],
          [-0.66, 0.055, 0.36],
        ],
        drives: [
          [-0.25, 0.6, 1.9],
          [-0.2, 0.18, 0.48],
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
      camera.position.set(...view[0]);
      controls.target.set(...view[1]);
      controls.update();
    },
  };
}
