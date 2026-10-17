# Keyboard controller implementation record

Eighteenth implementation pass, 2026-10-17. Digital reference qualification passes,
and the museum consumes KiCad-derived DIP placement, pads, outline and artwork.
The [plan](keyboard-controller-plan.md) remains incomplete: physical routing,
discrete component identification and specimen measurements are still open.

## Current revisions

| Repository | Delivered | Revision |
| --- | --- | --- |
| `3d-models` | 70-component schematic, reviewed reset/cable connections and bridges, nine photo-aligned DIP packages, corrected underside observations, enforced copper provenance the first partial A1:1 top route, local A4 audit, corrected A2 identities twelve native resistor placements and five reset resistor candidates | `b6ba8d5` |
| `dac-emulation` | Reviewed CAD pin, bridge tests, automatic failure waveforms and passing bus/TV80 qualification; runtime stays core 0.17.0, snapshot layout 15 | `cdda844` |
| `dac` | Compatible CAD/core pins, archived 0.16.0 snapshots, raw latch diagnostics, placement residuals, assigned-route 3D highlighting and accurate qualification status | This change |

Full-resolution owner photos establish **05-330-4102-8 1c**, correcting the former
model-derived board identifier. The kbdbabel drawing names this family but uses
RD for the output clock where Zander uses WR, and names a different ROM type.
The implemented electrical reference remains explicitly Zander's drawing. Neither
successful co-simulation nor matching board markings resolves that disagreement.

## What the eighteenth pass adds

R3 and R4.1 now have native KiCad placements. Their right leads share a visible
top-side connection, and +5V is their only common net in the reference schematic.
That supports pin 1 orientation without relying on the failing global underside
fit. Their opposite reset-node assignments remain reference-derived, not measured
continuity. The shared visible copper itself is not yet a native routed track.

The two corresponding legacy resistor estimates were removed; native pad geometry
now drives bodies, leads, lands, holes and the photographed collar ends. No
previously placed component moved. Twelve resistors are native and 47 components
remain unplaced. R5 and the lower four reset resistors remain photo candidates;
the missing seventh reset resistor is still a model gap.

Sixteen export checks and the native KiCad integration test pass. Connectivity
and the existing eight copper sections remain unchanged, retaining the reference
HDL qualification. Museum candidate-photo coverage now exercises R5 rather than
the newly placed R3. All thirteen controller browser tests and the production
build pass. The twelve review views render; the changed controller geometry was
reviewed and its visual baseline updated. All three strict visual regression
checks and CAD CI pass.

## What the seventeenth pass adds

Museum component inspection now displays original specimen-photo crops for the
seven reset resistor candidates and BR1/BR2. The crop uses the recorded original
pixel endpoints, with unnumbered circles at the observation uncertainty radius
and a link to the full original photo. This makes the physical evidence directly
reviewable alongside the reference circuit. Candidate endpoints never enter the
pad positions or electrical highlights; the components remain unplaced.

The reset underside comparison did not establish reliable physical terminal
order, so no new net assignment was made. Thirteen controller browser tests pass,
including selection changes, clearing, photo rendering and separation from
net-connected pads. The production build passes, and the R3 crop was visually
reviewed against its lead ends. CAD and HDL revisions remain unchanged.

## What the sixteenth pass adds

The factory placement drawing and original top photo identify seven reset-side
resistors: R3, R4.1, R5, R6.1, R4.2, R7 and R8. Their fourteen lead positions,
observed blue collar ends and four readable value markings are now recorded in
canonical component evidence. Pixel pairs use photographic left/right order,
not schematic pin numbers. Physical terminal order remains unresolved.

This review exposes a model omission: only six legacy resistor placements exist
in that area. The eventual native migration must replace those six with all
seven photographed components. No pad or net assignment was inferred from that
legacy geometry. The reference supply-side and ground-side groups require
separate continuity review before native placement; the underside registration
limits still apply.

All sixteen export tests, model/download metadata checks and twelve controller
browser tests pass. Generated
geometry and connectivity are unchanged, so the unplaced count remains 49 and
existing HDL qualification still applies. Museum metadata and editable downloads
include the observations; this is evidence progress, not completed PCB placement.

## What the fifteenth pass adds

All eight R9 sensing resistors are now native PCB footprints, ordered according
to the factory placement drawing and positioned from photographed lead ends.
Their row/base terminal assignments remain reference-derived: the matrix-facing
lower lead is pad 1 and the transistor-facing upper lead pad 2. Hidden continuity
has not been measured. Their original pixel observations and limits are retained
in component evidence and the separate direct-placement photo report.

