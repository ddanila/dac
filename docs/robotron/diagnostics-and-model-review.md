# Diagnostic reports, sound and model review

## Diagnostic export

Under **Diagnose hardware → Download diagnostic report**, download a checksummed
JSON envelope containing the DAC commit, emulator SHA-256, model identity,
firmware identity, current hardware settings, current inspection view/selection/
measurement and up to 512 already captured bus events. Capture events in the
existing timeline first; export does not silently start capturing or pause the
machine. Mutable state is copied at one worker boundary before asynchronous
hashing, including optional snapshots/disks.

Memory and disk contents are excluded by default. Bus events themselves may
contain program bytes. Two explicit controls add a production-format checkpoint
(machine memory and both disks) and/or separate base64 disk contents. No upload
occurs. Use **Extract checkpoint from a report**, then import the resulting
`.daccheckpoint` under Named checkpoints. Existing firmware/core compatibility
checks still apply. Reports and attached checkpoints retain their own checksums.

## Sound

**Sound levels** offers independent fan, keyboard, power-switch and drive sliders,
saved locally. The existing sound checkbox still enables/disables all playback.
Gain changes are smoothed. Both synthesized drive motors and STEP clicks pass
through the drive gain. Loop smoothing is a playback effect; original owner recordings remain unchanged.

Sound controls retain mute settings separately from the original levels;
solo is temporary. Restore defaults clears both. Fan, keyboard and switch previews
play at most 1.5 seconds of the owner's recordings, require enabled audio and do
not operate the machine. The synthesized drive sounds have no recorded preview.
Audio context state and resume failures are shown alongside a Resume audio button.

## Relationships and measurements

**Find a component → Highlight related mechanical parts** outlines named related
parts in blue and links the owner reference photo. Canonical `relationships.json`
is the source. These are mounting and cable-route groups, not verified circuit
nets. The selected part remains yellow. Clear selection or reset the view to
remove all outlines.

Measurement records include a geometry fingerprint as well as model identity
and stable named component ancestry. On a mismatched restore, the remapping panel
reports surviving, changed, missing or ambiguous parts. Choose both replacement
parts explicitly, then preview their nearest-surface projections and local point
displacements. **Save remapped copy** adds a separately named record, preserving
the original and recording its identity, points and distance as provenance.
A nearest surface may represent a different physical feature: inspect it before
using the measurement. Old records without fingerprints are labelled accordingly.
No automatic cross-version remapping or overwrite occurs.

## Cable qualification

`monitor-cable-paths.json` retains the canonical closed CAD control points.
Inspection unplugs the rear leads and carries them with the monitor. Keeping
the original socket positions at full opening would require stretching: their
separation exceeds the modelled cable lengths. A rear-slack adjustment parks the plugs while preserving modeled centreline
length. This is an estimated disassembly sequence, not a measured slack model.

Run `node scripts/audit-monitor-cables.mjs` to refresh sampled segment, endpoint
and bend checks. The report records coverage and thresholds; these are geometry
checks, not manufacturer limits. Full monitor-shell, cable-to-cable and continuous
motion collisions, hidden routing and strain remain unverified. Closing restores
the original mesh; the separately opened upper shell does not move captive ends.

## Comparing diagnostic reports

The diagnostic panel opens two checksummed reports locally. It displays
build/model/firmware identities, hardware fields, disk identities and both event
captures. A bounded sequence alignment matches bus master, operation and mapped
address, exposing inserted/deleted operations without shifting every later event.
Values and controller context remain compared; clock-origin offset and relative
timing drift are reported separately. The preview is bounded.
Repeated operations can align ambiguously; this is not proof of equivalent guest
execution. Attachments are not rendered, restored or uploaded. Malformed timeline
lengths and oversized metadata are rejected; clearing a report releases it.

Remap previews show orange original endpoints, blue projected endpoints and white
displacement arrows. Original placement comes from the saved displayed/assembled
matrix; older records lacking matrices use the replacement placement explicitly.
The proposed points follow the displayed assembly. Inspection pose changes can
therefore contribute to the visible displacement. Projections over **2 local model
units**, or missing/ambiguous original part matches, require a review checkbox
before saving. That threshold is a review aid, not a fit tolerance or a new
physical measurement. Originals remain unchanged.

## Keyboard workload

The optional core target `make test-s600-workload S600_ROM=/path/to/S600.bin`
compares snapshots and bus traces with keyboard, DMA, printer and V.24 active,
including modifiers, repeat, mid-byte continuation and runtime reset. It boots
the reference keyboard firmware, not an OS, and does not qualify physical reset
wiring or the specimen's replacement ROM. See the
[core workload guide](https://github.com/ddanila/dac-emulation/blob/main/docs/s600-mixed-qualification.md)
for reproducible scope and evidence.
