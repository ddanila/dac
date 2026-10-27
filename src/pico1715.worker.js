// SPDX-License-Identifier: MIT
// Dedicated classic-machine worker. No museum snapshots or W/M peripherals.
let core, running=false, paused=false, hidden=false, busy=false, speed=1, timer;
let keyboardMap,platformCode;
let last=0, debt=0, batch=1024, lastFrame=0, lastCycles=0, measured=0, backend;
const hz=2458000;
const stat=i=>core._p1715_stat(i);
function stop(){clearTimeout(timer);last=performance.now();debt=0;}
function frame(){
 const now=performance.now(), cycles=stat(0);
 if(lastFrame && now>lastFrame)measured=(cycles-lastCycles)/(now-lastFrame)*1000/hz;
 lastFrame=now;lastCycles=cycles;
 const bytes=core.HEAPU8.slice(core._p1715_screen(),core._p1715_screen()+1920);
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
 busy=true;stop();const deadline=performance.now()+60000;
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
  if(core._p1715_version()!==1)throw Error('Unsupported Pico1715 browser ABI.');
  const rom=new Uint8Array(d.rom),disk=new Uint8Array(d.disk),p=core._malloc(rom.length),q=core._malloc(disk.length);
  try{core.HEAPU8.set(rom,p);core.HEAPU8.set(disk,q);core._p1715_init(p,rom.length,q,disk.length,+d.writable);if(core._p1715_result()<0)throw Error('ROM or disk rejected.');}finally{core._free(p);core._free(q);}
  running=true;last=performance.now();postMessage({type:'power',on:true});frame();tick();return;
 }
 if(!core)throw Error('Power on first.');
 if(d.type==='key'){
  if(d.down!==false && core._p1715_key(d.key)<0)throw Error('Input unavailable or queue full.');
 }else if(d.type==='paste'){
  const text=String(d.text).replace(/\r\n?|\n/g,'\r');
  if(!text.length||text.length>4096||[...text].some(c=>!((c>=' '&&c<='~')||'\r\t\b\x1b'.includes(c))))throw Error('Paste 1–4096 ASCII characters, tabs or newlines.');
  if(stat(11)+text.length>4096)throw Error('Keyboard queue is full; paste was not started.');
  for(const c of text)core._p1715_key(c.charCodeAt(0));
 }else if(d.type==='cancel-paste')core._p1715_cancel();
 else if(d.type==='reset'){stop();core._p1715_reset();paused=false;debug('CPU reset; pending input cancelled.');lastFrame=performance.now();tick();}
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
