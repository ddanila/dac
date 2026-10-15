import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {Box3,Vector3,Triangle,Matrix4} from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {bindRibbon,cableWeight} from '../src/robotron-cables.js';
const root=new URL('../public/models/robotron-1715m/',import.meta.url);
const model=JSON.parse(readFileSync(new URL('model.json',root)));
const data=readFileSync(new URL('meshes/ribbon-cables.stl',root));
const rest=new STLLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)).attributes.position.array;

test('drive cables clear PCBs, chip bodies and drive carrier throughout separation and disconnection',()=>{
 const tri=new Triangle();
 const cases=[['ribbon',bindRibbon(rest,model.ribbonPaths)]];
 for(const name of ['power-wires-red','power-wires-black','power-wires-yellow']){
  const raw=readFileSync(new URL('meshes/'+name+'.stl',root));
  const v=new STLLoader().parse(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)).attributes.position.array;
  cases.push([name,(split,parked)=>{
   const out=v.slice();for(let i=0;i<v.length;i+=3){const w=cableWeight(name,v[i],v[i+1],v[i+2]);out[i+1]+=split*(parked?18:-145)*w;out[i+2]+=split*(parked?0:115)*w;}return out;
  }]);
 }
 const boxes=model.pcbComponents.boards.map(b=>new Box3(new Vector3(...b.origin),new Vector3(b.origin[0]+b.size[0],b.origin[1]+b.size[1],b.origin[2]+1.6)));
 for(const p of model.pcbComponents.instances){
  const b=model.pcbComponents.models.find(m=>m.id===p.model).meshes.body.bounds;
  const transform=new Matrix4().makeRotationZ(p.rotation*Math.PI/180);
  transform.multiply(new Matrix4().makeRotationX(p.side===-1?Math.PI:0));transform.setPosition(...p.position);
  boxes.push(new Box3(new Vector3(...b[0]),new Vector3(...b[1])).applyMatrix4(transform));
 }
 const carrier=new Box3(new Vector3(-235,-199,22),new Vector3(75,-2,62));
 const hits=[];
 for(const [name,move] of cases)for(const parked of [false,true])for(let step=0;step<=20;step++){
  const vertices=move(step/20,parked);
  const obstacles=[...boxes,carrier.clone().translate(new Vector3(0,-145*step/20,115*step/20))];
  for(let i=0;i<vertices.length;i+=9){
   tri.a.fromArray(vertices,i);tri.b.fromArray(vertices,i+3);tri.c.fromArray(vertices,i+6);
   if(obstacles.some(b=>b.intersectsTriangle(tri)))hits.push({name,parked,step,triangle:i/9});
  }
 }
 expect(hits.slice(0,10)).toEqual([]);
});

test('ribbon sections preserve width, finite vertices, anchored plugs and reversible rest pose',()=>{
 const path=model.ribbonPaths[1],samples=[];
 // Explicit section-edge probes, including the stripe edge.
 for(let i=0;i<path.length;i++){
  const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
  let dx=b[1]-a[1],dy=a[0]-b[0],n=Math.hypot(dx,dy);if(n<.001){dx=1;dy=0;n=1;}
  for(const edge of [-16.5,16.5])samples.push(path[i][0]+edge*dx/n,path[i][1]+edge*dy/n,path[i][2]);
 }
 const move=bindRibbon(new Float32Array(samples),[path]);
 for(const parked of [false,true])for(let step=0;step<=20;step++){
  const v=move(step/20,parked);
  expect(Array.from(v).every(Number.isFinite)).toBe(true);
  for(let i=0;i<v.length;i+=6)expect(Math.hypot(v[i]-v[i+3],v[i+1]-v[i+4],v[i+2]-v[i+5])).toBeCloseTo(33,2);
  for(let j=v.length-6;j<v.length;j++)expect(v[j]).toBeCloseTo(samples[j],3);
 }
 const deform=bindRibbon(rest,model.ribbonPaths);deform(1);const reset=deform(0);
 let drift=0;for(let i=0;i<rest.length;i++)drift=Math.max(drift,Math.abs(reset[i]-rest[i]));
 expect(drift).toBeLessThan(.0001);
});
