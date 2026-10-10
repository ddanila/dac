import base from "./playwright.config.js";
export default {
  ...base,
  testMatch: ["portable-sessions.spec.js"],
  workers: 1,
  projects: [
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
};
