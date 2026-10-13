import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { modelAsset } from './model-assets.js';
import { photoProjection } from './robotron-model.js';

// Inspection uses canonical meshes, not a second hand-built version of the disk.
export async function createDisketteViewer(host, tools) {
  let disposed=false, renderer, controls, observer;
  const owned=[];
  const dispose=()=>{
    disposed=true; observer?.disconnect(); controls?.dispose(); renderer?.setAnimationLoop(null);
    for(const resource of owned) resource.dispose(); renderer?.dispose(); host.replaceChildren(); tools.replaceChildren();
  };
  host.textContent='Loading 3D diskette…';
  const ready=(async()=>{
    const base=new URL('models/robotron-1715m/',new URL(import.meta.env.BASE_URL,location.origin));
    const response=await fetch(modelAsset('model.json',base));
    if(!response.ok) throw Error('Diskette manifest unavailable');
    const data=await response.json(), stl=new STLLoader();
    const names=['drive-diskette-0','drive-medium-0','drive-diskette-label-0','specimen-sleeve'];
    const records=names.map(name=>[...data.parts,...data.specimenMeshes].find(p=>p.name===name));
    const geometries=await Promise.all(records.map(p=>stl.loadAsync(modelAsset(p.file,base,p.sha256).href)));
    owned.push(...geometries);
    if(disposed){geometries.forEach(g=>g.dispose());return;}
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.outputColorSpace=THREE.SRGBColorSpace; host.replaceChildren(renderer.domElement);
    const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(40,1,10,1500);
    const assembly=new THREE.Group(), disk=new THREE.Group(); assembly.add(disk); scene.add(assembly);
    const colors=[0x242321,0x544039,0xd8d4bf,0xebe9df];
    geometries.forEach((geometry,i)=>{
      geometry.translate(...(i===3?[-69.5,-72.5,-1]:[161,144,-89.5]));
      const material=new THREE.MeshStandardMaterial({color:colors[i],roughness:i===1?.5:.85});owned.push(material);
      const mesh=new THREE.Mesh(geometry,material);(i===3?assembly:disk).add(mesh);
    });
    // The only photo skin is the owner's small handwritten label.
    const patch=data.patches.find(p=>p.name==='drive-diskette-ink-0');
    const texture=await new THREE.TextureLoader().loadAsync(modelAsset(patch.texture,base,patch.textureSha256).href);
    owned.push(texture); if(disposed){texture.dispose();return;}
    texture.colorSpace=THREE.SRGBColorSpace;
    const geometry=new THREE.PlaneGeometry(...patch.size,12,8);owned.push(geometry);
    const uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++){const [u,v]=photoProjection(patch.textureUv,uv.getX(i),1-uv.getY(i));uv.setXY(i,u,1-v);}
    const material=new THREE.MeshStandardMaterial({map:texture,roughness:.9});owned.push(material);
    const label=new THREE.Mesh(geometry,material);label.position.set(36,-44,.84);disk.add(label);
    scene.add(new THREE.HemisphereLight(0xffffff,0x737d78,2));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-100,-180,350);scene.add(light);
    camera.position.set(0,-180,460);controls=new OrbitControls(camera,renderer.domElement);
    controls.target.set(0,65,0);controls.minDistance=170;controls.maxDistance=850;controls.update();
    let dirty=true, amount=0, target=0, last;
    controls.addEventListener('change',()=>{dirty=true;});
    const flip=document.createElement('button');flip.textContent='Flip diskette and sleeve';
    flip.onclick=()=>{assembly.rotation.y=assembly.rotation.y?0:Math.PI;dirty=true;};
    const sleeve=document.createElement('button');sleeve.textContent='Slide into sleeve';sleeve.setAttribute('aria-pressed','false');
    sleeve.onclick=()=>{target=1-target;sleeve.textContent=target?'Slide out of sleeve':'Slide into sleeve';sleeve.setAttribute('aria-pressed',String(!!target));};
    const help=document.createElement('span');help.textContent='Drag to rotate · scroll or pinch to zoom';
    tools.replaceChildren(flip,sleeve,help);
    observer=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);dirty=true;});observer.observe(host);
    renderer.setAnimationLoop(now=>{
      const dt=last===undefined?0:Math.min(.05,(now-last)/1000);last=now;
      if(amount!==target){amount=matchMedia('(prefers-reduced-motion: reduce)').matches?target:amount+Math.sign(target-amount)*Math.min(Math.abs(target-amount),dt/ .7);dirty=true;}
      disk.position.y=(1-amount)*155;
      if(dirty){renderer.render(scene,camera);dirty=false;}
    });
    host.dataset.ready='true';
  })().catch(error=>{if(!disposed){host.textContent='3D inspection unavailable. The reference photos are below.';console.error(error);}});
  return {dispose,ready};
}
