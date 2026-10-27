import { validatedBaseline } from './ci-baseline.mjs';
import { execFileSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignFiles, nativeTests, visualTestPattern } from './ci-shards.mjs';

export const crossBrowserFiles = [
  'analyzer.spec.js', 'investigation.spec.js', 'experiments.spec.js',
  'pico1715.spec.js', 'portable-sessions.spec.js', 'checkpoints.spec.js', 'workbench.spec.js',
  'assembly.spec.js', 'robotron-review-tools.spec.js',
  'robotron-activities.spec.js', 'keyboard-controller.spec.js',
];
const prose = file => ['README.md', 'MODEL-HISTORY.md'].includes(file) || /^docs\/.+\.md$/.test(file);
const reference = file => /^public\/docs\/robotron-psu\/(?:[^/]+\.(html|css|json|svg)|photos\/[^/]+\.(webp|png|jpe?g))$/.test(file);
const durations = JSON.parse(readFileSync(new URL('../tests/ci-durations.json', import.meta.url))).seconds;
export function scopeFor(files) {
  if (!files.length) return 'full';
  if (files.every(prose)) return 'docs';
  if (files.every(file => prose(file) || reference(file))) return 'reference';
  // Test helpers, configuration and CI logic can affect any suite.
  if (files.every(file => prose(file) || /^tests\/(?!ci-shards\.)[^/]+\.spec\.js$/.test(file))) return 'tests';
  const visual = files.every(file =>
    prose(file) || reference(file) ||
    ['tests/browser-three.js', 'tests/model-harness.html', 'scripts/review-robotron.mjs'].includes(file) ||
    file.startsWith('public/models/') || file.startsWith('exhibits/') ||
    /^tests\/visual\/robotron\/[^/]+\.(png|json)$/.test(file) ||
    /^src\/(robotron-(model|materials|interior)|component-detail|inspection|scene)\.js$/.test(file) ||
    (file.startsWith('tests/') && visualTestPattern.test(file.slice(6))));
  return visual ? 'visual' : 'full';
}

export function planFor(files, allTests, forceFull = false, seconds = durations) {
  let scope = forceFull ? 'full' : scopeFor(files);
  // Deleted/renamed tests must not produce an empty, apparently successful run.
  if (scope === 'tests' && files.some(f => f.endsWith('.spec.js') && !allTests.includes(f))) scope = 'full';
  const selected = allTests.filter(file => scope === 'full' ||
    (scope === 'tests' && files.includes(file)) ||
    (scope === 'reference' && file === 'tests/psu-docs.spec.js') ||
    (scope === 'visual' && (visualTestPattern.test(file.slice(6)) || file === 'tests/psu-docs.spec.js')));
  if (scope !== 'docs' && !selected.length) throw Error('CI plan selected no tests');
  const cross = selected.filter(file => crossBrowserFiles.includes(file.slice(6)));
  const matrix = [];
  if (selected.length && scope !== 'reference') {
    const sharded = ['full', 'visual'].includes(scope);
    // Use the same assignment and duration inputs as playwright.config.js.
    const bins = sharded ? assignFiles(selected, seconds) : [{files: selected}];
    for (const shard of sharded ? ['1', '2'] : ['']) {
      const assigned = bins[shard ? Number(shard)-1 : 0].files;
      matrix.push({label: shard ? `chromium-${shard}` : 'chromium', browser: 'chromium', os: 'ubuntu-latest', shard,
        native: assigned.some(file => nativeTests.has(file))});
    }
    if (cross.length) {
      matrix.push({label: 'firefox', browser: 'firefox', os: 'ubuntu-latest', shard: '', native: false});
      matrix.push({label: 'webkit', browser: 'webkit', os: 'macos-latest', shard: '', native: false});
    }
  }
  return {scope, test_files: selected, matrix: {include: matrix}};
}

if (process.env.GITHUB_OUTPUT && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let files = [], forceFull = true;
  const base = validatedBaseline();
  if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' && /^[a-f0-9]{40}$/.test(base || '') && !/^0+$/.test(base)) {
    try {
      try { execFileSync('git', ['cat-file', '-e', base]); }
      catch { execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base]); }
      files = execFileSync('git', ['diff', '--name-only', '-z', base, 'HEAD'], {encoding: 'utf8'}).split('\0').filter(Boolean);
      forceFull = false;
    } catch { /* Missing comparison commits must never skip coverage. */ }
  }
  const allTests = readdirSync(new URL('../tests/', import.meta.url), {recursive: true})
    .filter(f => f.endsWith('.spec.js')).map(f => 'tests/' + f).sort();
  const plan = planFor(files, allTests, forceFull);
  for (const [key, value] of Object.entries(plan)) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}\n`);
  }
  console.log(JSON.stringify({base, changed: files, ...plan}, null, 2));
}
