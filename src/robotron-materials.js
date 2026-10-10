import * as THREE from "three";

// The photos guide the palette and finish, not the lighting on a whole panel.
// Grain is evaluated in model millimetres, so it wraps every face at the same
// scale without UV seams, repeated cables, feet, shadows or reflections.
export function specimenMaterial(color, profile = {}) {
  const { grain = 0, grainScale = 3, ...physical } = profile;
  const Material = physical.clearcoat
    ? THREE.MeshPhysicalMaterial
    : THREE.MeshStandardMaterial;
  const material = new Material({ color, ...physical });
  if (!grain) return material;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grainAmount = { value: grain };
    shader.uniforms.grainScale = { value: grainScale };
    shader.vertexShader =
      "varying vec3 specimenPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nspecimenPosition=position;",
    );
    shader.fragmentShader =
      `
      varying vec3 specimenPosition;
      uniform float grainAmount, grainScale;
      float grainHash(vec3 p) {
        p=fract(p*.1031); p+=dot(p,p.yzx+33.33);
        return fract((p.x+p.y)*p.z);
      }
      float specimenNoise(vec3 p) {
        vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(grainHash(i),grainHash(i+vec3(1,0,0)),f.x),
                       mix(grainHash(i+vec3(0,1,0)),grainHash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(grainHash(i+vec3(0,0,1)),grainHash(i+vec3(1,0,1)),f.x),
                       mix(grainHash(i+vec3(0,1,1)),grainHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       float specimenGrain=specimenNoise(specimenPosition*grainScale)-.5;
       // Fade subpixel grain to prevent distant shimmer.
       float grainVisibility=1.0-smoothstep(.4,1.8,length(fwidth(specimenPosition*grainScale)));
       specimenGrain*=grainVisibility;
       diffuseColor.rgb*=1.0+specimenGrain*grainAmount;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      "#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+specimenGrain*.08,0.04,1.0);",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
       vec3 grainDx=dFdx(-vViewPosition),grainDy=dFdy(-vViewPosition);
       vec3 grainR1=cross(grainDy,normal),grainR2=cross(normal,grainDx);
       float grainDet=dot(grainDx,grainR1);
       normal=normalize(abs(grainDet)*normal-sign(grainDet)*
         (dFdx(specimenGrain)*grainR1+dFdy(specimenGrain)*grainR2)*grainAmount*.001);`,
    );
  };
  material.customProgramCacheKey = () => "specimen-grain-v1";
  return material;
}

// One transparent atlas for the transcribed legends. The geometry supplies the
// key's shape and sheen, including the clear-cap border, rather than a photo.
export function legendAtlas(keys) {
  const cell = 128,
    columns = 10;
  const canvas = document.createElement("canvas");
  canvas.width = columns * cell;
  canvas.height = Math.ceil(keys.length / columns) * cell;
  const ctx = canvas.getContext("2d");
  keys.forEach((key, i) => {
    const cx = ((i % columns) + 0.5) * cell;
    const cy = (Math.floor(i / columns) + 0.5) * cell;
    ctx.fillStyle = key.style === 1 ? "#404541" : "#e7e6cd";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = key.legend || [key.label];
    const longest = Math.max(1, ...lines.map((s) => s.length));
    const fontSize = lines.length > 1 ? 31 : longest > 2 ? 31 : 54;
    ctx.font = `${key.style === 1 ? 500 : 400} ${fontSize}px Arial, sans-serif`;
    lines.forEach((line, j) =>
      ctx.fillText(
        line,
        cx,
        cy + (j - (lines.length - 1) / 2) * 34,
        cell * 0.82,
      ),
    );
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, columns, rows: canvas.height / cell };
}

export function markingTexture(draw, width = 256, height = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#dedfd0";
  ctx.strokeStyle = "#dedfd0";
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
