// SPDX-License-Identifier: MIT
// Dedicated classic-machine worker. No museum snapshots or W/M peripherals.
let core, running=false, paused=false, hidden=false, busy=false, speed=1, timer;
let keyboardMap,platformCode,identity,captureMeta;
const capState=()=>core._p1715_capture_status(0);
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
function captureObservation(kind,detail){if(captureMeta&&capState()===1&&captureMeta.observations.length<10000)captureMeta.observations.push({kind,clock:stat(0),detail});}
function captureUpdate(){if(captureMeta)postMessage({type:'capture-status',state:capState(),reason:core._p1715_capture_status(1),records:core._p1715_capture_status(3),bytes:core._p1715_capture_status(2)});}

let last=0, debt=0, batch=1024, lastFrame=0, lastCycles=0, measured=0, backend;
const hz=2458000;
const stat=i=>core._p1715_stat(i);
function stop(){clearTimeout(timer);last=performance.now();debt=0;}
function frame(){
 const now=performance.now(), cycles=stat(0);
 if(lastFrame && now>lastFrame)measured=(cycles-lastCycles)/(now-lastFrame)*1000/hz;
 lastFrame=now;lastCycles=cycles;
 const bytes=core.HEAPU8.slice(core._p1715_screen(),core._p1715_screen()+1920);
 if(captureMeta&&capState()===1){const text=Array.from(bytes,c=>c>=32&&c<127?String.fromCharCode(c):' ').join('');if(text!==captureMeta.lastScreen){captureObservation('screen',text);captureMeta.lastScreen=text;}}
 captureUpdate();
 let guest;
 if(keyboardMap&&platformCode){const ram=core._p1715_ram();
  if(platformCode.every((b,i)=>core.HEAPU8[ram+0xc000+i]===b)){
   const s=keyboardMap.symbols,word=a=>core.HEAPU8[ram+a]|core.HEAPU8[ram+a+1]<<8;
   guest={queued:core.HEAPU8[ram+s.keycount],drops:word(s.keydrops),decoded:word(s.keydecoded)};
  }
 }
 postMessage({type:'frame',bytes,guest,stats:Array.from({length:25},(_,i)=>stat(i)),measured,paused});
}
function tick(){
 if(!running||paused||hidden||busy)return;
 try{
  const now=performance.now();debt=Math.min(hz*.1*speed,debt+Math.min(100,now-last)*hz*speed/1000);last=now;
  const until=now+8;
  while(performance.now()<until && (speed===0 || debt>0)){
   const start=performance.now(), budget=Math.max(1,Math.min(batch,speed===0?batch:Math.floor(debt)));
   core._p1715_run(budget);const used=core._p1715_result();debt-=used;
   const elapsed=performance.now()-start;
   batch=Math.max(16,Math.min(16384,Math.floor(batch*2/Math.max(.1,elapsed))));
   if(core._p1715_hit()){paused=true;debug('Paused at opcode fetch.');break;}
   if(!used)break;
  }
  if(performance.now()-lastFrame>100 || paused)frame();
  if(!paused)timer=setTimeout(tick,0);
 }catch(e){running=false;stop();postMessage({type:'fatal',message:e.message});}
}
function debug(message){
 const names=['PC','SP','AF','BC','DE','HL','IX','IY',"AF′","BC′","DE′","HL′",'IM','IFF1','IFF2','I','R','clocks low','clocks high','bank','HALT','instruction boundary','bus address'];
 const values=names.map((_,i)=>core._p1715_reg(i)), lines=[];let pc=values[0];
 for(let i=0;i<10;i++){
  const next=core._p1715_disassemble(pc),p=core._p1715_text();let end=p;while(end<p+128&&core.HEAPU8[end])end++;
  lines.push(pc.toString(16).padStart(4,'0')+'  '+new TextDecoder().decode(core.HEAPU8.subarray(p,end)));pc=next;
 }
 postMessage({type:'debug-state',paused,message,values,names,disassembly:lines.join('\n')});
}
async function exportDisk(){
 captureObservation('disk-export','drain requested');busy=true;stop();const deadline=performance.now()+60000;
 try{
  for(;;){core._p1715_export();const r=core._p1715_result();if(r<0)throw Error('Disk drain failed; previous saved disk retained.');if(r===1)break;
   if(performance.now()>deadline)throw Error('Disk drain timed out; previous saved disk retained.');
   await new Promise(resolve=>setTimeout(resolve,0));}
  return core.HEAPU8.slice(core._p1715_disk(),core._p1715_disk()+819200).buffer;
 }catch(e){running=false;throw e;}finally{busy=false;last=performance.now();if(running&&!paused&&!hidden)tick();}
}
async function handle(d){
 if(d.type==='init'){
  backend=d.backend;keyboardMap=d.keyboardMap;platformCode=d.platformCode;
  const factory=(await import(/* @vite-ignore */ new URL(`pico1715-${backend}.mjs`,d.base).href)).default;
  core=await factory({printErr:()=>{}});
  if(core._p1715_version()!==2)throw Error('Unsupported Pico1715 browser ABI.');
  const rom=new Uint8Array(d.rom),disk=new Uint8Array(d.disk),p=core._malloc(rom.length),q=core._malloc(disk.length);
  try{core.HEAPU8.set(rom,p);core.HEAPU8.set(disk,q);core._p1715_init(p,rom.length,q,disk.length,+d.writable);if(core._p1715_result()<0)throw Error('ROM or disk rejected.');}finally{core._free(p);core._free(q);}
  identity={schema:1,backend,build:d.build,rom_sha256:await digest(rom),disk_sha256:await digest(disk),clock_hz:hz};
  running=true;last=performance.now();postMessage({type:'power',on:true});frame();tick();return;
 }
 if(!core)throw Error('Power on first.');
 if(d.type==='capture-start'){
  const size=Number(d.bytes),seconds=Number(d.seconds||0);
  if(!Number.isInteger(size)||size<8192||size>64*1024*1024||!Number.isFinite(seconds)||seconds<0||seconds>120)throw Error('Invalid capture bounds (maximum 64 MiB / 120 seconds).');
  if(core._p1715_capture_start(size,d.full?0x3fe:0x170,Math.ceil(seconds*hz))<0)throw Error('Capture already active or allocation failed.');
  captureMeta={...identity,start_clock:stat(0),writes_at_start:stat(4),observations:[],filter:d.full?'full':'io',limit_bytes:size,limit_seconds:seconds,timing:'four illustrative samples per CPU T-state; deferred transaction WAIT; not physical bus timing'};
  if(d.reset){captureObservation('reset-action','emulator reset; no sampled reset pulse implied');core._p1715_reset();}
  captureUpdate();return;
 }
 if(d.type==='capture-stop'){core._p1715_capture_stop();captureUpdate();return;}
 if(d.type==='capture-get'){
  if(capState()!==2)throw Error('Stop and drain the capture before opening or downloading.');
  const length=core._p1715_capture_status(2),ptr=core._p1715_capture_data(),bytes=new Uint8Array(length);
  for(let offset=0;offset<length;offset+=1048576)bytes.set(core.HEAPU8.subarray(ptr+offset,ptr+Math.min(length,offset+1048576)),offset);
  const {lastScreen,...metadata}=captureMeta;
  metadata.end_clock=metadata.start_clock+core._p1715_capture_status(4);metadata.capture_sha256=await digest(bytes);metadata.stop_reason=['','manual','size','time','fault'][core._p1715_capture_status(1)];metadata.complete=true;
  postMessage({type:'capture-data',id:d.id,bytes:bytes.buffer,metadata},[bytes.buffer]);return;
 }
 if(d.type==='capture-release'){core._p1715_capture_release();captureMeta=undefined;postMessage({type:'capture-status',state:0});return;}
 if(d.type==='key'){
  if(d.down!==false && core._p1715_key(d.key)<0)throw Error('Input unavailable or queue full.');
 }else if(d.type==='paste'){
  const text=String(d.text).replace(/\r\n?|\n/g,'\r');
  if(!text.length||text.length>4096||[...text].some(c=>!((c>=' '&&c<='~')||'\r\t\b\x1b'.includes(c))))throw Error('Paste 1–4096 ASCII characters, tabs or newlines.');
  if(stat(11)+text.length>4096)throw Error('Keyboard queue is full; paste was not started.');
  for(const c of text)core._p1715_key(c.charCodeAt(0));
 }else if(d.type==='cancel-paste')core._p1715_cancel();
 else if(d.type==='reset'){captureObservation('reset-action','emulator reset; no sampled reset pulse implied');stop();core._p1715_reset();paused=false;debug('CPU reset; pending input cancelled.');lastFrame=performance.now();tick();}
 else if(d.type==='resume-after-save-failure'){running=true;stop();tick();}
 else if(d.type==='speed'){speed=[0,1,4].includes(d.value)?d.value:1;stop();tick();}
 else if(d.type==='visibility'){hidden=!!d.hidden;stop();tick();}
 else if(d.type==='export'||d.type==='off'){
  const wasRunning=running;if(d.type==='off')running=false;
  try{const bytes=await exportDisk();postMessage({type:'disk',id:d.id,bytes,writes:stat(4),off:d.type==='off'},[bytes]);}
  catch(e){postMessage({type:'error',id:d.id,message:e.message,stopped:true});return;}
  if(d.type!=='off')running=wasRunning;
 }else if(d.type.startsWith('debug-')){
  let message;
  if(d.type==='debug-pause'){paused=true;stop();}
  if(d.type==='debug-resume'){paused=false;stop();tick();}
  if(d.type==='debug-step'){if(!paused)throw Error('Pause before stepping.');core._p1715_step();const n=core._p1715_result();message=`Advanced ${n} clocks${n===100000?' · instruction-boundary limit reached':''}.`;frame();}
  if(d.type==='debug-clear-break')core._p1715_break(-1);
  if(['debug-run-to','debug-arm-execution'].includes(d.type)){
   if(!Number.isInteger(d.address)||d.address<0||d.address>65535)throw Error('Invalid execution address.');core._p1715_break(d.address);
   if(d.type==='debug-run-to'){paused=false;stop();tick();}
  }
  debug(message);
  if(d.type==='debug-memory'){
   if(!Number.isInteger(d.address)||d.address<0||d.address>65535)throw Error('Invalid memory address.');
   const memoryRows=Array.from({length:8},(_,i)=>{const address=(d.address+i*16)&65535;return {address,bytes:Array.from({length:16},(_,j)=>core._p1715_peek((address+j)&65535)),read:core._p1715_map(address,0),write:core._p1715_map(address,1)};});
   postMessage({type:'debug-state',paused,memoryRows});
  }
 }
}
let chain=Promise.resolve();
onmessage=({data})=>{chain=chain.then(()=>handle(data)).catch(e=>postMessage({type:data.type.startsWith('debug-')?'debug-error':'error',id:data.id,message:e.message}));};
