# Checkpoints and inspection tools

## Named checkpoints

Open **Named checkpoints**, enter a name, and save the running machine. CPU/device
state and both disk images are copied synchronously at one worker boundary before
checksumming or storage. Export a collection backup before deleting older
checkpoints. Each state and each nested disk has a checksum.

Restoration requires the same machine and firmware. It builds and validates a
candidate machine with matching disks before replacing the running session. A
pinned older core is loaded when necessary. Restoration opens private copies,
turns off **Remember disk changes**, and leaves library disk records intact.
Checkpoints are included in collection backup preview/selective restore. Custom
firmware remains supplied separately. A checkpoint is distinct from the existing
single quick-save slot and from input recordings.

Individual `.daccheckpoint` files can be renamed, exported and imported. Import
adds an entry without restoring it. Compatibility preview checks machine, firmware
and core availability; custom firmware bytes are not embedded. Pending or damaged
entries cannot be restored or exported but remain deletable. Restore revalidates
the payload, and collection import is atomic.

## Graphics recovery, cuts and sharing

A lost WebGL context displays a notice while the emulator continues. Rendering
and component close-ups resume when graphics recover. If the notice remains,
save/export machine state before reloading.

**Section view, sharing and navigation** provides X/Y/Z cuts, a position slider and
a reverse-side option. Combine a cut with **Isolate assembly**. Cuts apply to model
materials, including shadows; hit testing and label occlusion ignore cut-away
surfaces. Optional [cutaway caps](inspection-workbench.md#cutaways) close supported
contours for display; they do not change canonical OpenSCAD geometry.

**Copy inspection link** includes camera/target, selected component and assembly,
cover controls, labels and section settings in the URL fragment. It includes no
machine state, media, firmware or local file names. Valid settings are restored
when the model is ready. A selectable link is provided if clipboard access fails.

Enable **Use keyboard to inspect the 3D view**, then focus the view: arrows orbit,
+/− zoom, and Home returns to the overview. These events do not reach guest input.
Screen focus still types into the machine. Buttons and selectors inside the view
also keep their native keyboard semantics.

## Triggered event capture

**Explore the circuits** can capture immediately or wait for an I/O read/write,
memory write, DMA access or interrupt acknowledge. Ports match their low byte;
memory addresses are 16-bit bus addresses, with mapped RAM offsets retained in
the event row. Choose an event/master filter and pre-trigger history. The
triggering event is always included, even if it does not match the display filter.
Capture stops when its bounded buffer fills. **Stop capture**
retains partial data; **Show captured events** reports progress and trigger index.
Exports contain settings, status, trigger index and cycle-stamped rows. Preserved
cores without the new API report that limitation instead of silently arming.

## Persistent disk comparisons

In **Explore disk contents → Compare with a saved baseline**, choose the original
loaded image, the current snapshot, or a disk from a named checkpoint. A library
disk uses its retained original. For a restored checkpoint, “original” means its
restored image. Baselines persist per drive across dialog closes and browser
reloads and are included in collection backups. Replacing/moving disks does not
silently replace a comparison baseline; select a new one intentionally.

**Compare now** captures a report with image hashes, sizes, all changed-byte counts,
compatible-layout sector/directory changes and added/deleted/modified TOS/M files.
Byte ranges include unallocated space. File comparisons retain 128-byte CP/M
record padding. Different geometries or unsupported filesystems fall back to byte
comparison with an explanation. Preview and export bound the listed byte ranges and explicitly mark truncation;
the changed-byte count is never truncated. Neither image is modified.
