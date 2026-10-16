const svgNS='http://www.w3.org/2000/svg';
const clean=value=>(value||'').replace(/^\//,'');
export function controllerSelection(data,kind,value){
 const components=data.connectivity.components;
 const refs=Object.keys(components).filter(ref=>kind==='component'?ref===value:Object.values(components[ref].pins).includes(value));
 const placed=new Map(data.layout.components.map(c=>[c.ref,c]));
 const pins=refs.flatMap(ref=>Object.entries(components[ref].pins).filter(([,net])=>kind==='component'||net===value).map(([pin,net])=>({ref,pin,net,position:placed.get(ref)?.pads.find(p=>p.pin===pin)?.position||null})));
 return {refs,pins,points:pins.filter(p=>p.position).map(p=>p.position),unplaced:refs.filter(ref=>!placed.has(ref))};
}
export function installKeyboardControllerReview(scene){
 const panel=document.createElement('details');panel.id='keyboard-controller-review';panel.dataset.robotron='';
 panel.innerHTML='<summary>Keyboard controller circuit review</summary><p>Reference schematic and photo placement reconstruction. Copper continuity is unresolved; highlighted dots identify estimated pad locations.</p><p role="status" data-status>Open to load the controller reconstruction.</p><div data-tools hidden><label>Component <select aria-label="Controller component" data-component></select></label> <label>Net <select aria-label="Controller net" data-net></select></label> <label>Board side <select aria-label="Controller board side" data-side><option value="top">Top</option><option value="bottom">Underside</option></select></label><button type="button" data-clear>Clear highlight</button><button type="button" data-view-controller>View controller in model</button><label>Drawing zoom <input type="range" aria-label="Controller drawing zoom" data-zoom min="1" max="6" step="0.5" value="1"></label><div data-drawing style="overflow:auto"></div><p data-selection></p><p data-live>Raw LED samples are unavailable.</p><details><summary>Connected pins and evidence</summary><div data-pins></div></details><p data-qualification></p><a data-cad target="_blank" rel="noopener">Open pinned KiCad sources</a> · <a data-hdl target="_blank" rel="noopener">Open co-simulation report</a></div>';
 document.getElementById('evidence-controls').after(panel);
 let data=null,pending=false,selection=null,leds=null,latches=null;
 const get=selector=>panel.querySelector(selector),status=get('[data-status]');
 function live(){
  if(!data)return;
  const states=value=>`Caps ${value&2?'on':'off'}; SI/SO ${value&1?'on':'off'}`;
  get('[data-live]').textContent=(Number.isInteger(latches)?`Raw C latch sample: ${states(latches)}. `:'Raw latch samples are unavailable in this core. ')+(Number.isInteger(leds)?`Display indicators: ${states(leds)}. `:'')+(Number.isInteger(latches)?'Display indicators use a 2 ms peak hold. ':'This core does not expose separate raw latches. ')+'Frame samples are not full waveforms or specimen measurements.';

 }
 function draw(){
  const side=get('[data-side]').value,svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','-140 -28 280 56');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Controller ${side} reference pad map; cyan artwork has no assigned nets`);svg.style.cssText=`width:${Number(get('[data-zoom]').value)*100}%;max-width:none;min-height:140px;background:#14232d;margin-top:8px`;
  function add(tag,attrs){const e=document.createElementNS(svgNS,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;}
  add('polygon',{points:data.layout.outlinePolygon.map(([x,y])=>`${x},${-y}`).join(' '),fill:'#3c4540',stroke:'#b4bcaa','stroke-width':.3});
  for(const route of data.layout.unresolvedArtwork.filter(r=>r.side===side))add('polyline',{points:route.points.map(([x,y])=>`${x},${-y}`).join(' '),fill:'none',stroke:'#4694a1','stroke-width':route.width});
  for(const route of data.layout.routes.filter(r=>r.side===side))add('polyline',{points:route.points.map(([x,y])=>`${x},${-y}`).join(' '),fill:'none',stroke:route.net===get('[data-net]').value?'#ffe16a':'#c29155','stroke-width':route.width});
  const selected=new Set(selection?.pins.map(p=>p.ref+':'+p.pin)||[]);
  for(const c of data.layout.components)for(const p of c.pads){
   const active=selected.has(c.ref+':'+p.pin),dot=add('circle',{cx:p.position[0],cy:-p.position[1],r:active?1.4:.65,fill:active?'#ffe16a':'#c5c5b0'}),title=document.createElementNS(svgNS,'title');title.textContent=`${c.ref}:${p.pin||'mount'} ${clean(p.net)||'unconnected'}`;dot.append(title);
  }
  // Both sides use one top-view coordinate convention to preserve net identity.
  get('[data-drawing]').replaceChildren(svg);
 }
 function select(kind,value){
  selection=value?controllerSelection(data,kind,value):null;
  if(kind==='component')get('[data-net]').value='';else get('[data-component]').value='';
  const pins=get('[data-pins]');pins.replaceChildren();
  if(selection){
   const placed=selection.points.length,total=selection.pins.length;
   get('[data-selection]').textContent=`${kind==='net'?'Net '+clean(value):'Component '+value}: ${total} pins; ${placed} with estimated positions. Unplaced components: ${selection.unplaced.join(', ')||'none'}. Cyan artwork remains unassigned. Both sides use the same top-view coordinate frame.`;
   const alignment=data.photoRegistration?.components.filter(c=>selection.refs.includes(c.ref))||[];
   if(alignment.length)get('[data-selection]').textContent+=' Photo alignment: '+alignment.map(c=>`${c.ref} ${c.maxResidualMm.toFixed(2)} mm maximum residual${c.maxResidualMm>data.photoRegistration.toleranceMm?' (outside tolerance)':''}`).join('; ')+'. Nominal board scale; not metrology.';
   const table=document.createElement('table');table.innerHTML='<thead><tr><th>Component</th><th>Pin</th><th>Net</th><th>Placement</th></tr></thead>';const body=document.createElement('tbody');
   for(const p of selection.pins){const row=document.createElement('tr');for(const text of [p.ref,p.pin,clean(p.net)||'Unconnected',p.position?'Photo estimate':'Unplaced']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}body.append(row);}table.append(body);pins.append(table);
  }else get('[data-selection]').textContent='Select a component or net to inspect its pins.';
  scene?.keyboardControllerSelection(panel.open?(selection?.points||[]):[]);draw();
 }
 async function load(){
  if(data||pending)return;pending=true;status.textContent='Loading controller reconstruction…';
  try{
   const response=await fetch(`${import.meta.env.BASE_URL}models/robotron-1715m/keyboard-controller.json`);if(!response.ok)throw Error(`HTTP ${response.status}`);data=await response.json();
   if(data.layout.schema!==1||data.connectivity.schema!==1)throw Error('Unsupported controller data');
   for(const [selector,values]of [['[data-component]',Object.keys(data.connectivity.components).sort()],['[data-net]',[...new Set(Object.values(data.connectivity.components).flatMap(c=>Object.values(c.pins)).filter(Boolean))].sort()]]){
    const target=get(selector);target.replaceChildren(new Option('Select…',''));for(const v of values)target.add(new Option(clean(v),v));
   }
   get('[data-tools]').hidden=false;status.textContent=`${Object.keys(data.connectivity.components).length} reference components. Reconstruction is incomplete.`;
   const q=data.qualification,f=data.cosimulation.firmware;
   const bus=data.cosimulation.bus;
   get('[data-qualification]').textContent=`PCB: ${q.drc.unconnectedItems} unresolved airwires; ${q.electricalCopperSegments} assigned copper segments. Reference co-simulation: ${bus.vectors.toLocaleString('en-US')} bus transactions, ${bus.mismatches} mismatches; ${f.cBits} C / ${f.hdlBits} HDL serial bits. Bus and LED transition comparisons ${data.cosimulation.equivalent?'pass':'do not pass'}. This is scoped logical agreement; CPU phase offsets and physical copper remain unqualified.`;
   get('[data-cad]').href=`${data.source.cad.repository}/tree/${data.source.cad.revision}/models/robotron-1715m/keyboard-controller`;
   get('[data-hdl]').href=`${data.source.emulation.repository}/blob/${data.source.emulation.revision}/verification/robotron-keyboard/reports/full-audit.json`;
   live();select('component','A1');get('[data-component]').value='A1';
  }catch(error){data=null;get('[data-tools]').hidden=true;status.textContent=`Controller review could not load: ${error.message}. Close and reopen to retry.`;}finally{pending=false;}
 }
 panel.addEventListener('toggle',()=>{if(panel.open){if(data)scene?.keyboardControllerSelection(selection?.points||[]);else load();}else scene?.keyboardControllerSelection([]);});
 get('[data-component]').onchange=e=>select('component',e.target.value);get('[data-net]').onchange=e=>select('net',e.target.value);get('[data-side]').onchange=draw;
 get('[data-zoom]').oninput=draw;get('[data-view-controller]').onclick=()=>document.querySelector('[data-view="keyboard-inside"]')?.click();
 get('[data-clear]').onclick=()=>{get('[data-component]').value='';get('[data-net]').value='';select('component','');};
 return {message(message){if(message.type==='configured'){leds=null;latches=null;}if(message.keyboardLeds!==undefined)leds=message.keyboardLeds;if(message.keyboardLatches!==undefined)latches=message.keyboardLatches;if(panel.open)live();}};
}
