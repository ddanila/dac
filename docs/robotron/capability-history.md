# Robotron reference workflows

Current behavior and limitations live in the [capability matrix](capabilities.md).
Use [git history](https://github.com/ddanila/dac/commits/main/) for release changes;
retained JSON reports identify the builds and inputs they tested.

## Keyboard mapping

`s600-matrix-audit.json` records reference S600 contact/modifier observations and
the ROM hash. Generate it with `robotron-keyboard-rom-test s600.bin --audit` in the
core repository. `keyboard-legends.json` compares those results with model labels.
Neither identifies the museum's replacement EPROM. Preserve specimen labels;
do not substitute host auto-repeat for the firmware's REP behavior.

## Preservation archive

Build with `DAC_BASE=/ npm run build`, then run:

```sh
python3 scripts/package-preservation.py /path/to/dac-preservation.zip
```

The archive includes a localhost server, file hashes, built assets, media notices
and available archived cores. Optional third-party comparison photos are not
mirrored. Browser-local sessions must be exported separately.

See [model maintenance](../../MODEL-HISTORY.md) for runtime preservation and native
replay, and [emulation qualification](emulation-qualification.md) for independent
reference comparisons.
