# DAC — Danila’s Archive of Computing

Current behavior and evidence: [Robotron capability matrix](docs/robotron/capabilities.md).

Inspection guides cover [controls and debugging](docs/robotron/inspection-workbench.md),
[measurements and evidence](docs/robotron/inspection-workbench.md#measurements), and
[checkpoints and disk comparisons](docs/robotron/inspection-and-checkpoints.md).

In progress: [keyboard controller reconstruction and circuit review](docs/robotron/keyboard-controller-progress.md),
following the [synchronization plan](docs/robotron/keyboard-controller-plan.md).

*A museum of computers and the worlds they opened.*

A working browser prototype: rotate a computer, inspect its underside, click its case power button, and type on its live emulated screen. The museum uses pinned [DAC Emulation](https://github.com/ddanila/dac-emulation) WebAssembly cores in a worker.

[Open the public prototype](https://ddanila.github.io/dac/) · [Pinned emulator build](public/emulator/manifest.json)

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

Disk writes are off by default. Enabling them changes only a session copy; **Export session disk** downloads it. Reset and power cycling preserve the copy, without persistence, switching machines/media or closing the tab discards it. There is no upload; persistence requires enabling **Keep this session**. The bundled Robotron firmware and OS are third-party historical media, excluded from the project’s MIT licence; redistribution rights have not been established. See [media provenance and rights](public/media/robotron/NOTICE.txt) and the [hash manifest](src/robotron-media.json). The disk is decoded from the original TeleDisk image, avoiding the damaged PIP in the alternative archived raw disk. Restore the diagnostic or historical media from the boot-media panel.

## What is qualified

The [capability matrix](docs/robotron/capabilities.md) owns Robotron behavior and
remaining limits; the [qualification guide](docs/robotron/emulation-qualification.md)
links reproducible checks and source-bound results. Reference-emulator agreement
does not establish specimen timing, wiring or firmware identity.

Juku accepts one key contact at a time; VJUGA has a bounded boot profile. See
[core validation](https://github.com/ddanila/dac-emulation/blob/main/docs/z80-browser-validation.md)
for native/WASM comparisons. Browser checks cover Chromium, Firefox and Playwright
WebKit, not every retail Safari version.

## Models and provenance

Robotron uses a photo-based OpenSCAD reconstruction of Danila’s machine,
maintained in [3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m).
Close-up and separated assembly views expose the keyboard, drives, monitor and
underside with source photographs and evidence notes. Documented dimensions,
photo-supported geometry and estimates remain distinct; unseen surfaces and
interior details are not fully verified. Juku and VJUGA use provisional geometry.
See [asset notes](public/models/README.md) and
[the exhibit brief](exhibits/robotron-1715m/README.md) for provenance and scope.

The museum commits a small versioned WASM distribution in `public/emulator/` rather than depending on a moving download. `manifest.json` records its source commit, ABI/toolchain version and hashes. To intentionally update it, build/package a release in `dac-emulation`, then run:

```sh
node scripts/sync-emulator.mjs ../dac-emulation/dist
npm test
npm run build
```

Large scanned assets and their hosting remain a future decision; the current generated geometry and small measured STL fit comfortably in Git. Original content is [MIT](LICENSE). Imported code retains the notices in `public/emulator`; Three.js retains its MIT license in the bundle. See [technical direction](docs/technical-direction.md).

Choose **Type** to keep the live display above the clickable 3D keyboard. **Inspect photo and details** opens the owner photograph for the current view; clicking a manufacturer plate or TEAC board label in **Drive labels** opens its specific photograph and transcription. Escape closes the photo panel.

The historical Robotron preset runs the **S600 keyboard firmware** on a second Z80. Host key press/release and modeled clicks operate a reference switch matrix; serial clocking, firmware modifiers and Caps/SI-SO state feed the running OS. Some printed shifted legends differ from S600. Custom media may supply a 2 KB keyboard ROM; omitting it retains the character adapter.

**Keep this session** provides automatic local disk copies and **Save state / Restore state** for all three machines. Disk copies survive reloads and are separated by media identity; whole-machine states require the same emulator build and write mode. Disk export is a portable backup; **Export state / Import state** moves a complete session between browsers running the same emulator build, original media and write settings. **Discard saved disk** removes the local copy; reload original media to start fresh. Writes remain opt-in. Floppy seek, rotation and byte pacing make boot slower; 4× speed is useful while waiting for `A>`.


**Drive B** accepts a second 800 KB raw image, a supported Robotron DSK, or an empty data disk. Power off to
insert/eject or change protection; copies persist independently. After a reload,
the inserted B disk and its protection are restored when persistence is enabled.
Use `DIR B:` and `PIP B:=A:PIP.COM`. Original files are untouched. Reset or warm-boot
the guest after a disk change, as its OS may cache directory data.

**Printer output** captures completed serial bytes, including control codes, and
exports a `.prn` file. The 64 KB capture limit is visible; export and clear when
full. Try `PIP LST:=AUTOEXC.SUB`. Printer readiness is adjustable; see the [workbench guide](docs/robotron/inspection-workbench.md#printer-and-controller-limits).

With the case open, spindle, head and load-arm motion follow the emulated drive
state. Optional synthesized sounds follow drive events; reduced motion freezes
rotor display. The translucent disk and estimated arm geometry aid inspection.
See [drive timing and format limits](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/DRIVE-FIDELITY.md)
for the core's behavior and remaining approximations.

Run `npm run test:cross` for focused Firefox/WebKit checks after
`npx playwright install firefox webkit`. Workflow files own CI browser/platform
selection; the qualification guide owns optional historical application checks.

## Model review and CI

The [canonical model](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m)
owns geometry, source evidence and mechanical checks. The museum imports pinned
exports; see [model maintenance](MODEL-HISTORY.md) for regeneration and runtime
preservation. Geometry/photo agreement does not establish physical fit or hidden
circuitry. [Keyboard controller reconstruction](docs/robotron/keyboard-controller-plan.md)
adds native electrical geometry with separate evidence limits.

With Vite running, generate owner-photo/render comparisons:

```sh
npm run review:robotron -- http://127.0.0.1:4173 /tmp/dac-review
```

Optional arguments select the Vite URL, output directory and canonical source
checkout. Cameras are manually fitted, not calibrated. Image and structural
baselines detect visible changes and missing components; they do not measure the
specimen. Inspect intentional changes before using `--update`; never update
baselines automatically in CI.

CI scope and sharding are defined by `scripts/ci-scope.mjs`, `scripts/ci-shards.mjs`
and workflow files. Unknown changes or unavailable comparison bases select full
coverage. Deployment requires the selected build/browser checks. Use successful
run logs to refresh duration data rather than copying counts or timings here.

## Disk contents explorer

Click a modeled diskette, or choose **Explore disk A/B**, to open the mounted
session image. The specimen viewer also links to the explorer. Choose a file to
highlight its allocation, then select a sector on the map or use the cylinder,
side and sector controls. The sector pane shows image/file offsets, hexadecimal
bytes and ASCII; map and text have independent zoom controls.

The default **TOS/M reference filesystem** profile is defined in the linked disk
parser. It is an explicit interpretation, not automatic filesystem detection.
Directory extents and user areas are retained. File lengths have CP/M's 128-byte
record precision. Inconsistent directories or incompatible
geometry fall back to sectors without file ownership. **Raw sectors** disables
filesystem interpretation.

Unallocated space appears blank in the filesystem view; inspection never erases
or modifies stored bytes. Reserved system sectors and directory entries remain
readable. Raw 800 KiB images use the emulator's CHS ordering. Standard/extended DSK
use track headers and stored sector order; mixed-size sectors can be inspected,
but unsupported/weak sector lengths are rejected. DSK container offsets include
headers. The map uses the documented TEAC side-specific radii and 96-TPI pitch;
ID marks, data spans and gaps use the emulator’s reference MFM byte-clock layout, not recovered magnetic timing.

Live inspection copies the current worker disk at serialized command boundaries
periodically while the dialog is visible. Uncheck **Live updates** to freeze;
**Refresh** takes another snapshot. Current sampled controller access is marked
red. Closing the dialog stops polling. This does not pause the emulated computer
or change its disk protection, save state, recording, or contents.

Implementation: [disk parser](src/disk-map.js), [explorer](src/disk-explorer.js).
References: the [CP/M 2.2 alteration guide](https://www.gaby.de/cpm/manuals/archive/cpm22htm/ch6.htm),
[TEAC FD-55FV specification, p.108](https://retrocmp.de/fdd/teac/TEAC_FD55-FV.pdf#page=10),
and the emulator's [disk adapter](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/disk.c).

### Inspecting bytes, files and changes

Click a hex byte (or use arrow keys) to see its image offset, C/H/R address,
allocation block, directory entry, extent and file offset. Allocation padding is
identified separately from record-rounded file contents. Free space remains blank.

**Preview file** chooses text or hex using a printable-byte heuristic; either mode
can be selected explicitly. The preview is limited to 64 KiB. **Download file**
reconstructs all extents in file order, including fragmented blocks and user areas,
and preserves every byte up to the 128-byte-record length. It does not strip a
Ctrl-Z EOF marker or padding. Missing extents prevent a complete download rather
than silently filling holes. **How this file is allocated** links directory entry
numbers → extents → allocation blocks; click a block to inspect its sectors.

Live snapshots briefly highlight observed sector changes in pink,
list changed directory entries and file names, and highlight affected allocation
rows. These are differences between snapshots, not a history of every write:
multiple writes (or a write followed by restoration) between samples may be missed.
Unallocated-to-unallocated changes are intentionally ignored. Disk replacement can
also produce differences. Inspection remains read-only.

**Show track in drive** opens the drive view with a green track ring and a white
nominal contact point. This overlay follows the disk’s display position, including
separation/removal, and uses the canonical model’s side-specific head radii. It
never commands a seek or changes drive mechanics. Clear it from the explorer.

Gap positions use the emulator's reference track layout, not recovered magnetic
timing. Gap clicks do not select a nearby payload sector. See the linked parser
and core adapter for layout constants and supported formats.

## Guest serial transfers

The V.24 panel provides a prepared guest disk and XMODEM controls. Mount the disk
writable, run `DACRX NAME.EXT`, then send a file. Follow the
[guest instructions](public/examples/robotron-v24/README.txt) for sending files back
with DACTX and for transfer limits. Receiver/transmitter source is MIT; stock-media
notices still apply. See the [capability matrix](docs/robotron/capabilities.md) for
qualification evidence and remaining serial limitations.
