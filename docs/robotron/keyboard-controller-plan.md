# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes.

## Next work and acceptance

### Ready now — removing resource and evidence bottlenecks

| Work | Next action and acceptance |
| --- | --- |
| Full-window streaming qualification | Measure keyboard-scale runtime, memory and compressed-log storage for the live three-level runner. Establish sufficient retained evidence without full raw replay before treating disk capacity as resolved. Preserve every sample comparison and the unchanged numerical gate. |
| Conditional X1 board-plane calibration | Constrain transverse scale with independently reviewed board-plane row centres and mounting features; the distributed X1/CPU fit supports longitudinal scale but remains sensitive to correlated X1 row picks. Bound picking and PCB manufacturing tolerances, then test held-out placement and cross-side correspondence. No pad moves before the existing registration gate passes. |
| Coupled internal-state evidence | Extend the bounded live observer to remaining scheduler state: XSPICE output/history buffers and pending HDL events. Retain matched controls, delayed-corruption detection and continuation checks across the required scenarios. Bound observation volume before longer captures; exposed-state equality is not complete rollback proof. |

### Deferred — full-repeat execution

Full-repeat numerical captures remain postponed as requested. The no-spool route
above is desk work toward removing their storage prerequisite; complete retained
waveform replay and a live RC transport control have passed, but full keyboard
qualification on this route is not yet established.
When resuming, preflight capacity and runtime, then run the reset-release candidate
over complete standard-S600 repeat traffic with matched timestep refinements and
a complete control. Pass the unchanged numerical gate below while preserving
firmware reads and serial behavior over the full-repeat window. Do not shorten
the scenario to fit the current machine. Validate the integrated raw-capture,
comparison and retention tooling on these complete captures; implementation tests
and bounded transport controls do not establish full-repeat acceptance. Extend
forced-retry and opt-in evaluator-cache controls over that window as well.

### Investigations — require a new discriminating check

| Work | Next useful evidence and acceptance |
| --- | --- |
| Historical registration | Independent board-plane hole observations that distinguish the retained package-bias and outline-perspective alternatives. Establish scale and cross-side correspondence; held-out checks must meet the existing registration budget before native pads or routes move. |
| X1 package identification | Find a primary-specimen view exposing mating or termination chambers and compare it with the detailed EFS drawings. The comparison specimen supports the narrow forms, but its dimensions cannot be transferred by appearance alone. Distinguish plug/socket and mounting form; contact-span agreement cannot select them. |
| Electrical-model constraints | Published constraints that distinguish consequential oscillator, driver or load alternatives. Test their effects on clock acceptance, receiver decisions and bus timing; retain alternatives that the evidence cannot distinguish. |

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

### Closure requiring independent evidence

| Work | Evidence needed |
| --- | --- |
| Admit oscillator, driver, CPU/bus and load models | Independent constraints on relevant dynamics and operating conditions. Published data or equivalent-device bench tests may suffice; endpoint fitting alone cannot close admission. |
| Verify specimen-specific fit and behavior | Evidence distinguishing installed packages, hidden terminal/trace assignments, dimensions, ROM contents and timing. Exhaust existing photographs and published sources first; request only observations that resolve a remaining ambiguity. |

Use standard S600 for reference work; keep specimen agreement separate.

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
