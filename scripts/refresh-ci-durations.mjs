import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function refreshDurations(previous, reports, run) {
  if (run.conclusion !== 'success' || !['push', 'schedule', 'workflow_dispatch'].includes(run.event) || run.head_branch !== 'main' ||
      run.path !== '.github/workflows/site.yml') throw Error('Require a successful main run of the museum workflow');
  const smoke = reports.length === 1 && reports[0].scope === 'smoke';
  if (!smoke && (reports.length !== 2 || new Set(reports.map(r => r.shard)).size !== 2)) throw Error('Require both Chromium shards or a complete smoke report');
  const seconds = {}, seen = new Set();
  const selected = [...reports[0].selected].sort();
  for (const report of reports) {
    if (report.version !== 1 || report.status !== 'passed' || report.scope !== (smoke ? 'smoke' : 'full') ||
        report.workers !== (smoke ? 2 : 1) || report.platform !== 'linux' || !(smoke ? report.shard === '' : ['1','2'].includes(report.shard)) ||
        report.sha !== run.head_sha || report.run !== String(run.id) || report.attempt !== String(run.run_attempt) ||
        JSON.stringify([...report.selected].sort()) !== JSON.stringify(selected)) throw Error('Incompatible or incomplete timing report');
    const local = new Set();
    for (const test of report.tests) {
      if (!selected.includes(test.file) || seen.has(test.file) ||
          !['expected','skipped'].includes(test.outcome) || !Number.isFinite(test.milliseconds) || test.milliseconds < 0) {
        throw Error('Invalid, failed, flaky or overlapping test timing');
      }
      local.add(test.file);
      if (test.outcome !== 'skipped') seconds[test.file] = (seconds[test.file] || 0) + test.milliseconds / 1000;
    }
    for (const file of local) seen.add(file);
  }
  if (!selected.length || selected.length !== seen.size || selected.some(f => !seen.has(f))) throw Error('Missing test files');
  return {
    source: {run: run.id, sha: run.head_sha, attempt: run.run_attempt, metric: `${smoke ? 'Two-worker smoke' : 'Single-worker full'} Chromium cumulative test durations including fixtures, not wall time; unmeasured files retain previous estimates.`},
    seconds: {...previous.seconds, ...Object.fromEntries(selected.map(file => [file, Math.max(.1, Math.round((seconds[file] ?? previous.seconds[file] ?? 30) * 10) / 10)]))},
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const id = process.argv[2];
  if (!/^\d+$/.test(id || '')) throw Error('Usage: node scripts/refresh-ci-durations.mjs RUN_ID');
  const gh = args => execFileSync('gh', args, {encoding: 'utf8'});
  const run = JSON.parse(gh(['api', `repos/ddanila/dac/actions/runs/${id}`]));
  // Validate before downloading; merge validates the report evidence as well.
  if (run.conclusion !== 'success') throw Error('Workflow has not succeeded');
  const dir = mkdtempSync(join(tmpdir(), 'dac-timings-'));
  try {
    const artifacts = JSON.parse(gh(['api', `repos/ddanila/dac/actions/runs/${id}/artifacts`]));
    const labels = artifacts.artifacts.some(a => a.name === 'timings-chromium-smoke') ? ['smoke'] : ['1','2'];
    const reports = labels.map(label => {
      const dest = join(dir, label);
      gh(['run','download',id,'--repo','ddanila/dac','--name',`timings-chromium-${label}`,'--dir',dest]);
      return JSON.parse(readFileSync(join(dest, 'ci-timings.json')));
    });
    const path = new URL('../tests/ci-durations.json', import.meta.url);
    const output = refreshDurations(JSON.parse(readFileSync(path)), reports, run);
    writeFileSync(path, JSON.stringify(output, null, 2) + '\n');
    console.log(`Updated timing estimates from successful run ${id}`);
  } finally { rmSync(dir, {recursive: true, force: true}); }
}
