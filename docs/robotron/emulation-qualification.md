# Robotron emulation qualification

The [capability matrix](capabilities.md) describes current behavior. The
[retained qualification bundle](emulation-qualification.json) identifies the
build it tested; it is not automatically a qualification of every later core.
Current keyboard circuit results are source-bound in the
[controller guide](keyboard-controller-progress.md).

Browser historical checks decode the actual display using the reference disk's
font, require visible command results and independently read saved files. This is
a narrow reference-font fixture, not generic OCR. Unknown pixels remain unknown
in failure output. Guest workflows must wait for application prompts: input sent
during loading can be lost.

## Independent reference scope

The original diagnostic MAME probe remains available. The historical probe
boots the unmodified S550 ROM and TOS/M disk in DAC and MAME 0.289 `rt1715w`,
drives the same S600 switch coordinates, and compares these checkpoints:

1. Boot to `A>`.
2. `DIR`.
3. `TYPE AUTOEXC.SUB`.
4. `PIP B:=A:PIP.COM`.
5. `DIR B:`.
6. `PIP LST:=AUTOEXC.SUB`, including exact captured printer bytes.

Text and monochrome pixels are compared. Colour and only the final blinking
cursor cell are excluded. The PIP.COM copy on each B disk must equal
the original, using an independent CP/M directory reader. Original media are
copied into temporary storage. Additional independent suites use the real S600 to create/save/reopen a WordStar
document and create/compile/run a Turbo Pascal program. Full text screens and
saved file bytes must match; application raster differences are recorded but do
not affect pass/fail because their cursor is not the CCP prompt cursor.
Native fault and mixed-device snapshot regressions remain separate from MAME
qualification; their fixtures and reports define exact interruption coverage.

The serial probe compares S600 input through the real keyboard CPU and SIO A,
including 8N1, an intentionally mismatched 7E1 receiver, and FIFO overflow.
It compares full data
registers and parity status, rather than masking away a discrepancy. Neither
probe establishes clock equality, arbitrary external line-error behavior or
physical-specimen accuracy. Source behavior and Lua observation interfaces are
documented in [MAME's driver](https://github.com/mamedev/mame/blob/mame0289/src/mame/robotron/rt1715.cpp)
and [Lua device reference](https://docs.mamedev.org/luascript/ref-devices.html).

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
Cross-browser qualification covers focused Firefox/WebKit workflows, including
practice and diagnostic-review tools. Retained JSON identifies tested builds,
coverage and failures; passing an older report does not qualify later changes.

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
hashes from actual supplied dumps. Use the inventory to check available evidence. To record specimen inputs without
modifying their bytes:

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

Display local DACK, DMA half-clock arbitration, serial half-stop completion and
mechanical trajectories retain the boundaries in the capability matrix. Independent
emulator comparisons do not measure those physical properties.
