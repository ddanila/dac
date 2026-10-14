# Model and viewer development history

Dated notes may describe superseded behavior. See [README.md](README.md) and the canonical model for current scope.

### Workbench improvements (2026-10-11)

- **Disk library:** name a copy of either mounted drive, duplicate it independently,
  insert it while powered off, reset it to its captured original, or export it.
  Drive B insertion/ejection and write protection survive reload when disk
  persistence is enabled. Disks from each machine have separate library lists.
  “Keep browser storage persistently” requests browser-managed persistence;
  exporting files remains the way to keep an independent backup.
- **Paste through the keyboard:** ASCII text/newlines (up to 4096 characters),
  paced in emulated time with cancellation. Robotron with firmware uses an S600
  mapping measured by running its ROM, including shifted punctuation; other
  keyboard ROMs and SI/SO mode are rejected. Without firmware, Robotron/Juku use
  their existing keyboard adapters. Wait for the guest program’s prompt.
- **Record/replay:** restart with the currently mounted disk contents, then record
  exact run budgets, key contacts/taps, resets, power changes, printer clears and
  up to eight disk/protection changes. Stop and export a `.dacrecord` (maximum
  100,000 events). It includes ROMs and disks; their original rights/credits apply.
  Replay runs an isolated machine and verifies the display, both disks and printer
  hashes, preserving the current session. Long replays can be cancelled.
  Media changes happen with power off; changing machine/firmware or loading a
  snapshot requires stopping the recording.
- **Across upgrades:** state envelope v2 declares a pinned-runtime compatibility
  policy and still accepts v1. DAC preserves the 0.3.0, 0.4.0 and 0.5.0 runtimes with checked
  JavaScript/WASM hashes. Compatible old browser saves and exported `.dacstate`
  files can run on that runtime; a notice identifies it. Reloading media selects
  the current runtime. This is preservation, not conversion to a newer internal
  layout. Unlisted versions are rejected without replacing the current machine.
- **Inspection:** click interior components or use “Explore the components” to
  read descriptions and the owner/reference/estimated evidence behind them.
- Hidden tabs pause emulation, clear held input/cancel paste and flush disk copies.
  Returning starts from the current emulated time without a wall-clock backlog.

For a native replay check, build `../dac-emulation/build/dac-replay` with
`make -C ../dac-emulation build/dac-replay`, then run:

```sh
node scripts/replay-native.mjs path/to/session.dacrecord
```

This compares native C output with browser-recorded output. `.dacrecord` is a
versioned command/media format, not a C structure dump. Equal output hashes are a
useful regression check, not proof of every internal state or hardware timing.
Snapshot/runtime preservation should be extended before replacing another core:
keep its JS/WASM and notices under `public/emulator/archive/<wasm-sha>/`, add the
pinned JS hash to `src/archived-cores.json`, and run the preserved-state test.

`src/s600-paste.json` is reproducible with `scripts/s600-keymap.c`: build it against
`../dac-emulation/build/{machines/robotron1715m/{robotron,keyboard,sio},common/cpu/z80,common/media/media,common/trace/trace}.o`
and run it with `public/media/robotron/s600.bin`. It boots a fresh reference
keyboard for each matrix contact with and without Shift and observes serial output;
it does not infer characters from the specimen’s printed legends.


Assembly inspection now supports keyboard-only disassembly, assembly isolation,
transparent covers and a visual drive-clamp release. Springs and stems share
instanced geometry and follow key presses. The spring uses the owner-confirmed
13/23/0.4 mm dimensions; hidden switch construction remains estimated.
Drive heads and shields move together, and separated cables retain their endpoints
using explanatory stretching. Releasing clamps in the viewer does not eject media.
Monitor geometry and PCB credits remain explicitly comparative until specimen
interior photographs are available. Focused `assembly.spec.js` checks these motions,
visibility restoration, cable endpoints and mobile controls without hardware simulation.


The reference motherboard and controller now use pinned KiCad DIP package meshes,
instanced by family without stretching their nominal dimensions. Their photographed
placements and uncertain package matches remain provisional. Discrete components
are placed at photo landmarks, and original flat chip silhouettes are removed from
the PCB photo surface. Choose **Inspect assembly → Logic boards** for the close view.
Upstream STEP sources, file-specific licences, credits, conversion metadata and
mesh hashes ship alongside the exhibit in `public/models/robotron-1715m/components/kicad`.

**Inspect assembly → Motherboard / Floppy controller** now isolates each board,
including its chips, passive components, connectors and reference artwork.
Real holes, metal pads and underside solder fillets share lead positions; pads
and solder use reusable instances. The controller includes yellow film
capacitors and photo-estimated electrolytic sizes. Traces and markings are
extracted from the credited comparative photographs onto a consistently lit
substrate; hidden routing and electrical connectivity are not reconstructed.
The exact board revision, sockets and connector details remain provisional.

