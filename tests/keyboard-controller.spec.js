import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {controllerSelection} from '../src/keyboard-controller-review.js';
const data=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/keyboard-controller.json',import.meta.url)));
test('controller net selection preserves physical pin identity and unplaced evidence',()=>{
 const s=controllerSelection(data,'net','/TA_DATEN');
 expect(s.pins.map(p=>`${p.ref}:${p.pin}`).sort()).toEqual(['A1:4','L1.4:1','R10.2:2']);
 expect(s.points).toHaveLength(2);expect(s.unplaced.sort()).toEqual(['L1.4']);
 expect(data.cosimulation.equivalent).toBe(true);expect(data.cosimulation.bus.mismatches).toBe(0);expect(data.layout.routes.every(r=>r.evidence&&['/WR_N','/+5V','/CLK'].includes(r.net))).toBe(true);
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
 await expect(panel.locator('[data-selection]')).toContainText('3 pins; 2 with estimated positions');
 await expect(panel.locator('[data-selection]')).toContainText('Unplaced components: L1.4.');
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
 await expect(panel.locator('[data-selection]')).toContainText('Photo location candidate: Cable side of A1');
 await expect(panel.locator('[data-selection]')).toContainText('Terminal order and continuity remain unverified');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 await expect(panel.getByRole('link',{name:'Factory bridge placement (drawing 8)'})).toHaveAttribute('href',/PC-1715-Schaltplaene.pdf#page=10$/);
 expect(data.layout.unplaced.some(c=>c.ref==='BR2')).toBe(true);
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
 await expect(panel.locator('[data-route-id]')).toHaveCount(24);
 const inferred=panel.locator('[data-evidence-status="inferred"]');await expect(inferred).toHaveCount(7);
 for(const section of await inferred.all())await expect(section).toHaveAttribute('stroke-dasharray','.5 .3');
 await expect(panel.locator('[data-route-id]').filter({hasText:'WR_N:'}).first()).toHaveAttribute('stroke','#ffe16a');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-route-id]')).toHaveCount(1);
 await expect(panel.locator('[data-route-id]')).toHaveAttribute('data-evidence-status','inferred');
});

test('local A4 photo fit retains extrapolation limits',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('A4');
 await expect(panel.locator('[data-selection]')).toContainText('4 independent checks, 0.37 nominal mm');
 await expect(panel.locator('[data-selection]')).toContainText('outside the anchor bounds');
 await expect(panel.locator('[data-selection]')).toContainText('copper assignment remains unqualified');
 expect(data.bottomRegistration.localRegions[0].copperAssignmentQualified).toBe(false);
 expect(data.layout.vias).toHaveLength(0);
});

test('3D route highlights preserve side, provenance and board attachment',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const T=await import('/tests/browser-three.js'),{loadRobotron}=await import('/src/robotron-model.js');
  const model=await loadRobotron(new T.CanvasTexture(document.createElement('canvas')));
  const board=model.objects.get('keyboard-controller-board'),before=board.geometry.attributes.position.array.slice();
  const routes=[{id:'top-observed',side:'top',points:[[1,2],[4,6]],evidence:{status:'observed'}},{id:'bottom-inferred',side:'bottom',points:[[1,2],[4,6]],evidence:{status:'inferred'}}];
  model.keyboardControllerSelection([[1,2]],routes);
  const markers=board.children.filter(o=>o.name==='controller-route-highlight'),pad=board.children.find(o=>o.name==='controller-reference-pad-highlight');
  const top=markers.find(m=>m.userData.evidenceStatus==='observed'),bottom=markers.find(m=>m.userData.evidenceStatus==='inferred');
  const a=top.geometry.attributes.position,b=bottom.geometry.attributes.position,p=pad.geometry.attributes.position;
  const delta=[a.getX(1)-a.getX(0),a.getY(1)-a.getY(0)],sideSeparation=a.getZ(0)-b.getZ(0);
  const padAligned=[a.getX(0),a.getY(0),a.getZ(0)].every((v,i)=>v===[p.getX(0),p.getY(0),p.getZ(0)][i]);
  let disposed=0;for(const m of markers){m.geometry.addEventListener('dispose',()=>disposed++);m.material.addEventListener('dispose',()=>disposed++);}
  board.position.x+=12;const attached=markers.every(m=>m.parent===board);
  const dashed=bottom.material.isLineDashedMaterial,ids=markers.flatMap(m=>m.userData.routeIds).sort();
  model.keyboardControllerSelection([]);
  return {delta,sideSeparation,padAligned,attached,dashed,ids,disposed,remaining:board.children.filter(o=>o.name==='controller-route-highlight').length,unchanged:before.every((v,i)=>v===board.geometry.attributes.position.array[i])};
 });
 expect(result).toEqual({delta:[3,4],sideSeparation:2,padAligned:true,attached:true,dashed:true,ids:['bottom-inferred','top-observed'],disposed:4,remaining:0,unchanged:true});
});

test('net selection forwards only assigned routes and clears them on close',async({page})=>{
 expect(controllerSelection(data,'net','/WR_N').routes).toHaveLength(8);
 expect(controllerSelection(data,'net','/TA_DATEN').routes).toHaveLength(0);
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(points,routes=[]){window.selectedRouteIds=routes.map(r=>r.id);}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/WR_N');
 await expect.poll(()=>page.evaluate(()=>window.selectedRouteIds.length)).toBe(8);
 await panel.evaluate(e=>e.open=false);
 await expect.poll(()=>page.evaluate(()=>window.selectedRouteIds.length)).toBe(0);
 await panel.evaluate(e=>e.open=true);
 await expect.poll(()=>page.evaluate(()=>window.selectedRouteIds.length)).toBe(8);
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/TA_DATEN');
 await expect.poll(()=>page.evaluate(()=>window.selectedRouteIds.length)).toBe(0);
});

