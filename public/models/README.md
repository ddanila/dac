# Museum models

Robotron assets are imported from the canonical
[CAD model](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m).
`robotron-1715m/source.json` pins imported revisions and file hashes;
`model.json` describes meshes, materials and display placement. Edit canonical
sources and regenerate before synchronizing:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
npm run build
npm test
```

The [controller workflow](../../docs/robotron/keyboard-controller-progress.md)
covers its additional KiCad and emulator dependencies. Downloads include editable
sources and required licences; `downloads.json` records archive hashes and sizes.

## Evidence and rights

The Robotron assembly combines documented dimensions, owner photographs and
separately credited comparison sources. It is a reconstruction, not a scan or a
manufacturing model. Hidden construction, materials and mechanical interfaces
retain the estimates and limits recorded in canonical evidence. Board artwork
from photographs does not establish connectivity; the keyboard controller's
native copper has separate route evidence. Original-photo comparison views
provide context without adding evidence.

Original model code and Danila’s photographs are MIT licensed. Imported KiCad
component models and derived meshes retain their file-specific GPL-3.0-or-later
or CC BY-SA 4.0 licences and applicable design/library exceptions. Preserve the
licences and credits under `robotron-1715m/components/kicad/`. Comparative
photographs and historical documents retain their original rights, including
when used in derived artwork.

Juku and VJUGA use provisional geometry from `src/scene.js`. Their monitor ring
comes from the [measured ring model](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m/display-base-ring);
physical fit remains unverified. Current geometry and evidence belong in source
artifacts; release history belongs in git.
