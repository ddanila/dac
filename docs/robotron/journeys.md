# Robotron Journey Workbench

Open **Diagnose → Journey workbench**. The original **Keyboard dive-in** is linked from the same workbench and retains its existing captures and `#keyboard-dive` link. Additional links are `#journey=boot`, `disk`, `video`, `interrupt`, and `faults`.

A journey runs a separate emulator instance. Historical references load the pinned S550 ROM, CAS287 decoding PROM, S600 keyboard ROM and TOS/M disk. Diagnostics are original DAC programs assembled from [journey-programs.js](../../src/journey-programs.js); their source labels and firmware hashes are included in the capture. They are not historical software.

## Following execution

Select a stage, move the timeline cursor, or click a waveform position. Code, registers, memory mapping, controller state, interrupt chain and glyph provenance share the same event. Register highlights compare adjacent retained observations. Instruction-boundary registers precede the instruction; a peripheral event can occur mid-instruction. The PC and disassembly identify the last observed instruction boundary. Four bytes alongside disassembly are a look-ahead, not an assertion that the instruction is four bytes long.

The video stage buttons follow the `a` glyph in the selected display cell, so an earlier blinking cursor does not stand in for the typed character. Other cells or glyphs remain available in the raw timeline; a stage is marked unobserved if the selected cell never contains that character.

The screen is the capture endpoint, not a reconstructed screen at the history cursor. The physical track action focuses the recorded drive/cylinder/head in the museum model. The filesystem explorer is explicitly the live machine's disk. Private reference disk contents do not replace the visitor's disk.

Long references retain an overview: first execution in each mapped page, controller changes, sampled DMA transfer boundaries, display changes and aggregated status polls. Counts disclose aggregation. This bounded overview cannot show every bus edge or establish pulse widths. **Expand verified interval** restores a checkpoint, replays the action log to the original endpoint and compares the complete saved-state SHA-256. Only a matching replay may supply an instruction/bus detail window. Detail is bounded to 40,000 machine clocks and reports buffer truncation if capacity is exhausted. Imported and live-only captures have no replay inputs and cannot invent omitted history.

## Scenarios

| Journey | References and observed outcome |
| --- | --- |
| Power-on to prompt | Cold start, reset after an initial boot, and missing media. The reference waits for the final interactive `A>` row, not an intermediate startup prompt. Trace ROM page visits, controller commands, transfers, RAM execution and display changes. Reset uses the emulator's machine reset; it is not labelled as a CP/M BDOS warm-boot call. |
| Disk operation | `DIR` after a private OS disk-reset utility, two consecutive `DIR` commands with actual disk-operation comparison, and `PIP DIVE.COM=PIP.COM`. The original `DIVECHK` diagnostic opens and reads the copy through BDOS and prints its checksum result. A separate full-byte comparison checks the private disk's source and destination files. |
| Character to pixels | Historical `a` input; an original attribute/cursor diagnostic; and writes while scanout continues. Selected cell scanline records contain the actual glyph offset, raw byte and emitted byte. Clicking a derived dot reveals its raw/output bit. |
| Interrupt | Original CTC IM2 programs demonstrate masking, source priority and nesting. Observe request, eligible source, acknowledge/vector, stack writes, handler and RETI. Historical activity is also available: absence of interrupts stays absence, and polling is never relabelled as an interrupt. |
| Fault consequences | Baseline and intervention branches begin with the same checkpoint. Apply a held A contact, suppressed serial strobe, S600 ROM bit mutation, absent disk, sector CRC, write protection, delayed interrupt acceptance, or glyph bit mutation. Compare first retained effects and endpoint symptoms. |

The disk-reset and verifier COM files exist only in a private modified disk. `DIVECHK` uses the standard default FCB, BDOS open/sequential read, a 16-bit byte sum, and BDOS text output. Its checksum is corroborated by the independent full-byte check; it is not treated as a collision-proof integrity hash.

## Experiments

Activation delay is expressed in 3.9936 MHz machine clocks. Parameters are scenario-specific and described beside the controls:

- Suppressed strobe: the ordinal strobe, default 5, maximum 100,000. Suppression occurs at the digital receiver handoff; board activity remains observable.
- Delayed IRQ: the interval during which CPU acceptance is inhibited, default 80,000 clocks. The peripheral's pending request remains present.
- Glyph: bit number 1–8 and glyph byte offset; default offset `0261h`.
- CRC: target `RRHHCC` encodes sector ID, head, cylinder, default `010000h`.
- S600 ROM: XOR bit zero at offset `01C4h` in the private keyboard ROM.
- Held A: the baseline releases the contact; the intervention keeps it down.
- Missing media / read-only destination: actual private drive/media state changes.

**Clone live machine** pauses the museum long enough to take a checkpoint and resumes it if it was running. Both experiments then run separately. Ordinary live capture and stepping, in contrast, explicitly control the live museum machine. Experiment overlays are owned by the private session and discarded when it closes. They are not a new general-purpose persistent fault snapshot format.

The first-difference comparison excludes the explicit intervention marker and compares retained timing and effects. **Inspect baseline timeline** opens the baseline at its corresponding event, with its own code, registers, waveform and pixels. **Return to intervention** restores the paired fault event. Baseline inspection is read-only. It reports an observed difference, not a proof of the earliest physical divergence. Changed software timing can align different events at the same list position; both indices remain available.

## Signals and physical limits

The workbench displays modelled DRQ, DMA RDY, DMA bus ownership, eligible interrupt request and terminal count. Firmware-keyboard captures also show `TA_DATEN` (inverted D0) and `TA_TAKT` (the write strobe after its board inverter). The waveform scrolls horizontally on narrow screens to preserve readable labels. Values are recorded at event boundaries. Step-shaped lines connect observations; an overview is not a logic-analyser recording of every edge. The original keyboard journey remains the detailed data/strobe and receiver-bit view.

Video scanlines come from the functional display decoder. Eight dots are derived from the sampled emitted byte after attributes, cursor and blanking. No new CRT analogue, beam-persistence, cable-filter or floppy-flux model is implied. Drive phase and STEP/INDEX activity come from the existing deterministic mechanics model. Schematic/specimen evidence remains separate from simulated timing.

## Portable captures and verification

`DAC-journeys-1` JSON records use 96 unsigned 32-bit words per event. The export includes firmware/disk hashes, core revision, source labels, disassembly, endpoint text, summary and paired baseline when present. Imports validate schema, record bounds, event kinds and monotonic clocks. They are read-only and do not execute imported programs or replay claims. Untrusted annotation text is displayed as text, never HTML.

The legacy keyboard ABI and export format remain unchanged. Native regression tests check byte-for-byte state neutrality, deterministic repeated traces, isolated faults, trigger stops and bounds. A native/WASM parity fixture compares every word. Browser tests exercise all scenarios, checked disk outcomes, replay, import, mobile layout and the keyboard link. Existing museum tests cover integration and archived state compatibility.
