# Keyboard controller completion audit and specimen verification

Audit date: 2026-10-17. Scope: the complete [keyboard controller plan](keyboard-controller-plan.md),
including its physical data/clock milestone. **Not complete.** This is a requirement
map and evidence collection guide, not a certificate of specimen fidelity.

Reviewed sources: CAD `4ac9715`, core `cdda844`, and the museum assets pinned to
those sources. The [progress record](keyboard-controller-progress.md) records
intermediate changes and corrections. The withdrawn CPU CLK candidate remains
withdrawn; a passing local geometric fit did not prove its electrical attachment.

## Requirement audit

“Implemented” below describes the stated artifact or bounded behavior. “Partial”
means the requirement is not yet satisfied for the whole controller. Paths prefixed
`CAD/` are relative to `3d-models/models/robotron-1715m/`; `core/` paths are relative
to `dac-emulation/verification/robotron-keyboard/`. Museum paths are relative to `dac/`.

| Plan requirement | Evidence inspected | Result and remaining proof |
| --- | --- | --- |
| 1. Match markings, packages, connectors and revision | `CAD/keyboard-controller/evidence.json`, component evidence and factory drawing review | Partial: specimen marking is recorded; source variants and replacement ROM remain unresolved. |
| 1. Inventory both photo sides and obscured areas | Evidence source hashes; full-resolution photos; failed global and local registration reports | Implemented as an evidence inventory; occluded joints still need new observations. |
| 1. Record references, packages, pins and supporting evidence | Native schematic, `component-evidence.json`, photo landmarks | Partial: all 70 schematic references exist, but 30 components remain unplaced and discrete terminal maps are incomplete. |
| 1. Track schematic/specimen and firmware differences | `referenceVariants`, gaps, ROM hash in `core/reports/full-audit.json` | Implemented ledger; differences remain unresolved rather than merged. |
| 2. Transcribe components, connectors, rails and nets | Native schematic and generated connectivity | Implemented reference transcription; not specimen continuity proof. |
| 2. Independently review inversions, clocks, connectors and supplies | Factory/Zander comparison, A2 gate review, reset/cable corrections and handbook review | Partial for specimen fidelity: WR/RD source disagreement and substitutions remain open. |
| 2. Export normalized connectivity and comparison wiring | CAD exporter; `core/generate.py`; pinned HDL | Implemented; source/export and HDL freshness checks pass. |
| 2. Classify unused pins and ERC exceptions | Generated connectivity and qualification report | Implemented: unused pins explicit; two isolated-label warnings individually identified as RD_N and SHIELD. |
| 3. Register both sides in one coordinate system | Top landmarks, `bottom-landmarks.json`, generated registration reports | Partial: top fit and bounded CPU/A4 fit are useful; global underside fit fails and scale is nominal. |
| 3. Place outline, footprints, mounting holes and connectors | Native PCB and generated layout | Partial: 44 placed records include four mounting holes; 30 schematic parts remain unplaced. Connector geometry is still estimated. |
| 3. Trace visible copper and associate nets | Native tracks, `route-evidence.json`, unresolved artwork | Partial: 25 assigned sections, 294 unassigned artwork segments. No complete data/clock physical path. |
| 3. Label observed, inferred and unresolved routing | Geometry-bound track evidence; withdrawn-route review | Implemented for current assignments: 17 observed and 8 inferred. Labels preserve uncertainty; they are not measurements. |
| 3. Check connectivity, clearances and schematic agreement | Native integration test, DRC and pad-net checks | Partial: pad-net agreement passes; 229 airwires and one unfinished A1 endpoint remain. Not fabrication-ready. |
| 4. Export outline, holes, pads, vias, copper, transforms and IDs | Native exporter and generated layout/SCAD; synthetic arc/via integration test | Implemented for represented geometry; no physical via is asserted in the current reconstruction. |
| 4. Reuse detailed components positioned by footprint/reference | Nine DIPs, 21 resistors, BR1 and C5.1–C5.4; native lead/pad consumers | Partial: remaining discretes and connector details still use estimates or placeholders. |
| 4. Keep assembly and mechanics in OpenSCAD | `specimen-details.scad`, model assembly and inspection views | Implemented; dimensions and exact mechanical fit remain photo estimates. |
| 4. Replace duplicate placements/artwork after review | Native migrations and remaining legacy component/artwork arrays | Partial: native migrations are synchronized, but remaining legacy geometry has not been fully replaced. |
| 4. Detect mirror/rotation errors, align leads, regenerate deterministically and fit assembly | Asymmetric export checks, native pad consumers, twelve mesh receipts, visual baselines, repeated native export test | Partial overall: native output repeatability is now directly checked; remaining estimated lead interfaces and specimen dimensions are not qualified. Mesh freshness alone is not a physical-fit test. |
| 5. Generate structural wiring; separate and review chip behavior | `core/generated/controller.v`, `chips.v`, documented source review | Implemented for the reference digital model; analog stages and unsupported device states remain outside the claimed scope. |
| 5. Model open collectors/pull-ups and document analog boundaries | `chips.v`, generated pull strengths, bridge service test and README | Implemented digital boundaries; oscillator/reset analog behavior and contact resistance are unmeasured. |
| 5. Compare common CPU transactions and matrix inputs | Full audit: 131,072 transactions, zero differences | Implemented within scope; A15-high writes are excluded because of physical bus contention. |
| 5. Exercise ordinary keys, modifiers, repeat, release and reset | Firmware stimulus coverage and recorded events | Implemented reference workload: 4.6 million clocks, 390 serial bits and 11,971 raw LED records agree logically. |
| 5. Qualify an independent CPU HDL model and record shared dependencies | Pinned TV80 manifest and report source hashes | Implemented reference comparison. Same ROM and scheduled contacts are shared; exact CPU cycle equivalence is explicitly false. |
| 5. Retain first difference, stimulus and waveform | Diagnostics implementation, fault-injection tests and failure replay | Implemented; bus and firmware clocks are distinguished. Analog/specimen timing is not inferred from those traces. |
| 6. Preserve IDs in exported sidecars | Layout component refs/pins/nets and route UUIDs; pinned museum JSON | Implemented for native geometry. Aggregated meshes do not individually identify every legacy component body. |
| 6. Select component/net geometry and evidence | Museum inspector and browser tests | Implemented for estimated pads, assigned routes and available photos; unplaced parts receive no fabricated pad positions. |
| 6. Connect supported diagnostics and label illustration | Raw latch diagnostics and separate 2 ms LED display persistence | Implemented for supported signals; frame samples are not full waveforms or specimen measurements. |
| 6. Check stale exports, references, pin maps and mappings | Export tests, per-mesh receipts, sync scripts and browser checks | Implemented consistency checks; these cannot independently validate a photo interpretation. |
| 6. Fast CI and separate longer qualification target | CAD workflow; core workflow; `qualify-keyboard-controller` target | Implemented. Native KiCad integration remains a local optional check; ROM-dependent firmware qualification is separate. |
| 6. Record compatible revisions and validation | Museum source manifest, controller JSON and progress record | Implemented pins and source hashes. This is an intermediate reconstruction, not a specimen-qualified release. |
| First milestone: complete actual data/clock path through all representations | Schematic/HDL and partial PCB routes | **Incomplete:** logical path is tested; physical copper and connector correspondence are not complete. |
| Completion: checked connectivity, reproducible geometry, routing evidence, digital comparisons and exact specimen fidelity | Artifacts above | **Incomplete:** consistency is substantially implemented; physical reconstruction, ROM identity, dimensions and timing remain open. |

