const NS='http://www.w3.org/2000/svg';

export function installControllerReference(parent,onCompare){
 const panel=document.createElement('details');panel.dataset.referenceBoard='';
 panel.innerHTML='<summary>Proposed reference PCB</summary><p>A complete electrical routing candidate, separate from the historical reconstruction. Orange copper is proposed; blue copper retains unchanged historical geometry. Package adapters, dimensions and device behavior still need qualification. This is not a fabrication release.</p><p role="status" data-reference-status>Open to load the proposed board.</p><div data-reference-tools hidden><label>Reference component <select aria-label="Reference component" data-ref-component></select></label> <label>Reference net <select aria-label="Reference net" data-ref-net></select></label> <label>Reference side <select aria-label="Reference side" data-ref-side><option value="top">Top</option><option value="bottom">Underside</option></select></label> <label><input type="checkbox" data-ref-proposed checked> Show proposed copper</label><label>Reference drawing zoom <input type="range" aria-label="Reference drawing zoom" data-ref-zoom min="1" max="6" step="0.5" value="1"></label><div data-reference-drawing style="overflow:auto"></div><p data-reference-selection></p><p><button type="button" data-reference-compare disabled>Compare selection with historical evidence</button></p><p><a data-reference-cad target="_blank" rel="noopener">Pinned reference KiCad board</a> · <a data-reference-scad target="_blank" rel="noopener">Reference OpenSCAD preview</a></p></div>';
 parent.append(panel);
 const get=s=>panel.querySelector(s);
 let data=null,pending=false;
 function draw(){
  if(!data)return;
  const layout=data.layout,ref=get('[data-ref-component]').value,net=get('[data-ref-net]').value;
  const component=layout.components.find(c=>c.ref===ref),side=get('[data-ref-side]').value;
  const selectedNets=new Set(net?[net]:(component?.pads.map(p=>p.net).filter(Boolean)||[]));
  const active=!!(ref||net),proposed=get('[data-ref-proposed]').checked;
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox','-138 -26 276 52');svg.setAttribute('role','img');
  svg.setAttribute('aria-label',`Proposed reference PCB ${side}`);
  svg.style.cssText=`display:block;width:${Number(get('[data-ref-zoom]').value)*100}%;min-height:180px;max-width:none;background:#14232d`;
  const group=document.createElementNS(NS,'g');group.setAttribute('transform',`scale(${side==='bottom'?-1:1},-1)`);svg.append(group);
  const add=(tag,attrs,target=group)=>{const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));target.append(node);return node;};
  add('polygon',{points:layout.outlinePolygon.map(p=>p.join(',')).join(' '),fill:'#193d2d',stroke:'#739586','stroke-width':.3});
  for(const route of layout.routes){
   if(route.side!==side||(!proposed&&route.classification==='proposed'))continue;
   const selected=selectedNets.has(route.net);
   const node=add('polyline',{points:route.points.map(p=>p.join(',')).join(' '),fill:'none',stroke:selected?'#fff17b':route.classification==='proposed'?'#ff963f':'#62ceec','stroke-width':route.width,opacity:active && !selected ? .12 : 1});
   node.dataset.referenceRoute=route.id;node.dataset.net=route.net;node.dataset.classification=route.classification;
  }
  for(const via of layout.vias){
   if(!proposed&&via.classification==='proposed')continue;
   add('circle',{cx:via.position[0],cy:via.position[1],r:via.diameter/2,fill:via.classification==='proposed'?'#ff963f':'#62ceec',opacity:active && !selectedNets.has(via.net) ? .12 : 1});
  }
  const pins=[];
  for(const c of layout.components){
   for(const pad of c.pads){
    const selected=net?pad.net===net:ref?c.ref===ref:false;
    if(selected)pins.push(`${c.ref}:${pad.pin}`);
    const node=add('ellipse',{cx:pad.position[0],cy:pad.position[1],rx:pad.size[0]/2,ry:pad.size[1]/2,fill:selected?'#fff17b':'#c3ab72',opacity:active && !selected ? .2 : 1});
    node.dataset.referencePin=`${c.ref}:${pad.pin}`;
    const title=add('title',{},node);title.textContent=`${c.ref}:${pad.pin} ${pad.net||'No net'} — ${c.classification}`;
   }
  }
  get('[data-reference-drawing]').replaceChildren(svg);
  get('[data-reference-compare]').disabled=!active;
  get('[data-reference-selection]').textContent=active?`${pins.length} terminals: ${pins.join(', ')}. ${component?component.classification+'. ':''}Reference connectivity; historical joins remain a separate question.`:'Select a component or net to follow its reference connections.';
 }
 async function load(){
  if(data||pending)return;pending=true;
  get('[data-reference-status]').textContent='Loading proposed reference PCB…';
  try{
   const response=await fetch(`${import.meta.env.BASE_URL}models/robotron-1715m/keyboard-controller-reference.json`);
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const candidate=await response.json();
   if(candidate.layout?.variant!=='proposed-reference'||candidate.qualification?.variant!=='proposed-reference')throw Error('Unexpected board variant');
   data=candidate;
   for(const [selector,values]of [['[data-ref-component]',data.layout.components.filter(c=>c.pads.some(p=>p.net)).map(c=>c.ref).sort()],['[data-ref-net]',[...new Set(data.layout.components.flatMap(c=>c.pads.map(p=>p.net)).filter(Boolean))].sort()]]){
    const select=get(selector);select.replaceChildren(new Option('All',''));for(const value of values)select.add(new Option(value.replace(/^\//,''),value));
   }
   const q=data.qualification,a=data.routingAudit.summary;
   get('[data-reference-status]').textContent=`Reference PCB: ${q.drc.unconnectedItems} unconnected items; ${a.remainingPadGroupLinks} missing pad-group links. ${q.drcPassed?'DRC passes.':'DRC findings remain.'} Electrical qualification and historical verification remain open.`;
   const base=`${data.source.repository}/blob/${data.source.revision}/models/robotron-1715m/keyboard-controller/reference/`;
   get('[data-reference-cad]').href=base+'controller.kicad_pcb';get('[data-reference-scad]').href=base+'review.scad';
   get('[data-reference-tools]').hidden=false;draw();
  }catch(error){get('[data-reference-status]').textContent=`Proposed board could not load (${error.message}). Close and reopen to retry.`;data=null;}
  finally{pending=false;}
 }
 get('[data-reference-compare]').addEventListener('click',async()=>{
  if(!data)return;
  const net=get('[data-ref-net]').value,ref=get('[data-ref-component]').value;
  if(!net&&!ref)return;
  const compared=await onCompare?.({kind:net?'net':'component',value:net||ref,source:data.source});
  if(!compared)get('[data-reference-selection]').textContent='Historical comparison is unavailable or uses a different electrical contract. Reopen the historical review to retry.';
 });
 panel.addEventListener('toggle',()=>{if(panel.open)load();});
 for(const selector of ['[data-ref-component]','[data-ref-net]'])get(selector).addEventListener('change',()=>{get(selector==='[data-ref-net]'?'[data-ref-component]':'[data-ref-net]').value='';draw();});
 get('[data-ref-zoom]').addEventListener('input',draw);
 get('[data-ref-side]').addEventListener('change',draw);get('[data-ref-proposed]').addEventListener('change',draw);
}
