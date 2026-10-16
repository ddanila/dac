import {cachedMesh,requestedMesh,requestedPackage} from './model-asset-paths.js';
import {test,expect} from '@playwright/test';
test('removed disk notch protection follows transfer and reload',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'Core fixture'}));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled();
 await expect(page.locator('#drive-protect-0')).toBeDisabled();
 await page.locator('#drive-lever-0').click();await page.locator('#drive-media-0').click();
 await expect(page.locator('#drive-protect-0')).toHaveText('Uncover disk A notch');
 await page.locator('#drive-protect-0').click();
 await expect(page.locator('#drive-protect-0')).toHaveText('Cover disk A notch');
 await expect(page.locator('#writable')).toBeChecked();
 await page.locator('#drive-lever-1').click();await page.locator('#drive-transfer-0').click();
 await expect(page.locator('#drive-protect-1')).toHaveText('Cover disk B notch');
 await expect(page.locator('#drive-protect-1')).toBeDisabled();
 await page.locator('#power').click();await page.locator('#session-controls').evaluate(e=>e.open=true);
 await page.locator('#save-state').click();await expect(page.locator('#storage-status')).toContainText('saved');
 await page.reload();await expect(page.locator('#power')).toBeEnabled();
 await expect(page.locator('#restore-state')).toBeEnabled();
 await expect(page.locator('#writable-b')).toBeChecked();
 await page.locator('#drive-media-1').click();await page.locator('#drive-protect-1').click();
 await expect(page.locator('#writable-b')).not.toBeChecked();
 await expect(page.locator('#error')).toBeEmpty();
});
test('interior geometry is ready before display and labels disclose its evidence',async({page})=>{
 test.setTimeout(60000);const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
 expect(requestedMesh(requests,'meshes/keyboard-controller-board.stl')).toBe(true);
 expect(requestedMesh(requests,'meshes/tube-funnel.stl')).toBe(true);
 await page.locator('[data-view="keyboard-inside"]').click();
 await expect(page.locator('#viewport')).toHaveAttribute('data-details','ready');
 expect(requestedMesh(requests,'meshes/keyboard-controller-board.stl')).toBe(true);
 expect(requestedMesh(requests,'meshes/tube-funnel.stl')).toBe(true);
 expect(requestedMesh(requests,'meshes/logic-boards-motherboard.stl')).toBe(true);
 await page.locator('#inspection-labels').check();
 // Checking a control can scroll the canvas out of view. Offscreen rendering
 // is intentionally paused; inspect labels only after bringing it back.
 await page.locator('#viewport').scrollIntoViewIfNeeded();
 await expect(page.locator('#viewport')).toHaveAttribute('data-rendering','active');
 await expect(page.locator('[data-annotation="keyboard-controller"]')).toBeVisible();
 await page.locator('[data-annotation="keyboard-controller"]').click();
 await expect(page.locator('#detail-description')).toContainText('Owner photo');
 await expect(page.locator('#detail-description')).toContainText('photo-estimated');
 await page.locator('#detail-close').click();
 await page.screenshot({path:test.info().outputPath('keyboard-labels.png')});
});
test('exhibit layout survives reload and Reset view clears it',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
 await page.locator('[data-view="monitor-inside"]').click();
 await page.locator('#inspection-labels').check();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dac-exhibit-layout-v1'))?.checks['open-monitor'])).toBe(true);
 await page.reload();await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
 await expect(page.locator('#open-monitor')).toBeChecked();
 await expect(page.locator('#inspection-labels')).toBeChecked();
 await expect(page.locator('[data-view="monitor-inside"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('#reset-exhibit-view').click();
 await expect(page.locator('#open-monitor')).not.toBeChecked();
 await expect(page.locator('#inspection-labels')).not.toBeChecked();
 expect(await page.evaluate(()=>localStorage.getItem('dac-exhibit-layout-v1'))).toBeNull();
});

test('the modeled notch toggles protection in both directions',async({page})=>{
 const {PerspectiveCamera,Vector3}=await import('three');
 await page.setViewportSize({width:1440,height:1100});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
 await page.locator('#drive-lever-0').click();await page.locator('#drive-media-0').click();
 await page.locator('[data-view="front"]').click();await page.locator('#viewport').scrollIntoViewIfNeeded();
 const box=await page.locator('#viewport').boundingBox(),camera=new PerspectiveCamera(36,box.width/box.height,.01,40);
 camera.position.set(0,1.9,3.8);camera.lookAt(0,.5,0);camera.updateMatrixWorld();
 // Aim at the canonical tab, including the media seating depth and parked pose.
 const {readFileSync}=await import('node:fs');
 const {STLLoader}=await import('three/addons/loaders/STLLoader.js');
 const root=new URL('../public/models/robotron-1715m/',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('model.json',root)));
 const bytes=readFileSync(new URL('meshes/drive-protect-tab-0.stl',root));
 const geometry=new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new Vector3());geometry.dispose();
 const pivot=manifest.driveMotion[0].pivot;
 center.add(new Vector3(330-pivot[0],54,5-pivot[2]));
 const p=new Vector3(center.x,center.z,-center.y).multiplyScalar(.0025).project(camera);
 const click=()=>page.mouse.click(box.x+(p.x+1)*box.width/2,box.y+(1-p.y)*box.height/2);
 await click();await expect(page.locator('#drive-protect-0')).toHaveText('Cover disk A notch');
 await click();await expect(page.locator('#drive-protect-0')).toHaveText('Uncover disk A notch');
});

test('specimen close-ups keep canonical evidence separate from print verification',async({page})=>{
 test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
 for(const [view,assembly] of [['fan-detail','psu'],['adapter-detail','adapters'],['case-cover','case-cover'],['display-controller','display-controller']]){
  await page.locator(`[data-view="${view}"]`).click();
  await expect(page.locator('#isolate-assembly')).toHaveValue(assembly);
  await expect(page.locator('#open-case')).toBeChecked();
 }
 await expect(page.locator('#viewport')).toHaveAttribute('data-details','ready');
 await page.locator('#assembly-evidence').evaluate(e=>e.open=true);
 await expect(page.locator('#assembly-evidence')).toContainText('Your specimen + Documented W/M design');
 await expect(page.locator('#assembly-evidence')).toContainText('Physical verification: unverified');
 await expect(page.locator('#assembly-evidence')).toContainText('Monitor internals: Comparative estimate');
 expect(errors).toEqual([]);
});
