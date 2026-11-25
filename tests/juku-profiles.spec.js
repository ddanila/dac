import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {test,expect} from '@playwright/test';
async function start(page){
 if(process.env.DAC_JUKU_PROFILE_DEV)for(const name of ['dac.js','dac.wasm'])await page.route(`**/emulator/${name}?*`,route=>route.fulfill({path:new URL('../../dac-emulation/dist/'+name,import.meta.url).pathname,contentType:name.endsWith('wasm')?'application/wasm':'text/javascript'}));
 await page.route('**/models/**/model.json?*',r=>r.fulfill({status:503,body:'No CAD required'}));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled();
 await page.locator('#machine').selectOption('0');await expect(page.locator('#juku-profile option')).toHaveCount(7);
 await page.locator('#media-controls').evaluate(e=>e.open=true);
}
test('Juku profile selection persists through reset and is recorded in checkpoints',async({page})=>{
 await start(page);
 await page.locator('#juku-profile').selectOption('early-juss');await expect(page.locator('#juku-profile-status')).toContainText('Historical EKDOS');
 await page.locator('#power').click();await expect(page.locator('#juku-profile')).toBeDisabled();
 await page.locator('#reset').click();await page.locator('#checkpoint-controls').evaluate(e=>e.open=true);
 await page.locator('#checkpoint-name').fill('JUSS');await page.locator('#checkpoint-save').click();await expect(page.locator('#checkpoint-status')).toContainText('saved');
 const record=await page.evaluate(async()=>{const {storedKeys,stored}=await import('/src/session-store.js');return stored((await storedKeys()).find(k=>k.startsWith('checkpoint:')));});
 expect(record.jukuProfile).toBe('early-juss');expect(record.stateKey).toContain(':profile:early-juss');
 await page.locator('#power').click();await page.locator('#media-controls').evaluate(e=>e.open=true);
 await page.locator('#juku-profile').selectOption('mainboard-juku');await page.locator('#checkpoint-restore').click();await expect(page.locator('#checkpoint-status')).toContainText('matching');
 await page.locator('#juku-profile').selectOption('early-juss');await page.locator('#checkpoint-restore').click();await expect(page.locator('#checkpoint-status')).toContainText('restored');
});
test('IMD import exports an independent normalized image and preserves recorded errors',async({page})=>{
 await start(page);await page.locator('#juku-profile').selectOption('single-density');
 const rom=Buffer.alloc(16384);rom[0]=0xc3;
 const imd=Buffer.from([73,77,68,32,116,26,2,0,0,2,0,3,1,2,90,8,165]);
 await page.locator('#rom').setInputFiles({name:'test.rom',mimeType:'application/octet-stream',buffer:rom});
 await page.locator('#disk').setInputFiles({name:'fm.imd',mimeType:'application/octet-stream',buffer:imd});
 await page.locator('#load').click();await expect(page.locator('#export')).toBeEnabled();
 const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;
 expect(file.suggestedFilename()).toMatch(/\.imd$/);const stream=await file.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const bytes=Buffer.concat(chunks);
 expect(bytes.subarray(0,4).toString()).toBe('IMD ');expect(bytes.length).toBe(271);expect(bytes[13]).toBe(1);expect(bytes[142]).toBe(7);expect(bytes[270]).toBe(165);
});
test('archived cores reject nondefault profiles and recording metadata round-trips',async({page})=>{
 await page.goto('/tests/model-harness.html');const result=await page.evaluate(async()=>{
  const {applyJukuProfile}=await import('/src/juku-profiles.js');let rejection;
  applyJukuProfile({},1,0);try{applyJukuProfile({},1,0,'early-juss');}catch(e){rejection=e.message;}
  const {encodeRecording,decodeRecording}=await import('/src/recording.js');
  const r={kind:0,jukuProfile:'single-density',build:'a'.repeat(64),firmware:[],disks:[null,null],writable:[false,false],events:[],media:[],result:Array(4).fill('b'.repeat(64))};
  return {rejection,profile:(await decodeRecording(await encodeRecording(r))).jukuProfile};
 });expect(result.rejection).toContain('does not support');expect(result.profile).toBe('single-density');
});

test('nondefault profile recording replays in browser and native core',async({page})=>{
 await start(page);await page.locator('#juku-profile').selectOption('early-juss');
 await page.locator('#power').click();await page.locator('#record-controls').evaluate(e=>e.open=true);
 await page.locator('#record-start').click();await expect(page.locator('#record-status')).toContainText('Recording from restart');
 await page.locator('#reset').click();
 const download=page.waitForEvent('download');await page.locator('#record-stop').click();
 const bytes=await readFile(await (await download).path());expect(JSON.parse(bytes).format).toBe('DAC-recording-3');
 await page.locator('#record-file').setInputFiles({name:'profile.dacrecord',mimeType:'application/json',buffer:bytes});
 await expect(page.locator('#record-status')).toContainText('Replay verified');
 if(process.env.DAC_NATIVE_REPLAY){const path=test.info().outputPath('profile.dacrecord');await writeFile(path,bytes);expect(execFileSync('node',['scripts/replay-native.mjs',path],{encoding:'utf8'})).toContain('PASS native replay');}
});