The current 30 unplaced references are BR2; C1, C2, C3.1, C3.2, C4,
C5.5, C6; L1.1–L1.4; R1, R2, R6.4, R6.5;
V1.1, V1.2, V2, V3.1, V3.2 and V4.1–V4.9. Some have plausible locations;
that does not establish numbered pads or net attachments.
R6.4 and R6.5 have factory identities and unnumbered primary-photo lead-end
candidates. Raised bends obscure their hole centres; comparison close-ups do
not establish primary terminal numbering. They remain unplaced.

The comparison-specimen `br2-terminal-order-review` records both endpoint
candidates and a partial edge-corridor trace. It does not establish which end
reaches A5:26 or V4.9:C. CPU pin 26 has no visible underside branch in the reviewed
close-up; its top-side connection remains untraced. BR2 stays unplaced, with no
new assigned copper or qualified underside registration.

## New comparison evidence

On 2026-10-17 the user supplied 25 photographs of a **different specimen** in
`Photos-1-001 (13).zip`. CAD `227bddc` records them under
`evidence.json:comparisonSpecimens` with separate provenance and per-image hashes.
The matching visible board markings corroborate the family; the EPROM label
reads S642, with contents unread. These photos provide clearer underside, CPU,
bridge, connector and transistor views and reopen the physical review work below.
The numbered review in CAD `5456c23` shows an apparent CPU pin-6 trace and a likely
top terminal whose trace passes between A4 leads 12 and 13. This weakens the earlier
apparent D6 conflict; cross-side terminal identity remains provisional.
Each image needs its own pin-count and registration review before geometry is
transferred, and the two specimens' routing must be compared explicitly.

