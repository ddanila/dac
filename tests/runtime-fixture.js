import {withoutCAD} from './without-cad.js';
import {expect} from '@playwright/test';

// Storage, input and worker tests exercise the real runtime without loading CAD.
// Match the pathname so cache-busting query parameters cannot bypass the fixture.
export async function runtimeReady(page, path = "/") {
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  await withoutCAD(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(path);
  try {
    await expect(page.locator('#power')).toBeEnabled();
  } catch (error) {
    throw new Error(`${error.message}\nStartup failures: ${failures.join('\n') || 'none'}\nUI error: ${await page.locator('#error').textContent()}`, {cause:error});
  }
}
