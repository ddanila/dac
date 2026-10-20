import {copperGroup,renderCopperGraph} from './keyboard-controller-copper.js';
import {installControllerWaveform} from './keyboard-controller-waveform.js';
const svgNS='http://www.w3.org/2000/svg';
const clean=value=>(value||'').replace(/^\//,'');
export function controllerSelection(data,kind,value){
 const components=data.connectivity.components;
 const path=kind==='path'?data.connectionReview?.cases.find(c=>c.id===value):null;
 const terminals=new Set(path?.sameNetSets.flat()||[]);
 const refs=Object.keys(components).filter(ref=>kind==='component'?ref===value:kind==='path'?[...terminals].some(t=>t.startsWith(ref+':')):Object.values(components[ref].pins).includes(value));
 const placed=new Map(data.layout.components.map(c=>[c.ref,c]));
 const anonymous=new Set((data.layout.visualConnectors||[]).filter(c=>c.status!=='photo-placed-reference-terminal-order').map(c=>c.ref));
 const pins=refs.flatMap(ref=>Object.entries(components[ref].pins).filter(([pin,net])=>kind==='component'||(kind==='path'?terminals.has(ref+':'+pin):net===value)).map(([pin,net])=>({ref,pin,net,position:anonymous.has(ref)||ref==='XT1'?null:placed.get(ref)?.pads.find(p=>p.pin===pin)?.position||null})));
 const nets=new Set(pins.map(p=>p.net).filter(Boolean));
 return {refs,pins,points:pins.filter(p=>p.position).map(p=>p.position),routes:data.layout.routes.filter(r=>nets.has(r.net)),unplaced:refs.filter(ref=>!placed.has(ref))};
}
function connectionCases(data,kind,value){
 return (data.connectionReview?.cases||[]).filter(c=>kind==='path'?c.id===value:
  kind==='net'?c.referenceNets.some(n=>n.net===value):
  c.sameNetSets.flat().some(t=>t.startsWith(value+':')));
}
function connectionPhoto(fig){
 const figure=document.createElement('figure');figure.dataset.connectionPhoto=fig.source.id;
 const url=`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(fig.source.path.split('/').pop())}`;
 const points=[...fig.segments.flatMap(s=>s.points),...fig.markers.map(m=>m.point)];
 if(!points.length)return figure;
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.max(0,Math.min(...xs)-90),y=Math.max(0,Math.min(...ys)-90);
 const svg=document.createElementNS(svgNS,'svg');
 svg.setAttribute('viewBox',`${x} ${y} ${Math.max(...xs)-x+90} ${Math.max(...ys)-y+90}`);
 svg.setAttribute('role','img');svg.setAttribute('aria-label',`Connection evidence: ${fig.source.id}`);
 svg.style.cssText='display:block;width:100%;max-width:560px;max-height:340px;background:#14232d';
 const add=(tag,attrs)=>{const node=document.createElementNS(svgNS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);svg.append(node);return node;};
 add('image',{href:url,width:3072,height:4080});
 for(const segment of fig.segments)add('polyline',{points:segment.points.map(p=>p.join(',')).join(' '),fill:'none',stroke:segment.status==='inferred'?'#ffcf5b':'#37f3d4','stroke-width':3,'stroke-dasharray':segment.status==='inferred'?'7 5':'none'});
 const labels=document.createElement('ul');
 for(const marker of fig.markers){
  add('circle',{...(marker.kind==='search'?{'data-search-region':''}:{}),cx:marker.point[0],cy:marker.point[1],r:marker.radius||9,fill:'none',stroke:marker.kind==='search'?'#ffcf5b':'#ff79ad','stroke-width':3,'stroke-dasharray':marker.kind==='search'?'5 4':'none'});
  const label=document.createElement('li');label.textContent=marker.label;labels.append(label);
 }
 const caption=document.createElement('figcaption');caption.textContent='Primary specimen: teal observed copper; dashed amber inferred copper or projected search region; pink recorded span ends. Search circles are not identified joints.';
 const link=document.createElement('a');link.href=url;link.textContent='Open original photograph';link.target='_blank';link.rel='noopener';
 figure.append(svg,caption,labels,link);return figure;
}
// Photo observations remain separate from the native pad positions used for highlights.
function componentPhoto(data,ref,candidate,side='top'){
 const box=candidate.pixelBox;
 if(box&&(!Array.isArray(box)||box.length!==4||!box.every(Number.isFinite)||box[2]<=box[0]||box[3]<=box[1]))return null;
 const numbered=!box&&Boolean(candidate.photoPins),entries=box?[[null,box.slice(0,2)],[null,box.slice(2)]]:numbered?Object.entries(candidate.photoPins):candidate.photoEndpoints?.map(point=>[null,point]);
 const source=data.evidence.sources.find(s=>s.id===candidate.photoSource);
 if(!source?.path||!entries?.length)return null;
 const figure=document.createElement('figure');figure.dataset[box?'bodyPhoto':numbered?'placementPhoto':'candidatePhoto']=ref;figure.dataset.photoSide=source.side||side;figure.dataset.photoSpecimen=source.specimenId||'museum-primary';
 const caption=document.createElement('figcaption');caption.textContent=numbered?`${ref}: photo-estimated numbered lead positions. Circles show the recorded pixel uncertainty. Raised leads can obscure hole centres; continuity is not measured.`:`${ref}: photo location candidate. Circles mark observed endpoints, not numbered pins. Terminal order and continuity remain unverified.`;if(side==='bottom')caption.textContent=`${ref}: underside solder-joint observations with reference-derived pin numbers. Circles show the recorded pixel uncertainty. These are original photo coordinates, not projected pads; global underside registration and end-to-end continuity remain unqualified.`;if(box)caption.textContent=`${ref}: ${source.specimenId?'comparison photo — different specimen':'primary specimen photo'}. Rectangle identifies a body or marking region, not numbered pins or hole centres. ${candidate.marking?`Visible marking: ${candidate.marking}${candidate.additionalMarking?`; ${candidate.additionalMarking}`:''}. `:''}${candidate.scope||''}`;figure.append(caption);
 const image=new Image();image.alt=`Original ${source.specimenId?'comparison':'primary'} specimen photo around ${ref}`;
 const url=`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(source.path.split('/').pop())}`;
 const link=document.createElement('a');link.href=url;link.textContent=source.specimenId?'Open original comparison photo':side==='bottom'?'Open original underside photo':'Open original specimen photo';link.target='_blank';link.rel='noopener';figure.append(link);
 const pkg=data.evidence.packageReferences?.find(p=>p.id===candidate.packageReference);
 const packageSource=pkg&&data.evidence.sources.find(s=>s.id===pkg.source);
 if(packageSource?.url){
  const reference=document.createElement('a');reference.href=packageSource.url;reference.textContent='Package identification source';reference.title=pkg.locator||'';reference.target='_blank';reference.rel='noopener';figure.append(' · ',reference);
 }
 for(const id of candidate.supportingSources||[]){
  const supporting=data.evidence.sources.find(s=>s.id===id);
  if(!supporting?.path||id===candidate.photoSource)continue;
  const extra=document.createElement('a');extra.href=`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(supporting.path.split('/').pop())}`;extra.textContent=supporting.specimenId?'Comparison close-up — different specimen':'Supporting close-up';extra.target='_blank';extra.rel='noopener';figure.append(' · ',extra);
 }
 image.onload=()=>{
  const points=entries.map(([,point])=>point),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),margin=65;
  const x=Math.max(0,Math.min(...xs)-margin),y=Math.max(0,Math.min(...ys)-margin);
  const w=Math.min(image.naturalWidth,Math.max(...xs)+margin)-x,h=Math.min(image.naturalHeight,Math.max(...ys)+margin)-y;
  const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`${ref} ${source.specimenId?'comparison':'primary'} specimen photo (${source.side||side}) with ${box?'body or marking region':numbered?(side==='bottom'?'numbered solder joints':'numbered lead positions'):'unnumbered candidate endpoints'}`);svg.style.cssText='display:block;width:100%;max-width:560px;background:#14232d';
  const photo=document.createElementNS(svgNS,'image');photo.setAttribute('href',url);photo.setAttribute('width',image.naturalWidth);photo.setAttribute('height',image.naturalHeight);svg.append(photo);
  if(box){
   const rect=document.createElementNS(svgNS,'rect');
   for(const [key,value]of Object.entries({x:box[0],y:box[1],width:box[2]-box[0],height:box[3]-box[1],fill:'none',stroke:'#ffe16a','stroke-width':2}))rect.setAttribute(key,value);
   svg.append(rect);
  }
  for(const [pin,[px,py]]of box?[]:entries){
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
 panel.innerHTML='<summary>Keyboard controller circuit review</summary><p>Reference schematic and photo placement reconstruction. Copper continuity is unresolved; highlighted dots identify estimated pad locations.</p><p role="status" data-status>Open to load the controller reconstruction.</p><div data-tools hidden><label>Underside copper group <select aria-label="Controller copper group" data-copper><option value="">Select…</option></select></label><label><input type="checkbox" data-copper-projection> Show approximate copper projection</label> <label>Signal path <select aria-label="Controller signal path" data-path><option value="">Select…</option><option value="host-clock">Clock → filter → cable</option><option value="host-data">Data → filter → cable</option></select></label> <label>Component <select aria-label="Controller component" data-component></select></label> <label>Net <select aria-label="Controller net" data-net></select></label> <label>Board side <select aria-label="Controller board side" data-side><option value="top">Top</option><option value="bottom">Underside</option></select></label><button type="button" data-clear>Clear highlight</button><button type="button" data-view-controller>View controller in model</button><label>Drawing zoom <input type="range" aria-label="Controller drawing zoom" data-zoom min="1" max="6" step="0.5" value="1"></label><div data-drawing style="overflow:auto"></div><p data-selection></p><div data-path-review></div><p data-live>Raw LED samples are unavailable.</p><details><summary>Connected pins and evidence</summary><div data-pins></div></details><p data-qualification></p><a data-cad target="_blank" rel="noopener">Open pinned KiCad sources</a> · <a data-hdl target="_blank" rel="noopener">Open co-simulation report</a></div>';
 document.getElementById('evidence-controls').after(panel);
 let data=null,pending=false,selection=null,leds=null,latches=null,selectedCopper=null;
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
  const assembly=data.layout.visualOutputAssembly;
  if(side==='top'&&assembly){
   const core=add('polygon',{'data-output-core':'',points:assembly.filter.bodyPolygon.map(([x,y])=>`${x},${-y}`).join(' '),fill:'#292d29',stroke:'#4694a1','stroke-width':.3});
   const title=document.createElementNS(svgNS,'title');title.textContent=assembly.filter.scope;core.append(title);
   for(const arc of [...assembly.filter.raisedWireArcs,...assembly.cable.raisedWireArcs.map(w=>w.points)])
    add('polyline',{'data-output-wire':'',points:arc.map(([x,y])=>`${x},${-y}`).join(' '),fill:'none',stroke:'#4694a1','stroke-width':.5});
  }
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
  const anonymous=new Set((data.layout.visualConnectors||[]).filter(c=>c.status!=='photo-placed-reference-terminal-order').map(c=>c.ref));
  for(const connector of data.layout.visualConnectors||[])for(const [name,row] of Object.entries(connector.rows))for(const [index,[x,y]] of row.entries()){
   if(connector.status==='photo-placed-reference-terminal-order'&&!connector.unclassifiedContacts.includes(data.connectorTerminals.resolvedRows[name][index]))continue;
   const dot=add('circle',{'data-visual-connector':connector.ref,cx:x,cy:-y,r:.65,fill:'#4694a1'}),title=document.createElementNS(svgNS,'title');
   title.textContent=`${connector.ref}: observed solder joint; no electrical pin assignment`;dot.append(title);
  }
  for(const c of data.layout.components.filter(c=>!anonymous.has(c.ref)&&c.ref!=='XT1'))for(const p of c.pads){
   const active=selected.has(c.ref+':'+p.pin),dot=add('circle',{cx:p.position[0],cy:-p.position[1],r:active?1.4:.65,fill:active?'#ffe16a':'#c5c5b0'}),title=document.createElementNS(svgNS,'title');title.textContent=`${c.ref}:${p.pin||'mount'} ${clean(p.net)||'unconnected'}`;dot.append(title);
  }
  if(side==='bottom'&&selectedCopper&&get('[data-copper-projection]').checked){
   for(const edge of selectedCopper.edges){
    const line=add('polyline',{'data-copper-projection-edge':edge.id,points:edge.modelPoints.map(([x,y])=>`${x},${-y}`).join(' '),fill:'none',stroke:'#ffe16a','stroke-width':.3,'stroke-dasharray':'.6 .4'});
    const title=document.createElementNS(svgNS,'title');title.textContent='Illustrative photo projection only; not native electrical copper';line.append(title);
   }
  }
  // Both sides use one top-view coordinate convention to preserve net identity.
  get('[data-drawing]').replaceChildren(svg);
 }
 function select(kind,value){
  selectedCopper=kind==='copper'?copperGroup(data,value):null;
  selection=value&&kind!=='copper'?controllerSelection(data,kind,value):null;
  for(const [control,type]of [['[data-net]','net'],['[data-component]','component'],['[data-path]','path'],['[data-copper]','copper']])if(kind!==type)get(control).value='';
  const pathReview=get('[data-path-review]');pathReview.replaceChildren();
  const pins=get('[data-pins]');pins.replaceChildren();
  if(selectedCopper){
   get('[data-selection]').textContent='Anonymous connected group: '+selectedCopper.nodes.join(', ')+'. Same-face observations only; no filter winding or XT1 identity is assigned. The optional dashed board projection is illustrative and is not used for 3D electrical highlights.';
   renderCopperGraph(pathReview,data,value);get('[data-side]').value='bottom';scene?.keyboardControllerSelection([]);draw();return;
  }
  if(selection){
   const placed=selection.points.length,total=selection.pins.length;
   get('[data-selection]').textContent=`${kind==='path'?'Signal path '+value:kind==='net'?'Net '+clean(value):'Component '+value}: ${total} pins; ${placed} with estimated positions. Unplaced components: ${selection.unplaced.join(', ')||'none'}. Cyan artwork remains unassigned. Both sides use the same top-view coordinate frame.`;
   const selectionSummary=get('[data-selection]').textContent;
   if((data.layout.visualBridges||[]).some(b=>selection.refs.includes(b.ref)))get('[data-selection]').textContent+=' The cyan wire is a photo estimate only; its endpoints do not identify electrical pads.';
   if((data.layout.visualConnectors||[]).some(c=>selection.refs.includes(c.ref)))get('[data-selection]').textContent+=' Cyan connector joints remain electrically unclassified; highlighted reference pads use photo-estimated positions and reference-derived numbering.';
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
   for(const region of data.topRegistration?.pcbRegions||[]){
    if(![...region.anchors,...region.checks].some(p=>selection.refs.includes(p.ref)))continue;
    get('[data-selection]').textContent+=` Local top-side photo fit: ${region.maxCheckResidualMm.toFixed(2)} mm maximum check residual. ${region.copperAssignmentQualified?'Visible copper is limited to the anchor hull.':'Projection is unqualified.'} This fit does not establish under-package connections or apply to the outer row.`;
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
    if(value==='X1'&&data.connectorReview){
     const review=data.connectorReview,detail=document.createElement('p');detail.dataset.connectorReview='';
     detail.textContent=`Visual connector joints follow underside observations; both observed lead rows exit the same housing side. Native reference pads follow the registered underside joints. Projected lead-end separation is ${review.projectedRowSeparationMm.minimum.toFixed(1)}–${review.projectedRowSeparationMm.maximum.toFixed(1)} mm; native pad-row separation is ${review.nativePadRowSeparationMm.maximum.toFixed(1)} mm. These are model-based estimates; raised lead bends do not establish hole centres or terminal order. `;
     const far=data.connectorTerminals?.resolvedRows.housingFar,near=data.connectorTerminals?.resolvedRows.housingNear;
     if(far)detail.textContent+=`Visible resistor attachments and the reference schematic support the far row as ${far[0]}–${far.at(-1)}. `;
     if(near)detail.textContent+=`The underside trace from the eighth near-row joint to A2.1:6 supports the near row as ${near[0]}–${near.at(-1)}, from cable toward ROM. This is reference-derived numbering, not measured continuity. A8 remains electrically unclassified. `;
     else detail.textContent+='Near-row numbering remains unresolved. ';
     const link=document.createElement('a');link.href=`${data.source.cad.repository}/blob/${data.source.cad.revision}/models/robotron-1715m/keyboard-controller/generated/connector-review.json`;link.textContent='Connector evidence review';link.target='_blank';link.rel='noopener';detail.append(link);pins.append(detail);
    }
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
    for(const observation of [evidence?.bodyIdentification,...(evidence?.specimenMarkings||[])].filter(record=>record?.pixelBox)){
     const photo=componentPhoto(data,value,observation);if(photo)pins.append(photo);
    }
    const regionPins=(data.bottomRegistration?.pcbRegions||[]).flatMap(r=>[...r.anchors,...r.checks]).filter(p=>p.ref===value);
    const bottomEvidence=evidence?.bottomPhotoPins?{photoSource:evidence.bottomPhotoSource,photoPins:evidence.bottomPhotoPins,pixelUncertainty:evidence.bottomPixelUncertainty}:regionPins.length?{photoSource:'photo-bottom',photoPins:Object.fromEntries(regionPins.map(p=>[p.pin,p.photoPixel])),pixelUncertainty:8}:null;
    if(bottomEvidence){
     const underside=componentPhoto(data,value,bottomEvidence,'bottom');
     if(underside)pins.append(underside);
    }
   }
   for(const review of connectionCases(data,kind,value)){
    const section=document.createElement('details');section.dataset.connectionCase=review.id;section.open=kind!=='component';
    const heading=document.createElement('summary');heading.textContent=review.title;
    const finding=document.createElement('p');finding.textContent=review.finding;
    const chain=document.createElement('p');chain.textContent='Reference connections: '+review.referenceNets.map(n=>n.terminals.join(' ↔ ')).join(review.seriesComponents.length?' · winding · ':' · ')+'. Highlighted fragments do not prove a complete path.';
    section.append(heading,finding,chain);
    for(const fig of review.figures)section.append(connectionPhoto(fig));
    if(review.crossSideSearch){const note=document.createElement('p');note.textContent=review.crossSideSearch.scope;section.append(note);}
    const next=document.createElement('p');next.textContent='Unresolved: '+review.decisiveObservation;section.append(next);pathReview.append(section);
   }
   if(selection.refs.some(ref=>data.outputAssembly?.refs.includes(ref))){
    const assembly=data.outputAssembly,section=document.createElement('details');section.dataset.outputAssembly='';
    const heading=document.createElement('summary');heading.textContent='Filter and cable: observed assembly';
    const note=document.createElement('p');note.textContent=assembly.scope+' '+assembly.cable.scope;
    section.append(heading,note);
    for(const [ref,body]of [['L1 filter',assembly.filter],['XT1 cable',assembly.cable]]){
     const photo=componentPhoto(data,ref,{photoSource:assembly.photoSource,...(body.jointRowsPixels?{photoEndpoints:Object.values(body.jointRowsPixels).flat(),photoPixelUncertainty:body.jointPixelUncertainty}:{pixelBox:body.pixelBox}),scope:body.scope,supportingSources:assembly.supportingSources});if(photo)section.append(photo);
    }
    const gaps=document.createElement('ul');for(const gap of assembly.unresolved){const item=document.createElement('li');item.textContent=gap;gaps.append(item);}section.append(gaps);pathReview.append(section);
   }
   if(kind==='path')get('[data-selection]').textContent=selectionSummary+' Highlighted copper is partial; dashed sections are inferred. The filter winding separates the two reference nets. Component-level registration details are available through component selection.';
   if(selection.refs.includes('XT1'))get('[data-selection]').textContent+=' XT1 native coordinates are inherited reference placeholders, not registered solder joints; they are excluded from physical highlights.';
   const table=document.createElement('table');table.innerHTML='<thead><tr><th>Component</th><th>Pin</th><th>Net</th><th>Placement</th></tr></thead>';const body=document.createElement('tbody');
   for(const p of selection.pins){const row=document.createElement('tr');for(const text of [p.ref,p.pin,clean(p.net)||'Unconnected',p.ref==='XT1'?'Reference placeholder':p.position?'Photo estimate':'Unplaced']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}body.append(row);}table.append(body);pins.append(table);
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
   for(const group of data.cableCopper?.connectedGroups||[])get('[data-copper]').add(new Option(group.join(' · '),group[0]));
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
 get('[data-copper]').onchange=e=>select('copper',e.target.value);get('[data-copper-projection]').onchange=draw;
 get('[data-path]').onchange=e=>select('path',e.target.value);
 get('[data-component]').onchange=e=>select('component',e.target.value);get('[data-net]').onchange=e=>select('net',e.target.value);get('[data-side]').onchange=draw;
 get('[data-zoom]').oninput=draw;get('[data-view-controller]').onclick=()=>document.querySelector('[data-view="keyboard-inside"]')?.click();
 get('[data-clear]').onclick=()=>{get('[data-component]').value='';get('[data-net]').value='';get('[data-path]').value='';get('[data-copper]').value='';select('component','');};
 return {message(message){if(message.type==='configured'){leds=null;latches=null;}if(message.keyboardLeds!==undefined)leds=message.keyboardLeds;if(message.keyboardLatches!==undefined)latches=message.keyboardLatches;if(panel.open)live();}};
}
