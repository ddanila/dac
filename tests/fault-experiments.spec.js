import {test,expect} from '@playwright/test';
import fs from 'node:fs';
for(const backend of ['model','firmware'])test(`${backend} fault scenario produces analysis and a replayable evidence bundle`,async({page})=>{
 test.setTimeout(180000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled({timeout:30000});await page.selectOption('#machine','3');await expect(page.locator('#p1715-status')).toContainText('ready');await page.selectOption('#p1715-backend',backend);await page.uncheck('#p1715-remember');
 await page.fill('#experiment-seconds','1');await page.click('#experiment-scenario-run');await expect(page.locator('#experiment-info')).toContainText('Assertions:',{timeout:120000});await expect(page.locator('#capture-info')).toContainText('Complete');
 const download=page.waitForEvent('download');await page.click('#experiment-export');const bundle=JSON.parse(fs.readFileSync(await(await download).path(),'utf8'));expect(bundle.experiment.scenario).toBe('crc');expect(bundle.experiment.actions.some(a=>a.type==='fault'&&a.fault==='crc')).toBe(true);expect(bundle.files.map(f=>f.name)).toEqual(['capture.p1715','capture.metadata.json','report.json']);expect(errors).toEqual([]);
});
