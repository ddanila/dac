import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {controllerSelection} from '../src/keyboard-controller-review.js';
const data=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/keyboard-controller.json',import.meta.url)));
test('controller net selection preserves physical pin identity and unplaced evidence',()=>{
 const s=controllerSelection(data,'net','/TA_DATEN');
 expect(s.pins.map(p=>`${p.ref}:${p.pin}`).sort()).toEqual(['A1:4','L1.4:1','R10.2:2']);
 expect(s.points).toHaveLength(1);expect(s.unplaced.sort()).toEqual(['L1.4','R10.2']);
 expect(data.cosimulation.equivalent).toBe(true);expect(data.cosimulation.bus.mismatches).toBe(0);expect(data.layout.routes.every(r=>r.evidence&&r.net==='/WR_N')).toBe(true);
 const model=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/model.json',import.meta.url)));
 expect(model.keyboardControllerSource['keyboard-controller/generated/controller.scad']).toBe(data.source.geometryScadSha256);
 expect(data.layout.unresolvedArtwork.every(r=>r.net===null)).toBe(true);
});
test('controller review selects nets, reports gaps and retries a failed load',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD required'}));
 let fail=true;await page.route('**/models/robotron-1715m/keyboard-controller.json',r=>fail?(fail=false,r.fulfill({status:503,body:'temporary'})):r.continue());
 await page.goto('/');const panel=page.locator('#keyboard-controller-review');await panel.evaluate(e=>e.open=true);
 await expect(panel.locator('[data-status]')).toContainText('could not load');await panel.evaluate(e=>e.open=false);await panel.evaluate(e=>e.open=true);
 await expect(panel.locator('[data-status]')).toContainText('70 reference components');
 await expect(panel.locator('[data-selection]')).toContainText('Underside independent checks');
 await expect(panel.locator('[data-selection]')).toContainText('Direct photo-to-photo checks');
 await expect(panel.locator('[data-selection]')).toContainText('outside tolerance');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/TA_DATEN');
 await expect(panel.locator('[data-selection]')).toContainText('3 pins; 1 with estimated positions');
 await expect(panel.locator('[data-selection]')).toContainText('L1.4, R10.2');
 await expect(panel.locator('[data-qualification]')).toContainText('comparisons pass');
 await panel.getByLabel('Controller board side').selectOption('bottom');await expect(panel.locator('svg')).toHaveAttribute('aria-label',/bottom/);
 await panel.getByRole('button',{name:'Clear highlight'}).click();await expect(panel.locator('[data-selection]')).toContainText('Select a component');
 expect(errors).toEqual([]);
});
test('estimated pad markers follow the controller and dispose cleanly',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const T=await import('/tests/browser-three.js'),{loadRobotron}=await import('/src/robotron-model.js');
  const model=await loadRobotron(new T.CanvasTexture(document.createElement('canvas')));
  const board=model.objects.get('keyboard-controller-board'),before=board.geometry.attributes.position.array.slice();
  model.keyboardControllerSelection([[1,2],[3,4]]);
  const marker=board.children.find(o=>o.name==='controller-reference-pad-highlight');let disposed=0;marker.geometry.addEventListener('dispose',()=>disposed++);marker.material.addEventListener('dispose',()=>disposed++);
  const first=marker.geometry.attributes.position;const delta=[first.getX(1)-first.getX(0),first.getY(1)-first.getY(0)];
  board.position.x+=12;const attached=marker.parent===board;
  model.keyboardControllerSelection([]);
  return {delta,attached,disposed,remaining:board.children.filter(o=>o.name==='controller-reference-pad-highlight').length,unchanged:before.every((v,i)=>v===board.geometry.attributes.position.array[i])};
 });expect(result).toEqual({delta:[2,2],attached:true,disposed:2,remaining:0,unchanged:true});
});

test('controller review separates raw latch samples from display persistence',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.review=installKeyboardControllerReview({keyboardControllerSelection(){}});
  window.review.message({keyboardLatches:0,keyboardLeds:3});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const live=page.locator('[data-live]');await expect(live).toContainText('Raw C latch sample: Caps off; SI/SO off');
 await expect(live).toContainText('Display indicators: Caps on; SI/SO on');await expect(live).toContainText('2 ms peak hold');
 await page.evaluate(()=>window.review.message({type:'configured'}));await expect(live).toContainText('unavailable');
});


test('bridge inspection distinguishes reset source and CPU injection side',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR2');
 await expect(panel.locator('[data-selection]')).toContainText('CPU active-low RESET');
 await expect(panel.locator('[data-selection]')).toContainText('inferred electrical use');
 await expect(panel.locator('[data-selection]')).toContainText('Physical location unverified');
 await expect(panel.locator('[data-pins]')).toContainText('RESET_OUT');
 await expect(panel.locator('[data-pins]')).toContainText('RESET_N');
 await expect(panel.locator('[data-qualification]')).toContainText('13 digital checks; 0 mismatches');
 expect(data.cosimulation.service.mismatches).toBe(0);
});


test('underside evidence retains failing independent pad checks',()=>{
 const r=data.bottomRegistration;
 expect(r.withinPhotoTolerance).toBe(false);expect(r.copperAssignmentQualified).toBe(false);
 expect(r.pins.filter(p=>p.heldOut)).toHaveLength(6);
 expect(r.pins.filter(p=>p.heldOut&&p.residualMm>r.toleranceMm).map(p=>p.ref+':'+p.pin)).toEqual(['A5:1','A5:40','A5:20','A5:21','A1:7','A1:8']);
 expect(r.crossPhoto.checks).toHaveLength(6);
 expect(r.crossPhoto.checks.find(p=>p.ref==='A1'&&p.pin==='7').nominalResidualMm).toBeLessThan(.5);
 expect(data.photoRegistration.components.find(c=>c.ref==='A8').maxResidualMm).toBeLessThanOrEqual(data.photoRegistration.toleranceMm);
});

test('partial copper review distinguishes observed sections from inferred attachment',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/WR_N');
 await expect(panel.locator('[data-selection]')).toContainText('7 observed');
 await expect(panel.locator('[data-selection]')).toContainText('1 inferred');
 await expect(panel.locator('[data-pins]')).toContainText('not proof of continuity to CPU WR');
 await expect(panel.locator('[data-qualification]')).toContainText('1 track dangling');
 await expect(panel.locator('[data-route-id]')).toHaveCount(8);
 await expect(panel.locator('[data-evidence-status="inferred"]')).toHaveAttribute('stroke-dasharray','.5 .3');
 await expect(panel.locator('[data-route-id]').first()).toHaveAttribute('stroke','#ffe16a');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-route-id]')).toHaveCount(0);
});
