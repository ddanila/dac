let module,
  handle = 0,
  kind = 2,
  running = false,
  speed = 1,
  timer,
  last = 0,
  owed = 0,
  lastFrame = 0;
function error(e) {
  if (module && handle) module._dac_power(handle, 0);
  running = false;
  clearTimeout(timer);
  postMessage({
    type: "error",
    message: e instanceof Error ? e.message : String(e),
  });
}
function copy(bytes, fn) {
  const data = new Uint8Array(bytes);
  const p = module._malloc(data.length);
  if (!p) throw Error("Not enough emulator memory");
  try {
    module.HEAPU8.set(data, p);
    const r = fn(p, data.length);
    if (r < 0)
      throw Error(`Media rejected (${r}). Check the file type and exact size.`);
  } finally {
    module._free(p);
  }
}
function frame() {
  const p = module._dac_video(handle);
  if (!p) throw Error("Invalid video output");
  const width = module._dac_width(handle),
    height = module._dac_height(handle);
  const pixels = module.HEAPU8.slice(p, p + width * height * 4);
  postMessage(
    {
      type: "frame",
      width,
      height,
      pixels: pixels.buffer,
      activity: module._dac_disk_activity(handle),
    },
    [pixels.buffer],
  );
}
function tick() {
  if (!running) return;
  try {
    const now = performance.now();
    owed += Math.min(100, now - last) * (kind === 0 ? 2000 : 3993.6) * speed;
    last = now;
    const deadline = now + 7;
    while (owed > 0 && performance.now() < deadline) {
      const used = module._dac_run(handle, Math.min(100000, Math.ceil(owed)));
      if (!used) break;
      owed -= used;
    }
    if (now - lastFrame >= 32) {
      frame();
      lastFrame = now;
    }
    timer = setTimeout(tick, 4);
  } catch (e) {
    error(e);
  }
}
self.onmessage = async ({ data: d }) => {
  try {
    if (d.type === "init") {
      const { default: create } = await import(
        /* @vite-ignore */ new URL("dac.js", d.base).href
      );
      module = await create({ locateFile: (n) => new URL(n, d.base).href });
      postMessage({ type: "ready" });
      return;
    }
    if (!module) throw Error("Emulator is not ready");
    if (d.type === "configure") {
      running = false;
      clearTimeout(timer);
      if (handle) module._dac_destroy(handle);
      kind = d.kind;
      handle = module._dac_create(kind);
      if (!handle) throw Error("Cannot create machine");
      for (const [slot, bytes] of d.firmware)
        copy(bytes, (p, n) => module._dac_load(handle, slot, p, n));
      if (d.disk)
        copy(d.disk, (p, n) =>
          module._dac_mount(handle, p, n, Number(d.writable)),
        );
      postMessage({ type: "configured", disk: !!d.disk });
      frame();
    } else if (d.type === "power") {
      if (!handle) throw Error("Choose media first");
      const r = module._dac_power(handle, Number(d.on));
      if (r < 0)
        throw Error("Boot ROM and, for Robotron, CAS PROM are required");
      running = d.on;
      clearTimeout(timer);
      owed = 0;
      last = performance.now();
      postMessage({ type: "power", on: running });
      frame();
      if (running) tick();
    } else if (d.type === "reset") {
      if (module._dac_reset(handle) < 0) throw Error("Reset failed");
      owed = 0;
      last = performance.now();
      frame();
    } else if (d.type === "key") {
      const result = module._dac_key(handle, d.key, Number(d.down));
      if (result < 0 && kind !== 1)
        throw Error("Keyboard input could not be accepted");
    } else if (d.type === "speed") speed = d.value === 4 ? 4 : 1;
    else if (d.type === "export") {
      const p = module._dac_disk_data(handle),
        n = module._dac_disk_size(handle);
      if (!n) throw Error("No disk mounted");
      const bytes = module.HEAPU8.slice(p, p + n);
      postMessage({ type: "disk", bytes: bytes.buffer }, [bytes.buffer]);
    }
  } catch (e) {
    error(e);
  }
};
