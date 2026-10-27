import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const file=name=>'public/analyzer/'+name+'.p1715';
test('analyzer compares captures, follows divergence, measures and exports evidence',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/analyzer.html');
 await page.click('#load-example');await expect(page.locator('#status')).toContainText('Validated');await expect(page.locator('tbody tr')).toHaveCount(100);
 await page.selectOption('#example','crc-failure');await page.click('#example-reference');await expect(page.locator('.pane')).toHaveCount(2);
 await page.click('#compare');await expect(page.locator('#comparison')).toContainText('different bus transaction');await page.click('#divergence');await expect(page.locator('#selection')).toContainText('"index": 30');
 await page.click('#cursor-a');await page.locator('.pane').last().locator('.table-wrap').focus();await page.keyboard.press('ArrowDown');await expect(page.locator('#selection')).toContainText('"index": 31');await page.click('#cursor-b');await expect(page.locator('#measurement')).toContainText('"records":2');
 await page.selectOption('#export-format','report');const dl=page.waitForEvent('download');await page.click('#export');expect((await dl).suggestedFilename()).toContain('.json');
 await page.fill('#note','CRC BAD');await page.click('#next-match');await expect(page.locator('#selection')).toContainText('CRC BAD');
 await page.screenshot({path:test.info().outputPath('analyzer-compare.png'),fullPage:true});expect(errors).toEqual([]);
});
test('raw waveforms preserve edges, support keyboard navigation and VCD export',async({page})=>{
 await page.goto('/analyzer.html');await page.selectOption('#example','raw');await page.click('#load-example');await expect(page.locator('#status')).toContainText('Raw sampled');
 await page.locator('[data-start]').fill('0');await page.click('[data-go]');await page.locator('tbody tr').first().click();await page.selectOption('#signal','wait_n');await page.click('#next-edge');await expect(page.locator('#selection')).toContainText('"index": 100');
 await page.selectOption('[data-window]','1000');await expect(page.locator('canvas')).toHaveAttribute('height','442');await page.selectOption('#export-format','vcd');const dl=page.waitForEvent('download');await page.click('#export');expect((await dl).suggestedFilename()).toContain('.vcd');
 await page.screenshot({path:test.info().outputPath('analyzer-raw.png'),fullPage:true});
});
test('invalid replacement preserves capture; ROM lookup remains explicitly static',async({page})=>{
 await page.goto('/analyzer.html');await page.locator('#capture-file').setInputFiles(file('controller'));await expect(page.locator('#status')).toContainText('Validated');
 await page.locator('#capture-file').setInputFiles({name:'bad.p1715',mimeType:'application/octet-stream',buffer:Buffer.from('bad')});await expect(page.locator('#status')).toContainText('Truncated');await expect(page.locator('tbody tr')).toHaveCount(100);
 await page.click('#fetch');await expect(page.locator('#selection')).toContainText('"kind": 1');
 await page.locator('details').filter({has:page.locator('#rom')}).evaluate(e=>e.open=true);await page.locator('#rom').setInputFiles({name:'test.rom',mimeType:'application/octet-stream',buffer:Buffer.alloc(2048)});await expect(page.locator('#rom-context')).toContainText('Static ROM 0100');await expect(page.locator('#rom-context')).toContainText('NOP');
});
test('USB UI downloads through the production C handler and disconnects cleanly',async({page})=>{
 await page.goto('/analyzer.html');await page.evaluate(async()=>{
  const lib=await(await import('/analyzer/usb-fixture.mjs')).default();lib._fixture_init();window.fixture=lib;
  const transport={async write(b){for(const n of b)lib._fixture_feed(n);},async exact(n){const a=new Uint8Array(n),p=lib._malloc(n||1);try{let o=0;while(o<n){const k=lib._fixture_read(p,Math.min(n-o,3));if(!k)throw Error('Disconnected');a.set(lib.HEAPU8.slice(p,p+k),o);o+=k;}return a;}finally{lib._free(p);}},async abort(){lib._fixture_disconnect();}};
  await window.__analyzerTestConnect(transport);
 });await page.locator('#device').evaluate(e=>e.open=true);await expect(page.locator('#arm')).toBeEnabled();await expect(page.locator('#reset-device')).toBeDisabled();await page.click('#arm');await expect(page.locator('#device-info')).toContainText('"generation": 1');
 await page.evaluate(async()=>{const b=new Uint8Array(await(await fetch('/analyzer/controller.p1715')).arrayBuffer()),l=window.fixture,p=l._malloc(b.length);l.HEAPU8.set(b,p);l._fixture_complete(p,b.length);l._free(p);});
 await page.click('#device-status');await expect(page.locator('#device-info')).toContainText('"state": 4');await page.click('#download');await expect(page.locator('#status')).toContainText('Downloaded and fully validated');await expect(page.locator('tbody tr')).toHaveCount(100);await page.click('#disconnect');await expect(page.locator('#device-info')).toContainText('Disconnected');
});
test('large imports remain cancellable and cannot replace a newer capture',async({page})=>{
 await page.goto('/analyzer.html');await page.click('#load-example');await expect(page.locator('#status')).toContainText('Validated');
 const startLarge=()=>page.evaluate(()=>{const n=4*1024*1024,b=new Uint8Array(32+n*16),v=new DataView(b.buffer);b.set([80,49,55,49,53,67,89,0]);v.setUint16(8,1,true);v.setUint16(10,16,true);v.setUint32(12,50000000,true);v.setUint32(16,n,true);v.setUint32(28,0x3fe,true);for(let i=0;i<n;i++){const o=32+i*16;b[o]=16;v.setUint16(o+6,2,true);v.setUint32(o+8,i*4,true);v.setUint32(o+12,i,true);}const dt=new DataTransfer();dt.items.add(new File([b],'large.p1715'));const input=document.getElementById('capture-file');input.files=dt.files;input.dispatchEvent(new Event('change'));});
 await startLarge();await expect(page.locator('#progress')).toBeVisible();await page.click('#cancel');await expect(page.locator('#status')).toContainText('Cancelled');await expect(page.locator('.meta')).toContainText('controller.p1715');
 await startLarge();await expect(page.locator('#progress')).toBeVisible();await page.selectOption('#example','raw');await page.click('#load-example');await expect(page.locator('.meta')).toContainText('raw.p1715');await expect(page.locator('tbody tr')).toHaveCount(100);await page.waitForTimeout(300);await expect(page.locator('.meta')).toContainText('raw.p1715');
});
