# Monitor lab

The [monitor lab](../../monitor.html) replays locally computed electrical and CRT
experiments without changing the running museum computer or its disks. It offers
phosphor playback, a beam side projection, electrical probes, circuit inventory,
provenance and a comparison recording on the same simulation-time axis.

**The historical monitor simulation is not complete.** Included recordings use
an explicitly experimental driven flyback circuit and bounded neck-board and computer-to-monitor signal benches. They do not emulate the full
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

The added K7222.11/.21 neck-board recording follows the original 012-6891
six-diode/video/intensity circuit. Generic device parameters have explicit
exploratory bounds; external bench supplies and a constant test load stand in
for the missing boards and tube. The reference drawing identifies a B31G22 tube
and AE9VT 6802.01 yoke, without identifying the museum specimen.

Version 2 recordings support named probes, source designators, parameter ranges
and absolute-time recording windows. Electrical-only stages show no phosphor or
beam image. Comparisons match model/source identity and unit; fixture recordings in version
1 remain supported. The native field-trajectory prototype is tested separately
and is not yet connected to museum playback. Full SP2/SP3 circuitry, shared-core
magnetics, thermal lifecycle, physical connector calibration and historical
qualification remain unfinished.

## Fault atlas

The [fault atlas](../../fault-atlas.html) is a development view of the bounded
012-6891 neck bench. It filters cases by stage, mechanism, electrical symptom
and numerical status. Accepted cases show nominal/fault waveforms, sampled
feature ranges, overlapping signatures and independent held-out parameter checks.
Source designators, probe reference points and clickable net connectivity retain
the link to the original circuit. The connectivity table is not a PCB layout.
Simulation-only current is explicitly separated from source probe locations;
physical access and instrument capability have not been qualified.

The native generator injects one fault at a time without editing the source sheet.
It explores healthy parameter combinations separately, and requires complete
ensembles, timestep refinement and open/short regularization checks before
publishing predictions. Failed, indeterminate and unsupported cases remain visible
without waveforms. The browser verifies package checksums, bounds file sizes,
never executes imported code, and exports JSON case reports or waveform SVGs.
Checksums detect corruption, not authenticity. `public/monitor/atlas/manifest.json`
records all distributed files; each case retains model hashes and conditions.

**No hardware validation.** Interval overlap is not a diagnostic probability,
and held-out combinations of the same model are not real-monitor validation.
The current windows describe settled levels rather than switching transients.
The external neck supply has finite assumed impedance but does not replace the
missing converter. Full power/horizontal/flyback coverage remains the unmet first
release gate; the package explicitly records this. No guided diagnostic ranking,
screen-symptom prediction or live probing procedure is supplied.

The retained development package was generated with native commit `126bcf0b`
using `atlas.py --members 16 --held-out 8` and seed `722211`. It contains 12
accepted fault predictions plus the nominal model, two numerically indeterminate
faults, and five unsupported faults. Each accepted case completed 25 parameter
runs (nominal, 16 training, 8 held-out) plus refinement checks. The two withheld
cases are the pull-up open and transistor collector-emitter short. Full native
artifacts are retained locally under `build/monitor/atlas-release-preview` in
the emulation checkout; the museum distributes only the verified public package.

## Validation

Core tests cover KiCad-exported connectivity, EHT loading, vertical-current
collapse, timestep refinement, deflection polarity/energy dependence, focus,
phosphor energy/decay, capture validation and incomplete solver output. Browser
tests cover playback/probes, local import and comparison, corrupt/malformed
recordings and narrow layouts. Retained replay metadata identifies generating
code and circuit hashes. Check the core guide for the remaining qualification
gates before expanding fidelity claims.

## Computer-to-monitor waveform bench

Select **Robotron video signal path** to inspect a synthetic highlight stimulus
through the 1715W output gates, cable and K7222.11 receiver. Choose VIDEO, BSYN
or INTENS under Signal path to overlay computer connector, monitor connector
and receiver output; source references identify the nodes and their returns.
Single probes include the sync filter and neck cathode. Local comparisons use
the same time and voltage axes. This electrical bench has no screen animation.

The bundled 60 µs recording passed timestep and cable-section refinement.
[Verification results](../../monitor/video-path-verification.json) record
all ten cases: nine accepted characterizations; stuck-intensity is withheld
because its pulse-width change exceeded 1%. These are numerical checks, not
physical fault validation. Generic semiconductors, cable values and omitted
oscillator loads remain bounded assumptions. External supplies do not model
flyback or warm-up behavior. This bench cannot diagnose the pale expanding image.

Regenerate through the native `robotron-signal-pattern`, `verify_signal_path.py`
and `export_signal_path.py` workflow. The export binds acceptance to archived
input/deck hashes and preserves the original trace samples. The bundled artifact
retains the exact simulation input snapshot hashes, including the source index
as it existed when the run started.


## Electrical-trace optical backend

Local version 3 recordings can now display variable-resolution phosphor frames
and recorded electron trajectories, with named electrical probes and absolute
simulation times. Images retain fixed exposure; comparisons require matching
exposure, screen geometry and rendering settings. The browser replays the
recorded result rather than recomputing a raster or phosphor decay.

