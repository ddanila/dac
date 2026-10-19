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
 expect(reference.native).toBe(false);
 expect(full.native).toBe(true);
 expect(planFor(['tests/serial.spec.js'],files).native).toBe(true);
 expect(planFor(['tests/crt.spec.js'],files).native).toBe(false);
 expect(reference.test_files).toEqual(['tests/psu-docs.spec.js']);
 expect(reference.matrix.include.map(m=>m.browser)).toEqual(['chromium']);
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

test('shared changes and unknown paths always require full coverage', async () => {
 const {scopeFor} = await import('../scripts/ci-scope.mjs');
 for (const file of ['.github/workflows/site.yml','scripts/ci-scope.mjs','scripts/ci-baseline.mjs','scripts/ci-shards.mjs','playwright.config.js','playwright.cross.config.js','vite.config.js','package.json','package-lock.json','tests/ci-shards.spec.js','tests/helpers.js','public/emulator/dac.wasm','src/main.js','index.html','src/style.css','tests/fixture.md','public/docs/new-guide/index.html']) {
   expect(scopeFor([file]),file).toBe('full');
   expect(scopeFor(['public/docs/robotron-psu/en.html',file]),file).toBe('full');
 }
 expect(scopeFor(['public/docs/robotron-psu/guide.css','src/inspection.js'])).toBe('visual');
});
