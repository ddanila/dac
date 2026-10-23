# Robotron keyboard controller reconstruction and synchronization plan

Status: incomplete. The proposed reference PCB is fully connected and passes
native DRC; separate reference exports and digital comparisons are implemented.
Historical reconstruction and full-board electrical qualification remain open.
These are active desk-work tasks, not established hardware blockers.
The [workflow guide](keyboard-controller-progress.md) points to authoritative
artifacts; the [requirement audit](keyboard-controller-verification.md) separates
remaining proof from observations that may eventually need the specimen.

Reconstruct the keyboard controller as a KiCad schematic and PCB, generate its
OpenSCAD geometry, and qualify its digital behavior against the emulator using
Verilog co-simulation. Use this smaller board to establish a repeatable workflow
before extending it to other Robotron boards.

Complete a working reference implementation first, then use its expected
connections to guide historical reconstruction. Distinguish schematic-defined
connectivity, proposed implementation geometry, photo-supported routing and tested
behavior. Successful simulation does not prove a unique circuit, historical copper
placement or specimen timing.

## Reference simulation and specimen fidelity

Use standard S600 firmware to complete the reference-board circuit simulation.
Missing specimen measurements, replacement ROM contents and physical pad mapping
must not block electrical modeling from the published schematic. Implement the
analog sections and couple them to the existing HDL as described in the
[circuit simulation decision and workflow](keyboard-controller-simulation.md).
The existing schematic-derived netlist is the starting authority: missing PCB
joins generally mean missing copper, not unknown logical nets. Preserve known
connections. Where the circuit really is ambiguous, record alternatives and select
an explicit reference assumption using schematic, device and firmware constraints;
passing firmware tests alone cannot establish the original implementation.
Exact specimen agreement remains a separate qualification task; historical
reconstruction stays in scope but does not gate completion of the reference PCB.

## Next work and acceptance

