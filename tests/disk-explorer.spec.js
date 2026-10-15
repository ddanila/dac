import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {inspectDisk,sectorText} from '../src/disk-map.js';
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
