import {test,expect} from '@playwright/test';
import {compareDisks} from '../src/disk-comparison.js';
test('disk comparison retains byte changes, deletions and bounded range exports',()=>{
 const a=new Uint8Array([0,1,2,3]),b=new Uint8Array([0,9,8]);const r=compareDisks(a.buffer,b.buffer,'raw');expect(r.changedBytes).toBe(3);expect(r.ranges).toEqual([{offset:1,before:'010203',after:'0908'}]);expect(r.rangesTruncated).toBe(false);
 const x=new Uint8Array(10000),y=x.map((_,i)=>i%2);const large=compareDisks(x.buffer,y.buffer,'raw');expect(large.changedBytes).toBe(5000);expect(large.ranges).toHaveLength(4096);expect(large.rangesTruncated).toBe(true);
});
test('original baseline survives dialog reopen and is exported with the collection',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed'}));await page.goto('/');await expect(page.locator('#power')).toBeEnabled();await page.locator('#explore-disk-0').click();
 const dialog=page.locator('#disk-explorer');await expect(dialog.locator('[data-status]')).toContainText('free space');await dialog.locator('details').filter({has:page.locator('[data-original]')}).evaluate(e=>e.open=true);
 await dialog.locator('[data-original]').click();await expect(dialog.locator('[data-result]')).toContainText('Baseline saved');await dialog.locator('[data-compare]').click();await expect(dialog.locator('[data-result]')).toContainText('0 changed bytes');await dialog.locator('[data-close]').click();await page.locator('#explore-disk-0').click();await dialog.locator('[data-compare]').click();await expect(dialog.locator('[data-result]')).toContainText('0 changed bytes');
 const names=await page.evaluate(async()=>{const {exportCollection,previewCollection}=await import('/src/collection-backup.js');return (await previewCollection(await exportCollection())).map(r=>r.key);});expect(names).toContain('comparison:0');
});
test('filesystem comparison distinguishes content edits and deleted directory entries',async()=>{
 const {readFile}=await import('node:fs/promises'),{inspectDisk}=await import('../src/disk-map.js');const a=Uint8Array.from(await readFile(new URL('../public/media/robotron/tosm10.img',import.meta.url))),map=inspectDisk(a),file=map.files[0],b=a.slice();b[file.sectors[0].offset]^=1;
 const modified=compareDisks(a.buffer,b.buffer);expect(modified.files.modified).toContain(file.key);expect(modified.changedBytes).toBe(1);expect(modified.directoryEntries).toEqual([]);
 const c=a.slice();for(const entry of file.extents)c[20480+entry.index*32]=0xe5;const deleted=compareDisks(a.buffer,c.buffer);expect(deleted.files.deleted).toContain(file.key);expect(deleted.directoryEntries).toEqual(file.extents.map(e=>e.index));
});
