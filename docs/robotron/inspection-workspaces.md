# Portable inspection views and staged covers

- Case cover, fascia, markings and the entire monitor lift first, then translate
  rearward. The monitor upper shell separately lifts before moving forward.
  Attachments and illustrative cable endpoints follow each frame. Reversing a
  toggle reverses the route; reduced motion jumps directly to the final pose.
- `3d-models/inspection-paths.json` is the source of both animation and sampled
  collision checks. The audit samples case attachments against PSU/logic solids and the monitor
  upper shell against tube/chassis/components. See its report for coverage. These are
  museum inspection routes, not a physical disassembly instruction. Fasteners,
  all-pairs collision coverage, continuous sweeps and real cable slack remain
  outside the claim. Existing cable checks retain their explicit entry exceptions.
- Save up to 20 named inspection views under **Section view → Saved inspection
  views**. Each includes camera, opened covers, isolation, cutaway settings,
  component selection and the current two-point measurement. Restore checks the
  model identity. Selection and new measurements survive page reloads.
- Named measurements and saved inspection views are included in collection backups,
  with the same preview/conflict/atomic-merge handling as existing records.
  The last unsaved view and unsaved measurements are not collection records.
  Individual measurement JSON export remains supported. Legacy measurement
  records can resolve a uniquely named part if its old numeric index moved.
- **Find a component** searches loaded mesh names/titles, focuses and outlines
  the selection, and can reveal it through transparent covers. Selection does
  not alter the emulator. Clear highlight or reset the view to remove it.
- Evidence mode has a persistent viewport legend and a loaded-mesh audit.
  Coverage gaps and ordered rule overlaps remain visible in the report. Display-controller geometry uses its own source photo.
  Sheet thickness is distinguished from estimated bends/placement. Generated
  meshes may remain unmapped; neither a matching rule nor a colour certifies
  dimensional accuracy or physical print verification.

See [emulation qualification](emulation-qualification.md) for runtime checks, and
the canonical motion report for sampled geometry coverage.
