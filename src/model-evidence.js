import rules from './robotron-evidence.json' with {type:'json'};
export const evidenceCategories={measured:{label:'Includes owner dimensions',color:0x61d68a},photo:{label:'Owner photo-derived geometry',color:0x58c9f3},reference:{label:'Generic / comparative reference',color:0xcb9aff},unknown:{label:'Evidence not mapped',color:0x969696}};
export function evidenceFor(mesh,model){
 const rule=rules.rules.find(r=>new RegExp(r.pattern).test(mesh.name))||{},assembly=model.evidence?.assemblies?.find(a=>a.id===(mesh.userData?.board||rule.assembly)),category=rule.category||'unknown',file=rule.verification?`models/robotron-1715m/${rule.verification}/model.scad`:'models/robotron-1715m/model.scad';
 const verification=model.modelVerification?.[file]?.physicalVerification||'unknown';
 return {title:mesh.userData?.key?`${mesh.userData.key.label||'Blank'} key`:mesh.userData?.pickedDetail?.title||mesh.name||'Model surface',category,evidence:evidenceCategories[category].label,photo:assembly?.photo,reference:assembly?.source,text:[rule.note,assembly?.note,rules.scope,`Physical print verification: ${verification}.`].filter(Boolean).join(' '),physicalVerification:verification};
}
export function createEvidenceView(model){
 let active=false;const originals=new Map(),categories=new WeakMap();
 function refresh(){if(!active)return;model.group.traverse(o=>{if(!o.isMesh)return;let category=categories.get(o);if(!category){category=evidenceFor(o,model).category;categories.set(o,category);}const materials=[o.material].flat();let changed=false;
  for(let i=0;i<materials.length;i++){let m=materials[i];if(!m?.color)continue;const saved=originals.get(m);
   if(saved&&saved.category!==category){const clone=m.clone();clone.onBeforeCompile=m.onBeforeCompile;clone.customProgramCacheKey=m.customProgramCacheKey;clone.color.copy(saved.color);materials[i]=m=clone;changed=true;}
   if(!originals.has(m)){const base=originals.get(o.userData.baseMaterial);originals.set(m,{color:base?.color.clone()||m.color.clone(),category});}m.color.setHex(evidenceCategories[category].color);
  }if(changed)o.material=Array.isArray(o.material)?materials:materials[0];
 });}
 return {get active(){return active;},info:mesh=>evidenceFor(mesh,model),refresh,set(value){active=!!value;if(!active){for(const [m,v]of originals)m.color.copy(v.color);originals.clear();return;}refresh();}};
}
export function installEvidenceControls(scene){
 const panel=document.createElement('details');panel.id='evidence-controls';panel.dataset.robotron='';panel.innerHTML='<summary>Show model evidence</summary><label><input type="checkbox" data-enable>Colour parts by evidence</label><p>In this mode, click a surface to inspect its evidence instead of operating it. Green includes owner dimensions; blue follows owner photos; purple is generic or comparative; grey is unmapped. None of these colours means printed and verified.</p>';
 window.addEventListener('dac-inspection-mode',e=>panel.querySelector('input').checked=e.detail==='evidence');document.getElementById('measurement-panel').after(panel);panel.querySelector('input').onchange=e=>scene?.evidenceMode(e.target.checked);
}
