import { test, expect } from "@playwright/test";
import { PerspectiveCamera, Vector3, Euler } from "three";
import { photoProjection } from "../src/robotron-model.js";

async function observeKeys(page) {
  await page.addInitScript(() => {
    const WorkerBase = window.Worker;
    window.sentKeys = [];
    window.Worker = class extends WorkerBase {
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
    "robotron-photo",
  );
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
}

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

test("keyboard buttons send documented bytes, latch modifiers and reset safely", async ({
  page,
}) => {
  await observeKeys(page);
  await page.locator("#key-list-toggle").click();
  const keys = page.locator("#key-list");
  const press = (label) =>
    keys
      .getByRole("button", { name: label, exact: true })
      .first()
      .dispatchEvent("click");
  await press("A");
  await press("Shift");
  await press("A");
  await press("CTRL");
  await press("C");
  await press("Caps Lock");
  await press("A");
  await press("Caps Lock");
  await press("PF1 · numeric or function keypad");
  await press("1 · numeric or function keypad");
  await press("Tab");
  expect(await page.evaluate(() => window.sentKeys)).toEqual([
    97, 65, 3, 65, 0xd1, 0xb1, 0x80,
  ]);
  await press("ALT");
  await expect(page.locator("#key-feedback")).toContainText("not verified");
  expect(await page.evaluate(() => window.sentKeys.length)).toBe(7);
  await press("CTRL");
  await page.locator("#reset").click();
  await expect(
    keys.getByRole("button", { name: "CTRL", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await press("Caps Lock");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(
    keys.getByRole("button", { name: "Caps Lock", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.locator("#power").click();
  await press("A");
  await expect(page.locator("#key-feedback")).toContainText("Power on");
  expect(await page.evaluate(() => window.sentKeys.length)).toBe(7);
});

test("a key on the 3D model types, while dragging and cancelled gestures do not", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await observeKeys(page);
  await page.getByRole("button", { name: "Keyboard", exact: true }).click();
  const manifest = await (
    await page.request.get("/models/robotron-1715m/model.json")
  ).json();
  const key = manifest.keys.find((k) => k.label === "A");
  const box = await page.locator("#viewport").boundingBox();
  const camera = new PerspectiveCamera(36, box.width / box.height, 0.01, 40);
  camera.position.set(0, 1.55, 1.45);
  camera.lookAt(0, 0.07, 0.88);
  camera.updateMatrixWorld();
  const vector = new Vector3(key.x, key.y, 8.1).applyEuler(
    new Euler((manifest.keyboard.slope * Math.PI) / 180, 0, 0),
  );
  vector
    .add(new Vector3(0, manifest.keyboard.y, manifest.keyboard.z))
    .applyEuler(new Euler(-Math.PI / 2, 0, 0))
    .multiplyScalar(manifest.scale)
    .project(camera);
  const x = box.x + ((vector.x + 1) * box.width) / 2,
    y = box.y + ((1 - vector.y) * box.height) / 2;
  await page.mouse.click(x, y);
  await expect(page.locator("#key-feedback")).toHaveText("Sent A");
  expect(await page.evaluate(() => window.sentKeys)).toEqual([97]);
  await page.locator("#viewport").focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#viewport")).not.toBeFocused();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y + 30, { steps: 5 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.sentKeys)).toEqual([97]);
  await page.getByRole("button", { name: "Keyboard", exact: true }).click();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page
    .locator("#viewport canvas")
    .dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.sentKeys)).toEqual([97]);
  await page.locator("#separate-parts").check();
  await expect(page.locator("#inspection-text")).toContainText(
    "not been modeled",
  );
  await page.locator("#separate-parts").uncheck();
  await page.getByRole("button", { name: "Rear", exact: true }).click();
  await expect(page.locator("#inspection-text")).toContainText(
    "intentionally absent",
  );
  await expect(page.locator("#reference-photo")).toBeHidden();
});
