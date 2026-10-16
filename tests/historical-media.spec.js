import { historicalScreen, expectHistoricalPrompt, historicalFontHash } from "./historical-screen.js";
import { keyPoint } from "./robotron-picking.js";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import manifest from "../src/robotron-media.json" with { type: "json" };

test("bundled historical media retains its documented identities", async () => {
  expect(historicalFontHash).toBe("9d0fd4ea9f5c5bae766d5dfb09813a20938c039907ebac92961a9569fc82ca47");
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
  // Full CAD rendering plus stock-OS boot and four 3D key gestures on software WebGL.
  // Bound the raster workload; keep all geometry, gestures and assertions.
  test.setTimeout(process.env.CI ? 90000 : 60000);
  await page.setViewportSize({ width: 960, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await expect(page.locator("#media-label")).toHaveText("S550 · TOS/M 1.0");
  await page.locator("#turbo").check();
  await page.locator("#power").click();
  await page.locator("#screen-view").click();
  await expectHistoricalPrompt(page);
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
  await expect.poll(() => historicalScreen(page), { timeout: 15000 }).toMatch(/PIP\s+COM/);
  await expectHistoricalPrompt(page, 15000);
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
