// INPUT BUFFER SWEEP — punch-to-kick, punch-to-guard, evade-to-punch, grab-to-throw.
// Live build ONLY: prototype/index.html (e9112cf7). No rendering; pose() snapshots per tick.
// REASON FIRST (directive §2, before any diff): the engine has TWO buffer concepts.
//  (a) Press liveness: press() sets i.bp/i.bk = 6, decayed 1/tick (tick line 246) -> the
//      CURRENT input buffer is 6 frames = ~100 ms at 60 fps. H0 carries only held keys
//      (l/r/u/d/g); bp/bk survive tick()'s H0 assign because they are not in H0.
//  (b) Chain slot f.buf: during atk, from su onward, a live bp/bk is captured into buf
//      (line 193) and fires at chainAt = su+ac+(rc>>1) if the strike connected, else at
//      end of recovery (line 197). A captured buf NEVER expires on its own; it is only
//      dropped if the attack is interrupted (line 160). Guard (i.g) has NO countdown:
//      it is level-held, engaging only from free states (line 174); a tap during atk is
//      never read. A sidestep ('step') IS a free state, so a punch pressed during a
//      step fires immediately (attack priority over movement). A throw (G+P) requires
//      i.g + i.bp in the same update AND d < 1.4; out of range it degrades to a punch
//      (line 170), and during atk a G+P press feeds the chain slot as 'P', never 'T'.
//  Sweep: press-liveness BUFFER in {3, 6, 9} ticks (~50/100/150 ms). For punch-to-guard
//  the sweep ALSO tests SIMULATED guard-buffer variants (a tap keeps g live B ticks),
//  because the current engine has no guard buffer at all — those variants are harness
//  simulations, clearly labeled, not engine behavior.
//  Every trial runs twice (fresh load, same seed) and outcomes must match exactly:
//  deterministic combat timing (same inputs -> same results) is a pass/fail gate.
// Usage: node probe_input_buffers.cjs [smoke]  (smoke = 6 trials only)
// Output: hidden_files/claude-loop/input_buffer_sweep_20261031.json
const fs = require('fs'), vm = require('vm');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');
const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const BUILD = BASE + '/prototype/index.html';
const OUTJSON = BASE + '/hidden_files/claude-loop/input_buffer_sweep_20261031.json';
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const COLORS = { '--bg': '#eceae4', '--fg': '#1b1b1f', '--panel': '#ffffff', '--accent': '#d6452b', '--blue': '#2b6fd6', '--ring': '#d6d0c0' };
function loadBuild(seed) {
  const html = fs.readFileSync(BUILD, 'utf8');
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const canvas = createCanvas(960, 540);
  canvas.getContext('2d');
  canvas.getBoundingClientRect = () => ({ width: 960, height: 540 });
  canvas.addEventListener = () => {};
  canvas.style = {};
  const dummy = { addEventListener() {}, classList: { add() {}, toggle() {}, remove() {} }, style: {}, dataset: {} };
  const rng = mulberry32(seed);
  const mathProxy = Object.assign(Object.create(Math), { random: rng });
  const sandbox = { console, Math: mathProxy, performance: { now: () => 0 }, devicePixelRatio: 1,
    getComputedStyle: () => ({ getPropertyValue: n => COLORS[n] || '' }),
    ResizeObserver: class { constructor(cb) { this.cb = cb; } observe() { this.cb(); } },
    document: { getElementById: id => (id === 'c' ? canvas : dummy), querySelectorAll: () => [], documentElement: {}, body: dummy },
    addEventListener: () => {}, requestAnimationFrame: () => {} };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox); vm.runInContext(script, sandbox);
  return { run: s => vm.runInContext(s, sandbox) };
}
// Snapshot snippet: returns JSON with states, move identity, buf, hp, hs, roots, local poses.
// Helpers are defined INSIDE the string (vm gotcha: outer helpers are invisible inside).
function snapSnippet(att) {
  const def = 1 - att;
  return `(()=>{const qA=pose(S[${att}]),qD=pose(S[${def}]);
  const mv=f=>f.mv===M.P?'P':f.mv===M.K?'K':f.mv===M.L?'L':f.mv===M.T?'T':null;
  return JSON.stringify({aSt:S[${att}].st,aMv:mv(S[${att}]),aT:S[${att}].t,aBuf:S[${att}].buf,aHit:S[${att}].hit,aChainN:S[${att}].chainN,aHp:S[${att}].hp,aX:S[${att}].x,aY:S[${att}].y,aZ:S[${att}].z,aFx:S[${att}].fx,aFz:S[${att}].fz,aPose:qA,dSt:S[${def}].st,dHp:S[${def}].hp,dX:S[${def}].x,dY:S[${def}].y,dZ:S[${def}].z,dFx:S[${def}].fx,dFz:S[${def}].fz,dPose:qD,hs:hs});})()`;
}
// setInput: fighter 0 fields l/r/u/d/g go via H0 (tick resets S[0].i from H0); bp/bk via S[0].i.
// Fighter 1: everything via S[1].i (tick never resets it; ai is disabled with aiT=1e9).
function setSnippet(fig, field, value) {
  if (fig === 0 && ['l', 'r', 'u', 'd', 'g'].includes(field)) return `H0.${field}=${value};`;
  return `S[${fig}].i.${field}=${value};`;
}
function worldJoints(root, q) {
  const out = {};
  for (const k of ['pel', 'neck', 'head', 'hl', 'hr', 'fl', 'fr']) {
    const p = q[k]; if (!p) continue;
    out[k] = [root.x + root.fx * p[0] - root.fz * p[2], root.y + p[1], root.z + root.fz * p[0] + root.fx * p[2]];
  }
  return out;
}
function dist3(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

// One trial. cfg: {id, buffer, att, defDist, setup, events, endTick}
// events: [{tick, fig, field, value}] applied BEFORE that driver tick's tick() call.
// setup: {attX, defX} positions (attacker at attX facing +1, defender at defX facing -1).
function runTrial(cfg, seed) {
  const { run } = loadBuild(seed);
  const att = cfg.att, def = 1 - att;
  run(`S=[mk(-1.3,0),mk(1.3,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0;`);
  run(`S[${att}].x=${cfg.setup.attX}; S[${att}].z=0; S[${def}].x=${cfg.setup.defX}; S[${def}].z=0;`);
  run(`S[${att}].fx=1; S[${att}].fz=0; S[${def}].fx=-1; S[${def}].fz=0; S[${att}].ax=1; S[${att}].az=0; S[${def}].ax=-1; S[${def}].az=0;`);
  run(`S[${att}].st='idle'; S[${def}].st='idle'; S[${att}].aiT=1e9; S[${def}].aiT=1e9;`);
  run(`S[${att}].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0}; S[${def}].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};`);
  run(`H0.l=0; H0.r=0; H0.u=0; H0.d=0; H0.g=0;`);
  if (cfg.setupExtra) run(cfg.setupExtra);
  const snaps = [];
  const eventsByTick = {};
  for (const e of cfg.events) (eventsByTick[e.tick] = eventsByTick[e.tick] || []).push(e);
  for (let tk = 0; tk <= cfg.endTick; tk++) {
    for (const e of (eventsByTick[tk] || [])) run(setSnippet(e.fig, e.field, e.value));
    const hsBefore = run(`hs`);
    run(`tick();`);
    const s = JSON.parse(run(snapSnippet(att)));
    s.tick = tk; s.frozen = hsBefore > 0;
    snaps.push(s);
  }
  return snaps;
}
// Analyze snapshots + the trial's press list into outcome metrics.
// presses: [{tick, kind: 'P'|'K'|'G'|'GP'|'step', label}] — the tested inputs, in order.
function analyze(cfg, snaps) {
  const att = cfg.att;
  const events = [];
  // Seed prev as pre-trial idle so actions firing on driver tick 0 are recorded
  // (previously the first snapshot had no predecessor and tick-0 fires were missed).
  let prev = { aSt: 'idle', aChainN: 0, aBuf: null, dSt: 'idle' };
  for (const s of snaps) {
    if (true) {
      if (s.aSt === 'atk' && (prev.aSt !== 'atk' || s.aChainN > prev.aChainN)) events.push({ type: 'fire', tick: s.tick, mv: s.aMv, t: s.aT, chain: s.aChainN > prev.aChainN, aX: +s.aX.toFixed(3), aZ: +s.aZ.toFixed(3) });
      if (s.aBuf && !prev.aBuf) events.push({ type: 'capture', tick: s.tick, buf: s.aBuf });
      if (s.aSt === 'guard' && prev.aSt !== 'guard') events.push({ type: 'guard', tick: s.tick });
      if (s.aSt === 'step' && prev.aSt !== 'step') events.push({ type: 'step', tick: s.tick });
      if (s.dSt === 'carry' && prev.dSt !== 'carry') events.push({ type: 'throwConnect', tick: s.tick });
      if (s.dSt === 'air' && prev.dSt !== 'air') events.push({ type: 'throwRelease', tick: s.tick });
    }
    prev = s;
  }
  // Discontinuity + balance. WORLD frame conflates root motion and facing flips
  // (a facing flip mirrors every world joint, faking a ~1 m "snap"), so the selection
  // uses LOCAL frame (root-relative pose joints, flip-invariant) plus world foot drift
  // counted ONLY on ticks where facing did not change. Root motion is reported
  // separately (knockback/launch speed, legitimate) and is never a snap.
  let maxJointStep = 0, maxNeckHead = 0, minNeckHead = 99, maxPelNeck = 0, minPelNeck = 99;
  let maxFootDrift = 0, bothAirTicks = 0;
  let maxLocalStep = 0, maxLocalFootDrift = 0, maxWorldDriftNoFlip = 0, facingFlips = 0, maxRootStep = 0;
  let prevW = null, prevL = null, prevFacing = null, prevRoot = null;
  for (const s of snaps) {
    const wA = worldJoints({ x: s.aX, y: s.aY, z: s.aZ, fx: s.aFx, fz: s.aFz }, s.aPose);
    const lA = s.aPose;
    const facing = `${s.aFx},${s.aFz}`;
    const flipped = prevFacing !== null && facing !== prevFacing;
    if (flipped) facingFlips++;
    if (prevW) {
      for (const k of Object.keys(wA)) { const d = dist3(wA[k], prevW[k]); if (d > maxJointStep) maxJointStep = d; }
      for (const f of ['fl', 'fr']) {
        if (wA[f][1] <= 0.06 && prevW[f][1] <= 0.06) { const d = dist3(wA[f], prevW[f]); if (d > maxFootDrift) maxFootDrift = d; }
        if (!flipped && wA[f][1] <= 0.06 && prevW[f][1] <= 0.06) { const d = dist3(wA[f], prevW[f]); if (d > maxWorldDriftNoFlip) maxWorldDriftNoFlip = d; }
      }
      const rd = Math.hypot(s.aX - prevRoot.x, s.aY - prevRoot.y, s.aZ - prevRoot.z);
      if (rd > maxRootStep) maxRootStep = rd;
    }
    if (prevL) {
      for (const k of Object.keys(lA)) {
        if (!lA[k] || !prevL[k]) continue;
        const d = dist3(lA[k], prevL[k]); if (d > maxLocalStep) maxLocalStep = d;
      }
      for (const f of ['fl', 'fr']) {
        const hNow = s.aY + lA[f][1], hPrev = prevRoot.y + prevL[f][1];
        if (hNow <= 0.06 && hPrev <= 0.06) { const d = dist3(lA[f], prevL[f]); if (d > maxLocalFootDrift) maxLocalFootDrift = d; }
      }
    }
    if (wA.fl && wA.fr && wA.fl[1] > 0.06 && wA.fr[1] > 0.06) bothAirTicks++;
    const nh = dist3(wA.neck, wA.head), pn = dist3(wA.pel, wA.neck);
    if (nh > maxNeckHead) maxNeckHead = nh; if (nh < minNeckHead) minNeckHead = nh;
    if (pn > maxPelNeck) maxPelNeck = pn; if (pn < minPelNeck) minPelNeck = pn;
    prevW = wA; prevL = lA; prevFacing = facing; prevRoot = { x: s.aX, y: s.aY, z: s.aZ };
  }
  const first = snaps[0], last = snaps[snaps.length - 1];
  return {
    events,
    fires: events.filter(e => e.type === 'fire'),
    finalHp: { att: last.aHp, def: last.dHp },
    finalStates: { att: last.aSt, def: last.dSt },
    maxJointStepM: +maxJointStep.toFixed(4),
    maxLocalJointStepM: +maxLocalStep.toFixed(4),
    maxLocalFootDriftM: +maxLocalFootDrift.toFixed(4),
    maxWorldFootDriftNoFlipM: +maxWorldDriftNoFlip.toFixed(4),
    facingFlips,
    maxRootStepM: +maxRootStep.toFixed(4),
    neckHeadRangeM: [+minNeckHead.toFixed(3), +maxNeckHead.toFixed(3)],
    pelNeckRangeM: [+minPelNeck.toFixed(3), +maxPelNeck.toFixed(3)],
    maxPlantedFootDriftM: +maxFootDrift.toFixed(4),
    bothFeetAirborneTicks: bothAirTicks,
  };
}
// Trial builders. B = press-liveness buffer (3/6/9). Offsets in driver ticks.
function ev(tick, fig, field, value) { return { tick, fig, field, value }; }
function pressP(tick, fig, B) { return ev(tick, fig, 'bp', B); }
function pressK(tick, fig, B) { return ev(tick, fig, 'bk', B); }
function hold(tick, fig, field, value) { return ev(tick, fig, field, value); }
const trials = [];
function addTrial(id, buffer, att, defDist, events, endTick, presses) {
  trials.push({ id, buffer, att, setup: { attX: 0, defX: defDist }, events, endTick, presses });
}
// --- PUNCH-TO-KICK: punch at tick 0 (connects at 0.7 m), kick press at offsets. ---
for (const B of [3, 6, 9]) for (const att of [0, 1]) {
  for (const off of [1, 5, 6, 9, 13, 16, 19]) {
    addTrial(`PK-B${B}-A${att}-off${off}`, B, att, 0.7,
      [pressP(0, att, B), pressK(off, att, B)], 60,
      [{ tick: 0, kind: 'P', label: 'punch' }, { tick: off, kind: 'K', label: 'kick-press' }]);
  }
  // Whiff variant: defender at 1.5 m (punch misses) -> chain fires only at end (t=19).
  for (const off of [9, 13, 16, 19]) {
    addTrial(`PKW-B${B}-A${att}-off${off}`, B, att, 1.5,
      [pressP(0, att, B), pressK(off, att, B)], 60,
      [{ tick: 0, kind: 'P', label: 'punch-whiff' }, { tick: off, kind: 'K', label: 'kick-press' }]);
  }
}
// --- PUNCH-TO-GUARD: punch at tick 0 (connects). Guard HOLD / TAP / SIM-buffered-tap. ---
// NOTE: guard hold starts tick 1, NOT tick 0 — g+bp together in range would fire a THROW
// (line 169), not the intended punch. Same reason GT-WALK holds g only from the press tick.
for (const att of [0]) {
  addTrial(`PG-HOLD`, 6, att, 0.7, [pressP(0, att, 6), hold(1, att, 'g', 1)], 60,
    [{ tick: 0, kind: 'P', label: 'punch' }, { tick: 1, kind: 'G-hold', label: 'guard-hold' }]);
  for (const off of [1, 6, 9, 13, 16, 19, 20]) {
    addTrial(`PG-TAP-off${off}`, 6, att, 0.7,
      [pressP(0, att, 6), hold(off, att, 'g', 1), hold(off + 1, att, 'g', 0)], 60,
      [{ tick: 0, kind: 'P', label: 'punch' }, { tick: off, kind: 'G-tap', label: 'guard-tap' }]);
  }
  // SIMULATED guard buffer: tap keeps g live B ticks (harness simulation, NOT engine
  // behavior). CORRECTED offsets: a connecting punch + hs=6 freeze ends at driver
  // tick 25 (idle), so guard can first engage at 26. A tap bridges recovery iff its
  // live window covers tick 26. Taps at 20/22/24 x B=3/6/9 map that boundary exactly.
  for (const B of [3, 6, 9]) for (const off of [20, 22, 24]) {
    const evs = [pressP(0, att, 6)];
    for (let t = off; t < off + B; t++) evs.push(hold(t, att, 'g', 1));
    evs.push(hold(off + B, att, 'g', 0));
    addTrial(`PG-SIMB${B}-off${off}`, B, att, 0.7, evs, 60,
      [{ tick: 0, kind: 'P', label: 'punch' }, { tick: off, kind: 'G-simbuf', label: `guard-tap-live-${B}` }]);
  }
  // SIM stale tests: guard tap at 22 (live B ticks), then an attack press at 27
  // (first ticks after guard would engage at 26). P+live-g in range = THROW (the
  // stale guard converts the intended punch); K+live-g = kick fires, guard after.
  for (const B of [3, 6, 9]) {
    const evsP = [pressP(0, att, 6)];
    for (let t = 22; t < 22 + B; t++) evsP.push(hold(t, att, 'g', 1));
    evsP.push(hold(22 + B, att, 'g', 0), pressP(27, att, 6));
    addTrial(`PG-STALE-B${B}`, B, att, 0.7, evsP, 80,
      [{ tick: 0, kind: 'P', label: 'punch' }, { tick: 22, kind: 'G-simbuf', label: `guard-tap-live-${B}` }, { tick: 27, kind: 'P', label: 'punch-after-tap' }]);
    const evsK = [pressP(0, att, 6)];
    for (let t = 22; t < 22 + B; t++) evsK.push(hold(t, att, 'g', 1));
    evsK.push(hold(22 + B, att, 'g', 0), pressK(27, att, 6));
    addTrial(`PG-STALEK-B${B}`, B, att, 0.7, evsK, 80,
      [{ tick: 0, kind: 'P', label: 'punch' }, { tick: 22, kind: 'G-simbuf', label: `guard-tap-live-${B}` }, { tick: 27, kind: 'K', label: 'kick-after-tap' }]);
  }
  // Boundary controls: tap ON the recovery-end tick (25: atk branch runs, free-state
  // handling does not, so the tap is lost) and tap on the first idle tick (26: guard).
  addTrial(`PG-TAP-off25`, 6, att, 0.7,
    [pressP(0, att, 6), hold(25, att, 'g', 1), hold(26, att, 'g', 0)], 60,
    [{ tick: 0, kind: 'P', label: 'punch' }, { tick: 25, kind: 'G-tap', label: 'guard-tap' }]);
  addTrial(`PG-TAP-off26`, 6, att, 0.7,
    [pressP(0, att, 6), hold(26, att, 'g', 1), hold(27, att, 'g', 0)], 60,
    [{ tick: 0, kind: 'P', label: 'punch' }, { tick: 26, kind: 'G-tap', label: 'guard-tap' }]);
}
// --- EVADE-TO-PUNCH: sidestep (hold d) from tick 0; punch press at offsets. ---
for (const B of [3, 6, 9]) for (const att of [0, 1]) {
  for (const off of [1, 6, 11, 13, 16, 20]) {
    addTrial(`EP-B${B}-A${att}-off${off}`, B, att, 0.8,
      [hold(0, att, 'd', 1), pressP(off, att, B)], 60,
      [{ tick: 0, kind: 'step', label: 'sidestep-hold' }, { tick: off, kind: 'P', label: 'punch-press' }]);
  }
  // Preemption control: punch + step ordered the same tick -> punch wins, step never starts.
  addTrial(`EP-PREEMPT-B${B}-A${att}`, B, att, 0.8,
    [pressP(0, att, B), hold(0, att, 'd', 1)], 60,
    [{ tick: 0, kind: 'P', label: 'punch-press' }, { tick: 0, kind: 'step', label: 'sidestep-hold' }]);
}
// --- GRAB-TO-THROW: G+P = held g + bp press. ---
for (const B of [3, 6, 9]) for (const att of [0, 1]) {
  // Stationary at fixed distances (g held whole trial).
  // tryHit throw range: strike point (thrower + facing*0.75) must be within HURT_T=0.4
  // of the victim, so throws CONNECT only for victim distance in [0.35, 1.15]:
  // 0.5/0.75 connect; 1.2/1.39 start a throw that WHIFFS on range; 1.5 degrades to punch.
  for (const d of [1.5, 1.39, 1.2, 0.75, 0.5]) {
    addTrial(`GT-STAT-B${B}-A${att}-d${d}`, B, att, d,
      [hold(0, att, 'g', 1), pressP(0, att, B)], 200,
      [{ tick: 0, kind: 'GP', label: 'grab-throw-press' }]);
  }
  // Walking in from 1.6 m (hold r); g held ONLY from the press tick (holding g from
  // tick 0 would guard in place instead of walking — line 174 guard branch precedes
  // movement). Range closes ~tick 6. A gate-refused press survives (go() returns
  // false WITHOUT consuming bp/bk) and can convert to a throw once in range.
  for (const off of [0, 2, 4, 5, 6]) {
    addTrial(`GT-WALK-B${B}-A${att}-off${off}`, B, att, 1.6,
      [hold(0, att, 'r', 1), hold(off, att, 'g', 1), pressP(off, att, B)], 200,
      [{ tick: 0, kind: 'walk', label: 'approach' }, { tick: off, kind: 'GP', label: 'grab-throw-press' }]);
  }
  // G+P pressed DURING a punch (connects): throw input feeds the chain slot as 'P'.
  for (const off of [6, 9, 13]) {
    addTrial(`GT-DURING-P-B${B}-A${att}-off${off}`, B, att, 0.7,
      [pressP(0, att, B), hold(off, att, 'g', 1), pressP(off, att, B)], 80,
      [{ tick: 0, kind: 'P', label: 'punch' }, { tick: off, kind: 'GP', label: 'grab-throw-press-during-punch' }]);
  }
  // G+P pressed DURING a sidestep, in range -> throw fires from the free step state.
  addTrial(`GT-STEP-B${B}-A${att}`, B, att, 0.75,
    [hold(0, att, 'd', 1), hold(6, att, 'g', 1), pressP(6, att, B)], 200,
    [{ tick: 0, kind: 'step', label: 'sidestep-hold' }, { tick: 6, kind: 'GP', label: 'grab-throw-press-during-step' }]);
}
// Whiff control (B=6): attacker uppercut (pc=3, pw=14 -> stumble, sdur 33) at 0.5 m
// stumbles the defender (~ticks 15-47); attacker uppercut ends tick 25 (freeze
// shifted); attacker G+P at tick 27 fires a throw whose active frames run while the
// defender is still stumbling -> tryHit refuses the grab (victim must be
// idle/walk/guard/step). If the defender's 15% desperation strike fires, events show it.
{
  const att = 0, def = 1;
  const t = { id: `GT-WHIFF`, buffer: 6, att, setup: { attX: 0, defX: 0.5 },
    events: [pressP(0, att, 6), hold(27, att, 'g', 1), pressP(27, att, 6)], endTick: 150,
    presses: [{ tick: 0, kind: 'P', label: 'attacker-uppercut' }, { tick: 27, kind: 'GP', label: 'grab-throw-press' }],
    setupExtra: `S[${att}].pc=3;` };
  trials.push(t);
}
// Stun stale-fire special: defender jab (pn0, pw=8 -> stun dur 14 + hs=6 freeze) at
// tick 0 hits the attacker; attacker presses P at ticks 14/20/26 (early/mid/late stun).
// Short buffers expire inside stun; long buffers can fire after stun ends (late fire).
for (const B of [3, 6, 9]) for (const off of [14, 20, 26]) {
  const att = 0, def = 1;
  addTrial(`STUN-B${B}-off${off}`, B, att, 0.7,
    [pressP(0, def, 6), pressP(off, att, B)], 80,
    [{ tick: 0, kind: 'P-def', label: 'defender-jab' }, { tick: off, kind: 'P', label: 'attacker-punch-during-stun' }]);
}
const SMOKE = process.argv[2] === 'smoke';
const selected = SMOKE ? trials.filter(t => ['PK-B6-A0-off1', 'PK-B6-A0-off13', 'GT-STAT-B6-A0-d1.5', 'GT-STAT-B6-A0-d0.75', 'EP-B6-A0-off6', 'PG-TAP-off13'].includes(t.id)) : trials;
const results = [];
for (const t of selected) {
  const a1 = analyze(t, runTrial(t, 0xC0FFEE));
  const a2 = analyze(t, runTrial(t, 0xC0FFEE));
  const det = JSON.stringify(a1) === JSON.stringify(a2);
  results.push({ id: t.id, buffer: t.buffer, att: t.att, presses: t.presses, analysis: a1, deterministic: det });
  if (!det) console.log('NONDETERMINISTIC:', t.id);
  console.log('done', t.id, 'det=', det, 'fires=', a1.fires.map(f => `${f.mv}@${f.tick}`).join(',') || 'none', 'defHp=', a1.finalHp.def);
}
fs.writeFileSync(OUTJSON, JSON.stringify({ build: 'prototype/index.html', trials: results, count: results.length }, null, 1));
console.log('wrote', OUTJSON, 'trials:', results.length);
