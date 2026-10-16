import {stored,storedKeys,checkedRecord,digest} from './session-store.js';
export async function checkpoints(){
 const keys=(await storedKeys()).filter(k=>k.startsWith('checkpoint:'));
 return (await Promise.all(keys.map(async key=>{const r=await stored(key);return {key,name:r.name,date:r.date,kind:r.kind,build:r.build};}))).sort((a,b)=>b.date-a.date);
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
export function createCheckpointPanel(send){
 const panel=document.createElement('details');panel.id='checkpoint-controls';panel.innerHTML=`<summary>Named checkpoints</summary><p>Save the running machine with both disks. Restoring opens private disk copies and keeps existing library disks intact. Load the same firmware first. Checkpoints are included in collection backups.</p><label>Name <input id="checkpoint-name" maxlength="80" placeholder="Before formatting"></label><button id="checkpoint-save">Save checkpoint</button><label>Saved checkpoints <select id="checkpoint-list"></select></label><button id="checkpoint-refresh">Refresh list</button><button id="checkpoint-restore">Restore selected checkpoint</button><button id="checkpoint-delete">Delete selected checkpoint</button><p role="status" id="checkpoint-status"></p>`;
 document.getElementById('session-controls').after(panel);const $=id=>panel.querySelector('#'+id);
 $('checkpoint-save').onclick=()=>send({type:'checkpoint-save',name:$('checkpoint-name').value});
 for(const action of ['restore','delete'])$('checkpoint-'+action).onclick=()=>send({type:'checkpoint-'+action,key:$('checkpoint-list').value});
 $('checkpoint-refresh').onclick=()=>send({type:'checkpoint-list'});panel.ontoggle=()=>{if(panel.open)send({type:'checkpoint-list'});};
 return {message(d){if(d.type==='checkpoints'){const current=$('checkpoint-list').value;$('checkpoint-list').replaceChildren(...d.entries.map(r=>new Option(`${r.name} · ${new Date(r.date).toLocaleString()} · ${['Juku','VJUGA','Robotron'][r.kind]}`,r.key)));if(d.entries.some(r=>r.key===current))$('checkpoint-list').value=current;for(const a of ['restore','delete'])$('checkpoint-'+a).disabled=!d.entries.length;}if(d.type==='checkpoint-status')$('checkpoint-status').textContent=d.message;}};
}
