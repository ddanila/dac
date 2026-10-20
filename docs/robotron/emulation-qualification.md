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

Independent probes compare the reference firmware/media against MAME using the
same S600 switch inputs. They cover guest commands and printer bytes, application
save/reopen workflows, and serial receive/error behavior. Exact scenarios, MAME
version, source revisions and comparisons belong in the reports below and the
[comparison tools](https://github.com/ddanila/dac-emulation/tree/main/tools).

Command checks compare text and monochrome raster, excluding colour and the final
blinking prompt cursor. Application checks compare text and saved file bytes;
application raster differences are diagnostic rather than pass/fail. Serial checks
retain complete data and parity status. These comparisons do not establish clock
equality, arbitrary external line-error behavior or specimen accuracy. Original
media are copied into temporary storage for tests.

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

`test:historical` enables longer guest workflows. MAME, HDL and extended circuit
qualification remain separate from ordinary browser CI. The
[root guide](../../README.md#model-review-and-ci) links the CI policy; retained
JSON reports qualify only their recorded inputs and builds.

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

Use the Emscripten environment pinned by the core build workflow for WASM. MAME and historical-media
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

The [inventory tool](../../scripts/inventory-robotron.py) owns the evidence
format and validation. Link measurements to raw captures; do not substitute a
reference datasheet limit for an observation of this machine.

Display local DACK, DMA half-clock arbitration, serial half-stop completion and
mechanical trajectories retain the boundaries in the capability matrix. Independent
emulator comparisons do not measure those physical properties.
