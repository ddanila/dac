# Portable inspection views and staged covers

This update retains emulator 0.15.0 and canonical geometry v48. No STL shapes or
print-verification statuses change.

- Case cover, fascia, markings and the entire monitor lift first, then translate
  rearward. The monitor upper shell separately lifts before moving forward.
  Attachments and illustrative cable endpoints follow each frame. Reversing a
  toggle reverses the route; reduced motion jumps directly to the final pose.
- `3d-models/inspection-paths.json` is the source of both animation and sampled
  collision checks. The expanded audit covers 287 poses: seven pairs at 41
  positions, including case attachments against PSU/logic solids and monitor
  upper shell against tube/chassis/components. Straight translations intersected
  these contents; the staged translations clear the tested solids. These are
  museum inspection routes, not a physical disassembly instruction. Fasteners,
  all-pairs collision coverage, continuous sweeps and real cable slack remain
  outside the claim. Existing cable checks retain their explicit entry exceptions.
- Save up to 20 named inspection views under **Section view → Saved inspection
  views**. Each includes camera, opened covers, isolation, cutaway settings,
  component selection and the current two-point measurement. Restore checks the
  model identity. Components use named ancestry rather than asynchronous mesh
  insertion order, so selection and new measurements survive page reloads.
- Named measurements migrate from localStorage into checksummed IndexedDB
  records. They and saved inspection views are included in collection backups,
  with the same preview/conflict/atomic-merge handling as existing records.
  The last unsaved view and unsaved measurements are not collection records.
  Individual measurement JSON export remains supported. Legacy measurement
  records can resolve a uniquely named part if its old numeric index moved.
- **Find a component** searches loaded mesh names/titles, focuses and outlines
  the selection, and can reveal it through transparent covers. Selection does
  not alter the emulator. Clear highlight or reset the view to remove it.
- Evidence mode has a persistent viewport legend and a loaded-mesh audit.
  Canonical coverage maps all 197 exported parts; ordered rule overlaps remain
  visible in the report. Display-controller geometry uses its own source photo.
  Sheet thickness is distinguished from estimated bends/placement. Generated
  meshes may remain unmapped; neither a matching rule nor a colour certifies
  dimensional accuracy or physical print verification.

Validation uses targeted browser checks for saved views across reloads, backup
round trips/conflicts/checksums, stable part identities, motion/reversal/reduced
motion, plus existing inspection and cable checks. Inspection test variants are
included in the visual CI scope. Emulator qualification adds an original tiny
keyboard ROM to the bounded mixed runtime test: matrix press/release, serial K,
LED latches, DMA, seek, printer, V24 and interrupts run together across snapshot
and slice-size comparisons. This exercises the firmware CPU path, not the full
historical S600 program or the owner's unidentified replacement EPROM.
