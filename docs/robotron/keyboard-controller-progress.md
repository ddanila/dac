# Keyboard controller status and workflow

The [plan](keyboard-controller-plan.md) remains incomplete. Use the
[requirement audit](keyboard-controller-verification.md) for remaining proof and
[simulation decision](keyboard-controller-simulation.md) for electrical scope.
Physical reconstruction and reference simulation can continue from existing
photographs, published device evidence and standard S600 firmware.

## Authoritative artifacts

| Question | Source |
| --- | --- |
| Which revisions does the museum display? | `public/models/robotron-1715m/source.json` and `keyboard-controller.json` |
| Which parts and routes are placed? | CAD `generated/layout.json` |
| What is observed, inferred or unresolved? | CAD `evidence.json`, `component-evidence.json`, `route-evidence.json` |
| Which X1 geometry and terminal assignments are supported? | CAD `generated/connector-review.json` and `generated/connector-terminals.json` |
| Which output/connector spans should be reviewed next? | CAD `review/connection-review.html`, generated from `connection-review.json` and canonical evidence |
| Where does the candidate clock continuation stop? | CAD `clock-continuation.json`, generated host-clock connection review; hidden bank joins and upper-eye/filter attachment remain open. |
| Which filter joints correspond across the primary photos? | CAD `filter-registration.json` and generated `filterRegistration`; DAC “Filter joint correspondence”. Bounded photo matching, not electrical assignment. |
| Can supply rails identify a filter winding? | CAD `supply-review.json` and `generated/cable-copper.json` → `supplyReview`; DAC “Supply → filter evidence” |
| Which cable-end joints share recorded underside copper? | CAD `generated/cable-copper.json`, generated from anonymous observations in `cable-copper.json` |
| What native checks remain? | CAD `generated/qualification.json` |
| What digital behavior is qualified? | Core `verification/robotron-keyboard/reports/` |
| What electrical assumptions and failures were retained? | Core `verification/robotron-keyboard/analog/reports/`; individual run reports and traces under `build/keyboard-controller-analog/` |

Inventories and results belong in these artifacts; implementation history belongs
in git. Local build and review instructions live in the
[CAD guide](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/keyboard-controller/README.md)
and [co-simulation guide](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/README.md).
Use museum manifests when reviewing a specific pinned version.

## Museum review and synchronization

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
