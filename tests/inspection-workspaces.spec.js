import {test,expect} from '@playwright/test';
test('inspection records survive collection backup, selective conflicts and checksum checks',async({page})=>{
 await page.goto('/tests/model-harness.html');
 const r=await page.evaluate(async()=>{
  const {saveInspection,loadInspection}=await import('/src/inspection-store.js'),{stored,storedKeys}=await import('/src/session-store.js'),{exportCollection,importCollection,previewCollection}=await import('/src/collection-backup.js');
  const measurement=[{name:'PCB',record:{identity:{version:48},points:[]}}],view={version:1,identity:{version:48},layout:{version:1,camera:{position:[1,2,3],target:[0,0,0]}}};
  await saveInspection('measurements','Named measurements',measurement);await saveInspection('view:test','PCB view',view);const bytes=await exportCollection();
  for(const k of await storedKeys())await stored(k,null);await importCollection(bytes);
  const restored=[await loadInspection('measurements'),await loadInspection('view:test')];
  await saveInspection('view:test','New local view',{...view,part:'1.2'});const preview=await previewCollection(bytes);
  await importCollection(bytes,{'inspection:view:test':'replace'});
  const row=await stored('inspection:measurements');new Uint8Array(row.bytes)[0]^=1;await stored('inspection:measurements',row);
  let error;try{await exportCollection();}catch(e){error=e.message;}
  return {restored,replaced:await loadInspection('view:test'),conflict:preview.find(r=>r.key==='inspection:view:test').status,error};
 });expect(r.restored[0][0].name).toBe('PCB');expect(r.restored[1].layout.camera.position).toEqual([1,2,3]);expect(r.replaced.part).toBeUndefined();expect(r.conflict).toBe('conflict');expect(r.error).toContain('checksum');
});
test('cover motion is gradual, attachments follow, reversal and reduced motion settle exactly',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/tests/model-harness.html');
 const r=await page.evaluate(async()=>{
  const T=await import('/tests/browser-three.js'),{loadRobotron}=await import('/src/robotron-model.js');const m=await loadRobotron(new T.Texture());window.coverModel=m;m.tick();m.interior(true);m.openMonitor(true);await new Promise(r=>setTimeout(r,30));m.tick();
  const lid=m.objects.get('case-lid').position.toArray(),fascia=m.objects.get('fascia').position.toArray(),lower=m.objects.get('monitor-shell-lower').position.toArray(),upper=m.objects.get('monitor-shell-upper').position.toArray();
  m.interior(false);m.openMonitor(false);await new Promise(r=>setTimeout(r,30));m.tick();return {lid,fascia,lower,upper,reverse:m.objects.get('case-lid').position.z};
 });expect(r.lid[2]).toBeGreaterThan(0);expect(r.lid[2]).toBeLessThan(180);expect(r.fascia).toEqual(r.lid);expect(r.lower).toEqual(r.lid);expect(r.upper[2]).toBeGreaterThan(r.lower[2]);expect(r.reverse).toBeLessThan(r.lid[2]);
 await page.emulateMedia({reducedMotion:'reduce'});const poses=await page.evaluate(()=>{const m=window.coverModel;m.interior(true);m.openMonitor(true);m.tick();return ['case-lid','monitor-shell-upper'].map(n=>m.objects.get(n).position.toArray());});expect(poses).toEqual([[0,400,180],[0,190,335]]);
});
test('named workspace restores the selected component and measurement in the full exhibit',async({page})=>{
 await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo',{timeout:30000});await expect(page.locator('#power')).toBeEnabled();
 await page.locator('#section-controls').evaluate(e=>e.open=true);await page.locator('#component-search').evaluate(e=>e.open=true);
 const parts=page.locator('#component-search');await parts.locator('[data-search]').fill('keyboard-pcb-supports');await expect(parts.locator('[data-parts] option')).toHaveCount(1);await parts.locator('[data-focus]').click();await expect(parts.locator('[data-status]')).toContainText('keyboard-pcb-supports');
 await page.locator('#measurement-panel').evaluate(e=>e.open=true);const measure=page.locator('#measurement-panel');await measure.locator('[data-refresh]').click();await measure.locator('[data-part]').selectOption('case-base');await measure.locator('[data-a]').click();await measure.locator('[data-part]').selectOption('case-lid');await measure.locator('[data-b]').click();await expect(measure.locator('[data-result]')).toContainText('Model-derived');await measure.locator('[data-frame]').selectOption('assembled');await measure.locator('[data-axes]').selectOption('part-a');
 await page.locator('#inspection-workspaces').evaluate(e=>e.open=true);const panel=page.locator('#inspection-workspaces');await panel.locator('[data-name]').fill('PCB supports');await panel.locator('[data-save]').click();await expect(panel.locator('[data-status]')).toHaveText('Inspection saved.');
 const before=await page.evaluate(async()=>{const {inspectionViews,loadInspection}=await import('/src/inspection-store.js');return loadInspection((await inspectionViews())[0].key);});expect(before.part).toBeTruthy();expect(before.measurement.points).toHaveLength(2);
 await page.locator('#reset-exhibit-view').click();await page.locator('#section-controls').evaluate(e=>e.open=true);await panel.evaluate(e=>e.open=true);await panel.locator('[data-load]').click();await expect(panel.locator('[data-status]')).toHaveText('Inspection restored.');await expect(measure.locator('[data-frame]')).toHaveValue('assembled');await expect(measure.locator('[data-axes]')).toHaveValue('part-a');await expect(parts.locator('[data-status]')).toContainText('keyboard-pcb-supports');
});

