# Robotron keyboard controller reconstruction and synchronization plan

Recorded 2026-10-16. Status: implementation in progress; physical reconstruction
and specimen fidelity are not complete. Reference digital comparisons now pass;
BR1/BR2 isolation tests and reset/cable transcription review are implemented;
cycle timing and analog boundaries remain unqualified. See the
[implementation record](keyboard-controller-progress.md) for commits, validation
results and unresolved work.

Reconstruct the keyboard controller as a KiCad schematic and PCB, generate its
OpenSCAD geometry, and qualify its digital behavior against the emulator using
Verilog co-simulation. Use this smaller board to establish a repeatable workflow
before extending it to other Robotron boards.

The result must distinguish verified electrical connectivity, photo-supported
physical routing, and tested digital behavior. Successful simulation does not
prove historical copper placement or specimen timing.

## Existing foundation

- The `3d-models` repository contains the canonical Robotron geometry under
  `models/robotron-1715m/`. `keyboard-artwork.json` and
  `tools/configure-keyboard-artwork.py` provide photo-registered artwork;
  `specimen-details.scad` includes controller geometry and procedural pin fanouts.
  These are visual reconstructions without a continuity claim.
- `controller-package-data.scad` and `tools/configure-keyboard-components.py`
  already reuse pinned KiCad package geometry. Preserve useful component shapes.
- `dac-emulation/machines/robotron1715m/keyboard.c` implements keyboard behavior
  derived from Zander's schematic. Existing S600 tests cover firmware-driven
  matrix input, serial output, modifiers, repeat and mixed-peripheral snapshots.
- Juku's `8080-cosim/sync/` contains normalized KiCad, board and HDL netlist
  readers and provenance reporting. Reuse suitable mechanisms without adopting
  a second manually maintained connectivity source.
- The reference S600 ROM is available, but the specimen replacement EPROM has
  not been identified or dumped. Specimen timing measurements remain planned.

## Ownership and synchronization contract

| Information | Authoritative source | Consumers |
| --- | --- | --- |
| Components, numbered pins, electrical nets | KiCad schematic | PCB checks, generated HDL wiring, signal mappings |
| Outline, holes, footprints, placement and copper | KiCad PCB | OpenSCAD exporter and museum assets |
| Enclosure, brackets, shields and assembly transform | OpenSCAD | Museum assembly |
| Chip behavior | Independently reviewed Verilog models | Board simulation |
| Firmware and software behavior | Identified ROM and emulator implementation | Co-simulation |
| Photo registration, evidence and unresolved claims | Evidence manifest | Layout review and museum inspection |

Use stable component references, physical pin numbers and named nets throughout.
The normalized connectivity manifest and HDL interconnect are generated outputs.
Do not round-trip edits through them or maintain separate hand-written trace
geometry in OpenSCAD after migration.

Define board units, origin, axes, top/bottom conventions and assembly transform
explicitly. Generated assets record source revisions, content hashes and tool
versions. Evidence identifiers must survive geometry export in a sidecar manifest.

Proposed ownership: keep the KiCad reconstruction, evidence and geometry exporter
with the canonical board in `3d-models`; keep the board HDL and emulator comparison
harness in `dac-emulation`; consume pinned model assets and inspection metadata
in `dac`. Cross-repository consumers use explicit revisions, not moving checkouts.

## 1. Establish board identity and evidence

- Match specimen markings, packages, connectors and board revision against the
  published schematic and placement drawing.
- Inventory existing top and underside photographs, including obscured regions.
- Record component references, package types, pin numbering and supporting evidence.
- Track schematic/specimen differences and reference/specimen firmware separately.

Deliverable: component inventory, source manifest and unresolved-evidence ledger.
Exit criterion: every identified component has a stable reference, and uncertain
revision or pin assignments are explicitly marked.

## 2. Reconstruct the KiCad schematic

- Transcribe components, connectors, supply rails and named nets.
- Independently review the transcription against the source drawing, especially
  inversions, latch clocks, connector orientation and power pins.
- Export normalized connectivity and adapt the relevant Juku comparison tools.
- Classify unused pins and document electrical-rule exceptions individually.

Exit criterion: electrical-rule checks pass or have justified exceptions; all
modeled pins are connected or explicitly classified. Agreement between generated
files is a consistency check, not an independent validation of the transcription.

