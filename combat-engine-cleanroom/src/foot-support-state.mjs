import { evaluateFootSupport } from './foot-support.mjs';

/**
 * Pure, fixed-step support-foot tracking. A planted foot stays in world space
 * until the body exceeds maxReach, then that foot takes at most maxStep.
 * This is diagnostic only; it does not modify combat movement or damage.
 */
const check = (p, name) => {
  if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z))
    throw new TypeError(name + ' requires finite x,z');
};
export function advanceFootSupport(state, centerOfMass, {
  maxReach = 0.45, maxStep = 0.12, tolerance = 0.12
} = {}) {
  check(centerOfMass, 'centerOfMass');
  if (!state || !['leftFoot', 'rightFoot'].every(k => state[k]))
    throw new TypeError('state requires both feet');
  check(state.leftFoot, 'leftFoot');
  check(state.rightFoot, 'rightFoot');
  if (![maxReach, maxStep, tolerance].every(Number.isFinite) ||
      maxReach <= 0 || maxStep <= 0 || tolerance < 0)
    throw new RangeError('support parameters must be finite and valid');
  const feet = { leftFoot: { ...state.leftFoot }, rightFoot: { ...state.rightFoot } };
  const distance = p => Math.hypot(centerOfMass.x - p.x, centerOfMass.z - p.z);
  // Deterministic tie-break: left foot steps first.
  const foot = distance(feet.leftFoot) >= distance(feet.rightFoot) ? 'leftFoot' : 'rightFoot';
  const d = distance(feet[foot]);
  let stepped = null;
  if (d > maxReach) {
    const amount = Math.min(maxStep, d - maxReach);
    feet[foot].x += (centerOfMass.x - feet[foot].x) / d * amount;
    feet[foot].z += (centerOfMass.z - feet[foot].z) / d * amount;
    stepped = foot;
  }
  return { ...feet, stepped, support: evaluateFootSupport(
    feet.leftFoot, feet.rightFoot, centerOfMass, tolerance
  ) };
}
