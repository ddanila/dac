# Keyboard controller implementation record

Fifth implementation pass, 2026-10-17. Digital reference qualification passes,
and the museum consumes KiCad-derived DIP placement, pads, outline and artwork.
The [plan](keyboard-controller-plan.md) remains incomplete: physical routing,
discrete component identification and specimen measurements are still open.

## Current revisions

| Repository | Delivered | Revision |
| --- | --- | --- |
| `3d-models` | 70-component schematic, reviewed reset/cable connections and bridges, nine photo-aligned DIP packages, underside registration audit and regenerated museum geometry | `78feb53` |
| `dac-emulation` | Reviewed CAD pin, generated bridge isolation and external stimulus tests, passing bus/TV80 qualification; runtime stays core 0.17.0, snapshot layout 15 | `8052c32` |
| `dac` | Compatible CAD/core pins, archived 0.16.0 snapshots, raw latch diagnostics, placement residuals and accurate qualification status | This change |

Full-resolution owner photos establish **05-330-4102-8 1c**, correcting the former
model-derived board identifier. The kbdbabel drawing names this family but uses
RD for the output clock where Zander uses WR, and names a different ROM type.
The implemented electrical reference remains explicitly Zander's drawing. Neither
successful co-simulation nor matching board markings resolves that disagreement.

## What the fifth pass closes

A8 orientation is now supported by the visible package notch and pin-one dot above
the blue tape. Four corner-lead landmarks and four held-out right-side leads fit
within 1.11 mm of the nominal PCB plane. The footprint moved about 6 mm toward
the CPU, and the generated ROM body, socket, cover, ink, pads and holes follow it.
All nine DIP packages now have top-photo landmark checks. A8's socket still hides
bare PCB hole centres; the replacement EPROM identity remains unread.

The new underside audit uses four numbered A1/A8 anchor pads and six independent
A1/CPU check pads, preserving the reflection into the top-view coordinate frame.
CPU corner checks are approximately 1.0–1.1 mm; A1:7 and A1:8 exceed the 1.25 mm
tolerance at approximately 1.66 and 1.46 mm. The report and original-photo SVG
retain these failures. The museum exposes them for selected components. This is
relative registration to estimated PCB placement, not metrology, and no copper or
existing artwork was reassigned or transformed. Further cross-side registration
work is required before tracing can be promoted as electrical copper.

`bottom-landmarks.json` is the observation record;
`generated/bottom-registration.json` and `.svg` are derived outputs. Freshness
checks now include the underside photo and the registration code. A regression
check rejects reusing an anchor as a held-out check. Ten fast CAD checks and the
KiCad arc/via/net-mismatch integration test pass. Six Chromium and twelve
Firefox/WebKit controller checks pass, as do the production build and reviewed
visual regression. CAD CI is green. Connectivity is unchanged.

## What the fourth pass closed

A4's original top-photo annotation placed the two final-lead landmarks above the
actual last leads. Re-reading all ten leads on each side corrected those points
and added four held-out intermediate leads. The native 8282 footprint now follows
that reviewed fit: center (54.806, -8.970) mm, rotation -0.109 degrees, maximum
residual **0.554 mm**, including held-out points. The tolerance remains 1.25 mm.
All eight annotated DIP packages now pass with independent check landmarks.
The photo overlay was visually reviewed; this remains nominal photo alignment,
not metrology, and does not qualify A8 or underside registration.

DIP body, leads, pads, holes, solder and artwork-dependent model geometry are
regenerated from the PCB. Schematic connectivity is unchanged, so the existing
qualified HDL reference remains applicable. DRC still reports 234 airwires and
zero other violations. Nine CAD tests, five controller browser tests, the production
build and canonical metadata checks pass. Top and underside renders were reviewed;
the controller visual baseline now records the corrected footprint. Unrelated
drive and motherboard structural baselines still match.

## What the third pass closed

The independent drawing review found errors outside the earlier digital peripheral
comparison. Corrections now carried through the native schematic, PCB pad nets,
generated HDL and museum metadata are:

- Reset circuit: V3.1 collector to +5V; V3.2 collector to V4.9 base; R5 to V3.2
  base; V1.2 anode to C2 positive; C1 lower terminal to the reset output.
- BR1/BR2: explicit two-terminal components separate oscillator/CPU clock and
  reset-circuit/CPU RESET nets. Reference state is closed; physical locations and
  specimen bridge construction remain unverified.
