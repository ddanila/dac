# DAC — Danila’s Archive of Computing

*A museum of computers and the worlds they opened.*

DAC is a virtual museum of computers from Danila’s collection: detailed 3D objects you can inspect, turn over, and switch on in your browser.

The ambition is to preserve both the physical machine and the experience of using it. Press the power button on the case, watch the emulated computer boot on its own screen, and use its keyboard. Rotate the computer and its peripherals to explore labels, connectors, textures, and undersides. Eventually, open the case and explore the hardware inside.

## First exhibit: Robotron 1715M

The Robotron 1715M will be the first showcase, based on Danila’s physical machine. Its exact configuration, keyboard, monitor, firmware, and boot media still need to be documented.

The first complete interaction should be simple: open the exhibit, rotate it, press its power control, watch a real emulated boot, and type a command.

## Project status

Concept and research stage. This repository currently contains the project brief and initial technical direction. There is no working viewer, emulator integration, or 3D model yet.

## Approach

- Build exhibits from photographs, measurements, and observations of the actual objects.
- Keep cases, keyboards, monitors, controls, and future removable panels as separate model components.
- Connect interactive controls and the monitor surface to an emulator through a small adapter.
- Reuse established emulators where practical; choose the engine per machine.
- Keep original modeling assets separate from optimized browser exports.
- Record the source, version, and usage permissions of imported assets and emulator components.

Hosting, large-asset storage, emulator packaging, and project licensing remain open decisions. No third-party firmware or disk images are included.

## Next steps

1. Document the Robotron and identify its exact hardware and software configuration.
2. Prove a repeatable emulated boot, then reproduce it in the browser.
3. Connect a simple 3D case, power control, keyboard input, and live screen.
4. Produce the detailed exterior model and inspectable peripherals.
5. Add interior views as the physical hardware is documented.

See [technical direction](docs/technical-direction.md) and the [Robotron exhibit brief](exhibits/robotron-1715m/README.md).