The **Inspect board underside** button isolates the selected motherboard or floppy
controller and shows its solder side. **Show original reference board photo**
switches back to the component side and replaces modeled components with the
credited source photo; turning it off restores the reconstruction. Mounting
holes, washers and hex supports now share positions. Drive rail bearings,
spindle retainers, carriage springs, rear cable plugs, power entries and ribbon
ridges add photo-guided detail. Small pads, solder, contacts, IC leads and ribbon
ridges are hidden at distant zoom levels and restored nearby with hysteresis;
static inspection still stops rendering when nothing changes.

Guided exploration now highlights carriages, spindles, clamps/latches and either
logic board with evidence notes. **Drive top** and **Drive rear** provide close
inspection views. The **Mechanical motion demo** offers a manual pose slider and
optional slow cycling without sending commands to the emulator; switching it
off restores live drive activity. Reduced motion keeps it manual.

Exploded views disconnect drive cables by default: plugs stay with the parked
cable ends while drives lift. The checkbox retains the earlier stretched-cable
illustration as an option. Small finish differences distinguish cast-alloy-like,
plated-steel-like, solder and aged-plastic surfaces, all visually estimated.
**Download board and drive models** provides four STL/OpenSCAD source archives
with evidence notes and licences; archives are downloaded only on request.
The canonical source includes a bounded solid-intersection audit of all 80
modeled head positions, which caught and corrected a rail/tab collision and an
obsolete overlapping spring. It is not a complete mechanical certification.

### Drive inspection and regression (emulator 0.7.0)

Open **Drive diagnostics** to inspect fractional cylinder, physical head/sector,
modeled RPM and angle, READY/head-load state, cumulative index/STEP counts,
controller command/phase, byte progress and sampled result registers. Index counts
retain pulses missed between browser frames; result registers are shown only
while the controller is in its result phase. This panel does not change timing.

The controller supports Read/Write Deleted Data on DSK and bounded Read Track in
physical order. Writes that underrun clock zero padding and report OR; motor-off,
reset and power-off preserve the written prefix. DSK can retain its bad-CRC mark.
Formatting clocks sector payload intervals and preserves completed sectors after
a later interruption. Raw images cannot preserve deleted/error marks, so Write
Deleted requires DSK. See the core fidelity document for the exact supported subset.

`tests/drive-regression.spec.js` runs a real TOS/M PIP copy, snapshots mid-write,
compares 8192 samples of controller/mechanical continuation at 64-clock intervals,
and independently decodes the final CP/M directory to compare the copied file.
The diagnostic panel has a narrow-screen check. The 0.6 runtime is archived for
older saves alongside 0.3–0.5.

### CI scope

Model/viewer-only changes (including scene lighting and camera code) run one Chromium job covering model, keyboard, assembly, inspection and rendering interactions, plus small Firefox/WebKit assembly checks. They do not build the native emulator or run unrelated disk/session suites. Runtime, emulator, dependency or unrecognized changes run the complete suite and native replay checks; manual workflow dispatch also runs everything. `scripts/ci-scope.mjs` uses a conservative path allowlist and defaults to full coverage if the base revision cannot be read. Pages deployment still requires the build and browser checks. Linux browser dependencies use Ubuntu’s main mirror to avoid the slow Azure mirror seen in previous runs.

The single Chromium job allows 10 minutes for model checks and 20 for the complete suite, and logs each test as it runs. The first full run after consolidating the former shards hit the old shared 10-minute cap without reporting a test failure; the higher cap applies only to full runs and does not add tests or workers.

The model now loads behind a prominent, accessible percentage bar. Its fixed total includes all required meshes, textures and the final assembly step; it measures completed assets, not elapsed time or estimated bytes. It reaches 100% only when the detailed model is ready, hides for other machines, and explains a failed 3D load while keeping the emulator controls usable. Owner rear close-ups also guide the recessed connectors, vertical mains inlet, nameplate and nearly flush grey reset pad.

The October 12 loose-key photographs now supply shared OpenSCAD geometry for the
black keycaps: thick skirt, shallow dish, pale inner core, annular spring recess
and round cup with the print-trial latch ring and orientation rib. [Standalone cap STL and source](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m/keycap)
and [individual switch parts](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m/key-switch)
are available in the canonical model repository. The spring uses the owner's
13 mm outer diameter, 23 mm free length and 0.4 mm wire measurements. Slotted
guides, moving rubber pads and paired PCB contacts appear in keyboard inspection;
pressing a key compresses its spring and moves the rubber with its carrier. The
PCB opens contact-face up. Hidden contact geometry, installed height, travel and
small fit dimensions remain estimates; the keycap has not been fit-tested. The
18/23 mm raised wide-key widths and existing firmware input are retained.

Rendering and picking keep the detailed interiors economical: closed opaque caps
skip their hidden pale cores, raycasting prunes hidden assemblies before testing
triangles, and CRT video changes request a 3D redraw only while the screen is in
the camera view. The raster stays current for the next visible render. These
optimizations retain geometry and the existing interaction-test time limits.


### Disk handling and specimen inspection

