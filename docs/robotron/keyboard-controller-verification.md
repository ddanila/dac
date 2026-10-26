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
| Register and place the historical board | Native PCB, generated layout and registration reports | Unplaced parts, measured scale and global underside fit |
| Trace copper with evidence | Native tracks, `route-evidence.json`, unassigned artwork | Complete physical data/clock paths and unresolved attachments |
| Check connectivity and clearances | Variant-specific native pad-net checks and ERC/DRC reports | Historical DRC findings; specimen fit and electrical qualification |
| Generate geometry and reuse component shapes | Historical exporter and proposed `reference/assembly-generated/` with shared DIP bodies, package mappings and formed leads | Remaining package assumptions, installed package orientation and measured mechanical fit |
| Preserve orientation, lead alignment and repeatability | Asymmetric landmark tests, native integration test, mesh receipts and visual baselines | Estimated lead interfaces and actual specimen dimensions; historical solid-clearance scope is CAD `../checks/assembly.json`; reference body, lead/body envelope and nominal lead-to-lead checks live in `reference/assembly-generated/assembly.json`, nominal and proposed allowance enclosure checks are retained in `reference/enclosure-review.json`; measured forming tolerances and enclosure fit remain open |
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

| Gate | Current evidence | Remaining proof |
| --- | --- | --- |
| Numerical convergence | [Transient-error refinements][transient-error] pass the unchanged full-window reset-release voltage gate with identical observed bus events. The explicit-default control reproduces all baseline waveforms. This is a bounded comparison with ideal external clock/reset. | A [complete no-spool replay][online-stream] preserves the retained absolute-time comparison; a [live three-level RC control][live-stream] also matches stored-waveform comparisons. Keyboard-scale resource bounds and evidence retention remain open. Full-repeat numerical coverage and coupled rollback remain open under the unchanged [numerical gate](keyboard-controller-plan.md#numerical-convergence). Keep the candidate opt-in until those controls pass; physical model admission remains separate. |
| HDL/electrical scheduling | [Post-reset combined-fix controls][postreset-startup] include an exact disabled baseline and forced retry with identical firmware records. Their [complete three-level comparison][postreset-refinement] preserves firmware records and stays below the voltage-error ceiling, but fails the non-growing-error condition. [Live state observation][live-cosim-state] covers exposed state; [Complete post-reset output-state controls][postreset-output-state] preserve every observed sample and firmware record and detect immediate/delayed external-output faults. [Instance-queue controls][instance-queue] establish that coverage only in the bounded fixture. | Long-window instance-state controls and private HDL event coverage, startup/history and full-repeat retries remain open. Ordering and monotonic time do not prove general rollback; the supply-relative bus-voltage failure remains a separate acceptance gate. |
| Onboard clock | [Reference oscillator screens][clock-acceptance] fail U880 level or timing requirements. | Independently constrained intended-family dynamics and startup-inclusive board qualification. Preserve separate primary К555ЛА3, comparison D100D and reference DL000 conditions. |
| Reset | [C4 source-alternative studies][reset-alternatives] cover isolated exploratory reset behavior. The [full startup setup screen][reset-setup] cannot establish RESET timing because the reference clock lacks qualifying voltage rises. | Installed component identity and coupled reset/recovery qualification; retain the reference default. |
| Device and load admission | [Static endpoint screens][device-endpoints] pass selected conditions; [driver/recovery evidence][serial-path] retains non-unique dynamics and load sensitivity. [Linear bus drivers][bus-device] fail a minimum-supply guarantee. [DC-only alternatives][bus-endpoints] satisfy the tested endpoints; both I8282 candidates fail the independent [loaded switching test][bus-switching]. [Enabled-output replacements][bus-enabled] satisfy DC and loaded edge constraints; [joint capacitance checks][bus-capacitance] reject the weaker candidate with the existing fixture capacitance. Enable/release, propagation and physical capacitance remain open. CPU/ROM alternatives remain unconstrained dynamically; none is admitted. | Independent driver/CPU I/V, switching and reverse-recovery behavior, plus filter/cable/host impedance. Endpoint fitting and firmware agreement cannot admit these models. |
| Independent solver agreement | [Recorded-boundary bus replay][bus-read] reproduces the isolated excess across solvers. | Physical applicability and live coupled behavior; replay agreement cannot identify a specimen fault. |
| Host reception | [Receive-edge][receive-edge] and [service timing][receiver-timing] evidence support the reference's logical reception. | Onboard clock/reset and U856 device conditions remain separate. |
| Evaluator caching | Complete paired [startup][eval-cache] and [recorded bus-read][eval-cache-bus-read] captures are byte-identical. The [live post-reset comparison][postreset-cache] preserves every waveform sample, firmware event and solver/HDL timing record. | Full-repeat live firmware/service controls and paired equivalence. Keep caching opt-in. |

### Physical evidence

Global underside registration remains unqualified. The
[distributed X1/CPU fit](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/distributed-registration/assessment.json)
supports longitudinal scale but leaves transverse scale ambiguous; the
[mounting-hole review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/mount-hole-registration/assessment.json)
cannot distinguish the retained alternatives. Use the
[measurement targets](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/registration-measurements/assessment.json)
for independent constraints, then recheck held-out placement and cross-side correspondence.
A dimension alone does not establish terminal identities or authorize pad moves.

The [EFS drawings](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/efs-form-constraints.json)
provide a shared hole pattern without selecting installed housing form. The
[chamber review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/efs-chambers/assessment.json)
narrows only the comparison specimen. Historical R1 placement and hole mapping
remain unresolved. Alternative package and registration fits live in CAD
`reference/package-reviews/`; preserve them when assessing new evidence.

### Simulator and capture prerequisites

The [input-barrier source argument](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/barrier-state-source/assessment.json)
removes private HDL-queue traversal as a prerequisite for the successful early-return
branch only. The [combined startup-fix controls](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/startup-fixes/assessment.json)
cover a bounded fixture. A [targeted output-recovery control](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-breakpoint-sampled/assessment.json)
exercises a failed breakpoint after HDL advancement while preserving delayed
outputs and the sampled waveform. Neither establishes full startup, supply
recovery, keyboard input perturbations or general rollback. The core's analog
guide owns fault-control evidence and reproduction commands.

The [streaming benchmark](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/keyboard-stream-benchmark/assessment.json)
does not establish full-repeat resource bounds and fails the strict non-growing-error
gate despite voltage differences below the limit. Log-budget enforcement protects
captures from unbounded logs; it does not establish numerical acceptance or bound
total process memory. These software investigations do not depend on resolving
physical board dimensions or installed connector identity.

## Resolve at the desk first

Physical uncertainty and model qualification are open investigations. Follow the
[plan's next-work priorities](keyboard-controller-plan.md#next-work-and-acceptance)
before treating either as a specimen dependency. Exact photo locators, pin-map
candidates and superseded interpretations belong in the CAD evidence manifests,
not a second inventory here.

| Open question | Desk-work route | Residual observation if still ambiguous |
| --- | --- | --- |
| BR1 clock link (schematic: A5 pin 6); remaining physical attachments | Follow overlapping photos; independently check pin numbering and cross-side correspondence | Close-ups showing complete joints; distinguishable continuity readings |
| BR2 reset link (schematic: A5 pin 26); physical end identification | Retain schematic connectivity and the photographed bridge location; constrain only the correspondence between photographed ends and schematic pins | Visible joints or observations that distinguish the two ends; a closed bridge alone cannot do so |
| Output-clock WR/RD discrepancy | Compare complete trace paths and keep published revisions separate | Distinguishable physical connection to the CPU pins |
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

[receiver-timing]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receiver-timing-review/assessment.json
[receive-edge]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/host-receive-edge/assessment.json
[serial-path]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/serial-path/assessment.json
[cpu-bus]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/digital/reports/cpu-bus/summary.json
[device-endpoints]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/device-endpoints/assessment.json
[bus-read]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-read-replay/assessment.json
[eval-cache]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/eval-cache-startup-2ms/assessment.json
[eval-cache-bus-read]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/eval-cache-bus-read/assessment.json
[bus-device]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-device-admission/assessment.json
[clock-acceptance]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/clock-acceptance/assessment.json
[reset-alternatives]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reset-capacitance/generic/assessment.json

[transient-error]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/transient-error-refinement/assessment.json


[postreset-cache]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-cache/assessment.json

[online-stream]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/online-stream-replay/assessment.json

[live-stream]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/live-stream-transport/assessment.json

[live-cosim-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/live-cosim-state/assessment.json

[bus-endpoints]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-endpoint-candidates/assessment.json

[circuit-output]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/circuit-output-state/assessment.json

[bus-switching]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/bus-switching-candidates/assessment.json

[instance-queue]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/instance-queue-state/assessment.json

[postreset-startup]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-startup-fixes/assessment.json

[bus-enabled]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-enabled-candidates/assessment.json

[bus-capacitance]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/i8282-capacitance-candidates/assessment.json

[reset-setup]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-host-rising-full-startup/reset-setup-review.json

[postreset-output-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-output-state/assessment.json

[postreset-refinement]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-combined-refinement/assessment.json
