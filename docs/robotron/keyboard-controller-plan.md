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
| 1. Combined simulator fixes | Complete private-HDL state coverage and validate the integrated fixes under the acceptance checks below. Native fixtures and pre-execution budgets do not qualify operational board boundaries. |
| 2. Numerical convergence | Resolve the remaining growth in the [full exact-tick refinements][postreset-tick]. Qualify the [same-tick drain candidate][output-drain] with ADC and full post-reset controls, preserving the [bounded board/retry controls][output-drain-board]. Native tests reproduce autonomous HDL events left pending by timed stops; deferring the return to read/write synchronization preserves their native times while retaining input-causality clamping. Preserve no-time-reversal and input/output ordering; native cases do not establish full scheduler quiescence or board convergence. Separate trajectory shifts from interpolation effects, review changed baseline bus-edge timing explicitly, then rerun matched full post-reset refinements under the unchanged gate below. Matching serial output alone is insufficient. |
| 3. CPU/bus and device models | Replace candidates that fail published operating guarantees with explicitly constrained alternatives. Resolve the Intel I8282 enable-measurement convention and constrain internal switching/disconnect delays against the existing loaded propagation, release and capacitance budgets. Do not transfer the NEC comparison thresholds to Intel. Distinguish CPU/ROM alternatives using independent I/V and switching constraints before integration. Preserve source test conditions and validate independent conditions where available; static endpoint agreement does not establish dynamics or specimen calibration. |
| 4. Longer capture qualification | Establish runtime, memory and retained-evidence budgets for longer streaming captures, using explicit log caps. Preserve every sample comparison and enough evidence to review failures. Raw hashes alone do not provide waveform replay. |

Use the core's `analog/postreset_drain_capture.py` and
`analog/postreset_drain_review.py` for full post-reset drain qualification.
Keep the exact-tick-only control separate from the drain-enabled refinements;
the producer requires the retained bounded drain assessment and preserves the
complete ADC-enabled window. A completed capture is not a passing convergence gate.

### Combined simulator acceptance

1. **Finish combined board validation.** Review compact arrays, allocated net/fanout state and lossless wire payloads
   together, preserving the [passing combined code-operand controls][code-operand-board]
   and [scope membership controls][scope-board] alongside PC-binding, wait-event, thread/scheduler,
   island/filter/queue, primitive/assignment, callback, port and wrapper/stop/display
   controls. Validate complete scope hierarchy, empty scopes and actual membership;
   live-thread identity alone does not establish membership.
