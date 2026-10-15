import {inspectDisk,sectorText} from './disk-map.js';
export function createDiskExplorer(request){
  const dialog=document.createElement('dialog');dialog.id='disk-explorer';dialog.setAttribute('aria-labelledby','disk-map-title');
  dialog.innerHTML=`<button data-close autofocus>Close</button><h2 id="disk-map-title">Explore disk contents</h2>
    <div class="disk-map-controls"><label>Drive <select data-unit><option value="0">A</option><option value="1">B</option></select></label>
    <label>Layout <select data-layout><option value="tosm">TOS/M reference filesystem</option><option value="raw">Raw sectors</option></select></label>
    <label>Side <select data-side><option value="0">0</option><option value="1">1</option></select></label>
    <label><input type="checkbox" data-live checked> Live updates</label><button data-refresh>Refresh</button>
    <label>Map zoom <input data-zoom type="range" min="1" max="4" value="1" step=".5"></label></div>
    <p data-status role="status">Loading disk…</p><p data-activity></p><p>Tracks use the documented head radii. Sector order comes from the image; equal angular wedges are a schematic view.</p>
    <div class="disk-map-grid"><div><label>File <select data-files><option value="">All files</option></select></label><p data-file-info></p>
    <div class="disk-map-scroll"><canvas width="720" height="720" aria-label="Disk allocation map; use the cylinder and sector controls for keyboard navigation"></canvas></div>
    <p>Gray: blank/free · blue: system · gold: directory · colors: files · white outline: selected sector</p></div>
    <div><div class="disk-map-controls"><label>Cylinder <input data-cylinder type="number" min="0" max="79" value="0"></label><label>Sector <select data-sector></select></label></div>
    <p data-sector-info></p><label>Byte text size <input data-font type="range" min="11" max="22" value="13"></label>
    <pre data-bytes tabindex="0" aria-label="Sector hexadecimal bytes and ASCII"></pre></div></div>`;
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
  let map,buffer,selected,sequence=0,pending=false,timer,activity=[];
  const unit=()=>Number($('[data-unit]').value),side=()=>Number($('[data-side]').value);
  function refresh(){if(!dialog.open||pending||document.hidden)return;pending=true;request(unit(),++sequence);}
  function selectSector(s){selected=s;if(s){$('[data-cylinder]').value=s.c;$('[data-sector]').value=String(map.sectors.indexOf(s));}renderBytes();draw();}
  function sectors(){
    const c=Number($('[data-cylinder]').value),list=map?.sectors.filter(s=>s.c===c&&s.h===side())||[];
    $('[data-sector]').replaceChildren(...list.map(s=>new Option(`${s.r} · ${s.size} bytes`,String(map.sectors.indexOf(s)))));
    selectSector(list.find(s=>s.r===selected?.r)||list[0]);
  }
  function renderBytes(){
    $('[data-sector-info]').textContent=selected?`Cylinder ${selected.c}, side ${selected.h}, sector ${selected.r} · image offset 0x${selected.offset.toString(16)} · ${selected.file ? selected.file+' · file offset '+selected.fileOffset : selected.kind}${selected.flags?' · sector error flags':''}`:'No formatted sector at this position.';
    $('[data-bytes]').textContent=selected?sectorText(map,selected):'';
  }
  function draw(){
    ctx.clearRect(0,0,720,720);ctx.fillStyle='#181c21';ctx.beginPath();ctx.arc(360,360,350,0,2*Math.PI);ctx.fill();
    if(!map)return;
    const chosen=$('[data-files]').value;
    for(const s of map.sectors){
      if(s.h!==side())continue;
      const radius=([57.150,55.033][s.h]-s.c*25.4/96)*5.4,a=s.slot/s.count*2*Math.PI-Math.PI/2,b=(s.slot+1)/s.count*2*Math.PI-Math.PI/2;
      let color={unknown:'#818a96',free:'#323941',system:'#4e94cf',directory:'#d3ab4e'}[s.kind];
      if(s.file){let hash=0;for(const c of s.file)hash=(hash*31+c.charCodeAt(0))>>>0;color=`hsl(${hash%360} 60% 62%)`;}
      ctx.globalAlpha=chosen&&s.file!==chosen ? .22:1;
      ctx.strokeStyle=color;ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(360,360,radius,a+.003,b-.003);ctx.stroke();
      if(activity[unit()]?.c===s.c&&activity[unit()]?.h===s.h&&activity[unit()]?.r===s.r){ctx.globalAlpha=1;ctx.strokeStyle='#ff675d';ctx.lineWidth=3;ctx.stroke();}
      if(s===selected){ctx.globalAlpha=1;ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();}
    }
    ctx.globalAlpha=1;ctx.fillStyle='#bfc9d4';ctx.font='16px system-ui';ctx.textAlign='center';ctx.fillText(`SIDE ${side()}`,360,355);ctx.fillText('Select a sector',360,380);
  }
  function parse(){
    try{
      map=inspectDisk(buffer,$('[data-layout]').value);
      const previous=$('[data-files]').value;
      $('[data-files]').replaceChildren(new Option('All files',''),...map.files.map(f=>new Option(f.name,f.key)));
      if(map.files.some(f=>f.key===previous))$('[data-files]').value=previous;
      $('[data-status]').textContent=map.note;
      $('[data-side]').options[1].disabled=map.sides<2;if(side()>=map.sides)$('[data-side]').value='0';
      $('[data-cylinder]').max=map.cylinders-1;
      if(Number($('[data-cylinder]').value)>=map.cylinders)$('[data-cylinder]').value='0';
      fileInfo();sectors();
    }catch(error){clear(error.message);}
  }
  function clear(message){activity=[];$('[data-activity]').textContent='';map=undefined;selected=undefined;buffer=undefined;$('[data-status]').textContent=message;$('[data-files]').replaceChildren(new Option('All files',''));$('[data-file-info]').textContent='';$('[data-sector]').replaceChildren();renderBytes();draw();}
  function fileInfo(){const f=map?.files.find(f=>f.key===$('[data-files]').value);$('[data-file-info]').textContent=f?`${f.size.toLocaleString()} bytes (record-rounded) · ${f.sectors.length} allocated sectors`:'';}
  $('[data-files]').onchange=()=>{fileInfo();const s=map?.files.find(f=>f.key===$('[data-files]').value)?.sectors[0];if(s){$('[data-side]').value=s.h;$('[data-cylinder]').value=s.c;sectors();selectSector(s);}else draw();};
  $('[data-sector]').onchange=()=>selectSector(map?.sectors[Number($('[data-sector]').value)]);
  $('[data-cylinder]').onchange=$('[data-side]').onchange=sectors;
  $('[data-layout]').onchange=()=>buffer&&parse();
  $('[data-unit]').onchange=()=>{sequence++;pending=false;clear('Loading disk…');refresh();};
  $('[data-refresh]').onclick=refresh;
  $('[data-live]').onchange=()=>{if($('[data-live]').checked)refresh();else{sequence++;pending=false;}};
  $('[data-zoom]').oninput=()=>canvas.style.width=`${Number($('[data-zoom]').value)*100}%`;
  $('[data-font]').oninput=()=>$('[data-bytes]').style.fontSize=$('[data-font]').value+'px';
  canvas.onclick=e=>{
    if(!map)return;
    const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*720/box.width-360,y=(e.clientY-box.top)*720/box.height-360;
    const c=Math.round(([57.150,55.033][side()]-Math.hypot(x,y)/5.4)/(25.4/96));
    const angle=((Math.atan2(y,x)+Math.PI/2)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
    const list=map.sectors.filter(s=>s.c===c&&s.h===side()),s=list[Math.floor(angle/(2*Math.PI)*list.length)];
    if(s){$('[data-cylinder]').value=c;sectors();selectSector(s);}
  };
  $('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{clearInterval(timer);sequence++;pending=false;buffer=undefined;map=undefined;});
  return {
    activity(states,samples,on){
      if(!dialog.open||!$('[data-live]').checked)return;
      const next=(samples||[]).map((sample,u)=>on&&(sample?.detail&2)?{c:(states[u]>>8)&255,h:(sample.detail>>4)&1,r:(sample.detail>>8)&255}:null);
      if(JSON.stringify(next)===JSON.stringify(activity))return;
      activity=next;const a=activity[unit()];$('[data-activity]').textContent=a?`Controller access: cylinder ${a.c}, side ${a.h}, sector ${a.r} (red)`:'Controller idle';draw();
    },
    open(u=0){$('[data-unit]').value=u;sequence++;pending=false;clear('Loading disk…');if(!dialog.open)dialog.showModal();refresh();clearInterval(timer);timer=setInterval(()=>{if($('[data-live]').checked)refresh();},1500);},
    receive(d){if(!dialog.open||d.request!==sequence||d.unit!==unit())return;pending=false;if(d.error){clear(d.error);return;}buffer=d.bytes;parse();}
  };
}
