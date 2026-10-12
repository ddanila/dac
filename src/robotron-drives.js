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
          : Math.min(79, mechanics?.[d.unit]?.position ?? (state >> 8) & 255),
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
// Return one onset per newly observed STEP, ordered oldest first. A reset,
// initial sample or hidden-tab backlog establishes a baseline instead of bursting.
export function driveStepOffsets(previous, sample) {
  if (previous === undefined || !sample?.stepAges) return [];
  const count = (sample.steps - previous) >>> 0;
  if (count > 64) return [];
  const ages = sample.stepAges
    .slice(0, count)
    .filter((a) => a < 998400)
    .reverse();
  if (!ages.length) return [];
  const rate = 3993600 * (sample.speed || 1);
  return ages.map((age) => (ages[0] - age) / rate);
}
export function createDriveSound() {
  let context,
    gain,
    enabled = false,
    previous = [undefined, undefined];
  const motors = [];
  return {
    async enable(value) {
      enabled = value;
      previous = [undefined, undefined];
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
          motors.push(o);
        }
      }
      if (context) {
        if (value) await context.resume();
        else gain.gain.setTargetAtTime(0, context.currentTime, 0.03);
      }
    },
    update(states, power, mechanics = null) {
      if (!context) return;
      const audible = enabled && power && !document.hidden;
      const speeds = [0, 1].map((u) =>
        mechanics?.[u]?.mechanics === undefined
          ? states[u] & 1
            ? 1
            : 0
          : (mechanics[u].mechanics >>> 8) / 1000,
      );
      gain.gain.setTargetAtTime(
        audible ? Math.max(...speeds) * 0.012 : 0,
        context.currentTime,
        0.03,
      );
      motors.forEach((o, u) =>
        o.frequency.setTargetAtTime(
          (u ? 103 : 70) * Math.max(0.05, speeds[u]),
          context.currentTime,
          0.03,
        ),
      );
      if (!audible) {
        previous = [undefined, undefined];
        return;
      }
      states.forEach((s, u) => {
        const sample = mechanics?.[u],
          track = (s >> 8) & 255;
        const offsets = sample?.stepAges
          ? driveStepOffsets(previous[u], sample)
          : previous[u] !== undefined && track !== previous[u]
            ? [0]
            : [];
        for (const offset of offsets) {
          const o = context.createOscillator(),
            g = context.createGain(),
            t = context.currentTime + 0.01 + offset;
          o.type = "triangle";
          o.frequency.setValueAtTime(180, t);
          o.frequency.exponentialRampToValueAtTime(65, t + 0.025);
          g.gain.setValueAtTime(0.035, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
          o.connect(g);
          g.connect(context.destination);
          o.start(t);
          o.stop(t + 0.04);
          o.onended = () => {
            o.disconnect();
            g.disconnect();
          };
        }
        previous[u] = sample?.stepAges ? sample.steps : track;
      });
    },
  };
}
