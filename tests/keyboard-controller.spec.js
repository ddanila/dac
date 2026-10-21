import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {controllerSelection} from '../src/keyboard-controller-review.js';
const data=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/keyboard-controller.json',import.meta.url)));
test('controller net selection preserves physical pin identity and unplaced evidence',()=>{
 const s=controllerSelection(data,'net','/TA_DATEN');
 expect(s.pins.map(p=>`${p.ref}:${p.pin}`).sort()).toEqual(['A1:4','L1.4:1','R10.2:2']);
 expect(s.points).toHaveLength(2);expect(s.unplaced.sort()).toEqual(['L1.4']);
 expect(data.cosimulation.equivalent).toBe(true);expect(data.cosimulation.bus.mismatches).toBe(0);expect(data.layout.routes.every(r=>r.evidence&&data.routingAudit.nets.some(n=>n.net===r.net))).toBe(true);
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
 await panel.getByLabel('Controller board side').selectOption('bottom');await expect(panel.locator('[data-drawing] svg')).toHaveAttribute('aria-label',/bottom/);
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
 expect(controllerSelection(data,'component','BR2').points).toEqual([]);
 const wire=panel.locator('[data-visual-bridge="BR2"]');
 await expect(wire).toHaveAttribute('stroke','#4694a1');
 await expect(panel.locator('[data-selection]')).toContainText('endpoints do not identify electrical pads');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/RESET_N');
 await expect(wire).toHaveAttribute('stroke','#4694a1');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(wire).toHaveCount(0);
 await panel.getByLabel('Controller board side').selectOption('top');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR2');

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
 await expect(panel.locator('[data-qualification]')).toContainText('track dangling');
 await expect(panel.locator('[data-route-id]')).toHaveCount(data.layout.routes.filter(r=>r.side==='top').length);
 const inferred=panel.locator('[data-route-id][data-evidence-status="inferred"]');await expect(inferred).toHaveCount(data.layout.routes.filter(r=>r.side==='top'&&r.evidence.status==='inferred').length);
 for(const section of await inferred.all())await expect(section).toHaveAttribute('stroke-dasharray','.5 .3');
 await expect(panel.locator('[data-route-id]').filter({hasText:'WR_N:'}).first()).toHaveAttribute('stroke','#ffe16a');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-route-id]')).toHaveCount(data.layout.routes.filter(r=>r.side==='bottom').length);
 const clock=panel.locator('[data-route-id]').filter({hasText:'CLK:'});
 await expect(clock).toHaveCount(1);
 await expect(clock).toHaveAttribute('data-evidence-status','inferred');
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
 expect(data.layout.vias.every(v=>v.evidence.crossSideRegistration?.bottom.region!=='a4')).toBe(true);
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
 const dataRoutes=controllerSelection(data,'net','/TA_DATEN').routes;
 expect(dataRoutes.length).toBeGreaterThan(0);
 expect(dataRoutes.every(r=>r.evidence.group==='r102-output-bottom-partial')).toBe(true);
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
 await expect.poll(()=>page.evaluate(()=>window.selectedRouteIds)).toEqual(dataRoutes.map(r=>r.id));
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
 await expect(panel.locator('[data-pins]')).toContainText('reference resistance is not measured');
 expect(data.layout.unplaced).toHaveLength(30);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('C5.1');
 await expect(panel.locator('[data-selection]')).toContainText('2 pins; 2 with estimated positions');
 await expect(panel.locator('[data-pins]')).toContainText('Nonpolar capacitor');
 await expect(panel.locator('[data-placement-photo="C5.1"] [data-photo-pin="1"]')).toHaveAttribute('cy','1617');
 await expect(panel.locator('[data-placement-photo="C5.1"] [data-photo-pin="2"]')).toHaveAttribute('cy','1674');
 expect(controllerSelection(data,'component','C5.1').unplaced).toEqual([]);
 for(const ref of ['C5.2','C5.3','C5.4']){
  const selected=controllerSelection(data,'component',ref);expect(selected.points).toHaveLength(2);expect(selected.unplaced).toEqual([]);
 }
 expect(controllerSelection(data,'component','C5.5').points).toHaveLength(0);
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
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR2');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const photo=panel.locator('[data-candidate-photo="BR2"]');
 await expect(photo.getByRole('img')).toBeVisible();
 await expect(panel.locator('[data-route-review="br2-terminal-order-review"]')).toContainText('no complete path');
 await expect(panel.locator('[data-route-review="br2-terminal-order-review"]')).toContainText('closed bridge');
 expect(data.evidence.routeReviews.find(r=>r.id==='br2-terminal-order-review').copperAssignmentQualified).toBe(false);
 await expect(photo.locator('circle')).toHaveCount(2);
 await expect(photo).toContainText('not numbered pins');
 await expect(panel.locator('[data-selection]')).toContainText('0 with estimated positions');
 expect(await page.evaluate(()=>window.candidateHighlights)).toEqual([]);
 await expect(photo.locator('circle').first()).toHaveAttribute('cx','1310');
 for(const [ref,x] of [['R6.4','1328'],['R6.5','1335']]){
  await panel.getByLabel('Controller component',{exact:true}).selectOption(ref);
  const candidate=panel.locator(`[data-candidate-photo="${ref}"]`);
  await expect(candidate.locator('circle')).toHaveCount(2);
  await expect(candidate.locator('circle').first()).toHaveAttribute('cx',x);
  await expect(candidate.getByRole('link',{name:'Comparison close-up — different specimen'})).toHaveAttribute('href',/PXL_20261017_080434345.jpg$/);
  await expect(panel.locator('[data-photo-pin]')).toHaveCount(0);
  expect(await page.evaluate(()=>window.candidateHighlights)).toEqual([]);
 }
 await panel.getByRole('button',{name:'Clear highlight',exact:true}).click();
 await expect(panel.locator('[data-candidate-photo]')).toHaveCount(0);
});


