import { defineConfig } from "@playwright/test";
const port = process.env.DAC_TEST_PORT || "4173";
export default defineConfig({
  testDir: "tests",
  // Balance shards by individual test; each CI runner still has one worker.
  fullyParallel: true,
  timeout: 60000,
  expect: { timeout: process.env.CI ? 10000 : 5000 },
  // CI uses software WebGL; avoid competing renderers on the same CPU.
  workers: process.env.CI ? 1 : undefined,
  use: { reducedMotion: "reduce", baseURL: `http://127.0.0.1:${port}`, headless: true },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
  },
});
