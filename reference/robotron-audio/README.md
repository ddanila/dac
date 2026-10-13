# Robotron specimen recordings

Danila recorded these sounds from the museum's Robotron; contributed under MIT.
Original `boot.aiff` and `keypresses.aiff` are retained here. These exports are
44.1 kHz stereo **8-bit** PCM: encoding the derived files as 16-bit does not add
source detail. We have not replaced the recording with synthesized fan/key sounds.

`python3 scripts/prepare-robotron-audio.py` reproduces the browser WAVs with ffmpeg.
`public/audio/robotron/provenance.json` records source hashes, exact cuts and filters.
The power-on clip includes the switch click and fan startup; a steady section loops
until shutdown, which plays the recorded off-click and coast-down. The loop has a
150 ms wrap crossfade. Original timing is retained; startup is about 22 seconds.

Key groups confirmed by Danila: three regular keys, three Space presses, then three
Enter presses. All three takes per group rotate deterministically. Each sample
contains the recorded press/release gesture; release timing is not independently
synchronized to the visitor's key-up. Physical repeat does not replay the sound.
Samples are mono 22.05 kHz PCM16 with modest high-pass filtering, fixed gain and
short edge fades. No pitch shifting or invented mechanical detail is added.

The **Machine sounds** checkbox opts into these recordings plus existing synthetic
floppy sounds. Robotron recordings only follow the Robotron power/input paths.
Mute, hidden tabs and machine changes stop pending/current samples; returning to
an already-powered machine resumes steady fan sound rather than another boot.
Enabling sound midway through a running machine also starts the steady loop.

The keyboard exterior CAD at `ddanila/3d-models` commit `cf7e113` was accepted by
Danila as the current visual baseline on 2026-10-13. Internal details remain work
in progress. This audio update does not regenerate or publish new museum meshes.