The eight legacy placement entries were removed. Native pad geometry now drives
the bank's bodies, leads, holes and lands. For all ten migrated resistors, one
blue collar is rendered at the photographed end, including the reversed collar
on R9.7. This corrects the former symmetric two-band appearance; it is not an
assertion of electrical polarity or a resistance reading.

The unplaced count falls from 57 to 49. No previously placed component moved;
connectivity, eight assigned copper sections, 234 airwires and one dangling
endpoint remain unchanged. Sixteen export tests and the native KiCad integration
test pass, as do model/download checks. The photo overlay was inspected against
all sixteen bank lead ends. Reference HDL qualification remains applicable.
Twelve controller browser tests, the production build and CAD CI pass. All twelve
review views render; the three strict visual regression checks pass after
reviewing and updating only the controller baseline.

## What the fourteenth pass adds

R10.1 (clock pull-up) and R10.2 (data pull-up) now have native KiCad placements
from photographed lead endpoints and factory placement identities. Pad 1 is
assigned to the shared supply-side lower lead, supported by the visible underside
connection toward A1:14. The upper signal paths disappear into the A1 region;
pad 2 net identity remains reference-derived. Values, body/hole dimensions and
nominal photo scale are not specimen measurements or continuity qualification.

OpenSCAD now derives these resistors' centres, angles, lead spacing, board holes
and pad dimensions from the native PCB. The two separate legacy placement entries
were removed while retaining the existing resistor body/lead shapes. The photo
report and overlay include the new lead endpoints, explicitly marked as direct
placement with no independent held-out validation. Component evidence is now
pinned in the museum sidecar and displayed when selecting a component.

The unplaced count falls from 59 to 57. No previous placed component moved, no
schematic net changed, and the 234 airwires and single dangling track remain.
Fifteen export tests, the native KiCad integration test and model/download checks
pass. The existing HDL qualification applies to unchanged connectivity. Twelve
controller browser tests, the production build and CAD CI pass. All twelve
review views render; the three strict visual regression checks pass after
reviewing the resistor change and updating only the controller baseline.

## What the thirteenth pass corrects

The factory schematic's twelve A2 NAND gates agree with the reconstructed
netlist, resolving the location-label discrepancy as a reconstruction placement
error. A2.1 belongs across from A1 on the cable side of X1; A2.2 belongs beyond
X1 on the A4 edge; A2.3 belongs beyond X1 on the CPU edge. The native footprint
poses and their photo-landmark records now follow those identities. Stable
component references, pin numbers, schematic nets and HDL wiring are unchanged.
Only the three A2 placed records changed; no unrelated package was moved.

`evidence.json` retains the previous location labels and the independently read
factory gate pin/net assignments. Fourteen export tests check their consistency
and correct board regions; all photo-fit checks and the native KiCad integration
test pass. The controller meshes and museum sidecar are regenerated together, so
selecting A2 components or their nets now marks the correct physical locations.
This is a reference-placement correction supported by the factory drawing, not
a claim that specimen copper continuity has been measured. The existing digital
qualification still applies to the unchanged connectivity. All eleven controller
browser tests, the production build and CAD CI pass. All twelve review views
render and the three strict visual regression checks pass without baseline changes.

## What the twelfth pass discovers

