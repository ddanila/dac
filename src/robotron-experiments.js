export function createElectricalPanel(send) {
 const panel=document.createElement('details');panel.id='electrical-panel';panel.dataset.robotron='';
 panel.innerHTML=`<summary>Electrical experiments</summary>
 <p>These controls change the running machine. Ordinary case separation and cable inspection remain visual.</p>
 <label><input id="electrical-enable" type="checkbox" disabled> Enable electrical experiments</label>
 <label><input id="electrical-keyboard" type="checkbox" checked disabled> Keyboard connected (power and data)</label>
 <label><input id="electrical-monitor" type="checkbox" checked disabled> Monitor video connected</label>
 <p id="electrical-status" role="status">Connections intact.</p>
 <p>Unplugging the keyboard stops its controller; reconnecting cold-starts its firmware. Removing monitor video blanks the picture while the computer keeps running. This models functional connections, not analogue voltages. Disabling experiments reconnects both.</p>`;
 document.getElementById('serial-panel').before(panel);
 const enable=panel.querySelector('#electrical-enable'),keyboard=panel.querySelector('#electrical-keyboard'),monitor=panel.querySelector('#electrical-monitor'),status=panel.querySelector('#electrical-status');
 let supported=false,busy=false,pending=null;
 function request(value){pending=value;send({type:"cables",value});}
 function controls(){enable.disabled=!supported||busy;keyboard.disabled=monitor.disabled=!supported||busy||!enable.checked;}
 enable.onchange=()=>{if(!enable.checked)request(0);controls();};
 keyboard.onchange=monitor.onchange=()=>request((keyboard.checked?0:1)|(monitor.checked?0:2));
 return {frame(data,replaying){supported=!!data.serialSupported;busy=replaying;
  const mask=data.cables||0;
  if(!supported||busy||mask===pending)pending=null;
  // Render the requested controls until the worker echoes them. In-flight frames
  // may still describe the old connection state after a user clicks.
  const shown=pending??mask;
  if(shown && pending===null){enable.checked=true;panel.open=true;}
  keyboard.checked=!(shown&1);monitor.checked=!(shown&2);controls();
  status.textContent=!supported?'This preserved core does not support electrical experiments.':mask?`Experiment active: ${[mask&1?'keyboard disconnected':'',mask&2?'monitor video disconnected':''].filter(Boolean).join('; ')}.`:'Connections intact.';
  document.getElementById('viewport').dataset.electrical=String(mask);
 }};
}
