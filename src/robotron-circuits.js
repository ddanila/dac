// Functional relationships read from W/M drawings, not inferred PCB traces.
export const circuits = [
 {ref:'A1',name:'CPU · UA880',sheet:'C',role:'Executes the operating system and addresses memory and peripherals.',signal:'The CPU and A2 DMA share address/data buses. BUSRQ/BUSAK coordinate bus ownership; these are documented signals, not reconstructed PCB copper.'},
 {ref:'A2',name:'DMA · UA858',sheet:'C',role:'Moves bytes between memory and devices without a CPU instruction per byte.',signal:'RDYDMA enters A2 RDY. Source selection includes FDDRQ through the S3 network. The reference route is modeled; specimen strap positions remain unidentified.'},
 {ref:'A44',name:'Floppy controller · U8272',sheet:'A',role:'Executes disk commands and supplies drive/head/sector operations.',signal:'A44 DRQ feeds FDDRQ; DACK and TC participate in DMA transfers. Drive lines leave through X6/X8 interface circuitry. Artwork and photographed cables are not an electrical netlist.'},
 {ref:'A3',name:'Serial controller · UA8560',sheet:'D',role:'Channel A receives keyboard data; channel B serves V.24.',signal:'RXDB/TXDB, CTSB/DCDB and RTSB/DTRB pass through serial interface circuitry. The terminal exposes CTS/DCD and optional RTS flow control; external-clock and synchronous modes remain outside its model.'},
 {ref:'A4',name:'System timer · UA857',sheet:'C',role:'Provides system CTC timer/counter channels and vectored interrupts.',signal:'The drawing shows ZC/TO1 feeding CLK/TRG2. The independent comparison exercises an IM2 timer interrupt; it does not certify every timing edge.'},
 {ref:'A5',name:'Serial clock · UA857',sheet:'D',role:'Provides programmable serial clock pulses.',signal:'ZC/TO0 supplies the channel-A clock route. ZC/TO1 reaches channel-B clocking through buffering and S1. DAC uses the internal reference route; the physical S1 setting remains unidentified.'},
];
export const relatedCircuits={A1:['A2','A3','A4','A44'],A2:['A1','A44'],A44:['A2'],A3:['A5','A1'],A4:['A1'],A5:['A3']};
export function createCircuitPanel(show,send,markTrack) {
 const panel=document.createElement('details');panel.id='circuit-panel';panel.dataset.robotron='';
 const summary=document.createElement('summary');summary.textContent='Explore the circuits';panel.append(summary);
 const note=document.createElement('p');note.textContent='Choose a component for its role, documented signals and exact drawing file. These describe the W/M design; specimen correspondence and hidden routing remain provisional.';panel.append(note);
 for(const c of circuits){const button=document.createElement('button');button.textContent=`${c.ref} · ${c.name}`;button.dataset.circuit=c.ref;button.onclick=()=>show(c,relatedCircuits[c.ref]);panel.append(button);}
 const clear=document.createElement('button');clear.textContent='Clear chip highlights';clear.onclick=()=>show(null);panel.append(clear);
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.id='circuit-activity';label.append(check,' Show sampled emulator activity');panel.append(label);
 const activity=document.createElement('p');activity.id='circuit-activity-status';activity.setAttribute('role','status');panel.append(activity);
 const legend=document.createElement('p');legend.textContent='Cyan: selected chip. Amber: related components. Activity is sampled emulator telemetry, not physical LEDs or a pin-level logic analyser.';panel.append(legend);
 document.getElementById('electrical-panel').before(panel);
 const start=document.createElement('button'),refresh=document.createElement('button'),download=document.createElement('button'),list=document.createElement('ol'),explanation=document.createElement('p');
 start.textContent='Capture next 512 bus events';refresh.textContent='Show captured events';download.textContent='Download event timeline';
 explanation.textContent='Opt-in capture of I/O, interrupt acknowledgements and DMA memory accesses. Stops at 512 events. Disk coordinates are controller context at the event, not proof that every event accessed that sector.';
 list.style.maxHeight='24rem';list.style.overflow='auto';panel.append(explanation,start,refresh,download,list);let rows=[];
 start.onclick=()=>{rows=[];list.replaceChildren();send({type:'timeline-capture',enabled:true});};refresh.onclick=()=>send({type:'timeline-preview'});
 download.onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({format:'DAC-bus-timeline-1',rows},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='robotron-bus-timeline.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 let previous=[];
 return {message(data){if(data.type!=='timeline')return;rows=timelineRows(data.bytes);list.replaceChildren();for(const row of rows){const item=document.createElement('li'),button=document.createElement('button');button.textContent=`${row.cycle}: ${row.master} ${row.kind} ${row.address.toString(16).padStart(4,'0')} = ${row.value.toString(16).padStart(2,'0')}${row.space===1?' · RAM '+row.offset.toString(16):''}`;button.onclick=()=>{const port=row.address&255,ref=row.master==='DMA'?'A2':row.kind==='IA'?'A1':[0x1c,0x1d].includes(port)?'A44':[0x0c,0x0d,0x0e,0x0f].includes(port)?'A3':'A1';show(circuits.find(c=>c.ref===ref),relatedCircuits[ref]);};item.append(button);if(row.master==='DMA'&&row.phase===2){const disk=document.createElement('button');disk.textContent=`Disk ${row.unit?'B':'A'} C${row.cylinder} H${row.head} R${row.sector}`;disk.onclick=()=>markTrack?.(row);item.append(disk);}list.append(item);}},frame(data){const values=data.circuitTelemetry;
   activity.hidden=!check.checked;if(!check.checked)return;
   activity.textContent=values?['CPU clocks','DMA transfer count','Serial frames','FDC byte position'].map((name,i)=>`${name}: ${values[i]}${previous[i]!==undefined&&previous[i]!==values[i]?' ●':''}`).join(' · '):'Activity telemetry unavailable in this preserved core.';
   previous=values||[];
 }};
}

export function timelineRows(bytes){const values=new Uint32Array(bytes),rows=[];for(let i=0;i+12<values.length;i+=13)rows.push({cycle:values[i]+values[i+1]*4294967296,kind:['MR','MW','IR','IW','IA'][values[i+2]],address:values[i+3],value:values[i+4],master:values[i+5]?'DMA':'CPU',space:values[i+6],offset:values[i+7],unit:values[i+8],cylinder:values[i+9],head:values[i+10],sector:values[i+11],phase:values[i+12]});return rows;}
