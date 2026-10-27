import {test,expect} from '@playwright/test';
import fs from 'node:fs';
for(const backend of ['model','firmware'])test(`${backend} records a portable experiment and replays exact checkpoints`,async({page})=>{
 test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled({timeout:30000});await page.selectOption('#machine','3');await expect(page.locator('#p1715-status')).toContainText('ready');
 await page.selectOption('#p1715-backend',backend);await page.uncheck('#p1715-remember');await page.check('#experiment-record');await page.click('#power');await expect(page.locator('#p1715-status')).toContainText('Running');
 await page.locator('#debug-controls').evaluate(e=>e.open=true);await page.click('#debug-controls [data-pause]');await page.fill('#p1715-paste','DIR\n');await page.click('#p1715-type');await page.click('#p1715-cancel');await page.click('#experiment-checkpoint');await expect(page.locator('#experiment-info')).toContainText('Checkpoint recorded');
 await page.check('#experiment-inputs');const download=page.waitForEvent('download');await page.click('#experiment-export');const path=await(await download).path(),bundle=JSON.parse(fs.readFileSync(path,'utf8'));
 expect(bundle.experiment.actions.some(a=>a.type==='key')).toBe(true);expect(bundle.experiment.actions.at(-1).type).toBe('checkpoint');expect(bundle.files.map(f=>f.name)).toEqual(['initial.rom','initial.img']);
 await page.click('#power');await expect(page.locator('#p1715-status')).toContainText('Powered off');
 await page.setInputFiles('#experiment-file',{name:'session.p1715investigation',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});await expect(page.locator('#experiment-info')).toContainText('Opened');await page.click('#experiment-replay');await expect(page.locator('#experiment-info')).toContainText('all recorded checkpoints match',{timeout:120000});expect(errors).toEqual([]);
});
test('recording is opt-in and invalid bundle cannot enable replay',async({page})=>{
 await page.goto('/');await page.selectOption('#machine','3');await expect(page.locator('#p1715-status')).toContainText('ready');await expect(page.locator('#experiment-record')).not.toBeChecked();await page.click('#experiment-export');await expect(page.locator('#p1715-status')).toContainText('Power on');
 await page.setInputFiles('#experiment-file',{name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":9}')});await expect(page.locator('#p1715-status')).toContainText('Unsupported bundle');await expect(page.locator('#experiment-replay')).toBeDisabled();
});
test('analyzer bundle roundtrip retains evidence and reruns assertions',async({page})=>{
 await page.goto('/analyzer.html');await page.click('#load-example');await expect(page.locator('#status')).toContainText('Validated');await page.click('#run-assertions');await expect(page.locator('#assertion-results')).toContainText('controller-writes');
 const download=page.waitForEvent('download');await page.click('#bundle-export');const bundle=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));expect(bundle.experiment).toBeNull();expect(bundle.files.map(f=>f.name)).toEqual(['primary.p1715','report.json']);
 await page.reload();await page.setInputFiles('#bundle-file',{name:'saved.p1715investigation',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});await expect(page.locator('#investigation-identity')).toContainText('Imported portable');await expect(page.locator('#assertion-results')).toBeEmpty();await page.click('#run-assertions');await expect(page.locator('#assertion-results')).toContainText('controller-writes');
 const again=page.waitForEvent('download');await page.click('#bundle-export');const next=JSON.parse(fs.readFileSync(await(await again).path(),'utf8'));expect(next.files.map(f=>f.name)).toContain('original-report.json');
});
