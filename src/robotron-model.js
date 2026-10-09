import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";

// The body meshes come exclusively from the canonical OpenSCAD assembly.
// Photo overlays use UV coordinates into the owner's untouched JPEG pixels.
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
    objects = new Map();
  const filenames = new Set([
    ...data.keys.map((k) => k.photo),
    ...data.patches.map((p) => p.photo),
  ]);
  await Promise.all(
    [...filenames].map(async (name) => {
      const texture = await loader.loadAsync(
        new URL(`photos/${name}`, base).href,
      );
      // Keep archival JPEGs intact; bound GPU texture memory on mobile devices.
      const source = texture.image;
      const ratio = Math.min(1, 2048 / Math.max(source.width, source.height));
      if (ratio < 1) {
        const sampled = document.createElement("canvas");
        sampled.width = Math.round(source.width * ratio);
        sampled.height = Math.round(source.height * ratio);
        sampled
          .getContext("2d")
          .drawImage(source, 0, 0, sampled.width, sampled.height);
        texture.image = sampled;
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
        new THREE.MeshStandardMaterial({ color: part.color, roughness: 0.83 }),
      );
      mesh.name = part.name;
      group.add(mesh);
      objects.set(part.name, mesh);
    }),
  );
  function photoPlane(name, width, height, uv, photo, radius = 0) {
    const shape = new THREE.Shape();
    const x = -width / 2,
      y = -height / 2,
      r = radius;
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const geometry = new THREE.ShapeGeometry(shape);
    const pos = geometry.attributes.position,
      coords = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / width + 0.5,
        v = 0.5 - pos.getY(i) / height;
      const top = uv[0].map((a, j) => a * (1 - u) + uv[1][j] * u);
      const bottom = uv[3].map((a, j) => a * (1 - u) + uv[2][j] * u);
      coords.setXY(
        i,
        top[0] * (1 - v) + bottom[0] * v,
        1 - (top[1] * (1 - v) + bottom[1] * v),
      );
    }
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: textures.get(photo),
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    mesh.name = name;
    return mesh;
  }
  const keyboard = new THREE.Group();
  keyboard.position.set(0, data.keyboard.y, data.keyboard.z);
  keyboard.rotation.x = THREE.MathUtils.degToRad(data.keyboard.slope);
  group.add(keyboard);
  for (const key of data.keys) {
    const mesh = photoPlane(
      `key-${key.label}`,
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
    mesh.position.set(key.x, key.y, 8.1);
    keyboard.add(mesh);
  }
  for (const patch of data.patches) {
    const mesh = photoPlane(patch.name, ...patch.size, patch.uv, patch.photo);
    mesh.position.set(...patch.position);
    mesh.rotation.set(...patch.rotation.map(THREE.MathUtils.degToRad));
    group.add(mesh);
  }
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(...data.screen.size),
    new THREE.MeshBasicMaterial({ map: displayTexture }),
  );
  display.rotation.x = Math.PI / 2;
  display.position.set(...data.screen.position);
  group.add(display);
  return { group, objects };
}
