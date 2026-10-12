import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Mesh, BoxGeometry, MeshBasicMaterial } from "three";
import { createDriveMotion } from "../src/robotron-drives.js";
const root = new URL("../public/models/robotron-1715m/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("model.json", root)));

test("mechanical demonstration restores live head and latch state without changing controller input", () => {
  const objects = new Map();
  for (const d of manifest.driveMotion)
    for (const name of [d.head, d.headMetal, d.spindle, d.clamp, d.latch])
      objects.set(
        name,
        new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()),
      );
  const move = createDriveMotion(objects, manifest.driveMotion),
    states = [23 << 8, 51 << 8],
    before = states.slice();
  move(0, states, true, 0, false, false, { phase: 0.5, animate: false });
  expect(objects.get("drive-head-0").position.y).toBeCloseTo((-79 * 25.4) / 96);
  expect(objects.get("drive-latch-0").rotation.y).toBeCloseTo(Math.PI / 2);
  move(16, states, true, 0, false, false);
  expect(objects.get("drive-head-0").position.y).toBeCloseTo(
    (((-79 * 25.4) / 96) * 23) / 79,
  );
  expect(objects.get("drive-head-1").position.y).toBeCloseTo(
    (((-79 * 25.4) / 96) * 51) / 79,
  );
  expect(objects.get("drive-latch-0").rotation.y).toBe(0);
  expect(states).toEqual(before);
  expect(
    move(32, states, true, 0, true, false, { phase: 0.25, animate: true }),
  ).toBe(false);
});

test("download archives match their published hashes", () => {
  const downloads = JSON.parse(readFileSync(new URL("downloads.json", root)));
  expect(downloads.map((d) => d.name)).toEqual([
    "motherboard",
    "floppy-controller",
    "drive-0",
    "drive-1",
  ]);
  for (const d of downloads) {
    const b = readFileSync(new URL(d.file, root));
    expect(b.length).toBe(d.bytes);
    expect(createHash("sha256").update(b).digest("hex")).toBe(d.sha256);
  }
});

test("highlight, manual demonstration, parked plugs and live restoration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  await page.locator("#component-focus").selectOption("head");
  await expect(page.locator("#inspection-title")).toHaveText("Head carriage");
  await page.locator("#mechanism-demo summary").click();
  await page.locator("#drive-demo").check();
  await page.locator("#drive-demo-phase").fill("50");
  await expect(page.locator("#drive-demo-status")).toBeVisible();
  await page.locator("#drive-demo").uncheck();
  await expect(page.locator("#drive-demo-status")).toBeHidden();
  const result = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture } =
      await import("/node_modules/three/build/three.module.js");
    const model = await loadRobotron(new Texture());
    model.interior(true);
    model.inspect({ focus: "head", isolated: "drives" });
    model.tick();
    const head = model.objects.get("drive-head-0"),
      spindle = model.objects.get("drive-spindle-0");
    const highlighted =
      head.userData.highlighted && !spindle.userData.highlighted;
    const material = head.userData.baseMaterial;
    model.inspect({ focus: "none", isolated: "all" });
    model.tick();
    const restoredMaterial = head.material === material;
    const cable = model.objects.get("ribbon-cables"),
      plug = model.objects.get("drive-cable-plugs");
    const rest = cable.geometry.attributes.position.array.slice();
    model.separate(true);
    model.tick();
    const parked = plug.position.toArray();
    let fixed = 0,
      loose = 0;
    const p = cable.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (rest[i * 3 + 2] < 53) {
        if (Math.abs(p.getY(i) - rest[i * 3 + 1]) < 0.001) fixed++;
        else throw Error("Fixed connector moved");
      }
      if (rest[i * 3 + 1] < 4 && rest[i * 3 + 2] > 66) {
        if (
          Math.abs(p.getY(i) - rest[i * 3 + 1] - 18) < 0.001 &&
          Math.abs(p.getZ(i) - rest[i * 3 + 2]) < 0.001
        )
          loose++;
        else throw Error("Loose cable endpoint detached from parked plug");
      }
    }
    model.inspect({ disconnectCables: false });
    model.tick();
    const connected = plug.position.toArray();
    model.separate(false);
    model.tick();
    const returned = plug.position.toArray();
    return {
      highlighted,
      restoredMaterial,
      parked,
      connected,
      returned,
      fixed,
      loose,
    };
  });
  expect(result.highlighted).toBe(true);
  expect(result.restoredMaterial).toBe(true);
  expect(result.parked).toEqual([0, 18, 0]);
  expect(result.connected).toEqual([0, -145, 115]);
  for (const value of result.returned) expect(value).toBeCloseTo(0, 6);
  expect(result.fixed).toBeGreaterThan(0);
  expect(result.loose).toBeGreaterThan(0);
  await page.locator("#model-downloads summary").click();
  await expect(
    page.getByRole("link", { name: "Motherboard model", exact: true }),
  ).toHaveAttribute("download", "");
});
