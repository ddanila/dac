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

test('documentation scope excludes runtime, workflow and mixed changes', async()=>{
 const {scopeFor}=await import('../scripts/ci-scope.mjs');
 expect(scopeFor(['docs/robotron/keyboard-controller-simulation.md'])).toBe('docs');
 expect(scopeFor(['docs/robotron/keyboard-controller-simulation.md','docs/robotron/keyboard-controller-plan.md'])).toBe('docs');
 expect(scopeFor(['README.md','MODEL-HISTORY.md','docs/robotron/keyboard-controller-plan.md'])).toBe('docs');
 expect(scopeFor(['README.md','src/main.js'])).toBe('full');
 expect(scopeFor(['public/models/README.md'])).not.toBe('docs');
 expect(scopeFor([])).toBe('full');
 expect(scopeFor(['docs/robotron/keyboard-controller-simulation.md','src/main.js'])).toBe('full');
 expect(scopeFor(['docs/robotron/keyboard-controller-simulation.md','public/models/robotron-1715m/model.json'])).toBe('visual');
 expect(scopeFor(['docs/robotron/audit.json'])).toBe('full');
 expect(scopeFor(['.github/workflows/site.yml'])).not.toBe('docs');
 expect(scopeFor(['scripts/ci-scope.mjs'])).not.toBe('docs');
 expect(scopeFor(['tests/fixture.md'])).not.toBe('docs');
});

test('scoped plans retain all selected tests and all applicable browser checks', async () => {
 const {planFor,crossBrowserFiles} = await import('../scripts/ci-scope.mjs');
 const files = readdirSync(new URL('./',import.meta.url),{recursive:true}).filter(f=>f.endsWith('.spec.js')).map(f=>'tests/'+f);
 const full = planFor(['src/main.js'],files);
 expect(full.scope).toBe('full');
 expect(full.test_files).toEqual(files);
 expect(full.matrix.include).toHaveLength(4);
 const visual = planFor(['src/inspection.js'],files);
 expect(visual.scope).toBe('visual');
 for (const file of files.filter(f=>visualTestPattern.test(f.slice(6)))) expect(visual.test_files).toContain(file);
 expect(visual.test_files).toContain('tests/inspection-workspaces.spec.js');
 expect(visual.test_files).toContain('tests/robotron-review-tools.spec.js');
 expect(visual.test_files).toContain('tests/psu-docs.spec.js');
 expect(visual.test_files.filter(f=>crossBrowserFiles.includes(f.slice(6)))).toEqual(expect.arrayContaining(['tests/assembly.spec.js','tests/robotron-review-tools.spec.js','tests/keyboard-controller.spec.js']));
 const reference = planFor(['public/docs/robotron-psu/en.html','README.md'],files);
 expect(reference.scope).toBe('reference');
 expect(reference.matrix.include.every(m=>!m.native)).toBe(true);
 expect(full.matrix.include.some(m=>m.native)).toBe(true);
 expect(planFor(['tests/serial.spec.js'],files).matrix.include[0].native).toBe(true);
 expect(planFor(['tests/crt.spec.js'],files).matrix.include[0].native).toBe(false);
 expect(reference.test_files).toEqual(['tests/psu-docs.spec.js']);
 expect(reference.matrix.include).toEqual([]);
 const testOnly = planFor(['tests/crt.spec.js','README.md'],files);
 expect(testOnly.scope).toBe('tests');
 expect(testOnly.test_files).toEqual(['tests/crt.spec.js']);
 expect(testOnly.matrix.include).toHaveLength(1);
 const crossTest = planFor(['tests/assembly.spec.js'],files);
 expect(crossTest.matrix.include.map(m=>m.browser)).toEqual(['chromium','firefox','webkit']);
 expect(planFor(['tests/deleted.spec.js'],files).scope).toBe('full');
 expect(planFor(['README.md'],files,true).scope).toBe('full');
 expect(planFor(['README.md'],files).matrix.include).toEqual([]);
});

test('PSU image changes retain reference checks without narrowing unrelated assets', async () => {
 const {planFor,scopeFor} = await import('../scripts/ci-scope.mjs');
 const files = ['tests/psu-docs.spec.js','tests/museum.spec.js'];
 for (const asset of ['board-locator.svg','connector-solder-view.svg','photos/board.webp','photos/board.png','photos/board.jpg','photos/board.jpeg']) {
   const path = `public/docs/robotron-psu/${asset}`;
   const plan = planFor([path,'README.md'],files);
   expect(plan.scope,path).toBe('reference');
   expect(plan.test_files,path).toEqual(['tests/psu-docs.spec.js']);
   expect(scopeFor([path,'src/main.js'])).toBe('full');
   expect(planFor([path,'src/inspection.js'],files).test_files).toEqual(files);
 }
 for (const path of ['public/docs/other/board.svg','public/docs/robotron-psu/runtime.js','public/docs/robotron-psu/photos/script.js','public/docs/robotron-psu/unknown.bin']) {
   expect(scopeFor([path]),path).toBe('full');
 }
});

test('native replay follows shard assignment and remains Chromium-only', async () => {
 const {planFor} = await import('../scripts/ci-scope.mjs');
 const files = ['tests/workbench.spec.js','tests/serial.spec.js','tests/museum.spec.js'];
 // Heavy browser-only work puts both replay consumers in the other shard.
 const together = planFor(['src/main.js'],files,false,{'tests/museum.spec.js':100});
 expect(together.matrix.include.map(m=>[m.label,m.native])).toEqual([
   ['chromium-1',false],['chromium-2',true],['firefox',false],['webkit',false],
 ]);
 // Rebalancing must move the requirement with the tests, not pin a shard ID.
 const split = planFor(['src/main.js'],files,false,{'tests/workbench.spec.js':100,'tests/serial.spec.js':90});
 expect(split.matrix.include.filter(m=>m.browser==='chromium').map(m=>m.native)).toEqual([true,false]);
 const single = planFor(['tests/workbench.spec.js'],files);
 expect(single.matrix.include.map(m=>m.native)).toEqual([true,false,false]);
});

