import rules from './robotron-evidence.json' with {type:'json'};
export const evidenceCategories={measured:{label:'Includes owner dimensions',color:0x61d68a},photo:{label:'Owner photo-derived geometry',color:0x58c9f3},reference:{label:'Generic / comparative reference',color:0xcb9aff},unknown:{label:'Evidence not mapped',color:0x969696}};
export function evidenceFor(mesh,model){
 const rule=rules.rules.find(r=>new RegExp(r.pattern).test(mesh.name))||{},assembly=model.evidence?.assemblies?.find(a=>a.id===(mesh.userData?.board||rule.assembly)),category=rule.category||'unknown',file=rule.verification?`models/robotron-1715m/${rule.verification}/model.scad`:'models/robotron-1715m/model.scad';
 const verification=model.modelVerification?.[file]?.physicalVerification||'unknown';
 return {title:mesh.userData?.key?`${mesh.userData.key.label||'Blank'} key`:mesh.userData?.pickedDetail?.title||mesh.name||'Model surface',category,evidence:evidenceCategories[category].label,photo:rule.photo||assembly?.photo,reference:rule.source||assembly?.source,text:[rule.measuredFeatures&&`Measured features: ${rule.measuredFeatures}`,rule.estimatedFeatures&&`Estimated features: ${rule.estimatedFeatures}`,rule.note,assembly?.note,rules.scope,`Physical print verification: ${verification}.`].filter(Boolean).join(' '),physicalVerification:verification};
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
 const legend=document.createElement('div');legend.id='evidence-legend';legend.hidden=true;legend.style.cssText='position:absolute;left:8px;top:8px;background:#16232bf2;color:white;padding:8px;border-radius:4px;z-index:3;pointer-events:none;font-size:12px';
 for(const entry of Object.values(evidenceCategories)){const row=document.createElement('div'),dot=document.createElement('span');dot.textContent='● ';dot.style.color='#'+entry.color.toString(16).padStart(6,'0');row.append(dot,document.createTextNode(entry.label));legend.append(row);}const note=document.createElement('div');note.textContent='Print verification is separate';legend.append(note);document.getElementById('viewport').append(legend);
 window.addEventListener('dac-inspection-mode',e=>legend.hidden=e.detail!=='evidence');
 const audit=document.createElement('button'),report=document.createElement('p');audit.textContent='Audit loaded part evidence';report.role='status';panel.append(audit,report);audit.onclick=()=>{const rows=scene?.evidenceCoverage()||[],unknown=rows.filter(r=>r.category==='unknown'),overlap=rows.filter(r=>r.matchingRules.length>1);report.textContent=`${rows.length} named meshes loaded; ${unknown.length} unmapped; ${overlap.length} match multiple ordered rules. Unmapped: ${unknown.map(r=>r.part).join(', ')||'none'}. Coverage does not establish dimensional accuracy.`;};
}

export function evidenceCoverage(model){
 const rows=[];model.group.traverse(o=>{if(!o.isMesh||!o.name)return;const matches=rules.rules.filter(r=>new RegExp(r.pattern).test(o.name));rows.push({part:o.name,category:evidenceFor(o,model).category,matchingRules:matches.map(r=>r.pattern)});});return rows;
}
