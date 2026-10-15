import {test, expect} from '@playwright/test';
import {printerPages} from '../src/robotron-activities.js';
test('paper preserves carriage return, overprint, tabs, backspace and page breaks', () => {
  const bytes = new TextEncoder().encode('abc\rZ\r\nA\tB\bC\fnext\x1b');
  expect(printerPages(bytes)).toEqual(['Zbc\nA       C', 'next⟦1b⟧']);
});
test('practice sessions leave persistence preference intact', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('dac-remember-disk','true'));
  await page.goto('/?activity=wordstar');
  await expect(page.locator('#remember-disk')).not.toBeChecked();
  await expect(page.locator('#remember-disk')).toBeDisabled();
  await expect(page.locator('#activity-instructions')).toContainText('WS DAC.TXT');
  expect(await page.evaluate(()=>localStorage.getItem('dac-remember-disk'))).toBe('true');
  await page.getByText('Printer output', {exact:true}).click();
  await expect(page.locator('#power')).toBeEnabled();
  await page.locator('#printer-preview').click();
  await expect(page.locator('#printer-paper')).toContainText('(blank page)');
});
test('CRT persistence keeps source pixels intact and resets after a long pause', async ({page}) => {
  await page.goto('/tests/model-harness.html');
  const result=await page.evaluate(async()=>{
    const {createCrtPresentation}=await import('/src/crt-presentation.js');
    const source=document.createElement('canvas');source.width=source.height=2;
    const ctx=source.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,2,2);
    const p=createCrtPresentation(source);p.tick(100);p.settings({persistence:100});
    ctx.fillStyle='#101812';ctx.fillRect(0,0,2,2);p.update();p.tick(110);
    const sample=()=>p.canvas.getContext('2d').getImageData(0,0,1,1).data[0];
    const glow=sample(),original=ctx.getImageData(0,0,1,1).data[0];
    p.tick(120);const decayed=sample();p.update();p.tick(2000);
    return {glow,original,decayed,afterPause:sample()};
  });
  expect(result.glow).toBeGreaterThan(result.decayed);
  expect(result.original).toBe(16);expect(result.afterPause).toBe(16);
});
test('display values and practice progress are visible and resettable',async({page})=>{
 await page.goto('/?activity=wordstar');
 const activity=page.locator('#activity-instructions');
 await expect(activity.getByRole('status')).toContainText('0 of 5');
 await activity.locator('input').first().check();
 await expect(activity.getByRole('status')).toContainText('1 of 5');
 await activity.getByRole('button').click();
 await expect(activity.getByRole('status')).toContainText('0 of 5');
 await page.getByText('Display adjustments',{exact:true}).click();
 await page.locator('#crt-brightness').fill('1.5');await page.locator('#crt-brightness').dispatchEvent('input');
 await expect(page.locator('#crt-brightness-value')).toHaveText('1.50×');
 await page.locator('#crt-defaults').click();await expect(page.locator('#crt-brightness-value')).toHaveText('1.00×');
 await expect(page.getByRole('link',{name:'Download the standalone museum preservation package'})).toBeVisible();
});
