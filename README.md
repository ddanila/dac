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

The cores are experimental. Robotron has simplified FDC/DMA/SIO/CTC timing and an incomplete 8275 display model, with tested completion/interrupt behavior, programmed row height, field attributes and cursor. Juku accepts one key contact at a time; clock rollover is covered by focused native and WASM tests. No full hardware-fidelity claim is made. Focused session/media tests cover Chromium, Firefox and Playwright WebKit; this is not qualification of every retail Safari version. See [emulation validation](https://github.com/ddanila/dac-emulation/blob/main/docs/z80-browser-validation.md).

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

**Keep this session** provides automatic local disk copies and **Save state / Restore state** for all three machines. Disk copies survive reloads and are separated by media identity; whole-machine states require the same emulator build and write mode. Disk export is a portable backup; **Export state / Import state** moves a complete session between browsers running the same emulator build, original media and write settings. **Discard saved disk** removes the local copy; reload original media to start fresh. Writes remain opt-in. Floppy seek, rotation and byte pacing now make boot slower; 4× speed is useful while waiting for `A>`.


**Drive B** accepts a second 800 KB raw image or an empty data disk. Power off to
insert/eject or change protection; copies persist independently. After a reload,
the inserted B disk and its protection are restored when persistence is enabled.
Use `DIR B:` and `PIP B:=A:PIP.COM`. Original files are untouched. Reset or warm-boot
the guest after a disk change, as its OS may cache directory data.

**Printer output** captures completed serial bytes, including control codes, and
exports a `.prn` file. The 64 KB capture limit is visible; export and clear when
full. Try `PIP LST:=AUTOEXC.SUB`. The virtual printer is always ready.

With the case open, each spindle and head follows its drive's motor/track state.
Head travel is estimated, rotation assumes 300 RPM, and optional drive sounds
are synthesized. Reduced motion pauses spindle rotation.

Additional validation: `npm run test:cross` runs the focused Firefox/WebKit suite
(after `npx playwright install firefox webkit`). CI runs Firefox on Linux and WebKit on macOS; both also passed locally on macOS. The core's optional application
regression covers WordStar editing, Turbo Pascal compilation/execution, drive-to-
drive PIP copying and printer output using the bundled reference disk.

### Workbench improvements (2026-10-11)

- **Disk library:** name a copy of either mounted drive, duplicate it independently,
  insert it while powered off, reset it to its captured original, or export it.
  Drive B insertion/ejection and write protection survive reload when disk
  persistence is enabled. Disks from each machine have separate library lists.
  “Keep browser storage persistently” requests browser-managed persistence;
  exporting files remains the way to keep an independent backup.
- **Paste through the keyboard:** ASCII text/newlines (up to 4096 characters),
  paced in emulated time with cancellation. Robotron with firmware uses an S600
  mapping measured by running its ROM, including shifted punctuation; other
  keyboard ROMs and SI/SO mode are rejected. Without firmware, Robotron/Juku use
  their existing keyboard adapters. Wait for the guest program’s prompt.
- **Record/replay:** restart with the currently mounted disk contents, then record
  exact run budgets, key contacts/taps, resets, power changes, printer clears and
  up to eight disk/protection changes. Stop and export a `.dacrecord` (maximum
  100,000 events). It includes ROMs and disks; their original rights/credits apply.
  Replay runs an isolated machine and verifies the display, both disks and printer
  hashes, preserving the current session. Long replays can be cancelled.
  Media changes happen with power off; changing machine/firmware or loading a
  snapshot requires stopping the recording.
- **Across upgrades:** state envelope v2 declares a pinned-runtime compatibility
  policy and still accepts v1. DAC preserves the 0.3.0 runtime with checked
  JavaScript/WASM hashes. Compatible old browser saves and exported `.dacstate`
  files can run on that runtime; a notice identifies it. Reloading media selects
  the current runtime. This is preservation, not conversion to a newer internal
  layout. Unlisted versions are rejected without replacing the current machine.
- **Inspection:** click interior components or use “Explore the components” to
  read descriptions and the owner/reference/estimated evidence behind them.
- Hidden tabs pause emulation, clear held input/cancel paste and flush disk copies.
  Returning starts from the current emulated time without a wall-clock backlog.

For a native replay check, build `../dac-emulation/build/dac-replay` with
`make -C ../dac-emulation build/dac-replay`, then run:

```sh
node scripts/replay-native.mjs path/to/session.dacrecord
```

This compares native C output with browser-recorded output. `.dacrecord` is a
versioned command/media format, not a C structure dump. Equal output hashes are a
useful regression check, not proof of every internal state or hardware timing.
Snapshot/runtime preservation should be extended before replacing another core:
keep its JS/WASM and notices under `public/emulator/archive/<wasm-sha>/`, add the
pinned JS hash to `src/archived-cores.json`, and run the preserved-state test.

`src/s600-paste.json` is reproducible with `scripts/s600-keymap.c`: build it against
`../dac-emulation/build/{machines/robotron1715m/{robotron,keyboard,sio},common/cpu/z80,common/media/media,common/trace/trace}.o`
and run it with `public/media/robotron/s600.bin`. It boots a fresh reference
keyboard for each matrix contact with and without Shift and observes serial output;
it does not infer characters from the specimen’s printed legends.


Assembly inspection now supports keyboard-only disassembly, assembly isolation,
transparent covers and a visual drive-clamp release. Springs and stems share
instanced geometry and follow key presses. The spring measurements belong to an
owner-photographed keyboard variant; hidden switch construction remains estimated.
Drive heads and shields move together, and separated cables retain their endpoints
using explanatory stretching. Releasing clamps in the viewer does not eject media.
Monitor geometry and PCB credits remain explicitly comparative until specimen
interior photographs are available. Focused `assembly.spec.js` checks these motions,
visibility restoration, cable endpoints and mobile controls without hardware simulation.


The reference motherboard and controller now use pinned KiCad DIP package meshes,
instanced by family without stretching their nominal dimensions. Their photographed
placements and uncertain package matches remain provisional. Discrete components
are placed at photo landmarks, and original flat chip silhouettes are removed from
the PCB photo surface. Choose **Inspect assembly → Logic boards** for the close view.
Upstream STEP sources, file-specific licences, credits, conversion metadata and
mesh hashes ship alongside the exhibit in `public/models/robotron-1715m/components/kicad`.

**Inspect assembly → Motherboard / Floppy controller** now isolates each board,
including its chips, passive components, connectors and reference artwork.
Real holes, metal pads and underside solder fillets share lead positions; pads
and solder use reusable instances. The controller includes yellow film
capacitors and photo-estimated electrolytic sizes. Traces and markings are
extracted from the credited comparative photographs onto a consistently lit
substrate; hidden routing and electrical connectivity are not reconstructed.
The exact board revision, sockets and connector details remain provisional.
