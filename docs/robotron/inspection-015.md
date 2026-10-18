# Inspection evidence and checkpoint storage

## Inspection

Measurements hide endpoints/lines when an ancestor assembly is hidden, reject
hidden or clipped picks, and let either endpoint be replaced without losing the
other. Component deltas can use world, model or part-A axes; distance is unchanged
by that choice. The assembled/displayed distance frame remains independent.
Up to 20 named measurements are browser-local; JSON export remains the portable
copy. Old format-2 exports default to world axes and still validate model identity.
Named measurements are included in [collection backups](inspection-workspaces.md).

The optional evidence view colours owner dimensions green, owner-photo-derived
parts blue, generic/comparative parts purple and unmapped parts grey. Selecting a
surface opens its evidence and available source photograph. These colours never
mean printed and verified. That separate status comes from the canonical registry.
Measurement and evidence modes are mutually exclusive; both suppress operation
clicks while active. Colours restore when the mode exits.

Canonical source rules and motion waypoints live in `3d-models`, with copies in
`src/robotron-evidence.json` and `src/robotron-inspection-paths.json`.
[Canonical motion review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/checks/mechanical-review.md)
records sampled inspection paths. Keyboard layers open and the matrix moves aside
before the controller is removed. These paths are visual inspection aids, not
physical disassembly instructions or continuous clearance certification. Actual
cable slack remains unmeasured.

## Checkpoint storage

Checkpoint lists use a separate metadata index while payload validation proceeds.
Pending and damaged entries cannot restore, rename, export or preview; deletion
remains available. Restore validates the payload again. Collection import is
atomic. See the [checkpoint guide](inspection-and-checkpoints.md) for user workflows.
