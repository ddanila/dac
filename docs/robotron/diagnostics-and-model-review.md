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

`monitor-cable-paths.json` duplicates the canonical SCAD control points under a
consistency check. DAC binds vertices to centerline sections and rotates their
cross sections rigidly instead of stretching them by height. A smooth open pose
avoids a tight bend found in the first centerline deformation. Returning to rest
restores the exact original vertex array.

Run `node scripts/audit-monitor-cables.mjs` to refresh the 164-pose report in
`monitor-cable-audit.json` (41 positions × 2 cables × connected/parked plugs).
The opening route travels behind the raised lid before descending to the plugs.
Each cubic uses 48 intervals; sampled centers stay outside the lid bounding box
expanded by the nominal cable radius. This is an illustrative inspection route,
not a measured cable slack simulation.
All sampled endpoint errors are below 1e-8 mm, minimum centerline bend radii exceed
twice the nominal cable radius, and adjacent sampled directions differ by less
than 30 degrees. These thresholds are geometry checks, not manufacturer bend
specifications. The upper monitor cover leaves the captive ends fixed to the
lower assembly. Full shell collision, physical slack, strain and hidden routing
remain unverified.

## Keyboard and checks

The optional emulator target `make test-s600-workload S600_ROM=/path/to/S600.bin`
compares full snapshots and bus traces at 18 matrix boundaries with DMA,
printer and V24 running. Its 8.2-million-clock bound includes booting the keyboard,
not an OS. It also runs the existing standalone historical-ROM held-key/release
qualification. Ordinary CI still uses original diagnostic ROMs only. See
`dac-emulation/docs/s600-mixed-qualification.md` for the reference ROM hash and
precise scope.

Focused browser checks cover report exclusion/opt-in behavior and checkpoint
importability, audio routing and seam continuity, relationships, explicit remap
provenance, and cable rest/endpoint/bend checks. Full cross-browser checks run
once at the release boundary; superseded workflow cancellation remains enabled.
