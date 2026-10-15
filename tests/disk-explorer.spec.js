import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {inspectDisk,sectorText,fileBytes,byteLocation,diskChanges} from '../src/disk-map.js';
const stock=readFileSync(new URL('../public/media/robotron/tosm10.img',import.meta.url));
test('TOS/M files map to physical sectors, extents and record-rounded contents without altering free bytes',()=>{
  const bytes=Uint8Array.from(stock),before=bytes.slice(),m=inspectDisk(bytes);
  expect(m.filesystem).toBe(true);expect(m.files).toHaveLength(23);
  const pip=m.files.find(f=>f.name==='0:SCP3.SYS');expect(pip.size).toBe(22784);
  expect(pip.sectors.map(s=>s.fileOffset).sort((a,b)=>a-b)).toEqual(Array.from({length:pip.sectors.length},(_,i)=>i*1024));
  expect(m.sectors.filter(s=>s.kind==='system')).toHaveLength(20);
  expect(m.sectors.filter(s=>s.kind==='directory')).toHaveLength(4);
  expect(sectorText(m,m.sectors.find(s=>s.kind==='free'))).toContain('Blank');
  expect(sectorText(m,pip.sectors[0])).toMatch(/^0000  [a-f0-9]{2}/);
  expect(bytes).toEqual(before);
  const bad=Uint8Array.from(stock);bad[20480+16]=1;bad[20480+17]=0;
  expect(inspectDisk(bad).filesystem).toBe(false);
  bytes[20480]=0xe5;
  expect(inspectDisk(bytes).files.length).toBeLessThan(m.files.length);
});
test('DSK physical order and container offsets survive interleaved IDs; malformed directories fall back safely',()=>{
  const image=new Uint8Array(256+2*(256+512));
  image.set(new TextEncoder().encode('EXTENDED CPC DSK File\r\nDisk-Info\r\n'));
  image[48]=1;image[49]=2;image[52]=image[53]=3;
  for(let h=0;h<2;h++){
    const p=256+h*768;image.set(new TextEncoder().encode('Track-Info\r\n'),p);image[p+17]=h;image[p+21]=2;
    for(let i=0;i<2;i++){const q=p+24+i*8;image[q+1]=h;image[q+2]=2-i;image[q+3]=1;image[q+7]=1;image.fill(65+h*2+i,p+256+i*256,p+512+i*256);}
  }
  const m=inspectDisk(image);expect(m.filesystem).toBe(false);expect(m.sectors.map(s=>s.r)).toEqual([2,1,2,1]);
  expect(sectorText(m,m.sectors[0])).toContain('AAAAAAAAAAAAAAAA');
  expect(m.sectors[2].offset).toBe(1280);
  const standard=image.slice();standard.set(new TextEncoder().encode('MV - CPCEMU Disk-File\r\nDisk-Info\r\n'));standard[50]=0;standard[51]=3;
  standard[256+20]=standard[1024+20]=1;
  expect(inspectDisk(standard).sectors.map(s=>s.offset)).toEqual(m.sectors.map(s=>s.offset));
  expect(()=>inspectDisk(image.slice(0,-1))).toThrow();
  const bad=Uint8Array.from(stock);bad[20480]=99;expect(inspectDisk(bad).filesystem).toBe(false);
  expect(inspectDisk(stock,'raw').sectors.every(s=>s.kind==='unknown')).toBe(true);
});
test('disk explorer reads the mounted worker disk, selects files and bytes, freezes and handles an empty drive',async({page})=>{
  await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed in disk-data fixture'}));
  await page.addInitScript(()=>{
    const Original=window.Worker;window.inspections=0;
    window.Worker=class extends Original{postMessage(d,...rest){if(d.type==='inspect-disk')window.inspections++;return super.postMessage(d,...rest);}};
  });
  await page.goto('/');
  await page.locator('#media-controls').evaluate(e=>e.open=true);
  await page.locator('#historical').click();
  await expect(page.locator('#power')).toBeEnabled();
  await page.locator('#explore-disk-0').click();
  const dialog=page.locator('#disk-explorer');await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-status]')).toContainText('free space is displayed blank');
  await dialog.locator('[data-live]').uncheck();
  const count=await page.evaluate(()=>window.inspections);
  await page.waitForTimeout(1700);
  expect(await page.evaluate(()=>window.inspections)).toBe(count);
  await dialog.locator('[data-refresh]').click();
  await expect.poll(()=>page.evaluate(()=>window.inspections)).toBe(count+1);
  await dialog.locator('[data-files]').selectOption('0:PIP.COM');
  await expect(dialog.locator('[data-sector-info]')).toContainText('PIP.COM');
  await expect(dialog.locator('[data-bytes]')).toContainText('0000');
  await dialog.locator('[data-byte="3"]').click();
  await expect(dialog.locator('[data-byte-info]')).toContainText('directory entry');
  await expect(dialog.locator('[data-byte-info]')).toContainText('offset 3');
  await dialog.locator('[data-byte="3"]').press('ArrowRight');
  await expect(dialog.locator('[data-byte-info]')).toContainText('offset 4');
  await dialog.locator('[data-preview]').click();
  await expect(dialog.locator('[data-preview-info]')).toContainText('10240 bytes');
  await dialog.locator('[data-preview-mode]').selectOption('hex');
  await expect(dialog.locator('[data-preview-bytes]')).toContainText('0000');
  const downloadPromise=page.waitForEvent('download');await dialog.locator('[data-download]').click();
  const download=await downloadPromise;expect(download.suggestedFilename()).toBe('0_PIP.COM');
  const downloaded=readFileSync(await download.path());expect(downloaded.length).toBe(10240);expect([...downloaded.subarray(0,4)]).toEqual([0xc9,0,0x22,0xc9]);
  await dialog.locator('[data-allocation]').evaluate(e=>e.open=true);
  await expect(dialog.locator('[data-extents]')).toContainText('extent 0');
  await page.screenshot({path:'/tmp/dac-disk-explorer-file.png'});
  await page.setViewportSize({width:390,height:844});
  expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.setViewportSize({width:1280,height:900});
  await dialog.locator('[data-side]').selectOption('1');
  await dialog.locator('[data-cylinder]').fill('79');await dialog.locator('[data-cylinder]').press('Tab');
  await expect(dialog.locator('[data-bytes]')).toContainText('Blank');
  await page.screenshot({path:'/tmp/dac-disk-explorer.png'});
  await dialog.locator('[data-unit]').selectOption('1');
  await expect(dialog.locator('[data-status]')).toContainText('No disk');
  await expect(dialog.locator('[data-bytes]')).toBeEmpty();
  await dialog.locator('[data-close]').click();await expect(dialog).not.toBeVisible();
});

