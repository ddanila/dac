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
      "component-focus",
      "disconnect-cables",
      "drive-demo",
      "drive-demo-play",
      "drive-demo-phase",
      "board-underside",
      "reference-board-photo",
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
    model.inspect({ disconnectCables: false });
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

test("owner controller separates as one assembly and monitor underside follows its shell", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const state = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture } = await import("/node_modules/three/build/three.module.js");
    const model = await loadRobotron(new Texture());
    const parts = [...model.objects].filter(([name]) => name.startsWith("keyboard-controller-"));
    model.inspect({ keyboardOpen: true, isolated: "keyboard" });
    model.tick();
    const opened = parts.map(([, mesh]) => ({ visible: mesh.visible, position: mesh.position.toArray() }));
    const pcb = model.objects.get("keyboard-pcb");
    const boardOpen = { visible: pcb.visible, angle: pcb.rotation.x,
      artwork: model.objects.get("keyboard-matrix-artwork").visible,
      pads: model.objects.get("keyboard-pcb-metal").visible,
      traces: model.objects.get("keyboard-controller-traces").visible,
      capsY: model.keyObjects.values().next().value.parent.position.y,
      plateY: model.objects.get("keyboard-plate").position.y };
    const shell = model.group.getObjectByName("clear-key-shell");
    const inlay = shell.parent.getObjectByName("silver-key-inlay");
    shell.geometry.computeBoundingBox();
    inlay.geometry.computeBoundingBox();
    const clearKey = { transparent: shell.material.transparent, opacity: shell.material.opacity,
      metalness: inlay.material.metalness, sharedKey: shell.parent === inlay.parent,
      beneathShell: inlay.geometry.boundingBox.max.z < shell.geometry.boundingBox.max.z };
    model.inspect({ keyboardOpen: false, isolated: "all" });
    model.tick();
    const closed = parts.map(([, mesh]) => ({ visible: mesh.visible, position: mesh.position.toArray() }));
    model.interior(true);
    model.tick();
    const moved = ["monitor-shell-lower", "monitor-under-controls", "monitor-stand-metal", "monitor-joint-lip"].map(name => model.objects.get(name).position.toArray());
    model.interior(false);
    model.tick();
    const restored = ["monitor-under-controls", "monitor-stand-metal", "monitor-joint-lip"].map(name => model.objects.get(name).position.toArray());
    const seam = ["monitor-shell-lower", "monitor-shell-upper", "monitor-joint-lip"].map(name => {
      const mesh = model.objects.get(name);
      mesh.geometry.computeBoundingBox();
      return { min: mesh.geometry.boundingBox.min.z, max: mesh.geometry.boundingBox.max.z };
    });
    return { seam, opened, closed, moved, restored, boardOpen, boardClosed: { angle: pcb.rotation.x, position: pcb.position.toArray() }, clearKey };
  });
  expect(state.boardOpen.visible).toBe(true);
  expect(state.boardOpen).toMatchObject({ artwork: true, pads: true, traces: true });
  expect(state.boardOpen.capsY).toBeGreaterThan(-300);
  expect(state.boardOpen.plateY).toBeLessThan(-100);
  expect(state.boardOpen.angle).toBeCloseTo(Math.PI);
  expect(state.boardClosed).toEqual({ angle: 0, position: [0, 0, 0] });
  expect(state.clearKey).toMatchObject({transparent: true, sharedKey: true, beneathShell: true});
  expect(state.clearKey.opacity).toBeLessThan(0.5);
  expect(state.clearKey.metalness).toBeGreaterThan(0.5);
  expect(state.opened.length).toBeGreaterThan(1);
  expect(state.opened.every(p => p.visible && p.position[2] > 0)).toBe(true);
  expect(new Set(state.opened.map(p => JSON.stringify(p.position))).size).toBe(1);
  expect(state.closed.every(p => !p.visible && p.position.every(v => v === 0))).toBe(true);
  expect(state.moved[1]).toEqual(state.moved[0]);
  expect(state.moved[2]).toEqual(state.moved[0]);
  expect(state.moved[3]).toEqual(state.moved[0]);
  expect(state.seam[1].min - state.seam[0].max).toBeCloseTo(2);
  expect(state.seam[2].min).toBeLessThan(state.seam[0].max);
  expect(state.seam[2].max).toBeGreaterThan(state.seam[1].min);
  expect(state.restored.every(p => p.every(v => v === 0))).toBe(true);
});

