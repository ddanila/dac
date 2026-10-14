import { test, expect } from '@playwright/test';

test('drive levers gate removal, retain media and expose specimen sides without loading full label photos', async ({page}) => {
  // Multiple WebGL gestures and four image views share this test budget.
  test.setTimeout(60000);
  const requests=[];
  page.on('request', r => requests.push(r.url()));
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
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
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
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
  await expect(page.locator('#diskette-viewer')).toHaveAttribute('data-ready','true', {timeout: 20000});
  await page.getByRole('button',{name:'Slide into sleeve',exact:true}).click();
  await expect(page.getByRole('button',{name:'Slide out of sleeve',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Flip diskette and sleeve',exact:true}).click();
  await page.locator('#detail-close').click();
  await expect(page.locator('#diskette-viewer canvas')).toHaveCount(0);
  await page.locator('[data-component="diskette"]').click();
  await expect(page.locator('#diskette-viewer')).toHaveAttribute('data-ready','true', {timeout: 20000});
  await expect(page.locator('#diskette-viewer canvas')).toHaveCount(1);
});

for (const open of [false, true]) {
test(`drag feedback ${open ? 'accepts an open' : 'rejects a closed'} drive B`, async({page})=>{
  test.setTimeout(60000);
  const {PerspectiveCamera,Vector3}=await import('three');
  await page.setViewportSize({width:1440,height:1100});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
  await page.locator('#drive-lever-0').click();await page.locator('#drive-media-0').click();
  await expect(page.locator('#drive-media-0')).toHaveText('Insert disk A');
  await page.locator('[data-view="front"]').click();
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  const box=await page.locator('#viewport').boundingBox();
  const camera=new PerspectiveCamera(36,box.width/box.height,.01,40);
  camera.position.set(0,1.9,3.8);camera.lookAt(0,.5,0);camera.updateMatrixWorld();
  function point(x,y,z){const p=new Vector3(x*.0025,z*.0025,-y*.0025).project(camera);return {x:box.x+(p.x+1)*box.width/2,y:box.y+(1-p.y)*box.height/2};}
  const start=point(365,-110,6.5),end=point(-4,-213,78);
  if (open) await page.locator('#drive-lever-1').click();
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  const fresh=await page.locator('#viewport').boundingBox();
  const dx=fresh.x-box.x,dy=fresh.y-box.y;
  await page.mouse.move(start.x+dx,start.y+dy);await page.mouse.down();
  await expect(page.locator('#disk-drag-hint')).toBeVisible();
  await page.mouse.move(end.x+dx,end.y+dy,{steps:4});
  await expect(page.locator('#disk-drag-hint')).toHaveAttribute('data-allowed',String(open));
  if (!open) await expect(page.locator('#disk-drag-hint')).toContainText('lever');
  await page.mouse.up();
  if (open) {
    await expect(page.locator('#drive-media-1')).toHaveText('Remove disk B');
    await expect(page.locator('#drive-media-0')).toBeDisabled();
  } else await expect(page.locator('#drive-media-0')).toHaveText('Insert disk A');
});
}



test('removed media moves to B with its protection and survives reload without resurrecting A',async({page})=>{
  await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'Runtime fixture'}));
  await page.goto('/');
  await expect(page.locator('#drive-lever-0')).toBeEnabled();
  await page.locator('#drive-lever-0').click();await page.locator('#drive-media-0').click();
  await page.locator('#drive-lever-1').click();
  await expect(page.locator('#drive-transfer-0')).toBeEnabled();
  await page.locator('#drive-transfer-0').click();
  await expect(page.locator('#storage-status')).toContainText('Disk 1 inserted in drive B');
  await expect(page.locator('#drive-media-0')).toBeDisabled();
  await expect(page.locator('#drive-media-1')).toHaveText('Remove disk B');
  await page.reload();
  await expect(page.locator('#drive-lever-0')).toBeEnabled();
  await expect(page.locator('#drive-media-0')).toBeDisabled();
  await expect(page.locator('#drive-media-1')).toHaveText('Remove disk B');
  await expect(page.locator('#drive-media-1')).toBeEnabled();
  await expect(page.locator('#writable-b')).not.toBeChecked();
  await expect(page.locator('#forget-disk')).toBeEnabled();
  await page.locator('#drive-media-1').click();await page.locator('#drive-transfer-1').click();
  await expect(page.locator('#storage-status')).toContainText('Disk 1 inserted in drive A');
  await expect(page.locator('#drive-media-0')).toHaveText('Remove disk A');
  await expect(page.locator('#drive-media-1')).toBeDisabled();
  await expect(page.locator('#writable')).not.toBeChecked();
  await page.locator('#power').click();
  await page.locator('#session-controls').evaluate(e=>e.open=true);
  await page.locator('#save-state').click();
  await expect(page.locator('#storage-status')).toContainText('saved');
  await page.reload();
  await expect(page.locator('#restore-state')).toBeEnabled();
  await expect(page.locator('#error')).toBeEmpty();
});

test('key mechanism compresses, releases and separates without sending OS input',async({page})=>{
  await page.goto('/');
  await page.locator('[data-component="key-mechanism"]').click();
  await expect(page.locator('#diskette-viewer')).toHaveAttribute('data-ready','true', {timeout: 20000});
  await expect(page.locator('#key-contact-state')).toHaveAttribute('data-closed','false');
  const hold=page.getByRole('button',{name:'Press and hold',exact:true});
  await hold.focus();await page.keyboard.down('Space');
  await expect(page.locator('#key-contact-state')).toHaveAttribute('data-closed','true');
  await page.keyboard.up('Space');
  await expect(page.locator('#key-travel')).toHaveValue('0');
  await page.locator('#key-travel').fill('100');
  await expect(page.locator('#key-contact-state')).toHaveAttribute('data-closed','true');
  await page.getByRole('button',{name:'Separate key parts',exact:true}).click();
  await expect(page.locator('#key-contact-state')).toHaveText('Separated for inspection');
  await expect(page.locator('#key-contact-state')).toHaveAttribute('data-closed','false');
  await page.screenshot({path:test.info().outputPath('key-mechanism.png')});
  await page.locator('#detail-close').click();
  await expect(page.locator('#diskette-viewer canvas')).toHaveCount(0);
});

test('interior packages load before display and rendering pauses offscreen',async({page})=>{
  test.setTimeout(60000);
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
  expect(requests.some(u=>u.includes('/components/kicad/') && u.includes('.stl'))).toBe(true);
  await page.locator('#viewport').evaluate(e=>{e.style.position='fixed';e.style.top='-2000px';});
  await expect(page.locator('#viewport')).toHaveAttribute('data-rendering','paused');
  await page.locator('#viewport').evaluate(e=>{e.style.position='';e.style.top='';});
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  await expect(page.locator('#viewport')).toHaveAttribute('data-rendering','active');
  await page.locator('#isolate-assembly').selectOption('logic');
  await expect(page.locator('#viewport')).toHaveAttribute('data-details','ready');
  expect(requests.some(u=>u.includes('/components/kicad/') && u.includes('.stl'))).toBe(true);
});