- X1:A9 and R6.5: BUSRQ, separate from CLK and the WAIT/INT/NMI pullup net.
- Cable filtering: L1.1 is clock to XT1:B2; L1.2 is ground to XT1:A3; L1.3 is
  +5V to XT1:B4; L1.4 is data to XT1:A1. The previous clock/ground terminal
  assignment and winding references were wrong.

Generated `controller_service` wiring supports opening BR1/BR2 and injecting
clock/reset at the CPU side. Thirteen HDL checks cover source isolation, external
stimulus, floating reset, the clock pullup and conflicting drivers. The firmware
HDL CPU now receives its reproducible clock/reset through these open bridges.
This is a virtual electrical test, not a documented factory procedure or a
qualification of the analog source circuits. The museum explains the distinction
when either bridge is selected. Bridge endpoint metadata is checked against the
schematic during synchronization.

The [1985 Robotron service handbook](https://www.tiffe.de/Robotron/PC1715/PC-1715-Servicemanual.pdf#page=91),
printed pp. 89–92, independently supports WR-based serial synchronization and
specifies an approximately 100 ms power-on reset and a 700 kHz ±10% clock. The
emulator's 683 kHz setting is within that reference range. Oscillator gate pins,
component references and capacitance differ from Zander, so the handbook is not
silently merged into the reconstructed circuit. It strengthens the WR reference;
physical continuity must still establish the specimen's wiring.

Photo-fit application now rejects failing held-out landmarks and unknown component
references before writing the PCB. Nine fast CAD tests cover these guards, reset
and bridge topology, cable pin assignments and existing export checks. The KiCad
integration test still checks curved copper/vias and deliberate pin/net mismatch.

The rerun retains **131,072 bus transactions with zero differences**, **390 serial
bits** and **11,971 LED state records** in agreement. CPU phase offsets remain
unchanged; the production runtime was not changed in this pass.

The reviewed controller image is unchanged. KiCad save rounding moved two pad
coordinates by one nanometre; regenerated mesh deduplication removed one vertex
without changing triangles or bounds. The strict structural baseline was updated
after inspection.

The inventory is now **70 components, 59 unplaced, 234 airwires and zero assigned
copper segments**. The extra two unplaced components are the newly explicit
bridges. ERC retains only the two documented isolated labels; other DRC violations
remain zero. Those counts expose remaining work rather than claiming that an
unrouted board has become complete.

## What the second pass closed

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

Third pass: nine fast CAD checks, the KiCad integration check, 13 bridge isolation
checks, common/full bus audits and the complete TV80/S600 comparison pass. Seven
focused Chromium/CI-selection checks and ten Firefox/WebKit controller checks
pass. The production build and reviewed visual regression pass. Production C/WASM
behavior is unchanged; earlier runtime validation below remains source-bound to
core 0.17.0. CAD CI also passes for the new revision.


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

## Completion criteria

| Requirement | Current result |
| --- | --- |
| Schematic/PCB pin agreement and export freshness | Passing |
| Reference digital bus and firmware comparison | Passing within documented scope |
| Bridge isolation and external clock/reset stimulus | Passing digital tests |
| KiCad DIP geometry propagated to OpenSCAD and museum | Implemented; discrete parts remain |
| Both photo sides registered to numbered pads | Incomplete; underside fails two independent pad checks |
| Visible copper reconciled with named nets | Incomplete; 294 artwork segments remain unassigned |
| First data/clock path traced through actual copper | Incomplete |
| Specimen ROM identity and timing | Awaiting planned dumps and measurements |

The plan cannot be marked complete while physical copper remains unassigned.
Passing reference tests and a synchronized model are substantial milestones, but
are not evidence of historical trace accuracy.

## Remaining work against the plan

| Phase | Remaining requirement |
| --- | --- |
| Identity/evidence | Resolve specimen clock wiring and ROM identity; identify remaining physical parts |
| Schematic | Reset topology and BR1/BR2 are explicit; review physical discrete pin maps, specimen substitutions and bridge state |
| PCB | Resolve underside registration and A8 socket-to-hole alignment, place 59 components, trace and assign actual copper, reconcile 234 airwires |
| OpenSCAD | Migrate remaining discrete parts and qualify pad/lead interfaces and physical dimensions |
| Co-simulation | Resolve CPU phase timing if cycle equivalence is required; qualify analog and contention boundaries |
| Museum/sync | Extend verified net geometry and signal mappings as physical reconstruction progresses |

The data/clock path now has passing reference logic and synchronized geometry,
but its physical copper continuity remains unresolved. Specimen ROM dumps and
timing measurements remain planned. Software consistency cannot substitute for
those measurements or for reviewing the remaining visible/hidden routes.
