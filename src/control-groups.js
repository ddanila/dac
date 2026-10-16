// Keep power and machine identity visible; group secondary tools without cloning
// controls or losing their listeners. All tools remain searchable by the browser.
export function installControlGroups(){
 const aside=document.querySelector('aside'),anchor=document.getElementById('drive-diagnostics');
 const nav=document.createElement('nav');nav.className='control-navigation';nav.setAttribute('aria-label','Computer controls');
 const definitions=[['use','Use computer'],['inspect','Inspect model'],['diagnose','Diagnose hardware']],groups=new Map();
 const candidates=[...aside.children].slice([...aside.children].indexOf(anchor));
 aside.insertBefore(nav,anchor);
 for(const [id,title] of definitions){const section=document.createElement('section');section.id='controls-'+id;section.className='control-group';section.setAttribute('aria-labelledby',section.id+'-title');const heading=document.createElement('h2');heading.id=section.id+'-title';heading.textContent=title;section.append(heading);aside.append(section);groups.set(id,section);}
 const diagnostic=new Set(['drive-diagnostics','drive-state','keyboard-mode','record-controls','electrical-panel','circuit-panel','serial-panel','debug-controls']);
 for(const node of candidates){if(node.id==='error')continue;const id=node.id;const category=diagnostic.has(id)?'diagnose':['section-controls','measurement-panel','evidence-controls'].includes(id)||node.matches('[data-component]')||node.querySelector('#inspection-labels,#crt-brightness')?'inspect':'use';groups.get(category).append(node);}
 for(const [id,title] of [['all','All controls'],...definitions]){const b=document.createElement('button');b.type='button';b.textContent=title;b.dataset.controlGroup=id;b.setAttribute('aria-pressed',String(id==='all'));b.onclick=()=>{for(const [key,section] of groups)section.hidden=id!=='all'&&id!==key;for(const button of nav.children)button.setAttribute('aria-pressed',String(button===b));};nav.append(b);}
 aside.append(document.getElementById('error'));
 // Programmatic navigation (e.g. a circuit or disk annotation) can reveal a group.
 document.addEventListener('reveal-controls',e=>{const target=document.getElementById(e.detail);const group=target?.closest('.control-group');if(group){nav.querySelector('[data-control-group="'+group.id.slice(9)+'"]')?.click();target.scrollIntoView({block:'nearest'});}});
}
