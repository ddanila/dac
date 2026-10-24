import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';

// This viewer consumes the proposed CAD assembly only. Historical scene meshes stay separate.
export async function createReferenceAssembly(host,data){
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.domElement.setAttribute('aria-label','Populated proposed reference controller');renderer.domElement.setAttribute('role','img');
 renderer.domElement.style.cssText='width:100%;height:300px;display:block;touch-action:none';host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#15232c');
 const camera=new THREE.PerspectiveCamera(35,1,.1,1200);camera.up.set(0,0,1);camera.position.set(0,-170,190);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,4);
 const geometries=new Set(),materials=new Set();let disposed=false,fitted=false;
 const material=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.7});materials.add(m);return m;};
 const plastic=material('#292a30'),metal=material('#b8bdc4'),passive=material('#a98a50'),green=material('#28533a'),copper=material('#e48d46');
 const add=(geometry,mat,target=scene)=>{geometries.add(geometry);const mesh=new THREE.Mesh(geometry,mat);target.add(mesh);return mesh;};
 const segments=new Map();
 const line=(a,b,width,mat=metal,target=scene)=>{
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);if(delta.length()<1e-8)return;
  const g=new THREE.CylinderGeometry(width/2,width/2,delta.length(),6),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());g.applyMatrix4(new THREE.Matrix4().compose(start.add(end).multiplyScalar(.5),q,new THREE.Vector3(1,1,1)));if(!segments.has(mat))segments.set(mat,[]);segments.get(mat).push(g);
 };
 function resize(){if(disposed)return;const width=Math.max(host.clientWidth,240);renderer.setSize(width,300,false);camera.aspect=width/300;if(!fitted){camera.position.set(0,-.67,.74).normalize().multiplyScalar(Math.max(145/camera.aspect,40)/Math.tan(THREE.MathUtils.degToRad(17.5)));controls.update();fitted=true;}camera.updateProjectionMatrix();render();}
 function render(){if(!disposed)renderer.render(scene,camera);}
 const observer=new ResizeObserver(resize);observer.observe(host);controls.addEventListener('change',render);
 scene.add(new THREE.HemisphereLight(0xffffff,0x666666,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(40,-60,180);scene.add(light);
 const shape=new THREE.Shape(data.layout.outlinePolygon.map(p=>new THREE.Vector2(...p)));
 for(const c of data.layout.components)for(const p of c.pads){if(p.drill[0]>0){const hole=new THREE.Path();hole.absarc(...p.position,p.drill[0]/2,0,Math.PI*2,true);shape.holes.push(hole);}}
 add(new THREE.ExtrudeGeometry(shape,{depth:1.6,bevelEnabled:false,curveSegments:8}),green);
 for(const r of data.layout.routes)for(let i=1;i<r.points.length;i++)line([...r.points[i-1],r.side==='top'?1.63:-.03],[...r.points[i],r.side==='top'?1.63:-.03],r.width,copper);
 for(const c of data.layout.components)for(const p of c.pads)for(const z of [-.04,1.64]){
  const pad=add(new THREE.RingGeometry(Math.max(p.drill[0]/2,.05),p.size[0]/2,12),metal);pad.scale.y=p.size[1]/p.size[0];pad.position.set(...p.position,z);if(z<0)pad.rotation.x=Math.PI;
 }
 for(const core of data.assembly.sharedBodies||[]){
  const [w,d,h]=core.outerSizeMm,[iw,id]=core.windowSizeMm;
  const outline=new THREE.Shape([new THREE.Vector2(-w/2,-d/2),new THREE.Vector2(w/2,-d/2),new THREE.Vector2(w/2,d/2),new THREE.Vector2(-w/2,d/2)]);
  const hole=new THREE.Path([new THREE.Vector2(-iw/2,-id/2),new THREE.Vector2(-iw/2,id/2),new THREE.Vector2(iw/2,id/2),new THREE.Vector2(iw/2,-id/2)]);outline.holes.push(hole);
  const body=add(new THREE.ExtrudeGeometry(outline,{depth:h,bevelEnabled:false}),plastic);body.position.set(...core.positionMm);
 }
 const cache=new Map(),loader=new STLLoader();
 function geometry(path){if(!cache.has(path))cache.set(path,loader.loadAsync(`${import.meta.env.BASE_URL}models/robotron-1715m/${path}`));return cache.get(path);}
 const tasks=[];
 for(const c of data.assembly.components){
  const group=new THREE.Group();group.position.set(...c.position);group.rotation.z=THREE.MathUtils.degToRad(c.rotation);scene.add(group);
  const [w,d,h]=c.sizeMm;
  if(c.mesh){tasks.push(geometry(c.mesh).then(g=>{if(disposed){g.dispose();return;}const body=add(g,plastic,group);body.rotation.z=-Math.PI/2;}));}
  else if(c.package==='transistor')add(new THREE.ExtrudeGeometry(new THREE.Shape(c.profile.map(p=>new THREE.Vector2(...p))),{depth:h,bevelEnabled:false}),plastic,group);
  else if(c.package==='axial'||c.package==='capacitor'){
   const axial=c.package==='axial',body=add(new THREE.CylinderGeometry((axial?d:w)/2,(axial?d:w)/2,axial?w:d,24),passive,group);
   body.position.z=h/2;if(axial)body.rotation.z=Math.PI/2;
  }else if(c.package!=='bridge'&&!c.sharedBody){const body=add(new THREE.BoxGeometry(w,d,h),passive,group);body.position.z=h/2;}
  for(const lead of c.leads)for(let i=1;i<lead.points.length;i++)line(lead.points[i-1],lead.points[i],lead.diameterMm);
 }
 for(const [mat,parts]of segments){add(mergeGeometries(parts),mat);for(const g of parts)g.dispose();}
 function dispose(){if(disposed)return;disposed=true;observer.disconnect();controls.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();renderer.domElement.remove();}
 try{await Promise.all(tasks);}catch(error){dispose();throw error;}
 controls.update();resize();renderer.domElement.dataset.ready="true";
 return {dispose,select(ref){
  const old=scene.getObjectByName('selection');if(old){old.removeFromParent();old.geometry.dispose();old.material.dispose();geometries.delete(old.geometry);materials.delete(old.material);}const c=data.assembly.components.find(c=>c.ref===ref);if(c){const b=c.boundsMm,box=new THREE.Box3(new THREE.Vector3(...b.map(v=>v[0])),new THREE.Vector3(...b.map(v=>v[1]))),helper=new THREE.Box3Helper(box,0xffef70);helper.name='selection';geometries.add(helper.geometry);materials.add(helper.material);scene.add(helper);}render();}};
}
