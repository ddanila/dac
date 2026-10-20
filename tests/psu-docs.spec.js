import { test, expect } from '@playwright/test';

// These pages must remain usable without the museum's JavaScript/WebGL runtime.
test.use({javaScriptEnabled: false});
for (const lang of ['de', 'en', 'ru']) {
  test(`PSU ${lang}: local links, language navigation, mobile and print`, async ({page, request}) => {
    const response = await page.goto(`/docs/robotron-psu/${lang}.html`);
    expect(response.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('nav [aria-current="page"]')).toHaveAttribute('hreflang', lang);
    await expect(page.locator('#sources')).toBeVisible();
    const links = await page.locator('a[href], link[href]').evaluateAll(elements => elements.map(el => el.href));
    const checked = new Set();
    for (const href of links) {
      const url = new URL(href);
      if (url.origin !== new URL(page.url()).origin || checked.has(href)) continue;
      checked.add(href);
      const target = await request.get(url.href);
      expect(target.status(), href).toBe(200);
      if (url.hash) {
        // Local fragment IDs are ASCII in the authored guides.
        expect(await target.text(), href).toContain(`id="${decodeURIComponent(url.hash.slice(1))}"`);
      }
    }
    // HTTP 200 alone can be an HTML fallback. Decode every photo and SVG in
    // the browser, including lazy images, before accepting asset-only changes.
    const images = page.locator('img');
    expect(await images.count()).toBeGreaterThan(0);
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(el =>
        el.complete && el.naturalWidth > 0 && el.naturalHeight > 0),
      {message: `Image failed to decode: ${await img.getAttribute('src')}`}).toBe(true);
    }
    for (const width of [390, 1280]) {
      await page.setViewportSize({width, height: 900});
      expect(await page.locator('body').evaluate(el => el.scrollWidth)).toBeLessThanOrEqual(width);
    }
    await page.emulateMedia({media: 'print'});
    await expect(page.locator('#transistors')).toBeVisible();
    await expect(page.locator('#substitutes')).toBeVisible();
    await expect(page.locator('#sources')).toBeVisible();
  });
}

test('PSU landing page exposes all three translations and source register', async ({page, request}) => {
  await page.goto('/docs/robotron-psu/index.html');
  for (const lang of ['de', 'en', 'ru']) {
    await expect(page.locator(`a[href="${lang}.html"]`)).toBeVisible();
  }
  const source = await request.get('/docs/robotron-psu/sources.json');
  expect(source.status()).toBe(200);
  expect(await source.json()).toHaveProperty('sources');
});
