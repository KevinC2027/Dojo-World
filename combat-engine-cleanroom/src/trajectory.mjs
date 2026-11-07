/**
 * Clean-room procedural strike endpoint sampling.
 *
 * These are intentionally simple deterministic, world-space 3D strike paths,
 * not mocap, skeletal IK, or biomechanically validated joint trajectories.
 * Time is normalized over the active phase. A caller must sample consecutive
 * ticks and sweep between the resulting points to avoid tunnelling.
 */
const STRIKES = Object.freeze({
  palm:      { limb: 'right_hand', height: 1.52, reach: 1.00, lateral: 0.17, radius: 0.105 },
  straight:  { limb: 'right_hand', height: 1.50, reach: 1.10, lateral: 0.13, radius: 0.09 },
  frontKick: { limb: 'right_foot', height: 1.04, reach: 1.43, lateral: 0.13, radius: 0.14 },
  roundhouse: { limb: 'right_foot', height: 1.02, reach: 1.35, lateral: 0.05, radius: 0.14 },
  jab:       { limb: 'left_hand', height: 1.53, reach: 1.04, lateral: -0.16, radius: 0.09 },
  cross:     { limb: 'right_hand', height: 1.49, reach: 1.17, lateral: 0.14, radius: 0.105 },
  hook:      { limb: 'left_hand', height: 1.49, reach: 0.90, lateral: -0.27, radius: 0.12 },
  uppercut:  { limb: 'right_hand', height: 1.38, reach: 0.85, lateral: 0.10, radius: 0.11 },
  leadUppercut: { limb: 'left_hand', height: 1.38, reach: 0.85, lateral: -0.10, radius: 0.11 },
  overhand:  { limb: 'right_hand', height: 1.68, reach: 0.92, lateral: 0.12, radius: 0.11 }
});
const finite3 = v => v && ['x','y','z'].every(k => Number.isFinite(v[k]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const round=n=>Number(n.toFixed(9));

export function strikeSpec(moveName) {
  if (!Object.hasOwn(STRIKES,moveName)) throw new RangeError('Unknown strike');
  return STRIKES[moveName];
}

/**
 * Active-phase endpoint. The path begins at a guarded/loaded position,
 * extends toward the opponent, and returns during the latter active frames.
 * The phase fraction is clamped to [0,1]. Facing is horizontal x/z.
 */
export function strikeEndpoint(fighter,moveName,phaseFraction) {
  const spec=strikeSpec(moveName);
  if (!fighter || !finite3(fighter.position) ||
      !fighter.facing || !Number.isFinite(fighter.facing.x) ||
      !Number.isFinite(fighter.facing.z) || !Number.isFinite(phaseFraction)) {
    throw new TypeError('Finite fighter pose and phase fraction required');
  }
  const magnitude=Math.hypot(fighter.facing.x,fighter.facing.z);
  if (magnitude<1e-9) throw new RangeError('Facing direction cannot be zero');
  const forward={x:fighter.facing.x/magnitude,z:fighter.facing.z/magnitude};
  const right={x:-forward.z,z:forward.x};
  const t=clamp(phaseFraction,0,1);
  // C1-continuous advance and retreat: zero endpoint velocity at boundaries.
  const extension=Math.sin(Math.PI*t)**2;
  const distance=0.35+(spec.reach-0.35)*extension;
  return {
    x:round(fighter.position.x+forward.x*distance+right.x*spec.lateral),
    y:round(fighter.position.y+spec.height),
    z:round(fighter.position.z+forward.z*distance+right.z*spec.lateral)
  };
}

/** Sweep two consecutive active-frame endpoints against a stationary torso. */
export function strikeTickSweep(fighter,moveName,fromFraction,toFraction,defender) {
  if (!defender || !finite3(defender.position)) throw new TypeError('Finite defender position required');
  if (!Number.isFinite(fromFraction) || !Number.isFinite(toFraction) ||
      fromFraction<0 || toFraction>1 || toFraction<fromFraction) {
    throw new RangeError('Ordered active-phase fractions within [0,1] required');
  }
  const spec=strikeSpec(moveName);
  const previous=strikeEndpoint(fighter,moveName,fromFraction);
  const current=strikeEndpoint(fighter,moveName,toFraction);
  const start={x:defender.position.x,y:defender.position.y+0.85,z:defender.position.z};
  const end={x:defender.position.x,y:defender.position.y+1.65,z:defender.position.z};
  return {previous,current,strikeRadius:spec.radius,capsuleStart:start,capsuleEnd:end,capsuleRadius:0.29,limb:spec.limb};
}
