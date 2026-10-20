const NS='http://www.w3.org/2000/svg';
export function renderFilterRegistration(target,data){
 const graph=data.cableCopper,review=graph.filterRegistration;
 target.replaceChildren();
 const summary=document.createElement('p');summary.dataset.filterRegistration='';
 summary.textContent=`${review.photoAlignmentAccepted?'Local photo correspondence accepted':'Local photo correspondence rejected'}: ${review.maxCheckResidualPixels.toFixed(1)} px maximum held-out residual against a ${review.tolerancePixels} px observation allowance. No winding or electrical pin assignment.`;
 target.append(summary);
 const label=document.createElement('label');label.textContent='Matched filter joint ';
 const select=document.createElement('select');select.setAttribute('aria-label','Matched filter joint');
 for(const pair of review.correspondences)select.add(new Option(`${pair.node} (${pair.role})`,pair.node));
 label.append(select);target.append(label);
 const figures=[];
 const photoURL=source=>`${import.meta.env.BASE_URL}models/robotron-1715m/photos/${encodeURIComponent(source.path.split('/').pop())}`;
 for(const side of ['top','bottom']){
  const figure=document.createElement('figure');figure.dataset.filterPhoto=side;
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',side==='top'?'1170 665 210 160':'1385 570 155 160');
  svg.setAttribute('role','img');svg.setAttribute('aria-label',`Primary ${side}: filter joint correspondence`);
  svg.style.cssText='display:block;width:100%;max-width:560px;max-height:440px;background:#14232d';
  const add=(parent,tag,attrs)=>{const node=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);parent.append(node);return node;};
  const source=side==='top'?review.topSource:graph.source;
  add(svg,'image',{href:photoURL(source),width:3072,height:4080});
  const overlay=add(svg,'g',{'data-filter-overlay':side});
  const points=review[side+'AnchorHull'];
  const center=points.reduce((a,p)=>[a[0]+p[0]/points.length,a[1]+p[1]/points.length],[0,0]);
  const hull=[...points].sort((a,b)=>Math.atan2(a[1]-center[1],a[0]-center[0])-Math.atan2(b[1]-center[1],b[0]-center[0]));
  add(overlay,'polygon',{points:hull.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#aeb8bf','stroke-width':.7,'stroke-dasharray':'1 4'});
  for(const span of review.boundedUndersideSpans)add(overlay,'polyline',{'data-bounded-span':span.id,points:span[side==='top'?'projectedTopPixels':'bottomPixels'].map(p=>p.join(',')).join(' '),fill:'none',stroke:'#5bd8e0','stroke-width':1,'stroke-dasharray':side==='top'?'2 2':''});
  const circles=[];
  for(const pair of review.correspondences){
   const [x,y]=pair[side+'Pixel'];
   const circle=add(overlay,'circle',{'data-matched-joint':pair.node,cx:x,cy:y,r:4,fill:'none',stroke:'#5bd8e0','stroke-width':1.5});
   const title=add(circle,'title',{});title.textContent=`${pair.node}: ${pair.role}; anonymous photo feature`;
   const text=add(overlay,'text',{x:x+5,y:y-5,fill:'#ffe16a',stroke:'#14232d','stroke-width':.3,'paint-order':'stroke','font-size':7});text.textContent=pair.node;
   circles.push({id:pair.node,circle,text});
  }
  const caption=document.createElement('figcaption');caption.textContent=side==='top'?'Primary top. Circles mark recorded joints. Dashed cyan spans project underside copper, not top tracks. The grey dotted boundary limits registration; it is not copper.':'Primary underside. Solid cyan spans are recorded copper. The grey dotted boundary is not copper. The two rows do not establish winding pairing.';
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Hide joint overlay';toggle.setAttribute('aria-pressed','false');toggle.onclick=()=>{const hide=overlay.style.display!=='none';overlay.style.display=hide?'none':'';toggle.textContent=hide?'Show joint overlay':'Hide joint overlay';toggle.setAttribute('aria-pressed',String(hide));};
  const link=document.createElement('a');link.href=photoURL(source);link.textContent='Original photo';link.target='_blank';link.rel='noopener';
  figure.append(svg,caption,toggle,' ',link);target.append(figure);figures.push(circles);
 }
 const selection=document.createElement('p');selection.dataset.filterMatch='';target.append(selection);
 function update(){
  for(const circles of figures)for(const item of circles){const active=item.id===select.value;item.circle.setAttribute('stroke',active?'#ffe16a':'#5bd8e0');item.text.style.display=active?'':'none';}
  const pair=review.correspondences.find(p=>p.node===select.value),check=review.checks.find(c=>c.node===pair.node);
  selection.textContent=`${pair.node}: ${pair.role==='anchor'?'fit anchor; its fitted agreement is not an independent check':`held-out residual ${check.residualPixels.toFixed(1)} px`}. No L1 or XT1 pin identity.`;
 }
 select.onchange=update;update();
 const note=document.createElement('p');note.textContent=review.limits;target.append(note);
 const details=document.createElement('details'),heading=document.createElement('summary');heading.textContent='Fit checks and source';details.append(heading);
 for(const text of [review.scope,review.acceptance,`External resistor checks reach ${Math.max(...review.extrapolationChecks.map(c=>c.residualPixels)).toFixed(1)} px residual. These lie outside the filter boundary and do not extend the accepted region.`]){const p=document.createElement('p');p.textContent=text;details.append(p);}
 const link=document.createElement('a');link.href=`${data.source.cad.repository}/blob/${data.source.cad.revision}/models/robotron-1715m/keyboard-controller/generated/cable-copper.json`;link.textContent='Machine-readable filter registration';link.target='_blank';link.rel='noopener';details.append(link);target.append(details);
}
