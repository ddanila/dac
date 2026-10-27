// SPDX-License-Identifier: MIT
export function mountExperimentPanel(parent,{send,status,tools,inputs,startReplay,available}){
 const box=document.createElement('fieldset');box.innerHTML=`<legend>Reproducible investigation</legend>
 <label><input id="experiment-record" type="checkbox"> Record next session from power-on (120 simulated seconds maximum)</label>
 <button id="experiment-checkpoint">Record checkpoint</button>
 <label><input id="experiment-inputs" type="checkbox"> Include initial ROM and disk in exported bundle</label>
 <button id="experiment-export">Export investigation</button>
 <label>Open investigation <input id="experiment-file" type="file" accept=".p1715investigation,.json"></label>
 <label>Replay until <select id="experiment-target"><option value="end">End of recording</option></select></label>
 <button id="experiment-replay" disabled>Replay from boot</button><button id="experiment-cancel">Cancel replay</button>
 <p id="experiment-info" role="status">Inputs are referenced by hash unless explicitly included. Replays finish paused.</p>`;
 parent.append(box);const $=id=>box.querySelector('#'+id);let sequence=0,loaded,lastInputs,pending=new Map();
 function request(type){return new Promise((resolve,reject)=>{if(!available())return reject(Error('Power on with recording enabled first.'));const id='experiment-'+ ++sequence;pending.set(id,{resolve,reject});send({type,id});});}
 const action=(id,fn)=>$(id).onclick=()=>Promise.resolve().then(fn).catch(e=>status(e.message));
 action('experiment-checkpoint',async()=>{const d=await request('experiment-checkpoint');$('experiment-info').textContent=`Checkpoint recorded at clock ${d.checkpoint.clock}.`;});
 action('experiment-export',async()=>{
  const {makeBundle}=await tools(),d=await request('experiment-get'),files=d.attachments||[];
  if($('experiment-inputs').checked){if(!lastInputs)throw Error('Initial session inputs unavailable.');files.push({name:'initial.rom',bytes:new Uint8Array(lastInputs.rom)},{name:'initial.img',bytes:new Uint8Array(lastInputs.disk)});}
  const bundle=await makeBundle(d.experiment,files),blob=new Blob([JSON.stringify(bundle)]),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='session.p1715investigation';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('experiment-info').textContent=`Exported ${d.experiment.actions.length} actions; files: ${files.map(f=>f.name).join(', ')||'none (inputs referenced by hash)'}.`;
 });
 $('experiment-file').onchange=async()=>{loaded=undefined;$('experiment-replay').disabled=true;try{const f=$('experiment-file').files[0];if(!f)return;if(f.size>180*1048576)throw Error('Investigation exceeds size limit.');loaded=await(await tools()).openBundle(await f.text());if(!loaded.experiment){$('experiment-info').textContent='View-only investigation. Open it in the analyzer.';return;}$('experiment-info').textContent=`Opened ${loaded.experiment.backend} experiment: ${loaded.experiment.actions.length} actions, ending at clock ${loaded.experiment.end_clock}. Power off before replay.`;$('experiment-replay').disabled=false;}catch(e){status(e.message);}};
 $('experiment-file').addEventListener('change',()=>{$('experiment-target').replaceChildren(new Option('End of recording','end'));});
 $('experiment-target').onfocus=()=>{if(!loaded?.experiment||$('experiment-target').options.length>1)return;loaded.experiment.actions.forEach((a,i)=>{if(a.type==='checkpoint')$('experiment-target').add(new Option(`${a.name} · clock ${a.clock}`,String(i)));});};
 action('experiment-replay',()=>{if(!loaded)return startReplay(loaded);const copy={...loaded,experiment:structuredClone(loaded.experiment)},target=$('experiment-target').value;if(target!=='end'){const i=Number(target),a=copy.experiment.actions[i];if(a?.type!=='checkpoint')throw Error('Checkpoint unavailable');copy.experiment.actions=copy.experiment.actions.slice(0,i+1);copy.experiment.end_clock=a.clock;}return startReplay(copy);});action('experiment-cancel',()=>send({type:'experiment-cancel'}));
 return {recording:()=>$('experiment-record').checked,started(){lastInputs=inputs();},receive(d){
  if(d.type==='experiment-replayed')$('experiment-info').textContent=d.result.status==='complete'?'Replay complete: all recorded checkpoints match.':`Replay diverged at action ${d.result.first_divergence}.`;
  if(d.type==='experiment-data'||d.type==='error'){const p=pending.get(d.id);if(p){pending.delete(d.id);d.type==='error'?p.reject(Error(d.message)):p.resolve(d);}}
 },closed(){for(const p of pending.values())p.reject(Error('Session closed'));pending.clear();}};
}
