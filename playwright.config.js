import { defineConfig } from "@playwright/test";
const port = process.env.DAC_TEST_PORT || "4173";
export default defineConfig({
  testDir: "tests",
  timeout: 30000,
  // CI uses software WebGL; avoid competing renderers on the same CPU.
  workers: process.env.CI ? 1 : undefined,
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
  },
});
