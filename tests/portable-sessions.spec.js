import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
for (const kind of ["2", "0", "1"])
  test(`export/import state for machine ${kind}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("#power")).toBeEnabled();
    if (kind !== "2") await page.locator("#machine").selectOption(kind);
    else {
      await page.locator("#media-controls summary").click();
      await page.locator("#demo").click();
    }
    await expect(page.locator("#power")).toBeEnabled();
    await page.locator("#power").click();
    await page.waitForTimeout(300);
    await page.locator("#session-controls summary").click();
    const download = page.waitForEvent("download");
    await page.locator("#export-state").click();
    const bytes = await readFile(await (await download).path());
    await page.locator("#power").click();
    await expect(page.locator("#status")).toHaveText("Powered off");
    await page
      .locator("#import-state")
      .setInputFiles({
        name: "machine.dacstate",
        mimeType: "application/octet-stream",
        buffer: bytes,
      });
    await expect(page.locator("#storage-status")).toHaveText(
      "Imported machine state restored.",
    );
    await expect(page.locator("#status")).toHaveText("Running");
    bytes[bytes.length - 1] ^= 1;
    await page
      .locator("#import-state")
      .setInputFiles({
        name: "bad.dacstate",
        mimeType: "application/octet-stream",
        buffer: bytes,
      });
    await expect(page.locator("#storage-status")).toContainText("integrity");
    await expect(page.locator("#status")).toHaveText("Running");
    await expect(page.locator("#error")).toBeEmpty();
  });
test("drive B insert/export/eject and snapshot identity", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#drive-b-controls summary").click();
  await page.locator("#blank-b").click();
  await expect(page.locator("#disk-b-status")).toHaveText(
    "Drive B disk inserted.",
  );
  const download = page.waitForEvent("download");
  await page.locator("#export-b").click();
  const bytes = await readFile(await (await download).path());
  expect(bytes.length).toBe(819200);
  expect(bytes.every((x) => x === 0xe5)).toBe(true);
  await page.locator("#eject-b").click();
  await expect(page.locator("#export-b")).toBeDisabled();
  await page
    .locator("#disk-b")
    .setInputFiles({
      name: "bad.img",
      mimeType: "application/octet-stream",
      buffer: Buffer.alloc(8),
    });
  await page.locator("#insert-b").click();
  await expect(page.locator("#storage-status")).toContainText("800 KB");
  await expect(page.locator("#error")).toBeEmpty();
});
