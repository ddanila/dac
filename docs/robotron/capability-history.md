# Historical Robotron qualification notes

These notes describe older releases. For present behaviour use [the current matrix](capabilities.md).

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

## 0.9.0 qualification pass

- Numeric CRT settings, manually checked practice progress, and the preservation
  download are visible. An open printer preview follows guest output automatically.
- S600 anchor checks now cover REP alone, REP with A, release, overlap and
  Shift+Ctrl transitions. The keyboard CPU stops during opt-in disconnection.
  `keyboard-legends.json` compares model mappings against the existing 416-case
  sweep: Shift+4 emits `$`, Shift+^ emits `~`, Shift+@ emits a grave accent.
  Those three keys have no distinct corresponding shifted legend in the model.
  This does not identify the owner's replacement EPROM; specimen labels stay intact.
- V.24 channel B supports asynchronous queued input, raw output capture, a three-byte
  receive FIFO, overrun, RX/TX interrupts, CTS/DCD and optional RTS flow control.
  CTC0 channel 1 supplies the internal reference clock through the S1 route shown
  in `1715W/teil_b/Stromlaufplan D.jpg`. Guest software must configure the SIO/CTC.
  The peer adapts to guest framing; 1.5 RX stop bits are conservatively extended
  to two. External clock selection, synchronous modes and external/status interrupt
  latching remain unimplemented. This is a byte terminal, not XMODEM/Kermit.
- Serial queues, bit phase, signals and experiment connections participate in
  snapshot layout 9. Recording format 2 adds serial events and a fifth output hash.
  Existing format-1 recordings remain supported; the 0.8.9 core is preserved.
- `mame-comparison.json` records a successful MAME 0.289 `rt1715w` comparison of
  an original diagnostic: CPU memory, two-byte DMA, ordered I/O, IM2 timer interrupt
  and display character RAM. It does **not** compare raster pixels, timing edges or
  full OS execution. Reproduce with `dac-emulation/tools/compare_robotron_mame.py`;
  MAME is optional and is not downloaded or run by normal CI.
- Circuit cards identify A1/A2/A3/A4/A5/A44, roles, signal relationships and exact
  files in the linked W/M archive. The archive has no individual-sheet web URLs;
  the link downloads it and names the sheet to open. This is not a net overlay or
  a verified specimen netlist.
- Electrical experiments explicitly disconnect keyboard power/data or monitor
  video. The guest keeps running without video. Reconnection restarts the keyboard
  controller; disabling experiments restores both connections. Power/reset retains
  these physical settings. Ordinary inspection controls remain purely visual.
- `loading-profile.json` records the measured loader experiment and why it was
  rejected. CI estimates now use the last successful Chromium run; fail-fast and
  cancellation on newer commits remain enabled. Test coverage is unchanged.

Primary references: [W/M documentation archive](https://xepb.org/robotron/docs/1715w.zip),
[Zilog Z80 peripherals manual](https://www.zilog.com/docs/z80/um0081.pdf),
[MAME Lua memory interface](https://docs.mamedev.org/luascript/ref-mem.html).


## 0.10.0 qualification pass

This section supersedes the 0.9.0 serial/timing limitations above where stated.

- Collection backup preserves saved disks, originals, states and drive assignments.
  Every byte record and the enclosing manifest is checked. Exact duplicate records
  are skipped; conflicting keys abort the entire import without partial writes.
  Save current state first: transient unsaved state and custom firmware are excluded.
- Circuit selection highlights individual packages and related components. Opt-in
  sampled CPU/DMA/serial/FDC activity is explicitly separate from physical LEDs.
- The owner-photo review generator now provides overlay opacity, alignment controls,
  paired landmarks and exportable image-space residuals with viewport dimensions.
  It uses repeatable existing cameras, not calibrated photogrammetry. All three
  rendered regressions passed. The drive-front structural baseline was stale at v47;
  it now records the already-published v48 head geometry. No new CAD dimensions were
  inferred from these residuals. Recheck the adapter's 10.86-pixel right-landmark
  residual against camera/lens alignment before changing physical geometry.
- Independent incoming serial baud, width, parity and 1/1.5/2 stop bits; parity and
  framing status, three-byte FIFO replacement on overrun, CTS/DCD status latching
  and vectored interrupts. Outgoing bytes are captured after guest TX timing;
  they are not decoded by a separate peer UART. Break, synchronous modes,
  first-character special-error locking and TX x1 half-clock edges remain limited.
- Original MIT DACRX.COM is qualified inside TOS/M using a copied boot disk:
  checksum retry, duplicate-block handling, EOT acknowledgement after close and
  byte equality of the guest-created file. The browser has XMODEM progress/cancel,
  raw text/file input, and hex/ASCII capture. CP/M file lengths have 128-byte
  precision; cancellation can leave a partial file. See transfer-qualification.json.
- DMA masked search, transfer/search, stop-on-match and match vectors; timing-reset
  commands and reset recovery; WAIT holds completion and active CPU bus strobes
  finish before handover. Native bounded tests cover these. Half-clock arbitration,
  auto-repeat, pulse output and every byte/burst distinction are not certified.
- The expanded MAME probe passes bank aliasing, two ordered CTC handlers, attribute
  RAM, FDC invalid commands and SIO reset status as well as the previous checks.
  First-difference output is included. Serial line errors are native diagnostics,
  not independently driven through MAME in this harness.
- Derived browser geometry caches preserve position/normal/index arrays exactly,
  verified during generation. They are gzip-compressed .dacgeom files, keyed by
  canonical STL hash and crease angle, with checked checksums and STL fallback.
  Materials, triangles, photographs and interior visibility remain unchanged.
  Regenerate with node scripts/build-geometry-cache.mjs; canonical sync does this
  automatically. These caches do not change printed-and-verified classifications.
- Snapshot 10 and recording peer/cancel events use the new core; 0.9.0 is archived.
  Normal CI keeps fail-fast/cancel-on-new-commit; no Verilog, MAME installation or
  historical guest-transfer qualification was added to routine CI.
