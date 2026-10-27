// SPDX-License-Identifier: MIT
export function mountCapturePanel(parent,send,available,status){
 const box=document.createElement('fieldset');box.innerHTML=`<legend>Bus capture → analyzer</legend>
 <label>Filter <select id="capture-filter"><option value="io">I/O + IACK + reset</option><option value="full">Full bus</option></select></label>
 <label>Limit MiB <input id="capture-mib" type="number" value="16" min="1" max="64"></label>
 <label>Simulated seconds (0 = no time limit) <input id="capture-seconds" type="number" value="0" min="0" max="120"></label>
 <button id="capture-start">Start capture</button><button id="capture-reset">Capture from reset</button><button id="capture-stop">Stop capture</button>
 <button id="capture-download">Download capture + metadata</button><button id="capture-open">Open in analyzer</button><button id="capture-release">Release capture</button><p id="capture-info" role="status">No capture.</p>`;parent.append(box);
 const $=id=>box.querySelector('#'+id);let state=0,request=0,pending=new Map();
 function buttons(){for(const id of ['capture-start','capture-reset'])$(id).disabled=state===1;for(const id of ['capture-download','capture-open'])$(id).disabled=state!==2;$('capture-stop').disabled=state!==1;$('capture-release').disabled=!state;}
 function start(reset){if(!available())throw Error('Power on first.');if(state===2&&!confirm('Discard the previous capture?'))return;send({type:'capture-start',bytes:Number($('capture-mib').value)*1048576,seconds:Number($('capture-seconds').value),full:$('capture-filter').value==='full',reset});}
 function get(){const id='capture-'+(++request);return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});send({type:'capture-get',id});});}
 const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 for(const [id,fn] of [['capture-start',()=>start(false)],['capture-reset',()=>start(true)],['capture-stop',()=>send({type:'capture-stop'})],['capture-release',()=>send({type:'capture-release'})],['capture-download',async()=>{const d=await get();download(new Blob([d.bytes]),'session.p1715');download(new Blob([JSON.stringify(d.metadata,null,2)]),'session.metadata.json');}]])$(id).onclick=()=>Promise.resolve().then(fn).catch(e=>status(e.message));
 $('capture-open').onclick=()=>{
  const nonce=crypto.randomUUID(),url=new URL(import.meta.env.BASE_URL+'analyzer.html',location.origin);url.hash='session='+nonce;
  const tab=window.open(url,'_blank');if(!tab){status('Popup blocked. Download the capture and import it in the analyzer.');return;}
  const timer=setTimeout(cleanup,30000);let used=false;
  function cleanup(){clearTimeout(timer);window.removeEventListener('message',ready);}
  async function ready(e){if(used||e.source!==tab||e.origin!==location.origin||e.data?.type!=='p1715-ready'||e.data.nonce!==nonce)return;used=true;cleanup();try{const d=await get();tab.postMessage({type:'p1715-session',nonce,bytes:d.bytes,metadata:d.metadata},location.origin,[d.bytes]);}catch(e){status(e.message);}}
  window.addEventListener('message',ready);
 };
 buttons();return {receive(d){if(d.type==='capture-status'){state=d.state;buttons();$('capture-info').textContent=`${['No capture','Acquiring','Complete','Failed'][state]} · ${d.records||0} records · ${d.bytes||0} bytes${d.reason?' · stopped: '+['','manual','size limit','time limit','fault'][d.reason]:''}`;}
 if(d.type==='capture-data'||(d.type==='error'&&pending.has(d.id))){const p=pending.get(d.id);pending.delete(d.id);d.type==='error'?p?.reject(Error(d.message)):p?.resolve(d);}},closed(){state=0;buttons();for(const p of pending.values())p.reject(Error('Session closed'));pending.clear();$('capture-info').textContent='No capture.';}};
}
