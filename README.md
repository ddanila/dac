# DAC — Danila’s Archive of Computing

*A museum of computers and the worlds they opened.*

A working browser prototype: rotate a computer, inspect its underside, click its case power button, and type on its live emulated screen. The museum uses pinned [DAC Emulation](https://github.com/ddanila/dac-emulation) WebAssembly cores in a worker.

[Open the public prototype](https://ddanila.github.io/dac/) · [Emulator release 0.1.1](https://github.com/ddanila/dac-emulation/releases/tag/v0.1.1)

## Try locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The default Robotron exhibit boots the **historical S550 ROM and TOS/M 1.0 disk**. This is a tested reference configuration, not a dump of Danila’s exact machine. Wait for `A>`, then try `DIR`. Press **Power on**, then **Screen** to type. Juku and VJUGA have original pixel diagnostics. The small warm-colored switch on the 3D case also controls power. Front/rear/underside buttons provide alternatives to dragging.

`npm run build` produces a static `dist/` site. `DAC_BASE=/dac/ npm run build` builds for a GitHub project-site path. `npm test` runs the focused Chromium checks (install the browser once with `npx playwright install chromium`).

## Historical media

Power off and expand **Load your machine’s media**. Files stay in the browser:

- **Robotron:** 2 KB boot ROM + 256-byte CAS PROM; optional 2/4 KB character data; optional 819,200-byte raw disk or supported standard/extended DSK (1–80 cylinders, 1–2 heads, up to 29 sectors of 128–4096 bytes within MFM track capacity). Tested with S550/287 and TOS/M 1.0.
- **Juku:** 16 KB ROM; optional 409,600/819,200-byte raw Juku disk.
- **VJUGA:** 16 KB adapted ROM, Rev-A Mode B bounded-boot profile; keyboard/disk are not implemented in that profile.

The reference archive’s supplied raw TOS/M image contains a damaged `PIP.COM`. Use a fresh decode of its original TeleDisk image for file operations; see [media conversion instructions](https://github.com/ddanila/dac-emulation/tree/main/machines/robotron1715m#tosm-media-recovery-and-the-pip-failure).

Disk writes are off by default. Enabling them changes only a session copy; **Export session disk** downloads it. Reset and power cycling preserve the copy, switching machines/media or closing the tab discards it. There is no upload or automatic persistence. The bundled Robotron firmware and OS are third-party historical media, excluded from the project’s MIT licence; redistribution rights have not been established. See [media provenance and rights](public/media/robotron/NOTICE.txt) and the [hash manifest](src/robotron-media.json). The disk is decoded from the original TeleDisk image, avoiding the damaged PIP in the alternative archived raw disk. Restore the diagnostic or historical media from the boot-media panel.

## What is qualified

Robotron cold boot, keyboard, file creation, reading, text/binary copying, export/reboot and deletion pass bounded native checks. Native and WASM boot pixels and complete session disks after create/read/copy match exactly. VJUGA matches a bounded Juku boot framebuffer in both native decode modes. The viewer has automated power/reset/input/media recovery tests and inspected desktop/mobile layouts.

The cores are experimental. Robotron has simplified FDC/DMA/SIO/CTC timing and an incomplete 8275 display model, with tested completion/interrupt behavior, programmed row height, field attributes and cursor. Juku accepts one key contact at a time; clock rollover is covered by focused native and WASM tests. No full hardware-fidelity claim is made. Focused session/media tests cover Chromium, Firefox and Playwright WebKit; this is not qualification of every retail Safari version. See [emulation validation](https://github.com/ddanila/dac-emulation/blob/main/docs/z80-browser-validation.md).

## Models and provenance

Robotron uses a photo-based OpenSCAD reconstruction of Danila’s actual machine, maintained in [3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). It combines documented overall dimensions, ruler-scaled key spacing, sculpted keycaps with transcribed legends, modeled drive slots/latches, a separate keyboard bottom plate and feet, one continuous cable, and separate physical power/reset switches. Consistent paint/plastic/rubber materials replace full-surface photo skins; the wordmark, drive markings and reference boards use localized photo crops. Owner overhead photos now determine the staggered rows, key islands and spacers. Raised Shift bodies are 18 mm wide and CTRL/ET bodies 23 mm, as measured by Danila; these dimensions are independent of the base flanges. Opaque cap cavities follow the rounded bodies so they cannot pierce the sidewalls. The keys can be clicked or used through accessible buttons; 89 positions are wired, while eight unverified mappings are labeled. Close-up views show the keyboard, drives, monitor and underside, with reference-photo links and evidence notes. Exterior parts can be separated for inspection. Small features and unseen surfaces remain estimates; interiors combine owner drive photographs with credited comparative references. Juku and VJUGA still use provisional geometry. See [asset notes](public/models/README.md) and [the exhibit brief](exhibits/robotron-1715m/README.md).

The museum commits a small versioned WASM distribution in `public/emulator/` rather than depending on a moving download. `manifest.json` records its source commit, ABI/toolchain version and hashes. To intentionally update it, build/package a release in `dac-emulation`, then run:

```sh
node scripts/sync-emulator.mjs ../dac-emulation/dist
npm test
npm run build
```

Large scanned assets and their hosting remain a future decision; the current generated geometry and small measured STL fit comfortably in Git. Original content is [MIT](LICENSE). Imported code retains the notices in `public/emulator`; Three.js retains its MIT license in the bundle. See [technical direction](docs/technical-direction.md).

Choose **Type** to keep the live display above the clickable 3D keyboard. **Inspect photo and details** opens the owner photograph for the current view; clicking a manufacturer plate or TEAC board label in **Drive labels** opens its specific photograph and transcription. Escape closes the photo panel.

The historical Robotron preset now runs the **S600 keyboard firmware** on a second Z80. Host key press/release and modeled clicks operate a reference switch matrix; serial clocking, firmware modifiers and Caps/SI-SO state feed the running OS. Some printed shifted legends differ from S600. Custom media may supply a 2 KB keyboard ROM; omitting it retains the character adapter.

**Keep this session** provides automatic local disk copies and **Save state / Restore state** for all three machines. Disk copies survive reloads and are separated by media identity; whole-machine states require the same emulator build and write mode. Disk export is a portable backup; **Export state / Import state** moves a complete session between browsers running the same emulator build, original media and write settings. **Discard saved disk** removes the local copy; reload original media to start fresh. Writes remain opt-in. Floppy seek, rotation and byte pacing now make boot slower; 4× speed is useful while waiting for `A>`.


**Drive B** accepts a second 800 KB raw image, a supported Robotron DSK, or an empty data disk. Power off to
insert/eject or change protection; copies persist independently. After a reload,
the inserted B disk and its protection are restored when persistence is enabled.
Use `DIR B:` and `PIP B:=A:PIP.COM`. Original files are untouched. Reset or warm-boot
the guest after a disk change, as its OS may cache directory data.

**Printer output** captures completed serial bytes, including control codes, and
exports a `.prn` file. The 64 KB capture limit is visible; export and clear when
full. Try `PIP LST:=AUTOEXC.SUB`. The virtual printer is always ready.

With the case open, each spindle and head follows its drive's motor/track state.
Head travel uses nominal TEAC 96-tpi pitch (20.90 mm across 79 steps). Current-core spindle and fractional head poses follow emulated startup/coast, STEP and settling timing. READY depends on index observations; Read-ID/sector search follows physical order, and missed byte deadlines report overruns. Optional synthesized seek sounds follow individual timestamped STEP events; motor tone follows modeled speed. Snapshot/replay restores all mechanics. The movable upper head arm follows the core’s load progress; a translucent inserted disk exposes its shared spindle motion. Its jacket is omitted for inspection, and arm lift/pivot dimensions remain estimates. Older preserved cores retain their earlier behavior, and reduced motion freezes the rotor display. DSK import/export preserves supported track order, IDs and GAP3; unsupported geometries are rejected. See [timing scope and remaining approximations](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/DRIVE-FIDELITY.md).

Additional validation: `npm run test:cross` runs the focused Firefox/WebKit suite
(after `npx playwright install firefox webkit`). CI runs Firefox on Linux and WebKit on macOS; both also passed locally on macOS. The core's optional application
regression covers WordStar editing, Turbo Pascal compilation/execution, drive-to-
drive PIP copying and printer output using the bundled reference disk.

## Current Robotron model

Canonical model v38 uses the W/M motherboard with integrated U8272 and a separate solder-side-up display controller. Owner photographs guide the fan, drive adapters, carrier windows, underside rotors, cover hardware and clean exterior. The enclosures have 1 mm bent painted skins, hollow front returns and open vents. The October 14 photos of this specimen also establish 39 display-board ICs and visible passives; mainboard placement still needs complete photo calibration. The browser imports the canonical export; physical verification remains independent of photo/schematic evidence. The museum does not claim an exact reconstruction of hidden circuitry.

All keyboard, monitor and logic-board geometry loads before the exhibit is marked ready, so internals remain visible through openings with the covers closed. Repeated DIP package meshes share geometry across boards, including concurrent requests. Optional reference-photo overlays load only when selected. The percentage includes all required geometry; a failed geometry request leaves an explicit unavailable state rather than presenting an empty case as complete. Reloading retries it. Loading optimizations must preserve the visual experience. STL triangles now use shared indexed vertices after crease normals are computed: all 203 meshes retain identical expanded attributes, while the stored vertex count drops by 66%. Bounds accelerate picking, and disk dragging computes its ray directly instead of repeatedly picking the entire model.

The drive fronts have photo-referenced sloping finger wells, one curved double-headed arrow each and plain black-plastic levers. The clear textured power rocker is recessed, with canonical RESET / OFF / ON / POWER legends. Lever and clamp movement interpolates over 320 ms, including mid-travel reversal; reduced-motion mode remains immediate. This visual hand movement does not delay or fabricate controller telemetry. Inserted media sits deeper with the hub and head system aligned, the lever clears the jacket, lenses are flush, and upper finger scoops are raised. The power rocker tilts between OFF and ON; reset visibly depresses and springs back, sending reset only while powered. The keyboard input lead now reaches its correctly oriented controller through a captured round grommet; the connector is asymmetric. Case returns close the front seams and the monitor surround has a rolled/dished profile.

The canonical repository includes repeatable photo/STL overlays and bounded solid-clearance checks for connectors, fan opening, board mounts, brackets and passive components. See the [current model, evidence, checks and rebuild instructions](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). Earlier decisions and superseded layouts are preserved in [model development history](MODEL-HISTORY.md).

### CI scope

Model/viewer-only changes (including scene lighting and camera code) run two isolated Chromium shards covering model, keyboard, assembly, inspection, rendering and saved-session interactions, plus small Firefox/WebKit assembly checks. Each runner uses one browser worker to avoid competing software renderers. Interaction checks default to reduced motion; dedicated mechanism tests explicitly exercise animation. Saved-session fixtures omit CAD loading, while the dedicated exhibit tests retain the complete model. These runs do not build the native emulator or run unrelated replay suites. Runtime, emulator, dependency or unrecognized changes run the complete suite and native replay checks; manual workflow dispatch also runs everything. `scripts/ci-scope.mjs` uses a conservative path allowlist and defaults to full coverage if the base revision cannot be read. Pages deployment still requires the build and browser checks. Linux browser dependencies use Ubuntu’s main mirror to avoid the slow Azure mirror seen in previous runs.

### Local photo review

With Vite running, `node scripts/review-robotron.mjs` creates
`/tmp/dac-robotron-review/index.html`: six owner-photo/render pairs from camera
poses stored in the canonical model. Optional arguments are the Vite URL, output
directory and canonical Robotron source directory. It uses the actual model
loader without starting the emulator. Run it locally after visual changes;
these are manually fitted comparison directions, not calibrated cameras.

Model v35 adds the keyboard matrix PCB tongue, pale socket and bent contact tails,
separate grey/blue controller resistors, rounded sheet tabs, and a painted 1 mm
support plate. PCB supports and routes also appear in the fast SCAD previews.
Controller docking and electrical routing remain provisional. PCB material now
has a nonmetallic fine-grain finish. The drive's upper head follows the moving
release rail; the disc follows spindle phase only after the visible clamp seats.
The final insertion frame requests a redraw, including reduced-motion changes.
These are presentation corrections, not changes to controller timing.


Model v36 replaces keyboard transistor blocks with pinned KiCad TO-92 bodies
and three leads, adds drilled lead holes, thin shield-clamp ears, colored entry
wires and stamped cover tabs. Upstream STEP files, material-separated meshes,
credits and licences are shipped with the canonical export. Click an individual
motherboard/display IC for its designation, role, owner photo and original
W/M drawing link. Display-board P numbers are museum placement IDs; exact board
revision equivalence and calibrated motherboard placement remain unverified.
The model manifest includes the canonical `hardwareAudit` evidence record.

Emulator 0.8.3 corrects the 8275's seven-bit invisible-attribute data,
character-attribute inheritance, read-to-clear status and parameter-length
errors. Exact raster/DMA scheduling and the 16-byte FIFO overflow behavior
remain unimplemented. Focused peripheral tests, S600 modifier-release tests,
WASM smoke/snapshot tests and native/WASM historical-boot parity pass. No
Verilog checks were run. Physical print/fit classifications are unchanged.


Model v37 reuses the pinned KiCad DIP bodies and bent leads on the keyboard
controller, with shared footprint-derived holes and solder eyes. Clean top and
underside routing follows the owner photos; it remains visual artwork, not a
verified netlist. The visible motherboard RAM, CTC and four large processor-area package positions now use owner
photo registration against the provisional board envelope. Hidden regions and
exact dimensions remain unverified. The canonical review set includes a
separate controller-underside comparison.

Emulator 0.8.4 adds per-row 16 × 7-bit attribute FIFOs, wrap/overwrite behavior
and read-clear overflow status. In 0.8.4, FO was sampled on a nominal frame cadence; the current scheduler is described below. Native/WASM historical boot and snapshot checks pass. The old
long keyboard test is split into four independent scenarios with the same
coverage and existing timeout, avoiding a single near-limit interaction chain.
The previous 0.8.3 core is preserved for saved sessions.

Model v38 locally registers eleven processor-area packages and the long socket
against nominal DIP-40 pin pitch in the owner photograph. Surrounding parts and
whole-board dimensions remain provisional. Connector/resistor leads now pass
through matching keyboard PCB holes with solder eyes; the pale connector has
its photographed closed segmented bridge. Clean material profiles distinguish
solder, tinned metal, phenolic substrate, ceramic and IC moulding. The canonical
review gallery adds a motherboard processor-area view.

Emulator 0.8.5 schedules 8275 row fills, burst gaps, stop-DMA dummy reads,
underrun suppression and raster IR status independently of browser rendering.
The nominal family clock and idealized local memory response are documented;
this is not per-byte board timing or verified CPU interrupt wiring. Snapshot
layout 4 retains scheduler state; the preserved 0.8.4 core serves older sessions.

CI now distributes individual tests across the existing two Chromium runners,
keeping one worker per runner and unchanged job limits. Closed/open drive drags
and desktop/mobile typing checks are independent scenarios, so a slow combined
interaction sequence no longer consumes their shared timeout. See
[Playwright sharding](https://playwright.dev/docs/test-sharding).

### Robotron v39 inspection and display update

Canonical models now include partial owner-photo copper artwork, the visible
board marking, registered small components, and a ribbon plug/socket endpoint.
Exact electrical values and hidden cable routing remain provisional; physical
print verification is unchanged. Close-up and review renderers use a disposable
neutral room reflection environment, preserving canonical material colors and
all geometry. No new shadow map or continuously running render loop is added.

Core 0.8.6 draws completed controller row buffers, retaining fetched bytes and
starting attributes across host frames and snapshots. Writes after fetch start
wait for a subsequent fetch; this is row-level, not cycle-perfect video DMA.
Core 0.8.5 remains archived for previous saved sessions.

For local visual regression, start Vite on port 4173 and run
`npm run review:robotron -- http://127.0.0.1:4173 /tmp/dac-review`.
The gallery compares all eight views with owner photos and checks three PNG
baselines (drive front, keyboard controller underside, motherboard processor).
Each view also checks visible object names, vertex/index counts, bounds, instance
placements and material colors/finishes against a structural baseline, catching
small missing parts that a tolerant image comparison could overlook.
Images are reduced to 240×180 before comparison to tolerate antialiasing noise;
mean RGB error must stay below 0.018 and fewer than 3.5% of pixels may differ by
more than 0.12 in any channel. This catches substantial visible changes, not
subpixel geometry errors. GPU/driver differences may still need manual review.

After inspecting intentional changes, pass `--update` to replace the three
baselines. Review the images before committing them; never auto-update on CI.
This check remains local to avoid another expensive browser job. Existing
clearance, material, enclosure and browser checks remain in CI.

### v40 / core 0.8.7

The motherboard now includes twenty additional photo-registered package bodies,
three pale IC sockets with contacts, visible jumper blocks and more discrete
components. Unidentified bodies carry `PHOTO-*` inspection identifiers and no
invented chip markings. The ribbon is a continuous board-to-two-drive chain;
rounded sections preserve its width, conductor ridges and edge stripe. Separated
views carry the complete drive-to-drive span and all four power-wire ends with
their plugs, while the board/PSU ends remain fixed. Intermediate slack, socket
internals and unseen dimensions remain estimated. Owner evidence labels now
clearly distinguish our boards from the retained comparative gallery.

The display reads individual bytes on scheduled local DACKs and retains decoded
row pixels, cursor and attributes. Partial fetches survive snapshot layout 6;
core 0.8.6 remains archived for older sessions. This includes the upstream shared
runtime refactor. Nominal local acknowledgement timing is not a measurement of
the specimen's bus contention or individual scanline timing.

CI still has two Chromium workers total, one per job. `scripts/ci-shards.mjs`
assigns complete test files by longest estimated duration first, using recorded
successful run timings in `tests/ci-durations.json`. Unknown files get a default
weight and always run. Visual-only runs balance their own subset. A coverage
check ensures every file is assigned once; no retries or timeouts were added.
The former combined keyboard test is split into physical-byte and shared-Caps
behaviors with named steps, reducing cumulative setup/input time in each test.
The stronger Caps test also exposed and fixed diagnostic-adapter physical Caps
handling, including avoiding double application of the host OS's Caps state.
Firmware keyboard input still goes directly to the S600 controller matrix.

### v41 / core 0.8.8

Photo-registered motherboard placements now share a two-photo fit using six
nominal DIP lead rectangles. An independent common-chip check differs by
1.15 mm; board edges and unseen mounts remain estimates. Readable specimen
legends, DMA/SIO orientation, additional visible copper and tinned lands improve
the clean reconstruction. Downloadable board STLs include the sockets and
contacts visible in the museum. The canonical metadata checker runs before
model import and verifies counts, evidence, hashes and embedded source files.

The ribbon now clears the display-board edge. Its canonical path sections move
with rigid cross sections, preserving width and stripes. Cheap geometry tests
sample 21 separation positions in connected and parked modes, checking PCB,
chip and drive-carrier clearance, width, endpoints and restoration. Cable slack
and separated-view extension remain illustrative; no visual detail is removed.

Core 0.8.8 samples glyph, cursor and attributes at scanline boundaries, retaining
already emitted lines and per-line intensity. Snapshot layout 7 preserves the
partially refreshed frame; core 0.8.7 remains archived for existing sessions.
Exact dot timing, specimen bus contention and unverified IRQ wiring remain
outside the model. Native/WASM historical boot parity and focused timing,
snapshot, geometry and browser checks cover this release.

### v42: component inspection and assembly review

Click a motherboard/display-board chip to compare its owner-photo crop with a
rotatable clean nominal package. Confidence distinguishes observed markings,
estimated placement and provisional schematic identity. Package lettering now
keeps its proportions and complete text; unconfirmed markings and schematic
references are omitted from chip surfaces. Original photographs and drawings
remain linked.

Canonical model v42 audits visible motherboard fasteners/open holes and refines
keyboard controller end holes, matrix-board corners and the connector legend.
The approved keyboard exterior and physical verification classifications are
unchanged. Hidden switch contacts and controller/matrix mating are unresolved.

Cable tests now include connector envelopes, PSU/case boundaries and full-width
ribbon self-crossings over 21 poses for both connection states. The estimated
ribbon folds were corrected at the rear wall and where the two spans crossed;
animated sections keep their width and their photographed endpoints. Two
power-harness terminations still penetrate the simplified PSU wall, within
explicitly bounded audit exceptions. Those entry apertures need better evidence;
they are not silently counted as correct. Tests do not establish cable slack,
bend stress or thickness clearance between coplanar ribbon surfaces.

Additional native core tests cover scanline geometry changes, spaced rows,
blink transitions and public snapshots just before/after a line boundary,
compared against uninterrupted execution. The published core remains 0.8.8
(snapshot layout 7); this pass changes coverage, not emulation behavior.
