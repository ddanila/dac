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

test('receiver rejects corrupt packets, acknowledges duplicates and handles block wrap',async()=>{
 const {xmodemReceiver}=await import('../src/xmodem.js');
 const replies=[];let output;const rx=xmodemReceiver(b=>replies.push(...b),()=>{},b=>output=b);
 const packet=n=>{const data=new Uint8Array(128).fill(n&255);return Uint8Array.from([1,n&255,255-(n&255),...data,(128*n)&255]);};
 const damaged=packet(1);damaged[30]^=1;rx.feed(damaged);expect(replies.at(-1)).toBe(21);
 for(let i=1;i<=257;i++){rx.feed(packet(i));if(i===1)rx.feed(packet(i));}
 rx.feed(Uint8Array.of(4));expect(rx.done).toBe(true);expect(output.length).toBe(257*128);expect(output[255*128]).toBe(0);expect(output[256*128]).toBe(1);const count=replies.length;rx.feed(Uint8Array.of(4));expect(replies.length).toBe(count+1);expect(replies.at(-1)).toBe(6);
});
test('queued duplicate replies trigger at most one new packet per received batch',()=>{
 const sent=[];const s=xmodemSender(new Uint8Array(256),bytes=>sent.push(bytes.slice()),()=>{});
 s.feed(Uint8Array.of(21));s.feed(Uint8Array.of(21,21,21));expect(sent.length).toBe(2);
 s.feed(Uint8Array.of(6,6));expect(sent.length).toBe(3);expect(sent.at(-1)[1]).toBe(2);
});
