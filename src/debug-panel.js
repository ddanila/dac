export function createDebugPanel(send){
 const panel=document.createElement('details');panel.id='debug-controls';panel.dataset.robotron='';panel.innerHTML=`<summary>Z80 debugger</summary><p>Pause emulation without powering off. Step advances to the next instruction boundary (up to 100,000 clocks); DMA and other devices advance too. Reads below have no guest bus side effects. Stop recordings before debugging.</p><button data-pause>Pause</button><button data-resume>Resume</button><button data-step disabled>Next instruction boundary</button><button data-refresh>Refresh registers</button><label>Execution address (hex) <input data-execution value="0000" maxlength="4"></label><button data-run-to>Run to address</button><button data-arm-execution>Arm execution breakpoint</button><button data-clear-break>Clear breakpoints</button><p>Execution stops after opcode fetch, before the instruction executes. Stops use the logical CPU address in the current bank.</p><p data-flags></p><p data-status role="status"></p><pre data-registers tabindex="0"></pre><pre data-disassembly tabindex="0"></pre><label>Memory address (hex) <input data-address value="0000" maxlength="4"></label><button data-memory>Inspect 128 bytes</button><pre data-bytes tabindex="0"></pre><p>Read and write mappings may differ. Bank addresses are physical offsets, not additional CPU address bits. Use “Stop on trigger” in the circuit panel for a bus-event breakpoint.</p>`;
 document.getElementById('circuit-panel').after(panel);const $=s=>panel.querySelector(s);
 for(const action of ['pause','resume','step','refresh','clear-break'])$('[data-'+action+']').onclick=()=>send({type:'debug-'+action});
 $('[data-memory]').onclick=()=>{const text=$('[data-address]').value;if(!/^[a-f0-9]{1,4}$/i.test(text)){ $('[data-status]').textContent='Enter a 16-bit hexadecimal address.';return;}send({type:'debug-memory',address:parseInt(text,16)});};
 const hex=(n,w=4)=>n.toString(16).padStart(w,'0'),spaces=['unknown','RAM','ROM','video','glyphs','I/O'];let previous=[],previousMemory=new Map();
 for(const action of ['run-to','arm-execution'])$('[data-'+action+']').onclick=()=>{const value=$('[data-execution]').value;if(!/^[a-f0-9]{1,4}$/i.test(value)){$('[data-status]').textContent='Enter a 16-bit hexadecimal address.';return;}send({type:'debug-'+action,address:parseInt(value,16)});};
 function cell(text,changed){const e=document.createElement('span');e.textContent=text;if(changed){e.className='debug-changed';e.title='Changed since the previous inspection';}return e;}
 return {message(d){
  if(['power','configured','capture-reset'].includes(d.type)){previous=[];previousMemory.clear();$('[data-status]').textContent='';$('[data-step]').disabled=true;for(const field of ['registers','disassembly','bytes','flags'])$('[data-'+field+']').textContent='';}
  if(d.type==='debug-error')$('[data-status]').textContent=d.message;
  if(d.type!=='debug-state')return;
  $('[data-status]').textContent=d.message||(d.paused?'Emulation paused.':'Emulation running.');
  if(d.values){$('[data-registers]').replaceChildren(...d.values.map((v,i)=>cell(d.names[i]+': '+hex(v)+'  ',previous.length>i&&previous[i]!==v)));previous=d.values;
   const flags=d.values[2]&255;$('[data-flags]').textContent='Flags: '+[['S',7],['Z',6],['Y',5],['H',4],['X',3],['P/V',2],['N',1],['C',0]].map(([name,bit])=>name+'='+((flags>>bit)&1)).join('  ');
  }else $('[data-registers]').textContent=d.registers||'';
  $('[data-disassembly]').textContent=d.disassembly||'';
  if(d.memoryRows){const nodes=[];for(const row of d.memoryRows){nodes.push(cell(hex(row.address)+'  ',false));row.bytes.forEach((v,i)=>{const key=(row.address+i)&65535;nodes.push(cell(hex(v,2)+' ',previousMemory.has(key)&&previousMemory.get(key)!==v));previousMemory.set(key,v);});const map=n=>(spaces[n>>>24]||'unknown')+':'+hex(n&0xffffff,5);nodes.push(cell(' '+row.bytes.map(v=>v>=32&&v<127?String.fromCharCode(v):'.').join('')+'  read space '+map(row.read)+' write '+map(row.write)+'\n',false));}$('[data-bytes]').replaceChildren(...nodes);}
  else if(d.memory)$('[data-bytes]').textContent=d.memory;
  $('[data-step]').disabled=!d.paused;
 }};
}
