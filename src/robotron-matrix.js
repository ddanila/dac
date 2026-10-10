// K7658 reference wiring: Zander 56-330-4103-7 matrix coordinates, checked
// against S600 output. Key IDs refer to the current specimen model layout.
// S600 is a reference layout: some printed shifted legends differ.
const coordinates = [
  [8, 2],
  [7, 2],
  [2, 2],
  [1, 2],
  [0, 2],
  [11, 2],
  [12, 2],
  [6, 2],
  [9, 2],
  [10, 2],
  [4, 2],
  [3, 2],
  [5, 2],
  [8, 6], // E15 / REP (the adjacent bit 3 is unwired)
  [8, 7],
  [8, 0],
  [7, 0],
  [2, 0],
  [1, 0],
  [0, 0],
  [11, 0],
  [12, 0],
  [6, 0],
  [9, 0],
  [10, 0],
  [4, 0],
  [3, 0],
  [5, 0],
  [12, 6],
  [5, 6],
  [6, 6],
  [8, 5],
  [7, 5],
  [2, 5],
  [1, 5],
  [0, 5],
  [11, 5],
  [12, 5],
  [6, 5],
  [9, 5],
  [10, 5],
  [4, 5],
  [3, 5],
  [5, 5],
  [8, 1],
  [7, 4],
  [5, 4],
  [2, 4],
  [1, 4],
  [0, 4],
  [11, 4],
  [12, 4],
  [6, 4],
  [9, 4],
  [10, 4],
  [4, 4],
  [8, 4],
  [12, 1],
  [3, 4],
  [12, 7],
  [5, 7],
  [6, 7],
  [12, 3],
  [5, 3],
  [6, 3],
  [3, 3],
  [3, 7],
  [6, 1],
  [4, 7],
  [4, 6],
  [10, 1],
  [7, 6],
  [2, 6],
  [1, 6],
  [7, 7],
  [2, 7],
  [1, 7],
  [7, 3],
  [2, 3],
  [1, 3],
  [7, 1],
  [2, 1],
  [1, 1],
  [10, 3],
  [0, 6],
  [0, 7],
  [0, 1],
  [10, 6],
  [10, 7],
  [11, 6],
  [9, 6],
  [11, 7],
  [9, 7],
  [11, 3],
  [9, 3],
  [11, 1],
  [9, 1],
];
export function matrixKey(key) {
  const n = Number(key?.id?.replace("key-", ""));
  const c = coordinates[n];
  return c ? c[0] * 8 + c[1] : undefined;
}
export function createFirmwareKeyboard({
  send,
  onFeedback,
  onState,
  isPowered,
}) {
  const state = { shift: false, ctrl: false, caps: false };
  const report = () => onState({ ...state });
  return {
    state,
    reset() {
      state.shift = state.ctrl = false;
      report();
    },
    leds(bits) {
      const caps = !!(bits & 2);
      if (state.caps !== caps) {
        state.caps = caps;
        report();
      }
    },
    activate(key) {
      if (!isPowered()) {
        onFeedback("Power on the computer to type.");
        return false;
      }
      const n = matrixKey(key);
      if (n === undefined) return false;
      const mod = key.input.modifier;
      if (mod === "shift" || mod === "ctrl") {
        state[mod] = !state[mod];
        report();
        onFeedback(`${key.label} ${state[mod] ? "on" : "off"}`);
        return true;
      }
      send({
        type: "tap",
        key: n,
        modifiers: Number(state.shift) | (Number(state.ctrl) << 1),
      });
      onFeedback(`Sent ${key.label}`);
      state.shift = state.ctrl = false;
      report();
      return true;
    },
  };
}
