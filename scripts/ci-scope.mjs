import {validatedBaseline} from './ci-baseline.mjs';
// Conservative allowlist: emulator/runtime/dependency changes always run the full suite.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visualTestPattern } from './ci-shards.mjs';
export function scopeFor(files) {
  if (files.length && files.every(file => /^docs\/.+\.md$/.test(file))) return 'docs';

  const visual = files.length && files.every(file =>
    ['tests/browser-three.js','tests/model-harness.html','scripts/review-robotron.mjs'].includes(file) ||
    file.startsWith('public/models/') || file.startsWith('exhibits/') ||
    /^tests\/visual\/robotron\/[^/]+\.(png|json)$/.test(file) ||
    file.endsWith('.md') || file === 'tests/ci-durations.json' || file === '.github/workflows/site.yml' || file === 'scripts/ci-scope.mjs' || file === 'playwright.config.js' ||
    /^src\/(robotron-(model|materials|interior)|component-detail|inspection|scene)\.js$/.test(file) ||
    (file.startsWith('tests/') && visualTestPattern.test(file.slice(6))));
  return visual ? 'visual' : 'full';
}
if (process.env.GITHUB_OUTPUT && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let scope = 'full';
  const base = validatedBaseline();
  if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' && /^[a-f0-9]{40}$/.test(base || '') && !/^0+$/.test(base)) {
    try {
      try { execFileSync('git', ['cat-file', '-e', base]); }
      catch { execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base]); }
      const files = execFileSync('git', ['diff', '--name-only', '-z', base, 'HEAD'], {encoding:'utf8'}).split('\0').filter(Boolean);
      scope = scopeFor(files);
    } catch { /* Missing comparison commits must never skip coverage. */ }
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `scope=${scope}\n`);
  console.log(`CI scope: ${scope}`);
}
