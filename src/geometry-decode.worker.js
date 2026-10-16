// Derived cache decompression and bounds scan. No Three.js objects cross threads.
self.onmessage=async({data:{id,compressed}})=>{
 try{
  const buffer=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),header=new DataView(buffer);
  if(buffer.byteLength<16||header.getUint32(0,true)!==0x31474344)throw Error('Invalid geometry');
  const count=header.getUint32(4,true),indices=header.getUint32(8,true),width=header.getUint32(12,true);
  if(![2,4].includes(width)||16+count*24+indices*width!==buffer.byteLength)throw Error('Invalid geometry length');
  const positions=new Float32Array(buffer,16,count*3),bounds=[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i++){const axis=i%3,value=positions[i];if(!Number.isFinite(value))throw Error('Invalid vertex');bounds[axis]=Math.min(bounds[axis],value);bounds[axis+3]=Math.max(bounds[axis+3],value);}
  postMessage({id,buffer,bounds},[buffer]);
 }catch(error){postMessage({id,error:error.message});}
};
