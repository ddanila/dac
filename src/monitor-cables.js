import * as T from 'three';
import data from './robotron-monitor-cable-paths.json' with {type:'json'};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export const monitorLeadDefinitions=data.leads;
export function monitorLeadPath(name,offset=[0,0,0],parking=0){
 const curves=data.leads[name]?.curves;if(!curves)throw Error('Unknown monitor lead');
 const amount=smooth(Math.abs(offset[2])/180);
 const moved=curves.map((curve,c)=>curve.map((p,i)=>{const w=c<2?1:1-smooth(i/3);return p.map((v,a)=>v+offset[a]*w+(a===1?parking*(1-w):0));}));
 const mix=(a,b,t=.5)=>a.map((v,k)=>v*(1-t)+b[k]*t);
 const [p0,p1,p2,p3]=moved[2],q0=mix(p0,p1),q1=mix(p1,p2),q2=mix(p2,p3),r0=mix(q0,q1),r1=mix(q1,q2),mid=mix(r0,r1);
 const baseline=[moved[0],moved[1],[p0,q0,r0,mid],[mid,r1,q2,p3]];
 // Route behind the lifted lid before descending towards the fixed plugs.
 const first=moved[0],a=first[3],b=[curves[1][3][0]+offset[0],280+offset[1],155+offset[2]],end=p3,corner=[b[0],b[1]+40,16+offset[2]],direction=new T.Vector3(...curves.at(-1)[2]).sub(new T.Vector3(...curves.at(-1)[3])).normalize(),exitDirection=new T.Vector3(...first[3]).sub(new T.Vector3(...first[2])).normalize();
 const routes=[first,[a,a.map((v,k)=>v+exitDirection.getComponent(k)*60),b.map((v,k)=>v+(k===2?60:0)),b],[b,b.map((v,k)=>v+(k===2?-60:0)),corner.map((v,k)=>v+(k===2?60:0)),corner],[corner,corner.map((v,k)=>v+(k===2?-60:0)),end.map((v,k)=>v+direction.getComponent(k)*60),end]];
 const blended=baseline.map((curve,c)=>curve.map((p,i)=>mix(p,routes[c][i],amount)));
 if(amount)for(let c=1;c<blended.length;c++){const prev=blended[c-1],next=blended[c],join=new T.Vector3(...next[0]),incoming=join.clone().sub(new T.Vector3(...prev[2])),outgoing=new T.Vector3(...next[1]).sub(join),axis=incoming.clone().normalize().add(outgoing.clone().normalize()).normalize();prev[2]=join.clone().addScaledVector(axis,-incoming.length()).toArray();next[1]=join.clone().addScaledVector(axis,outgoing.length()).toArray();}
 const points=[];
 blended.forEach((controls,c)=>{for(let i=c?1:0;i<=48;i++){const t=i/48;points.push(controls[0].map((_,k)=>(1-t)**3*controls[0][k]+3*(1-t)**2*t*controls[1][k]+3*(1-t)*t*t*controls[2][k]+t**3*controls[3][k]));}});

 points[0]=moved[0][0].slice();points[points.length-1]=p3.slice();
 return points;
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