test('component identities survive sibling load order and do not select a different part',async({page})=>{
 await page.goto('/tests/model-harness.html');const r=await page.evaluate(async()=>{const T=await import('/tests/browser-three.js'),{partId,findPart}=await import('/src/model-part-id.js');const root=new T.Group(),a=new T.Mesh(),b=new T.Mesh();a.name='support';b.name='board';root.add(a,b);const id=partId(root,a);root.remove(a);root.add(a);return findPart(root,id).name;});expect(r).toBe('support');
});

test('saved workspace survives reload and rejects another model without changing the scene',async({page})=>{
 // Exercise the real DOM controller and IndexedDB independently of CAD loading.
 // The full-exhibit test above checks these callbacks against actual geometry.
 async function mount(){await page.evaluate(async()=>{
  const {installInspectionControls}=await import('/src/inspection-controls.js'),{installExhibitLayout}=await import('/src/exhibit-layout.js');
  document.body.innerHTML='<select id="machine"><option>2</option></select><button id="power"></button><div id="viewport" data-model="robotron-photo"></div><button id="reset-exhibit-view"></button><button data-view="overview" aria-pressed="true"></button>';
  for(const id of ['open-case','open-monitor','open-keyboard','separate-parts','transparent-covers','release-clamps','disconnect-cables','reference-board-photo','inspection-labels','drive-demo','drive-demo-play','drive-demo-phase']){const e=document.createElement('input');e.id=id;e.type='checkbox';document.body.append(e);}
  for(const id of ['isolate-assembly','component-focus']){const e=document.createElement('select');e.id=id;e.innerHTML='<option value="all">all</option><option value="none">none</option>';document.body.append(e);}
  window.restored=[];
  const scene={onCameraChange(){},section(){},cameraState:()=>({position:[1,2,3],target:[4,5,6]}),modelIdentity:()=>({version:7}),selectedPart:()=> 'pcb',restoreMeasurement:v=>window.restored.push(['measurement',v]),clearMeasurement:()=>window.restored.push(['clear']),selectPart:v=>window.restored.push(['part',v])};
  installInspectionControls(scene,()=>{});installExhibitLayout(scene,v=>window.restored.push(['layout',v]));window.restored=[];
 });await page.locator('#section-controls').evaluate(e=>e.open=true);await page.locator('#inspection-workspaces').evaluate(e=>e.open=true);}
 await page.goto('/tests/model-harness.html');await mount();
 const panel=page.locator('#inspection-workspaces');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('model-measurement',{detail:{points:[{part:'base'},{part:'lid'}],frame:'assembled',axes:'part-a'}})));
 await panel.locator('[data-name]').fill('Saved workspace');await panel.locator('[data-save]').click();await expect(panel.locator('[data-status]')).toHaveText('Inspection saved.');
 await page.reload();await mount();await panel.locator('[data-load]').click();await expect(panel.locator('[data-status]')).toHaveText('Inspection restored.');
 const restored=await page.evaluate(()=>window.restored);
 expect(restored.map(r=>r[0])).toEqual(['layout','measurement','part']);expect(restored[0][1].camera).toEqual({position:[1,2,3],target:[4,5,6]});expect(restored[1][1]).toMatchObject({points:[{part:'base'},{part:'lid'}],frame:'assembled',axes:'part-a'});expect(restored[2][1]).toBe('pcb');
 await page.evaluate(async()=>{const {inspectionViews,loadInspection,saveInspection}=await import('/src/inspection-store.js'),row=(await inspectionViews())[0],value=await loadInspection(row.key);value.identity.version=-1;await saveInspection(row.key,row.name,value);});
 await panel.locator('[data-load]').click();await expect(panel.locator('[data-status]')).toContainText('does not match');expect(await page.evaluate(()=>window.restored)).toEqual(restored);
});
