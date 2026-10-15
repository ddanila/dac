import {cachedMesh,requestedMesh,requestedPackage} from './model-asset-paths.js';
import { test, expect } from "@playwright/test";
// Wait for the final glyph of the diagnostic boot message, not merely the
// opaque blank framebuffer: input sent before boot completes can be lost.
async function waitForDiagnostic(page) {
  await expect.poll(() => page.locator("#screen").evaluate(canvas => {
    const pixels = canvas.getContext("2d").getImageData(23 * 8, 3 * 16, 8, 16).data;
    return pixels.some((v, i) => i % 4 === 1 && v > 100);
  }), {timeout: 20000}).toBe(true);
}
test("Robotron power, live pixels, keyboard, reset and inspection", async ({
  page,
}) => {
  // Model loading, typing and reset share this budget on software WebGL.
  test.setTimeout(60000);
  // Fan animation has dedicated coverage; keep input/core checks deterministic.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  const enclosurePhotos = [];
  page.on("request", (request) => {
    const url = request.url();
    // These reference photos contain complete panels, physical feet or cables.
    // Loading them as skins would reintroduce the duplicated-feature regression.
    if (
      /photos\/PXL_20261009_(133001660|133005363|133028313|132916421|132919894)/.test(
        url,
      )
    )
      enclosurePhotos.push(url);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");

  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  const power = page.getByRole("button", { name: "Power on", exact: false });
  await expect(power).toBeEnabled();
  await power.click();
  await expect(page.getByRole("status")).toHaveText("Running");
  await page.getByRole("button", { name: "Screen", exact: true }).click();
  const canvas = page.locator("#screen");
  await expect(canvas).toBeVisible();
  const hash = (inputOnly = true) =>
    canvas.evaluate((c, inputOnly) => {
      // The diagnostic writes typed input on row 5; boot text can still be
      // finishing its scan when the first live raster arrives.
      const p = c.getContext("2d").getImageData(0, inputOnly ? 80 : 0, c.width, inputOnly ? 16 : c.height).data;
      let n = 0;
      for (let i = 0; i < p.length; i += 4) n += p[i];
      return n;
    }, inputOnly);
  await expect.poll(() => hash(false)).toBeGreaterThan(640 * 384 * 18);
  await waitForDiagnostic(page);
  const before = await hash();
  await canvas.focus();
  // One glyph proves input/reset; longer text is covered by keyboard/OS tests.
  await page.keyboard.press("a");
  await expect.poll(hash).not.toBe(before);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect.poll(hash).toBe(before);
  await page.getByRole("button", { name: "Underneath" }).click();
  await expect(canvas).toBeHidden();
  // Clean reconstruction: owner reference photos are not enclosure skins.
  expect(enclosurePhotos).toHaveLength(0);
  const model = await (
    await page.request.get("/models/robotron-1715m/model.json")
  ).json();
  expect(model.patches.some((p) => p.name.includes("wear"))).toBe(false);
  await page.getByRole("button", { name: "Power off", exact: false }).click();
  await expect(page.getByRole("status")).toHaveText("Powered off");
  expect(errors).toEqual([]);
  await expect(page.locator("#error")).toBeEmpty();
});
for (const value of ["0", "1"]) {
  test(`profile ${value} powers on and off independently`, async ({page}) => {
    await page.goto("/");
    await expect(page.locator("#power")).toBeEnabled();
    await page.locator("#machine").selectOption(value);
    await expect(page.locator("#viewport")).toHaveAttribute("data-model", "provisional");
    await page.locator("#power").click();
    await expect(page.getByRole("status")).toHaveText("Running");
    await page.locator("#power").click();
    await expect(page.getByRole("status")).toHaveText("Powered off");
    await expect(page.locator("#error")).toBeEmpty();
  });
}

test("bad media is rejected clearly and diagnostic can recover", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#rom").setInputFiles({
    name: "wrong.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(12),
  });
  await page.locator("#prom").setInputFiles({
    name: "cas.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(256),
  });
  await page.getByRole("button", { name: "Use selected files" }).click();
  await expect(page.getByRole("alert")).toContainText("rejected");
  await page.getByRole("button", { name: "Restore DAC diagnostic" }).click();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await expect(page.getByRole("status")).toHaveText("Running");
});