The 3D scene retains complete drive frames while meshes load, including door,
head position and mechanical state. Media-only updates preserve the other bits.
Removed session disks remain beside the case with stable Disk 1/2 labels.
Drag a disk into either open, empty drive, or use the accessible Insert/Move
buttons. Green/red target feedback explains closed or occupied drives. The
0.8.1 core transfers actual bytes, format metadata and write protection atomically;
a second removed disk remains parked. Mounts and empty slots survive reload, and
transfers are recorded for deterministic browser/native replay. A busy controller
rejects a transfer until its command finishes. Preserved older cores retain their
original capabilities.

Diskette inspection loads the canonical jacket, magnetic medium, label and paper
sleeve meshes on demand. Orbit/zoom, flip, and slide the disk into/out of the
sleeve. Only the small owner label uses a photo texture; sleeve instructions
remain reference photos. Closing the dialog disposes its WebGL resources.
Reduced motion snaps sleeve and drive insertion to their final positions.

Drive rods/cams and clamp-release rails now follow each drive's lever. The
keyboard adds aligned insulating PCB supports, washers, contact fan-outs and an
incoming controller wire bundle, using owner photographs. Hidden dimensions and
routes remain approximate; these changes do not assert electrical connectivity,
measured linkage dynamics, or physical print verification.

Workbench tests omit the CAD manifest and use the existing model-unavailable
fallback. They exercise sidebar controls, persistence, paste and replay, while
the dedicated museum, keyboard, assembly and drive suites retain full geometry.
This avoids repeatedly compiling/rendering the full exhibit during core reload
checks on software WebGL; assertions and per-test deadlines remain unchanged.


### Key mechanism, PCB finish and rendering

The key mechanism card loads canonical cap, carrier, spring, rubber, guide, mount,
contact and PCB meshes independently. Hold a key, adjust travel or separate the
parts; a transparent view exposes the mechanism. This is a mechanical inspection,
not an OS input control. The owner's spring dimensions are measured; installed
travel and hidden contact geometry remain estimates.

Controller PCB lead holes, solder fillets and owner-readable chip markings add
underside detail. Rubber, clear plastic, brushed metal and paper use shared CAD
material profiles; no wear is baked into the exhibit. The keyboard exterior and
physical print-verification statuses are unchanged.

Main-scene and specimen rendering stop offscreen or in a hidden tab. Specimen
viewers draw only on interaction/animation and dispose their resources on close.
Detailed KiCad packages and comparison PCB photographs load only when interiors
are requested, with a visible loading status. Core simulation remains independent
of rendering visibility. No Verilog simulation is required for these checks.

### Protected media, evidence labels and remembered views

Removed session disks have a clickable write-protect notch plus accessible
Cover/Uncover buttons. An opaque sticker means protected. The 0.8.2 core changes
protection without remounting or resetting; inserted disks reject tab changes.
The protection follows transfers, remembered mounts, snapshots and recording
opcode 12. Original media files are never overwritten by these controls.

Enable Inspection labels for anchored part names. Each opens its owner photograph
or credited comparative source, with measured, nominal or estimated dimensions
stated separately from physical print verification. Keyboard underside routes,
connector leads and cable-entry choke follow existing owner photos; CRT mounting,
clamping, insulation and shielding remain comparative estimates. Exact hidden
keyboard electrode geometry and specimen CRT electronics await better evidence.

The exhibit remembers the camera, open covers, selected assembly, transparency,
reference-photo and label settings locally. Reset view clears that layout without
changing the emulated machine. Invalid stored selections/camera coordinates are
ignored. Demo animation and emulator power/media are not part of the view preset.

Keyboard and monitor interior STL geometry now loads on first interior request,
alongside the detailed PCB packages. Exterior controls and key mechanisms remain
available immediately. Empty geometry placeholders preserve assembly identities
until the canonical meshes arrive; a visible detail-loading status reports errors.

The October 13 system-unit archive is evidence for Danila’s **specific museum specimen**. Canonical v29 adds folded cover stiffeners, crossed fan retainers/cushions, PSU access grommets and brown drive adapters, with owner-photo inspection labels. The rear board is visibly solder-side up in the new photographs; its current comparative component reconstruction still needs a separate layout revision. Unseen monitor/PSU electronics remain explicitly provisional. Published references are MIT owner photos with metadata stripped; wear is not reproduced.


### W/M board and specimen hardware update (model v30)

The canonical `3d-models` export now replaces the comparative original-1715 logic
boards with a W/M motherboard (integrated U8272) and a solder-side-up display
controller. Owner photos guide display footprints, drive adapters, cover vent
inserts/retainers and fan hardware; the W drawings guide documented device roles
and motherboard placement. Exact display-board revision, hidden population and
unmeasured dimensions remain provisional. The monitor interior remains comparative.

New Fan, Adapters, Cover underside and Display board views isolate these assemblies.
The fascia stays attached to the lifted cover. Labels avoid opaque cover/board
occlusion. The evidence panel reads canonical assembly provenance and keeps
physical verification separate; none of these assemblies is marked printed and
verified. The display solder photo is opt-in reference evidence, not a default skin.
Downloads include the new display controller and source layout/evidence records.
