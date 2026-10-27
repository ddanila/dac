// SPDX-License-Identifier: MIT. Generated data, no historical captures.
import {mkdtemp,open,rm} from 'node:fs/promises';import {openAsBlob} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
import {Capture,STRIDE} from '../../src/analyzer/capture.js';
const dir=await mkdtemp(join(tmpdir(),'p1715-scale-')),path=join(dir,'full.p1715'),count=7252874;
try{const f=await open(path,'w');const h=Buffer.alloc(32);h.write('P1715CY\0');h.writeUInt16LE(1,8);h.writeUInt16LE(16,10);h.writeUInt32LE(9832000,12);h.writeUInt32LE(count,16);h.writeUInt32LE(0x3fe,28);await f.write(h);
 for(let start=0;start<count;start+=65536){const n=Math.min(count-start,65536),b=Buffer.alloc(n*16);for(let i=0;i<n;i++){const o=i*16,s=start+i;b[o]=0x10;b[o+1]=s&255;b.writeUInt16LE(s&65535,o+2);b.writeUInt16LE(2,o+6);b.writeUInt32LE((s*4)>>>0,o+8);b.writeUInt32LE(s>>>0,o+12);}await f.write(b);}await f.close();
 const before=process.memoryUsage().heapUsed,start=performance.now(),blob=await openAsBlob(path);let checks=0;
 const c=await Capture.open(blob,{check(){checks++;}});assert.equal(c.header.count,count);assert.equal(c.checkpoints.length,Math.ceil(count/STRIDE));
 const row=(await c.page(count-1,1))[0];assert.equal(row.index,count-1);assert.equal(row.elapsed_samples,String((count-1)*4));assert.equal(row.address,(count-1)&65535);
 const growth=process.memoryUsage().heapUsed-before;assert.ok(growth<32*1024*1024,'decoded heap growth exceeds 32 MiB');assert.ok(checks>100);
 let cancelled=false;await assert.rejects(Capture.open(blob,{check(){if(cancelled)throw Error('Cancelled');},progress(v){if(v>0.05)cancelled=true;}}),/Cancelled/);
 console.log(JSON.stringify({records:count,bytes:blob.size,seconds:(performance.now()-start)/1000,decodedHeapGrowth:growth,checkpoints:c.checkpoints.length,chunkChecks:checks}));
}finally{await rm(dir,{recursive:true,force:true});}
