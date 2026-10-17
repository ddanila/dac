# Keyboard controller status and workflow

The [plan](keyboard-controller-plan.md) remains incomplete. Reference digital
comparisons and synchronized KiCad/OpenSCAD/museum exports are implemented;
physical reconstruction and specimen fidelity remain partial.
[Mixed-signal reference-board development](keyboard-controller-simulation.md)
continues with standard S600 firmware independently of specimen evidence. The
[requirement audit and evidence guide](keyboard-controller-verification.md)
identifies the remaining proof.

## Current evidence

Native KiCad owns numbered pins, nets and migrated PCB geometry. OpenSCAD owns
assembly mechanics. Photo-supported visual estimates remain explicitly separate
until their lead identities and native footprints are established. Transistor
body observations now use stable references and sourced L3/12 geometry; their
estimated leads do not establish B/E/C pad assignments.

The primary and comparison photographs depict different specimens. Source hashes,
reference variants and superseded interpretations live in the CAD evidence
manifests. The museum ROM was replaced and remains unread. The reference S600
workload qualifies logical behavior, not the specimen's firmware or exact timing.

Remaining work includes discrete placement and lead mapping, complete physical
data/clock routing, BR2 terminal order, connector correspondence, measured board
scale, underside registration and specimen timing. The withdrawn CPU CLK route
remains unassigned. Analog stages and exact CPU cycle equivalence are unqualified.

## Authoritative status

Use `public/models/robotron-1715m/source.json` and
`public/models/robotron-1715m/keyboard-controller.json` for compatible revisions.
In the CAD controller directory, `generated/layout.json` records placed/unplaced
parts and copper; `generated/qualification.json` records ERC/DRC findings;
`component-evidence.json`, `route-evidence.json` and `evidence.json` retain physical
claims and their sources. Core qualification reports live under
`verification/robotron-keyboard/reports/` in `dac-emulation`.

These artifacts carry inventories and test results. Git history carries the
change log; documentation should retain decisions, limitations and workflow.

## Review and reproduce

Open **Keyboard controller circuit review** in the museum. Select a component or
net for numbered pins, estimated pad positions, unplaced components and available
photo-alignment residuals. Cyan lines have no net assignment. Both board sides use
one top-view coordinate frame. Links identify exact pinned source revisions.

From the canonical CAD controller directory:

```sh
python3 tools/export.py --check
python3 tools/test_export.py
python3 tools/photo_registration.py
# The following require KiCad's Python/pcbnew:
python3 tools/export.py
python3 tools/test_kicad.py
openscad --backend=Manifold -o /tmp/controller.stl review.scad
```

`generated/photo-registration.svg` overlays PCB pads (red) and observed landmarks
(green) on the original photo. `photo_registration.py --apply --refs A1 ...` applies
explicitly selected acceptable fits to the native PCB; regenerate afterward.

From `dac-emulation`:

```sh
make test-keyboard-controller audit-keyboard-controller
make qualify-keyboard-controller S600_ROM=/path/to/s600.bin
make test-s600-workload S600_ROM=/path/to/s600.bin
```

Logs, vectors and optional VCD waveforms remain under `build/keyboard-controller/`;
committed qualification reports live in `verification/robotron-keyboard/reports/`.
After a schematic change, use `sync_reference.py`, rerun comparisons and commit
reports. A geometry-only change does not require a different connectivity hash.

After committing compatible sources, refresh museum assets with:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
python3 scripts/sync-keyboard-controller.py ../3d-models ../dac-emulation
npx playwright test tests/keyboard-controller.spec.js --workers=1
```

These checks reject dirty source repositories, stale exports, inconsistent
connectivity and reports whose implementation/CPU/header hashes have changed.
