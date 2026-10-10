import "./style.css";
import { createDriveSound } from "./robotron-drives.js";
const driveSound = createDriveSound();
import { createFirmwareKeyboard, matrixKey } from "./robotron-matrix.js";
import { loadHistoricalRobotron } from "./historical-media.js";
import { createScene } from "./scene.js";
import { createRobotronKeyboard } from "./robotron-keyboard.js";
import { showInspection, showSpecimenDetail } from "./inspection.js";
const $ = (id) => document.getElementById(id),
  send = (d) => worker.postMessage(d);
const worker = new Worker(new URL("./emulator.worker.js", import.meta.url), {
  type: "module",
});
const screen = $("screen"),
  ctx = screen.getContext("2d");
let on = false,
  powerPending = false,
  ready = false,
  activity = 0,
  disk = false,
  diskB = false,
  diskBImage,
  scene,
  configuration = 0,
  previousPixels,
  firmwareKeyboard = false,
  hasState = false;
const held = new Map(),
  base = new URL(import.meta.env.BASE_URL + "emulator/", location.origin);
function fail(message) {
  $("error").textContent = message;
}
try {
  $("remember-disk").checked =
    localStorage.getItem("dac-remember-disk") !== "false";
} catch {}
const heldModelKeys = new Map();
function release() {
  held.clear();
  heldModelKeys.clear();
  keyboard.reset();
  firmwareKeys.reset();
  scene?.releaseKeys();
  if (on) send({ type: "key", key: 0, down: false });
}
function power() {
  if (!ready || $("power").disabled) return;
  release();
  powerPending = true;
  $("power").disabled = true;
  $("reset").disabled = true;
  send({ type: "power", on: !on });
}
let modelKeys = [];
const keyboard = createRobotronKeyboard({
  send,
  isPowered: () => on && !powerPending && Number($("machine").value) === 2,
  onState: (state) => {
    scene?.modifiers(state);
    for (const button of $("key-list").querySelectorAll("[data-modifier]"))
      button.setAttribute(
        "aria-pressed",
        String(state[button.dataset.modifier]),
      );
  },
  onFeedback: (message) => {
    $("key-feedback").textContent = message;
  },
});
function resetMachine() {
  if (on && !powerPending) {
    release();
    send({ type: "reset" });
  }
}
const firmwareKeys = createFirmwareKeyboard({
  send,
  isPowered: () => on && !powerPending,
  onFeedback: (message) => {
    $("key-feedback").textContent = message;
  },
  onState: (state) => {
    if (firmwareKeyboard) {
      scene?.modifiers(state);
      for (const id of heldModelKeys.values()) scene?.keyState(id, true);
    }
  },
});
function modelKey(key) {
  return (firmwareKeyboard ? firmwareKeys : keyboard).activate(key);
}
function keyButtons(keys) {
  $("open-case").disabled = false;
  $("open-monitor").disabled = false;
  $("separate-parts").disabled = false;
  $("key-list-toggle").disabled = false;
  modelKeys = keys;
  $("key-list").replaceChildren();
  for (const key of keys) {
    const button = document.createElement("button");
    button.textContent = key.label;
    button.dataset.key = key.id;
    button.setAttribute(
      "aria-label",
      key.label + (key.u >= 18 ? " · numeric or function keypad" : ""),
    );
    if (key.input.modifier) {
      button.dataset.modifier = key.input.modifier;
      button.setAttribute("aria-pressed", "false");
    }
    if (key.input.unsupported) button.title = key.input.unsupported;
    button.onclick = () => {
      if (modelKey(key)) scene?.pulse(key.id);
    };
    $("key-list").append(button);
  }
}
showInspection("overview");
try {
  scene = createScene($("viewport"), screen, power, resetMachine, {
    onKey: modelKey,
    onInspect: showSpecimenDetail,
    onKeysReady: keyButtons,
    onHover: (message) => {
      $("hover-key").textContent = message;
    },
  });
} catch (e) {
  fail("3D is unavailable on this device. The enlarged screen still works.");
  $("screen-panel").hidden = false;
}
const descriptions = {
  2: [
    "U880 / Z80",
    "1715W / 1715M · experimental",
    "A Z80-powered workspace, brought back to life. Explore an early functional reconstruction of its banked memory, keyboard and disk system.",
  ],
  0: [
    "8080",
    "Juku E5104 · functional core",
    "The Estonian classroom computer. Its extracted emulator runs the original firmware, keyboard matrix and disk controller.",
  ],
  1: [
    "Z80",
    "Rev-A · bounded boot model",
    "Juku’s Z80 relative, with adapted firmware. This first portable profile reproduces its bounded boot; keyboard and disks are not yet modeled.",
  ],
};
async function configure(demo, historical = false) {
  if (!ready) return;
  const ticket = ++configuration;
  $("power").disabled = true;
  fail("");
  on = false;
  scene?.power(false);
  $("power-label").textContent = "Power on";
  $("reset").disabled = true;
  const kind = Number($("machine").value),
    d = descriptions[kind];
  keyboard.reset();
  document.querySelector(".stage").classList.remove("typing");
  $("screen-panel").hidden = true;
  scene?.setMachine(kind);
  $("separate-parts").checked = false;
  $("open-case").checked = false;
  $("open-monitor").checked = false;
  $("viewport").dataset.interior = "false";
  $("key-list").hidden = true;
  $("key-list-toggle").textContent = "Show keyboard buttons";
  $("key-list-toggle").setAttribute("aria-expanded", "false");
  for (const element of document.querySelectorAll("[data-robotron]"))
    element.hidden = kind !== 2;
  $("key-feedback").textContent = "";
  showInspection("overview");
  scene?.view("overview");
  for (const b of document.querySelectorAll("[data-view]"))
    b.setAttribute("aria-pressed", String(b.dataset.view === "overview"));
  $("cpu").textContent = d[0];
  $("profile").textContent = d[1];
  $("description").textContent = d[2];
  $("number").textContent = kind === 2 ? "001" : kind === 0 ? "002" : "003";
  $("prom-label").hidden = $("glyph-label").hidden = kind !== 2;
  $("disk-label").hidden = kind === 1;
  let firmware = [],
    image;
  if (historical && kind === 2) {
    ({ firmware, disk: image } = await loadHistoricalRobotron(
      new URL(import.meta.env.BASE_URL, location.origin),
    ));
    $("media-label").textContent = "S550 · TOS/M 1.0";
    $("fidelity").textContent =
      "Historical S550 ROM and TOS/M 1.0 disk. Power on, open Screen, and wait for A>. Try DIR. This reference setup is not yet matched to Danila’s own ROMs or disks. Writes affect only a browser copy when enabled. S600 runs the reference keyboard; some shifted legends may differ from this specimen.";
  } else if (demo) {
    const names =
      kind === 2
        ? [
            [0, "robotron.bin"],
            [1, "cas.bin"],
            [2, "glyphs.bin"],
          ]
        : [[0, kind === 0 ? "juku.bin" : "vjuga.bin"]];
    firmware = await Promise.all(
      names.map(async ([slot, name]) => {
        const r = await fetch(new URL("demo/" + name, base));
        if (!r.ok) throw Error("Diagnostic firmware could not be loaded");
        return [slot, await r.arrayBuffer()];
      }),
    );
    $("media-label").textContent = "DAC diagnostic ROM";
    $("fidelity").textContent =
      kind === 2
        ? "Original DAC diagnostic — not historical firmware. Try typing on the enlarged screen. The exterior is reconstructed from Danila’s photographs and documented dimensions; unseen details remain approximate."
        : "Original DAC pixel diagnostic. Load your firmware to see the historical boot. The shared display case is provisional geometry.";
  } else {
    const rom = $("rom").files[0];
    if (!rom) throw Error("Select a boot ROM first.");
    firmware.push([0, await rom.arrayBuffer()]);
    if (kind === 2) {
      const p = $("prom").files[0];
      if (!p) throw Error("Robotron also needs its 256-byte CAS PROM.");
      firmware.push([1, await p.arrayBuffer()]);
      const k = $("keyboard-rom").files[0];
      if (k) firmware.push([3, await k.arrayBuffer()]);
      const g = $("glyph").files[0];
      if (g) firmware.push([2, await g.arrayBuffer()]);
    }
    const f = $("disk").files[0];
    if (f && kind !== 1) image = await f.arrayBuffer();
    $("media-label").textContent = rom.name;
    $("fidelity").textContent =
      "Your local media. Original files are untouched; export a session disk to keep changes. Hardware timing and display attributes remain under development.";
  }
  if (ticket !== configuration) return;
  send({
    type: "configure",
    kind,
    firmware,
    disk: image,
    diskB: kind === 2 ? diskBImage : undefined,
    writableB: $("writable-b").checked,
    writable: $("writable").checked,
    remember: $("remember-disk").checked,
    build: import.meta.env.VITE_EMULATOR_REVISION,
  });
}
worker.onmessage = ({ data: d }) => {
  if (d.type === "ready") {
    ready = true;
    configure(true, true).catch((e) => fail(e.message));
  }
  if (d.type === "configured") {
    disk = d.disk;
    updateDriveB(d.diskB);
    firmwareKeyboard = !!d.firmwareKeyboard;
    hasState = !!d.hasState;
    $("restore-state").disabled = !hasState;
    $("save-state").disabled = $("export-state").disabled = true;
    $("forget-disk").disabled = !disk;
    for (const button of $("key-list").querySelectorAll("[data-key]")) {
      const key = modelKeys.find((k) => k.id === button.dataset.key);
      button.title = firmwareKeyboard
        ? "Reference matrix wiring; specimen legends may differ"
        : key?.input.unsupported || "";
    }
    $("keyboard-mode").textContent = firmwareKeyboard
      ? "Keyboard firmware · reference wiring"
      : "Character adapter · no keyboard ROM loaded";
    $("power").disabled = false;
    $("status").textContent = "Powered off";
    $("export").disabled = !disk;
  }
  if (d.type === "power") {
    on = d.on;
    powerPending = false;
    $("power").disabled = false;
    if (on) $("media-controls").open = false;
    if (!on) {
      keyboard.reset();
      scene?.releaseKeys();
    }
    scene?.power(on);
    $("power-label").textContent = on ? "Power off" : "Power on";
    $("status").textContent = on ? "Running" : "Powered off";
    $("reset").disabled = !on;
    $("save-state").disabled = $("export-state").disabled = !on;
    for (const id of ["disk-b", "writable-b", "insert-b", "blank-b"])
      $(id).disabled = on;
    $("eject-b").disabled = on || !diskB;
    $("forget-disk").disabled = on || !disk;
    for (const id of [
      "load",
      "demo",
      "historical",
      "machine",
      "rom",
      "prom",
      "glyph",
      "keyboard-rom",
      "disk",
      "writable",
    ])
      $(id).disabled = on;
  }
  if (d.type === "frame") {
    if (screen.width !== d.width || screen.height !== d.height) {
      screen.width = d.width;
      screen.height = d.height;
      previousPixels = undefined;
    }
    // Firmware often leaves the framebuffer unchanged for many frames. Avoid
    // uploading the same image and redrawing the entire 3D exhibit each time.
    const pixels = new Uint32Array(d.pixels);
    let changed = !previousPixels || previousPixels.length !== pixels.length;
    if (!changed)
      for (let i = 0; i < pixels.length; i++)
        if (pixels[i] !== previousPixels[i]) {
          changed = true;
          break;
        }
    if (changed) {
      ctx.putImageData(
        new ImageData(new Uint8ClampedArray(d.pixels), d.width, d.height),
        0,
        0,
      );
      scene?.update();
    }
    previousPixels = pixels;
    if (firmwareKeyboard) {
      firmwareKeys.leds(d.keyboardLeds);
      $("keyboard-mode").textContent =
        `Keyboard firmware · Caps ${d.keyboardLeds & 2 ? "on" : "off"} · SI/SO ${d.keyboardLeds & 1 ? "on" : "off"}`;
    }
    if (Number($("machine").value) === 2) {
      const drives = d.drives || [0, 0];
      scene?.drives(drives);
      driveSound.update(drives, on);
      $("drive-state").textContent = on
        ? drives
            .map(
              (v, u) =>
                `${u ? "B" : "A"}: ${v & 8 ? (v & 1 ? "motor on" : "motor off") + " · track " + ((v >> 8) & 255) + (v & 2 ? " · transferring" : "") + (v & 4 ? " · writable" : " · protected") : "empty"}`,
            )
            .join(" / ")
        : "";
      $("printer-status").textContent = d.printerOverflow
        ? "Capture full (64 KB). Export and clear to continue."
        : `${d.printerSize || 0} bytes captured.`;
      $("printer-export").disabled = $("printer-clear").disabled =
        !d.printerSize;
    }
    const active = d.activity > activity;
    activity = d.activity;
    scene?.activity(active);
    $("disk-led").classList.toggle("active", active);
    $("disk-led").setAttribute(
      "aria-label",
      active ? "Disk transfer" : "No disk activity",
    );
  }
  if (d.type === "storage") {
    $("storage-status").textContent = d.message;
    if (d.hasState !== undefined) {
      hasState = d.hasState;
      $("restore-state").disabled = !hasState;
    }
  }
  if (d.type === "input-error") $("key-feedback").textContent = d.message;
  if (d.type === "error") {
    fail(d.message);
    on = false;
    powerPending = false;
    release();
    scene?.power(false);
    $("status").textContent = "Stopped";
    $("power-label").textContent = "Power on";
    $("power").disabled = !ready;
    for (const id of [
      "load",
      "demo",
      "historical",
      "machine",
      "rom",
      "prom",
      "glyph",
      "keyboard-rom",
      "disk",
      "writable",
    ])
      $(id).disabled = false;
    $("reset").disabled = true;
  }
  if (d.type === "mounted-b") updateDriveB(d.present);
  if (d.type === "disk" || d.type === "download") {
    const url = URL.createObjectURL(new Blob([d.bytes]));
    const a = document.createElement("a");
    a.href = url;
    a.download =
      d.name || (d.unit ? "dac-drive-b.img" : "dac-session-disk.img");
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
worker.onerror = (e) => fail(e.message || "Emulator worker failed");
$("power").onclick = power;
$("reset").onclick = resetMachine;
$("drive-sound").onchange = () =>
  driveSound.enable($("drive-sound").checked).catch((e) => fail(e.message));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) driveSound.update([], false);
});
$("turbo").onchange = () =>
  send({ type: "speed", value: $("turbo").checked ? 4 : 1 });