The native `beam_render.py` backend takes electrode potentials, yoke currents
and gun-entry beam current through trajectory integration, flight-time handling
and an energy-accounted phosphor surface. It also exports PNG and linear optical
power arrays. Its tube fields, phosphor efficiency and decay remain assumptions.
Every v3 recording is labeled `experimental-optical-bench`, never a qualified
complete-monitor simulation. Absolute timestamps do not demonstrate warm-up;
a backend run starts with an empty phosphor surface unless an explicit optical
checkpoint is supplied. Optical checkpoints preserve phosphor excitation and
electrons still in flight, but do not restore electrical or thermal solver state.

The full power/deflection circuits, coupled CRT loading and continuous warm-up
are still incomplete. There is no newly qualified museum screenshot from the
complete CRT path. The synthetic v3 fixture is only in `tests/fixtures/monitor`,
not the default recording menu. Native `full_path_audit.py` records the outstanding
circuit and evidence gates instead of promoting backend tests to full accuracy.

The signal-path recording was regenerated after correcting sync-filter V6:
the original operating manual places its anode at V5 base and cathode toward
R28. It supersedes the earlier reversed-diode recording; the complete ten-case
numerical verification was repeated after the correction.


The native stage profiles also include the connected sync filter/V5/V11 oscillator
and the seven-component 5 V regulator. Tests check field lock, loss/reacquisition,
load response and timestep refinement. These remain separate stage benches;
there is no new complete-monitor recording in the menu.

The transformer candidate tool lists 16 relative-polarity alternatives for an
explicitly hypothetical tap graph. They have not been evaluated in an assembled
monitor. Neither candidate enumeration nor optical continuation establishes a
flyback-versus-capacitor diagnosis or a verified 300-second warm-up simulation.

Native firmware capture now defaults to 100 ms, and `frames.py` selects complete
fields from BSYN while retaining the original events and pre-roll. The new
`full_path.py` command archives this selection and the circuit audit, but currently
stops with a blocked preflight report: it does not yet solve or render a complete
monitor. Assembly completeness, numerical acceptance and specimen validation are
reported separately. No additional recording is added to the museum menu.

The connected vertical bench now includes the A2 integrator and V13 reset path,
with a provisional LM723-family model. It generates a ramp from the oscillator
pulses. C15 remains an explicitly unresolved capacitance, explored over an assumed
range. The newer `k7222-11-vertical-output` profile adds A3, compensation,
complementary power output and current feedback into an assumed R/L yoke,
replacing the dummy ramp load. A3 uses an uncalibrated LM709 transistor-family
model; output-device identity and winding parameters remain uncertain. The
height/centering controls and timestep convergence are tested, but ideal supply
rails remain. This is not yet an emulated raster or a fault diagnosis.

The source audit now covers 171 of 260 entries across nine separate sheets.
The converter review also corrects the 5 V regulator output capacitor to C5,
1000 µF; the earlier C8/47 µF assignment and recordings are superseded. The
manufacturer manual assigns C8 to converter soft-start. Full converter and
horizontal/flyback assembly, loaded tube rails, settled-state iteration and
firmware-frame rendering remain unfinished; no new full-monitor image or menu
recording is published.


The new input/converter bench adds F1/L3/C11, the controller, V10/V22, T1,
feedback/soft-start and the three output rectifier/filter paths. T1's numerical
values and relative winding signs remain hypotheses with explicit parameter
bounds, archived alongside the generated model. A shared-flux magnetic backend
is checked for load reflection, polarity, shorted turns, saturation, power balance
and numerical refinement. These checks do not identify the historical transformer.

Converter acceptance currently covers early startup, not settled regulation or
horizontal synchronization. Long switching runs remain a numerical/performance
gate. Failed and timed-out runs publish no replay; the full-path renderer still
stops at preflight. The first full-path image requires thermal-equilibrium
initialization and continuous electrical settling/replay; persisted warm-up
checkpoints are deferred. No new diagnostic conclusion or full-monitor PNG is
published by this change.

Converter implementation: native commit `e7ad347f`. Verification passed all 72
monitor tests and nine browser monitor-lab tests. These include early startup,
not a successful long converter-startup or full-path rendering run.

## Sustained warmed-up recording support

The native tools now provide a 16-field source-selection preset, thermal
equilibrium helpers, bounded streaming optical export and an optional compiled
trajectory backend. One second of original firmware video contains the required
unchanged 16-field interval after ten pre-roll fields. These tools do not yet
produce a connected full-monitor recording: converter switching performance and
the horizontal/T3/electrode assembly remain blockers. No new full-monitor PNG or
museum default recording is published.

The reader reserves `experimental-full-path` for v3 imports explicitly carrying
`assembly_complete`, `numerical_acceptance`, `thermal_equilibrium`,
`electrical_stability` and `optical_stability` as true, thermal-equilibrium
initialization, sixteen frames, an explicit transformer candidate and a capture
SHA-256. `specimen_validated` and `full_monitor_qualified` must remain false.
These are recording assertions, not independent verification by the browser.
Older v1/v2 and v3 optical-bench imports retain their existing contracts.

See the [native sustained-rendering documentation](https://github.com/ddanila/dac-emulation/tree/main/verification/robotron-monitor#sustained-warmed-up-rendering-infrastructure)
for capture, streamed export, numerical tests and the converter profiling results.
