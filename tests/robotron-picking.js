import { PerspectiveCamera, Vector3, Euler } from 'three';
export async function keyPoint(page, key, manifest) {
  const box = await page.locator('#viewport').boundingBox();
  const camera = new PerspectiveCamera(36, box.width / box.height, .01, 40);
  camera.position.set(0, 1.55, 1.45);
  camera.lookAt(0, .07, .88);
  camera.updateMatrixWorld();
  const point = new Vector3(key.x, key.y, 8.1)
    .applyEuler(new Euler(manifest.keyboard.slope * Math.PI / 180, 0, 0))
    .add(new Vector3(0, manifest.keyboard.y, manifest.keyboard.z))
    .applyEuler(new Euler(-Math.PI / 2, 0, 0))
    .multiplyScalar(manifest.scale).project(camera);
  return {x:box.x+(point.x+1)*box.width/2,y:box.y+(1-point.y)*box.height/2};
}
