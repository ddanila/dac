# Keyboard controller implementation record

The controller now has native KiCad schematic and PCB authorities, generated
connectivity and OpenSCAD review geometry, an independent CPU co-simulation
harness, and a museum circuit-review panel. This is intermediate implementation
of the [plan](keyboard-controller-plan.md), not a completed physical replica.

## Deliverables and repositories

| Repository | Delivered | Revision |
| --- | --- | --- |
| `3d-models` | Source hashes and evidence ledger; native 68-component schematic and unrouted PCB; pad/net comparison; generated layout, SCAD and review SVG; deterministic checks and CI | `3e9d1e1` |
| `dac-emulation` | Generated numbered-pin HDL; separate chip models; bus comparison; pinned TV80 CPU and S600 workload; discrepancy reports and common-subset CI | `48524e8` |
| `dac` | Pinned reconstruction sidecar; component/net selectors; estimated pad highlights in the board drawing and 3D model; live emulator LED samples and qualification links | This change |

The published placement PDF proved to be an unfinished sheet, not a placed board.
The owner photographs remain the physical placement evidence. The reference
schematic and specimen revision have not been established as identical.

Full-resolution owner photos establish **05-330-4102-8 1c**, correcting the old
model-derived `062-330-4102` text. The canonical model inscription and visible
`К555ЛА3` chip marking are corrected. The kbdbabel drawing names this board family
but disagrees with Zander on the output-clock signal (RD versus WR) and ROM type.
The evidence ledger records both sources; the present circuit remains the Zander
reference transcription. Specimen ROM and timing measurements remain planned.

## Validation and findings

- CAD export checks all numbered pad/net assignments against the schematic.
  Five fast tests cover hashes, asymmetric landmarks, outline topology, curved
  geometry and stale source/output rejection. A KiCad integration test checks
  curved copper/via export and deliberately mismatched pad rejection. The standalone SCAD review exports successfully with
  the Manifold backend.
- KiCad ERC has two documented isolated-label warnings: unused CPU RD_N and
  the external cable shield. PCB DRC remains incomplete: 233 airwires, 87 silk
  violations, 57 unplaced reference components and no assigned copper segments.
  The 294 photo-artwork segments remain unassigned review graphics.
- The common bus subset passes 8,210 comparisons. The full 98,304-transaction
  audit finds 57,101 mismatches and returns failure.
- Independent TV80 and C CPU runs produce identical 390-bit serial sequences
  over 4.6 million CPU clocks, with explicit coverage checks for normal, Shift,
  Ctrl, actual REP repeats, silence after REP release and typing after reset, with a constant
  two-clock timestamp offset. This is workload evidence, not specimen timing.
- Both coarse LED samples and transition sequences disagree; exact counts are
  retained in the qualification report (28 C state records versus 11,971 HDL
  records, including initialization). Matrix decoding, multi-column sense,
  LED clocks and wider serial-write decoding require reconciliation. A production
  behavioral experiment broke the stable-LED S600 test and was reverted.
- The existing production S600 qualification still passes. No new runtime core
  or WASM distribution is introduced by this work.
- Nineteen Chromium checks pass for the new review panel, existing circuit tools
  and inspection workbench,
  including load failure/retry, net selection, unplaced evidence, marker following
  and marker disposal without changes to model geometry. The three new tests
  also pass in Firefox and WebKit (six additional checks). The production build
  passes. Canonical metadata synchronization preserves the existing museum
  evidence notes and fixes their previously stale source hashes.

## Review and reproduce

In the museum, open **Keyboard controller circuit review**. Select a component
or net to see its numbered pins, estimated pad positions and unresolved placement.
Cyan lines are photo artwork without net assignments. Both drawing sides retain
the same top-view coordinate convention. The 3D markers follow the controller
during inspection. The underlying accepted model has not been replaced by the
incomplete PCB reconstruction.

The live Caps/SI-SO values are C emulator samples. They are not measurements of
the board or full HDL waveforms; the panel explicitly reports the transition
disagreement. Links open the exact pinned CAD and co-simulation revisions.

From the canonical CAD controller directory:

```sh
python3 tools/export.py --check
python3 tools/test_export.py
# Regeneration requires KiCad's Python with pcbnew:
python3 tools/export.py
openscad -o /tmp/controller.stl review.scad
```

From `dac-emulation`:

```sh
make test-keyboard-controller
make audit-keyboard-controller
make qualify-keyboard-controller S600_ROM=/path/to/s600.bin
```

The last two targets intentionally report current failures with nonzero exit
status. Vectors, logs and optional waveforms are retained under
`build/keyboard-controller/`; committed reports live in
`verification/robotron-keyboard/reports/`.

After committing compatible source changes, refresh the museum sidecar with:

```sh
python3 scripts/sync-keyboard-controller.py ../3d-models ../dac-emulation
npx playwright test tests/keyboard-controller.spec.js --workers=1
```

The sync command rejects dirty source checkouts, stale CAD/HDL exports and
different connectivity hashes between CAD, HDL and the qualification report.
It also verifies the report hashes against the current harness, generated wiring,
production keyboard and both CPU implementations. Update the core pin first with
`python3 verification/robotron-keyboard/sync_reference.py ../3d-models` from the
core repository, rerun qualification, and commit the resulting reports.

## Remaining implementation and evidence

1. Independently review the schematic transcription, analog section and jumper
   representation; reconcile the LED and decoding discrepancies against the
   photographed board and additional source evidence.
2. Establish discrete lead numbering and package orientation, place the remaining
   components, and connect observed photo routes to actual numbered pads/nets.
3. Resolve airwires and physical-rule issues. Curved tracks and through vias
   now export with explicit geometry; zones, blind vias and internal layers
   still fail explicitly and require exporter support before use.
4. Qualify physical placement against independent photo landmarks, then migrate
   the accepted controller geometry and detailed package transforms to the checked
   PCB export. Current standalone packages are nominal review envelopes.
5. Complete full-board equivalence, including memory-write clocks and analog
   boundary qualification. Existing digital comparisons are deliberately scoped.
6. Obtain the planned specimen ROM and timing evidence before claiming specimen
   firmware identity, oscillator frequency or exact physical behavior.

The first end-to-end output-path milestone is therefore only partially complete:
the data/clock nets have schematic pins, HDL, co-simulation and selectable review
geometry, but their physical copper continuity is still unresolved.
