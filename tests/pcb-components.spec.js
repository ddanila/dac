import {cachedMesh,requestedMesh,requestedPackage} from './model-asset-paths.js';
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  Box3,
  Matrix4,
  PerspectiveCamera,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
} from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import {
  pcbPhotoGeometry,
  pcbMarkingGeometry,
} from "../src/robotron-interior.js";
const root = new URL("../public/models/robotron-1715m/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("model.json", root)));

test("pinned package meshes retain geometry bounds and fit without chip-body intersections", () => {
  const models = new Map();
  for (const model of manifest.pcbComponents.models) {
    for (const record of Object.values(model.meshes)) {
      const bytes = readFileSync(new URL(record.file, root));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        record.sha256,
      );
      const geo = new STLLoader().parse(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
      );
      geo.computeBoundingBox();
      for (let i = 0; i < 3; i++) {
        expect(geo.boundingBox.min.getComponent(i)).toBeCloseTo(
          record.bounds[0][i],
          3,
        );
        expect(geo.boundingBox.max.getComponent(i)).toBeCloseTo(
          record.bounds[1][i],
          3,
        );
      }
      geo.dispose();
    }
    expect(model.meshes.leads.bounds[0][2]).toBeLessThan(0);
    expect(model.meshes.body.bounds[0][2]).toBeGreaterThan(0);
    models.set(model.id, model);
  }
  const boxes = manifest.pcbComponents.instances.map((p) => {
    const b = models.get(p.model).meshes.body.bounds;
    const matrix = new Matrix4().makeRotationZ((p.rotation * Math.PI) / 180);
    matrix.multiply(new Matrix4().makeRotationX(p.side===-1?Math.PI:0));
    matrix.setPosition(...p.position);
    return {
      board: p.board,
      box: new Box3(new Vector3(...b[0]), new Vector3(...b[1])).applyMatrix4(
        matrix,
      ),
    };
  });
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      if (boxes[i].board === boxes[j].board)
        expect(boxes[i].box.intersectsBox(boxes[j].box)).toBe(false);
  expect(
    manifest.parts.some((p) => ["logic-chips", "logic-pins"].includes(p.name)),
  ).toBe(false);
  const notice = readFileSync(
    new URL("components/kicad/NOTICE.txt", root),
    "utf8",
  );
  expect(notice).toContain("Maurice");
  expect(notice).toContain("GPL-3.0-or-later");
});

test("photographic board surfaces omit raised chips and markings follow package tops", () => {
  for (const board of manifest.pcbReferences.filter(
    (b) => b.components?.length,
  )) {
    const geometry = pcbPhotoGeometry(board),
      p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      expect(p.getZ(i)).toBeCloseTo(board.origin[2] + 0.045, 3);
    const markings = pcbMarkingGeometry(board, manifest.pcbComponents);
    const placements = manifest.pcbComponents.instances.filter(
      (p) => p.board === board.name && p.markings !== false,
    );
    expect(markings.attributes.position.count).toBe(placements.length * 6);
    placements.forEach((p, i) => {
      for (let j = 0; j < 6; j++)
        expect(markings.attributes.position.getZ(i * 6 + j)).toBeCloseTo(
          p.position[2] + p.top + 0.035,
          3,
        );
    });
    geometry.dispose();
    markings.dispose();
  }
});

test("logic-board close-up loads reusable geometry and preserves source credits", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  await page.locator("#isolate-assembly").selectOption("logic");
  await expect(page.locator("#inspection-title")).toHaveText(
    "System logic boards",
  );
  await expect(page.locator("#inspection-text")).toContainText("KiCad");
  await page
    .getByRole("link", { name: "KiCad model credits and licences" })
    .getAttribute("href")
    .then((href) => expect(href).toContain("components/kicad/NOTICE.txt"));
  await page.locator("#isolate-assembly").selectOption("all");
  expect(errors).toEqual([]);
});

