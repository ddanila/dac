# Robotron 1715M

An interactive exhibit of Danila's museum specimen, combining photo-referenced
OpenSCAD geometry with a functional M/W reference emulator. See the
[root guide](../../README.md) for use, the
[capability matrix](../../docs/robotron/capabilities.md) for current limits, and
[canonical CAD](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m)
for source photographs, geometry and physical verification status.

## Reference versus specimen

Bundled S550, CAS and S600 firmware and TOS/M media form a reproducible reference
configuration. Their identities live in `src/robotron-media.json`; they are not
dumps of the museum machine. Local media controls accept replacement firmware
and disks without uploading them.

The owner confirms that the keyboard EPROM came from another board and works;
its contents remain unidentified. Keep its appearance and specimen legends
independent of the reference S600 mapping. Keyboard circuit reconstruction follows
the [KiCad/OpenSCAD/emulation plan](../../docs/robotron/keyboard-controller-plan.md).

Owner photos establish visible construction and markings. Comparative CRT or
board sources remain attributed separately and do not establish this specimen's
hidden circuitry. Dimensions, hidden mounts, cable slack and device timing retain
the confidence recorded in the canonical evidence. Visual approval never implies
printed-and-verified status.

## Interaction boundaries

Power, reset, key contacts, drive levers and media controls affect the emulator.
Opening a drive lever can interrupt an active write; removing a disk retains its
session image for reinsertion or export. Preserved older cores expose only their
supported controls.

Assembly separation, cutaways, mechanical demonstrations and the released-clamp
inspection override are visual tools. Inspection paths are not physical disassembly
instructions. The diskette and its handwritten label are modeled specimens;
the emulated image is selected separately. The owner's white sleeve is non-original
packaging.

## Evidence collection

Retain original photographs and hashes, board/package markings, revision and
modification details, dimensions with measurement methods, and raw timing captures
with setup information. Keep ROM reads separate from reference binaries. Resolve
what existing evidence can establish before requesting new observations; the
[verification guide](../../docs/robotron/keyboard-controller-verification.md)
identifies the controller's remaining questions.
