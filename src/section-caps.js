import * as T from 'three';
// Build caps only for unambiguous closed intersection loops. Open, tangent and
// non-manifold contours are rejected rather than inventing missing surfaces.
export function sectionCap(geometry,matrix,plane){
 const attr=geometry.attributes.position,index=geometry.index,count=index?.count??attr.count;
 if(count>150000)return null;
 const normal=plane.normal,u=new T.Vector3().crossVectors(normal,Math.abs(normal.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0)).normalize(),v=new T.Vector3().crossVectors(normal,u),origin=plane.coplanarPoint(new T.Vector3());
 const nodes=new Map(),edges=new Set(),key=p=>p.toArray().map(n=>Math.round(n/1e-7)).join(',');
 const add=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{p,next:[]});return k;};
 for(let i=0;i<count;i+=3){const p=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(attr,index?index.getX(i+j):i+j).applyMatrix4(matrix)),d=p.map(q=>plane.distanceToPoint(q)),hits=[];
  if(d.some(n=>Math.abs(n)<1e-9))return null;
  for(let j=0;j<3;j++){const k=(j+1)%3;if(d[j]*d[k]<0)hits.push(p[j].clone().lerp(p[k],d[j]/(d[j]-d[k])));}
  if(hits.length===2){const a=add(hits[0]),b=add(hits[1]);if(a===b)continue;const e=[a,b].sort().join('|');if(edges.has(e))return null;edges.add(e);nodes.get(a).next.push(b);nodes.get(b).next.push(a);}
 }
 if(!nodes.size||[...nodes.values()].some(n=>n.next.length!==2))return null;
 const loops=[],seen=new Set();for(const start of nodes.keys()){if(seen.has(start))continue;let current=start,previous=null;const loop=[];do{if(seen.has(current))return null;seen.add(current);const n=nodes.get(current),delta=n.p.clone().sub(origin);loop.push(new T.Vector2(delta.dot(u),delta.dot(v)));const next=n.next.find(k=>k!==previous);previous=current;current=next;}while(current!==start);if(loop.length<3)return null;loops.push(loop);}
 const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;};
 const depths=loops.map((loop,i)=>loops.filter((other,j)=>i!==j&&inside(loop[0],other)).length),positions=[];
 for(let i=0;i<loops.length;i++){if(depths[i]%2)continue;const holes=loops.filter((loop,j)=>depths[j]===depths[i]+1&&inside(loop[0],loops[i])),flat=[loops[i],...holes].flat();for(const face of T.ShapeUtils.triangulateShape(loops[i],holes))for(const n of face){const p=origin.clone().addScaledVector(u,flat[n].x).addScaledVector(v,flat[n].y);positions.push(...p.toArray());}}
 if(!positions.length)return null;const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.computeVertexNormals();return result;
}
export function clearCaps(group){for(const mesh of [...group.children]){mesh.geometry.dispose();mesh.material.dispose();group.remove(mesh);}}
export function buildCaps(root,plane,group){clearCaps(group);root.updateWorldMatrix(true,true);root.traverseVisible(o=>{if(!/^(case-base|case-lid|fascia|keyboard-shell|keyboard-deck|monitor-shell.*|bezel|ring)$/.test(o.name)||!o.isMesh||o.isInstancedMesh||!o.geometry||Array.isArray(o.material)||o.material.transparent)return;const g=sectionCap(o.geometry,o.matrixWorld,plane);if(g){const m=new T.MeshStandardMaterial({color:o.material.color,roughness:.8,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});const mesh=new T.Mesh(g,m);mesh.name='section-cap';group.add(mesh);}});return group.children.length;}
