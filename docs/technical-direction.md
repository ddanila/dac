# Technical direction

These are initial proposals, not committed implementation choices.

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

Initial source inspection: 2026-10-09. No emulator build or boot has been tested for DAC yet.

[MAME’s Robotron driver](https://github.com/mamedev/mame/blob/master/src/mame/robotron/rt1715.cpp) includes separate PC-1715 and PC-1715W configurations. At inspection, `rt1715w` is flagged with imperfect graphics; the base `rt1715` and Latin/Cyrillic `rt1715lc` configurations are marked not working. Driver availability is a starting point, not validation of Danila’s machine. Confirm which configuration matches the 1715M exhibit before selecting it.

[MAME’s build documentation](https://docs.mamedev.org/initialsetup/compilingmame.html#emscripten-javascript-and-html) describes Emscripten browser builds and selecting a subset of drivers. [Emularity](https://github.com/db48x/emularity) provides a browser emulator loader. These are candidates for reuse; integration, video transfer, input fidelity, build size, and browser behavior require a practical spike.

First prove boot and keyboard behavior with a pinned native emulator build. Then test an equivalent browser build before investing in a finished 3D scene. Record the upstream revision, build recipe, firmware and media hashes, browser versions, results, and known limitations so the exhibit can be reproduced years later.

## Decisions to make after the spike

- Emulator choice and whether DAC needs maintained upstream patches.
- Adapter API and how to expose live video without excessive copying.
- Model tooling, detail budgets, and browser/device support targets.
- Emulator binary and large-asset storage and delivery.
- Firmware/media sources and distribution permissions.
- Separate licensing choices for DAC code, original models, photographs, and exhibit text; preserve upstream component licenses.
- Visitor disk persistence, reset behavior, and export of modified media.

The first acceptance test is a repeatable cold boot into an interactive system from the 3D power control, with readable live video and reliable input while the model remains inspectable. Start with a simple model and improve its physical fidelity after that path works.
