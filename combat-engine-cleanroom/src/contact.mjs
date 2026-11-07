/**
 * Deterministic 3D contact telemetry for the clean-room rules core.
 * This is a PROXY, not skeletal limb collision or a biomechanical solver.
 * Positions are world-space meters; x/z are horizontal, y is vertical.
 */
const HEIGHT = Object.freeze({ head: 1.62, body: 1.08 });
const STRIKE_LIMB = Object.freeze({
  palm: 'right_hand', straight: 'right_hand', hook: 'left_hand', frontKick: 'right_foot',
  roundhouse: 'right_foot',
  jab: 'left_hand', cross: 'right_hand', uppercut: 'right_hand', leadUppercut: 'left_hand', overhand: 'right_hand'
});
const round = value => Number(value.toFixed(6));

/** Describe a resolved range-based hit without pretending to solve joint trajectories. */
export function contactTelemetry(attacker, defender, moveName, target) {
  if (!Object.hasOwn(HEIGHT, target) || !Object.hasOwn(STRIKE_LIMB, moveName)) {
    throw new RangeError('Unknown contact target or move');
  }
  const dx = defender.position.x - attacker.position.x;
  const dz = defender.position.z - attacker.position.z;
  const distance = Math.hypot(dx, dz);
  if (!Number.isFinite(distance) || distance <= 0) throw new RangeError('Invalid contact geometry');
  const nx = dx / distance, nz = dz / distance;
  const height = HEIGHT[target];
  // Defender-facing surface of a nominal 0.42 m collision footprint.
  const radius = 0.42;
  return {
    model: 'range_proxy_v1',
    limb: STRIKE_LIMB[moveName],
    point: {
      x: round(defender.position.x - nx * radius),
      y: round(defender.position.y + height),
      z: round(defender.position.z - nz * radius)
    },
    normal: { x: round(-nx), y: 0, z: round(-nz) },
    separationMeters: round(distance)
  };
}
