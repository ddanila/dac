import * as THREE from "three";

// Same ellipsoid and bowed perimeter as the canonical OpenSCAD glass.
export function crtDepth(spec, x, y) {
  const [rx, ry, rz] = spec.radii;
  return spec.depth - rz + rz * Math.sqrt(1 - (x / rx) ** 2 - (y / ry) ** 2);
}
export function crtGeometry(spec) {
  const geometry = new THREE.PlaneGeometry(2, 2, 48, 40);
  const p = geometry.attributes.position,
    uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i),
      v = p.getY(i),
      n = spec.outlinePower;
    const m = Math.max(Math.abs(u), Math.abs(v));
    const f = m ? m / (Math.abs(u) ** n + Math.abs(v) ** n) ** (1 / n) : 1;
    const x = (u * f * spec.size[0]) / 2,
      y = (v * f * spec.size[1]) / 2;
    p.setXYZ(i, x, y, crtDepth(spec, x, y));
    uv.setXY(i, x / spec.rasterSize[0] + 0.5, y / spec.rasterSize[1] + 0.5);
  }
  geometry.computeVertexNormals();
  return geometry;
}
export function crtMaterial(texture) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x14221d,
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.13,
    envMapIntensity: 0.55,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
       totalEmissiveRadiance *= step(0.0,vEmissiveMapUv.x)*step(vEmissiveMapUv.x,1.0)
         *step(0.0,vEmissiveMapUv.y)*step(vEmissiveMapUv.y,1.0);`,
    );
  };
  material.customProgramCacheKey = () => "inset-crt-raster-v1";
  return material;
}
