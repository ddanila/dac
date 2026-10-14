# DAC — Danila’s Archive of Computing

*A museum of computers and the worlds they opened.*

A working browser prototype: rotate a computer, inspect its underside, click its case power button, and type on its live emulated screen. The museum uses pinned [DAC Emulation](https://github.com/ddanila/dac-emulation) WebAssembly cores in a worker.

[Open the public prototype](https://ddanila.github.io/dac/) · [Emulator release 0.1.1](https://github.com/ddanila/dac-emulation/releases/tag/v0.1.1)

## Try locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The default Robotron exhibit boots the **historical S550 ROM and TOS/M 1.0 disk**. This is a tested reference configuration, not a dump of Danila’s exact machine. Wait for `A>`, then try `DIR`. Press **Power on**, then **Screen** to type. Juku and VJUGA have original pixel diagnostics. The small warm-colored switch on the 3D case also controls power. Front/rear/underside buttons provide alternatives to dragging.

`npm run build` produces a static `dist/` site. `DAC_BASE=/dac/ npm run build` builds for a GitHub project-site path. `npm test` runs the focused Chromium checks (install the browser once with `npx playwright install chromium`).

## Historical media

Power off and expand **Load your machine’s media**. Files stay in the browser:

- **Robotron:** 2 KB boot ROM + 256-byte CAS PROM; optional 2/4 KB character data; optional 819,200-byte raw disk or supported standard/extended DSK (1–80 cylinders, 1–2 heads, up to 29 sectors of 128–4096 bytes within MFM track capacity). Tested with S550/287 and TOS/M 1.0.
- **Juku:** 16 KB ROM; optional 409,600/819,200-byte raw Juku disk.
- **VJUGA:** 16 KB adapted ROM, Rev-A Mode B bounded-boot profile; keyboard/disk are not implemented in that profile.

The reference archive’s supplied raw TOS/M image contains a damaged `PIP.COM`. Use a fresh decode of its original TeleDisk image for file operations; see [media conversion instructions](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m#tosm-media-recovery-and-the-pip-failure).

Disk writes are off by default. Enabling them changes only a session copy; **Export session disk** downloads it. Reset and power cycling preserve the copy, switching machines/media or closing the tab discards it. There is no upload or automatic persistence. The bundled Robotron firmware and OS are third-party historical media, excluded from the project’s MIT licence; redistribution rights have not been established. See [media provenance and rights](public/media/robotron/NOTICE.txt) and the [hash manifest](src/robotron-media.json). The disk is decoded from the original TeleDisk image, avoiding the damaged PIP in the alternative archived raw disk. Restore the diagnostic or historical media from the boot-media panel.

## What is qualified

Robotron cold boot, keyboard, file creation, reading, text/binary copying, export/reboot and deletion pass bounded native checks. Native and WASM boot pixels and complete session disks after create/read/copy match exactly. VJUGA matches a bounded Juku boot framebuffer in both native decode modes. The viewer has automated power/reset/input/media recovery tests and inspected desktop/mobile layouts.

The cores are experimental. Robotron has simplified FDC/DMA/SIO/CTC timing and an incomplete 8275 display model, with tested completion/interrupt behavior, programmed row height, field attributes and cursor. Juku accepts one key contact at a time; clock rollover is covered by focused native and WASM tests. No full hardware-fidelity claim is made. Focused session/media tests cover Chromium, Firefox and Playwright WebKit; this is not qualification of every retail Safari version. See [emulation validation](https://github.com/ddanila/dac-emulation/blob/main/docs/z80-browser-validation.md).

## Models and provenance

Robotron uses a photo-based OpenSCAD reconstruction of Danila’s actual machine, maintained in [3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). It combines documented overall dimensions, ruler-scaled key spacing, sculpted keycaps with transcribed legends, modeled drive slots/latches, a separate keyboard bottom plate and feet, one continuous cable, and separate physical power/reset switches. Consistent paint/plastic/rubber materials replace full-surface photo skins; the wordmark, drive markings and reference boards use localized photo crops. Owner overhead photos now determine the staggered rows, key islands and spacers. Raised Shift bodies are 18 mm wide and CTRL/ET bodies 23 mm, as measured by Danila; these dimensions are independent of the base flanges. Opaque cap cavities follow the rounded bodies so they cannot pierce the sidewalls. The keys can be clicked or used through accessible buttons; 89 positions are wired, while eight unverified mappings are labeled. Close-up views show the keyboard, drives, monitor and underside, with reference-photo links and evidence notes. Exterior parts can be separated for inspection. Small features and unseen surfaces remain estimates; interiors combine owner drive photographs with credited comparative references. Juku and VJUGA still use provisional geometry. See [asset notes](public/models/README.md) and [the exhibit brief](exhibits/robotron-1715m/README.md).

The museum commits a small versioned WASM distribution in `public/emulator/` rather than depending on a moving download. `manifest.json` records its source commit, ABI/toolchain version and hashes. To intentionally update it, build/package a release in `dac-emulation`, then run:

```sh
node scripts/sync-emulator.mjs ../dac-emulation/dist
npm test
npm run build
```

Large scanned assets and their hosting remain a future decision; the current generated geometry and small measured STL fit comfortably in Git. Original content is [MIT](LICENSE). Imported code retains the notices in `public/emulator`; Three.js retains its MIT license in the bundle. See [technical direction](docs/technical-direction.md).

Choose **Type** to keep the live display above the clickable 3D keyboard. **Inspect photo and details** opens the owner photograph for the current view; clicking a manufacturer plate or TEAC board label in **Drive labels** opens its specific photograph and transcription. Escape closes the photo panel.

The historical Robotron preset now runs the **S600 keyboard firmware** on a second Z80. Host key press/release and modeled clicks operate a reference switch matrix; serial clocking, firmware modifiers and Caps/SI-SO state feed the running OS. Some printed shifted legends differ from S600. Custom media may supply a 2 KB keyboard ROM; omitting it retains the character adapter.

**Keep this session** provides automatic local disk copies and **Save state / Restore state** for all three machines. Disk copies survive reloads and are separated by media identity; whole-machine states require the same emulator build and write mode. Disk export is a portable backup; **Export state / Import state** moves a complete session between browsers running the same emulator build, original media and write settings. **Discard saved disk** removes the local copy; reload original media to start fresh. Writes remain opt-in. Floppy seek, rotation and byte pacing now make boot slower; 4× speed is useful while waiting for `A>`.


**Drive B** accepts a second 800 KB raw image, a supported Robotron DSK, or an empty data disk. Power off to
insert/eject or change protection; copies persist independently. After a reload,
the inserted B disk and its protection are restored when persistence is enabled.
Use `DIR B:` and `PIP B:=A:PIP.COM`. Original files are untouched. Reset or warm-boot
the guest after a disk change, as its OS may cache directory data.

**Printer output** captures completed serial bytes, including control codes, and
exports a `.prn` file. The 64 KB capture limit is visible; export and clear when
full. Try `PIP LST:=AUTOEXC.SUB`. The virtual printer is always ready.

With the case open, each spindle and head follows its drive's motor/track state.
Head travel uses nominal TEAC 96-tpi pitch (20.90 mm across 79 steps). Current-core spindle and fractional head poses follow emulated startup/coast, STEP and settling timing. READY depends on index observations; Read-ID/sector search follows physical order, and missed byte deadlines report overruns. Optional synthesized seek sounds follow individual timestamped STEP events; motor tone follows modeled speed. Snapshot/replay restores all mechanics. The movable upper head arm follows the core’s load progress; a translucent inserted disk exposes its shared spindle motion. Its jacket is omitted for inspection, and arm lift/pivot dimensions remain estimates. Older preserved cores retain their earlier behavior, and reduced motion freezes the rotor display. DSK import/export preserves supported track order, IDs and GAP3; unsupported geometries are rejected. See [timing scope and remaining approximations](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/DRIVE-FIDELITY.md).

Additional validation: `npm run test:cross` runs the focused Firefox/WebKit suite
(after `npx playwright install firefox webkit`). CI runs Firefox on Linux and WebKit on macOS; both also passed locally on macOS. The core's optional application
regression covers WordStar editing, Turbo Pascal compilation/execution, drive-to-
drive PIP copying and printer output using the bundled reference disk.

## Current Robotron model

Canonical model v32 uses the W/M motherboard with integrated U8272 and a separate solder-side-up display controller. Owner photographs guide the fan, drive adapters, carrier windows, underside rotors, cover hardware and clean exterior. The enclosures have 1 mm bent painted skins, hollow front returns and open vents. The October 14 photos of this specimen also establish 39 display-board ICs and visible passives; mainboard placement still needs complete photo calibration. The browser imports the canonical export; physical verification remains independent of photo/schematic evidence. The museum does not claim an exact reconstruction of hidden circuitry.

All keyboard, monitor and logic-board geometry loads before the exhibit is marked ready, so internals remain visible through openings with the covers closed. Repeated DIP package meshes share geometry across boards, including concurrent requests. Optional reference-photo overlays load only when selected. The percentage includes all required geometry; a failed geometry request leaves an explicit unavailable state rather than presenting an empty case as complete. Reloading retries it. Loading optimizations must preserve the visual experience. STL triangles now use shared indexed vertices after crease normals are computed: all 203 meshes retain identical expanded attributes, while the stored vertex count drops by 66%. Bounds accelerate picking, and disk dragging computes its ray directly instead of repeatedly picking the entire model.

The canonical repository includes repeatable photo/STL overlays and bounded solid-clearance checks for connectors, fan opening, board mounts, brackets and passive components. See the [current model, evidence, checks and rebuild instructions](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). Earlier decisions and superseded layouts are preserved in [model development history](MODEL-HISTORY.md).

### CI scope

Model/viewer-only changes (including scene lighting and camera code) run two isolated Chromium shards covering model, keyboard, assembly, inspection, rendering and saved-session interactions, plus small Firefox/WebKit assembly checks. Each runner uses one browser worker to avoid competing software renderers. Interaction checks default to reduced motion; dedicated mechanism tests explicitly exercise animation. They do not build the native emulator or run unrelated replay suites. Runtime, emulator, dependency or unrecognized changes run the complete suite and native replay checks; manual workflow dispatch also runs everything. `scripts/ci-scope.mjs` uses a conservative path allowlist and defaults to full coverage if the base revision cannot be read. Pages deployment still requires the build and browser checks. Linux browser dependencies use Ubuntu’s main mirror to avoid the slow Azure mirror seen in previous runs.
