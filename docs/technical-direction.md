# Technical direction

The initial direction below is retained as research history. Implemented decisions: native C cores in dac-emulation, a shared pinned Z80, Emscripten/WASM worker execution, Three.js viewing, and checked-in versioned runtime artifacts. The root README and emulator validation report describe current behavior; physical fidelity and detailed assets remain unfinished.

## A reusable exhibit

Each exhibit should describe its physical components, camera views, interactive controls, display surfaces, historical notes, and emulator requirements. The museum viewer should not need to understand each machine’s internals.

The intended connection is:

```text
3D power control / keyboard → machine adapter → emulator
3D monitor surface         ← live video      ← emulator
status lights              ← available events/state
```

The adapter should cover startup, power-off, reset where supported, key press/release, display output, media loading, and cleanup. Model cold boot separately from pause/resume. Release held keys when focus is lost. Only drive activity indicators from real emulator events when those events are available; mark approximations explicitly.

A browser 3D renderer with glTF/GLB assets is a reasonable starting point. Keep the emulator execution lifecycle independent of camera movement and asset loading. Investigate worker execution where supported by the selected engine; it is not an assumption that every emulator can run in a worker unchanged.

Use optimized browser models and textures for the default view, loading finer detail and interiors as needed. Preserve editable masters and reference photographs separately. Decide between Git LFS, release assets, and external object storage after measuring actual asset sizes and delivery requirements.

## Robotron emulation research

Initial source inspection: 2026-10-09. This section predates the working native/browser prototype; current boot evidence is in dac-emulation/docs/z80-browser-validation.md.