test('supply selection retains disconnected islands on the same reference net',()=>{
 const selection=controllerSelection(data,'component','R3');
 expect(selection.routes.map(r=>r.id).sort()).toEqual(data.layout.routes.filter(r=>r.net==='/+5V').map(r=>r.id).sort());
 expect(selection.routes.every(r=>r.net==='/+5V'&&r.side==='top')).toBe(true);
 expect(selection.routes.some(r=>r.evidence.status==='observed')).toBe(true);
 expect(selection.routes.some(r=>r.evidence.status==='inferred')).toBe(true);
 const supply=data.routingAudit.nets.find(n=>n.net==='/+5V');
 expect(supply.padGroups).toBeGreaterThan(1);
 expect(supply.islands.some(g=>g.terminals.includes('R3:1')&&g.terminals.includes('R6.1:1'))).toBe(true);
 expect(supply.islands.some(g=>g.terminals.includes('R3:1')&&g.terminals.includes('R10.1:1'))).toBe(false);
 expect(selection.unplaced).toEqual([]);
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
 for(const ref of ['R4.2','R7','R8']){
  await panel.getByLabel('Controller component',{exact:true}).selectOption(ref);
  const reset=panel.locator(`[data-placement-photo="${ref}"][data-photo-side="top"]`);
  await expect(reset.locator('[data-photo-pin]')).toHaveCount(2);
  await expect(reset.locator('[data-photo-pin="1"]')).toHaveAttribute('cx','1687');
  await expect(panel.locator('[data-photo-side="bottom"] [data-photo-pin]')).toHaveCount(2);
  await expect(panel.locator('[data-candidate-photo]')).toHaveCount(0);
  expect(await page.evaluate(()=>window.photoReviewHighlights)).toEqual(controllerSelection(data,'component',ref).points);
  expect(controllerSelection(data,'component',ref).points).toHaveLength(2);
 }
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
 await expect(panel.locator('[data-placement-photo="BR1"][data-photo-side="top"] [data-photo-pin]')).toHaveCount(2);
 await expect(panel.locator('[data-pins]')).toContainText('OSC_OUT');
 await expect(panel.locator('[data-pins]')).toContainText('CLK');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-route-id]')).toHaveCount(data.layout.routes.filter(r=>r.side==='bottom').length);
 const clock=panel.locator('[data-route-id]').filter({hasText:'CLK:'});
 await expect(clock).toHaveCount(1);
 await expect(clock).toHaveAttribute('data-evidence-status','inferred');
 expect(data.layout.components.find(c=>c.ref==='BR1').pads.map(p=>p.net).sort()).toEqual(['/CLK','/OSC_OUT']);
 expect(data.layout.unplaced.some(c=>c.ref==='BR1')).toBe(false);
 expect(data.bottomRegistration.copperAssignmentQualified).toBe(false);
});


test('underside photo inspection uses direct observations without qualifying registration',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR1');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const bottom=panel.locator('[data-photo-side="bottom"]');
 await expect(bottom.locator('[data-photo-pin]')).toHaveCount(2);
 await expect(bottom.locator('[data-photo-pin="2"]')).toHaveAttribute('cx','1559');
 await expect(bottom.locator('[data-photo-pin="2"]')).toHaveAttribute('cy','3660');
 await expect(bottom.locator('[data-photo-pin="2"]')).toHaveAttribute('r','8');
 await expect(bottom.locator('figcaption')).toContainText('not projected pads');
 await expect(bottom.locator('figcaption')).toContainText('registration and end-to-end continuity remain unqualified');
 await expect(bottom.locator('image')).toHaveAttribute('href',/PXL_20261012_123648677.jpg$/);
 await expect(bottom.getByRole('link')).toHaveAttribute('href',/PXL_20261012_123648677.jpg$/);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R10.3');
 await expect(bottom.locator('[data-photo-pin="2"]')).toHaveAttribute('cx','1558');
 await expect(bottom.locator('[data-photo-pin="2"]')).toHaveAttribute('cy','3616');
 await expect(panel.locator('[data-photo-side="top"] [data-photo-pin="2"]')).toHaveAttribute('cy','3893');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR2');
 await expect(bottom).toHaveCount(0);
 await expect(panel.locator('[data-candidate-photo="BR2"]')).toHaveCount(1);
 await expect(panel.locator('[data-photo-pin]')).toHaveCount(0);
 expect(data.bottomRegistration.copperAssignmentQualified).toBe(false);
});


test('all local controller evidence photos are shipped with pinned content',async({request})=>{
 const {createHash}=await import('node:crypto');
 const source=JSON.parse(await (await import('node:fs/promises')).readFile('public/models/robotron-1715m/source.json','utf8'));
 for(const photo of data.evidence.sources.filter(s=>s.path?.startsWith('../reference/photos/'))){
  const path='photos/'+photo.path.split('/').pop();
  expect(source.files.find(f=>f.file===path)?.sha256).toBe(photo.sha256);
  const response=await request.get('/models/robotron-1715m/'+path);
  expect(response.ok()).toBe(true);
  expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(photo.sha256);
 }
});

test('comparison specimen photos stay separate from primary placement and highlights',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(points){window.comparisonHighlights=points;}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('BR1');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const comparison=panel.locator('[data-comparison-specimen="comparison-20261017"]');
 await expect(comparison.locator('summary')).toHaveText('Comparison photos — different specimen');
 await comparison.locator('summary').click();
 await expect(comparison).toContainText('ROM label: S642; contents unread');
 await expect(comparison).toContainText('must not reuse primary-specimen transforms');
 const links=comparison.locator('a');expect(await links.count()).toBeGreaterThan(0);
 for(const href of await links.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))))expect(href).toMatch(/PXL_20261017_/);
 await expect(comparison.locator('[data-photo-pin]')).toHaveCount(0);
 await expect(panel.locator('[data-placement-photo="BR1"][data-photo-side="top"] image')).toHaveAttribute('href',/PXL_20261012_123622947.jpg$/);
 expect(await page.evaluate(()=>window.comparisonHighlights)).toEqual(controllerSelection(data,'component','BR1').points);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('V4.9');
 await expect(comparison).toHaveCount(1);
 expect(await page.evaluate(()=>window.comparisonHighlights)).toEqual([]);
});


