import {installControllerWaveform} from './keyboard-controller-waveform.js';
const svgNS='http://www.w3.org/2000/svg';
const clean=value=>(value||'').replace(/^\//,'');
export function controllerSelection(data,kind,value){
 const components=data.connectivity.components;
 const refs=Object.keys(components).filter(ref=>kind==='component'?ref===value:Object.values(components[ref].pins).includes(value));
 const placed=new Map(data.layout.components.map(c=>[c.ref,c]));
 const pins=refs.flatMap(ref=>Object.entries(components[ref].pins).filter(([,net])=>kind==='component'||net===value).map(([pin,net])=>({ref,pin,net,position:placed.get(ref)?.pads.find(p=>p.pin===pin)?.position||null})));
 const nets=new Set(pins.map(p=>p.net).filter(Boolean));
 return {refs,pins,points:pins.filter(p=>p.position).map(p=>p.position),routes:data.layout.routes.filter(r=>nets.has(r.net)),unplaced:refs.filter(ref=>!placed.has(ref))};
}
// Photo observations remain separate from the native pad positions used for highlights.
function componentPhoto(data,ref,candidate,side='top'){
 const numbered=Boolean(candidate.photoPins),entries=numbered?Object.entries(candidate.photoPins):candidate.photoEndpoints?.map(point=>[null,point]);
 const source=data.evidence.sources.find(s=>s.id===candidate.photoSource);
 if(!source?.path||!entries?.length)return null;
 const figure=document.createElement('figure');figure.dataset[numbered?'placementPhoto':'candidatePhoto']=ref;figure.dataset.photoSide=side;
 const caption=document.createElement('figcaption');caption.textContent=numbered?`${ref}: photo-estimated numbered lead positions. Circles show the recorded pixel uncertainty. Raised leads can obscure hole centres; continuity is not measured.`:`${ref}: photo location candidate. Circles mark observed endpoints, not numbered pins. Terminal order and continuity remain unverified.`;if(side==='bottom')caption.textContent=`${ref}: underside solder-joint observations with reference-derived pin numbers. Circles show the recorded pixel uncertainty. These are original photo coordinates, not projected pads; global underside registration and end-to-end continuity remain unqualified.`;figure.append(caption);
 const image=new Image();image.alt=`Original ${side==='bottom'?'underside':'top'} specimen photo around ${ref}`;
 const url=`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(source.path.split('/').pop())}`;
 const link=document.createElement('a');link.href=url;link.textContent=side==='bottom'?'Open original underside photo':'Open original specimen photo';link.target='_blank';link.rel='noopener';figure.append(link);
 for(const id of candidate.supportingSources||[]){
  const supporting=data.evidence.sources.find(s=>s.id===id);
  if(!supporting?.path||id===candidate.photoSource)continue;
  const extra=document.createElement('a');extra.href=`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(supporting.path.split('/').pop())}`;extra.textContent=supporting.specimenId?'Comparison close-up — different specimen':'Supporting close-up';extra.target='_blank';extra.rel='noopener';figure.append(' · ',extra);
 }
 image.onload=()=>{
  const points=entries.map(([,point])=>point),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),margin=65;
  const x=Math.max(0,Math.min(...xs)-margin),y=Math.max(0,Math.min(...ys)-margin);
  const w=Math.min(image.naturalWidth,Math.max(...xs)+margin)-x,h=Math.min(image.naturalHeight,Math.max(...ys)+margin)-y;
  const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${ref} original ${side==='bottom'?'underside':'top'} photo with ${numbered?(side==='bottom'?'numbered solder joints':'numbered lead positions'):'unnumbered candidate endpoints'}`);svg.style.cssText='display:block;width:100%;max-width:560px;background:#14232d';
  const photo=document.createElementNS(svgNS,'image');photo.setAttribute('href',url);photo.setAttribute('width',image.naturalWidth);photo.setAttribute('height',image.naturalHeight);svg.append(photo);
  for(const [pin,[px,py]]of entries){
   const circle=document.createElementNS(svgNS,'circle');for(const [key,value]of Object.entries({cx:px,cy:py,r:candidate.pixelUncertainty||candidate.photoPixelUncertainty||8,fill:'none',stroke:'#ffe16a','stroke-width':2}))circle.setAttribute(key,value);svg.append(circle);
   if(numbered){
    circle.dataset.photoPin=pin;const label=document.createElementNS(svgNS,'text');label.textContent=pin;
    for(const [key,value]of Object.entries({x:px+12,y:py-10,fill:'#ffe16a',stroke:'#14232d','stroke-width':.6,'font-size':16,'paint-order':'stroke'}))label.setAttribute(key,value);svg.append(label);
   }
  }
  figure.prepend(svg);
 };
 image.onerror=()=>{caption.textContent+=' Photo preview could not load; use the original photo link to retry.';};image.src=url;
 return figure;
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
  for(const bridge of (data.layout.visualBridges||[]).filter(b=>b.side===side)){
   const line=add('polyline',{'data-visual-bridge':bridge.ref,points:bridge.points.map(([x,y])=>`${x},${-y}`).join(' '),fill:'none',stroke:'#4694a1','stroke-width':.5});
   const title=document.createElementNS(svgNS,'title');title.textContent=`${bridge.ref}: observed wire; terminal identity and continuity unresolved`;line.append(title);
  }
  for(const route of data.layout.routes.filter(r=>r.side===side)){
   const line=add('polyline',{'data-route-id':route.id,'data-evidence-status':route.evidence.status,points:route.points.map(([x,y])=>`${x},${-y}`).join(' '),fill:'none',stroke:selection?.pins.some(p=>p.net===route.net)?'#ffe16a':'#c29155','stroke-width':route.width,'stroke-dasharray':route.evidence.status==='inferred'?'.5 .3':'none'});
   const title=document.createElementNS(svgNS,'title');title.textContent=`${clean(route.net)}: ${route.evidence.status}. ${route.evidence.detail}`;line.append(title);
  }
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
   if((data.layout.visualBridges||[]).some(b=>selection.refs.includes(b.ref)))get('[data-selection]').textContent+=' The cyan wire is a photo estimate only; its endpoints do not identify electrical pads.';
   const routes=data.layout.routes.filter(r=>selection.pins.some(p=>p.net===r.net));
   if(routes.length){
    const counts=Object.entries(routes.reduce((out,r)=>(out[r.evidence.status]=(out[r.evidence.status]||0)+1,out),{})).map(([state,n])=>`${n} ${state}`).join(', ');
    get('[data-selection]').textContent+=` Assigned copper: ${counts} sections. Dashed sections are inferred. Net names follow the reference schematic; partial routing does not prove endpoint continuity.`;
    for(const detail of new Set(routes.map(r=>r.evidence.detail))){const text=document.createElement('p');text.textContent=detail;pins.append(text);}
   }
   const bridges=data.evidence.serviceInterfaces?.bridges.filter(b=>selection.refs.includes(b.ref))||[];
   for(const bridge of bridges){
    const physical=bridge.physicalEvidence;
    get('[data-selection]').textContent+=` ${bridge.ref}: ${bridge.role} Reference state: ${bridge.referenceState}. ${bridge.testUse} `+(physical?.status==='photo-placed-reference-terminal-order'?`Photo-estimated placement: ${physical.location}. Terminal mapping is reference-derived with local photo support; end-to-end continuity remains unmeasured.`:physical?`Photo location candidate: ${physical.location}. Terminal order and continuity remain unverified.`:'Physical location unverified.');
    if(physical){
     const source=data.evidence.sources.find(s=>s.id===physical.source),note=document.createElement('p');note.textContent=physical.observation+' ';pins.append(note);
     if(source){const link=document.createElement('a');link.href=source.url+'#page=10';link.textContent='Factory bridge placement (drawing 8)';link.target='_blank';link.rel='noopener';note.append(link);}
    }
   }
   const alignment=data.photoRegistration?.components.filter(c=>selection.refs.includes(c.ref))||[];
   if(alignment.length)get('[data-selection]').textContent+=' Photo alignment: '+alignment.map(c=>`${c.ref} ${c.maxResidualMm.toFixed(2)} mm maximum residual${c.maxResidualMm>data.photoRegistration.toleranceMm?' (outside tolerance)':''}`).join('; ')+'. Nominal board scale; not metrology.';
   const bottom=data.bottomRegistration?.pins.filter(p=>p.heldOut&&selection.refs.includes(p.ref))||[];
   if(bottom.length)get('[data-selection]').textContent+=' Underside independent checks: '+bottom.map(p=>`${p.ref}:${p.pin} ${p.residualMm.toFixed(2)} mm${p.residualMm>data.bottomRegistration.toleranceMm?' (outside tolerance)':''}`).join('; ')+'. Registration remains unqualified for copper assignment.';
   const cross=data.bottomRegistration?.crossPhoto?.checks.filter(p=>selection.refs.includes(p.ref))||[];
   if(cross.length)get('[data-selection]').textContent+=' Direct photo-to-photo checks: '+cross.map(p=>`${p.ref}:${p.pin} ${p.residualPixels.toFixed(1)} pixels / ${p.nominalResidualMm.toFixed(2)} nominal mm`).join('; ')+'. Top leads and socket can obscure hole centres; this does not qualify copper.';
   const local=data.bottomRegistration?.localRegions?.filter(r=>r.checks.some(p=>selection.refs.includes(p.ref)))||[];
   for(const region of local)get('[data-selection]').textContent+=` Local ${region.id.toUpperCase()} photo correspondence: ${region.checks.length} independent checks, ${region.maxCheckResidualMm.toFixed(2)} nominal mm maximum residual. Terminal candidates lie outside the anchor bounds; copper assignment remains unqualified. Extending this fit toward the tentative A6 terminal gives ${region.extrapolationChecks[0].nominalResidualMm.toFixed(2)} nominal mm discrepancy.`;
   for(const region of data.bottomRegistration?.pcbRegions||[]){
    if(![...region.anchors,...region.checks].some(p=>selection.refs.includes(p.ref)))continue;
    get('[data-selection]').textContent+=` Local ${region.id.toUpperCase()} underside-to-PCB fit: ${region.checks.length} independent pad checks; ${region.maxCheckResidualMm.toFixed(2)} mm maximum residual. ${region.copperAssignmentQualified?'Reviewed projection is limited to the anchor hull.':'Projection is unqualified.'} Nominal geometry; global underside registration and hidden continuity remain unqualified.`;
   }
   for(const review of data.evidence.routeReviews||[]){
    if(!review.refs.some(ref=>selection.refs.includes(ref)))continue;
    const note=document.createElement('p');note.dataset.routeReview=review.id;note.textContent=review.summary+' '+review.nextEvidence;pins.append(note);
   }
   for(const specimen of data.evidence.comparisonSpecimens||[]){
    const sources=data.evidence.sources.filter(s=>s.specimenId===specimen.id&&s.refs?.some(ref=>selection.refs.includes(ref)));
    if(!sources.length)continue;
    const group=document.createElement('details'),title=document.createElement('summary'),note=document.createElement('p'),list=document.createElement('ul');
    group.dataset.comparisonSpecimen=specimen.id;title.textContent='Comparison photos — different specimen';
    note.textContent=`Board marking: ${specimen.boardMarking}. ROM label: ${specimen.romLabel}; contents unread. ${specimen.scope}`;
    for(const source of sources){
     const item=document.createElement('li'),link=document.createElement('a');
     link.href=`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(source.path.split('/').pop())}`;
     link.textContent=`${source.side}: ${source.use}`;link.target='_blank';link.rel='noopener';item.append(link);list.append(item);
    }
    group.append(title,note,list);pins.append(group);
   }
   if(kind==='component'&&data.componentEvidence?.[value]){
    const evidence=data.componentEvidence[value],note=document.createElement('p');note.textContent=`${evidence.note} Pin evidence: ${evidence.pinEvidence}`;pins.append(note);
    const pkg=data.evidence.packageReferences?.find(p=>p.id===evidence.packageReference);
    if(pkg){
     const detail=document.createElement('p');detail.dataset.packageReference=pkg.id;
     detail.textContent=`Reference package ${pkg.case}: drawing order ${pkg.terminalOrderInDrawing.join('–')}; centre terminal ${pkg.centreTerminal}. ${pkg.drawingView} ${pkg.scope} `;
     const source=data.evidence.sources.find(s=>s.id===pkg.source);
     if(source?.url){const link=document.createElement('a');link.href=source.url+'#page=1';link.textContent='Reference package drawing';link.target='_blank';link.rel='noopener';detail.append(link);}
     pins.append(detail);
    }
   }
   if(kind==='component'){
    const evidence=data.componentEvidence?.[value],alignment=data.photoRegistration?.components.find(c=>c.ref===value);
    const alignedPhoto=alignment?{photoSource:'photo-top',photoPins:Object.fromEntries([...alignment.pins,...alignment.checkPins].map(p=>[p.pin,p.photoPixel]))}:null;
    const candidate=evidence?.photoPins?evidence:alignedPhoto||evidence?.placementCandidate||bridges.find(b=>b.ref===value)?.physicalEvidence;
    if(candidate){const photo=componentPhoto(data,value,candidate);if(photo)pins.append(photo);}
    const regionPins=(data.bottomRegistration?.pcbRegions||[]).flatMap(r=>[...r.anchors,...r.checks]).filter(p=>p.ref===value);
    const bottomEvidence=evidence?.bottomPhotoPins?{photoSource:evidence.bottomPhotoSource,photoPins:evidence.bottomPhotoPins,pixelUncertainty:evidence.bottomPixelUncertainty}:regionPins.length?{photoSource:'photo-bottom',photoPins:Object.fromEntries(regionPins.map(p=>[p.pin,p.photoPixel])),pixelUncertainty:8}:null;
    if(bottomEvidence){
     const underside=componentPhoto(data,value,bottomEvidence,'bottom');
     if(underside)pins.append(underside);
    }
   }
   const table=document.createElement('table');table.innerHTML='<thead><tr><th>Component</th><th>Pin</th><th>Net</th><th>Placement</th></tr></thead>';const body=document.createElement('tbody');
   for(const p of selection.pins){const row=document.createElement('tr');for(const text of [p.ref,p.pin,clean(p.net)||'Unconnected',p.position?'Photo estimate':'Unplaced']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}body.append(row);}table.append(body);pins.append(table);
  }else get('[data-selection]').textContent='Select a component or net to inspect its pins.';
  scene?.keyboardControllerSelection(panel.open?(selection?.points||[]):[],panel.open?(selection?.routes||[]):[]);draw();
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
   const violations=Object.entries(q.drc.violations).map(([type,n])=>`${n} ${type.replaceAll('_',' ')}`).join(', ');
   if(violations)get('[data-qualification]').textContent+=` Remaining DRC findings: ${violations}. Partial routes may end at unresolved continuations.`;
   if(data.cosimulation.service)get('[data-qualification]').textContent+=` Bridge isolation: ${data.cosimulation.service.checks} digital checks; ${data.cosimulation.service.mismatches} mismatches, including external reset/clock injection and conflicting drivers. Analog timing is not simulated.`;
   get('[data-cad]').href=`${data.source.cad.repository}/tree/${data.source.cad.revision}/models/robotron-1715m/keyboard-controller`;
   get('[data-hdl]').href=`${data.source.emulation.repository}/blob/${data.source.emulation.revision}/verification/robotron-keyboard/reports/full-audit.json`;
   installControllerWaveform(get('[data-tools]'),data.source.files.connectivity,net=>{get('[data-net]').value=net;get('[data-component]').value='';select('net',net);});
   live();select('component','A1');get('[data-component]').value='A1';
  }catch(error){data=null;get('[data-tools]').hidden=true;status.textContent=`Controller review could not load: ${error.message}. Close and reopen to retry.`;}finally{pending=false;}
 }
 panel.addEventListener('toggle',()=>{if(panel.open){if(data)scene?.keyboardControllerSelection(selection?.points||[],selection?.routes||[]);else load();}else scene?.keyboardControllerSelection([]);});
 get('[data-component]').onchange=e=>select('component',e.target.value);get('[data-net]').onchange=e=>select('net',e.target.value);get('[data-side]').onchange=draw;
 get('[data-zoom]').oninput=draw;get('[data-view-controller]').onclick=()=>document.querySelector('[data-view="keyboard-inside"]')?.click();
 get('[data-clear]').onclick=()=>{get('[data-component]').value='';get('[data-net]').value='';select('component','');};
 return {message(message){if(message.type==='configured'){leds=null;latches=null;}if(message.keyboardLeds!==undefined)leds=message.keyboardLeds;if(message.keyboardLatches!==undefined)latches=message.keyboardLatches;if(panel.open)live();}};
}
