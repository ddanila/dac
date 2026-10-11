export function componentDetail(name) {
  if (
    /^drive-(frames|mechanisms|motors|boards|contacts|coils|traces|power|spindle|head|clamp|latch|board-components)/.test(
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
