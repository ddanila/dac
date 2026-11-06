# Learn and explore

Open **Learn and explore**, or use `#learn`. The five entries connect everyday use,
coached troubleshooting, recorded explanations, the physical exhibit, and the
existing analyzer. Visitor, Learner and Engineer views reveal increasing detail.

## A day at the workstation

The practice uses a separate worker with the pinned S550/CAS287/S600 firmware,
a private writable TOS/M disk A and blank disk B. Start, then Resume to boot, or
Demonstrate the boot. Enter commands in the input box; Send text transmits the
characters, Enter sends a carriage return. Newlines in a paste become Enter.
Input operates the real S600 matrix through emulated key taps. The machine
continues running after input. Pause stops practice; closing the learning window
pauses it without discarding it. Cancel releases the worker and unsaved practice.

Write a short plain-ASCII letter in `WS LETTER.TXT`. The onscreen Ctrl+K,D button
sends WordStar's save command. Reopen the document, exit WordStar, copy with
`PIP B:LETTER.TXT=A:LETTER.TXT`, then print with `PIP LST:=LETTER.TXT`.
The lesson checks actual OS/editor screens, a saved nonempty document, a matching
line in the reopened document, all source/destination file bytes, and the full
printer text up to CP/M EOF. WordStar's high-bit text markers are normalized for
text checks; raw exported document/printer bytes are preserved. Copy verification
compares complete file bytes including CP/M record padding.

Demonstrations branch from the start-of-step checkpoint. Return to my work
preserves the original state; Adopt demonstration explicitly replaces practice
with the demonstrated branch. Retry restores that step's checkpoint. A command
button never marks a step complete by itself. Save practice locally creates an
ordinary checksummed named checkpoint with both disks and an activity-progress
sidecar; Restore saved practice requires the same runtime/firmware. Named
checkpoints and collection backups can export or remove these saves. Browser
storage errors leave the current machine available.

The paper view is the existing generic receiver, not a specific printer model.
Look inside opens a separately labeled reference journey, not a recording of
arbitrary WordStar execution. Historical media retain their original notices;
no new historical programs are bundled.

## Repair bench

Five symptoms cover absent boot media, write protection, held A contact,
suppressed receiver strobe, and a changed glyph dot. Predict a cause, inspect
captured code/registers/signals or the working baseline, and request progressive
hints. Reveal is always available; there is no score or timer.

A proposed repair reruns from the same deterministic pre-fault state, applying
the case with the proposed fault removed only when that repair is applicable.
The checkpoint hash identifies that state. The original failed observation stays
available. Success requires matching retained baseline observations and, for
boot/copy, the expected prompt or verified destination file. The strobe case is
a digital receiver-handoff intervention, not an analog cable model.

Export notebook preserves the visitor's prediction, notes and observations.
Annotations are not independent evidence. Captures opened in the journey viewer
are read-only; they cannot mutate the original exhibit or practice machine.

## Explanations and physical mapping

Four curated chains cover key-to-character, glyph-to-dots, disk copying and
interrupt service. Each node selects an actual event in the current capture.
Observed nodes, model-derived dots and contextual relationships are distinguished.
Chronological milestones do not establish arbitrary program data flow. Missing
nodes remain unavailable; detailed replay still requires endpoint verification.
The explanation sidecar binds the event words with a SHA-256 and retains identity
metadata. It does not alter the existing journey capture or saved-state formats.

The physical panel selects components associated with retained observations.
Its schematic-style paths are logical relationships, not reconstructed copper.
Part buttons select the nearest related retained event. Follow mode highlights
the associated assembly without advancing execution; Inspect component opens the
existing photographs/drawing evidence. The textual view works without WebGL.
Memory offsets do not identify individual RAM packages, and no analog pin voltage
is inferred. Specimen ROM identity, hidden wiring and display-board revision
remain separately qualified or unknown.

## Comparison desk

Open `analyzer.html#comparison`. The walkthrough uses the existing directed
controller/CRC decoder fixtures; they are not hardware captures or historical
boots. Existing co-simulation, raw-signal, USB and investigation tools remain
available in the analyzer.

Both capture inputs now accept `DAC-journeys-1` JSON (128 MiB limit). The adapter
retains I/O, IACK and memory observations and their original journey indices;
instruction-boundary events are not converted into opcode fetches. Unknown WAIT,
flags and interval durations remain unavailable. Original downloads preserve
original JSON, and no imported program is executed.

Choose matching machine profiles and experiment identifiers before comparing
selected event ranges. Journey inputs identify Robotron 1715M automatically;
classic 1715/Pico1715 is a different profile. User-entered provenance is labeled
as a declaration. Journey-to-journey firmware identities must match. Cross-format
comparison requires confirmation of the 1715M profile in the desk.

Alignment uses the first comparable event in each selected range. Reports show
the original input hashes, selected ranges, clock-origin offset, tolerance,
identity declarations and first difference; no time stretching or automatic
resynchronization occurs. Durations/WAIT/flags are compared only when observed
on both sides. Unequal tails remain mismatches. Raw P1715LA files support sampled
edge inspection, cursor timing, and explicit selected-sample alignment with an
exported offset; they do not support semantic interval comparison. Hardware
bus traces do not supply CPU register snapshots. Capture gaps and filtering limit
what a match proves. Reimported bundles retain original reports separately from
fresh comparisons.
