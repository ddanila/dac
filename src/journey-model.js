import {hex,registerNames,role,region,S600} from './keyboard-dive-model.js';
export {hex,registerNames,role,region,S600};
export const WORDS=96,HZ=3993600,MAX_EVENTS=131072;
export const clock=r=>r[0]+r[1]*4294967296;
export const row=(words,i)=>words.subarray(i*WORDS,(i+1)*WORDS);
export const spaces=['unknown','RAM','ROM','video memory','glyph memory','I/O'];
export const events={1:'Contact',2:'Keyboard instruction',3:'Matrix read',4:'Transmit strobe',5:'Receiver sample',6:'Received byte',7:'Mainboard keyboard input',9:'Video memory write',8:'Mainboard instruction',10:'Display cell',11:'Data / write edge',12:'Memory read',13:'Memory write',14:'I/O read',15:'I/O write',16:'Interrupt acknowledge bus cycle',20:'Interrupt source accepted',21:'RETI / priority release',22:'Glyph scanline emitted',24:'Peripheral state transition',25:'Capture begins',26:'First execution in mapped page',30:'Interrupt arbitration',40:'Fault applied',41:'Strobe suppressed'};
export const journeys={
 boot:{title:'Power-on to prompt',subtitle:'Reset → ROM → loader → RAM → operating system',scenarios:[['cold','Cold start'],['warm','Warm reset'],['missing','Missing boot media']],stages:[['Reset',r=>r[2]===25],['ROM',r=>r[2]===26&&(r[4]>>>24)===2],['Controller',r=>r[2]===15&&[0,0x1d,0x41].includes(r[3]&255)],['Transfer',r=>r[54]===1],['RAM code',r=>r[2]===26&&(r[4]>>>24)===1],['Display',r=>r[2]===10]]},
 disk:{title:'Inside a disk operation',subtitle:'Keyboard → OS → controller → mechanics → bytes → screen',scenarios:[['dir','DIR after OS disk reset'],['cached','Repeat DIR / compare reads'],['write','Copy and verify a file']],stages:[['Input',r=>r[2]===6],['Command',r=>r[2]===15&&[0x1d,0x41].includes(r[3]&255)],['Mechanics',r=>r[2]===24&&r[3]>=2&&r[3]<=5],['Transfer',r=>r[54]===1],['RAM / disk',r=>[12,13].includes(r[2])&&r[54]===1],['Result',r=>r[2]===14&&[0x1d,0x41].includes(r[3]&255)&&(r[57]&15)===1],['Display',r=>r[2]===10]]},
 video:{title:'A character becoming light',subtitle:'Video memory → fetch → glyph → attributes → pixel',scenarios:[['historical','Historical a → pixels'],['attributes','Diagnostic attributes and cursor'],['scanout','Diagnostic write during scanout']],stages:[['Write',r=>r[2]===13&&r[55]===3],['Cell',r=>r[2]===10],['Glyph',r=>r[2]===22],['Pixels',r=>r[2]===22&&(r[4]&255)!==0]]},
 interrupt:{title:'Inside an interrupt',subtitle:'Request → priority → acknowledge → stack → handler → RETI',scenarios:[['single','One CTC interrupt / DI and EI'],['priority','Two pending requests'],['nested','Nested service'],['historical','Historical software activity']],stages:[['Request',r=>r[2]===24&&r[3]===7&&r[4]&65535],['Arbitration',r=>r[2]===30&&r[3]],['Acknowledge',r=>r[2]===20],['Stack',r=>r[2]===13&&r[3]>=0xef00],['Handler',r=>r[2]===8&&[0x100,0x140].includes(r[3])],['Return',r=>r[2]===21]]},
 faults:{title:'A fault’s consequences',subtitle:'Same initial state → one intervention → first divergence → symptom',scenarios:[['stuck','Held A contact'],['strobe','Suppress one keyboard strobe'],['rom','Mutate S600 transmit-loop bit'],['missing','Missing boot media'],['crc','Sector CRC error'],['readonly','Write-protected destination'],['irq','Delayed interrupt request'],['glyph','Changed glyph bit']],stages:[['Intervention',r=>r[2]===40],['First effect',r=>r[2]===41||r[2]===30&&r[4]===1],['Controller',r=>r[2]===24],['Outcome',r=>r[2]===10||r[2]===22||r[2]===20]]}
};
export const irqName=id=>['none','DMA','CTC2 channel 0','CTC2 channel 1','CTC2 channel 2','CTC2 channel 3','SIO A receive','SIO A transmit','SIO B receive','SIO B transmit','SIO B external','SIO A external'][id]||`source ${id}`;
export function explain(r){const k=r[2],a=r[3],v=r[4],port=a&255;
 if(k===25)return 'Capture starts at the actual machine clock. A boot capture begins before any CPU clocks run; a live capture may begin mid-program.';
 if(k===26)return `First observed execution in this mapped page: logical ${hex(a)}h → ${spaces[v>>>24]||'unknown'} offset ${hex(v&0xffffff)}h. It is a first-visit overview, not every intervening instruction.`;
 if(k===8||k===2)return `${k===2?'Keyboard':'Mainboard'} instruction boundary at ${hex(a)}h. Registers precede this instruction; compare the next boundary for its effects.`;
 if(k===12||k===13)return `${r[54]?'DMA':'CPU'} ${k===12?'read':'wrote'} ${hex(v,2)}h ${k===12?'from':'to'} ${spaces[r[55]]} offset ${hex(r[56])}h through address ${hex(a)}h.${r[95]>1?' Overview groups '+r[95]+' equal consecutive writes.':''}`;
 if(k===14||k===15){const device=port===0?'Z80 DMA':port>=4&&port<=11?'CTC':port>=12&&port<=15?'SIO':port===0x18||port===0x19?'Display controller':port===0x1c||port===0x1d||port===0x40||port===0x41?'Floppy controller':port>=0x24&&port<=0x27?'Bank selection':port>=0x28&&port<=0x2b?'Drive motor control':'I/O';return `${device}: ${k===14?'read':'write'} ${hex(v,2)}h at port ${hex(port,2)}h.${r[95]>1?' '+r[95]+' identical accesses aggregated; registers/time belong to the first.':''}`;}
 if(k===20)return `${irqName(a)} won the implemented priority chain and supplied vector ${hex(v,2)}h. IM=${r[43]}, I=${hex(r[46],2)}h; for IM2 the vector-table address is ${hex((r[46]<<8)|v)}h. Follow the actual memory reads and stack writes.`;
 if(k===16)return `CPU interrupt-acknowledge bus cycle supplied ${hex(v,2)}h. The source-accepted event identifies the peripheral.`;
 if(k===21)return 'RETI was observed on the CPU bus. The highest-priority in-service device is released; the next state transition shows the resulting chain.';
 if(k===30)return `${irqName(a)} is the current eligible source. ${v?'The experiment suppresses CPU acceptance temporarily; the request remains pending.':'CPU acceptance still depends on IFF1, instruction timing and current service priority.'}`;
 if(k===22)return `Cell ${a&65535}: scanline ${(a>>>16)&255}, glyph offset ${hex(v>>>16)}h. Raw ${hex(v>>>8&255,2)}h → emitted ${hex(v&255,2)}h after attributes, cursor and blanking. These are actual sampled scanline bits; the expanded dot diagram is derived.`;
 if(k===24)return ['Memory bank changed','Floppy phase/search/command changed','Drive A STEP count changed','Drive B STEP count changed','Drive A INDEX count changed','Drive B INDEX count changed','DRQ / DMA RDY / ownership / IRQ / TC changed','Pending or in-service interrupts changed'][a]||'Peripheral transition';
 if(k===10)return `Display row ${Math.floor(a/80)+1}, column ${a%80+1} latched code ${hex(v,2)}h. Scanline events show when glyph pixels are emitted.`;
 if(k===6)return `Keyboard receiver completed ${hex(v,2)}h before OS interpretation.`;
 if(k===40)return `Explicit experiment intervention ${a}; target ${hex(v)}h, parameter ${r[56]}. Only the private branch is changed.`;
 if(k===41)return `Keyboard strobe ${v} was suppressed at the digital receiver handoff. Board-side activity still exists; this is not a simulated analog cable defect.`;
 return `${events[k]||'Hardware event'}: address ${hex(a)}h, value ${hex(v,2)}h.`;
}
export function validateCapture(d){
 if(d?.format!=='DAC-journeys-1'||d.wordsPerRecord!==WORDS||!Array.isArray(d.words)||d.words.length%WORDS||d.words.length>MAX_EVENTS*WORDS)throw Error('Invalid or oversized journey capture');
 if(!d.identity||!journeys[d.identity.journey]||!Number.isFinite(d.identity.clockHz)||d.identity.clockHz!==HZ)throw Error('Invalid journey identity');
 if(d.identity.firmware!==undefined&&(!Array.isArray(d.identity.firmware)||d.identity.firmware.length>8||d.identity.firmware.some(f=>!f||!Number.isInteger(f.slot)||typeof f.sha256!=='string'||!/^[a-f0-9]{64}$/.test(f.sha256))))throw Error('Invalid firmware identity');
 if(d.instructions!==undefined&&(!d.instructions||typeof d.instructions!=='object'||Array.isArray(d.instructions)||Object.values(d.instructions).some(v=>typeof v!=='string'||v.length>256)))throw Error('Invalid disassembly annotations');
 if(d.identity.symbols!==undefined&&(!d.identity.symbols||typeof d.identity.symbols!=='object'||Object.entries(d.identity.symbols).some(([k,v])=>k.length>256||!Number.isInteger(v)||v<0||v>65535)))throw Error('Invalid source labels');
 if(d.disk!==undefined&&(!Array.isArray(d.disk)||d.disk.length!==819200||d.disk.some(v=>!Number.isInteger(v)||v<0||v>255)))throw Error('Invalid reference disk bytes');
 const words=new Uint32Array(d.words.length);let previous=-1;
 for(let i=0;i<d.words.length;i++){const v=d.words[i];if(!Number.isInteger(v)||v<0||v>0xffffffff)throw Error('Invalid event word');words[i]=v;if(i%WORDS===1){const t=words[i-1]+v*4294967296;if(t<previous||!Number.isSafeInteger(t))throw Error('Invalid clock ordering');previous=t;}}
 for(let i=0;i<words.length;i+=WORDS)if(!events[words[i+2]])throw Error('Unknown event kind');
 return {...d,words};
}
export function firstDifference(a,b){
 
 // The explicit injection marker and fault metadata are excluded so the result
 // identifies an observed consequence, not merely the scheduled experiment.
 const indices=w=>{const out=[];for(let i=0;i<w.length;i+=WORDS)if(w[i+2]!==40)out.push(i);return out;},ai=indices(a),bi=indices(b);
 for(let i=0;i<Math.min(ai.length,bi.length);i++)for(const f of [0,1,2,3,4,12,31,32,33,54,55,56,57,59,61,64,65,94])if(a[ai[i]+f]!==b[bi[i]+f])return {baseline:ai[i]/WORDS,fault:bi[i]/WORDS,field:f,label:f<2?'Timing divergence':'First differing retained observation'};
 return ai.length!==bi.length?{baseline:(ai[Math.min(ai.length,bi.length)]??ai.at(-1)??0)/WORDS,fault:(bi[Math.min(ai.length,bi.length)]??bi.at(-1)??0)/WORDS,label:'Unequal retained tails'}:null;
}
