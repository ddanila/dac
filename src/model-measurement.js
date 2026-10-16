import * as T from 'three';
export function createMeasurement(scene,notify){
 let enabled=false,points=[],scale=.0025,last='',root,identity={},frame='displayed',snap=false,visible=()=>true;
 const originals=new WeakMap(),group=new T.Group();scene.add(group);
 const material=new T.MeshBasicMaterial({color:0xffd34d,depthTest:false});
 const markers=[0,1].map(()=>{const m=new T.Mesh(new T.SphereGeometry(.008,12,8),material);m.renderOrder=100;group.add(m);return m;});
 const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xffd34d,depthTest:false}));line.renderOrder=100;group.add(line);group.visible=false;
 function matrix(p,assembled=false){
  p.object.updateWorldMatrix(true,false);const original=originals.get(p.object),m=(assembled&&original?original.matrix:p.object.matrixWorld).clone();
  if(p.instanceId!==undefined){const instance=new T.Matrix4();if(assembled&&original?.instances)instance.fromArray(original.instances,p.instanceId*16);else p.object.getMatrixAt(p.instanceId,instance);m.multiply(instance);}return m;
 }
 const world=(p,assembled=false)=>p.local.clone().applyMatrix4(matrix(p,assembled));
 function path(object){const indices=[];for(let o=object;o&&o!==root;o=o.parent)indices.unshift(o.parent?.children.indexOf(o)??-1);return indices;}
 function choose(hit,slot){
  const point={object:hit.object,instanceId:hit.instanceId,local:new T.Vector3()};point.local.copy(hit.point).applyMatrix4(matrix(point).invert());
  if(snap&&hit.face){const attr=hit.object.geometry.attributes.position,candidates=[hit.face.a,hit.face.b,hit.face.c].map(i=>new T.Vector3().fromBufferAttribute(attr,i));candidates.sort((a,b)=>a.distanceToSquared(point.local)-b.distanceToSquared(point.local));point.local.copy(candidates[0]);point.snapped=true;}
  if(!visible(world(point)))throw Error('The snapped point is clipped. Choose a visible vertex or disable snapping.');
  if(slot!==undefined)points[slot]=point;else{if(points.filter(Boolean).length===2)points=[];points[points[0]?1:0]=point;}update();
 }
 function update(){
  group.visible=enabled;markers.forEach((m,i)=>{m.visible=enabled&&!!points[i]&&visible(world(points[i]));if(points[i])m.position.copy(world(points[i]));});
  line.visible=enabled&&points.filter(Boolean).length===2&&markers.every(m=>m.visible);
  if(points.filter(Boolean).length===2){
   const a=world(points[0],frame==='assembled'),b=world(points[1],frame==='assembled'),delta=b.clone().sub(a).divideScalar(scale);
   if(line.visible)line.geometry.setFromPoints(points.map(p=>world(p)));
   const value={millimetres:delta.length(),axes:{x:delta.x,y:delta.y,z:delta.z},classification:'Model-derived estimate',frame,identity,points:points.map(p=>({part:p.object.name,path:path(p.object),instance:p.instanceId,local:p.local.toArray(),snapped:!!p.snapped,displayedMatrix:matrix(p).toArray(),assembledMatrix:matrix(p,true).toArray()}))};
   const text=JSON.stringify(value);if(text!==last){last=text;notify(value);}
  }else if(last!=='pending'){last='pending';notify(null);}
 }
 return {
  get enabled(){return enabled;},set(value){enabled=value;update();},pick:choose,update,clear(){points=[];update();},scale(value){scale=value;},
  configure(model,modelIdentity){root=model;identity=modelIdentity;root.updateWorldMatrix(true,true);root.traverse(o=>originals.set(o,{matrix:o.matrixWorld.clone(),instances:o.isInstancedMesh?o.instanceMatrix.array.slice():null}));},
  options(value){if(value.frame)frame=value.frame==='assembled'?'assembled':'displayed';if(value.snap!==undefined)snap=!!value.snap;if(value.visible)visible=value.visible;update();},
  restore(record){
   if(!root||record.format!=='DAC-model-measurement-2'||JSON.stringify(record.identity)!==JSON.stringify(identity)||!Array.isArray(record.points)||record.points.length!==2)throw Error('Measurement model identity does not match this exhibit.');
   const next=record.points.map(p=>{if(!Array.isArray(p.path)||p.path.length>40||!p.path.every(i=>Number.isInteger(i)&&i>=0)||!Array.isArray(p.local)||p.local.length!==3||!p.local.every(v=>Number.isFinite(v)&&Math.abs(v)<100000))throw Error('Invalid measurement point.');let object=root;for(const i of p.path)object=object?.children[i];if(!object?.isMesh||object.name!==p.part||(object.isInstancedMesh&&p.instance===undefined)||(p.instance!==undefined&&(!object.isInstancedMesh||!Number.isInteger(p.instance)||p.instance<0||p.instance>=object.count)))throw Error('Measurement part does not match.');return {object,instanceId:p.instance,local:new T.Vector3(...p.local),snapped:!!p.snapped};});
   points=next;frame=record.frame==='assembled'?'assembled':'displayed';enabled=true;last='';update();
  },
  centre(object,slot){object.geometry.computeBoundingBox();const point=object.geometry.boundingBox.getCenter(new T.Vector3());object.updateWorldMatrix(true,false);choose({object,point:object.localToWorld(point)},slot);}
 };
}
