import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { modelAsset } from './model-assets.js';
import { specimenMaterial } from './robotron-materials.js';
import { createInspectionStage } from './inspection-stage.js';

export function createKeyViewer(host, tools) {
  let disposed=false,stage;const resources=[];
  const dispose=()=>{disposed=true;stage?.dispose();for(const r of resources)r.dispose();host.replaceChildren();tools.replaceChildren();};
  host.textContent='Loading the key mechanism…';
  const ready=(async()=>{
    const base=new URL('models/robotron-1715m/',new URL(import.meta.env.BASE_URL,location.origin));
    const response=await fetch(modelAsset('model.json',base));if(!response.ok)throw Error('Key manifest unavailable');
    const data=await response.json(),key=data.keys.find(k=>k.style===0&&k.width===1),stl=new STLLoader();
    const definitions=[
      ['cap',key.mesh,0x252a29,'key'],['core',key.coreMesh,0xdedecf,'plastic'],
      ['spring','prototype-spring',0xa6aaa7,'metal'],['carrier','prototype-stem',0xd9d9c8,'plastic'],
      ['rubber','prototype-rubber',0x292d29,'rubber'],['guide','specimen-switch-guide',0xd9d9c8,'plastic'],
      ['mount','specimen-switch-mount',0x282d28,'plastic'],['contacts','specimen-switch-contacts',0x45443a,'metal'],
      ['pcb','specimen-switch-pcb',0x91ae94,'pcb'],
    ];
    const all=[...data.parts,...data.keyMeshes,...data.specimenMeshes],meshes=new Map();
    const geometry=await Promise.all(definitions.map(([,name])=>{const p=all.find(p=>p.name===name);return stl.loadAsync(modelAsset(p.file,base,p.sha256).href);}));
    resources.push(...geometry);if(disposed){geometry.forEach(g=>g.dispose());return;}
    stage=createInspectionStage(host,{near:.5,far:400});
    const assembly=new THREE.Group();assembly.rotation.x=-Math.PI/2;stage.scene.add(assembly);
    definitions.forEach(([name,,color,profile],i)=>{const material=specimenMaterial(color,data.materials[profile]);resources.push(material);const mesh=new THREE.Mesh(geometry[i],material);assembly.add(mesh);meshes.set(name,mesh);});
    stage.camera.position.set(44,34,60);stage.controls.target.set(0,0,0);stage.controls.minDistance=30;stage.controls.maxDistance=180;stage.controls.update();
    let travel=0,separation=0;
    const label=document.createElement('label');label.textContent='Press key ';const slider=document.createElement('input');slider.id='key-travel';slider.type='range';slider.min=0;slider.max=100;slider.value=0;label.append(slider);
    const output=document.createElement('output');output.id='key-contact-state';output.setAttribute('aria-live','polite');
    const exploded=document.createElement('button');exploded.textContent='Separate key parts';exploded.setAttribute('aria-pressed','false');
    const cutaway=document.createElement('button');cutaway.textContent='Show through cap and guide';cutaway.setAttribute('aria-pressed','false');
    const hold=document.createElement('button');hold.textContent='Press and hold';
    function pose(){
      const k=data.keyboardMechanism,down=-travel*k.travel;
      for(const name of ['cap','core','carrier','rubber'])meshes.get(name).position.z=down+separation*(name==='cap'||name==='core'?36:20);
      meshes.get('spring').position.z=k.springBase+separation*10;
      meshes.get('spring').scale.z=(k.installedHeight+down)/k.installedHeight;
      meshes.get('guide').position.z=separation*6;meshes.get('mount').position.z=separation*3;
      output.textContent=separation?'Separated for inspection':`${(travel*k.travel).toFixed(2)} mm travel · ${travel>=.999?'rubber bridges the pads':'contacts open'}`;
      output.dataset.closed=String(!separation&&travel>=.999);stage.invalidate();
    }
    slider.oninput=()=>{travel=Number(slider.value)/100;pose();};
    exploded.onclick=()=>{separation=1-separation;exploded.setAttribute('aria-pressed',String(!!separation));exploded.textContent=separation?'Assemble key parts':'Separate key parts';pose();assembly.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(assembly),center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;const direction=stage.camera.position.clone().sub(stage.controls.target).normalize();stage.controls.target.copy(center);stage.camera.position.copy(center).addScaledVector(direction,radius/Math.sin(THREE.MathUtils.degToRad(20))*1.1);stage.controls.update();stage.invalidate();};
    cutaway.onclick=()=>{const m=meshes.get('cap').material;m.transparent=!m.transparent;m.opacity=m.transparent?.22:1;m.depthWrite=!m.transparent;m.needsUpdate=true;meshes.get('core').visible=!m.transparent;const guide=meshes.get('guide').material;guide.transparent=m.transparent;guide.opacity=m.opacity;guide.depthWrite=m.depthWrite;guide.needsUpdate=true;cutaway.setAttribute('aria-pressed',String(m.transparent));pose();};
    function press(value){travel=value;slider.value=value*100;pose();}
    hold.onpointerdown=e=>{hold.setPointerCapture(e.pointerId);press(1);};
    hold.onpointerup=hold.onpointercancel=hold.onlostpointercapture=()=>press(0);
    hold.onkeydown=e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();press(1);}};hold.onkeyup=hold.onblur=()=>press(0);
    const note=document.createElement('p');note.textContent='Mechanical demonstration; no keystrokes sent to the OS. Spring: Ø13 × 23 mm free, 0.4 mm wire. Installed travel and hidden contact shape are estimates.';
    tools.replaceChildren(label,hold,exploded,cutaway,output,note);pose();host.dataset.ready='true';
  })().catch(error=>{if(!disposed){host.textContent='Key inspection unavailable; reference photos remain below.';console.error(error);}});
  return {dispose,ready};
}
