// Optional presentation decay, never a mutation of the emulator framebuffer.
export function createCrtPresentation(source) {
  const canvas=document.createElement('canvas'), context=canvas.getContext('2d');
  let persistence=0, dirty=true, last=0, until=0;
  return {
    canvas,
    settings(value) {persistence=Math.max(0,Math.min(160,Number(value.persistence)||0));dirty=true;},
    update(){dirty=true;},
    tick(now){
      if(canvas.width!==source.width || canvas.height!==source.height){canvas.width=source.width;canvas.height=source.height;dirty=true;last=0;}
      if(!dirty && (!persistence || now>until))return false;
      const elapsed=last?now-last:Infinity;
      context.globalCompositeOperation='source-over';context.globalAlpha=1;
      if(!persistence || elapsed>1000){context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0);}
      else {
        context.fillStyle='#101812';context.globalAlpha=1-Math.exp(-elapsed/persistence);
        context.fillRect(0,0,canvas.width,canvas.height);context.globalAlpha=1;
        context.globalCompositeOperation='lighten';context.drawImage(source,0,0);
      }
      context.globalCompositeOperation='source-over';
      if(dirty)until=now+6*persistence;
      dirty=false;last=now;return true;
    },
  };
}
