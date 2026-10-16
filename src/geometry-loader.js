import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {detailedGeometry,decodeGeometry} from './geometry-codec.js';
import {modelAsset} from './model-assets.js';
const manifests=new Map(),meshes=new Map(),packs=new Map();
const packed=new URLSearchParams(globalThis.location?.search).has("geometryPacks");
const checksum=async bytes=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(b=>b.toString(16).padStart(2,"0")).join("");
let decoder,sequence=0;const pending=new Map();
function backgroundDecode(compressed){
 if(!decoder){decoder=new Worker(new URL('./geometry-decode.worker.js',import.meta.url),{type:'module'});decoder.onmessage=({data})=>{const task=pending.get(data.id);if(!task)return;pending.delete(data.id);data.error?task.reject(Error(data.error)):task.resolve(decodeGeometry(data.buffer,data.bounds));};decoder.onerror=()=>{for(const task of pending.values())task.reject(Error('Geometry worker failed'));pending.clear();decoder.terminate();decoder=null;};}
 return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});decoder.postMessage({id,compressed},[compressed]);});
}
export function loadGeometry(record,base,angle=Math.PI/4){
 const key=base.href+record.sha256+':'+angle;
 if(!meshes.has(key)){const promise=load(record,base,angle);meshes.set(key,promise);promise.catch(()=>meshes.delete(key));}return meshes.get(key);
}
async function load(record,base,angle){
 const key=base.href;
 if(!manifests.has(key))manifests.set(key,fetch(modelAsset('geometry-cache.json',base),{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null));
 const manifest=await manifests.get(key),entry=manifest?.format===1&&manifest.pipeline==='three-0.186.1-creased-indexed'?manifest.entries?.[record.sha256+':'+angle]:null;
 if(entry && typeof DecompressionStream!=='undefined'){
  try{
   let compressed;
   if(packed&&entry.pack){const pack=entry.pack,key=base.href+pack.sha256;
    if(!packs.has(key))packs.set(key,(async()=>{const r=await fetch(modelAsset(pack.file,base,pack.sha256));if(!r.ok)throw Error('Pack unavailable');const bytes=await r.arrayBuffer();if(await checksum(bytes)!==pack.sha256)throw Error('Pack checksum mismatch');return bytes;})());
    const bytes=await packs.get(key);if(pack.offset<0||pack.length<1||pack.offset+pack.length>bytes.byteLength)throw Error('Invalid pack range');compressed=bytes.slice(pack.offset,pack.offset+pack.length);
   }else{const response=await fetch(modelAsset(entry.file,base,entry.sha256));if(!response.ok)throw Error('Cache unavailable');compressed=await response.arrayBuffer();}
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',compressed))].map(b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==entry.sha256)throw Error('Cache checksum mismatch');
   if(new URLSearchParams(globalThis.location?.search).has('geometryWorker'))return await backgroundDecode(compressed);
   return decodeGeometry(await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }catch{/* Derived asset failure falls back to the canonical STL. */}
 }
 return detailedGeometry(await new STLLoader().loadAsync(modelAsset(record.file,base,record.sha256).href),angle);
}
