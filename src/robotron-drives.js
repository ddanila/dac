import {audioStateChanged,audioStatus} from './audio-state.js';
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
    const latchTrim = objects.get(d.latchTrim);
    if (latchTrim) latchTrim.geometry.translate(...d.latchPivot.map(v => -v));
    const shaft = objects.get(d.shaft);
    if (shaft) shaft.geometry.translate(...d.latchPivot.map(v => -v));
    const headArm = objects.get(d.headArm),
      medium = objects.get(d.medium);
    if (headArm) headArm.geometry.translate(...d.armPivot.map((v) => -v));
    if (medium) {
      medium.geometry.translate(...d.pivot.map((v) => -v));
      medium.material = medium.material.clone();
      medium.material.transparent = false;
      medium.material.opacity = 1;
      medium.material.depthWrite = true;
    }
    return {
      ...d,
      spindle,
      head,
      latch,
      latchTrim,
      shaft,
      release: objects.get(d.release),
      clamp,
      headMetal,
      headArm,
      medium,
      jacket: objects.get(d.jacket),
      disketteLabel: objects.get(d.disketteLabel),
      angle: 0,
      insertion: undefined,
    };
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
    available = null,
    parkingSlots = [0,1],
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
          : Number(!!(clampsOpen || (state & 32) || !(state & 8)));
      // Visual hand-operated lever travel; controller state remains authoritative.
      // Keep the shaft and clamp followers together, including reversals mid-travel.
      const previousClamp = d.clampVisual;
      if (d.clampVisual === undefined || reduced || demo) d.clampVisual = clampAmount;
      else d.clampVisual += Math.sign(clampAmount - d.clampVisual) * Math.min(Math.abs(clampAmount - d.clampVisual), dt / .32);
      moving ||= d.clampVisual !== clampAmount || previousClamp !== d.clampVisual;
      const target = Number(!!(state & 8));
      const previousInsertion = d.insertion;
      if (d.insertion === undefined || reduced) d.insertion = target;
      else d.insertion += Math.sign(target - d.insertion) * Math.min(Math.abs(target - d.insertion), dt / .45);
      const parked = !!available?.[d.unit];
      const mediaVisible = parked || target === 1 || d.insertion > 0;
      const outside = Math.min(1, (1 - d.insertion) * 2);
      const parking = parked ? Math.max(0, 1 - d.insertion * 2) : 0;
      const slide = -145 * outside + parking * (199 + split * 145);
      const side = parking * (330 + (parkingSlots[d.unit] ?? d.unit) * 145 - d.pivot[0]);
      const lower = parking * (5 - d.pivot[2] - split * 115);
      moving ||= d.insertion !== target || previousInsertion !== d.insertion;
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
      if (d.headArm) {
        d.headArm.position.set(
          ...d.armPivot.map((v, i) => v + d.head.position.getComponent(i)),
        );
        // Keep the upper head clear while the hand lever still lifts its rail.
        // Telemetry remains authoritative; this only limits the displayed pose.
        const commandedLoad = demo ? 1 - clampAmount : (telemetry?.headLoad ?? (power && state & 2 ? 1 : 0));
        const load = Math.min(commandedLoad, 1 - d.clampVisual);
        d.headArm.rotation.x = -0.08 * (1 - load);
      }
      if (d.medium) {
        d.medium.visible = (d.spindle.visible || parked) && mediaVisible;
        d.medium.position.copy(d.spindle.position);
        d.medium.position.y += slide;
        d.medium.position.x += side;
        d.medium.position.z += lower;
        if (d.clampVisual === 0 && d.insertion === 1) d.medium.rotation.z = d.spindle.rotation.z;
      }
      // The sleeve does not rotate with the magnetic disc. A released clamp
      // is an inspection state, not media ejection.
      for (const jacket of [d.jacket, d.disketteLabel]) if (jacket) {
        jacket.visible = mediaVisible;
        jacket.position.set(side, -split * 145 + slide, split * 115 + lower);
        jacket.userData.removedDisk = parked && target === 0 ? d.unit : undefined;
      }
      if (d.latch) {
        d.latch.position.set(
          d.latchPivot[0],
          d.latchPivot[1] - split * 145,
          d.latchPivot[2] + split * 115,
        );
        d.latch.rotation.y = ((1 - d.clampVisual) * Math.PI) / 2;
        if (d.latchTrim) { d.latchTrim.position.copy(d.latch.position); d.latchTrim.rotation.copy(d.latch.rotation); }
      }
      if (d.shaft && d.latch) {
        d.shaft.position.copy(d.latch.position);
        d.shaft.rotation.copy(d.latch.rotation);
      }
      for (const follower of [d.clamp, d.release]) if (follower)
        follower.position.set(0, -split * 145, split * 115 + d.clampVisual * 5);
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
  let volume=1,output,audioError='';
  let context,
    gain,
    enabled = false,
    previous = [undefined, undefined];
  const motors = [],
    clicks = new Set();
  function cancelClicks() {
    for (const o of clicks) {
      try {
        o.stop();
      } catch {}
      o.disconnect();
    }
    clicks.clear();
  }
  return {
    status(){return audioStatus(enabled,context,audioError);},
    volume(value){if(!Number.isFinite(value)||value<0||value>1)throw Error("Invalid drive volume.");volume=value;if(output)output.gain.setTargetAtTime(value,context.currentTime,.025);},
    async enable(value) {
      enabled = value;audioStateChanged();
      if (!value) cancelClicks();
      previous = [undefined, undefined];
      if (value && !context) {
        context = new AudioContext();context.onstatechange=audioStateChanged;
        gain = context.createGain();
        gain.gain.value = 0;
        output=context.createGain();output.gain.value=volume;output.connect(context.destination);
        gain.connect(output);
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
        if (value) {audioStateChanged();try{await context.resume();audioError='';}catch(e){audioError=e.message;audioStateChanged();throw e;}audioStateChanged();}
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
        cancelClicks();
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
          g.connect(output);
          clicks.add(o);
          o.start(t);
          o.stop(t + 0.04);
          o.onended = () => {
            clicks.delete(o);
            o.disconnect();
            g.disconnect();
          };
        }
        previous[u] = sample?.stepAges ? sample.steps : track;
      });
    },
  };
}

