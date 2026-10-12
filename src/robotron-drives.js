// Geometry is in millimetres. Track pitch uses the TEAC reference; motor/track
// state comes from the controller. New cores supply authoritative rotational phase.
// Archived cores retain the old illustrative animation. Reduced motion freezes rotors.
export function createDriveMotion(objects, descriptions = []) {
  const drives = descriptions.map((d) => {
    const spindle = objects.get(d.spindle),
      head = objects.get(d.head);
    spindle.geometry.translate(...d.pivot.map((v) => -v));
    const latch = objects.get(d.latch),
      clamp = objects.get(d.clamp),
      headMetal = objects.get(d.headMetal);
    if (latch) latch.geometry.translate(...d.latchPivot.map((v) => -v));
    return { ...d, spindle, head, latch, clamp, headMetal, angle: 0 };
  });
  let last;
  return (
    now,
    states,
    power,
    split,
    reduced,
    clampsOpen = false,
    demo = null,
    mechanics = null,
  ) => {
    const dt = last === undefined ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    let moving = false;
    for (const d of drives) {
      const state = states[d.unit] || 0,
        phase = demo ? ((demo.phase % 1) + 1) % 1 : 0,
        track = demo
          ? 79 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2))
          : Math.min(79, (state >> 8) & 255),
        clampAmount = demo
          ? 0.5 - 0.5 * Math.cos(phase * Math.PI * 2)
          : Number(clampsOpen);
      const telemetry = mechanics?.[d.unit];
      if (!demo && telemetry && !reduced) {
        const angle = telemetry.phase * 2 * Math.PI;
        moving ||= d.spindle.visible && angle !== d.angle;
        d.angle = angle;
      }
      if (
        !demo &&
        !telemetry &&
        power &&
        state & 1 &&
        d.spindle.visible &&
        !reduced &&
        dt
      ) {
        d.angle = (d.angle + dt * 2 * Math.PI * 5) % (2 * Math.PI);
        moving = true;
      }
      if (demo?.animate && !reduced && d.spindle.visible) moving = true;
      d.spindle.rotation.z = demo ? phase * Math.PI * 2 : d.angle;
      d.spindle.position.set(
        d.pivot[0],
        d.pivot[1] - split * 145,
        d.pivot[2] + split * 115,
      );
      d.head.position.set(
        (d.travel[0] * track) / 79,
        (d.travel[1] * track) / 79 - split * 145,
        (d.travel[2] * track) / 79 + split * 115,
      );
      d.headMetal?.position.copy(d.head.position);
      if (d.latch) {
        d.latch.position.set(
          d.latchPivot[0],
          d.latchPivot[1] - split * 145,
          d.latchPivot[2] + split * 115,
        );
        d.latch.rotation.y = (clampAmount * Math.PI) / 2;
      }
      if (d.clamp)
        d.clamp.position.set(0, -split * 145, split * 115 + clampAmount * 5);
    }
    return moving;
  };
}
export function createDriveSound() {
  let context,
    gain,
    enabled = false,
    previous = [0, 0];
  return {
    async enable(value) {
      enabled = value;
      if (value && !context) {
        context = new AudioContext();
        gain = context.createGain();
        gain.gain.value = 0;
        gain.connect(context.destination);
        for (const frequency of [70, 103]) {
          const o = context.createOscillator();
          o.frequency.value = frequency;
          o.type = "sine";
          o.connect(gain);
          o.start();
        }
      }
      if (context) {
        if (value) await context.resume();
        else gain.gain.setTargetAtTime(0, context.currentTime, 0.03);
      }
    },
    update(states, power) {
      if (!context) return;
      const audible = enabled && power && !document.hidden;
      gain.gain.setTargetAtTime(
        audible && states.some((s) => s & 1) ? 0.012 : 0,
        context.currentTime,
        0.03,
      );
      states.forEach((s, u) => {
        const track = (s >> 8) & 255;
        if (audible && track !== previous[u]) {
          const o = context.createOscillator(),
            g = context.createGain(),
            t = context.currentTime;
          o.type = "triangle";
          o.frequency.setValueAtTime(180, t);
          o.frequency.exponentialRampToValueAtTime(65, t + 0.025);
          g.gain.setValueAtTime(0.035, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
          o.connect(g);
          g.connect(context.destination);
          o.start();
          o.stop(t + 0.04);
          o.onended = () => {
            o.disconnect();
            g.disconnect();
          };
        }
        previous[u] = track;
      });
    },
  };
}
