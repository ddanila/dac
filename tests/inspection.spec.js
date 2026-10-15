import { test, expect } from "@playwright/test";
import { PerspectiveCamera, Vector3, Euler } from "three";
import { keyPoint } from "./robotron-picking.js";

test("typing view routes modeled and physical keyboard input", async ({
  page,
}) => {
  // Multi-step WebGL interactions take longer on CI software rendering.
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.sentKeys = [];
    window.contacts = [];
    window.Worker = class extends Base {
      constructor(...args) { super(...args); window.inputWorker = this; }
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
    "robotron-photo", {timeout: 20000});
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
  // This fixture checks input routing, not instruction execution. Suspend the
  // real worker's clock through its visibility protocol so software WebGL and
  // continuous emulation do not compete for the CI runner's CPU. Input still
  // reaches the powered real worker; live OS behavior is covered in museum.spec.
  await page.evaluate(() => window.inputWorker.postMessage({type:"visibility",hidden:true}));
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
});

test("mobile typing view keeps screen, model and notes ordered", async ({page}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo',{timeout:20000});
  await page.locator('[data-view="typing"]').click();
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
    "robotron-photo", {timeout: 20000});
  await page.locator('[data-view="drive-labels"]').click();
  await page.waitForTimeout(300);
  const box = await page.locator("#viewport").boundingBox();
  const camera = new PerspectiveCamera(36, box.width / box.height, 0.01, 40);
  camera.position.set(-0.22, 0.75, -0.42);
  camera.lookAt(-0.22, 0.49, 0.36);
  camera.updateMatrixWorld();
  // The owner adapter board covers the middle of the manufacturer plate.
  // Pick the exposed left end, as on the actual drive.
  const p = new Vector3(-212, 0.23 - 145, 91.4 + 115)
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


test("rear views keep their controls clear of the canvas on desktop and mobile", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute("data-model", "robotron-photo", {timeout: 20000});
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ["back", "rear-panel"]) {
      await page.locator(`[data-view="${view}"]`).click();
      const canvas = await page.locator("#viewport canvas").boundingBox();
      const controls = await page.locator(".stage-bottom").boundingBox();
      expect(canvas.y + canvas.height).toBeLessThanOrEqual(controls.y);
      expect(canvas.width).toBeGreaterThan(250);
      expect(canvas.height).toBeGreaterThan(200);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await expect(page.locator("#inspection-title")).toHaveText("Rear sockets and markings");
  await page.locator("#reference-details").click();
  await expect(page.locator("#detail-photo")).toHaveAttribute("src", /20261012_125413618/);
  expect(errors).toEqual([]);
});

test("flat display leaves wrapped view controls clickable on desktop and mobile",async({page})=>{
 await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
 await expect(page.locator("#viewport")).toHaveAttribute("data-model","robotron-photo", {timeout: 20000});
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  await page.locator("#screen-view").click();
  await expect(page.locator("#screen-panel")).toBeVisible();
  const panel=await page.locator("#screen-panel").boundingBox();
  const controls=await page.locator(".stage-bottom").boundingBox();
  expect(panel.y+panel.height).toBeLessThan(controls.y);
  await page.locator('[data-view="keyboard"]').click();
  await expect(page.locator("#screen-panel")).toBeHidden();
 }
});
