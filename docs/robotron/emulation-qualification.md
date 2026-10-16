# Robotron emulation qualification

Current baseline: **DAC Emulation 0.17.0**, snapshot layout **15**, canonical
model **v48**. The [capability matrix](capabilities.md) describes current behavior;
older dated release sections are history. The earlier full historical-workflow result bundle remains pinned to 0.16.0 in
[emulation-qualification.json](emulation-qualification.json). Current keyboard
qualification and its source-bound reports are described in the
[controller implementation record](keyboard-controller-progress.md).

## Keyboard update in 0.17.0

Reference bus decoding and raw LED transitions now match the independent HDL
comparison. Memory writes also clock the serial line. Visible indicators use an
explicit 2 ms peak hold, separately observable from raw latches. Snapshot layout
15 includes that display state; 0.16.0 is preserved by hash for existing sessions.

## Previous changes in 0.16.0

Both SIO receive channels now track errors alongside each FIFO character.
Framing errors follow their character; parity and overrun become sticky when the
affected character reaches the head. Overflow replaces the third character.
First-character error lock/reset and special receive vectors now agree across
channels. V.24 BREAK considers the parity bit, and x16/x32/x64 framing errors add
half-bit recovery. The x1 path still lacks half-clock sampling resolution.
These changes follow [Zilog UM008101](https://www.zilog.com/docs/z80/um0081.pdf),
printed pp.235–237, and targeted native/MAME checks. The existing 5–7-bit receive
parity/padding correction remains covered in native and WASM tests.

The new per-character state requires snapshot layout **14**. Core **0.15.1** is
preserved by hash for existing sessions/checkpoints; restoration retains the
same-build requirement. ABI remains 1.

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
drives the same S600 switch coordinates, and compares six checkpoints:

1. Boot to `A>`.
2. `DIR`.
3. `TYPE AUTOEXC.SUB`.
4. `PIP B:=A:PIP.COM`.
5. `DIR B:`.
6. `PIP LST:=AUTOEXC.SUB`, including exact captured printer bytes.

Text and monochrome pixels are compared. Colour and only the final blinking
cursor cell are excluded. The 10,240-byte PIP.COM copy on each B disk must equal
the original, using an independent CP/M directory reader. Original media are
copied into temporary storage. Additional independent suites use the real S600 to create/save/reopen a WordStar
document and create/compile/run a Turbo Pascal program. Full text screens and
saved file bytes must match; application raster differences are recorded but do
not affect pass/fail because their cursor is not the CCP prompt cursor.
Native fault regressions interrupt writes at 1/128/255 bytes by motor loss,
controller reset and drive-door opening. They preserve the written prefix,
CRC-error metadata, remaining sectors and the other drive. Existing formatting
interruption and mixed DMA/S600/printer/V.24 snapshot checks remain separate from
MAME qualification.

The serial probe compares S600 input through the real keyboard CPU and SIO A,
including 8N1, an intentionally mismatched 7E1 receiver, and FIFO overflow.
All seven data/status observations match, including overrun visibility at the FIFO head. It compares full data
registers and parity status, rather than masking away a discrepancy. Neither
probe establishes clock equality, arbitrary external line-error behavior or
physical-specimen accuracy. Source behavior and Lua observation interfaces are
documented in [MAME's driver](https://github.com/mamedev/mame/blob/mame0289/src/mame/robotron/rt1715.cpp)
and [Lua device reference](https://docs.mamedev.org/luascript/ref-devices.html).

## Museum improvements

Practice pages retain manual step checks and now recognise reference-font screen
milestones. Saved WordStar/Pascal contents are independently read from the disk
copy. WordStar save/reopen has a full browser test, including saving/restoring the
practice recovery point. Loading unrelated media disables automatic recognition.
The guide waits for application prompts in its instructions; sending a whole
workflow while an application is loading can lose keyboard input.

Diagnostic comparison aligns operations and reports changed values, insertions,
clock offsets and relative timing separately. Repeated operations can be ambiguous;
it does not infer equivalent guest execution. Evidence cards now separate measured
dimensions, photo-derived shape, placement, estimated details and verification.
Missing feature-level evidence is explicitly identified.

Monitor inspection carries disconnected leads with the lifted assembly. Rear
slack redistribution preserves their modelled centreline lengths. The 164-pose
audit covers the lid, fixed chassis panels and PSU envelopes, alongside endpoints
and bends. Actual cable lengths, hidden slack and the disassembly sequence remain
estimates. See [inspection review details](diagnostics-and-model-review.md).

Reports: [historical commands and printer](historical-comparison.json),
[WordStar](wordstar-comparison.json), [Turbo Pascal](pascal-comparison.json),
[serial](serial-comparison.json), and [original diagnostic](mame-comparison.json).

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
Cross-browser qualification includes the focused Firefox/WebKit suite plus
practice and diagnostic-review tools. The initial WebKit pass exposed a loading
race; practice checkboxes now remain disabled until media configuration finishes.
All affected activity tests and the real WordStar recovery workflow pass after
the fix. Full counts and reruns are recorded in the JSON report.

From the sibling `dac-emulation` checkout:

```sh
make test test-runtime-sanitize
make test-wasm
make test-s600-workload S600_ROM=../dac/public/media/robotron/s600.bin
python3 tools/compare_robotron_mame.py --media ../dac/public/media/robotron --output build/mame.json
python3 tools/compare_robotron_historical.py --media ../dac/public/media/robotron --output build/historical.json
python3 tools/compare_robotron_historical.py --suite wordstar --media ../dac/public/media/robotron --output build/wordstar.json
python3 tools/compare_robotron_historical.py --suite pascal --media ../dac/public/media/robotron --output build/pascal.json
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
