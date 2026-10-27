import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {Capture,compare,exportCapture,fields,rawKind} from '../../src/analyzer/capture.js';import {SHA256} from '../../src/analyzer/sha256.js';import {Client} from '../../src/analyzer/usb.js';
const root=new URL('../../public/analyzer/',import.meta.url),read=n=>readFileSync(new URL(n,root)),blob=n=>new Blob([read(n+'.p1715')]),open=n=>Capture.open(blob(n));
const oracle=JSON.parse(read('oracle.json'));
test('incremental SHA256 agrees with independent crypto over padding boundaries',()=>{for(const n of [0,1,55,56,63,64,65,100000]){const b=Buffer.alloc(n,171);const sha=new SHA256();for(let i=0;i<n;i+=7)sha.update(b.subarray(i,i+7));assert.equal(sha.digest(),createHash('sha256').update(b).digest('hex'));}});
for(const [name,expected] of Object.entries(oracle)){if(name==='comparison')continue;test(name+': Python decoder, whole-file exports and random access parity',async()=>{const c=await open(name);for(const k of ['sha256','records','clock_hz','dropped','filtered','trigger_index','kinds','fields','diagnostics'])assert.deepEqual(c.summary[k],expected[k],k);
 assert.equal(await(await exportCapture(c,'csv')).text(),read(name+'.csv').toString());const actual=(await(await exportCapture(c,'jsonl')).text()).trim().split('\n').filter(Boolean).map(JSON.parse);assert.deepEqual(actual,expected.timeline);
 if(c.header.count){const start=Math.floor(c.header.count/2);assert.deepEqual((await c.page(start,1))[0].annotations,actual[start].annotations);}
 });}
