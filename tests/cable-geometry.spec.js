import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {Box3,Vector3,Triangle,Matrix4,Ray} from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {bindRibbon,cableWeight} from '../src/robotron-cables.js';
const root=new URL('../public/models/robotron-1715m/',import.meta.url);
const model=JSON.parse(readFileSync(new URL('model.json',root)));
const data=readFileSync(new URL('meshes/ribbon-cables.stl',root));
const rest=new STLLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)).attributes.position.array;

test('drive cables clear PCBs, packages, connector envelopes, PSU and case edges outside recorded entry zones',()=>{
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
 // Connector envelopes are conservative: cable insulation stops above the
 // motherboard socket. The drive-end plugs themselves are mating interfaces.
 for(const board of model.pcbComponents.boards)for(const c of board.connectors||[]){
  if(c.hidden)continue;
  const half=((c.n-1)*2.54+6)/2;
  const transform=new Matrix4().makeRotationZ(c.rotation*Math.PI/180);
  transform.multiply(new Matrix4().makeRotationX(c.side===-1?Math.PI:0));transform.setPosition(...c.position);
  boxes.push(new Box3(new Vector3(-4.5,-half,.2),new Vector3(4.5,half,7.2)).applyMatrix4(transform));
 }
 const box=(a,b)=>new Box3(new Vector3(...a),new Vector3(...b));
 // Fixed chassis boundaries and folded side returns; lid is removed before
 // separation is enabled. PSU left wall includes a fan opening and two
 // explicitly unresolved lead-entry zones (not claimed as real apertures).
 boxes.push(box([-250,-200,0],[250,200,1]),box([-250,-200,1],[-249,200,40]),box([249,-200,1],[250,200,40]),
  box([-250,-200,1],[250,-199,40]),box([-250,199,1],[250,200,40]),
  box([-245,-188,34],[-244,188,41]),box([244,-188,34],[245,188,41]),
  box([94,-183,9],[238,186,10]),box([237,-183,9],[238,186,113]),
  box([94,-183,9],[238,-182,113]),box([94,185,9],[238,186,113]),box([94,-183,113],[238,186,114]));
 const psuWall=box([94,-182,10],[95,185,113]);
 const entries=[box([93,42,55],[97,49,67]),box([93,52,19],[97,57,29])];
 const entryHits=[0,0];
 const carrier=new Box3(new Vector3(-235,-199,22),new Vector3(75,-2,62));
 const hits=[];
 for(const [name,move] of cases)for(const parked of [false,true])for(let step=0;step<=20;step++){
  const vertices=move(step/20,parked);
  const obstacles=[...boxes,carrier.clone().translate(new Vector3(0,-145*step/20,115*step/20))];
  for(let i=0;i<vertices.length;i+=9){
   tri.a.fromArray(vertices,i);tri.b.fromArray(vertices,i+3);tri.c.fromArray(vertices,i+6);
   if(obstacles.some(b=>b.intersectsTriangle(tri)))hits.push({name,parked,step,triangle:i/9,obstacle:obstacles.findIndex(b=>b.intersectsTriangle(tri)),point:tri.a.toArray()});
   if(psuWall.intersectsTriangle(tri)){
    const entry=entries.findIndex(b=>b.intersectsTriangle(tri));
    // No cable currently passes the fan opening. All wall crossings must be
    // limited to the two documented unresolved power-harness terminations.
    if(name.startsWith('power-wires-') && entry>=0)entryHits[entry]++;
    else hits.push({name,parked,step,obstacle:'PSU wall',triangle:i/9});
   }
  }
 }
 expect(hits.slice(0,10)).toEqual([]);
 expect(entryHits.every(n=>n>0)).toBe(true);
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

// Two triangles per nominal ribbon span, including its entire 33 mm width.
// Adjacent spans share an edge; the two paths intentionally meet at drive 1.
test('ribbon strips do not cross themselves through the full inspection motion',()=>{
 const paths=model.ribbonPaths;
 const bindings=paths.map(path=>{
  const points=[];
  for(let i=0;i<path.length;i++){
   const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
   const dx=b[1]-a[1],dy=a[0]-b[0],n=Math.hypot(dx,dy)||1;
   for(const side of [-16.5,16.5])points.push(path[i][0]+side*dx/n,path[i][1]+side*dy/n,path[i][2]);
  }
  return bindRibbon(new Float32Array(points),[path]);
 });
 const hits=[];
 const crossing=(a,b)=>{
  // Segment/triangle crossing, strictly inside a segment. Coplanar touching
  // and material thickness are outside this zero-thickness strip check.
  for(const t of [a,b]){
   const other=t===a?b:a;
   for(const [u,v]of [[t.a,t.b],[t.b,t.c],[t.c,t.a]]){
    const delta=v.clone().sub(u),length=delta.length();
    if(!length)continue;
    const ray=new Ray(u,delta.divideScalar(length)),hit=new Vector3();
    if(ray.intersectTriangle(other.a,other.b,other.c,false,hit)){
     const d=hit.distanceTo(u);if(d>.001 && d<length-.001)return true;
    }
   }
  }
  return false;
 };
 for(const parked of [false,true])for(let step=0;step<=20;step++){
  const strips=bindings.map((move,p)=>{
   const v=move(step/20,parked),spans=[];
   for(let i=0;i<paths[p].length-1;i++){
    const a=new Vector3().fromArray(v,i*6),b=new Vector3().fromArray(v,i*6+3),c=new Vector3().fromArray(v,i*6+6),d=new Vector3().fromArray(v,i*6+9);
    spans.push({p,i,box:new Box3().setFromPoints([a,b,c,d]),tri:[new Triangle(a,b,c),new Triangle(b,d,c)]});
   }
   return spans;
  }).flat();
  for(let i=0;i<strips.length;i++)for(let j=i+1;j<strips.length;j++){
   const a=strips[i],b=strips[j];
   if(a.p===b.p && Math.abs(a.i-b.i)<=1)continue;
   if(a.p!==b.p && a.i>=paths[0].length-3 && b.i<2)continue; // common drive plug
   if(a.box.intersectsBox(b.box) && a.tri.some(x=>b.tri.some(y=>crossing(x,y))))hits.push({parked,step,a:[a.p,a.i],b:[b.p,b.i]});
  }
 }
 expect(hits.slice(0,10)).toEqual([]);
});
