export const WORDS=54;
export const S600='4b54891c02a8ec279e2b8aec03489a961fc8647e08ad2036dcf82d0634bf7273';
export const registerNames=['PC','SP','AF','BC','DE','HL','IX','IY','AF′','BC′','DE′','HL′','IM','IFF1','IFF2','I','R'];
export const eventNames=['','Contact','Keyboard instruction','Matrix read','Transmit strobe','Receiver sample','Received byte','Mainboard input','Mainboard instruction','Video memory write','Display cell','Data / write edge'];
export const hex=(n,w=4)=>(n>>>0).toString(16).toUpperCase().padStart(w,'0');
export function time(row){return row[0]+row[1]*4294967296;}
export function rowAt(words,i){return words.subarray(i*WORDS,(i+1)*WORDS);}
export function character(v){if(v>=0xe0&&v<=0xef){const modes=['Ctrl','Shift','Caps','SI/SO'].filter((_,i)=>v&(1<<i));return 'modifier prefix: '+(modes.join(' + ')||'normal');}return v>=32&&v<127?`“${String.fromCharCode(v)}”`:({13:'carriage return',10:'line feed',0x9e:'ET key code',0xe0:'modifier prefix: normal',0xe1:'modifier prefix: Ctrl',0xe4:'modifier prefix: Caps',0xe8:'modifier prefix: SI/SO'}[v]||'control / encoded byte');}
const regions=[
 [0,0x12,'Initialize register storage','Clears both register banks and I, then disables interrupts. The controller has ROM, not ordinary writable RAM.'],
 [0x12,0x39,'Select and read a matrix column','L identifies the scan position. BC becomes an address mask; A15 enables matrix sensing. IN B,(C) replaces B with the sensed switch bits.'],
 [0x39,0x5b,'Update indicator latch','Builds address bits for the indicator latch and performs another input cycle. These address-selected outputs are separate from the sensed data.'],
 [0x5b,0x147,'Compare current and retained contacts','Compares new sensed bits with register-held scan history. EXX switches between the two BC/DE/HL banks.'],
 [0x147,0x15e,'Advance scan and countdown','Subtracts eight from the scan position and wraps to the next sweep; the alternate H register participates in the countdown.'],
 [0x15e,0x1af,'Build modifier prefix','Tests mode bits, constructs the E0-family prefix, and retains the accepted key identifier in I.'],
 [0x1af,0x1cf,'Transmit modifier prefix','A supplies D0. E counts eight payload bits; RRCA moves the next bit into bit 0. Two high strobes, a low start, eight data bits, and two high strobes form the observed sequence.'],
 [0x1cf,0x1f1,'Look up the key code','SP is repurposed as a ROM table base (4460h or 4560h). ADD HL,SP and LD E,(HL) fetch the translated key code. This is not a stack operation.'],
 [0x1f1,0x210,'Transmit key code','A holds the rotating key-code byte. E counts eight data bits. OUT (C),A produces a data value and a write-driven sampling strobe.'],
 [0x210,0x244,'Check repeat eligibility','I retains the key identifier. SP remains the table base; IX walks the eight-entry comparison list at base + F8h.'],
 [0x244,0x2f8,'Track contact changes','Bit tests and shifts select changed contacts and update state across the primary and alternate register banks.'],
 [0x2f8,0x460,'Handle mode contacts and repeat timing','Processes modifier/contact changes and repeat counters. I, both register banks, and interrupt flags retain state between scans.'],
 [0x460,0x560,'Key translation table','Data addressed through SP=4460h; displayed as bytes rather than inferred instructions.'],
 [0x560,0x660,'Alternate key translation table','Data addressed through SP=4560h; displayed as bytes rather than inferred instructions.'],
 [0x660,0x800,'ROM data / remaining bytes','Inspect the raw bytes. No routine meaning is assigned without an observed execution path.'],
];
export function region(pc,hash){return hash===S600?regions.find(([a,b])=>(pc&2047)>=a&&(pc&2047)<b):null;}
export function role(name,pc,hash){
 const generic={PC:'Next program-counter value; the selected instruction address is shown separately.',SP:'Stack pointer; firmware may use it as a general 16-bit value.',AF:'Accumulator A and condition flags F.',BC:'General register pair; also supplies the 16-bit port address for IN/OUT (C).',DE:'General register pair D and E.',HL:'General register pair; commonly addresses memory.',IX:'Index register used for indexed addressing.',IY:'Index register used for indexed addressing.',IM:'Interrupt mode.',IFF1:'Maskable-interrupt enable state.',IFF2:'Saved interrupt-enable state.',I:'Interrupt-vector register; firmware may repurpose it.',R:'Refresh counter; not a program progress counter.'};
 const p=pc&2047;if(hash===S600){
  if(name==='SP'&&p>=0x1ed&&p<0x244)return 'S600 ROM table base: 4460h or 4560h. No RAM stack is being accessed.';
  if(name==='AF'&&((p>=0x1b4&&p<0x1ce)||(p>=0x1f4&&p<0x20f)))return 'A is the serial shift value: A bit 0 drives each transmitted bit. RRCA rotates it; F carries branch conditions.';
  if(name==='DE'&&((p>=0x1c1&&p<=0x1c7)||(p>=0x202&&p<=0x208)))return 'E counts payload bits remaining, initialized to 8; DEC E controls the transmission loop.';
  if(name==='BC'&&p>=0x20&&p<=0x34)return 'BC selects matrix columns by address bits; bit 15 enables sensing. IN B,(C) then overwrites B with the sensed bits.';
  if(name==='IX'&&p>=0x22a&&p<=0x23b)return 'Pointer into the repeat-eligibility comparison list at table base + F8h.';
  if(name==='I'&&p>=0x185)return 'Retains a key identifier between scans; this is firmware state, not an interrupt-vector lookup here.';
 }
 return generic[name]||(name.endsWith('′')?'Alternate register bank, exchanged by EXX or EX AF,AF′. Its role depends on the executed path.':'CPU state');
}
export function explain(row,hash){const k=row[2],a=row[3],v=row[4];
 if(k===1)return `${v?'Closed':'Released'} contact at column ${Math.floor(a/8)}, bit ${a%8}. Firmware must scan this column before it can observe the change.`;
 if(k===2){const r=region(a,hash);return r?`${r[2]}. ${r[3]}`:'Keyboard CPU instruction boundary. Inspect the register state and ROM bytes.';}
 if(k===3)return `IN at port ${hex(a)}h sensed ${hex(v,2)}h. ${a&0x8000?'Selected columns: '+Array.from({length:13},(_,i)=>i).filter(i=>a&(1<<i)).join(', '):'Matrix sensing is disabled at this address; this read can update indicator latches.'}`;
 if(k===4)return `Write strobe sends D0=${v&1} to the receiver model. Data and strobe pass through separate 7406 gates and cable windings. The plot distinguishes normalized receiver data from inverted board-side data.`;
 if(k===5)return `Receiver advances from phase ${a>>8}, bit ${a&255}, with sampled level ${v}. Phase 0 waits for start, 1 validates start, 2 shifts data, 3 checks parity, 4 checks stop.`;
 if(k===6)return `Receiver completed ${hex(v,2)}h ${character(v)}. Frame error mask ${hex(a,2)}h (10 parity, 20 overrun, 40 framing). This is a received byte, before OS interpretation.`;
 if(k===7)return `Mainboard CPU read ${hex(v,2)}h ${character(v)} from SIO A data port ${hex(a)}h. Inspect mainboard instructions to follow software handling.`;
 if(k===8)return `Mainboard instruction at ${hex(a)}h, bank ${hex(row[12],2)}h. Its fetched bytes are retained with this event.`;
 if(k===9)return `Mainboard wrote ${hex(v,2)}h ${character(v)} to video memory offset ${hex(a)}h. Display scanout happens later.`;
 if(k===10)return `Display row ${Math.floor(a/80)+1}, column ${a%80+1} latched character code ${hex(v,2)}h ${character(v)}. The renderer samples the glyph and attributes during scanout.`;
 return 'Keyboard CPU D0 / write-control edge, including data-bus changes between strobes. Logic timing comes from the digital model; analog rise/fall shape is separate evidence.';
}
export function validateCapture(value){
 if(value?.format!=='DAC-keyboard-dive-1'||value.wordsPerRecord!==WORDS||!Array.isArray(value.words)||value.words.length%WORDS||value.words.length>262144*WORDS)throw Error('Invalid or oversized keyboard capture');
 if(!/^[a-f0-9]{64}$/.test(value.identity?.romSha256)||value.identity.clockHz!==3993600||!Array.isArray(value.identity.rom)||value.identity.rom.length!==2048||!value.identity.rom.every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Missing capture identity');
 if(!value.words.every(v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff))throw Error('Invalid capture words');
 const words=Uint32Array.from(value.words);let previous=-1;
 for(let i=0;i<words.length/WORDS;i++){const r=rowAt(words,i),t=time(r);if(t<previous||r[2]<1||r[2]>11)throw Error('Invalid event ordering or type');previous=t;}
 return {...value,words};
}

// Exact instruction windows observed in the pinned TOS/M reference journey.
// Both software identity and captured bytes must match before showing a role.
export function mainboardAnnotation(row,identity){
 if(identity.diskSha256!=='f724763d5e48c0f15341e95d7b85f645533dd7dfa270cbce4e44d3025e62b23b'||!identity.firmware?.some(f=>f.slot===0&&f.sha256==='37e58472a049e1785c3521ec6b23c2d269d93fa5fede696dc7bd72eabb4af031'))return null;
 const key=`${row[7]}:${row[49]}:${row[12]}`;
 return {
  [`${0xadf2}:${0xe0fe0cdb}:${0x11}`]:'TOS/M keyboard input: IN A,(0Ch) reads the modifier prefix from SIO A; the following CP E0h begins classification.',
  [`${0xadfe}:${0x06570cdb}:${0x11}`]:'TOS/M keyboard input: IN A,(0Ch) reads the key-code byte; LD D,A retains it while modifier handling continues.',
  [`${0xabf5}:${0x2a13eb77}:0`]:'TOS/M console output: LD (HL),A writes the printable character to the mapped video-memory cell. In the A-key journey, A=61h and HL=3142h maps to video offset 0142h.',
 }[key]||null;
}
