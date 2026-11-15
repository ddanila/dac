// Atlas packages contain data only. File names are local and manifest-verified.
const safeName=/^[a-z0-9][a-z0-9-]{0,79}\.(json|mcrt)$/;
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const boundedText=(v)=>typeof v==='string'&&v.length<=2000;
export function validateAtlas(a){
  assert(a?.format==='dac-monitor-atlas-v1','Unsupported atlas version.');
  assert(boundedText(a.model_id)&&boundedText(a.revision)&&a.hardware_validation==='none','Invalid atlas identity.');
  assert(a.publication_gate?.first_release_eligible===false,'Unsupported qualification claim.');
  assert(Array.isArray(a.probes)&&a.probes.length>0&&a.probes.length<=128&&a.probes.every(p=>boundedText(p.id)&&boundedText(p.name)&&boundedText(p.unit)&&boundedText(p.source_id))&&new Set(a.probes.map(p=>p.id)).size===a.probes.length,'Invalid atlas probes.');
  const states=['accepted-simulation','unsupported','simulation-failed','indeterminate'];
  assert(Array.isArray(a.cases)&&a.cases.length>0&&a.cases.length<=200&&a.cases.every(c=>/^[a-z0-9][a-z0-9-]{0,79}$/.test(c.definition?.id)&&boundedText(c.definition.name)&&states.includes(c.status))&&new Set(a.cases.map(c=>c.definition.id)).size===a.cases.length,'Invalid atlas cases.');
  const nominal=a.cases.find(c=>c.definition.id==='nominal');
  assert(nominal?.status==='accepted-simulation','No accepted nominal model.');
  for(const c of a.cases){
    assert(c.status==='accepted-simulation'?c.replay===c.definition.id+'.mcrt':!c.replay&&!c.features,'Unqualified prediction in atlas.');
    if(c.status==='accepted-simulation'){
      assert(c.features&&Object.keys(c.features).length<=10000,'Invalid feature count.');
      assert(Object.keys(c.features).length===Object.keys(nominal.features).length,'Incompatible feature sets.');
      for(const [key,f] of Object.entries(c.features))assert(nominal.features[key]&&a.probes.some(p=>p.id===f.probe_id&&p.unit===f.unit)&&Number.isFinite(f.minimum)&&Number.isFinite(f.maximum)&&f.minimum<=f.maximum,'Invalid feature interval.');
    }
  }
  assert(Array.isArray(a.components)&&a.components.length<=2000&&a.components.every(c=>boundedText(c.source_id)&&boundedText(c.value)&&Array.isArray(c.nodes)&&c.nodes.length<=20&&c.nodes.every(boundedText)),'Invalid source connectivity.');
  assert(Array.isArray(a.limitations)&&a.limitations.length<=50&&a.limitations.every(boundedText),'Invalid atlas limitations.');
  assert(Array.isArray(a.scenario?.feature_windows)&&a.scenario.feature_windows.length<=100&&a.scenario.feature_windows.every(w=>Number.isFinite(w.start)&&Number.isFinite(w.stop)&&w.stop>w.start),'Invalid feature windows.');
  return a;
}
async function boundedFetch(url,max){
  const response=await fetch(url);assert(response.ok,'Atlas file unavailable.');
  assert(!response.headers.get('content-length')||Number(response.headers.get('content-length'))<=max,'Atlas file too large.');
  const reader=response.body.getReader(),parts=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Atlas file too large.');}parts.push(value);}
  const data=new Uint8Array(size);let offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}return data;
}
export async function openAtlas(base){
  const manifest=JSON.parse(new TextDecoder().decode(await boundedFetch(base+'manifest.json',1024*1024)));
  assert(manifest.format==='dac-monitor-atlas-manifest-v1'&&manifest.files&&Object.keys(manifest.files).length<=500,'Invalid atlas manifest.');
  async function file(name){
    assert(safeName.test(name),'Invalid atlas file name.');
    const expected=manifest.files[name];assert(expected&&Number.isInteger(expected.bytes)&&expected.bytes>0&&expected.bytes<=64*1024*1024&&/^[a-f0-9]{64}$/.test(expected.sha256),'Invalid atlas file record.');
    const data=await boundedFetch(base+name,Math.min(expected.bytes,name.endsWith('.json')?16*1024*1024:64*1024*1024));
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(v=>v.toString(16).padStart(2,'0')).join('');
    assert(data.length===expected.bytes&&hash===expected.sha256,'Atlas file checksum failed.');return data;
  }
  return {index:validateAtlas(JSON.parse(new TextDecoder().decode(await file('index.json')))),file};
}