test('CPU clock inspection distinguishes local projection from global registration',async({page})=>{
 const region=data.bottomRegistration.pcbRegions[0];
 expect(region.copperAssignmentQualified).toBe(true);expect(region.maxCheckResidualMm).toBeLessThan(.67);
 expect(data.bottomRegistration.copperAssignmentQualified).toBe(false);
 const selection=controllerSelection(data,'net','/CLK');
 expect(selection.routes).toHaveLength(1);
 expect(selection.routes.filter(r=>r.evidence.group==='cpu-clock-bottom-partial')).toHaveLength(0);
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('A5');
 await expect(panel.locator('[data-selection]')).toContainText('6 independent pad checks; 0.66 mm maximum residual');
 await expect(panel.locator('[data-selection]')).toContainText('limited to the anchor hull');
 await expect(panel.locator('[data-route-review="cpu-clock-terminal-conflict"]')).toContainText('clock trace assignment withdrawn');
 await expect(panel.locator('[data-route-review="cpu-clock-terminal-conflict"]')).toContainText('A4:13 D6');
 await expect(panel.locator('[data-route-review="cpu-clock-terminal-conflict"]')).toContainText('No CLK or D6 route is assigned');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 await expect(panel.locator('[data-photo-side="bottom"] [data-photo-pin="6"]')).toHaveAttribute('cy','2678');
});

