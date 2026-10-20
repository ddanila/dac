const NS='http://www.w3.org/2000/svg';
export function copperGroup(data,id){
 const graph=data.cableCopper;
 const nodes=graph?.connectedGroups.find(group=>group[0]===id);
 if(!nodes)return null;
 const selected=new Set(nodes);
 return {nodes,edges:graph.edges.filter(edge=>edge.ends.every(end=>selected.has(end)))};
}
export function renderCopperGraph(target,data,id){
 const graph=data.cableCopper,group=copperGroup(data,id);
 target.replaceChildren();if(!group)return;
 const selected=new Set(group.nodes),edges=new Set(group.edges.map(e=>e.id));
 const figure=document.createElement('figure');figure.dataset.copperGraph='';
 const [x0,y0,x1,y1]=graph.regionPixels;
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`${x0-10} ${y0-10} ${x1-x0+20} ${y1-y0+20}`);
 svg.setAttribute('role','img');svg.setAttribute('aria-label','Anonymous cable-end underside copper; highlighted connected group');
 svg.style.cssText='display:block;width:100%;max-width:560px;max-height:480px;background:#14232d';
 function add(tag,attrs){const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);svg.append(node);return node;}
 const photoURL=source=>`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(source.path.split('/').pop())}`;
 add('image',{href:photoURL(graph.source),width:3072,height:4080});
 const overlay=document.createElementNS(NS,'g');overlay.dataset.copperOverlay='';
 for(const edge of graph.edges){
  const node=add('polyline',{'data-copper-edge':edge.id,points:edge.photoPixels.map(p=>p.join(',')).join(' '),fill:'none',stroke:edges.has(edge.id)?'#ffe16a':'#5bd8e0','stroke-width':edges.has(edge.id)?2:1,opacity:edges.has(edge.id)?1:.5});
  const title=document.createElementNS(NS,'title');title.textContent=`${edge.id}: ${edge.ends.join(' ↔ ')}; observed same-face span, no net assignment`;node.append(title);overlay.append(node);
 }
 for(const [name,node]of Object.entries(graph.nodes)){
  const [x,y]=node.pixel,active=selected.has(name);
  overlay.append(add('circle',{'data-copper-node':name,cx:x,cy:y,r:active?4:2,fill:'none',stroke:active?'#ffe16a':'#5bd8e0','stroke-width':1}));
  if(active){const label=add('text',{x:x+5,y:y-4,fill:'#ffe16a',stroke:'#14232d','stroke-width':.5,'paint-order':'stroke','font-size':7});label.textContent=name;overlay.append(label);}
 }
 svg.append(overlay);
 const caption=document.createElement('figcaption');caption.textContent='Primary specimen. Yellow: selected observed spans; cyan: other recorded spans. IDs name photo features, not electrical pins. Unrecorded continuation does not mean an open circuit.';
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Hide copper overlay';toggle.setAttribute('aria-pressed','false');toggle.onclick=()=>{const hide=overlay.style.display!=='none';overlay.style.display=hide?'none':'';toggle.textContent=hide?'Show copper overlay':'Hide copper overlay';toggle.setAttribute('aria-pressed',String(hide));};
 const link=document.createElement('a');link.href=photoURL(graph.source);link.textContent='Open original underside photo';link.target='_blank';link.rel='noopener';
 figure.append(svg,caption,toggle,' ',link);target.append(figure);
 const list=document.createElement('ul');
 for(const name of group.nodes){const node=graph.nodes[name],item=document.createElement('li');item.textContent=`${name}: ${node.kind.replaceAll('-',' ')}.${node.scope?' '+node.scope:''}`;list.append(item);}target.append(list);
 for(const gap of graph.unresolved.filter(g=>g.nodes.some(n=>selected.has(n)))){const note=document.createElement('p');note.dataset.copperGap=gap.id;note.textContent=gap.question+' '+(gap.alternatives||'')+' '+gap.needed;target.append(note);}
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Registration and comparison evidence';details.append(summary);
 const note=document.createElement('p');note.textContent=`Cross-side fit: ${graph.projection.maxCheckResidualPixels.toFixed(1)} px maximum held-out residual. ${graph.projection.scope} Comparison underside: ${graph.comparison.maxCheckResidualPixels.toFixed(1)} px maximum held-out residual. ${graph.comparison.scope}`;details.append(note);
 const comparison=document.createElement('a');comparison.href=photoURL(graph.comparison.source);comparison.textContent='Comparison underside — different specimen';comparison.target='_blank';comparison.rel='noopener';details.append(comparison);
 const source=document.createElement('a');source.href=`${data.source.cad.repository}/blob/${data.source.cad.revision}/models/robotron-1715m/keyboard-controller/generated/cable-copper.json`;source.textContent='Machine-readable graph and fit checks';source.target='_blank';source.rel='noopener';details.append(' · ',source);target.append(details);
}