test("board holes are open at component leads and solid between holes", () => {
  const loader = new STLLoader();
  for (const board of ["motherboard", "display-controller"]) {
    const part = manifest.parts.find((p) => p.name === `logic-boards-${board}`);
    const bytes = readFileSync(new URL(part.file, root));
    const geometry = loader.parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    );
    const mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({ side: DoubleSide }),
    );
    mesh.updateMatrixWorld();
    const points = manifest.pcbComponents.footprints.filter(
      (p) => p[3] === board,
    );
    // Sample across the board, including the final connector aperture.
    for (const i of [
      0,
      1,
      Math.floor(points.length / 3),
      Math.floor(points.length / 2),
      points.length - 1,
    ]) {
      const [x, y, z] = points[i];
      const ray = new Raycaster(
        new Vector3(x, y, z + 1),
        new Vector3(0, 0, -1),
        0,
        3,
      );
      expect(ray.intersectObject(mesh)).toHaveLength(0);
      ray.ray.origin.x += 0.65;
      expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
    }
    for (const [x, y, , z, name] of manifest.pcbComponents.mounts) {
      if (name !== board) continue;
      const ray = new Raycaster(
        new Vector3(x, y, z + 1),
        new Vector3(0, 0, -1),
        0,
        3,
      );
      expect(ray.intersectObject(mesh)).toHaveLength(0);
      ray.ray.origin.x += 2;
      expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
    }
    geometry.dispose();
    mesh.material.dispose();
  }
});

test("individual boards hide other assemblies and restore their geometry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const [value, title] of [
    ["motherboard", "W/M motherboard"],
    ["display-controller", "W/M display controller"],
  ]) {
    await page.locator("#isolate-assembly").selectOption(value);
    await expect(page.locator("#inspection-title")).toHaveText(title);
  }
  await page.locator("#reference-board-photo").check();
  await page.locator("#board-underside").click();
  await expect(page.locator("#inspection-title")).toHaveText(
    "W/M display controller underside",
  );
  await expect(page.locator("#reference-board-photo")).not.toBeChecked();
  const results = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture } = await import(
      "/tests/browser-three.js"
    );
    const model = await loadRobotron(new Texture());
    await model.loadDetails();
    const records = [];
    for (const board of ["motherboard", "display-controller"]) {
      model.inspect({ isolated: board });
      model.tick();
      const visible = model.group.children.filter((o) => o.visible && o.isMesh);
      const pads = model.objects.get(`logic-pad-${board}`);
      const chips = visible.filter(
        (o) => o.name.startsWith("logic-package-") && o.name.includes("-body-"),
      );
      records.push({
        board,
        foreign: visible
          .filter((o) => o.userData.board !== board)
          .map((o) => o.name),
        pads: pads.count,
        chips: chips.reduce((n, o) => n + o.count, 0),
        photo: visible.some((o) => o.name === `reference-${board}`),
      });
    }
    model.inspect({ isolated: "display-controller", referencePhoto: true });
    await model.loadReferences();
    model.tick();
    const photo = model.group.getObjectByName("reference-display-controller");
    const original =
      photo.visible && photo.userData.evidenceOnly && photo.material.map.image.width > 0;
    const noDuplicate =
      [...model.objects.values()].filter(
        (o) =>
          o.visible &&
          o.userData.board === "display-controller" &&
          !o.name.startsWith("logic-boards-"),
      ).length === 0;
    model.inspect({ referencePhoto: false, isolated: "motherboard" });
    model.detailDistance(3);
    model.tick();
    const solder = model.objects.get("logic-solder-motherboard");
    const farHidden = !solder.visible;
    model.detailDistance(1.5);
    model.tick();
    const nearVisible = solder.visible;
    model.detailDistance(1.85);
    model.tick();
    const stable = solder.visible;
    const idle = !model.tick().dirty;
    const artwork = !photo.visible;
    model.inspect({ isolated: "all" });
    model.interior(true);
    model.tick();
    return {
      original,
      noDuplicate,
      farHidden,
      nearVisible,
      stable,
      idle,
      artwork,
      records,
      restored: ["motherboard", "display-controller"].every(
        (b) => model.objects.get(`logic-boards-${b}`).visible,
      ),
      prototypes: [...model.objects.values()].filter(
        (o) => o.userData.prototype && o.visible,
      ).length,
    };
  });
  for (const r of results.records) {
    expect(r.foreign).toEqual([]);
    expect(r.photo).toBe(false);
    expect(r.chips).toBe(manifest.pcbComponents.instances.filter(p=>p.board===r.board).length);
    expect(r.pads).toBe(
      manifest.pcbComponents.footprints.filter((p) => p[3] === r.board).length,
    );
  }
  for (const name of [
    "original",
    "noDuplicate",
    "farHidden",
    "nearVisible",
    "stable",
    "idle",
    "artwork",
  ])
    expect(results[name], name).toBe(true);
  expect(results.restored).toBe(true);
  expect(results.prototypes).toBe(0);
});

 test("W/M electronics put integrated FDC on motherboard and display components below solder face",()=>{
 const parts=manifest.pcbComponents.instances;
 expect(parts.find(p=>p.ref==="A44"&&p.board==="motherboard").label).toContain("8272");
 expect(parts.some(p=>p.board==="floppy-controller")).toBe(false);
 const display=parts.filter(p=>p.board==="display-controller");
 expect(display.length).toBeGreaterThan(20);
 expect(display.every(p=>p.side===-1)).toBe(true);
 expect(manifest.pcbReferences.find(p=>p.name==="display-controller").evidenceOnly).toBe(true);
 expect(manifest.evidence.assemblies.find(a=>a.id==="motherboard").classes).toEqual(["specimen", "documented"]);
 expect(manifest.evidence.assemblies.every(a=>a.physicalVerification==="unverified")).toBe(true);
 });

