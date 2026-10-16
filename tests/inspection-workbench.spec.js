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
test('measurement export restores exact points and assembled distance ignores separation',async({page})=>{
 await page.goto('/tests/model-harness.html');const result=await page.evaluate(async()=>{const T=await import('/tests/browser-three.js'),{createMeasurement}=await import('/src/model-measurement.js');const scene=new T.Scene(),root=new T.Group(),a=new T.Mesh(new T.BoxGeometry(10,10,10)),b=a.clone();a.name='a';b.name='b';b.position.x=20;root.scale.setScalar(.0025);root.add(a,b);scene.add(root);let value;const m=createMeasurement(scene,v=>value=v);m.configure(root,{version:48,manifestSha256:'fixture'});m.set(true);m.centre(a,0);m.centre(b,1);const original=value.millimetres;b.position.x=40;m.update();const moved=value.millimetres;m.options({frame:'assembled'});const assembled=value.millimetres,record={format:'DAC-model-measurement-2',...value};m.clear();m.restore(record);const restored=value.millimetres;let rejected=false;try{m.restore({...record,identity:{version:49}});}catch{rejected=true;}return {original,moved,assembled,restored,rejected,axes:value.axes,matrices:record.points.every(p=>p.displayedMatrix.length===16&&p.assembledMatrix.length===16)};});expect(result).toEqual({original:20,moved:40,assembled:20,restored:20,rejected:true,axes:{x:20,y:0,z:0},matrices:true});
});

test('execution target, flags and changed registers work with a custom loop ROM',async({page})=>{
 await page.route('**/models/robotron-1715m/model.json?*',r=>r.fulfill({status:503,body:'No CAD needed'}));
 await page.goto('/');await expect(page.locator('#power')).toBeEnabled();await page.locator('#media-controls').evaluate(e=>e.open=true);
 const rom=Buffer.alloc(2048);rom.set([0x04,0xc3,0,0]);
 await page.locator('#rom').setInputFiles({name:'loop.bin',mimeType:'application/octet-stream',buffer:rom});await page.locator('#prom').setInputFiles('public/media/robotron/cas.bin');await page.locator('#load').click();await page.locator('#power').click();
 const panel=page.locator('#debug-controls');await panel.evaluate(e=>e.open=true);await panel.locator('[data-pause]').click();await expect(page.locator('#status')).toContainText('Paused');
 await panel.locator('[data-execution]').fill('0000');await panel.locator('[data-run-to]').click();await expect(panel.locator('[data-status]')).toContainText('target instruction fetch boundary');await expect(panel.locator('[data-disassembly]')).toContainText('0000');await expect(panel.locator('[data-flags]')).toContainText('P/V=');
 await panel.locator('[data-step]').click();await expect(panel.locator('.debug-changed').first()).toBeVisible();await panel.locator('[data-memory]').click();await expect(panel.locator('[data-bytes]')).toContainText('ROM:');
 await panel.locator('[data-clear-break]').click();await expect(panel.locator('[data-status]')).toContainText('cleared');
});
test('vertex-snapped instance points restore and clipped points reject atomically',async({page})=>{
 await page.goto('/tests/model-harness.html');const r=await page.evaluate(async()=>{const T=await import('/tests/browser-three.js'),{createMeasurement}=await import('/src/model-measurement.js');const scene=new T.Scene(),root=new T.Group(),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,10,0,0,0,10,0],3));const mesh=new T.InstancedMesh(g,new T.MeshBasicMaterial(),2);mesh.name='samples';mesh.setMatrixAt(1,new T.Matrix4().makeTranslation(20,0,0));root.scale.setScalar(.0025);root.add(mesh);scene.add(root);let value;const m=createMeasurement(scene,v=>value=v);m.configure(root,{version:48});m.set(true);m.options({snap:true});m.pick({object:mesh,instanceId:0,point:new T.Vector3(.001,0,0),face:{a:0,b:1,c:2}});m.pick({object:mesh,instanceId:1,point:new T.Vector3(.051,0,0),face:{a:0,b:1,c:2}});const record={format:'DAC-model-measurement-2',...value};m.clear();m.restore(record);const distance=value.millimetres;m.options({visible:p=>p.x<.04});let rejected=false;try{m.pick({object:mesh,instanceId:1,point:new T.Vector3(.051,0,0),face:{a:0,b:1,c:2}});}catch{rejected=true;}return {distance,rejected,snapped:value.points.every(p=>p.snapped),markers:scene.children[1].children.map(o=>o.visible)};});expect(r).toEqual({distance:20,rejected:true,snapped:true,markers:[true,false,false]});
});
