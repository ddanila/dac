# Keyboard controller status and workflow

The [functional reference release](../../public/models/robotron-1715m/keyboard-controller-release.json)
closes the declared digital/CAD/museum integration scope. Electrical qualification
and historical reconstruction in the [plan](keyboard-controller-plan.md) remain open. Use the
[requirement audit](keyboard-controller-verification.md) for remaining proof and
[simulation decision](keyboard-controller-simulation.md) for electrical scope.
The proposed reference PCB is fully connected and passes native DRC. Use it to
guide historical reconciliation while qualifying the reference circuitry and
package assumptions. Both tracks use existing photographs, published device
evidence and standard S600 firmware.

## Authoritative artifacts

| Question | Source |
| --- | --- |
| Which revisions does the museum display? | `public/models/robotron-1715m/source.json` and `keyboard-controller.json` |
| Which historical parts and routes are placed? | CAD `generated/layout.json` |
| What packages and clearances does the reference assembly use? | CAD `reference/assembly.json` and `reference/assembly-generated/assembly.json` |
| What is proposed in the complete reference PCB? | CAD `reference/implementation.json`, `reference/generated/layout.json` and `reference/generated/qualification.json` |
| What is observed, inferred or unresolved? | CAD `evidence.json`, `component-evidence.json`, `route-evidence.json` |
| Which X1 geometry and terminal assignments are supported? | CAD `generated/connector-review.json` and `generated/connector-terminals.json` |
| Which published package constrains X1? | CAD `reference/connector-package-candidate.json` and `reference/package-reviews/efs-x1/assessment.json`; family identity and registration scale remain conditional |
| What is the next implementation sequence? | [Remaining work and dependencies](keyboard-controller-plan.md#next-work-and-acceptance) |
| What constrains SENSE routing and R1 placement? | CAD `sense-review.json`, generated `bus-review.json` → `senseReview`; DAC “SENSE corridor and resistor-bank mapping” |
| Which output/connector spans should be reviewed next? | CAD `review/connection-review.html`, generated from `connection-review.json` and canonical evidence |
| Where does the candidate clock continuation stop? | CAD `clock-continuation.json`, generated host-clock connection review; hidden bank joins and upper-eye/filter attachment remain open. |
| Which filter joints correspond across the primary photos? | CAD `filter-registration.json` and generated `filterRegistration`; DAC “Filter joint correspondence”. Bounded photo matching, not electrical assignment. |
| Can supply rails identify a filter winding? | CAD `supply-review.json` and `generated/cable-copper.json` → `supplyReview`; DAC “Supply → filter evidence” |
| Which cable-end joints share recorded underside copper? | CAD `generated/cable-copper.json`, generated from anonymous observations in `cable-copper.json` |
| What native checks remain? | CAD `generated/qualification.json` |
| What digital behavior is qualified? | Core `verification/robotron-keyboard/reports/` and `digital/reports/completion.json`; raw timing and near-edge reset remain open |
| What electrical assumptions and failures were retained? | Core `verification/robotron-keyboard/analog/reports/`; individual run reports and traces under `build/keyboard-controller-analog/` |

Inventories and results belong in these artifacts; implementation history belongs
in git. Local build and review instructions live in the
[CAD guide](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/README.md)
and [co-simulation guide](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/README.md).
Use museum manifests when reviewing a specific pinned version.

## Analog evidence replay

Run retained-evidence checks from the core checkout. For restored memory faults:

```sh
python3 verification/robotron-keyboard/analog/retained_evidence.py verification/robotron-keyboard/analog/reports/memory-continue-controls
python3 verification/robotron-keyboard/analog/memory_continue_activity.py --root verification/robotron-keyboard/analog/reports/memory-continue-controls --out /tmp/memory-continue-replayed.json
python3 -m unittest discover -s verification/robotron-keyboard/analog -p test_memory_continue.py
```

The manifest check proves retained file/source identity. The reviewer checks the
selected startup/later state snapshots, fault restoration, complete 20-us waveform
and firmware comparisons, and post-fault activity. It does not establish private
state coverage at unobserved boundaries. Use each assessment's scope and the
[requirement audit](keyboard-controller-verification.md) before extending a claim.

## Functional release

The release manifest pins CAD, HDL evidence and browser runtime revisions and
hashes the reviewed assets. Its validation receipt links retained browser,
firmware and native DRC results. Check freshness with
`python3 scripts/keyboard-controller-release.py --check`; use `--help` when
issuing a new release after synchronization. CI verifies LFS photo identities
without fetching unused originals. The containing git commit identifies
the museum release without a self-referential commit hash. Functional release
does not grant electrical, historical, mechanical or fabrication qualification.

## Museum review and synchronization

**Proposed reference PCB** loads a separate pinned layout with component/net
selection and a proposed-copper filter. **Compare selection with historical
evidence** opens the corresponding photographs and unresolved joins. Its OpenSCAD
preview and **Populated reference assembly** show the proposed bodies and formed
leads. The signal-path walkthrough selects netlist-checked stages and connects
them to historical comparison. The historical view and its unresolved joins remain independent;
reference DRC success does not qualify package fit, device dynamics or fabrication.

Open **Keyboard controller circuit review** and select a component or net to see
its geometry and evidence. Cyan artwork has no net assignment. Both board sides
use one top-view coordinate frame; source links identify pinned revisions.
Photo rectangles locate component bodies or markings without assigning pads.
Unplaced resistor bodies and raised leads are visual geometry; hidden lead entries
and numbered pads remain unresolved.
Comparison-specimen previews are labelled separately from primary observations.
Signal-path inspection spans the reference driver, filter and cable nets while
showing supported copper fragments and unresolved photo regions. Filter and cable
body/wire observations come from CAD `output-assembly.json`; they do not assign
winding terminals. XT1's inherited coordinates are excluded from physical highlights.
**Underside copper group** inspects anonymous same-face spans directly on the photo.
Its optional board projection is illustrative; unresolved winding pairings and
terminal identities remain separate from the schematic nets.

**Recorded reference waveform** shows retained simulation samples, separate from
live latch samples and specimen measurements. Driver states apply at the marked
read. Functional firmware agreement does not qualify an uncertain input voltage.
Refresh its excerpt with `python3 scripts/sync-keyboard-waveform.py ../dac-emulation`;
add `--check` to verify the recorded commit without changing the excerpt. An
unrelated newer core commit does not invalidate a capture.

After committing compatible CAD and core sources, refresh museum assets:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
python3 scripts/sync-keyboard-controller.py ../3d-models ../dac-emulation
npx playwright test tests/keyboard-controller.spec.js --workers=1
```

Synchronization rejects dirty sources, stale exports, inconsistent connectivity
and stale qualification inputs. After schematic changes, synchronize the core's
reference and rerun its comparisons first. Geometry-only changes need not change
the connectivity hash. Asset synchronization establishes consistency, not the
truth of photo interpretations or specimen fidelity.
