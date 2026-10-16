// Three.js rebuilds GPU resources on restoration. Keep CPU geometry and the
// emulator worker alive, and explicitly restart our demand-driven render loop.
export function installRenderRecovery(renderer,host,onChange){
 let lost=false,disposed=false;
 const status=document.createElement('p');status.className='render-recovery';status.role='status';status.hidden=true;host.append(status);
 function loss(event){event.preventDefault();lost=true;host.dataset.graphics='lost';status.hidden=false;status.textContent='3D graphics interrupted. Your machine is still running; waiting for graphics recovery…';onChange(false);}
 function restore(){if(disposed)return;lost=false;host.dataset.graphics='ready';status.hidden=true;renderer.shadowMap.needsUpdate=true;onChange(true);}
 renderer.domElement.addEventListener('webglcontextlost',loss);renderer.domElement.addEventListener('webglcontextrestored',restore);
 return {get lost(){return lost;},dispose(){disposed=true;renderer.domElement.removeEventListener('webglcontextlost',loss);renderer.domElement.removeEventListener('webglcontextrestored',restore);status.remove();}};
}
