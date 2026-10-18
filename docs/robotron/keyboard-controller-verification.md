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
- **Receiver and service coverage:** the [receive-edge review][receive-edge]
  establishes rising RxC sampling. Corrected [single-press][rising-host],
  [reset][reset-spacing] and [modifier][modifier-spacing] pairs pass logical,
  sampled-stability and serial-edge refinement checks; reset also verifies CPU
  restart. [Input stress and clock-width checks][loaded-host] retain their assumed
  thresholds. [U856 source conditions][u856] do not identify Schmitt thresholds or
  exact input I/V behavior. Remaining scenarios and device applicability are open.
- **Voltage convergence:** [further refinement][paired-host] does not consistently
  reduce absolute-time voltage differences. The [spacing control][spacing-pair]
  leaves single-press waveforms unchanged, although spacing is consequential to
  the [reset-release failure][reset-control]. Serial-edge agreement alone cannot
  qualify the loaded voltage waveforms.
- **Transition failure:** the [solver audit][truncation-audit] identifies a final
  inductor truncation rejection after a successful Newton solve, with no nearby
  pending breakpoint in the logged transition window. The [boundary capture][driver-boundary] locates a rising driver edge, and an
  [replay boundary control][analog-replay] completes after removing an artificial
  capture-end breakpoint. The replay failure therefore does not independently
  confirm the original mechanism. Prefix voltage differences also prevent assuming
  an identical trajectory. Investigate the original coupled transition separately;
  rejected trial states are not physical measurements.
- **Closed-board execution:** the [execution assessment][board-host] retains a
  timed-out scenario and completed startup diagnostic with the same circuit.
  Full scenario completion remains unproven. Allow adequate execution time and
  review startup separately from the recorded receiver window.
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

[analog-replay]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-analog-driver-replay-no-capture-knot/assessment.json
[modifier-spacing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-modifier-minbreak-fine/assessment.json
[truncation-audit]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-transition-audit/assessment.json
[driver-boundary]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-driver-boundary/assessment.json
[reset-spacing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-reset-minbreak-fine/assessment.json
[reset-control]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-reset-default-spacing/assessment.json
[rising-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-fine/assessment.json
[receive-edge]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receive-edge/assessment.json
[loaded-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-load/assessment.json
[u856]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/u856_limits.json
[spacing-pair]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-minbreak-25ns/assessment.json
[paired-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-refined/assessment.json
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

## Recording new evidence

Retain board identity, orientation and pin-numbering basis, bridge/power/cable
state, instrument settings, probe locations, original files and hashes, repeated
readings and unresolved alternatives. Unknown fields remain unknown; ambiguous
continuity does not establish a connection.

Import observations into the CAD evidence manifest and component/route review.
Resolve terminal identity before changing electrical pads or nets; unassigned
visual geometry can remain separate. Regenerate, review both sides, run the
relevant checks and pin compatible museum assets. Preserve superseded evidence
and the reason for changing its interpretation.
