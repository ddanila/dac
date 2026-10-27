import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SHA256} from '../../src/analyzer/sha256.js';
import {validateSource,sourceContext} from '../../src/analyzer/source.js';
const bytes=new Uint8Array([0x3e,0x41]),text='ld a,65\n',hash=b=>new SHA256().update(b).digest();
const map={schema:1,kind:'pico1715-source-map',base:256,space:'ram',binary_sha256:hash(bytes),binary_size:2,source:{name:'demo.asm',text,sha256:hash(new TextEncoder().encode(text))},entries:[{address:256,length:2,line:1,code:true}],symbols:[{name:'entry',address:256}]};
const row=(kind,address,data,flags=0)=>({kind,address,data,flags});
function capture(rows,header={}){return {header:{type:'compact',capture_mask:0x3fe,dropped:0,count:rows.length,...header},async *records(start,end){for(let index=start;index<end;index++)yield {index,...rows[index]};}};}
test('verified image/source identity and unknown ROM mapping',async()=>{const v=validateSource(map,bytes);assert.throws(()=>validateSource(map,new Uint8Array([0,0])),/identity/);assert.throws(()=>validateSource(map,bytes,'wrong'),/identity/);const r=await sourceContext(capture([row(1,256,0x3e),row(2,257,65)]),0,v);assert.equal(r.outcome,'uncertain');assert.equal(r.space,'unknown');});
test('memory disable establishes RAM; observed operands are checked',async()=>{const v=validateSource(map,bytes),rows=[row(5,0x128,0),row(1,256,0x3e),row(7,0,0),row(2,257,65)];const r=await sourceContext(capture(rows),1,v);assert.equal(r.outcome,'candidate');assert.deepEqual(r.observed,[0x3e,65]);rows[3].data=66;assert.equal((await sourceContext(capture(rows),1,v)).outcome,'differs');});
test('IACK, loss, partial fetches and reset do not create false execution claims',async()=>{const v=validateSource(map,bytes);assert.equal((await sourceContext(capture([row(6,256,0x3e)]),0,v)).outcome,'not applicable');const rows=[row(5,0x28,0),row(1,256,0x3e),row(2,257,65)];assert.equal((await sourceContext(capture(rows,{dropped:1}),1,v)).outcome,'uncertain');rows[1].flags=1;assert.equal((await sourceContext(capture(rows),1,v)).outcome,'uncertain');rows[0]=row(8,0,0);assert.equal((await sourceContext(capture(rows),1,v)).outcome,'unavailable');});