The user confirms that the museum ROM was replaced; an original ROM may be found
later. Firmware contents remain unread, independently of PCB reconstruction.

The requirement audit and numerical coverage above remain unchanged. The new
photos have not supplied measurements, a ROM dump or verified whole-board
continuity for either specimen.

## Next specimen evidence, in priority order

These are observations to collect when the specimen is available. They do not
require opening BR1/BR2. Record the actual board marking, component-side pin-one
orientation and unmodified bridge state before comparing against the reference.
Use an unpowered, disconnected board for resistance/continuity observations.
Record readings and probe locations rather than treating a continuity buzzer as
proof of a direct copper path through populated circuitry.

| Priority | Question and target | Evidence to retain | What it would resolve |
| --- | --- | --- | --- |
| 1 | Re-read the withdrawn CPU track's apparent origin near bottom pixel (1306,2678) and terminal (1354,2811), with adjacent numbered CPU pins visible | Sharp perpendicular underside close-up; matching top view around (1527,3048); original uncropped images and pin-count annotation | Whether the apparent A5:6 attachment and cross-side terminal match are real. The apparent top path to A4:13 D6 must be checked independently. Do not assign CLK or D6 merely from proximity. |
| 2 | BR1, R10.3, A5:6 and A7:8 | Both bridge ends and lead/hole correspondence; baseline resistance observations with bridge state recorded | Clock network continuity and the proposed source/CPU-side orientation. A closed bridge can make both ends read connected to both sides; this alone cannot establish terminal order. |
| 3 | BR2, A5:26 and the reset-source region | Both bridge ends, solder joints and traces; close-up of V4.9 and its package markings | Reset bridge placement and source/CPU-side identity. V4.9:C is a reference endpoint, not yet a physically numbered transistor lead. |
| 4 | A1:1 output-clock input, CPU WR pin 22 and RD pin 21 | Trace-following photos and distinguishable resistance observations | WR/RD disagreement between published references and the specimen. Paths through ICs must not be mistaken for direct traces. |
| 5 | XT1 and L1 cable/filter connections | Connector mating face, pin marks, wire colours, both board sides and winding-terminal identification | Actual keyboard data/clock path through the cable filter; schematic pin names alone do not qualify the physical connector. |
| 6 | Remaining discrete pads, especially R6.4/R6.5 and C6/R4.3 | Oblique and perpendicular close-ups showing where bent leads enter the board, with nearby known DIP pads | Numbered pad assignment without substituting raised body ends for holes. Include transistor and network markings for package pin-map review. |
| 7 | Board dimensions and underside registration | Board width/length/thickness, hole centres, at least two independent known distances, perpendicular full-board images | Nominal scale, socket-to-hole offsets and a defensible global registration. Keep validation landmarks separate from fit anchors. |
| 8 | Specimen EPROM | Package marking, board orientation, read method/settings and repeated dump hashes; preserve original binary separately | Specimen firmware identity. The reference S600 hash is not evidence that the replacement EPROM contains S600. |
| 9 | Clock, reset and serial timing | Raw instrument captures, sample rate/timebase, probe points, supply/setup, trigger, bridge state, startup and key stimulus | Measured clock frequency, reset timing and serial behavior; comparison with the reference must retain board-revision differences. |

The generated service model supports opening the *virtual* bridges and injecting
clock/reset on their CPU sides. That is covered by 13 digital tests. It is not a
manufacturer procedure for opening the specimen links. Do not choose a physical
opening or injection procedure until terminal identity, construction and drive
conditions have been established. Closed-link baseline observations come first.

## Observation record

Use one record per reading or capture; leave unknown fields explicitly unknown.
A negative or ambiguous observation is useful evidence and must not be silently
turned into a positive continuity result.

```text
Observation ID / date / operator:
Board marking and package markings:
Original photo or capture filenames and SHA-256:
Board orientation and pin-numbering basis:
Bridge state (BR1 / BR2), power and cable configuration:
Instrument / mode / range / sample rate / probe arrangement:
Probe A: reference and pin if established; otherwise annotated photo pixel:
Probe B: reference and pin if established; otherwise annotated photo pixel:
Raw reading / waveform / repeated result:
Alternative paths or unresolved junctions:
Conclusion supported by this observation:
Claims explicitly still unresolved:
```

Import future evidence into the CAD source manifest and component/route review,
then update native geometry only after resolving its identity. Re-export, review
both sides, run the relevant native and digital checks, and pin compatible museum
assets. A new measurement can revise an earlier interpretation; preserve the
superseded record and its reason, as with the withdrawn CLK candidate.