test('complete interior loading shares package geometry across boards', async ({page}) => {
  test.setTimeout(60000);
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
  const result=await page.evaluate(async()=>{
    const {loadRobotron}=await import('/src/robotron-model.js');
    const model=await loadRobotron();await model.loadDetails('motherboard');
    const loaded=model.objects.get('logic-boards-display-controller').userData.loaded===true;
    await model.loadDetails('display-controller');
    const bodies=[...model.objects.values()].filter(m=>m.name.startsWith('logic-package-')&&m.name.includes('-body-'));
    const shared=bodies.filter(m=>m.userData.board==='motherboard').some(m=>bodies.some(n=>n.userData.board==='display-controller'&&n.geometry===m.geometry));
    return {loaded,shared};
  });
  expect(result).toEqual({loaded:true,shared:true});
  expect(requestedMesh(requests,'meshes/tube-funnel.stl')).toBe(true);
  expect(requestedMesh(requests,'meshes/keyboard-controller-board.stl')).toBe(true);
});

test('an interior download failure cannot present an empty detailed model as ready', async ({page}) => {
  test.setTimeout(60000);let attempts=0;
  // A corrupt derived cache must fall back to STL; an STL failure still blocks
  // readiness and remains retryable. This covers both transport paths.
  await page.route('**/'+cachedMesh('meshes/logic-boards-motherboard.stl').file+'?*',r=>r.fulfill({body:'corrupt cache'}));
  await page.route('**/meshes/logic-boards-motherboard.stl?*',r=>++attempts===1?r.fulfill({status:503,body:'retry fixture'}):r.continue());
  await page.goto('/');
  await expect(page.locator('#viewport')).toHaveAttribute('data-model','unavailable');
  await expect(page.locator('#power')).toBeEnabled();
  await page.reload();await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
  expect(attempts).toBe(2);
});