test("physical Robotron switches power and reset the live core", async ({
  page,
}) => {
  // Several camera changes and live-core gestures share this test budget.
  // Software WebGL on CI needs longer than the default 30 seconds.
  test.setTimeout(60000);
  // Fan animation has dedicated coverage; keep input/core checks deterministic.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { PerspectiveCamera, Vector3 } = await import("three");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(()=>{
    const Base=window.Worker;window.physicalResets=0;
    window.Worker=class extends Base {postMessage(message,...args){if(message.type==="reset")window.physicalResets++;return super.postMessage(message,...args);}};
  });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls summary").click();
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");

  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  await expect(page.locator("#power")).toBeEnabled();
  let viewport = await page.locator("#viewport").boundingBox();
  const camera = new PerspectiveCamera(
    36,
    viewport.width / viewport.height,
    0.01,
    40,
  );
  camera.position.set(0, 1.9, 3.8);
  camera.lookAt(0, 0.5, 0);
  camera.updateMatrixWorld();
  async function switchAt(x) {
    await page.getByRole("button", { name: "Front", exact: true }).click();
    viewport = await page.locator("#viewport").boundingBox();
    const p = new Vector3(x * 0.0025, 17 * 0.0025, (x > 0 ? 198.4 : 199.6) * 0.0025).project(
      camera,
    );
    await page.mouse.click(
      viewport.x + ((p.x + 1) * viewport.width) / 2,
      viewport.y + ((1 - p.y) * viewport.height) / 2,
    );
  }
  await switchAt(207);
  await expect(page.getByRole("status")).toHaveText("Running");
  const hash = (inputOnly = true) =>
    page.locator("#screen").evaluate((c, inputOnly) =>
      c.getContext("2d").getImageData(0, inputOnly ? 80 : 0, c.width, inputOnly ? 16 : c.height)
        .data.reduce((n, v) => n + v, 0), inputOnly);
  // Observe live boot pixels, then compare the input row independently of
  // boot text that may still be finishing its first raster scan.
  await expect.poll(() => hash(false), { timeout: 20000 }).toBeGreaterThan(640 * 288 * 255);
  await waitForDiagnostic(page);
  const before = await hash();
  await page.getByRole("button", { name: "Screen", exact: true }).click();
  await page.locator("#screen").focus();
  // One glyph proves input/reset; longer text is covered by keyboard/OS tests.
  await page.keyboard.press("a");
  await expect.poll(hash).not.toBe(before);
  await switchAt(-208);
  await expect.poll(hash).toBe(before);
  await switchAt(207);
  await expect(page.getByRole("status")).toHaveText("Powered off");
  expect(await page.evaluate(()=>window.physicalResets)).toBe(1);
  await switchAt(-208);
  expect(await page.evaluate(()=>window.physicalResets)).toBe(1);
});

test("a missing model preserves the accessible emulator and honest labels", async ({
  page,
}) => {
  await page.route("**/models/robotron-1715m/model.json*", (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "unavailable",
  );
  await expect(page.locator("#model-note")).toContainText("MODEL UNAVAILABLE");
  await expect(page.locator("#status")).toHaveText("Powered off");
  await page.locator("#viewport canvas").click({ position: { x: 5, y: 100 } });
  await page.waitForTimeout(100); // Allow a mistakenly queued power request to return.
  await expect(page.locator("#status")).toHaveText("Powered off");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await expect(page.getByRole("status")).toHaveText("Running");
  await page.locator("#power").click();
  await expect(page.getByRole("status")).toHaveText("Powered off");
  await page.locator("#machine").selectOption("0");
  await expect(page.locator("#model-note")).toContainText("PROVISIONAL");
});


test("model loading shows real percentage progress and clears when ready", async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route("**/"+cachedMesh("meshes/case-base.stl").file+"?*", async route => { await gate; await route.continue(); });
  await page.goto("/");
  const card = page.locator("#model-loading"), bar = page.getByRole("progressbar", {name: "3D model loading"});
  await expect(card).toBeVisible();
  await expect(page.locator("#viewport")).toHaveAttribute("aria-busy", "true");
  await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  await page.evaluate(() => {
    const bar = document.getElementById("model-loading-bar");
    window.loadingSamples = [Number(bar.getAttribute("aria-valuenow"))];
    new MutationObserver(() => window.loadingSamples.push(Number(bar.getAttribute("aria-valuenow"))))
      .observe(bar, { attributes: true, attributeFilter: ["aria-valuenow"] });
  });
  const percent = Number(await bar.getAttribute("aria-valuenow"));
  expect(percent).toBeLessThan(100);
  await expect(page.locator("#model-loading-percent")).toContainText("%");
  await page.locator("#machine").selectOption("0");
  await expect(card).toBeHidden();
  await page.locator("#machine").selectOption("2");
  await expect(card).toBeVisible();
  release();
  await expect(page.locator("#viewport")).toHaveAttribute("data-model", "robotron-photo", {timeout: 20000});
  await expect(card).toBeHidden();
  await expect(page.locator("#model-loading-bar")).toHaveAttribute("aria-valuenow", "100");
  const samples = await page.evaluate(() => window.loadingSamples);
  expect(samples.length).toBeGreaterThan(2);
  expect(samples.every((value, index) => index === 0 || value >= samples[index - 1])).toBe(true);
  await expect(page.locator("#viewport")).toHaveAttribute("aria-busy", "false");
});


test('front controls rock left/right and reset returns after release or pulse', async()=>{
  const {Mesh,BoxGeometry,MeshBasicMaterial}=await import('three');
  const {createCaseControls}=await import('../src/robotron-model.js');
  const objects=new Map(['power','reset'].map(n=>[n,new Mesh(new BoxGeometry(),new MeshBasicMaterial())]));
  const controls=createCaseControls(objects,{powerPivot:[207,-194.8,17],rockerAngle:8,resetTravel:1.2});
  controls.tick(0,false,true);const off=objects.get('power').rotation.z;
  controls.tick(1,true,true);expect(objects.get('power').rotation.z).toBe(-off);
  controls.press(true);controls.tick(2,true,true);expect(objects.get('reset').position.y).toBe(1.2);
  controls.press(false);controls.tick(3,true,true);expect(objects.get('reset').position.y).toBe(0);
  controls.pulse(4);controls.tick(5,true,true);expect(objects.get('reset').position.y).toBe(1.2);
  expect(controls.tick(165,true,true)).toBe(true);expect(objects.get('reset').position.y).toBe(0);
  expect(controls.tick(166,true,true)).toBe(false);
});
