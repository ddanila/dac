import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Box3, Matrix4, Vector3 } from "three";
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
      (p) => p.board === board.name,
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
