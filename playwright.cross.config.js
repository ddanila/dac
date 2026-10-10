import base from "./playwright.config.js";
export default {
  ...base,
  testMatch: ["portable-sessions.spec.js"],
  workers: 1,
  timeout: 60000,
  use: {
    ...base.use,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "firefox",
      use: {
        browserName: "firefox",
        // A headless macOS runner has no reliable display vsync. Keep normal
        // actionability checks, but supply a timer-driven refresh cadence.
        launchOptions: { firefoxUserPrefs: { "layout.frame_rate": 60 } },
      },
    },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
};
