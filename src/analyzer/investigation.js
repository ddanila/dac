// SPDX-License-Identifier: MIT
import {matches,validateMatcher} from './assertions.js';
import {KINDS} from './capture.js';
export function validateMetadata(c,m){
 if(!m||m.schema!==1||m.capture_sha256!==c.summary.sha256)throw Error('Metadata does not identify this capture');
 if(!Number.isSafeInteger(m.start_clock)||!Number.isSafeInteger(m.end_clock)||m.start_clock<0||m.end_clock<m.start_clock||!Number.isFinite(m.clock_hz)||m.clock_hz<=0)throw Error('Invalid session clock range');
 if(!Array.isArray(m.observations)||m.observations.length>10000)throw Error('Invalid observation list');
 let previous=m.start_clock;
 for(const o of m.observations){if(!['screen','reset-action','disk-export'].includes(o.kind)||!Number.isSafeInteger(o.clock)||o.clock<previous||o.clock>m.end_clock||typeof o.detail!=='string'||o.detail.length>4096)throw Error('Invalid session observation');previous=o.clock;}
 return m;
}
export async function investigate(c,metadata,profiles,selection='auto',check=()=>{}){
 if(metadata)validateMetadata(c,metadata);
 if(!profiles||profiles.schema!==1||!Array.isArray(profiles.profiles))throw Error('Invalid boot profile catalog');
 const exact=p=>metadata&&metadata.rom_sha256===p.rom_sha256&&p.disk_sha256.includes(metadata.disk_sha256)&&metadata.writes_at_start===0;
 const profile=selection==='auto'?profiles.profiles.find(exact):profiles.profiles.find(p=>p.id===selection);
 if(selection!=='auto'&&!profile)throw Error('Unknown selected boot profile');
 const qualified=!!profile&&!!exact(profile);
 const generic=[{id:'io',label:'Controller I/O observed',event:{kind:'io_read',address:0,addressMask:252}},{id:'irq',label:'Interrupt acknowledged',event:{kind:'interrupt_ack'}}];
 const stages=(profile?.stages||generic).map(s=>({...s,outcome:'not reached within recorded window',evidence:null}));
 for(const s of stages){if(s.event){validateMatcher(s.event);if(c.header.type!=='compact'||!(c.header.capture_mask&(1<<KINDS.indexOf(s.event.kind))))s.outcome='unavailable from this capture';}else{
  s.outcome='unavailable from this capture';
  if(metadata){const found=metadata.observations.find(o=>s.observation===o.kind&&(!s.contains||o.detail.includes(s.contains)));if(found){s.outcome='observed';s.evidence={observation:metadata.observations.indexOf(found),clock:found.clock,detail:found.kind==='screen'?'Console snapshot contains '+s.contains:found.detail};}}
 }}
 if(c.header.type==='compact')for await(const r of c.events(0,c.header.count,check)){
  for(const s of stages)if(s.event&&!s.evidence&&s.outcome!=='unavailable from this capture'&&matches(r,s.event)){s.outcome='observed';s.evidence={record:r.index,time_us:r.elapsed_us};}
 }
 for(const s of stages){if(profile&&!qualified){s.outcome='unavailable from this capture';s.reason='Profile identity mismatch; candidate evidence is unqualified';}else if(c.header.dropped&&s.outcome!=='unavailable from this capture'){s.reason='Capture has loss; stage observation does not establish complete execution';}}
 return {schema:1,capture_sha256:c.summary.sha256,profile:profile?.id??null,profile_revision:profile?.revision??null,qualified_profile:qualified,identity:metadata?{rom_sha256:metadata.rom_sha256,disk_sha256:metadata.disk_sha256,backend:metadata.backend,build:metadata.build}:null,stages,limitations:['Observed address fetches do not prove instruction completion or OS success.','Console observations are sampled emulator evidence, not physical video measurements.','Hardware-only captures cannot establish console readiness without separate evidence.']};
}
