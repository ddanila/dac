# Pico1715 analyzer workbench

Open `analyzer.html` from the museum link. The analyzer is a separate entry point:
it does not instantiate a machine or load the museum's 3D scene. Files, ROMs and
USB data remain on the computer; captures are not uploaded or automatically stored.

## Investigating a failure

1. Open **Controller sequence** as the capture, then choose **CRC failure** and
   **Use as reference**. Both files are fully validated before use.
2. Compare I/O sequences and go to the first divergence. Both panes select the
   corresponding record. The selection contains decoded controller annotations.
3. Search for `CRC BAD` in the diagnostic field to find the failed field check.
   Use cursors to measure elapsed samples, time and accumulated WAIT.
4. Export the original file, annotated JSONL, CSV or analysis report. Reports carry
   source hashes, application revision, capture metadata and comparison settings.

The controller example is a directed decoder vector, not an OS boot. **RTL program
capture** comes from the existing native compact RTL/motherboard co-simulation and
an original small Z80 program. The manifest includes source hashes and provenance;
no historical ROM or private capture payload is bundled.

Compact v1 and triggered v2 captures retain the existing `P1715CY` binary format.
The viewer shows sample-timed operation intervals, with narrow intervals marked at
at least two pixels. Their exact durations remain in the table/selection. It never
reconstructs individual control/WAIT edges. Masks, gaps, saturation, partial cycles,
loss and trigger omissions remain explicit. Controller state starts unknown and
is invalidated using the existing Python decoder's rules. Comparison uses the low
eight I/O address bits, data/flags, IACK/reset/invalid events, and optional elapsed,
duration and WAIT tolerances. Memory and refresh are excluded. Unequal tails fail;
there is no silent resynchronization. Both complete inputs are validated first.

Raw v1 `P1715LA` files instead display the actual named sampled signals. Use the
window selector and edge search to zoom/navigate. Amber bins contain transitions;
even a short pulse is retained in the aggregate display. The table gives exact
sample values. Raw CSV and VCD exports match the existing Python exporter. Raw
files are viewable, but semantic comparison and direct USB acquisition are compact
only in this release.

Optional ROM lookup is static. Load a local ROM of up to 64 KiB and specify its
mapped base. Opcode-fetch search follows observed records; the disassembler does
not reconstruct CPU registers or prove that the ROM overlay was active. No ROM is
saved or transferred to a server.

## Device acquisition

Web Serial and a browser device lock are required for direct CDC access over HTTPS
or localhost. Other browsers retain all file features: use Pico1715's
`tools/analyzer_usb.py` to download a capture and import it. Connect explicitly
selects a port, opens at 115200 baud without hardware flow control, enables DTR and
verifies protocol status. It does not arm or reset. One workbench tab owns the
connection at a time; do not use another external client on that port concurrently.

Configure the next trigger and arm, exercise the machine, then stop/drain and
download. The existing firmware retains I/O, IACK and observed reset events only.
USB framing, commands 1–9, CRCs, generation IDs and reset tokens are unchanged.
Commands serialize, have a five-second response deadline, and never automatically
repeat ARM/RESET after an ambiguous timeout. Reconnect and inspect status instead.
Stop polls for up to 15 seconds; “still draining” does not discard device memory.
Downloads use at most 1024 bytes per command and are published only after full-file
validation, including agreement with the device's record count. Cancelled or broken
downloads leave the completed device capture available for a fresh download.

Reset and Arm + Reset are enabled only when firmware advertises the optional
accessory. The combined carrier normally has no such accessory. Observed connector
/RESET2 does not establish CPU /RESET1; physical reset qualification is separate.
Arming over a completed capture that has not been downloaded requires explicit
acknowledgement because it discards that device capture.

## Limits and maintenance

Two input files of up to 128 MiB each are supported. A worker hashes and validates
bounded chunks, then retains sparse checkpoints every 4096 records. There is no
per-record object cache; pages render at most 100 rows. Search, comparison,
waveform aggregation and import can be cancelled. Replaced captures cannot receive
stale worker results. Text exports are bounded at 128 MiB; select a cursor range
for larger traces. Original binary downloads preserve the entire source file.

Build fixtures in Pico1715 using `tools/build_analyzer_workbench.py`, then run:

```
node scripts/sync-analyzer.mjs ../Pico1715/build/analyzer-workbench
npm run test:analyzer
npm run test:analyzer:scale
npm test -- tests/analyzer.spec.js --workers=1
npm run test:cross -- tests/analyzer.spec.js
npm run build
```

Synchronization verifies every manifest hash and rejects dirty source builds by
default. The test-only USB WASM seam compiles the actual C handler/receiver; it is
not loaded by ordinary users. Development-only transport injection is removed
from production bundles. Native Python/RTL tests in Pico1715 remain independent.

Qualification includes Python decoder/export parity, 420 Python validation cases,
trigger-window and reset-token tests against the C handler, transport corruption,
disconnect and timeout tests, and browser workflows on Chromium/Firefox/WebKit.
The generated 7,252,874-record scale trace is 116,046,016 bytes. Local indexing and
end-of-file navigation passed with 1,771 checkpoints and approximately 1.2 MiB
additional JavaScript heap; timing and memory measurements depend on the runtime.

These results qualify the software workflow. They do not qualify real USB
throughput, electrical timing, signal integrity, SD durability, or reset hardware.
