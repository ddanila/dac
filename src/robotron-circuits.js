// Functional relationships read from W/M drawings, not inferred PCB traces.
export const circuits = [
 {ref:'A1',name:'CPU · UA880',sheet:'C',role:'Executes the operating system and addresses memory and peripherals.',signal:'The CPU and A2 DMA share address/data buses. BUSRQ/BUSAK coordinate bus ownership; these are documented signals, not reconstructed PCB copper.'},
 {ref:'A2',name:'DMA · UA858',sheet:'C',role:'Moves bytes between memory and devices without a CPU instruction per byte.',signal:'RDYDMA enters A2 RDY. Source selection includes FDDRQ through the S3 network. The reference route is modeled; specimen strap positions remain unidentified.'},
 {ref:'A44',name:'Floppy controller · U8272',sheet:'A',role:'Executes disk commands and supplies drive/head/sector operations.',signal:'A44 DRQ feeds FDDRQ; DACK and TC participate in DMA transfers. Drive lines leave through X6/X8 interface circuitry. Artwork and photographed cables are not an electrical netlist.'},
 {ref:'A3',name:'Serial controller · UA8560',sheet:'D',role:'Channel A receives keyboard data; channel B serves V.24.',signal:'RXDB/TXDB, CTSB/DCDB and RTSB/DTRB pass through serial interface circuitry. The terminal exposes CTS/DCD and optional RTS flow control; external-clock and synchronous modes remain outside its model.'},
 {ref:'A4',name:'System timer · UA857',sheet:'C',role:'Provides system CTC timer/counter channels and vectored interrupts.',signal:'The drawing shows ZC/TO1 feeding CLK/TRG2. The independent comparison exercises an IM2 timer interrupt; it does not certify every timing edge.'},
 {ref:'A5',name:'Serial clock · UA857',sheet:'D',role:'Provides programmable serial clock pulses.',signal:'ZC/TO0 supplies the channel-A clock route. ZC/TO1 reaches channel-B clocking through buffering and S1. DAC uses the internal reference route; the physical S1 setting remains unidentified.'},
];
export function createCircuitPanel(show) {
 const panel=document.createElement('details');panel.id='circuit-panel';panel.dataset.robotron='';
 const summary=document.createElement('summary');summary.textContent='Explore the circuits';panel.append(summary);
 const note=document.createElement('p');note.textContent='Choose a component for its role, documented signals and exact drawing file. These describe the W/M design; specimen correspondence and hidden routing remain provisional.';panel.append(note);
 for(const c of circuits){const button=document.createElement('button');button.textContent=`${c.ref} · ${c.name}`;button.dataset.circuit=c.ref;button.onclick=()=>show(c);panel.append(button);}
 document.getElementById('electrical-panel').before(panel);
}
