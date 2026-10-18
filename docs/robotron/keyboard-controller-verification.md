# Keyboard controller requirement audit

The [plan](keyboard-controller-plan.md) is **not complete**. This maps requirements
to current artifacts and missing proof. Compatible source revisions are pinned in
the museum manifests linked by the [status guide](keyboard-controller-progress.md).
The linked investigations may be newer than the museum's pinned assets. Paths
below are relative to the CAD controller directory unless stated otherwise.

| Requirement | Evidence | Remaining proof |
| --- | --- | --- |
| Identify board, parts and source variants | `evidence.json`, `component-evidence.json`, native schematic | Specimen substitutions, discrete terminal mapping and ROM contents |
| Inventory photographs and occlusions | Source hashes, photo landmarks, comparison-specimen records | Hidden joints and independent cross-side correspondence |
| Transcribe connectivity and review pins | Native schematic, `generated/connectivity.json`, qualification report | Specimen WR/RD disagreement; transcription is not continuity proof |
| Register and place the board | Native PCB, generated layout and registration reports | Unplaced parts, unclassified A8 contact, measured scale and global underside fit |
| Trace copper with evidence | Native tracks, `route-evidence.json`, unassigned artwork | Complete physical data/clock paths and unresolved attachments |
| Check connectivity and clearances | Native pad-net checks, ERC/DRC report | Outstanding DRC findings; not fabrication-ready |
| Generate geometry and reuse component shapes | Exporter, generated SCAD, assembly wrapper | Remaining discrete migrations and measured mechanical fit |
| Preserve orientation, lead alignment and repeatability | Asymmetric landmark tests, native integration test, mesh receipts and visual baselines | Estimated lead interfaces and actual specimen dimensions; solid-clearance scope is limited to CAD `../checks/assembly.json` |
| Generate structural HDL with reviewed chip behavior | Core `generated/controller.v`, chip models and source review | Qualified analog device parameters and unsupported device states |
| Couple electrical circuits and HDL | Core analog harness, generated decks, interface and load checks | Full-board clock-phase convergence, remaining firmware scenarios, model calibration, supply/brownout behavior and bus timing qualification |
| Compare transactions and firmware behavior | Core qualification reports, pinned TV80 model and S600 workload | Specimen ROM/timing; exact cycle equivalence remains false |
| Retain diagnostics and replay | First-difference traces, stimulus, waveform and fault-injection tests | Instrumented specimen comparison |
| Preserve IDs and expose evidence in the museum | Export sidecars, component/net inspector and browser tests | Visual-only bodies do not establish native pads |
| Connect runtime diagnostics | Latch samples, labelled display persistence and a pinned recorded bus waveform | Live frame samples are not full waveforms; recorded simulation does not establish specimen behavior |
| Reject stale or mismatched exports | Source hashes, mesh receipts, sync checks and CI | Consistency checks cannot validate photo interpretations |
| Separate fast checks and longer qualification | CAD native/export CI, core workflows and core qualification target | Longer firmware and mixed-signal qualification remain separate gates |
| Complete the first physical data/clock milestone | Logical circuit and partial native copper | Driver/cable/filter copper continuations remain incomplete |

## Current findings and their consequences

- **Connector and copper:** locally registered X1 joints support native pad and
  lead placement with reference-derived row order. The COL11 attachment is
  reconstructed; A8 remains unclassified. Visible data/clock pull-up branches
  end at solder eyes with unresolved continuations. Registered underside joints
  resolve the adjacent resistor-pad clearance conflicts; pad dimensions and
  unobserved continuations remain estimates. A bounded local top fit supports the
  visible branch beside A1, with a residual clearance failure against an estimated
  supply pad. The under-package attachment and outer-row registration remain
  unresolved. See CAD `generated/connector-review.json`,
  `route-evidence.json` and `generated/qualification.json`.
- **Resistor-bank identity:** factory placement identifies the R1/R2 bodies.
  The KWH catalog resolves comparison R1's 3894 marking and documents its unused
  terminal. Primary identity/orientation still needs corroboration; R2 package
  identity and factory/Zander branch numbering remain unresolved. Museum body
  rectangles and package references do not assign installed pads. See CAD
  `component-evidence.json` and `evidence.json` for sources and terminal candidates.
- **Visual geometry:** primary-photo observations place the unassigned resistor
  banks and raised axial bodies/leads. Nominal assembly clearances pass; lead
  heights and package dimensions remain estimates, and hidden holes are not
  inferred. See CAD `generated/layout.json` and `../checks/assembly.json`.
