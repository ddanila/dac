// Geometry is exported in machine coordinates. Rotate only the rotor about
// its X-axis spindle, keeping the frame stationary. Speed is illustrative.
export function createFanMotion(rotor) {
  rotor.geometry.translate(-80, -109, -67);
  rotor.position.set(80, 109, 67);
  let previous;
  return (now, powered, visible, reducedMotion) => {
    const dt = previous === undefined ? 0 : Math.max(0, Math.min(0.05, (now - previous) / 1000));
    previous = now;
    if (!powered || reducedMotion || dt === 0) return false;
    rotor.rotation.x = (rotor.rotation.x + dt * 8) % (Math.PI * 2);
    return visible;
  };
}
