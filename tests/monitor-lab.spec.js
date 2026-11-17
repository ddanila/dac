import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const baseline=new URL('../public/monitor/baseline.mcrt',import.meta.url);

test('monitor replay has synchronized controls, evidence and electrical probes',async({page})=>{
  await page.goto('/monitor.html');
  await expect(page.locator('#status')).toContainText('electrical samples');
  await expect(page.locator('.evidence')).toContainText('not a faithful K7222');
  await page.locator('#timeline').fill('0.012');
  await expect(page.locator('#time')).toHaveText('12.000 ms');
  const lit=await page.locator('#phosphor').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===1&&v>20));
  expect(lit).toBe(true);
  await page.locator('#line').click();
  await expect(page.locator('#time')).toHaveText('12.063 ms');
  await page.locator('#probe').selectOption('2');
  await expect(page.locator('#probe-value')).toContainText('V');
  await page.locator('#play').click();
  await expect(page.locator('#play')).toHaveText('Pause');
  await page.locator('#play').click();
  await expect(page.locator('#play')).toHaveText('Play');
});

test('local import, comparison and corrupted replay preserve a valid view',async({page})=>{
  await page.goto('/monitor.html');
  await expect(page.locator('#status')).toContainText('electrical samples');
  await page.locator('#compare-replay').setInputFiles(new URL('../public/monitor/vertical-collapse.mcrt',import.meta.url).pathname);
  await expect(page.locator('#comparison')).toBeVisible();
  await expect(page.locator('#compare-note')).toContainText('Vertical drive removed');
  await page.locator('#clear-compare').click();
  await expect(page.locator('#comparison')).toBeHidden();
  const corrupt=Buffer.from(readFileSync(baseline));corrupt[corrupt.length-1]^=1;
  await page.locator('#open-replay').setInputFiles({name:'bad.mcrt',mimeType:'application/octet-stream',buffer:corrupt});
  await expect(page.locator('#status')).toContainText('checksum failed');
  await expect(page.locator('#play')).toBeEnabled();
  await page.locator('#open-replay').setInputFiles(baseline.pathname);
  await expect(page.locator('#status')).toContainText('electrical samples');
});

test('bounds, version and time validation reject malformed recordings',async({page})=>{
  await page.goto('/monitor.html');
  const errors=await page.evaluate(async()=>{
    const {readReplay}=await import('/src/monitor-replay.js');
    const original=new Uint8Array(await (await fetch('/monitor/baseline.mcrt')).arrayBuffer());
    const size=new DataView(original.buffer).getUint32(8,true),meta=JSON.parse(new TextDecoder().decode(original.slice(12,12+size)));
    const mutate=async(change)=>{
      const clone=structuredClone(meta);change(clone);
      const json=new TextEncoder().encode(JSON.stringify(clone)),bytes=new Uint8Array(12+json.length+original.length-12-size);
      bytes.set(original.slice(0,8));new DataView(bytes.buffer).setUint32(8,json.length,true);bytes.set(json,12);bytes.set(original.slice(12+size),12+json.length);
      try{await readReplay(bytes.buffer);return 'accepted';}catch(e){return e.message;}
    };
    return [await mutate(m=>m.version=9),await mutate(m=>m.chunks[1].offset=0),await mutate(m=>m.duration=-1),await mutate(m=>m.chunks[0].width=1000000)];
  });
  expect(errors).toEqual(['Unsupported replay version.','Truncated or overlapping replay chunk.','Invalid replay identity or duration.','Invalid phosphor frame.']);
});

test('monitor lab loads on a narrow viewport without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/monitor.html');
  await expect(page.locator('#status')).toContainText('electrical samples');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('named stage probes retain absolute time and do not invent optical data',async({page})=>{
  await page.goto('/monitor.html');
  await page.locator('#experiment').selectOption('neck-bench');
  await expect(page.locator('#status')).toContainText('bounded-stage');
  await expect(page.locator('#time')).toHaveText('0.100 ms');
  await expect(page.locator('#visuals')).toBeHidden();
  await expect(page.locator('#line')).toBeDisabled();
  await expect(page.locator('#frame')).toBeDisabled();
  await page.locator('#probe').selectOption({label:'cathode · V'});
  await page.locator('#timeline').fill('0.00035');
  await expect(page.locator('#probe-value')).toContainText('4.3928 V');
  await expect(page.locator('#components')).toContainText('012-6891:V2:4');
  await expect(page.locator('#provenance')).toContainText('assumed-bound');
  await page.locator('#compare-replay').setInputFiles(baseline.pathname);
  await expect(page.locator('#compare-note')).toContainText('Driven flyback');
  await page.locator('#experiment').selectOption('baseline');
  await expect(page.locator('#status')).toContainText('experimental-fixture');
  await expect(page.locator('#line')).toBeEnabled();
  await expect(page.locator('#time')).toHaveText('0.000 ms');
});