test('actual CI assignments cover every native replay consumer', async () => {
 const {planFor} = await import('../scripts/ci-scope.mjs');
 const root = new URL('./',import.meta.url);
 const files = readdirSync(root,{recursive:true}).filter(f=>f.endsWith('.spec.js')).map(f=>'tests/'+f);
 const seconds = JSON.parse(readFileSync(new URL('ci-durations.json',root))).seconds;
 const plan = planFor(['src/main.js'],files);
 const bins = assignFiles(plan.test_files,seconds);
 for (const job of plan.matrix.include.filter(m=>m.browser==='chromium')) {
   const consumers = bins[Number(job.shard)-1].files.filter(f=>
     f !== 'tests/ci-shards.spec.js' && readFileSync(new URL('../'+f,import.meta.url),'utf8').includes('DAC_NATIVE_REPLAY'));
   expect(job.native,job.label).toBe(consumers.length>0);
 }
});

test('shared changes and unknown paths always require full coverage', async () => {
 const {scopeFor} = await import('../scripts/ci-scope.mjs');
 for (const file of ['.github/workflows/site.yml','scripts/ci-scope.mjs','scripts/ci-baseline.mjs','scripts/ci-shards.mjs','playwright.config.js','playwright.cross.config.js','vite.config.js','package.json','package-lock.json','tests/ci-shards.spec.js','tests/helpers.js','public/emulator/dac.wasm','src/main.js','index.html','src/style.css','tests/fixture.md','public/docs/new-guide/index.html']) {
   expect(scopeFor([file]),file).toBe('full');
   expect(scopeFor(['public/docs/robotron-psu/en.html',file]),file).toBe('full');
 }
 expect(scopeFor(['public/docs/robotron-psu/guide.css','src/inspection.js'])).toBe('visual');
});

test('timing refresh accepts complete successful evidence and preserves skipped estimates', async () => {
 const {refreshDurations} = await import('../scripts/refresh-ci-durations.mjs');
 const run = {id:123,run_attempt:1,head_sha:'abc',head_branch:'main',event:'push',conclusion:'success',path:'.github/workflows/site.yml'};
 const selected = ['tests/a.spec.js','tests/b.spec.js'];
 const report = (shard,tests) => ({version:1,status:'passed',scope:'full',workers:1,platform:'linux',run:'123',attempt:'1',sha:'abc',shard,selected,tests});
 const reports = [report('1',[{file:selected[0],outcome:'expected',milliseconds:1200},{file:selected[0],outcome:'expected',milliseconds:3400}]),
   report('2',[{file:selected[1],outcome:'skipped',milliseconds:0}])];
 const previous = {seconds:{[selected[1]]:17}};
 expect(refreshDurations(previous,reports,run).seconds).toEqual({[selected[0]]:4.6,[selected[1]]:17});
 for (const patch of [{conclusion:'failure'},{conclusion:'cancelled'},{event:'pull_request'},{head_branch:'other'},{path:'other.yml'}]) {
   expect(()=>refreshDurations(previous,reports,{...run,...patch})).toThrow();
 }
 for (const patch of [{status:'failed'},{scope:'tests'},{workers:2},{platform:'darwin'},{sha:'other'},{attempt:'2'},{run:'124'},{shard:'2'},{selected:[]},{tests:[]}]) {
   expect(()=>refreshDurations(previous,[{...reports[0],...patch},reports[1]],run)).toThrow();
 }
 for (const patch of [{outcome:'flaky'},{outcome:'unexpected'},{milliseconds:-1},{milliseconds:NaN},{file:selected[1]}]) {
   const bad = structuredClone(reports); Object.assign(bad[0].tests[0],patch);
   expect(()=>refreshDurations(previous,bad,run)).toThrow();
 }
 expect(()=>refreshDurations(previous,[reports[0]],run)).toThrow();
});

test('runtime photo selection keeps full names and inspection IDs without fetching unused originals', async () => {
 const {runtimePhotos,verifyPhotos} = await import('../scripts/ci-photos.mjs');
 const base = 'public/models/robotron-1715m/photos/';
 const files = ['PXL_20261017_080431329.MP.jpg','PXL_20261009_133022597.jpg','PXL_20250212_094043026.jpg','PXL_20261017_080541857.jpg'].map(f=>base+f);
 const psu = 'public/docs/robotron-psu/photos/board.webp';
 expect(runtimePhotos([...files,psu], 'PXL_20261017_080431329.MP.jpg 133022597 20250212_094043026')).toEqual([...files.slice(0,3),psu]);
 const {mkdtempSync,writeFileSync,rmSync} = await import('node:fs');
 const {tmpdir} = await import('node:os'); const {join} = await import('node:path');
 const dir = mkdtempSync(join(tmpdir(),'dac-photo-test-')), file=join(dir,'photo.jpg');
 try {
   writeFileSync(file,'version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 123\n');
   expect(()=>verifyPhotos([file])).toThrow('LFS pointer');
   writeFileSync(file,Buffer.from([255,216,255,224])); expect(()=>verifyPhotos([file])).not.toThrow();
 } finally {rmSync(dir,{recursive:true,force:true});}
});
