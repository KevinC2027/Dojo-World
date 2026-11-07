import { strikeTickSweep, strikeEndpoint } from './trajectory.mjs';
import { movingSphereCapsuleFirstImpact } from './moving-capsule.mjs';

/**
 * Per-tick clean-room shadow diagnostic for rigidly translating torso capsules.
 * Previous/current poses must bracket the SAME fixed simulation tick.
 * Only a diagnostic: the authoritative range/facing damage gate is unchanged.
 */
export function strikeContactProbe(attacker, defender, moveName, activeFrameIndex, activeFrameCount, previous = null) {
  if (!Number.isInteger(activeFrameIndex) || !Number.isInteger(activeFrameCount) ||
      activeFrameCount < 1 || activeFrameIndex < 0 || activeFrameIndex >= activeFrameCount) {
    throw new RangeError('Valid zero-based active frame index and count required');
  }
  const from = activeFrameIndex / activeFrameCount;
  const to = (activeFrameIndex + 1) / activeFrameCount;
  const sweep = strikeTickSweep(attacker, moveName, from, to, defender);
  const oldAttacker = previous?.attacker ?? attacker;
  const oldDefender = previous?.defender ?? defender;
  const oldCapsule = strikeTickSweep(oldAttacker, moveName, from, to, oldDefender);
  const strikeFrom = strikeEndpoint(oldAttacker, moveName, from);
  const strikeTo = strikeEndpoint(attacker, moveName, to);
  const hit = movingSphereCapsuleFirstImpact(
    strikeFrom, strikeTo, sweep.strikeRadius,
    oldCapsule.capsuleStart, oldCapsule.capsuleEnd,
    sweep.capsuleStart, sweep.capsuleEnd, sweep.capsuleRadius
  );
  return {
    model: 'moving_torso_sweep_diagnostic_v2',
    limb: sweep.limb,
    activeFrameIndex,
    activeFrameCount,
    intersected: hit !== null,
    firstImpactFraction: hit ? Number(hit.firstImpactFraction.toFixed(9)) : null,
    point: hit ? hit.firstImpactPoint : null,
    normal: hit ? hit.firstImpactNormal : null,
    previousPoseProvided: previous !== null
  };
}
