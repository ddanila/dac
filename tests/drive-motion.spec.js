import { test, expect } from "@playwright/test";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { createDriveMotion, driveStepOffsets } from "../src/robotron-drives.js";
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

test("authoritative drive phases ignore wall time, recover after hiding and restore after demo", () => {
  const objects = new Map(
    ["s", "h"].map((n) => [
      n,
      new Mesh(new BoxGeometry(), new MeshBasicMaterial()),
    ]),
  );
  const move = createDriveMotion(objects, [
    {
      unit: 0,
      spindle: "s",
      head: "h",
      pivot: [0, 0, 0],
      travel: [0, (-79 * 25.4) / 96, 0],
    },
  ]);
  const sample = (phase) => [{ phase, steps: 3, detail: 1 }];
  move(0, [1 | (3 << 8)], true, 0, false, false, null, sample(0.25));
  expect(objects.get("s").rotation.z).toBeCloseTo(Math.PI / 2);
  expect(objects.get("h").position.y).toBeCloseTo((-3 * 25.4) / 96);
  move(100000, [1 | (3 << 8)], true, 0, false, false, null, sample(0.25));
  expect(objects.get("s").rotation.z).toBeCloseTo(Math.PI / 2); // paused clock
  objects.get("s").visible = false;
  move(100001, [1], true, 0, false, false, null, sample(0.75));
  objects.get("s").visible = true;
  move(100002, [1], true, 0, false, false, null, sample(0.75));
  expect(objects.get("s").rotation.z).toBeCloseTo(Math.PI * 1.5);
  move(100003, [1], true, 0, true, false, null, sample(0.1));
  expect(objects.get("s").rotation.z).toBeCloseTo(Math.PI * 1.5);
  move(100004, [1], true, 0, false, false, { phase: 0.5 }, sample(0.1));
  move(100005, [1], true, 0, false, false, null, sample(0.1));
  expect(objects.get("s").rotation.z).toBeCloseTo(Math.PI * 0.2);
  move(100006, [1], true, 0, false, false, null, sample(0.25)); // restored state
  expect(objects.get("s").rotation.z).toBeCloseTo(Math.PI / 2);
});

test("seek audio uses every timestamped step, preserves spacing and drops stale/reset batches", () => {
  const sample = { steps: 13, stepAges: [3994, 15975, 27956], speed: 1 };
  const offsets = driveStepOffsets(10, sample);
  expect(offsets).toHaveLength(3);
  expect(offsets[1] - offsets[0]).toBeCloseTo(11981 / 3993600);
  expect(driveStepOffsets(10, { ...sample, speed: 4 })[2]).toBeCloseTo(
    offsets[2] / 4,
  );
  expect(driveStepOffsets(undefined, sample)).toEqual([]);
  expect(driveStepOffsets(20, sample)).toEqual([]);
  expect(driveStepOffsets(12, { ...sample, stepAges: [1000000] })).toEqual([]);
  expect(driveStepOffsets(13, sample)).toEqual([]);
});

test("head geometry consumes the core's fractional physical position", () => {
  const objects = new Map(
    ["s", "h"].map((n) => [
      n,
      new Mesh(new BoxGeometry(), new MeshBasicMaterial()),
    ]),
  );
  const move = createDriveMotion(objects, [
    {
      unit: 0,
      spindle: "s",
      head: "h",
      pivot: [0, 0, 0],
      travel: [0, (-79 * 25.4) / 96, 0],
    },
  ]);
  move(0, [3 << 8], true, 0, false, false, null, [{ phase: 0, position: 2.5 }]);
  expect(objects.get("h").position.y).toBeCloseTo((-2.5 * 25.4) / 96);
});
