import { specimenMaterial } from "./robotron-materials.js";
import { modelAsset } from "./model-assets.js";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { toCreasedNormals, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Index repeated STL vertices after computing the same crease normals. This
// preserves every triangle and normal while avoiding repeated vertex shading.
export function detailedGeometry(source, creaseAngle = Math.PI / 4) {
  const geometry = mergeVertices(toCreasedNormals(source, creaseAngle), Number.EPSILON);
  geometry.computeBoundingBox(); // Reject missed pick rays before testing triangles.
  return geometry;
}

// Image landmarks also generate the OpenSCAD package bodies. No generic chip grid.
export function pcbPoint(board, x, y, height = 0) {
  const [x0, y0, x1, y1] = board.crop;
  const u = (x - x0) / (x1 - x0),
    v = (y - y0) / (y1 - y0);
  if (board.worldCorners) {
    const [tl, tr, , bl] = board.worldCorners;
    return tl.map(
      (value, i) =>
        value +
        u * (tr[i] - value) +
        v * (bl[i] - value) +
        height * board.normal[i],
    );
  }
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
  const components = [...(board.components || []), ...(board.passives || [])];
  const holes = [
    ...(board.exclude || []),
    ...components.map((c) => {
      const [x, y, w, h] = c.rect;
      return [x - 2, y - 2, x + w + 2, y + h + 2];
    }),
  ];
  for (const hole of holes)
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
// Extract only light artwork from the reference. Original pixels remain available
// as evidence; the rendered substrate has no baked photographic illumination.
export function pcbArtwork(board, image, descriptions) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const [r, g, b] = pixels.data.slice(i, i + 3);
    const light = Math.max(0, Math.min(1, (Math.min(r, b) + g - 290) / 130));
    pixels.data[i] = 195;
    pixels.data[i + 1] = 205;
    pixels.data[i + 2] = 166;
    pixels.data[i + 3] = Math.round(255 * light);
  }
  ctx.putImageData(pixels, 0, 0);
  // Cut pad apertures out of the artwork as well as the solid substrate.
  ctx.globalCompositeOperation = "destination-out";
  const [x0, y0, x1, y1] = board.crop,
    [w, h] = board.size,
    [ox, oy] = board.origin;
  for (const [x, y, , name] of descriptions?.footprints || []) {
    if (name !== board.name) continue;
    const u = board.rotated ? 1 - (y - oy) / h : (x - ox) / w;
    const v = board.rotated ? 1 - (x - ox) / w : 1 - (y - oy) / h;
    ctx.beginPath();
    ctx.ellipse(
      x0 + u * (x1 - x0),
      y0 + v * (y1 - y0),
      (0.52 * (x1 - x0)) / (board.rotated ? h : w),
      (0.52 * (y1 - y0)) / (board.rotated ? w : h),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  for (const [x, y, , z, name] of descriptions?.mounts || []) {
    if (name !== board.name) continue;
    const u = board.rotated ? 1 - (y - oy) / h : (x - ox) / w;
    const v = board.rotated ? 1 - (x - ox) / w : 1 - (y - oy) / h;
    ctx.beginPath();
    ctx.ellipse(
      x0 + u * (x1 - x0),
      y0 + v * (y1 - y0),
      (1.8 * (x1 - x0)) / (board.rotated ? h : w),
      (1.8 * (y1 - y0)) / (board.rotated ? w : h),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  return canvas;
}
export async function loadPcbPhotos(data, base, onAsset = () => {}) {
  const loader = new THREE.TextureLoader();
  return Promise.all(
    (data.pcbReferences || []).map(async (board) => {
      const texture = await loader.loadAsync(
        modelAsset(board.file, base, board.sha256).href,
      );
      onAsset();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      let artwork = texture;
      if (board.components?.length) {
        artwork = new THREE.CanvasTexture(
          pcbArtwork(board, texture.image, data.pcbComponents),
        );
        artwork.colorSpace = THREE.SRGBColorSpace;
        artwork.anisotropy = 4;
      }
      const mesh = new THREE.Mesh(
        pcbPhotoGeometry(board),
        new THREE.MeshStandardMaterial({
          map: artwork,
          transparent: artwork !== texture,
          alphaTest: artwork !== texture ? 0.08 : 0,
          roughness: 0.68,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
      );
      if (board.components?.length && data.pcbComponents) {
        const markings = new THREE.Mesh(
          pcbMarkingGeometry(board, data.pcbComponents),
          new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            roughness: 0.85,
            polygonOffset: true,
            polygonOffsetFactor: -1,
          }),
        );
        markings.material.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <map_fragment>",
            "#include <map_fragment>\nfloat ink=smoothstep(0.035,0.22,max(max(diffuseColor.r,diffuseColor.g),diffuseColor.b)); diffuseColor=vec4(vec3(0.55),diffuseColor.a*ink);",
          );
        };
        markings.material.customProgramCacheKey = () => "pcb-photo-ink";
        markings.name = `logic-markings-${board.name}`;
        markings.userData.detail = board.name;
        mesh.add(markings);
      }
      if (board.components?.length) {
        mesh.userData.artwork = { geometry: mesh.geometry, texture: artwork };
        mesh.userData.original = {
          geometry: pcbPhotoGeometry({
            ...board,
            components: [],
            passives: [],
            exclude: [],
            packages: [],
          }),
          texture,
        };
      }
      mesh.name = `reference-${board.name}`;
      mesh.userData.board = board.name;
      mesh.userData.evidenceOnly = !!board.evidenceOnly;
      mesh.userData.credit = board.credit;
      mesh.userData.section = board.section || "interior";
      return mesh;
    }),
  );
}

// Mesh instances preserve nominal package dimensions and share geometry/GPU draws.
export async function loadPcbComponents(data, base, onAsset = () => {}, cache = new Map()) {
  const loader = new STLLoader(),
    result = [];
  const descriptions = data.pcbComponents;
  if (!descriptions) return result;
  const matrix = new THREE.Object3D();
  await Promise.all(
    descriptions.models.map(async (model) => {
      const placements = descriptions.instances.filter(
        (p) => p.model === model.id,
      );
      if (!placements.length) return;
      for (const kind of ["body", "leads"]) {
        const record = model.meshes[kind];
        const url = modelAsset(record.file, base, record.sha256).href;
        if (!cache.has(url)) {
          const promise = loader.loadAsync(url).then(g => detailedGeometry(g));
          cache.set(url, promise);
          promise.catch(() => cache.delete(url));
        }
        const geometry = await cache.get(url);
        onAsset();
        const material = specimenMaterial(
          kind === "body" ? 0x29282a : 0xb9b7ac,
          data.materials?.[kind === "body" ? "ic-moulding" : "tinned-lead"] ||
            {roughness: kind === "body" ? .72 : .27, metalness: kind === "body" ? 0 : .9},
        );
        for (const board of [...new Set(placements.map((p) => p.board))]) {
          const boardPlacements = placements.filter((p) => p.board === board);
          const mesh = new THREE.InstancedMesh(
            geometry,
            material,
            boardPlacements.length,
          );
          boardPlacements.forEach((p, i) => {
            matrix.position.set(...p.position);
            matrix.rotation.set(p.side===-1?Math.PI:0, 0, (p.rotation * Math.PI) / 180, "ZYX");
            matrix.updateMatrix();
            mesh.setMatrixAt(i, matrix.matrix);
          });
          mesh.instanceMatrix.needsUpdate = true;
          mesh.computeBoundingBox();
          mesh.computeBoundingSphere();
          mesh.name = `logic-package-${model.id}-${kind}-${board}`;
          mesh.userData.board = board;
          mesh.userData.interior = true;
          mesh.userData.detail = board;
          mesh.userData.componentDetails = boardPlacements.map(p => p.inspection);
          mesh.userData.credit = descriptions.credit;
          mesh.castShadow = mesh.receiveShadow = true;
          mesh.visible = false;
          result.push(mesh);
        }
      }
    }),
  );
  return result;
}

// Only photographed lettering is raised onto nominal package tops. The board
// plane excludes the original chip silhouettes, so there are no flat duplicates.
export function pcbMarkingGeometry(board, descriptions) {
  const positions = [],
    uvs = [];
  const models = new Map(descriptions.models.map((m) => [m.id, m]));
  for (const p of descriptions.instances.filter(
    (p) => p.board === board.name && p.markings !== false,
  )) {
    const model = models.get(p.model),
      [x, y, w, h] = p.rect;
    const horizontal = w > h;
    const width = model.bodySize[horizontal ? 1 : 0] * 0.76;
    const height = model.bodySize[horizontal ? 0 : 1] * 0.76;
    const q = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    for (const i of [0, 2, 1, 0, 3, 2]) {
      const [u, v] = q[i],
        a = (u - 0.5) * width,
        b = (v - 0.5) * height;
      positions.push(
        p.position[0] + (board.rotated ? -b : a),
        p.position[1] + (board.rotated ? -a : -b),
        p.position[2] + p.top + 0.035,
      );
      uvs.push(
        (x + w * (0.1 + 0.8 * u)) / board.imageSize[0],
        1 - (y + h * (0.15 + 0.7 * v)) / board.imageSize[1],
      );
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

// Clean documented device labels, generated from the canonical layout metadata.
// One atlas, one mesh per board; no photographic chip silhouettes or baked wear.
export function loadPcbLabels(data) {
  const items=data.pcbComponents.instances.filter(p=>p.label && !p.label.startsWith('Logic footprint'));
  if (!items.length) return [];
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.ceil(items.length/8)*64;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c8c9bd';ctx.textAlign='center';ctx.font='13px monospace';
  const groups=new Map(),pose=new THREE.Matrix4(),rotation=new THREE.Matrix4();
  items.forEach((p,i)=>{
    const col=i%8,row=Math.floor(i/8);if(!p.ref.startsWith('P'))ctx.fillText(p.ref,col*128+64,row*64+23);ctx.fillText(p.label.split(' (')[0].slice(0,16),col*128+64,row*64+43);
    if(!groups.has(p.board))groups.set(p.board,{positions:[],uvs:[]});const g=groups.get(p.board);
    const model=data.pcbComponents.models.find(m=>m.id===p.model),w=model.bodySize[0]*.82,h=model.bodySize[1]*.75;
    pose.makeRotationZ(p.rotation*Math.PI/180).multiply(rotation.makeRotationX(p.side===-1?Math.PI:0)).setPosition(...p.position);
    for(const n of [0,1,2,0,2,3]){const q=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]][n];const v=new THREE.Vector3(q[0]*w,q[1]*h,p.top+.05).applyMatrix4(pose);g.positions.push(...v.toArray());g.uvs.push((col+q[0]+.5)/8,1-(row+.5-q[1])/(canvas.height/64));}
  });
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return [...groups].map(([board,g])=>{
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(g.positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(g.uvs,2));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:.8}));mesh.name=`logic-labels-${board}`;mesh.userData={board,interior:true,detail:board};mesh.visible=false;return mesh;
  });
}
