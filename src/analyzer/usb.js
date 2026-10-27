// SPDX-License-Identifier: MIT
const fields=['state','generation','records','bytes','fpga_dropped','local_dropped','filtered','retries','full','stopping'];
const triggers=['enabled','kinds','address','data','pre','post','triggered','trigger_index','trigger_sequence','omitted','post_collected','stop_reason'];
const resets=['enabled','reset_state','reset_id','capture_generation','requested_us32','asserted_us32','released_observed_us32','reason'];
const errors=['','invalid command','capture state does not permit command','capture ID changed','invalid read range','capture unavailable','reset accessory unavailable','reset token changed'];
export function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
const require=(b,m)=>{if(!b)throw Error(m);};
export class Client{
 constructor(transport){this.transport=transport;this.id=0;this.chain=Promise.resolve();this.failed=false;}
 command(command,generation=0,offset=0,length=0,payload=new Uint8Array()){
  const task=async()=>{require(!this.failed,'Reconnect and inspect status before another command');const request=new Uint8Array(24+payload.length),v=new DataView(request.buffer);request.set([80,49,55,81,1,command]);v.setUint32(8,this.id=(this.id+1)>>>0,true);v.setUint32(12,generation,true);v.setUint32(16,offset,true);v.setUint32(20,length,true);request.set(payload,24);
   let timeout;try{return await Promise.race([(async()=>{
    await this.transport.write(request);const header=await this.transport.exact(28),r=new DataView(header.buffer,header.byteOffset,header.byteLength),u=o=>r.getUint32(o,true),size=u(20),gen=u(12);
    require(header.length===28&&new TextDecoder().decode(header.subarray(0,4))==='P17R'&&header[4]===1&&header[5]===command&&!header[7]&&u(8)===this.id&&u(16)===offset&&size<=1024,'Invalid USB response header');
    const bytes=await this.transport.exact(size),all=new Uint8Array(24+size);all.set(header.subarray(0,24));all.set(bytes,24);require(crc32(all)===u(24),'USB response CRC mismatch');
    if(header[6]){const e=Error(errors[header[6]]||`Device error ${header[6]}`);e.device=true;throw e;}
    require(![3,4,5,6,8].includes(command)||gen===generation,'Capture ID changed');if(command===4){require(size===length,'Short capture chunk');return bytes;}
    const names=command>=7?resets:command>=5?triggers:fields;require(size===names.length*4,'Invalid status size');const data=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),result=Object.fromEntries(names.map((n,i)=>[n,data.getUint32(i*4,true)]));
    if(command<5)require(result.generation===gen,'Inconsistent capture ID');result.generation=gen;return result;
   })(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('USB command timed out; outcome unknown. Reconnect and inspect status.')),5000);})]);}
   catch(e){if(!e.device){this.failed=true;await this.transport.abort?.();}throw e;}finally{clearTimeout(timeout);}
  };const result=this.chain.then(task);this.chain=result.catch(()=>{});return result;
 }
 status(){return this.command(1);}
 async configure(config){const s=await this.status();const values=config.enabled?[1,config.kinds,config.address>>>0,config.data>>>0,config.pre,config.post]:[0,0,0,0,0,0];
  require(values.every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff),'Invalid trigger values');if(values[0])require(values[1]&&!(values[1]&~0x170)&&values[3]<=65535&&values[4]+values[5]+1<=458747,'Invalid trigger configuration');
  const b=new Uint8Array(24),v=new DataView(b.buffer);values.forEach((n,i)=>v.setUint32(i*4,n,true));return this.command(5,s.generation,0,24,b);
 }
 async arm(){const s=await this.status();return this.command(2,s.generation);}
 async trigger(){const s=await this.status();return this.command(6,s.generation);}
 async stop(){const s=await this.status();await this.command(3,s.generation);const until=Date.now()+15000;for(;;){const n=await this.status();require(n.generation===s.generation,'Capture ID changed while stopping');if(n.state===4)return n;require(n.state!==5,'Capture failed');if(Date.now()>until)throw Error('Still draining; query status before retrying');await new Promise(r=>setTimeout(r,50));}}
 async download({check=()=>{},progress=()=>{}}={}){const s=await this.status();require(s.state===4,'Stop and wait for DONE before downloading');require([32,80].includes(s.bytes-16*s.records)&&s.bytes<=7*1024*1024,'Invalid capture size');const parts=[];for(let o=0;o<s.bytes;o+=1024){check();parts.push(await this.command(4,s.generation,o,Math.min(1024,s.bytes-o)));progress((o+parts.at(-1).length)/s.bytes);}check();return {blob:new Blob(parts),status:s};}
 resetStatus(){return this.command(7);}
 async reset(arm=false){const s=await this.resetStatus();require(s.enabled,'Reset accessory unavailable');const r=await this.command(arm?9:8,s.generation,s.reset_id),until=Date.now()+2000;for(;;){const n=await this.resetStatus();require(n.reset_id===r.reset_id,'Reset token changed');if(n.reset_state===3)return n;if(![1,2].includes(n.reset_state))throw Error(`Reset failed/cancelled: ${n.reason}`);if(Date.now()>until)throw Error('Reset completion unknown; inspect status before another request');await new Promise(r=>setTimeout(r,10));}}
}
export class SerialTransport{
 constructor(port){this.port=port;this.buffer=new Uint8Array();this.closed=false;this.reader=port.readable.getReader();this.writer=port.writable.getWriter();}
 async write(bytes){await this.writer.write(bytes);}
 async exact(size){while(this.buffer.length<size){const {value,done}=await this.reader.read();if(done||this.closed)throw Error('Device disconnected');require(this.buffer.length+(value?.length||0)<=65536,'USB input buffer limit exceeded');const joined=new Uint8Array(this.buffer.length+value.length);joined.set(this.buffer);joined.set(value,this.buffer.length);this.buffer=joined;}const out=this.buffer.slice(0,size);this.buffer=this.buffer.slice(size);return out;}
 async abort(){if(this.closed)return;this.closed=true;try{await this.reader.cancel();}catch{}try{this.reader.releaseLock();this.writer.releaseLock();await this.port.close();}catch{}this.buffer=new Uint8Array();}
}
