import { test, expect } from "@playwright/test";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import {
  createDriveMotion,
  driveStepOffsets,
  describeDrive,
} from "../src/robotron-drives.js";
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

test("head loading pivots only the upper arm; inserted medium shares spindle phase", () => {
  const objects = new Map(
    ["s", "h", "arm", "medium"].map((n) => [
      n,
      new Mesh(new BoxGeometry(), new MeshBasicMaterial()),
    ]),
  );
  const move = createDriveMotion(objects, [
    {
      unit: 0,
      spindle: "s",
      head: "h",
      headArm: "arm",
      medium: "medium",
      armPivot: [1, 2, 3],
      pivot: [0, 0, 0],
      travel: [0, -20, 0],
    },
  ]);
  const sample = [{ phase: 0.25, position: 39.5, headLoad: 0 }];
  move(0, [8], true, 0, false, false, null, sample);
  expect(objects.get("arm").rotation.x).toBeCloseTo(-0.08);
  expect(objects.get("arm").position.y).toBe(-8);
  expect(objects.get("medium").rotation.z).toBeCloseTo(Math.PI / 2);
  expect(objects.get("medium").visible).toBe(true);
  sample[0].headLoad = 1;
  move(20, [8], true, 0, false, false, null, sample);
  expect(objects.get("arm").rotation.x).toBeCloseTo(0);
  expect(objects.get("h").rotation.x).toBe(0);
  move(25, [8], true, 0, false, true, null, sample);
  expect(objects.get("arm").rotation.x).toBeCloseTo(-0.08);
  expect(objects.get("medium").visible).toBe(true);
  move(30, [0], true, 0, true, false, null, sample);
  expect(objects.get("medium").visible).toBe(false);
});
test("diagnostics distinguish controller selection, index counts and unavailable older cores", () => {
  expect(
    describeDrive(
      8,
      {
        phase: 0.5,
        position: 12.25,
        steps: 44,
        detail: 1 | 2 | (3 << 8),
        mechanics: (1000 << 8) | 3,
        indexes: 8,
        controller: (6 << 8) | 2,
        transfer: (1024 << 16) | 123,
      },
      0,
    ),
  ).toContain("Read Data · transferring · bytes 123/1024");
  expect(describeDrive(8, { phase: 0, steps: 2, detail: 0 }, 1)).toContain(
    "not selected",
  );
  expect(describeDrive(0, null, 0)).toContain("unavailable");
});

test('inserted diskettes close levers without power; sleeves stay still and clamps do not eject media', () => {
  const objects = new Map();
  const descriptions = [0,1].map(unit => {
    const d = { unit, pivot:[0,0,0], latchPivot:[0,0,0], travel:[0,-20,0] };
    for (const part of ['spindle','head','latch','clamp','medium','jacket','disketteLabel']) {
      d[part] = `${part}-${unit}`;
      objects.set(d[part], new Mesh(new BoxGeometry(),new MeshBasicMaterial()));
    }
    return d;
  });
  const move = createDriveMotion(objects,descriptions);
  move(0,[8,0],false,0,false);
  expect(objects.get('latch-0').rotation.y).toBeCloseTo(Math.PI/2);
  expect(objects.get('latch-1').rotation.y).toBe(0);
  expect(objects.get('jacket-0').visible).toBe(true);
  expect(objects.get('jacket-1').visible).toBe(false);
  move(10,[8,8],true,1,false,true,null,[{phase:.25},{phase:.5}]);
  expect(objects.get('latch-0').rotation.y).toBe(0);
  expect(objects.get('jacket-0').visible).toBe(true);
  expect(objects.get('medium-0').visible).toBe(true);
  expect(objects.get('medium-0').rotation.z).toBe(0); // released disc does not follow the spindle
  expect(objects.get('jacket-0').rotation.z).toBe(0);
  expect(objects.get('disketteLabel-0').position.y).toBe(-145);
  move(20,[32,8],false,0,false);
  expect(objects.get('jacket-0').visible).toBe(true);
  expect(objects.get('jacket-0').position.y).toBeLessThan(0);
  for (let t=70;t<=570;t+=50) move(t,[32,8],false,0,false);
  expect(objects.get('jacket-0').visible).toBe(false);
  move(580,[40,8],false,0,false);
  expect(objects.get('jacket-0').position.y).toBeLessThan(-100);
  for (let t=630;t<=1130;t+=50) move(t,[40,8],false,0,false);
  expect(objects.get('jacket-0').position.y).toBeCloseTo(0);
  expect(objects.get('latch-0').rotation.y).toBe(0);
  move(1140,[0,8],false,0,true);
  expect(objects.get('jacket-0').visible).toBe(false);
  expect(objects.get('latch-1').rotation.y).toBeCloseTo(Math.PI/2);
});