test('transistor package reference distinguishes centre emitter from centre base without placing pads',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.packageHighlights=[];
  installKeyboardControllerReview({keyboardControllerSelection(points){window.packageHighlights=points;}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('V4.1');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 for(const [ref,id,order,centre,source]of [['V4.1','sc308-l3-12','B–E–C','E','SC307'],['V4.9','sc308-l3-12','B–E–C','E','SC307'],['V3.1','sc236-l3-12','E–B–C','B','SC236'],['V3.2','sc236-l3-12','E–B–C','B','SC236']]){
  await panel.getByLabel('Controller component',{exact:true}).selectOption(ref);
  const detail=panel.locator(`[data-package-reference="${id}"]`);
  await expect(detail).toContainText(`drawing order ${order}; centre terminal ${centre}`);
  await expect(detail).toContainText('not an installed-board left-to-right pin order');
  await expect(detail.getByRole('link',{name:'Reference package drawing'})).toHaveAttribute('href',`https://hjs.lima-city.de/DDR/index.php?pdf=${source}#page=1`);
  await expect(panel.locator('[data-selection]')).toContainText('0 with estimated positions');
  expect(await page.evaluate(()=>window.packageHighlights)).toEqual([]);
 }
});

test('recorded waveform is pinned to the same connectivity and preserves raw samples',async()=>{
 const {validateWaveform}=await import('../src/keyboard-controller-waveform.js');
 const capture=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/keyboard-controller-waveform.json',import.meta.url)));
 expect(validateWaveform(capture,data.source.files.connectivity)).toBe(capture);
 expect(capture.source.revision).toMatch(/^[a-f0-9]{40}$/);
 expect(capture.source.files).toHaveProperty(['verification/robotron-keyboard/analog/cpu_clock_limits.json']);
 expect(capture.samples.every(row=>row[1]>.8&&row[1]<2)).toBe(true);
 expect(capture.firmwareAnalysis.observableDependencyFound).toBe(false);
 const unsupported=structuredClone(capture);unsupported.firmwareAnalysis.qualified=true;
 expect(()=>validateWaveform(unsupported,data.source.files.connectivity)).toThrow(/firmware analysis/);
 expect(()=>validateWaveform(capture,'different')).toThrow(/does not match/);
 const invalid=structuredClone(capture);invalid.samples[1][0]=invalid.samples[0][0]-1;
 expect(()=>validateWaveform(invalid,data.source.files.connectivity)).toThrow(/Invalid waveform/);
});

test('recorded waveform separates simulation from live state and highlights D0',async({page})=>{
 await page.goto('/tests/model-harness.html');
 await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review'),wave=panel.locator('[data-recorded-waveform]');
 await wave.locator('summary').click();
 await expect(wave).toContainText('Not live emulation or a specimen measurement');
 await expect(wave).toContainText('Electrical qualification failed');
 await expect(wave.locator('[data-waveform-firmware]')).toContainText('Internal flags may differ');
 await expect(wave.getByRole('link',{name:'Read the firmware analysis and assumptions'})).toHaveAttribute('href',/\/blob\/[a-f0-9]{40}\/verification\/robotron-keyboard\/analog\/reports\/floating-io\/static-analysis.json$/);
 await expect(wave.locator('[data-waveform-drivers]')).toHaveText('Driver intent at that read: CPU released; ROM released; LATCH released.');
 await expect(wave.locator('[data-waveform-sample]')).toContainText('Receiver level: unknown');
 const slider=wave.getByRole('slider',{name:'Recorded waveform sample'});
 await slider.fill('0');await slider.dispatchEvent('input');
 await expect(wave.locator('[data-waveform-sample]')).toContainText('-97.110 ns');
 await wave.getByRole('button',{name:'Highlight D0 connections'}).click();
 await expect(panel.getByLabel('Controller net',{exact:true})).toHaveValue('/D0');
 await expect(wave.getByRole('link',{name:'Open pinned simulation report'})).toHaveAttribute('href',/\/blob\/[a-f0-9]{40}\//);
 await wave.screenshot({path:'/tmp/robotron-recorded-waveform.png'});
});

test('recorded waveform rejects mismatched connectivity and retries',async({page})=>{
 const capture=JSON.parse(readFileSync(new URL('../public/models/robotron-1715m/keyboard-controller-waveform.json',import.meta.url)));
 let bad=true;
 await page.route('**/keyboard-controller-waveform.json',route=>{
  if(bad){bad=false;return route.fulfill({json:{...capture,connectivitySha256:'wrong'}});}
  return route.continue();
 });
 await page.goto('/tests/model-harness.html');
 await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const wave=page.locator('[data-recorded-waveform]');
 await wave.locator('summary').click();
 await expect(wave.getByRole('status')).toContainText('does not match');
 await expect(wave.locator('svg')).toHaveCount(0);
 await wave.locator('summary').click();await wave.locator('summary').click();
 await expect(wave.locator('svg')).toBeVisible();
});

test('connector review separates mapped reference pads from unclassified contacts',async({page})=>{
 expect(data.connectorReview.qualifiedForPadPlacement).toBe(false);
 const selected=controllerSelection(data,'component','X1');
 expect(selected.points).toHaveLength(selected.pins.length);
 expect(selected.pins.some(p=>p.pin==='A8')).toBe(false);
 expect(data.connectorReview.nativePlacement.unclassifiedContacts).toEqual(['A8']);
 expect(selected.pins.length).toBeGreaterThan(0);
 expect(data.connectorTerminals.completeTerminalOrderResolved).toBe(true);
 expect(data.connectorTerminals.unresolvedRows).toEqual([]);
 expect(data.connectorTerminals.referenceAbsentPins).toEqual(['A8']);
 expect(Object.keys(data.connectorReview.projectedLeadEndRowsMm).sort()).toEqual(['housingFar','housingNear']);
 expect(data.source.files.connectorReview).toMatch(/^[a-f0-9]{64}$/);
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD required'}));
 await page.goto('/');const panel=page.locator('#keyboard-controller-review');await panel.evaluate(e=>e.open=true);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('X1');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const detail=panel.locator('[data-connector-review]');
 await expect(detail).toContainText('both observed lead rows exit the same housing side');
 await expect(detail).toContainText('do not establish hole centres or terminal order');
 await expect(detail).toContainText('near row as B1–B13');
 await expect(detail).toContainText('not measured continuity');
 await expect(detail).toContainText('A8 remains electrically unclassified');
 await expect(panel.locator('[data-visual-connector="X1"]')).toHaveCount(data.connectorReview.nativePlacement.unclassifiedContacts.length);
 await expect(panel.locator('[data-selection]')).toContainText('highlighted reference pads use photo-estimated positions');
 await expect(detail.getByRole('link')).toHaveAttribute('href',new RegExp(data.source.cad.revision));
 await panel.getByLabel('Controller component',{exact:true}).selectOption('A7');
 await expect(detail).toHaveCount(0);
});


test('COL11 selection exposes observed underside route and inferred pad attachments',async({page})=>{
 const selection=controllerSelection(data,'net','/COL11');
 expect(selection.pins.map(p=>`${p.ref}:${p.pin}`)).toEqual(expect.arrayContaining(['X1:B8','A2.1:6']));
 expect(selection.routes.length).toBeGreaterThan(0);
 expect(new Set(selection.routes.map(r=>r.evidence.status))).toEqual(new Set(['observed','inferred']));
 await page.goto('/tests/model-harness.html');
 await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/COL11');
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-selection]')).toContainText('inferred');
 for(const route of selection.routes)await expect(panel.locator(`[data-route-id="${route.id}"]`)).toHaveAttribute('stroke','#ffe16a');
});

test('clock branch review retains top registration and hidden-connection limits',async({page})=>{
 const selection=controllerSelection(data,'net','/TA_TAKT');
 expect(new Set(selection.routes.map(r=>r.side))).toEqual(new Set(['top','bottom']));
 expect(data.topRegistration.pcbRegions[0].copperAssignmentQualified).toBe(true);
 await page.goto('/tests/model-harness.html');
 await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/TA_TAKT');
 await expect(panel.locator('[data-selection]')).toContainText('does not establish under-package connections');
 await expect(panel.locator('[data-route-review="r101-top-package-entry"]')).toContainText('bounded local fit');
 await expect(panel.locator('[data-route-review="r101-top-package-entry"]')).not.toContainText('undefined');
 for(const route of selection.routes.filter(r=>r.side==='top'))await expect(panel.locator(`[data-route-id="${route.id}"]`)).toHaveAttribute('stroke','#ffe16a');
});

test('body photo regions expose resistor evidence without placing electrical pins',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(points){window.bodyHighlights=points;}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R1');
 await panel.locator('summary').filter({hasText:'Connected pins and evidence'}).click();
 const primary=panel.locator('[data-body-photo="R1"][data-photo-specimen="museum-primary"]');
 const comparison=panel.locator('[data-body-photo="R1"][data-photo-specimen="comparison-20261017"]');
 await expect(primary.getByRole('img')).toBeVisible();
 await expect(primary.locator('rect')).toHaveAttribute('x','1200');
 await expect(primary).toContainText('not numbered pins or hole centres');
 await expect(comparison.getByRole('img')).toBeVisible();
 await expect(comparison).toContainText('comparison photo — different specimen');
 await expect(comparison).toContainText('3894');
 await expect(comparison).toContainText('unused pin 10');
 await expect(comparison).toContainText('Primary-board marking and installed pin orientation remain unconfirmed');
 await expect(comparison.getByRole('link',{name:'Package identification source'})).toHaveAttribute('href','https://www.ycdtotv.de/robotron/kwh_r-nw.pdf');
 await expect(primary.getByRole('link',{name:'Package identification source'})).toHaveCount(0);
 await expect(comparison.getByRole('link',{name:'Open original comparison photo'})).toHaveAttribute('href',/PXL_20261017_080450163.jpg$/);
 await expect(panel.locator('[data-body-photo] circle, [data-body-photo] [data-photo-pin]')).toHaveCount(0);
 expect(await page.evaluate(()=>window.bodyHighlights)).toEqual([]);
 await expect(panel.locator('table tbody tr')).toHaveCount(Object.keys(data.connectivity.components.R1.pins).length);
 for(const cell of await panel.locator('table tbody tr td:last-child').allTextContents())expect(cell).toBe('Unplaced');
 await panel.getByLabel('Controller component',{exact:true}).selectOption('R2');
 await expect(panel.locator('[data-body-photo="R1"]')).toHaveCount(0);
 await expect(panel.locator('[data-body-photo="R2"] rect')).toBeVisible();
 expect(await page.evaluate(()=>window.bodyHighlights)).toEqual([]);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('A1');
 await expect(panel.locator('[data-body-photo]')).toHaveCount(0);
 await expect(panel.locator('a[href$="PXL_20261017_080450163.jpg"]')).toHaveCount(0);
});