test("individual chip inspection preserves instance identity and both evidence links", async ({page}) => {
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute("data-model", "robotron-photo", {timeout:20000});
  const result = await page.evaluate(async () => {
    const {loadPcbComponents} = await import('/src/robotron-interior.js');
    const {inspectionForHit} = await import('/src/scene.js');
    const data = await (await fetch('/models/robotron-1715m/model.json')).json();
    const meshes = await loadPcbComponents(data,new URL('/models/robotron-1715m/',location.href));
    const mesh = meshes.find(m => m.name==='logic-package-DIP-40_W15.24mm-body-motherboard');
    const first = inspectionForHit({object:mesh,instanceId:0});
    const second = inspectionForHit({object:mesh,instanceId:1});

    const answer = {first:first.title,second:second.title,fallback:inspectionForHit({object:{userData:{detail:'motherboard'}}})};
    const geometries = new Set(meshes.map(m=>m.geometry));
    for(const g of geometries)g.dispose();for(const m of meshes)m.material.dispose();
    return answer;
  });
  expect(result.first).not.toBe(result.second);
  expect(result.fallback).toBe('motherboard');
  // Click the actual marked chip surface: decorative ink must not swallow it.
  await page.locator('#isolate-assembly').selectOption('motherboard');
  await expect(page.locator('#viewport')).toHaveAttribute('data-details','ready');
  await page.locator('#viewport').scrollIntoViewIfNeeded();
  const box=await page.locator('#viewport').boundingBox();
  const manifest=JSON.parse(readFileSync(new URL('model.json',root)));
  const p=manifest.pcbComponents.instances.find(p=>p.ref==='A2');
  const camera=new PerspectiveCamera(36,box.width/box.height,.01,40);
  camera.position.set(.4,1.35,.75);camera.lookAt(-.27,.034,0);camera.updateMatrixWorld();
  const v=new Vector3(p.position[0],p.position[2]+p.top,-p.position[1]).multiplyScalar(.0025).project(camera);
  await page.mouse.click(box.x+(v.x+1)*box.width/2,box.y+(1-v.y)*box.height/2);
  await expect(page.locator('#detail-title')).toHaveText(result.second);
  await expect(page.locator('#detail-original')).toHaveAttribute('href',/073200542/);
  await expect(page.locator('#detail-drawing')).toBeVisible();
  await expect(page.locator('#detail-drawing')).toHaveAttribute('href','https://xepb.org/robotron/docs/1715w.zip');
  await expect(page.locator('#component-photo-crop')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#component-model canvas')).toBeVisible();
  await expect(page.locator('#component-confidence')).toContainText('Observed in owner photo');
  await page.keyboard.press('Escape');
  await expect(page.locator('#component-model canvas')).toHaveCount(0);
  await page.evaluate(async()=>{const {showSpecimenDetail}=await import('/src/inspection.js');showSpecimenDetail('front');});
  await expect(page.locator('#component-comparison')).toHaveCount(0);
  await expect(page.locator('#detail-drawing')).toBeHidden();
});


test('chip legends preserve full observed text and uniform atlas proportions',async({page})=>{
 await page.goto("/tests/model-harness.html");
 const result=await page.evaluate(async()=>{
  const {loadPcbLabels}=await import('/src/robotron-interior.js');
  const data=await(await fetch('/models/robotron-1715m/model.json')).json();
  const sample=data.pcbComponents.instances.find(p=>p.marking?.text);
  const full='OBSERVED LONG MARKING 0123456789';
  const drawn=[],original=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){drawn.push(text);return original.call(this,text,...args);};
  let labels;
  try{labels=loadPcbLabels({...data,pcbComponents:{...data.pcbComponents,instances:[{...sample,ref:'SCHEMATIC-ONLY',marking:{text:full}},{...sample,ref:'UNVERIFIED',marking:undefined}]}});}finally{CanvasRenderingContext2D.prototype.fillText=original;}
  const markings=labels.flatMap(m=>m.userData.markings);
  labels.forEach(m=>{m.geometry.dispose();m.material.map.dispose();m.material.dispose();});
  return {drawn,markings};
 });
 expect(result.drawn).toEqual(['OBSERVED LONG MARKING 0123456789']);
 expect(result.markings).toHaveLength(1);
 expect(result.markings[0].width/result.markings[0].height).toBeCloseTo(4,5);
});
