import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('fault atlas compares source probes, uncertainty and downloadable evidence',async({page})=>{
  await page.goto('/fault-atlas.html');
  await expect(page.locator('#status')).toContainText('Numerical acceptance only');
  await expect(page.locator('#prediction')).toBeVisible();
  await page.locator('[data-id="pullup-drift"]').click();
  await expect(page.locator('#case-title')).toHaveText('Video pull-up resistance doubled');
  await expect(page.locator('#status')).toContainText('Numerical acceptance only');
  await expect(page.locator('#plot polyline')).toHaveCount(2);
  await expect(page.locator('#ranges tr')).toHaveCount(4);
  await expect(page.locator('#probe-evidence')).toContainText('012-6891:X2:2');
  await page.locator('#atlas-probe').selectOption({label:'input_current · A'});
  await expect(page.locator('#probe-evidence')).toContainText('simulation-only');
  await expect(page.locator('#probe-source')).toBeHidden();
  const result=page.waitForEvent('download');await page.locator('#report').click();
  const downloaded=await result;
  expect(downloaded.suggestedFilename()).toBe('pullup-drift.json');
  const report=JSON.parse(readFileSync(await downloaded.path(),'utf8'));
  expect(report.ensemble.seed).toBe(722211);
  expect(report.publication_gate.first_release_eligible).toBe(false);
  expect(report.case.definition.target).toBe('012-6891:R7');
  await page.getByText('Source components and connectivity',{exact:true}).click();
  await expect(page.locator('#atlas-components tr[data-target=true]')).toContainText('012-6891:R7');
  await page.locator('#atlas-components button').filter({hasText:'p41'}).first().click();
  expect(await page.locator('#atlas-components tr[data-connected=true]').count()).toBeGreaterThan(1);
});

test('failed refinement withholds prediction and filters preserve visible failure',async({page})=>{
  await page.goto('/fault-atlas.html');
  await expect(page.locator('#status')).toContainText('Numerical acceptance only');
  await page.locator('#validation').selectOption('indeterminate');
  await page.locator('#cases button').first().click();
  await expect(page.locator('#prediction')).toBeHidden();
  await expect(page.locator('#case-reason')).toContainText('withheld');
  await expect(page.locator('#status')).toContainText('indeterminate');
});

test('every distributed case loads or explicitly withholds predictions',async({page})=>{
  await page.goto('/fault-atlas.html');
  await expect(page.locator('#status')).toContainText('Numerical acceptance only');
  const cases=await page.evaluate(async()=>((await (await fetch('/monitor/atlas/index.json')).json()).cases.map(c=>({id:c.definition.id,status:c.status}))));
  expect(cases.filter(c=>c.status==='unsupported').length).toBeGreaterThan(0);
  for(const c of cases){
    await page.locator(`[data-id="${c.id}"]`).click();
    if(c.status==='accepted-simulation'){
      await expect(page.locator('#status')).toContainText('Numerical acceptance only');
      await expect(page.locator('#prediction')).toBeVisible();
    }else{
      await expect(page.locator('#status')).toContainText('Prediction withheld');
      await expect(page.locator('#prediction')).toBeHidden();
    }
  }
});

test('atlas rejects tampered bytes and malformed qualifications',async({page})=>{
  await page.goto('/fault-atlas.html');
  await expect(page.locator('#status')).toContainText('Numerical acceptance only');
  const results=await page.evaluate(async()=>{
    const {validateAtlas}=await import('/src/fault-atlas-data.js');
    const original=await (await fetch('/monitor/atlas/index.json')).json();
    return [a=>a.format='unknown',a=>a.cases[0].status='unsupported',a=>a.probes[1].id=a.probes[0].id,a=>a.publication_gate.first_release_eligible=true].map(change=>{const a=structuredClone(original);change(a);try{validateAtlas(a);return 'accepted';}catch(e){return e.message;}});
  });
  expect(results.every(s=>s!=='accepted')).toBe(true);
  await page.route('**/monitor/atlas/index.json',async route=>{const response=await route.fetch(),body=await response.body();body[body.length-1]^=1;await route.fulfill({response,body});});
  await page.reload();await expect(page.locator('#status')).toContainText('checksum failed');
  await expect(page.locator('#prediction')).toBeHidden();
});

test('atlas remains usable on mobile and probe matching cannot alias unrelated collectors',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/fault-atlas.html');
  await expect(page.locator('#status')).toContainText('Numerical acceptance only');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const matches=await page.evaluate(async()=>{
    const {matchingProbe}=await import('/src/monitor-replay.js');
    const a={meta:{version:2,model_id:'neck'},trace:{fields:[{name:'time',unit:'s'},{name:'collector',unit:'V',id:'neck:V1:C',source_id:'V1'}]}};
    const b=structuredClone(a);b.meta.model_id='other';const c=structuredClone(a);c.trace.fields[1].id='neck:V2:C';const d=structuredClone(a);d.meta.version=1;
    return [matchingProbe(a,structuredClone(a),1),matchingProbe(a,b,1),matchingProbe(a,c,1),matchingProbe(a,d,1)];
  });expect(matches).toEqual([1,-1,-1,-1]);
});
