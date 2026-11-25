// Profile names and stable IDs come from the selected core, not a duplicate UI registry.
function string(core, pointer) {
  if (!pointer) return '';
  let end=pointer;while(core.HEAPU8[end])end++;
  return new TextDecoder().decode(core.HEAPU8.subarray(pointer,end));
}
export function jukuProfiles(core) {
  if (!core._dac_juku_profile_count) return [{id:'mainboard-juku',name:'Mainboard FD1793 / Juku',firmware:'EKTA #0031, #0037'}];
  return Array.from({length:core._dac_juku_profile_count()},(_,i)=>({
    id:string(core,core._dac_juku_profile_id(i)),name:string(core,core._dac_juku_profile_name(i)),
    firmware:string(core,core._dac_juku_profile_firmware(i)),
  }));
}
export const defaultJukuProfile='mainboard-juku';
export function applyJukuProfile(core,handle,kind,id=defaultJukuProfile) {
  if(kind!==0)return;
  const index=jukuProfiles(core).findIndex(p=>p.id===id);
  if(index<0 || (!core._dac_juku_set_profile && index!==0))throw Error('This emulator build does not support the selected Juku profile.');
  if(core._dac_juku_set_profile?.(handle,index)<0)throw Error('Power off before changing the Juku profile.');
}
export function validJukuProfile(id) {return id===undefined || (typeof id==='string' && /^[a-z][a-z0-9-]{0,63}$/.test(id));}
export function profileQualification(id) {
  if(id==='card-at')return 'Checksum-corrected #0043: EKDOS boot and file I/O verified. Original ROM fails its checksum; adapter wiring is inferred from firmware.';
  if(id==='single-density')return 'Generated FM diagnostics; no historical FD1792 ROM/disk pairing verified.';
  if(id==='early-juku')return 'Generated bootstrap verified; a compatible historical operating-system disk is still needed.';
  if(id==='card-juku')return 'Historical EKDOS file I/O verified; card wiring is inferred from firmware.';
  return 'Historical EKDOS boot and file I/O verified.';
}
