import { test, expect } from "@playwright/test";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { createDriveMotion } from "../src/robotron-drives.js";
test("drive mechanisms stay independent, respect reduced motion and retain head position", () => {
  const objects = new Map(
    ["s0", "s1", "h0", "h1"].map((n) => [
      n,
      new Mesh(new BoxGeometry(), new MeshBasicMaterial()),
    ]),
  );
  const move = createDriveMotion(
    objects,
    [0, 1].map((unit) => ({
      unit,
      spindle: `s${unit}`,
      head: `h${unit}`,
      pivot: [unit * 154, 0, 0],
      travel: [0, -35, 0],
    })),
  );
  move(0, [1 | (79 << 8), 0], true, 0, false);
  move(20, [1 | (79 << 8), 0], true, 0, false);
  expect(objects.get("s0").rotation.z).toBeGreaterThan(0);
  expect(objects.get("s1").rotation.z).toBe(0);
  expect(objects.get("h0").position.y).toBe(-35);
  expect(objects.get("h1").position.y).toBeCloseTo(0);
  const angle = objects.get("s0").rotation.z;
  move(40, [1 | (79 << 8), 1], true, 1, true);
  expect(objects.get("s0").rotation.z).toBe(angle);
  expect(objects.get("h0").position.y).toBe(-180);
  expect(objects.get("h0").position.z).toBe(115);
  objects.get("s0").visible = false;
  move(60, [1, 0], true, 0, false);
  expect(objects.get("s0").rotation.z).toBe(angle);
  move(80, [1, 1], false, 0, false);
  expect(objects.get("s1").rotation.z).toBe(0);
});
