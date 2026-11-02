// Movement-authority probe for the autonomous combat regression suite.
// READ-ONLY: loads the build, drives scripted scenarios in the node vm
// harness, measures, never modifies prototype/index.html.
// Spec: hidden_files/claude-loop/movement-authority-spec.md
// (authority table, handoff rules, invariants, tolerances).
//
// Drive: a tick-equivalent loop mirroring tick() fight-phase core (H0
// assign, bp decay, update order, separation, hitstop freeze) minus
// camera/sparks/message timers, which cannot affect fighters. A smoke run
// drives the SAME throw baseline through the REAL tick() and requires
// bit-identical state sequences (0.001), or the probe reports PROBE_ERROR
// and stops: the suite must never certify the engine with a broken loop.
// Scenarios: shipped throws both directions (idle baseline + 4 opposing
// defender-input variants each, inputs starting at the hit tick), launcher
// knockdown (baseline + combined inputs), stumble with sdesp forced 0 and
// forced 1, recovery extensions on baselines (both fighters).
// Output shape matches the contact probe ({runs:[{label,hard,soft}]}) so
// the shared diff_contact_consistency.cjs gates promotion.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const FREE = ['idle', 'walk', 'guard', 'step'];
const out = vm.runInContext(`(() => {
  const snap = (tick, frozen, sep) => {
    const a = S[0], b = S[1];
    const fa = { x: a.x, y: a.y, z: a.z, vx: a.vx, vy: a.vy, vz: a.vz, st: a.st, t: a.t, hp: a.hp, fx: a.fx, ax: a.ax, az: a.az, buf: a.buf || null };
    const fb = { x: b.x, y: b.y, z: b.z, vx: b.vx, vy: b.vy, vz: b.vz, st: b.st, t: b.t, hp: b.hp, fx: b.fx, kp: b.kp || 0, desp: b.desp || 0, throwStyle: b.throwStyle || null };
    if (b.throwStyle) { const CP = throwPhase(THROW_PHASES[b.throwStyle], 'carry'); if (CP) fb.carryCP = { lift: CP.lift, liftFrames: CP.liftFrames }; }
    return { tick: tick, frozen: frozen, sep: sep, a: fa, b: fb };
  };
  const resetKeys = () => { H0.l = 0; H0.r = 0; H0.u = 0; H0.d = 0; H0.g = 0; };
  // Tick-equivalent loop. cfg: {atkStyle, defStyle, mode, defSched, sdesp, recovery}
  // defSched: 'idle' | 'away' | 'toward' | 'guard' | 'mash' | 'combined'
  const runLoop = (cfg) => {
    const a0 = mk(0, cfg.atkStyle), b0 = mk(0, cfg.defStyle);
    S = [a0, b0]; phase = 'fight'; hs = 0; tm = 45 * 60; sparks = []; cmb = 0; cmbT = 0;
    const a = S[0], b = S[1];
    a.x = 0; a.z = 0; a.fx = 1; a.fz = 0; a.ax = 1; a.az = 0;
    b.x = 0.75; b.z = 0; b.fx = -1; b.fz = 0; b.ax = -1; b.az = 0;
    a.st = 'idle'; b.st = 'idle'; a.aiT = 1e9; b.aiT = 1e9;
    a.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 }; b.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
    resetKeys();
    if (cfg.mode === 'stumble') a.pc = 3;
    const frames = [];
    const marks = {};
    let hitTick = null, hitState = null, hitKp = null, idleEntry = null, thrIdleEntry = null;
    let stage = 'main', stageTick = 0, walkFrom = null, walkDir = null;
    const defInput = (tick) => {
      if (!hitTick && hitTick !== 0) return;
      if (tick < hitTick) return;
      const s = cfg.defSched;
      b.i.l = 0; b.i.r = 0; b.i.g = 0;
      if (s === 'away') b.i.l = 1;
      else if (s === 'toward') b.i.r = 1;
      else if (s === 'guard') b.i.g = 1;
      else if (s === 'mash') b.i.bp = 6;
      else if (s === 'combined') { b.i.l = 1; b.i.g = 1; b.i.bp = 6; }
    };
    for (let tick = 0; tick < 900; tick++) {
      // Attacker schedule.
      if (stage === 'main') {
        if (tick === 10) {
          if (cfg.mode === 'throw') { press('g', 1); press('p', 1); }
          else if (cfg.mode === 'launcher') { press('pk', 1); }
          else if (cfg.mode === 'stumble') { press('p', 1); }
        }
        if (tick === 35) press('g', 0);
      } else if (stage === 'recWalkV') { b.i.l = 1; b.i.r = 0; b.i.g = 0; }
      else if (stage === 'recPunchV') { b.i.bp = 6; }
      else if (stage === 'recGuardV') { b.i.g = 1; }
      else if (stage === 'recWalkT') { press('r', 1); }
      else if (stage === 'recPunchT') { press('p', 1); }
      else if (stage === 'recGuardT') { press('g', 1); }
      if (stage === 'main') defInput(tick);
      if (hs > 0) { hs--; frames.push(snap(tick, true, false)); }
      else {
        Object.assign(a.i, H0);
        for (const f of S) { if (f.i.bp > 0) f.i.bp--; if (f.i.bk > 0) f.i.bk--; }
        update(a, b); update(b, a);
        const dPre = Math.hypot(b.x - a.x, b.z - a.z);
        let sep = false;
        if (dPre < .6 && a.y < .6 && b.y < .6) {
          const p = (.6 - dPre) / 2, nx = (b.x - a.x) / (dPre || 1), nz = (b.z - a.z) / (dPre || 1);
          a.x -= nx * p; a.z -= nz * p; b.x += nx * p; b.z += nz * p; sep = true;
        }
        frames.push(snap(tick, false, sep));
      }
      const fr = frames[frames.length - 1];
      // Hit detection: first frame victim leaves free states into the mode state.
      if (hitTick === null) {
        const want = cfg.mode === 'throw' ? 'carry' : cfg.mode === 'launcher' ? 'air' : 'stumble';
        if (fr.b.st === want && tick >= 10) {
          hitTick = tick; hitState = want; hitKp = fr.b.kp;
          if (cfg.mode === 'stumble' && cfg.sdesp !== null && cfg.sdesp !== undefined) b.sdesp = cfg.sdesp;
        }
      }
      if (hitTick !== null && thrIdleEntry === null && fr.a.st === 'idle' && tick > hitTick) thrIdleEntry = tick;
      if (stage === 'main' && hitTick !== null && idleEntry === null && fr.b.st === 'idle' && tick > hitTick) {
        // Victim idle-entry: for throw/knockdown this follows getup; for
        // stumble it follows stumble (or desperation-returned stumble).
        if (cfg.mode === 'throw' || cfg.mode === 'launcher') idleEntry = tick;
        else if (cfg.mode === 'stumble') idleEntry = tick;
      }
      const prevStage = stage;
      if (stage === 'main' && cfg.recovery && idleEntry !== null && tick >= idleEntry + 10 && cfg.defSched === 'idle') {
        stage = 'zero'; stageTick = tick; resetKeys();
        b.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
      } else if (stage === 'zero' && tick >= stageTick + 30) { stage = 'recWalkV'; stageTick = tick; walkFrom = b.x; }
      else if (stage === 'recWalkV' && tick >= stageTick + 10) { stage = 'recPunchV'; stageTick = tick; b.i.l = 0; }
      else if (stage === 'recPunchV' && fr.b.st === 'atk') { stage = 'recGuardV'; stageTick = tick; b.i.bp = 0; }
      else if (stage === 'recPunchV' && tick >= stageTick + 10) { stage = 'recGuardV'; stageTick = tick; }
      else if (stage === 'recGuardV' && fr.b.st === 'guard') { stage = 'recWalkT'; stageTick = tick; b.i.g = 0; resetKeys(); }
      else if (stage === 'recGuardV' && tick >= stageTick + 40) { stage = 'recWalkT'; stageTick = tick; b.i.g = 0; resetKeys(); }
      else if (stage === 'recWalkT' && tick >= stageTick + 10) { stage = 'recPunchT'; stageTick = tick; press('r', 0); }
      else if (stage === 'recPunchT' && fr.a.st === 'atk') { stage = 'recGuardT'; stageTick = tick; }
      else if (stage === 'recPunchT' && tick >= stageTick + 10) { stage = 'recGuardT'; stageTick = tick; }
      else if (stage === 'recGuardT' && fr.a.st === 'guard') { stage = 'done'; }
      else if (stage === 'recGuardT' && tick >= stageTick + 40) { stage = 'done'; }
      if (stage !== prevStage) marks[stage] = tick;
      if (stage === 'main' && !cfg.recovery && idleEntry !== null) break;
      if (stage === 'done') break;
    }
    return { frames: frames, hitTick: hitTick, hitState: hitState, hitKp: hitKp, idleEntry: idleEntry, thrIdleEntry: thrIdleEntry, finalStage: stage, marks: marks };
  };
  // Real-tick smoke run: same throw baseline through tick().
  const runRealTick = () => {
    const a0 = mk(0, 1), b0 = mk(0, 0);
    S = [a0, b0]; phase = 'fight'; hs = 0; tm = 45 * 60; sparks = []; cmb = 0; cmbT = 0;
    const a = S[0], b = S[1];
    a.x = 0; a.z = 0; a.fx = 1; a.fz = 0; a.ax = 1; a.az = 0;
    b.x = 0.75; b.z = 0; b.fx = -1; b.fz = 0; b.ax = -1; b.az = 0;
    a.st = 'idle'; b.st = 'idle'; a.aiT = 1e9; b.aiT = 1e9;
    a.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 }; b.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
    resetKeys();
    const frames = [];
    let idleEntry = null;
    for (let tk = 0; tk < 400; tk++) {
      if (tk === 10) { press('g', 1); press('p', 1); }
      if (tk === 35) press('g', 0);
      tick();
      frames.push(snap(tk, false, false));
      const fr = frames[frames.length - 1];
      if (idleEntry === null && fr.b.st === 'idle' && tk > 15) idleEntry = tk;
      if (idleEntry !== null) break;
    }
    return { frames: frames, idleEntry: idleEntry };
  };
  const scenarios = [
    { name: 'throw-blue-baseline', atkStyle: 1, defStyle: 0, mode: 'throw', defSched: 'idle', recovery: true },
    { name: 'throw-red-baseline', atkStyle: 0, defStyle: 1, mode: 'throw', defSched: 'idle', recovery: true },
    { name: 'throw-blue-away', atkStyle: 1, defStyle: 0, mode: 'throw', defSched: 'away' },
    { name: 'throw-blue-toward', atkStyle: 1, defStyle: 0, mode: 'throw', defSched: 'toward' },
    { name: 'throw-blue-guard', atkStyle: 1, defStyle: 0, mode: 'throw', defSched: 'guard' },
    { name: 'throw-blue-mash', atkStyle: 1, defStyle: 0, mode: 'throw', defSched: 'mash' },
    { name: 'throw-red-away', atkStyle: 0, defStyle: 1, mode: 'throw', defSched: 'away' },
    { name: 'throw-red-toward', atkStyle: 0, defStyle: 1, mode: 'throw', defSched: 'toward' },
    { name: 'throw-red-guard', atkStyle: 0, defStyle: 1, mode: 'throw', defSched: 'guard' },
    { name: 'throw-red-mash', atkStyle: 0, defStyle: 1, mode: 'throw', defSched: 'mash' },
    { name: 'knockdown-baseline', atkStyle: 1, defStyle: 0, mode: 'launcher', defSched: 'idle', recovery: true },
    { name: 'knockdown-inputs', atkStyle: 1, defStyle: 0, mode: 'launcher', defSched: 'combined' },
    { name: 'stumble-0-baseline', atkStyle: 1, defStyle: 0, mode: 'stumble', defSched: 'idle', sdesp: 0, recovery: true },
    { name: 'stumble-0-inputs', atkStyle: 1, defStyle: 0, mode: 'stumble', defSched: 'combined', sdesp: 0 },
    { name: 'stumble-1-desperation', atkStyle: 1, defStyle: 0, mode: 'stumble', defSched: 'idle', sdesp: 1, recovery: true }
  ];
  const results = [];
  for (const cfg of scenarios) { const r = runLoop(cfg); r.name = cfg.name; r.cfg = cfg; results.push(r); }
  const smokeLoop = runLoop({ atkStyle: 1, defStyle: 0, mode: 'throw', defSched: 'idle' });
  const smokeReal = runRealTick();
  return { results: results, smokeLoop: smokeLoop, smokeReal: smokeReal };
})()`, sandbox);

