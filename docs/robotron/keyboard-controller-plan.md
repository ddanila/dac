# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes. Completed capabilities and experiment history belong
in the linked artifacts and Git history.

## Next work and acceptance

### Ready now — no new specimen evidence required to start

| Work | Next action and acceptance |
| --- | --- |
| Constrain X1 geometry | Resolve the EFS candidate’s exact form and distinguish the conditional scale alternatives in CAD `reference/package-reviews/efs-x1/assessment.json`. Account for photo-picking and calibration uncertainty before changing pads; obtain form-specific lead and mounting geometry. Check lead exits, mating clearance and expanded envelopes. |
| Reconcile historical registration and visible copper | Follow the physical sequence below using existing photographs. Promote only independently supported endpoints within the existing registration budget; hidden joins may remain unresolved. |
| Narrow electrical model uncertainty | Use published oscillator, driver and load constraints to identify hypotheses that change clock acceptance, receiver decisions or bus timing. Retain competing hypotheses where the evidence cannot distinguish them. |
| Investigate direct-driver numerical failure | Isolate the existing failure with a concrete electrical or solver hypothesis and a bounded reproducer before another long run. Any candidate must preserve the circuit contract and pass the numerical gate below. This is software investigation, not blocked on photographs. |

These tasks can proceed now; that does not guarantee that desk evidence will
resolve every physical identity or admit every device model. Defer individual
unsupported claims rather than the whole reconstruction. Do not repeat completed
experiments without new evidence or a changed hypothesis.

### Work with prerequisites

| Work | Prerequisite and acceptance |
| --- | --- |
| Complete full-repeat convergence | A viable direct-driver candidate; complete refinement and disabled controls under the numerical gate below. |
| Complete live firmware/service evaluator-cache controls | A complete uncached control for the same live circuit. Paired complete captures must preserve waveforms with identical inputs and runtime dependencies; recorded-boundary replay cannot substitute. Keep caching opt-in. |
| Admit oscillator, driver, CPU/bus and load models | Independent evidence constraining relevant dynamics and operating conditions. Published data or equivalent-device bench tests may suffice; endpoint fitting alone cannot close admission. |
| Qualify the coupled reference circuit | Numerical convergence and model admission. Check startup, reset, repeat and supply recovery while preserving firmware behavior. |
| Verify specimen-specific fit and behavior | Evidence distinguishing installed packages, hidden terminal/trace assignments, dimensions, ROM contents and timing. Exhaust existing photographs and published sources first; request only observations that resolve a remaining ambiguity. |

## Physical reconstruction sequence

Use schematic-defined nets to trace from both ends. BR1/BR2 work is limited to
physical end correspondence and remaining trace geometry.

| Step | Work | Acceptance |
| --- | --- | --- |
| 1 | Reconcile board scale, perspective and raised-lead bias using board-plane joints and package pitches | Independent held-out checks meet the existing registration budget; no widened tolerance or extrapolated terminal assignment. |
| 2 | Correct supported placements and recheck affected routes | Native pad positions have bounded evidence; cross-side joins and native checks remain consistent. |
| 3 | Resolve primary R1 orientation and numbered hole entries, then register the observed A4–R1 SENSE paths | Native pads represent the physical package, including its unused lead; promote only individually supported paths. |
| 4 | Trace R1 common and sensing-transistor collector branches; resolve transistor terminal orientation | Terminal identity follows package evidence and visible lead entries, not proximity alone. |
| 5 | Finish remaining bus, data/strobe, supply and clock paths, including L1–XT1 | Both endpoints and unresolved spans are recorded. Resolve WR/RD against specimen evidence. Keep connected pad groups separate from floating copper. |

Preserve primary/comparison specimen identity, rejected fits and competing
connections. Use standard S600 for reference work; keep specimen agreement separate.

## Electrical qualification gates

### Numerical convergence

Complete two refinement levels with identical circuit, stimulus and model
assumptions, comparing absolute time over the whole required observation window.
Every observed node voltage must differ by at most 10 mV between the two finest
completed levels, with differences not growing from the previous pair. Preserve
firmware reads and serial edges; disabled controls must complete without solver
failure. Do not align traces, exclude failing spans or relax limits to pass.

Keep precision, state-history and scheduling candidates opt-in until their
controls pass. See the [electrical evidence audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
for existing results and their limits.

### Device and load admission

Keep primary К555ЛА3, comparison D100D and reference DL000 conditions separate.
Establish switching-region behavior and pullup loading before admitting an
oscillator replacement. Validate the CPU clock in the startup-inclusive coupled
board, not only an isolated oscillator fixture.

Constrain driver junction capacitance, recovery and reverse operation, CPU/bus
I/V and transitions, and filter/cable/host impedance independently of firmware
agreement. Do not tune a clamp, device or load merely to remove a solver failure.
Assess whether uncertainty changes receiver decisions or bus timing; waveform
features with no such consequence are research notes rather than extra gates.

Independent solver agreement checks numerical behavior, not physical accuracy.
Bench tests of loose equivalent devices and representative loads can resolve
model ambiguity without touching the museum board. Exhaust relevant published
constraints and existing photos before declaring a measurement dependency.

## Constraints to preserve

- KiCad schematic owns components, numbered pins and nets; each PCB variant owns
  its placement and copper. OpenSCAD owns surrounding mechanics. HDL owns chip
  behavior, and identified firmware/emulator sources own software behavior.
- Keep the CAD/evidence authority in `3d-models`, simulation in `dac-emulation`,
  and pinned museum consumers in `dac`. Preserve stable IDs and explicit revisions.
- Keep historical, inferred and proposed geometry distinguishable. Proposed
  reference routes cannot increase historical evidence coverage. Photo-only body
  or wire observations do not establish numbered historical pads.
- Regenerate affected KiCad checks, geometry and museum exports together. Preserve
  digital acceptance and source freshness; rerun firmware/HDL comparisons when
  their electrical or behavioral contract changes.
- Preserve the existing coordinate, handedness, package-alignment and provenance
  checks. A clean reference DRC is neither measured fit nor fabrication approval.

## Source drawings

- [Manufacturer service drawings](https://www.tiffe.de/Robotron/PC1715/PC-1715-Schaltplaene.pdf): placement on PDF page 10, schematic on page 11. Check revisions before transferring locations.
- [Zander schematic](https://www.sax.de/~zander/pc1715/pc_tasts.pdf)
- [Zander component reference](https://www.sax.de/~zander/pc1715/pc_tastb.pdf)
