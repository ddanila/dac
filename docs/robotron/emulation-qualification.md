# Robotron emulation qualification

Current baseline: **DAC Emulation 0.15.1**, snapshot layout **13**, canonical
model **v48**. The [capability matrix](capabilities.md) describes current behavior;
older dated release sections are history. Machine-readable results are in
[emulation-qualification.json](emulation-qualification.json).

## Changes

An independent S600/MAME comparison found that 5–7-bit SIO receive data lost
parity and unused high bits. Both receive channels now retain parity and fill
unused high bits with ones, as specified by
[Zilog UM008101](https://www.zilog.com/docs/z80/um0081.pdf), printed pp.235–236.
For example, seven data bits `61h` plus parity one read back as `E1h`. Native
tests cover both channels, four clock divisors, four widths and all three parity
modes. A WASM test restores a snapshot during short-word reception and checks
the received register after both batched and single-clock execution.

The current core has the same state layout; the previous 0.15.0 binary remains
archived by hash for existing portable sessions. Layout equality does not waive
the existing same-build requirement.

The historical browser test now decodes the actual 640×288 canvas using the
bundled TOS/M disk's 8×12 font at offset 106496. Font identity is checked. It
requires a visible prompt, directory filenames and a completed command instead
of inferring success from disk activity or sleeping after boot. This is a narrow
reference-font fixture, not generic OCR or validation of every 8275 attribute.
Exact glyphs and reverse-block cursor glyphs are recognized; unknown pixels
remain visibly unknown in failure output.

The optional workflow creates a text file through PIP and the S600 keyboard,
uses physical Ctrl+Z, reads it with TYPE, saves a checkpoint, deletes the file,
restores the complete disk/display and reads it again. It waits for PIP's own
prompt before entering a command, because PIP loading consumes time during which
console input can be lost. A new paste immediately displays “Starting typing…”
so a previous completion message cannot be mistaken for the new operation.
The optional mid-write regression now also runs with S600, comparing controller
samples, disk bytes and independently decoded copied file contents after restore.

## Independent reference scope

The original diagnostic MAME probe remains available. A new historical probe
boots the unmodified S550 ROM and TOS/M disk in DAC and MAME 0.289 `rt1715w`,
drives the same S600 switch coordinates, and compares five checkpoints:

1. Boot to `A>`.
2. `DIR`.
3. `TYPE AUTOEXC.SUB`.
4. `PIP B:=A:PIP.COM`.
5. `DIR B:`.

Text and monochrome pixels are compared. Colour and only the final blinking
cursor cell are excluded. The 10,240-byte PIP.COM copy on each B disk must equal
the original, using an independent CP/M directory reader. Original media are
copied into temporary storage. Separate native application checks exercise
WordStar, Turbo Pascal and printer output; those checks use the character adapter.

The serial probe compares S600 input through the real keyboard CPU and SIO A,
including 8N1 and an intentionally mismatched 7E1 receiver. It compares full data
registers and parity status, rather than masking away a discrepancy. Neither
probe establishes clock equality, arbitrary external line-error behavior or
physical-specimen accuracy. Source behavior and Lua observation interfaces are
documented in [MAME's driver](https://github.com/mamedev/mame/blob/mame0289/src/mame/robotron/rt1715.cpp)
and [Lua device reference](https://docs.mamedev.org/luascript/ref-devices.html).

## Reproduce

From this repository:

```sh
npm run test:historical
npx playwright test tests/serial.spec.js tests/sessions.spec.js tests/portable-sessions.spec.js tests/checkpoints.spec.js --workers=1
npm run test:cross
npm run build
```

`test:historical` explicitly enables the longer S600 workflow and S600 mid-write
variant. Ordinary CI retains its existing historical `DIR` check and adapter
mid-write test, but does not add the longer boot workflows, MAME or HDL.
Cross-browser qualification uses the existing focused Firefox/WebKit suite.

From the sibling `dac-emulation` checkout:

```sh
make test test-runtime-sanitize
make test-wasm
make test-s600-workload S600_ROM=../dac/public/media/robotron/s600.bin
python3 tools/compare_robotron_mame.py --media ../dac/public/media/robotron --output build/mame.json
python3 tools/compare_robotron_historical.py --media ../dac/public/media/robotron --output build/historical.json
python3 tools/compare_robotron_serial.py --media ../dac/public/media/robotron --output build/serial.json
python3 tests/integration/robotron_applications.py ../dac/public/media/robotron/s550.bin ../dac/public/media/robotron/cas.bin ../dac/public/media/robotron/tosm10.img
```

Use the pinned Emscripten 6.0.12 environment for WASM. MAME and historical-media
checks are optional local qualification, not normal native CI dependencies.

## Specimen evidence and timing

[specimen-inventory.json](specimen-inventory.json) separates bundled reference
hashes from actual supplied dumps. No specimen ROMs or measurements were supplied
for this pass. To record them without modifying their bytes:

```sh
python3 scripts/inventory-robotron.py \
  --boot-rom /path/to/specimen-boot.bin \
  --cas-prom /path/to/specimen-cas.bin \
  --keyboard-rom /path/to/specimen-keyboard.bin \
  --evidence /path/to/measurements.json \
  --output /path/to/specimen-inventory.json
```

Record chip markings, board revision, socket position and programmer/read settings
with each dump. Keep two independent reads and compare their hashes. If a chip's
capacity differs from the reference profile, preserve its full dump; investigate
address decoding before trimming or repeating bytes. Matching a reference hash
establishes byte identity, not the provenance of a dump.

Photograph drive suffixes, jumpers, board straps and oscillator markings. Timing
captures should record the probe point, instrument/timebase, machine configuration,
input sequence and raw capture path. Useful first observations are main/keyboard
clock frequency, motor command to READY/index, STEP to settling, and serial clock
frequency/duty cycle. DACK/bus contention and IRQ routing require identified board
signals; photographs alone cannot establish connectivity.

Evidence JSON accepts `specimen`, `identification` and a `measurements` array.
Each measurement includes `property`, `value`, `unit`, `method`, and `source`.
For example, use a measured value with a raw capture filename as its source;
do not substitute a reference datasheet limit for an observation of this machine.

No timing route was changed speculatively. Display local DACK, DMA half-clock
arbitration, x1 serial half-stop completion and mechanical trajectories retain
their documented boundaries. The new independent raster/serial checks provide
evidence for targeted changes; they do not measure those remaining properties.
