import {test,expect} from '@playwright/test';
test('electrical disconnection is opt-in, blanks video and preserves running guest',async({page})=>{
 await page.goto('/?activity=printer');await expect(page.locator('#power')).toBeEnabled({timeout:30000});
 await page.locator('#media-controls summary').click();await page.locator('#demo').click();
 await expect(page.locator('#media-label')).toHaveText('DAC diagnostic ROM');await page.locator('#power').click();
 await page.locator('#electrical-panel summary').click();await expect(page.locator('#electrical-monitor')).toBeDisabled();
 await page.locator('#electrical-enable').check();await page.locator('#electrical-keyboard').uncheck();
 await expect(page.locator('#electrical-status')).toContainText('keyboard disconnected');
 await page.locator('#electrical-monitor').uncheck();
 await expect(page.locator('#viewport')).toHaveAttribute('data-electrical','3');
 const colours=()=>page.evaluate(()=>{const c=document.querySelector('#screen');return new Set(new Uint32Array(c.getContext('2d').getImageData(0,0,c.width,c.height).data.buffer)).size;});
 await expect.poll(colours).toBe(1);await expect(page.locator('#status')).toHaveText('Running');
 await page.locator('#reset').click();await expect(page.locator('#viewport')).toHaveAttribute('data-electrical','3');
 await page.locator('#electrical-enable').uncheck();await expect(page.locator('#electrical-status')).toHaveText('Connections intact.');
 await expect.poll(colours).toBeGreaterThan(1);
 await page.locator('#circuit-panel summary').click();await page.locator('[data-circuit="A3"]').click();
 await expect(page.locator('#detail-description')).toContainText('Stromlaufplan D.jpg');
 await expect(page.locator('#detail-description')).toContainText('CTSB/DCDB');
 await expect(page.locator('#detail-drawing')).toHaveAttribute('href','https://xepb.org/robotron/docs/1715w.zip');
});

test('older frames cannot undo a pending reconnection checkbox click',async({page})=>{
 await page.goto('/tests/model-harness.html');
 await page.evaluate(async()=>{document.body.innerHTML='<div id="serial-panel"></div><div id="viewport"></div>';const {createElectricalPanel}=await import('/src/robotron-experiments.js');window.sent=[];window.panel=createElectricalPanel(d=>window.sent.push(d));window.panel.frame({serialSupported:true,cables:3},false);});
 await page.locator('#electrical-enable').uncheck();
 await page.evaluate(()=>window.panel.frame({serialSupported:true,cables:3},false));
 await expect(page.locator('#electrical-enable')).not.toBeChecked();await expect(page.locator('#electrical-keyboard')).toBeChecked();
 await page.evaluate(()=>window.panel.frame({serialSupported:true,cables:0},false));
 await expect(page.locator('#electrical-status')).toHaveText('Connections intact.');
 expect(await page.evaluate(()=>window.sent)).toEqual([{type:'cables',value:0}]);
});
