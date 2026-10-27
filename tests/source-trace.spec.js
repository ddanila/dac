import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
test('trace source interpretation checks identities, mapping and observed operands',async({page})=>{
 const binary=Buffer.from([0x3e,0x41]),text='ld a,65\n',hash=b=>createHash('sha256').update(b).digest('hex');
 const map={schema:1,kind:'pico1715-source-map',base:256,space:'ram',binary_sha256:hash(binary),binary_size:2,source:{name:'demo.asm',text,sha256:hash(text)},entries:[{address:256,length:2,line:1,code:true}],symbols:[{name:'entry',address:256}]};
 const capture=Buffer.alloc(32+3*16);capture.write('P1715CY\0');capture.writeUInt16LE(1,8);capture.writeUInt16LE(16,10);capture.writeUInt32LE(50000000,12);capture.writeUInt32LE(3,16);capture.writeUInt32LE(0x3fe,28);
 [[5,0x28,0],[1,256,0x3e],[2,257,65]].forEach(([kind,address,data],i)=>{const o=32+i*16;capture[o]=kind<<4;capture[o+1]=data;capture.writeUInt16LE(address,o+2);capture.writeUInt16LE(4,o+6);capture.writeUInt32LE(i*100,o+8);capture.writeUInt32LE(i,o+12);});
 await page.goto('/analyzer.html');await page.setInputFiles('#capture-file',{name:'source.p1715',mimeType:'application/octet-stream',buffer:capture});await expect(page.locator('#status')).toContainText('Validated');
 await page.setInputFiles('#source-map',{name:'map.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(map))});await page.setInputFiles('#source-binary',{name:'demo.bin',mimeType:'application/octet-stream',buffer:binary});await page.click('#source-load');await expect(page.locator('#source-status')).toContainText('Verified');await page.locator('[data-index="1"]').click();await expect(page.locator('#source-context')).toContainText('candidate');await expect(page.locator('#source-context')).toContainText('ld a,65');
 await page.setInputFiles('#source-binary',{name:'wrong.bin',mimeType:'application/octet-stream',buffer:Buffer.from([0,0])});await page.click('#source-load');await expect(page.locator('#status')).toContainText('identity mismatch');
});
test('built-in platform and diagnostic source maps match published binaries',async({page})=>{
 await page.goto('/analyzer.html');await page.click('#load-example');await expect(page.locator('#status')).toContainText('Validated');
 for(const profile of ['platform','diagnostics']){await page.selectOption('#source-profile',profile);await page.click('#source-preset');await expect(page.locator('#source-status')).toContainText('Verified binary/source identities');await expect(page.locator('#source-symbol option').first()).toBeAttached();}
});
