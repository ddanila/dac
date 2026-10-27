import {test,expect} from '@playwright/test';
import fs from 'node:fs';
test('assertions run in worker and export reproducible investigation evidence',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/analyzer.html');await page.click('#load-example');await expect(page.locator('#status')).toContainText('Validated');
 await page.click('#investigate');await expect(page.locator('#investigation-identity')).toContainText('Generic');await expect(page.locator('#boot-stages')).toContainText('observed');
 await page.click('#run-assertions');await expect(page.locator('#assertion-results')).toContainText('controller-writes');
 const download=page.waitForEvent('download');await page.click('#investigation-export');const data=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));expect(data.capture.sha256).toHaveLength(64);expect(data.assertions.capture_sha256).toBe(data.capture.sha256);expect(data.suite.schema).toBe(1);expect(errors).toEqual([]);
});
test('metadata mismatch is rejected and switching captures clears shown results',async({page})=>{
 await page.goto('/analyzer.html');await page.click('#load-example');await expect(page.locator('#status')).toContainText('Validated');
 await page.setInputFiles('#investigation-metadata',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:1,capture_sha256:'bad'}))});await expect(page.locator('#status')).toContainText('does not identify');
 await page.click('#run-assertions');await expect(page.locator('#assertion-results')).toContainText('controller-writes');await page.selectOption('#example','raw');await page.click('#load-example');await expect(page.locator('#assertion-results')).toBeEmpty();await page.click('#run-assertions');await expect(page.locator('#assertion-results')).toContainText('not applicable');
});
for(const backend of ['model','firmware'])test(`${backend} bounded emulator capture opens analyzer with metadata`,async({page,context})=>{
 test.setTimeout(180000);const requests=[];page.on('request',r=>requests.push(new URL(r.url())));const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled({timeout:30000});await page.selectOption('#machine','3');await expect(page.locator('#p1715-status')).toContainText('ready');await page.selectOption('#p1715-backend',backend);await page.click('#power');
 await expect(page.locator('#p1715-status')).toContainText('Running');await page.fill('#capture-seconds','0.02');await page.selectOption('#capture-filter','full');await page.click('#capture-reset');await expect(page.locator('#capture-info')).toContainText('Complete',{timeout:60000});
 const popup=context.waitForEvent('page');await page.click('#capture-open');const analyzer=await popup;analyzer.on('pageerror',e=>errors.push(e.message));await expect(analyzer.locator('#investigation-identity')).toContainText('Imported emulator capture',{timeout:30000});await analyzer.click('#investigate');await expect(analyzer.locator('#investigation-identity')).toContainText('exact input identity');await expect(analyzer.locator('#boot-stages')).toContainText('Emulator reset requested: observed');await expect(analyzer.locator('#boot-stages')).not.toContainText('Console readiness observed: observed');
 await analyzer.click('#run-assertions');await expect(analyzer.locator('#assertion-results')).toContainText('controller-writes');expect(errors).toEqual([]);
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/pico1715/manifest.json',import.meta.url),'utf8'));for(const ext of ['mjs','wasm']){const name=`pico1715-${backend}.${ext}`;expect(requests.some(u=>u.pathname.endsWith('/'+name)&&u.searchParams.get('sha256')===manifest.sha256[name])).toBe(true);}
});