test('serial path includes both sides of the filter without assigning visual joints',()=>{
 const selected=controllerSelection(data,'path','host-clock');
 expect(selected.pins.map(p=>`${p.ref}:${p.pin}`).sort()).toEqual(['A1:2','L1.1:1','L1.1:2','R10.1:2','XT1:B2']);
 expect(selected.pins.find(p=>p.ref==='XT1').position).toBeNull();
 expect(selected.routes.every(r=>r.net==='/TA_TAKT'||r.net==='/CABLE_TAKT')).toBe(true);
 expect(data.layout.visualOutputAssembly.status).toBe('visual-observations-only');
 expect(data.layout.visualOutputAssembly).not.toHaveProperty('pads');
 expect(data.connectionReview.cases.find(c=>c.id==='host-clock').crossSideSearch.copperAssignmentQualified).toBe(false);
});

test('serial inspection exposes occlusions and distinguishes cable placeholders',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.pathHighlights=[];installKeyboardControllerReview({keyboardControllerSelection(points,routes){window.pathHighlights.push({points,routes});}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('host-clock');
 await expect(panel.locator('[data-connection-case="host-clock"]')).toContainText('R9.5');
 await expect(panel.locator('[data-connection-case="host-data"]')).toHaveCount(0);
 await expect(panel.locator('[data-connection-case="host-clock"] > figure [data-search-region]')).toHaveCount(1);
 await expect(panel.locator('[data-output-assembly]')).toContainText('no winding pairing');
 await expect(panel.locator('[data-selection]')).toContainText('reference placeholders');
 await expect(panel.locator('[data-output-core]')).toHaveCount(1);
 await panel.getByLabel('Controller board side').selectOption('bottom');
 await expect(panel.locator('[data-output-core]')).toHaveCount(0);
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('host-data');
 await expect(panel.locator('[data-connection-case="host-data"]')).toContainText('R7');
 await expect(panel.locator('[data-connection-case="host-clock"]')).toHaveCount(0);
 const images=await panel.locator('[data-connection-photo] image').evaluateAll(async nodes=>Promise.all(nodes.map(async node=>{const image=new Image();image.src=node.getAttribute('href');await image.decode();return image.naturalWidth;})));
 expect(images.every(width=>width===3072)).toBe(true);
 await panel.getByLabel('Controller component',{exact:true}).selectOption('XT1');
 expect(await page.evaluate(()=>window.pathHighlights.at(-1).points)).toEqual([]);
 await panel.getByRole('button',{name:'Clear highlight'}).click();
 await expect(panel.locator('[data-path-review]')).toBeEmpty();
 await expect(panel.getByLabel('Controller signal path',{exact:true})).toHaveValue('');
});

test('anonymous copper groups preserve open winding identities',async()=>{
 const {copperGroup}=await import('../src/keyboard-controller-copper.js');
 const group=copperGroup(data,'CF2');expect(group.nodes).toEqual(['CF2','CL1','E2']);
 expect(group.edges.map(e=>e.id).sort()).toEqual(['cf2-cable-land','cf2-stub']);
 expect(copperGroup(data,'LF3').edges).toEqual([]);
 expect(copperGroup(data,'missing')).toBeNull();
 expect(data.cableCopper.assignedReferenceTerminals).toEqual({});
 expect(data.cableCopper.projection.copperAssignmentQualified).toBe(false);
 expect(data.cableCopper.comparison.electricalIdentityTransferred).toBe(false);
});

test('copper graph inspection keeps photo observations separate from electrical highlights',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.copperHighlights=[];installKeyboardControllerReview({keyboardControllerSelection(points){window.copperHighlights.push(points);}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller copper group',{exact:true}).selectOption('CF2');
 await expect(panel.locator('[data-selection]')).toContainText('no filter winding or XT1 identity');
 await expect(panel.getByLabel('Controller board side')).toHaveValue('bottom');
 await expect(panel.locator('[data-copper-node="CF2"]')).toHaveAttribute('stroke','#ffe16a');
 await expect(panel.locator('[data-copper-edge="cf2-cable-land"]')).toHaveAttribute('stroke','#ffe16a');
 await expect(panel.locator('[data-copper-edge="lf1-driver-joint"]')).toHaveAttribute('stroke','#5bd8e0');
 await expect(panel.locator('[data-copper-projection-edge]')).toHaveCount(0);
 await panel.getByLabel('Show approximate copper projection').check();
 await expect(panel.locator('[data-copper-projection-edge]')).toHaveCount(2);
 expect(await page.evaluate(()=>window.copperHighlights.at(-1))).toEqual([]);
 await panel.getByRole('button',{name:'Hide copper overlay'}).click();
 await expect(panel.locator('[data-copper-overlay]')).toBeHidden();
 await panel.getByRole('button',{name:'Show copper overlay'}).click();
 await expect(panel.locator('[data-copper-overlay]')).toBeVisible();
 await panel.getByLabel('Controller copper group',{exact:true}).selectOption('LF3');
 await expect(panel.locator('[data-copper-gap="no-readable-departure"]')).toBeVisible();
 await expect(panel.locator('[data-copper-projection-edge]')).toHaveCount(0);
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/TA_DATEN');
 await expect(panel.getByLabel('Controller copper group',{exact:true})).toHaveValue('');
 await expect(panel.locator('[data-copper-graph]')).toHaveCount(0);
});

test('supply review exposes extrapolation without electrical highlights',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.supplyHighlights=[];installKeyboardControllerReview({keyboardControllerSelection(points){window.supplyHighlights.push(points);}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/+5V');
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('supplies');
 await expect(panel.getByLabel('Controller net',{exact:true})).toHaveValue('');
 await expect(panel.locator('[data-supply-review]')).toContainText('alternatives remain unconstrained');
 await expect(panel.locator('[data-filter-prediction="upper-resistors"]')).toHaveCount(8);
 await expect(panel.locator('[data-filter-prediction="extended-resistors"]')).toHaveCount(8);
 await expect(panel.locator('[data-supply-gap="ground-feed"]')).toContainText('not interchangeable with logic ground');
 expect(await page.evaluate(()=>window.supplyHighlights.at(-1))).toEqual([]);
 const widths=await panel.locator('[data-path-review] image').evaluateAll(async nodes=>Promise.all(nodes.map(async n=>{const image=new Image();image.src=n.getAttribute('href');await image.decode();return image.naturalWidth;})));
 expect(widths).toEqual([3072,3072]);
 await panel.getByRole('button',{name:'Hide review overlay'}).first().click();
 await expect(panel.locator('[data-filter-prediction]').first()).toBeHidden();
 await panel.getByLabel('Controller copper group',{exact:true}).selectOption('CF2');
 await expect(panel.locator('[data-supply-review]')).toHaveCount(0);
 await expect(panel.locator('[data-copper-graph]')).toHaveCount(1);
});

test('local filter correspondence links photo features without assigning electrical pins',async({page})=>{
 const fit=data.cableCopper.filterRegistration;
 expect(fit.photoAlignmentAccepted).toBe(true);
 expect(fit.copperAssignmentQualified).toBe(false);
 expect(fit.assignedReferenceTerminals).toEqual({});
 expect(fit.checks.every(c=>c.insideAnchorHull&&c.residualPixels<=fit.tolerancePixels)).toBe(true);
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  window.filterHighlights=[];installKeyboardControllerReview({keyboardControllerSelection(points){window.filterHighlights.push(points);}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('filter-registration');
 await expect(panel.locator('[data-filter-registration]')).toContainText('Local photo correspondence accepted');
 await panel.getByLabel('Matched filter joint',{exact:true}).selectOption('CF2');
 await expect(panel.locator('[data-filter-match]')).toContainText('held-out residual');
 for(const side of ['top','bottom'])await expect(panel.locator(`[data-filter-photo="${side}"] [data-matched-joint="CF2"]`)).toHaveAttribute('stroke','#ffe16a');
 await expect(panel.locator('[data-filter-photo="top"] [data-bounded-span="cf2-stub"]')).toHaveAttribute('stroke-dasharray','2 2');
 await expect(panel.locator('[data-bounded-span="cf2-cable-land"]')).toHaveCount(0);
 expect(await page.evaluate(()=>window.filterHighlights.at(-1))).toEqual([]);
 const widths=await panel.locator('[data-filter-photo] image').evaluateAll(async nodes=>Promise.all(nodes.map(async n=>{const image=new Image();image.src=n.getAttribute('href');await image.decode();return image.naturalWidth;})));
 expect(widths).toEqual([3072,3072]);
 await panel.getByRole('button',{name:'Hide joint overlay'}).first().click();
 await expect(panel.locator('[data-filter-overlay="top"]')).toBeHidden();
 await expect(panel.locator('[data-filter-overlay="bottom"]')).toBeVisible();
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('host-data');
 await expect(panel.locator('[data-filter-registration]')).toHaveCount(0);
 await expect(panel.locator('[data-connection-case="host-data"]')).toBeVisible();
});

test('clock continuation shows new observations without extending native clock routing',async({page})=>{
 const c=data.connectionReview.cases.find(c=>c.id==='host-clock').continuation;
 expect(c.electricalPathComplete).toBe(false);
 expect(c.newNativeRoutes).toEqual([]);
 expect(c.assignedReferenceTerminals).toEqual({});
 expect(c.bankReturn.geometricCorrespondenceAccepted).toBe(true);
 expect(c.figures.flatMap(f=>f.segments).every(s=>s.net===null)).toBe(true);
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('host-clock');
 await panel.getByText('Candidate clock continuation — unassigned copper',{exact:true}).click();
 const continuation=panel.locator('[data-clock-continuation]');
 await expect(continuation.locator('[data-observed-span="outer-lane-to-upper-eye"]')).toBeVisible();
 await expect(continuation.locator('[data-clock-gap="under-r96"]')).toContainText('hides');
 await expect(continuation.locator('[data-clock-gap="upper-eye-to-filter"]')).toContainText('No supported attachment');
 await expect(continuation.locator('[data-upper-corridor]')).toContainText('fit rejected');
 await expect(continuation.locator('[data-observed-span="upper-corridor-middle"]')).toBeVisible();
 await expect(continuation.locator('[data-clock-gap="under-capacitor"]')).toContainText('obscures part of the surrounding routing');
 await expect(continuation).toContainText('Different specimen');
 await panel.getByLabel('Controller signal path',{exact:true}).selectOption('host-data');
 await expect(panel.locator('[data-clock-continuation]')).toHaveCount(0);
});

test('data and strobe tracing expose unresolved joins without assigning native routes',async({page})=>{
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});
  document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 for(const [id,span,gap]of [['host-data','data-above-r42','under-r7'],['clock-strobe','strobe-a4-a6-lane','under-a6-cpu']]){
  const review=data.connectionReview.cases.find(c=>c.id===id).traceReview;
  expect(review.electricalPathComplete).toBe(false);
  expect(review.newNativeRoutes).toEqual([]);
  expect(review.assignedReferenceTerminals).toEqual({});
  await panel.getByLabel('Controller signal path',{exact:true}).selectOption(id);
  const trace=panel.locator(`[data-path-tracing="${id}"]`);await trace.locator(':scope > summary').click();
  await expect(trace.locator(`[data-observed-span="${span}"]`)).toBeVisible();
  await expect(trace.locator(`[data-path-gap="${gap}"]`)).toBeVisible();
  await expect(trace).toContainText('do not establish hidden continuity');
  if(id==='host-data'){await expect(trace).toContainText('Comparison specimen only');await expect(trace.locator('[data-photo-specimen="comparison-20261017"] figcaption')).toContainText('Comparison specimen');}
  else {
   await expect(trace).toContainText('outside anchor hull');
   const reverse=trace.locator('[data-cpu-reverse]');await reverse.locator('summary').click();
   await expect(reverse).toContainText('neither WR nor RD is excluded');
   await expect(reverse.locator('[data-observed-span="cpu-end-land-lane"]')).toBeVisible();
   const image=reverse.locator('[data-connection-photo="comparison-photo-080429077"] image');
   await expect(image).toHaveAttribute('width','4080');await expect(image).toHaveAttribute('height','3072');
   expect(review.cpuReverse.candidates.every(c=>!c.excluded&&!c.observedPathToA6)).toBe(true);
  }
 }
 await page.setViewportSize({width:390,height:844});
 expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+2)).toBe(true);
});

test('native routing audit counts disconnected pad groups and exposes supported rail paths',async({page})=>{
 const audit=data.routingAudit;
 expect(audit.summary.remainingPadGroupLinks).toBe(audit.nets.reduce((n,r)=>n+Math.max(0,r.padGroups-1),0));
 expect(audit.summary.drcUnconnectedItems).toBe(data.qualification.drc.unconnectedItems);
 const ground=audit.nets.find(n=>n.net==='/GND');
 expect(ground.islands.some(g=>['R4.2:2','R7:2','R8:2'].every(p=>g.terminals.includes(p)))).toBe(true);
 expect(ground.nativePadsConnected).toBe(false);
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');await panel.getByLabel('Controller net',{exact:true}).selectOption('/GND');
 const details=panel.locator('[data-routing-audit]');await details.locator(':scope > summary').click();
 await expect(details).toContainText('Includes off-board placeholder pads');
 const net=details.locator('[data-routing-net="/GND"]');await net.locator(':scope > summary').click();
 await expect(net).toContainText('R4.2:2 ↔ R7:2 ↔ R8:2');
 await expect(net).toContainText('Recorded local path: R4.2:2 ↔ R7:2');
 await expect(net.locator('svg').first()).toBeVisible();
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/COL11');
 await expect(panel.locator('[data-routing-net="/COL11"] > summary')).toContainText('1 terminal groups, 0 links remaining');
});

test('completed latch net stays distinct from unresolved eye candidates',async({page})=>{
 const d3=data.routingAudit.nets.find(n=>n.net==='/D3');
 expect(d3.remainingPadGroupLinks).toBe(0);
 expect(d3.islands[0].terminals.sort()).toEqual(['A4:16','A5:8','A8:13']);
 const d0=data.routingAudit.nets.find(n=>n.net==='/D0');
 expect(d0.remainingPadGroupLinks).toBe(1);
 expect(d0.islands.some(g=>g.terminals.length===3&&['A4:19','A5:14','A8:9'].every(p=>g.terminals.includes(p)))).toBe(true);
 expect(d0.islands.some(g=>g.terminals.length===1&&g.terminals[0]==='A1:3')).toBe(true);
 const via=data.layout.vias.find(v=>v.evidence.group==='cpu-latch-d0');
 expect(via.evidence.status).toBe('inferred');
 expect(data.layout.viaRegistration.find(r=>r.viaId===via.id).checks.top.residualMm).toBeLessThan(1.25);
 for(const path of data.busReview.latchPaths){
  expect(path.nativeCopper).toBe(false);
  expect(path.continuityEstablished).toBe(false);
  expect(data.layout.routes.some(r=>r.evidence.group===path.id)).toBe(false);
 }
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/D3');
 await panel.locator('[data-routing-audit] > summary').click();
 await expect(panel.locator('[data-routing-net="/D3"] > summary')).toContainText('0 links remaining');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/D0');
 await panel.locator('[data-routing-audit] > summary').click();
 await panel.locator('[data-routing-net="/D0"] > summary').click();
 await expect(panel.locator('[data-via-review]')).toContainText('Inferred through connection');
 await expect(panel.locator('[data-via-review]')).toContainText('not measured');
 const ring=panel.locator(`[data-via-id="${via.id}"]`);
 await expect(ring).toHaveAttribute('data-evidence-status','inferred');
 await expect(ring).toHaveAttribute('cx',String(via.position[0]));
 await panel.locator('[data-side]').selectOption('bottom');
 await expect(ring).toHaveAttribute('cy',String(-via.position[1]));
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/D1');
 await panel.locator('[data-routing-audit] > summary').click();
 const attachment=panel.locator('[data-latch-attachment-review]');
 await attachment.locator(':scope > summary').click();
 await expect(attachment.locator('tbody tr')).toHaveCount(20);
 await expect(attachment.locator('[data-latch-audit-pin="A4:18"]')).toContainText('No native latch join');
 await expect(attachment.locator('[data-latch-audit-pin="A4:17"]')).toContainText('inferred attachment');
 await expect(attachment).toContainText('opposite row is outside its crop');
 const section=panel.locator('[data-routing-net="/D1"]');
 await section.locator(':scope > summary').click();
 await expect(section).toContainText('Review target: A4:18 ↔ A5:15');
 await expect(section).toContainText('Neither through-board identity');
 await expect(section.locator('[data-eye-position-check="latch-review-d1"]')).toContainText('within the 1.25 mm fit budget');
 await expect(section.locator('[data-search-region]')).toHaveCount(2);
 await expect(section.locator('[data-bus-reference-constraint="latch-review-d1"]')).toContainText('R6.4:2 /CPU_PULLUP');
 await expect(section.locator('[data-bus-terminal-projection]')).toContainText('outside the validated eye-fit hull');
 await expect(section).toContainText('Candidate pad attachment; terminal identity remains inferred');
 await expect(section).toContainText('A2.2:2 /A7');
 await expect(section.locator('[data-registration-trial]')).toHaveCount(1);
 await expect(section.locator('[data-bus-terminal-review]')).toContainText('CPU pin 15');
 await expect(section.locator('[data-bus-terminal-review]')).toContainText('does not exclude a top-side continuation');
 await expect(section.locator('[data-eye-alternatives] tbody tr')).toHaveCount(5);
 await expect(section.locator('[data-eye-continuation]')).toContainText('outside this local fit hull');
 await expect(section.locator('[data-eye-continuation]')).toContainText('R6.4');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/D2');
 await panel.locator('[data-routing-audit] > summary').click();
 const d2=panel.locator('[data-routing-net="/D2"]');await d2.locator(':scope > summary').click();
 await expect(d2.locator(':scope > summary')).toContainText('0 links remaining');
 await expect(d2).toContainText('A4:17 ↔ A5:12 ↔ A8:11');
 await expect(d2.locator('[data-via-review]')).toContainText('Inferred through connection');
 const fit=d2.locator('[data-eye-registration]');await fit.locator(':scope > summary').click();
 await expect(fit).toContainText('held-out eyes');await expect(fit).toContainText('unchanged 1.25 mm budget');
 await expect(fit).toContainText('0.14 mm disagreement');
 await expect(fit).toContainText('Different specimen');
 expect(data.routingAudit.nets.find(n=>n.net==='/D2').islands[0].terminals.sort()).toEqual(['A4:17','A5:12','A8:11']);
 expect(data.busReview.latchPaths.some(p=>p.referenceNet==='/D2')).toBe(false);
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/D4');
 await panel.locator('[data-routing-audit] > summary').click();
 const d4=panel.locator('[data-routing-net="/D4"]');await d4.locator(':scope > summary').click();
 await expect(d4.locator('[data-bus-terminal-projection]')).toContainText('4.20 mm');
 await expect(d4.locator('[data-bus-terminal-projection]')).toContainText('does not establish an attachment');
});

test('bus review separates partial fan-out from connected CPU-ROM lanes',async({page})=>{
 const candidate=data.busReview.paths.find(p=>p.id==='cpu-rom-d5');
 expect(candidate.nativeCopper).toBe(false);
 expect(candidate.sourceSha256).toBe(data.evidence.sources.find(s=>s.id===candidate.source).sha256);
 expect(data.layout.routes.some(r=>r.evidence.group===candidate.id)).toBe(false);
 expect(data.qualification.drc.violations.shorting_items||0).toBe(0);
 const regions=data.bottomRegistration.pcbRegions;
 expect(regions.find(r=>r.id==='cpu-rom').copperAssignmentQualified).toBe(false);
 expect(regions.find(r=>r.id==='cpu-rom-data').copperAssignmentQualified).toBe(true);
 expect(regions.find(r=>r.id==='cpu-rom-bus').copperAssignmentQualified).toBe(true);
 expect(data.topRegistration.pcbRegions.find(r=>r.id==='cpu-latch-data').copperAssignmentQualified).toBe(true);
 for(const [net,pins] of [['/D5',['A4:14','A5:9']],['/D6',['A4:13','A5:10']],['/D7',['A4:12','A5:13']]]){
  expect(data.routingAudit.nets.find(n=>n.net===net).islands.some(g=>g.terminals.length===2&&pins.every(p=>g.terminals.includes(p)))).toBe(true);
 }
 const d1=data.routingAudit.nets.find(n=>n.net==='/D1');
 expect(d1.islands.some(g=>['A5:15','A8:10'].every(p=>g.terminals.includes(p)))).toBe(true);
 await page.goto('/tests/model-harness.html');await page.evaluate(async()=>{
  document.body.insertAdjacentHTML('beforeend','<div id="evidence-controls"></div>');
  const {installKeyboardControllerReview}=await import('/src/keyboard-controller-review.js');
  installKeyboardControllerReview({keyboardControllerSelection(){}});document.querySelector('#keyboard-controller-review').open=true;
 });
 const panel=page.locator('#keyboard-controller-review');
 await panel.getByLabel('Controller net',{exact:true}).selectOption('/D5');
 await panel.locator('[data-routing-audit] > summary').click();
 const section=panel.locator('[data-routing-net="/D5"]');
 await section.locator(':scope > summary').click();
 await expect(section).toContainText('Review target: A5:9 ↔ A8:15');
 await expect(section).toContainText('Recorded local path: A4:14 ↔ A5:9');
 await expect(section).toContainText('Eye-to-CPU continuity remains unresolved');
 await expect(section.locator('[data-bus-cross-side]')).toContainText('projection and search margin lie beneath A5');
 await expect(section.locator('[data-photo-occluder="A5"]')).toBeVisible();
 await expect(section.locator('[data-search-region]')).toHaveCount(1);
 await expect(section.locator('[data-photo-specimen="comparison-20261017"]')).toHaveCount(1);
 for(const path of data.busReview.paths){
  expect(path.crossSideSearch.continuityEstablished).toBe(false);
  expect(path.crossSideSearch.insideCpuBodyWithSearchMargin).toBe(true);
 }
});
