import { strikeTickSweep } from './trajectory.mjs';
import { sweptSphereCapsuleFirstImpact } from './sweep.mjs';

/**
 * Per-tick clean-room 3D contact diagnostic.
 *
 * This is a shadow calculation only: damage still follows the range proxy.
 * A recorded mismatch lets a replay identify strikes that look disconnected.
 * Positions/facing are sampled at the end of the engine's movement step.
 * The defender capsule is held stationary within this tick.
 */
export function strikeContactProbe(attacker, defender, moveName, activeFrameIndex, activeFrameCount) {
  if (!Number.isInteger(activeFrameIndex) || !Number.isInteger(activeFrameCount) ||
      activeFrameCount < 1 || activeFrameIndex < 0 || activeFrameIndex >= activeFrameCount) {
    throw new RangeError('Valid zero-based active frame index and count required');
  }
  const from = activeFrameIndex / activeFrameCount;
  const to = (activeFrameIndex + 1) / activeFrameCount;
  const sweep = strikeTickSweep(attacker, moveName, from, to, defender);
  const hit = sweptSphereCapsuleFirstImpact(
    sweep.previous, sweep.current, sweep.strikeRadius,
    sweep.capsuleStart, sweep.capsuleEnd, sweep.capsuleRadius
  );
  return {
    model: 'stationary_torso_sweep_diagnostic_v1',
    limb: sweep.limb,
    activeFrameIndex,
    activeFrameCount,
    intersected: hit !== null,
    firstImpactFraction: hit ? Number(hit.firstImpactFraction.toFixed(9)) : null,
    point: hit ? hit.firstImpactPoint : null,
    normal: hit ? hit.firstImpactNormal : null
  };
}
