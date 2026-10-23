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
| Separate reference and historical PCB variants | CAD `reference/`, variant-specific manifests and museum views | Historical promotion still requires independent evidence |
| Complete reference routing | Reference native pad/net checks, connectivity audit and passing DRC | Routing gate satisfied; package adapters, mechanical fit and electrical qualification remain separate |
| Register and place the historical board | Native PCB, generated layout and registration reports | Unplaced parts, unclassified A8 contact, measured scale and global underside fit |
| Trace copper with evidence | Native tracks, `route-evidence.json`, unassigned artwork | Complete physical data/clock paths and unresolved attachments |
| Check connectivity and clearances | Native pad-net checks, ERC/DRC report | Outstanding DRC findings; not fabrication-ready |
| Generate geometry and reuse component shapes | Historical exporter and proposed `reference/assembly-generated/` with shared DIP bodies, package mappings and formed leads | R2/filter surrogates, installed package orientation and measured mechanical fit |
| Preserve orientation, lead alignment and repeatability | Asymmetric landmark tests, native integration test, mesh receipts and visual baselines | Estimated lead interfaces and actual specimen dimensions; historical solid-clearance scope is CAD `../checks/assembly.json`; reference body and lead/body envelope checks live in `reference/assembly-generated/assembly.json`, with lead-to-lead clearance, bend radii and enclosure fit still open |
| Generate structural HDL with reviewed chip behavior | Core `generated/controller.v`, chip models and source review | Qualified analog device parameters and unsupported device states |
| Couple electrical circuits and HDL | Core analog harness, generated decks, interface and load checks | Full-board clock-phase convergence, remaining firmware scenarios, model calibration, supply/brownout behavior and bus timing qualification |
| Compare transactions and firmware behavior | [Production digital acceptance][cpu-bus], retained edge comparisons and complete standard-S600 captures | Declared reference digital scope passes; exhaustive opcode conformance, U880 specimen timing and analog qualification remain separate |
| Retain diagnostics and replay | First-difference traces, stimulus, waveform and fault-injection tests | Instrumented specimen comparison |
| Preserve IDs and expose evidence in the museum | Export sidecars, component/net inspector and browser tests | Visual-only bodies do not establish native pads |
| Connect runtime diagnostics | Latch samples, labelled display persistence and a pinned recorded bus waveform | Live frame samples are not full waveforms; recorded simulation does not establish specimen behavior |
| Reject stale or mismatched exports | Source hashes, mesh receipts, sync checks and CI | Consistency checks cannot validate photo interpretations |
| Separate fast checks and longer qualification | CAD native/export CI, core workflows and core qualification target | Longer firmware and mixed-signal qualification remain separate gates |
| Complete reference data/clock integration | Connected reference PCB, SCAD/museum exports and unchanged schematic contract used by HDL comparisons | Coupled electrical qualification; proposed copper does not close historical continuations |
| Complete historical data/clock integration | Partial evidenced geometry | Driver/cable/filter copper continuations remain incomplete; proposed routing cannot close this gate |

## Current findings and their consequences

