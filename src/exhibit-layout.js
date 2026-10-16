import {saveInspection,loadInspection,inspectionViews,removeInspection} from './inspection-store.js';
const key='dac-exhibit-layout-v1';
const checks=['open-case','open-monitor','open-keyboard','separate-parts','transparent-covers','release-clamps','disconnect-cables','reference-board-photo','inspection-labels','section-reverse','section-plane','section-caps','section-drag'];
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
  function applyLayout(value){
    busy=true;
    for(const id of checks)if(typeof value.checks?.[id]==='boolean')$(id).checked=value.checks[id];
    for(const id of selects)if([...$(id).options].some(o=>o.value===value.selects?.[id]))$(id).value=value.selects[id];
    if(![...document.querySelectorAll('[data-view]')].some(b=>b.dataset.view===value.view))value.view='overview';
    if(Number.isFinite(value.sectionPosition)&&Math.abs(value.sectionPosition)<=2)$('section-position').value=value.sectionPosition;
    try{apply(value);}finally{busy=false;}
  }
  function restore(){
    if(restored||$('viewport').dataset.model!=='robotron-photo'||$('power').disabled)return;
    restored=true;let value;try{const hash=location.hash;value=hash.startsWith('#inspect=')&&hash.length<8192?JSON.parse(decodeURIComponent(hash.slice(9))):JSON.parse(localStorage.getItem(key));}catch{}
    if(!value||value.version!==1)return;
    applyLayout(value);
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
    scene?.selectPart?.(null);scene?.clearMeasurement?.();apply({view:'overview'});try{localStorage.removeItem(key);}catch{}busy=false;
  };
  const share=document.createElement('button'),link=document.createElement('input'),status=document.createElement('p');share.id='share-inspection';share.textContent='Copy inspection link';link.id='inspection-link';link.readOnly=true;link.hidden=true;link.setAttribute('aria-label','Shareable inspection link');status.role='status';$('section-controls').append(share,link,status);
  share.onclick=async()=>{const value=write();if(!value){status.textContent='Wait for the Robotron model to load.';return;}const url=new URL(location.href);url.hash='inspect='+encodeURIComponent(JSON.stringify(value));link.value=url.href;link.hidden=false;try{await navigator.clipboard.writeText(url.href);status.textContent='Inspection link copied. It contains the view only, not your disks or running machine.';}catch{link.select();status.textContent='Copy the selected inspection link.';}};
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#inspect=')){restored=false;restore();}});
  const panel=document.createElement('details');panel.id='inspection-workspaces';panel.innerHTML=`<summary>Saved inspection views</summary><label>Name <input data-name maxlength="80"></label><button data-save>Save current inspection</button><label>Saved view <select data-list></select></label><button data-load>Restore inspection</button><button data-delete>Delete inspection</button><p data-status role="status"></p><p>Includes the view, selected component and current measurement. Saved views and named measurements travel with collection backups. Model identity must match when restoring.</p>`;$('section-controls').append(panel);
  const q=s=>panel.querySelector(s);let currentMeasurement=null;
  window.addEventListener('model-measurement',e=>currentMeasurement=e.detail?{format:'DAC-model-measurement-2',...e.detail}:null);
  async function refresh(){try{const rows=await inspectionViews();q('[data-list]').replaceChildren(...rows.map(r=>new Option(r.name,r.key)));q('[data-load]').disabled=q('[data-delete]').disabled=!rows.length;}catch(e){q('[data-status]').textContent=e.message;}}
  q('[data-save]').onclick=async()=>{try{const name=q('[data-name]').value.trim(),layout=write(),identity=scene?.modelIdentity();if(!name||!layout||!identity)throw Error('Enter a name and wait for the Robotron model.');const rows=await inspectionViews(),old=rows.find(r=>r.name===name);if(!old&&rows.length>=20)throw Error('Keep at most 20 inspection views.');await saveInspection(old?.key||'view:'+crypto.randomUUID(),name,{version:1,identity,layout,part:scene.selectedPart(),measurement:currentMeasurement});await refresh();q('[data-status]').textContent='Inspection saved.';}catch(e){q('[data-status]').textContent=e.message;}};
  q('[data-load]').onclick=async()=>{try{const value=await loadInspection(q('[data-list]').value);if(value?.version!==1||value.layout?.version!==1||JSON.stringify(value.identity)!==JSON.stringify(scene?.modelIdentity()))throw Error('Saved inspection model does not match this exhibit.');applyLayout(value.layout);if(value.measurement)scene.restoreMeasurement(value.measurement);else scene.clearMeasurement();scene.selectPart(value.part);q('[data-status]').textContent='Inspection restored.';}catch(e){q('[data-status]').textContent=e.message;}};
  q('[data-delete]').onclick=async()=>{try{await removeInspection(q('[data-list]').value);await refresh();q('[data-status]').textContent='Inspection deleted.';}catch(e){q('[data-status]').textContent=e.message;}};
  window.addEventListener('dac-collection-restored',refresh);refresh();
  restore();
}
