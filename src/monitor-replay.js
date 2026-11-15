// Binary replay reader. Imported recordings contain data only, never code/URLs.
export const MAX_BYTES = 64 * 1024 * 1024;
const fields = ['time','collector','anode','focus','horizontal','vertical','cathode','beam','x','y','sigma','landed'];
function assert(condition, message) { if (!condition) throw Error(message); }
function finite(value, lo, hi) {return typeof value === 'number' && Number.isFinite(value) && value >= lo && value <= hi;}
export async function readReplay(buffer) {
  assert(buffer instanceof ArrayBuffer && buffer.byteLength >= 12 && buffer.byteLength <= MAX_BYTES, 'Replay size is outside the supported limit.');
  const bytes = new Uint8Array(buffer), view = new DataView(buffer), decoder = new TextDecoder('utf-8', {fatal:true});
  const magic=decoder.decode(bytes.subarray(0,8));
  assert(['DACCRT1\n','DACCRT2\n'].includes(magic), 'This is not a monitor replay.');
  const size = view.getUint32(8,true), base = 12+size;
  assert(size > 0 && size <= 1024*1024 && base <= bytes.length, 'Invalid replay header size.');
  const meta = JSON.parse(decoder.decode(bytes.subarray(12,base)));
  assert(meta.format === 'dac-crt-replay' && [1,2].includes(meta.version) && magic===`DACCRT${meta.version}\n`, 'Unsupported replay version.');
  assert(typeof meta.name === 'string' && meta.name.length <= 300 && finite(meta.duration, 1e-9, meta.version===1?1:120), 'Invalid replay identity or duration.');
  const start=meta.version===1?0:meta.start_time,end=meta.version===1?meta.duration:meta.end_time;
  assert(finite(start,0,120) && finite(end,start+1e-9,120) && Math.abs(end-start-meta.duration)<1e-8,'Invalid recording window.');
  assert(meta.qualification === (meta.version===1?'experimental-fixture':'bounded-stage'), 'Unsupported qualification profile.');
  assert(Array.isArray(meta.limitations) && meta.limitations.length <= 30 && meta.limitations.every(s=>typeof s==='string' && s.length<=1000), 'Invalid evidence notes.');
  assert(Array.isArray(meta.components) && meta.components.length <= 2000 && meta.components.every(c=>typeof c.reference==='string' && c.reference.length<50 && typeof c.value==='string' && c.value.length<10000 && Array.isArray(c.nodes) && c.nodes.length<=20 && c.nodes.every(n=>typeof n==='string' && n.length<100)), 'Invalid circuit inventory.');
  assert(Array.isArray(meta.chunks) && meta.chunks.length >= (meta.version===1?2:1) && meta.chunks.length <= 2002, 'Invalid replay chunk count.');
  const frames = []; let trace, offset = 0, lastTime = -1;
  for (const chunk of meta.chunks) {
    assert(Number.isSafeInteger(chunk.offset) && chunk.offset === offset && Number.isSafeInteger(chunk.bytes) && chunk.bytes > 0 && base+offset+chunk.bytes <= bytes.length, 'Truncated or overlapping replay chunk.');
    const data = bytes.subarray(base+offset, base+offset+chunk.bytes);
    assert(typeof chunk.sha256==='string' && /^[a-f0-9]{64}$/.test(chunk.sha256), 'Missing chunk checksum.');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');
    assert(hash === chunk.sha256, 'Replay checksum failed.');
    if (chunk.kind === 'frame') {
      assert(chunk.width === 160 && chunk.height === 112 && chunk.bytes === 160*112 && finite(chunk.time,start,end+1e-9) && chunk.time > lastTime, 'Invalid phosphor frame.');
      lastTime = chunk.time; frames.push({...chunk, data});
    } else {
      assert(Array.isArray(chunk.fields) && chunk.fields.length>=2 && chunk.fields.length<=128 && chunk.fields[0].name==='time' && chunk.fields[0].unit==='s' && chunk.fields.every(f=>typeof f.name==='string' && /^[a-zA-Z_][a-zA-Z_0-9]{0,63}$/.test(f.name) && typeof f.unit==='string' && f.unit.length<20) && new Set(chunk.fields.map(f=>f.name)).size===chunk.fields.length, 'Unsupported trace fields.');
      const stride=chunk.fields.length;
      assert(chunk.kind === 'trace' && !trace && Number.isInteger(chunk.rows) && chunk.rows >= 2 && chunk.rows <= 250001 && chunk.bytes === chunk.rows*stride*8, 'Invalid electrical trace.');
      assert(meta.version===2 || (stride===fields.length && chunk.fields.every((f,i)=>f.name===fields[i])), 'Unsupported trace fields.');
      const values = new Float64Array(chunk.rows*stride), raw = new DataView(data.buffer,data.byteOffset,data.byteLength);
      for (let i=0;i<values.length;i++) {values[i]=raw.getFloat64(i*8,true);assert(Number.isFinite(values[i]) && Math.abs(values[i])<=1e12,'Non-finite or out-of-range trace value.');}
      for(let i=0;i<chunk.rows;i++) assert(values[i*stride]>=start-1e-12 && values[i*stride]<=end+1e-9 && (!i || values[i*stride]>values[(i-1)*stride]),'Invalid trace time.');
      assert(Math.abs(values[(chunk.rows-1)*stride]-end)<1e-8,'Incomplete trace.');
      assert(Math.abs(values[0]-start)<1e-12, 'Trace must start at the recording window.');
      if(meta.version===1)for(let i=0;i<chunk.rows;i++) assert(values[i*12+7]>=0 && values[i*12+10]>0 && (values[i*12+11]===0 || values[i*12+11]===1), 'Invalid optical sample.');
      trace = {...chunk, values, stride};
    }
    offset += chunk.bytes;
  }
  assert(base+offset === bytes.length && trace && (meta.version===2 || frames.length), 'Incomplete replay.');
  if(frames.length){
    assert(Math.abs(frames.at(-1).time-end)<1e-8, 'Incomplete replay.');
    assert(Math.abs(frames[0].time-start)<1e-12, 'Phosphor frames must start at the recording window.');
  }
  return {meta, frames, trace, start, end};
}

export function sampleAt(replay, time) {
  const {values,rows,stride} = replay.trace;
  let lo=0, hi=rows-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2); if(values[mid*stride]<=time)lo=mid;else hi=mid-1;}
  return values.subarray(lo*stride,lo*stride+stride);
}

export function frameAt(replay,time) {
  let lo=0,hi=replay.frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(replay.frames[mid].time<=time)lo=mid;else hi=mid-1;}
  return replay.frames[lo];
}
