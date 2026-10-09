import { test, expect } from "@playwright/test";
test("power, live pixels, keyboard, reset, inspection and three profiles", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const power = page.getByRole("button", { name: "Power on", exact: false });
  await expect(power).toBeEnabled();
  await power.click();
  await expect(page.getByRole("status")).toHaveText("Running");
  await page.getByRole("button", { name: "Screen", exact: true }).click();
  const canvas = page.locator("#screen");
  await expect(canvas).toBeVisible();
  const hash = () =>
    canvas.evaluate((c) => {
      const p = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < p.length; i += 4) n += p[i];
      return n;
    });
  await expect.poll(hash).toBeGreaterThan(640 * 384 * 18);
  const before = await hash();
  await canvas.focus();
  await page.keyboard.type("HELLO");
  await expect.poll(hash).not.toBe(before);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect.poll(hash).toBe(before);
  await page.getByRole("button", { name: "Underneath" }).click();
  await expect(canvas).toBeHidden();
  await page.getByRole("button", { name: "Power off", exact: false }).click();
  await expect(page.getByRole("status")).toHaveText("Powered off");
  for (const value of ["0", "1"]) {
    await page.locator("#machine").selectOption(value);
    await expect(power).toBeEnabled();
    await power.click();
    await expect(page.getByRole("status")).toHaveText("Running");
    await page.getByRole("button", { name: "Power off", exact: false }).click();
  }
  expect(errors).toEqual([]);
  await expect(page.locator("#error")).toBeEmpty();
});
test("bad media is rejected clearly and diagnostic can recover", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("summary").click();
  await page
    .locator("#rom")
    .setInputFiles({
      name: "wrong.bin",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(12),
    });
  await page
    .locator("#prom")
    .setInputFiles({
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
