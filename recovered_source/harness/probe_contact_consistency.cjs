// Contact-consistency diagnostics for the autonomous combat evaluation loop.
// READ-ONLY: loads the build, drives throws in the node vm harness, measures,
// never modifies prototype/index.html. Added Oct 31 2026 under Kev's standing
// autonomous authorization. Spec: hidden_files/claude-loop/
// contact-consistency-diagnostics.md (tolerances, hard/soft flags, policy).
//
// Runs (6): shipped style throws both directions (real go('T') path) +
// forced ippon both directions + forced shoulder both directions
// (shoulder = INFORMATIONAL only: unapproved variant, not gameplay;
// its flags are reported, never promotion-blocking).
// Per tick, world-space joints via the engine's own transform (line 521):
//   W = [f.x + f.fx*q0 - f.fz*q2, f.y + q1, f.z + f.fz*q0 + f.fx*q2]
// Shoulders/hips reconstructed from pose rotS/rotH with the engine's own
// line-466 formulas, then world-transformed like any joint.
// Metrics per run: grip separation (same definition as the throw-corrections
// probe: min over thrower hands x victim {hands, elbows, neck, pelvis}),
// segment-length deviations (upper arm / forearm 0.40, thigh / shin 0.62,
// pelvis-neck 0.55, neck-head 0.24), elbow/knee fold angles, torso-torso
// and limb-torso intersection distances, release-timing chain
// (grip-first-contact -> stable grip -> foot-lift -> thrower dip -> release
// -> touchdown), flight displacement coherence, apex, touchdown contact,
// rigid-flight run, landing angles.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const D3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const SUB = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const DOT = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const ANGLE = (a, b) => { const d = Math.hypot(...a) * Math.hypot(...b); return d < 1e-9 ? 180 : Math.acos(Math.max(-1, Math.min(1, DOT(a, b) / d))) * 180 / Math.PI; };
// Closest distance between 3D segments p1-p2 and p3-p4 (Ericson).
function segSeg(p1, p2, p3, p4) {
  const d1 = SUB(p2, p1), d2 = SUB(p4, p3), r = SUB(p1, p3);
  const a = DOT(d1, d1), e = DOT(d2, d2), f = DOT(d2, r);
  let s, t;
  if (a <= 1e-12 && e <= 1e-12) return D3(p1, p3);
  if (a <= 1e-12) { t = Math.max(0, Math.min(1, f / e)); return D3(p1, [p3[0] + d2[0] * t, p3[1] + d2[1] * t, p3[2] + d2[2] * t]); }
  const c = DOT(d1, r);
  if (e <= 1e-12) { s = Math.max(0, Math.min(1, -c / a)); return D3([p1[0] + d1[0] * s, p1[1] + d1[1] * s, p1[2] + d1[2] * s], p3); }
  const b = DOT(d1, d2), den = a * e - b * b;
  s = den > 1e-12 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
  t = (b * s + f) / e;
  if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); } else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
  return D3([p1[0] + d1[0] * s, p1[1] + d1[1] * s, p1[2] + d1[2] * s], [p3[0] + d2[0] * t, p3[1] + d2[1] * t, p3[2] + d2[2] * t]);
}
function ptSeg(p, a, b) {
  const ab = SUB(b, a), t = Math.max(0, Math.min(1, DOT(SUB(p, a), ab) / Math.max(1e-12, DOT(ab, ab))));
  return D3(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
}
const JOINTS = ['pel', 'neck', 'head', 'hl', 'hr', 'el', 'er', 'kl', 'kr', 'fl', 'fr'];
function run(label, atkStyle, defStyle, forced) {
  const res = vm.runInContext(`(() => {
    const a=mk(0,${atkStyle}),d=mk(0,${defStyle});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
    a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;
    d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
    a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
    a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
    const JOINTS=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
    const world=(f,p)=>{const o={};for(const j of JOINTS){const q=p[j];if(!q)continue;
      o[j]=[f.x+f.fx*q[0]-f.fz*q[2], f.y+q[1], f.z+f.fz*q[0]+f.fx*q[2]];}return o;};
    const frames=[];let hitTick=null,releaseTick=null,touchTick=null,downEnd=null;
    let prevVictimSt='idle';
    go(a,'T');
    if(${forced ? `'${forced}'` : 'null'}){const cf=pose(d);a.hit=1;a.throwMove='${forced}';d.st='carry';d.t=0;d.throwStyle='${forced}';d.carryFrom=cf;d.ic='${forced === 'ippon' ? 'mid' : forced}';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;}
    for(let tick=0;tick<240;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d),wa=world(a,pa),wd=world(d,pd);
      const f={tick,atkT:a.t,atkSt:a.st,vicSt:d.st,vicT:d.t,
        ax:a.x,ay:a.y,az:a.z,afx:a.fx,afz:a.fz,dx:d.x,dy:d.y,dz:d.z,dfx:d.fx,dfz:d.fz,dvx:d.vx,dvy:d.vy,wa,wd,
        rotSa:pa.rotS||0,rotHa:pa.rotH||0,rotSd:pd.rotS||0,rotHd:pd.rotH||0,
        paLocal:pa,pdLocal:pd};
      frames.push(f);
      if(d.st==='carry'&&hitTick===null)hitTick=tick;
      if(prevVictimSt==='carry'&&d.st==='air'&&releaseTick===null)releaseTick=tick;
      if(prevVictimSt==='air'&&d.st==='down'&&touchTick===null)touchTick=tick;
      if(d.st==='idle'&&tick>0&&prevVictimSt==='getup')downEnd=tick;
      prevVictimSt=d.st;
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return {frames,hitTick,releaseTick,touchTick,downEnd};
  })()`, sandbox);
  const F = res.frames;
  // World-space shoulders/hips from local pose + engine line-466 formulas.
  const jointsW = (f, side) => {
    const w = side === 'a' ? f.wa : f.wd;
    const loc = side === 'a' ? f.paLocal : f.pdLocal;
    const rotS = side === 'a' ? f.rotSa : f.rotSd, rotH = side === 'a' ? f.rotHa : f.rotHd;
    const fx = side === 'a' ? f.afx : f.dfx, fz = side === 'a' ? f.afz : f.dfz;
    const rx = side === 'a' ? f.ax : f.dx, ry = side === 'a' ? f.ay : f.dy, rz = side === 'a' ? f.az : f.dz;
    const W = (q) => [rx + fx * q[0] - fz * q[2], ry + q[1], rz + fz * q[0] + fx * q[2]];
    const neck = loc.neck, pel = loc.pel;
    const SL = [neck[0] + .11 * rotS, neck[1] - .05, .22 - .03 * rotS];
    const SR = [neck[0] - .11 * rotS, neck[1] - .05, -.22 + .03 * rotS];
    const HL = [pel[0] + .04 * rotH, pel[1], pel[2] + .12 - .009 * rotH];
    const HR = [pel[0] - .04 * rotH, pel[1], pel[2] - .12 + .009 * rotH];
    return { ...w, SL: W(SL), SR: W(SR), HL: W(HL), HR: W(HR) };
  };
  const grip = [], segs = [], angs = [], inter = [], torsoAng = [];
  let maxStep = { v: 0, t: null, j: null }, maxHN = { v: 0, t: null }, maxPN = { v: 0, t: null };
  let invertedTicks = 0, vicFeetLeave = null, thrPelMin = { v: 9, t: null }, releaseVel = null;
  for (let i = 0; i < F.length; i++) {
    const f = F[i], wa = jointsW(f, 'a'), wd = jointsW(f, 'd');
    const hn = D3(wd.head, wd.neck), pn = D3(wd.pel, wd.neck);
    if (hn > maxHN.v) maxHN = { v: +hn.toFixed(3), t: f.tick };
    if (pn > maxPN.v) maxPN = { v: +pn.toFixed(3), t: f.tick };
    if (i > 0) { const g = F[i - 1]; const gw = jointsW(g, 'd'); let ms = 0, mj = null;
      for (const j of JOINTS) { const s = D3(wd[j], gw[j]); if (s > ms) { ms = s; mj = j; } }
      if (ms > maxStep.v) maxStep = { v: +ms.toFixed(3), t: f.tick, j: mj }; }
    let mg = 9;
    for (const h of ['hl', 'hr']) for (const j of ['hl', 'hr', 'el', 'er', 'neck', 'pel']) mg = Math.min(mg, D3(wa[h], wd[j]));
    grip.push(mg);
    // Segments (victim + thrower), deviations from nominal.
    const segRow = {};
    for (const [tag, W] of [['vic', wd], ['thr', wa]]) {
      segRow[tag] = {
        upperArmL: +(D3(W.SL, W.el) - 0.40).toFixed(3), upperArmR: +(D3(W.SR, W.er) - 0.40).toFixed(3),
        foreArmL: +(D3(W.el, W.hl) - 0.40).toFixed(3), foreArmR: +(D3(W.er, W.hr) - 0.40).toFixed(3),
        thighL: +(D3(W.HL, W.kl) - 0.62).toFixed(3), thighR: +(D3(W.HR, W.kr) - 0.62).toFixed(3),
        shinL: +(D3(W.kl, W.fl) - 0.62).toFixed(3), shinR: +(D3(W.kr, W.fr) - 0.62).toFixed(3),
        torso: +(D3(W.pel, W.neck) - 0.55).toFixed(3), neckHead: +(D3(W.neck, W.head) - 0.24).toFixed(3)
      };
    }
    segs.push(segRow);
    const angRow = {};
    for (const [tag, W] of [['vic', wd], ['thr', wa]]) {
      angRow[tag] = {
        elbowL: +ANGLE(SUB(W.SL, W.el), SUB(W.hl, W.el)).toFixed(1),
        elbowR: +ANGLE(SUB(W.SR, W.er), SUB(W.hr, W.er)).toFixed(1),
        kneeL: +ANGLE(SUB(W.HL, W.kl), SUB(W.fl, W.kl)).toFixed(1),
        kneeR: +ANGLE(SUB(W.HR, W.kr), SUB(W.fr, W.kr)).toFixed(1)
      };
    }
    angs.push(angRow);
    // Intersections: torso-torso seg distance, victim head/pelvis/limbs to thrower torso.
    const tt = segSeg(wd.pel, wd.neck, wa.pel, wa.neck);
    const hp = ptSeg(wd.head, wa.pel, wa.neck), pp = ptSeg(wd.pel, wa.pel, wa.neck);
    let limb = 9; for (const j of ['hl', 'hr', 'fl', 'fr']) limb = Math.min(limb, ptSeg(wd[j], wa.pel, wa.neck));
    inter.push({ torsoTorso: +tt.toFixed(3), headTorso: +hp.toFixed(3), pelTorso: +pp.toFixed(3), limbTorso: +limb.toFixed(3) });
    // Torso angle + inversion (head >0.10 m below pelvis height in air).
    const tv = SUB(wd.neck, wd.pel);
    torsoAng.push({ tick: f.tick, st: f.vicSt, ang: +(Math.atan2(Math.hypot(tv[0], tv[2]), tv[1]) * 180 / Math.PI).toFixed(1) });
    if (f.vicSt === 'air' && wd.head[1] < wd.pel[1] - 0.10) invertedTicks++;
    const vf = Math.min(wd.fl[1], wd.fr[1]);
    if (f.vicSt === 'carry' && vicFeetLeave === null && vf > 0.05) vicFeetLeave = { tick: f.tick, vicT: f.vicT };
    if (f.atkSt === 'atk' && wa.pel[1] < thrPelMin.v) thrPelMin = { v: +wa.pel[1].toFixed(3), t: f.tick };
    if (res.releaseTick !== null && i > 0 && F[i - 1].vicSt === 'carry' && f.vicSt === 'air' && !releaseVel)
      releaseVel = { vx: +f.dvx.toFixed(2), vy: +f.dvy.toFixed(2), x: +f.dx.toFixed(3), y: +f.dy.toFixed(3) };
  }
  // Phase summaries.
  const phaseIdx = (st) => F.map((f, i) => f.vicSt === st ? i : -1).filter(i => i >= 0);
  const carryIdx = phaseIdx('carry'), airIdx = phaseIdx('air'), downIdx = phaseIdx('down'), getupIdx = phaseIdx('getup');
  const carryGrip = carryIdx.map(i => grip[i]);
  const gripEst = (() => { for (let k = 0; k + 2 < carryIdx.length; k++) if (grip[carryIdx[k]] <= 0.20 && grip[carryIdx[k + 1]] <= 0.20 && grip[carryIdx[k + 2]] <= 0.20) return { tick: F[carryIdx[k]].tick, vicT: F[carryIdx[k]].vicT }; return null; })();
  const gripFirst = (() => { for (let k = 0; k < F.length; k++) { const f = F[k]; if ((res.hitTick === null || f.tick >= res.hitTick) && (res.releaseTick === null || f.tick <= res.releaseTick) && grip[k] <= 0.20) return { tick: f.tick, vicT: f.vicT }; } return null; })();
  const gAtLift = vicFeetLeave ? +grip[F.findIndex(x => x.tick === vicFeetLeave.tick)].toFixed(3) : null;
  const overGateTicks = carryIdx.filter(i => grip[i] > 0.20).length;
  const atRelease = res.releaseTick !== null ? +grip[res.releaseTick].toFixed(3) : null;
  const maxSegDev = (() => { let m = 0, w = null; segs.forEach((r, i) => { for (const tag of ['vic', 'thr']) for (const k in r[tag]) { const v = Math.abs(r[tag][k]); if (v > m) { m = v; w = tag + '.' + k + '@' + F[i].tick; } } }); return { v: +m.toFixed(3), where: w }; })();
  const minAng = (() => { let m = 180, w = null; angs.forEach((r, i) => { for (const tag of ['vic', 'thr']) for (const k in r[tag]) if (r[tag][k] < m) { m = r[tag][k]; w = tag + '.' + k + '@' + F[i].tick; } }); return { v: m, where: w }; })();
  const minInter = (idx, key) => idx.length ? Math.min(...idx.map(i => inter[i][key])) : null;
  const rigidRun = (() => { let run = 0, max = 0; const a = torsoAng.filter(x => x.st === 'air'); for (let i = 0; i < a.length; i++) { const p = i > 0 ? a[i - 1].ang : a[i].ang; if (a[i].ang > 70 && Math.abs(a[i].ang - p) < 2) { run++; max = Math.max(max, run); } else run = 0; } return max; })();
  const landAng = (() => { if (res.touchTick === null) return null; const at = (t) => { const f = F.find(x => x.tick === t); if (!f) return null; const wd = jointsW(f, 'd'); const tv = SUB(wd.neck, wd.pel); return +(Math.atan2(Math.hypot(tv[0], tv[2]), tv[1]) * 180 / Math.PI).toFixed(1); }; return { td: at(res.touchTick), plus12: at(res.touchTick + 12) }; })();
  let flightDx = null, flightDxRatio = null, apexRootY = null, apexBallistic = null, touchdownMinJointY = null;
  if (releaseVel && res.touchTick !== null && res.releaseTick !== null) {
    const ft = res.touchTick - res.releaseTick;
    flightDx = +(F[res.touchTick].dx - releaseVel.x).toFixed(3);
    flightDxRatio = +(flightDx / (releaseVel.vx * ft / 60)).toFixed(3);
    apexRootY = +Math.max(...airIdx.map(i => F[i].dy)).toFixed(3);
    apexBallistic = +(releaseVel.y + releaseVel.vy * releaseVel.vy / 48).toFixed(3);
    const td = F[res.touchTick].wd;
    touchdownMinJointY = +Math.min(...JOINTS.map(j => td[j][1])).toFixed(3);
  }
  const liftAfterFirst = (gripFirst && vicFeetLeave) ? vicFeetLeave.tick - gripFirst.tick : null;
  const liftAfterStable = (gripEst && vicFeetLeave) ? vicFeetLeave.tick - gripEst.tick : null;
  const dipBeforeRelease = (res.releaseTick !== null && thrPelMin.t !== null) ? thrPelMin.t <= res.releaseTick : null;
  const dipAfterRelease = (res.releaseTick !== null && thrPelMin.t !== null) ? thrPelMin.t > res.releaseTick : false;
  // Flags.
  const hard = [], soft = [];
  if (maxHN.v > 0.26) hard.push('HN ' + maxHN.v + 'm > 0.26');
  if (maxPN.v > 0.57) hard.push('PN ' + maxPN.v + 'm > 0.57');
  if (maxStep.v > 0.20) hard.push('joint step ' + maxStep.v + 'm > 0.20 (' + maxStep.j + ')');
  if (invertedTicks > 0) hard.push('inverted ticks ' + invertedTicks);
  if (maxSegDev.v > 0.10) hard.push('segment dev ' + maxSegDev.v + 'm > 0.10 (' + maxSegDev.where + ')');
  if (minAng.v < 5) hard.push('joint collapse ' + minAng.v + 'deg < 5 (' + minAng.where + ')');
  const minTT = Math.min(...inter.map(x => x.torsoTorso));
  const minTTTick = F[inter.findIndex(x => x.torsoTorso === minTT)].tick;
  const minTTCarry = carryIdx.length ? Math.min(...carryIdx.map(i => inter[i].torsoTorso)) : null;
  const airDown = [...airIdx, ...downIdx, ...getupIdx];
  const minTTAD = airDown.length ? Math.min(...airDown.map(i => inter[i].torsoTorso)) : null;
  const segDevByPhase = {};
  for (const [ph, idx] of [['carry', carryIdx], ['air', airIdx], ['down', downIdx], ['getup', getupIdx]]) {
    let m = 0; idx.forEach(i => { for (const k in segs[i].vic) m = Math.max(m, Math.abs(segs[i].vic[k])); });
    segDevByPhase['vic_' + ph] = +m.toFixed(3);
  }
  let thrRecDev = 0; airDown.forEach(i => { for (const k in segs[i].thr) thrRecDev = Math.max(thrRecDev, Math.abs(segs[i].thr[k])); });
  segDevByPhase.thr_airDownGetup = +thrRecDev.toFixed(3);
  if (minTTAD !== null && minTTAD < 0.005) hard.push('torso pass-through in air/down/getup ' + minTTAD.toFixed(3) + 'm < 0.005');
  if (atRelease !== null && atRelease > 0.30) hard.push('grip lost at release ' + atRelease + 'm > 0.30');
  if (carryGrip.length && Math.max(...carryGrip) > 0.20) soft.push('grip carry max ' + Math.max(...carryGrip).toFixed(3) + 'm > 0.20');
  if (atRelease !== null && atRelease > 0.20 && atRelease <= 0.30) soft.push('grip at release ' + atRelease + 'm > 0.20');
  if (overGateTicks > 0) soft.push('grip over gate ' + overGateTicks + ' carry ticks');
  if (!gripEst) soft.push('grip never established (3 consecutive ticks <=0.20)');
  if (maxSegDev.v > 0.05 && maxSegDev.v <= 0.10) soft.push('segment dev ' + maxSegDev.v + 'm > 0.05 (' + maxSegDev.where + ')');
  if (minTTAD !== null && minTTAD < 0.03) soft.push('torso proximity in air/down/getup ' + minTTAD.toFixed(3) + 'm < 0.03');
  if (gAtLift !== null && gAtLift > 0.20) soft.push('lift without grip (g at lift ' + gAtLift + 'm > 0.20)');
  if (liftAfterStable !== null && liftAfterStable < 3) soft.push('lift ' + liftAfterStable + ' ticks after stable grip (< 3)');
  if (rigidRun > 5) soft.push('rigid flight run ' + rigidRun + ' ticks > 5');
  if (landAng && landAng.td !== null && landAng.td > 70) soft.push('touchdown torso ' + landAng.td + 'deg > 70');
  if (dipAfterRelease) soft.push('thrower dip after release');
  if (touchdownMinJointY !== null && (touchdownMinJointY < -0.05 || touchdownMinJointY > 0.20)) soft.push('touchdown contact gap/penetration (min joint y ' + touchdownMinJointY + 'm)');
  return { label, forced: forced || 'shipped', hitTick: res.hitTick, releaseTick: res.releaseTick, touchTick: res.touchTick, downEnd: res.downEnd,
    grip: { grabMin: carryIdx.length ? +Math.min(...carryGrip).toFixed(3) : null, carryMax: carryGrip.length ? +Math.max(...carryGrip).toFixed(3) : null, atRelease, overGateTicks, established: gripEst, first: gripFirst, atLift: gAtLift },
    timing: { feetLeave: vicFeetLeave, liftAfterFirst, liftAfterStable, dipTick: thrPelMin.t, dipBeforeRelease, dipAfterRelease, flightTicks: (res.touchTick !== null && res.releaseTick !== null) ? res.touchTick - res.releaseTick : null, flightDx, flightDxRatio, apexRootY, apexBallistic, touchdownMinJointY, releaseVel },
    joints: { maxHN, maxPN, maxStep, maxSegDev, segDevByPhase, minAngle: minAng, invertedTicks },
    intersections: { minTorsoTorso: +minTT.toFixed(3), minTorsoTorsoTick: minTTTick, minTorsoTorsoCarry: minTTCarry !== null ? +minTTCarry.toFixed(3) : null, minTorsoTorsoAirDown: minTTAD !== null ? +minTTAD.toFixed(3) : null,
      minHeadTorso: +Math.min(...inter.map(x => x.headTorso)).toFixed(3), minPelTorso: +Math.min(...inter.map(x => x.pelTorso)).toFixed(3), minLimbTorso: +Math.min(...inter.map(x => x.limbTorso)).toFixed(3) },
    flight: { rigidRun, landAng },
    hard, soft };
}
const runs = [
  run('Blue throws Red (shipped)', 1, 0, null),
  run('Red throws Blue (shipped)', 0, 1, null),
  run('Blue throws Red (ippon, forced)', 1, 0, 'ippon'),
  run('Red throws Blue (ippon, forced)', 0, 1, 'ippon'),
  run('Blue throws Red (shoulder, forced, INFO)', 1, 0, 'shoulder'),
  run('Red throws Blue (shoulder, forced, INFO)', 0, 1, 'shoulder')
];
const gating = runs.filter(r => !r.label.includes('INFO'));
const hardFail = gating.some(r => r.hard.length > 0);
const hardRank = ['grip lost', 'pass-through', 'joint step', 'segment dev', 'HN ', 'PN ', 'inverted', 'collapse'];
const softRank = ['grip at release', 'grip carry max', 'segment dev', 'rigid flight', 'touchdown torso', 'lift without grip', 'lift ', 'torso proximity', 'dip after', 'touchdown contact'];
let nextTarget = 'none';
for (const key of hardRank) { let done = false; for (const r of gating) for (const s of r.hard) if (s.includes(key)) { nextTarget = r.label + ': ' + s; done = true; break; } if (done) break; }
if (nextTarget === 'none') outer: for (const key of softRank) for (const r of gating) for (const s of r.soft) if (s.includes(key)) { nextTarget = r.label + ': ' + s; break outer; }
const out = { build: process.argv[2], runs, gatingHasHard: hardFail, nextTarget };
console.log(JSON.stringify(out, null, 1));
