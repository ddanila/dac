import {
  sessionIdentity,
  stored,
  checkedRecord,
  saveRecord,
} from "./session-store.js";
let module,
  handle = 0,
  kind = 2,
  running = false,
  speed = 1,
  timer,
  last = 0,
  owed = 0,
  lastFrame = 0;
let identity,
  stateKey,
  remember = false,
  writable = false,
  lastSavedActivity = -1,
  lastSave = 0,
  saving = Promise.resolve(),
  persistenceFailed = false;
function diskBytes() {
  const p = module._dac_disk_data(handle),
    n = module._dac_disk_size(handle);
  return module.HEAPU8.slice(p, p + n).buffer;
}
function storageStatus(message, extra = {}) {
  postMessage({ type: "storage", message, ...extra });
}
function persistDisk(force = false) {
  if (
    !identity ||
    !remember ||
    !writable ||
    !module._dac_disk_size(handle) ||
    persistenceFailed
  )
    return saving;
  const activity = module._dac_disk_activity(handle);
  if (
    !force &&
    (performance.now() - lastSave < 1000 ||
      (kind === 2 && activity === lastSavedActivity))
  )
    return saving;
  const key = "disk:" + identity,
    bytes = diskBytes();
  lastSave = performance.now();
  lastSavedActivity = activity;
  saving = saving
    .then(() => saveRecord(key, bytes))
    .then(() => storageStatus("Disk saved in this browser."))
    .catch((e) => {
      persistenceFailed = true;
      storageStatus(
        "Could not save locally: " +
          e.message +
          ". Export the disk to keep changes.",
      );
    });
  return saving;
}
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
      keyboardLeds: module._dac_keyboard_leds(handle),
      drive: module._dac_drive_status(handle),
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
      persistDisk();
    }
    timer = setTimeout(tick, 4);
  } catch (e) {
    error(e);
  }
}
async function receive(d) {
  try {
    if (d.type === "init") {
      const { default: create } = await import(
        /* @vite-ignore */ new URL("dac.js?v=" + d.build, d.base).href
      );
      module = await create({
        locateFile: (n) => new URL(n + "?v=" + d.build, d.base).href,
      });
      postMessage({ type: "ready" });
      return;
    }
    if (!module) throw Error("Emulator is not ready");
    if (d.type === "configure") {
      running = false;
      clearTimeout(timer);
      await persistDisk(true);
      if (handle) module._dac_destroy(handle);
      identity = await sessionIdentity(d.kind, d.firmware, d.disk);
      stateKey = "state:" + d.build + ":" + identity + ":" + Number(d.writable);
      remember = !!d.remember;
      writable = !!d.writable;
      persistenceFailed = false;
      lastSavedActivity = -1;
      let image = d.disk,
        resumedDisk = false,
        hasState = false;
      try {
        if (remember && image) {
          const saved = await checkedRecord("disk:" + identity);
          if (saved) {
            if (saved.bytes.byteLength !== image.byteLength)
              throw Error("Saved disk size differs");
            image = saved.bytes;
            resumedDisk = true;
          }
        }
        hasState = !!(await stored(stateKey));
        storageStatus(
          resumedDisk
            ? "Using the disk saved in this browser."
            : "No saved disk loaded.",
          { hasState },
        );
      } catch (e) {
        persistenceFailed = true;
        storageStatus(e.message, { hasState: false });
      }

      kind = d.kind;
      handle = module._dac_create(kind);
      if (!handle) throw Error("Cannot create machine");
      for (const [slot, bytes] of d.firmware)
        copy(bytes, (p, n) => module._dac_load(handle, slot, p, n));
      if (image)
        copy(image, (p, n) =>
          module._dac_mount(handle, p, n, Number(d.writable)),
        );
      postMessage({
        type: "configured",
        disk: !!image,
        firmwareKeyboard: d.firmware.some(([slot]) => slot === 3),
        hasState,
      });
      frame();
    } else if (d.type === "power") {
      if (!handle) throw Error("Choose media first");
      if (!d.on) {
        running = false;
        clearTimeout(timer);
        await persistDisk(true);
      }
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
    } else if (d.type === "matrix" || d.type === "tap") {
      const result =
        d.type === "matrix"
          ? module._dac_matrix(handle, d.key, Number(d.down))
          : module._dac_tap(handle, d.key, d.modifiers || 0);
      if (result < 0)
        postMessage({
          type: "input-error",
          message: "Keyboard queue full or unavailable; try again.",
        });
    } else if (d.type === "remember") {
      remember = !!d.value;
      persistenceFailed = false;
      if (remember) await persistDisk(true);
    } else if (d.type === "forget-disk") {
      await saving;
      await stored("disk:" + identity, null);
      remember = false;
      storageStatus(
        "Saved disk discarded. Reload original media to start fresh.",
      );
    } else if (d.type === "save-state") {
      const n = module._dac_state_size(handle);
      if (!n) {
        storageStatus("Power on the Robotron before saving a state.");
        return;
      }
      const p = module._malloc(n);
      if (!p) throw Error("Not enough memory for a state");
      try {
        if (module._dac_state_save(handle, p, n) < 0)
          throw Error("State save failed");
        const bytes = module.HEAPU8.slice(p, p + n).buffer;
        await saveRecord(stateKey, bytes);
        storageStatus("Machine state saved in this browser.", {
          hasState: true,
        });
      } finally {
        module._free(p);
      }
    } else if (d.type === "restore-state") {
      const record = await checkedRecord(stateKey);
      if (!record) {
        storageStatus(
          "No compatible saved state for this media and emulator version.",
        );
        return;
      }
      copy(record.bytes, (p, n) => module._dac_state_load(handle, p, n));
      running = true;
      clearTimeout(timer);
      owed = 0;
      last = performance.now();
      postMessage({ type: "power", on: true });
      frame();
      tick();
      await persistDisk(true);
      storageStatus("Saved machine state restored.", { hasState: true });
    } else if (d.type === "speed") speed = d.value === 4 ? 4 : 1;
    else if (d.type === "export") {
      const p = module._dac_disk_data(handle),
        n = module._dac_disk_size(handle);
      if (!n) throw Error("No disk mounted");
      const bytes = module.HEAPU8.slice(p, p + n);
      postMessage({ type: "disk", bytes: bytes.buffer }, [bytes.buffer]);
    }
  } catch (e) {
    if (
      ["save-state", "restore-state", "forget-disk", "remember"].includes(
        d.type,
      )
    )
      storageStatus(e.message);
    else error(e);
  }
}
// Serialize async media/storage commands so a late load cannot replace a new session.
let messages = Promise.resolve();
self.onmessage = ({ data }) => {
  messages = messages.then(() => receive(data)).catch(error);
};
