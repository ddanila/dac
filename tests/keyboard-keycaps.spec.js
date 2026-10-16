import {test,expect} from "@playwright/test";
import {keyPoint} from "./robotron-picking.js";
import {observeKeys} from "./keyboard-fixture.js";
test("physical keyboard holds the modeled key down until release and blur clears it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await observeKeys(page);
  await page.locator('[data-view="keyboard"]').click();
  const model = await (
    await page.request.get("/models/robotron-1715m/model.json")
  ).json();
  const key = model.keys.find((k) => k.input.code === 97);
  await page.locator("#viewport").focus();
  const point = await keyPoint(page, key, model);
  const clip = {
    x: Math.round(point.x) - 16,
    y: Math.round(point.y) - 12,
    width: 32,
    height: 24,
  };
  const picture = () => page.screenshot({ clip });
  let resting;
  await expect.poll(async () => {
    const frame = await picture(), stable = resting?.equals(frame);
    resting = frame; return !!stable;
  }).toBe(true);
  await page.keyboard.down("a");
  await page.waitForTimeout(250); // longer than the former 140 ms pulse
  const held = await picture();
  expect(held.equals(resting)).toBe(false);
  await page.keyboard.up("a");
  await expect.poll(async () => (await picture()).equals(resting)).toBe(true);
  await page.keyboard.down("a");
  await page.locator("#viewport").evaluate((el) => el.blur());
  await expect.poll(async () => (await picture()).equals(resting)).toBe(true);
  await page.keyboard.up("a");
});

test("latched Shift changes input state without leaving its keycap depressed", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await observeKeys(page);
  await page.locator('#key-list-toggle').click();
  await page.locator('[data-view="keyboard"]').click();
  const model = await (await page.request.get('/models/robotron-1715m/model.json')).json();
  const key = model.keys.find(k => k.input.modifier === 'shift');
  const point = await keyPoint(page, key, model);
  const clip = { x:Math.round(point.x)-12, y:Math.round(point.y)-10, width:24, height:20 };
  let resting;
  await expect.poll(async () => {
    const frame = await page.screenshot({clip}), stable = resting?.equals(frame);
    resting = frame; return !!stable;
  }).toBe(true);
  const button = page.locator(`#key-list [data-key="${key.id}"]`);
  await button.dispatchEvent('click');
  await expect(button).toHaveAttribute('aria-pressed','true');
  await expect.poll(async () => (await page.screenshot({clip})).equals(resting)).toBe(true);
  await page.locator('#viewport').focus();
  await page.keyboard.down('Shift');
  await page.waitForTimeout(200);
  expect((await page.screenshot({clip})).equals(resting)).toBe(false);
  await page.keyboard.up('Shift');
  await expect.poll(async () => (await page.screenshot({clip})).equals(resting)).toBe(true);
});
