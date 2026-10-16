# Keyboard controller implementation record

Second implementation pass, 2026-10-16. Digital reference qualification now passes,
and the museum consumes KiCad-derived DIP placement, pads, outline and artwork.
The [plan](keyboard-controller-plan.md) remains incomplete: physical routing,
discrete component identification and specimen measurements are still open.

## Current revisions

| Repository | Delivered | Revision |
| --- | --- | --- |
| `3d-models` | 68-component schematic; native PCB; photo landmark review; generated detailed OpenSCAD packages; migrated museum DIP geometry; export and browser freshness checks | `9d1ca8a` |
| `dac-emulation` | Corrected reference decoding, raw/display LED separation, memory-write serial clocks, independent TV80 qualification; core 0.17.0, snapshot layout 15 | `911cf46` |
| `dac` | Compatible CAD/core pins, archived 0.16.0 snapshots, raw latch diagnostics, placement residuals and accurate qualification status | This change |

Full-resolution owner photos establish **05-330-4102-8 1c**, correcting the former
model-derived board identifier. The kbdbabel drawing names this family but uses
RD for the output clock where Zander uses WR, and names a different ROM type.
The implemented electrical reference remains explicitly Zander's drawing. Neither
successful co-simulation nor matching board markings resolves that disagreement.

## What the second pass closes

### Reference digital comparison

The previous 57,101 bus mismatches were emulator differences from the reference
circuit, not grounds for changing the schematic to match the emulator. Corrections:

- Every I/O access clocks the LED latches; A15 controls the 8282 output enable.
- A15-high addresses read the matrix; active contacts combine with OR.
- WR clocks serial output for memory writes as well as I/O writes.
- Repeated callback ticks do not generate duplicate serial strobes.

The expanded audit passes **131,072 transactions with zero differences**: 65,536
I/O reads, 32,768 I/O writes and 32,768 memory writes. A15-high writes remain outside
the model because CPU and latch drivers can contend on the physical data bus.

Independent TV80 and C CPU runs produce identical **390 serial bits and 11,971
raw LED state records** over 4.6 million CPU clocks. Coverage requires normal,
Shift, Ctrl, REP repeats, quiet after REP release, and typing after reset. Coarse
LED samples also agree. Full bus auditing is now an ordinary CI check.

This is scoped logical equivalence. Serial timestamps differ by two clocks;
LED transition offsets depend on CPU callback phase, with separate initialization
and reset settling offsets. The report retains their histogram and explicitly
marks cycle equivalence false. Oscillator, analog front-end thresholds, reset
transients, contact resistance and propagation delay are not qualified.

The production latch value is raw electrical state. Display indicators use a
separate **2 ms peak hold**, explicitly a visualization approximation. It prevents
short scan-time lows from becoming frame-rate flicker and never feeds the circuit.
The museum review shows both values separately. Snapshot layout 15 preserves the
hold state; core 0.16.0 is archived for older sessions.

### Physical alignment and model synchronization

Numbered top-photo lead landmarks now cover eight DIP packages, with held-out
check points for seven. Seven placements meet a **1.25 mm photo-review tolerance**
after rigid fitting. This is a nominal photo registration, not dimensional
metrology. A4 (8282) still fails; its inherited placement was retained. A8 and
discrete pin orientation remain unqualified. Reference designators do not by
themselves establish specimen electrical identity.

The native PCB now drives the museum's DIP positions, orientations and pin counts,
CPU/ROM socket transforms, associated ink, DIP pads/holes, outline and controller
artwork. A1/A6 are correctly represented as DIP-14 rather than DIP-16. Existing
pinned KiCad body/lead meshes are reused. Generic procedural fanouts were removed.
The 294 photo-artwork segments remain unassigned graphics, not verified copper.
Other discrete and mechanical visuals remain estimates pending reconstruction.

Reference labels now belong to F.Fab; evidence fields are hidden metadata rather
than invented historical silkscreen. DRC has **zero other violations but 233
unconnected items**. There are still **57 unplaced reference components and zero
assigned copper segments**. This is not a fabrication-ready board.

