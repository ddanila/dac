# DAC — Danila’s Archive of Computing

*A museum of computers and the worlds they opened.*

A working browser prototype: rotate a computer, inspect its underside, click its case power button, and type on its live emulated screen. The museum uses pinned [DAC Emulation](https://github.com/ddanila/dac-emulation) WebAssembly cores in a worker.

[Open the public prototype](https://ddanila.github.io/dac/) · [Emulator release 0.1.1](https://github.com/ddanila/dac-emulation/releases/tag/v0.1.1)

## Try locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The default Robotron exhibit runs an **original DAC diagnostic ROM**, not historical firmware. Press **Power on**, then **Screen** to type. Juku and VJUGA have original pixel diagnostics. The small warm-colored switch on the 3D case also controls power. Front/rear/underside buttons provide alternatives to dragging.

`npm run build` produces a static `dist/` site. `DAC_BASE=/dac/ npm run build` builds for a GitHub project-site path. `npm test` runs the focused Chromium checks (install the browser once with `npx playwright install chromium`).

## Historical media

Power off and expand **Load your machine’s media**. Files stay in the browser:

- **Robotron:** 2 KB boot ROM + 256-byte CAS PROM; optional 2/4 KB character data; optional 819,200-byte raw disk (80 tracks × 2 heads × 5 sectors × 1,024 bytes). Tested with S550/287 and TOS/M 1.0.
- **Juku:** 16 KB ROM; optional 409,600/819,200-byte raw Juku disk.
- **VJUGA:** 16 KB adapted ROM, Rev-A Mode B bounded-boot profile; keyboard/disk are not implemented in that profile.

The reference archive’s supplied raw TOS/M image contains a damaged `PIP.COM`. Use a fresh decode of its original TeleDisk image for file operations; see [media conversion instructions](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m#tosm-media-recovery-and-the-pip-failure).

Disk writes are off by default. Enabling them changes only a session copy; **Export session disk** downloads it. Reset and power cycling preserve the copy, switching machines/media or closing the tab discards it. There is no upload or automatic persistence. Firmware and historical software are not bundled or covered by the project license.

## What is qualified

Robotron cold boot, keyboard, file creation, reading, text/binary copying, export/reboot and deletion pass bounded native checks. Native and WASM boot pixels and complete session disks after create/read/copy match exactly. VJUGA matches a bounded Juku boot framebuffer in both native decode modes. The viewer has automated power/reset/input/media recovery tests and inspected desktop/mobile layouts.

The cores are experimental. Robotron has simplified FDC/DMA/SIO/CTC timing and an incomplete 8275 display model, with tested completion/interrupt behavior, programmed row height, field attributes and cursor. Juku accepts one key contact at a time; long-session WASM32 clock wrap is unqualified. No full hardware-fidelity or cross-browser claim is made. See [emulation validation](https://github.com/ddanila/dac-emulation/blob/main/docs/z80-browser-validation.md).

## Models and provenance

Robotron uses a photo-based OpenSCAD reconstruction of Danila’s actual machine, maintained in [3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). It combines documented overall dimensions, ruler-scaled key spacing, photographed key legends/drive faces/keyboard underside, and separate physical power/reset switches. Small features and unseen surfaces remain estimates; interiors are not modeled. Juku and VJUGA still use provisional geometry. See [asset notes](public/models/README.md) and [the exhibit brief](exhibits/robotron-1715m/README.md).

The museum commits a small versioned WASM distribution in `public/emulator/` rather than depending on a moving download. `manifest.json` records its source commit, ABI/toolchain version and hashes. To intentionally update it, build/package a release in `dac-emulation`, then run:

```sh
node scripts/sync-emulator.mjs ../dac-emulation/dist
npm test
npm run build
```

Large scanned assets and their hosting remain a future decision; the current generated geometry and small measured STL fit comfortably in Git. Original content is [MIT](LICENSE). Imported code retains the notices in `public/emulator`; Three.js retains its MIT license in the bundle. See [technical direction](docs/technical-direction.md).
