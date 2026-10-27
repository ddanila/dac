# Classic 1715 + Pico1715 workstation

Choose **Robotron 1715 + Pico1715**, or open `?machine=1715`. Power on and wait for
the fresh `A>` prompt, click the screen, and type `DIR`. The default source-built
CP/M 3 boots through an original public fixture ROM, which bypasses the historical
bootstrap. Local original ROMs (2048 bytes) and 80×2×5×1024 raw disk images
(819200 bytes) can be loaded while powered off. Their identities are shown;
arbitrary historical images are not claimed compatible.

The controller model is the default. The firmware + FPGA RTL option runs the
production service/storage C with a host SD/PSRAM HAL and Verilated frontend.
Both run locally in browser workers. Select a backend while powered off; the
working disk is retained. No local server helper, special HTTP headers or hardware
is needed. The firmware backend may run below real time; achieved speed is shown.
The enclosure is provisional and the 80×24 display renders text memory directly,
not a historically accurate CRT, glyph generator or serial waveform.

## Input and debugging

ASCII, Enter, Backspace, Tab, Escape and Ctrl-letter input are supported while the
screen is focused. Arrow/function-key mappings are not invented. Paste accepts up
to 4096 ASCII characters with normalized newlines. It is paced in emulated clocks,
not wall time, and does not wait for receiver FIFO space. Rejections are visible.
Cancel completes an already-started E0/data pair; Ctrl-C cancels pending paste
before sending the control character. CPU reset cancels all pending host input.
Guest ring counters are shown only while the bundled resident code signature
matches the supplied metadata; custom media has no assumed diagnostic addresses.

Use **Diagnose hardware → Z80 debugger** to pause, step to the next instruction
boundary, inspect registers/disassembly and memory, or stop at an execution
address. Stepping advances all devices and is capped at 100000 clocks. Execution
stops after opcode fetch, before the instruction executes. Memory inspection has
no bus side effects and distinguishes the boot-ROM read overlay from underlying
RAM writes. Live controller and keyboard counters accompany the debugger.
Memory editing, watchpoints and whole-machine snapshots are not available here.
The older 1715M debugger and saved sessions remain separate.

## Keeping work

Writes are opt-in and affect only an in-memory working copy. **Remember working
disk locally** enables checksummed IndexedDB copies. Idle writes are saved after
quiescence; **Save and download disk** makes an explicit portable backup. Saved
identities include backend, original ROM and original disk. After changing
backends, use **Restore saved disk** to select that backend's existing saved copy;
otherwise the current working copy is retained.

Orderly power-off stops the CPU, completes accepted storage writes and saves the
disk before destroying the worker. CPU reset instead exercises the existing reset
contract while retaining RAM/media. Export temporarily advances to an instruction
boundary, drains firmware/storage work and resumes the prior running/paused mode.
Failures retain the last successfully saved copy and display an error. A browser
crash or abrupt tab close can still lose changes since the last completed save.
Discarding saved/working changes requires an explicit confirmation.

## Maintainer build and checks

Pico1715 builds its two modules using the shared classic session and its native
qualification runner. `scripts/sync-pico1715.mjs` checks the artifact hashes and
copies the modules, source-built CP/M media and original notices into
`public/pico1715`. The manifest pins Pico1715, dac-emulation and CP/M revisions and
compiler versions. Dirty runtime builds require an explicit development override.
No historical private ROM is distributed. CP/M and CPU/tool notices accompany
the new MIT code.

The focused `pico1715.spec.js` workflows cover both backends, boot/input, writing,
export/resume, breakpoints, reset/power cycles, saved-copy restoration, invalid
media/input, and persistence/worker failures. They are included in Chromium and
Firefox/WebKit CI. Native/WASM parity and the full CP/M runtime suites are recorded
in the source repositories; passing simulation does not qualify physical hardware.
