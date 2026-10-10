import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
    "robotron-photo",
  );
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
  await expect(page.locator("#inspection-text")).toContainText("TEAC FD-55FV");
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
  expect(errors).toEqual([]);
});

test("monitor shell opens independently and exposes reference tube geometry", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
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
