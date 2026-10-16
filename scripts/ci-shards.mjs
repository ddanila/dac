// Deterministic longest-first assignment. Estimates affect placement, never coverage.
export const visualTestPattern = /^(assembly|cable-geometry|crt|drive-levers|drive-motion|exhibit-improvements|exploration|fan|inspection(?:-[a-z-]+)?|interior|keyboard(?:-input|-gestures|-keycaps)?|museum|robotron-refinements|robotron-review-tools|robotron-sound|pcb-components|sessions)\.spec\.js$/;
export function assignFiles(files, seconds, count = 2) {
  if (!Number.isInteger(count) || count < 1) throw Error('Invalid shard count');
  const bins = Array.from({length: count}, () => ({seconds: 0, files: []}));
  const weight = f => Math.max(.1, seconds[f] ?? 30);
  for (const file of [...new Set(files)].sort((a,b) => weight(b)-weight(a) || a.localeCompare(b))) {
    const bin = bins.reduce((a,b) => b.seconds < a.seconds ? b : a);
    bin.files.push(file); bin.seconds += weight(file);
  }
  return bins;
}
