# Keyboard controller requirement audit

The [plan](keyboard-controller-plan.md) is **not complete**. This maps requirements
to current artifacts and missing proof. Compatible source revisions are pinned in
the museum manifests linked by the [status guide](keyboard-controller-progress.md).
Paths below are relative to the CAD controller directory unless stated otherwise.

| Requirement | Evidence | Remaining proof |
| --- | --- | --- |
| Identify board, parts and source variants | `evidence.json`, `component-evidence.json`, native schematic | Specimen substitutions, discrete terminal mapping and ROM contents |
| Inventory photographs and occlusions | Source hashes, photo landmarks, comparison-specimen records | Hidden joints and independent cross-side correspondence |
| Transcribe connectivity and review pins | Native schematic, `generated/connectivity.json`, qualification report | Specimen WR/RD disagreement; transcription is not continuity proof |
| Register and place the board | Native PCB, generated layout and registration reports | Unplaced parts, connector geometry, measured scale and global underside fit |
| Trace copper with evidence | Native tracks, `route-evidence.json`, unassigned artwork | Complete physical data/clock paths and unresolved attachments |
| Check connectivity and clearances | Native pad-net checks, ERC/DRC report | Outstanding DRC findings; not fabrication-ready |
| Generate geometry and reuse component shapes | Exporter, generated SCAD, assembly wrapper | Remaining discrete migrations and measured mechanical fit |
| Preserve orientation, lead alignment and repeatability | Asymmetric landmark tests, native integration test, mesh receipts and visual baselines | Estimated lead interfaces and actual specimen dimensions |
| Generate structural HDL with reviewed chip behavior | Core `generated/controller.v`, chip models and source review | Analog oscillator/reset behavior and unsupported device states |
| Compare transactions and firmware behavior | Core qualification reports, pinned TV80 model and S600 workload | Specimen ROM/timing; exact cycle equivalence remains false |
| Retain diagnostics and replay | First-difference traces, stimulus, waveform and fault-injection tests | Instrumented specimen comparison |
| Preserve IDs and expose evidence in the museum | Export sidecars, component/net inspector and browser tests | Legacy bodies do not all have native pad geometry |
| Connect runtime diagnostics | Latch samples and separately labelled display persistence | Frame samples are not full waveforms |
| Reject stale or mismatched exports | Source hashes, mesh receipts, sync checks and CI | Consistency checks cannot validate photo interpretations |
| Separate fast checks and longer qualification | CAD/core workflows and core qualification target | Native KiCad integration is local; firmware qualification requires ROM |
| Complete the first physical data/clock milestone | Logical circuit and partial native copper | Actual copper and connector correspondence remain incomplete |

Transistor package drawings distinguish SC308's centre emitter from SC236's centre
base. Named body-only photo observations do not establish installed orientation or
numbered pads. R6.4/R6.5 candidates identify raised lead ends, not hidden holes.
BR2 endpoint candidates and the withdrawn CPU CLK route remain in the evidence
review ledger without electrical promotion.

Comparison photos depict a different specimen. They clarify construction but
require independent registration and routing comparison. The museum ROM is a
replacement; its unread contents are a separate question from PCB reconstruction.

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
clock/reset on their CPU sides. That behavior is covered by the digital service tests. It is not a
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
