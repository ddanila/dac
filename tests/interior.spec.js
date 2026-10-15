import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { pcbPoint, pcbPhotoGeometry, detailedGeometry } from "../src/robotron-interior.js";
const root = new URL("../public/models/robotron-1715m/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("model.json", root)));

test("internal drive bodies fit the case and reference photo landmarks match their boards", () => {
  const bytes = readFileSync(new URL("meshes/drive-frames.stl", root));
  const geometry = new STLLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  expect(min.x).toBeGreaterThan(-250);
  expect(max.x).toBeLessThan(250);
  expect(max.z).toBeLessThan(130);
  expect(max.y - min.y).toBeCloseTo(203, 1);
  geometry.dispose();
  for (const board of manifest.pcbReferences) {
    const [x0, y0, x1, y1] = board.crop;
    const points = [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ].map((p) => pcbPoint(board, ...p));
    if (board.worldCorners) {
      for (let i = 0; i < 4; i++)
        expect(points[i]).toEqual(board.worldCorners[i]);
    } else {
      for (let axis = 0; axis < 2; axis++) {
        expect(Math.min(...points.map((p) => p[axis]))).toBeCloseTo(
          board.origin[axis],
        );
        expect(Math.max(...points.map((p) => p[axis]))).toBeCloseTo(
          board.origin[axis] + board.size[axis],
        );
      }
    }
    const photo = pcbPhotoGeometry(board);
    // Front-facing normals keep both the board and raised package photos visible from above.
    expect(
      board.worldCorners
        ? photo.attributes.normal.getX(0)
        : photo.attributes.normal.getZ(0),
    ).toBeGreaterThan(0.99);
    photo.dispose();
    expect(board.credit).toContain("Danila");
  }
});

test("Inside stays open across camera changes and closes only with its control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const revision = createHash("sha256")
    .update(readFileSync(new URL("model.json", root)))
    .digest("hex")
    .slice(0, 16);
  const modelRequests = [];
  await page.route("**/models/robotron-1715m/model.json*", (route) => {
    const version = new URL(route.request().url()).searchParams.get("v");
    modelRequests.push(version);
    // Simulate a browser/CDN retaining the old exterior-only manifest URL.
    const body =
      version === revision
        ? manifest
        : {
            ...manifest,
            version: 4,
            parts: manifest.parts.filter((p) => p.section !== "interior"),
            pcbReferences: [],
          };
    return route.fulfill({ json: body });
  });
  const meshRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith(".stl"))
      meshRequests.push(new URL(request.url()));
  });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  expect(modelRequests).toEqual([revision]);
  const mechanism = manifest.parts.find((p) => p.name === "drive-mechanisms");
  expect(
    meshRequests.some(
      (url) =>
        url.pathname.endsWith("drive-mechanisms.stl") &&
        url.searchParams.get("v") === mechanism.sha256,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Inside", exact: true }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-interior",
    "true",
  );
  await expect(page.locator("#interior-credit")).toBeVisible();
  await expect(page.locator("#interior-credit")).toContainText(
    "Old Crap Vintage Computing",
  );
  await expect(page.locator("#inspection-text")).toContainText("owner photographs");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.locator("#open-case")).toBeChecked();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-interior",
    "true",
  );
  await page.locator("#open-case").uncheck();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-interior",
    "false",
  );
  await expect(page.locator("#interior-credit")).toBeHidden();
  await page.getByRole("button", { name: "Drive labels", exact: true }).click();
  await expect(page.locator("#open-case")).toBeChecked();
  await expect(page.locator("#separate-parts")).toBeChecked();
  await expect(page.locator("#inspection-text")).toContainText("044713");
  await expect(page.locator("#inspection-text")).toContainText("Ratan");
  await expect(page.locator("#reference-photo")).toHaveAttribute("href", /20250212_094038758/);
  expect(errors).toEqual([]);
});

test("monitor shell opens independently and exposes reference tube geometry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo", {timeout: 20000});
  await page
    .getByRole("button", { name: "Inside monitor", exact: true })
    .click();
  await expect(page.locator("#open-monitor")).toBeChecked();
  await expect(page.locator("#open-case")).not.toBeChecked();
  await expect(page.locator("#inspection-text")).toContainText(
    "CRT funnel and neck",
  );
  await expect(page.locator("#interior-credit")).toContainText(
    "Robotrontechnik",
  );
  await page.getByRole("button", { name: "Monitor", exact: true }).click();
  await expect(page.locator("#open-monitor")).toBeChecked();
  await page.locator("#open-monitor").uncheck();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-monitor-interior",
    "false",
  );
  expect(
    manifest.parts.some(
      (p) => p.name === "tube-funnel" && p.section === "monitor-interior",
    ),
  ).toBe(true);
  expect(manifest.parts.some((p) => p.name === "monitor-shell-upper")).toBe(
    true,
  );
  expect(manifest.parts.some((p) => p.name === "monitor-shell-lower")).toBe(
    true,
  );
});

