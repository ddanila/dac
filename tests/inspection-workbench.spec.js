import {test,expect} from '@playwright/test';
import * as T from 'three';
import {sectionCap} from '../src/section-caps.js';
test('section caps close a solid contour and preserve holes; open contours are rejected',()=>{
 const box=new T.BoxGeometry(2,2,2),plane=new T.Plane(new T.Vector3(0,0,1),-.1),cap=sectionCap(box,new T.Matrix4(),plane);expect(cap).not.toBeNull();
 const shape=new T.Shape();shape.moveTo(-2,-2);shape.lineTo(2,-2);shape.lineTo(2,2);shape.lineTo(-2,2);shape.closePath();const hole=new T.Path();hole.moveTo(-1,-1);hole.lineTo(-1,1);hole.lineTo(1,1);hole.lineTo(1,-1);hole.closePath();shape.holes.push(hole);
 const g=new T.ExtrudeGeometry(shape,{depth:2,bevelEnabled:false}),ring=sectionCap(g,new T.Matrix4(),plane);expect(ring).not.toBeNull();let area=0;const p=ring.attributes.position;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2);area+=b.sub(a).cross(c.sub(a)).length()/2;}expect(area).toBeCloseTo(12,5);
 expect(sectionCap(new T.PlaneGeometry(2,2),new T.Matrix4(),new T.Plane(new T.Vector3(1,0,0),-.1))).toBeNull();
});
test('measurements use model scale and follow the selected object transform',async({page})=>{
 await page.goto('/tests/model-harness.html');const result=await page.evaluate(async()=>{const T=await import('/tests/browser-three.js'),{createMeasurement}=await import('/src/model-measurement.js');let value;const scene=new T.Scene(),m=new T.Mesh(new T.BoxGeometry(100,100,100));m.name='sample';m.scale.setScalar(.0025);scene.add(m);m.updateMatrixWorld();const measure=createMeasurement(scene,v=>value=v);measure.set(true);measure.pick({object:m,point:new T.Vector3()});measure.pick({object:m,point:new T.Vector3(.125,0,0)});const first=value.millimetres;m.position.y=1;measure.update();return {first,after:value.millimetres,classification:value.classification};});expect(result).toEqual({first:50,after:50,classification:'Model-derived estimate'});
});
test('control groups filter secondary tools while keeping power available',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed'}));await page.goto('/');await expect(page.locator('#power')).toBeEnabled();await page.locator('[data-control-group=diagnose]').click();await expect(page.locator('#controls-diagnose')).toBeVisible();await expect(page.locator('#controls-use')).toBeHidden();await expect(page.locator('#power')).toBeVisible();await page.locator('[data-control-group=inspect]').click();await expect(page.locator('#measurement-panel')).toBeVisible();await page.locator('[data-control-group=all]').click();await expect(page.locator('#controls-use')).toBeVisible();
});

test('real worker pauses, steps, reads mapped memory and stops on a bus event',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed'}));
 await page.goto('/?activity=printer');await expect(page.locator('#power')).toBeEnabled();await page.locator('#power').click();
 const panel=page.locator('#debug-controls');await panel.evaluate(e=>e.open=true);await panel.locator('[data-pause]').click();await expect(panel.locator('[data-status]')).toContainText('paused');
 await panel.locator('[data-refresh]').click();await expect(panel.locator('[data-registers]')).toContainText('PC:');const before=await panel.locator('[data-registers]').textContent();
 await panel.locator('[data-memory]').click();await expect(panel.locator('[data-bytes]')).toContainText('read space');expect(await panel.locator('[data-registers]').textContent()).toBe(before);
 await panel.locator('[data-step]').click();await expect(panel.locator('[data-status]')).toContainText('Advanced');expect(await panel.locator('[data-registers]').textContent()).not.toBe(before);
 const circuit=page.locator('#circuit-panel');await circuit.evaluate(e=>e.open=true);await circuit.locator('[data-break]').check();await circuit.locator('[data-trigger]').selectOption('0');await circuit.locator('[data-arm]').click();
 await panel.locator('[data-resume]').click();await expect(panel.locator('[data-status]')).toContainText('matching bus event');
 await panel.locator('[data-resume]').click();await expect(panel.locator('[data-status]')).toContainText('running');await expect(panel.locator('[data-step]')).toBeDisabled();
 await page.locator('#printer-panel').evaluate(e=>e.open=true);await page.locator('#printer-state').selectOption('3');await expect(page.locator('#printer-state')).toHaveValue('3');
 await page.locator('#reset').click();await expect(page.locator('#printer-state')).toHaveValue('3');
});
