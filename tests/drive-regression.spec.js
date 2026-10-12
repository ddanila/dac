import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import create from "../public/emulator/dac.js";

// Independent CP/M directory decoding for the bundled SCP3 disk layout.
function fileContents(bytes, name) {
  const b = Buffer.from(bytes),
    base = 4 * 5 * 1024,
    extents = [];
  for (let i = 0; i < 128; i++) {
    const e = b.subarray(base + i * 32, base + (i + 1) * 32);
    if (
      e[0] !== 0 ||
      Buffer.from(e.subarray(1, 12).map((v) => v & 127)).toString() !== name
    )
      continue;
    const blocks = [];
    for (let j = 16; j < 32; j += 2) {
      const n = e.readUInt16LE(j);
      if (n) blocks.push(b.subarray(base + n * 2048, base + (n + 1) * 2048));
    }
    extents.push([
      (e[14] & 63) * 32 + (e[12] & 31),
      Buffer.concat(blocks).subarray(0, e[15] * 128),
    ]);
  }
  return Buffer.concat(extents.sort((a, b) => a[0] - b[0]).map((e) => e[1]));
}
test("TOS/M write resumes from a mid-transfer snapshot with identical controller timing and media", async () => {
  test.setTimeout(90000);
  const w = await create({
    wasmBinary: await readFile(
      new URL("../public/emulator/dac.wasm", import.meta.url),
    ),
  });
  const s = w._dac_create(2);
  const bytes = async (name, fn) => {
    const b = await readFile(
      new URL(`../public/media/robotron/${name}`, import.meta.url),
    );
    const p = w._malloc(b.length);
    try {
      w.HEAPU8.set(b, p);
      expect(fn(p, b.length)).toBe(0);
    } finally {
      w._free(p);
    }
  };
  const run = (n) => {
    while (n) {
      const k = Math.min(n, 100000);
      expect(w._dac_run(s, k)).toBe(k);
      n -= k;
    }
  };
  const sample = () => [
    w._dac_drive_phase_unit(s, 0),
    w._dac_drive_position_unit(s, 0),
    w._dac_drive_mechanics_unit(s, 0),
    w._dac_drive_steps_unit(s, 0),
    ...[0, 1, 2, 3, 4].map((f) => w._dac_drive_diagnostic(s, 0, f)),
  ];
  const disk = () => {
    const p = w._dac_disk_data(s);
    return w.HEAPU8.slice(p, p + w._dac_disk_size(s));
  };
  let snapshot;
  try {
    await bytes("s550.bin", (p, n) => w._dac_load(s, 0, p, n));
    await bytes("cas.bin", (p, n) => w._dac_load(s, 1, p, n));
    await bytes("tosm10.img", (p, n) => w._dac_mount(s, p, n, 1));
    expect(w._dac_power(s, 1)).toBe(0);
    run(100000000);
    const initial = disk();
    for (const c of "PIP DACREG.COM=PIP.COM") {
      expect(w._dac_key(s, c.charCodeAt(0), 1)).toBe(0);
      run(1000000);
    }
    expect(w._dac_key(s, 13, 1)).toBe(0);
    let found = false;
    for (let clocks = 0; clocks < 20000000; clocks += 64) {
      w._dac_run(s, 64);
      if (
        (w._dac_drive_detail_unit(s, 0) & 6) === 6 &&
        (w._dac_drive_diagnostic(s, 0, 3) & 65535) > 32
      ) {
        found = true;
        break;
      }
    }
    expect(
      found,
      "real OS must issue a write with bytes already transferred",
    ).toBe(true);
    const n = w._dac_state_size(s);
    snapshot = w._malloc(n);
    expect(w._dac_state_save(s, snapshot, n)).toBe(0);
    const before = sample();
    const continuation = () => {
      const trace = [];
      for (let i = 0; i < 8192; i++) {
        w._dac_run(s, 64);
        trace.push(sample());
      }
      return { trace, disk: disk() };
    };
    const first = continuation();
    expect(first.trace.some((t) => t[8] & 0x1000000)).toBe(true);
    expect(
      first.trace
        .filter((t) => t[8] & 0x1000000)
        .every((t) => !(t[8] & 0x001000)),
    ).toBe(true); // no overrun
    expect(w._dac_state_load(s, snapshot, n)).toBe(0);
    expect(sample()).toEqual(before);
    expect(continuation()).toEqual(first);
    run(40000000);
    expect(disk()).not.toEqual(initial);
    const expected = fileContents(initial, "PIP     COM");
    expect(expected.length).toBeGreaterThan(1024);
    expect(fileContents(disk(), "DACREG  COM")).toEqual(expected);
  } finally {
    if (snapshot) w._free(snapshot);
    w._dac_destroy(s);
  }
});

test("drive diagnostics expose sampled mechanics and remain usable on a narrow screen", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#drive-diagnostics summary").click();
  await page.locator("#power").click();
  await expect(page.locator("#drive-diagnostic-values")).toContainText(
    "STEP count",
  );
  await expect(page.locator("#drive-diagnostic-values")).toContainText("RPM");
  await expect(page.locator("#drive-diagnostic-values")).toContainText(
    "pulses",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator("#error")).toBeEmpty();
});
