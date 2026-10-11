// Use emulated clocks, not wall time: slow/background tabs never dump a backlog.
export function pasteText(text, kind, firmware, map, caps = false) {
  text = String(text).replace(/\r\n?|\n/g, "\r");
  if (!text.length || text.length > 4096)
    throw Error("Paste 1–4096 characters.");
  if (kind === 1) throw Error("VJUGA does not have a keyboard model yet.");
  return [...text].map((c) => {
    const code = c.charCodeAt(0);
    if (firmware) {
      const entry = map[code];
      if (!entry)
        throw Error(
          `The reference keyboard cannot paste ${JSON.stringify(c)}.`,
        );
      return {
        type: "tap",
        key: entry[0],
        modifiers: entry[1] ^ (caps && /[a-z]/i.test(c) ? 1 : 0),
      };
    }
    if (code !== 13 && (code < 32 || code > 126))
      throw Error(
        `Cannot paste ${JSON.stringify(c)}; use printable ASCII and newlines.`,
      );
    return { type: "key", key: code, down: true };
  });
}
export class InputSequence {
  constructor(events, hz) {
    this.events = events;
    this.hz = hz;
    this.index = 0;
    this.remaining = 0;
    this.release = null;
  }
  advance(ticks, send) {
    this.remaining -= ticks;
    if (this.remaining > 0) return;
    if (this.release) {
      send(this.release);
      this.release = null;
      this.remaining = Math.ceil(this.hz * 0.08);
      return;
    }
    if (this.index === this.events.length) return;
    const event = this.events[this.index++];
    send(event);
    this.remaining = Math.ceil(this.hz * (event.type === "tap" ? 0.14 : 0.08));
    if (event.type === "key") this.release = { ...event, down: false };
  }
  get done() {
    return (
      this.index === this.events.length && !this.release && this.remaining <= 0
    );
  }
}
export function clockDebt(previous, now, owed, hz, speed) {
  // Suspend/resume and a slow renderer must not build an unbounded catch-up queue.
  return Math.min(
    hz * 0.1 * speed,
    Math.max(0, owed) +
      ((Math.max(0, Math.min(100, now - previous)) * hz) / 1000) * speed,
  );
}
