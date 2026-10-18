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
Comparison-specimen previews are labelled separately from primary observations.

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