[MAME’s Robotron driver](https://github.com/mamedev/mame/blob/master/src/mame/robotron/rt1715.cpp) includes separate PC-1715 and PC-1715W configurations. At inspection, `rt1715w` is flagged with imperfect graphics; the base `rt1715` and Latin/Cyrillic `rt1715lc` configurations are marked not working. Driver availability is a starting point, not validation of Danila’s machine. Confirm which configuration matches the 1715M exhibit before selecting it.

[MAME’s build documentation](https://docs.mamedev.org/initialsetup/compilingmame.html#emscripten-javascript-and-html) describes Emscripten browser builds and selecting a subset of drivers. [Emularity](https://github.com/db48x/emularity) provides a browser emulator loader. These are candidates for reuse; integration, video transfer, input fidelity, build size, and browser behavior require a practical spike.

First prove boot and keyboard behavior with a pinned native emulator build. Then test an equivalent browser build before investing in a finished 3D scene. Record the upstream revision, build recipe, firmware and media hashes, browser versions, results, and known limitations so the exhibit can be reproduced years later.

## Decisions to make after the spike

### Alternative implementations investigated

- [robotron-1715m-fpga](https://github.com/usovmv/robotron-1715m-fpga): MIT-licensed project with separately licensed dependencies, an FPGA implementation, and Python development simulators. The author explicitly models their modified FPGA design and uses MAME as a reference. Useful for research and comparison, but not evidence of greater original-hardware accuracy or a ready browser engine.
- [EMU / Bashkiria-2M](https://bashkiria-2m.narod.ru/index/fajly/0-11): the author's downloads list Robotron 1715 support and disk images for 1715/1715W. Public source and an open-source license were not verified, nor was accuracy relative to MAME.
- [JKCEMU](https://github.com/lipro-cpm4l/jkcemu) and [Emu80](https://emu80.org/): their published supported-system lists do not establish 1715M support. Treat them as possible component references, not ready replacements.

No alternative has yet been validated as more accurate for the original 1715M. Compare boot, memory banking, keyboard, display attributes, and disk behavior against the physical exhibit before claiming fidelity.

### Open choices

- Emulator choice and whether DAC needs maintained upstream patches.
- Adapter API and how to expose live video without excessive copying.
- Model tooling, detail budgets, and browser/device support targets.
- Emulator binary and large-asset storage and delivery.
- Firmware/media sources and distribution permissions.
- Original DAC content is MIT-licensed; preserve upstream licenses and notices for imported components and media.
- Visitor disk persistence, reset behavior, and export of modified media.

The first acceptance test is a repeatable cold boot into an interactive system from the 3D power control, with readable live video and reliable input while the model remains inspectable. Start with a simple model and improve its physical fidelity after that path works.


### Robotron reference and firmware provenance

The model’s shared CRT profile now supplies convex glass and an inset live raster; keyboard legends use physical dimensions rather than stretching with wide caps. The canonical model documents the estimated dimensions and external evidence. The museum’s optional interior gallery shows [Oldcrap’s PC 1715](https://oldcrap.org/2017/12/26/robotron-1715/), explicitly another specimen with unverified M/W applicability. The gallery loads images from the original host and attributes them. The modeled motherboard/controller also use two unmodified, locally stored photo references, with source URLs, hashes and an explicit notice excluding them from MIT. Those earlier PC 1715 boards remain visibly marked as unverified for the owner’s M/W. Danila’s future interior photographs should replace these references.

The Robotron default now bundles S550, the 287 CAS PROM and the original TOS/M 1.0 disk decoded from `A92V010A.TD0` in the pinned FPGA reference release. SHA-256 identities and conversions are recorded in `src/robotron-media.json`; every browser load checks them before configuring the core. The alternative archived raw disk is not used because its PIP is damaged. This historical reference configuration is not yet matched to the physical specimen. The original DAC diagnostic remains available, alongside local file loading. Disk writes remain opt-in and affect only the session copy.

Historical media is excluded from DAC’s MIT licence and has its own source/rights notice. The [Zander archive](https://www.sax.de/~zander/pc1715/pc_bin.html) documents S550 and the CAS PROM for PC1715W. Public download availability and age do not establish a redistribution licence; none has been established here. Bundling does not relicense the binaries or represent a legal determination of their status.


The reference interior now includes dimensioned TEAC FD-55FV bodies (146 × 203 × 41.3 mm), mechanisms, mounting bracket, logic boards, photo-aligned raised packages/leads, PSU shield, fan, ribbons and wiring. The open-case control moves the lid and monitor up/back together without hiding them. Camera presets preserve this state, and the separate-parts control independently lifts drives and keyboard parts while hiding disconnected cables. The open-case Drives preset gives a close view of the mechanisms. The shielded PSU circuitry remains unmodeled. The monitor now contains a reference CRT funnel and neck, yoke, windings, support frame, vertical photo-backed board, neck board, shielding and cables; its exact board revision remains unverified. Component and wiring positions beyond the documented drive envelope are estimates, not an electrically validated assembly. Five further owner photos supplied 2026-10-10 document the running CRT/front panel and correct the power label to POWER. They contain no exposed PCBs, so the comparative board photo credits remain in place.


The application embeds a SHA-256-derived model revision at build time and requests the manifest and owner textures with that revision in their URLs. STL meshes and comparative PCB photos use their individual content hashes. This prevents GitHub Pages’ ten-minute cache from combining new application code with an older exterior-only manifest or older geometry. The manifest is additionally revalidated, and an integration test simulates the stale unversioned manifest. Opening the case and lifting assemblies are separate controls; camera selection does not close either one, and credits remain visible while the case is open.


The monitor shell exports as separate lower and upper meshes. Its opening control is independent of the system-unit lid and assembly lift. The upper shell rises while the CRT, frame and board remain installed; opening the system unit translates the complete monitor together with its cover. Robotrontechnik’s K7222.25 interior and board photos supply provisional evidence and visible attribution, with a separate photographic notice. This addresses the previously empty monitor and does not claim the specimen’s exact unseen board revision.

Owner drive photos now identify the K5601 plate (044713), Ratan assembly sticker and two different TEAC sensor boards. The model uses distinct PCB outlines and small photo labels with source quadrilaterals in canonical `drive-labels.json`; it does not project whole mechanisms as textures. Drive labels move with the lifted drive assembly and remain hidden inside the closed case. The Drive labels view opens the case and lifts the drives for rear inspection. The cable-obscured country line is typeset; all other label print is photographic.
