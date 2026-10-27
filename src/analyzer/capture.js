// SPDX-License-Identifier: MIT
import {Decoder,hex} from './decoder.js';
import {SHA256} from './sha256.js';
export const LIMIT=128*1024*1024,STRIDE=4096;
export const KINDS=['','opcode_fetch','memory_read','memory_write','io_read','io_write','interrupt_ack','refresh','reset','invalid'];
export const SIGNALS=[['addr',0,16],['data',16,8],['mreq_n',24,1],['iorq_n',25,1],['rd_n',26,1],['wr_n',27,1],['m1_n',28,1],['rfsh_n',29,1],['clock',30,1],['reset_n',31,1],['wait_n',32,1],['int_n',33,1],['busrq_n',34,1],['bao_n',35,1],['iei',36,1],['ieo',37,1]];
const assert=(ok,m)=>{if(!ok)throw Error(m);};
const delta=(a,b)=>(a-b)>>>0;
export function header(bytes,size){
 assert(bytes.length>=32,'Truncated header');const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u=n=>v.getUint32(n,true),magic=new TextDecoder().decode(bytes.subarray(0,8));
 const h={type:magic==='P1715CY\0'?'compact':magic==='P1715LA\0'?'raw':null,version:v.getUint16(8,true),recordSize:v.getUint16(10,true),clock_hz:u(12),count:u(16)};
 assert(h.type&&h.clock_hz,'Unsupported capture or sample clock');
 if(h.type==='compact'){
  assert([1,2].includes(h.version)&&h.recordSize===16,'Unsupported compact version/record size');h.size=h.version===2?80:32;assert(bytes.length>=h.size,'Truncated trigger header');
  h.dropped=u(20);h.filtered=u(24);h.capture_mask=u(28);assert(!(h.capture_mask&~0x3fe),'Invalid kind mask');h.trigger=null;
  if(h.version===2){const t=h.trigger=Array.from({length:12},(_,i)=>u(32+i*4));const [enabled,kinds,address,data,pre,post,fired,index,seq,omitted,collected,reason]=t;
   assert(enabled===1&&kinds&&!(kinds&~0x170)&&data<=65535&&fired<=1,'Invalid trigger configuration');
   assert(pre+post+1<=458747&&omitted<=h.filtered&&[1,2].includes(reason),'Invalid trigger window');
   if(fired){assert(index<=pre&&index<h.count&&collected<=post&&h.count===index+1+collected,'Invalid trigger position');assert(reason!==1||collected===post,'Incomplete automatic trigger window');}
   else assert(index===0xffffffff&&seq===0xffffffff&&!collected&&reason===2&&h.count<=pre,'Invalid untriggered window');
  }
  h.trigger_index=h.trigger?.[6]?h.trigger[7]:null;
 }else{
  h.size=52;assert(bytes.length>=52&&h.version===1&&h.recordSize===12,'Unsupported raw header');h.trigger_index=u(20)===0xffffffff?null:u(20);h.flags=u(24);h.pre=u(28);h.post=u(32);h.trigger_mask=v.getBigUint64(36,true);h.trigger_value=v.getBigUint64(44,true);
  assert(!(h.flags&~3)&&Boolean(h.flags&1)===(h.trigger_index!==null),'Invalid raw flags');assert(h.trigger_mask<1n<<38n&&h.trigger_value<1n<<38n,'Reserved trigger bits');
  assert(h.count<=h.pre+h.post+1,'Capture exceeds capacity');
  if(h.trigger_index===null)assert((h.flags&2)&&h.count<=h.pre,'Invalid untriggered raw history');
  else{assert(h.trigger_index<h.count&&h.trigger_index<=h.pre,'Invalid raw trigger index');const after=h.count-h.trigger_index-1;assert(after<=h.post&&((h.flags&2)||after===h.post),'Invalid raw post history');}
 }
 assert(size===h.size+h.count*h.recordSize,'Truncated capture or trailing bytes');return h;
}
export function fields(sample){return Object.fromEntries(SIGNALS.map(([name,bit,width])=>[name,Number((sample>>BigInt(bit))&((1n<<BigInt(width))-1n))]));}
export function rawKind(f){if(!f.reset_n)return 'reset';if(!f.iorq_n&&!f.m1_n)return 'interrupt_ack';if(!f.mreq_n&&!f.rfsh_n)return 'refresh';if(!f.mreq_n&&!f.iorq_n)return 'invalid';if(!f.mreq_n||!f.iorq_n){if(f.rd_n===f.wr_n)return !f.rd_n?'invalid':'bus_setup';if(!f.mreq_n)return !f.rd_n?(!f.m1_n?'opcode_fetch':'memory_read'):'memory_write';return !f.rd_n?'io_read':'io_write';}return 'idle';}
function read(v,o,h,index){if(h.type==='raw'){const sample=v.getBigUint64(o+4,true);return {index,tick:v.getUint32(o,true),sample};}const tag=v.getUint8(o);return {index,kind:tag>>>4,flags:tag&15,data:v.getUint8(o+1),address:v.getUint16(o+2,true),wait_samples:v.getUint16(o+4,true),duration:v.getUint16(o+6,true),tick:v.getUint32(o+8,true),sequence:v.getUint32(o+12,true)};}
function validate(r,h,prev,gaps){if(h.type==='raw'){assert(r.sample<1n<<38n,'Reserved raw bits');assert(!prev||r.tick===delta(prev.tick+1,0),'Raw sample gap or duplicate');return 0;}
 assert(r.kind>=1&&r.kind<=9,'Invalid operation');assert(r.duration&&r.wait_samples<=r.duration,'Invalid duration/WAIT count');assert(!(r.flags&4)||r.duration===65535,'Invalid saturation flag');assert(r.kind!==8||!(r.address||r.data||r.wait_samples),'Reset contains bus payload');assert(h.capture_mask&(1<<r.kind),'Record excluded by mask');
 const gap=prev?delta(r.sequence,prev.sequence+1):r.sequence;
 if(prev){assert(r.sequence!==prev.sequence,'Duplicate sequence');assert(delta(r.tick,prev.tick)>=prev.duration,'Overlapping intervals');}
 assert(gaps+gap<=h.dropped+h.filtered,'Unexplained sequence gap');
 if(r.index===h.trigger_index){const t=h.trigger;assert(r.sequence===t[8]&&(t[1]&(1<<r.kind))&&!((r.address^t[2])&(t[2]>>>16))&&!((r.data^t[3])&(t[3]>>>8)),'Trigger record does not match metadata');}return gap;
}
export class Capture{
 constructor(file,h){this.file=file;this.header=h;this.checkpoints=[];this.summary={records:h.count,clock_hz:h.clock_hz,dropped:h.dropped||0,filtered:h.filtered||0,trigger_index:h.trigger_index,kinds:{},fields:{},diagnostics:{}};}
 async *records(start=0,end=this.header.count,check=()=>{}){const h=this.header;for(let first=start;first<end;first+=16384){check();const last=Math.min(end,first+16384),buf=await this.file.slice(h.size+first*h.recordSize,h.size+last*h.recordSize).arrayBuffer(),v=new DataView(buf);for(let i=first;i<last;i++)yield read(v,(i-first)*h.recordSize,h,i);await new Promise(r=>setTimeout(r,0));}}
 static async open(file,{check=()=>{},progress=()=>{}}={}){
  assert(file.size<=LIMIT,'Capture exceeds 128 MiB limit');const c=new Capture(file,header(new Uint8Array(await file.slice(0,80).arrayBuffer()),file.size));
  const sha=new SHA256();for(let o=0;o<file.size;o+=1048576){check();sha.update(new Uint8Array(await file.slice(o,o+1048576).arrayBuffer()));progress(o/file.size/2);await new Promise(r=>setTimeout(r,0));}c.summary.sha256=sha.digest();
  let prev=null,elapsed=0n,gaps=0;const dec=new Decoder(),add=(obj,k)=>obj[k]=(obj[k]||0)+1;
  for await(const r of c.records(0,c.header.count,check)){
   if(r.index%STRIDE===0){c.checkpoints.push({prev,elapsed,gaps,decoder:dec.snapshot()});progress(.5+r.index/c.header.count/2);}
   const gap=validate(r,c.header,prev,gaps);gaps+=gap;elapsed+=prev?BigInt(delta(r.tick,prev.tick)):0n;
   if(c.header.type==='compact'){const annotations=[];if(gap&&c.header.dropped){dec.clear();annotations.push('sequence gap may include loss; inference state cleared');}annotations.push(...dec.feed(r));add(c.summary.kinds,KINDS[r.kind]);for(const note of annotations){if(note.includes('; CRC '))add(c.summary.fields,(note.startsWith('ID ')?'ID':'data')+(note.endsWith('ok')?' ok':' BAD'));if(/BAD|length unknown|incomplete|unexpected|exceeded|uncertain|may include loss/.test(note))add(c.summary.diagnostics,note);}}
   prev=r;
  }c.summary.elapsed_samples=elapsed.toString();c.summary.checkpoints=c.checkpoints.length;progress(1);return c;
 }
 async *events(start=0,end=this.header.count,check=()=>{}){
  const h=this.header;if(!h.count)return;assert(Number.isInteger(start)&&start>=0&&start<=h.count&&end>=start&&end<=h.count,'Invalid record range');
  const first=Math.floor(start/STRIDE)*STRIDE,cp=this.checkpoints[Math.floor(start/STRIDE)]||{prev:null,elapsed:0n,gaps:0,decoder:null};let prev=cp.prev,elapsed=cp.elapsed;const dec=new Decoder(cp.decoder);
  for await(const r of this.records(first,end,check)){
   elapsed+=prev?BigInt(delta(r.tick,prev.tick)):0n;
   if(h.type==='compact'){r.gap_before=prev?delta(r.sequence,prev.sequence+1):r.sequence;r.annotations=[];if(r.gap_before&&h.dropped){dec.clear();r.annotations.push('sequence gap may include loss; inference state cleared');}r.annotations.push(...dec.feed(r));}
   else{r.fields=fields(r.sample);r.raw_kind=rawKind(r.fields);r.annotations=[];}
   r.elapsed_samples=elapsed.toString();r.elapsed_us=Number(elapsed)*1e6/h.clock_hz;r.trigger=r.index===h.trigger_index;
   if(r.index>=start)yield r;prev=r;
  }
 }
 async page(start=0,count=100,check){const result=[];for await(const r of this.events(start,Math.min(this.header.count,start+Math.min(200,count)),check))result.push(r);return result;}
 async search(start,filter={},direction=1,check=()=>{}){
  const match=r=>{const kind=r.kind?KINDS[r.kind]:r.raw_kind,a=r.address??r.fields.addr,d=r.data??r.fields.data;
   return (!filter.kind||kind===filter.kind)&&(filter.address===undefined||!((a^filter.address)&(filter.addressMask??65535)))&&(filter.data===undefined||!((d^filter.data)&(filter.dataMask??255)))&&(!filter.flag||!!((r.flags||0)&filter.flag))&&(!filter.gap||!!r.gap_before)&&(filter.wait===undefined||(r.wait_samples||0)*1e6/this.header.clock_hz>=filter.wait)&&(!filter.note||r.annotations.some(n=>n.toLowerCase().includes(filter.note.toLowerCase())));};
  if(direction>0){for await(const r of this.events(Math.max(0,start),this.header.count,check))if(match(r))return r;}
  else{for(let end=Math.min(this.header.count,start+1);end>0;){const begin=Math.max(0,end-STRIDE);let found=null;for await(const r of this.events(begin,end,check))if(match(r))found=r;if(found)return found;end=begin;}}return null;
 }
 async edge(start,signal,direction=1,check=()=>{}){assert(this.header.type==='raw'&&SIGNALS.some(s=>s[0]===signal),'Choose a raw signal');
  if(direction>0){let prev;for await(const r of this.events(Math.max(0,start-1),this.header.count,check)){if(prev&&r.index>=start&&r.fields[signal]!==prev.fields[signal])return r;prev=r;}}
  else{for(let end=Math.min(this.header.count,start+1);end>1;){const begin=Math.max(0,end-STRIDE);let prev,found;for await(const r of this.events(Math.max(0,begin-1),end,check)){if(prev&&r.fields[signal]!==prev.fields[signal])found=r;prev=r;}if(found)return found;end=begin;}}return null;
 }
 async waveform(start,count,bins=600,check=()=>{}){assert(this.header.type==='raw','Waveforms require raw samples');const end=Math.min(this.header.count,start+count),width=Math.max(1,Math.ceil((end-start)/bins)),out=[];let previous;
  for await(const r of this.events(start,end,check)){const i=Math.floor((r.index-start)/width);if(!out[i])out[i]={index:r.index,end:r.index,first:r.fields,last:r.fields,changed:{}};const b=out[i];if(previous)for(const [name] of SIGNALS)if(previous.fields[name]!==r.fields[name])b.changed[name]=true;b.last=r.fields;b.end=r.index;previous=r;}return out;
 }
 async measure(a,b,check=()=>{}){let first,last,wait=0n;const start=Math.min(a,b),end=Math.max(a,b)+1;for await(const r of this.events(start,end,check)){first??=r;last=r;wait+=BigInt(r.wait_samples||0);}assert(first&&last,'Empty cursor range');return {from:start,to:end-1,records:end-start,samples:(BigInt(last.elapsed_samples)-BigInt(first.elapsed_samples)).toString(),elapsed_us:last.elapsed_us-first.elapsed_us,wait_samples:wait.toString(),wait_us:Number(wait)*1e6/this.header.clock_hz};}
}
export async function compare(left,right,{align='start',tolerance=null,check=()=>{}}={}){
 assert(left.header.type==='compact'&&right.header.type==='compact','Comparison requires compact captures');assert(['start','trigger'].includes(align),'Invalid alignment');assert(tolerance===null||(Number.isFinite(tolerance)&&tolerance>=0),'Invalid timing tolerance');
 const from=c=>{if(align==='start')return 0;assert(c.header.trigger_index!==null,'Both captures need a fired trigger');return c.header.trigger_index;};
 async function* selected(c){for await(const r of c.events(from(c),c.header.count,check))if([4,5,6,8,9].includes(r.kind))yield {index:r.index,sequence:r.sequence,key:[r.kind,[4,5].includes(r.kind)?r.address&255:0,r.data,r.flags],time_us:r.elapsed_us,duration_us:r.duration*1e6/c.header.clock_hz,wait_us:r.wait_samples*1e6/c.header.clock_hz};}
 const a=selected(left),b=selected(right);let count=0,mismatch=null,origins;
 for(;;){const [x,y]=await Promise.all([a.next(),b.next()]);if(x.done&&y.done)break;const l=x.value,r=y.value;if(l&&r&&!origins)origins=[l.time_us,r.time_us];let reason;
  if(!l||!r)reason='different number of selected events';else if(JSON.stringify(l.key)!==JSON.stringify(r.key))reason='different bus transaction';else if(tolerance!==null&&[Math.abs(l.time_us-origins[0]-r.time_us+origins[1]),Math.abs(l.duration_us-r.duration_us),Math.abs(l.wait_us-r.wait_us)].some(n=>n>tolerance))reason='timing tolerance exceeded';
  if(reason&&!mismatch)mismatch={event:count,reason,capture:l||null,reference:r||null};count++;
 }return {match:!mismatch&&count>0,compared_events:count,first_divergence:mismatch,alignment:align,tolerance_us:tolerance};
}
export const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v);
export async function exportCapture(c,format,{start=0,end=c.header.count,check=()=>{}}={}){
 const h=c.header,parts=[];let text='',size=0;const push=s=>{text+=s;if(text.length>65536){size+=text.length;assert(size<=LIMIT,'Text export exceeds 128 MiB; select a smaller range');parts.push(text);text='';}};
 if(format==='vcd'){assert(h.type==='raw','VCD requires raw samples');push('$timescale 1ps $end\n$scope module pico1715 $end\n');SIGNALS.forEach(([n,,w],i)=>push(`$var wire ${w} s${i} ${n} $end\n`));push('$var wire 1 t trigger $end\n$upscope $end\n$enddefinitions $end\n');}
 else if(format==='csv')push(h.type==='raw'?'sample_index,tick32,relative_ns,trigger,kind,'+SIGNALS.map(s=>s[0]).join(',')+'\r\n':'sequence,tick32,kind,address_hex,data_hex,duration_samples,wait_low_samples,partial_start,truncated_end,counter_saturated,address_changed,gap_before'+(h.version===2?',trigger':'')+'\r\n');
 else assert(format==='jsonl','Invalid export format');
 for await(const r of c.events(start,end,check)){
  if(format==='jsonl'){const e=h.type==='raw'?r:{index:r.index,sequence:r.sequence,tick:r.tick,elapsed_us:r.elapsed_us,kind:KINDS[r.kind],address:hex(r.address,4),data:hex(r.data),flags:r.flags,wait_samples:r.wait_samples,duration:r.duration,gap_before:r.gap_before,trigger:r.trigger,annotations:r.annotations};push(json(e)+'\n');}
  else if(format==='vcd'){push(`#${BigInt(r.index)*1000000000000n/BigInt(h.clock_hz)}\n`);SIGNALS.forEach(([n,,w],i)=>push(`b${r.fields[n].toString(2).padStart(w,'0')} s${i}\n`));push(`${+r.trigger}t\n`);}
  else if(h.type==='raw')push([r.index,r.tick,(BigInt(r.index)*1000000000n/BigInt(h.clock_hz)).toString(),+r.trigger,r.raw_kind,...SIGNALS.map(([n])=>r.fields[n])].join(',')+'\r\n');
  else push([r.sequence,r.tick,KINDS[r.kind],hex(r.address,4),hex(r.data),r.duration,r.wait_samples,...[1,2,4,8].map(n=>+!!(r.flags&n)),r.gap_before,...(h.version===2?[+r.trigger]:[])].join(',')+'\r\n');
 }parts.push(text);return new Blob(parts,{type:'text/plain'});
}
