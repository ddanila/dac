# Diagnostic reports, sound and model review

This update retains emulator 0.15.0, snapshot layout 13 and canonical geometry
v48. Source metadata changes do not confer printed-and-verified status.

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
through the drive gain. Original owner WAV files are unchanged; an 80 ms
in-memory tail/head blend joins the fan loop at adjacent source samples. This is
playback smoothing, not new acoustic fidelity or a replacement fan recording.

## Relationships and measurements

**Find a component → Highlight related mechanical parts** outlines named related
parts in blue and links the owner reference photo. Canonical `relationships.json`
is the source. These are mounting and cable-route groups, not verified circuit
nets. The selected part remains yellow. Clear selection or reset the view to
remove all outlines.

New measurement records include a geometry fingerprint as well as model identity
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
Inspection now unplugs the rear leads and carries them with the monitor. Keeping
the original socket positions at full opening would require stretching: their
separation exceeds the modelled cable lengths. A smooth rear-slack adjustment
parks the plugs 18 units back while preserving each centreline's length within
0.01 unit. This is an estimated disassembly sequence, not a measured slack model.

Run `node scripts/audit-monitor-cables.mjs` to refresh the 164-pose report
(41 positions × 2 cables × seated/parked plug shapes). Each cubic has 64 sampling
intervals. Entire segments clear the radius-expanded lid, fixed chassis panel
and PSU envelopes. Endpoint error stays below 1e-8; minimum bend radius exceeds
twice the nominal cable radius; adjacent turns remain below 30 degrees.
These are geometry checks, not manufacturer limits. Tube cross sections rotate
rigidly and closing restores the exact original mesh. Full monitor-shell,
cable-to-cable and continuous-motion collisions, hidden routing and strain remain
unverified. The separately opened upper monitor shell does not move captive ends.

## Keyboard and checks

The optional emulator target `make test-s600-workload S600_ROM=/path/to/S600.bin`
compares full snapshots and bus traces at 18 matrix boundaries with DMA,
printer and V24 running. Its extended 23,809,600-clock bound includes booting the keyboard,
not an OS. It also runs the existing standalone historical-ROM held-key/release
qualification. Ordinary CI still uses original diagnostic ROMs only. See
`dac-emulation/docs/s600-mixed-qualification.md` for the reference ROM hash and
precise scope.

Focused browser checks cover report exclusion/opt-in behavior and checkpoint
importability, audio routing and seam continuity, relationships, explicit remap
provenance, and cable rest/endpoint/bend checks. Full cross-browser checks run
once at the release boundary; superseded workflow cancellation remains enabled.

## Review tools and bounded qualification follow-up

The diagnostic panel now opens two checksummed reports locally. It displays
build/model/firmware identities, hardware fields, disk identities and both event
captures. A bounded sequence alignment matches bus master, operation and mapped
address, exposing inserted/deleted operations without shifting every later event.
Values and controller context remain compared; clock-origin offset and relative
timing drift are reported separately. The first 16 content differences are shown.
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
physical measurement. Originals remain unchanged. Preview geometry is reused
until point placement changes and is disposed when cleared or switching machines.

Sound controls now retain mute settings separately from the original levels;
solo is temporary. Restore defaults clears both. Fan, keyboard and switch previews
play at most 1.5 seconds of the owner's recordings, require enabled audio and do
not operate the machine. The synthesized drive sounds have no recorded preview.
Audio context state and resume failures are shown alongside a Resume audio button.

The cable audit checks **entire line segments**, constant length and endpoint
positions. Neither its sampled polyline nor its 41 poses certifies continuous
geometry/motion. The animation reuses section bindings and output buffers.

CI placement estimates were refreshed from successful run **38916266552**.
Serial, portable-state and electrical-control tests omit CAD loading while retaining
the real emulator and 2D screen. Full CAD checks still cover geometry, mechanisms,
picking, graphics recovery and visual controls. New review-tool checks use small
fixtures; no automatic historical-ROM or HDL jobs were added.

The optional S600 workload adds Shift/Ctrl overlap, a snapshot with the keyboard
receiver actively partway through a byte, held-A/REP repetition and clean stop,
and reset while A is held followed by a fresh press. Production runtime reset
clears matrix state; this qualifies that behavior, not physical reset wiring.
Complete snapshots and bus hashes agree between batched and single-clock runs.
The upper bound is **23,809,600 clocks per session** (including a bounded search
for the mid-byte snapshot); no OS boots. The actual specimen EPROM is still
unidentified. Ordinary native runtime tests and the existing standalone S600
fixture remain separate checks.
