# Inspection workbench

## Controls

Power and machine identity stay visible. Choose Use computer, Inspect model or
Diagnose hardware to narrow the secondary tools; All controls remains the default.

## Cutaways

Keyboard, drive and monitor presets choose a view, assembly and cutting plane.
The guide shows the current plane. Optional caps apply only to opaque enclosure
meshes with closed, unambiguous intersection loops, preserving nested holes.
Open, tangent, duplicate-edge and oversized contours are skipped. These are visual
section faces, not canonical CAD geometry; the cap count is reported explicitly.
Transparency and assembly separation can remove caps or change the section.

## Measurements

Enable point picking to replace machine clicks with two surface selections; drag
still orbits. A third click starts a new pair. Keyboard-accessible part-centre
buttons offer a coarser alternative. Points follow object transforms, including
instances. Displayed distance uses the model scale in millimetres and changes
when selected assemblies move/separate. Export includes part names, local points,
instance IDs and the **Model-derived estimate** classification.

The evidence panel lists owner-provided dimensions separately from the documented
TEAC track pitch. Picking geometry does not establish a new physical measurement
and never changes printed-and-verified status.

## Debugger

Power on, then open Diagnose hardware / Z80 debugger. Pause keeps power/state;
Next instruction boundary advances the CPU and peripherals to the next boundary,
with a 100,000-clock limit. Mid-instruction pauses finish that instruction first.
Changed registers and bytes are highlighted against the previous inspection.
Run to address stops at an opcode-fetch boundary; fetch has already happened.
Arming an execution breakpoint preserves the current pause/run state. Clearing
breakpoints removes execution and bus stops.
Registers, bounded disassembly and a 128-byte hex/ASCII memory window use mapped
reads with no guest bus side effects. Each memory row shows read/write space and
physical offset separately. At a boundary, disassembly starts at the fetch bus
address. Mid-instruction PC may point into operands; it is not reconstructed.

In the circuit panel select a trigger and Stop on trigger, then arm it. A paused
machine must be resumed. The stop occurs after the clock containing the bus event,
not before an instruction. Capture is bounded to 512 events. Recording/replay and
debug stepping are deliberately separate; finish one before starting the other.
Debugger pause/arm settings are host controls, not checkpoint guest state.

## Printer and controller limits

Ready/Busy/Offline/Paper out control printer CTS. The latter three share the same
guest-visible not-ready signal. WR3 Auto Enables holds waiting output; a started
frame completes. Software ignoring CTS can lose output, reported by the museum.
This is a bounded virtual receiver, not an emulation of a particular printer.
Readiness changes are recorded and survive snapshot/reset. See the
[core wiring and API notes](https://github.com/ddanila/dac-emulation/blob/main/docs/debugger-printer.md).

Read Track does not reconstruct unavailable gap/flux bytes. See
[controller evidence](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/DRIVE-FIDELITY.md).

## Measurement files and frames

Measurements can use displayed or assembled positions; component deltas can use
world, model or part-A axes. These choices do not turn model geometry into a
specimen measurement. Vertex snapping selects a triangle corner, which need not
be an engineering landmark. Hidden or clipped surfaces cannot be picked.

Measurement JSON preserves model identity, part references, points and transforms.
Import validates identity and parts, then restores points onto the current view;
it does not restore an old view. Named measurements are browser-local and included
in [collection backups](inspection-workspaces.md). Export a portable copy before
clearing browser storage. For changed geometry, use the explicit
[remapping workflow](diagnostics-and-model-review.md#relationships-and-measurements).

## Evidence and movement

Evidence colours distinguish owner dimensions, owner photographs, comparative
sources and unmapped parts. The viewport legend explains them; selecting a surface
opens its evidence. Evidence and measurement modes suppress machine-operation
clicks. Neither colour nor visual approval establishes physical print verification.

The [canonical mechanical review](https://github.com/ddanila/3d-models/blob/main/models/robotron-1715m/checks/mechanical-review.md)
records photo and sampled motion checks. Inspection paths are visual aids, not
physical disassembly instructions or continuous clearance certification. Hidden
mounts, tolerances and actual cable slack remain unverified.