$("load").onclick = () =>
  configure(false).catch((e) => {
    $("power").disabled = false;
    fail(e.message);
  });
$("historical").onclick = () =>
  configure(true, true).catch((e) => fail(e.message));
$("demo").onclick = () => configure(true).catch((e) => fail(e.message));
$("machine").onchange = () => {
  release();
  diskBImage = undefined;
  for (const id of ["rom", "prom", "glyph", "keyboard-rom", "disk"])
    $(id).value = "";
  configure(true, true).catch((e) => fail(e.message));
};
$("save-state").onclick = () => {
  release();
  send({ type: "save-state" });
};
$("restore-state").onclick = () => {
  release();
  send({ type: "restore-state" });
};
$("remember-disk").onchange = () => {
  try {
    localStorage.setItem(
      "dac-remember-disk",
      String($("remember-disk").checked),
    );
  } catch {}
  send({ type: "remember", value: $("remember-disk").checked });
};
$("forget-disk").onclick = () => {
  $("remember-disk").checked = false;
  send({ type: "forget-disk" });
};
$("export").onclick = () => send({ type: "export" });
function updateDriveB(present) {
  diskB = !!present;
  $("export-b").disabled = !diskB;
  $("eject-b").disabled = on || !diskB;
  $("disk-b-status").textContent = diskB
    ? "Drive B disk inserted."
    : "Drive B is empty.";
}
async function insertB(blank = false) {
  if (on) return;
  try {
    const file = $("disk-b").files[0];
    if (!blank && !file) throw Error("Choose a drive B disk first.");
    const bytes = blank
      ? new Uint8Array(819200).fill(0xe5).buffer
      : await file.arrayBuffer();
    if (bytes.byteLength !== 819200)
      throw Error("Drive B needs an 800 KB raw image (819200 bytes).");
    diskBImage = bytes;
    send({ type: "mount-b", bytes, writable: $("writable-b").checked });
  } catch (e) {
    $("storage-status").textContent = e.message;
  }
}
$("insert-b").onclick = () => insertB();
$("blank-b").onclick = () => insertB(true);
$("eject-b").onclick = () => {
  diskBImage = undefined;
  send({ type: "mount-b" });
};
$("export-b").onclick = () => send({ type: "export", unit: 1 });
$("writable-b").onchange = () => {
  if (diskBImage)
    send({ type: "protect-b", writable: $("writable-b").checked });
};
$("printer-export").onclick = () => send({ type: "printer" });
$("printer-clear").onclick = () => send({ type: "clear-printer" });
$("export-state").onclick = () => {
  release();
  send({ type: "export-state" });
};
$("import-state").onchange = async () => {
  const file = $("import-state").files[0];
  if (!file) return;
  try {
    if (file.size > 4 * 1024 * 1024) throw Error("Snapshot exceeds 4 MB.");
    release();
    send({ type: "import-state", bytes: await file.arrayBuffer() });
  } catch (e) {
    $("storage-status").textContent = e.message;
  }
  $("import-state").value = "";
};
$("screen-view").onclick = () => {
  if (document.querySelector(".stage").classList.contains("typing")) {
    selectView("keyboard");
    release();
    return;
  }
  $("screen-panel").hidden = !$("screen-panel").hidden;
  if (!$("screen-panel").hidden) screen.focus();
  else release();
};
function updateCase() {
  const open = $("open-case").checked;
  scene?.interior(open);
  scene?.openMonitor($("open-monitor").checked);
  $("viewport").dataset.monitorInterior = String($("open-monitor").checked);
  scene?.separate($("separate-parts").checked);
  $("viewport").dataset.interior = String(open);
}
function selectView(name) {
  document
    .querySelector(".stage")
    .classList.toggle("typing", name === "typing");
  $("screen-panel").hidden = name !== "typing";
  scene?.view(name === "typing" ? "keyboard" : name);
  showInspection(name);
  for (const button of document.querySelectorAll("[data-view]"))
    button.setAttribute("aria-pressed", String(button.dataset.view === name));
  // Media controls can leave the exhibit above the viewport. A selected camera
  // view should bring its subject back into view before pointer interaction.
  document
    .querySelector(".stage")
    .scrollIntoView({ block: "nearest", behavior: "instant" });
}
for (const b of document.querySelectorAll("[data-view]"))
  b.onclick = () => {
    release();
    $("screen-panel").hidden = true;
    if (b.dataset.view === "typing") $("separate-parts").checked = false;
    if (b.dataset.view === "drive-labels") {
      $("open-case").checked = true;
      $("separate-parts").checked = true;
    }
    if (b.dataset.view === "inside") $("open-case").checked = true;
    if (b.dataset.view === "monitor-inside") $("open-monitor").checked = true;
    updateCase();
    selectView(b.dataset.view);
  };
