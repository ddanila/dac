const key='dac-exhibit-layout-v1';
const checks=['open-case','open-monitor','open-keyboard','separate-parts','transparent-covers','release-clamps','disconnect-cables','reference-board-photo','inspection-labels'];
const selects=['isolate-assembly','component-focus'];
export function installExhibitLayout(scene,apply){
  let restored=false,busy=false,timer;
  const $=id=>document.getElementById(id);
  function save(){
    if(!restored||busy||$('machine').value!=='2')return;
    clearTimeout(timer);timer=setTimeout(write,200);
  }
  function write(){
      if(!restored||busy||$('machine').value!=='2')return;
      const value={version:1,checks:Object.fromEntries(checks.map(id=>[id,$(id).checked])),selects:Object.fromEntries(selects.map(id=>[id,$(id).value])),view:document.querySelector('[data-view][aria-pressed="true"]')?.dataset.view||'overview',camera:scene?.cameraState()};
      try{localStorage.setItem(key,JSON.stringify(value));}catch{}
  }
  function saveNow(){clearTimeout(timer);write();}
  function restore(){
    if(restored||$('viewport').dataset.model!=='robotron-photo'||$('power').disabled)return;
    restored=true;let value;try{value=JSON.parse(localStorage.getItem(key));}catch{}
    if(!value||value.version!==1)return;
    busy=true;
    for(const id of checks)if(typeof value.checks?.[id]==='boolean')$(id).checked=value.checks[id];
    for(const id of selects)if([...$(id).options].some(o=>o.value===value.selects?.[id]))$(id).value=value.selects[id];
    if(![...document.querySelectorAll('[data-view]')].some(b=>b.dataset.view===value.view))value.view='overview';
    apply(value);busy=false;
  }
  window.addEventListener('dac-model-ready',()=>queueMicrotask(restore));
  window.addEventListener('dac-configured',()=>queueMicrotask(restore));
  for(const id of [...checks,...selects])$(id).addEventListener('change',saveNow);
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',saveNow);
  scene?.onCameraChange(save);
  window.addEventListener('pagehide',saveNow);
  $('reset-exhibit-view').onclick=()=>{
    clearTimeout(timer);busy=true;
    for(const id of checks)$(id).checked=id==='disconnect-cables';
    $('isolate-assembly').value='all';$('component-focus').value='none';
    $('drive-demo').checked=false;$('drive-demo-play').checked=false;$('drive-demo-phase').value='0';
    apply({view:'overview'});try{localStorage.removeItem(key);}catch{}busy=false;
  };
  restore();
}
