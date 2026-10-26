# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes.

## Next work and acceptance

### Desk work — no physical device required

Physical registration, installed connector identity and the museum ROM dump are
not prerequisites for reference emulation. Use standard S600 and explicit model
assumptions. Advance numerical correctness, model applicability and specimen
agreement as separate claims; an unresolved specimen claim must not stop the
other tracks.

| Priority | Work and acceptance |
| --- | --- |
| 1. Combined simulator fixes | Extend coverage to output value-change callback relationships, other referenced data and initialization-only event families. Preserve passing bounded bridge-port, wrapper/stop/display controls and explicit XSPICE initialization; serialize only initialized, meaningful fields. Use the scoped continuation argument for overwritten callback temporaries and the input-barrier non-execution argument where applicable; keep freed-storage evidence separate. Validate startup and supply recovery with matched disabled controls, forced rejection, immediate/delayed corruption, internal state and firmware continuation. |
| 2. Numerical convergence | Resolve the non-monotonic residuals in the completed combined-fix three-level comparison. The completed ADC-enabled full post-reset comparison also fails non-growing error and changes disabled-baseline bus timestamps by one picosecond. Direct bridge controls reproduce history-dependent early input application and pass an opt-in exact absolute-tick candidate. Validate that candidate with bounded board/forced-retry controls, then matched full post-reset refinements and ADC interaction. Resolve the differences before claiming unchanged firmware timing; isolated controls do not establish board convergence. Localize error growth by node, interval and scheduling/integration behavior, separating trajectory error from sampled interpolation effects. Correct demonstrated numerical defects and rerun matched refinements under the unchanged gate below. A completed capture or matching serial output alone is insufficient. |
| 3. CPU/bus and device models | Replace candidates that fail published operating guarantees with explicitly constrained alternatives. Extend the I8282 enabled-output alternatives through enable/release, propagation and capacitance checks; distinguish CPU/ROM alternatives using independent I/V and switching constraints before integration. Preserve source test conditions and validate independent conditions where available; static endpoint agreement does not establish dynamics or specimen calibration. |
| 4. Longer capture qualification | Establish runtime, memory and retained-evidence budgets for longer streaming captures, using explicit log caps. Preserve every sample comparison and enough evidence to review failures. Raw hashes alone do not provide waveform replay. |

Complete private-HDL state coverage and resolve combined-fix error growth. Preflight
resources before long captures; execution cost is a computational dependency,
not a need for specimen hardware. Supply recovery needs its own stimulus and
acceptance checks; service reset injection is not closed-board brownout evidence.
Establish a reset assertion and release under rated supply and qualified clocks
with the published RESET setup/hold limits before claiming a defined restart
after undervoltage. Firmware continuation alone
cannot substitute for an unmodeled CPU state-retention guarantee.

### Deferred — full-repeat execution

Full-repeat numerical captures remain postponed as requested. Streaming
preparation may continue, but does not authorize resuming these runs.
Full keyboard qualification and sufficient retained evidence on this route remain
open.
When resuming, preflight capacity and runtime, then run the reset-release candidate
over complete standard-S600 repeat traffic with matched timestep refinements and
a complete control. Pass the unchanged numerical gate below while preserving
firmware reads and serial behavior over the full-repeat window. Do not shorten
the scenario to fit the current machine. Validate the integrated raw-capture,
comparison and retention tooling on these complete captures; implementation tests
and bounded transport controls do not establish full-repeat acceptance. Extend
forced-retry and opt-in evaluator-cache controls over that window as well.

### Independent evidence — separate from desk qualification

| Work | Next useful evidence and acceptance |
| --- | --- |
| Historical registration | Obtain an independent transverse board-plane dimension or sharper hole-centre evidence using the [measurement targets](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/reference/package-reviews/registration-measurements/assessment.json). Bound picking and PCB manufacturing tolerances, refit and test held-out placement and cross-side correspondence. Existing mounting-hole rims cannot select the retained transverse alternatives. No pad moves before the existing registration gate passes. |
| X1 package identification | Find a primary-specimen view exposing mating or termination chambers and compare it with the detailed EFS drawings. The comparison specimen supports the narrow forms, but its dimensions cannot be transferred by appearance alone. Distinguish plug/socket and mounting form; contact-span agreement cannot select them. |
| Device/load applicability | Seek published constraints that distinguish consequential oscillator, driver or load alternatives as part of desk work. Bench evidence is a fallback for ambiguities those sources cannot resolve; retain indistinguishable alternatives. |
| Other specimen-specific claims | Installed packages, hidden terminal/trace assignments, ROM contents and timing require distinguishing evidence. Request only observations that resolve an ambiguity left by existing photographs and published sources. |