2. **Close reachable payload gaps.** Correct the
   [strength-encoding loss][strength-encoding]: logical-value/strength triplets
   merge reachable raw bytes that native scalar/vector equality distinguishes.
   Qualify the combined raw-wire capture/reviewer with the [native raw wire-cache controls][wire-raw-state], checking
   operational class/allocation admission and combined cost. Use the
   [raw-byte differences][wire-raw-delta] and [full-scan preflight][wire-raw-delta-budget],
   preserving exact reconstruction of collision faults. Preserve [native post-reference growth][wire-raw-growth]
   and [late unsupported-filter refusals][wire-raw-delta-families] through the
   compact API. New allocations require full rows and can exceed dense storage.
   Preserve the [raw board bindings and initial scan budget][wire-raw-budget];
   initial-state output estimates do not bound changing-state storage. Preserve
   [raw filter admission refusals][wire-raw-families] for both initial and later
   allocations; base-class cache coverage does not admit subclasses.
   Extend raw scalar coverage to other strength-aware filter/island/queue and
   concatenation payloads, with native faults and continuation controls. Preserve the
   [source-extracted switch-helper controls][strength-switch] while qualifying
   actual island dispatch and other producers; helper closure alone does not
   establish complete state coverage. Keep running
   campaigns pinned; add a subsequent runtime/reviewer revision. Integrate the [native signal controls][signal-state]
   under the [signal ownership contract][signal-contract], preserving the tested
   [unsupported-family refusals][signal-families]. Use the [validated signal deltas][signal-delta]
   and [measured delta budget][signal-delta-budget], then validate operational bindings,
   state growth and actual combined capture/review cost.
   Integrate the [lossless mux differences][mux-delta] and
   [direct partial-vector controls][mux-partial-delta], using the
   [full-scan budget][mux-delta-budget]. Measure actual changed-state output and
   combined cost: changed fixture images can exceed dense encoding. Preserve
   full native scans, queued/executing wrapper identities and the
   [native post-reference allocation controls][mux-growth]. Validate operational
   class/allocation changes against the admitted board profile. Use the [native gate controls][gate-state] and [input-path controls][gate-inputs],
   preserve [native post-reference allocation controls][gate-growth], and integrate
   the [lossless gate differences][gate-delta] and [input-path differences][gate-input-delta] under the
   [logic ownership contract][logic-contract], using the [full-scan budget][gate-delta-budget].
   Preserve [late unsupported-allocation refusals][gate-delta-families]. Measure actual combined output
   and runtime before changing capture limits. Keep the demonstrated unequal-width
   AND/OR discontinuity outside board admission until corrected; current cached
   widths must remain equal. Preserve the [native subclass refusals][gate-families]
   when admitting board classes; retain class/graph bindings for
   stateless BUFZ/BUFT without inventing payload fields. Bind the
   [native arithmetic/comparison controls][arithmetic-state] at operational board boundaries,
   preserving the [initial class/width bindings][arithmetic-budget] and
   [unsupported-family refusals][arithmetic-families]. Integrate the
   [lossless arithmetic differences][arithmetic-delta] under the
   [measured full-scan budget][arithmetic-delta-budget], preserving
   [late unsupported-family refusals][arithmetic-delta-families] and
   [native allocation-growth controls][arithmetic-growth]. Measure operational
   class/allocation changes and changing-state output; new objects can make
   fixed-reference differences larger than dense images, and the
   unchanged-board projection is not an operational storage bound. Preserve the [board-width and storage-boundary controls][arithmetic-widths];
   re-audit width admission when the compiled profile changes.
   Integrate the [native reduction controls][reduction-state] using the
   [initial class bindings and full-scan budget][reduction-budget], preserving
   [native subclass refusals][reduction-families]. Use the [lossless differences][reduction-delta]
   and [full-scan budget][reduction-delta-budget], preserving
   [late unsupported-allocation refusals][reduction-delta-families] and
   [native allocation-growth controls][reduction-growth]. Validate operational
   class/allocation changes and measure changing-state output and combined cost.
   Initial empty caches may acquire widths after input arrives; preserve
   empty/full/partial operand history without freezing initial vector sizes. Preserve the [compact early/late concat subclass refusals][concat-delta-families].
   Qualify the combined concat capture/reviewer with [exact concat differences][concat-delta], preserving
   [compact native allocation growth][concat-delta-growth] and complete event rows,
   then validate the [native concatenation controls][concat-state] at operational
   boundaries using the [initial board bindings and scan budget][concat-budget]
   under the [expression ownership contract][expression-contract].
   Preserve exact concat8 bytes, port widths, assembled caches and queued/executing
   output-node bindings. Use the [full-scan compact budget][concat-delta-budget] to preflight capture
   limits, then measure combined changing-state cost. New allocations require full
   records and can exceed dense storage.
   Preserve the [early/late resolver-family refusals][resolver-families] and
   [native resolver allocation growth][resolver-growth] while extending the
   [native resolver controls][resolver-state]
   under the [resolver ownership contract][resolver-contract]. Preserve the complete
   cache tree, raw pull/cache bytes and allocation bounds independent of faulted
   port counts/pointers. Preserve [single-input and vector-boundary controls][resolver-widths], including root/leaf pull aliasing and clipped partial writes. Extend raw-strength inputs and partial-first initialization, then carry width controls through compact capture;
   preserve the [initial board bindings and full-scan budget][resolver-budget], use [exact resolver differences][resolver-delta] and [post-reference allocation controls][resolver-delta-growth] with the [full-scan compact budget][resolver-delta-budget]. Preserve [early/late unsupported-family refusals through the compact API][resolver-delta-families] and qualify operational bindings before integration. Initial cache widths are not fixed runtime widths; measure changing-state output and combined cost. New allocations require full records on each delta, and changing-state fixtures can exceed dense storage. Cover callback and array-word list contents beyond observed
   heads, bridge-handle referents and other reachable pointed-to objects. Use the
   [native class inventory][native-classes] to admit families explicitly; names
   alone do not prove field coverage. Preserve class/allocation bindings and
   validate operational class changes.
3. **Preserve ownership and meaningful state.** Include suspended and event-waiting
   threads; track writes before reading unspecified flags/registers. Enforce the
   [compiled thread contract][thread-contract] and re-audit contexts, object stacks,
   event controls and storage families when the compiled profile changes. Keep
   native lifecycle controls for paths absent from this board, including detached
   children, wait-fork and callback-driven deferred deletion. Freed-storage
   equivalence remains separate. Use the scoped continuation argument for overwritten
   callback temporaries and the input-barrier non-execution argument where applicable.
