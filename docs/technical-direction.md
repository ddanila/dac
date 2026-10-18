# Technical direction

DAC uses native C cores from `dac-emulation`, pinned WebAssembly builds executed
in a worker, and a Three.js museum viewer. Editable model masters and evidence
live in `3d-models`. See the [root guide](../README.md) for operation and the
[capability matrix](robotron/capabilities.md) for current fidelity limits.

## Exhibit boundary

Each exhibit describes physical components, camera views, interactive controls,
display surfaces, historical notes and emulator requirements. A machine adapter
connects power/reset, key contacts, media and cleanup to the core, and returns
video and available device state to the viewer.

Keep cold boot distinct from pause/resume, release held keys on focus loss, and
keep execution independent of camera movement and asset loading. Drive activity
from core events when available; label visual motion and estimated behavior.
Inspection controls do not change machine state unless explicitly presented as
hardware controls or electrical experiments.

## Sources and reproducibility

Commit versioned runtime artifacts with source/toolchain identities and hashes.
Preserve compatible older runtimes before updating the core; see
[maintenance](../MODEL-HISTORY.md). Keep canonical CAD separate from derived
browser geometry and caches. Optimizations must preserve the detailed inspection
experience, source provenance and stale-export checks.

The Robotron media manifest records reference firmware, disk identity and conversion
provenance. Reference S550/S600/TOS-M behavior does not identify the museum's ROMs
or exact hardware revision. Owner photographs and comparison specimens remain
separate evidence. Imported media, models and photographs retain their own notices;
DAC's MIT licence does not relicense them.

## Qualification

Use reproducible native/browser comparisons and independent implementations for
observable behavior, retaining input identities and first differences. MAME and
FPGA references provide comparison evidence, not an automatic accuracy ranking.
The [qualification guide](robotron/emulation-qualification.md) records reproduction
entry points and boundaries. Actual specimen calibration is a separate claim.

For the keyboard controller, native KiCad owns electrical connectivity and migrated
PCB geometry; OpenSCAD owns surrounding mechanics; generated HDL and electrical
simulation test behavior. Follow the [controller plan](robotron/keyboard-controller-plan.md)
for ownership, evidence promotion and acceptance. Exhaust existing photos and
published device constraints before classifying a gap as a hardware dependency.

Session disk writes are opt-in and affect copies. Browser storage is not an
independent backup: provide export, validate identity/integrity before restore,
and preserve the running session if validation fails.

## Documentation ownership

Keep guides focused on use, design decisions, evidence limits and acceptance.
Plans own scope and next steps; audits link remaining claims to their evidence.
Inventories, constants, source hashes and numerical results belong in code or
machine-readable manifests/reports. Link to their owner instead of copying them.
Use git for implementation history; avoid pass counts, completion percentages
and chronological progress entries in maintained guides.
