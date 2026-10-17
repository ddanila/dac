# Reference-board circuit simulation

Use standard S600 firmware and the published Zander circuit as the executable
reference profile. Missing specimen ROM, dimensions and continuity measurements
must not block this work. Keep specimen reconstruction and later calibration
separate. A complete board model means every component has an explicit electrical
or digital model; it does not mean every IC is simulated transistor by transistor.

## Engine decision

Use **ngspice/XSPICE plus Icarus Verilog** as the first integration candidate.
Keep KiCad as the connectivity authority, generate the SPICE and HDL interconnect,
and retain OpenSCAD as the geometry consumer. Do not hand-maintain a second circuit.

The [ngspice manual, section 10.3](https://ngspice.sourceforge.io/docs/ngspice-manual.pdf)
documents `d_cosim` with Icarus and Verilator. Icarus needs `libvvp` built with
`--enable-libvvp`; its ordinary executable alone is insufficient. Build the shared runtime and bridge using the analog harness README; packaged
bridges need not expose the required registration symbols correctly.
Qualify time synchronization, X/Z states, bidirectional buses and feedback before
calling the coupled simulation complete. [Verilator's language guide](https://verilator.org/guide/latest/languages.html)
describes tri-state conversion and timing limitations that need explicit review.

| Tool | Role and assessment for this board |
| --- | --- |
| [ngspice/XSPICE](https://ngspice.sourceforge.io/xspice.html) | Preferred analog solver and mixed-signal scheduler; existing HDL can be coupled rather than rewritten. |
| [KiCad simulator](https://www.kicad.org/discover/spice/) | Familiar graphical inspection using ngspice; preserve native schematic ownership. |
| [Qucs-S](https://qucs-s-help.readthedocs.io/en/latest/overview/choosing-a-sim-backend.html) | Alternative GUI for ngspice/Xyce; another frontend, not an independent solver. |
| [Xyce](https://xyce.sandia.gov/files/xyce/AppNote-MixedSignal.pdf) | SPICE alternative with documented external/Icarus interfaces; validate current build compatibility before adopting the older integration examples. |
| [WRspice](https://www.wrcad.com/manual/wrsmanual/node73.html) | Built-in Verilog/SPICE integration; existing HDL compatibility would need testing. |
| [GNUCAP](https://www.gnu.org/software/gnucap/gnucap-man-html/gnucap-man003.html) | Open mixed analog/digital alternative; integration effort is less directly aligned with our existing harness. |
| [QSPICE](https://www.qorvo.com/design-hub/calculators-simulation/qspice) | Strong alternative with C++/Verilog support; official desktop requirements are Windows. |
| [LTspice](https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html) | Useful independent analog subcircuit check; not the selected existing-HDL integration route. |
| [TINA](https://www.tina.com/blog/mixed-mode-simulation-in-tina-and-tinacloud-spice-hdl-mcu-co-simulation/) / [Proteus](https://www.labcenter.com/simulation/) | Commercial mixed-mode environments. Confirm CPU/HDL support and automation before purchase; generic MCU support does not establish Z80 compatibility. |
| [Cadence AMS](https://support1.cadence.com/public/docs/content/20466887.html), [Synopsys AMS](https://www.synopsys.com/implementation-and-signoff/custom-design-platform/multiphysics-ams.html), [Questa ADMS](https://static.sw.cdn.siemens.com/siemens-disw-assets/public/1EHxPDT6WcqjXRx8aGYiYM/en-US/Siemens%20SW%20Questa%20ADMS%20FS%2080836%20C1.pdf) | Commercial alternatives if suitable licences already exist; not required to start this board. |
| [SystemC AMS](https://www.accellera.org/images/downloads/standards/systemc/Accellera_SystemC_AMS_Users_Guide_January_2020.pdf) | System-level continuous/discrete modeling; its electrical linear networks do not replace nonlinear transistor SPICE models. |
| [MAME netlist](https://github.com/mamedev/mame/tree/master/src/lib/netlist) / [CircuitJS](https://www.falstad.com/circuit/) | Candidates for interactive museum circuit presentation. Evaluate separately from the reference qualification backend. |

This is a survey of relevant tool families, not an exhaustive catalogue or a claim
that every candidate has been installed and validated.

## Implementation order and acceptance

1. Generate analog passive/transistor wiring from the existing normalized KiCad
   connectivity. Assign each component to a model or an explicit remaining gap.
   Preserve pin/net IDs; physical package pad placement is a separate question.
2. Model reset, oscillator, row sensing, open-collector outputs, supply decoupling,
   LEDs and cable/filter loading. Obtain source-backed device parameters where
   available; expose nominal surrogates and sensitivity ranges where unavailable.
   Do not tune nominal models merely to reproduce the emulator's chosen clock.
3. Couple voltage/current domains to digital pins with specified thresholds,
   hysteresis, input loads and output impedance. Model release/high impedance and
   contention. Verify time ordering and timestep convergence in both directions.
4. Run TV80 with standard S600 using the simulated oscillator and power-on reset;
   close BR1/BR2 normally. Exercise contacts, modifiers, repeat, release, brownout
   and reset, and retain serial, LED and internal-node traces. Virtual isolation
   remains an additional service test, not the normal source of clock/reset.
5. Compare the reference waveform behavior with the production emulator. Report
   logical differences, CPU phase differences and analog-model uncertainty
   separately. Keep fast digital/analog smoke checks in CI and longer firmware,
   corner and convergence sweeps in a separate qualification target.

Acceptance requires a reproducible full-board run with no silent component
omissions, explicit model provenance, stable timestep results and retained failure
traces. An exploratory BJT model is useful progress but cannot establish absolute
SC308/SC236 accuracy. Measurements improve calibration rather than gate software
implementation.

## Runnable experiments

Commands and model assumptions live in the
[analog harness README](https://github.com/ddanila/dac-emulation/tree/main/verification/robotron-keyboard/analog).
Generated decks, reports and failure traces stay in `build/`.

| Entry point | Scope |
| --- | --- |
| `sense_probe.py` | DC sensing front end with common row stimulus. |
| `matrix_probe.py` | Contact fixture, column scanning and electrical sensing, followed by generated HDL latch/bus checks. |
| `matrix_cosim.py` | Live HDL column-drive / SPICE contact-sense / HDL latch feedback with a bus fixture. |
| `reset_probe.py` | Electrical reset, power cycling, BR2 isolation and timestep checks. |
| `oscillator_probe.py` | RC oscillator topology, BR1 isolation, timestep and capacitor sensitivity. |
| `build_bridge.py` / `bridge_probe.py` | Reproducible ngspice–Icarus bridge and explicit sink-enable transport. |
| `make test-keyboard-coupled-boot S600_ROM=/path/to/s600.bin` | TV80/S600 driven by electrical clock/reset with BR1/BR2 closed. `boot_cosim.py --electrical-matrix` also enables live electrical matrix feedback; output loading remains digital. |

Semiconductor, gate and load parameters remain explicit nominal assumptions, not
specimen calibration. The matrix fixture is diode-free; its phantom-row conduction
does not establish the specimen's key construction. The static mapping check and live bus-fixture test are separate from firmware
qualification. Full boot and scenario results remain required before claiming
complete firmware-driven feedback.

Direct Z transport through `bidi_bridge` fails timestep refinement locally; use
the tested explicit sink-enable interface. The nominal reset model also fails to
produce a useful pulse with a 10 ns supply ramp. These are retained qualification
issues, not reasons to block implementation on missing specimen evidence.

The existing `qualify-keyboard-controller` target retains the independent standard
S600 digital comparison. None of these partial checks alone establishes complete
mixed-signal board qualification.
