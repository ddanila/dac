const ease = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Exact plug ends move together; board/PSU ends stay anchored. The middle is
// illustrative deformation, not a measurement of available cable slack.
export function cableWeight(name,x,y,z){
 return name.startsWith('ribbon-') ? ease((100-y)/55)*ease((z-53)/13) : ease((-20-x)/30);
}

const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function side(path,i){
 const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)];
 const v=[b[1]-a[1],a[0]-b[0],0],n=Math.hypot(...v);
 return n>.001?v.map(x=>x/n):[1,0,0];
}
// Bind exported ribbon vertices to the same sections that generated the SCAD
// mesh. Move section centres, then rotate their cross sections rigidly: the
// 33 mm ribbon, conductor ridges and stripe cannot widen during inspection.
export function bindRibbon(vertices,paths){
 const sections=paths.flatMap((path,p)=>path.map((center,i)=>({p,i,center,side:side(path,i)})));
 const bindings=[];
 for(let n=0;n<vertices.length;n+=3){
  const v=Array.from(vertices.slice(n,n+3));let best,score=Infinity;
  for(const s of sections){
   const delta=sub(v,s.center),lateral=dot(delta,s.side);
   const remaining=delta.map((x,i)=>x-s.side[i]*Math.max(-17,Math.min(17,lateral)));
   const distance=dot(remaining,remaining);
   if(distance<score){score=distance;best={...s,delta};}
  }
  bindings.push(best);
 }
 return (split,parked=false,parking=18)=>{
  const moved=paths.map(path=>path.map(c=>{
   const w=cableWeight('ribbon-cables',...c);
   return [c[0],c[1]+split*(parked?parking:-145)*w,c[2]+split*(parked?0:115)*w];
  }));
  const out=new Float32Array(vertices.length);
  for(let n=0;n<bindings.length;n++){
   const b=bindings[n],fixed=cableWeight("ribbon-cables",...b.center)===0;
   const s=fixed?b.side:side(moved[b.p],b.i),c=moved[b.p][b.i];
   const cos=dot(b.side,s),sin=b.side[0]*s[1]-b.side[1]*s[0],d=b.delta;
   out.set([c[0]+cos*d[0]-sin*d[1],c[1]+sin*d[0]+cos*d[1],c[2]+d[2]],n*3);
  }
  return out;
 };
}
