import {loadHistoricalRobotron} from './historical-media.js';
const WORDS=54;
let isolated=0, owner, generation=0, cachedROM=null, source='live', captureIdentity=null;
let instructionCache=new Set(),stream=null,referenceTimer,referenceRunning=false,latestRequest=0;
let heldModule,heldHandle,heldKeys=new Set();
function releaseContacts(){if(heldModule&&heldHandle)for(const key of heldKeys)heldModule._dac_matrix(heldHandle,key,0);heldKeys.clear();heldModule=null;heldHandle=0;}

const pauseTask=()=>new Promise(resolve=>setTimeout(resolve,0));
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
function load(m,h,slot,bytes){const p=m._malloc(bytes.byteLength);try{m.HEAPU8.set(new Uint8Array(bytes),p);if(m._dac_load(h,slot,p,bytes.byteLength)<0)throw Error('Reference ROM rejected');}finally{m._free(p);}}
function text(m,h){const p=m._dac_debug_text(h);let end=p;while(end<p+128&&m.HEAPU8[end])end++;return new TextDecoder().decode(m.HEAPU8.subarray(p,end));}
function listing(m,h){const rows=[];for(let pc=0;pc<2048;){let next=m._dac_keyboard_disassemble(h,pc);if(next<=pc)next=pc+1;rows.push({address:pc,text:text(m,h),bytes:Array.from({length:Math.min(16,next-pc)},(_,i)=>m._dac_keyboard_byte(h,pc+i))});pc=next;}return rows;}
function screen(m,h){const p=m._dac_video(h),width=m._dac_width(h),height=m._dac_height(h);return {width,height,pixels:m.HEAPU8.slice(p,p+width*height*4).buffer,cells:Array.from({length:1920},(_,i)=>m._dac_dive_screen(h,i))};}
async function identity(m,h,build){const rom=Uint8Array.from({length:2048},(_,i)=>m._dac_keyboard_byte(h,i));return {build,romSha256:await hash(rom),clockHz:3993600,keyboardClockHz:683000,source,rom:Array.from(rom)};}
function emit(m,h,extra={}){
 const first=extra.first||0;
 if(!Number.isInteger(first)||first<0)throw Error('Invalid capture page');
 if(!first){const count=m._dac_dive_count(h),p=m._dac_dive_data(h,0);stream={count,status:m._dac_dive_status(h),bytes:m.HEAPU8.slice(p,p+count*WORDS*4)};}
 if(!stream||first>stream.count)throw Error('Capture page is outside retained history');
 const count=stream.count,n=Math.min(4096,count-first);
 const bytes=stream.bytes.slice(first*WORDS*4,(first+n)*WORDS*4).buffer;
 if(!first)captureIdentity={...captureIdentity,endLeds:m._dac_keyboard_leds(h),initialMatrix:Array.from({length:13},(_,i)=>m._dac_dive_matrix(h,i,count?1:0))};
 const state={keyboard:Array.from({length:23},(_,i)=>m._dac_keyboard_reg(h,i)),mainboard:Array.from({length:23},(_,i)=>m._dac_debug_reg(h,i))};
 const mainPC=state.mainboard[state.mainboard[21]?22:0];m._dac_debug_disassemble(h,mainPC);state.mainboardInstruction=text(m,h);
 const instructions={};const words=new Uint32Array(bytes);
 for(let i=0;i<words.length;i+=WORDS)for(const [pcIndex,byteIndex]of [[6,48],[7,49]]){
  const pc=words[i+pcIndex],packed=words[i+byteIndex],key=pc+':'+packed;
  if(!instructionCache.has(key)){m._dac_dive_instruction(h,pc,packed);instructions[key]=text(m,h);instructionCache.add(key);}
 }
 const display=extra.first?null:screen(m,h);
 postMessage({type:'dive-state',source,count,first,status:stream.status,trigger:m._dac_dive_trigger(h),bytes,state,display,instructions,identity:captureIdentity,...extra},[bytes,...(display?[display.pixels]:[])]);
}
export async function handleKeyboardDive(d,ctx){
 if(d.requestId&&d.requestId<latestRequest)return;
 if(d.requestId)latestRequest=d.requestId;
 const current=()=>!d.requestId||d.requestId===latestRequest;
 const m=source==='reference'&&isolated&&!['dive-guide','dive-live'].includes(d.type)?owner:ctx.module;
 if(d.type==='dive-close'){generation++;clearTimeout(referenceTimer);referenceRunning=false;releaseContacts();ctx.disarm?.();if(isolated){owner._dac_destroy(isolated);isolated=0;}if(ctx.module._dac_dive_capabilities?.(ctx.handle))ctx.module._dac_dive_capture(ctx.handle,0);source='live';captureIdentity=null;cachedROM=null;stream=null;return;}
 if(!m._dac_dive_capabilities)throw Error('This preserved emulator has no keyboard inspection. Select the current emulator.');
 if(d.type==='dive-guide'){
  const token=++generation;clearTimeout(referenceTimer);referenceRunning=false;releaseContacts();ctx.disarm?.();source='reference';instructionCache=new Set();
  if(isolated){owner._dac_destroy(isolated);isolated=0;}
  owner=m;const media=await loadHistoricalRobotron(new URL(import.meta.env.BASE_URL,self.location.origin));if(token!==generation||!current())return;
  isolated=m._dac_create(2);const h=isolated;
  for(const [slot,bytes]of media.firmware)load(m,h,slot,bytes);
  const p=m._malloc(media.disk.byteLength);try{m.HEAPU8.set(new Uint8Array(media.disk),p);if(m._dac_mount(h,p,media.disk.byteLength,0)<0)throw Error('Reference disk rejected');}finally{m._free(p);}
  if(m._dac_power(h,1)<0)throw Error('Reference machine could not start');
  let ready=false;
  for(let ticks=0;ticks<160000000;ticks+=500000){
   if(token!==generation||!current())return;
   for(let i=0;i<5;i++)m._dac_run(h,100000);
   const cells=Array.from({length:1920},(_,i)=>m._dac_dive_screen(h,i));
   const lines=Array.from({length:24},(_,row)=>String.fromCharCode(...cells.slice(row*80,row*80+80)).replace(/[^\x20-\x7e]/g,' ').trim()).filter(Boolean);
   if(lines.at(-1)==='A>'){ready=true;break;}
   if(ticks%10000000===0)postMessage({type:'dive-progress',requestId:d.requestId,message:`Booting an isolated S550 / S600 / TOS/M reference session… ${(ticks/3993600).toFixed(1)} simulated seconds`});
   await pauseTask();
  }
  if(!ready)throw Error('Reference session did not reach A> within 40 simulated seconds.');
  // Let the input polling loop settle before the repeatable contact sequence.
  for(let i=0;i<4;i++)m._dac_run(h,100000);
  captureIdentity={...await identity(m,h,ctx.build),scenario:d.scenario||'a',media:'S550 / CAS287 / S600 / TOS/M 1.0',diskSha256:await hash(media.disk),firmware:await Promise.all(media.firmware.map(async([slot,bytes])=>({slot,sha256:await hash(bytes)})))};
  if(token!==generation||!current())return;
  const initial=screen(m,h);postMessage({type:'dive-before',display:initial},[initial.pixels]);
  if(m._dac_dive_capture(h,1)<0)throw Error('Capture could not start');
  const scenario=d.scenario||'a';
  if(scenario==='repeat'){m._dac_dive_detail(h,0);captureIdentity.instructionHistory='Event snapshots only for the long repeat example; use live capture for every instruction.';}
  // Matrix coordinates are the S600 reference; A = column 7, bit 5; ET = column 3, bit 4.
  const keys=scenario==='shift'?[65,61]:scenario==='ctrl'?[64,61]:scenario==='enter'?[28]:scenario==='caps'?[69]:scenario==='siso'?[71]:[61];
  for(const key of keys)m._dac_matrix(h,key,1);
  const hold=scenario==='repeat'?8000000:400000;
  for(let t=0;t<hold;t+=100000){if(scenario==='repeat'&&t===400000)m._dac_matrix(h,70,1);m._dac_run(h,100000);if(t%500000===0)await pauseTask();if(token!==generation||!current())return;}
  if(scenario==='repeat'){m._dac_matrix(h,70,0);for(let i=0;i<4;i++)m._dac_run(h,100000);}
  for(const key of keys)m._dac_matrix(h,key,0);
  for(let t=0;t<400000;t+=100000)m._dac_run(h,100000);
  m._dac_dive_capture(h,0);cachedROM=listing(m,h);emit(m,h,{requestId:d.requestId,listing:cachedROM,complete:true});return;
 }
 if(d.type==='dive-live'){generation++;clearTimeout(referenceTimer);referenceRunning=false;releaseContacts();if(isolated){owner._dac_destroy(isolated);isolated=0;}source='live';captureIdentity=null;cachedROM=null;instructionCache=new Set();}
 const h=source==='reference'&&isolated?isolated:ctx.handle;
 if(!m._dac_dive_capabilities(h))throw Error('Live inspection needs a powered Robotron with a keyboard ROM. Explore a keypress can still run an isolated reference journey.');
 if(!captureIdentity)captureIdentity=await identity(m,h,ctx.build);
 if(!current())return;
 if(d.type==='dive-start'){captureIdentity={...captureIdentity,instructionHistory:undefined};instructionCache=new Set();if(m._dac_dive_capture(h,1)<0)throw Error('Capture rejected');}
 if(d.type==='dive-arm'){if(m._dac_dive_arm(h,d.kind,d.address,d.pre,d.stop?1:0)<0)throw Error('Invalid trigger settings');instructionCache=new Set();if(source==='live'&&d.stop)ctx.arm();}
 if(d.type==='dive-stop'){m._dac_dive_capture(h,0);ctx.disarm?.();}
 if(d.type==='dive-pause'&&source==='live')ctx.pause();
 if(d.type==='dive-resume'&&source==='live')ctx.resume();
 if(d.type==='dive-pause'&&source==='reference'){clearTimeout(referenceTimer);referenceRunning=false;}
 if(d.type==='dive-resume'&&source==='reference'){
  clearTimeout(referenceTimer);referenceRunning=true;m._dac_debug_break(h,0);const token=generation;
  const pump=()=>{if(token!==generation||h!==isolated)return;m._dac_debug_run(h,80000);if(m._dac_debug_hit(h)){referenceRunning=false;emit(m,h,{paused:true});return;}referenceTimer=setTimeout(pump,20);};pump();
 }
 if(d.type==='dive-step'){
  clearTimeout(referenceTimer);referenceRunning=false;if(source==='live')ctx.pause();
  if(d.target==='mainboard')m._dac_debug_step(h);else m._dac_keyboard_step(h);
 }
 if(d.type==='dive-contact'){
  if(!Number.isInteger(d.key)||d.key<0||d.key>=104)throw Error('Invalid matrix contact');
  m._dac_matrix(h,d.key,!!d.down);
  heldModule=m;heldHandle=h;if(d.down)heldKeys.add(d.key);else heldKeys.delete(d.key);
 }
 if(d.type==='dive-run-to'){
  if(source==='live')ctx.pause();
  if(!Number.isInteger(d.address)||d.address<0||d.address>65535)throw Error('Use a 16-bit hexadecimal address');
  let found=false;
  clearTimeout(referenceTimer);referenceRunning=false;
  for(let clocks=0;clocks<4000000;){const used=m._dac_keyboard_step(h);if(!used)break;clocks+=used;if(m._dac_keyboard_reg(h,22)===d.address){found=true;break;}}
  if(!found)postMessage({type:'dive-progress',requestId:d.requestId,message:'Run-to stopped at its instruction budget; address not reached.'});
 }
 if(source==='live'&&['dive-step','dive-run-to'].includes(d.type))ctx.frame?.();
 if(!cachedROM)cachedROM=listing(m,h);
 emit(m,h,{requestId:d.requestId,first:d.first||0,paused:source==='reference'?!referenceRunning:ctx.paused,...(d.type==='dive-open'||d.type==='dive-live'?{listing:cachedROM}:{})});
}
