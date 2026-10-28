// SPDX-License-Identifier: MIT
import {mountCapturePanel} from './pico1715-capture.js';
import {mountExperimentPanel} from './pico1715-experiment-panel.js';
import {digest,checkedRecord,saveRecord,stored} from './session-store.js';
export function createPico1715Panel({screen,scene,debug,onPower}){
 const $=id=>document.getElementById(id),panel=document.createElement('section');panel.id='pico1715-panel';panel.hidden=true;
 panel.innerHTML=`<h2>Classic 1715 workstation</h2>
 <label>Backend <select id="p1715-backend"><option value="model">Controller model</option><option value="firmware">Firmware + FPGA RTL (slower)</option></select></label>
 <label>Speed <select id="p1715-speed"><option value="1">1×</option><option value="4">4×</option><option value="0">Maximum</option></select></label>
 <label><input id="p1715-write" type="checkbox"> Enable writes to working copy</label>
 <label><input id="p1715-remember" type="checkbox" checked> Remember working disk locally</label>
 <p>80×24 text-memory view. Provisional enclosure; CRT timing and historical glyphs are not modeled.</p>
 <p id="p1715-media"></p><label>Original boot ROM (2048 bytes)<input id="p1715-rom" type="file"></label>
 <label>A: disk image (819200 bytes)<input id="p1715-disk" type="file"></label>
 <button id="p1715-import">Load local media</button><button id="p1715-demo">Restore bundled CP/M demo</button>
 <button id="p1715-export">Save and download disk</button><button id="p1715-restore">Restore saved disk</button><button id="p1715-discard">Discard saved disk and working changes</button>
 <label>Paste text<textarea id="p1715-paste" maxlength="4096"></textarea></label><button id="p1715-type">Type text</button><button id="p1715-cancel">Cancel typing</button>
 <details><summary>Copy screen text</summary><pre id="p1715-text" tabindex="0"></pre></details>
 <p id="p1715-status" role="status">Loading demo…</p><pre id="p1715-stats"></pre>
 <p>No whole-machine snapshots. Browser termination can lose writes since the last successful disk save.</p>`;
 $('fidelity').after(panel);
 let worker,active=false,on=false,loading=false,rom,disk,original,key,manifest,base,label;
 let keyboardMap,platformCode;
 let writable=false,serial=0,requests=new Map(),generation=0,saving=false,dirty=false,lastWrites=0,lastChange=0;
 const ctx=screen.getContext('2d'),originalDebugText=$('debug-controls').querySelector('p').textContent;
 const status=text=>$('p1715-status').textContent=text;
 const backend=()=>$('p1715-backend').value;
 const clearScreen=()=>{$('p1715-text').textContent='';ctx.fillStyle='#101812';ctx.fillRect(0,0,screen.width,screen.height);scene()?.update();};
 const send=d=>{if(d.type==='reset')clearScreen();worker?.postMessage(d);};
 const controls=()=>{
  for(const id of ['p1715-backend','p1715-write','p1715-rom','p1715-disk','p1715-import','p1715-demo','p1715-restore','p1715-discard'])$(id).disabled=on||loading||saving;
  $('machine').disabled=on||loading||saving;$('power').disabled=loading||saving||!rom;
  $('p1715-export').disabled=!disk||saving;$('reset').disabled=!on||loading||saving;
 };
 async function identity(){key='pico1715:1:'+backend()+':'+await digest(rom)+':'+await digest(original);}
 async function saved(){const record=await checkedRecord(key);if(record){if(record.bytes.byteLength!==819200)throw Error('Saved disk has invalid size.');disk=record.bytes.slice(0);status('Restored saved disk copy.');}}
 async function demo(){
  loading=true;controls();try{
   base=new URL(import.meta.env.BASE_URL+'pico1715/',location.origin);
   const r=await fetch(new URL('manifest.json',base),{cache:'no-cache'});if(!r.ok)throw Error('Pico1715 artifacts unavailable.');manifest=await r.json();
   async function asset(name){const url=new URL(name,base);url.searchParams.set('sha256',manifest.sha256[name]);const r=await fetch(url);if(!r.ok)throw Error('Missing '+name);const b=await r.arrayBuffer();if(await digest(b)!==manifest.sha256[name])throw Error('Artifact checksum mismatch: '+name);return b;}
   const nextRom=await asset('test.rom'),nextDisk=await asset('cpm-plus-1715.img');
   keyboardMap=JSON.parse(new TextDecoder().decode(await asset('keyboard-map.json')));platformCode=new Uint8Array(await asset('platform.bin')).slice(0,512);
   rom=nextRom;original=nextDisk;disk=nextDisk.slice(0);label='Source-built CP/M 3 · public fixture ROM (historical bootstrap bypassed)';
   await identity();status('Demo ready. Power on and wait for A>.');if($('p1715-remember').checked)await saved();
   $('p1715-media').textContent=label;
  }finally{loading=false;controls();}
 }
 function stopWorker(){capture?.closed();experiments?.closed();generation++;worker?.terminate();worker=undefined;for(const p of requests.values())p.reject(Error('Session closed.'));requests.clear();}
 async function snapshot(off=false){
  if(!worker)return {bytes:disk.slice(0),writes:lastWrites};
  const id=++serial;return new Promise((resolve,reject)=>{requests.set(id,{resolve,reject});send({type:off?'off':'export',id});});
 }
 async function save(download=false,off=false){
  if(saving)return; saving=true;controls();
  try{const {bytes,writes}=await snapshot(off);if($('p1715-remember').checked)await saveRecord(key,bytes);disk=bytes;dirty=lastWrites>writes;lastWrites=Math.max(lastWrites,writes);
   status($('p1715-remember').checked?'Disk saved locally.':'Disk copied; local persistence disabled.');
   if(download){const url=URL.createObjectURL(new Blob([bytes]));const a=document.createElement('a');a.href=url;a.download='pico1715-working.img';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }catch(e){if(off&&worker)send({type:'resume-after-save-failure'});throw e;}
  finally{saving=false;controls();}
 }
 const capture=mountCapturePanel(panel,send,()=>!!worker,status);
 const experiments=mountExperimentPanel(panel,{send,status,available:()=>!!worker,inputs:()=>({rom:rom.slice(0),disk:disk.slice(0)}),tools:async()=>{
  if(!manifest)throw Error('Wait for demo assets.');const url=new URL('experiment.mjs',base);url.searchParams.set('sha256',manifest.sha256['experiment.mjs']);return import(/* @vite-ignore */url.href);
 },startScenario:async(scenario,seconds,faultSeconds)=>{
  if(on||loading||saving)throw Error('Power off before starting a fault experiment.');
  if(!Number.isFinite(seconds)||seconds<1||seconds>120||!Number.isFinite(faultSeconds)||faultSeconds<0||faultSeconds>=seconds)throw Error('Invalid fault experiment times.');
  const url=new URL('experiment.mjs',base);url.searchParams.set('sha256',manifest.sha256['experiment.mjs']);const tools=await import(/* @vite-ignore */url.href);
  const e={schema:1,kind:'pico1715-experiment',scenario,backend:backend(),build:manifest,writable:scenario==='readonly'?false:$('p1715-write').checked,absent:scenario==='absent',rom_sha256:await digest(rom),disk_sha256:await digest(disk),engine_sha256:await tools.engineIdentity(manifest.sha256['pico1715-'+backend()+'.mjs'],manifest.sha256['pico1715-'+backend()+'.wasm']),end_clock:Math.floor(seconds*2458000),actions:[{clock:0,type:'capture-start',bytes:16*1048576,mask:0x170,clocks:0}]};
  if(!['readonly','absent'].includes(scenario))e.actions.push({clock:Math.floor(faultSeconds*2458000),type:'fault',fault:scenario,value:{crc:1,'drop-byte':100,'read-delay':500,'write-delay':500,'sd-delay':10000,'sd-write-failure':1,'power-fail':1}[scenario]});
  const text=$('p1715-paste').value.replace(/\r\n?|\n/g,'\r');if(text){if(e.end_clock<=30000000||text.length>4096||[...text].some(c=>c.charCodeAt(0)<1||c.charCodeAt(0)>127))throw Error('ASCII command workloads require more than 30M clocks.');for(const c of text)e.actions.push({clock:30000000,type:'key',value:c.charCodeAt(0)});}
  e.actions.push({clock:e.end_clock,type:'capture-stop'});e.actions.sort((a,b)=>a.clock-b.clock);tools.validateExperiment(e);$('p1715-write').checked=e.writable;await power(e);
 },startReplay:async loaded=>{
  if(on||loading||saving)throw Error('Power off before replay.');if(!loaded)throw Error('Open an investigation first.');
  const e=loaded.experiment,r=loaded.files.find(f=>f.name==='initial.rom')?.bytes,d=loaded.files.find(f=>f.name==='initial.img')?.bytes;
  const nextRom=r?r.slice().buffer:rom,nextDisk=d?d.slice().buffer:disk;
  if(await digest(nextRom)!==e.rom_sha256||await digest(nextDisk)!==e.disk_sha256)throw Error('Missing matching initial inputs; load the ROM and disk identified by this investigation.');
  rom=nextRom;disk=nextDisk;original=nextDisk.slice(0);$('p1715-backend').value=e.backend;$('p1715-write').checked=e.writable;await identity();await power(e);
 }});
 function receive(d){
  capture.receive(d);
  experiments.receive(d);
  if(d.type==='power'){on=d.on;loading=false;onPower(on);controls();status(on?'Running. Click the screen to type.':'Powered off.');}
  if(d.type==='frame'){
   screen.width=800;screen.height=480;ctx.fillStyle='#101812';ctx.fillRect(0,0,800,480);ctx.font='16px monospace';ctx.fillStyle='#83e7a0';ctx.textBaseline='top';
   const lines=Array.from({length:24},(_,y)=>Array.from(d.bytes.slice(y*80,y*80+80),c=>c>=32&&c<127?String.fromCharCode(c):'·').join(''));
   for(let y=0;y<24;y++)for(let x=0;x<80;x++)ctx.fillText(lines[y][x],x*10,y*20);
   $('p1715-text').textContent=lines.join('\n');scene()?.update();
   const s=d.stats;
   if(s[4]!==lastWrites){dirty=true;lastWrites=s[4];lastChange=performance.now();}
   $('status').textContent=d.paused?'Paused · powered on':'Running';
   $('p1715-stats').textContent=`${backend()} · achieved ${d.measured.toFixed(2)}×\nClocks ${s[0]} · cylinder ${s[1]} · sector ${s[2]}\nFields ${s[3]} · writes ${s[4]} · rejected writes ${s[5]}\nWAIT clocks ${s[6]} · RX over/under ${s[7]}/${s[8]} · TX early/late ${s[9]}/${s[10]}\nKeyboard queued ${s[11]} · accepted ${s[13]} · rejected ${s[14]} (disabled ${s[15]}, full ${s[16]})\nGuest keyboard: ${d.guest?`queued ${d.guest.queued} · drops ${d.guest.drops} · decoded ${d.guest.decoded}`:'counters unavailable'}\n${s[20]<0?'':`Firmware state ${s[20]} · dirty blocks ${s[21]} · storage error ${s[22]} · RTL requests ${s[23]}\n`}${dirty?'Unsaved disk changes':'No unsaved disk changes'}`;
   if(dirty&&!saving&&performance.now()-lastChange>1500&&!s[18]&&!s[19]&&s[21]<=0&&$('p1715-remember').checked)save().catch(e=>{lastChange=performance.now()+30000;status(e.message);});
  }
  if(d.type==='disk'){const p=requests.get(d.id);requests.delete(d.id);p?.resolve({bytes:d.bytes,writes:d.writes});}
  if(d.type.startsWith('debug-'))debug(d);
  if(d.type==='error'||d.type==='fatal'){
   const p=requests.get(d.id);requests.delete(d.id);p?.reject(Error(d.message));status(d.message);
   if(d.type==='fatal'||d.stopped||loading){loading=false;on=false;onPower(false);stopWorker();controls();}
  }
 }
 async function power(experiment){
  if(loading||saving)return;
  if(on){await save(false,true);stopWorker();on=false;onPower(false);controls();status('Powered off; accepted writes saved.');return;}
  if(!rom)return;
  loading=true;controls();clearScreen();stopWorker();const epoch=generation;
  worker=new Worker(new URL('./pico1715.worker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{if(epoch===generation)receive(data);};
  worker.onerror=e=>{e.preventDefault();if(epoch===generation)receive({type:'fatal',message:e.message||'Simulator worker failed.'});};
  debug({type:'configured'});lastWrites=0;lastChange=0;dirty=false;writable=$('p1715-write').checked;
  experiments.started();send({type:'init',backend:backend(),base:base.href,rom,disk,writable,keyboardMap,platformCode,build:manifest,record:!experiment&&experiments.recording(),experiment});
  if(!experiment){send({type:'speed',value:Number($('p1715-speed').value)});send({type:'visibility',hidden:document.hidden});}
 }
 const action=(id,fn)=>$(id).onclick=()=>Promise.resolve().then(fn).catch(e=>status(e.message));
 action('p1715-demo',demo);action('p1715-export',()=>save(true));
 action('p1715-restore',async()=>{await saved();});
 action('p1715-discard',async()=>{if(!confirm('Discard this saved disk and all working changes?'))return;await stored(key,null);disk=original.slice(0);dirty=false;status('Original disk restored.');});
 action('p1715-import',async()=>{
  const rf=$('p1715-rom').files[0],df=$('p1715-disk').files[0];if(!rf||!df)throw Error('Select both a ROM and a disk.');
  if(rf.size!==2048||df.size!==819200)throw Error('Expected a 2048-byte ROM and 819200-byte disk.');
  const [r,d]=await Promise.all([rf.arrayBuffer(),df.arrayBuffer()]);rom=r;original=d;disk=d.slice(0);keyboardMap=platformCode=undefined;await identity();
  label=`Local ROM ${await digest(r)} · disk ${await digest(d)} · compatibility unqualified`;$('p1715-media').textContent=label;
  status('Local media loaded.');if($('p1715-remember').checked)await saved();
 });
 action('p1715-type',()=>send({type:'paste',text:$('p1715-paste').value}));action('p1715-cancel',()=>send({type:'cancel-paste'}));
 $('p1715-backend').onchange=()=>identity().then(()=>status('Backend selected; current working disk retained.')).catch(e=>status(e.message));
 $('p1715-speed').onchange=()=>send({type:'speed',value:Number($('p1715-speed').value)});
 screen.addEventListener('keydown',e=>{
  if(!active)return;e.stopImmediatePropagation();if(e.ctrlKey&&e.key==='Escape'){e.preventDefault();screen.blur();return;}if(!on)return;
  let ch;if(e.ctrlKey&&/^[a-z]$/i.test(e.key))ch=e.key.toUpperCase().charCodeAt(0)-64;
  else if(!e.ctrlKey&&!e.metaKey&&!e.altKey){ch={Enter:13,Backspace:8,Tab:9,Escape:27}[e.key];if(ch===undefined&&e.key.length===1&&e.key>=' '&&e.key<='~')ch=e.key.charCodeAt(0);}
  if(ch!==undefined){e.preventDefault();if(ch===3)send({type:'cancel-paste'});send({type:'key',key:ch});}
 },true);
 document.addEventListener('visibilitychange',()=>send({type:'visibility',hidden:document.hidden}));
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 return {send,power,async activate(){screen.parentElement.querySelector('p').textContent='Click the display to type. Escape is sent to the guest; Ctrl+Escape releases focus.';active=true;panel.hidden=false;document.body.classList.add('classic-1715');$('screen-panel').hidden=false;$('debug-controls').hidden=false;$('controls-diagnose').hidden=false;
   $('debug-controls').querySelector('p').textContent='Pause the complete machine. Step advances to the next instruction boundary, up to 100,000 clocks. Inspection has no guest bus side effects.';
   if(!rom)await demo();else controls();
  },deactivate(){screen.parentElement.querySelector('p').textContent='Click the display to type. Escape releases keyboard focus.';$('debug-controls').querySelector('p').textContent=originalDebugText;active=false;panel.hidden=true;document.body.classList.remove('classic-1715');stopWorker();on=false;},get active(){return active;}};
}
