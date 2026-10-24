# Robotron keyboard controller remaining-work plan

This plan contains remaining work only. The [requirement audit](keyboard-controller-verification.md)
records evidence and missing proof; the [workflow guide](keyboard-controller-progress.md)
locates authoritative artifacts and regeneration commands. Preserve the
[functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
while making these changes. Completed capabilities and experiment history belong
in the linked artifacts and Git history.

## Next work and acceptance

### Ready now — desk work

| Priority | Work and acceptance |
| --- | --- |
| 1. Live numerical convergence | Resolve the remaining early-startup supply, WR and DAC-high non-monotonic differences. Inspect their integration, source constraints and comparison arithmetic before choosing a targeted control. Preserve the physical inputs, full observation window and numerical gate below. |
| 2. Historical registration | Distinguish the A8 hole-row spacing hypothesis from solder-joint picking and projection bias. Reconcile board scale using independent board-plane joints and package pitches; held-out checks must meet the existing registration budget before native pads or routes move. |
| 3. X1 package identification | Seek form-specific lead, mounting and mating geometry that distinguishes the retained EFS alternatives. Propagate calibration and photo-picking uncertainty; contact-span agreement alone cannot select the body width or authorize pad placement. |
| 4. Electrical-model sensitivity | Bound oscillator, driver and load hypotheses with published constraints; test which uncertainties change clock acceptance, receiver decisions or bus timing. Retain indistinguishable alternatives and identify the specific missing constraint for each consequential ambiguity. |

These investigations can start with existing inputs; successful closure is not
promised. Repeat experiments only for a changed hypothesis or new evidence.
Current results and package alternatives belong in the
[requirement audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
and linked machine-readable reports, not this plan.

### Follow-on work — internal prerequisites

| Work | Prerequisite and acceptance |
| --- | --- |
| Full-repeat convergence | A candidate passing the reset-release numerical gate; extend to full repeat with the same refinement and disabled-control requirements. |
| Live firmware/service evaluator-cache controls | A complete uncached control for the same live circuit. Paired complete captures must preserve waveforms with identical inputs and runtime dependencies; recorded-boundary replay cannot substitute. Keep caching opt-in. |
| Physical placements and copper | Accepted registration and individually supported terminal identities; follow the sequence below. |
| Coupled reference qualification | Numerical convergence and device/load admission. Check startup, reset, repeat and supply recovery while preserving firmware behavior. |

### Evidence-dependent closure

| Work | Evidence needed |
| --- | --- |
| Admit oscillator, driver, CPU/bus and load models | Independent constraints on relevant dynamics and operating conditions. Published data or equivalent-device bench tests may suffice; endpoint fitting alone cannot close admission. |
| Verify specimen-specific fit and behavior | Evidence distinguishing installed packages, hidden terminal/trace assignments, dimensions, ROM contents and timing. Exhaust existing photographs and published sources first; request only observations that resolve a remaining ambiguity. |

Do not defer an entire workstream because its final qualification needs evidence.
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
   Resolve WR/RD against specimen evidence. For BR1/BR2, only physical end
   correspondence and geometry remain.

Preserve primary/comparison specimen identity, rejected fits and competing
connections. Record both endpoints and unresolved spans; keep connected pad
groups separate from floating copper. Proximity alone cannot establish a terminal.

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
precision, state-history and scheduling candidates opt-in until their controls pass. See the [electrical evidence audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
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
