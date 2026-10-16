import {validateCheckpoint} from './checkpoints.js';
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
  if(typeof key!=='string'||key.length>4096||! /^(library:|state:|disk:|disk-b:|mounts:|checkpoint:|comparison:)/.test(key)||keys.has(key))throw Error('Invalid or duplicate collection key.');
  keys.add(key);
  const check=async v=>{if(!(v?.bytes instanceof ArrayBuffer)||(await digest(v.bytes))!==v.sha256)throw Error('Saved record failed its checksum: '+key);};
  if(key.startsWith('checkpoint:')){await validateCheckpoint(r);}
  else if(key.startsWith('mounts:')){
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
async function readCollection(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>LIMIT)throw Error('Collection exceeds 128 MiB.');
 const file=JSON.parse(new TextDecoder().decode(bytes));
 if(file.format!=='DAC-collection-1'||typeof file.payload!=='string'||await digest(new TextEncoder().encode(file.payload))!==file.sha256)throw Error('Collection integrity check failed.');
 const rows=unpack(JSON.parse(file.payload));await validate(rows);
 return rows;
}
const equal=(a,b)=>JSON.stringify(plain(a))===JSON.stringify(plain(b));
export async function previewCollection(bytes){
 const rows=await readCollection(bytes),existing=new Map(await collectionRecords());
 return rows.map(([key,value])=>({key,name:value.name||key,size:value.bytes?.byteLength||0,
  status:!existing.has(key)?'new':equal(existing.get(key),value)?'identical':'conflict',
  dependencies:[...new Set((key+' '+JSON.stringify(plain(value))).match(/library:[a-f0-9-]{36}/g)||[])].filter(id=>id!==key)}));
}
export async function importCollection(bytes,choices){
 let rows=await readCollection(bytes);
 if(!choices)return mergeCollection(rows,equal);
 const available=new Map(rows),existing=new Map(await collectionRecords()),remap=new Map();
 for(const [key,action] of Object.entries(choices)){
  if(!available.has(key)||!['skip','restore','replace','copy'].includes(action))throw Error('Invalid restore choice.');
  if(action==='copy'){
   if(!key.startsWith('library:'))throw Error('Only library disks can be copied.');
   remap.set(key,'library:'+crypto.randomUUID());
  }
 }
 const rewriteString=value=>value.replace(/library:[a-f0-9-]{36}/g,id=>remap.get(id)||id);
 const rewrite=value=>typeof value==='string'?rewriteString(value):value instanceof ArrayBuffer?value:Array.isArray(value)?value.map(rewrite):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)])):value;
 const selected=rows.filter(([key])=>choices[key]&&choices[key]!=='skip');
 for(const [key,value] of selected){
  const deps=(key+' '+JSON.stringify(plain(value))).match(/library:[a-f0-9-]{36}/g)||[];
  for(const id of deps)if(id!==key&&!selected.some(([k])=>k===id)&&!existing.has(id))throw Error('Select the dependent library disk: '+id);
 }
 rows=selected.map(([key,value])=>{const next=rewrite(value);if(remap.has(key))next.name=(next.name.slice(0,65)+' (restored copy)').slice(0,80);return [rewriteString(key),next];});
 // Expected values are checked again inside the write transaction, including other-tab changes.
 const replace=new Map(selected.filter(([key])=>choices[key]==='replace').map(([key])=>[rewriteString(key),existing.get(rewriteString(key))]));
 return mergeCollection(rows,equal,replace);
}
export function createCollectionPanel(send){
 const panel=document.createElement('details');panel.id='collection-controls';
 panel.innerHTML=`<summary>Back up the whole collection</summary><p>Includes saved disks, originals, saved machine states, named checkpoints, comparison baselines and drive assignments from this browser. Save the current machine state first; unsaved work and separately selected firmware files are not included. Restoring states still requires matching media and firmware.</p><button id="collection-export">Download collection backup</button><label>Restore collection<input id="collection-import" type="file" accept=".daccollection"></label><div id="collection-preview"></div><button id="collection-restore" hidden>Restore selected records</button><button id="collection-usage">Check browser storage</button><p id="collection-status" role="status"></p>`;
 document.getElementById('session-controls').after(panel);
 const status=panel.querySelector('#collection-status');
 panel.querySelector('#collection-export').onclick=()=>send({type:'collection-export'});
 let backup=null;
 const preview=panel.querySelector('#collection-preview'),restore=panel.querySelector('#collection-restore');
 panel.querySelector('#collection-import').onchange=async e=>{
  backup=null;restore.hidden=true;preview.replaceChildren();const f=e.target.files[0];if(!f)return;
  try{if(f.size>LIMIT)throw Error('Choose a backup smaller than 128 MiB.');const bytes=await f.arrayBuffer(),rows=await previewCollection(bytes);backup=bytes;
   for(const row of rows){const label=document.createElement('label'),select=document.createElement('select');select.dataset.key=row.key;
    const actions=row.status==='identical'?['skip','restore']:row.status==='conflict'?['skip','replace',...(row.key.startsWith('library:')?['copy']:[])]:['restore','skip'];
    for(const action of actions)select.add(new Option({skip:'Keep existing / skip',replace:'Replace existing',copy:'Keep both',restore:'Restore'}[action],action));
    label.append(document.createTextNode(`${row.name} · ${row.status} · ${row.size} bytes `),select);preview.append(label,document.createElement('br'));
   }restore.hidden=false;status.textContent=`Verified ${rows.length} records. Select dependent library disks with states. Replacing a record overwrites its saved copy.`;
  }catch(error){status.textContent=error.message;}finally{e.target.value='';}
 };
 restore.onclick=()=>{if(backup)send({type:'collection-import',bytes:backup,choices:Object.fromEntries([...preview.querySelectorAll('select')].map(e=>[e.dataset.key,e.value]))});};
 panel.querySelector('#collection-usage').onclick=async()=>{try{const s=await navigator.storage.estimate();status.textContent=`This origin uses approximately ${(s.usage/1048576).toFixed(1)} MiB of ${(s.quota/1048576).toFixed(0)} MiB available quota. Browser storage is not a backup.`;}catch(e){status.textContent=e.message;}};
 return {message(d){if(d.type==='collection-status')status.textContent=d.message;}};
}
