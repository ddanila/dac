import * as T from 'three';
import data from './robotron-monitor-cable-paths.json' with {type:'json'};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const monitorLeadDefinitions=data.leads;
// Unplugged leads travel with the monitor during the exploded inspection.
// Redistribute the modelled rear slack to park the plug, keeping arc length fixed.
// This is a geometric constraint, not a measured specimen cable length.
const cachedPaths=new Map();
function localLeadPath(name,parking){
 const cacheKey=`${name}:${parking}`;if(cachedPaths.has(cacheKey))return cachedPaths.get(cacheKey);
 const curves=data.leads[name]?.curves;if(!curves)throw Error('Unknown monitor lead');
 function sample(adjust){
  const controls=curves.map((c,n)=>c.map((p,i)=>p.map((v,k)=>v+(k===1?(n===2?parking*smooth(i/3):0):0))));
  const points=[];controls.forEach((c,n)=>{for(let i=n?1:0;i<=64;i++){const t=i/64;points.push(c[0].map((_,k)=>(1-t)**3*c[0][k]+3*(1-t)**2*t*c[1][k]+3*(1-t)*t*t*c[2][k]+t**3*c[3][k]+(k===1&&n===1?adjust*Math.sin(Math.PI*t)**2:0)));}});return points;
 }
 const target=leadMetrics(localLeadRest(name)).length;
 let points=sample(0);
 if(parking){let lo=-60,hi=60;
  for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(leadMetrics(sample(mid)).length>target)hi=mid;else lo=mid;}
  points=sample((lo+hi)/2);
  if(Math.abs(leadMetrics(points).length-target)>.01)throw Error('Insufficient modelled cable slack');
 }
 cachedPaths.set(cacheKey,points);return points;
}
function localLeadRest(name){
 const curves=data.leads[name]?.curves;if(!curves)throw Error('Unknown monitor lead');
 const points=[];curves.forEach((c,n)=>{for(let i=n?1:0;i<=64;i++){const t=i/64;points.push(c[0].map((_,k)=>(1-t)**3*c[0][k]+3*(1-t)**2*t*c[1][k]+3*(1-t)*t*t*c[2][k]+t**3*c[3][k]));}});return points;
}
export function monitorLeadPath(name,offset=[0,0,0],parking=0){
 return localLeadPath(name,parking).map(p=>p.map((v,k)=>v+offset[k]));
}
const tangent=(p,i)=>new T.Vector3(...p[Math.min(p.length-1,i+1)]).sub(new T.Vector3(...p[Math.max(0,i-1)])).normalize();
export function bindMonitorLead(name,vertices){
 const rest=monitorLeadPath(name),count=vertices.length/3,indices=new Uint16Array(count),deltas=new Float32Array(vertices.length),tangents=rest.map((_,i)=>tangent(rest,i));
 for(let i=0;i<count;i++){const k=i*3;let best=0,d=Infinity;for(let n=0;n<rest.length;n++){const p=rest[n],x=vertices[k]-p[0],y=vertices[k+1]-p[1],z=vertices[k+2]-p[2],next=x*x+y*y+z*z;if(next<d){d=next;best=n;}}indices[i]=best;for(let a=0;a<3;a++)deltas[k+a]=vertices[k+a]-rest[best][a];}
 const rotations=rest.map(()=>new T.Quaternion()),v=new T.Vector3(),direction=new T.Vector3();
 return (offset,parking,out=new Float32Array(vertices.length))=>{
  if(out.length!==vertices.length)throw Error('Wrong lead output size');
  if(offset.every(v=>v===0)&&!parking){out.set(vertices);return out;}
  const moved=monitorLeadPath(name,offset,parking);
  for(let i=0;i<moved.length;i++){if(i===0||i===moved.length-1)rotations[i].identity();else{const a=moved[i-1],b=moved[i+1];direction.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();rotations[i].setFromUnitVectors(tangents[i],direction);}}
  for(let i=0;i<count;i++){const n=indices[i],p=moved[n];v.fromArray(deltas,i*3).applyQuaternion(rotations[n]);out[i*3]=v.x+p[0];out[i*3+1]=v.y+p[1];out[i*3+2]=v.z+p[2];}return out;
 };
}
// Slab intersection tests the entire piecewise-linear path, not just its samples.
export function segmentIntersectsBox(a,b,min,max){
 let lo=0,hi=1;
 for(let k=0;k<3;k++){const d=b[k]-a[k];if(Math.abs(d)<1e-12){if(a[k]<min[k]||a[k]>max[k])return false;continue;}let x=(min[k]-a[k])/d,y=(max[k]-a[k])/d;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return false;}
 return true;
}
export function leadLidClear(points,offset,radius){
 const min=[-250-radius,-200+offset[1]-radius,36+offset[2]-radius],max=[250+radius,200+offset[1]+radius,130+offset[2]+radius];
 return points.slice(1).every((p,i)=>!segmentIntersectsBox(points[i],p,min,max));
}
export function leadMetrics(points){let length=0,minRadius=Infinity,maxTurn=0;for(let i=1;i<points.length;i++){const a=new T.Vector3(...points[i-1]),b=new T.Vector3(...points[i]);length+=a.distanceTo(b);if(i+1<points.length){const c=new T.Vector3(...points[i+1]),u=b.clone().sub(a),v=c.clone().sub(b),cross=u.clone().cross(v).length();maxTurn=Math.max(maxTurn,u.angleTo(v));if(cross>1e-9)minRadius=Math.min(minRadius,u.length()*v.length()*c.distanceTo(a)/(2*cross));}}return {length,minRadius,maxTurnDegrees:maxTurn*180/Math.PI};}

// Conservative solid envelopes for the fixed chassis panels and PSU, in CAD
// coordinates. Connector mouths and the monitor outlet are outside these boxes.
export function leadChassisClear(points,radius){
 const boxes=[
  [[-250,-200,0],[250,200,1]], [[-250,-200,1],[-249,200,40]],
  [[249,-200,1],[250,200,40]], [[-250,-200,1],[250,-199,40]],
  [[-250,199,1],[250,200,40]], [[94,-183,9],[238,186,114]]
 ];
 return boxes.every(([min,max])=>points.slice(1).every((p,i)=>!segmentIntersectsBox(points[i],p,min.map(v=>v-radius),max.map(v=>v+radius))));
}
