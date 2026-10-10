import { keyPoint } from "./robotron-picking.js";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import manifest from "../src/robotron-media.json" with { type: "json" };

test("bundled historical media retains its documented identities", async () => {
  for (const f of manifest.files) {
    const data = await readFile(
      new URL(`../public/media/robotron/${f.file}`, import.meta.url),
    );
    expect(data.length).toBe(f.size);
    expect(createHash("sha256").update(data).digest("hex")).toBe(f.sha256);
  }
});

test("3D keyboard enters DIR in historical TOS/M and exports an unchanged read-only disk", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.diskActivity = 0;
    window.Worker = class extends Base {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", ({ data }) => {
          if (data.type === "frame") window.diskActivity = data.activity;
        });
      }
    };
  });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await expect(page.locator("#media-label")).toHaveText("S550 · TOS/M 1.0");
  await page.locator("#turbo").check();
  await page.locator("#power").click();
  await page.locator("#screen-view").click();
  await expect
    .poll(() => page.evaluate(() => window.diskActivity), { timeout: 45000 })
    .toBeGreaterThan(77);
  // Allow the final boot command to finish before typing a new command.
  await page.waitForTimeout(1000);
  const reads = await page.evaluate(() => window.diskActivity);
  await page.locator('[data-view="keyboard"]').click();
  const model = await (
    await page.request.get("/models/robotron-1715m/model.json")
  ).json();
  for (const code of [100, 105, 114, 13]) {
    const key = model.keys.find((k) => k.input.code === code);
    const point = await keyPoint(page, key, model);
    await page.mouse.click(point.x, point.y);
    await expect(page.locator("#key-feedback")).toHaveText(`Sent ${key.label}`);
  }
  await expect
    .poll(() => page.evaluate(() => window.diskActivity))
    .toBeGreaterThan(reads);
  await page.locator("#power").click();
  await page.locator("#media-controls summary").click();
  const downloaded = page.waitForEvent("download");
  await page.locator("#export").click();
  const data = await readFile(await (await downloaded).path());
  expect(createHash("sha256").update(data).digest("hex")).toBe(
    manifest.files[2].sha256,
  );
  await expect(page.locator("#error")).toBeEmpty();
});

test("corrupt historical media is rejected and the diagnostic can recover", async ({
  page,
}) => {
  await page.route("**/media/robotron/s550.bin*", (route) =>
    route.fulfill({ body: Buffer.alloc(2048) }),
  );
  await page.goto("/");
  await expect(page.locator("#error")).toContainText("integrity check failed");
  await expect(page.locator("#power")).toBeDisabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#power")).toBeEnabled();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");
});
