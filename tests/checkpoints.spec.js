import {test,expect} from '@playwright/test';
test('named checkpoints validate nested disks and survive collection backup',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const {saveCheckpoint,loadCheckpoint,checkpoints}=await import('/src/checkpoints.js');
  const {stored,digest}=await import('/src/session-store.js');
  const {exportCollection,importCollection}=await import('/src/collection-backup.js');
  const build='a'.repeat(64),bytes=new Uint8Array([1,2,3]).buffer;
  const disks=await Promise.all([4,5].map(async n=>{const bytes=new Uint8Array([n]).buffer;return {bytes,sha256:await digest(bytes),writable:true,label:'Disk'};}));
  const key=await saveCheckpoint({name:'Before format',kind:2,build,stateKey:`state:${build}:test`,firmwareIdentity:'test',bytes,disks});
  const backup=await exportCollection();await stored(key,null);await importCollection(backup);const r=await loadCheckpoint(key);
  r.disks[1].bytes=new Uint8Array([6]).buffer;await stored(key,r);let error;try{await loadCheckpoint(key);}catch(e){error=e.message;}
  return {names:(await checkpoints()).map(r=>r.name),state:[...new Uint8Array(r.bytes)],error};
 });
 expect(result.names).toEqual(['Before format']);expect(result.state).toEqual([1,2,3]);expect(result.error).toContain('disk checksum');
});
test('restore running checkpoint preserves its display and rejects a corrupted disk atomically',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed'}));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled();
 await page.locator('#media-controls').evaluate(e=>e.open=true);await page.locator('#demo').click();
 await page.locator('#power').click();await page.locator('#screen-view').click();await page.locator('#screen').focus();await page.keyboard.type('CHECKPOINT');await page.waitForTimeout(200);
 const raster=await page.locator('#screen').evaluate(e=>e.toDataURL());
 await page.locator('#checkpoint-controls').evaluate(e=>e.open=true);await page.locator('#checkpoint-name').fill('First');await page.locator('#checkpoint-save').click();await expect(page.locator('#checkpoint-status')).toContainText('saved with both disks');
 await page.locator('#screen').focus();await page.keyboard.type('CHANGED');await page.waitForTimeout(200);await page.locator('#checkpoint-restore').click();await expect(page.locator('#checkpoint-status')).toContainText('restored');
 await expect.poll(()=>page.locator('#screen').evaluate(e=>e.toDataURL())).toBe(raster);
 await page.evaluate(async()=>{const {stored,storedKeys}=await import('/src/session-store.js');const key=(await storedKeys()).find(k=>k.startsWith('checkpoint:')),r=await stored(key);r.disks[0].sha256='bad';await stored(key,r);});
 await page.locator('#checkpoint-restore').click();await expect(page.locator('#checkpoint-status')).toContainText('checksum');expect(await page.locator('#screen').evaluate(e=>e.toDataURL())).toBe(raster);
});
test('checkpoint restores both mounted disks and their protection after drive B replacement',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed'}));
 await page.addInitScript(()=>{const Base=Worker;window.Worker=class extends Base{constructor(...args){super(...args);window.coreWorker=this;}};});
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled();
 await page.locator('#drive-b-controls').evaluate(e=>e.open=true);await page.locator('#blank-b').click();await expect(page.locator('#disk-b-status')).toContainText('inserted');
 await page.locator('#power').click();await page.locator('#checkpoint-controls').evaluate(e=>e.open=true);await page.locator('#checkpoint-name').fill('Two disks');await page.locator('#checkpoint-save').click();await expect(page.locator('#checkpoint-status')).toContainText('saved with both disks');
 await page.locator('#power').click();await page.locator('#drive-b-controls').evaluate(e=>e.open=true);await page.locator('#eject-b').click();await expect(page.locator('#export-b')).toBeDisabled();
 await page.locator('#checkpoint-restore').click();await expect(page.locator('#checkpoint-status')).toContainText('restored');
 const result=await page.evaluate(async()=>{const {stored,storedKeys,digest}=await import('/src/session-store.js'),record=await stored((await storedKeys()).find(k=>k.startsWith('checkpoint:')));const matches=[];for(const unit of [0,1]){const bytes=await new Promise(resolve=>{const listener=({data})=>{if(data.type==='disk-inspection'&&data.request===99+unit){window.coreWorker.removeEventListener('message',listener);resolve(data.bytes);}};window.coreWorker.addEventListener('message',listener);window.coreWorker.postMessage({type:'inspect-disk',unit,request:99+unit});});matches.push(await digest(bytes)===record.disks[unit].sha256);}return matches;});expect(result).toEqual([true,true]);await expect(page.locator('#remember-disk')).not.toBeChecked();
 await page.locator('#session-controls').evaluate(e=>e.open=true);await page.locator('#remember-disk').check();await page.locator('#power').click();await page.reload();await expect(page.locator('#power')).toBeEnabled();await page.locator('#drive-b-controls').evaluate(e=>e.open=true);await expect(page.locator('#export-b')).toBeEnabled();
});
