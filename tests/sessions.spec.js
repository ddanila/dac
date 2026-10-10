import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
function directoryNames(image) {
  const names = new Set();
  for (
    let offset = 4 * 5 * 1024;
    offset < 4 * 5 * 1024 + 128 * 32;
    offset += 32
  ) {
    const e = image.subarray(offset, offset + 32);
    if (e[0] !== 0) continue;
    const text = (part) =>
      String.fromCharCode(...part.map((b) => b & 127)).trim();
    names.add(text(e.subarray(1, 9)) + "." + text(e.subarray(9, 12)));
  }
  return [...names].sort();
}
async function exportDisk(page) {
  await page.locator("#media-controls").evaluate((e) => (e.open = true));
  const download = page.waitForEvent("download");
  await page.locator("#export").click();
  return readFile(await (await download).path());
}
async function bootReady(page) {
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.activity = 0;
    window.Worker = class extends Base {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", ({ data }) => {
          if (data.type === "frame") window.activity = data.activity;
        });
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
}
test("machine state survives reload and resumes the saved display", async ({
  page,
}) => {
  await bootReady(page);
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");
  await page.locator("#power").click();
  await page.locator("#screen-view").click();
  await page.locator("#screen").focus();
  await page.keyboard.type("SAVED");
  await page.waitForTimeout(200);
  const saved = await page.locator("#screen").evaluate((e) => e.toDataURL());
  await page.locator("#session-controls summary").click();
  await page.locator("#save-state").click();
  await expect(page.locator("#storage-status")).toHaveText(
    "Machine state saved in this browser.",
  );
  await page.reload();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await page.locator("#session-controls summary").click();
  await expect(page.locator("#restore-state")).toBeEnabled();
  await page.locator("#restore-state").click();
  await expect(page.locator("#status")).toHaveText("Running");
  await expect
    .poll(() => page.locator("#screen").evaluate((e) => e.toDataURL()))
    .toBe(saved);
  await expect(page.locator("#error")).toBeEmpty();
});
test("firmware keyboard edits TOS/M disk, browser reload preserves it, discard restores stock", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await bootReady(page);
  await page.locator("#media-controls summary").click();
  await page.locator("#writable").check();
  await page.locator("#historical").click();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#turbo").check();
  await page.locator("#power").click();
  await expect
    .poll(() => page.evaluate(() => window.activity), { timeout: 45000 })
    .toBeGreaterThan(77);
  await page.waitForTimeout(1000);
  await page.locator("#screen-view").click();
  await page.locator("#screen").focus();
  // Real key down/up events give the firmware time to scan and debounce.
  for (const key of [
    "e",
    "r",
    "a",
    " ",
    "a",
    "u",
    "t",
    "o",
    "e",
    "x",
    "c",
    ".",
    "b",
    "a",
    "k",
    "Enter",
  ]) {
    await page.keyboard.down(key);
    await page.waitForTimeout(50);
    await page.keyboard.up(key);
    await page.waitForTimeout(50);
  }
  await expect
    .poll(() => page.evaluate(() => window.activity), { timeout: 15000 })
    .toBeGreaterThan(79);
  await page.locator("#power").click();
  await expect(page.locator("#storage-status")).toHaveText(
    "Disk saved in this browser.",
  );
  const changed = await exportDisk(page),
    stock = await readFile(
      new URL("../public/media/robotron/tosm10.img", import.meta.url),
    );
  expect(changed.equals(stock)).toBe(false);
  expect(directoryNames(changed)).toEqual(
    directoryNames(stock).filter((name) => name !== "AUTOEXC.BAK"),
  );
  await page.reload();
  await expect(page.locator("#power")).toBeEnabled();
  await expect(page.locator("#storage-status")).toContainText(
    "Using the disk saved",
  );
  expect((await exportDisk(page)).equals(changed)).toBe(true);
  await page.locator("#session-controls summary").click();
  await page.locator("#forget-disk").click();
  await expect(page.locator("#storage-status")).toContainText("discarded");
  await page.reload();
  await expect(page.locator("#power")).toBeEnabled();
  expect(
    createHash("sha256")
      .update(await exportDisk(page))
      .digest("hex"),
  ).toBe(createHash("sha256").update(stock).digest("hex"));
  await expect(page.locator("#error")).toBeEmpty();
});
