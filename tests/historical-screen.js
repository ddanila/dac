import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expect } from '@playwright/test';

// TOS/M 1.0's on-disk 8×12 font, not templates learned from emulator output.
// This fixture deliberately qualifies only the bundled historical configuration.
const disk = await readFile(new URL('../public/media/robotron/tosm10.img', import.meta.url));
const font = disk.subarray(106496, 108032);
const templates = Array.from({ length: 95 }, (_, i) => ({
  character: String.fromCharCode(i + 32),
  rows: Array.from({ length: 12 }, (_, y) => font[y * 128 + i + 32]),
}));

export async function historicalScreen(page) {
  return page.locator('#screen').evaluate((canvas, templates) => {
    if (canvas.width !== 640 || canvas.height !== 288) return '';
    const pixels = canvas.getContext('2d').getImageData(0, 0, 640, 288).data;
    const lines = [];
    for (let row = 0; row < 24; row++) {
      let line = '';
      for (let col = 0; col < 80; col++) {
        const bits = Array.from({ length: 12 }, (_, y) => {
          let value = 0;
          for (let x = 0; x < 8; x++) {
            const p = ((row * 12 + y) * 640 + col * 8 + x) * 4;
            if (pixels[p + 1] > 100) value |= 1 << (7 - x);
          }
          return value;
        });
        // Prefer exact matches; tolerate the programmed reverse-block cursor.
        const match = templates.find(t => t.rows.every((v, y) => v === bits[y]))
          || templates.find(t => t.rows.every((v, y) => (v ^ 255) === bits[y]));
        line += match?.character ?? '�';
      }
      lines.push(line.trimEnd());
    }
    return lines.join('\n').trimEnd();
  }, templates);
}

export async function expectHistoricalPrompt(page, timeout = 45000) {
  await expect.poll(() => historicalScreen(page), { timeout }).toMatch(/(?:^|\n)A>$/);
}

export async function typeHistorical(page, text) {
  await page.locator('#paste-controls').evaluate(e => e.open = true);
  await page.locator('#paste-text').fill(text);
  await page.locator('#paste-send').click();
  await expect(page.locator('#paste-status')).toHaveText('Typing complete.', { timeout: 20000 });
}

export const historicalFontHash = createHash('sha256').update(font).digest('hex');
