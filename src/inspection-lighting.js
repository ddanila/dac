import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Neutral reflected illumination reveals tinned leads and solder without
// repainting them. Generate once per renderer; callers own the render target.
export function inspectionEnvironment(renderer, scene) {
  const room = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.04);
  room.dispose(); generator.dispose();
  scene.environment = target.texture;
  scene.environmentIntensity = 0.55;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return target;
}