// Owner side photos show uninterrupted walls, including the diagonal views
// where an oversized rectangular underside cavity used to pierce the cylinder.
test("opaque keycaps have continuous sidewalls around every exported shape", async ({ page }) => {
  await page.goto("/");
  const failures = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture, Mesh, Raycaster, Vector3 } = await import("/node_modules/three/build/three.module.js");
    const model = await loadRobotron(new Texture());
    const checked = new Set(), failures = [];
    model.group.traverse(body => {
      if (body.name !== "opaque-key-cap" || checked.has(body.geometry)) return;
      checked.add(body.geometry);
      const key = body.userData.key;
      if (key.topWidth) {
        const vertices = body.geometry.attributes.position;
        let lo = Infinity, hi = -Infinity;
        for (let i = 0; i < vertices.count; i++) if (vertices.getZ(i) >= 9.39) {
          lo = Math.min(lo, vertices.getX(i)); hi = Math.max(hi, vertices.getX(i));
        }
        if (Math.abs(hi - lo - key.topWidth) > 0.05)
          failures.push({ key: key.id, measured: hi - lo, expected: key.topWidth });
      }
      // Derive the minimum solid outer radius from the raised profile, so
      // spacing refinements do not assume the former 19.5 mm key pitch.
      const vertices = body.geometry.attributes.position;
      let topX = 0, topY = 0;
      for (let i = 0; i < vertices.count; i++) if (vertices.getZ(i) >= 9.39) {
        topX = Math.max(topX, Math.abs(vertices.getX(i)));
        topY = Math.max(topY, Math.abs(vertices.getY(i)));
      }
      const topRadius = Math.min(topX, topY);
      const mesh = new Mesh(body.geometry, body.material);
      for (const z of [2, 4, 5.8, 7]) {
        for (let degrees = 0; degrees < 360; degrees += 5) {
          const angle = degrees * Math.PI / 180;
          const direction = new Vector3(Math.cos(angle), Math.sin(angle), 0);
          const origin = direction.clone().multiplyScalar(200); origin.z = z;
          const hits = new Raycaster(origin, direction.negate(), 0, 400).intersectObject(mesh);
          // Every outer wall must be beyond the hollow cavity's short radius.
          if (!hits.length || Math.hypot(hits[0].point.x, hits[0].point.y) < topRadius - 0.05)
            failures.push({ key: key.id, z, degrees });
        }
      }
      if (body.material.transparent || body.material.opacity !== 1)
        failures.push({ key: key.id, material: "not opaque" });
    });
    if (checked.size < 5) failures.push({ shapes: checked.size });
    return failures;
  });
  expect(failures).toEqual([]);
});

test("monitor cabinet keeps its width at the back and captive leads follow inspection", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { loadRobotron } = await import("/src/robotron-model.js");
    const { Texture, Mesh, Raycaster, Vector3 } = await import("/node_modules/three/build/three.module.js");
    const model = await loadRobotron(new Texture());
    model.tick();
    const shell = model.objects.get("monitor-shell-upper");
    const mesh = new Mesh(shell.geometry, shell.material);
    const widths = [-80, 140].map(y => {
      const hit = new Raycaster(new Vector3(300,y,380), new Vector3(-1,0,0)).intersectObject(mesh)[0];
      return hit?.point.x * 2;
    });
    const leads = ["monitor-power-lead", "monitor-signal-lead"].map(n => model.objects.get(n));
    const originals = leads.map(m => m.geometry.attributes.position.array.slice());
    const endIndices = originals.map(a => {
      let top=0, bottom=0;
      for(let i=1;i<a.length/3;i++) {
        if(a[i*3+2]>a[top*3+2])top=i;
        if(a[i*3+2]<a[bottom*3+2])bottom=i;
      }
      return {top,bottom};
    });
    model.interior(true);model.tick();
    const shifted = leads.map((m,j) => {
      const v=m.geometry.attributes.position, a=originals[j], {top,bottom}=endIndices[j];
      return {topY:v.getY(top)-a[top*3+1], topZ:v.getZ(top)-a[top*3+2],
        bottomY:v.getY(bottom)-a[bottom*3+1], bottomZ:v.getZ(bottom)-a[bottom*3+2]};
    });
    const parked = model.objects.get("monitor-plug-bodies").position.y;
    model.interior(false);model.openMonitor(true);model.tick();
    const restored = leads.every((m,j) => m.visible && m.geometry.attributes.position.array.every((v,i)=>v===originals[j][i]));
    return {widths,shifted,parked,restored,plugRest:model.objects.get("monitor-plug-bodies").position.y};
  });
  expect(result.widths[0]).toBeCloseTo(320, 0); // Faceted rounded edges are within 0.1 mm.
  expect(result.widths[1]).toBeCloseTo(result.widths[0], 5);
  for(const end of result.shifted) {
    expect(end.topY).toBeCloseTo(400);expect(end.topZ).toBeCloseTo(180);
    expect(end.bottomY).toBeCloseTo(24);expect(end.bottomZ).toBeCloseTo(0);
  }
  expect(result.parked).toBe(24);expect(result.plugRest).toBe(0);expect(result.restored).toBe(true);
});
