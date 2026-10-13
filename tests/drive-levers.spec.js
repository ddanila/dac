import { test, expect } from '@playwright/test';

test('drive levers gate removal, retain media and expose specimen sides without loading full label photos', async ({page}) => {
  // Multiple WebGL gestures and four image views share this test budget.
  test.setTimeout(60000);
  const requests=[];
  page.on('request', r => requests.push(r.url()));
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo');
  await expect(page.locator('#drive-lever-0')).toBeEnabled();
  expect(requests.some(u=>u.includes('/photos/'))).toBe(false);
  await expect(page.locator('#drive-media-0')).toBeDisabled();
  await page.locator('#drive-lever-0').click();
  await expect(page.locator('#drive-lever-0')).toHaveText('Close drive A lever');
  await expect(page.locator('#drive-media-0')).toBeEnabled();
  await page.locator('#drive-media-0').click();
  await expect(page.locator('#drive-media-0')).toHaveText('Insert disk A');
  await page.locator('#drive-media-0').click();
  await expect(page.locator('#drive-media-0')).toHaveText('Remove disk A');
  await page.locator('#drive-lever-0').click();
  await expect(page.locator('#drive-media-0')).toBeDisabled();
  await page.locator('[data-component="diskette"]').click();
  await expect(page.locator('#detail-title')).toHaveText('Danila’s diskette and storage sleeve');
  for (const label of ['Diskette · reverse','Sleeve · plain','Sleeve · instructions']) {
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page.locator('#detail-photo')).toHaveAttribute('alt',`Danila’s photograph: ${label}`);
  }
  await expect.poll(()=>page.locator('#detail-photo').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
});

test('the modeled lever is a working control', async ({page}) => {
  const {PerspectiveCamera,Vector3}=await import('three');
  await page.setViewportSize({width:1440,height:1100});
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo');
  await expect(page.locator('#drive-lever-0')).toBeEnabled();
  await page.locator('[data-view="drives"]').click();
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  const box=await page.locator('#viewport').boundingBox();
  const camera=new PerspectiveCamera(36,box.width/box.height,.01,40);
  camera.position.set(.45,1.15,1.1);camera.lookAt(-.2,.2,.25);camera.updateMatrixWorld();
  const point=new Vector3(-113*.0025,78*.0025,218*.0025).project(camera);
  await page.mouse.click(box.x+(point.x+1)*box.width/2,box.y+(1-point.y)*box.height/2);
  await expect(page.locator('#drive-lever-0')).toHaveText('Close drive A lever');
});
