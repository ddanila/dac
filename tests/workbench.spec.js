import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { InputSequence, pasteText, clockDebt } from "../src/input-sequence.js";
async function ready(page) {
  // These tests cover core input, persistence and sidebar controls. The dedicated
  // museum/keyboard/drive tests exercise the full CAD scene. Keep repeated core
  // reloads off the software renderer's multi-million-triangle path.
  await page.route("**/models/robotron-1715m/model.json?*", route => route.fulfill({status:503,body:"CAD omitted in workbench fixture"}));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#power")).toBeEnabled({ timeout: 15000 });
}
async function open(page, id) {
  await page.locator(id).evaluate((e) => (e.open = true));
}
test("clock debt is bounded and paste preserves releases and rejects unsupported text", () => {
  expect(clockDebt(0, 3600000, 1e9, 2000000, 4)).toBe(800000);
  expect(clockDebt(100, 0, 0, 2000000, 1)).toBe(0);
  expect(() => pasteText("a💻", 0, false, {})).toThrow();
  const seq = new InputSequence(pasteText("AA\r\n", 0, false, {}), 2000000),
    sent = [];
  while (!seq.done) seq.advance(10000, (e) => sent.push(e));
  expect(sent.map((e) => [e.key, e.down])).toEqual([
    [65, true],
    [65, false],
    [65, true],
    [65, false],
    [13, true],
    [13, false],
  ]);
});
test("drive B reload, named independent copies and reset", async ({ page }) => {
  await ready(page);
  await open(page, "#drive-b-controls");
  await page.locator("#blank-b").click();
  await expect(page.locator("#disk-b-status")).toContainText("inserted");
  await page.reload();
  await expect(page.locator("#power")).toBeEnabled({ timeout: 15000 });
  await open(page, "#drive-b-controls");
  await expect(page.locator("#disk-b-status")).toContainText("inserted");
  await open(page, "#library-controls");
  await page.locator("#library-unit").selectOption("1");
  await page.locator("#disk-name").fill("Work");
  await page.locator("#library-save").click();
  await expect(page.locator("#library-disks option")).toHaveCount(1);
  await page.locator("#disk-name").fill("Independent");
  await page.locator("#library-duplicate").click();
  await expect(page.locator("#library-disks option")).toHaveCount(2);
  await page.locator("#library-mount").click();
  await expect(page.locator("#storage-status")).toHaveText(
    "Library disk inserted.",
  );
  await page.locator("#library-reset").click();
  await expect(page.locator("#storage-status")).toContainText(
    "reset to its original",
  );
  await page.locator("#eject-b").click();
  await expect(page.locator("#disk-b-status")).toContainText("empty");
  await page.reload();
  await expect(page.locator("#power")).toBeEnabled({ timeout: 15000 });
  await open(page, "#drive-b-controls");
  await expect(page.locator("#disk-b-status")).toContainText("empty");
  await expect(page.locator("#error")).toBeEmpty();
});
test("paste, deterministic browser/native replay and damaged recording rejection", async ({
  page,
}) => {
  test.setTimeout(60000);
  await ready(page);
  await open(page, "#media-controls");
  await page.locator("#demo").click();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await open(page, "#record-controls");
  await page.locator("#record-start").click();
  await expect(page.locator("#record-status")).toContainText(
    "Recording from restart",
  );
  await open(page, "#paste-controls");
  await page.locator("#paste-text").fill("HELLO\n");
  await page.locator("#paste-send").click();
  await expect(page.locator("#paste-status")).toHaveText("Typing complete.", {
    timeout: 15000,
  });
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Powered off");
  await open(page, "#drive-b-controls");
  await page.locator("#blank-b").click();
  await expect(page.locator("#disk-b-status")).toContainText("inserted");
  await page.locator("#power").click();
  await expect(page.locator("#status")).toHaveText("Running");
  await page.locator("#drive-lever-1").click();
  await expect(page.locator("#drive-media-1")).toBeEnabled();
  await page.locator("#drive-media-1").click({ delay: 150 });
  await expect(page.locator("#drive-media-1")).toHaveText("Insert disk B");
  await page.locator("#drive-media-1").click({ delay: 150 });
  await expect(page.locator("#drive-media-1")).toHaveText("Remove disk B");
  await page.locator("#drive-lever-1").click();
  await page.waitForTimeout(200);
  const download = page.waitForEvent("download");
  await page.locator("#record-stop").click();
  const bytes = await readFile(await (await download).path());
  await page.locator("#record-file").setInputFiles({
    name: "test.dacrecord",
    mimeType: "application/json",
    buffer: bytes,
  });
  await expect(page.locator("#record-status")).toContainText(
    "Replay verified",
    { timeout: 30000 },
  );
  const path = test.info().outputPath("test.dacrecord");
  await writeFile(path, bytes);
  // Optional local parity check; core CI builds/tests the native runner separately.
  if (process.env.DAC_NATIVE_REPLAY)
    expect(
      execFileSync(
        "node",
        [
          "scripts/replay-native.mjs",
          path,
          process.env.DAC_NATIVE_REPLAY === "1"
            ? "../dac-emulation/build/dac-replay"
            : process.env.DAC_NATIVE_REPLAY,
        ],
        {
          encoding: "utf8",
        },
      ),
    ).toContain("PASS native replay");
  const file = JSON.parse(bytes);
  file.sha256 = "0".repeat(64);
  await page.locator("#record-file").setInputFiles({
    name: "bad.dacrecord",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.locator("#record-status")).toContainText("integrity");
  await expect(page.locator("#status")).toHaveText("Running");
  await expect(page.locator("#error")).toBeEmpty();
});
test("owner and comparative evidence is visible in component cards", async ({
  page,
}) => {
  await ready(page);
  await open(page, "#component-guide");
  await page.locator('[data-component="component-logic"]').click();
  await expect(page.locator("#detail-description")).toContainText(
    "another PC 1715",
  );
  await expect(page.locator("#detail-original")).toHaveAttribute(
    "href",
    "https://oldcrap.org/2017/12/26/robotron-1715/",
  );
  await expect(page.locator("#detail-photo")).toBeHidden();
  await page.locator("#detail-close").click();
  await page.locator('[data-component="component-drives"]').click();
  await expect(page.locator("#detail-description")).toContainText(
    "Owner photographs",
  );
  await expect(page.locator("#detail-photo")).toBeVisible();
});
for (const version of ["0.3.0", "0.4.0", "0.5.0", "0.6.0", "0.7.0", "0.7.1"])
  test(`preserved ${version} snapshot restores after emulator upgrade`, async ({
    page,
  }) => {
    const { default: archives } = await import("../src/archived-cores.json", {
      with: { type: "json" },
    });
    const build = Object.keys(archives).find(
      (key) => archives[key].version === version,
    );
    const { default: create } = await import(
      `../public/emulator/archive/${build}/dac.js`
    );
    const m = await create(),
      h = m._dac_create(2);
    const rom = await readFile("public/emulator/demo/robotron.bin"),
      prom = await readFile("public/emulator/demo/cas.bin"),
      glyph = await readFile("public/emulator/demo/glyphs.bin");
    const firmware = [
      [0, rom],
      [1, prom],
      [2, glyph],
    ];
    for (const [slot, bytes] of firmware) {
      const p = m._malloc(bytes.length);
      m.HEAPU8.set(bytes, p);
      expect(m._dac_load(h, slot, p, bytes.length)).toBe(0);
      m._free(p);
    }
    m._dac_power(h, 1);
    m._dac_run(h, 100000);
    const n = m._dac_state_size(h),
      p = m._malloc(n);
    expect(m._dac_state_save(h, p, n)).toBe(0);
    const state = m.HEAPU8.slice(p, p + n).buffer;
    m._free(p);
    m._dac_destroy(h);
    const { sessionIdentity, encodeSnapshot } =
      await import("../src/session-store.js");
    const key = `state:${build}:${await sessionIdentity(2, firmware)}:0`;
    const file = Buffer.from(await encodeSnapshot(key, state));
    file[file.indexOf("DAC-state-2") + "DAC-state-".length] = 49; // Original version-1 envelope
    await ready(page);
    await open(page, "#media-controls");
    await page.locator("#demo").click();
    await expect(page.locator("#power")).toBeEnabled();
    await open(page, "#session-controls");
    await page.locator("#import-state").setInputFiles({
      name: "old.dacstate",
      mimeType: "application/octet-stream",
      buffer: file,
    });
    await expect(page.locator("#storage-status")).toHaveText(
      "Imported machine state restored.",
      { timeout: 15000 },
    );
    await expect(page.locator("#status")).toHaveText("Running");
    await expect(page.locator("#runtime-status")).toContainText(
      "preserved emulator",
    );
    await page.locator("#save-state").click();
    await expect(page.locator("#storage-status")).toContainText(
      "Machine state saved",
    );
    await page.reload();
    await expect(page.locator("#power")).toBeEnabled({ timeout: 15000 });
    await open(page, "#media-controls");
    await page.locator("#demo").click();
    await open(page, "#session-controls");
    await expect(page.locator("#restore-state")).toBeEnabled();
    await page.locator("#restore-state").click();
    await expect(page.locator("#runtime-status")).toContainText(
      "preserved emulator",
    );
    await expect(page.locator("#status")).toHaveText("Running");

    await expect(page.locator("#error")).toBeEmpty();
  });
test("S600 paste reaches TOS/M and writes only its session disk", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.activity = 0;
    window.Worker = class extends Base {
      constructor(...a) {
        super(...a);
        this.addEventListener("message", ({ data }) => {
          if (data.type === "frame") window.activity = data.activity;
        });
      }
    };
  });
  await ready(page);
  await open(page, "#media-controls");
  await page.locator("#writable").check();
  await page.locator("#historical").click();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#turbo").check();
  await page.locator("#power").click();
  await expect
    .poll(() => page.evaluate(() => window.activity), { timeout: 45000 })
    .toBeGreaterThan(77);
  await page.waitForTimeout(500);
  await open(page, "#paste-controls");
  await page.locator("#paste-text").fill("ERA AUTOEXC.BAK\n");
  await page.locator("#paste-send").click();
  await expect(page.locator("#paste-status")).toHaveText("Typing complete.", {
    timeout: 15000,
  });
  await expect
    .poll(() => page.evaluate(() => window.activity), { timeout: 15000 })
    .toBeGreaterThan(80);
  const dl = page.waitForEvent("download");
  await open(page, "#media-controls");
  await page.locator("#export").click();
  const bytes = await readFile(await (await dl).path());
  const stock = await readFile("public/media/robotron/tosm10.img");
  expect(bytes.equals(stock)).toBe(false);
  const names = (b) => {
    const out = [];
    for (let p = 20480; p < 20480 + 4096; p += 32)
      if (b[p] === 0)
        out.push(
          Buffer.from(b.subarray(p + 1, p + 12).map((v) => v & 127)).toString(),
        );
    return out.sort();
  };
  expect(names(bytes)).toEqual(names(stock).filter((n) => n !== "AUTOEXC BAK")); // 8.3 below checked explicitly
  await expect(page.locator("#error")).toBeEmpty();
});
test("hidden tabs cancel paste and resume without catch-up; power cycles release input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Base = window.Worker;
    window.workFrames = 0;
    window.Worker = class extends Base {
      constructor(...args) {
        super(...args);
        this.addEventListener("message", ({ data }) => {
          if (data.type === "frame") window.workFrames++;
        });
      }
    };
  });
  await ready(page);
  await open(page, "#media-controls");
  await page.locator("#demo").click();
  await expect(page.locator("#power")).toBeEnabled();
  await page.locator("#power").click();
  await open(page, "#paste-controls");
  await page.locator("#paste-text").fill("A".repeat(4096));
  await page.locator("#paste-send").click();
  await expect(page.locator("#paste-status")).toContainText("Typing ");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#paste-status")).toHaveText("Typing cancelled.");
  await page.waitForTimeout(100);
  const frames = await page.evaluate(() => window.workFrames);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.workFrames)).toBe(frames);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(() => page.evaluate(() => window.workFrames))
    .toBeGreaterThan(frames);
  for (let i = 0; i < 3; i++) {
    await page.locator("#power").click();
    await expect(page.locator("#status")).toHaveText("Powered off");
    await page.locator("#power").click();
    await expect(page.locator("#status")).toHaveText("Running");
  }
  await expect(page.locator("#error")).toBeEmpty();
});