export function renderSupplyReview(target,data){
 const review=data.cableCopper.supplyReview;
 target.replaceChildren();
 const intro=document.createElement('p');intro.dataset.supplyReview='';intro.textContent=review.conclusion;target.append(intro);
 const photoURL=source=>`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(source.path.split('/').pop())}`;
 function figure(source,box,label){
  const figure=document.createElement('figure'),svg=document.createElementNS(NS,'svg');
  svg.setAttribute('viewBox',box);svg.setAttribute('role','img');svg.setAttribute('aria-label',label);
  svg.style.cssText='display:block;width:100%;max-width:560px;max-height:520px;background:#14232d';
  function add(tag,attrs){const element=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))element.setAttribute(k,v);svg.append(element);return element;}
  add('image',{href:photoURL(source),width:3072,height:4080});
  const overlay=document.createElementNS(NS,'g');svg.append(overlay);
  const caption=document.createElement('figcaption');caption.textContent=label;
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Hide review overlay';toggle.setAttribute('aria-pressed','false');toggle.onclick=()=>{const hide=overlay.style.display!=='none';overlay.style.display=hide?'none':'';toggle.setAttribute('aria-pressed',String(hide));toggle.textContent=hide?'Show review overlay':'Hide review overlay';};
  const link=document.createElement('a');link.href=photoURL(source);link.textContent='Original photo';link.target='_blank';link.rel='noopener';
  figure.append(svg,caption,toggle,' ',link);target.append(figure);
  return(tag,attrs,text)=>{const element=add(tag,attrs);if(text)element.textContent=text;overlay.append(element);return element;};
 }
 const add=figure(review.topSource,'1150 630 600 610','Primary top: yellow supply-strip observations; dashed attachments are inferred. Filter crosses are search predictions, not identified pads.');
 for(const span of review.supplySpans)add('polyline',{'data-supply-span':span.routeId,points:span.photoPixels.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#ffe16a','stroke-width':3,'stroke-dasharray':span.status==='inferred'?'5 4':''});
 for(const [i,fit]of review.fits.entries()){
  const color=i===0?'#ff99d8':'#5bd8e0';
  const center=fit.anchors.reduce((p,a)=>[p[0]+a.topPixel[0]/fit.anchors.length,p[1]+a.topPixel[1]/fit.anchors.length],[0,0]);
  const hull=fit.anchors.map(a=>a.topPixel).sort((a,b)=>Math.atan2(a[1]-center[1],a[0]-center[0])-Math.atan2(b[1]-center[1],b[0]-center[0]));
  add('polygon',{points:hull.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':1,'stroke-dasharray':'5 4'});
  for(const [name,prediction]of Object.entries(fit.filterPredictions)){
   const [x,y]=prediction.topPixel;
   add('path',{'data-filter-prediction':fit.id,d:`M${x-4} ${y-4}l8 8m-8 0l8 -8`,stroke:color,'stroke-width':1.5});
   add('text',{x:x+4,y:y+(i===0?-6:12),fill:color,'font-size':8},name);
  }
  const note=document.createElement('p');note.textContent=`${i===0?'Pink':'Cyan'}: ${fit.id}. Maximum held-out residual ${Math.max(...fit.checks.map(c=>c.residualPixels)).toFixed(1)} px at the intermediate resistor checks; ${Math.max(...fit.extrapolationChecks.map(c=>c.residualPixels)).toFixed(1)} px at the lower checks. Filter predictions lie outside the anchor hull.`;target.append(note);
 }
 const disagreement=document.createElement('p');disagreement.textContent=`The fits disagree by up to ${review.maxFilterFitDisagreementPixels.toFixed(1)} px at the filter. They share anchors and are sensitivity checks, not independent measurements.`;target.append(disagreement);
 const bottom=figure(data.cableCopper.source,'1180 920 130 190','Primary underside: reference-informed ground terminals. No continuation to the filter is asserted.');
 for(const t of review.groundTerminals){const [x,y]=t.bottomPixel;bottom('circle',{cx:x,cy:y,r:5,fill:'none',stroke:'#ffe16a','stroke-width':1});bottom('text',{x:x+7,y:y+2,fill:'#ffe16a','font-size':5},t.terminal);}
 for(const gap of review.gaps){const p=document.createElement('p');p.dataset.supplyGap=gap.id;p.textContent=gap.text;target.append(p);}
 const link=document.createElement('a');link.href=`${data.source.cad.repository}/blob/${data.source.cad.revision}/models/robotron-1715m/keyboard-controller/generated/cable-copper.json`;link.textContent='Machine-readable supply review and fit checks';link.target='_blank';link.rel='noopener';target.append(link);
}
