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
 const rest=monitorLeadPath(name),bindings=[];
 for(let i=0;i<vertices.length;i+=3){const v=new T.Vector3().fromArray(vertices,i);let best=0,d=Infinity;rest.forEach((p,n)=>{const next=v.distanceToSquared(new T.Vector3(...p));if(next<d){d=next;best=n;}});bindings.push({index:best,delta:v.sub(new T.Vector3(...rest[best])),tangent:tangent(rest,best)});}
 return (offset,parking)=>{if(offset.every(v=>v===0)&&!parking)return vertices.slice();const moved=monitorLeadPath(name,offset,parking),rotations=moved.map((_,i)=>(i===0||i===moved.length-1)?new T.Quaternion():new T.Quaternion().setFromUnitVectors(tangent(rest,i),tangent(moved,i))),out=new Float32Array(vertices.length);bindings.forEach((b,i)=>b.delta.clone().applyQuaternion(rotations[b.index]).add(new T.Vector3(...moved[b.index])).toArray(out,i*3));return out;};
}
export function leadMetrics(points){let length=0,minRadius=Infinity,maxTurn=0;for(let i=1;i<points.length;i++){const a=new T.Vector3(...points[i-1]),b=new T.Vector3(...points[i]);length+=a.distanceTo(b);if(i+1<points.length){const c=new T.Vector3(...points[i+1]),u=b.clone().sub(a),v=c.clone().sub(b),cross=u.clone().cross(v).length();maxTurn=Math.max(maxTurn,u.angleTo(v));if(cross>1e-9)minRadius=Math.min(minRadius,u.length()*v.length()*c.distanceTo(a)/(2*cross));}}return {length,minRadius,maxTurnDegrees:maxTurn*180/Math.PI};}
