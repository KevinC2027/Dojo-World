/**
 * Pure, deterministic swept sphere versus vertical/angled capsule collision.
 * All coordinates are world-space meters, including Y (up).
 * This is geometry only: not a skeletal solver, move pose, or hit authority yet.
 */
const EPS = 1e-12;
const finiteVec = v => v && ['x','y','z'].every(k => Number.isFinite(v[k]));
const add = (a,b) => ({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub = (a,b) => ({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mul = (a,s) => ({x:a.x*s,y:a.y*s,z:a.z*s});
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const length = v => Math.hypot(v.x,v.y,v.z);

/**
 * Closest points on two finite segments, including parallel and zero-length
 * segments. Based on constrained minimization of squared separation.
 */
export function closestSegments(a0,a1,b0,b1) {
  if (![a0,a1,b0,b1].every(finiteVec)) throw new TypeError('Finite 3D endpoints required');
  const u=sub(a1,a0),v=sub(b1,b0),w=sub(a0,b0);
  const A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),E=dot(v,w);
  let s=0,t=0;
  if (A<=EPS && C<=EPS) {
    // Both are points.
  } else if (A<=EPS) {
    t=clamp(E/C,0,1);
  } else if (C<=EPS) {
    s=clamp(-D/A,0,1);
  } else {
    const denom=A*C-B*B;
    s=denom>EPS?clamp((B*E-C*D)/denom,0,1):0;
    t=clamp((B*s+E)/C,0,1);
    // If t is clamped, recompute s against that endpoint.
    s=clamp((B*t-D)/A,0,1);
    // And settle t once more for the corrected s.
    t=clamp((B*s+E)/C,0,1);
  }
  const pointA=add(a0,mul(u,s)),pointB=add(b0,mul(v,t));
  return {pointA,pointB,segmentFraction:s,capsuleFraction:t,distance:length(sub(pointA,pointB))};
}

/**
 * Sweep a striking sphere center from previous to current against a defender
 * capsule's centerline. Contact is not emitted when only the endpoints are
 * outside and the path misses. The earliest time of impact is not solved yet;
 * fraction is closest-approach, NOT time-of-impact.
 */
export function sweptSphereCapsule(previous,current,strikeRadius,capsuleStart,capsuleEnd,capsuleRadius) {
  if (![strikeRadius,capsuleRadius].every(x=>Number.isFinite(x)&&x>=0))
    throw new RangeError('Radii must be finite and nonnegative');
  const nearest=closestSegments(previous,current,capsuleStart,capsuleEnd);
  const limit=strikeRadius+capsuleRadius;
  if (nearest.distance>limit+1e-9) return null;
  const delta=sub(nearest.pointA,nearest.pointB);
  const normal=nearest.distance>EPS?mul(delta,1/nearest.distance):{x:1,y:0,z:0};
  return {
    model:'swept_sphere_capsule_v1',
    sweepFraction:nearest.segmentFraction,
    centerlineDistance:nearest.distance,
    penetrationDepth:Math.max(0,limit-nearest.distance),
    point:add(nearest.pointB,mul(normal,capsuleRadius)),
    normal
  };
}


/**
 * Find the FIRST entry into the expanded capsule, not just closest approach.
 * Distance to a convex capsule along a linear segment is convex, so if the
 * closest-approach sample intersects, bisection on [0, closestFraction] finds
 * the entry boundary. A sweep starting inside has entryFraction === 0.
 *
 * The capsule is stationary for this fixed tick. Moving defenders require a
 * future relative-motion extension; this does not solve skeletal trajectories.
 */
export function sweptSphereCapsuleFirstImpact(previous,current,strikeRadius,capsuleStart,capsuleEnd,capsuleRadius) {
  const closest = sweptSphereCapsule(previous,current,strikeRadius,capsuleStart,capsuleEnd,capsuleRadius);
  if (!closest) return null;
  const motion = sub(current,previous);
  const radius = strikeRadius + capsuleRadius;
  const sample = t => {
    const center = add(previous,mul(motion,t));
    const nearest = closestSegments(center,center,capsuleStart,capsuleEnd);
    return { center, nearest };
  };
  const start = sample(0);
  let entryFraction = 0;
  if (start.nearest.distance > radius) {
    let low = 0, high = closest.sweepFraction;
    // The closest point must be inside the expanded capsule.
    // A fixed iteration count preserves deterministic replay.
    for (let i=0;i<48;i++) {
      const mid = (low+high)*0.5;
      if (sample(mid).nearest.distance <= radius) high = mid;
      else low = mid;
    }
    entryFraction = high;
  }
  const impact = sample(entryFraction);
  const delta = sub(impact.center,impact.nearest.pointB);
  const d = length(delta);
  const fallback = length(motion)>EPS ? mul(motion,-1/length(motion)) : {x:1,y:0,z:0};
  const normal = d>EPS ? mul(delta,1/d) : fallback;
  return {
    ...closest,
    firstImpactFraction: entryFraction,
    firstImpactCenter: impact.center,
    firstImpactPoint: add(impact.nearest.pointB,mul(normal,capsuleRadius)),
    firstImpactNormal: normal,
    startsOverlapping: start.nearest.distance <= radius
  };
}
