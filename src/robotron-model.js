import * as THREE from "three";
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
export async function loadRobotron(displayTexture) {
  const base = new URL(
    "models/robotron-1715m/",
    new URL(import.meta.env.BASE_URL, location.origin),
  );
  const response = await fetch(new URL("model.json", base));
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
  const filenames = new Set(
    [...data.keys, ...data.patches].map((k) => k.photo),
  );
  await Promise.all(
    [...filenames].map(async (name) => {
      const texture = await loader.loadAsync(
        new URL(`photos/${name}`, base).href,
      );
      const source = texture.image,
        ratio = Math.min(1, 2048 / Math.max(source.width, source.height));
      if (ratio < 1) {
        const c = document.createElement("canvas");
        c.width = Math.round(source.width * ratio);
        c.height = Math.round(source.height * ratio);
        c.getContext("2d").drawImage(source, 0, 0, c.width, c.height);
        texture.image = c;
        texture.needsUpdate = true;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      textures.set(name, texture);
    }),
  );
  await Promise.all(
    data.parts.map(async (part) => {
      const geometry = await stl.loadAsync(new URL(part.file, base).href);
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: part.color, roughness: 0.78 }),
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = part.name;
      group.add(mesh);
      objects.set(part.name, mesh);
    }),
  );
  await Promise.all(
    data.keyMeshes.map(async (part) =>
      keyGeometry.set(
        part.name,
        await stl.loadAsync(new URL(part.file, base).href),
      ),
    ),
  );
  function photoPlane(
    name,
    width,
    height,
    uv,
    photo,
    radius = 0,
    options = {},
  ) {
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
      coords.setXY(i, u, 1 - v);
    }
    const material = new THREE.MeshStandardMaterial({
      map: textures.get(photo),
      roughness: 0.9,
      transparent: !!(options.ink || options.feather),
      depthWrite: !(options.ink || options.feather),
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    if (options.ink || options.feather) {
      material.onBeforeCompile = (shader) => {
        shader.vertexShader =
          "attribute vec2 surfaceUv; varying vec2 patchUv;\n" +
          shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <uv_vertex>",
          "#include <uv_vertex>\npatchUv=surfaceUv;",
        );
        shader.fragmentShader =
          "varying vec2 patchUv;\n" + shader.fragmentShader;
        if (options.paint) {
          const names = ["paintTL", "paintTR", "paintBR", "paintBL"];
          options.paint.forEach(
            (rgb, i) =>
              (shader.uniforms[names[i]] = {
                value: new THREE.Color().setRGB(...rgb, THREE.SRGBColorSpace),
              }),
          );
          shader.uniforms.paintTarget = { value: new THREE.Color("#b6ae93") };
          shader.fragmentShader =
            "uniform vec3 paintTL,paintTR,paintBR,paintBL,paintTarget;\n" +
            shader.fragmentShader;
        }
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <map_fragment>",
          "#include <map_fragment>\n" +
            (options.paint
              ? "vec3 illumination=mix(mix(paintBL,paintBR,patchUv.x),mix(paintTL,paintTR,patchUv.x),patchUv.y); diffuseColor.rgb*=min(vec3(2.5),paintTarget/max(illumination,vec3(0.03)));"
              : "") +
            (options.ink
              ? "float ink=smoothstep(0.32,0.58,max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b)); diffuseColor=vec4(vec3(0.75),diffuseColor.a*ink);"
              : "float edge=min(min(patchUv.x,1.0-patchUv.x),min(patchUv.y,1.0-patchUv.y)); diffuseColor.a*=smoothstep(0.0,0.06,edge);"),
        );
      };
      material.customProgramCacheKey = () =>
        options.ink
          ? "photo-ink"
          : options.paint
            ? "photo-paint"
            : "photo-feather";
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    return mesh;
  }
  const keyboard = new THREE.Group();
  keyboard.position.set(0, data.keyboard.y, data.keyboard.z);
  keyboard.rotation.x = THREE.MathUtils.degToRad(data.keyboard.slope);
  group.add(keyboard);
  const keyMaterials = [0x202526, 0xbac1b8, 0xc6343b].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72 }),
  );
  for (const key of data.keys) {
    const cap = new THREE.Group();
    cap.position.set(key.x, key.y, 0);
    cap.userData.key = key;
    const body = new THREE.Mesh(
      keyGeometry.get(key.mesh),
      keyMaterials[key.style],
    );
    body.userData.key = key;
    cap.add(body);
    const face = photoPlane(
      key.id,
      key.width * data.keyboard.pitch - 3.5,
      key.height * data.keyboard.pitch - 4.5,
      key.uv,
      key.photo,
      key.style === 1
        ? 2.6
        : Math.min(
            key.width * data.keyboard.pitch - 3.5,
            key.height * data.keyboard.pitch - 4.5,
          ) * 0.45,
    );
    face.position.z = 8.1;
    face.userData.key = key;
    cap.add(face);
    keyboard.add(cap);
    keyObjects.set(key.id, cap);
  }
  const patches = [];
  for (const p of data.patches) {
    const mesh = photoPlane(p.name, ...p.size, p.uv, p.photo, 0, p);
    mesh.position.set(...p.position);
    mesh.rotation.set(...p.rotation.map(THREE.MathUtils.degToRad));
    mesh.userData.rest = mesh.position.clone();
    group.add(mesh);
    patches.push(mesh);
  }
  const display = new THREE.Mesh(
    surface(...data.screen.size, data.screen.radius, data.screen.bulge),
    new THREE.MeshBasicMaterial({ map: displayTexture }),
  );
  display.rotation.x = Math.PI / 2;
  display.position.set(...data.screen.position);
  group.add(display);
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: 0x420a06,
    emissive: 0x000000,
    roughness: 0.4,
  });
  const diskLamp = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 12, 8),
    lampMaterial,
  );
  diskLamp.position.set(-221, -208, 96);
  group.add(diskLamp);
  const capsMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4215,
    emissive: 0x000000,
  });
  const capsLamp = new THREE.Mesh(
    new THREE.SphereGeometry(2, 12, 8),
    capsMaterial,
  );
  capsLamp.position.set(-242, -5, 8);
  keyboard.add(capsLamp);
  let power = false,
    activityUntil = 0,
    split = 0,
    splitTarget = 0;
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
    for (const [id, key] of keyObjects)
      key.position.z =
        pressed.has(id) || performance.now() < (key.userData.pulseUntil || 0)
          ? -2.2
          : 0;
    lampMaterial.emissive.set(
      power && performance.now() < activityUntil ? 0xff2404 : 0,
    );
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    split = reduced
      ? splitTarget
      : THREE.MathUtils.lerp(split, splitTarget, 0.15);
    if (Math.abs(split - splitTarget) < 0.001) split = splitTarget;
    const monitor = [
      "monitor-shell",
      "bezel",
      "crt-rim",
      "crt-glass",
      "pedestal",
      "ring",
    ];
    for (const name of monitor) objects.get(name).position.z = split * 150;
    objects.get("case-lid").position.z = split * 75;
    objects.get("fascia").position.y = -split * 40;
    objects.get("keyboard-deck").position.z = split * 55;
    objects.get("cable").visible = split < 0.05;
    keyboard.position.z = data.keyboard.z + split * 55;
    display.position.z = data.screen.position[2] + split * 150;
    for (const mesh of patches) {
      mesh.position.copy(mesh.userData.rest);
      if (mesh.name === "monitor-tape") mesh.position.z += split * 150;
      if (mesh.name === "brand") mesh.position.y -= split * 40;
      if (mesh.name === "case-right-paint") mesh.position.z += split * 75;
    }
  }
  return {
    group,
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
        capsMaterial.emissive.set(0);
      }
      objects.get("power").material.emissive.set(on ? 0x152417 : 0);
    },
    activity(active) {
      if (active && power) activityUntil = performance.now() + 140;
    },
    modifiers(state) {
      capsMaterial.emissive.set(power && state.caps ? 0xba7618 : 0);
    },
    separate(value) {
      splitTarget = value ? 1 : 0;
      releaseKeys();
    },
  };
}
