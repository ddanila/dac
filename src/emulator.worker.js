import {
  sessionIdentity,
  stored,
  checkedRecord,
  saveRecord,
  digest,
  storedKeys,
  encodeSnapshot,
  decodeSnapshot,
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
let build,
  firmware,
  identities = [],
  writableUnits = [],
  identity,
  stateKey,
  remember = false,
  writable = false,
  lastSavedActivity = -1,
  lastSave = 0,
  saving = Promise.resolve(),
  persistenceFailed = false;
function diskBytes(unit = 0) {
  const p = module._dac_disk_data_unit(handle, unit),
    n = module._dac_disk_size_unit(handle, unit);
  return module.HEAPU8.slice(p, p + n).buffer;
}
function storageStatus(message, extra = {}) {
  postMessage({ type: "storage", message, ...extra });
}
function persistDisk(force = false) {
  if (
    !identity ||
    !remember ||
    !writableUnits.some(Boolean) ||
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
  const copies = [0, 1]
    .filter(
      (u) =>
        identities[u] &&
        writableUnits[u] &&
        module._dac_disk_size_unit(handle, u),
    )
    .map((u) => [diskKey(u), diskBytes(u)]);
  if (!copies.length) return saving;
  lastSave = performance.now();
  lastSavedActivity = activity;
  saving = saving
    .then(async () => {
      for (const [key, bytes] of copies) await saveRecord(key, bytes);
      storageStatus("Disk saved in this browser.");
    })
    .catch((e) => {
      persistenceFailed = true;
      storageStatus(
        "Could not save locally: " +
          e.message +
          ". Export the disks to keep changes.",
      );
    });
  return saving;
}
function diskKey(u) {
  return (u ? "disk-b:" : "disk:") + identities[u];
}
function refreshStateKey() {
  stateKey =
    "state:" +
    build +
    ":" +
    identities[0] +
    ":" +
    Number(writableUnits[0]) +
    (identities[1]
      ? ":B:" + identities[1] + ":" + Number(writableUnits[1])
      : "");
}
function snapshotBytes() {
  const n = module._dac_state_size(handle);
  if (!n) throw Error("Power on before saving a state.");
  const p = module._malloc(n);
  if (!p) throw Error("Not enough memory for a state");
  try {
    if (module._dac_state_save(handle, p, n) < 0)
      throw Error("State save failed");
    return module.HEAPU8.slice(p, p + n).buffer;
  } finally {
    module._free(p);
  }
}
function restore(bytes) {
  copy(bytes, (p, n) => module._dac_state_load(handle, p, n));
  running = true;
  clearTimeout(timer);
  owed = 0;
  last = performance.now();
  postMessage({ type: "power", on: true });
  frame();
  tick();
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
      drives: [0, 1].map((u) => module._dac_drive_status_unit(handle, u)),
      printerSize: module._dac_printer_size(handle),
      printerOverflow: module._dac_printer_overflow(handle),
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
      build = d.build;
      firmware = d.firmware;
      identity = await sessionIdentity(d.kind, d.firmware, d.disk);
      identities = [
        identity,
        d.diskB ? await sessionIdentity(d.kind, firmware, d.diskB) : null,
      ];
      writableUnits = [!!d.writable, !!d.writableB];
      refreshStateKey();
      remember = !!d.remember;
      writable = !!d.writable;
      persistenceFailed = false;
      lastSavedActivity = -1;
      let image = d.disk,
        imageB = d.diskB,
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
        if (remember && imageB) {
          const saved = await checkedRecord(diskKey(1));
          if (saved) {
            if (saved.bytes.byteLength !== imageB.byteLength)
              throw Error("Saved drive B disk size differs");
            imageB = saved.bytes;
            resumedDisk = true;
          }
        }
        hasState = !!(await stored(stateKey));
        storageStatus(
          resumedDisk
            ? "Using the disk saved in this browser."
            : !hasState &&
                (await storedKeys()).some(
                  (k) =>
                    k.startsWith("state:") && k.includes(":" + identity + ":"),
                )
              ? "An older state exists for different media settings or an emulator build. Saved disks remain available."
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
      if (imageB)
        copy(imageB, (p, n) =>
          module._dac_mount_unit(handle, 1, p, n, Number(d.writableB)),
        );
      postMessage({
        type: "configured",
        diskB: !!imageB,
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
      for (const u of [0, 1]) if (identities[u]) await stored(diskKey(u), null);
      remember = false;
      storageStatus(
        "Saved disk discarded. Reload original media to start fresh.",
      );
    } else if (d.type === "save-state") {
      await saveRecord(stateKey, snapshotBytes());
      storageStatus("Machine state saved in this browser.", { hasState: true });
    } else if (d.type === "restore-state") {
      const record = await checkedRecord(stateKey);
      if (!record) {
        storageStatus(
          "No compatible saved state for this media and emulator version.",
        );
        return;
      }
      restore(record.bytes);
      await persistDisk(true);
      storageStatus("Saved machine state restored.", { hasState: true });
    } else if (d.type === "export-state") {
      const bytes = await encodeSnapshot(stateKey, snapshotBytes());
      postMessage({ type: "download", name: "dac-machine.dacstate", bytes }, [
        bytes,
      ]);
    } else if (d.type === "import-state") {
      const bytes = await decodeSnapshot(d.bytes, stateKey);
      restore(bytes);
      await persistDisk(true);
      storageStatus("Imported machine state restored.");
    } else if (d.type === "mount-b") {
      if (kind !== 2 || running)
        throw Error("Power off before changing drive B media.");
      await persistDisk(true);
      const bytes = d.bytes;
      if (bytes)
        copy(bytes, (p, n) =>
          module._dac_mount_unit(handle, 1, p, n, Number(d.writable)),
        );
      else if (module._dac_mount_unit(handle, 1, 0, 0, 0) < 0)
        throw Error("Eject failed");
      identities[1] = bytes
        ? await sessionIdentity(kind, firmware, bytes)
        : null;
      writableUnits[1] = !!d.writable;
      refreshStateKey();
      if (remember && bytes) {
        const saved = await checkedRecord(diskKey(1));
        if (saved && saved.bytes.byteLength === bytes.byteLength)
          copy(saved.bytes, (p, n) =>
            module._dac_mount_unit(handle, 1, p, n, Number(d.writable)),
          );
      }
      postMessage({ type: "mounted-b", present: !!bytes });
      storageStatus(
        bytes ? "Drive B disk inserted." : "Drive B disk ejected.",
        { hasState: !!(await stored(stateKey)) },
      );
      frame();
    } else if (d.type === "protect-b") {
      if (running || kind !== 2)
        throw Error("Power off before changing write protection.");
      await persistDisk(true);
      const bytes = diskBytes(1);
      if (!bytes.byteLength) return;
      copy(bytes, (p, n) =>
        module._dac_mount_unit(handle, 1, p, n, Number(d.writable)),
      );
      writableUnits[1] = !!d.writable;
      refreshStateKey();
      storageStatus(
        d.writable ? "Drive B is writable." : "Drive B is write protected.",
        { hasState: !!(await stored(stateKey)) },
      );
    } else if (d.type === "printer") {
      const p = module._dac_printer_data(handle),
        n = module._dac_printer_size(handle);
      const bytes = module.HEAPU8.slice(p, p + n).buffer;
      postMessage({ type: "download", name: "dac-printer.prn", bytes }, [
        bytes,
      ]);
    } else if (d.type === "clear-printer") {
      module._dac_printer_clear(handle);
      frame();
    } else if (d.type === "speed") speed = d.value === 4 ? 4 : 1;
    else if (d.type === "export") {
      const u = d.unit || 0;
      const p = module._dac_disk_data_unit(handle, u),
        n = module._dac_disk_size_unit(handle, u);
      if (!n) throw Error("No disk mounted");
      const bytes = module.HEAPU8.slice(p, p + n);
      postMessage({ type: "disk", unit: u, bytes: bytes.buffer }, [
        bytes.buffer,
      ]);
    }
  } catch (e) {
    if (
      [
        "save-state",
        "restore-state",
        "forget-disk",
        "remember",
        "import-state",
        "export-state",
        "mount-b",
        "protect-b",
        "printer",
      ].includes(d.type)
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
