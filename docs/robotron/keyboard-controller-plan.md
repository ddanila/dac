# Robotron keyboard controller reconstruction and synchronization plan

Status: incomplete. Digital reference comparisons and synchronized exports are
implemented; physical reconstruction and full-board electrical qualification
remain open. These are active desk-work tasks, not established hardware blockers.
The [workflow guide](keyboard-controller-progress.md) points to authoritative
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

1. **Resolve geometry, then finish supported physical paths.** Follow the
   [physical reconstruction sequence](#physical-reconstruction-sequence) below.
   Prioritize independently checked placement and complete visible paths;
   preserve unresolved identities and hidden spans in the CAD evidence.
2. **Complete repeat-capture qualification.** The retained held-key/repeat/release
   voltage and receiver-timing screens pass. Obtain a matched timestep-refinement
   pair using the verified producer revision and identical model assumptions.
   Functional success and sampled timing screens are not electrical qualification.
3. **Establish numerical convergence.** The retained capacitor-stamp assessment
   identifies material assembly loss before the rejected voltage excursion,
   including a bounded saved state. Local capacitor corrections still lack
   completed refinement. Investigate remaining stamp additions and stored
   histories; frozen-equation sensitivity does not establish a transient remedy.
   Require an identical disabled control, completed refinement pairs and
   absolute-time voltage convergence without changing circuit physics or budgets.
4. **Constrain device dynamics.** Qualify oscillator startup, output-driver and
   host-buffer switching/loading against independent device evidence. Admit vendor
   models against the intended device's conditions before board use. Keep primary,
   comparison and reference devices separate; filter hypotheses need independently
   supported parameters. Do not tune parameters merely to remove a solver failure.
5. **Qualify the coupled reference board.** Resolve the CPU clock high-level and
   timing failures exposed by the startup-inclusive capture. Complete host device
   qualification, scenario/refinement coverage, oscillator phase, receiver levels/loading, bus
   timing and supply recovery. Logical agreement and receiver timing screens
   cannot substitute for these electrical gates.
6. **Identify residual specimen dependencies.** Exhaust photographs, package
   drawings and published circuit constraints first. For each remaining ambiguity,
   state the alternatives and the observation that would distinguish them.
   Standard S600 permits reference work without the replacement ROM.

The [requirement audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
records the findings behind these tasks and links their evidence. Physical
reconstruction, device research and numerical diagnosis can proceed independently;
physical reconstruction is the immediate priority and does not wait for a solver
remedy. The ordering is not a dependency chain. Detailed measurements, candidate
inventories and experiment results stay in source reports.
An unresolved claim becomes an external dependency only when available evidence
cannot distinguish the remaining alternatives; it does not block unrelated work.

## Physical reconstruction sequence

Work in this order where the steps depend on geometry. Independent trace and
component research can proceed alongside calibration. The package-distance review
and manufacturer CPU pitch correction constrain calibration, but do not qualify
the global envelope or R1 placement. The immediate target is a qualified SENSE
corridor and R1 placement; the serial data/clock path remains the board's physical
integration milestone.

| Step | Work | Acceptance |
| --- | --- | --- |
| 1. Diagnose registration disagreement | Compare the enclosing edge fit in `sense-review.json` with board-plane joints and known package pin pitches. Check scale, perspective, handedness and raised-lead bias independently; neither the nominal envelope nor existing placement is assumed correct. | Retain a reproducible comparison with held-out checks, residuals and validity boundaries that distinguishes calibration error from placement error. Do not widen tolerances to obtain a pass. |
| 2. Reconcile native placement | Correct only placements or registrations supported by step 1. Recheck existing routes and cross-side joins affected by those changes. | Qualified fits cover the intended geometry; independent checks meet the existing budget. Regenerated native connectivity and DRC show no unexplained regressions. |
| 3. Place R1 and route the SENSE corridor | Resolve primary bank orientation and numbered hole entries, map the reference package to supported primary holes, then promote complete A4–R1 paths individually. Use the corrected detour and comparison evidence in `sense-review.json`. | Native pads represent the physical package, including its unused lead; each promoted route has supported endpoints and bounded registration throughout. Common-to-ground and collector branches remain separate acceptance items. |
| 4. Complete the row front ends | Trace R1's common connection and sensing-transistor collector branches. Establish transistor terminal orientation from package evidence and visible lead entries. | Every assigned terminal has evidence beyond schematic expectation or proximity. Reference HDL/analog behavior remains consistent with schematic connectivity; simulation does not establish physical joins. |
| 5. Close the remaining physical paths | Prioritize complete visible connections using `generated/routing-audit.json` and the tracing sources below. Continue through placement and DRC gaps. | Record both endpoints and unresolved spans; count connected pad groups separately from floating copper. Finish the data/clock path through L1 to XT1 for the integration milestone. |

For every native change, regenerate KiCad checks, OpenSCAD geometry and museum
inspection together. Keep inferred solder attachments and unmeasured via
geometry explicit. Photo-only evidence changes must not create native copper.

Use these existing tracing authorities rather than maintaining a second candidate
inventory in this plan:

| Area | CAD evidence and acceptance boundary |
| --- | --- |
| SENSE and R1 | `sense-review.json`: comparison orientation supports a hypothesis, not primary marking identity or the hidden common-to-ground join. |
| CPU/ROM and latch bus | `bus-review.json`: check package numbering and board entries, compare candidate eyes, and trace from both ends. Covered CPU/ROM joins need visible continuation or independent continuity; positional agreement alone is insufficient. |
| Data and strobe | `path-tracing.json`: resolve the hidden resistor and CPU/latch terminal transitions before selecting attachments or WR/RD. |
| Supply, filter and clock | `supply-review.json`, `filter-registration.json`, `clock-continuation.json` and the anonymous cable-end graph: extend fits with independent landmarks; cross-side correspondence does not identify winding pairs or bridge occlusions. |
| Matrix connector | `generated/connector-review.json` and `generated/connector-terminals.json`: resolve remaining contacts independently of the host cable. |

Keep rejected fits and conditional net conflicts in machine-readable evidence.
Composed registrations are valid only inside both source domains; a nearby
projected point must not become an assigned terminal outside those bounds.

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
- Qualify the selected independent CPU HDL model for full-board firmware
  execution. Record which shared components limit comparison independence.

Exit criterion: failures identify the first differing signal and clock and retain
a reproducible stimulus plus waveform. Logical and clock-relative agreement is
reported separately from unmeasured oscillator frequency or analog propagation.
Full-board electrical acceptance also requires passing convergence and receiver/
timing gates across the declared model assumptions and supported parameter ranges.
Those ranges must be supported independently of the firmware comparison; an
executable nominal model alone cannot complete this phase.

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

## Physical integration milestone

This milestone remains open because physical continuations are unresolved.
Complete the keyboard data/clock output path through all representations:
XT1 cable terminals, L1 filter windings, schematic nets, visible copper, generated OpenSCAD geometry and
an HDL/emulator comparison. Include the circuitry and boundary stimuli necessary
to exercise that path. This remains an acceptance gate even though full-board
simulation work has already progressed independently.

Completion requires all phase exit criteria and this physical milestone. Exact
specimen fidelity additionally requires identified ROM contents, dimensions and
measured behavior; reference qualification does not establish those claims.
Report physical-path completion, full-board electrical qualification and
fabrication readiness separately. A reconstructed visible path does not establish
that the remaining PCB is routed, dimensionally verified or ready to manufacture.

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
