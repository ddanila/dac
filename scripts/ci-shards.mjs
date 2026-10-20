// Deterministic longest-first assignment. Estimates affect placement, never coverage.
export const visualTestPattern = /^(assembly|cable-geometry|crt|drive-levers|drive-motion|exhibit-improvements|exploration|fan|inspection(?:-[a-z-]+)?|interior|keyboard(?:-input|-gestures|-keycaps|-controller)?|museum|robotron-refinements|robotron-review-tools|robotron-sound|pcb-components|sessions)\.spec\.js$/;
export const nativeTests = new Set(['tests/workbench.spec.js', 'tests/serial.spec.js']);
export function assignFiles(files, seconds, count = 2) {
  if (!Number.isInteger(count) || count < 1) throw Error('Invalid shard count');
  const bins = Array.from({length: count}, () => ({seconds: 0, files: []}));
  const weight = f => Math.max(.1, seconds[f] ?? 30);
  const unique = [...new Set(files)].sort();
  const replay = unique.filter(f => nativeTests.has(f));
  const groups = unique.filter(f => !nativeTests.has(f)).map(f => [f]);
  if (replay.length) groups.push(replay);
  const groupWeight = group => group.reduce((sum, f) => sum + weight(f), 0);
  for (const group of groups.sort((a,b) => groupWeight(b)-groupWeight(a) || a[0].localeCompare(b[0]))) {
    const bin = bins.reduce((a,b) => b.seconds < a.seconds ? b : a);
    bin.files.push(...group); bin.seconds += groupWeight(group);
  }
  return bins;
}
