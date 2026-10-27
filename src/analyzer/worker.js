// SPDX-License-Identifier: MIT
import {Capture,compare,exportCapture,json} from './capture.js';
import {evaluate} from './assertions.js';
import {investigate} from './investigation.js';
const captures=new Map(),jobs=new Map(),versions=new Map();
self.onmessage=async({data:d})=>{
 if(d.op==='cancel'){jobs.get(d.target)?.abort();return;}
 const controller=new AbortController();jobs.set(d.id,controller);const check=()=>{if(controller.signal.aborted)throw Error('Cancelled');};
 try{
  let result;const progress=value=>postMessage({id:d.id,progress:value});
  if(d.op==='close'){versions.set(d.slot,d.id);captures.delete(d.slot);result=true;}
  else if(d.op==='open'){versions.set(d.slot,d.id);const c=await Capture.open(d.file,{check,progress});check();if(d.expectedRecords!==undefined&&c.header.count!==d.expectedRecords)throw Error('Capture record count differs from device status');if(versions.get(d.slot)!==d.id)throw Error('Superseded capture');captures.set(d.slot,c);result={header:c.header,summary:c.summary,name:d.file.name||'USB capture'};}
  else{const c=captures.get(d.slot||'primary');if(!c)throw Error('Open a capture first');
   if(d.op==='page')result=await c.page(d.start,d.count,check);
   else if(d.op==='waveform')result=await c.waveform(d.start,d.count,d.bins,check);
   else if(d.op==='search')result=await c.search(d.start,d.filter,d.direction,check);
   else if(d.op==='edge')result=await c.edge(d.start,d.signal,d.direction,check);
   else if(d.op==='measure')result=await c.measure(d.a,d.b,check);
   else if(d.op==='compare'){const ref=captures.get('reference');if(!ref)throw Error('Open a reference first');result=await compare(c,ref,{...d.settings,check});}
   else if(d.op==='export')result=await exportCapture(c,d.format,{start:d.start??0,end:d.end??c.header.count,check});
   else if(d.op==='original')result=c.file;
   else if(d.op==='assert')result=await evaluate(c,d.suite,{start:d.start??0,end:d.end??c.header.count,check});
   else if(d.op==='investigate')result=await investigate(c,d.metadata,d.profiles,d.profile,check);
   else if(d.op==='report')result=new Blob([json({schema:1,applicationRevision:import.meta.env.VITE_APP_REVISION,scope:'full validated captures; selection is presentation only',captures:[...captures].map(([slot,c])=>({slot,header:c.header,...c.summary})),settings:d.settings})+'\n'],{type:'application/json'});
   else throw Error('Unknown operation');
  }check();postMessage({id:d.id,result});
 }catch(e){postMessage({id:d.id,error:e.message});}finally{jobs.delete(d.id);}
};
