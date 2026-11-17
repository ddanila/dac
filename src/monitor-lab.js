import './monitor-lab.css';
import {MAX_BYTES,readReplay,sampleAt,frameAt,matchingProbe} from './monitor-replay.js';

const $=id=>document.getElementById(id);
let replay=null, comparison=null, time=0, playing=false, last=0, loadGeneration=0, compareGeneration=0;
const scratch=document.createElement('canvas');scratch.width=160;scratch.height=112;
const scratchContext=scratch.getContext('2d');
const image=scratchContext.createImageData(160,112);
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function stop(){playing=false;$('play').textContent='Play';}
function setTime(value){time=Math.max(replay?.start||0,Math.min(replay?.end||0,value));$('timeline').value=time;render();}
function phosphor(canvas,recording){
  const frame=frameAt(recording,time),ctx=canvas.getContext('2d');
  if(!frame){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#a9b8a5';ctx.font='18px system-ui';ctx.fillText('Electrical stage recording · no phosphor simulation',25,canvas.height/2);return;}
  for(let i=0;i<frame.data.length;i++){
    const v=frame.data[i],j=i*4;image.data[j]=v*.52;image.data[j+1]=v;image.data[j+2]=v*.63;image.data[j+3]=255;
  }
  scratchContext.putImageData(image,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(scratch,0,0,canvas.width,canvas.height);
}
function cutaway(row){
  const ctx=$('cutaway').getContext('2d'),w=640,h=448;ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='#668573';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(55,185);ctx.lineTo(190,185);ctx.lineTo(525,65);ctx.quadraticCurveTo(565,224,525,383);ctx.lineTo(190,263);ctx.lineTo(55,263);ctx.closePath();ctx.stroke();
  ctx.strokeStyle='#9f8c69';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(195,173);ctx.lineTo(220,165);ctx.moveTo(195,275);ctx.lineTo(220,283);ctx.stroke();
  ctx.fillStyle='#9caf9d';ctx.font='13px system-ui';ctx.fillText('Cathode',47,310);ctx.fillText('Deflection yoke',175,330);ctx.fillText('Phosphor',500,410);
  ctx.fillText(`${(row[2]/1000).toFixed(2)} kV`,420,42);ctx.fillText(`${(row[7]*1e6).toFixed(2)} µA beam current`,30,40);
  if(row[11] && row[7]>0){
    // Horizontal side projection; vertical landing appears on the screen view.
    const endpoint=224-row[8]/.105*145;
    ctx.strokeStyle='#b9ed8d';ctx.lineWidth=Math.min(5,1+row[7]*100000);ctx.beginPath();ctx.moveTo(80,224);ctx.lineTo(207,224);ctx.lineTo(540,endpoint);ctx.stroke();
    ctx.fillStyle='#e2ff9d';ctx.beginPath();ctx.arc(540,endpoint,4,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#a9b8a5';ctx.font='12px system-ui';ctx.fillText(`Landing: ${(row[8]*1000).toFixed(1)}, ${(row[9]*1000).toFixed(1)} mm`,30,390);
  if(!row[11])ctx.fillText('No in-range landing in this optical model',30,420);
}
const signalFields={video:['computer_video','monitor_video','receiver_video'],bsyn:['computer_bsyn','monitor_bsyn','receiver_sync'],intens:['computer_intens','monitor_intens','receiver_intens']};
function pathFields(){return signalFields[$('signal-group').value]?.map(name=>replay.trace.fields.findIndex(f=>f.name===name&&f.unit==='V')).filter(i=>i>0)||[];}
function waveform(field){
  const canvas=$('waveform'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);let low=Infinity,high=-Infinity;
  const selected=pathFields(),columns=selected.length?selected:[field];
  const records=[replay,comparison].filter(Boolean).flatMap((r,record)=>columns.map((column,position)=>({r,index:matchingProbe(replay,r,column),record,position}))).filter(item=>item.index>0);
  $('signal-legend').hidden=!selected.length;
  $('signal-legend').textContent=selected.length?'Green: computer connector · Blue: monitor connector · Purple: receiver output. Dashed traces: comparison. Each connector voltage uses its own return reference.':'';
  for(const {r,index} of records)for(let i=index;i<r.trace.values.length;i+=r.trace.stride){low=Math.min(low,r.trace.values[i]);high=Math.max(high,r.trace.values[i]);}
  if(high-low<1e-12){low-=1;high+=1;}
  const first=Math.min(...records.map(({r})=>r.start)),last=Math.max(...records.map(({r})=>r.end)),total=last-first;
  const duration=Math.min(total,Number($('window').value)||total),start=Math.max(first,Math.min(last-duration,time-duration/2));
  const x=t=>45+(t-start)/duration*(w-60),y=v=>h-30-(v-low)/(high-low)*(h-60);
  ctx.strokeStyle='#263d30';ctx.lineWidth=1;
  for(let i=0;i<5;i++){const yy=30+i*(h-60)/4;ctx.beginPath();ctx.moveTo(45,yy);ctx.lineTo(w-15,yy);ctx.stroke();}
  // Min/max buckets retain narrow flyback peaks at overview resolution.
  records.forEach(({r,index:column,record,position})=>{
    const {values,stride}=r.trace;ctx.strokeStyle=selected.length?['#addc94','#78c9e8','#d09de5'][position]:(record?'#dbb16c':'#addc94');ctx.setLineDash(record&&selected.length?[4,3]:[]);ctx.lineWidth=1;ctx.beginPath();
    let cursor=0;while(cursor<r.trace.rows && values[cursor*stride]<start)cursor++;
    for(let px=0;px<w-60;px++){
      let minimum=Infinity,maximum=-Infinity;
      while(cursor<r.trace.rows && values[cursor*stride]<=start+duration*(px+1)/(w-60)){
        const v=values[cursor*stride+column];minimum=Math.min(minimum,v);maximum=Math.max(maximum,v);cursor++;
      }
      if(minimum!==Infinity){ctx.moveTo(px+45,y(minimum));ctx.lineTo(px+45,y(maximum)+.5);}
    }ctx.stroke();
  });
  ctx.setLineDash([]);ctx.strokeStyle='#f2e4bd';ctx.beginPath();ctx.moveTo(x(time),15);ctx.lineTo(x(time),h-15);ctx.stroke();
  ctx.fillStyle='#c4d3bb';ctx.font='12px system-ui';ctx.fillText(high.toPrecision(4),4,18);ctx.fillText(low.toPrecision(4),4,h-8);
  ctx.fillText(`${(start*1000).toFixed(3)} ms`,70,h-8);ctx.fillText(`${((start+duration)*1000).toFixed(3)} ms`,w-100,h-8);
}
function render(){
  if(!replay)return;
  $('visuals').hidden=!replay.frames.length && !comparison?.frames.length;
  $('optics-panel').hidden=replay.meta.version!==1;
  $('phosphor').hidden=!replay.frames.length;
  $('time').textContent=`${(time*1000).toFixed(3)} ms`;
  const row=sampleAt(replay,time),field=Number($('probe').value);
  const selected=pathFields();
  $('probe-value').textContent=(selected.length?selected:[field]).map(i=>`${replay.trace.fields[i].name}: ${row[i].toPrecision(5)} ${replay.trace.fields[i].unit}`).join(' · ');
  const probes=Array.isArray(replay.meta.probes)?replay.meta.probes:[];
  $('probe-evidence').textContent=(selected.length?selected:[field]).map(i=>{
    const p=probes.find(p=>p&&p.name===replay.trace.fields[i].name);
    return p&&typeof p.source_id==='string'?`${p.name}: ${p.source_id} · reference: ${typeof p.reference_point==='string'?p.reference_point:'not recorded'}`:'';
  }).filter(Boolean).join(' | ');
  phosphor($('phosphor'),replay);
  if(replay.meta.version===1)cutaway(row);else{const ctx=$('cutaway').getContext('2d');ctx.clearRect(0,0,640,448);ctx.fillStyle='#a9b8a5';ctx.font='18px system-ui';ctx.fillText('This stage does not calculate an electron trajectory.',25,224);}
  waveform(field);
  if(comparison){phosphor($('comparison'),comparison);$('compare-note').textContent=`Comparison: ${comparison.meta.name}${time>comparison.end?' · recording ended':time<comparison.start?' · recording has not started':''}`;}
}
function install(recording){
  replay=recording;stop();time=recording.start;
  const hasPath=recording.meta.model_id==='1715w-k7222-input'&&Object.values(signalFields).flat().every(name=>recording.trace.fields.some(f=>f.name===name&&f.unit==='V'));
  $('signal-group-label').hidden=!hasPath;$('signal-group').value='';$('timeline').min=recording.start;$('timeline').max=recording.end;$('timeline').value=time;
  $('probe').replaceChildren(...recording.trace.fields.flatMap((f,i)=>i && (recording.meta.version===2 || i<=7)?[new Option(`${f.name} · ${f.unit}`,String(i))]:[]));
  for(const id of ['timeline','play','line','frame'])$(id).disabled=false;
  $('recording-name').textContent=recording.meta.name;
  $('line').disabled=$('frame').disabled=recording.meta.version!==1;
  $('limitations').replaceChildren(...recording.meta.limitations.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('provenance').textContent=JSON.stringify({source:recording.meta.source,qualification:recording.meta.qualification,hashes:recording.meta.hashes,input:recording.meta.input,changes:recording.meta.changes,solver:recording.meta.solver,energy:recording.meta.energy,coverage:recording.meta.coverage,uncertainty:recording.meta.uncertainty,parameters:recording.meta.parameters,source_pages:recording.meta.source_pages,fault:recording.meta.fault,scenario:recording.meta.scenario,component_factors:recording.meta.component_factors,signal_case:recording.meta.signal_case,signal_metrics:recording.meta.signal_metrics,numerical_validation:recording.meta.numerical_validation},null,2);
  $('components').replaceChildren(...recording.meta.components.map(c=>{const tr=document.createElement('tr');for(const text of [c.source_id||c.reference,c.nodes.join(' → '),c.value]){const td=document.createElement('td');td.textContent=text;tr.append(td);}return tr;}));
  status(`${recording.trace.rows.toLocaleString()} electrical samples · ${(recording.meta.duration*1000).toFixed(2)} ms recorded · ${recording.meta.qualification}`);render();
}
async function selectExample(){
  const generation=++loadGeneration;stop();status('Loading and checking recording…');
  try{
    const response=await fetch(`${import.meta.env.BASE_URL}monitor/${$('experiment').value}.mcrt`);
    if(!response.ok)throw Error('Recording unavailable. You can open a local .mcrt file.');
    const length=Number(response.headers.get('content-length'));
    if(length>MAX_BYTES)throw Error('Recording exceeds size limit.');
    const result=await readReplay(await response.arrayBuffer());if(generation===loadGeneration)install(result);
  }catch(error){if(generation===loadGeneration)status(error.message,true);}
}
async function importFile(input,isComparison){
  const file=input.files[0];if(!file)return;
  const generation=isComparison?++compareGeneration:++loadGeneration;
  stop();status('Checking local recording…');
  try{
    if(file.size>MAX_BYTES)throw Error('Replay exceeds the 64 MiB limit.');
    const recording=await readReplay(await file.arrayBuffer());
    if(generation!==(isComparison?compareGeneration:loadGeneration))return;
    if(isComparison){comparison=recording;$('comparison').hidden=false;$('clear-compare').hidden=false;status('Comparison loaded. Both recordings use their original simulation times.');render();}
    else install(recording);
  }catch(error){if(generation===(isComparison?compareGeneration:loadGeneration))status(error.message,true);}
  input.value='';
}
$('experiment').addEventListener('change',selectExample);
$('open-replay').addEventListener('change',e=>importFile(e.target,false));
$('compare-replay').addEventListener('change',e=>importFile(e.target,true));
$('clear-compare').addEventListener('click',()=>{compareGeneration++;comparison=null;$('comparison').hidden=true;$('clear-compare').hidden=true;$('compare-note').textContent='';render();});
$('play').addEventListener('click',()=>{if(time>=replay.end)setTime(replay.start);playing=!playing;last=0;$('play').textContent=playing?'Pause':'Play';});
$('timeline').addEventListener('input',()=>{stop();setTime(Number($('timeline').value));});
$('line').addEventListener('click',()=>{stop();setTime(time+62.5e-6);});
$('frame').addEventListener('click',()=>{stop();setTime(time+.019);});
$('probe').addEventListener('change',()=>{$('signal-group').value='';render();});
$('signal-group').addEventListener('change',render);
$('window').addEventListener('change',render);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
function tick(now){if(playing && replay){if(last)setTime(time+(now-last)/1000*Number($('speed').value));last=now;if(time>=replay.end)stop();}requestAnimationFrame(tick);}
requestAnimationFrame(tick);selectExample();
