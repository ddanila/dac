# Robotron capability and evidence matrix

Current baseline: DAC Emulation 0.8.9, scanline output, snapshot layout 8;
canonical model v48. This matrix describes present behavior. Dated development
sections elsewhere are history, not cumulative lists of current limitations.

| Subsystem | Implemented and checked | Remaining boundary | Evidence/check |
|---|---|---|---|
| CPU/memory | Shared Z80; 256 KiB; CAS-PROM read/write banking | No specimen bus trace comparison | Native machine/device and WASM parity tests |
| Display | Scheduled byte fetches, burst gaps, FIFO, scanline-sampled glyphs/cursor/intensity | Ideal local DACK, no dot-level contention or verified CPU IRQ wiring | `robotron_devices_test.c`; current 0.8.8 section in emulator README |
| DMA | Addressing, ready polarity, terminal count, interrupt priority, separate timed read/write phases and CPU pause | External WAIT, half-clock edges, exact bus arbitration, search modes and some reset commands incomplete | Native device tests; implementation in `robotron.c` |
| Keyboard | Unpatched S600 CPU, matrix, serial packets, Caps/SI/SO LED latches | Specimen replacement EPROM and legend differences not identified | S600 ROM tests; owner keyboard photos |
| Serial/printer | Clocked keyboard RX; asynchronous printer TX and interrupts; raw capture | V.24 channel and synchronous modes incomplete; capture assumes ready printer | `sio.c`; printer integration checks |
| Floppy | Independent mechanics, DSK/raw, timed searches/bytes, errors, writes, format | Reference trajectories; no flux/PLL, weak sectors or specimen measurements | `DRIVE-FIDELITY.md` and native/WASM tests |
| Enclosures | Owner-referenced 1 mm sheet, bends, split monitor/keyboard/system shells | Local bend radii and hidden joins remain estimates | Canonical CAD/evidence and static intersections |
| Boards | Owner-referenced packages, sockets, holes, supports and artwork | Artwork is not a verified netlist; some orientations/mounts unresolved | CAD hardware audit and calibration reports |
| Sound | Owner power/fan/key recordings; synthesized drive activity | Unmeasured spatial/acoustic response and drive timbre | Audio manifest and playback tests |
| Persistence | Browser disk copies, portable wrapper, preserved old cores, deterministic replay | Browser storage is not an archival backup | Session/portable/replay checks |

## Specimen inventory still requiring physical evidence

The system boot ROM, CAS PROM and transplanted keyboard EPROM need dumps and
hashes. Board revision/straps, drive suffix/jumpers, oscillator frequencies,
monitor adjustments and physical timing need identification or measurements.
Owner pictures establish appearance, not firmware contents or circuit continuity.
No software-only test can resolve these identities. Model visual approval never
changes a part's separate **printed and verified** classification.

## Qualification strategy

Run focused native device tests for core changes, bounded historical-ROM tests for
keyboard changes, geometry checks for affected interfaces, and browser interaction
checks for changed controls. Larger native/WASM application and cross-browser
checks belong at release boundaries. No full Verilog run is required.

Independent comparison should use explicit input events and compare observable
I/O, memory and screen checkpoints. Differences against another emulator are
investigation leads, not proof that either implementation matches hardware.

## Keyboard sweep and assembly audit

`s600-matrix-audit.json` records all 104 matrix contacts in normal, Shift,
Ctrl and Shift+Ctrl states (416 cases), including emitted bytes and LED state.
The ROM hash is embedded. This is an observation of the reference S600 ROM,
not an independent oracle or proof of the transplanted EPROM's identity.
Generate with `robotron-keyboard-rom-test s600.bin --audit`. Anchor tests also
exercise release-all after overlapping keys. Holding A alone for two seconds
emits one packet; do not substitute host auto-repeat for the firmware's REP key.

Canonical checks now include sampled lever/key travel and all 138 DIP
package-to-aperture interfaces. Neither establishes hidden wiring or pin-one
orientation from a photograph, nor qualifies a model as printed and verified.

## Museum use and preservation

Display brightness/contrast and optional phosphor persistence affect only 3D presentation; emulator pixels and
readable screen remain unchanged. Printer preview interprets common text controls,
shows other byte values explicitly, and retains the unchanged raw export.
Guided WordStar, Pascal and printing activities open a fresh temporary session in
another tab without changing the saved persistence preference.

Build with `DAC_BASE=/ npm run build`, then run
`python3 scripts/package-preservation.py /path/to/dac-preservation.zip`.
The archive includes a Python localhost server, file hashes, all built assets,
media notices and available archived cores. Optional third-party comparison
photos are not mirrored. Private browser sessions must be exported separately.


Camera-relative stereo placement is optional for owner recordings. It uses
screen position, not measured room acoustics; synthesized drives retain their
existing sound routing. Source raster resolution and model geometry are unchanged.

## Work still requiring a separate implementation or evidence pass

- V.24 channel B and its board clock/handshake wiring are not yet implemented.
  The printer preview does not imply full serial-port support.
- Electrical cable-disconnection experiments are not implemented; inspection
  separation remains visual and cannot silently change guest hardware.
- Independent-machine trace comparison still needs a matching W/M configuration
  and a reproducible reference run. Native/WASM parity is cross-build checking,
  not independent hardware validation.
- Per-component schematic navigation is already supported by the board inspection
  references; a complete signal/net overlay would need a verified netlist.
- Beam focus/spot-size and specimen acoustic/timing calibration remain open.
  The new display sliders are presentation controls, not guessed analogue circuits.
