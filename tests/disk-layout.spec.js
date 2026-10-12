import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
function disk() {
  const b = Buffer.alloc(256 + 160 * 5376);
  b.write("EXTENDED CPC DSK File\r\nDisk-Info\r\n");
  b[0x30] = 80;
  b[0x31] = 2;
  b.fill(21, 0x34, 0x34 + 160);
  const order = [3, 1, 5, 2, 4];
  for (let t = 0; t < 160; t++) {
    const p = 256 + t * 5376;
    b.write("Track-Info\r\n", p);
    b[p + 0x10] = t >> 1;
    b[p + 0x11] = t & 1;
    b[p + 0x14] = 3;
    b[p + 0x15] = 5;
    b[p + 0x16] = 54;
    for (let i = 0; i < 5; i++) {
      b.set([t >> 1, t & 1, order[i], 3, 0, 0, 0, 4], p + 0x18 + i * 8);
      b.fill(order[i], p + 256 + i * 1024, p + 256 + (i + 1) * 1024);
    }
  }
  return b;
}
test("DSK drive B survives snapshot restoration and exports its original layout", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#media-controls").evaluate((e) => (e.open = true));
  await page.locator("#demo").click();
  await expect(page.locator("#media-label")).toHaveText("DAC diagnostic ROM");
  await page.locator("#drive-b-controls").evaluate((e) => (e.open = true));
  const bytes = disk();
  await page
    .locator("#disk-b")
    .setInputFiles({
      name: "ordered.dsk",
      mimeType: "application/octet-stream",
      buffer: bytes,
    });
  await page.locator("#insert-b").click();
  await expect(page.locator("#disk-b-status")).toContainText("inserted");
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
  await page.locator("#session-controls").evaluate((e) => (e.open = true));
  await page.locator("#save-state").click();
  await expect(page.locator("#storage-status")).toContainText(
    "Machine state saved",
  );
  await page.locator("#restore-state").click();
  await expect(page.locator("#storage-status")).toContainText(
    "Saved machine state restored",
  );
  const download = page.waitForEvent("download");
  await page.locator("#export-b").click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("dac-drive-b.dsk");
  expect(await readFile(await file.path())).toEqual(bytes);
  await expect(page.locator("#error")).toBeEmpty();
});
