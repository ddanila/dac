// SPDX-License-Identifier: MIT
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Capture} from '../../src/analyzer/capture.js';import {evaluate,validateSuite} from '../../src/analyzer/assertions.js';import {investigate} from '../../src/analyzer/investigation.js';
function capture(rows,{mask=0x3fe,dropped=0}={}){const b=new Uint8Array(32+rows.length*16),v=new DataView(b.buffer);b.set(new TextEncoder().encode('P1715CY\0'));v.setUint16(8,1,true);v.setUint16(10,16,true);v.setUint32(12,1000000,true);v.setUint32(16,rows.length,true);v.setUint32(20,dropped,true);v.setUint32(28,mask,true);rows.forEach((r,i)=>{const o=32+i*16;v.setUint8(o,(r.kind||5)*16+(r.flags||0));v.setUint8(o+1,r.data||0);v.setUint16(o+2,r.address||0,true);v.setUint16(o+4,r.wait||0,true);v.setUint16(o+6,r.duration||2,true);v.setUint32(o+8,r.tick??i*10,true);v.setUint32(o+12,i,true);});return Capture.open(new Blob([b]));}
const suite=rules=>({schema:1,id:'test',rules});const response={id:'response',type:'response',event:{kind:'io_write',address:3},response:{kind:'interrupt_ack'},within_us:20};
test('required response passes, missing trigger and unfinished deadlines do not',async()=>{
 for(const [rows,outcome] of [[[{address:3},{kind:6}],'pass'],[[{address:4}],'inconclusive'],[[{address:3}],'inconclusive'],[[{address:3},{address:4,tick:30}],'fail']]){const c=await capture(rows);assert.equal((await evaluate(c,suite([response]))).results[0].outcome,outcome);}
});
test('count, low-byte ports, sequence and bounds share deterministic evidence',async()=>{
 const c=await capture([{address:0x1203},{kind:4,address:2,wait:2},{kind:6}]);const r=await evaluate(c,suite([{id:'count',type:'count',event:{kind:'io_write',address:3},min:1,max:1},{id:'sequence',type:'sequence',events:[{kind:'io_write'},{kind:'io_read'},{kind:'interrupt_ack'}]},{id:'bound',type:'bound',event:{kind:'io_read'},field:'wait_us',max:1}]));assert.deepEqual(r.results.map(r=>r.outcome),['pass','pass','fail']);assert.deepEqual(r.results[2].evidence,[1]);
});
test('loss, partial cycles, excluded events, empty data and raw files cannot pass',async()=>{
 for(const c of [await capture([{address:3,flags:1}]),await capture([{address:3}],{dropped:1}),await capture([]),await capture([{address:3}],{mask:0x170})]){
  const r=await evaluate(c,suite([{id:'fetch',type:'count',event:{kind:'opcode_fetch'},max:0}]));assert.equal(r.results[0].outcome,'inconclusive');
 }
 const raw=await Capture.open(new Blob([await readFile(new URL('../../public/analyzer/raw.p1715',import.meta.url))]));assert.equal((await evaluate(raw,suite([response]))).results[0].outcome,'not applicable');
});
test('validation and cancellation fail closed',async()=>{
 assert.throws(()=>validateSuite(suite([{...response,within_us:-1}])));assert.throws(()=>validateSuite(suite([{...response,event:{kind:'bogus'}}])));
 const c=await capture([{address:3}]);await assert.rejects(evaluate(c,suite([response]),{check(){throw Error('Cancelled');}}),/Cancelled/);
 await assert.rejects(evaluate(c,suite([response]),{start:-1}),/range/);
});
test('boot profiles require exact hashes, screen evidence and included fetches',async()=>{
 const c=await capture([{kind:1,address:0xc033},{kind:4}]),m={schema:1,capture_sha256:c.summary.sha256,start_clock:0,end_clock:30,clock_hz:1000000,rom_sha256:'rom',disk_sha256:'disk',observations:[{kind:'screen',clock:25,detail:'A>'}]};
 const profiles={schema:1,profiles:[{id:'p',revision:1,rom_sha256:'rom',disk_sha256:['disk'],stages:[{id:'entry',event:{kind:'opcode_fetch',address:0xc033}},{id:'ready',observation:'screen',contains:'A>'}]}]};
 let r=await investigate(c,m,profiles);assert.equal(r.qualified_profile,true);assert.deepEqual(r.stages.map(s=>s.outcome),['observed','observed']);
 r=await investigate(c,{...m,rom_sha256:'unknown'},profiles,'p');assert.equal(r.qualified_profile,false);assert.ok(r.stages.every(s=>s.outcome==='unavailable from this capture'));
 r=await investigate(c,{...m,observations:[]},profiles);assert.equal(r.stages[1].outcome,'unavailable from this capture');
 await assert.rejects(investigate(c,{...m,capture_sha256:'wrong'},profiles),/identify/);
 const io=await capture([{kind:4}],{mask:0x170});r=await investigate(io,{...m,capture_sha256:io.summary.sha256},profiles);assert.equal(r.stages[0].outcome,'unavailable from this capture');
});
test('strict range comparison retains unequal tails and validates bounds',async()=>{
 const {compare}=await import('../../src/analyzer/capture.js');const left=await capture([{data:1},{data:2},{data:3}]),right=await capture([{data:0},{data:1},{data:2}]);
 assert.equal((await compare(left,right,{ranges:{capture:{start:0,end:2},reference:{start:1,end:3}}})).match,true);
 assert.equal((await compare(left,right)).match,false);await assert.rejects(compare(left,right,{ranges:{capture:{start:-1,end:2},reference:{start:1,end:3}}}),/range/);
});
test('responses are paired one-to-one, so one acknowledgement cannot satisfy two requests',async()=>{
 const c=await capture([{address:3},{address:3},{kind:6},{address:4,tick:50}]);assert.equal((await evaluate(c,suite([response]))).results[0].outcome,'fail');
});
