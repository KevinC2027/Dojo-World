// Cycle2 hypothesis: anticipate the unchanged first-air elbow pole only in late carry.
// Derived constraint math is experimental; protected HTML is the build input.
// Endpoints, roots, authored timing and all non-carry poses remain untouched.
// A cache keyed by capture identity and simulation tick prevents extra pose()
// observations from advancing bend transport. The cache contains no game rules.
function solveCarryReleaseJoints(f, p, anchors, k) {
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => { const d = Math.hypot(...a); return d > 1e-12 ? a.map(x => x/d) : null; };
  const perpendicular = u => {
    const i = Math.abs(u[0]) < Math.abs(u[1]) ? (Math.abs(u[0]) < Math.abs(u[2]) ? 0 : 2) : (Math.abs(u[1]) < Math.abs(u[2]) ? 1 : 2);
    const basis = [0,0,0]; basis[i] = 1;
    return unit(cross(u, basis));
  };
  const pole = (joint, root, axis) => {
    const v = sub(joint, root), a = dot(v, axis);
    return unit(v.map((x, i) => x - a*axis[i])) || perpendicular(axis);
  };
  const transport = (bend, from, to) => {
    const c = Math.max(-1, Math.min(1, dot(from, to))), v = cross(from, to);
    if (c < -1 + 1e-9) return bend.slice(); // Half-turn about the previous bend axis.
    const first = cross(v, bend), second = cross(v, first);
    const q = bend.map((x, i) => x + first[i] + second[i]/(1+c));
    const along = dot(q, to);
    return unit(q.map((x, i) => x - along*to[i])) || perpendicular(to);
  };
  const cf = f.carryFrom, rs = cf.rotS || 0, rh = cf.rotH || 0;
  const initial = {
    SL: [cf.neck[0]+.11*rs, cf.neck[1]-.05, .22-.03*rs],
    SR: [cf.neck[0]-.11*rs, cf.neck[1]-.05, -.22+.03*rs],
    HL: [cf.pel[0]+.04*rh, cf.pel[1], cf.pel[2]+.12-.009*rh],
    HR: [cf.pel[0]-.04*rh, cf.pel[1], cf.pel[2]-.12+.009*rh]
  };
  let cache = f._carryReleaseConstraint;
  if (!cache || cache.capture !== cf || f.t < cache.tick) {
    cache = {capture: cf, tick: -1, k: 0, limbs: {}, joints: {}};
    f._carryReleaseConstraint = cache;
  }
  if (cache.tick === f.t) {
    for (const key of ['el','er','kl','kr']) p[key] = cache.joints[key].slice();
    return;
  }
  const phase = Math.max(0, Math.min(1, k));
  const alpha = cache.k < 1 ? Math.max(0, Math.min(1, (phase-cache.k)/(1-cache.k))) : 1;
  for (const [joint, end, anchor, length] of [['el','hl','SL',.40], ['er','hr','SR',.40], ['kl','fl','HL',.62], ['kr','fr','HR',.62]]) {
    const root = anchors[anchor], delta = sub(p[end], root), distance = Math.hypot(...delta);
    if (distance <= 1e-9 || distance > 2*length+1e-9) throw new RangeError('Carry endpoint outside two-bone reach: '+joint);
    const axis = delta.map(x => x/distance);
    let target = pole(p[joint], root, axis);
    if (joint === 'el' && f.t > 8) {
      if (!cache.releaseElbow) {
        // Deep clone: pose() mutates animation caches, so a shallow preview is unsafe.
        // This is solver lookahead, not an observer evaluation or a gameplay tick.
        const preview = JSON.parse(JSON.stringify(f));
        const launch = throwPhase(THROW_PHASES[f.throwStyle], 'launch');
        const other = S[0] === f ? S[1] : S[0];
        preview.st = 'air'; preview.t = 0; preview.y = .60;
        preview.vx = other.ax * launch.vx; preview.vz = other.az * launch.vx;
        preview.vy = launch.vy; preview.throwStyle = null;
        preview.airFrom = null; preview._carryReleaseConstraint = null;
        cache.releaseElbow = pose(preview).el.slice();
      }
      const next = cache.releaseElbow.slice(); next[1] += .60 - f.y;
      const release = pole(next, root, axis);
      const u = Math.max(0, Math.min(1, (f.t - 8) / 4));
      const weight = u*u*(3-2*u);
      const turn = Math.atan2(dot(axis, cross(target, release)), Math.max(-1, Math.min(1, dot(target, release)))) * weight;
      const tangent = cross(axis, target);
      target = unit(target.map((x,i) => Math.cos(turn)*x + Math.sin(turn)*tangent[i]));
    }
    let previous = cache.limbs[joint];
    if (!previous) {
      const originAxis = unit(sub(cf[end], initial[anchor])) || axis;
      previous = {axis: originAxis, bend: pole(cf[joint], initial[anchor], originAxis)};
    }
    const base = transport(previous.bend, previous.axis, axis);
    const angle = Math.atan2(dot(axis, cross(base, target)), Math.max(-1, Math.min(1, dot(base, target)))) * alpha;
    const turn = cross(axis, base), c = Math.cos(angle), s = Math.sin(angle);
    const bend = unit(base.map((x,i) => c*x+s*turn[i]));
    const advance = distance/2, height = Math.sqrt(Math.max(0, length*length-advance*advance));
    p[joint] = root.map((x,i) => x+axis[i]*advance+bend[i]*height);
    cache.limbs[joint] = {axis, bend};
    cache.joints[joint] = p[joint].slice();
  }
  cache.tick = f.t;
  cache.k = phase;
}
