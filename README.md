# DAC — Danila’s Archive of Computing

Current behavior and evidence: [Robotron capability matrix](docs/robotron/capabilities.md).

[PSU documentation in German, English and Russian](https://ddanila.github.io/dac/docs/robotron-psu/)
links the original service manual, circuit and board layouts, with source-checked
museum commentary and explicitly unqualified transistor replacement candidates.
See the [scope and maintenance guide](docs/robotron/psu-documentation.md).

Inspection guides cover [controls and debugging](docs/robotron/inspection-workbench.md),
[measurements and evidence](docs/robotron/inspection-workbench.md#measurements), and
[checkpoints and disk comparisons](docs/robotron/inspection-and-checkpoints.md).

In progress: [keyboard controller reconstruction and circuit review](docs/robotron/keyboard-controller-progress.md),
following the [synchronization plan](docs/robotron/keyboard-controller-plan.md).

*A museum of computers and the worlds they opened.*

A working browser prototype: rotate a computer, inspect its underside, click its case power button, and type on its live emulated screen. The museum uses pinned [DAC Emulation](https://github.com/ddanila/dac-emulation) WebAssembly cores in a worker.

[Open the public prototype](https://ddanila.github.io/dac/) · [Pinned emulator build](public/emulator/manifest.json)

## Try locally

Photo originals are stored in Git LFS. Install Git LFS, then run `git lfs pull`
for the complete local exhibit. For a lightweight clone, use
`GIT_LFS_SKIP_SMUDGE=1 git clone <repo-url>` and then
`node scripts/ci-photos.mjs` to fetch runtime/test references only. Deployment
fetches the complete archive; thumbnails and visual test baselines remain in Git.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The default Robotron exhibit boots the **historical S550 ROM and TOS/M 1.0 disk**. This is a tested reference configuration, not a dump of Danila’s exact machine. Wait for `A>`, then try `DIR`. Press **Power on**, then **Screen** to type. Juku and VJUGA have original pixel diagnostics. The small warm-colored switch on the 3D case also controls power. Front/rear/underside buttons provide alternatives to dragging.

`npm run build` produces a static `dist/` site. `DAC_BASE=/dac/ npm run build` builds for a GitHub project-site path. `npm test` runs the focused Chromium checks (install the browser once with `npx playwright install chromium`).

## Historical media

Power off and expand **Load your machine’s media**. Files stay in the browser.
Select a machine to see its supported firmware and disk inputs. The bundled
Robotron reference uses S550/287 and TOS/M; custom media must match the selected
machine profile. See the [media loader](src/historical-media.js) for validation.

The bundled disk is decoded from the original TeleDisk image, avoiding the damaged
`PIP.COM` in the archive's alternative raw image. See
[media conversion instructions](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m#tosm-media-recovery-and-the-pip-failure).
Historical firmware and OS media are excluded from DAC's MIT licence;
redistribution rights have not been established. See the
[media notice](public/media/robotron/NOTICE.txt) and [manifest](src/robotron-media.json).

Disk writes are off by default and affect only a session copy. Reset and power
cycling preserve it; without **Keep this session**, switching media/machines or
closing the tab discards it. **Export session disk** downloads a portable backup.

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

Original content is [MIT](LICENSE). Imported code retains the notices in
`public/emulator`; model licences are described in the
[asset guide](public/models/README.md#evidence-and-rights). See
[technical direction](docs/technical-direction.md) for repository boundaries.

## Operating the exhibit

Choose **Type** to keep the live display above the clickable 3D keyboard. **Inspect photo and details** opens the owner photograph for the current view; clicking a manufacturer plate or TEAC board label in **Drive labels** opens its specific photograph and transcription. Escape closes the photo panel.

The historical Robotron preset runs the **S600 keyboard firmware** on a second Z80. Host key press/release and modeled clicks operate a reference switch matrix; serial clocking, firmware modifiers and Caps/SI-SO state feed the running OS. Some printed shifted legends differ from S600. Custom media may supply a 2 KB keyboard ROM; omitting it retains the character adapter.

**Keep this session** provides automatic local disk copies and **Save state / Restore state** for all three machines. Disk copies survive reloads and are separated by media identity; whole-machine states require the same emulator build and write mode. Disk export is a portable backup; **Export state / Import state** moves a complete session between browsers running the same emulator build, original media and write settings. **Discard saved disk** removes the local copy; reload original media to start fresh. Writes remain opt-in. Floppy seek, rotation and byte pacing make boot slower; 4× speed is useful while waiting for `A>`.


**Drive B** accepts a second 800 KB raw image, a supported Robotron DSK, or an empty data disk. Power off to
insert/eject or change protection; copies persist independently. After a reload,
the inserted B disk and its protection are restored when persistence is enabled.
Use `DIR B:` and `PIP B:=A:PIP.COM`. Original files are untouched. Reset or warm-boot
the guest after a disk change, as its OS may cache directory data.

**Printer output** captures completed serial bytes, including control codes, and
exports a `.prn` file. The capture limit is shown in the panel; export and clear when full. Try `PIP LST:=AUTOEXC.SUB`. Printer readiness is adjustable; see the [workbench guide](docs/robotron/inspection-workbench.md#printer-and-controller-limits).

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

CI selection is owned by [ci-scope.mjs](scripts/ci-scope.mjs), with browser and
platform configuration in [the Pages workflow](.github/workflows/site.yml) and
Playwright configs. [Baseline validation](scripts/ci-baseline.mjs) prevents failed
or cancelled pushes from hiding untested changes; unknown scope falls back to
full coverage. Deployment requires the build and selected checks to pass.
Keep test inventories and duration estimates in their source files. Refresh timings
from a successful full main-branch run with
`node scripts/refresh-ci-durations.mjs RUN_ID` (requires authenticated `gh`).
Review the resulting JSON diff before committing; this changes placement, not coverage.

## Disk contents explorer

Choose **Explore disk A/B** or click a modeled diskette to inspect files, allocation
and raw sectors. Inspection is read-only; live updates sample the running disk
without pausing the computer. The TOS/M filesystem profile is explicit, not
automatic detection. See the [disk inspection guide](docs/robotron/disk-inspection.md)
for interpretation limits, file export and track overlays.

### Inspecting bytes, files and changes

The [disk inspection guide](docs/robotron/disk-inspection.md) covers byte navigation,
file previews and sampled changes. For comparisons with a retained image, use
[saved baselines](docs/robotron/inspection-and-checkpoints.md#persistent-disk-comparisons).

## Guest serial transfers

The V.24 panel provides a prepared guest disk and XMODEM controls. Mount the disk
writable, run `DACRX NAME.EXT`, then send a file. Follow the
[guest instructions](public/examples/robotron-v24/README.txt) for sending files back
with DACTX and for transfer limits. Receiver/transmitter source is MIT; stock-media
notices still apply. See the [capability matrix](docs/robotron/capabilities.md) for
qualification evidence and remaining serial limitations.

## Classic 1715 workstation

Select **Robotron 1715 + Pico1715** for the source-built CP/M 3 workstation,
with browser controller-model and firmware/FPGA backends, local disk copies
and a debugger. See the [classic workstation guide](docs/robotron/classic-workstation.md).

## Analyzer workbench

Open [the analyzer](https://ddanila.github.io/dac/analyzer.html) to inspect compact
bus captures or raw waveforms, compare controller activity, and download captures
through the existing Pico1715 USB protocol where Web Serial is available. See the
[workflow, limits and verification](docs/robotron/analyzer-workbench.md).
