// SPDX-License-Identifier: MIT
import {SHA256} from './sha256.js';
const hash=b=>new SHA256().update(b).digest();
export function validateSource(map,binary,sourceText){
 if(map?.schema!==1||map.kind!=='pico1715-source-map'||!['rom','ram'].includes(map.space))throw Error('Unsupported source map');
 if(!(binary instanceof Uint8Array)||binary.length!==map.binary_size||hash(binary)!==map.binary_sha256)throw Error('Source binary identity mismatch');
 if(!Number.isInteger(map.base)||map.base<0||map.base+binary.length>65536||!binary.length)throw Error('Invalid source mapping');
 if(!map.source||typeof map.source.name!=='string'||!/^[0-9a-f]{64}$/.test(map.source.sha256||'')||!Array.isArray(map.entries)||map.entries.length>65536||!Array.isArray(map.symbols)||map.symbols.length>65536)throw Error('Invalid source locations');
 const text=sourceText??map.source.text;
 if(text!==undefined&&(typeof text!=='string'||text.length>4*1048576||hash(new TextEncoder().encode(text))!==map.source.sha256))throw Error('Source text identity mismatch');
 const lines=text?.split(/\r?\n/),addresses=new Set();
 for(const e of map.entries){if(!Number.isInteger(e.address)||!Number.isInteger(e.length)||e.length<1||e.length>16||e.address<map.base||e.address+e.length>map.base+binary.length||!Number.isInteger(e.line)||e.line<1||e.line>1000000||(lines&&e.line>lines.length)||typeof e.code!=='boolean'||addresses.has(e.address))throw Error('Invalid or duplicate source location');addresses.add(e.address);}
 let end=map.base;for(const e of [...map.entries].sort((a,b)=>a.address-b.address)){if(e.address<end)throw Error('Overlapping source locations');end=e.address+e.length;}
 for(const s of map.symbols)if(typeof s.name!=='string'||s.name.length>128||!Number.isInteger(s.address)||s.address<map.base||s.address>=map.base+binary.length)throw Error('Invalid source symbol');
 return {map,binary,lines};
}
export async function sourceContext(capture,index,validated,{check=()=>{},limit=2000000}={}){
 if(capture.header.type!=='compact')return {outcome:'unavailable',reason:'Source interpretation requires compact bus events.'};
 if(!Number.isInteger(index)||index<0||index>=capture.header.count)throw Error('Invalid source record');
 if(index>=limit)return {outcome:'unavailable',reason:'Source scan limit reached; select an earlier capture window.'};
 let mapping='unknown',selected;const following=[];
 const complete=(capture.header.capture_mask&0x128)===0x128&&!capture.header.dropped;
 for await(const r of capture.records(0,Math.min(capture.header.count,index+16),check)){
  if(r.index===index){selected=r;following.push(r);continue;}
  if(r.index>index){following.push(r);continue;}
  if(r.flags){mapping='unknown';continue;}
  if(r.kind===8)mapping='rom';
  if(r.kind===5&&(r.address&0xfc)===0x28)mapping='ram';
 }
 if(!selected||selected.kind!==1)return {outcome:'not applicable',reason:'Selected event is not an opcode fetch; IACK and data accesses are not instructions.'};
 const {map,binary,lines}=validated,address=selected.address,entry=map.entries.find(e=>e.address===address),offset=address-map.base;
 if(!entry||!entry.code)return {outcome:'unavailable',reason:'No instruction source location at this address.'};
 const space=address>=2048?'ram':complete?mapping:'unknown';
 if(space!=='unknown'&&space!==map.space)return {outcome:'unavailable',reason:'Observed memory mapping differs from the source image address space.'};
 const observed=[selected.data];let next=address+1,uncertain=!!selected.flags;
 for(const r of following.slice(1)){
  if(observed.length>=entry.length)break;
  if(r.kind===7)continue;
  if(![1,2].includes(r.kind)||r.address!==next||r.flags){uncertain=true;break;}
  observed.push(r.data);next++;
 }
 const expected=[...binary.slice(offset,offset+entry.length)],matches=observed.every((b,i)=>b===expected[i]);
 const symbol=map.symbols.filter(s=>s.address<=address).sort((a,b)=>b.address-a.address)[0];
 return {outcome:!matches?'differs':uncertain||observed.length!==entry.length||space==='unknown'?'uncertain':'candidate',
  reason:!matches?'Observed bytes differ: another image or modified code may occupy this address.':'Source-image interpretation, not proof of full image residency or instruction completion.',
  record:index,address,space,source:map.source.name,line:entry.line,text:lines?.[entry.line-1],symbol:symbol?{name:symbol.name,offset:address-symbol.address}:null,observed,expected,
  binary_sha256:map.binary_sha256,source_sha256:map.source.sha256};
}
