const key='dac-exhibit-layout-v1';
const checks=['open-case','open-monitor','open-keyboard','separate-parts','transparent-covers','release-clamps','disconnect-cables','reference-board-photo','inspection-labels','section-reverse','section-plane','section-caps'];
const selects=['isolate-assembly','component-focus','section-axis'];
export function installExhibitLayout(scene,apply){
  let restored=false,busy=false,timer;
  const $=id=>document.getElementById(id);
  function save(){
    if(!restored||busy||$('machine').value!=='2')return;
    clearTimeout(timer);timer=setTimeout(write,200);
  }
  function write(){
      if(!restored||busy||$('machine').value!=='2')return;
      const value={version:1,checks:Object.fromEntries(checks.map(id=>[id,$(id).checked])),selects:Object.fromEntries(selects.map(id=>[id,$(id).value])),view:document.querySelector('[data-view][aria-pressed="true"]')?.dataset.view||'overview',sectionPosition:Number($("section-position").value),camera:scene?.cameraState()};
      try{localStorage.setItem(key,JSON.stringify(value));}catch{}
      return value;
  }
  function saveNow(){clearTimeout(timer);write();}
  function restore(){
    if(restored||$('viewport').dataset.model!=='robotron-photo'||$('power').disabled)return;
    restored=true;let value;try{const hash=location.hash;value=hash.startsWith('#inspect=')&&hash.length<8192?JSON.parse(decodeURIComponent(hash.slice(9))):JSON.parse(localStorage.getItem(key));}catch{}
    if(!value||value.version!==1)return;
    busy=true;
    for(const id of checks)if(typeof value.checks?.[id]==='boolean')$(id).checked=value.checks[id];
    for(const id of selects)if([...$(id).options].some(o=>o.value===value.selects?.[id]))$(id).value=value.selects[id];
    if(![...document.querySelectorAll('[data-view]')].some(b=>b.dataset.view===value.view))value.view='overview';
    if(Number.isFinite(value.sectionPosition)&&Math.abs(value.sectionPosition)<=2)$('section-position').value=value.sectionPosition;
    apply(value);busy=false;
  }
  window.addEventListener('dac-model-ready',()=>queueMicrotask(restore));
  window.addEventListener('dac-configured',()=>queueMicrotask(restore));
  for(const id of [...checks,...selects,'section-position'])$(id).addEventListener('change',saveNow);
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',saveNow);
  scene?.onCameraChange(save);
  window.addEventListener('pagehide',saveNow);
  $('reset-exhibit-view').onclick=()=>{
    clearTimeout(timer);busy=true;
    for(const id of checks)$(id).checked=id==='disconnect-cables';
    $('section-axis').value='off';$('section-position').value='0';
    $('isolate-assembly').value='all';$('component-focus').value='none';
    $('drive-demo').checked=false;$('drive-demo-play').checked=false;$('drive-demo-phase').value='0';
    apply({view:'overview'});try{localStorage.removeItem(key);}catch{}busy=false;
  };
  const share=document.createElement('button'),link=document.createElement('input'),status=document.createElement('p');share.id='share-inspection';share.textContent='Copy inspection link';link.id='inspection-link';link.readOnly=true;link.hidden=true;link.setAttribute('aria-label','Shareable inspection link');status.role='status';$('section-controls').append(share,link,status);
  share.onclick=async()=>{const value=write();if(!value){status.textContent='Wait for the Robotron model to load.';return;}const url=new URL(location.href);url.hash='inspect='+encodeURIComponent(JSON.stringify(value));link.value=url.href;link.hidden=false;try{await navigator.clipboard.writeText(url.href);status.textContent='Inspection link copied. It contains the view only, not your disks or running machine.';}catch{link.select();status.textContent='Copy the selected inspection link.';}};
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#inspect=')){restored=false;restore();}});
  restore();
}
