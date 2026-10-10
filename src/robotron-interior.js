import * as THREE from "three";

// Image landmarks also generate the OpenSCAD package bodies. No generic chip grid.
export function pcbPoint(board, x, y, height = 0) {
  const [x0, y0, x1, y1] = board.crop;
  const u = (x - x0) / (x1 - x0),
    v = (y - y0) / (y1 - y0);
  const [ox, oy, oz] = board.origin,
    [w, h] = board.size;
  return board.rotated
    ? [ox + (1 - v) * w, oy + (1 - u) * h, oz + height]
    : [ox + u * w, oy + (1 - v) * h, oz + height];
}
function subtract(rect, hole) {
  const [x0, y0, x1, y1] = rect,
    [a, b, c, d] = hole;
  const l = Math.max(x0, a),
    r = Math.min(x1, c),
    t = Math.max(y0, b),
    bottom = Math.min(y1, d);
  if (l >= r || t >= bottom) return [rect];
  return [
    [x0, y0, x1, t],
    [x0, bottom, x1, y1],
    [x0, t, l, bottom],
    [r, t, x1, bottom],
  ].filter(([x, y, z, w]) => z > x && w > y);
}
export function pcbPhotoGeometry(board) {
  let rectangles = [board.crop];
  for (const hole of board.exclude || [])
    rectangles = rectangles.flatMap((r) => subtract(r, hole));
  const faces = rectangles.map((r) => [r, 0.045]);
  for (const [x, y, w, h] of board.packages)
    faces.push([[x, y, x + w, y + h], board.packageHeight + 0.045]);
  const positions = [],
    uvs = [];
  for (const [[x0, y0, x1, y1], height] of faces) {
    const q = [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ];
    for (const i of [0, 2, 1, 0, 3, 2]) {
      positions.push(...pcbPoint(board, ...q[i], height));
      uvs.push(q[i][0] / board.imageSize[0], 1 - q[i][1] / board.imageSize[1]);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
export async function loadPcbPhotos(data, base) {
  const loader = new THREE.TextureLoader();
  return Promise.all(
    (data.pcbReferences || []).map(async (board) => {
      const texture = await loader.loadAsync(new URL(board.file, base).href);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      const mesh = new THREE.Mesh(
        pcbPhotoGeometry(board),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.68,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
      );
      mesh.name = `reference-${board.name}`;
      mesh.userData.credit = board.credit;
      return mesh;
    }),
  );
}
