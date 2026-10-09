// This translates visitor gestures into the existing byte-oriented core API.
// Physical key codes come from the model manifest, sourced to manual pp.9–11.
export function createRobotronKeyboard({
  send,
  isPowered,
  onState,
  onFeedback,
}) {
  const state = { shift: false, ctrl: false, caps: false };
  const report = () => onState({ ...state });
  function reset() {
    for (const name of Object.keys(state)) state[name] = false;
    report();
  }
  function activate(key, host = {}) {
    if (!isPowered()) {
      onFeedback("Power on the computer to type.");
      return false;
    }
    const input = key.input;
    if (input.modifier) {
      state[input.modifier] = !state[input.modifier];
      report();
      onFeedback(`${key.label} ${state[input.modifier] ? "on" : "off"}`);
      return true;
    }
    if (input.unsupported) {
      onFeedback(`${key.label}: ${input.unsupported}`);
      return false;
    }
    const shift = state.shift || !!host.shift,
      ctrl = state.ctrl || !!host.ctrl;
    if (shift && input.shiftUnsupported) {
      onFeedback(`${key.label}: the shifted legend is not mapped yet.`);
      return false;
    }
    let code = input.code;
    if (input.letter) {
      code = shift !== state.caps ? input.shiftCode : input.code;
      if (ctrl) code = input.shiftCode & 31;
    } else if (shift && input.shiftCode !== undefined) code = input.shiftCode;
    // The core queues bytes immediately on key-down. Key-up does not add a byte.
    send({ type: "key", key: code, down: true });
    send({ type: "key", key: code, down: false });
    onFeedback(`Sent ${ctrl ? "Ctrl + " : ""}${key.label}`);
    state.shift = state.ctrl = false;
    report();
    return true;
  }
  return { activate, reset, state };
}
