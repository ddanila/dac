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
| 1 | Refine the proposed mechanical assembly: package adapters and manufacturing allowances | **Yes, desk work.** Use explicit reference-design assumptions; measured specimen fit is separate. | Consistent terminal mappings, pad-aligned leads, documented dimensional assumptions and passing geometry/clearance checks. Recheck routing and DRC if footprints change. |
| 2 | Reconcile historical registration, placement and copper using the reference nets as a tracing guide | **Yes, desk work**, for visible features and bounded photo fits. Individual obscured joins may need additional observations. | Supported endpoints and geometry, retained alternatives, and no unexplained native-check regressions. Follow the sequence below. |
| 3 | Close direct-driver numerical convergence | **Software work, conditional on a useful electrical decision.** Not inherently a bench dependency; avoid repeating costly runs without a hypothesis affecting receiver decisions or board timing. | Meet the convergence gate below across the required traffic and controls. |
| 4 | Qualify oscillator and CPU clock behavior | **Independent device evidence needed for admission.** Current candidates fail voltage/timing screens. Loose intended-family devices can be measured without the museum board. | An independently supported device model passes startup-inclusive closed-board clock-level and timing checks. |
| 5 | Qualify output/host drivers, CPU/bus drive and filter/cable loading | **Independent device/load evidence needed for admission.** Equally screened driver candidates predict materially different loaded waveforms. | Supported dynamic parameters and load ranges establish receiver margins and CPU/bus timing; fitted endpoint behavior alone is insufficient. |
| 6 | Qualify the coupled reference circuit | **Depends on numerical and model-admission gates above.** Prepared traffic can be used once prerequisites pass. | Press/release, modifiers, repeat, reset during transmission, startup, host loading, bus timing and supply recovery pass electrical and convergence checks while preserving firmware behavior. |

Start with explicit assembly allowances. Historical tracing
can proceed independently; defer only individual joins that the available evidence
cannot distinguish. Device admission and coupled electrical qualification remain
deferred pending their stated prerequisites.

## Mechanical refinement

The next implementation pass can proceed without specimen measurements:

- Declare proposed assembly allowances and check the resulting lead, body, shared
  core and enclosure clearances. Keep nominal and allowance-based results distinct.
- Resolve package-adapter assumptions where published dimensions suffice; retain
  unsupported dimensions explicitly rather than treating them as measured.

Preserve the distinction between mechanical winding paths and unmeasured winding
identity or magnetic parameters. Extend existing geometry checks for new interfaces;
recheck routing and DRC if footprints change. Passing proposed-design checks does
not establish measured specimen fit or fabrication readiness.

## Physical reconstruction sequence

Use schematic-defined nets to trace from both ends. Missing historical copper
usually means an unresolved route, not an unknown electrical connection. BR1/BR2
functions and nets are established; only correspondence to physical ends and
complete trace geometry remain questions.

| Step | Work | Acceptance |
| --- | --- | --- |
| 1 | Reconcile board scale, perspective and raised-lead bias using board-plane joints and package pitches | Independent held-out checks meet the existing registration budget; no widened tolerance or extrapolated terminal assignment. |
| 2 | Correct supported placements and recheck affected routes | Native pad positions have bounded evidence; cross-side joins and native checks remain consistent. |
| 3 | Resolve primary R1 orientation and numbered hole entries, then trace the A4–R1 SENSE corridor | Native pads represent the physical package, including its unused lead; promote only individually supported paths. |
| 4 | Trace R1 common and sensing-transistor collector branches; resolve transistor terminal orientation | Terminal identity follows package evidence and visible lead entries, not proximity alone. |
| 5 | Finish remaining bus, data/strobe, supply and clock paths, including L1–XT1 | Both endpoints and unresolved spans are recorded. Resolve WR/RD against specimen evidence. Keep connected pad groups separate from floating copper. |

Use the existing CAD tracing authorities rather than duplicating candidates here:

- `sense-review.json`: R1, SENSE paths and bank orientation.
- `bus-review.json`: CPU/ROM/latch buses and covered joins.
- `path-tracing.json`: data/strobe transitions and WR/RD alternatives.
- `supply-review.json`, `filter-registration.json`, `clock-continuation.json`
  and `cable-copper.json`: filter/cable geometry, correspondence and winding ends.
- `connection-review.json`: bridge and connector observations, including X1.A8.

Keep primary and comparison specimens separate. Retain rejected fits and competing
connections in machine-readable evidence. Additional observations are required
only where the available evidence cannot distinguish the alternatives. Exact
specimen agreement also needs identified ROM contents, dimensions and timing;
standard S600 remains sufficient for reference work.

## Electrical qualification gates

### Numerical convergence

Complete two refinement levels with identical circuit, stimulus and model
assumptions, comparing absolute time over the whole required observation window.
Every observed node voltage must differ by at most 10 mV between the two finest
completed levels, with differences not growing from the previous pair. Preserve
firmware reads and serial edges; disabled controls must complete without solver
failure. Do not align traces, exclude failing spans or relax limits to pass.

Full-repeat convergence and controls remain incomplete. Short-window board-voltage
agreement does not establish the full gate. Retain opt-in precision, state-history
and scheduling candidates with their controls; longer equivalence checks precede
adoption of evaluator caching. Superseded circuit results cannot qualify the
current direct-driver circuit. See the [electrical evidence audit](keyboard-controller-verification.md#current-findings-and-their-consequences)
for retained findings.

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
