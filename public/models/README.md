# Museum models

`robotron-1715m/` is imported from the canonical [OpenSCAD model in 3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). Its `source.json` pins the source commit and SHA-256 of every imported file. `model.json` carries separate mesh names, materials, photo UVs and a live-screen anchor. The model, code and Danila’s photographs are MIT licensed; the linked historical documents retain their original rights.

The original Robotron manual supplies nominal dimensions; Danila’s ruler photograph supplies approximately 20 mm key pitch. The assembly is a photo-based reconstruction, not a scan or a manufacturing model. Version 3 models the physical features instead of displaying full-face photographs: dished keycaps with transparent transcribed legends, recessed drive faces and latches, four keyboard feet with metal inserts, bottom plate, slotted fasteners, cable grommet and one continuous cable. Paint, plastic, metal, rubber and glass have distinct materials with fine procedural grain in model millimetres. Only the small original wordmark remains a masked photo crop. Reference JPEGs remain separate evidence. Individual features, wall thickness and unseen surfaces remain estimates. See the source model README for evidence and limits.

To update after exporting/committing the canonical model:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
npm run build
npm test
```

Juku and VJUGA still use the provisional geometry in `src/scene.js`. Their `monitor-ring.stl` comes from Danila’s [measured ring](https://github.com/ddanila/3d-models/tree/91fee04af5042fc01c49ecc6ba33edec52d20594/models/robotron-1715m-display-base-ring): 175 mm OD, 3 mm radial wall, 5 mm high. Physical fit is unverified.
