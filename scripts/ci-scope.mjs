// Conservative allowlist: emulator/runtime/dependency changes always run the full suite.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
export function scopeFor(files) {
  const visualTests = /^(assembly|crt|drive-motion|exploration|fan|inspection|interior|keyboard|museum|pcb-components)\.spec\.js$/;
  const visual = files.length && files.every(file =>
    file.startsWith('public/models/') || file.startsWith('exhibits/') ||
    file.endsWith('.md') || file === '.github/workflows/site.yml' || file === 'scripts/ci-scope.mjs' ||
    /^src\/(robotron-(model|materials|interior)|component-detail|inspection|scene)\.js$/.test(file) ||
    (file.startsWith('tests/') && visualTests.test(file.slice(6))));
  return visual ? 'visual' : 'full';
}
if (process.env.GITHUB_OUTPUT) {
  let scope = 'full';
  const base = process.env.CI_BASE;
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
