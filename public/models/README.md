# Museum models

`robotron-1715m/` is imported from the canonical [OpenSCAD model in 3d-models](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m). Its `source.json` pins the source commit and SHA-256 of every imported file. `model.json` carries separate mesh names, materials, photo UVs and a live-screen anchor. Original model code and Danila’s photographs are MIT licensed. Imported KiCad component models and derived meshes retain their file-specific GPL-3.0-or-later or CC BY-SA 4.0 licences with the applicable design/library exception; the upstream collection licence and credits are also retained in `robotron-1715m/components/kicad/`. Reference photographs and historical documents retain their original rights.

The original Robotron manual supplies nominal dimensions; Danila’s ruler photograph supplies approximately 20 mm key pitch. The assembly is a photo-based reconstruction, not a scan or a manufacturing model. Version 3 models the physical features instead of displaying full-face photographs: dished keycaps with transparent transcribed legends, recessed drive faces and latches, four keyboard feet with metal inserts, bottom plate, slotted fasteners, cable grommet and one continuous cable. Paint, plastic, metal, rubber and glass have distinct materials with fine procedural grain in model millimetres. Only the small original wordmark remains a masked photo crop. Reference JPEGs remain separate evidence. Individual features, wall thickness and unseen surfaces remain estimates. See the source model README for evidence and limits.

To update after exporting/committing the canonical model:

```sh
python3 scripts/sync-robotron-model.py ../3d-models
npm run build
npm test
```

Juku and VJUGA still use the provisional geometry in `src/scene.js`. Their `monitor-ring.stl` comes from Danila’s [measured ring](https://github.com/ddanila/3d-models/tree/91fee04af5042fc01c49ecc6ba33edec52d20594/models/robotron-1715m-display-base-ring): 175 mm OD, 3 mm radial wall, 5 mm high. The editable ring now lives [inside the Robotron folder](https://github.com/ddanila/3d-models/tree/main/models/robotron-1715m/display-base-ring). Physical fit is unverified.

The Robotron version 11 export separates the two logic boards for independent
inspection. Package seating-plane coordinates drive drilled apertures, pads and
solder fillets; derived KiCad footprint metadata retains each model's licence.
Runtime thresholding extracts light PCB artwork from the credited original
photos and removes photographed board illumination. This derived display
retains the photo attribution and rights exclusions. Three yellow film
capacitors, varied electrolytic sizes and divided connector housings follow
comparative photo evidence; exact values, sockets, keying and pin counts remain
unverified. Underside routing is deliberately absent pending evidence.