Exhaust existing photographs and published sources first. Repeat an experiment
only for a changed hypothesis or new evidence; do not rerun completed ambiguity
studies as progress toward closure. Findings belong in the
[requirement audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
and linked machine-readable reports.

### Follow-on work — internal prerequisites

| Work | Prerequisite and acceptance |
| --- | --- |
| Physical placements and copper | Accepted registration and individually supported terminal identities; follow the sequence below. |
| Coupled reference qualification | Numerical convergence, coupled rollback checks (including live internal-state and continuation evidence) and device/load admission. Check startup, reset, repeat and supply recovery while preserving firmware behavior. |

## Physical reconstruction sequence

After registration passes:

1. Correct supported placements and recheck routes, cross-side joins, lead exits,
   mating clearance and body/lead envelopes.
2. Resolve primary R1 orientation and numbered hole entries, including its unused
   lead; promote only individually supported A4–R1 SENSE paths.
3. Trace R1 common and sensing-transistor collector branches, resolving terminal
   orientation from package evidence and visible lead entries.
4. Finish remaining bus, data/strobe, supply and clock spans, including L1–XT1.
   Resolve WR/RD against specimen evidence. Resolve BR1/BR2 physical end
   correspondence and geometry.

## Electrical qualification gates

### Numerical convergence

Run three timestep levels (two successive refinements) with identical circuit,
stimulus and model assumptions. Compare absolute time over the whole required
observation window.
Every observed node voltage must differ by at most 10 mV between the two finest
completed levels, with differences not growing from the previous pair. Preserve
firmware reads and serial edges; disabled controls must complete without solver
failure. Do not align traces, exclude failing spans or relax limits to pass.

Preserve failed controls as evidence; they do not satisfy qualification. Keep
precision, state-history and scheduling candidates opt-in until their controls pass.

### Device and load admission

Keep primary К555ЛА3, comparison D100D and reference DL000 conditions separate.
Establish switching-region behavior and pullup loading before admitting an
oscillator replacement. Validate the CPU clock in the startup-inclusive coupled
board, not only an isolated oscillator fixture.

Constrain driver junction capacitance, recovery and reverse operation, CPU/bus
I/V and transitions, and filter/cable/host impedance independently of firmware
agreement. Do not tune a clamp, device or load merely to remove a solver failure.
Waveform features that do not affect receiver decisions or bus timing are
research notes rather than extra gates.

Independent solver agreement checks numerical behavior, not physical accuracy.
Use published constraints first; equivalent-device and representative-load bench
tests are possible fallbacks for consequential ambiguities.

## Constraints to preserve

- KiCad schematic owns components, numbered pins and nets; each PCB variant owns
  its placement and copper. OpenSCAD owns surrounding mechanics. HDL owns chip
  behavior, and identified firmware/emulator sources own software behavior.
- Keep the CAD/evidence authority in `3d-models`, simulation in `dac-emulation`,
  and pinned museum consumers in `dac`. Preserve stable IDs and explicit revisions.
- Keep historical, inferred and proposed geometry and primary/comparison specimens
  distinguishable. Preserve rejected fits and competing connections. Proposed
  routes, proximity and photo-only body observations cannot establish historical
  numbered pads or continuity.
- Regenerate affected KiCad checks, geometry and museum exports together. Preserve
  digital acceptance and source freshness; rerun firmware/HDL comparisons when
  their electrical or behavioral contract changes.
- Preserve the existing coordinate, handedness, package-alignment and provenance
  checks. A clean reference DRC is neither measured fit nor fabrication approval.

Source drawings and photo locators belong in the CAD evidence manifests linked
from the [workflow guide](keyboard-controller-progress.md#authoritative-artifacts).
