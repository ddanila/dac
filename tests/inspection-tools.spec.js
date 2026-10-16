import {test,expect} from '@playwright/test';
test('graphics recovery pauses the renderer and resumes without rebuilding application state',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const {createInspectionStage}=await import('/src/inspection-stage.js');const host=document.createElement('div');host.style.cssText='width:300px;height:300px';document.body.append(host);
  const stage=createInspectionStage(host),canvas=host.querySelector('canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('Context loss test unavailable');
  const lost=new Promise(r=>canvas.addEventListener('webglcontextlost',()=>setTimeout(r,50),{once:true}));ext.loseContext();await lost;const status=host.dataset.graphics,notice=host.querySelector('[role=status]').textContent;
  const restored=new Promise(r=>canvas.addEventListener('webglcontextrestored',()=>setTimeout(r,50),{once:true}));ext.restoreContext();await restored;const recovered=host.dataset.graphics;stage.dispose();return {status,notice,recovered,empty:!host.children.length};
 });expect(result.status).toBe('lost');expect(result.notice).toContain('still running');expect(result.recovered).toBe('ready');expect(result.empty).toBe(true);
});
test('inspection controls scope keyboard navigation and share validated view state',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const result=await page.evaluate(async()=>{
  const {installInspectionControls}=await import('/src/inspection-controls.js'),{installExhibitLayout}=await import('/src/exhibit-layout.js');
  document.body.innerHTML='<select id="machine"><option>2</option></select><button id="power"></button><div id="viewport" tabindex="0" data-model="robotron-photo"></div><button id="reset-exhibit-view"></button><button data-view="overview" aria-pressed="true"></button>';
  for(const id of ['open-case','open-monitor','open-keyboard','separate-parts','transparent-covers','release-clamps','disconnect-cables','reference-board-photo','inspection-labels','drive-demo','drive-demo-play','drive-demo-phase']){const e=document.createElement('input');e.id=id;e.type='checkbox';document.body.append(e);}
  for(const id of ['isolate-assembly','component-focus']){const e=document.createElement('select');e.id=id;e.innerHTML='<option value="all">all</option><option value="none">none</option>';document.body.append(e);}
  const nav=[],cuts=[],applied=[],scene={onCameraChange(){},navigate:k=>nav.push(k),section:v=>cuts.push(v),cameraState:()=>({position:[1,2,3],target:[0,0,0]})};let guest=0;
  const update=installInspectionControls(scene,()=>{});installExhibitLayout(scene,v=>{applied.push(v);update();});
  const viewport=document.getElementById('viewport');viewport.onkeydown=()=>guest++;
  document.getElementById('focus-inspection').click();viewport.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  document.getElementById('section-axis').value='y';document.getElementById('section-axis').dispatchEvent(new Event('input'));
  document.getElementById('share-inspection').click();await new Promise(r=>setTimeout(r,50));const link=document.getElementById('inspection-link').value;
  return {nav,guest,cuts,shared:JSON.parse(decodeURIComponent(new URL(link).hash.slice(9)))};
 });expect(result.nav).toEqual(['ArrowLeft']);expect(result.guest).toBe(0);expect(result.cuts.at(-1).axis).toBe('y');expect(result.shared.selects['section-axis']).toBe('y');expect(result.shared.camera.position).toEqual([1,2,3]);
});
test('full exhibit clips, shares its cut and recovers graphics while the worker remains alive',async({page})=>{
 // Includes full CAD load, real handle dragging and WebGL context restoration.
 // Software rendering in CI needs a larger total budget; no extra waits.
 test.setTimeout(process.env.CI?90000:60000);
 // A desktop-sized viewport bounds software rasterization without changing CAD detail.
 await page.setViewportSize({width:960,height:720});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/scene.js',async r=>{const response=await r.fetch(),source=await response.text();await r.fulfill({response,body:source.replace('sectionGizmo.size=.65;','sectionGizmo.size=.65;window.__cutProbe={gizmo:sectionGizmo,camera,controls,THREE};')});});
 await page.addInitScript(()=>{const Base=Worker;window.frames=0;window.Worker=class extends Base{constructor(...args){super(...args);this.addEventListener('message',({data})=>{if(data.type==='frame')window.frames++;});}};});
 await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo',{timeout:30000});await expect(page.locator('#power')).toBeEnabled();
 await page.locator('#section-controls').evaluate(e=>e.open=true);await page.locator('#section-axis').selectOption('x');await page.locator('#section-position').fill('0');
 await page.locator('#section-plane').check();await page.locator('#section-caps').check();await expect(page.locator('#section-cap-status')).toContainText('capped');
 await expect(page.locator('#section-skipped li').first()).toBeAttached();await page.locator('#section-relative').fill('60');expect(Number(await page.locator('#section-position').inputValue())).not.toBe(0);await page.locator('#section-drag').check();await page.locator('#viewport').scrollIntoViewIfNeeded();
 const box=await page.locator('#viewport canvas').boundingBox();const candidates=await page.evaluate(()=>{const {gizmo,camera,THREE}=window.__cutProbe;gizmo.getHelper().updateMatrixWorld(true);return gizmo._gizmo.picker.translate.children.filter(o=>o.name==='X').map(o=>new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()).project(camera).toArray());});
 let hit;for(const v of candidates){const x=box.x+(v[0]+1)*box.width/2,y=box.y+(1-v[1])*box.height/2;await page.mouse.move(x,y);if(await page.evaluate(()=>window.__cutProbe.gizmo.axis==='X')){hit={x,y};break;}}expect(hit).toBeTruthy();const before=Number(await page.locator('#section-position').inputValue());await page.mouse.down();expect(await page.evaluate(()=>window.__cutProbe.controls.enabled)).toBe(false);await page.mouse.move(hit.x+55,hit.y,{steps:5});await page.mouse.up();expect(Number(await page.locator('#section-position').inputValue())).not.toBe(before);expect(await page.evaluate(()=>window.__cutProbe.controls.enabled)).toBe(true);
 await page.locator('#section-drag').uncheck();await page.locator('#section-position').fill('0');
 await page.locator('#measurement-panel').evaluate(e=>e.open=true);const measure=page.locator('#measurement-panel');await measure.locator('[data-refresh]').click();await measure.locator('[data-part]').selectOption('case-base');await measure.locator('[data-a]').click();await measure.locator('[data-part]').selectOption('case-lid');await measure.locator('[data-b]').click();await expect(measure.locator('[data-result]')).toContainText('Model-derived estimate');await measure.locator('[data-enable]').uncheck();
 await page.locator('#share-inspection').click();const link=await page.locator('#inspection-link').inputValue();expect(JSON.parse(decodeURIComponent(new URL(link).hash.slice(9))).selects['section-axis']).toBe('x');
 await page.locator('#power').click();await page.locator('#viewport').scrollIntoViewIfNeeded();
 const result=await page.locator('#viewport canvas').evaluate(async canvas=>{const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_lose_context');const wait=event=>new Promise(r=>canvas.addEventListener(event,()=>setTimeout(r,100),{once:true}));let p=wait('webglcontextlost');ext.loseContext();await p;const frames=window.frames;await new Promise(r=>setTimeout(r,200));const alive=window.frames>frames;p=wait('webglcontextrestored');ext.restoreContext();await p;return alive;});expect(result).toBe(true);await expect(page.locator('#viewport')).toHaveAttribute('data-graphics','ready');await expect(page.locator('#status')).toHaveText('Running');expect(errors).toEqual([]);
});
