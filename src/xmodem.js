// XMODEM-128 checksum sender. Host orchestration never changes guest memory.
export function xmodemSender(bytes,send,report,now=()=>performance.now()) {
 if(!(bytes instanceof Uint8Array)||bytes.length>65536)throw Error('Choose at most 64 KiB.');
 let offset=0,packet=null,retries=0,waiting=true,done=false,deadline=now()+30000;
 const status=message=>report({message,done,offset,total:bytes.length});
 const transmit=()=>{send(packet);deadline=now()+15000;status(`Sending ${offset}/${bytes.length} bytes${retries?' · retry '+retries:''}`);};
 const next=()=>{retries=0;if(offset>=bytes.length)packet=Uint8Array.of(4);else {const block=(offset/128+1)&255,data=new Uint8Array(128).fill(26);data.set(bytes.subarray(offset,offset+128));packet=Uint8Array.from([1,block,255-block,...data,data.reduce((a,b)=>(a+b)&255,0)]);}transmit();};
 const cancel=(message='Transfer cancelled; a partial guest file may remain.')=>{if(done)return;done=true;// Fill any partial 131-byte receive body, then leave CAN at the next header.
 send(new Uint8Array(134).fill(24));status(message);};
 status('Waiting for receiver NAK. Run DACRX NAME.EXT in TOS/M.');
 return {get done(){return done;},cancel,feed(input){if(done)return;for(const b of input){if(b===24){done=true;status('Guest cancelled; check filename, disk space and write protection.');break;}if(waiting){if(b===21){waiting=false;next();break;}continue;}if(b===6){if(packet.length===1){done=true;status(`Completed ${bytes.length} bytes; guest file is padded to 128-byte records.`);break;}offset=Math.min(bytes.length,offset+128);next();}else if(b===21){if(++retries>10){cancel('Too many rejected blocks.');break;}transmit();}}},tick(){if(done||now()<deadline)return;if(waiting){cancel('Receiver did not start within 30 seconds.');return;}if(++retries>10){cancel('Receiver stopped acknowledging blocks.');return;}transmit();}};
}
