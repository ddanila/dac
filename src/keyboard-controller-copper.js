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
