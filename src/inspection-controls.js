export function installInspectionControls(scene,release){
 const $=id=>document.getElementById(id),panel=document.createElement('details');panel.id='section-controls';panel.dataset.robotron='';
 panel.innerHTML=`<summary>Section view, sharing and navigation</summary><p>Inspection cut only: surfaces are not capped. Use “Isolate assembly” to examine one assembly.</p><label>Cut axis <select id="section-axis"><option value="off">No cut</option><option value="x">Left / right</option><option value="y">Bottom / top</option><option value="z">Back / front</option></select></label><label>Cut position <input id="section-position" type="range" min="-2" max="2" step=".005" value="0"></label><label><input id="section-reverse" type="checkbox">Reverse cut</label><label><input id="inspection-navigation" type="checkbox">Use keyboard to inspect the 3D view</label><p id="inspection-navigation-help">With inspection mode enabled, focus the 3D view: arrows orbit, + / − zoom, Home returns to the overview. Disable it or focus the screen to type into the machine.</p><button id="focus-inspection">Focus 3D view</button>`;
 ($('inspection-labels').closest('label')||$('reset-exhibit-view')).after(panel);
 const update=()=>scene?.section({axis:$('section-axis').value,position:Number($('section-position').value),reverse:$('section-reverse').checked});
 for(const id of ['section-axis','section-position','section-reverse'])$(id).addEventListener('input',update);
 $('inspection-navigation').onchange=release;$('focus-inspection').onclick=()=>{$('inspection-navigation').checked=true;release();$('viewport').focus();};
 $('viewport').addEventListener('keydown',e=>{
  if(!$('inspection-navigation').checked||e.target!==$('viewport'))return;
  e.stopImmediatePropagation();if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')scene?.view('overview');else scene?.navigate(e.key);}
 },true);
 return update;
}
