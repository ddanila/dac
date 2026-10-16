import * as T from 'three';
import {findPart} from './model-part-id.js';
export function remapPreviewPoints(root,original,proposal){
 root.updateWorldMatrix(true,true);
 return proposal.points.map((p,i)=>{
  const object=findPart(root,p.locator),matrix=object.matrixWorld.clone();
  if(p.instance!==undefined){const instance=new T.Matrix4();object.getMatrixAt(p.instance,instance);matrix.multiply(instance);}
  const old=original.points[i],saved=original.frame==='assembled'?old.assembledMatrix:old.displayedMatrix;
  const hasSaved=Array.isArray(saved)&&saved.length===16&&saved.every(Number.isFinite);
  const before=new T.Vector3(...old.local).applyMatrix4(hasSaved?new T.Matrix4().fromArray(saved):matrix),after=new T.Vector3(...p.local).applyMatrix4(matrix);
  return {before,after,capturedPlacement:hasSaved};
 });
}
export function createRemapPreview(scene){
 const group=new T.Group();group.name='measurement-remap-preview';scene.add(group);let current,last='';
 function clear(){current=null;last='';group.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});group.clear();}
 function draw(){if(!current)return;const points=remapPreviewPoints(current.root,current.original,current.proposal),signature=JSON.stringify(points);if(signature===last)return;last=signature;group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});group.clear();if(!current)return;
  const {root,original,proposal}=current;
  for(const p of points){
   for(const [point,color] of [[p.before,0xff954f],[p.after,0x58c9f3]]){const marker=new T.Mesh(new T.SphereGeometry(.009,12,8),new T.MeshBasicMaterial({color,depthTest:false}));marker.position.copy(point);marker.renderOrder=110;group.add(marker);}
   const delta=p.after.clone().sub(p.before),length=delta.length();if(length>1e-9){const arrow=new T.ArrowHelper(delta.normalize(),p.before,length,0xffffff,Math.min(.025,length*.3),Math.min(.012,length*.15));arrow.traverse(o=>{if(o.material){o.material.depthTest=false;o.renderOrder=109;}});group.add(arrow);}
  }
 }
 return {show(root,original,proposal){clear();current={root,original,proposal};draw();},clear,update(){if(current)draw();}};
}
