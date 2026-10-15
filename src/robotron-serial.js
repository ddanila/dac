import {printerPages} from './robotron-activities.js';
export function createSerialPanel(send){
 const panel=document.createElement('details');panel.dataset.robotron='';panel.id='serial-panel';
 panel.innerHTML=`<summary>V.24 terminal and file transfer</summary>
 <p>Adaptive virtual peer: framing follows the guest SIO settings. Uses the reference internal CTC clock route; external-clock wiring is not emulated. Start a serial program on the guest before sending.</p>
 <label><input id="serial-cts" type="checkbox"> Peer ready (CTS)</label>
 <label><input id="serial-dcd" type="checkbox"> Connection present (DCD)</label>
 <label><input id="serial-rts" type="checkbox"> Wait for guest RTS before sending</label>
 <p id="serial-status" role="status">Waiting for emulator.</p>
 <p id="serial-error" role="alert"></p>
 <pre id="serial-paper" aria-label="Received V.24 bytes"></pre>
 <label>Send text (byte characters)<textarea id="serial-text" rows="3"></textarea></label>
 <button id="serial-send">Send text</button>
 <label>Send raw file (up to 64 KiB)<input id="serial-file" type="file"></label>
 <button id="serial-export">Download received bytes</button> <button id="serial-clear">Clear received bytes</button>
 <p>Capture and pending input are each limited to 64 KiB. Reset clears both buffers. Export before resetting. Unknown text control bytes are shown as ⟦hex⟧.</p>`;
 document.getElementById('printer-panel').before(panel);
 const $=id=>panel.querySelector('#'+id);let supported=false,pending=false,lastSize=-1,busy=false;
 const fail=message=>{$('serial-error').textContent=message;};
 const preview=()=>{if(supported && !busy && panel.open && !document.hidden && !pending){pending=true;send({type:'serial-preview'});}};
 panel.ontoggle=preview;document.addEventListener('visibilitychange',()=>{if(!document.hidden)preview();});
 for(const name of ['cts','dcd','rts'])$('serial-'+name).onchange=()=>send({type:'serial-signals',value:Number($('serial-cts').checked)+2*Number($('serial-dcd').checked)+4*Number($('serial-rts').checked)});
 $('serial-send').onclick=()=>{
  fail('');
  const text=$('serial-text').value.replace(/\r?\n/g,'\r');
  if([...text].some(c=>c.codePointAt(0)>255)){fail('Use byte characters (U+0000–U+00FF), or send a raw file.');return;}
  send({type:'serial-send',bytes:Uint8Array.from(text,c=>c.charCodeAt(0)).buffer});
 };
 $('serial-file').onchange=async()=>{fail('');const file=$('serial-file').files[0];if(!file)return;
  if(file.size>65536){fail('Choose a file no larger than 64 KiB.');return;}
  send({type:'serial-send',bytes:await file.arrayBuffer()});$('serial-file').value='';};
 $('serial-export').onclick=()=>send({type:'serial-export'});$('serial-clear').onclick=()=>send({type:'serial-clear'});
 return {
  frame(data,on,replaying){supported=!!data.serialSupported;busy=replaying;
   for(const control of panel.querySelectorAll('input,button,textarea'))control.disabled=!supported||busy;
   $('serial-send').disabled=$('serial-file').disabled=!supported||busy||!on;
   $('serial-export').disabled=$('serial-clear').disabled=!supported||busy||!data.serialSize;
   for(const [name,bit] of [['cts',1],['dcd',2],['rts',4]])$('serial-'+name).checked=!!(data.serialStatus&bit);
   $('serial-status').textContent=supported?`${data.serialStatus>>>8} bytes queued · ${data.serialSize} received${data.serialOverflow?' · capture full':''}`:'This preserved core has no V.24 terminal support.';
   if(lastSize!==data.serialSize)preview();
  },
  message(data){if(data.type==='capture-reset' || data.type==='configured'){lastSize=-1;pending=false;}if(data.type==='replay'){pending=false;busy=data.active;}if(data.type==='serial-error'){pending=false;fail(data.message);return;}if(data.type!=='serial-preview')return;pending=false;lastSize=data.bytes.byteLength;
   $('serial-paper').textContent=printerPages(new Uint8Array(data.bytes)).join('\n── page feed ──\n');},
 };
}
