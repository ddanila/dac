# Disk inspection

Choose **Explore disk A/B** or click a modeled diskette to inspect the mounted
session image. Select a file to highlight its allocation, then select a sector or
use the cylinder, side and sector controls. Click a hex byte or use arrow keys to
inspect its address and file/allocation context. Map and text zoom independently.

## Interpreting the image

The **TOS/M reference filesystem** profile is an explicit interpretation, not
automatic detection. **Raw sectors** disables it. Incompatible geometry or an
inconsistent directory falls back to sectors without file ownership. Unallocated
space appears blank in the filesystem view; stored bytes are never erased.

CP/M file lengths have record precision. **Download file** reconstructs extents
in file order, including fragmented blocks and user areas, and preserves record
padding and Ctrl-Z markers. Missing extents prevent a complete download rather
than silently filling holes. **Preview file** supports text and hex; its preview
limit does not limit the downloaded file. **How this file is allocated** links
directory entries, extents, blocks and sectors.

Raw images use the emulator's CHS ordering; DSK images retain their headers and
stored sector order. Image offsets and payload offsets therefore differ. The
[parser](../../src/disk-map.js) owns supported layouts, geometry and format limits.
The filesystem interpretation follows the
[CP/M alteration guide](https://www.gaby.de/cpm/manuals/archive/cpm22htm/ch6.htm).

## Live snapshots and comparisons

Live updates copy the worker disk at command boundaries while the dialog is open.
Uncheck **Live updates** to freeze or choose **Refresh** for another snapshot.
Closing the dialog stops polling, without pausing or modifying the guest.

Pink highlights and changed-file lists show differences between snapshots, not
every write. Writes followed by restoration between samples can be missed;
unallocated-to-unallocated changes are ignored. Disk replacement can also produce
differences. For a stable comparison, use
[saved baselines](inspection-and-checkpoints.md#persistent-disk-comparisons).

## Track overlay

**Show track in drive** displays a track ring and nominal contact point. It follows
the disk's inspection position without commanding a seek. Clear it from the
explorer. Radii and pitch follow the canonical model and
[TEAC reference](https://retrocmp.de/fdd/teac/TEAC_FD55-FV.pdf#page=10).
Track gaps use the core's reference layout, not recovered magnetic timing; clicking
a gap does not select a nearby payload sector.

Implementation: [explorer](../../src/disk-explorer.js) and
[core disk adapter](https://github.com/ddanila/dac-emulation/blob/main/machines/robotron1715m/disk.c).
