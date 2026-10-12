import { archivedCore, hasArchivedCore } from "./archived-core.js";
let currentModule, coreBase;
import {
  RECORD_LIMIT,
  base64,
  unbase64,
  encodeRecording,
  decodeRecording,
  playEvent,
  outputHashes,
} from "./recording.js";
let recording = null,
  replaying = false,
  replayCancelled = false;
function recordEvent(e) {
  if (!recording) return;
  if (recording.events.length >= RECORD_LIMIT) {
    // Stop at an exact core boundary; the visitor can export the bounded log.
    running = false;
    clearTimeout(timer);
    postMessage({
      type: "record-status",
      message: "Recording limit reached. Stop and export to keep it.",
    });
    return;
  }
  recording.events.push(e);
}
function recordMedia(unit) {
  if (!recording) return;
  const bytes = diskBytes(unit);
  recording.media.push({
    bytes: bytes.byteLength ? base64(bytes) : null,
    writable: !!writableUnits[unit],
  });
  recordEvent([7, unit, recording.media.length - 1]);
}
async function finishRecording() {
  if (!recording) throw Error("No recording to export.");
  const resume = !!module._dac_state_size(handle);
  running = false;
  clearTimeout(timer);
  stopPaste();
  const record = recording;
  recording = null;
  record.result = await outputHashes(module, handle);
  const bytes = await encodeRecording(record);
  postMessage({ type: "download", name: "dac-session.dacrecord", bytes }, [
    bytes,
  ]);
  postMessage({
    type: "record-status",
    message: resume
      ? "Recording exported. Machine continues running."
      : "Recording exported. Machine remains powered off.",
  });
  running = resume;
  owed = 0;
  last = performance.now();
  if (running && !hidden) tick();
}
async function replayRecording(bytes) {
  const record = await decodeRecording(bytes);
  const next = module._dac_create(record.kind);
  if (!next) throw Error("Cannot create replay machine.");
  replaying = true;
  postMessage({ type: "replay", active: true });
  replayCancelled = false;
  const wasRunning = running;
  clearTimeout(timer);
  stopPaste();
  try {
    for (const [slot, data] of record.firmware)
      copy(unbase64(data), (p, n) => module._dac_load(next, slot, p, n));
    for (let u = 0; u < 2; u++)
      if (record.disks[u])
        copy(unbase64(record.disks[u]), (p, n) =>
          module._dac_mount_unit(next, u, p, n, Number(record.writable[u])),
        );
    if (module._dac_power(next, 1) < 0)
      throw Error("Recording firmware rejected.");
    for (let i = 0; i < record.events.length;) {
      if (replayCancelled)
        throw Error("Replay cancelled; current machine preserved.");
      const until = performance.now() + 7;
      do {
        playEvent(module, next, record.events[i++], record.media);
      } while (i < record.events.length && performance.now() < until);
      postMessage({
        type: "record-status",
        message: `Replaying ${i}/${record.events.length}`,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const result = await outputHashes(module, next);
    if (result.some((hash, i) => hash !== record.result[i]))
      throw Error(
        "Replay differs from the recorded display, disks or printer. Current machine preserved.",
      );
    // Replay is an isolated verification, never an implicit replacement of the visitor's work.
    postMessage({
      type: "record-status",
      message: "Replay verified: display, both disks and printer match.",
    });
  } finally {
    module._dac_destroy(next);
    replaying = false;
    postMessage({ type: "replay", active: false });
    running = wasRunning;
    owed = 0;
    last = performance.now();
    if (running && !hidden) tick();
  }
}
import { InputSequence, pasteText, clockDebt } from "./input-sequence.js";
import keyMap from "./s600-paste.json";
import {
  diskLibrary,
  libraryDisk,
  saveLibraryDisk,
  updateLibraryDisk,
} from "./disk-library.js";
let paste,
  hidden = false,
  keyboardFirmware = false,
  referenceKeyboard = false;
let mountKey,
  mounts = [],
  libraries = [];
async function publishLibrary() {
  postMessage({
    type: "library",
    entries: (await diskLibrary()).filter((e) => e.kind === kind),
  });
}
async function saveMounts() {
  if (remember) await stored(mountKey, mounts);
}
function stopPaste(message = "Typing cancelled.") {
  if (!paste) return;
  paste = null;
  applyInput({ type: "key", key: 0, down: false });
  postMessage({ type: "paste-status", message });
}
function applyInput(d) {
  const result =
    d.type === "tap"
      ? module._dac_tap(handle, d.key, d.modifiers || 0)
      : d.type === "matrix"
        ? module._dac_matrix(handle, d.key, Number(d.down))
        : module._dac_key(handle, d.key, Number(d.down));
  if (result < 0) throw Error("Keyboard input unavailable or queue full.");
  recordEvent([
    d.type === "tap" ? 3 : d.type === "matrix" ? 2 : 1,
    d.key,
    d.type === "tap" ? d.modifiers || 0 : Number(d.down),
  ]);
}
import {
  sessionIdentity,
  stored,
  checkedRecord,
  saveRecord,
  digest,
  storedKeys,
  encodeSnapshot,
  decodeSnapshot,
  snapshotHeader,
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
    .map((u) => [diskKey(u), diskBytes(u), libraries[u]]);
  if (!copies.length) return saving;
  lastSave = performance.now();
  lastSavedActivity = activity;
  saving = saving
    .then(async () => {
      for (const [key, bytes, library] of copies) {
        await saveRecord(key, bytes);
        if (library) await updateLibraryDisk(library, bytes);
      }
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
  stopPaste();
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
      driveMechanics: module._dac_drive_phase_unit
        ? [0, 1].map((u) => ({
            phase: module._dac_drive_phase_unit(handle, u) / 798720,
            steps: module._dac_drive_steps_unit(handle, u),
            detail: module._dac_drive_detail_unit(handle, u),
          }))
        : null,
      printerSize: module._dac_printer_size(handle),
      printerOverflow: module._dac_printer_overflow(handle),
    },
    [pixels.buffer],
  );
}
function tick() {
  if (!running || hidden || replaying) return;
  try {
    const now = performance.now();
    owed = clockDebt(last, now, owed, kind === 0 ? 2000000 : 3993600, speed);
    last = now;
    const deadline = now + 7;
    while (running && owed > 0 && performance.now() < deadline) {
      if (recording && recording.events.length >= RECORD_LIMIT - 3) {
        awaitLimit();
        break;
      }
      const budget = Math.min(paste ? 10000 : 100000, Math.ceil(owed));
      const used = module._dac_run(handle, budget);
      recordEvent([0, budget]);
      if (!used) break;
      owed -= used;
      if (paste) {
        paste.advance(used, applyInput);
        postMessage({
          type: "paste-status",
          message: paste.done
            ? "Typing complete."
            : `Typing ${paste.index}/${paste.events.length}`,
        });
        if (paste.done) paste = null;
      }
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
function awaitLimit() {
  running = false;
  stopPaste();
  postMessage({
    type: "record-status",
    message: "Recording limit reached. Stop and export to keep it.",
  });
}
async function compatibleStateKey() {
  if (await stored(stateKey)) return stateKey;
  return (await storedKeys()).find(
    (key) =>
      typeof key === "string" &&
      key.startsWith("state:") &&
      key.slice(71) === stateKey.slice(71) &&
      hasArchivedCore(key.split(":")[1]),
  );
}
async function importState(file) {
  const { header } = snapshotHeader(file);
  const version = header.key.split(":")[1];
  const expected = stateKey.replace(
    /^state:[a-f0-9]{64}:/,
    "state:" + version + ":",
  );
  const bytes = await decodeSnapshot(file, expected);
  if (version !== build) {
    const older = await archivedCore(version, coreBase);
    const next = older._dac_create(kind);
    if (!next) throw Error("Cannot create preserved machine.");
    function load(data, fn) {
      const p = older._malloc(data.byteLength);
      if (!p) throw Error("Not enough memory for preserved state.");
      try {
        older.HEAPU8.set(new Uint8Array(data), p);
        if (fn(p, data.byteLength) < 0)
          throw Error("Preserved state or media rejected.");
      } finally {
        older._free(p);
      }
    }
    try {
      for (const [slot, data] of firmware)
        load(data, (p, n) => older._dac_load(next, slot, p, n));
      for (let u = 0; u < 2; u++)
        if (module._dac_disk_size_unit(handle, u))
          load(diskBytes(u), (p, n) =>
            older._dac_mount_unit(next, u, p, n, Number(writableUnits[u])),
          );
      load(bytes, (p, n) => older._dac_state_load(next, p, n));
    } catch (e) {
      older._dac_destroy(next);
      throw e;
    }
    clearTimeout(timer);
    stopPaste();
    module._dac_destroy(handle);
    module = older;
    handle = next;
    build = version;
    stateKey = expected;
  }
  restore(bytes);
  await persistDisk(true);
  storageStatus("Imported machine state restored.");
  postMessage({ type: "runtime", preserved: module !== currentModule });
}
async function receive(d) {
  try {
    if (
      recording &&
      recording.events.length >= RECORD_LIMIT - 3 &&
      !["record-stop", "visibility"].includes(d.type)
    )
      throw Error("Recording limit reached; stop and export it first.");
    if (
      recording &&
      ["mount-b", "protect-b", "library-mount", "library-reset"].includes(
        d.type,
      ) &&
      recording.media.length >= 8
    )
      throw Error(
        "Recording holds eight media changes; stop and export before inserting another disk.",
      );
    if (
      recording &&
      ["configure", "restore-state", "import-state", "record-replay"].includes(
        d.type,
      )
    )
      throw Error(
        "Stop and export the recording before changing media or restoring state.",
      );
    if (d.type === "init") {
      const { default: create } = await import(
        /* @vite-ignore */ new URL("dac.js?v=" + d.build, d.base).href
      );
      module = await create({
        locateFile: (n) => new URL(n + "?v=" + d.build, d.base).href,
      });
      currentModule = module;
      coreBase = d.base;
      postMessage({ type: "ready" });
      return;
    }
    if (!module) throw Error("Emulator is not ready");
    if (d.type === "configure") {
      stopPaste();
      running = false;
      clearTimeout(timer);
      await persistDisk(true);
      if (handle) module._dac_destroy(handle);
      module = currentModule;
      build = d.build;
      firmware = d.firmware;
      kind = d.kind;
      identity = await sessionIdentity(d.kind, d.firmware, d.disk);
      keyboardFirmware = firmware.some(([slot]) => slot === 3);
      const keyboard = firmware.find(([slot]) => slot === 3);
      referenceKeyboard =
        keyboard &&
        (await digest(keyboard[1])) ===
          "4b54891c02a8ec279e2b8aec03489a961fc8647e08ad2036dcf82d0634bf7273";
      mountKey = "mounts:" + identity;
      mounts = d.remember ? (await stored(mountKey)) || [] : [];
      libraries = [];
      for (const u of [0, 1]) {
        const entry = mounts[u];
        if (!entry) continue;
        if (
          !(entry.bytes instanceof ArrayBuffer) ||
          (await digest(entry.bytes)) !== entry.sha256
        )
          throw Error("Remembered disk failed its integrity check.");
        if (entry.library) await libraryDisk(entry.library);
        libraries[u] = entry.library;
        if (u) {
          d.diskB = entry.bytes;
          d.writableB = entry.writable;
        } else {
          d.disk = entry.bytes;
          d.writable = entry.writable;
        }
      }
      identities = [
        await sessionIdentity(kind, firmware, d.disk),
        d.diskB ? await sessionIdentity(d.kind, firmware, d.diskB) : null,
      ];
      identities = identities.map((id, u) =>
        libraries[u] ? id + ":" + libraries[u] : id,
      );
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
          const saved = await checkedRecord(diskKey(0));
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
        hasState = !!(await compatibleStateKey());
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
        writableB: writableUnits[1],
        writableA: writableUnits[0],
        disk: !!image,
        firmwareKeyboard: d.firmware.some(([slot]) => slot === 3),
        hasState,
      });
      await publishLibrary();
      frame();
    } else if (d.type === "power") {
      if (!handle) throw Error("Choose media first");
      stopPaste();
      if (!d.on) {
        running = false;
        clearTimeout(timer);
        await persistDisk(true);
      }
      const r = module._dac_power(handle, Number(d.on));
      if (r < 0)
        throw Error("Boot ROM and, for Robotron, CAS PROM are required");
      recordEvent([d.on ? 6 : 5]);
      running = d.on;
      clearTimeout(timer);
      owed = 0;
      last = performance.now();
      postMessage({ type: "power", on: running });
      frame();
      if (running) tick();
    } else if (d.type === "reset") {
      stopPaste();
      if (module._dac_reset(handle) < 0) throw Error("Reset failed");
      recordEvent([4]);
      owed = 0;
      last = performance.now();
      frame();
    } else if (["key", "matrix", "tap"].includes(d.type)) {
      if (paste) stopPaste();
      if (running && kind !== 1) applyInput(d);
    } else if (d.type === "record-start") {
      if (recording) throw Error("A recording is already active.");
      if (!running) throw Error("Power on before recording.");
      stopPaste();
      recording = {
        kind,
        build,
        firmware: firmware.map(([slot, bytes]) => [slot, base64(bytes)]),
        disks: [0, 1].map((u) =>
          module._dac_disk_size_unit(handle, u) ? base64(diskBytes(u)) : null,
        ),
        writable: writableUnits.map(Boolean),
        media: [],
        events: [],
      };
      if (module._dac_reset(handle) < 0) {
        recording = null;
        throw Error("Recording reset failed.");
      }
      owed = 0;
      last = performance.now();
      postMessage({
        type: "record-status",
        message:
          "Recording from restart. Keyboard, timing, media, reset and power events are captured.",
      });
    } else if (d.type === "record-stop") await finishRecording();
    else if (d.type === "record-replay") await replayRecording(d.bytes);
    else if (d.type === "paste") {
      if (!running) throw Error("Power on before typing text.");
      if (keyboardFirmware && !referenceKeyboard)
        throw Error("Paste needs the reference S600 keyboard ROM.");
      if (keyboardFirmware && module._dac_keyboard_leds(handle) & 1)
        throw Error("Turn SI/SO off before pasting ASCII text.");
      const events = pasteText(
        d.text,
        kind,
        keyboardFirmware,
        keyMap,
        !!(module._dac_keyboard_leds(handle) & 2),
      );
      stopPaste();
      paste = new InputSequence(events, kind === 0 ? 2000000 : 3993600);
    } else if (d.type === "cancel-paste") stopPaste();
    else if (d.type === "visibility") {
      hidden = !!d.hidden;
      clearTimeout(timer);
      owed = 0;
      last = performance.now();
      if (hidden) {
        stopPaste();
        await persistDisk(true);
      } else if (running) tick();
    } else if (d.type === "remember") {
      remember = !!d.value;
      persistenceFailed = false;
      if (remember) {
        await saveMounts();
        await persistDisk(true);
      } else await stored(mountKey, null);
    } else if (d.type === "forget-disk") {
      await saving;
      for (const u of [0, 1]) if (identities[u]) await stored(diskKey(u), null);
      await stored(mountKey, null);
      remember = false;
      storageStatus(
        "Saved disk discarded. Reload original media to start fresh.",
      );
    } else if (d.type === "save-state") {
      await saveRecord(stateKey, snapshotBytes());
      storageStatus("Machine state saved in this browser.", { hasState: true });
    } else if (d.type === "restore-state") {
      const savedKey = await compatibleStateKey();
      const record = savedKey && (await checkedRecord(savedKey));
      if (!record) {
        storageStatus(
          "No compatible saved state for this media and emulator version.",
        );
        return;
      }
      await importState(await encodeSnapshot(savedKey, record.bytes));
      storageStatus("Saved machine state restored.", { hasState: true });
    } else if (d.type === "export-state") {
      const bytes = await encodeSnapshot(stateKey, snapshotBytes());
      postMessage({ type: "download", name: "dac-machine.dacstate", bytes }, [
        bytes,
      ]);
    } else if (d.type === "import-state") {
      await importState(d.bytes);
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
      libraries[1] = null;
      mounts[1] = bytes
        ? { bytes, sha256: await digest(bytes), writable: !!d.writable }
        : null;
      await saveMounts();
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
      recordMedia(1);
      postMessage({ type: "mounted-b", present: !!bytes });
      storageStatus(
        bytes ? "Drive B disk inserted." : "Drive B disk ejected.",
        { hasState: !!(await compatibleStateKey()) },
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
      recordMedia(1);
      if (mounts[1]) mounts[1].writable = !!d.writable;
      await saveMounts();
      refreshStateKey();
      storageStatus(
        d.writable ? "Drive B is writable." : "Drive B is write protected.",
        { hasState: !!(await compatibleStateKey()) },
      );
    } else if (d.type === "library-save") {
      await persistDisk(true);
      const bytes = diskBytes(d.unit);
      if (!bytes.byteLength) throw Error("No disk in that drive.");
      await saveLibraryDisk(d.name, kind, bytes);
      await publishLibrary();
      storageStatus("Named disk copy saved.");
    } else if (d.type.startsWith("library-")) {
      if (["library-mount", "library-reset"].includes(d.type) && running)
        throw Error("Power off before inserting or resetting a library disk.");
      await persistDisk(true);
      const record = await libraryDisk(d.id);
      if (record.kind !== kind) throw Error("Choose a disk for this machine.");
      if (d.type === "library-duplicate") {
        await saveLibraryDisk(d.name, kind, record.bytes);
        storageStatus("Independent disk copy created.");
      } else if (d.type === "library-export") {
        const bytes = record.bytes;
        postMessage(
          {
            type: "download",
            name: record.name.replace(/[^a-z0-9_.-]/gi, "_") + ".img",
            bytes,
          },
          [bytes],
        );
      } else {
        if (d.type === "library-reset") {
          await updateLibraryDisk(d.id, record.original);
          record.bytes = record.original;
          for (let u = 0; u < 2; u++)
            if (libraries[u] === d.id) {
              copy(record.bytes, (p, n) =>
                module._dac_mount_unit(
                  handle,
                  u,
                  p,
                  n,
                  Number(writableUnits[u]),
                ),
              );
              recordMedia(u);
              await saveRecord(diskKey(u), record.bytes);
            }
          storageStatus("Library disk reset to its original contents.");
        } else {
          const u = d.unit;
          if (u > (kind === 2 ? 1 : 0) || kind === 1)
            throw Error("That drive is unavailable.");
          if (libraries[1 - u] === d.id)
            throw Error(
              "Duplicate this disk before inserting it in both drives.",
            );
          copy(record.bytes, (p, n) =>
            module._dac_mount_unit(
              handle,
              u,
              p,
              n,
              Number(writableUnits[u] || false),
            ),
          );
          libraries[u] = d.id;
          identities[u] =
            (await sessionIdentity(kind, firmware, record.original)) +
            ":" +
            d.id;
          mounts[u] = {
            bytes: record.original,
            sha256: record.originalHash,
            library: d.id,
            writable: !!writableUnits[u],
          };
          recordMedia(u);
          await saveRecord(diskKey(u), record.bytes);
          await saveMounts();
          refreshStateKey();
          if (u) postMessage({ type: "mounted-b", present: true });
          else postMessage({ type: "mounted-a" });
          storageStatus("Library disk inserted.", {
            hasState: !!(await compatibleStateKey()),
          });
        }
      }
      await publishLibrary();
      frame();
    } else if (d.type === "printer") {
      const p = module._dac_printer_data(handle),
        n = module._dac_printer_size(handle);
      const bytes = module.HEAPU8.slice(p, p + n).buffer;
      postMessage({ type: "download", name: "dac-printer.prn", bytes }, [
        bytes,
      ]);
    } else if (d.type === "clear-printer") {
      module._dac_printer_clear(handle);
      recordEvent([8]);
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
    if (d.type.startsWith("record-") || recording) {
      postMessage({ type: "record-status", message: e.message });
      return;
    }
    if (d.type === "paste") {
      postMessage({ type: "paste-status", message: e.message });
      return;
    }
    if (
      d.type.startsWith("library-") ||
      d.type === "paste" ||
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
  if (data.type === "record-cancel") {
    replayCancelled = true;
    return;
  }
  if (replaying && data.type === "visibility") {
    hidden = !!data.hidden;
    return;
  }
  if (replaying) {
    postMessage({
      type: "record-status",
      message:
        "Replay in progress; cancel it before using the current machine.",
    });
    return;
  }
  messages = messages.then(() => receive(data)).catch(error);
};