4. **Validate cross-references and storage.** Bind queued-event, code-operand and
   array destinations to handed-out net identities, preserving fanout order and
   force-helper back-references. Preserve every array word, cached read address,
   port link and existing word-handle ownership without allocating VPI handles
   during observation. Keep unsupported alias/storage/callback profiles refused
   and re-audit admission on profile changes. Distinguish procedural-assignment
   source links from force links and signal storage from filtered output.
5. **Keep compact evidence exact and affordable.** Reconstruct full state from
   compact/delta records, including inactive allocated instructions, initialized
   chunk links, newly allocated objects and corrupted snapshots. Scan every native
   word, port and admitted payload field. Use the retained [wire][wire-budget],
   [graph][graph-budget], [array][array-budget] and [operand][operand-budget] budgets
   to preflight explicit limits, then measure combined capture/review cost and
   operational growth, including later word-handle caches. Unchanged-state output
   projections are not storage bounds.
6. **Qualify continuation and recovery.** Preserve explicit XSPICE initialization.
   Require matched disabled controls, forced rejection, immediate/delayed actual
   state corruption with restoration, internal-state checks and firmware
   continuation. Extend the integrated controls to startup and supply recovery;
   bounded service controls do not establish either or general rollback.

[signal-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-source-contract/assessment.json
[native-classes]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/net-types-board/assessment.json
[thread-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/board-thread-contract/assessment.json
[wire-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-delta-budget/assessment.json
[graph-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/net-delta-budget/assessment.json
[array-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/array-compact-budget/assessment.json
[operand-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/code-operand-budget/assessment.json

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

[scope-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/scope-board/assessment.json

[signal-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-state/assessment.json

[signal-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-families/assessment.json

[signal-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-delta/assessment.json
[signal-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/signal-delta-budget/assessment.json

[logic-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/logic-source-contract/assessment.json

[mux-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-state/assessment.json

[mux-partial]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-partial/assessment.json


[mux-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-delta/assessment.json

[mux-partial-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-partial-delta/assessment.json

[mux-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-delta-budget/assessment.json

[mux-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/mux-growth/assessment.json

[gate-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-state/assessment.json

[gate-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-families/assessment.json

[gate-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-board-budget/assessment.json

[gate-inputs]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-inputs/assessment.json

[gate-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-delta/assessment.json

[gate-input-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-input-delta/assessment.json

[gate-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-delta-budget/assessment.json

[gate-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-delta-families/assessment.json

[gate-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/gate-growth/assessment.json

[expression-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/expression-source-contract/assessment.json

[arithmetic-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-state/assessment.json
[arithmetic-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-families/assessment.json

[arithmetic-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-board-budget/assessment.json

[arithmetic-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-delta/assessment.json
[arithmetic-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-delta-budget/assessment.json

[arithmetic-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-delta-families/assessment.json

[arithmetic-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-growth/assessment.json

[arithmetic-widths]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/arithmetic-widths/assessment.json

[reduction-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-state/assessment.json

[reduction-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-families/assessment.json

[reduction-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-board-budget/assessment.json

[reduction-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-delta/assessment.json
[reduction-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-delta-budget/assessment.json
[reduction-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-delta-families/assessment.json

[reduction-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/reduction-growth/assessment.json

[strength-encoding]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/strength-encoding/assessment.json

[wire-raw-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-state/assessment.json

[strength-switch]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/strength-switch/assessment.json

[wire-raw-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-board-budget/assessment.json

[wire-raw-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-families/assessment.json

[wire-raw-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-delta/assessment.json
[wire-raw-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-delta-budget/assessment.json

[postreset-tick]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/postreset-tick/assessment.json

[output-drain]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-drain/assessment.json

[wire-raw-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-delta-families/assessment.json

[wire-raw-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/wire-raw-growth/assessment.json

[output-drain-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/output-drain-board/assessment.json

[code-operand-board]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/code-operand-board/assessment.json

[concat-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-state/assessment.json

[concat-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-families/assessment.json

[concat-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-board-budget/assessment.json

[concat-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-growth/assessment.json

[concat-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta/assessment.json
[concat-delta-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta-growth/assessment.json
[concat-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta-budget/assessment.json

[concat-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/concat-delta-families/assessment.json

[resolver-contract]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-source-contract/assessment.json

[resolver-state]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-state/assessment.json

[resolver-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-families/assessment.json

[resolver-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-growth/assessment.json

[resolver-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-board-budget/assessment.json

[resolver-delta]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta/assessment.json

[resolver-delta-growth]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-growth/assessment.json

[resolver-delta-budget]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-budget/assessment.json

[resolver-delta-families]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-delta-families/assessment.json

[resolver-widths]: https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/reports/resolver-widths/assessment.json
