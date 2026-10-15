import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {detailedGeometry,decodeGeometry} from './geometry-codec.js';
import {modelAsset} from './model-assets.js';
const manifests=new Map(),meshes=new Map();
export function loadGeometry(record,base,angle=Math.PI/4){
 const key=base.href+record.sha256+':'+angle;
 if(!meshes.has(key)){const promise=load(record,base,angle);meshes.set(key,promise);promise.catch(()=>meshes.delete(key));}return meshes.get(key);
}
async function load(record,base,angle){
 const key=base.href;
 if(!manifests.has(key))manifests.set(key,fetch(modelAsset('geometry-cache.json',base),{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null));
 const manifest=await manifests.get(key),entry=manifest?.format===1?manifest.entries?.[record.sha256+':'+angle]:null;
 if(entry && typeof DecompressionStream!=='undefined'){
  try{
   const response=await fetch(modelAsset(entry.file,base,entry.sha256));if(!response.ok)throw Error('Cache unavailable');
   const compressed=await response.arrayBuffer();
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',compressed))].map(b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==entry.sha256)throw Error('Cache checksum mismatch');
   return decodeGeometry(await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }catch{/* Derived asset failure falls back to the canonical STL. */}
 }
 return detailedGeometry(await new STLLoader().loadAsync(modelAsset(record.file,base,record.sha256).href),angle);
}