1. **Use the complete reference PCB to guide reconstruction.** Reference routing
   and native checks now pass. Review proposed package adapters and mechanical fit,
   then follow expected net endpoints through the
   [historical reconstruction sequence](#physical-reconstruction-sequence).
   Preserve the [reference acceptance contract](#reference-completion-sequence)
   when changing placements, mappings or routes.
2. **Maintain production digital acceptance.** The keyboard-specific backend
   implements X1 A9 bus arbitration and edge-timed memory, refresh, interrupt
   acknowledge and I/O behavior. Retained C/HDL comparisons cover the declared
   instruction and phase sweeps plus the complete standard-S600 firmware suite.
   CPU-only reset preserves external contacts and latch validity; startup LED
   values remain unknown until IORQ clocks A6. Regenerate and replay
   `digital/reports/cpu-bus/summary.json` when changing this contract.
   This closes production adoption for that reference digital scope, not exhaustive
   opcode conformance, U880 specimen timing or full-board electrical accuracy.
3. **Complete repeat-capture qualification.** The retained held-key/repeat/release
   voltage and receiver-timing screens pass. Obtain a matched timestep-refinement
   pair using the verified producer revision and identical model assumptions.
   Functional success and sampled timing screens are not electrical qualification.
4. **Establish numerical convergence.** Preserve the opt-in high-precision,
   conservative capacitor-history and passive-addition corrections with their
   disabled controls. Completed live refinement is stronger evidence than the
   earlier frozen or short-window replays, which remain diagnostic controls.
   Require identical circuit/stimulus assumptions, completed refinement levels,
   preserved firmware reads and absolute-time voltage/current comparisons.
   Do not align traces, exclude transitions or relax limits to obtain agreement.
5. **Constrain device dynamics.** Qualify oscillator startup, output-driver and
   host-buffer switching/loading against independent device evidence. Static
   endpoint screens pass sampled published conditions. The experimental 7406
   storage candidate fits published typical delays and passes selected DC,
   temperature and withheld switching checks. Its junction capacitances remain
   hypotheses; fitting typical delays does not identify a unique physical model
   or validate the board's different loading. Admit vendor
   models against the intended device's conditions before board use. Keep primary,
   comparison and reference devices separate; filter hypotheses need independently
   supported parameters. Do not tune parameters merely to remove a solver failure.
6. **Qualify the coupled reference board.** Preserve the qualified digital CPU
   and input-boundary scheduler contract. The ideal-switch baseline retains
   transition peaks despite ADC crossing localization; the direct electrical
   D0/WR path removes its unknown-logic/DAC plateau from the serial driver.
   Completed direct-driver refinement preserves reference firmware reads and
   reduces serial-voltage disagreement to millivolt scale. Keep that numerical
   agreement separate from physical accuracy: the output undershoot persists
   across refinement. Investigate its recovery mechanism and unsupported device
   operating regions before admission. Published typical delays alone cannot
   establish junction capacitance, package loading or recovery behavior.
   CPU bus/WR drivers remain linear endpoint stress fixtures; their failed
   supply/load envelope is not waived by switching success or maximum ratings.
   Keep the ADC and DAC scheduling candidates opt-in with their controls.
   Representative press/release, modifier and reset-during-transmission stimuli
   are prepared for the direct-driver circuit with production-C coverage.
   Execute and refine their electrical runs after convergence and model-admission
   gates pass. Then complete coupled startup, oscillator phase, CPU clock
   levels/timing, host loading, bus timing and supply recovery. Longer
   disabled/enabled controls remain necessary before using the evaluator cache
   for qualification. Logical agreement alone cannot close these gates.
7. **Identify residual specimen dependencies.** Exhaust photographs, package
   drawings and published circuit constraints first. For each remaining ambiguity,
   state the alternatives and the observation that would distinguish them.
   Standard S600 permits reference work without the replacement ROM.

The [requirement audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
records the findings behind these tasks and links their evidence. Physical
reconstruction, device research and numerical diagnosis can proceed independently.
The complete reference layout is now a tracing guide; unresolved historical
geometry must not hold up reference electrical qualification. Routing completion
does not resolve numerical or device-model failures. Detailed measurements,
candidate inventories and experiment results stay in source reports.
An unresolved claim becomes an external dependency only when available evidence
cannot distinguish the remaining alternatives; it does not block unrelated work.

## Reference completion sequence

Maintain distinct reference and historical KiCad board variants with shared stable
component and net IDs. Keep the schematic as the connectivity authority; reuse
supported geometry without overwriting its evidence. Variant identity and provenance
must survive exports, checks, OpenSCAD generation and museum inspection. The CAD
`reference/` variant implements this separation and passes routing and DRC checks.
Its populated OpenSCAD and museum assembly use pad-driven leads, explicit package
adapters and shared package bodies. Generated body-envelope, overhang and drill
checks pass; they do not establish mechanically qualified construction. Lead
clearance, bend radii, enclosure fit and the shared filter core remain open.
Netlist-checked signal walkthroughs link reference selection to historical evidence.

| Step | Work | Acceptance |
| --- | --- | --- |
| 1. Establish the reference contract | Review the existing netlist against the schematic, device pinouts and firmware interfaces. Separate missing copper from genuine connectivity ambiguity; record chosen assumptions and alternatives in machine-readable evidence. | Every intended pin has a net or an explicit unused classification. Any variant-specific electrical differences are explicit and reviewed; no connection is changed merely to make a test pass. |
| 2. Complete reference placement and routing | Reuse supported placements and copper. Where evidence is incomplete, choose documented reference footprints, terminal mappings, dimensions and proposed routes. Preserve primary/comparison specimen distinctions. | All intended pad groups are connected, with no unintended shorts; netlist checks pass and DRC findings are resolved or individually justified. Proposed geometry never increases historical-evidence coverage. |
| 3. Exercise the complete reference circuit | Run the CPU and standard S600 firmware against matrix stimuli; compare bus, latch and serial behavior for ordinary keys, modifiers, repeat, release and reset. Keep analog qualification gates below independent. | Reproducible functional results cover the declared circuit assumptions. Electrical acceptance additionally requires convergence, receiver levels, timing and recovery; routing or serial agreement alone cannot satisfy it. |
| 4. Export and use the reference as a tracing guide | Generate its OpenSCAD model and museum view. Inspect expected source-to-destination connections against both board photographs, replacing proposed geometry only when evidence supports the replacement. | Reference and historical views are explicitly labelled; proposed routes are visually distinguishable and filterable. Checks and coverage reports are variant-specific. Promotions retain evidence and revalidate affected connectivity and geometry. |

A fully routed reference is a candidate implementation, not a fabrication release.
Mechanical dimensions, installed package/pad mappings, electrical qualification and
manufacturing checks remain separate requirements. Do not report zero reference
unconnected items as zero unresolved historical joins.

## Physical reconstruction sequence

Use the completed reference connections to prioritize tracing from both endpoints.
The following evidence requirements apply to the historical variant; they do not
prevent proposed reference placements or routes. Where steps depend on historical
geometry, follow this order. Package-distance review and the CPU pitch correction
do not yet qualify the global envelope or R1 placement. SENSE/R1 and the serial
data/clock path remain historical reconstruction targets.

| Step | Work | Acceptance |
| --- | --- | --- |
| 1. Diagnose registration disagreement | Compare the enclosing edge fit in `sense-review.json` with board-plane joints and known package pin pitches. Check scale, perspective, handedness and raised-lead bias independently; neither the nominal envelope nor existing placement is assumed correct. | Retain a reproducible comparison with held-out checks, residuals and validity boundaries that distinguishes calibration error from placement error. Do not widen tolerances to obtain a pass. |
| 2. Reconcile native placement | Correct only placements or registrations supported by step 1. Recheck existing routes and cross-side joins affected by those changes. | Qualified fits cover the intended geometry; independent checks meet the existing budget. Regenerated native connectivity and DRC show no unexplained regressions. |
| 3. Place R1 and route the SENSE corridor | Resolve primary bank orientation and numbered hole entries, map the reference package to supported primary holes, then promote complete A4–R1 paths individually. Use the corrected detour and comparison evidence in `sense-review.json`. | Native pads represent the physical package, including its unused lead; each promoted route has supported endpoints and bounded registration throughout. Common-to-ground and collector branches remain separate acceptance items. |
| 4. Complete the row front ends | Trace R1's common connection and sensing-transistor collector branches. Establish transistor terminal orientation from package evidence and visible lead entries. | Every assigned terminal has evidence beyond schematic expectation or proximity. Reference HDL/analog behavior remains consistent with schematic connectivity; simulation does not establish physical joins. |
| 5. Close the remaining physical paths | Prioritize complete visible connections using `generated/routing-audit.json` and the tracing sources below. Continue through placement and DRC gaps. | Record both endpoints and unresolved spans; count connected pad groups separately from floating copper. Finish the data/clock path through L1 to XT1 for the integration milestone. |

For every native change, regenerate KiCad checks, OpenSCAD geometry and museum
inspection together for the affected variant. Keep proposed solder attachments and
unmeasured via geometry explicit. Photo-only observations must not create assigned
historical copper; proposed reference copper requires its own provenance.

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
| Outline, holes, footprints, placement and copper | Explicitly identified reference or historical KiCad PCB | Variant-specific OpenSCAD and museum assets |
| Enclosure, brackets, shields and assembly transform | OpenSCAD | Museum assembly |
| Chip behavior | Independently reviewed Verilog models | Board simulation |
| Firmware and software behavior | Identified ROM and emulator implementation | Co-simulation |
| Photo registration, anonymous observed geometry and unresolved claims | Evidence manifest | Layout review and museum inspection |

Use stable component references, physical pin numbers and named nets throughout.
The normalized connectivity manifest and HDL interconnect are generated outputs.
Do not round-trip edits through them or maintain separate hand-written trace
geometry in OpenSCAD after migration. Evidence-derived visual bodies and raised
leads must remain separate from historical native numbered pads; they cannot create
historical holes, solder joints or net assignments without supporting evidence.
Reference assumptions may supply proposed geometry and pad mappings only in the
reference variant, with explicit provenance and checked device pinouts.

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

## 3. Complete the reference PCB and reconstruct historical routing

- Complete reference placement and routing using the reference sequence above.
- Register both photographed sides using holes and component pads.
- Reconcile historical outline, footprints, mounting holes and connectors.
- Trace visible copper and associate routes with schematic nets.
- Label routes as observed, inferred or unresolved, with source-photo references.
- Keep body/bridge observations independent of unproven numbered-pad assignments.
- Check board connectivity, clearances and agreement with the schematic.

Deliverables: distinct editable reference and historical KiCad boards, photo
overlays and variant-specific connectivity reports.
Reference exit criterion: all intended nets are physically connected and checked.
Historical exit criterion: visible routing is reconciled with the netlist and
remaining uncertain connections are inventoried. Hidden routes may remain
unresolved; proposed replacement routing must not be labelled historically exact.

## 4. Generate the OpenSCAD controller

- Export outline, holes, pads, vias, copper, component transforms and identifiers,
  retaining board variant and observed/proposed provenance.
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

- Preserve component/net IDs, board variant and evidence classification in sidecars.
- Expose distinct historical and proposed reference views; make proposed routes
  distinguishable and filterable without implying specimen verification.
- Support selecting a component or net to highlight geometry and its evidence.
- Connect supported signals to emulator diagnostics; label illustrative animation
  separately from recorded activity.
- Check stale exports, missing references, pin-map differences and geometry mappings.
- Keep fast connectivity and export checks in ordinary CI; place longer firmware
  and HDL runs in a separate qualification target.

Exit criterion: a placement change updates the model through regeneration; a
connection change updates HDL wiring and triggers the relevant checks. A release
records compatible CAD, HDL, emulator and museum revisions and validation results.

## Integration milestones and completion

**Reference integration:** the data/clock path through XT1, L1 and the output
circuitry is connected in the proposed PCB and exported to OpenSCAD and the museum.
Its pin-to-net contract matches the schematic used by the HDL/emulator comparisons.
Include the boundary stimuli needed to exercise it. Historical winding-terminal or copper uncertainty must be recorded,
but need not prevent an explicit reference implementation. Functional integration
and full-board electrical qualification have separate acceptance results.

**Historical integration:** reconcile the same path with supported specimen
placements, terminal identities and copper continuations. This milestone remains
open; reference routing or successful simulation cannot close it.

Overall completion requires the phase exit criteria and both integration
milestones. Report reference routing, functional behavior, full-board electrical
qualification, historical reconstruction and fabrication readiness separately.
Exact specimen fidelity additionally requires identified ROM contents, dimensions
and measured behavior. Completing the reference implementation is a deliverable
in its own right and does not wait for the historical milestone.

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
