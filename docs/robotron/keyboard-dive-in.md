# Keyboard dive-in

Open **Keyboard dive-in · key to screen** under **Diagnose hardware**, or use the
keypress link in the keyboard electronics/controller inspection. **Explore a
keypress** boots a separate, read-only S550/CAS287/S600/TOS/M reference session,
waits for startup commands to finish, and records a physical matrix contact.
Your current machine and disks remain untouched.

The default A-key journey follows column 7, bit 5. S600 transmits a modifier
prefix and the key-code byte (`E0 61` without modifiers); the mainboard reads
SIO A, the console software writes `61` to video memory, and scanout displays
`a`. Shift, Ctrl, Caps, SI/SO, ET and repeat examples have different outcomes.
A control or mode contact need not print a character. The repeat example holds A, then presses REP (column 8, bit 6); holding A alone does not imply automatic repeat. Releasing REP stops repetition before A is released. Repeat uses event snapshots
rather than every instruction boundary to retain the longer hold without
exhausting the capture buffer; this is identified in capture provenance.

## Reading the workbench

The journey buttons, event list, history slider, ROM listing and waveform all
share a history cursor. Moving it does not rewind or modify the machine. The
before/after screens show the **capture endpoints**, not a reconstructed screen
at every instruction. A display event identifies the changed row, column and
character code separately.

Choose **Keyboard Z80** or **Mainboard Z80**. Registers are snapshots at the
selected event. An instruction-boundary snapshot precedes execution of that
instruction; hardware events may occur within an instruction. The instruction
effects line compares consecutive boundaries. Changed register highlighting
compares your last selected snapshot. Click a register for its architectural role
and, when verified, its use by S600 at that address. Flags are expanded below.

The keyboard's 2 KB ROM is mirrored: logical address `41C1` reads ROM offset
`01C1`. The highlighted ROM location and logical execution address are both
shown. **Browse** reads the ROM without changing execution. Tables are displayed
as data. The loaded ROM's SHA-256 gates S600 annotations; a custom ROM still has
raw inspection but receives no S600-specific meanings.

S600 keeps working state in both register banks. In its transmission loops,
A supplies the shifting data and E counts eight bits. SP is used as the ROM table
base `4460` or `4560`, not as a conventional RAM stack. The register description
is scoped to relevant instruction ranges. Mainboard annotations additionally
require the reference disk, firmware identity, bank and captured instruction
bytes; unrelated software receives raw execution inspection.

## Signals and evidence

The keyboard has separate data and strobe paths. The signal plot shows normalized
held strobe-sampled D0, actual inverted board-side TA_DATEN, write-derived TA_TAKT, and receiver
sampling events. A1's 7406 gates and the separate L1 windings connect these paths
to the cable. **Inspect the physical controller** follows the selected stage into
the existing component/net review and model highlights.

Signal edges originate in the digital backend, not animation or frame sampling.
Times use the 3.9936 MHz machine scheduler; the nominal keyboard clock is 683 kHz.
Half-edge ordering is retained as event order, but events within one scheduler
tick can share a timestamp. This does not establish physical propagation delays,
analog edge shape, or exact specimen timing. Zoom into dense waveforms; the
whole-capture view necessarily combines transitions within screen pixels.

Decoded bytes come from the actual SIO receiver. Sample records identify the
receiver phase and bit; error masks retain parity, overrun and framing status.
Cursors measure intervals in the retained digital trace. The expandable
**Recorded reference waveform** is a separate analog bus-voltage investigation
with thresholds and provenance. It is not the voltage waveform of the live key
journey, and is not time-aligned to that journey.

## Live work and portable captures

**Inspect live machine** requires a powered Robotron with keyboard firmware.
Open **Live debugging and capture controls** to capture, pause, step either CPU,
run the keyboard to an address, or operate a matrix contact. Both CPUs and the
peripherals continue under the normal scheduler during stepping. Run-to is
bounded; an unreachable address reports its limit.

Triggers select contact changes, instruction addresses, matrix reads, transmission,
received bytes, mainboard input or video writes. Addresses are hexadecimal;
blank means any address. A contact address is `column * 8 + bit`. Received-byte
trigger addresses are the receiver error mask, while instruction triggers use
logical execution addresses. Up to 128 preceding events can be retained. Pause
on trigger stops after the machine tick containing the matching event.

Capture holds at most 262,144 records. A full buffer stops recording and displays
**BUFFER FULL — capture truncated**. The machine may continue running. Reading
an active capture takes a stable copy for paging; a refresh obtains a new copy.
Captured data includes the two CPU states and instruction bytes, shared clock,
keyboard clock, matrix/serial/video events, receiver configuration and ROM identity.
Export downloads `DAC-keyboard-dive-1` JSON. Import validates shape, bounds,
ordering and ROM checksum before replacing the displayed history, and never
executes code or restores machine state. Imported captures do not include screen
images. Repeated prefixes beyond the retained four-byte instruction window are
identified rather than given an invented disassembly.

## Implementation and verification

The emulator owns observation hooks and the native/WASM API; the museum owns the
worker protocol, capture presentation and hash-bound semantic annotations. Host
observers, capture buffers and callbacks are excluded from machine save states.
Older preserved cores remain loadable and report inspection as unavailable.

`make test-keyboard-dive` in dac-emulation checks state neutrality, ordering,
ROM mirrors, stepping, restore, bounded buffers and trigger stops.
`make test-keyboard-dive-wasm` compares complete native and WASM records for the
same input. The museum's `tests/keyboard-dive.spec.js` covers the reference
contact-to-screen journey, waveform navigation and responsive presentation.

The [controller simulation guide](keyboard-controller-simulation.md) and
[qualification audit](keyboard-controller-verification.md) retain electrical and
specimen limitations. A successful interactive trace does not promote those
separate claims.

For a runtime/UI-only release, keep the CAD and electrical inputs pinned, commit
and package the emulator, then refresh the functional release record with:

```sh
python3 scripts/keyboard-controller-release.py --runtime-update \
  --browser-report /path/to/passing-playwright.json \
  --firmware-report ../dac-emulation/build/keyboard-dive-wire-firmware/assessment.json
python3 scripts/keyboard-controller-release.py --check
```

The updater requires a clean emulator checkout matching the packaged runtime,
a passing browser report and a fresh production C/HDL comparison whose source
hashes match. It preserves the existing CAD/DRC and electrical evidence.
