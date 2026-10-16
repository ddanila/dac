# Inspection and bounded diagnostics — 0.15.0

CAD geometry remains v48. No physical print-verification status changes.

## Inspection

Measurements hide endpoints/lines when an ancestor assembly is hidden, reject
hidden or clipped picks, and let either endpoint be replaced without losing the
other. Component deltas can use world, model or part-A axes; distance is unchanged
by that choice. The assembled/displayed distance frame remains independent.
Up to 20 named measurements are browser-local; JSON export remains the portable
copy. Old format-2 exports default to world axes and still validate model identity.
The later [portable inspection update](inspection-workspaces.md) migrates named
measurements into collection backups.

The optional evidence view colours owner dimensions green, owner-photo-derived
parts blue, generic/comparative parts purple and unmapped parts grey. Selecting a
surface opens its evidence and available source photograph. These colours never
mean printed and verified. That separate status comes from the canonical registry.
Measurement and evidence modes are mutually exclusive; both suppress operation
clicks while active. Colours restore when the mode exits.

Canonical source rules and motion waypoints live in `3d-models`, with copies in
`src/robotron-evidence.json` and `src/robotron-inspection-paths.json`.
[Motion audit](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/checks/mechanical-review.md#sampled-inspection-motion--2026-10-16)
found collisions in the straight controller removal path. It now opens the keyboard layers, moves the raised matrix aside, then moves
the controller forward, up and rearward with its components and cable endpoint.
The matrix returns to its usual inspection position after the controller clears.
All 205 sampled enclosure and controller/matrix checks are clear. Sampling is not continuous clearance
certification; physical cable slack remains unmeasured. No geometry simplification
or reduced visual detail was introduced.

## Checkpoint storage

IndexedDB v2 maintains a small checkpoint metadata store transactionally alongside
the original payload records. Existing copies migrate one at a time. Lists appear
before payload hashing; two validation tasks at most run per listing. Pending and
damaged entries cannot restore, rename, export or preview; deletion remains
available. Restore still validates its payload again. Collection import updates
metadata atomically and preserves the existing backup format.

## CI and emulator

Duration estimates now use successful workflow 38891503217. Keyboard input tests
load the real manifest and worker but deliberately block CAD requests; gestures
and visible key travel still run with the full model. The input-suite estimate is
provisional until its first new CI timing. Fail-fast and superseded-run cancellation
remain enabled. Test collection now checks module imports in the build job,
before installing any browsers. No Verilog or additional historical-ROM boots were added.

Core 0.15.0 adds a bounded mixed workload/snapshot test and native explicit RX/TX
clock-pin fixtures with fractional frame accounting. It also fixes an in-flight
printer frame becoming stuck when guest software clears TX enable. See
[core qualification](https://github.com/ddanila/dac-emulation/blob/main/docs/debugger-printer.md#explicit-clock-pins-and-mixed-continuation-0150).
The ideal diagnostic half-clock fixture is not a measured CTC waveform; the museum
board's aggregate x1 half-stop timing remains quantized. Snapshot layout is 13;
the 0.14.0 core is preserved by hash for existing recordings and checkpoints.
