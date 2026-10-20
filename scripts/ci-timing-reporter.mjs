import { mkdirSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';

// Explicitly enabled only for executed Chromium jobs, never --list or policy checks.
export default class TimingReporter {
  onBegin(config, suite) {
    this.config = config;
    this.suite = suite;
  }
  onEnd(result) {
    const tests = this.suite.allTests().map(test => ({
      file: relative(process.cwd(), test.location.file).replaceAll('\\', '/'),
      outcome: test.outcome(),
      milliseconds: test.results.reduce((sum, attempt) => sum + attempt.duration, 0),
    }));
    mkdirSync('test-results', {recursive: true});
    writeFileSync('test-results/ci-timings.json', JSON.stringify({
      version: 1, run: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT,
      sha: process.env.GITHUB_SHA, scope: process.env.DAC_CI_SCOPE,
      shard: process.env.DAC_CI_SHARD, platform: process.platform,
      workers: this.config.workers, status: result.status,
      selected: JSON.parse(process.env.DAC_CI_TEST_FILES || '[]'), tests,
    }, null, 2) + '\n');
  }
}
