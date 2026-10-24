# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes. Completed capabilities and experiment history belong
in the linked artifacts and Git history.

## Next work and acceptance

| Priority | Remaining work | Can proceed now? | Acceptance |
| --- | --- | --- | --- |
| 1 | Resolve remaining proposed package dimensions and adapters | **Yes.** Check published dimensions for capacitors and connectors; retain assumptions where identity is unknown. | Evidence-backed dimensions and terminal mappings; affected geometry, clearance and native checks pass. Specimen fit remains separate. |
| 2 | Reconcile historical registration, placement and copper | **Yes, for visible features.** Review held-out package-pose discrepancies before applying placement changes; follow the sequence below. | Independently supported endpoints and geometry within the existing registration budget; unresolved alternatives remain explicit. |
| 3 | Complete live firmware/service evaluator-cache controls | **Depends on a completed uncached control for the same live circuit.** Resolve the direct-driver baseline failure before comparing its full service windows; replayed boundaries cannot replace this coverage. | Complete paired captures with identical inputs and runtime dependencies, and unchanged recorded waveforms. Keep caching opt-in until the live checks pass. |
| 4 | Close direct-driver numerical convergence | **Software work, conditional on a useful electrical decision.** Select a hypothesis affecting receiver decisions or board timing before costly runs. | Meet the convergence gate below across required traffic and controls. |
| 5 | Admit oscillator, driver, CPU/bus and load models | **Deferred admission:** independent device/load evidence is missing. Published constraints can still be investigated. | Supported models pass clock, receiver-margin and bus-timing checks; endpoint fitting alone is insufficient. |
| 6 | Qualify the coupled reference circuit | **Deferred** until numerical convergence and model admission pass. | Prepared traffic passes electrical checks while preserving firmware behavior, including startup, reset, repeat and supply recovery. |

Start with bounded software checks and published package constraints. Photo work
can proceed independently; defer individual hidden joins rather than the whole
reconstruction. Do not repeat existing geometry or tracing work unless new
evidence or a changed interface warrants it.

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

Keep detailed candidates in the CAD tracing authorities linked by the
[workflow guide](keyboard-controller-progress.md), rather than duplicating them
here. Preserve primary/comparison specimen identity, rejected fits and competing
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

### Evidence tiers and measurement dependencies

Published data can establish documented limits and sampled device conditions;
independent solver agreement checks numerical behavior, not physical accuracy.
Bench measurements of loose equivalent devices and representative loads can
resolve dynamic-model ambiguity without touching the museum board. Specimen
observations establish installed identities, copper, ROM contents and actual timing.

For each dependency, retain the alternatives, the evidence needed to distinguish
them and the decision affected. Exhaust relevant published constraints and existing
photos first. A bench dependency applies to the specific admission claim, not to
all software or CAD work. Passing numerical checks does not admit a device model.

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
- [Zander component placement](https://www.sax.de/~zander/pc1715/pc_tastb.pdf)