$("open-case").onchange = () => {
  release();
  if (!$("open-case").checked) $("separate-parts").checked = false;
  updateCase();
  selectView($("open-case").checked ? "inside" : "overview");
};
$("open-monitor").onchange = () => {
  release();
  updateCase();
  selectView($("open-monitor").checked ? "monitor-inside" : "monitor");
};
$("separate-parts").onchange = () => {
  release();
  if ($("separate-parts").checked) $("open-case").checked = true;
  updateCase();
  selectView(
    $("separate-parts").checked
      ? "assembly"
      : $("open-case").checked
        ? "inside"
        : "overview",
  );
};
$("key-list-toggle").onclick = () => {
  const hidden = !$("key-list").hidden;
  $("key-list").hidden = hidden;
  $("key-list-toggle").setAttribute("aria-expanded", String(!hidden));
  $("key-list-toggle").textContent = hidden
    ? "Show keyboard buttons"
    : "Hide keyboard buttons";
};
function keyCode(e) {
  if (Number($("machine").value) === 2) {
    if (e.key === "Delete") return 0x7f;
    if (e.key === "Insert") return 0x82;
    if (/^F([1-9]|1[0-5])$/.test(e.key))
      return modelKeys.find(
        (k) => k.label === (e.key === "F15" ? "F15" : "P" + e.key),
      )?.input.code;
  }
  if (e.key === "Enter") return 13;
  if (e.key === "Backspace") return 8;
  if (e.key === "Tab") return Number($("machine").value) === 2 ? 0x80 : 9;
  if (e.key.length === 1 && e.key.charCodeAt(0) < 128)
    return e.ctrlKey
      ? e.key.toUpperCase().charCodeAt(0) & 31
      : e.key.charCodeAt(0);
  const keys =
    Number($("machine").value) === 2
      ? { ArrowUp: 0x8b, ArrowDown: 0x8a, ArrowLeft: 0x88, ArrowRight: 0x86 }
      : { ArrowUp: 0x8b, ArrowDown: 0x80, ArrowLeft: 0x8d, ArrowRight: 0x8c };
  return keys[e.key];
}
function keyDown(e) {
  if (e.key === "Escape") {
    release();
    e.currentTarget.blur();
    e.preventDefault();
    return;
  }
  if (
    firmwareKeyboard &&
    Number($("machine").value) === 2 &&
    on &&
    !powerPending
  ) {
    let modeled;
    const mods = { Shift: "shift", Control: "ctrl", CapsLock: "caps" };
    if (mods[e.key])
      modeled = (
        e.code === "ShiftRight" ? [...modelKeys].reverse() : modelKeys
      ).find((k) => k.input.modifier === mods[e.key]);
    else if (e.key === "Alt")
      modeled = modelKeys.find(
        (k) => k.id === (e.code === "AltRight" ? "key-014" : "key-013"),
      );
    else if (e.key === "Tab")
      modeled = modelKeys.find((k) => k.label === "Tab");
    else if (e.key === "Backspace")
      modeled = modelKeys.find((k) => k.label === "DEL");
    else {
      const value =
        e.key.length === 1 ? e.key.toLowerCase().charCodeAt(0) : keyCode(e);
      if (value !== undefined)
        modeled = modelKeys.find(
          (k) => k.input.code === value || k.input.shiftCode === value,
        );
    }
    const n = matrixKey(modeled);
    if (n !== undefined) {
      e.preventDefault();
      if (e.repeat || held.has(e.code)) return;
      held.set(e.code, n);
      heldModelKeys.set(e.code, modeled.id);
      // Printable case is determined by actual modifier switches in the ROM.
      send({ type: "matrix", key: n, down: true });
      scene?.keyState(modeled.id, true);
      $("key-feedback").textContent = `Sent ${modeled.label}`;
    }
    return;
  }
  if (
    Number($("machine").value) === 2 &&
    ["Shift", "Control", "CapsLock"].includes(e.key)
  ) {
    const modifier = { Shift: "shift", Control: "ctrl", CapsLock: "caps" }[
      e.key
    ];
    const modeled = modelKeys.find((k) => k.input.modifier === modifier);
    if (modeled) {
      e.preventDefault();
      heldModelKeys.set(e.code, modeled.id);
      scene?.keyState(modeled.id, true);
    }
    return;
  }
  const key = keyCode(e);
  if (
    !on ||
    powerPending ||
    key === undefined ||
    Number($("machine").value) === 1
  )
    return;
  e.preventDefault();
  if (e.repeat && Number($("machine").value) !== 2) return;
  if (Number($("machine").value) === 2) {
    const value = e.key.length === 1 ? e.key.toLowerCase().charCodeAt(0) : key;
    const modeled = modelKeys.find(
      (k) => k.input.code === value || k.input.shiftCode === value,
    );
    if (modeled) {
      keyboard.activate(modeled, {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        upper: e.key.length === 1 ? e.key === e.key.toUpperCase() : undefined,
      });
      heldModelKeys.set(e.code, modeled.id);
      for (const id of heldModelKeys.values()) scene?.keyState(id, true);
      return;
    }
  }
  held.set(e.code, key);
  const modeled = modelKeys.find(
    (k) => k.input.code === key || k.input.shiftCode === key,
  );
  if (modeled && Number($("machine").value) === 2) scene?.pulse(modeled.id);
  send({ type: "key", key, down: true });
}
function keyUp(e) {
  const id = heldModelKeys.get(e.code);
  if (id) {
    e.preventDefault();
    heldModelKeys.delete(e.code);
    const key = modelKeys.find((k) => k.id === id);
    scene?.keyState(
      id,
      [...heldModelKeys.values()].includes(id) ||
        !!keyboard.state[key?.input.modifier],
    );
  }
  const key = held.get(e.code);
  if (key === undefined) return;
  e.preventDefault();
  held.delete(e.code);
  if (on && (!firmwareKeyboard || ![...held.values()].includes(key)))
    send({ type: firmwareKeyboard ? "matrix" : "key", key, down: false });
}
screen.onkeydown = keyDown;
screen.onkeyup = keyUp;
$("viewport").onkeydown = keyDown;
$("viewport").onkeyup = keyUp;
screen.onblur = release;
$("viewport").onblur = release;
window.addEventListener("blur", release);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) release();
});
send({
  type: "init",
  base: base.href,
  build: import.meta.env.VITE_EMULATOR_REVISION,
});
