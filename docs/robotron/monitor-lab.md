# Monitor lab

The [monitor lab](../../monitor.html) replays locally computed electrical and CRT
experiments without changing the running museum computer or its disks. It offers
phosphor playback, a beam side projection, electrical probes, circuit inventory,
provenance and a comparison recording on the same simulation-time axis.

**The historical monitor simulation is not complete.** Included recordings use
an explicitly experimental driven flyback circuit. They do not emulate the full
K7222 or identify the circuitry in Danila's monitor. Normal museum display still
uses the existing emulator framebuffer and curved glass.

The native KiCad schematic, ngspice runner, optical calculations, input-capture
runner and tests live in
[dac-emulation/verification/robotron-monitor](https://github.com/ddanila/dac-emulation/tree/main/verification/robotron-monitor).
That guide documents local circuit editing, unsupported primitives, recording
format and remaining historical reconstruction work. Local `.mcrt` imports stay
in the browser; they cannot run circuit simulations or execute embedded code.

## Reference findings

The archived K7222.13/23 technical description identifies the horizontal output,
flyback recovery and high-voltage generation, but does not supply a complete
electrical parts list. The ten-page schematic collection mixes .13 sheets with a
different MON 3 design. Further research located the **K7222.11/.21 schematics
with board parts lists**, and its matching operating manual with service
waveforms. This earlier revision is a stronger documented reference candidate.
The [reference index](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-monitor/reference-evidence.md)
records exact pages and remaining gaps. Exact source hashes are retained in the
core's `sources.json`; values must not be transferred between revisions without
evidence. The located ÜHA78 repair report describes a replacement winding,
not factory transformer specifications.

The first recordings exercise the infrastructure: baseline, removed vertical
drive and changed focus divider. Their screen differences arise from their
electrical results and optical parameters. None establishes historical raster
geometry, real warm-up time, sync-lock behavior or flyback-transformer accuracy.

## Validation

Core tests cover KiCad-exported connectivity, EHT loading, vertical-current
collapse, timestep refinement, deflection polarity/energy dependence, focus,
phosphor energy/decay, capture validation and incomplete solver output. Browser
tests cover playback/probes, local import and comparison, corrupt/malformed
recordings and narrow layouts. Retained replay metadata identifies generating
code and circuit hashes. Check the core guide for the remaining qualification
gates before expanding fidelity claims.
