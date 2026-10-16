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
 return {get done(){return done;},cancel,feed(input){if(done)return;for(const b of input){if(b===24){done=true;status('Guest cancelled; check filename, disk space and write protection.');break;}if(waiting){if(b===21){waiting=false;next();break;}continue;}if(b===6){if(packet.length===1){done=true;status(`Completed ${bytes.length} bytes; guest file is padded to 128-byte records.`);break;}offset=Math.min(bytes.length,offset+128);next();break;}else if(b===21){if(++retries>10){cancel('Too many rejected blocks.');break;}transmit();break;}}},tick(){if(done||now()<deadline)return;if(waiting){cancel('Receiver did not start within 30 seconds.');return;}if(++retries>10){cancel('Receiver stopped acknowledging blocks.');return;}transmit();}};
}

// Receiver accepts exact duplicate blocks without writing them twice. CP/M
// records have no byte-length field: preserve all padding in the download.
export function xmodemReceiver(send,report,complete,now=()=>performance.now()) {
 let done=false,accepted=false,expected=1,packet=[],chunks=[],size=0,retries=0,deadline=0;
 const status=message=>report({message,done,offset:size,total:65536});
 const reply=b=>{send(Uint8Array.of(b));deadline=now()+15000;};
 const cancel=(message='Receive cancelled.')=>{if(done)return;done=true;reply(24);status(message);};
 reply(21);status('Waiting for guest sender. Run DACTX NAME.EXT.');
 return {get done(){return done;},get needsReplies(){return accepted&&now()<deadline;},cancel,feed(input){if(done){if(accepted&&now()<deadline&&input.includes(4))reply(6);return;}for(const b of input){
  if(!packet.length){
   if(b===24){done=true;status('Guest cancelled.');return;}
   if(b===4){done=true;accepted=true;reply(6);const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}complete(bytes);status(`Received ${size} bytes, including CP/M record padding.`);return;}
   if(b!==1)continue;
  }
  packet.push(b);if(packet.length<132)continue;
  const p=packet;packet=[];
  if((p[1]^p[2])!==255||p.slice(3,131).reduce((a,v)=>(a+v)&255,0)!==p[131]){if(++retries>10){cancel('Too many damaged blocks.');return;}reply(21);continue;}
  if(p[1]===expected){if(size+128>65536){cancel('Receive exceeds 64 KiB.');return;}chunks.push(Uint8Array.from(p.slice(3,131)));size+=128;expected=(expected+1)&255;retries=0;}
  else if(!size||p[1]!==((expected+255)&255)){cancel('Unexpected block sequence.');return;}
  reply(6);status(`Receiving ${size} bytes`);
 }},tick(){if(done||now()<deadline)return;packet=[];if(++retries>10)cancel('Sender stopped responding.');else reply(21);}};
}
