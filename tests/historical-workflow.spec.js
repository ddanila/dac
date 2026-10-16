import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { historicalScreen, expectHistoricalPrompt, typeHistorical } from './historical-screen.js';

async function exportedDisk(page) {
  await page.locator('#media-controls').evaluate(e => e.open = true);
  const download = page.waitForEvent('download');
  await page.locator('#export').click();
  return readFile(await (await download).path());
}

// Optional longer real-OS qualification; no extra historical boot in routine CI.
test('S600 file editing and checkpoint restore preserve guest text and disk bytes', async ({ page }) => {
  test.skip(process.env.DAC_HISTORICAL_QUALIFICATION !== '1', 'Run npm run test:historical explicitly.');
  test.setTimeout(120000);
  // Keep the key manifest for real DOM-to-matrix Ctrl+Z input; omit heavy meshes.
  await page.route(/\/models\/robotron-1715m\/(?!model\.json)/,
    route => route.fulfill({ status: 503, body: 'Geometry omitted in OS workflow fixture' }));
  await page.goto('/');
  await expect(page.locator('#power')).toBeEnabled();
  await page.locator('#media-controls').evaluate(e => e.open = true);
  await page.locator('#writable').check();
  await page.locator('#historical').click();
  await expect(page.locator('#power')).toBeEnabled();
  await page.locator('#turbo').check();
  await page.locator('#power').click();
  await expectHistoricalPrompt(page);
  await expect(page.locator('#keyboard-mode')).toContainText('Keyboard firmware');

  await typeHistorical(page, 'PIP\n');
  await expect.poll(() => historicalScreen(page), { timeout: 15000 }).toMatch(/\n\*[^\n]*$/);
  await typeHistorical(page, 'DACEDIT.TXT=CON:\n');
  await expect.poll(() => historicalScreen(page)).toContain('*DACEDIT.TXT=CON:');
  await typeHistorical(page, 'S600 CHECKPOINT TEXT\n');
  await expect.poll(() => historicalScreen(page)).toContain('S600 CHECKPOINT TEXT');
  await page.locator('#screen-view').click();
  await page.locator('#screen').focus();
  await page.keyboard.press('Control+KeyZ', { delay: 150 });
  await expect.poll(() => historicalScreen(page), { timeout: 20000 }).toMatch(/\n\*[^\n]*$/);
  await typeHistorical(page, '\n');
  await expectHistoricalPrompt(page, 15000);
  await typeHistorical(page, 'TYPE DACEDIT.TXT\n');
  await expect.poll(() => historicalScreen(page), { timeout: 15000 })
    .toMatch(/TYPE DACEDIT\.TXT\nS600 CHECKPOINT TEXT\nA>$/);

  await page.locator('#checkpoint-controls').evaluate(e => e.open = true);
  await page.locator('#checkpoint-name').fill('S600 edited file');
  await page.locator('#checkpoint-save').click();
  await expect(page.locator('#checkpoint-status')).toContainText('saved with both disks');
  const savedDisk = await exportedDisk(page);
  const savedScreen = await historicalScreen(page);
  await typeHistorical(page, 'ERA DACEDIT.TXT\n');
  await expect.poll(() => historicalScreen(page), { timeout: 15000 }).toMatch(/ERA DACEDIT\.TXT\nA>$/);
  expect((await exportedDisk(page)).equals(savedDisk), await historicalScreen(page)).toBe(false);

  await page.locator('#checkpoint-restore').click();
  await expect(page.locator('#checkpoint-status')).toContainText('restored');
  await expect.poll(() => historicalScreen(page)).toBe(savedScreen);
  expect((await exportedDisk(page)).equals(savedDisk)).toBe(true);
  await typeHistorical(page, 'TYPE DACEDIT.TXT\n');
  await expect.poll(() => historicalScreen(page), { timeout: 15000 })
    .toMatch(/TYPE DACEDIT\.TXT\nS600 CHECKPOINT TEXT\nA>$/);
  await expect(page.locator('#error')).toBeEmpty();
});
