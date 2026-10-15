// Run against a local dev/preview server; no image or geometry quality reduction.
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 await page.addInitScript(()=>performance.setResourceTimingBufferSize(2000));
 await page.goto(process.argv[2]||'http://127.0.0.1:4173/');
 await page.locator('#viewport[data-details="ready"]').waitFor({timeout:60000});
 const report=await page.evaluate(()=>{
  const resources=performance.getEntriesByType('resource').filter(e=>e.name.includes('/models/robotron-1715m/'));
  const seen=new Set(),duplicates=[];for(const r of resources){if(seen.has(r.name))duplicates.push(new URL(r.name).pathname);seen.add(r.name);}
  return {scope:'Cold local browser context, all detailed model geometry ready; development server',readyMs:Math.round(performance.now()),resources:resources.length,decodedBytes:resources.reduce((s,r)=>s+r.decodedBodySize,0),duplicateUrls:duplicates,firstRequestMs:Math.round(Math.min(...resources.map(r=>r.startTime))),lastResponseMs:Math.round(Math.max(...resources.map(r=>r.responseEnd)))};
 });
 await writeFile(process.argv[3]||'/tmp/dac-loading-profile.json',JSON.stringify(report,null,2)+'\n');console.log(report);
} finally {await browser.close();}
