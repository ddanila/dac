import {inspectDisk,fileBytes} from './disk-map.js';

// Recognise only the reference TOS/M 8x12 font supplied with verified media.
export function referenceScreenReader(disk){
 const font=new Uint8Array(disk,106496,1536),glyphs=new Map();
 for(let c=32;c<127;c++)glyphs.set(Array.from({length:12},(_,y)=>font[y*128+c]).join(','),String.fromCharCode(c));
 return (pixels,width,height)=>{
  if(width!==640||height!==288)return '';
  const lines=[];
  for(let row=0;row<24;row++){let line='';for(let col=0;col<80;col++){
   const bits=Array.from({length:12},(_,y)=>{let v=0;for(let x=0;x<8;x++)if(pixels[((row*12+y)*width+col*8+x)*4+1]>100)v|=128>>x;return v;});
   line+=glyphs.get(bits.join(','))??glyphs.get(bits.map(v=>v^255).join(','))??'�';
  }lines.push(line.trimEnd());}return lines.join('\n').trimEnd();
 };
}
export function practiceObservations(name,text,saved=false){
 const boot=/(?:^|\n)A>$/.test(text);
 if(name==='wordstar')return [boot,/DAC\.TXT/.test(text)&&!/A>WS DAC\.TXT$/.test(text),/HELLO FROM DAC/.test(text),saved&&/EDITING NO FILE/.test(text),saved&&/DAC\.TXT/.test(text)&&/HELLO FROM DAC/.test(text)&&!/EDITING NO FILE/.test(text),false];
 if(name==='pascal')return [boot,/DAC.PAS=CON:/.test(text),/begin writeln/i.test(text),saved,/TURBO PASCAL/i.test(text),false,/COMPILING/i.test(text)&&/RUNNING/i.test(text)&&/HELLO FROM DAC/.test(text)];
 return [boot,/PIP LST:=AUTOEXC.SUB/.test(text),false,false];
}
export function installPracticeGuide(host,name,practice,send){
 const heading=document.createElement('h3');heading.textContent=practice.title;
 const progress=document.createElement('p');progress.role='status';
 const explanation=document.createElement('p');explanation.textContent='Load historical media with a writable practice disk. Recognised screen and saved-file milestones are marked automatically; you can also mark steps yourself. Save a recovery point at A> before beginning.';
 const checks=[],notes=[],list=document.createElement('div');
 const update=()=>{progress.textContent=`${checks.filter(c=>c.checked).length} of ${checks.length} steps checked · automatic marks describe observed evidence.`;};
 for(const step of practice.steps.split(/\n(?=\d+\.)/)){
  const label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span'),note=document.createElement('small');check.type='checkbox';check.disabled=true;check.onchange=update;text.textContent=step;checks.push(check);notes.push(note);label.append(check,text,note);list.append(label);
 }
 const reset=document.createElement('button');reset.textContent='Reset practice progress';
 const save=document.createElement('button');save.textContent='Save practice recovery point';save.disabled=true;
 const restore=document.createElement('button');restore.textContent='Restore practice recovery point';restore.disabled=true;
 const status=document.createElement('p');status.dataset.practiceStatus='';status.setAttribute('aria-live','polite');
 let reader,last=0,saved=false,key=null,epoch=0,pending=false,lastDisk=-1;
 function clear(){saved=false;checks.forEach(c=>c.checked=false);notes.forEach(n=>n.textContent='');update();}
 reset.onclick=clear;
 save.onclick=()=>{save.disabled=true;send({type:'checkpoint-save',name:`Practice: ${name}`,practice:epoch});status.textContent='Saving machine and both disks…';};
 restore.onclick=()=>{if(key){send({type:'checkpoint-restore',key});status.textContent='Restoring recovery point…';}};
 host.append(heading,explanation,progress,list,reset,save,restore,status);update();
 return {
  configure(disk){epoch++;reader=disk?referenceScreenReader(disk):null;key=null;pending=false;lastDisk=-1;save.disabled=restore.disabled=true;checks.forEach(c=>c.disabled=true);clear();},
  frame(d,on){if(!reader||!on||performance.now()-last<500)return;last=performance.now();const text=reader(new Uint8Array(d.pixels),d.width,d.height);
   save.disabled=!/(?:^|\n)A>$/.test(text);
   practiceObservations(name,text,saved).forEach((hit,i)=>{if(hit&&checks[i]&&(name!=='wordstar'||i!==4||checks[3].checked)){checks[i].checked=true;notes[i].textContent=i===3&&saved?' · Saved file verified on disk.':' · Observed on screen.';}});update();
   if(!pending&&lastDisk!==d.activity){pending=true;lastDisk=d.activity;send({type:'inspect-disk',unit:0,request:`practice:${epoch}`});}
  },
  message(d){
   if(d.type==='configured')checks.forEach(c=>c.disabled=false);
   if(d.type==='disk-inspection'&&d.request===`practice:${epoch}`){pending=false;if(d.error)return;try{saved=false;const map=inspectDisk(d.bytes),file=map.files.find(f=>f.key===`0:${name==='wordstar'?'DAC.TXT':'DAC.PAS'}`);if(file){const text=new TextDecoder().decode(fileBytes(map,file));saved=name==='wordstar'?text.includes('HELLO FROM DAC'):text.includes('program DAC')&&text.includes('HELLO FROM DAC');}}catch{saved=false;}}
   if(d.type==='practice-checkpoint'&&d.practice===epoch){key=d.key;restore.disabled=false;status.textContent='Recovery point saved with both disks.';}
   if(d.type==='checkpoint-status')status.textContent=d.message;
   if(d.type==='checkpoint-restored'){clear();lastDisk=-1;pending=false;}
   if(name==='printer'&&d.type==='printer-preview'&&d.bytes.byteLength){checks[2].checked=true;notes[2].textContent=' · Printer output received.';update();}
  }
 };
}
