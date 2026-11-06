import {loadHistoricalRobotron} from './historical-media.js';
import keyMap from './s600-paste.json';
import {inspectDisk,fileBytes} from './disk-map.js';
import {digest,sessionIdentity,stored} from './session-store.js';
import {saveCheckpoint,loadCheckpoint,encodeCheckpoint} from './checkpoints.js';
import {workdaySteps,sampleLetter,workdayEvidence} from './learning-model.js';
let requestId=0,pulse=0;
let m,config,build,session=0,h=0,branch=0,checkpoints=[],completed=[],timer,paused=true,queue=Promise.resolve(),step=0;
const base=new URL(import.meta.env.BASE_URL,self.location.origin);
const emit=(type,data={})=>postMessage({type,session,requestId,...data});
function put(b,fn){const p=m._malloc(b.byteLength);try{m.HEAPU8.set(new Uint8Array(b),p);return fn(p,b.byteLength);}finally{m._free(p);}}
function create(){const n=m._dac_create(2);try{for(const [slot,b]of config.firmware)if(put(b,(p,l)=>m._dac_load(n,slot,p,l)))throw Error('Firmware load failed');for(let u=0;u<2;u++)if(put(config.disks[u],(p,l)=>m._dac_mount_unit(n,u,p,l,1)))throw Error('Disk mount failed');if(m._dac_power(n,1))throw Error('Power-on failed');return n;}catch(e){m._dac_destroy(n);throw e;}}
function state(n=h){const size=m._dac_state_size(n),p=m._malloc(size);try{if(!size||m._dac_state_save(n,p,size))throw Error('Snapshot failed');return m.HEAPU8.slice(p,p+size);}finally{m._free(p);}}
function restore(n,b){if(put(b,(p,l)=>m._dac_state_load(n,p,l)))throw Error('Checkpoint rejected');}
const disk=(u,n=h)=>m.HEAPU8.slice(m._dac_disk_data_unit(n,u),m._dac_disk_data_unit(n,u)+m._dac_disk_size_unit(n,u));
function file(u,n=h){const map=inspectDisk(disk(u,n)),f=map.files.find(f=>f.key==='0:LETTER.TXT');return f?fileBytes(map,f):new Uint8Array();}
function text(n=h){return Array.from({length:24},(_,y)=>String.fromCharCode(...Array.from({length:80},(_,x)=>m._dac_dive_screen(n,y*80+x)&127)).replace(/[^\x20-\x7e]/g,' ').trimEnd()).join('\n').trimEnd();}
const printer=(n=h)=>m.HEAPU8.slice(m._dac_printer_data(n),m._dac_printer_data(n)+m._dac_printer_size(n));
function check(n=h){return workdayEvidence({screen:text(n),source:file(0,n),destination:file(1,n),printer:printer(n),completed});}
function snapshot(n=h,message=''){
 const evidence=check(n);if(n===h&&evidence[step]&&!completed.includes(workdaySteps[step].id)){completed.push(workdaySteps[step].id);if(step<5){step++;checkpoints[step]=state();}}
 const p=m._dac_video(n),width=m._dac_width(n),height=m._dac_height(n),pixels=m.HEAPU8.slice(p,p+width*height*4);
 emit('learning-frame',{width,height,pixels,screen:text(n),step,completed,branch:n!==h,paused,message,printer:printer(n),sourceLength:file(0,n).length,destinationLength:file(1,n).length,cycles:m._dac_debug_reg(n,17)+m._dac_debug_reg(n,18)*4294967296});
}
async function run(n,ticks,token=session){for(let t=0;t<ticks;t+=100000){if(token!==session)throw Error('Activity cancelled');m._dac_run(n,Math.min(100000,ticks-t));if(t%1000000===0)await new Promise(r=>setTimeout(r,0));}}
async function type(n,s){if(s.length>2048)throw Error('Send at most 2048 characters');const pairs=[...s].map(ch=>{const c=ch.charCodeAt(0);return keyMap[c]||(c>0&&c<27&&keyMap[c+96]?[keyMap[c+96][0],2]:c>=27&&c<=31&&keyMap[c+64]?[keyMap[c+64][0],keyMap[c+64][1]|2]:null);});if(pairs.some(p=>!p))throw Error('This keyboard input is not mapped. Use plain ASCII text.');for(const p of pairs){if(m._dac_tap(n,p[0],p[1]))throw Error('Key rejected');await run(n,600000);}}
async function until(n,predicate,max=160000000){for(let t=0;t<max;t+=1000000){await run(n,1000000);if(predicate()){await run(n,1000000);return true;}if(t%10000000===0)emit('learning-status',{message:'Executing the original firmware and software…'});}snapshot(n,'The expected screen was not reached. Inspect the current demonstration or return to your work.');throw Error('The expected screen was not reached; your original practice is preserved.');}
function stop(){pulse++;paused=true;clearTimeout(timer);}
function pump(token=pulse){if(paused||!h||token!==pulse)return;queue=queue.then(async()=>{await run(h,400000);snapshot();}).catch(e=>{stop();emit('learning-error',{message:e.message});}).finally(()=>{if(!paused&&token===pulse)timer=setTimeout(()=>pump(token),100);});}
async function demo(){stop();if(branch)m._dac_destroy(branch);branch=create();restore(branch,checkpoints[step]||state());const n=branch;
 if(step===0)await until(n,()=>/(?:^|\n)A>$/.test(text(n)));
 if(step===1){await type(n,'WS LETTER.TXT\r');await until(n,()=>/^\s*A:LETTER\.TXT\s+PAGE\s+\d+\s+LINE/.test(text(n).split('\n')[0]));await type(n,sampleLetter);}
 if(step===2){await type(n,'\x0bD');await until(n,()=>check(n)[2],30000000);}
 if(step===3){await type(n,'D');await until(n,()=>text(n).includes('NAME OF FILE TO EDIT?'),30000000);await type(n,'LETTER.TXT\r');await until(n,()=>check(n)[3],30000000);}
 if(step===4){await type(n,'\x0bD');await until(n,()=>text(n).includes('S  RUN SPELLSTAR'),30000000);await type(n,'X');await until(n,()=>/(?:^|\n)A>$/.test(text(n)),30000000);await type(n,'PIP B:LETTER.TXT=A:LETTER.TXT\r');await until(n,()=>check(n)[4],80000000);}
 if(step===5){await type(n,'PIP LST:=LETTER.TXT\r');await until(n,()=>check(n)[5],80000000);await until(n,()=>/(?:^|\n)A>$/.test(text(n)),30000000);}
 snapshot(n,'Demonstration branch. Your work is preserved. Adopt this result or return to your work.');
}
async function record(){const bytes=state().buffer,disks=[0,1].map(u=>({bytes:disk(u).buffer,writable:true,label:'Practice disk '+(u?'B':'A')})),firmwareIdentity=await sessionIdentity(2,config.firmware,null);for(const d of disks)d.sha256=await digest(d.bytes);return {name:'Workstation practice',date:Date.now(),kind:2,build,firmwareIdentity,stateKey:`state:${build}:${firmwareIdentity}`,bytes,sha256:await digest(bytes),disks};}
async function handle(d){
 requestId=d.requestId||0;
 if(d.type==='learning-start'){
 stop();if(h)m._dac_destroy(h);if(branch)m._dac_destroy(branch);h=branch=0;session=d.session;completed=[];step=0;checkpoints=[];
 if(!m){const {default:createModule}=await import(/* @vite-ignore */ new URL('emulator/dac.js?v='+import.meta.env.VITE_EMULATOR_REVISION,base).href);m=await createModule({locateFile:n=>new URL('emulator/'+n+'?v='+import.meta.env.VITE_EMULATOR_REVISION,base).href});build=import.meta.env.VITE_EMULATOR_REVISION;}
 const media=await loadHistoricalRobotron(base);config={firmware:media.firmware,disks:[new Uint8Array(media.disk),new Uint8Array(819200).fill(0xe5)]};h=create();checkpoints[0]=state();snapshot(h,'Private practice ready. Resume to boot, or demonstrate this step.');return;
 }
 if(d.session!==session||!h)return;
 if(d.type==='learning-resume'){stop();paused=false;snapshot();pump();return;}
 if(d.type==='learning-pause'){stop();snapshot();return;}
 stop();
 if(d.type==='learning-input'){if(branch)throw Error('Return from the demonstration before typing.');await type(h,d.text);await run(h,1000000);paused=false;snapshot();pump();}
 if(d.type==='learning-observe'){await run(h,1000000);snapshot();}
 if(d.type==='learning-demo')await demo();
 if(d.type==='learning-adopt'){if(!branch)throw Error('No demonstration branch');m._dac_destroy(h);h=branch;branch=0;snapshot(h,'Demonstration adopted.');}
 if(d.type==='learning-return'){if(branch)m._dac_destroy(branch);branch=0;snapshot(h,'Your original work.');}
 if(d.type==='learning-retry'){if(branch)m._dac_destroy(branch);branch=0;restore(h,checkpoints[step]);snapshot(h,'Restored this step’s starting checkpoint.');}
 if(d.type==='learning-save'){const key=await saveCheckpoint(await record());await stored('learning-workday-1',{key,step,completed});snapshot(h,'Practice saved locally with both disks.');}
 if(d.type==='learning-load'){const progress=await stored('learning-workday-1');if(!progress)throw Error('No saved practice');if(!Number.isInteger(progress.step)||progress.step<0||progress.step>5||!Array.isArray(progress.completed)||progress.completed.some(v=>!workdaySteps.some(s=>s.id===v)))throw Error('Saved progress is damaged. Your current practice is preserved; the named checkpoint can still be exported.');const r=await loadCheckpoint(progress.key);if(r.build!==build||r.firmwareIdentity!==await sessionIdentity(2,config.firmware,null))throw Error('Saved practice uses different firmware or runtime. Export it from Named checkpoints.');const next=create();try{restore(next,new Uint8Array(r.bytes));}catch(e){m._dac_destroy(next);throw e;}m._dac_destroy(h);if(branch)m._dac_destroy(branch);branch=0;h=next;step=Math.max(0,Math.min(5,progress.step));completed=progress.completed.filter(v=>workdaySteps.some(s=>s.id===v));checkpoints[step]=state();snapshot(h,'Saved practice restored.');}
 if(d.type==='learning-export'){const bytes=d.what==='state'?new Uint8Array(await encodeCheckpoint(await record())):d.what==='document'?file(0):d.what==='printer'?printer():disk(d.what==='diskB'?1:0);emit('learning-download',{bytes,name:({state:'practice.daccheckpoint',document:'LETTER.TXT',printer:'letter.prn',diskA:'practice-a.img',diskB:'practice-b.img'})[d.what]});snapshot();}
}
self.onmessage=({data:d})=>{if(d.type==='learning-cancel'){stop();session++;emit('learning-status',{message:'Cancelled. Close and reopen to start again.'});return;}if(d.type!=='learning-start'&&d.session===session)stop();queue=queue.then(()=>handle(d)).catch(e=>emit('learning-error',{message:e.message}));};
