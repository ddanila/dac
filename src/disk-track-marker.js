import * as THREE from 'three';
// Inspection overlay only: never modifies drive transforms or controller state.
export function createDiskTrackMarker(group,objects,drives){
  const root=new THREE.Group();root.name='disk-track-inspection';root.visible=false;group.add(root);
  const points=Array.from({length:129},(_,i)=>new THREE.Vector3(Math.cos(i*Math.PI/64),Math.sin(i*Math.PI/64),0));
  const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x6cf3ac,depthTest:false,transparent:true,opacity:.9}));
  const contact=new THREE.Mesh(new THREE.SphereGeometry(.8,12,8),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));
  for(const mesh of [ring,contact]){mesh.renderOrder=999;mesh.raycast=()=>{};root.add(mesh);}
  let selected=null;
  return {
    root,
    select(value){selected=value&&[value.unit,value.h].every(n=>n===0||n===1)&&Number.isInteger(value.c)&&value.c>=0&&value.c<80?{...value}:null;this.update();},
    update(){
      const d=selected&&drives[selected.unit],medium=d&&objects.get(d.medium);
      root.visible=!!(medium?.visible);if(!root.visible)return;
      const radius=d.trackZeroRadii[selected.h]-selected.c*d.trackPitch;
      root.position.copy(medium.position);root.position.z+=d.headContacts[selected.h][2]-d.pivot[2];
      ring.scale.set(radius,radius,1);contact.position.set(0,radius,0);
      root.userData.selection={...selected,radius};
    },
    dispose(){for(const mesh of [ring,contact]){mesh.geometry.dispose();mesh.material.dispose();}root.removeFromParent();}
  };
}
