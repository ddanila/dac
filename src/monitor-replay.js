// Binary replay reader. Imported recordings contain data only, never code/URLs.
export const MAX_BYTES = 64 * 1024 * 1024;
const fields = ['time','collector','anode','focus','horizontal','vertical','cathode','beam','x','y','sigma','landed'];
function assert(condition, message) { if (!condition) throw Error(message); }
function finite(value, lo, hi) {return typeof value === 'number' && Number.isFinite(value) && value >= lo && value <= hi;}
export async function readReplay(buffer) {
  assert(buffer instanceof ArrayBuffer && buffer.byteLength >= 12 && buffer.byteLength <= MAX_BYTES, 'Replay size is outside the supported limit.');
  const bytes = new Uint8Array(buffer), view = new DataView(buffer), decoder = new TextDecoder('utf-8', {fatal:true});
  const magic=decoder.decode(bytes.subarray(0,8));
  assert(['DACCRT1\n','DACCRT2\n','DACCRT3\n'].includes(magic), 'This is not a monitor replay.');
  const size = view.getUint32(8,true), base = 12+size;
  assert(size > 0 && size <= 1024*1024 && base <= bytes.length, 'Invalid replay header size.');
  const meta = JSON.parse(decoder.decode(bytes.subarray(12,base)));
  assert(meta.format === 'dac-crt-replay' && [1,2,3].includes(meta.version) && magic===`DACCRT${meta.version}\n`, 'Unsupported replay version.');
  assert(typeof meta.name === 'string' && meta.name.length <= 300 && finite(meta.duration, 1e-9, meta.version===2?120:1), 'Invalid replay identity or duration.');
  const start=meta.version===1?0:meta.start_time,end=meta.version===1?meta.duration:meta.end_time;
  assert(finite(start,0,meta.version===3?3600:120) && finite(end,start+1e-9,meta.version===3?3600:120) && Math.abs(end-start-meta.duration)<1e-8,'Invalid recording window.');
  const fullPath=meta.version===3 && meta.qualification==='experimental-full-path';
  assert(fullPath || meta.qualification === (meta.version===1?'experimental-fixture':meta.version===2?'bounded-stage':'experimental-optical-bench'), 'Unsupported qualification profile.');
  if(fullPath){
    assert(['assembly_complete','numerical_acceptance','thermal_equilibrium','electrical_stability','optical_stability'].every(k=>meta[k]===true) && meta.specimen_validated===false && meta.initialization==='thermal-equilibrium' && meta.field_count===16,'Incomplete experimental full-path acceptance.');
    assert(typeof meta.transformer_candidate==='string' && meta.transformer_candidate.length>0 && meta.transformer_candidate.length<=200 && typeof meta.hashes?.capture==='string' && /^[a-f0-9]{64}$/.test(meta.hashes.capture),'Missing full-path provenance.');
  }
  if(meta.version===3){
    assert(meta.full_monitor_qualified===false,'Unsupported full-monitor qualification.');
    const display=meta.display;
    assert(display && display.transfer==='srgb' && display.pixel_aspect===1 && finite(display.exposure_m2_per_w,1e-12,1e12) && finite(display.screen_width_m,.001,10) && finite(display.screen_height_m,.001,10) && typeof display.comparison_key==='string' && /^[a-f0-9]{64}$/.test(display.comparison_key),'Invalid display calibration.');
    assert(Array.isArray(meta.rays) && meta.rays.length<=32 && meta.rays.every((r,i)=>r && finite(r.time,start,end) && (!i || r.time>meta.rays[i-1].time) && typeof r.landed==='boolean' && typeof r.reason==='string' && r.reason.length<=100 && Array.isArray(r.points) && r.points.length<=10000 && r.points.every(p=>Array.isArray(p) && p.length===3 && p.every(v=>finite(v,-10,10)))),'Invalid recorded ray.');
  }
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
      assert((meta.version===3 ? Number.isInteger(chunk.width) && Number.isInteger(chunk.height) && chunk.width>=8 && chunk.height>=8 && chunk.width<=2048 && chunk.height<=2048 && chunk.width*chunk.height<=1048576 : chunk.width===160 && chunk.height===112) && chunk.bytes===chunk.width*chunk.height && finite(chunk.time,start,end+1e-9) && chunk.time>lastTime, 'Invalid phosphor frame.');
      assert(!frames.length || (chunk.width===frames[0].width && chunk.height===frames[0].height),'Inconsistent phosphor dimensions.');
      lastTime = chunk.time; frames.push({...chunk, data});
    } else {
      assert(Array.isArray(chunk.fields) && chunk.fields.length>=2 && chunk.fields.length<=128 && chunk.fields[0].name==='time' && chunk.fields[0].unit==='s' && chunk.fields.every(f=>typeof f.name==='string' && /^[a-zA-Z_][a-zA-Z_0-9]{0,63}$/.test(f.name) && typeof f.unit==='string' && f.unit.length<20) && new Set(chunk.fields.map(f=>f.name)).size===chunk.fields.length, 'Unsupported trace fields.');
      const stride=chunk.fields.length;
      const identities=chunk.fields.filter(f=>f.id!==undefined);
      assert(identities.every(f=>typeof f.id==='string' && f.id.length>0 && f.id.length<=200) && new Set(identities.map(f=>f.id)).size===identities.length,'Invalid probe identities.');
      assert(chunk.kind === 'trace' && !trace && Number.isInteger(chunk.rows) && chunk.rows >= 2 && chunk.rows <= 250001 && chunk.bytes === chunk.rows*stride*8, 'Invalid electrical trace.');
      assert(meta.version!==1 || (stride===fields.length && chunk.fields.every((f,i)=>f.name===fields[i])), 'Unsupported trace fields.');
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
    if(fullPath){
      assert(frames.length===16,'Expected sixteen sustained phosphor fields.');
      const period=meta.duration/16;
      assert(frames.every((frame,i)=>Math.abs(frame.time-(start+(i+1)*period))<Math.max(1e-12,period*.01)),'Unstable sustained field timing.');
    }
    else assert(Math.abs(frames[0].time-start)<1e-12, 'Phosphor frames must start at the recording window.');
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

export function matchingProbe(primary, other, field) {
  const probe=primary.trace.fields[field];
  if(primary===other)return field;
  // Legacy fixture fields belong only to the v1 fixture contract. V2 stage
  // labels such as "collector" must never alias a different circuit's node.
  if(primary.meta.version===1 || other.meta.version===1){
    if(primary.meta.version!==other.meta.version)return -1;
    return other.trace.fields.findIndex(f=>f.name===probe.name && f.unit===probe.unit);
  }
  if(primary.meta.model_id!==other.meta.model_id)return -1;
  return other.trace.fields.findIndex(f=>f.unit===probe.unit && (probe.id && f.id
    ? probe.id===f.id : probe.source_id && probe.source_id===f.source_id && probe.name===f.name));
}

export function matchingDisplay(primary,other){
  if(primary.meta.version===3 || other.meta.version===3){
    if(primary.meta.version!==3 || other.meta.version!==3)return false;
    const a=primary.meta.display,b=other.meta.display;
    return a.comparison_key===b.comparison_key && a.transfer===b.transfer && a.exposure_m2_per_w===b.exposure_m2_per_w && a.screen_width_m===b.screen_width_m && a.screen_height_m===b.screen_height_m && primary.frames[0]?.width===other.frames[0]?.width && primary.frames[0]?.height===other.frames[0]?.height;
  }
  return true;
}
