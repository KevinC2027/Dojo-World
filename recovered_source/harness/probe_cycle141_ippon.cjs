// Cycle 141 independent probe: harness-forced ippon, victim uprightness + feet
// during manipulation/positioning (attacker atk + victim carry, pre-launch only)
// and thrower verticality / arm-forward during the toss window.
// Built from the task-body probe patterns (probe_vf/probe_range), not from any
// prior cycle's probe. Harness note: tryHit writes victim.throwStyle = attacker
// style, so after the hit tick we re-point it to 'ippon' and reset carry t to 0
// for a clean ippon carry; the first carry tick is therefore excluded.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: (t, k) => (k === 'canvas' ? {} : () => {}), set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, querySelectorAll: () => [], style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const T = vm.runInContext(`({ update, go, pose, S: () => S, phase: () => phase })`, sandbox);

function runOne(throwerStyle) {
  vm.runInContext(`reset(1); phase='fight'; pt=200;`, sandbox);
  const [a, b] = T.S();
  a.style = throwerStyle; a.x = 0; a.z = 0; a.y = 0; a.fx = 1; a.fz = 0; a.ax = 1; a.az = 0;
  b.x = 0.75; b.z = 0; b.y = 0; b.fx = -1; b.fz = 0; b.ax = -1; b.az = 0; b.hp = 100; b.st = 'idle';
  a.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 }; b.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
  const ok = vm.runInContext(`go(S[0],'T')`, sandbox);
  if (!ok) return { throwerStyle, error: 'go refused' };
  vm.runInContext(`S[0].throwMove='ippon'`, sandbox);
  let hitSeen = false, carryFixed = false, firstInvertedCarry = -1, firstInvertedAtk = -1;
  let minVicHeadDy = 1e9, minVicFootY = 1e9, maxThrowerLean = -1e9, minThrowerHrFwd = 1e9, minThrowerHlFwd = 1e9;
  let carryTicks = 0, atkTicks = 0, launchTick = -1, firstLiftTick = -1, samples = [];
  for (let i = 0; i < 400; i++) {
    a.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 }; b.i = { l: 0, r: 0, u: 0, d: 0, g: 0, bp: 0, bk: 0 };
    T.update(a, b); T.update(b, a);
    if (a.hit && !hitSeen) { hitSeen = true; }
    if (b.st === 'carry' && !carryFixed) { vm.runInContext(`S[1].throwStyle='ippon'; S[1].t=0;`, sandbox); carryFixed = true; continue; }
    const pa = vm.runInContext(`pose(S[0])`, sandbox);
    const pb = vm.runInContext(`pose(S[1])`, sandbox);
    if (a.st === 'atk') {
      atkTicks++;
      const lean = Math.abs(pa.head[0] - pa.pel[0]);
      if (lean > maxThrowerLean) maxThrowerLean = lean;
      const hrF = pa.hr[0] - pa.pel[0], hlF = pa.hl[0] - pa.pel[0];
      if (hrF < minThrowerHrFwd) minThrowerHrFwd = hrF;
      if (hlF < minThrowerHlFwd) minThrowerHlFwd = hlF;
      samples.push({ phase: 'atk', t: a.t, lean: +lean.toFixed(3), hrF: +hrF.toFixed(3), hlF: +hlF.toFixed(3) });
    }
    if (b.st === 'carry') {
      carryTicks++;
      const dy = pb.head[1] - pb.pel[1];
      const footY = Math.min(pb.fl[1], pb.fr[1]) + b.y;
      if (dy < minVicHeadDy) minVicHeadDy = dy;
      if (footY < minVicFootY) minVicFootY = footY;
      if (dy < 0 && firstInvertedCarry < 0) firstInvertedCarry = b.t;
      if (firstLiftTick < 0 && b.y > 0.01) firstLiftTick = b.t;
      samples.push({ phase: 'carry', t: b.t, vicHeadDy: +dy.toFixed(3), vicFootY: +footY.toFixed(3), vicY: +b.y.toFixed(3) });
    }
    if (b.st === 'air' && launchTick < 0) { launchTick = i; }
    if (b.st === 'idle' && carryTicks > 0) break;
    if (i > 250 && b.st === 'down') break;
  }
  return { throwerStyle, hitSeen, atkTicks, carryTicks, launchTick, firstLiftTick, firstInvertedCarry, minVicHeadDy: +minVicHeadDy.toFixed(3), minVicFootY: +minVicFootY.toFixed(3), maxThrowerLean: +maxThrowerLean.toFixed(3), minThrowerHrFwd: +minThrowerHrFwd.toFixed(3), minThrowerHlFwd: +minThrowerHlFwd.toFixed(3), endState: b.st, endT: b.t, samples };
}
for (const style of ['lunge', 'back']) {
  const r = runOne(style);
  const { samples, ...sum } = r;
  console.log(JSON.stringify(sum));
  // compact per-tick carry trace for the report
  console.log('carry trace: ' + samples.filter(s => s.phase === 'carry').map(s => `t${s.t}:dy${s.vicHeadDy},ft${s.vicFootY},y${s.vicY}`).join(' | '));
}
