import { test, expect } from "@playwright/test";

test("assembly isolation, transparent covers and keyboard disassembly remain reversible", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const webgl = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  });
  if (!webgl) {
    // Linux headless Firefox may reject WebGL2. The accessible emulator must
    // remain usable and unavailable assembly controls must stay disabled.
    await page.locator("#power").click();
    await expect(page.locator("#status")).toHaveText("Running");
    for (const id of [
      "open-keyboard",
      "transparent-covers",
      "release-clamps",
      "isolate-assembly",
    ])
      await expect(page.locator(`#${id}`)).toBeDisabled();
    expect(errors).toEqual([]);
    return;
  }
  await expect(page.locator("#viewport")).toHaveAttribute(
    "data-model",
    "robotron-photo",
  );
  await page.locator("#open-keyboard").check();
  await expect(page.locator("#inspection-title")).toHaveText(
    "Inside the keyboard",
  );
  await expect(page.locator("#open-case")).not.toBeChecked();
  await page.locator("#isolate-assembly").selectOption("keyboard");
  await page.locator("#transparent-covers").check();
  await page.locator("#release-clamps").check();
  await page.locator("#isolate-assembly").selectOption("all");
  await page.locator("#open-keyboard").uncheck();
  await page.locator("#transparent-covers").uncheck();
  await page.locator("#release-clamps").uncheck();
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("moving mechanisms preserve endpoints, follow keys and restore visibility", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture, Matrix4, Vector3, Quaternion } = await import(
      "/node_modules/three/build/three.module.js"
    );
    const model = await loadRobotron(new Texture());
    model.tick();
    const springs = model.group.getObjectByName("keyboard-springs");
    const stems = model.group.getObjectByName("keyboard-stems");
    const matrix = new Matrix4(),
      position = new Vector3(),
      scale = new Vector3(),
      q = new Quaternion();
    function transform(mesh) {
      mesh.getMatrixAt(0, matrix);
      matrix.decompose(position, q, scale);
      return { z: position.z, scale: scale.z };
    }
    model.inspect({ keyboardOpen: true });
    model.tick();
    const free = transform(springs);
    model.inspect({ keyboardOpen: false });
    model.keyState(model.keys[0].id, true);
    model.tick();
    const pressed = transform(springs),
      stem = transform(stems);
    model.releaseKeys();
    model.tick();
    const released = transform(springs);
    const ribbon = model.objects.get("ribbon-cables");
    const original = ribbon.geometry.attributes.position.array.slice();
    model.interior(true);
    model.separate(true);
    model.tick();
    const lifted = ribbon.geometry.attributes.position.array.slice();
    let fixed = 0,
      moving = 0;
    for (let i = 0; i < original.length; i += 3) {
      if (original[i + 2] < 53) {
        if (Math.abs(original[i + 1] - lifted[i + 1]) < 0.001) fixed++;
        else throw Error("controller cable endpoint moved");
      }
      if (original[i + 1] < 4 && original[i + 2] > 66) {
        if (Math.abs(lifted[i + 1] - original[i + 1] + 145) < 0.001) moving++;
      }
    }
    model.drives([79 << 8, 0]);
    model.inspect({ clamps: true });
    model.tick();
    const head = model.objects.get("drive-head-0").position.toArray();
    const metal = model.objects.get("drive-head-metal-0").position.toArray();
    const clamp = model.objects.get("drive-clamp-0").position.z;
    model.inspect({ isolated: "keyboard", transparent: true });
    model.tick();
    const hidden = !model.objects.get("crt-glass").visible;
    model.inspect({ isolated: "all", transparent: false });
    model.separate(false);
    model.interior(false);
    model.tick();
    return {
      free,
      pressed,
      stem,
      released,
      fixed,
      moving,
      head,
      metal,
      clamp,
      hidden,
      restored: model.objects.get("crt-glass").visible,
      prototype: model.objects.get("prototype-spring").visible,
      opacity: model.objects.get("case-lid").material.opacity,
    };
  });
  expect(result.free.scale).toBeCloseTo(23 / 12);
  expect(result.pressed.scale).toBeCloseTo(9.8 / 12);
  expect(result.stem.z).toBeCloseTo(-2.2);
  expect(result.released.scale).toBeCloseTo(1);
  expect(result.fixed).toBeGreaterThan(0);
  expect(result.moving).toBeGreaterThan(0);
  expect(result.head).toEqual(result.metal);
  expect(result.clamp).toBe(120);
  expect(result.hidden).toBe(true);
  expect(result.restored).toBe(true);
  expect(result.prototype).toBe(false);
  expect(result.opacity).toBe(1);
});
