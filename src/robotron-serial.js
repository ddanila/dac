import {transferDisk} from './guest-transfer-disk.js';
import {xmodemSender,xmodemReceiver} from './xmodem.js';
import {printerPages} from './robotron-activities.js';
export function createSerialPanel(send){
 const panel=document.createElement('details');panel.dataset.robotron='';panel.id='serial-panel';
 panel.innerHTML=`<summary>V.24 terminal and file transfer</summary>
 <p>Incoming peer defaults to following guest framing. Fixed settings allow mismatched baud, parity and framing experiments. The terminal shows raw guest TX bytes. Download the independently decoded peer bytes to compare framing; fixed peer settings apply in both directions. Uses the reference internal CTC clock route; external-clock wiring is not emulated. Start a serial program on the guest before sending.</p>
 <label>Incoming baud<select id="serial-baud"><option value="0">Follow guest</option>${[300,600,1200,2400,4800,9600,19200,38400].map(n=>`<option>${n}</option>`).join('')}</select></label>
 <label>Data bits<select id="serial-width">${[8,7,6,5].map(n=>`<option>${n}</option>`).join('')}</select></label>
 <label>Parity<select id="serial-parity"><option value="0">None</option><option value="1">Odd</option><option value="2">Even</option></select></label>
 <label>Stop bits<select id="serial-stops"><option value="2">1</option><option value="3">1.5</option><option value="4">2</option></select></label>
 <button id="serial-apply">Apply incoming framing</button>
 <label><input id="serial-cts" type="checkbox"> Peer ready (CTS)</label>
 <label><input id="serial-dcd" type="checkbox"> Connection present (DCD)</label>
 <label><input id="serial-rts" type="checkbox"> Wait for guest RTS before sending</label>
 <p id="serial-status" role="status">Waiting for emulator.</p>
 <p id="serial-error" role="alert"></p>
 <label><input type="checkbox" id="serial-hex"> Hex and ASCII view</label>
 <pre id="serial-paper" aria-label="Received V.24 bytes"></pre>
 <label>Send text (byte characters)<textarea id="serial-text" rows="3"></textarea></label>
 <button id="serial-send">Send text</button>
 <label>Send raw file (up to 64 KiB)<input id="serial-file" type="file"></label>
 <p><a href="examples/robotron-v24/DACRX.COM" download>Download DACRX.COM</a> · <a href="examples/robotron-v24/README.txt" target="_blank">Guest transfer instructions</a></p>
 <button id="serial-guest-disk">Download TOS/M copy with DACRX and DACTX</button>
 <label>Send XMODEM-128/checksum file<input id="serial-xmodem" type="file"></label><progress id="serial-progress" max="1" value="0"></progress><p id="serial-transfer-status" role="status"></p>
 <button id="serial-receive">Receive XMODEM file from guest</button><a href="examples/robotron-v24/DACTX.COM" download>Download DACTX.COM</a><button id="serial-cancel">Cancel queued input</button>
 <button id="serial-decoded">Download decoded peer bytes</button><button id="serial-export">Download received bytes</button> <button id="serial-clear">Clear received bytes</button>
 <p>Capture and pending input are each limited to 64 KiB. Reset clears both buffers. Export before resetting. Unknown text control bytes are shown as ⟦hex⟧.</p>`;
 document.getElementById('printer-panel').before(panel);
 const $=id=>panel.querySelector('#'+id);let supported=false,pending=false,lastSize=-1,busy=false,received=new Uint8Array(),transfer=null,transferSeen=0,lastPeer='',requestedSignals=null,transferTime=0,lastFrameTime=null;
 const render=()=>{$('serial-paper').textContent=$('serial-hex').checked?Array.from({length:Math.ceil(received.length/16)},(_,i)=>{const b=received.slice(i*16,i*16+16);return (i*16).toString(16).padStart(4,'0')+'  '+[...b].map(v=>v.toString(16).padStart(2,'0')).join(' ').padEnd(47)+'  '+[...b].map(v=>v>=32&&v<127?String.fromCharCode(v):'.').join('');}).join('\n'):printerPages(received).join('\n── page feed ──\n');};
 $('serial-hex').onchange=render;
 $('serial-guest-disk').onclick=async()=>{try{const load=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Guest example download failed.');return new Uint8Array(await r.arrayBuffer());};const [disk,com,tx]=await Promise.all([load('media/robotron/tosm10.img'),load('examples/robotron-v24/DACRX.COM'),load('examples/robotron-v24/DACTX.COM')]);const url=URL.createObjectURL(new Blob([transferDisk(transferDisk(disk,com),tx,'DACTX   COM')]));const a=document.createElement('a');a.href=url;a.download='tosm-transfer.img';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){fail(e.message);}};

 $('serial-cancel').onclick=()=>{send({type:'serial-cancel'});transfer?.cancel();};
 $('serial-xmodem').onchange=async()=>{const file=$('serial-xmodem').files[0];$('serial-xmodem').value='';if(!file)return;if(file.size>65536){fail('Choose at most 64 KiB.');return;}
  transferSeen=lastSize<0?0:lastSize;
  transfer=xmodemSender(new Uint8Array(await file.arrayBuffer()),bytes=>send({type:'serial-send',bytes:bytes.buffer}),state=>{$('serial-transfer-status').textContent=state.message;$('serial-progress').max=Math.max(1,state.total);$('serial-progress').value=state.offset;},()=>transferTime);preview();
 };
 $('serial-receive').onclick=()=>{
  transferSeen=lastSize<0?0:lastSize;
  transfer=xmodemReceiver(bytes=>send({type:'serial-send',bytes:bytes.buffer}),state=>{$('serial-transfer-status').textContent=state.message;$('serial-progress').max=state.total;$('serial-progress').value=state.offset;},bytes=>{const url=URL.createObjectURL(new Blob([bytes])),a=document.createElement('a');a.href=url;a.download='robotron-received.bin';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);},()=>transferTime);preview();
 };
 $('serial-apply').onclick=()=>send({type:'serial-peer',baud:Number($('serial-baud').value),format:Number($('serial-width').value)|(Number($('serial-parity').value)<<4)|(Number($('serial-stops').value)<<8)});
 const fail=message=>{$('serial-error').textContent=message;};
 const preview=()=>{if(supported && !busy && (panel.open || (transfer&&(!transfer.done||transfer.needsReplies))) && !document.hidden && !pending){pending=true;send({type:'serial-preview'});}};
 panel.ontoggle=preview;document.addEventListener('visibilitychange',()=>{if(!document.hidden)preview();});
 for(const name of ['cts','dcd','rts'])$('serial-'+name).onchange=()=>{requestedSignals=Number($('serial-cts').checked)+2*Number($('serial-dcd').checked)+4*Number($('serial-rts').checked);send({type:'serial-signals',value:requestedSignals});};
 $('serial-send').onclick=()=>{
  fail('');
  const text=$('serial-text').value.replace(/\r?\n/g,'\r');
  if([...text].some(c=>c.codePointAt(0)>255)){fail('Use byte characters (U+0000–U+00FF), or send a raw file.');return;}
  send({type:'serial-send',bytes:Uint8Array.from(text,c=>c.charCodeAt(0)).buffer});
 };
 $('serial-file').onchange=async()=>{fail('');const file=$('serial-file').files[0];if(!file)return;
  if(file.size>65536){fail('Choose a file no larger than 64 KiB.');return;}
  send({type:'serial-send',bytes:await file.arrayBuffer()});$('serial-file').value='';};
 $('serial-decoded').onclick=()=>send({type:'serial-decoded'});
 $('serial-export').onclick=()=>send({type:'serial-export'});$('serial-clear').onclick=()=>send({type:'serial-clear'});
 return {
  frame(data,on,replaying){const time=data.circuitTelemetry?.[0];if(time!==undefined&&lastFrameTime!==null&&on&&!replaying)transferTime+=((time-lastFrameTime)>>>0)/3993.6;lastFrameTime=time??null;supported=!!data.serialSupported;busy=replaying;
   for(const control of panel.querySelectorAll('input,button,textarea,select'))control.disabled=!supported||busy;
   const peer=data.serialPeerBaud+':'+data.serialPeerFormat;
   if(peer!==lastPeer){lastPeer=peer;const baud=String(data.serialPeerBaud||0);if(![...$('serial-baud').options].some(o=>o.value===baud))$('serial-baud').add(new Option(baud,baud));$('serial-baud').value=baud;const format=data.serialPeerFormat||0x208;$('serial-width').value=String(format&15);$('serial-parity').value=String((format>>4)&3);$('serial-stops').value=String((format>>8)&7);}
   const transferring=transfer&&!transfer.done;
   $('serial-receive').disabled=$('serial-send').disabled=$('serial-file').disabled=$('serial-xmodem').disabled=!supported||busy||!on||transferring;
   if(transfer?.needsReplies)preview();
   if(transferring){if(!on||busy)transfer.cancel('Machine stopped or replay started; transfer cancelled.');else {transfer.tick();preview();}}
   if(!data.serialPeerSupported)$('serial-xmodem').disabled=true;
   $('serial-export').disabled=$('serial-clear').disabled=!supported||busy||!data.serialSize;
   if(busy||!supported||(data.serialStatus&7)===requestedSignals)requestedSignals=null;
   for(const [name,bit] of [['cts',1],['dcd',2],['rts',4]])$('serial-'+name).checked=!!((requestedSignals??data.serialStatus)&bit);
   $('serial-apply').disabled=$('serial-cancel').disabled=!data.serialPeerSupported||busy;
   if(transferring)$('serial-apply').disabled=$('serial-clear').disabled=true;
   $('serial-status').textContent=supported?`${data.serialStatus>>>8} bytes queued · ${data.serialSize} received${data.serialOverflow?' · capture full':''} · RX errors: ${['parity','overrun','framing'].filter((_,i)=>data.serialErrors&(16<<i)).join(', ')||'none'} · peer ${data.serialPeerBaud||'adaptive'} · decoded ${data.serialDecodedSize||0} bytes${data.serialDecodedErrors?' (peer errors '+data.serialDecodedErrors.toString(16)+')':''}`:'This preserved core has no V.24 terminal support.';
   if(lastSize!==data.serialSize)preview();
  },
  message(data){if(data.type==='capture-reset' || data.type==='configured'){transfer?.cancel('Machine or capture reset; transfer cancelled.');lastFrameTime=null;lastSize=-1;pending=false;}if(data.type==='replay'){pending=false;busy=data.active;}if(data.type==='serial-error'){pending=false;fail(data.message);return;}if(data.type!=='serial-preview')return;pending=false;lastSize=data.bytes.byteLength;
   received=new Uint8Array(data.bytes);if(transfer){if(received.length<transferSeen)transfer.cancel('Capture was reset; transfer cancelled.');else transfer.feed(received.subarray(transferSeen));transferSeen=received.length;}render();},
 };
}
