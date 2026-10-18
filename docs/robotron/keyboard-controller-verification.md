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
- **Host integration:** the experimental receiver participates in service and
  closed-board fixtures. The [loaded service assessment][loaded-host] supports
  input stress and a clock-width screen at an assumed threshold. The
  [receive-edge review][receive-edge] identifies a falling-edge observer error:
  U856 samples rising RxC. The [corrected service pair][rising-host] passes
  logical, scenario, sampled-stability and serial-edge refinement checks. Its voltage bytes match the prior capture,
  allowing source-bound voltage reviews to be reused; earlier falling-edge
  stability results retain their original scope. [U856 source conditions][u856] constrain loading
  and timing, but do not identify Schmitt thresholds or exact input I/V behavior.
  Loaded timestep convergence and device applicability remain open.
- **Numerical agreement:** the [paired service review][paired-host] passes
  serial-edge refinement but exposes substantial absolute-time voltage differences.
  [Retained transition windows][transitions] associate selected maxima with small
  edge shifts; they do not establish full-waveform convergence or physical timing.
- **Closed-board execution:** the [execution assessment][board-host] retains a
  timed-out full scenario and a completed, unchanged-circuit startup diagnostic.
  This supports allowing more execution time, not declaring a hardware blocker.
  Full scenario completion remains unproven. Receiver reviews cover only the
  recorded window and cannot qualify startup outside it or erase firmware failures.
- **Host and cable applicability:** [load screening][host-loads] exercises explicit
  capacitance/leakage assumptions. [Filter checks][filter] verify generated winding
  hypotheses, while [D104 switching checks][host-switching] expose unqualified
  device dynamics. Nominal passes do not identify physical winding parameters,
  clamp behavior or installed-device loading.
- **Oscillator applicability:** primary К555ЛА3, comparison D100D and reference
  DL000 require separate conditions. [Device reviews][device-review] and
  [internal-state captures][internal-state] constrain candidates without qualifying
  startup. [Independent solver replay][xyce] reproduces transfer branches, weakening
  an ngspice-only explanation but not establishing physical device behavior.

[rising-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-fine/assessment.json
[receive-edge]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receive-edge/assessment.json
[loaded-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-load/assessment.json
[u856]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/u856_limits.json
[paired-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-buffer-fine/assessment.json
[transitions]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-transition-windows/assessment.json
[board-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-host-load/assessment.json
[host-loads]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-loads/assessment.json
[filter]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/filter-coupling/assessment.json
[host-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-buffer-switching/assessment.json
[device-review]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/diode-role-review/assessment.json
[internal-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/oscillator-internal/assessment.json
[xyce]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/xyce-transfer500/assessment.json

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
