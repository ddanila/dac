import {test,expect} from '@playwright/test';
import {assignFiles,visualTestPattern} from '../scripts/ci-shards.mjs';
import {readFileSync,readdirSync} from 'node:fs';
test('duration-based CI assignment includes every test file exactly once',()=>{
 expect(visualTestPattern.test('keyboard-controller.spec.js')).toBe(true);
 const files=readdirSync(new URL('./',import.meta.url)).filter(f=>f.endsWith('.spec.js')).map(f=>'tests/'+f);
 const seconds=JSON.parse(readFileSync(new URL('./ci-durations.json',import.meta.url))).seconds;
 const bins=assignFiles([...files,'tests/future.spec.js'],seconds);
 expect(bins.flatMap(b=>b.files).sort()).toEqual([...files,'tests/future.spec.js'].sort());
 expect(bins[0].seconds/bins[1].seconds).toBeGreaterThan(.9);
 expect(bins[0].seconds/bins[1].seconds).toBeLessThan(1.1);
 expect(assignFiles([...files].reverse(),seconds)).toEqual(assignFiles(files,seconds));
 expect(()=>assignFiles(files,seconds,0)).toThrow();
});
test('CI baseline ignores cancelled and failed pushes',async()=>{
 const {successfulBaseline}=await import('../scripts/ci-baseline.mjs');
 const run=(sha,conclusion,event='push',branch='main')=>({head_sha:sha,conclusion,event,head_branch:branch});
 expect(successfulBaseline([run('c','cancelled'),run('b','failure'),run('a','success')],'main','d')).toBe('a');
 expect(successfulBaseline([run('a','success','pull_request'),run('b','success','push','other')],'main','c')).toBe(null);
});
