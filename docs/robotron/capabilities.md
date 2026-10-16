# Robotron capability and evidence matrix

Current baseline: DAC Emulation 0.16.0, scanline output, snapshot layout 14;
canonical model v48. This matrix describes present behavior. Dated development
sections elsewhere are history, not cumulative lists of current limitations.

| Subsystem | Implemented and checked | Remaining boundary | Evidence/check |
|---|---|---|---|
| CPU/memory | Shared Z80; 256 KiB; CAS-PROM read/write banking | No specimen bus trace comparison | Native machine/device, historical MAME and WASM parity tests |
| Display | Scheduled byte fetches, burst gaps, FIFO, scanline-sampled glyphs/cursor/intensity | Ideal local DACK, no dot-level contention or verified CPU IRQ wiring | `robotron_devices_test.c`; historical MAME monochrome raster comparison |
| DMA | Addressing, search, WAIT, terminal count, interrupts, timed read/write phases, auto-restart and byte/burst/continuous ownership | Half-clock BUSRQ/BUSAK edges, pulse output and exhaustive silicon qualification absent | Native device tests; implementation in `robotron.c` |
| Keyboard | Unpatched S600 CPU, matrix, serial packets, Caps/SI/SO LED latches | Specimen replacement EPROM and legend differences not identified | S600 ROM tests; owner keyboard photos |
| Serial/printer | Clocked keyboard RX; per-character error FIFOs on both channels; 5–7-bit receive parity/padding; V.24 CTS/DCD/BREAK interrupts, first-character error lock, independent incoming waveform and outgoing peer decoder; raw capture; printer CTS readiness and external/status interrupts | Independent RX/TX diagnostic edges available; browser external clock and synchronous modes absent; TX x1 half-stop rounding; printer-specific escape language absent | `sio.c`; printer integration checks |
| Floppy | Independent mechanics, DSK/raw, timed searches/bytes, errors, writes, format | Reference trajectories; no flux/PLL, weak sectors or specimen measurements | `DRIVE-FIDELITY.md` and native/WASM tests |
| Enclosures | Owner-referenced 1 mm sheet, bends, split monitor/keyboard/system shells | Local bend radii and hidden joins remain estimates | Canonical CAD/evidence and static intersections |
| Boards | Owner-referenced packages, sockets, holes, supports and artwork | Artwork is not a verified netlist; some orientations/mounts unresolved | CAD hardware audit and calibration reports |
| Sound | Owner power/fan/key recordings; synthesized drive activity | Unmeasured spatial/acoustic response and drive timbre | Audio manifest and playback tests |
| Persistence | Checksummed named checkpoints with both disks; collection preview/selective restore; disk copies, portable states, preserved old cores, replay | Checkpoint firmware must match (including supplied custom ROMs); 20 named checkpoints; quick-save states/mounts keep or replace | Session/portable/replay checks |

## Inspection and recovery

[0.14.0 inspection and checkpoint guide](inspection-014.md): execution targets,
changed-state highlights, reproducible measurements, draggable sections, individual
checkpoint files, mechanical audit and serial clock qualification.


[Inspection workbench and debugger](inspection-workbench.md): grouped controls,
cutaway presets/plane guide, shell caps, model-derived measurements, instruction
stepping, mapped memory/disassembly and bus-event stops. Printer readiness is
recorded and preserved in checkpoints.

[Checkpoint and inspection guide](inspection-and-checkpoints.md): recover WebGL
without restarting the emulator; section planes and shareable inspection links;
explicit keyboard inspection mode; bounded triggered bus capture; persistent
original/checkpoint disk comparisons. Optional caps close unambiguous shell contours; open/tangent/oversized contours are skipped. Event capture is
emulated, and disk reports explicitly mark unsupported layouts or range limits.

## Specimen inventory still requiring physical evidence

The system boot ROM, CAS PROM and transplanted keyboard EPROM need dumps and
hashes. Board revision/straps, drive suffix/jumpers, oscillator frequencies,
monitor adjustments and physical timing need identification or measurements.
Owner pictures establish appearance, not firmware contents or circuit continuity.
No software-only test can resolve these identities. Model visual approval never
changes a part's separate **printed and verified** classification.

## Qualification strategy

Run focused native device tests for core changes, bounded historical-ROM tests for
keyboard changes, geometry checks for affected interfaces, and browser interaction
checks for changed controls. Larger native/WASM application and cross-browser
checks belong at release boundaries. No full Verilog run is required.

Independent comparison should use explicit input events and compare observable
I/O, memory and screen checkpoints. Differences against another emulator are
investigation leads, not proof that either implementation matches hardware.

## Current museum tools and evidence

- **Transfers:** DACRX and DACTX provide both directions through real guest SIO
  software. `transfer-qualification.json` records a binary TOS/M round trip,
  bad-checksum retry and duplicate-block handling. Browser protocol tests cover
  number wrap, repeated EOT and record padding. Deadlines advance with emulated
  CPU clocks. Reset/capture reset cancels the active transfer. CP/M padding remains
  in downloads; checksum XMODEM cannot infer original byte length or distinguish
  every arbitrarily delayed duplicate acknowledgement.
- **Timeline:** opt-in, at most 512 actual bus events: I/O, interrupt acknowledgement,
  DMA reads/writes, physical memory offsets and contemporaneous FDC context. Select
  a chip or the disk track; export JSON. Context is labelled separately from an
  assertion that a particular event accessed that disk sector. No pin-waveform or
  verified-netlist claim.
- **Photo review:** manual overlays plus planar perspective fitting and independent
  holdout landmarks. Training and holdout RMS are separate. Export includes raw
  points, viewport and projection. Lens distortion and depth remain unresolved;
  pixel residuals do not establish millimetres. The three rendered regressions pass;
  no CAD dimensions or printed-and-verified classifications changed.
- **Loading:** current default retains the exact geometry cache and STL fallback.
  Cache pipeline identity is now checked. `loading-experiments.json` compares three
  cold runs with 11 transport packs, worker decoding and a throttled mobile viewport.
  Measurements do not justify changing defaults. Reproduce optional packs with
  `node scripts/pack-geometry-cache.mjs`, then profile `?geometryPacks`; add
  `geometryWorker` for worker decompression/bounds. Generated packs are experimental
  derived assets, not canonical models. Heap measurements omit GPU/worker memory.
- **CI:** scope from a successful ancestral push, not the immediately previous push.
  Missing evidence/PRs select full coverage. Fail-fast and cancellation of superseded
  runs remain enabled. File-duration estimates come from successful run 38891503217;
  `scripts/update-ci-durations.mjs` refreshes them from downloaded logs without a
  new CI run. Ordinary CI does not install MAME or run Verilog/historical ROM boots.

See [historical qualification notes](capability-history.md) for prior releases.

See [0.15 inspection and bounded diagnostic changes](inspection-015.md) for the
current checkpoint metadata, named measurements, evidence mode and motion audit.

Portable inspection views, staged covers and the expanded qualification are
documented in [inspection workspaces](inspection-workspaces.md).

[Diagnostic reports and model review](diagnostics-and-model-review.md) documents
independent sound levels, mechanical relationships, explicit measurement remaps,
monitor cable qualification and the optional S600 mixed-workload target.

[Current qualification and specimen inventory](emulation-qualification.md) documents
0.16.0, independent historical/application/serial comparisons, stronger browser workflows,
and the physical evidence still needed.
