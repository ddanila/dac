import {expect} from "@playwright/test";
export async function observeKeys(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const WorkerBase = window.Worker;
    window.sentKeys = [];
    window.Worker = class extends WorkerBase {
      constructor(...args) { super(...args); window.observedWorker=this; }
      postMessage(message, ...args) {
        if (message.type === "key" && message.down)
          window.sentKeys.push(message.key);
        return super.postMessage(message, ...args);
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  await expect(page.locator("#power")).toBeEnabled();
  // Input routing and modifier semantics need a stable diagnostic; the
  // historical-media suite separately exercises the original OS and disk.
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
  // These tests inspect routed key messages and keycap state, not CPU output.
  // Keep the real worker, but pause its clock to avoid competing with WebGL.
  // Historical-media tests continue to exercise live OS keyboard input.
  await page.evaluate(() => window.observedWorker.postMessage({type:"visibility",hidden:true}));
}

