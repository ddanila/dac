import { defineConfig } from "@playwright/test";
import { readdirSync, readFileSync } from 'node:fs';
import { assignFiles } from './scripts/ci-shards.mjs';
const shard = process.env.DAC_CI_SHARD;
const requested = process.env.DAC_CI_TEST_FILES ? JSON.parse(process.env.DAC_CI_TEST_FILES) : null;
if (requested && (!Array.isArray(requested) || !requested.length || requested.some(f => typeof f !== 'string' || !/^tests\/[\w/-]+\.spec\.js$/.test(f)))) {
  throw Error('DAC_CI_TEST_FILES must contain test paths');
}
let testMatch = requested?.map(f => '**/' + f);
if (shard) {
  if (!/^[12]$/.test(shard)) throw Error('DAC_CI_SHARD must be 1 or 2');
  const files = requested || readdirSync(new URL('./tests/', import.meta.url), {recursive:true})
    .filter(f => f.endsWith('.spec.js'))
    .map(f => 'tests/'+f);
  const durations = JSON.parse(readFileSync(new URL('./tests/ci-durations.json', import.meta.url)));
  const bins = assignFiles(files, durations.seconds);
  const selected = bins[Number(shard)-1];
  testMatch = selected.files.map(f => '**/'+f);
  console.log(`CI shard ${shard}: ${selected.files.length} files, estimated ${Math.round(selected.seconds)}s; all bins ${bins.map(b=>Math.round(b.seconds)).join('/')}s`);
}
const port = process.env.DAC_TEST_PORT || "4173";
export default defineConfig({
  testDir: "tests",
  ...(testMatch ? {testMatch} : {}),
  // Keep independent tests isolated; CI file assignment uses recorded runtimes.
  fullyParallel: true,
  // Full runs report every failure; push smoke still stops early.
  maxFailures: process.env.CI && process.env.DAC_CI_SCOPE !== "full" ? 1 : 0,
  timeout: 60000,
  expect: { timeout: process.env.CI ? 10000 : 5000 },
  // CI uses software WebGL; the full run keeps one renderer per CPU-bound job,
  // the push smoke tries two (DAC_CI_WORKERS).
  workers: process.env.CI ? Number(process.env.DAC_CI_WORKERS || 1) : undefined,
  use: { reducedMotion: "reduce", baseURL: `http://127.0.0.1:${port}`, headless: true },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
  },
});