test('A2 reference selection uses factory-corrected physical locations',()=>{
 const center=ref=>{
  const points=controllerSelection(data,'component',ref).points;
  return [0,1].map(axis=>points.reduce((sum,p)=>sum+p[axis],0)/points.length);
 };
 const cable=center('A2.1'),latch=center('A2.2'),cpu=center('A2.3');
 expect(cable[0]).toBeLessThan(0);expect(cable[1]).toBeGreaterThan(0);
 expect(latch[0]).toBeGreaterThan(0);expect(latch[1]).toBeLessThan(0);
 expect(cpu[0]).toBeGreaterThan(0);expect(cpu[1]).toBeGreaterThan(0);
 expect(data.evidence.referenceVariants[0].status).toBe('reconstruction-placement-error-corrected');
});

test('output pull-up placement exposes reference-derived signal evidence',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R10.2');
 await expect(panel.locator('[data-selection]')).toContainText('2 pins; 2 with estimated positions');
 await expect(panel.locator('[data-pins]')).toContainText('Hidden output continuity not verified');
 await expect(panel.locator('[data-pins]')).toContainText('560 ohms is not a specimen measurement');
 expect(data.layout.unplaced).toHaveLength(37);
});

test('candidate photo endpoints never become net-connected pads',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.candidateHighlights=[];
  installKeyboardControllerReview({keyboardControllerSelection(points){window.candidateHighlights=points;}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R4.2');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const photo=panel.locator('[data-candidate-photo="R4.2"]');
 await expect(photo.getByRole('img')).toBeVisible();
 await expect(photo.locator('circle')).toHaveCount(2);
 await expect(photo).toContainText('not numbered pins');
 await expect(panel.locator('[data-selection]')).toContainText('0 with estimated positions');
 expect(await page.evaluate(()=>window.candidateHighlights)).toEqual([]);
 await expect(photo.locator('circle').first()).toHaveAttribute('cx','1527');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR2');
 await expect(panel.locator('[data-candidate-photo="R4.2"]')).toHaveCount(0);
 await expect(panel.locator('[data-candidate-photo="BR2"] circle')).toHaveCount(2);
 expect(await page.evaluate(()=>window.candidateHighlights)).toEqual([]);
 await panel.getByRole('button',{name:'Clear highlight',exact:true}).click();
 await expect(panel.locator('[data-candidate-photo]')).toHaveCount(0);
});


test('supply selection retains disconnected islands on the same reference net',()=>{
 const selection=controllerSelection(data,'component','R3');
 expect(selection.routes).toHaveLength(16);
 expect(selection.routes.every(r=>r.net==='/+5V'&&r.side==='top')).toBe(true);
 expect(selection.routes.filter(r=>r.evidence.status==='observed')).toHaveLength(10);
 expect(selection.routes.filter(r=>r.evidence.status==='inferred')).toHaveLength(6);
 expect(selection.unplaced).toEqual([]);
 expect(data.qualification.drc.unconnectedItems).toBe(229);
});

test('numbered component photo observations remain distinct from native pad coordinates',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(points){window.photoReviewHighlights=points;}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R6.6');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const photo=panel.locator('[data-placement-photo="R6.6"]');
 await expect(photo.getByRole('img')).toBeVisible();
 await expect(photo.locator('[data-photo-pin="1"]')).toHaveAttribute('cy','3550');
 await expect(photo.locator('[data-photo-pin="2"]')).toHaveAttribute('cy','3385');
 await expect(photo.locator('text')).toHaveText(['1','2']);
 await expect(photo).toContainText('continuity is not measured');
 await expect(photo.getByRole('link',{name:'Supporting close-up'})).toHaveAttribute('href',/PXL_20261012_123729356.jpg$/);
 expect(await page.evaluate(()=>window.photoReviewHighlights)).toEqual(controllerSelection(data,'component','R6.6').points);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('A7');
 const chip=panel.locator('[data-placement-photo="A7"]');
 await expect(chip.locator('[data-photo-pin]')).toHaveCount(5);
 await expect(chip.locator('[data-photo-pin="4"]')).toHaveAttribute('cy','3670');
 expect(await page.evaluate(()=>window.photoReviewHighlights)).toEqual(controllerSelection(data,'component','A7').points);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R4.2');
 await expect(panel.locator('[data-placement-photo]')).toHaveCount(0);
 await expect(panel.locator('[data-candidate-photo="R4.2"] circle')).toHaveCount(2);
 await expect(panel.locator('[data-photo-pin]')).toHaveCount(0);
 expect(await page.evaluate(()=>window.photoReviewHighlights)).toEqual([]);
});


test('BR1 photo placement preserves reference sides and inferred underside geometry',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR1');
 await expect(panel.locator('[data-selection]')).toContainText('Photo-estimated placement:');
 await expect(panel.locator('[data-selection]')).toContainText('end-to-end continuity remains unmeasured');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 await expect(panel.locator('[data-placement-photo="BR1"] [data-photo-pin]')).toHaveCount(2);
 await expect(panel.locator('[data-pins]')).toContainText('OSC_OUT');
 await expect(panel.locator('[data-pins]')).toContainText('CLK');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-route-id]')).toHaveCount(1);
 await expect(panel.locator('[data-route-id]')).toHaveAttribute('data-evidence-status','inferred');
 expect(data.layout.components.find(c=>c.ref==='BR1').pads.map(p=>p.net).sort()).toEqual(['/CLK','/OSC_OUT']);
 expect(data.layout.unplaced.some(c=>c.ref==='BR1')).toBe(false);
 expect(data.bottomRegistration.copperAssignmentQualified).toBe(false);
});
