import {test,expect} from '@playwright/test';
test('collection preserves bytes and references, skips duplicates and atomically rejects conflicts/corruption',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const {stored,storedKeys,saveRecord}=await import('/src/session-store.js');
  const {saveLibraryDisk}=await import('/src/disk-library.js');
  const {exportCollection,importCollection}=await import('/src/collection-backup.js');
  const id=await saveLibraryDisk('My disk',2,new Uint8Array([0,128,255]).buffer);
  await saveRecord('state:example:'+id,new Uint8Array([7,8]).buffer);
  await stored('mounts:example',[undefined,{empty:true,label:'B'}]);
  const backup=await exportCollection();
  for(const k of await storedKeys())await stored(k,null);
  const first=await importCollection(backup),second=await importCollection(backup);
  const saved=await stored(id),mounts=await stored('mounts:example');
  const bytes=Array.from(new Uint8Array(saved.bytes));
  await stored(id,{...saved,name:'Changed locally'});
  await stored('state:example:'+id,null);
  let conflict='',corrupt='';try{await importCollection(backup);}catch(e){conflict=e.message;}
  const after=await storedKeys();const damaged=backup.slice(0);new Uint8Array(damaged)[40]^=1;
  try{await importCollection(damaged);}catch(e){corrupt=e.message;}
  return {first,second,bytes,mount:mounts[1],hasState:after.includes('state:example:'+id),name:(await stored(id)).name,conflict,corrupt};
 });
 expect(result.first).toEqual({added:3,duplicates:0});expect(result.second).toEqual({added:0,duplicates:3});
 expect(result.bytes).toEqual([0,128,255]);expect(result.mount).toEqual({empty:true,label:'B'});
 expect(result.conflict).toContain('Nothing imported');expect(result.hasState).toBe(false);expect(result.name).toBe('Changed locally');expect(result.corrupt).toBeTruthy();
});
test('selective restore previews conflicts and copies disk identities with their states',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const {stored,storedKeys,saveRecord}=await import('/src/session-store.js');
  const {saveLibraryDisk}=await import('/src/disk-library.js');
  const {exportCollection,importCollection,previewCollection}=await import('/src/collection-backup.js');
  const id=await saveLibraryDisk('Original',2,new Uint8Array([1,2]).buffer),state='state:example:'+id;
  await saveRecord(state,new Uint8Array([3]).buffer);const bytes=await exportCollection();
  await stored(id,{...await stored(id),name:'Local'});
  const preview=await previewCollection(bytes);
  await importCollection(bytes,{[id]:'copy',[state]:'restore'});
  const keys=await storedKeys(),copy=keys.find(k=>k.startsWith('library:')&&k!==id);
  return {preview:preview.find(r=>r.key===id).status,local:(await stored(id)).name,copy:(await stored(copy)).name,state:!!await stored('state:example:'+copy)};
 });
 expect(result).toEqual({preview:'conflict',local:'Local',copy:'Original (restored copy)',state:true});
});
