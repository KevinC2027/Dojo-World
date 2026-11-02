// DQ107 PHASE-SYSTEM REFACTOR acceptance probe (set BEFORE dispatch, 2026-10-29).
// The refactor must be byte-identical in effect to build 4372ff7a: same pose traces,
// same roots, same hit outcomes. This probe dumps deterministic full traces and hashes
// them, so ANY numeric change (even below a gate tolerance) shows up as a diff.
// Trials (attacker ai flag: 1 = Blue/lunge, 0 = Red/back; defender at 0.70 m, facing):
//   throwBlue, throwRed: full attacker+defender pose + root trace, connect -> idle-after.
//   punchBlue, punchRed: full trace until both idle (pw 8 -> stun, deterministic).
//   kickBlue, kickRed: attacker pose for the whole atk + defender hp/connect tick +
//     defender pose only connect..connect+10 (before the stumble desperation window,
//     which uses Math.random and would make the trace non-reproducible).
//   launchBlue, launchRed: full trace until both idle (air/down/getup, deterministic).
// Usage: node probe_dq107_phase_refactor.cjs <build.html> [baseline.json]
//   Without baseline: prints sha256 + summary, and writes nothing (caller redirects).
//   With baseline: compares trace-for-trace and reports the first 5 differing paths.
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const out = vm.runInContext(`(() => {
  const J = ['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
  function snap(f) { const p = pose(f); const o = {}; for (const j of J) o[j] = p[j].map(v => +v.toFixed(9)); return o; }
  function trial(attAi, dist0, move, defLimit) {
    const a = mk(0, attAi), d = mk(0, attAi ? 0 : 1);
    S = [a, d]; phase = 'fight'; hs = 0; tm = 45 * 60; sparks = []; msgT = 0;
    a.x = 0; a.z = 0; d.x = dist0; d.z = 0; a.fx = 1; a.fz = 0; d.fx = -1; d.fz = 0;
    a.ax = 1; a.az = 0; a.st = 'idle'; d.st = 'idle'; a.hp = 100; d.hp = 100;
    if (!go(a, move)) return { ok: false, why: 'go-refused' };
    let connectTick = -1, releaseTick = -1, airFrames = 0, apexY = 0, maxDefStep = 0, prevDPose = null;
    let sawIdleAfter = false, sawGetup = false, nan = false, feetMaxCarry = 0;
    const trace = [];
    for (let i = 0; i < 400; i++) {
      update(a, d); update(d, a);
      if (!isFinite(d.x) || !isFinite(d.y) || !isFinite(a.x) || !isFinite(a.y)) nan = true;
      const ap = snap(a), dp = snap(d);
      if (connectTick < 0 && d.hp < 100) connectTick = i;
      if (connectTick >= 0 && releaseTick < 0 && d.vy > 1 && d.st === 'air') releaseTick = i;
      if (connectTick >= 0 && prevDPose) {
        for (const j of J) { const s = Math.hypot(dp[j][0] - prevDPose[j][0], dp[j][1] - prevDPose[j][1], dp[j][2] - prevDPose[j][2]); if (s > maxDefStep) maxDefStep = s; }
      }
      if (d.st === 'carry') { const f = Math.max(d.y + dp.fl[1], d.y + dp.fr[1]); if (f > feetMaxCarry) feetMaxCarry = f; }
      if (releaseTick >= 0 && d.st === 'air') { airFrames++; if (d.y > apexY) apexY = d.y; }
      if (d.st === 'getup') sawGetup = true;
      if (sawGetup && d.st === 'idle') sawIdleAfter = true;
      const inDefWindow = defLimit === null || (connectTick >= 0 && i <= connectTick + defLimit);
      trace.push({ i, aRoot: [a.x, a.y, a.z].map(v => +v.toFixed(9)), dRoot: [d.x, d.y, d.z].map(v => +v.toFixed(9)),
        aSt: a.st, dSt: d.st, a: ap, d: inDefWindow ? dp : null });
      prevDPose = dp;
      if (move === 'K' && connectTick >= 0 && i >= connectTick + 10) break;
      if (move === 'T' && sawIdleAfter) break;
      if (move !== 'T' && connectTick >= 0 && a.st === 'idle' && (d.st === 'idle' || (move === 'K' && i > connectTick + defLimit))) break;
      if (move === 'P' && connectTick >= 0 && a.st === 'idle' && d.st === 'idle') break;
    }
    return { ok: true, connectTick, releaseTick, carryFrames: releaseTick >= 0 ? releaseTick - connectTick : null,
      feetMaxCarry: +feetMaxCarry.toFixed(3), maxDefStep: +maxDefStep.toFixed(3), airFrames, apexY: +apexY.toFixed(3),
      hp: d.hp, nan, endSt: d.st, trace };
  }
  return {
    throwBlue: trial(1, 0.70, 'T', null),
    throwRed: trial(0, 0.70, 'T', null),
    punchBlue: trial(1, 0.70, 'P', null),
    punchRed: trial(0, 0.70, 'P', null),
    kickBlue: trial(1, 0.70, 'K', 10),
    kickRed: trial(0, 0.70, 'K', 10),
    launchBlue: trial(1, 1.15, 'L', null),
    launchRed: trial(0, 1.15, 'L', null),
  };
})()`, sandbox);
const summary = {};
for (const k of Object.keys(out)) {
  const t = out[k];
  summary[k] = t.ok ? { connectTick: t.connectTick, releaseTick: t.releaseTick, carryFrames: t.carryFrames, feetMaxCarry: t.feetMaxCarry, maxDefStep: t.maxDefStep, airFrames: t.airFrames, apexY: t.apexY, hp: t.hp, nan: t.nan, traceLen: t.trace.length } : { ok: false, why: t.why };
}
const traces = {};
for (const k of Object.keys(out)) traces[k] = out[k].trace;
const hash = crypto.createHash('sha256').update(JSON.stringify(traces)).digest('hex');
console.log('DQ107 TRACE HASH:', hash);
console.log(JSON.stringify(summary, null, 1));
if (process.argv[3]) {
  const base = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  let diffs = 0;
  function walk(a, b, path) {
    if (diffs >= 5) return;
    if (typeof a !== typeof b) { console.log('DIFF', path, 'type', typeof a, typeof b); diffs++; return; }
    if (a === null || b === null || typeof a !== 'object') { if (a !== b) { console.log('DIFF', path, a, 'vs', b); diffs++; } return; }
    if (Array.isArray(a) !== Array.isArray(b) || (Array.isArray(a) && a.length !== b.length)) { console.log('DIFF', path, 'len', Array.isArray(a) ? a.length : a, 'vs', Array.isArray(b) ? b.length : b); diffs++; return; }
    for (const k of Object.keys(a)) { walk(a[k], b[k], path + '.' + k); if (diffs >= 5) return; }
  }
  for (const k of Object.keys(traces)) walk(traces[k], base[k], k);
  console.log(diffs === 0 ? 'DQ107 TRACE COMPARE: IDENTICAL' : 'DQ107 TRACE COMPARE: ' + diffs + '+ DIFFS (first 5 shown)');
} else {
  fs.writeFileSync('dq107trace.json', JSON.stringify(traces));
  console.log('trace written to ./dq107trace.json');
}
