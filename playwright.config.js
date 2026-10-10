import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  timeout: 30000,
  // CI uses software WebGL; avoid competing renderers on the same CPU.
  workers: process.env.CI ? 1 : undefined,
  use: { baseURL: "http://127.0.0.1:4173", headless: true },
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
