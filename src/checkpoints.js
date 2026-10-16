import {base64} from './recording.js';
import {stored,storedKeys,checkedRecord,digest} from './session-store.js';
export async function checkpoints(){
 const keys=(await storedKeys()).filter(k=>k.startsWith('checkpoint:'));
 return (await Promise.all(keys.map(async key=>{let r;try{r=await stored(key);await validateCheckpoint(r);return {key,name:r.name,date:r.date,kind:r.kind,build:r.build};}catch(e){return {key,name:typeof r?.name==='string'?r.name:'Damaged checkpoint',date:Number.isFinite(r?.date)?r.date:0,invalid:e.message};}}))).sort((a,b)=>b.date-a.date);
}
export async function validateCheckpoint(r){
 if(!r||!Number.isFinite(r.date)||typeof r.name!=='string'||!r.name.trim()||r.name.length>80||![0,1,2].includes(r.kind)||!/^state:[a-f0-9]{64}:/.test(r.stateKey)||!/^[a-f0-9]{64}$/.test(r.build)||r.stateKey.split(':')[1]!==r.build||typeof r.firmwareIdentity!=='string'||r.firmwareIdentity.length>4096||r.stateKey.length>4096||!Array.isArray(r.disks)||r.disks.length!==2)throw Error('Invalid checkpoint metadata.');
 if(!(r.bytes instanceof ArrayBuffer)||r.bytes.byteLength>4*1024*1024||await digest(r.bytes)!==r.sha256)throw Error('Checkpoint state checksum failed.');
 for(const disk of r.disks)if(!(disk.bytes instanceof ArrayBuffer)||disk.bytes.byteLength>2*1024*1024||await digest(disk.bytes)!==disk.sha256||typeof disk.writable!=='boolean'||typeof disk.label!=='string'||disk.label.length>200)throw Error('Checkpoint disk checksum or metadata failed.');
}
export async function saveCheckpoint(record){
 if((await checkpoints()).length>=20)throw Error('Keep at most 20 checkpoints. Export a collection backup and remove an older checkpoint first.');
 const r={...record,name:String(record.name).trim(),date:Date.now(),sha256:await digest(record.bytes)};await validateCheckpoint(r);
 const key='checkpoint:'+crypto.randomUUID();await stored(key,r);return key;
}
export async function loadCheckpoint(key){if(!/^checkpoint:[a-f0-9-]{36}$/.test(key))throw Error('Choose a checkpoint.');const r=await checkedRecord(key);await validateCheckpoint(r);return r;}
export async function renameCheckpoint(key,name){const r=await loadCheckpoint(key);r.name=String(name).trim();await validateCheckpoint(r);await stored(key,r);}
export async function deleteCheckpoint(key){if(!/^checkpoint:[a-f0-9-]{36}$/.test(key))throw Error('Choose a checkpoint.');await stored(key,null);}
export async function exportCheckpoint(key){const r=await loadCheckpoint(key),payload={...r,bytes:base64(r.bytes),disks:r.disks.map(d=>({...d,bytes:base64(d.bytes)}))};return new TextEncoder().encode(JSON.stringify({format:'DAC-checkpoint-1',payload,sha256:await digest(new TextEncoder().encode(JSON.stringify(payload)))})).buffer;}
export async function importCheckpoint(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength>16*1024*1024)throw Error('Checkpoint file exceeds 16 MB.');
 const file=JSON.parse(new TextDecoder().decode(bytes));if(file.format!=='DAC-checkpoint-1'||await digest(new TextEncoder().encode(JSON.stringify(file.payload)))!==file.sha256)throw Error('Checkpoint file checksum failed.');
 const decode=(text,max)=>{if(typeof text!=='string'||text.length>Math.ceil(max/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))throw Error('Invalid checkpoint byte encoding.');const b=Uint8Array.from(atob(text),c=>c.charCodeAt(0));if(b.byteLength>max)throw Error('Checkpoint data too large.');return b.buffer;};
 const p=file.payload;if(!Array.isArray(p.disks)||p.disks.length!==2)throw Error('Invalid checkpoint disks.');
 const r={...p,bytes:decode(p.bytes,4*1024*1024),disks:p.disks.map(d=>({...d,bytes:decode(d.bytes,2*1024*1024)}))};await validateCheckpoint(r);return saveCheckpoint(r);
}
export function createCheckpointPanel(send){
 const panel=document.createElement('details');panel.id='checkpoint-controls';panel.innerHTML=`<summary>Named checkpoints</summary><p>Save the running machine with both disks. Restoring opens private disk copies and keeps existing library disks intact. Load the same firmware first. Checkpoints are included in collection backups.</p><label>Name <input id="checkpoint-name" maxlength="80" placeholder="Before formatting"></label><button id="checkpoint-save">Save checkpoint</button><label>Saved checkpoints <select id="checkpoint-list"></select></label><button id="checkpoint-refresh">Refresh list</button><button id="checkpoint-restore">Restore selected checkpoint</button><button id="checkpoint-delete">Delete selected checkpoint</button><button id="checkpoint-rename">Rename using name above</button><button id="checkpoint-export">Export selected checkpoint</button><label>Import checkpoint <input id="checkpoint-import" type="file" accept=".daccheckpoint,application/json"></label><button id="checkpoint-preview">Check compatibility</button><p id="checkpoint-compatibility" role="status"></p><p role="status" id="checkpoint-status"></p>`;
 document.getElementById('session-controls').after(panel);const $=id=>panel.querySelector('#'+id);
 $('checkpoint-save').onclick=()=>send({type:'checkpoint-save',name:$('checkpoint-name').value});
 for(const action of ['restore','delete','export','preview'])$('checkpoint-'+action).onclick=()=>send({type:'checkpoint-'+action,key:$('checkpoint-list').value});
 $('checkpoint-rename').onclick=()=>send({type:'checkpoint-rename',key:$('checkpoint-list').value,name:$('checkpoint-name').value});
 $('checkpoint-import').onchange=async()=>{const file=$('checkpoint-import').files[0];if(!file)return;if(file.size>16*1024*1024){$('checkpoint-status').textContent='Checkpoint file exceeds 16 MB.';return;}send({type:'checkpoint-import',bytes:await file.arrayBuffer()});};
 $('checkpoint-list').onchange=()=>{const key=$('checkpoint-list').value;if(key)send({type:'checkpoint-preview',key});};
 $('checkpoint-refresh').onclick=()=>send({type:'checkpoint-list'});panel.ontoggle=()=>{if(panel.open)send({type:'checkpoint-list'});};
 return {message(d){if(d.type==='checkpoints'){const current=$('checkpoint-list').value;$('checkpoint-list').replaceChildren(...d.entries.map(r=>new Option(`${r.name} · ${r.invalid?'Damaged — '+r.invalid:new Date(r.date).toLocaleString()+' · '+['Juku','VJUGA','Robotron'][r.kind]}`,r.key)));if(d.entries.some(r=>r.key===current))$('checkpoint-list').value=current;for(const a of ['restore','delete','rename','export','preview'])$('checkpoint-'+a).disabled=!d.entries.length;}if(d.type==='checkpoint-preview')$('checkpoint-compatibility').textContent=d.message;if(d.type==='checkpoint-status')$('checkpoint-status').textContent=d.message;}};
}
