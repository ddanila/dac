import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {createInspectionStage} from './inspection-stage.js';
import {loadPcbLabels} from './robotron-interior.js';
import {modelAsset} from './model-assets.js';

export function createChipViewer(host,entry){
 let disposed=false,stage;const resources=new Set();
 host.textContent='Loading package model…';
 const dispose=()=>{disposed=true;stage?.dispose();for(const r of resources)r.dispose();host.replaceChildren();};
 const ready=(async()=>{
  const base=new URL('models/robotron-1715m/',new URL(import.meta.env.BASE_URL,location.origin));
  const p=entry.component,definition=entry.packageModel,loader=new STLLoader();
  const geometry=await Promise.all(['body','leads'].map(async k=>{const m=definition.meshes[k];const g=await loader.loadAsync(modelAsset(m.file,base,m.sha256).href);if(disposed)g.dispose();else resources.add(g);return g;}));
  if(disposed)return;
  stage=createInspectionStage(host,{near:.1,far:500});const group=new THREE.Group();group.rotation.x=-Math.PI/2;stage.scene.add(group);
  geometry.forEach((g,i)=>{const material=new THREE.MeshStandardMaterial({color:i?0xbfc0b9:0x30312f,roughness:i?.3:.7,metalness:i?.85:0});resources.add(material);group.add(new THREE.Mesh(g,material));});
  const labels=loadPcbLabels({pcbComponents:{instances:[{...p,position:[0,0,0],rotation:0,side:1}],models:[definition]}});
  for(const label of labels){label.visible=true;group.add(label);resources.add(label.geometry);resources.add(label.material);resources.add(label.material.map);}
  const length=definition.bodySize[1];stage.camera.position.set(length*.65,length*1.1,length*.9);stage.controls.target.set(0,1,0);stage.controls.minDistance=length*.6;stage.controls.maxDistance=length*4;stage.controls.update();stage.invalidate();
 })().catch(()=>{if(disposed)return;stage?.dispose();for(const r of resources)r.dispose();resources.clear();disposed=true;host.textContent='Package preview unavailable. The photograph and evidence remain available.';});
 return {dispose,ready};
}
