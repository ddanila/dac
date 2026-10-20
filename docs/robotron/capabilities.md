# Robotron capability and evidence matrix

Use the [pinned emulator manifest](../../public/emulator/manifest.json) and model
source manifests for current versions. This matrix describes behavior and limits.

| Subsystem | Implemented and checked | Remaining boundary | Evidence/check |
|---|---|---|---|
| CPU/memory | Z80 execution and CAS-PROM read/write banking | No specimen bus trace comparison | Native machine/device, historical MAME and WASM parity tests |
| Display | Scheduled byte fetches, burst gaps, FIFO, scanline-sampled glyphs/cursor/intensity | Ideal local DACK, no dot-level contention or verified CPU IRQ wiring | `robotron_devices_test.c`; historical MAME monochrome raster comparison |
| DMA | Addressing, search, WAIT, terminal count, interrupts, timed read/write phases, auto-restart and byte/burst/continuous ownership | Half-clock BUSRQ/BUSAK edges, pulse output and exhaustive silicon qualification absent | Native device tests; implementation in `robotron.c` |
| Keyboard | Unpatched S600 CPU, matrix, serial packets, Caps/SI/SO LED latches | Specimen replacement EPROM and legend differences not identified | S600 ROM tests; owner keyboard photos |
| Serial/printer | Clocked keyboard input, serial receive/transmit with error and interrupt handling, V.24 peers and raw capture, printer readiness | Independent RX/TX diagnostic edges available; browser external clock and synchronous modes absent; TX x1 half-stop rounding; printer-specific escape language absent | `sio.c`; printer integration checks |
| Floppy | Independent mechanics, DSK/raw, timed searches/bytes, errors, writes, format | Reference trajectories; no flux/PLL, weak sectors or specimen measurements | `DRIVE-FIDELITY.md` and native/WASM tests |
| Enclosures | Owner-referenced 1 mm sheet, bends, split monitor/keyboard/system shells | Local bend radii and hidden joins remain estimates | Canonical CAD/evidence and static intersections |
| Boards | Owner-referenced packages, sockets, holes, supports and artwork | Artwork is not a verified netlist; some orientations/mounts unresolved | CAD hardware audit and calibration reports |
| Sound | Owner power/fan/key recordings; synthesized drive activity | Unmeasured spatial/acoustic response and drive timbre | Audio manifest and playback tests |
| Persistence | Checksummed named checkpoints with both disks; collection preview/selective restore; disk copies, portable states, preserved old cores, replay | Checkpoint firmware must match (including supplied custom ROMs); quick-save states/mounts keep or replace | Session/portable/replay checks |

For keyboard circuit scope and source-bound results, see the
[controller status and workflow](keyboard-controller-progress.md).

## Inspection and recovery

- [Workbench](inspection-workbench.md): debugger, cutaways, measurements and evidence.
- [Checkpoints and recovery](inspection-and-checkpoints.md): portable states,
  graphics recovery, triggered captures and disk comparisons.
- [Inspection workspaces](inspection-workspaces.md): saved views and collection backups.
- [Diagnostic and model review](diagnostics-and-model-review.md): reports,
  measurement remapping, sound and mechanical review.

## Specimen inventory still requiring physical evidence

The system boot ROM, CAS PROM and transplanted keyboard EPROM need dumps and
hashes. Board revision/straps, drive suffix/jumpers, oscillator frequencies,
monitor adjustments and physical timing need identification or measurements.
Owner pictures establish appearance, not firmware contents or circuit continuity.
Reference software tests do not identify unread specimen ROMs. Exhaust existing
photos and published references before requesting new measurements. Model visual
approval never changes a part's separate **printed and verified** classification.

## Qualification strategy

Run focused native device tests for core changes, bounded historical-ROM tests for
keyboard changes, geometry checks for affected interfaces, and browser interaction
checks for changed controls. Larger native/WASM application and cross-browser
checks belong at release boundaries. Controller circuit changes additionally use
the HDL and electrical gates in the [controller plan](keyboard-controller-plan.md).

Independent comparison should use explicit input events and compare observable
I/O, memory and screen checkpoints. Differences against another emulator are
investigation leads, not proof that either implementation matches hardware.

## Current museum tools and evidence

- **Transfers:** DACRX and DACTX provide both directions through guest SIO
  software. Follow the [guest instructions](../../public/examples/robotron-v24/README.txt);
  [qualification](transfer-qualification.json) owns tested scenarios.
  CP/M padding remains in downloads; checksum XMODEM cannot infer original byte
  length or distinguish every arbitrarily delayed duplicate acknowledgement.
- **Timeline:** opt-in, bounded actual bus events: I/O, interrupt acknowledgement,
  DMA reads/writes, physical memory offsets and contemporaneous FDC context. Select
  a chip or the disk track; export JSON. Context is labelled separately from an
  assertion that a particular event accessed that disk sector. No pin-waveform or
  verified-netlist claim.
- **Photo review:** manual overlays plus planar perspective fitting and independent
  holdout landmarks. Training and holdout RMS are separate. Export includes raw
  points, viewport and projection. Lens distortion and depth remain unresolved;
  pixel residuals do not establish millimetres or physical print verification.
- **Loading:** the exact geometry cache retains an STL fallback.
  [Loading experiments](loading-experiments.json) do not justify changing defaults.
  Reproduce optional packs with
  `node scripts/pack-geometry-cache.mjs`, then profile `?geometryPacks`; add
  `geometryWorker` for worker decompression/bounds. Generated packs are experimental
  derived assets, not canonical models. Heap measurements omit GPU/worker memory.
CI scope and maintenance are documented in the [root guide](../../README.md#model-review-and-ci).

See [reference workflows](capability-history.md) for S600 mapping and preservation packaging.

See [emulation qualification](emulation-qualification.md) for independent
comparisons, reproducible checks and specimen evidence collection.