- **Output filter:** the current electrical surrogate uses uncoupled series
  windings. Shared-core coupling, winding orientation and ferrite losses remain
  unqualified; review these assumptions alongside the physical cable path. See
  core [output circuit](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/output_circuit.py)
  and [probe assumptions](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/output_probe.py).
- **Device conditions:** primary A7 is К555ЛА3; comparison D100D and reference
  DL000 remain separate. Some TI endpoint failures do not apply to the reviewed
  К555ЛА3 conditions. Selected DC passes, including a separate input-diode
  assumption, still do not produce a qualified oscillator. See the
  [device-condition and diode review](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/diode-role-review/assessment.json).
- **Operating state:** matched transient/AC and internal-current captures explain
  the second gate's attenuating response in the tested candidates. Finite recovery,
  loaded ratios and the incomplete pole search do not prove general stability.
  See the [internal-state assessment](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/oscillator-internal/assessment.json)
  and its linked AC and disturbance evidence.
- **Transition behavior:** Xyce reproduces the candidate transfer branches seen
  in ngspice, including a narrow branch missed by the coarse sweep. This weakens
  an ngspice-only explanation; it does not establish physical hysteresis or device
  calibration. Published transfer conditions leave fixture choices unresolved.
  See the [independent transfer review](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/xyce-transfer500/assessment.json)
  and its linked source/fixture assessment.
- **Completion:** digital agreement and synchronized geometry remain useful
  foundations. Neither closes the physical data/clock milestone nor full-board
  electrical acceptance. These gaps still have desk-work routes; missing specimen
  ROM contents alone are not a blocker.

## Resolve at the desk first

Physical uncertainty and model qualification are open investigations. Follow the
[plan's next-work sequence](keyboard-controller-plan.md#next-work-and-acceptance)
before treating either as a specimen dependency. Exact photo locators, pin-map
candidates and superseded interpretations belong in the CAD evidence manifests,
not a second inventory here.

| Open question | Desk-work route | Residual observation if still ambiguous |
| --- | --- | --- |
| Withdrawn CPU track and BR1 attachments | Follow overlapping photos; independently check pin numbering and cross-side correspondence | Close-ups showing complete joints; distinguishable continuity readings |
| BR2 source/CPU identity | Preserve the exported unassigned wire; constrain terminal correspondence with lead paths and package drawings | Visible joints or observations that distinguish the two ends; a closed bridge alone cannot do so |
| Output-clock WR/RD discrepancy | Compare complete trace paths and keep published revisions separate | Distinguishable physical connection to the CPU pins |
| X1 unclassified contact and cable/filter path | Use registered joints and both row constraints in `generated/connector-review.json` and `generated/connector-terminals.json`; classify A8 and resolve cable/winding attachments | Markings or complete trace/joint observations that distinguish remaining candidates |
| Discrete pads and underside registration | Resolve R1/R2 terminal correspondence and other discrete leads with independent landmarks; body ends are not hole centres | Hidden lead-entry close-ups and measured dimensions |
| Device models and full-board electrical behavior | Constrain transition-region characteristics and circuit assumptions using independent device evidence; retain separate device condition sets before coupled qualification | Targeted captures only for behavior not constrained by published evidence |
| Specimen ROM and timing | Continue reference qualification with standard S600; keep replacement-ROM identity separate | Repeated ROM reads and raw clock/reset/serial captures with setup details |

Comparison photographs depict another specimen. Register and compare them before
transferring geometry. Named body observations can support a visual model without
establishing electrical pads; do not restore a withdrawn net assignment merely
because nearby traces align.

For eventual specimen observations, record board marking, pin-one orientation and
unmodified bridge state first. Use an unpowered, disconnected board for resistance
or continuity checks, retaining readings and probe locations: populated-circuit
paths can mislead a continuity buzzer. Virtual BR isolation tests establish no
manufacturer procedure for opening physical links. Closed-link baseline evidence
comes before any separately justified opening or injection procedure.

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
then update electrical pads or nets only after resolving their identity.
Observed unassigned geometry may be represented independently. Re-export, review
both sides, run the relevant native and digital checks, and pin compatible museum
assets. A new measurement can revise an earlier interpretation; preserve the
superseded record and its reason, as with the withdrawn CLK candidate.