// ---------- Node-side checks ----------
const KNOWN = ['idle', 'walk', 'guard', 'step', 'atk', 'stun', 'down', 'getup', 'stumble', 'carry', 'air'];
const FWD = 2.3, BACK = 1.5, GRAV_DT_AIR = 0.6;
const close = (a, b, t) => Math.abs(a - b) <= t;
const sstep = (s) => { const u = Math.max(0, Math.min(1, s)); return u * u * (3 - 2 * u); };
function anchorExpected(style, t, cp) {
  if (style === 'ippon') { const uL = Math.max(0, Math.min(1, (t - 19) / 5)); return { anch: 0.8 - 0.50 * sstep(uL), lift: 0.65 * sstep(uL) }; }
  if (style === 'shoulder') { const uu = Math.min(1, t / (cp ? cp.liftFrames : 16)); return { anch: 0.8 - 0.30 * sstep(uu), lift: (cp ? cp.lift : 0.60) * sstep(uu) }; }
  const uu = Math.min(1, t / (cp ? cp.liftFrames : 10));
  return { anch: 0.8, lift: (cp ? cp.lift : 0.60) * sstep(uu) };
}
function checkRun(r) {
  const hard = [], soft = [], notes = [];
  const F = r.frames, cfg = r.cfg;
  // Setup verification.
  let setupOk = true;
  if (r.hitTick === null) { setupOk = false; notes.push('no hit detected'); }
  else {
    const hf = F[r.hitTick];
    if (cfg.mode === 'throw' && hf.b.st !== 'carry') { setupOk = false; notes.push('throw hit state ' + hf.b.st + ' != carry'); }
    if (cfg.mode === 'launcher' && hf.b.st !== 'air') { setupOk = false; notes.push('launcher hit state ' + hf.b.st + ' != air'); }
    if (cfg.mode === 'stumble' && hf.b.st !== 'stumble') { setupOk = false; notes.push('stumble hit state ' + hf.b.st + ' != stumble'); }
    const pre = F[r.hitTick - 1];
    if (pre) {
      const dhp = pre.b.hp - hf.b.hp;
      if (cfg.mode === 'throw' && dhp !== 22) { setupOk = false; notes.push('throw damage ' + dhp + ' != 22'); }
      if (cfg.mode !== 'throw' && dhp !== hf.b.kp) { setupOk = false; notes.push('damage ' + dhp + ' != kp ' + hf.b.kp); }
      if (cfg.mode === 'stumble' && hf.b.kp < 12) { setupOk = false; notes.push('stumble kp ' + hf.b.kp + ' < 12'); }
    }
  }
  if (!setupOk) return { hard: [], soft: [], setupOk: false, notes };
  // State validity + separation + facing + dual-carry + HP (all frames).
  let sepCount = 0;
  const hpChangesA = [], hpChangesB = [];
  for (let i = 0; i < F.length; i++) {
    const f = F[i];
    for (const side of ['a', 'b']) {
      if (!KNOWN.includes(f[side].st)) hard.push('invalid state ' + f[side].st + ' @' + f.tick);
      for (const k of ['x', 'y', 'z', 'vx', 'vy', 'vz']) if (!Number.isFinite(f[side][k])) hard.push('NaN ' + side + '.' + k + ' @' + f.tick);
    }
    if (f.a.st === 'carry' && f.b.st === 'carry') hard.push('dual carry @' + f.tick);
    if (f.a.y < 0.6 && f.b.y < 0.6) {
      const d = Math.hypot(f.b.x - f.a.x, f.b.z - f.a.z);
      if (d < 0.599) hard.push('separation violated d=' + d.toFixed(3) + ' @' + f.tick);
    }
    if (f.sep) sepCount++;
    if (FREE.includes(f.a.st) && FREE.includes(f.b.st) && f.a.y <= 0.05 && f.b.y <= 0.05) {
      if ((f.b.x - f.a.x) * f.a.fx <= 0) hard.push('thrower not facing victim @' + f.tick);
      if ((f.a.x - f.b.x) * f.b.fx <= 0) hard.push('victim not facing thrower @' + f.tick);
    }
    if (i > 0) {
      if (F[i - 1].a.hp !== f.a.hp) hpChangesA.push({ tick: f.tick, from: F[i - 1].a.hp, to: f.a.hp, vicSt: f.b.st });
      if (F[i - 1].b.hp !== f.b.hp) hpChangesB.push({ tick: f.tick, from: F[i - 1].b.hp, to: f.b.hp, atkSt: f.a.st, dist: Math.hypot(f.b.x - f.a.x, f.b.z - f.a.z).toFixed(3) });
    }
  }
  notes.push('separation fired ' + sepCount + ' ticks');
  const vicChanges = hpChangesB.filter(c => c.tick !== r.hitTick && (r.idleEntry === null || c.tick <= r.idleEntry));
  if (vicChanges.length) hard.push('victim hp change outside hit tick: ' + JSON.stringify(vicChanges.slice(0, 3)));
  const vicRec = hpChangesB.filter(c => r.idleEntry !== null && c.tick > r.idleEntry);
  if (vicRec.length) notes.push('recovery victim hp change (expected fresh-punch range, not a scenario-hit violation): ' + JSON.stringify(vicRec.slice(0, 3)));
  if (cfg.name === 'stumble-1-desperation') {
    const badA = hpChangesA.filter(c => !(F[c.tick] && F[c.tick].b.st === 'atk'));
    if (badA.length) hard.push('attacker hp change outside desperation window: ' + JSON.stringify(badA.slice(0, 3)));
  } else {
    const badA2 = hpChangesA.filter(c => r.idleEntry === null || c.tick <= r.idleEntry);
    if (badA2.length) hard.push('attacker hp change (no desperation expected): ' + JSON.stringify(badA2.slice(0, 3)));
    const atkRec = hpChangesA.filter(c => r.idleEntry !== null && c.tick > r.idleEntry);
    if (atkRec.length) notes.push('recovery attacker hp change: ' + JSON.stringify(atkRec.slice(0, 3)));
  }
  // Motion laws on interior same-state pairs (skip frozen frames).
  for (let i = 1; i < F.length; i++) {
    const p = F[i - 1], f = F[i];
    if (p.frozen || f.frozen) continue;
    // Victim laws.
    if (p.b.st === f.b.st) {
      if (f.b.st === 'air') {
        if (!close(f.b.vx, p.b.vx, 0.001)) hard.push('air vx changed ' + p.b.vx.toFixed(3) + '->' + f.b.vx.toFixed(3) + ' @' + f.tick);
        if (!close(f.b.vy, p.b.vy - GRAV_DT_AIR, 0.01)) hard.push('air vy step ' + p.b.vy.toFixed(3) + '->' + f.b.vy.toFixed(3) + ' @' + f.tick);
      }
      if (f.b.st === 'down' || f.b.st === 'getup') {
        if (Math.abs(p.b.vx) > 0.01 && !close(f.b.vx, p.b.vx * 0.9, 0.02)) hard.push(f.b.st + ' vx ratio ' + (f.b.vx / p.b.vx).toFixed(3) + ' != 0.9 @' + f.tick);
        if (Math.abs(p.b.vz) > 0.01 && !close(f.b.vz, p.b.vz * 0.9, 0.02)) hard.push(f.b.st + ' vz ratio != 0.9 @' + f.tick);
      }
      if (f.b.st === 'walk') {
        const mf = -1; // defender recovery walk uses l=1, faces -x
        const exp = f.b.fx * mf * (mf > 0 ? FWD : BACK);
        if (!close(f.b.vx, exp, 0.01)) hard.push('victim walk vx ' + f.b.vx.toFixed(3) + ' != ' + exp.toFixed(3) + ' @' + f.tick);
      }
      if (f.b.st === 'idle' && !close(f.b.vx, 0, 0.001)) hard.push('victim idle vx ' + f.b.vx.toFixed(3) + ' != 0 @' + f.tick);
    }
    // Thrower atk law.
    if (p.a.st === 'atk' && f.a.st === 'atk') {
      if (Math.abs(p.a.vx) > 0.01 && !close(f.a.vx, p.a.vx * 0.85, 0.02)) hard.push('thrower atk vx ratio ' + (f.a.vx / p.a.vx).toFixed(3) + ' != 0.85 @' + f.tick);
    }
    if (p.a.st === 'idle' && f.a.st === 'idle' && !close(f.a.vx, 0, 0.001) && f.tick > 40) hard.push('thrower idle vx ' + f.a.vx.toFixed(3) + ' != 0 @' + f.tick);
  }
  // Carry anchor law (shipped style throws: anch 0.8, lift from CP).
  for (const f of F) {
    if (f.b.st !== 'carry') continue;
    const style = f.b.throwStyle || 'lunge';
    const ex = anchorExpected(style, f.b.t, f.b.carryCP);
    const ax = f.a.x + f.a.ax * ex.anch, az = f.a.z + f.a.az * 0.8;
    if (!close(f.b.x, ax, 0.02) || !close(f.b.z, az, 0.02)) hard.push('carry anchor violated @' + f.tick + ' (dx ' + (f.b.x - ax).toFixed(3) + ' dz ' + (f.b.z - az).toFixed(3) + ')');
    if (!close(f.b.y, ex.lift, 0.02)) hard.push('carry lift violated @' + f.tick + ' (y ' + f.b.y.toFixed(3) + ' != ' + ex.lift.toFixed(3) + ')');
  }
  // Handoff bounds.
  const bounds = { throw: 220, launcher: 300, stumble: 150 };
  if (r.idleEntry === null) hard.push('victim never reached idle (handoff timeout)');
  else if (r.idleEntry - r.hitTick > bounds[cfg.mode]) hard.push('victim idle late: ' + (r.idleEntry - r.hitTick) + ' ticks > ' + bounds[cfg.mode]);
  if (r.thrIdleEntry === null) hard.push('thrower never reached idle');
  else if (r.thrIdleEntry - r.hitTick > 60) hard.push('thrower idle late: ' + (r.thrIdleEntry - r.hitTick) + ' ticks > 60');
  // Desperation must fire in stumble-1.
  if (cfg.name === 'stumble-1-desperation') {
    const fired = F.some(f => f.b.st === 'atk' && f.b.desp === 1);
    if (!fired) hard.push('forced desperation never fired');
  }
  // Recovery checks (baselines only; stage marks recorded by the loop).
  if (cfg.recovery && r.idleEntry !== null) {
    const m = r.marks || {};
    if (m.done === undefined) hard.push('recovery stages incomplete (marks ' + JSON.stringify(m) + ')');
    else {
      const zw = F.filter(f => f.tick >= m.zero && f.tick < m.zero + 30);
      if (zw.length >= 30) {
        let prevX = null, drift = false, phantom = false;
        for (const f of zw) {
          if (f.b.st !== 'idle') phantom = true;
          if (prevX !== null && !f.sep && Math.abs(f.b.x - prevX) > 0.001) drift = true;
          if (!f.sep) prevX = f.b.x;
        }
        if (phantom) hard.push('recovery zero-window: victim left idle');
        if (drift) hard.push('recovery zero-window: victim x drifted');
      }
      const vW0 = F.find(f => f.tick === m.recWalkV), vW1 = F.find(f => f.tick === m.recWalkV + 10);
      if (vW0 && vW1 && Math.abs(vW1.b.x - vW0.b.x) < 0.1) hard.push('recovery victim walk displacement ' + Math.abs(vW1.b.x - vW0.b.x).toFixed(3) + ' < 0.1');
      if (!F.some(f => f.tick > m.recPunchV && f.tick <= m.recPunchV + 10 && f.b.st === 'atk')) hard.push('recovery victim fresh punch did not fire');
      if (!F.some(f => f.tick > m.recGuardV && f.tick <= m.recGuardV + 40 && f.b.st === 'guard')) soft.push('recovery victim fresh guard did not register');
      const tW0 = F.find(f => f.tick === m.recWalkT), tW1 = F.find(f => f.tick === m.recWalkT + 10);
      if (tW0 && tW1 && Math.abs(tW1.a.x - tW0.a.x) < 0.1) hard.push('recovery thrower walk displacement ' + Math.abs(tW1.a.x - tW0.a.x).toFixed(3) + ' < 0.1');
      if (!F.some(f => f.tick > m.recPunchT && f.tick <= m.recPunchT + 10 && f.a.st === 'atk')) hard.push('recovery thrower fresh punch did not fire');
      if (!F.some(f => f.tick > m.recGuardT && f.tick <= m.recGuardT + 40 && f.a.st === 'guard')) soft.push('recovery thrower fresh guard did not register');
    }
  }
  return { hard: [...new Set(hard)], soft: [...new Set(soft)], setupOk: true, notes };
}
function identityCompare(base, variant, label) {
  const hard = [];
  if (base.hitTick === null || variant.hitTick === null) return ['identity: missing hit tick'];
  const endBase = base.idleEntry, endVar = variant.idleEntry;
  if (endBase === null || endVar === null) return ['identity: missing idle entry'];
  const end = Math.min(endBase, endVar);
  for (let t = base.hitTick; t <= end; t++) {
    const fb = base.frames.find(f => f.tick === t), fv = variant.frames.find(f => f.tick === t);
    if (!fb || !fv) { hard.push('identity: missing frame @' + t); break; }
    for (const side of ['a', 'b']) for (const k of ['x', 'y', 'z', 'vx', 'vy', 'vz', 't', 'hp']) {
      if (!close(fb[side][k], fv[side][k], 0.001)) { hard.push('authority leak ' + side + '.' + k + ' @' + t + ': ' + fb[side][k] + ' vs ' + fv[side][k]); break; }
    }
    if (fb.a.st !== fv.a.st || fb.b.st !== fv.b.st) hard.push('authority leak state @' + t + ': ' + fb.a.st + '/' + fb.b.st + ' vs ' + fv.a.st + '/' + fv.b.st);
    if (hard.length > 5) break;
  }
  return [...new Set(hard)];
}
// Smoke: real tick vs loop, throw baseline.
const smokeHard = [];
{
  const L = out.smokeLoop, R = out.smokeReal;
  const n = Math.min(L.frames.length, R.frames.length);
  if (L.frames.length !== R.frames.length) smokeHard.push('smoke length ' + L.frames.length + ' vs ' + R.frames.length);
  for (let i = 0; i < n; i++) {
    const fl = L.frames[i], fr = R.frames[i];
    for (const side of ['a', 'b']) for (const k of ['x', 'y', 'z', 'vx', 'vy', 'vz', 't', 'hp']) {
      if (!close(fl[side][k], fr[side][k], 0.001)) { smokeHard.push('smoke mismatch ' + side + '.' + k + ' @' + i + ': ' + fl[side][k] + ' vs ' + fr[side][k]); break; }
    }
    if (fl.a.st !== fr.a.st || fl.b.st !== fr.b.st) smokeHard.push('smoke state mismatch @' + i);
    if (smokeHard.length > 5) break;
  }
}
const runs = [];
const byName = {};
for (const r of out.results) {
  const c = checkRun(r);
  byName[r.name] = { run: r, check: c };
  runs.push({ label: r.name, mode: r.cfg.mode, hard: c.hard, soft: c.soft, setupOk: c.setupOk, notes: c.notes, hitTick: r.hitTick, idleEntry: r.idleEntry });
}
// Identity comparisons (variants vs their baselines).
const pairs = [
  ['throw-blue-baseline', 'throw-blue-away'], ['throw-blue-baseline', 'throw-blue-toward'],
  ['throw-blue-baseline', 'throw-blue-guard'], ['throw-blue-baseline', 'throw-blue-mash'],
  ['throw-red-baseline', 'throw-red-away'], ['throw-red-baseline', 'throw-red-toward'],
  ['throw-red-baseline', 'throw-red-guard'], ['throw-red-baseline', 'throw-red-mash'],
  ['knockdown-baseline', 'knockdown-inputs'],
  ['stumble-0-baseline', 'stumble-0-inputs']
];
for (const [b, v] of pairs) {
  const leaks = identityCompare(byName[b].run, byName[v].run, v);
  const entry = runs.find(r => r.label === v);
  entry.hard = [...new Set([...entry.hard, ...leaks])];
}
const gatingHasHard = runs.some(r => r.hard.length > 0);
const hardRank = ['authority leak', 'anchor', 'air ', 'down', 'getup', 'atk ', 'walk', 'idle', 'separation', 'facing', 'hp', 'handoff', 'recovery', 'desperation', 'dual', 'invalid', 'NaN'];
let nextTarget = 'none';
for (const key of hardRank) { let done = false; for (const r of runs) for (const s of r.hard) if (s.includes(key)) { nextTarget = r.label + ': ' + s; done = true; break; } if (done) break; }
if (nextTarget === 'none') for (const r of runs) for (const s of r.soft) { nextTarget = r.label + ': ' + s; break; }
const output = { build: process.argv[2], smoke: smokeHard.length ? { ok: false, errors: smokeHard.slice(0, 10) } : { ok: true }, runs, gatingHasHard, nextTarget };
console.log(JSON.stringify(output, null, 1));
if (smokeHard.length) { console.error('PROBE_ERROR: tick-equivalent loop diverges from real tick(): ' + smokeHard.slice(0, 5).join(' | ')); process.exit(2); }
