import "./style.css";
import { createScene } from "./scene.js";
const $ = (id) => document.getElementById(id),
  send = (d) => worker.postMessage(d);
const worker = new Worker(new URL("./emulator.worker.js", import.meta.url), {
  type: "module",
});
const screen = $("screen"),
  ctx = screen.getContext("2d");
let on = false,
  ready = false,
  activity = 0,
  disk = false,
  scene,
  configuration = 0;
const held = new Map(),
  base = new URL(import.meta.env.BASE_URL + "emulator/", location.origin);
function fail(message) {
  $("error").textContent = message;
}
function release() {
  held.clear();
  if (on) send({ type: "key", key: 0, down: false });
}
function power() {
  if (!ready || $("power").disabled) return;
  release();
  send({ type: "power", on: !on });
}
try {
  scene = createScene($("viewport"), screen, power);
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
async function configure(demo) {
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
  $("cpu").textContent = d[0];
  $("profile").textContent = d[1];
  $("description").textContent = d[2];
  $("number").textContent = kind === 2 ? "001" : kind === 0 ? "002" : "003";
  $("prom-label").hidden = $("glyph-label").hidden = kind !== 2;
  $("disk-label").hidden = kind === 1;
  let firmware = [],
    image;
  if (demo) {
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
        ? "Original DAC diagnostic — not historical firmware. Try typing on the enlarged screen. The emulator is real; the case is a placeholder."
        : "Original DAC pixel diagnostic. Load your firmware to see the historical boot. The shared display case is provisional geometry.";
  } else {
    const rom = $("rom").files[0];
    if (!rom) throw Error("Select a boot ROM first.");
    firmware.push([0, await rom.arrayBuffer()]);
    if (kind === 2) {
      const p = $("prom").files[0];
      if (!p) throw Error("Robotron also needs its 256-byte CAS PROM.");
      firmware.push([1, await p.arrayBuffer()]);
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
    writable: $("writable").checked,
  });
}
worker.onmessage = ({ data: d }) => {
  if (d.type === "ready") {
    ready = true;
    configure(true).catch((e) => fail(e.message));
  }
  if (d.type === "configured") {
    disk = d.disk;
    $("power").disabled = false;
    $("status").textContent = "Powered off";
    $("export").disabled = !disk;
  }
  if (d.type === "power") {
    on = d.on;
    if (on) document.querySelector("details").open = false;
    scene?.power(on);
    $("power-label").textContent = on ? "Power off" : "Power on";
    $("status").textContent = on ? "Running" : "Powered off";
    $("reset").disabled = !on;
    for (const id of [
      "load",
      "demo",
      "machine",
      "rom",
      "prom",
      "glyph",
      "disk",
      "writable",
    ])
      $(id).disabled = on;
  }
  if (d.type === "frame") {
    if (screen.width !== d.width || screen.height !== d.height) {
      screen.width = d.width;
      screen.height = d.height;
    }
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(d.pixels), d.width, d.height),
      0,
      0,
    );
    scene?.update();
    const active = d.activity !== activity;
    activity = d.activity;
    $("disk-led").classList.toggle("active", active);
    $("disk-led").setAttribute(
      "aria-label",
      active ? "Disk transfer" : "No disk activity",
    );
  }
  if (d.type === "error") {
    fail(d.message);
    on = false;
    scene?.power(false);
    $("status").textContent = "Stopped";
    $("power-label").textContent = "Power on";
    $("power").disabled = !ready;
    for (const id of [
      "load",
      "demo",
      "machine",
      "rom",
      "prom",
      "glyph",
      "disk",
      "writable",
    ])
      $(id).disabled = false;
    $("reset").disabled = true;
  }
  if (d.type === "disk") {
    const url = URL.createObjectURL(new Blob([d.bytes]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dac-session-disk.img";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};
worker.onerror = (e) => fail(e.message || "Emulator worker failed");
$("power").onclick = power;
$("reset").onclick = () => {
  release();
  send({ type: "reset" });
};
$("turbo").onchange = () =>
  send({ type: "speed", value: $("turbo").checked ? 4 : 1 });
$("load").onclick = () =>
  configure(false).catch((e) => {
    $("power").disabled = false;
    fail(e.message);
  });
$("demo").onclick = () => configure(true).catch((e) => fail(e.message));
$("machine").onchange = () => {
  release();
  for (const id of ["rom", "prom", "glyph", "disk"]) $(id).value = "";
  configure(true).catch((e) => fail(e.message));
};
$("export").onclick = () => send({ type: "export" });
$("screen-view").onclick = () => {
  $("screen-panel").hidden = !$("screen-panel").hidden;
  if (!$("screen-panel").hidden) screen.focus();
  else release();
};
for (const b of document.querySelectorAll("[data-view]"))
  b.onclick = () => {
    release();
    $("screen-panel").hidden = true;
    scene?.view(b.dataset.view);
  };
function keyCode(e) {
  if (e.key === "Enter") return 13;
  if (e.key === "Backspace") return 8;
  if (e.key === "Tab") return 9;
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
screen.onkeydown = (e) => {
  if (e.key === "Escape") {
    release();
    screen.blur();
    e.preventDefault();
    return;
  }
  const key = keyCode(e);
  if (!on || key === undefined || Number($("machine").value) === 1) return;
  e.preventDefault();
  if (e.repeat) return;
  held.set(e.code, key);
  send({ type: "key", key, down: true });
};
screen.onkeyup = (e) => {
  const key = held.get(e.code);
  if (key === undefined) return;
  e.preventDefault();
  held.delete(e.code);
  if (on) send({ type: "key", key, down: false });
};
screen.onblur = release;
window.addEventListener("blur", release);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) release();
});
send({ type: "init", base: base.href });
