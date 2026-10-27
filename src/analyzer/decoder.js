// SPDX-License-Identifier: MIT
export const hex=(n,w=2)=>n.toString(16).padStart(w,'0');
export function crc16(bytes){let c=65535;for(const b of bytes){c^=b<<8;for(let i=0;i<8;i++)c=((c<<1)^((c&32768)?0x1021:0))&65535;}return c;}
export class Decoder {
 constructor(state){this.clear();if(state)Object.assign(this,structuredClone(state));}
 clear(){this.control=this.select=this.format=this.pending=this.status=this.size=null;this.vectors={};this.buffers={read:[],write:[]};}
 snapshot(){return structuredClone({...this});}
 field(direction,value){const b=this.buffers[direction];b.push(value);
  if(b.length<=3){if(value!==161)b.length=0;return [];}
  if(b.length===4&&![254,251].includes(value)){b.splice(0,b.length,...(value===161?[161,161,161]:[]));return [];}
  const mark=b[3];if(mark===251&&this.size===null){b.length=0;return ['data field: length unknown (no complete preceding ID)'];}
  if(b.length!==(mark===254?10:6+this.size))return [];
  const good=crc16(b.slice(0,-2))===(b.at(-2)<<8|b.at(-1));let result;
  if(mark===254){const [c,h,r,n]=b.slice(4,8);this.size=good&&n<=3?128<<n:null;result=`ID C=${c} H=${h} R=${r} N=${n}; CRC ${good?'ok':'BAD'}`;}
  else result=`${direction} data field ${this.size} bytes; CRC ${good?'ok':'BAD'}`;
  b.length=0;return [result];
 }
 feed(r){const p=r.address&255,d=r.data;
  if(r.kind===8){this.clear();return ['observed bus reset; inference state cleared (CPU reset not established)'];}
  if(r.flags||r.kind===9){this.clear();return ['uncertain cycle; inference state cleared'];}
  if(r.kind===6){const names=Object.keys(this.vectors).filter(n=>this.vectors[n]===d);return [`interrupt acknowledge vector=${hex(d)}${names.length?' ('+names.join('/')+')':''}`];}
  if(![4,5].includes(r.kind))return [];
  if(r.kind===4){
   if(p===2)return ['RX byte',...this.field('read',d)];
   if(p===4){this.control=d;return [`control readback=${hex(d)}`];}
   if(p===6){const changed=this.status===null||this.status!==d;this.status=d;return [`${changed?'status changed: ':'status: '}ready=${+!(d&1)} mark=${+!!(d&2)} writable=${+!!(d&32)} track_zero=${+!(d&128)} format=${hex(d&28)} /FW=${+!!(d&64)}`];}
   return [`I/O read port=${hex(p)} (outside modeled controller subset)`];
  }
  if(p>=32&&p<=35){if(this.select!==d){this.size=null;this.buffers={read:[],write:[]};}this.select=d;return [`drive latch=${hex(d)}; selected=${+!(d&16)} (media presence unknown)`];}
  if(p===6){this.format=d;return [`format=${hex(d)}; MFM250=${+((d&20)===4)}`];}
  if(p===5||p===7){const name=p===5?'index':'mark';
   if(p===7&&this.pending){const pending=this.pending;this.pending=null;return [`mark PIO ${pending}=${hex(d)}`];}
   if(p===7&&d===207){this.pending='direction';return ['mark PIO bit-control mode; direction word follows'];}
   if(!(d&1)){this.vectors[name]=d;return [`${name} vector=${hex(d)}`];}
   if([3,7].includes(d&15)){if(p===7&&(d&15)===7&&(d&16))this.pending='interrupt mask';return [`${name} IRQ enabled=${+!!(d&128)}${p===7&&this.pending?'; mask word follows':''}`];}
   return [`${name} PIO setup=${hex(d)} (unmodeled word)`];
  }
  if(p===4){const old=this.control;this.control=d;const out=[`control=${hex(d)}; head=${+!(d&4)} /WE=${d&1}`];
   if(old!==null){
    if((old&1)&&!(d&1)){this.buffers.write=[];out.push('write gate opened');}
    if(!(old&1)&&(d&1)){out.push('write gate closed (persistence not observable)');if(this.buffers.write.length>=4)out.push('incomplete observed write field');this.buffers.write=[];}
    if((old&128)&&!(d&128)){out.push(`step ${d&32?'inward':'outward'}; ${this.select!==null&&!(this.select&16)?'selected':'selection unknown/inactive'}`);this.size=null;}
    if((d&57)===1&&!(d&2)&&old!==d){this.buffers.read=[];out.push('mark acquisition requested');}
   }return out;
  }
  if(p===0){if(this.control===null)return ['TX byte; write gate unknown'];if(this.control&1)return ['TX register loaded while write gate closed (ignored by model)'];return ['TX byte',...this.field('write',d)];}
  return [`I/O write port=${hex(p)} (outside modeled controller subset)`];
 }
}
