# Keyboard controller circuit simulation

Use ngspice/XSPICE coupled to Icarus Verilog for the reference controller. KiCad
owns connectivity; generated decks and HDL consume it. OpenSCAD displays physical
geometry and evidence. Standard S600 firmware permits reference qualification
without the museum's replacement-ROM dump or timing measurements.

The [plan](keyboard-controller-plan.md) owns scope and next steps. The
[requirement audit](keyboard-controller-verification.md) owns remaining proof.
The core's [analog operating guide](https://github.com/ddanila/dac-emulation/blob/main/verification/robotron-keyboard/analog/README.md)
owns build instructions, commands, runtime constraints and retained report links.

## Tool decision

[ngspice](https://ngspice.sourceforge.io/docs.html) provides electrical simulation
and XSPICE's HDL interface; [Icarus](https://github.com/steveicarus/iverilog) runs
the generated board wiring and independently maintained chip/CPU models. This
keeps the circuit tied to the native schematic and makes automated comparisons
and failure capture possible.

[Xyce](https://xyce.sandia.gov/documentation-tutorials/) is useful as an independent
solver for isolated electrical circuits and recorded-supply replay. Agreement
between solvers is evidence about a numerical result, not device calibration.
KiCad's simulator and [Qucs-S](https://ra3xdh.github.io/) provide useful inspection
interfaces; changing the interface does not supply missing device characteristics.
Other simulators remain options if they answer a specific unresolved modeling or
solver question. A broad tool survey is not an implementation dependency.

## Qualification boundaries

| Layer | What it establishes | What remains separate |
| --- | --- | --- |
| C/HDL digital comparisons | Reference transactions and firmware-visible behavior within declared digital boundaries | Exact CPU cycles, physical routing and analog validity |
| Virtual BR service simulation | Firmware and electrical interfaces with externally supplied CPU clock/reset, including the experimental host-buffer path | Host device/loading qualification, onboard oscillator/reset startup and closed-board behavior |
| Closed-board mixed-signal simulation | Executable coupled oscillator, reset, matrix and output circuits, including the experimental host receiver | Full-board phase, voltage, bus, startup and scenario qualification |
| Supply-dip diagnostics | Modeled reset/clock response to an explicit supply waveform | Reliable firmware restart and specimen brownout behavior |

Consult the core's retained reports for configuration-specific results. Functional
serial agreement does not waive clock-phase, receiver-voltage or reset-recovery
failures. The [requirement audit](keyboard-controller-verification.md) records
which remaining findings affect plan completion.

## Model evidence and acceptance

Published DC and switching limits can constrain useful models without specimen
measurements. Preserve test conditions, selection groups, input/output loading
and the distinction between DC and AC gain. Fit against device evidence, validate
against independent conditions where possible, and test supported parameter
ranges. Matching the emulator's oscillator frequency is not model validation.

A vendor model is not automatically applicable to the installed device. Review
pin roles, logic family, load conditions and redistribution terms; keep restricted
vendor inputs local. Nominal fixtures and conservative timing envelopes must
remain labelled as such.

Qualify numerical convergence, device applicability, firmware behavior and exact
specimen agreement separately. Preserve full source precision and runtime hashes;
reject solver diagnostics, incomplete captures and invalid receiver levels even
when firmware output agrees. Investigating startup uncertainty must not silently
change acceptance budgets, align away phase errors or discard failing startup.
