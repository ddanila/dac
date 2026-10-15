import {collectionRecords,mergeCollection,digest} from './session-store.js';
import {base64} from './recording.js';
const LIMIT=128*1024*1024;
function plain(value,depth=0){
 if(depth>20)throw Error('Collection nesting is too deep.');
 if(value===undefined)return {$undefined:true};
 if(value instanceof ArrayBuffer)return {$bytes:base64(value)};
 if(Array.isArray(value))return value.map(v=>plain(v,depth+1));
 if(value && typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,plain(value[k],depth+1)]));
 if(value===null || ['string','number','boolean'].includes(typeof value))return value;
 throw Error('Unsupported collection value.');
}
function unpack(value,depth=0){
 if(depth>20)throw Error('Collection nesting is too deep.');
 if(Array.isArray(value))return value.map(v=>unpack(v,depth+1));
 if(value && typeof value==='object'){
  if(value.$undefined===true && Object.keys(value).length===1)return undefined;
  if(Object.hasOwn(value,'$bytes')){
   // Individual native snapshots can exceed the recording media limit.
   const s=value.$bytes;if(typeof s!=='string'||s.length>8*1024*1024||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid collection bytes.');
   return Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;
  }
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,unpack(v,depth+1)]));
 }
 return value;
}
async function validate(rows){
 if(!Array.isArray(rows)||rows.length>10000)throw Error('Invalid collection records.');
 const keys=new Set();
 for(const row of rows){
  if(!Array.isArray(row)||row.length!==2)throw Error('Invalid collection entry.');
  const [key,r]=row;
  if(typeof key!=='string'||key.length>4096||! /^(library:|state:|disk:|disk-b:|mounts:)/.test(key)||keys.has(key))throw Error('Invalid or duplicate collection key.');
  keys.add(key);
  const check=async v=>{if(!(v?.bytes instanceof ArrayBuffer)||(await digest(v.bytes))!==v.sha256)throw Error('Saved record failed its checksum: '+key);};
  if(key.startsWith('mounts:')){
   if(!Array.isArray(r)||r.length>2)throw Error('Invalid saved drive mounts.');
   for(const v of r)if(v && !v.empty)await check(v);
  }else{
   await check(r);
   if(key.startsWith('library:') && (typeof r.name!=='string'||!r.name.trim()||r.name.length>80||![0,1,2].includes(r.kind)||!(r.original instanceof ArrayBuffer)||await digest(r.original)!==r.originalHash))throw Error('Invalid library disk.');
  }
 }
}
export async function exportCollection(){
 const rows=await collectionRecords();await validate(rows);
 const payload=JSON.stringify(plain(rows));
 if(payload.length>LIMIT)throw Error('Collection exceeds the 128 MiB backup limit. Export disks separately.');
 const bytes=new TextEncoder().encode(JSON.stringify({format:'DAC-collection-1',sha256:await digest(new TextEncoder().encode(payload)),payload})).buffer;
 if(bytes.byteLength>LIMIT)throw Error('Collection exceeds the 128 MiB backup limit.');return bytes;
}
export async function importCollection(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>LIMIT)throw Error('Collection exceeds 128 MiB.');
 const file=JSON.parse(new TextDecoder().decode(bytes));
 if(file.format!=='DAC-collection-1'||typeof file.payload!=='string'||await digest(new TextEncoder().encode(file.payload))!==file.sha256)throw Error('Collection integrity check failed.');
 const rows=unpack(JSON.parse(file.payload));await validate(rows);
 return mergeCollection(rows,(a,b)=>JSON.stringify(plain(a))===JSON.stringify(plain(b)));
}
export function createCollectionPanel(send){
 const panel=document.createElement('details');panel.id='collection-controls';
 panel.innerHTML=`<summary>Back up the whole collection</summary><p>Includes saved disks, originals, saved machine states and drive assignments from this browser. Save the current machine state first; unsaved work and separately selected firmware files are not included. Restoring states still requires matching media and firmware.</p><button id="collection-export">Download collection backup</button><label>Restore collection<input id="collection-import" type="file" accept=".daccollection"></label><button id="collection-usage">Check browser storage</button><p id="collection-status" role="status"></p>`;
 document.getElementById('session-controls').after(panel);
 const status=panel.querySelector('#collection-status');
 panel.querySelector('#collection-export').onclick=()=>send({type:'collection-export'});
 panel.querySelector('#collection-import').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>LIMIT){status.textContent='Choose a backup smaller than 128 MiB.';return;}send({type:'collection-import',bytes:await f.arrayBuffer()});e.target.value='';};
 panel.querySelector('#collection-usage').onclick=async()=>{try{const s=await navigator.storage.estimate();status.textContent=`This origin uses approximately ${(s.usage/1048576).toFixed(1)} MiB of ${(s.quota/1048576).toFixed(0)} MiB available quota. Browser storage is not a backup.`;}catch(e){status.textContent=e.message;}};
 return {message(d){if(d.type==='collection-status')status.textContent=d.message;}};
}
