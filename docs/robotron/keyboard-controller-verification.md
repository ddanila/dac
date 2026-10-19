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

- **Physical reconstruction:** local photo registration supports placed joints
  and visible copper, but the data/clock continuations, under-package attachment,
  global underside fit and discrete terminal mapping remain unresolved. Package
  evidence constrains resistor-bank candidates without proving primary-specimen
  identity or orientation. Visual bodies and raised leads do not establish pads;
  dimensions and lead heights remain estimates. See CAD `route-evidence.json`,
  `component-evidence.json`, `generated/connector-review.json` and
  `generated/qualification.json` for individual findings.
- **Receiver and service coverage:** [rising RxC][receive-edge] is the reference
  sampling edge. Retained service pairs support logical and serial-edge agreement,
  including [release/repress][release-pair] and indicator intent timing. The core's
  [evidence index][analog-guide] owns scenario coverage and refinement status.
  The [independent timing screen][receiver-timing] uses Zilog conditions as a
  diagnostic reference;
  it does not establish U856 thresholds, loading or device applicability.
- **Voltage convergence:** [single-press refinement][paired-host] and
  [release/repress comparison][release-pair] retain material absolute-time voltage
  differences despite timing agreement. Qualify voltage convergence independently;
  phase alignment or discarded transition peaks cannot resolve this gate.
- **Numerical convergence:** [higher-precision replay][mpfr] completes with Gear
  at the coarse step but fails timestep refinement. Increasing linear precision
  leaves the recorded trajectories unchanged. [Higher-precision integration][integration],
  alone and combined with linear solving, also fails. Accurate final local
  arithmetic does not establish an accurate accumulated trajectory. Locate where
  accepted/rejected state histories diverge before choosing another intervention;
  require completed refinement pairs before adopting a numerical remedy.
- **Closed-board execution:** the [startup-inclusive capture][board-host] passes
  reset activity, first fetch, rising-RxC bit transport and scenario-window checks.
  CPU clock high-level and timing screens fail within the declared valid-supply
  range; later supply-valid intervals do not all include fresh reset evidence.
  Resolve these electrical failures before acceptance. Host reviews and completed
  refinement remain required; producer success does not establish qualification.
- **Host and cable applicability:** [load screening][host-loads] exercises explicit
  capacitance/leakage assumptions. [Filter checks][filter] verify generated winding
  hypotheses, while [D104 switching checks][host-switching] leave buffer
  dynamics unqualified. The [reference 7406 fixture][driver-switching] shows that
  the generic driver meets published maximum delays while switching much faster
  than typical values. Constrain its charge storage and capacitance independently;
  typical delays do not uniquely determine those parameters. The [public vendor
  candidate][vendor-driver] fails SN7406 DC admission despite its shared device
  header. Common-core photo evidence supports investigating coupling, but the
  [matched firmware comparison][firmware-filter] fails with both tested winding
  hypotheses. Neither identifies physical parameters or a unique failure cause.
- **Oscillator applicability:** primary К555ЛА3, comparison D100D and reference
  DL000 require separate conditions. [Device reviews][device-review] and
  [internal-state captures][internal-state] constrain candidates without qualifying
  startup. [Independent solver replay][xyce] reproduces transfer branches, weakening
  an ngspice-only explanation but not establishing physical device behavior.

[receiver-timing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receiver-timing-review/assessment.json
[receive-edge]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receive-edge/assessment.json
[paired-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-refined/assessment.json
[board-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-host-rising-full-startup/assessment.json
[host-loads]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-loads/assessment.json
[filter]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/filter-coupling/assessment.json
[driver-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-driver-switching/assessment.json
[host-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-buffer-switching/assessment.json
[device-review]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/diode-role-review/assessment.json
[internal-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/oscillator-internal/assessment.json
[xyce]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/xyce-transfer500/assessment.json
[release-pair]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-release-repress-minbreak-fine/assessment.json
[analog-guide]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/README.md#qualification-and-retained-evidence
[integration]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-mpfr-integration/assessment.json
[vendor-driver]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-driver-vendor-review/assessment.json
[firmware-filter]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-filter-strict/assessment.json
[mpfr]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-mpfr-transient/assessment.json

## Resolve at the desk first

Physical uncertainty and model qualification are open investigations. Follow the
[plan's next-work priorities](keyboard-controller-plan.md#next-work-and-acceptance)
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
