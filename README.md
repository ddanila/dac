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

- **Robotron:** 2 KB boot ROM + 256-byte CAS PROM; optional 2/4 KB character data; optional 819,200-byte raw disk (80 tracks × 2 heads × 5 sectors × 1,024 bytes). Tested with S550/287 and TOS/M 1.0.
- **Juku:** 16 KB ROM; optional 409,600/819,200-byte raw Juku disk.
- **VJUGA:** 16 KB adapted ROM, Rev-A Mode B bounded-boot profile; keyboard/disk are not implemented in that profile.

The reference archive’s supplied raw TOS/M image contains a damaged `PIP.COM`. Use a fresh decode of its original TeleDisk image for file operations; see [media conversion instructions](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m#tosm-media-recovery-and-the-pip-failure).

Disk writes are off by default. Enabling them changes only a session copy; **Export session disk** downloads it. Reset and power cycling preserve the copy, switching machines/media or closing the tab discards it. There is no upload or automatic persistence. The bundled Robotron firmware and OS are third-party historical media, excluded from the project’s MIT licence; redistribution rights have not been established. See [media provenance and rights](public/media/robotron/NOTICE.txt) and the [hash manifest](src/robotron-media.json). The disk is decoded from the original TeleDisk image, avoiding the damaged PIP in the alternative archived raw disk. Restore the diagnostic or historical media from the boot-media panel.

## What is qualified

Robotron cold boot, keyboard, file creation, reading, text/binary copying, export/reboot and deletion pass bounded native checks. Native and WASM boot pixels and complete session disks after create/read/copy match exactly. VJUGA matches a bounded Juku boot framebuffer in both native decode modes. The viewer has automated power/reset/input/media recovery tests and inspected desktop/mobile layouts.

The cores are experimental. Robotron has simplified FDC/DMA/SIO/CTC timing and an incomplete 8275 display model, with tested completion/interrupt behavior, programmed row height, field attributes and cursor. Juku accepts one key contact at a time; long-session WASM32 clock wrap is unqualified. No full hardware-fidelity or cross-browser claim is made. See [emulation validation](https://github.com/ddanila/dac-emulation/blob/main/docs/z80-browser-validation.md).

## Models and provenance

Robotron uses a photo-based OpenSCAD reconstruction of Danila’s actual machine, maintained in [3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). It combines documented overall dimensions, ruler-scaled key spacing, sculpted keycaps with transcribed legends, modeled drive slots/latches, a separate keyboard bottom plate and feet, one continuous cable, and separate physical power/reset switches. Consistent paint/plastic/rubber materials replace full-surface photo skins; the wordmark, drive markings and reference boards use localized photo crops. The keys can be clicked or used through accessible buttons; 89 positions are wired, while eight unverified mappings are labeled. Close-up views show the keyboard, drives, monitor and underside, with reference-photo links and evidence notes. Exterior parts can be separated for inspection. Small features and unseen surfaces remain estimates; interiors combine owner drive photographs with credited comparative references. Juku and VJUGA still use provisional geometry. See [asset notes](public/models/README.md) and [the exhibit brief](exhibits/robotron-1715m/README.md).

The museum commits a small versioned WASM distribution in `public/emulator/` rather than depending on a moving download. `manifest.json` records its source commit, ABI/toolchain version and hashes. To intentionally update it, build/package a release in `dac-emulation`, then run:

```sh
node scripts/sync-emulator.mjs ../dac-emulation/dist
npm test
npm run build
```

Large scanned assets and their hosting remain a future decision; the current generated geometry and small measured STL fit comfortably in Git. Original content is [MIT](LICENSE). Imported code retains the notices in `public/emulator`; Three.js retains its MIT license in the bundle. See [technical direction](docs/technical-direction.md).

Choose **Type** to keep the live display above the clickable 3D keyboard. **Inspect photo and details** opens the owner photograph for the current view; clicking a manufacturer plate or TEAC board label in **Drive labels** opens its specific photograph and transcription. Escape closes the photo panel.

The historical Robotron preset now runs the **S600 keyboard firmware** on a second Z80. Host key press/release and modeled clicks operate a reference switch matrix; serial clocking, firmware modifiers and Caps/SI-SO state feed the running OS. Some printed shifted legends differ from S600. Custom media may supply a 2 KB keyboard ROM; omitting it retains the character adapter.

**Keep this session** provides automatic local disk copies and Robotron **Save state / Restore state**. Disk copies survive reloads and are separated by media identity; whole-machine states require the same emulator build and write mode. Browser storage is not a portable backup—use disk export. **Discard saved disk** removes the local copy; reload original media to start fresh. Writes remain opt-in. Floppy seek, rotation and byte pacing now make boot slower; 4× speed is useful while waiting for `A>`.
