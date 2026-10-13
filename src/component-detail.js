export function componentDetail(name) {
  if (name.startsWith("drive-diskette")) return "diskette";
  if (/^keyboard-(controller-|insulators|matrix-artwork)/.test(name)) return "component-keyboard";
  if (name.startsWith("rear-")) return "back";
  if (["monitor-under-controls", "monitor-stand-metal"].includes(name)) return "monitor";
  if (name === "system-foot-metal") return "under";
  if (name.startsWith("drive-head-")) return "focus-head";
  if (name.startsWith("drive-spindle-")) return "focus-spindle";
  if (/^drive-(clamp|latch)-/.test(name)) return "focus-clamp";
  if (
    /^drive-(frames|mechanisms|motors|boards|contacts|coils|traces|power|cable-plugs|spindle|head|clamp|latch|board-components)/.test(
      name,
    )
  )
    return "component-drives";
  if (name.startsWith("logic-")) return "component-logic";
  if (/^(psu-|fan-)/.test(name)) return "component-psu";
  if (
    [
      "keyboard-pcb",
      "keyboard-switches",
      "keyboard-guides",
      "keyboard-contact-pads",
      "keyboard-rubbers",
      "keyboard-plate",
      "keyboard-springs",
      "keyboard-stems",
    ].includes(name)
  )
    return "component-keyboard";
  if (
    /^(tube-|monitor-(yoke|coils|chassis|boards|components|capacitors|shield|wires|fasteners|passives|socket))/.test(
      name,
    )
  )
    return "component-crt";
}
