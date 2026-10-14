import * as THREE from 'three';
import { inspectionEnvironment } from './inspection-lighting.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// A close-up renderer owns its resources and submits frames only when needed.
export function createInspectionStage(host, {near=1, far=1500}={}) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.replaceChildren(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,near,far);
  const controls=new OrbitControls(camera,renderer.domElement),owned=[];
  owned.push(inspectionEnvironment(renderer,scene));
  scene.add(new THREE.HemisphereLight(0xffffff,0x687773,2));
  const light=new THREE.DirectionalLight(0xfff7ed,2.5);light.position.set(-100,-180,350);scene.add(light);
  const rim=new THREE.DirectionalLight(0xe4edff,1.2);rim.position.set(160,100,100);scene.add(rim);
  let disposed=false,visible=true,frame,previous,animate;
  function invalidate(){if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(draw);}
  function draw(now){frame=undefined;if(disposed||!visible||document.hidden)return;
    const moving=animate?.(previous===undefined?0:Math.min(.05,(now-previous)/1000));previous=now;
    renderer.render(scene,camera);if(moving)invalidate();
  }
  controls.addEventListener('change',invalidate);
  const resize=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);invalidate();});resize.observe(host);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;previous=undefined;if(!visible){cancelAnimationFrame(frame);frame=undefined;}else invalidate();});intersection.observe(host);
  const visibility=()=>{previous=undefined;if(document.hidden){cancelAnimationFrame(frame);frame=undefined;}else invalidate();};document.addEventListener('visibilitychange',visibility);
  return {scene,camera,controls,owned,invalidate,setAnimation(fn){animate=fn;invalidate();},
    dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);controls.dispose();for(const resource of owned)resource.dispose();renderer.dispose();host.replaceChildren();},
  };
}
