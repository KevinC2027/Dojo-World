// DQ97 audit: RED (boxing) transitions that the lunge-gated DQ92/DQ95
// blends do NOT cover — guard->walk and walk->idle — plus controls.
// DQ95's probe notes RED idle->walk 0.146 (under the 0.32 gate); the
// cycle-90 audit traces idle->walk only, so guard->walk was never measured.
// Gate (same as DQ91-DQ96): boundary max joint diff <= 0.32.
// Run: node probe_dq97_redwalk_audit.cjs <build.html>
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const out = vm.runInContext(`(() => {
  const J = ['pel', 'neck', 'head', 'hl', 'hr', 'fl', 'fr', 'el', 'er', 'kl', 'kr'];
  function maxD(p, q) { let m = 0, j = ''; for (const k of J) { const d = Math.hypot(p[k][0] - q[k][0], p[k][1] - q[k][1], p[k][2] - q[k][2]); if (d > m) { m = d; j = k; } } return { d: +m.toFixed(3), j }; }
  // seq: list of {g, r, n} input blocks. Returns boundary steps for each
  // state change observed, plus max within-phase step.
  function trace(ai, seq) {
    const a = mk(0, ai), d = mk(3, 1 - ai);
    S = [a, d]; phase = 'fight'; hs = 0; tm = 45 * 60; sparks = [];
    a.x = 0; a.z = 0; d.x = 3; d.z = 0; a.fx = 1; a.fz = 0; d.fx = -1; d.fz = 0; d.st = 'idle';
    let prev = pose(a), prevSt = a.st, changes = [], within = 0, withinJ = '';
    for (const blk of seq) {
      for (let i = 0; i < blk.n; i++) {
        a.i.g = blk.g || 0; a.i.r = blk.r || 0; a.i.l = 0; a.i.u = 0; a.i.d = 0; a.i.bp = 0; a.i.bk = 0;
        update(a, d); update(d, a);
        const p = pose(a);
        if (a.st !== prevSt) changes.push({ from: prevSt, to: a.st, ...maxD(p, prev) });
        else { const s = maxD(p, prev); if (s.d > within) { within = s.d; withinJ = s.j; } }
        prev = p; prevSt = a.st;
      }
    }
    return { changes, within, withinJ, endSt: a.st };
  }
  const idle = (n) => ({ g: 0, r: 0, n }), walk = (n) => ({ g: 0, r: 1, n }), guard = (n) => ({ g: 1, r: 0, n });
  return {
    red_idle_walk: trace(0, [idle(10), walk(20)]),
    red_walk_idle: trace(0, [walk(20), idle(15)]),
    red_guard_walk: trace(0, [guard(15), walk(20)]),
    red_guard_idle: trace(0, [guard(15), idle(15)]),
    red_walk_guard: trace(0, [walk(20), guard(15)]),
    blue_guard_walk: trace(1, [guard(15), walk(20)]),
    blue_walk_idle: trace(1, [walk(20), idle(15)]),
  };
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
