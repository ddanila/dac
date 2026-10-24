# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes. Completed capabilities and experiment history belong
in the linked artifacts and Git history.

## Next work and acceptance

### Ready now

| Work | Acceptance |
| --- | --- |
| Reconcile the reset-capacitor source disagreement and compare reset timing | Record factory C4 100 µF / 10 V versus Zander 10 µF / 40 V as source variants. Compare startup and recovery with identical device/load assumptions and timestep refinement. Preserve the reference default; neither drawing establishes the installed value. |
| Resolve remaining proposed capacitor and connector dimensions | Use identifiable published packages where possible; retain explicit estimates otherwise. Check terminal mappings, geometry and clearances. Specimen fit remains separate. |
| Reconcile historical registration and individually visible copper | Follow the physical sequence below. Promote only independently supported endpoints within the existing registration budget; leave hidden joins unresolved. |
| Investigate published constraints on oscillator, driver and load behavior | Identify which uncertainty changes clock acceptance, receiver decisions or bus timing, and what independent evidence distinguishes it. Do not repeat endpoint fitting as dynamic validation. |

### Dependent work

| Work | Dependency and acceptance |
| --- | --- |
| Close direct-driver numerical convergence | Select a concrete electrical hypothesis before costly runs; satisfy the numerical gate below across required traffic and disabled controls. This is open software investigation, not a requirement for new board photographs. |
| Complete live firmware/service evaluator-cache controls | First obtain a complete uncached control for the same live circuit. Paired complete captures must preserve waveforms with identical inputs and runtime dependencies. Recorded-boundary replay cannot substitute for live coverage; keep caching opt-in. |
| Admit oscillator, driver, CPU/bus and load models | Independent evidence must constrain the relevant dynamics and operating conditions. Published data or equivalent-device bench tests may suffice; specimen measurements are required only for specimen-specific claims. |
| Qualify the coupled reference circuit | Numerical convergence and model admission must pass first. Check startup, reset, repeat and supply recovery while preserving firmware behavior. |

Defer individual unsupported claims rather than the whole reconstruction. Do not
repeat existing geometry, tracing or simulation work without new evidence or a
changed interface. Detailed candidates and results belong in the authoritative
artifacts linked by the [workflow guide](keyboard-controller-progress.md).

## Physical reconstruction sequence

Use schematic-defined nets to trace from both ends. For BR1/BR2, resolve physical
end correspondence and remaining trace geometry; their schematic nets are settled.

| Step | Work | Acceptance |
| --- | --- | --- |
| 1 | Reconcile board scale, perspective and raised-lead bias using board-plane joints and package pitches | Independent held-out checks meet the existing registration budget; no widened tolerance or extrapolated terminal assignment. |
| 2 | Correct supported placements and recheck affected routes | Native pad positions have bounded evidence; cross-side joins and native checks remain consistent. |
| 3 | Resolve primary R1 orientation and numbered hole entries, then register the observed A4–R1 SENSE paths | Native pads represent the physical package, including its unused lead; promote only individually supported paths. |
| 4 | Trace R1 common and sensing-transistor collector branches; resolve transistor terminal orientation | Terminal identity follows package evidence and visible lead entries, not proximity alone. |
| 5 | Finish remaining bus, data/strobe, supply and clock paths, including L1–XT1 | Both endpoints and unresolved spans are recorded. Resolve WR/RD against specimen evidence. Keep connected pad groups separate from floating copper. |

Preserve primary/comparison specimen identity, rejected fits and competing
connections. Standard S600 is sufficient for reference work; exact specimen
agreement still needs its ROM contents, dimensions and timing.

## Electrical qualification gates

### Numerical convergence

Complete two refinement levels with identical circuit, stimulus and model
assumptions, comparing absolute time over the whole required observation window.
Every observed node voltage must differ by at most 10 mV between the two finest
completed levels, with differences not growing from the previous pair. Preserve
firmware reads and serial edges; disabled controls must complete without solver
failure. Do not align traces, exclude failing spans or relax limits to pass.

Complete full-repeat convergence and controls on the current direct-driver
circuit. Keep precision, state-history and scheduling candidates opt-in until
their controls pass. See the [electrical evidence audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
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
