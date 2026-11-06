import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {WORDS,S600,validateCapture,region,role} from '../src/keyboard-dive-model.js';
async function ready(page){
 await page.route('**/models/robotron-1715m/model.json?*',route=>route.fulfill({status:503,body:'Keyboard execution fixture omits CAD loading'}));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled({timeout:30000});
}

test('guided keyboard journey connects firmware, wire, receiver and display',async({page},testInfo)=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:1000});
 await ready(page);
 await page.locator('#keyboard-dive-open').click();
 await page.getByRole('button',{name:'Explore a keypress',exact:true}).click();
 await expect(page.locator('.keyboard-dive [data-status]')).toContainText('capture stopped',{timeout:120000});
 await expect(page.locator('.dive-bytes')).toContainText('61h');
 await page.locator('.dive-journey button[data-kind="6"]').click();
 await expect(page.locator('.keyboard-dive [data-explanation]')).toContainText('Receiver completed');
 await page.locator('.dive-journey button[data-kind="10"]').click();
 await expect(page.locator('.keyboard-dive [data-explanation]')).toContainText('Display row');
 await page.screenshot({path:testInfo.outputPath('keyboard-dive-desktop.png'),fullPage:false});
 await page.locator('.dive-journey button[data-kind="4"]').click();
 await page.locator('.dive-signals').scrollIntoViewIfNeeded();
 await page.screenshot({path:testInfo.outputPath('keyboard-dive-signals.png')});
 await page.setViewportSize({width:390,height:844});
 await page.locator('.dive-header').scrollIntoViewIfNeeded();
 await page.screenshot({path:testInfo.outputPath('keyboard-dive-mobile.png')});
 expect(await page.locator('.keyboard-dive').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.setViewportSize({width:1440,height:1000});
 const downloadPromise=page.waitForEvent('download');await page.locator('.keyboard-dive [data-export]').click();const download=await downloadPromise;
 const path=await download.path(),capture=JSON.parse(await readFile(path,'utf8'));
 expect(capture.identity.romSha256).toBe(S600);expect(capture.status).toBe(2);
 const kinds=new Set();for(let i=2;i<capture.words.length;i+=WORDS)kinds.add(capture.words[i]);
 expect([...kinds]).toEqual(expect.arrayContaining([1,2,3,4,5,6,7,8,9,10,11]));
 await page.locator('.keyboard-dive [data-import]').setInputFiles(path);
 await expect(page.locator('.keyboard-dive [data-status]')).toContainText('Imported');
 await page.locator('.dive-journey button[data-kind="6"]').click();await expect(page.locator('.keyboard-dive [data-explanation]')).toContainText('Receiver completed');
 expect(errors).toEqual([]);
});

for(const [scenario,expected]of [['shift','41h'],['ctrl','E1h'],['caps',null],['siso',null],['enter','9Eh'],['repeat','61h']]){
 test(`guided ${scenario} keeps real firmware outcomes visible`,async({page})=>{
  test.setTimeout(120000);await ready(page);await page.locator('#keyboard-dive-open').click();
  await page.locator('.keyboard-dive [data-scenario]').selectOption(scenario);await page.locator('.keyboard-dive [data-guide]').click();
  await expect(page.locator('.keyboard-dive [data-status]')).toContainText('capture stopped',{timeout:90000});
  if(scenario==='caps')await expect(page.locator('.keyboard-dive [data-leds]')).toContainText('Endpoint display: Caps on · SI/SO off');
  if(scenario==='siso')await expect(page.locator('.keyboard-dive [data-leds]')).toContainText('Endpoint display: Caps off · SI/SO on');
  if(expected)await expect(page.locator('.dive-bytes')).toContainText(expected);
  if(scenario==='repeat'){
   expect(await page.locator('.dive-bytes button').filter({hasText:'61h'}).count()).toBeGreaterThan(1);
   await expect(page.locator('.keyboard-dive [data-provenance]')).toContainText('Event snapshots only');
  }
 });
}
test('live trigger pauses on contact, exposes both CPUs, and closing releases held contacts',async({page})=>{
 await ready(page);await page.locator('#power').click();await expect(page.locator('#status')).toHaveText('Running');
 await page.locator('#keyboard-dive-open').click();await page.locator('.keyboard-dive [data-live]').click();
 await expect(page.locator('.keyboard-dive [data-registers] button')).toHaveCount(17);
 await page.locator('.dive-live-controls').evaluate(e=>e.open=true);
 await page.locator('.keyboard-dive [data-trigger-kind]').selectOption('1');await page.locator('.keyboard-dive [data-arm]').click();
 await page.locator('.keyboard-dive [data-down]').click();
 await expect(page.locator('#status')).toContainText('Paused');
 await page.locator('.keyboard-dive [data-stop]').click();await page.locator('.dive-journey button[data-kind="1"]').click();await expect(page.locator('.keyboard-dive [data-explanation]')).toContainText('Closed contact');
 await page.locator('.keyboard-dive [data-cpu]').selectOption('mainboard');await expect(page.locator('.keyboard-dive [data-rom-address]')).toContainText('Mainboard');
 await page.locator('.keyboard-dive [data-close]').click();await page.locator('#keyboard-dive-open').click();
 await page.locator('.keyboard-dive [data-start]').click();await page.locator('.keyboard-dive [data-step]').click();await page.locator('.keyboard-dive [data-stop]').click();
 await expect(page.locator('.keyboard-dive [data-matrix-note]')).toContainText('No captured contacts');
});
test('capture validation rejects corruption and custom ROMs do not inherit S600 roles',()=>{
 const words=new Array(WORDS).fill(0);words[2]=1;
 const capture={format:'DAC-keyboard-dive-1',wordsPerRecord:WORDS,identity:{romSha256:S600,clockHz:3993600,rom:new Array(2048).fill(0)},words};
 expect(validateCapture(capture).words.length).toBe(WORDS);
 expect(()=>validateCapture({...capture,words:[...words,0]})).toThrow();
 const reverse=[...words,...words];reverse[0]=10;
 expect(()=>validateCapture({...capture,words:reverse})).toThrow('ordering');
 expect(()=>validateCapture({...capture,words:words.map((v,i)=>i===4?-1:v)})).toThrow();
 expect(region(0x41c1,'0'.repeat(64))).toBeFalsy();
 expect(role('SP',0x41ef,S600)).toContain('ROM table base');
 expect(role('SP',0x41ef,'0'.repeat(64))).not.toContain('S600');
});