## 3. Reconstruct the PCB from photographs

- Register both sides in one coordinate system using holes and component pads.
- Place the outline, footprints, mounting holes and connectors.
- Trace visible copper and associate routes with schematic nets.
- Label routes as observed, inferred or unresolved, with source-photo references.
- Check board connectivity, clearances and agreement with the schematic.

Deliverables: editable KiCad board, photo overlays and connectivity report.
Exit criterion: visible routing is reconciled with the netlist and any remaining
unrouted or uncertain connections are inventoried. Hidden routes may remain
unresolved; plausible replacement routing must not be labeled historically exact.

## 4. Generate the OpenSCAD controller

- Export outline, holes, pads, vias, copper, component transforms and identifiers.
- Reuse the existing detailed component models, positioned by reference and footprint.
- Keep controller assembly placement and surrounding mechanics in OpenSCAD.
- Replace duplicate controller artwork and placement data after generated geometry
  passes review. Preserve the accepted keyboard exterior and existing inspection
  part identities where possible.

Exit criterion: asymmetric landmark checks detect mirrored or rotated exports;
pads align with component leads; regeneration is deterministic; the controller
fits its existing assembly and inspection views.

## 5. Build board HDL and co-simulation

- Generate structural Verilog connections from the schematic netlist; maintain
  chip behavior separately and review it against component documentation.
- Model open-collector lines and pull-ups explicitly. Document the digital
  boundaries for oscillator, reset and other analog circuitry.
- First drive identical CPU bus transactions and matrix inputs into HDL board
  logic and the C emulator. Compare input data, LED latch outputs and keyboard
  data/clock edges at defined sampling points.
- Run firmware-driven cases for ordinary keys, modifiers, repeat, release and reset.
- After the peripheral comparison works, select and qualify an independent CPU
  HDL model for full-board firmware execution. Record which shared components
  limit the independence of each comparison.

Exit criterion: failures identify the first differing signal and clock and retain
a reproducible stimulus plus waveform. Logical and clock-relative agreement is
reported separately from unmeasured oscillator frequency or analog propagation.

## 6. Integrate museum inspection and synchronization checks

- Preserve component and net IDs in sidecar metadata for exported meshes.
- Support selecting a component or net to highlight geometry and its evidence.
- Connect supported signals to emulator diagnostics; label illustrative animation
  separately from recorded activity.
- Check stale exports, missing references, pin-map differences and geometry mappings.
- Keep fast connectivity and export checks in ordinary CI; place longer firmware
  and HDL runs in a separate qualification target.

Exit criterion: a placement change updates the model through regeneration; a
connection change updates HDL wiring and triggers the relevant checks. A release
records compatible CAD, HDL, emulator and museum revisions and validation results.

## First implementation milestone

Complete the keyboard data/clock output path through all representations:
connector pins, schematic nets, visible copper, generated OpenSCAD geometry and
an HDL/emulator comparison. Include the circuitry and boundary stimuli necessary
to exercise that path. This is the first integration checkpoint within the phases
above, before expanding reconstruction and qualification to the entire controller.

## Completion and remaining physical evidence

The software milestone is complete when the controller has checked connectivity,
reproducible geometry, explicit routing evidence and passing digital comparisons.
Exact specimen fidelity additionally requires resolving hidden copper, confirming
the board revision, identifying its ROM and obtaining relevant measurements.
Do not substitute autorouted geometry for missing historical evidence.

## References

- [Manufacturer service drawings](https://www.tiffe.de/Robotron/PC1715/PC-1715-Schaltplaene.pdf): PDF page 10 contains populated placement drawing 63-330-4103-2; page 11 contains schematic 56-330-4103-7. Recovered during implementation; compare revision and designator differences before applying locations.

- [Zander keyboard schematic, drawing 56-330-4103-7](https://www.sax.de/~zander/pc1715/pc_tasts.pdf)
- [Zander keyboard component placement](https://www.sax.de/~zander/pc1715/pc_tastb.pdf)
- [Zander hardware index](https://www.sax.de/~zander/pc1715/pc_hw.html), whose separate
  keyboard copper-layout entry was listed as unavailable when this plan was prepared.
- [Canonical Robotron CAD](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m)
- [Robotron emulator](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m)
- [Current capabilities and evidence limits](capabilities.md)
- [Emulation qualification](emulation-qualification.md)