test('closed sheet-metal enclosures have 1 mm skins and genuine vent openings', async () => {
  const {Mesh,MeshBasicMaterial,DoubleSide,Raycaster,Vector3}=await import('three');
  const samples=[
    ['case-base',[100,-80,-10],[0,0,1]],
    ['case-base',[-270,-180,20],[1,0,0]],
    ['case-lid',[100,0,150],[0,0,-1]],
    ['fascia',[60,-230,110],[0,1,0]],
    ['monitor-shell-lower',[-180,25,250],[1,0,0]],
    ['bezel',[0,-180,446],[0,1,0]], // Flat top lip; the side now has a formed slope.
    ['keyboard-bottom',[180,manifest.keyboard.y,-10],[0,0,1]],
    ['keyboard-shell',[-270,manifest.keyboard.y,10],[1,0,0]],
  ];
  for(const [name,origin,direction] of samples){
    const bytes=readFileSync(new URL(`meshes/${name}.stl`,root));
    const geometry=new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
    const mesh=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));mesh.updateMatrixWorld();
    const distances=new Raycaster(new Vector3(...origin),new Vector3(...direction)).intersectObject(mesh).map(h=>h.distance).filter((d,i,a)=>!i||Math.abs(d-a[i-1])>.001);
    expect(distances.length,name).toBeGreaterThanOrEqual(2);
    expect(Math.abs(distances[1]-distances[0]-1),name).toBeLessThan(.02); // tessellated bend surfaces
    geometry.dispose();mesh.material.dispose();
  }
});

test('closed vents reveal loaded internal parts without opening any cover',async({page})=>{
  test.setTimeout(60000);
  await page.goto('/');await expect(page.locator('#viewport')).toHaveAttribute('data-model','robotron-photo', {timeout: 20000});
  const result=await page.evaluate(async()=>{
    const {loadRobotron}=await import('/src/robotron-model.js');
    const {Texture,Raycaster,Vector3}=await import('/tests/browser-three.js');
    const model=await loadRobotron(new Texture());model.tick();model.group.updateMatrixWorld(true);
    const probe=(origin,direction)=>{
      const ray=new Raycaster(new Vector3(...origin).applyMatrix4(model.group.matrixWorld),new Vector3(...direction).transformDirection(model.group.matrixWorld));
      const hits=ray.intersectObjects([...model.objects.values()].filter(m=>m.visible&&!m.userData.prototype),false);
      return hits.slice(0,3).map(h=>({name:h.object.name,interior:!!(h.object.userData.interior||h.object.userData.monitorInterior)}));
    };
    const required=['logic-boards-motherboard','logic-boards-display-controller','tube-funnel','tube-neck','keyboard-pcb','keyboard-controller-board','drive-frames'];
    return {caseVent:probe([-270,-155,72],[1,0,0]),monitorVent:probe([0,95,500],[0,0,-1]),complete:required.every(n=>{const m=model.objects.get(n);return m.visible&&m.userData.loaded&&m.geometry.attributes.position.count>0;})};
  });
  expect(result.complete).toBe(true);
  expect(result.caseVent[0]?.interior,JSON.stringify(result.caseVent)).toBe(true);
  expect(result.monitorVent[0]?.interior,JSON.stringify(result.monitorVent)).toBe(true);
  await expect(page.locator('#open-case')).not.toBeChecked();await expect(page.locator('#open-monitor')).not.toBeChecked();
});


test("indexed model geometry preserves every triangle and normal without simplification", async () => {
  const { toCreasedNormals } = await import("three/addons/utils/BufferGeometryUtils.js");
  let before = 0, after = 0;
  for (const name of ["case-lid", "logic-boards-motherboard", "keyboard-guides", "drive-spindle-0"]) {
    const bytes = readFileSync(new URL(`meshes/${name}.stl`, root));
    const source = new STLLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const original = toCreasedNormals(source, Math.PI / 4), indexed = detailedGeometry(source);
    const expanded = indexed.toNonIndexed();
    for (const attribute of Object.keys(original.attributes))
      expect(Buffer.from(expanded.attributes[attribute].array.buffer).equals(Buffer.from(original.attributes[attribute].array.buffer))).toBe(true);
    before += original.attributes.position.count; after += indexed.attributes.position.count;
  }
  expect(after).toBeLessThan(before * .75);
});


test('drive lenses are flush and inserted media clears the full lever sweep',()=>{
  const bounds=name=>{const b=readFileSync(new URL(`meshes/${name}.stl`,root));const g=new STLLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));g.computeBoundingBox();const box=g.boundingBox.clone();g.dispose();return box;};
  const face=bounds('drives');
  for(const u of [0,1]){
    expect(bounds(`drive-led-${u}`).min.y).toBeCloseTo(face.min.y,3);
    const lever=bounds(`drive-latch-${u}`),disk=bounds(`drive-diskette-${u}`);
    // Lever rotation is about Y, so its entire sweep preserves these Y bounds.
    expect(disk.min.y-lever.max.y).toBeGreaterThan(6);
    expect(disk.min.y-face.min.y).toBeGreaterThan(4);
    expect(face.min.y-lever.min.y).toBeGreaterThan(9);
    expect(manifest.driveMotion[u].pivot[1]).toBeCloseTo((disk.min.y+disk.max.y)/2,3);
  }
});