test('fragmented extents reconstruct in file order; padding and missing extents are distinguished',()=>{
  const bytes=Uint8Array.from(stock);bytes.fill(0xe5,20480,24576);
  const blocks=[12,8,44,7,29,60,20,13];
  function entry(index,extent,records,list){
    const e=bytes.subarray(20480+index*32,20480+(index+1)*32);e.fill(0);e.set(new TextEncoder().encode('FRAGMENTBIN'),1);e[12]=extent;e[15]=records;
    list.forEach((block,j)=>{e[16+j*2]=block;bytes.fill(block,20480+block*2048,20480+(block+1)*2048);});
  }
  entry(0,1,1,[10]);entry(1,0,128,blocks);
  const map=inspectDisk(bytes),file=map.files[0],out=fileBytes(map,file);
  expect(out.length).toBe(16512);blocks.forEach((block,i)=>expect(out[i*2048]).toBe(block));expect(out[16384]).toBe(10);
  const tail=file.sectors.find(s=>s.fileOffset===16384);
  expect(byteLocation(tail,127).fileOffset).toBe(16511);expect(byteLocation(tail,128).fileOffset).toBeNull();
  expect(byteLocation(tail,-1)).toBeNull();
  bytes[20480+32]=0xe5;const missing=inspectDisk(bytes);expect(()=>fileBytes(missing,missing.files[0])).toThrow('missing extents');
});
test('timing uses the emulator byte-clock layout and changed allocations do not expose stale free data',()=>{
  const before=inspectDisk(stock),first=before.sectors[0],second=before.sectors[1];
  expect(first.idStart*6250).toBeCloseTo(162,8);expect(first.dataStart*6250).toBeCloseTo(206,8);expect(first.dataEnd*6250).toBeCloseTo(1230,8);
  expect(second.idStart*6250).toBeCloseTo(1275,8);expect(second.dataStart*6250).toBeCloseTo(1319,8);
  const bytes=Uint8Array.from(stock),file=before.files.find(f=>f.name==='0:PIP.COM'),sector=file.sectors[0];bytes[sector.offset]^=1;
  const changed=diskChanges(before,inspectDisk(bytes));expect(changed.sectors).toEqual([`${sector.c}:${sector.h}:${sector.slot}`]);expect(changed.files).toContain(file.key);
  const entry=before.files[0].extents[0].index;bytes[20480+entry*32]=0xe5;
  const deletion=diskChanges(before,inspectDisk(bytes));expect(deletion.entries).toContain(entry);expect(deletion.files).toContain(before.files[0].key);
  const free=before.sectors.find(s=>s.kind==='free'),freeBytes=Uint8Array.from(stock);freeBytes[free.offset]^=1;
  expect(diskChanges(before,inspectDisk(freeBytes)).sectors).toEqual([]);
});
test('track marker follows disk geometry without moving heads or other drive parts',async()=>{
  const {Group,Mesh,Vector3}=await import('three');
  const {createDiskTrackMarker}=await import('../src/disk-track-marker.js');
  const manifest=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/model.json',import.meta.url)));
  const group=new Group(),objects=new Map(),head=new Mesh();head.position.set(1,2,3);
  for(const d of manifest.driveMotion){const medium=new Mesh();medium.position.set(...d.pivot);objects.set(d.medium,medium);objects.set(d.head,head);}
  const marker=createDiskTrackMarker(group,objects,manifest.driveMotion);
  marker.select({unit:1,h:1,c:79});expect(marker.root.visible).toBe(true);
  expect(marker.root.userData.selection.radius).toBeCloseTo(34.1309167,5);
  expect(head.position.toArray()).toEqual([1,2,3]);
  const before=marker.root.position.clone();objects.get('drive-medium-1').position.add(new Vector3(10,-145,115));marker.update();
  marker.root.position.clone().sub(before).toArray().forEach((v,i)=>expect(v).toBeCloseTo([10,-145,115][i],8));
  marker.select(null);expect(marker.root.visible).toBe(false);marker.dispose();expect(group.children).toHaveLength(0);
});
test('snapshot changes flash file sectors and directory entries; angular gaps do not select payload',async({page})=>{
  await page.goto('/tests/model-harness.html');
  await page.evaluate(async(base64)=>{
    const {createDiskExplorer}=await import('/src/disk-explorer.js');
    const {inspectDisk}=await import('/src/disk-map.js');
    window.snapshot=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));window.inspectDisk=inspectDisk;
    const viewer=createDiskExplorer((unit,request)=>viewer.receive({unit,request,bytes:window.snapshot.slice().buffer}));viewer.open();
  },stock.toString('base64'));
  const dialog=page.locator('#disk-explorer');await dialog.locator('[data-live]').uncheck();
  await dialog.locator('[data-files]').selectOption('0:PIP.COM');
  await dialog.locator('[data-allocation]').evaluate(e=>e.open=true);
  await page.evaluate(()=>{const m=window.inspectDisk(window.snapshot),f=m.files.find(f=>f.name==='0:PIP.COM');window.snapshot[f.sectors[0].offset]^=1;window.snapshot[20480+f.extents[0].index*32+15]--;});
  await dialog.locator('[data-refresh]').click();
  await expect(dialog.locator('[data-changes]')).toContainText('directory entries');
  await expect(dialog.locator('[data-changes]')).toContainText('PIP.COM');
  await expect(dialog.locator('.disk-entry-changed')).toHaveCount(1);
  await expect(dialog.locator('[data-byte="0"]')).toHaveText('c8');
  await dialog.locator('[data-side]').selectOption('0');await dialog.locator('[data-cylinder]').fill('0');await dialog.locator('[data-cylinder]').press('Tab');
  const previous=await dialog.locator('[data-sector-info]').textContent();
  await dialog.locator('canvas').evaluate(canvas=>{const box=canvas.getBoundingClientRect(),r=(57.15-20*25.4/96)*5.4,a=.01*2*Math.PI-Math.PI/2;canvas.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:box.left+(360+r*Math.cos(a))*box.width/720,clientY:box.top+(360+r*Math.sin(a))*box.height/720}));});
  await expect(dialog.locator('[data-map-location]')).toContainText('Gap');
  await expect(dialog.locator('[data-sector-info]')).toHaveText(previous);
  await dialog.locator('[data-close]').click();
});
