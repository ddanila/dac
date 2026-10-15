import {test,expect} from '@playwright/test';
import {xmodemSender} from '../src/xmodem.js';
import {transferDisk} from '../src/guest-transfer-disk.js';
import {inspectDisk} from '../src/disk-map.js';
import {readFile} from 'node:fs/promises';
test('XMODEM sender retries exact packets, pads final record and waits for EOT ACK',()=>{
 const sent=[],states=[];let time=0;const payload=Uint8Array.from({length:129},(_,i)=>i);
 const sender=xmodemSender(payload,b=>sent.push(b.slice()),s=>states.push(s),()=>time);
 sender.feed(Uint8Array.of(21));expect(sent[0].length).toBe(132);expect(sent[0][131]).toBe(192);
 sender.feed(Uint8Array.of(21));expect(sent[1]).toEqual(sent[0]);
 sender.feed(Uint8Array.of(6));expect([...sent[2].slice(0,5)]).toEqual([1,2,253,128,26]);
 sender.feed(Uint8Array.of(6));expect([...sent[3]]).toEqual([4]);expect(sender.done).toBe(false);
 time=15001;sender.tick();expect([...sent[4]]).toEqual([4]);
 sender.feed(Uint8Array.of(6));expect(sender.done).toBe(true);expect(states.at(-1).offset).toBe(129);
});
test('guest example disk preserves existing allocations and adds the original receiver',async()=>{
 const original=await readFile('public/media/robotron/tosm10.img'),com=await readFile('public/examples/robotron-v24/DACRX.COM');
 const disk=transferDisk(original,com),before=inspectDisk(original),after=inspectDisk(disk);
 expect(after.filesystem).toBe(true);expect(after.files.length).toBe(before.files.length+1);
 for(const file of before.files)for(const s of file.sectors)expect(disk.slice(s.offset,s.offset+s.size)).toEqual(new Uint8Array(original.subarray(s.offset,s.offset+s.size)));
 const receiver=after.files.find(f=>f.name==='0:DACRX.COM');expect(disk.slice(receiver.sectors[0].offset,receiver.sectors[0].offset+com.length)).toEqual(new Uint8Array(com));
});

test('cancellation leaves a CAN beyond any partial receive block',()=>{const sent=[];const s=xmodemSender(Uint8Array.of(1),b=>sent.push(b),()=>{});s.feed(Uint8Array.of(21));s.cancel();expect(s.done).toBe(true);expect(sent.at(-1).length).toBeGreaterThan(131);expect([...sent.at(-1)].every(v=>v===24)).toBe(true);});