The export checks every numbered PCB pad/net against the schematic. Source hashes
bind the photo evidence, native PCB, generated geometry, HDL and qualification
reports. Browser metadata additionally binds the consumed SCAD sources; a partial
export cannot silently bless stale controller meshes with new source hashes.

## Validation

- Native device/runtime tests, Python verification, AddressSanitizer and
  UndefinedBehaviorSanitizer pass.
- WASM lifecycle, snapshot, clock and peripheral fixtures pass.
- Optional S600 keyboard and mixed DMA/printer/V24 snapshot workloads pass.
- Common subset and full bus/firmware co-simulation pass within the scope above.
- Six fast CAD checks and the KiCad arc/via/pad-mismatch integration test pass.
- Detailed OpenSCAD review renders with the Manifold backend without errors.
- Canonical model/download metadata checks pass; CAD and core CI pass.
- 26 focused Chromium checks, eight controller checks across Firefox/WebKit,
  and preserved 0.16.0 snapshot restoration pass. The panel tests distinguish
  raw latch values from display persistence. Controller checks are included in
  model-only CI selection as well as the full suite.
- Eight historical browser checks pass, including S600 DIR input, mid-write
  snapshot continuation, file editing/checkpoint recovery and WordStar save/reopen.
- Visual review confirms the controller migration; unrelated drive and motherboard
  views retain their geometry. Unassigned artwork is clipped at the board edge
  only for museum rendering; native review preserves registration overshoot.

## Review and reproduce

Open **Keyboard controller circuit review** in the museum. Select a component or
net for numbered pins, estimated pad positions, unplaced components and available
photo-alignment residuals. Cyan lines have no net assignment. Both board sides use
one top-view coordinate frame. Links identify exact pinned source revisions.

From the canonical CAD controller directory:

```sh
python3 tools/export.py --check
python3 tools/test_export.py
python3 tools/photo_registration.py
# The following require KiCad's Python/pcbnew:
python3 tools/export.py
python3 tools/test_kicad.py
openscad --backend=Manifold -o /tmp/controller.stl review.scad
```

`generated/photo-registration.svg` overlays PCB pads (red) and observed landmarks
(green) on the original photo. `photo_registration.py --apply --refs A1 ...` applies
explicitly selected acceptable fits to the native PCB; regenerate afterward.

From `dac-emulation`:

```sh
make test-keyboard-controller audit-keyboard-controller
make qualify-keyboard-controller S600_ROM=/path/to/s600.bin
make test-s600-workload S600_ROM=/path/to/s600.bin
```

Logs, vectors and optional VCD waveforms remain under `build/keyboard-controller/`;
committed qualification reports live in `verification/robotron-keyboard/reports/`.
After a schematic change, use `sync_reference.py`, rerun comparisons and commit
reports. A geometry-only change does not require a different connectivity hash.

After committing compatible sources, refresh museum assets with:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
python3 scripts/sync-keyboard-controller.py ../3d-models ../dac-emulation
npx playwright test tests/keyboard-controller.spec.js --workers=1
```

These checks reject dirty source repositories, stale exports, inconsistent
connectivity and reports whose implementation/CPU/header hashes have changed.

## Remaining work against the plan

| Phase | Remaining requirement |
| --- | --- |
| Identity/evidence | Resolve specimen clock wiring and ROM identity; identify remaining physical parts |
| Schematic | Review analog circuitry and explicitly reconstruct BR1/BR2 jumper configuration |
| PCB | Resolve A4/A8 placement/orientation, place 57 components, trace and assign actual copper, clear 233 airwires |
| OpenSCAD | Migrate remaining discrete parts and qualify pad/lead interfaces and physical dimensions |
| Co-simulation | Resolve CPU phase timing if cycle equivalence is required; qualify analog and contention boundaries |
| Museum/sync | Extend verified net geometry and signal mappings as physical reconstruction progresses |

The data/clock path now has passing reference logic and synchronized geometry,
but its physical copper continuity remains unresolved. Specimen ROM dumps and
timing measurements remain planned. Software consistency cannot substitute for
those measurements or for reviewing the remaining visible/hidden routes.
