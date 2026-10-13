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

test('3D specimen rotates independently, slides into its sleeve and releases the renderer on close', async({page})=>{
  test.setTimeout(60000);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.locator('[data-component="diskette"]').click();
  await expect(page.locator('#diskette-viewer')).toHaveAttribute('data-ready','true');
  await page.getByRole('button',{name:'Slide into sleeve',exact:true}).click();
  await expect(page.getByRole('button',{name:'Slide out of sleeve',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Flip diskette and sleeve',exact:true}).click();
  await page.locator('#detail-close').click();
  await expect(page.locator('#diskette-viewer canvas')).toHaveCount(0);
  await page.locator('[data-component="diskette"]').click();
  await expect(page.locator('#diskette-viewer')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#diskette-viewer canvas')).toHaveCount(1);
});

test('removed disk can be dragged back into its open drive', async({page})=>{
  test.setTimeout(60000);
  const {PerspectiveCamera,Vector3}=await import('three');
  await page.setViewportSize({width:1440,height:1100});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo');
  await page.locator('#drive-lever-0').click();await page.locator('#drive-media-0').click();
  await expect(page.locator('#drive-media-0')).toHaveText('Insert disk A');
  await page.locator('[data-view="front"]').click();
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  const box=await page.locator('#viewport').boundingBox();
  const camera=new PerspectiveCamera(36,box.width/box.height,.01,40);
  camera.position.set(0,1.9,3.8);camera.lookAt(0,.5,0);camera.updateMatrixWorld();
  function point(x,y,z){const p=new Vector3(x*.0025,z*.0025,-y*.0025).project(camera);return {x:box.x+(p.x+1)*box.width/2,y:box.y+(1-p.y)*box.height/2};}
  const start=point(365,-110,6.5),end=point(-158,-213,78);
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await expect(page.locator('#disk-drag-hint')).toBeVisible();
  await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();
  await expect(page.locator('#drive-media-0')).toHaveText('Remove disk A');
});
