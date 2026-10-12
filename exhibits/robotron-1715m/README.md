# Robotron 1715M

First planned exhibit in Danila’s Archive of Computing.

## Status

Interactive exhibit with a photo-referenced OpenSCAD exterior of Danila’s machine and the DAC Robotron functional core. The supplied diagnostic ROM runs without external files; original S550/287/TOS-M media has been booted locally with keyboard and disk access. The exterior uses the original manual’s nominal dimensions and owner photographs as references. Full-surface photo skins have been replaced by modeled details, consistent materials and transcribed key legends. Small features and unseen surfaces remain estimates; exact physical-variant identification and hardware-fidelity validation remain pending. See the root README for loading media and known compatibility limits.

## Reference capture

- Photograph the computer, monitor, and keyboard from all sides, including undersides.
- Measure the main dimensions and positions of controls, connectors, vents, and labels.
- Record the exact model markings, keyboard layout, monitor type, and any modifications.
- Capture close-ups of key legends, indicator lights and surface finishes; reconstruct clean condition.
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

Exterior parts can already be separated and inspected with evidence annotations and close-up views. October 12 owner photographs now establish rear sockets, rectangular system feet, monitor underside and the separate keyboard controller with a socketed UB880D. Local dimensions, hidden routing, system board revisions and CRT electronics remain provisional. Reference firmware feedback and two-drive media interactions are now implemented.

## Unresolved

Exact system hardware revision, unphotographed internals and more precise local dimensions. The functional core targets the M/W architecture; historical firmware is supplied locally by the visitor. See the [technical direction](../../docs/technical-direction.md).

### Reference configuration versus the physical specimen

| Item | Emulated reference | Physical specimen evidence still needed |
| --- | --- | --- |
| Main board | 1715W/1715M profile, 256 KB, 3.9936 MHz, supplied CAS decoding | Board revision, switches and ROM dump |
| Boot ROM | S550, hash pinned in `src/robotron-media.json` | Owner ROM label and dump |
| Keyboard | S600/U880 K7658 reference, nominal 683 kHz, 13×8 matrix | Owner photos confirm UB880D and replacement EPROM; ROM dump still needed |
| Disk | TOS/M 1.0, 80×2×5×1024 raw geometry | Owner disk image and OS revision |
| Drives | Two independent drives; timed functional controller | Drive suffix/jumpers and measured behavior; photographed K5601/Ratan labels establish appearance only |

Stock firmware is a usable reference configuration, not a confirmed dump of this entity. The existing local ROM/PROM/disk upload controls now also accept an optional keyboard ROM. Owner models/photos and comparative reference credits remain separate from emulation qualification.

## October 12 owner-photo update

Both new ZIPs (175 photographs) were reviewed. The canonical [CAD model and evidence inventory](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m) retain 28 complementary MIT owner reference photos and hashes for every original. The browser adds clean controller components, rectangular feet, a hollow monitor stand with brackets and underside controls, and rear connectors. Opening the keyboard separates the controller as one assembly. The corner paint-loss decal was removed.

Danila confirms the keyboard EPROM came from another board and works; its blue window cover is represented, but its firmware contents are unknown. The S600 emulated reference has not been relabeled as the specimen ROM. Existing comparative motherboard/CRT references retain their credits.

### Keycap close-ups and exposed keyboard boards

The next owner ZIP contains three side views. Black caps now have a square flange, taller rounded body and shallow dish. Clear function caps contain separate silver inlays and black legends; transparent plastic uses an inexpensive alpha approximation to keep software WebGL responsive. Case and keyboard feet now share identical geometry, per owner confirmation. Open keyboard separates the switch plate and turns the broad PCB over to reveal the photographed solder face; the narrow controller lifts out independently. Closing the view restores all positions.
