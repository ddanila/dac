import { test, expect } from "@playwright/test";
import { PerspectiveCamera, Vector3, Euler, Group, Mesh, MeshBasicMaterial, BoxGeometry, Raycaster } from "three";
import { visiblePickTargets, inCameraView } from "../src/scene.js";
import { photoProjection } from "../src/robotron-model.js";


test("photo projection preserves corners and perspective, not just a diagonal blend", () => {
  const quad = [
    [0, 0],
    [2, 0],
    [1.5, 1],
    [0.5, 1],
  ];
  for (const [i, [u, v]] of [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].entries())
    expect(photoProjection(quad, u, v)).toEqual(quad[i]);
  const centre = photoProjection(quad, 0.5, 0.5);
  expect(centre[0]).toBeCloseTo(1);
  expect(centre[1]).toBeCloseTo(2 / 3);
});




test("inspection separates the exterior and links owner rear references", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  await page.locator("#separate-parts").check();
  await expect(page.locator("#inspection-text")).toContainText(
    "owner photographs",
  );
  await page.locator("#open-case").uncheck();
  await page.getByRole("button", { name: "Rear", exact: true }).click();
  await expect(page.locator("#inspection-text")).toContainText(
    "October 12",
  );
  await expect(page.locator("#reference-photo")).toBeVisible();
  await expect(page.locator("#reference-photo")).toHaveAttribute("href", /20261012_125413618/);
});

test("a static exhibit stops submitting GPU draws", async ({ page }) => {
  await page.addInitScript(() => {
    window.gpuDraws = 0;
    for (const name of ["drawArrays", "drawElements"]) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        window.gpuDraws++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  await page.locator("#viewport").screenshot();
  const before = await page.evaluate(() => window.gpuDraws);
  expect(before).toBeGreaterThan(0);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.gpuDraws)).toBe(before);
  await page.getByRole("button", { name: "Keyboard", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.gpuDraws))
    .toBeGreaterThan(before);
});



test("firmware LED bits independently light both model lamps and survive gesture release", async ({ page }) => {
  await page.goto("/tests/model-harness.html");
  const result = await page.evaluate(async () => {
    const { Texture } = await import("/tests/browser-three.js");
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { createFirmwareKeyboard } = await import("/src/robotron-matrix.js");
    const model = await loadRobotron(new Texture());
    const firmware = createFirmwareKeyboard({ send() {}, onFeedback() {},
      onState: state => model.modifiers(state), isPowered: () => true });
    const read = () => ["caps", "si-so"].map(name =>
      model.group.getObjectByName(`keyboard-${name}-lamp`).material.emissive.getHex() !== 0);
    model.power(true);
    const states = [0, 1, 2, 3].map(bits => { firmware.leds(bits); return read(); });
    firmware.reset();
    const released = read();
    model.power(false);
    const off = read();
    model.power(true);
    firmware.leds(0);
    return { states, released, off, reset: read() };
  });
  expect(result.states).toEqual([[false, false], [false, true], [true, false], [true, true]]);
  expect(result.released).toEqual([true, true]);
  expect(result.off).toEqual([false, false]);
  expect(result.reset).toEqual([false, false]);
});


test("picking prunes hidden assemblies and transparent covers before raycasting", () => {
  const root = new Group(), hidden = new Group(), transparent = new Mesh(
    new BoxGeometry(1, 1, 1), new MeshBasicMaterial({transparent: true, opacity: 0.16}));
  hidden.visible = false;
  const blocked = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  const hiddenChild = blocked.clone();
  hidden.add(hiddenChild);
  transparent.add(blocked.clone());
  const key = blocked.clone(); key.position.z = -2;
  root.add(hidden, transparent, key); root.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));
  const targets = visiblePickTargets(root);
  expect(targets).toEqual([key]);
  expect(ray.intersectObjects(targets, false)[0].object).toBe(key);
  hidden.visible = true;
  expect(ray.intersectObjects(visiblePickTargets(root), false)[0].object).toBe(hiddenChild);
});

test("CRT video invalidation respects the camera and ancestor visibility", () => {
  const camera = new PerspectiveCamera(36, 1, 0.01, 40);
  const root = new Group(), screen = new Mesh(new BoxGeometry(1, 1, 0.01));
  root.add(screen); screen.position.z = -3;
  expect(inCameraView(screen, camera)).toBe(true);
  screen.position.x = 10;
  expect(inCameraView(screen, camera)).toBe(false);
  screen.position.x = 0; screen.position.z = 3;
  expect(inCameraView(screen, camera)).toBe(false);
  screen.position.z = -3; root.visible = false;
  expect(inCameraView(screen, camera)).toBe(false);
  root.visible = true;
  expect(inCameraView(screen, camera)).toBe(true);
});
