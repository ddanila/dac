# Robotron keyboard controller reconstruction and synchronization plan

Status: incomplete. Digital reference comparisons and synchronized exports are
implemented; physical reconstruction and full-board electrical qualification
remain open. These are active desk-work tasks, not established hardware blockers.
The [status guide](keyboard-controller-progress.md) points to authoritative
artifacts; the [requirement audit](keyboard-controller-verification.md) separates
remaining proof from observations that may eventually need the specimen.

Reconstruct the keyboard controller as a KiCad schematic and PCB, generate its
OpenSCAD geometry, and qualify its digital behavior against the emulator using
Verilog co-simulation. Use this smaller board to establish a repeatable workflow
before extending it to other Robotron boards.

The result must distinguish verified electrical connectivity, photo-supported
physical routing, and tested digital behavior. Successful simulation does not
prove historical copper placement or specimen timing.

## Reference simulation and specimen fidelity

Use standard S600 firmware to complete the reference-board circuit simulation.
Missing specimen measurements, replacement ROM contents and physical pad mapping
must not block electrical modeling from the published schematic. Implement the
analog sections and couple them to the existing HDL as described in the
[circuit simulation decision and workflow](keyboard-controller-simulation.md).
Exact specimen agreement remains a separate qualification task; the physical
reconstruction requirements below remain in scope.

## Next work and acceptance

1. **Finish supported physical paths.** Reconcile the driver/cable/filter copper
   with registered photographs and the netlist. Resolve discrete terminal mapping
   and estimated footprint conflicts independently of visual body placement.
   Keep unsupported continuations and specimen differences explicit.
2. **Constrain device dynamics.** Use independent device evidence to resolve
   oscillator startup and host-buffer switching/loading. Preserve the separate
   primary, comparison and reference device conditions. DC passes, converged
   numerical results and generic clamp behavior do not establish applicability.
3. **Qualify the coupled reference board.** The experimental host network is
   integrated into both service and closed-board fixtures. Loaded service checks
   support sampled input stress and nominal-threshold clock widths. The U856
   manual identifies rising RxC as the sampling edge; requalify logical behavior
   and data stability with the corrected observer. Earlier falling-edge comparisons
   do not establish SIO receive behavior or full-waveform convergence.
   Obtain a completed closed-board capture with the existing circuit and adequate
   execution allowance, then review startup and the recorded receiver window
   separately. A timeout is incomplete evidence, not a demonstrated circuit fault.
   Qualify receiver levels, loading, oscillator phase and bus timing; cover the
   remaining firmware scenarios and supply recovery. Preserve failing startup
   and absolute phase in acceptance checks.
4. **Identify residual specimen dependencies.** Exhaust existing photographs,
   package drawings and published circuit constraints first. State the remaining
   alternatives and the observation that would distinguish them. Standard S600
   permits reference work to continue without the replacement ROM.

The [requirement audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
records the findings behind this sequence and links their evidence. Detailed
measurements, candidate inventories and experiment results stay in source reports.
An unresolved claim becomes an external dependency only when available evidence
cannot distinguish the remaining alternatives; it does not block unrelated work.

## Ownership and synchronization contract

| Information | Authoritative source | Consumers |
| --- | --- | --- |
| Components, numbered pins, electrical nets | KiCad schematic | PCB checks, generated HDL wiring, signal mappings |
| Outline, holes, footprints, placement and copper | KiCad PCB | OpenSCAD exporter and museum assets |
| Enclosure, brackets, shields and assembly transform | OpenSCAD | Museum assembly |
| Chip behavior | Independently reviewed Verilog models | Board simulation |
| Firmware and software behavior | Identified ROM and emulator implementation | Co-simulation |
| Photo registration, anonymous observed geometry and unresolved claims | Evidence manifest | Layout review and museum inspection |

Use stable component references, physical pin numbers and named nets throughout.
The normalized connectivity manifest and HDL interconnect are generated outputs.
Do not round-trip edits through them or maintain separate hand-written trace
geometry in OpenSCAD after migration. Evidence-derived visual bodies and raised
leads must remain separate from native numbered pads; they cannot create holes,
solder joints or net assignments without supporting evidence.

Define board units, origin, axes, top/bottom conventions and assembly transform
explicitly. Generated assets record source revisions, content hashes and tool
versions. Evidence identifiers must survive geometry export in a sidecar manifest.

Repository ownership: keep the KiCad reconstruction, evidence and geometry exporter
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
- Keep body/bridge observations independent of unproven numbered-pad assignments.
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
- Couple schematic-derived analog sections to HDL, qualify device models against
  published limits, and test timestep convergence, CPU input levels, bus timing
  and supply recovery independently of firmware output agreement.
- After the peripheral comparison works, select and qualify an independent CPU
  HDL model for full-board firmware execution. Record which shared components
  limit the independence of each comparison.

Exit criterion: failures identify the first differing signal and clock and retain
a reproducible stimulus plus waveform. Logical and clock-relative agreement is
reported separately from unmeasured oscillator frequency or analog propagation.
Full-board electrical acceptance also requires passing convergence and receiver/
timing gates across the declared model assumptions and supported parameter ranges.

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

This milestone remains open because physical continuations are unresolved.
Complete the keyboard data/clock output path through all representations:
connector pins, schematic nets, visible copper, generated OpenSCAD geometry and
an HDL/emulator comparison. Include the circuitry and boundary stimuli necessary
to exercise that path. This is the first integration checkpoint within the phases
above, before expanding reconstruction and qualification to the entire controller.

## Completion and remaining physical evidence

Completion requires the phase exit criteria above, including the physical
data/clock milestone and qualified coupled reference-board scenarios. The audit
must identify remaining unresolved routing and model limits explicitly.

Exact specimen fidelity additionally requires confirming dimensions, revision,
replacement-ROM contents and relevant measured behavior. These confirmations do
not prevent completion of independently supported reference work. Do not substitute
autorouted geometry for missing historical evidence or call a bounded reference
model a calibrated specimen model.

## References

- [Manufacturer service drawings](https://www.tiffe.de/Robotron/PC1715/PC-1715-Schaltplaene.pdf): PDF page 10 contains populated placement drawing 63-330-4103-2; page 11 contains schematic 56-330-4103-7. Compare revision and designator differences before applying locations.

- [Zander keyboard schematic, drawing 56-330-4103-7](https://www.sax.de/~zander/pc1715/pc_tasts.pdf)
- [Zander keyboard component placement](https://www.sax.de/~zander/pc1715/pc_tastb.pdf)
- [Zander hardware index](https://www.sax.de/~zander/pc1715/pc_hw.html), whose separate
  keyboard copper-layout entry was listed as unavailable when this plan was prepared.
- [Canonical Robotron CAD](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m)
- [Robotron emulator](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m)
- [Current capabilities and evidence limits](capabilities.md)
- [Emulation qualification](emulation-qualification.md)
