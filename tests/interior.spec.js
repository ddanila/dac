import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { pcbPoint, pcbPhotoGeometry } from "../src/robotron-interior.js";
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
    for (let axis = 0; axis < 2; axis++) {
      expect(Math.min(...points.map((p) => p[axis]))).toBeCloseTo(
        board.origin[axis],
      );
      expect(Math.max(...points.map((p) => p[axis]))).toBeCloseTo(
        board.origin[axis] + board.size[axis],
      );
    }
    const photo = pcbPhotoGeometry(board);
    // Front-facing normals keep both the board and raised package photos visible from above.
    expect(photo.attributes.normal.getZ(0)).toBeGreaterThan(0.99);
    photo.dispose();
    expect(board.credit).toContain("not Danila");
  }
});

test("Inside exposes the reference interior with credits and closes on Overview", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  await page.getByRole("button", { name: "Inside", exact: true }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-interior",
    "true",
  );
  await expect(page.locator("#interior-credit")).toBeVisible();
  await expect(page.locator("#interior-credit")).toContainText(
    "Old Crap Vintage Computing",
  );
  await expect(page.locator("#inspection-text")).toContainText("TEAC FD-55FV");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-interior",
    "false",
  );
  await expect(page.locator("#interior-credit")).toBeHidden();
  expect(errors).toEqual([]);
});
