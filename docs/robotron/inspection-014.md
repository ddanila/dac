# Inspection, checkpoints and qualification — 0.14.0

Canonical CAD remains v48. This release improves inspection and diagnostic tools;
it does not promote visual approval into physical print verification.

## Debugger

Pause keeps the machine powered; its paused state appears beside power. Changed
registers and inspected bytes are highlighted against the previous inspection.
Flags are decoded, and mapped memory names RAM, ROM, video, glyphs and I/O.
Run to address resumes until an opcode-fetch boundary at a logical 16-bit CPU
address. Arm execution breakpoint leaves the current pause/run state alone.
Clear breakpoints clears execution and bus stops. Fetch activity has already
happened at an execution stop; this is not a reversible pre-fetch breakpoint.

## Measurements and cutaways

Measurements export as `DAC-model-measurement-2`: manifest identity/hash, part
path, instance, local points, displayed/rest matrices, distance and world-axis
components. Import validates the identity and parts before replacing points.
It restores the selected points onto the current view; it does not restore an
old view or apply exported transforms. Choose Assembled reference to compare
points in their initial assembly poses despite separation. Values remain
model-derived estimates. Vertex snapping chooses a corner of the hit triangle,
not necessarily a meaningful engineering landmark. Clipped vertices reject the
pick; clipped markers and lines are hidden.

The plane handle moves along the selected axis; orbiting is suspended during a
drag. Caps rebuild on release. The relative-position slider uses visible assembly
bounds, so isolate the assembly first. Skipped shell sections name their reason:
non-crossing, unsupported, transparent, oversized or ambiguous/open contour.
Unsupported caps remain open rather than inventing a solid interior.

## Checkpoints

Rename, export or import an individual `.daccheckpoint` without exporting the
whole collection. Both disk copies and state have checksums; the envelope is
also checksummed. Import adds a new entry and does not restore the machine.
Compatibility preview reports machine, firmware and core availability before
restore. Custom ROM checkpoints work when the exact same firmware files are
supplied; firmware bytes are not embedded. Damaged entries stay listed so they
can be deleted, without hiding healthy entries. The 20-checkpoint bound remains.

## Evidence and CI

[Mechanical review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/checks/mechanical-review.md)
links annotated owner photos, current-model overlays, 54 assembly checks, three
cover checks and the 138-package interface check. Geometry remains unchanged;
hidden mounts and physical tolerances retain their uncertainty.

The long keyboard test file is split into input, gesture and physical-keycap
files, preserving all tests and isolated browser contexts. CI estimates now use
successful run 38883094600; split-file durations are explicitly provisional until
the next measured run. Fail-fast and cancellation of superseded runs remain.
No full Verilog run or historical-ROM boot is added to ordinary CI.

[Serial timing investigation](https://github.com/ddanila/dac-emulation/blob/main/docs/debugger-printer.md#execution-targets-and-independent-clock-fixtures-0140)
adds independently callable RX/TX clock fixtures. The museum still uses its CTC
route. Native tests cover independent clocks and all four divisors; snapshot
continuation remains covered. TX x1 half-stop capture rounding, a browser external
clock generator and synchronous SIO modes remain limitations, not fidelity claims.
Snapshot layout stays 12; the previous 0.13.0 core is preserved by hash.