test('v2 rejects duplicate probes, invalid windows and inconsistent framing',async({page})=>{
  await page.goto('/monitor.html');
  const errors=await page.evaluate(async()=>{
    const {readReplay}=await import('/src/monitor-replay.js');
    const original=new Uint8Array(await (await fetch('/monitor/neck-bench.mcrt')).arrayBuffer());
    const size=new DataView(original.buffer).getUint32(8,true),meta=JSON.parse(new TextDecoder().decode(original.slice(12,12+size)));
    const mutate=async(change)=>{
      const clone=structuredClone(meta);change(clone);
      const json=new TextEncoder().encode(JSON.stringify(clone)),bytes=new Uint8Array(12+json.length+original.length-12-size);
      bytes.set(original.slice(0,8));new DataView(bytes.buffer).setUint32(8,json.length,true);bytes.set(json,12);bytes.set(original.slice(12+size),12+json.length);
      try{await readReplay(bytes.buffer);return 'accepted';}catch(e){return e.message;}
    };
    return [await mutate(m=>m.start_time=-1),await mutate(m=>m.end_time=20),await mutate(m=>m.chunks[0].fields[2].name=m.chunks[0].fields[1].name),await mutate(m=>m.version=1)];
  });
  expect(errors).toEqual(['Invalid recording window.','Invalid recording window.','Unsupported trace fields.','Unsupported replay version.']);
});

test('signal path overlays connector and receiver voltages with source references',async({page})=>{
  await page.goto('/monitor.html');
  await page.locator('#experiment').selectOption('video-path');
  await expect(page.locator('#status')).toContainText('bounded-stage');
  await expect(page.locator('#visuals')).toBeHidden();
  await expect(page.locator('#signal-group-label')).toBeVisible();
  await page.locator('#signal-group').selectOption('video');
  await expect(page.locator('#signal-legend')).toContainText('computer connector');
  await expect(page.locator('#probe-evidence')).toContainText('1715w:X1:A5');
  await expect(page.locator('#probe-evidence')).toContainText('012-6921:X9:1');
  await expect(page.locator('#probe-evidence')).toContainText('012-6921:A1:11');
  await expect(page.locator('#probe-value')).toContainText('computer_video:');
  await expect(page.locator('#probe-value')).toContainText('receiver_video:');
  await page.locator('#signal-group').selectOption('bsyn');
  await expect(page.locator('#probe-evidence')).toContainText('1715w:X1:A3');
  await expect(page.locator('#limitations')).toContainText('No sync-lock');
  await page.locator('#window').selectOption('.00001');
  await page.locator('#compare-replay').setInputFiles(new URL('../public/monitor/video-path.mcrt',import.meta.url).pathname);
  await expect(page.locator('#status')).toContainText('Comparison loaded');
  await expect(page.locator('#signal-legend')).toContainText('Dashed traces');
  await page.locator('#probe').selectOption({label:'cathode · V'});
  await expect(page.locator('#signal-group')).toHaveValue('');
  await expect(page.locator('#signal-legend')).toBeHidden();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#experiment').selectOption('baseline');
  await expect(page.locator('#signal-group-label')).toBeHidden();
});

test('v3 optical backend uses recorded images, rays, absolute time and fixed exposure',async({page})=>{
  await page.goto('/monitor.html');
  const path=new URL('./fixtures/monitor/optical-backend-v3.mcrt',import.meta.url).pathname;
  await page.locator('#open-replay').setInputFiles(path);
  await expect(page.locator('#status')).toContainText('experimental-optical-bench');
  await expect(page.locator('#optics-panel')).toBeVisible();
  await expect(page.locator('#time')).toHaveText('300000.000 ms');
  await page.locator('#timeline').fill('300.000002');
  expect(await page.locator('#phosphor').evaluate(c=>[c.width,c.height])).toEqual([64,48]);
  expect(await page.locator('#phosphor').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===1&&v>0))).toBe(true);
  await page.locator('#compare-replay').setInputFiles(path);
  await expect(page.locator('#status')).toContainText('Comparison loaded');
  await expect(page.locator('#limitations')).toContainText('No full-monitor warm-up');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('v3 rejects invalid frames, ray data, qualification and exposure comparisons',async({page})=>{
  await page.goto('/monitor.html');
  const bytes=Array.from(readFileSync(new URL('./fixtures/monitor/optical-backend-v3.mcrt',import.meta.url)));
  const result=await page.evaluate(async bytes=>{
    const {readReplay,matchingDisplay}=await import('/src/monitor-replay.js');
    const raw=new Uint8Array(bytes),size=new DataView(raw.buffer).getUint32(8,true),original=JSON.parse(new TextDecoder().decode(raw.subarray(12,12+size))),payload=raw.subarray(12+size);
    function encode(meta){const h=new TextEncoder().encode(JSON.stringify(meta)),out=new Uint8Array(12+h.length+payload.length);out.set(raw.subarray(0,8));new DataView(out.buffer).setUint32(8,h.length,true);out.set(h,12);out.set(payload,12+h.length);return out.buffer;}
    async function bad(change){const m=structuredClone(original);change(m);try{await readReplay(encode(m));return 'accepted';}catch(e){return e.message;}}
    const errors=await Promise.all([
      bad(m=>m.full_monitor_qualified=true),bad(m=>m.chunks[0].width=4096),
      bad(m=>m.rays[0].points=[[0,0,'bad']]),bad(m=>m.rays[0].time=299),
      bad(m=>m.display.exposure_m2_per_w=0),bad(m=>m.chunks[1].width=32),
    ]);
    const a=await readReplay(encode(original)),changed=structuredClone(original);changed.display.exposure_m2_per_w*=2;
    const b=await readReplay(encode(changed));return {errors,matches:matchingDisplay(a,b)};
  },bytes);
  expect(result.errors).toEqual(['Unsupported full-monitor qualification.','Invalid phosphor frame.','Invalid recorded ray.','Invalid recorded ray.','Invalid display calibration.','Invalid phosphor frame.']);
  expect(result.matches).toBe(false);
});
