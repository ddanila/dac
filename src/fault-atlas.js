import './fault-atlas.css';
import {openAtlas} from './fault-atlas-data.js';
import {readReplay} from './monitor-replay.js';
const $=id=>document.getElementById(id);
const element=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const svg=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
const number=n=>Number(n).toPrecision(5);
let atlas,entry,nominal,recording,baseline,request=0,selectedNet=null;
const cache=new Map();
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function error(e){$('status').textContent=e.message;$('status').classList.add('error');}
async function replay(id){
  if(!cache.has(id)){
    while(cache.size>=4){const oldest=[...cache.keys()].find(key=>key!=='nominal');cache.delete(oldest);}
    cache.set(id,atlas.file(id+'.mcrt').then(data=>readReplay(data.buffer)).then(r=>{
      const c=atlas.index.cases.find(c=>c.definition.id===id);
      if(r.meta.model_id!==atlas.index.model_id||r.meta.hashes?.deck!==c.model_hashes?.deck||
        (id==='nominal'?r.meta.fault!==null:r.meta.fault?.definition?.id!==id))throw Error('Replay does not belong to this atlas case.');
      return r;
    }));
  }
  return cache.get(id);
}
function buttons(){
  const matches=atlas.index.cases.filter(c=>!$('stage').value||c.definition.stage===$('stage').value)
    .filter(c=>!$('mechanism').value||c.definition.operation===$('mechanism').value)
    .filter(c=>!$('symptom').value||c.definition.symptoms?.includes($('symptom').value))
    .filter(c=>!$('validation').value||c.status===$('validation').value);
  $('cases').replaceChildren(...matches.map(c=>{const b=element('button',c.definition.name);b.dataset.id=c.definition.id;b.setAttribute('aria-current',String(c===entry));b.append(element('small',c.status));b.onclick=()=>select(c);return b;}));
  if(!matches.length)$('cases').append(element('p','No matching cases.'));
}
function connectivity(){
  $('net-filter').replaceChildren();
  if(selectedNet){const clear=element('button','Clear net: '+selectedNet);clear.onclick=()=>{selectedNet=null;connectivity();};$('net-filter').append(clear);}
  $('atlas-components').replaceChildren(...atlas.index.components.map(c=>{
    const tr=document.createElement('tr');tr.dataset.target=String(c.source_id===entry.definition.target);tr.dataset.connected=String(c.nodes.includes(selectedNet));
    tr.append(element('td',c.source_id));const nets=document.createElement('td');
    c.nodes.forEach((n,i)=>{const b=element('button',`${i+1}: ${n}`);b.onclick=()=>{selectedNet=n;connectivity();};nets.append(b,document.createTextNode(' '));});
    tr.append(nets,element('td',c.value));return tr;
  }));
  $('component-note').textContent=entry.definition.target?`Fault target: ${entry.definition.target}. ${atlas.index.components.some(c=>c.source_id===entry.definition.target)?'Highlighted in the reference circuit; fault mutations are recorded separately in the report.':'This target is outside the modeled connectivity.'}`:'Reference circuit before fault injection.';
}
function draw(){
  const p=atlas.index.probes.find(p=>p.id===$('atlas-probe').value);
  $('probe-evidence').textContent=`${p.source_id} · ${p.access}. Reference: ${p.reference_point}. ${p.measurement_requirements}`;
  $('probe-source').hidden=!p.source;
  // Fixed reviewed source; never follow a recording-supplied URL.
  $('probe-source').href='https://www.tiffe.de/Robotron/Monitore/Monitore_2/K7222.11_.21_sch.pdf#page=16';
  const traces=[baseline,recording].map(r=>({r,col:r.trace.fields.findIndex(f=>f.id===p.id&&f.unit===p.unit)}));
  if(traces.some(t=>t.col<1))throw Error('Replay probe identities do not match the atlas.');
  const start=baseline.start,end=baseline.end;
  if(recording.start!==start||recording.end!==end)throw Error('Replay conditions use incompatible time windows.');
  let low=Infinity,high=-Infinity;
  for(const {r,col} of traces)for(let i=0;i<r.trace.rows;i++){const v=r.trace.values[i*r.trace.stride+col];low=Math.min(low,v);high=Math.max(high,v);}
  const pad=Math.max((high-low)*.08,Math.max(Math.abs(low),Math.abs(high))*.001,1e-9);low-=pad;high+=pad;
  const x=t=>70+(t-start)/(end-start)*800,y=v=>255-(v-low)/(high-low)*220,plot=$('plot');plot.replaceChildren();
  plot.append(svg('rect',{x:0,y:0,width:900,height:300,fill:'#080f0c'}));
  for(const w of atlas.index.scenario.feature_windows)plot.append(svg('rect',{x:x(w.start),y:35,width:x(w.stop)-x(w.start),height:220,fill:'#a8bc9c',opacity:.08}));
  for(let i=0;i<=4;i++){
    const yy=35+55*i,v=high-(high-low)*i/4;plot.append(svg('line',{x1:70,x2:870,y1:yy,y2:yy,stroke:'#304336'}));
    const label=svg('text',{x:65,y:yy+4,fill:'#c5d1c0','text-anchor':'end','font-size':11});label.textContent=number(v);plot.append(label);
    const time=start+(end-start)*i/4,tick=svg('text',{x:x(time),y:280,fill:'#c5d1c0','text-anchor':'middle','font-size':12});tick.textContent=(time*1e6).toFixed(0)+' µs';plot.append(tick);
  }
  // Min/max per horizontal pixel preserve brief excursions when decimating.
  traces.forEach(({r,col},index)=>{
    const bins=new Map();for(let i=0;i<r.trace.rows;i++){const t=r.trace.values[i*r.trace.stride],v=r.trace.values[i*r.trace.stride+col],pixel=Math.floor(x(t));let bin=bins.get(pixel);if(!bin){bin=[];bins.set(pixel,bin);}bin.push({i,t,v});}
    const points=[];for(const bin of bins.values()){let min=bin[0],max=bin[0];for(const q of bin){if(q.v<min.v)min=q;if(q.v>max.v)max=q;}points.push(...[bin[0],min,max,bin.at(-1)].sort((a,b)=>a.i-b.i));}
    plot.append(svg('polyline',{points:points.map(q=>`${x(q.t).toFixed(2)},${y(q.v).toFixed(2)}`).join(' '),fill:'none',stroke:index?'#e5bc76':'#a6d694','stroke-width':1.5}));
  });
  const title=svg('text',{x:70,y:21,fill:'#dce7dc','font-size':13});title.textContent=`${p.name} · ${p.unit} — green nominal / amber ${entry.definition.id}`;plot.append(title);
  const statistic=$('statistic').value;
  $('ranges').replaceChildren(...atlas.index.scenario.feature_windows.map(w=>{
    const key=`${p.id}|${w.id}|${statistic}`,a=nominal.features[key],b=entry.features[key];if(!a||!b)throw Error('Missing feature interval.');
    const tr=document.createElement('tr');for(const text of [w.id,`${number(a.minimum)} … ${number(a.maximum)} ${p.unit}`,`${number(b.minimum)} … ${number(b.maximum)} ${p.unit}`])tr.append(element('td',text));return tr;
  }));
}
async function select(c){
  const generation=++request;entry=c;buttons();$('status').classList.remove('error');$('case-title').textContent=c.definition.name;
  $('case-state').textContent=`${atlas.index.revision} · ${c.status} · hardware validation: none`;
  $('case-conditions').textContent=atlas.index.scenario.conditions;
  $('case-reason').textContent=c.reason||'All declared numerical checks passed for this sampled stage model. This does not establish historical or hardware accuracy.';
  $('prediction').hidden=true;$('report').disabled=false;connectivity();
  $('rejected-checks').hidden=c.status==='accepted-simulation'||!c.validation;
  $('rejection-detail').textContent=JSON.stringify(c.validation?{failures:c.validation.failures,numerical_checks:c.validation.numerical_checks}:null,null,2);
  if(c.status!=='accepted-simulation'){$('status').textContent='Prediction withheld: '+c.status;return;}
  $('status').textContent='Loading verified waveforms…';
  try{
    const pair=await Promise.all([replay('nominal'),replay(c.definition.id)]);if(generation!==request)return;
    [baseline,recording]=pair;draw();$('prediction').hidden=false;
    $('ambiguity').textContent=c.similar_faults.length?'These cases overlap across the sampled feature intervals. They cannot be distinguished by this atlas summary.':'No other accepted case overlaps across every sampled feature interval. This is not a guarantee of fault identification.';
    $('similar').replaceChildren(...c.similar_faults.map(id=>{const other=atlas.index.cases.find(c=>c.definition.id===id),b=element('button',other.definition.name);b.onclick=()=>select(other);return b;}));
    const held=atlas.index.held_out_confusion.filter(h=>h.actual===c.definition.id);
    $('held-out').textContent=`${held.length} held-out parameter combinations; ${held.filter(h=>h.outside_own_training_envelope).length} outside this case’s training envelope; ${held.filter(h=>h.compatible.length>1).length} compatible with multiple cases. These are model checks, not observed diagnostic success rates.`;
    $('numerical').textContent=JSON.stringify(c.validation.numerical_checks,null,2);
    $('status').textContent=`${atlas.index.ensemble.training} joint training samples + ${atlas.index.ensemble.held_out} held-out samples per accepted case. Numerical acceptance only.`;
  }catch(e){if(generation===request){$('prediction').hidden=true;error(e);}}
}
$('atlas-probe').onchange=$('statistic').onchange=()=>{try{draw();}catch(e){error(e);}};
$('plot-download').onclick=()=>download(new XMLSerializer().serializeToString($('plot')),entry.definition.id+'-waveform.svg','image/svg+xml');
$('report').onclick=async()=>{
  const id=entry.definition.id;
  try{
    const report=JSON.parse(new TextDecoder().decode(await atlas.file(id+'.json')));
    download(JSON.stringify({...report,format:'dac-monitor-atlas-case-report-v1',model_id:atlas.index.model_id,
      ensemble:atlas.index.ensemble,publication_gate:atlas.index.publication_gate,
      source_hashes:atlas.index.source_hashes,held_out_checks:atlas.index.held_out_confusion.filter(h=>h.actual===id)},null,2),id+'.json','application/json');
  }catch(e){error(e);}
};
try{
  atlas=await openAtlas(import.meta.env.BASE_URL+'monitor/atlas/');nominal=atlas.index.cases.find(c=>c.definition.id==='nominal');
  $('scope').textContent=atlas.index.scope;
  for(const [id,values] of [['stage',atlas.index.cases.map(c=>c.definition.stage)],['mechanism',atlas.index.cases.map(c=>c.definition.operation)],['symptom',atlas.index.cases.flatMap(c=>c.definition.symptoms||[])],['validation',atlas.index.cases.map(c=>c.status)]]){
    for(const value of [...new Set(values.filter(Boolean))].sort()){$(id).append(new Option(value,value));}$(id).onchange=buttons;
  }
  for(const p of atlas.index.probes)$('atlas-probe').append(new Option(`${p.name} · ${p.unit}`,p.id));
  $('atlas-probe').value=atlas.index.probes.find(p=>p.name==='cathode')?.id||atlas.index.probes[0].id;
  $('limitations').replaceChildren(...atlas.index.limitations.map(s=>element('li',s)));
  $('provenance').textContent=JSON.stringify({model:atlas.index.model_id,revision:atlas.index.revision,ensemble:atlas.index.ensemble,publication_gate:atlas.index.publication_gate,source_hashes:atlas.index.source_hashes},null,2);
  await select(nominal);
}catch(e){error(e);}
