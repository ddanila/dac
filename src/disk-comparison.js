import {inspectDisk,diskChanges,fileBytes} from './disk-map.js';
import {digest,stored,checkedRecord} from './session-store.js';
import {checkpoints,loadCheckpoint} from './checkpoints.js';
const hex=a=>Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');
export function compareDisks(before,after,layout='tosm'){
 const a=new Uint8Array(before),b=new Uint8Array(after),ranges=[];let changedBytes=0,start=-1;
 const flush=end=>{if(start<0)return;if(ranges.length<4096)ranges.push({offset:start,before:hex(a.subarray(start,end)),after:hex(b.subarray(start,end))});start=-1;};
 for(let i=0;i<Math.max(a.length,b.length);i++){if(a[i]!==b[i]){changedBytes++;if(start<0)start=i;}else flush(i);}flush(Math.max(a.length,b.length));
 const report={beforeSize:a.length,afterSize:b.length,changedBytes,ranges,rangesTruncated:ranges.reduce((n,r)=>n+Math.max(r.before.length,r.after.length)/2,0)<changedBytes,note:'Byte ranges include unallocated space; file lengths retain CP/M record padding.'};
 try{
  const old=inspectDisk(before,layout),next=inspectDisk(after,layout),signature=m=>JSON.stringify(m.sectors.map(s=>[s.c,s.h,s.r,s.size,s.slot]));
  report.compatibleGeometry=signature(old)===signature(next);
  if(!report.compatibleGeometry){report.note+=' Geometry differs; compare image byte offsets only.';return report;}
  const delta=diskChanges(old,next);report.sectors=delta.sectors;report.directoryEntries=delta.entries;
  if(old.filesystem&&next.filesystem){
   const prior=new Map(old.files.map(f=>[f.key,f])),current=new Map(next.files.map(f=>[f.key,f]));
   report.files={added:next.files.filter(f=>!prior.has(f.key)).map(f=>f.key),deleted:old.files.filter(f=>!current.has(f.key)).map(f=>f.key),modified:[]};
   for(const f of next.files)if(prior.has(f.key)){const x=fileBytes(old,prior.get(f.key)),y=fileBytes(next,f);if(x.length!==y.length||x.some((v,i)=>v!==y[i]))report.files.modified.push(f.key);}
  }
 }catch(e){report.note+=' Filesystem comparison unavailable: '+e.message;}
 return report;
}
export function createDiskComparison(dialog,current,requestOriginal){
 const panel=document.createElement('details');panel.innerHTML=`<summary>Compare with a saved baseline</summary><p>Baselines survive closing this window and browser reload. Originals mean the loaded image (or a library disk’s original), not a claim about factory contents.</p><button data-original>Use original image</button><button data-current>Use current snapshot</button><button data-checkpoints>Refresh checkpoints</button><label>Checkpoint <select data-checkpoint></select></label><label>Checkpoint drive <select data-drive><option value="0">A</option><option value="1">B</option></select></label><button data-use>Use checkpoint disk</button><button data-compare>Compare now</button><button data-export disabled>Export comparison</button><button data-clear>Remove baseline</button><p data-result role="status"></p><pre data-report tabindex="0"></pre>`;
 dialog.querySelector('[data-changes]').after(panel);const $=s=>panel.querySelector(s);let report=null;
 const key=u=>'comparison:'+u,notice=s=>$('[data-result]').textContent=s;
 async function baseline(bytes,name,u=current().unit){if(!bytes?.byteLength)throw Error('No disk available.');await stored(key(u),{bytes,sha256:await digest(bytes),name,date:Date.now()});notice('Baseline saved: '+name);report=null;$('[data-export]').disabled=true;}
 function action(fn){return async()=>{try{await fn();}catch(e){notice(e.message);}};}
 $('[data-original]').onclick=()=>requestOriginal();
 $('[data-current]').onclick=action(()=>baseline(current().bytes,'Current snapshot'));
 $('[data-checkpoints]').onclick=action(async()=>{$('[data-checkpoint]').replaceChildren(...(await checkpoints()).map(r=>new Option(r.name,r.key)));});
 $('[data-use]').onclick=action(async()=>{const r=await loadCheckpoint($('[data-checkpoint]').value);await baseline(r.disks[Number($('[data-drive]').value)].bytes,r.name+' · drive '+(Number($('[data-drive]').value)?'B':'A'));});
 $('[data-compare]').onclick=action(async()=>{const c=current(),r=await checkedRecord(key(c.unit));if(!r||!c.bytes)throw Error('Choose a baseline and load a disk first.');const result=compareDisks(r.bytes,c.bytes,c.layout);report={format:'DAC-disk-comparison-1',baseline:r.name,date:new Date().toISOString(),beforeHash:r.sha256,afterHash:await digest(c.bytes),...result};notice(`${r.name}: ${report.changedBytes} changed bytes · ${report.sectors?.length??'unknown'} changed allocated/system sectors${report.rangesTruncated?' · byte range preview/export limited to 4096 ranges':''}`);$('[data-report]').textContent=JSON.stringify({...report,ranges:report.ranges.slice(0,16).map(r=>({...r,before:r.before.slice(0,128),after:r.after.slice(0,128)}))},null,2)+'\nShowing first 16 byte ranges, up to 64 bytes each. Export includes up to 4096.';$('[data-export]').disabled=false;});
 $('[data-clear]').onclick=action(async()=>{await stored(key(current().unit),null);report=null;$('[data-export]').disabled=true;$('[data-report]').textContent='';notice('Baseline removed.');});
 $('[data-export]').onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='dac-disk-comparison.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return {original(bytes,u){action(()=>baseline(bytes,'Original image',u))();},reset(){report=null;$('[data-export]').disabled=true;$('[data-report]').textContent='';notice('Saved baselines are retained per drive. Compare now to inspect this disk.');}};
}
