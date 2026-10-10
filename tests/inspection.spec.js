import { test, expect } from "@playwright/test";
import { PerspectiveCamera, Vector3, Euler } from "three";
import { keyPoint } from "./robotron-picking.js";

test("typing view keeps screen and working modeled keys visible, including on mobile", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.sentKeys = [];
    window.contacts = [];
    window.Worker = class extends Base {
      postMessage(m, ...args) {
        if (m.type === "tap") window.sentKeys.push(m.key);
        if (m.type === "matrix") window.contacts.push([m.key, m.down]);
        return super.postMessage(m, ...args);
      }
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
  await page.locator('[data-view="typing"]').click();
  await expect(page.locator("#screen-panel")).toBeVisible();
  const manifest = await (
    await page.request.get("/models/robotron-1715m/model.json")
  ).json();
  const key = manifest.keys.find((k) => k.input.code === 97);
  await page.waitForTimeout(300);
  const point = await keyPoint(page, key, manifest);
  await page.mouse.click(point.x, point.y);
  await expect.poll(() => page.evaluate(() => window.sentKeys)).toContain(61);
  await page.locator("#viewport").focus();
  await page
    .locator("#viewport")
    .dispatchEvent("keydown", { key: "Unidentified", code: "Unidentified" });
  expect(await page.evaluate(() => window.contacts)).toEqual([]);
  await page.keyboard.down("AltLeft");
  await page.keyboard.up("AltLeft");
  expect(await page.evaluate(() => window.contacts)).toEqual([
    [70, true],
    [70, false],
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#screen-panel")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const stage = await page.locator(".stage").boundingBox();
  const notes = await page.locator("#inspection-notes").boundingBox();
  expect(stage.y + stage.height).toBeLessThanOrEqual(notes.y + 1);
  const screen = await page.locator("#screen-panel").boundingBox();
  const model = await page.locator("#viewport").boundingBox();
  expect(screen.y + screen.height).toBeLessThanOrEqual(model.y);
  await page.locator("#screen-view").click();
  await expect(page.locator(".stage")).not.toHaveClass(/typing/);
  await expect(page.locator("#screen-panel")).toBeHidden();
});

test("modeled manufacturer plate opens its owner photo and Escape restores the view", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  await page.locator('[data-view="drive-labels"]').click();
  await page.waitForTimeout(300);
  const box = await page.locator("#viewport").boundingBox();
  const camera = new PerspectiveCamera(36, box.width / box.height, 0.01, 40);
  camera.position.set(-0.22, 0.75, -0.42);
  camera.lookAt(-0.22, 0.49, 0.36);
  camera.updateMatrixWorld();
  const p = new Vector3(-140.75, 0.23 - 145, 91.4 + 115)
    .applyEuler(new Euler(-Math.PI / 2, 0, 0))
    .multiplyScalar(0.0025)
    .project(camera);
  await page.mouse.click(
    box.x + ((p.x + 1) * box.width) / 2,
    box.y + ((1 - p.y) * box.height) / 2,
  );
  await expect(page.locator("#specimen-detail")).toBeVisible();
  await expect(page.locator("#detail-description")).toContainText("044713");
  await expect(page.locator("#detail-photo")).toHaveAttribute(
    "src",
    /20250212_094057627/,
  );
  await expect
    .poll(() =>
      page
        .locator("#detail-photo")
        .evaluate((i) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("#specimen-detail")).toBeHidden();
  await page.locator("#reference-details").click();
  await expect(page.locator("#detail-title")).toHaveText(
    "Two drives with their own histories",
  );
  await page.locator("#detail-close").click();
  await expect(page.locator("#specimen-detail")).toBeHidden();
});
