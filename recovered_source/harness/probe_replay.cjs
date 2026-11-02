// Deterministic replay test for the autonomous combat validation loop.
// READ-ONLY: loads the build fresh per run, drives scripted input
// schedules through the REAL tick(), compares every tick, never modifies
// prototype/index.html. Spec: hidden_files/claude-loop/replay-spec.md
//
// Runs: reference (server timeline) / replay (identical schedule, fresh
// sim) / delayed (defender guard window +3 ticks) / reordered (defender
// guard edges swapped) / authority (reference schedule re-run AFTER all
// variants — must match the original reference exactly, proving variant
// sims never mutated the authoritative timeline).
// Gate: replay AND authority must have 0 divergent ticks. Delayed /
// reordered divergences are EXPECTED findings and never affect exit code.
const fs = require('fs'), vm = require('vm'), crypto = require('crypto');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const buildSha = crypto.createHash('sha256').update(html).digest('hex');
const SEED = 0xC0FFEE;
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {} }, dataset: {} });
function makeSandbox(seed) {
  const seededMath = Object.create(Math);
  seededMath.random = mulberry32(seed);
  const sandbox = {
    document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} },
    getComputedStyle: () => ({ getPropertyValue: () => '#000' }),
    ResizeObserver: class { observe() {} }, devicePixelRatio: 1,
    addEventListener: () => {}, performance: { now: () => 0 },
    requestAnimationFrame: () => {}, console, Math: seededMath,
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  return sandbox;
}
// bGuard: 'ref' | 'delayed' | 'reordered'. Returns run data.
function runSim(bGuard) {
  const sandbox = makeSandbox(SEED);
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox);
  const out = vm.runInContext(`(() => {
    const a0 = mk(0, 1), b0 = mk(0, 0);
    S = [a0, b0]; phase = 'fight'; hs = 0; tm = 45 * 60; sparks = []; cmb = 0; cmbT = 0;
    const a = S[0], b = S[1];
    a.x = 0; a.z = 0; a.fx = 1; a.fz = 0; a.ax = 1; a.az = 0;
    b.x = 0.75; b.z = 0; b.fx = -1; b.fz = 0; b.ax = -1; b.az = 0;
    a.st = 'idle'; b.st = 'idle'; a.aiT = 1e9; b.aiT = 1e9;
    a.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
    b.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
    H0.l = 0; H0.r = 0; H0.u = 0; H0.d = 0; H0.g = 0;
    const guardAt = (tk) => {
      if ('${bGuard}' === 'ref') return (tk >= 14 && tk < 30) ? 1 : 0;
      if ('${bGuard}' === 'delayed') return (tk >= 17 && tk < 33) ? 1 : 0;
      return (tk >= 30) ? 1 : 0; // reordered: on-edge arrives at 30, off-edge at 14 was a no-op
    };
    const frames = [], bGuardSeries = [];
    for (let tk = 0; tk < 260; tk++) {
      if (tk === 10) press('p', 1);
      if (tk === 40) { press('g', 1); press('p', 1); }
      if (tk === 45) press('g', 0);
      const g = guardAt(tk);
      b.i.l = 0; b.i.r = 0; b.i.u = 0; b.i.d = 0; b.i.g = g; b.i.bp = 0; b.i.bk = 0;
      bGuardSeries.push(g);
      tick();
      const snap = (f) => ({ x: f.x, y: f.y, z: f.z, vx: f.vx, vy: f.vy, vz: f.vz, st: f.st, t: f.t, hp: f.hp, fx: f.fx });
      frames.push({ tick: tk, a: snap(a), b: snap(b) });
    }
    return { frames: frames, bGuardSeries: bGuardSeries };
  })()`, sandbox);
  return out;
}
function throwSummary(frames) {
  let carry = null, release = null, touchdown = null, idle = null;
  for (const f of frames) {
    if (carry === null && f.b.st === 'carry') carry = f.tick;
    else if (carry !== null && release === null && f.b.st === 'air') release = f.tick;
    else if (release !== null && touchdown === null && f.b.st === 'down') touchdown = f.tick;
    else if (touchdown !== null && idle === null && f.b.st === 'idle') idle = f.tick;
  }
  const land = touchdown !== null ? frames.find(f => f.tick === touchdown).b.x : null;
  const last = frames[frames.length - 1];
  return { carryEntry: carry, releaseTick: release, touchdownTick: touchdown, idleEntry: idle, landingX: land, finalHpA: last.a.hp, finalHpB: last.b.hp };
}
function hpEvents(frames) {
  const ev = [];
  for (let i = 1; i < frames.length; i++) {
    if (frames[i - 1].a.hp !== frames[i].a.hp) ev.push({ tick: frames[i].tick, fighter: 'A', from: frames[i - 1].a.hp, to: frames[i].a.hp });
    if (frames[i - 1].b.hp !== frames[i].b.hp) ev.push({ tick: frames[i].tick, fighter: 'B', from: frames[i - 1].b.hp, to: frames[i].b.hp });
  }
  return ev;
}
function compare(ref, variant) {
  const FLOATS = ['x', 'y', 'z', 'vx', 'vy', 'vz'];
  let first = null, divTicks = 0;
  for (let i = 0; i < ref.frames.length; i++) {
    const fr = ref.frames[i], fv = variant.frames[i];
    let tickDiv = false;
    for (const who of ['a', 'b']) {
      for (const fld of FLOATS) {
        if (Math.abs(fr[who][fld] - fv[who][fld]) > 0.001) {
          tickDiv = true;
          if (!first) first = { tick: fr.tick, fighter: who, field: fld, ref: fr[who][fld], variant: fv[who][fld] };
        }
      }
      for (const fld of ['st', 't', 'fx']) {
        if (fr[who][fld] !== fv[who][fld]) {
          tickDiv = true;
          if (!first) first = { tick: fr.tick, fighter: who, field: fld, ref: fr[who][fld], variant: fv[who][fld] };
        }
      }
      if (Math.abs(fr[who].hp - fv[who].hp) > 0.001) {
        tickDiv = true;
        if (!first) first = { tick: fr.tick, fighter: who, field: 'hp', ref: fr[who].hp, variant: fv[who].hp };
      }
    }
    if (tickDiv) divTicks++;
  }
  let firstInputDelta = null;
  for (let i = 0; i < ref.bGuardSeries.length; i++) {
    if (ref.bGuardSeries[i] !== variant.bGuardSeries[i]) {
      firstInputDelta = { tick: i, refGuard: ref.bGuardSeries[i], variantGuard: variant.bGuardSeries[i] };
      break;
    }
  }
  let cause = null;
  if (first) {
    const near = (evs) => evs.filter(e => Math.abs(e.tick - first.tick) <= 2);
    cause = 'B guard input first differs at tick ' + (firstInputDelta ? firstInputDelta.tick : '?') +
      ' (ref ' + (firstInputDelta ? firstInputDelta.refGuard : '?') + ' -> variant ' + (firstInputDelta ? firstInputDelta.variantGuard : '?') + '); ' +
      'first state divergence at tick ' + first.tick + ' (' + first.fighter + '.' + first.field + ' ref ' + first.ref + ' -> variant ' + first.variant + '); ' +
      'hp events near that tick: ref ' + JSON.stringify(near(ref.hpEvents)) + ' variant ' + JSON.stringify(near(variant.hpEvents));
  }
  const tsR = ref.throwSummary, tsV = variant.throwSummary, throwDiff = {};
  for (const k of Object.keys(tsR)) if (tsR[k] !== tsV[k] && !(typeof tsR[k] === 'number' && typeof tsV[k] === 'number' && Math.abs(tsR[k] - tsV[k]) < 0.001)) throwDiff[k] = { ref: tsR[k], variant: tsV[k] };
  return { firstDivergence: first, divergentTicks: divTicks, firstInputDelta: firstInputDelta, cause: cause, throwDiff: throwDiff };
}
const ref = runSim('ref');
const replay = runSim('ref');
const delayed = runSim('delayed');
const reordered = runSim('reordered');
const authority = runSim('ref');
function pack(run, name) {
  return { name: name, throwSummary: throwSummary(run.frames), hpEvents: hpEvents(run.frames), frames: run.frames, bGuardSeries: run.bGuardSeries };
}
const P = { ref: pack(ref, 'reference'), replay: pack(replay, 'replay'), delayed: pack(delayed, 'delayed'), reordered: pack(reordered, 'reordered'), authority: pack(authority, 'authority') };
const comparisons = {
  replay: compare(P.ref, P.replay),
  delayed: compare(P.ref, P.delayed),
  reordered: compare(P.ref, P.reordered),
  authority: compare(P.ref, P.authority),
};
const replayOk = comparisons.replay.divergentTicks === 0;
const authorityOk = comparisons.authority.divergentTicks === 0;
const output = {
  buildSha: buildSha,
  runs: [P.ref, P.replay, P.delayed, P.reordered, P.authority].map(r => ({ name: r.name, throwSummary: r.throwSummary, hpEvents: r.hpEvents })),
  comparisons: comparisons,
  replayOk: replayOk, authorityOk: authorityOk,
  gatePass: replayOk && authorityOk,
};
console.log(JSON.stringify(output, null, 1));
if (!output.gatePass) { console.error('REPLAY GATE FAIL: replayOk=' + replayOk + ' authorityOk=' + authorityOk); process.exit(1); }