The requirement table owns physical and integration gaps. Electrical conclusions
below are scoped to the inputs in the linked reports; the core's
[evidence index](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/README.md#qualification-and-retained-evidence)
owns scenario coverage and experiment details.

| Finding | Consequence | Evidence |
| --- | --- | --- |
| Production firmware, serial timing and known LED transitions agree, including near-edge reset | Preserve identical edge labels and startup validity; legacy completion reports describe the superseded backend | [Production digital acceptance][cpu-bus] |
| Reference reception uses rising RxC; service comparisons support logical agreement | Service fixtures do not qualify onboard clock/reset or U856 device conditions | [Receive edge][receive-edge], [receiver timing][receiver-timing] |
| Held-key/repeat/release passes sampled voltage-envelope and timing screens | Matched refinement and device applicability remain open | [Repeat capture][repeat-capture] |
| Refinement retains absolute-time voltage differences despite serial agreement | Do not align away phase errors or discard transition peaks to claim convergence | [Single press][paired-host], [release/repress][release-pair] |
| Local capacitor correction alone retains trajectory failure; preserving later resistor/switch additions completes two finer short-window replays | Coarse execution still fails and the completed pair retains material absolute-time voltage differences. Single-rounding history sensitivity is too small to explain the selected frozen excursions; accumulated/nonlinear errors remain open | [Later additions][postcap], [history sensitivity][history-sensitivity], [capacitor onset][capacitor-onset] |
| Reference oscillator supply/load screens fail U880 levels or timing | Retain the external digital clock boundary; admit an independently constrained intended-family model before closed-board qualification | [Clock acceptance](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-acceptance/assessment.json) |
| Startup-inclusive execution exposes CPU clock-level/timing failures and incomplete reset recovery | Functional firmware output cannot close full-board electrical qualification | [Startup assessment][board-host] |
| Exact BJT/diode additions do not close numerical convergence | Disabled control is identical; coarse failure and material fine-pair voltage differences remain | [Nonlinear additions][device-additions] |
| Input-boundary scheduling resolves the reproduced input-driven bridge violation | Matched qualified-CPU captures have no ordering diagnostics, but fail a supply-relative bus-voltage check. Full startup is incomplete; later service scenarios remain gated | [Scheduler regression][input-barrier], [original witness][bridge-time] |
| The isolated bus excess persists under numerical refinement | Recorded-boundary ngspice, Xyce and independent KCL replay agree; coupled uncertainty and transient device applicability remain open | [Bus-read replay][bus-read] |
| Nominal-supply linear bus drivers fail the loaded-high guarantee at minimum rated supply | Keep stress fixtures separate from admitted device models; maximum ratings cannot waive static operating checks | [Bus-device admission][bus-device] |
| Zero-hysteresis correction completes the isolated tight replay and preserves nonzero-hysteresis controls | Live coupled refinement still fails later; the later recorded-output replay does not prove live-trajectory equivalence | [Transition isolation][bus-transition] |
| The selected live collapse rejects timesteps despite converged Newton solves, with no ADC decision change in the audited window | Investigate error estimation and state history; replay success alone cannot identify a feedback defect | [Live transition audit][live-transition] |
| A boundary-aligned DAC event can omit the ramp-end breakpoint | Focused regression passes with the opt-in candidate, but tight live controls still fail; candidate remains unadopted | [DAC regression][dac-ramp], [live controls][live-transition] |
| Evaluator caching accelerates the short startup control without changing its waveform | Opt-in only; longer startup and service equivalence remain unqualified | [Cache benchmark][eval-cache] |
| Static device endpoint screens pass sampled published conditions | Does not qualify oscillator or switching dynamics | [Endpoint evidence][device-endpoints] |
| Fitted 7406 candidates pass selected device screens but predict different loaded waveforms | Independent junction, recovery and load evidence must distinguish the hypotheses; calibration alone cannot close admission | [Candidate][driver-dynamic], [withheld validation][driver-validation], [recovery comparison][driver-recovery] |
| Direct-driver refinement preserves firmware behavior; recovery diagnostics expose reverse output operation and load sensitivity | Validate the loaded driver and CPU/bus I/V boundaries before representative electrical traffic; passing numerical and endpoint screens is insufficient | [Live refinement][driver-live], [serial-path admission][serial-path] |
| Host/driver dynamics and filter parameters remain unqualified | Admit models against independent device conditions; photo geometry alone does not identify electrical parameters | [Driver][driver-switching], [host buffer][host-switching], [filter comparison][firmware-filter] |
| Oscillator candidates remain unqualified | Preserve separate primary К555ЛА3, comparison D100D and reference DL000 conditions | [Device review][device-review], [independent solver][xyce] |

The package-distance calibration review and manufacturer CPU pitch correction
are recorded in CAD `sense-review.json` and `component-evidence.json`. They do not
establish the global board dimensions or the primary R1 hole mapping; the
reference package includes its electrically unused lead while remaining unplaced.

[postcap]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-postcap-additions/assessment.json
[history-sensitivity]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-history-sensitivity/assessment.json
[repeat-capture]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-repeat-minbreak/assessment.json
[accepted-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-accepted-budget/assessment.json
[capacitor-onset]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-capacitor-onset/assessment.json
[receiver-timing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receiver-timing-review/assessment.json
[receive-edge]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receive-edge/assessment.json
[paired-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-load-refined/assessment.json
[board-host]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-host-rising-full-startup/assessment.json
[driver-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-driver-switching/assessment.json
[driver-dynamic]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/7406-dynamic/report.json
[driver-validation]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/7406-dynamic/validation/report.json
[driver-live]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/7406-dynamic/live/assessment.json
[driver-recovery]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/serial-path/recovery/assessment.json
[serial-path]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/serial-path/assessment.json
[host-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-buffer-switching/assessment.json
[device-review]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/diode-role-review/assessment.json
[xyce]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-output/xyce-transfer500/assessment.json
[release-pair]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-host-rising-release-repress-minbreak-fine/assessment.json
[firmware-filter]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/firmware-filter-strict/assessment.json

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
| X1 unclassified contact | Use registered joints and both row constraints in `generated/connector-review.json` and `generated/connector-terminals.json`; classify A8 | Markings or complete trace/joint observations that distinguish remaining candidates |
| Serial output to XT1 host cable | Follow the R10.1/R10.2 output branches through the L1 windings; use `review/connection-review.html` for annotated stops and reference endpoints | Complete joint/trace observations identifying winding ends and cable contacts |
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

[cpu-bus]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/digital/reports/cpu-bus/summary.json

[device-additions]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-device-additions/assessment.json
[bridge-time]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/qualified-cpu-bridge-time/assessment.json
[device-endpoints]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/device-endpoints/assessment.json

[input-barrier]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/input-barrier/assessment.json

[bus-read]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-read-replay/assessment.json
[eval-cache]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/eval-cache/assessment.json

[bus-device]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-device-admission/assessment.json
[bus-transition]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-transition/assessment.json

[live-transition]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/live-transition/assessment.json
[dac-ramp]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/test_dac_ramp.py
