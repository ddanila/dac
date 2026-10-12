import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  Box3,
  Matrix4,
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
    "robotron-photo",
  );
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
  for (const board of ["motherboard", "floppy-controller"]) {
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
    ["motherboard", "Motherboard"],
    ["floppy-controller", "Floppy controller"],
  ]) {
    await page.locator("#isolate-assembly").selectOption(value);
    await expect(page.locator("#inspection-title")).toHaveText(title);
  }
  await page.locator("#reference-board-photo").check();
  await page.locator("#board-underside").click();
  await expect(page.locator("#inspection-title")).toHaveText(
    "Floppy controller underside",
  );
  await expect(page.locator("#reference-board-photo")).not.toBeChecked();
  const results = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture } = await import(
      "/node_modules/three/build/three.module.js"
    );
    const model = await loadRobotron(new Texture());
    const records = [];
    for (const board of ["motherboard", "floppy-controller"]) {
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
    model.inspect({ isolated: "motherboard", referencePhoto: true });
    model.tick();
    const photo = model.group.getObjectByName("reference-motherboard");
    const original =
      photo.geometry === photo.userData.original.geometry &&
      photo.children.every((m) => !m.visible);
    const noDuplicate =
      [...model.objects.values()].filter(
        (o) =>
          o.visible &&
          o.userData.board === "motherboard" &&
          !o.name.startsWith("logic-boards-"),
      ).length === 0;
    model.inspect({ referencePhoto: false });
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
    const artwork = photo.geometry === photo.userData.artwork.geometry;
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
      restored: ["motherboard", "floppy-controller"].every(
        (b) => model.objects.get(`logic-boards-${b}`).visible,
      ),
      prototypes: [...model.objects.values()].filter(
        (o) => o.userData.prototype && o.visible,
      ).length,
    };
  });
  for (const r of results.records) {
    expect(r.foreign).toEqual([]);
    expect(r.photo).toBe(true);
    expect(r.chips).toBe(r.board === "motherboard" ? 92 : 40);
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