// Pure formatting keeps the inspection UI and its tests on the same vocabulary.
export function describeDrive(state, sample, unit) {
  if (!sample)
    return `${unit ? "B" : "A"}: diagnostics unavailable in this core`;
  const flags = sample.mechanics,
    detail = sample.detail || 0;
  const hex = (n) => n.toString(16).padStart(2, "0").toUpperCase();
  const names = {
    2: "Read Track",
    3: "Specify",
    4: "Sense Drive",
    5: "Write Data",
    6: "Read Data",
    7: "Recalibrate",
    8: "Sense Interrupt",
    9: "Write Deleted",
    10: "Read ID",
    12: "Read Deleted",
    13: "Format",
    15: "Seek",
    17: "Scan Equal",
    25: "Scan Low/Equal",
    29: "Scan High/Equal",
  };
  const op = ((sample.controller || 0) >> 8) & 31;
  const phase = (sample.controller || 0) & 3;
  const searches = [
    "transferring",
    "searching",
    "ID not found",
    "ID error",
    "waiting for index",
    "padding write",
    "formatting sector",
  ];
  const active =
    phase === 2
      ? searches[(sample.controller >> 4) & 7]
      : phase === 1
        ? "result"
        : state & 16
          ? "seeking"
          : "idle";
  return [
    `Drive ${unit ? "B" : "A"} · ${state & 8 ? "media inserted" : "empty"}`,
    `Cylinder ${(sample.position ?? (state >> 8) & 255).toFixed(2)} · head ${(detail >> 4) & 1} · sector ${(detail >> 8) & 255}${detail & 1 ? "" : " (controller not selected)"}`,
    `RPM ${flags === undefined ? "unavailable" : ((flags >>> 8) * 0.3).toFixed(1)} · angle ${(sample.phase * 360).toFixed(1)}°`,
    `READY ${flags & 1 ? "yes" : "no"} · head ${flags & 2 ? "loaded" : sample.headLoad > 0 ? "loading" : "unloaded"}${flags & 4 ? " · settling" : ""}`,
    `Index ${flags & 8 ? "high" : "low"} · pulses ${sample.indexes ?? "unavailable"} · STEP count ${sample.steps}`,
    sample.controller === undefined
      ? "Controller details unavailable in this core"
      : `${names[op] || "Controller"} · ${active}${phase === 2 ? ` · bytes ${(sample.transfer || 0) & 65535}/${(sample.transfer || 0) >>> 16}` : ""}`,
    sample.result & 0x1000000
      ? `Result ST0/ST1/ST2: ${[0, 8, 16].map((b) => hex((sample.result >> b) & 255)).join(" / ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