test('comparison matches Python including divergent and unequal tails',async()=>{assert.deepEqual(await compare(await open('controller'),await open('crc-failure')),Object.fromEntries(Object.entries(oracle.comparison).filter(([k])=>k!=='scope')));assert.equal((await compare(await open('controller'),await open('controller'))).match,true);assert.equal((await compare(await open('empty'),await open('empty'))).match,false);await assert.rejects(compare(await open('controller'),await open('trigger'),{align:'trigger'}));assert.equal((await compare(await open('controller'),await open('wait-heavy'),{tolerance:0})).match,false);});
test('raw CSV/VCD and transition-preserving aggregation',async()=>{const c=await open('raw');for(const f of ['csv','vcd'])assert.equal(await(await exportCapture(c,f)).text(),read('raw.'+f).toString());const bins=await c.waveform(0,256,1);assert.equal(bins.length,1);assert.equal(bins[0].changed.wait_n,true);assert.equal((await c.edge(1,'wait_n')).index,100);assert.equal((await c.edge(100,'wait_n',-1)).index,100);assert.equal((await c.measure(0,128)).elapsed_us,2.56);});
test('malformed inputs never publish, and operations cancel',async()=>{const b=read('controller.p1715');for(const x of [b.subarray(0,20),b.subarray(0,-1),Buffer.concat([b,Buffer.from([0])])])await assert.rejects(Capture.open(new Blob([x])));for(const [off,val] of [[0,0],[8,9],[10,9],[12,0],[32,0],[38,0]]){const x=Buffer.from(b);if(off===12)x.writeUInt32LE(0,12);else x[off]=val;await assert.rejects(Capture.open(new Blob([x])));}
 await assert.rejects(Capture.open(blob('raw'),{check(){throw Error('Cancelled');}}),/Cancelled/);
});
test('search and exact measurements',async()=>{const c=await open('controller');assert.equal((await c.search(0,{kind:'interrupt_ack'})).index,9);assert.equal((await c.search(c.header.count-1,{kind:'interrupt_ack'},-1)).index,9);assert.equal((await c.measure(0,10)).samples,'1000');assert.ok(await c.search(0,{note:'CRC ok'}));});
test('USB client runs against production C handler compiled to WASM',async()=>{
 const factory=(await import(new URL('usb-fixture.mjs',root))).default,lib=await factory();lib._fixture_init();let corrupt=false,chunk=7;
 const transport={async write(b){for(const n of b)lib._fixture_feed(n);},async exact(n){const out=new Uint8Array(n),p=lib._malloc(n||1);try{let o=0;while(o<n){const got=lib._fixture_read(p,Math.min(chunk,n-o));assert.ok(got,'response complete');out.set(lib.HEAPU8.slice(p,p+got),o);o+=got;}if(corrupt&&n)out[n-1]^=1;return out;}finally{lib._free(p);}},async abort(){lib._fixture_disconnect();}};
 const c=new Client(transport);assert.equal((await c.status()).state,0);assert.equal((await c.resetStatus()).enabled,0);await assert.rejects(c.reset(),/unavailable/);
 await c.configure({enabled:1,kinds:32,address:4,data:0,pre:4,post:4});assert.equal((await c.trigger()).triggered,0);const armed=await c.arm();assert.equal(armed.generation,1);await assert.rejects(c.command(4,0,0,16));
 lib._fixture_init();await c.arm();
 const bytes=read('controller.p1715'),p=lib._malloc(bytes.length);lib.HEAPU8.set(bytes,p);assert.equal(lib._fixture_complete(p,bytes.length),0);lib._free(p);
 const downloaded=await c.download();assert.deepEqual(Buffer.from(await downloaded.blob.arrayBuffer()),bytes);await Capture.open(downloaded.blob);
 await assert.rejects(c.download({check(){throw Error('Cancelled');}}),/Cancelled/);assert.equal((await c.status()).state,4);
 lib._fixture_reset_enable();const s=await c.resetStatus();const r=await c.command(8,s.generation,s.reset_id);assert.equal(lib._fixture_reset_calls(),1);await assert.rejects(c.command(8,s.generation,s.reset_id),/token/);lib._fixture_advance(100001);lib._fixture_poll();assert.equal((await c.resetStatus()).reset_state,3);
 corrupt=true;await assert.rejects(c.status(),/CRC/);assert.equal(c.failed,true);await assert.rejects(c.status(),/Reconnect/);
});
test('validation decisions match Python across corrupted headers, records and tails',async()=>{
 for(const [index,c] of JSON.parse(read('validation.json')).entries()){let valid=true;try{await Capture.open(new Blob([Buffer.from(c.bytes,'base64')]))}catch{valid=false;}assert.equal(valid,c.valid,`${c.source} mutation ${index}`);}
});
test('SerialTransport assembles fragmented responses and closes on disconnect',async()=>{
 const {SerialTransport}=await import('../../src/analyzer/usb.js');let source,closed=false;const sent=[];
 const port={readable:new ReadableStream({start(c){source=c;}}),writable:new WritableStream({write(b){sent.push(...b);}}),async close(){closed=true;}};
 const t=new SerialTransport(port);source.enqueue(new Uint8Array([1]));source.enqueue(new Uint8Array([2,3]));assert.deepEqual([...await t.exact(2)],[1,2]);assert.deepEqual([...await t.exact(1)],[3]);await t.write(new Uint8Array([4]));assert.deepEqual(sent,[4]);source.close();await assert.rejects(t.exact(1),/disconnected/);await t.abort();assert.equal(closed,true);
});
test('USB ambiguous timeout closes session and never retries ARM',async()=>{
 let writes=0,aborted=false;const c=new Client({async write(){writes++;},exact(){return new Promise(()=>{});},async abort(){aborted=true;}});
 await assert.rejects(c.command(2,0),/outcome unknown/);assert.equal(writes,1);assert.ok(aborted);await assert.rejects(c.command(2,0),/Reconnect/);assert.equal(writes,1);
});
test('production receiver provides triggered windows and one-use reset sequencing',async()=>{
 const lib=await(await import(new URL('usb-fixture.mjs',root))).default();lib._fixture_init();const c=new Client({async write(b){for(const n of b)lib._fixture_feed(n);},async exact(n){const p=lib._malloc(n||1),a=new Uint8Array(n);try{let offset=0;while(offset<n){const k=lib._fixture_read(p,Math.min(3,n-offset));assert.ok(k);a.set(lib.HEAPU8.slice(p,p+k),offset);offset+=k;}return a;}finally{lib._free(p);}}});
 const {crc16}=await import('../../src/analyzer/decoder.js');function packet(payload,terminal=false,corrupt=false){const b=new Uint8Array(22);b.set([terminal?2:1,1,+terminal,0]);b.set(payload,4);new DataView(b.buffer).setUint16(20,crc16(b.slice(0,20))^+corrupt,true);const p=lib._malloc(22);lib.HEAPU8.set(b,p);lib._fixture_frame(p);lib._free(p);}
 function event(seq){const b=new Uint8Array(16),v=new DataView(b.buffer);b[0]=0x40;v.setUint16(2,seq,true);v.setUint16(6,4,true);v.setUint32(8,seq*10,true);v.setUint32(12,seq,true);packet(b);}
 await c.configure({enabled:1,kinds:16,address:0xffff000a,data:0,pre:3,post:2});await c.arm();for(let i=0;i<15;i++)event(i);const tail=new Uint8Array(16),v=new DataView(tail.buffer);v.setUint32(8,15,true);v.setUint32(12,0x170,true);packet(tail,true);
 const {blob}=await c.download(),capture=await Capture.open(blob);assert.equal(capture.header.version,2);assert.equal(capture.header.trigger_index,3);assert.deepEqual((await capture.page()).map(r=>r.sequence),[7,8,9,10,11,12]);assert.equal((await c.trigger()).trigger_sequence,10);
 lib._fixture_init();lib._fixture_reset_enable();const s=await c.resetStatus();const pending=await c.command(9,s.generation,s.reset_id);assert.equal(pending.generation,1);assert.equal(lib._fixture_reset_calls(),0);lib._fixture_poll();lib._fixture_advance(100);lib._fixture_step();lib._fixture_advance(1000);lib._fixture_poll();assert.equal(lib._fixture_reset_calls(),1);lib._fixture_disconnect();assert.equal(lib._fixture_reset_active(),0);
});
test('published analyzer artifacts match their pinned manifest',()=>{const manifest=JSON.parse(read('manifest.json'));assert.equal(manifest.schema,1);for(const [name,hash] of Object.entries(manifest.sha256))assert.equal(createHash('sha256').update(read(name)).digest('hex'),hash,name);});
test('USB stale identities, malformed framing and interrupted downloads cannot publish',async()=>{
 const lib=await(await import(new URL('usb-fixture.mjs',root))).default();let corruptId=false,cut=false,reads=0;
 const t={async write(b){for(const n of b)lib._fixture_feed(n);},async exact(n){if(cut&&++reads>3)throw Error('Disconnected mid-download');const p=lib._malloc(n||1),a=new Uint8Array(n);try{let o=0;while(o<n){const k=lib._fixture_read(p,n-o);if(!k)throw Error('Short response');a.set(lib.HEAPU8.slice(p,p+k),o);o+=k;}if(corruptId&&n===28)a[8]^=1;return a;}finally{lib._free(p);}},async abort(){lib._fixture_disconnect();}};
 lib._fixture_init();let c=new Client(t);await c.arm();const b=read('controller.p1715'),p=lib._malloc(b.length);lib.HEAPU8.set(b,p);lib._fixture_complete(p,b.length);lib._free(p);
 cut=true;await assert.rejects(c.download(),/Disconnected/);assert.ok(c.failed);cut=false;reads=0;c=new Client(t);assert.equal((await c.status()).state,4);assert.deepEqual(Buffer.from(await(await c.download()).blob.arrayBuffer()),b);
 corruptId=true;await assert.rejects(c.status(),/header/);assert.ok(c.failed);
});
