# Inspection workbench

## Controls

Power and machine identity stay visible. Choose Use computer, Inspect model or
Diagnose hardware to narrow the secondary tools; All controls remains the default.
The groups move existing controls without cloning their listeners or state.

## Cutaways

Keyboard, drive and monitor presets choose a view, assembly and cutting plane.
The guide shows the current plane. Optional caps apply only to opaque enclosure
meshes with closed, unambiguous intersection loops, preserving nested holes.
Open, tangent, duplicate-edge and oversized contours are skipped. These are visual
section faces, not canonical CAD geometry; the cap count is reported explicitly.
Transparency and assembly separation can remove caps or change the section.
Caps are rebuilt on inspection changes, not on every emulator frame.

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

The mixed-size Read Track investigation did not establish enough evidence to
invent unavailable gap/flux bytes. That limitation remains explicit. Expanded
format tests cover reset, motor-off and door opening before and after a completed
sector, preserving unrelated bytes and the other drive. See
[controller evidence](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/DRIVE-FIDELITY.md).