A source search during the completion audit recovered the manufacturer
[service drawing set](https://www.tiffe.de/Robotron/PC1715/PC-1715-Schaltplaene.pdf).
PDF page 10 (printed drawing 8) contains populated placement drawing
63-330-4103-2, and page 11 contains factory schematic 56-330-4103-7. The PDF is
hashed in `evidence.json` and linked, not redistributed. This usable drawing
changes the next physical-reconstruction step: compare its reference locations
and pin connections against the specimen before relying on photo-only inference.
The previously rejected unfinished Zander placement sheet remains unusable.

The drawing supports two visible wire-link candidates: BR1 beside C6/R10.3 at
the ROM/oscillator end, and BR2 beside R9.1 on the cable side of A1. Original
photo endpoints and their uncertainty are recorded without assigning schematic
pin numbers to their order. Bridge inspection in the museum links the factory
placement and states that terminal order and electrical continuity are unverified.
The native footprints remain unplaced pending those checks.

The three A2 package locations have different reference labels in the factory
drawing and current reconstruction. The evidence records this discrepancy as
physical-location candidates; it does not establish a historical circuit variant.
It may instead identify a reconstruction placement error. Resolve the pin/net
correspondence before renaming or moving packages. A6/A7 printed type labels
also differ from current reference values and are retained for comparison.

Thirteen export tests, model/download metadata checks, ten controller browser
tests and the production build pass. CAD CI passes for `33b5465`. Geometry,
connectivity and the existing HDL qualification are unchanged. The plan is still
incomplete, but the newly recovered source provides substantive work toward the
remaining placements rather than making specimen measurements the only next step.

## What the eleventh pass closes

Selecting a controller component or net now highlights its assigned copper in the
3D museum as well as the circuit drawing. The overlay uses exported native route
coordinates and IDs: observed sections are gold, inferred sections dashed orange,
and unresolved assigned sections dashed cyan. Top and underside sections retain
their respective board heights. Highlights attach to the board through inspection
movement, and closing or clearing selection disposes them. Unassigned artwork is
excluded from net highlighting. These overlays identify evidence, not live
current flow or measured continuity.

The real-model browser tests verify route selection and exclusion, top/bottom
coordinates, pad alignment, provenance styling, board attachment, geometry
preservation and resource disposal. Ten controller tests pass in Chromium,
Firefox and WebKit (30 cases), and the production build passes. The selected
A1:1 route was also rendered and visually checked against its model trace.
CAD, HDL and physical reconstruction status are unchanged. CPU WR/RD photo
inspection still does not establish a continuous path to A1.

## What the tenth pass establishes

The underside investigation now distinguishes local correspondence from the
failing board-wide fit. Four A4 corner pins define a local photo-to-photo map;
four different interior pins check it, with residuals of 0.16–0.37 nominal mm.
The projected upper terminal near A4 matches the top A1:1 route endpoint within
0.22 nominal mm; the neighboring lower terminal provides a second pattern match.
Both lie outside the anchor columns, so the report explicitly marks them as
extrapolated candidates. A tentative terminal near A6 differs by more than 2 mm
when projected with the same fit. This does not establish a safe calibration for
the whole underside route, nor prove that the A6 candidate is the counterpart.

Original pixel observations, the local matrix, held-out checks, candidate
residuals and extrapolation flags are retained in the CAD evidence and generated
report. The underside overlay marks local check pins and candidate terminals;
selecting A4 in the museum exposes the fit and its limits. Local success does
not override the failed global checks or qualify copper assignment. No geometry,
via, connectivity or HDL change was made. Physical totals remain eight assigned
top sections, one dangling endpoint, 234 airwires and 59 unplaced components.
Thirteen export tests pass, including independent-check validation and a guard
against treating this local fit as qualified copper evidence. All eight controller
browser tests and the production build pass; CAD CI passes for `58655bb`.

## What the ninth pass establishes

The first actual copper route is now native KiCad geometry: the top track leaving
A1 pin 1, running around X1 and ending at a round terminal near A4 (original
photo pixel 1241,2966). Seven segments follow visible copper. One short segment
connects the fitted pad centre to the visible lead edge and is explicitly inferred.
The estimated width is 0.35 mm; board scale remains nominal. Every segment has a
UUID, geometry-bound evidence and original-photo pixel locators. Native geometry
is exported into OpenSCAD, the museum mesh, review SVG and photo overlay.

This is a partial route. `/WR_N` names the reference schematic connection at
A1:1; the traced section does **not** establish continuity to the CPU WR pin or
resolve the WR/RD source disagreement. The terminal's underside correspondence
and continuation remain unresolved. No through-via or hidden route was invented.
DRC retains one `track_dangling` finding, with 234 airwires still unresolved.
There are now eight assigned copper segments; all 294 legacy artwork segments
remain unassigned and 59 components remain unplaced.

Museum inspection shows observed/inferred section counts and evidence details,
highlights the assigned route with its net or component, draws the inferred
attachment dashed, and reports the remaining DRC finding. The source-photo overlay
was visually checked along the whole top section. Twelve export checks and the
native KiCad integration test pass. Connectivity and HDL wiring are unchanged;
reference co-simulation remains applicable, without claiming specimen continuity.
All seven controller tests pass in Chromium, Firefox and WebKit (21 cases), and
the production build passes. All 12 visual review views render; the three strict
regression checks pass after reviewing and updating only the controller baseline.
Its structural difference is limited to the added trace vertices/indices. CAD CI
passes for `371b017`.

## What the eighth pass closes

Native copper now requires a per-UUID record in `route-evidence.json`, with
observed/inferred/unresolved status, a review explanation, pinned source citations
and locators. Geometry hashes bind the review to the exact track/arc/via shape,
width, side and net; edits invalidate prior review. Export rejects missing or
orphaned records and stale citations. Observed tracks require their side's photo;
observed through-vias require both sides. Records survive in exported layout and
therefore the museum sidecar. These checks enforce provenance, not the correctness
of a human reading of a photograph or measured electrical continuity.

The ledger remains empty: A1's top-photo crop shows a track leaving pin 1 but does
not establish the entire path, and pins 2/4 do not reveal unambiguous output routes.
No uncertain artwork was promoted to electrical copper. Physical totals remain
294 unassigned segments, 59 unplaced components and 234 airwires.

Validation: 11 export tests pass, including moved/renetted/stale-source rejection.
The native KiCad integration test rejects unreviewed synthetic copper, accepts
explicitly documented synthetic arc/via geometry, and still rejects pad/net
mismatches. Download sources and model metadata pass validation. Geometry and
connectivity are unchanged, so the existing HDL qualification remains applicable.
All six controller browser tests and the museum production build pass; CAD CI
also passes for `f6e174d`.

## What the seventh pass closes

Co-simulation failures now retain structured first-failure signals and automatic
waveforms. Bus failures identify the first vector, signal, synthetic testbench
nanoseconds and values; exact vectors are retained and replayed into VCD.
Firmware failures identify serial/LED event indices, both CPU clocks, differing
values and missing events. A bounded real-HDL replay captures the earliest data
divergence with 32 clocks of context on each side. CPU phases are not aligned
away. Coverage-only failures without a differing event explicitly retain only
an initial waveform window; full stimulus logs and manual full-wave capture remain.

`failure.json` records counterexamples and waveform hashes. A new run removes
old reports before executing checks, preventing an aborted qualification from
leaving a stale passing result. Four diagnostics tests include actual injected
read, LED and serial faults, missing events and a bounded firmware waveform run.
They run in ordinary core CI through `make test-keyboard-controller`. The final
harness rerun passes 131,072 bus transactions, 390 serial bits and 11,971 LED
state records with the existing documented phase offsets. Source hashes were
verified against the final files before committing the reports.

## What the sixth pass established

The underside CPU rows were recounted against the original image. The earlier
lower-corner observations at y3138 picked features below the twenty-pin rows;
corrected corners are recorded in `bottom-landmarks.json`, with superseded points
preserved in its review history. Fitting anchors and the 1.25 mm tolerance are
unchanged. All six checks now show 1.41–1.70 mm PCB-relative residuals. This corrects
the previous report rather than preserving its more favourable numbers.

A separate direct photo-to-photo comparison uses the same four anchors but targets
the original top-photo observations, bypassing rigid PCB footprint placement.
A1 checks differ by 0.17/0.41 nominal mm; CPU checks span 0.89–1.28 mm. The report
retains pixel residuals as well as nominal mm and hashes both original photographs.
The museum presents both comparisons separately. The larger PCB-relative errors
show that nominal calibration and package fitting contribute to the discrepancy;
this is not solely an underside image-registration problem. Top lead/socket
surfaces can obscure board-hole centres, so neither comparison qualifies exact
physical routing. Measured dimensions and additional shared pads are still needed.

Ten fast CAD checks, canonical export/download metadata checks, six browser
checks and the production build pass. No geometry, electrical connectivity or
copper assignments changed in this pass.

## What the fifth pass established

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
| First-failure signals, clocks, stimulus and waveform | Implemented with fault-injection checks |
| KiCad geometry propagated to OpenSCAD and museum | Nine DIPs and twelve resistors implemented; other discrete parts remain |
| Both photo sides registered to numbered pads | Incomplete; corrected underside checks and nominal calibration remain unresolved |
| Visible copper reconciled with named nets | First partial A1:1 top route assigned (7 observed sections, 1 inferred attachment); 294 artwork segments remain unassigned |
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
| PCB | Resolve underside registration and A8 socket-to-hole alignment, place 47 components, trace and assign actual copper, reconcile 234 airwires |
| OpenSCAD | Migrate remaining discrete parts and qualify pad/lead interfaces and physical dimensions |
| Co-simulation | Resolve CPU phase timing if cycle equivalence is required; qualify analog and contention boundaries |
| Museum/sync | Extend verified net geometry and signal mappings as physical reconstruction progresses |

The data/clock path now has passing reference logic and synchronized geometry,
but its physical copper continuity remains unresolved. Specimen ROM dumps and
timing measurements remain planned. Software consistency cannot substitute for
those measurements or for reviewing the remaining visible/hidden routes.
