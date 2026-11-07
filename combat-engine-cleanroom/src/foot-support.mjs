/** Deterministic planar support-foot diagnostic for the clean-room engine.
 * Units are meters; no animation or damage authority is changed.
 * A stance is stable when the projected center of mass lies within
 * the segment between planted feet, expanded by a finite tolerance.
 */
const finite = (v) => Number.isFinite(v);
function point(p, name) {
  if (!p || !finite(p.x) || !finite(p.z)) throw new TypeError(name + ' requires finite x,z');
}
export function evaluateFootSupport(leftFoot, rightFoot, centerOfMass, tolerance = 0.12) {
  point(leftFoot, 'leftFoot'); point(rightFoot, 'rightFoot'); point(centerOfMass, 'centerOfMass');
  if (!finite(tolerance) || tolerance < 0) throw new RangeError('tolerance must be nonnegative and finite');
  const dx = rightFoot.x - leftFoot.x, dz = rightFoot.z - leftFoot.z;
  const lengthSquared = dx * dx + dz * dz;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((centerOfMass.x - leftFoot.x) * dx + (centerOfMass.z - leftFoot.z) * dz) / lengthSquared));
  const supportPoint = { x: leftFoot.x + dx * projection, z: leftFoot.z + dz * projection };
  const displacement = Math.hypot(centerOfMass.x - supportPoint.x, centerOfMass.z - supportPoint.z);
  return { stable: displacement <= tolerance, displacement, supportPoint, projection };
}
