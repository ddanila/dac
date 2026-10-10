# Robotron 1715M

First planned exhibit in Danila’s Archive of Computing.

## Status

Interactive exhibit with a photo-referenced OpenSCAD exterior of Danila’s machine and the DAC Robotron functional core. The supplied diagnostic ROM runs without external files; original S550/287/TOS-M media has been booted locally with keyboard and disk access. The exterior uses the original manual’s nominal dimensions and twelve owner photographs as references. Full-surface photo skins have been replaced by modeled details, consistent materials and transcribed key legends. Small features and unseen surfaces remain estimates; exact physical-variant identification and hardware-fidelity validation remain pending. See the root README for loading media and known compatibility limits.

## Reference capture

- Photograph the computer, monitor, and keyboard from all sides, including undersides.
- Measure the main dimensions and positions of controls, connectors, vents, and labels.
- Record the exact model markings, keyboard layout, monitor type, and any modifications.
- Capture close-ups of key legends, indicator lights, surface finishes, and wear.
- Record the observed startup sequence and identify available firmware and boot disks.
- Document internal components later, when accessible, distinguishing observed details from reconstructed ones.

## First playable exhibit

- Rotate and zoom around the computer and its peripherals.
- Inspect the rear and underside of the keyboard and case.
- Activate the physical power control to start a cold boot.
- Display live emulator output on the modeled monitor.
- Type using the visitor’s keyboard, click the modeled keys, or use accessible keyboard buttons. 89 positions are wired; eight unverified mappings are explicitly unavailable.
- Power off and restart predictably.
- Provide a focused screen view and accessible controls alongside the 3D interaction.

## Later detail

Exterior parts can already be separated and inspected with evidence annotations and close-up views. Internal boards/cabling, exact rear connector placement, physical keyboard-controller feedback and drive media interactions remain future work requiring more references.

## Unresolved

Exact hardware revision, rear/inside visual references and more precise local dimensions. The functional core targets the M/W architecture; historical firmware is supplied locally by the visitor. See the [technical direction](../../docs/technical-direction.md).

### Reference configuration versus the physical specimen

| Item | Emulated reference | Physical specimen evidence still needed |
| --- | --- | --- |
| Main board | 1715W/1715M profile, 256 KB, 3.9936 MHz, supplied CAS decoding | Board revision, switches and ROM dump |
| Boot ROM | S550, hash pinned in `src/robotron-media.json` | Owner ROM label and dump |
| Keyboard | S600/U880 K7658 reference, nominal 683 kHz, 13×8 matrix | Controller PCB photo, chip marking and ROM dump |
| Disk | TOS/M 1.0, 80×2×5×1024 raw geometry | Owner disk image and OS revision |
| Drives | One emulated mounted disk; timed functional controller | Drive suffix/jumpers and measured behavior; photographed K5601/Ratan labels establish appearance only |

Stock firmware is a usable reference configuration, not a confirmed dump of this entity. The existing local ROM/PROM/disk upload controls now also accept an optional keyboard ROM. Owner models/photos and comparative reference credits remain separate from emulation qualification.
