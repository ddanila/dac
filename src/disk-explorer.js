import {createDiskComparison} from './disk-comparison.js';
import {inspectDisk,sectorText,fileBytes,byteLocation,diskChanges} from './disk-map.js';
export function createDiskExplorer(request,onTrack=()=>{}){
  const dialog=document.createElement('dialog');dialog.id='disk-explorer';dialog.setAttribute('aria-labelledby','disk-map-title');
  dialog.innerHTML=`<button data-close autofocus>Close</button><h2 id="disk-map-title">Explore disk contents</h2>
    <div class="disk-map-controls"><label>Drive <select data-unit><option value="0">A</option><option value="1">B</option></select></label>
    <label>Layout <select data-layout><option value="tosm">TOS/M reference filesystem</option><option value="raw">Raw sectors</option></select></label>
    <label>Side <select data-side><option value="0">0</option><option value="1">1</option></select></label>
    <label><input type="checkbox" data-live checked> Live updates</label><button data-refresh>Refresh</button>
    <label>Map zoom <input data-zoom type="range" min="1" max="4" value="1" step=".5"></label></div>
    <p data-status role="status">Loading disk…</p><p data-activity></p><p data-changes role="status"></p><p>Tracks use the documented head radii. Sector order comes from the image; ID marks, data spans and gaps follow the emulator’s MFM timing layout; they are not a flux capture.</p>
    <div class="disk-map-grid"><div><label>File <select data-files><option value="">All files</option></select></label><p data-file-info></p>
    <button data-preview disabled>Preview file</button> <button data-download disabled>Download file</button>
    <details data-allocation><summary>How this file is allocated</summary><p>Directory entries point to 2 KiB blocks. Each extent addresses up to 16 KiB. Click a block to inspect its sectors.</p><div data-extents></div></details>
    <section data-preview-panel hidden><label>Preview <select data-preview-mode><option value="auto">Automatic</option><option value="text">ASCII text</option><option value="hex">Hex</option></select></label><p data-preview-info></p><pre data-preview-bytes tabindex="0"></pre></section>
    <div class="disk-map-scroll"><canvas width="720" height="720" aria-label="Disk allocation map; use the cylinder and sector controls for keyboard navigation"></canvas></div>
    <p>Gray: blank/free · blue: system · gold: directory · colors: files · white outline: selected sector · pink: recent changes · pale blue ticks: sector IDs</p><p data-map-location></p></div>
    <div><div class="disk-map-controls"><label>Cylinder <input data-cylinder type="number" min="0" max="79" value="0"></label><label>Sector <select data-sector></select></label></div>
    <p data-sector-info></p><button data-track disabled>Show track in drive</button><button data-clear-track>Clear track marker</button><p data-byte-info role="status"></p><label>Byte text size <input data-font type="range" min="11" max="22" value="13"></label>
    <p>Click a hex byte for its location; arrow keys move the selection.</p><pre data-bytes tabindex="0" aria-label="Sector hexadecimal bytes and ASCII"></pre></div></div>`;
  document.body.append(dialog);
  const $=s=>dialog.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
  let map,buffer,selected,sequence=0,pending=false,timer,activity=[],selectedByte=0,byteSignature='',changes={sectors:[],entries:[],files:[]},flashUntil=0;
  const unit=()=>Number($('[data-unit]').value),side=()=>Number($('[data-side]').value);
  const comparison=createDiskComparison(dialog,()=>({unit:unit(),bytes:buffer,layout:$('[data-layout]').value}),()=>{pending=true;request(unit(),++sequence,true);});
  function refresh(){if(!dialog.open||pending||document.hidden)return;pending=true;request(unit(),++sequence);}
  function selectSector(s){if(selected?.offset!==s?.offset)selectedByte=0;selected=s;if(s){$('[data-cylinder]').value=s.c;$('[data-sector]').value=String(map.sectors.indexOf(s));}renderBytes();draw();}
  function sectors(){
    const c=Number($('[data-cylinder]').value),list=map?.sectors.filter(s=>s.c===c&&s.h===side())||[];
    $('[data-sector]').replaceChildren(...list.map(s=>new Option(`${s.r} · ${s.size} bytes`,String(map.sectors.indexOf(s)))));
    selectSector(list.find(s=>s.r===selected?.r)||list[0]);
  }
  function renderBytes(){
    $('[data-track]').disabled=!selected;
    $('[data-sector-info]').textContent=selected?`Cylinder ${selected.c}, side ${selected.h}, sector ${selected.r} · image offset 0x${selected.offset.toString(16)} · ${selected.file ? selected.file+' · file offset '+selected.fileOffset : selected.kind}${selected.flags?' · sector error flags':''}`:'No formatted sector at this position.';
    const text=selected?sectorText(map,selected):'',signature=(selected?`${selected.offset}:${selected.file}:${selected.fileOffset}:`:'')+text;
    if(signature!==byteSignature){
      byteSignature=signature;const host=$('[data-bytes]'),focused=host.contains(document.activeElement);host.replaceChildren();
      if(!selected||selected.kind==='free')host.textContent=text;
      else{
        const bytes=map.bytes.subarray(selected.offset,selected.offset+selected.size),fragment=document.createDocumentFragment();
        for(let i=0;i<bytes.length;i+=16){
          fragment.append(document.createTextNode(i.toString(16).padStart(4,'0')+'  '));
          for(let j=i;j<Math.min(i+16,bytes.length);j++){
            const button=document.createElement('button');button.dataset.byte=j;button.textContent=bytes[j].toString(16).padStart(2,'0');button.tabIndex=j===selectedByte?0:-1;
            button.setAttribute('aria-label',`Byte ${j}: hexadecimal ${button.textContent}`);fragment.append(button,document.createTextNode(' '));
          }
          fragment.append(document.createTextNode(' '+[...bytes.subarray(i,i+16)].map(b=>b>=32&&b<127?String.fromCharCode(b):'.').join('')+'\n'));
        }
        host.append(fragment);if(focused)host.querySelector(`[data-byte="${selectedByte}"]`)?.focus({preventScroll:true});
      }
    }
    describeByte();
  }
  function describeByte(){
    const p=selected&&byteLocation(selected,selectedByte),host=$('[data-bytes]');
    for(const button of host.querySelectorAll('[data-byte]')){const active=Number(button.dataset.byte)===selectedByte;button.tabIndex=active?0:-1;button.setAttribute('aria-pressed',String(active));}
    $('[data-byte-info]').textContent=p?`Byte ${p.index} · image 0x${p.imageOffset.toString(16)} · C${p.c}/H${p.h}/R${p.r} · ${p.block===undefined?'outside filesystem blocks':'block '+p.block}${p.entry===undefined?'':' · directory entry '+p.entry+' · extent '+p.extent}${p.file?' · '+p.file+(p.fileOffset===null?' · allocation padding':' offset '+p.fileOffset):''}`:'';
  }
  $('[data-bytes]').onclick=e=>{const b=e.target.closest('[data-byte]');if(b){selectedByte=Number(b.dataset.byte);describeByte();}};
  $('[data-bytes]').onkeydown=e=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-16,ArrowDown:16}[e.key];if(delta&&selected&&selected.kind!=='free'){e.preventDefault();selectedByte=Math.max(0,Math.min(selected.size-1,selectedByte+delta));describeByte();$('[data-bytes]').querySelector(`[data-byte="${selectedByte}"]`)?.focus();}};
  function draw(){
    ctx.clearRect(0,0,720,720);ctx.fillStyle='#181c21';ctx.beginPath();ctx.arc(360,360,350,0,2*Math.PI);ctx.fill();
    if(!map)return;
    const chosen=$('[data-files]').value;
    for(const s of map.sectors){
      if(s.h!==side())continue;
      const radius=([57.150,55.033][s.h]-s.c*25.4/96)*5.4,a=s.dataStart*2*Math.PI-Math.PI/2,b=s.dataEnd*2*Math.PI-Math.PI/2;
      let color={unknown:'#818a96',free:'#323941',system:'#4e94cf',directory:'#d3ab4e'}[s.kind];
      if(s.file){let hash=0;for(const c of s.file)hash=(hash*31+c.charCodeAt(0))>>>0;color=`hsl(${hash%360} 60% 62%)`;}
      ctx.globalAlpha=chosen&&s.file!==chosen ? .22:1;
      ctx.strokeStyle='#8bb7ca';ctx.lineWidth=1;ctx.beginPath();ctx.arc(360,360,radius,s.idStart*2*Math.PI-Math.PI/2,s.idEnd*2*Math.PI-Math.PI/2);ctx.stroke();
      ctx.strokeStyle=color;ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(360,360,radius,a,b);ctx.stroke();
      if(performance.now()<flashUntil&&changes.sectors.includes(`${s.c}:${s.h}:${s.slot}`)){ctx.globalAlpha=1;ctx.strokeStyle='#ff6cd3';ctx.lineWidth=2;ctx.stroke();}
      if(activity[unit()]?.c===s.c&&activity[unit()]?.h===s.h&&activity[unit()]?.r===s.r){ctx.globalAlpha=1;ctx.strokeStyle='#ff675d';ctx.lineWidth=3;ctx.stroke();}
      if(s===selected){ctx.globalAlpha=1;ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();}
    }
    ctx.globalAlpha=1;ctx.fillStyle='#bfc9d4';ctx.font='16px system-ui';ctx.textAlign='center';ctx.fillText(`SIDE ${side()}`,360,355);ctx.fillText('Select a sector',360,380);
  }
  function parse(){
    try{
      const next=inspectDisk(buffer,$('[data-layout]').value),delta=diskChanges(map,next);
      if(delta.sectors.length||delta.entries.length){changes=delta;flashUntil=performance.now()+4500;$('[data-changes]').textContent=`Changed since previous snapshot: ${delta.sectors.length} sectors · ${delta.entries.length} directory entries${delta.entries.length?' ('+delta.entries.join(', ')+')':''}${delta.files.length?' · files: '+delta.files.join(', '):''}`;}
      map=next;
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
  function clear(message){activity=[];changes={sectors:[],entries:[],files:[]};flashUntil=0;$('[data-changes]').textContent='';$('[data-activity]').textContent='';map=undefined;selected=undefined;buffer=undefined;$('[data-status]').textContent=message;$('[data-files]').replaceChildren(new Option('All files',''));$('[data-file-info]').textContent='';$('[data-sector]').replaceChildren();fileInfo();renderBytes();draw();}
  function currentFile(){return map?.files.find(f=>f.key===$('[data-files]').value);}
  function fileInfo(){
    const f=currentFile();$('[data-file-info]').textContent=f?`${f.size.toLocaleString()} bytes (record-rounded) · ${f.sectors.length} allocated sectors`:'';
    $('[data-preview]').disabled=$('[data-download]').disabled=!f;
    const host=$('[data-extents]');host.replaceChildren();
    if(f){
      for(const entry of [...f.extents].sort((a,b)=>a.extent-b.extent)){
        const row=document.createElement('p');row.classList.toggle('disk-entry-changed',performance.now()<flashUntil&&changes.entries.includes(entry.index));
        row.append(document.createTextNode(`Entry ${entry.index} → extent ${entry.extent} → ${entry.records} records → blocks `));
        for(const block of entry.blocks){const button=document.createElement('button');button.textContent=block;button.onclick=()=>{const s=f.sectors.find(s=>s.block===block);if(s){$('[data-side]').value=s.h;$('[data-cylinder]').value=s.c;sectors();selectSector(s);}};row.append(button,document.createTextNode(' '));}
        host.append(row);
      }
    }
    if(!$('[data-preview-panel]').hidden)preview();
  }
  function preview(){
    const f=currentFile();$('[data-preview-panel]').hidden=!f;if(!f)return;
    try{
      const bytes=fileBytes(map,f),shown=bytes.subarray(0,65536),choice=$('[data-preview-mode]').value;
      const readable=shown.filter(b=>b>=32&&b<127||[9,10,13,26].includes(b)).length;
      const mode=choice==='auto'?(readable>=shown.length*.85?'text':'hex'):choice;
      $('[data-preview-info]').textContent=`${f.name} · ${bytes.length} bytes, rounded to 128-byte records${bytes.length>shown.length?' · preview limited to first 64 KiB':''}. No EOF or padding bytes are removed.`;
      $('[data-preview-bytes]').textContent=mode==='text'?[...shown].map(b=>b===10?'\n':b===13?'':b===9?'\t':b>=32&&b<127?String.fromCharCode(b):b===26?'␚':'.').join(''):sectorText({bytes:shown},{offset:0,size:shown.length});
    }catch(e){$('[data-preview-info]').textContent=e.message;$('[data-preview-bytes]').textContent='';}
  }
  $('[data-preview]').onclick=()=>{$('[data-preview-panel]').hidden=false;preview();};
  $('[data-preview-mode]').onchange=preview;
  $('[data-download]').onclick=()=>{
    const f=currentFile();if(!f)return;
    try{const bytes=fileBytes(map,f),url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=f.name.replace(/[^a-zA-Z0-9_.-]/g,'_');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    catch(e){$('[data-file-info]').textContent=e.message;}
  };
  $('[data-track]').onclick=()=>{if(selected){const target={unit:unit(),c:selected.c,h:selected.h};dialog.close();onTrack(target);}};
  $('[data-clear-track]').onclick=()=>onTrack(null);
  $('[data-files]').onchange=()=>{fileInfo();const s=map?.files.find(f=>f.key===$('[data-files]').value)?.sectors[0];if(s){$('[data-side]').value=s.h;$('[data-cylinder]').value=s.c;sectors();selectSector(s);}else draw();};
  $('[data-sector]').onchange=()=>selectSector(map?.sectors[Number($('[data-sector]').value)]);
  $('[data-cylinder]').onchange=$('[data-side]').onchange=sectors;
  $('[data-layout]').onchange=()=>{map=undefined;if(buffer)parse();};
  $('[data-unit]').onchange=()=>{sequence++;pending=false;clear('Loading disk…');comparison.reset();refresh();};
  $('[data-refresh]').onclick=refresh;
  $('[data-live]').onchange=()=>{if($('[data-live]').checked)refresh();else{sequence++;pending=false;}};
  $('[data-zoom]').oninput=()=>canvas.style.width=`${Number($('[data-zoom]').value)*100}%`;
  $('[data-font]').oninput=()=>$('[data-bytes]').style.fontSize=$('[data-font]').value+'px';
  canvas.onclick=e=>{
    if(!map)return;
    const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)*720/box.width-360,y=(e.clientY-box.top)*720/box.height-360;
    const c=Math.round(([57.150,55.033][side()]-Math.hypot(x,y)/5.4)/(25.4/96));
    const angle=((Math.atan2(y,x)+Math.PI/2)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
    const list=map.sectors.filter(s=>s.c===c&&s.h===side()),s=list.find(s=>angle/(2*Math.PI)>=s.dataStart&&angle/(2*Math.PI)<s.dataEnd||angle/(2*Math.PI)>=s.idStart&&angle/(2*Math.PI)<s.idEnd);
    if(s){$('[data-map-location]').textContent='';$('[data-cylinder]').value=c;sectors();selectSector(s);}else $('[data-map-location]').textContent=list.length?'Gap or synchronization area — no stored payload bytes at this angle.':'Outside formatted tracks.';
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
    open(u=0){$('[data-unit]').value=u;comparison.reset();sequence++;pending=false;clear('Loading disk…');if(!dialog.open)dialog.showModal();refresh();clearInterval(timer);timer=setInterval(()=>{if($('[data-live]').checked)refresh();if(dialog.open&&!document.hidden)draw();},1500);},
    receive(d){if(!dialog.open||d.request!==sequence||d.unit!==unit())return;pending=false;if(d.error){clear(d.error);return;}buffer=d.bytes;if(d.original)comparison.original(d.original,d.unit);parse();}
  };
}
