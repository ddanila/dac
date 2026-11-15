// Binary replay reader. Imported recordings contain data only, never code/URLs.
export const MAX_BYTES = 64 * 1024 * 1024;
const fields = ['time','collector','anode','focus','horizontal','vertical','cathode','beam','x','y','sigma','landed'];
function assert(condition, message) { if (!condition) throw Error(message); }
function finite(value, lo, hi) {return typeof value === 'number' && Number.isFinite(value) && value >= lo && value <= hi;}
export async function readReplay(buffer) {
  assert(buffer instanceof ArrayBuffer && buffer.byteLength >= 12 && buffer.byteLength <= MAX_BYTES, 'Replay size is outside the supported limit.');
  const bytes = new Uint8Array(buffer), view = new DataView(buffer), decoder = new TextDecoder('utf-8', {fatal:true});
  assert(decoder.decode(bytes.subarray(0,8)) === 'DACCRT1\n', 'This is not a monitor replay.');
  const size = view.getUint32(8,true), base = 12+size;
  assert(size > 0 && size <= 1024*1024 && base <= bytes.length, 'Invalid replay header size.');
  const meta = JSON.parse(decoder.decode(bytes.subarray(12,base)));
  assert(meta.format === 'dac-crt-replay' && meta.version === 1, 'Unsupported replay version.');
  assert(typeof meta.name === 'string' && meta.name.length <= 300 && finite(meta.duration, 1e-9, 1), 'Invalid replay identity or duration.');
  assert(meta.qualification === 'experimental-fixture', 'Unsupported qualification profile.');
  assert(Array.isArray(meta.limitations) && meta.limitations.length <= 30 && meta.limitations.every(s=>typeof s==='string' && s.length<=1000), 'Invalid evidence notes.');
  assert(Array.isArray(meta.components) && meta.components.length <= 2000 && meta.components.every(c=>typeof c.reference==='string' && c.reference.length<50 && typeof c.value==='string' && c.value.length<10000 && Array.isArray(c.nodes) && c.nodes.length<=20 && c.nodes.every(n=>typeof n==='string' && n.length<100)), 'Invalid circuit inventory.');
  assert(Array.isArray(meta.chunks) && meta.chunks.length >= 2 && meta.chunks.length <= 2002, 'Invalid replay chunk count.');
  const frames = []; let trace, offset = 0, lastTime = -1;
  for (const chunk of meta.chunks) {
    assert(Number.isSafeInteger(chunk.offset) && chunk.offset === offset && Number.isSafeInteger(chunk.bytes) && chunk.bytes > 0 && base+offset+chunk.bytes <= bytes.length, 'Truncated or overlapping replay chunk.');
    const data = bytes.subarray(base+offset, base+offset+chunk.bytes);
    assert(typeof chunk.sha256==='string' && /^[a-f0-9]{64}$/.test(chunk.sha256), 'Missing chunk checksum.');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');
    assert(hash === chunk.sha256, 'Replay checksum failed.');
    if (chunk.kind === 'frame') {
      assert(chunk.width === 160 && chunk.height === 112 && chunk.bytes === 160*112 && finite(chunk.time,0,meta.duration+1e-9) && chunk.time > lastTime, 'Invalid phosphor frame.');
      lastTime = chunk.time; frames.push({...chunk, data});
    } else {
      assert(chunk.kind === 'trace' && !trace && Number.isInteger(chunk.rows) && chunk.rows >= 2 && chunk.rows <= 250001 && chunk.bytes === chunk.rows*fields.length*8, 'Invalid electrical trace.');
      assert(Array.isArray(chunk.fields) && chunk.fields.length === fields.length && chunk.fields.every((f,i)=>f.name===fields[i] && typeof f.unit==='string' && f.unit.length<20), 'Unsupported trace fields.');
      const values = new Float64Array(chunk.rows*fields.length), raw = new DataView(data.buffer,data.byteOffset,data.byteLength);
      for (let i=0;i<values.length;i++) {values[i]=raw.getFloat64(i*8,true);assert(Number.isFinite(values[i]) && Math.abs(values[i])<=1e12,'Non-finite or out-of-range trace value.');}
      for(let i=0;i<chunk.rows;i++) assert(values[i*12]>=0 && values[i*12]<=meta.duration+1e-9 && (!i || values[i*12]>values[(i-1)*12]),'Invalid trace time.');
      assert(Math.abs(values[(chunk.rows-1)*12]-meta.duration)<1e-8,'Incomplete trace.');
      assert(values[0] === 0, 'Trace must start at zero.');
      for(let i=0;i<chunk.rows;i++) assert(values[i*12+7]>=0 && values[i*12+10]>0 && (values[i*12+11]===0 || values[i*12+11]===1), 'Invalid optical sample.');
      trace = {...chunk, values};
    }
    offset += chunk.bytes;
  }
  assert(base+offset === bytes.length && frames.length && trace && Math.abs(frames.at(-1).time-meta.duration)<1e-8, 'Incomplete replay.');
  assert(frames[0].time === 0, 'Phosphor frames must start at zero.');
  return {meta, frames, trace};
}

export function sampleAt(replay, time) {
  const {values,rows} = replay.trace;
  let lo=0, hi=rows-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2); if(values[mid*12]<=time)lo=mid;else hi=mid-1;}
  return values.subarray(lo*12,lo*12+12);
}

export function frameAt(replay,time) {
  let lo=0,hi=replay.frames.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(replay.frames[mid].time<=time)lo=mid;else hi=mid-1;}
  return replay.frames[lo];
}
