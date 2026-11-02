// Ippon contact-constraints probe. READ-ONLY: loads the build, drives forced
// ippon both directions in the node vm harness, measures the §5 series of
// hidden_files/claude-loop/ippon-contact-constraints-spec.md, never modifies
// prototype/index.html. Harness + world transform + jointsW copied from
// probe_contact_consistency.cjs (proven pattern).
//
// Per tick, world-space joints via the engine's own transform (line 521):
//   W = [f.x + f.fx*q0 - f.fz*q2, f.y + q1, f.z + f.fz*q0 + f.fx*q2]
// Shoulders/hips reconstructed from pose rotS/rotH with the engine's own
// line-466 formulas, then world-transformed like any joint.
// Metrics per run: sleeve grip (thrower lead hand to victim controlled-arm
// segments), point grip (existing definition), foot sliding per foot per
// window, joint angles + bend-side flips, segment distances + penetration
// ticks (drape pairs excluded), carried-over HN/PN/segment-dev/step gates.
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
function segSeg(p1, p2, p3, p4) {
  const d1 = SUB(p2, p1), d2 = SUB(p4, p3), r = SUB(p1, p3);
  const a = DOT(d1, d1), e = DOT(d2, d2), f = DOT(d2, r);
  let s, t;
  if (a <= 1e-12 && e <= 1e-12) return D3(p1, p3);
  if (a <= 1e-12) { t = Math.max(0, Math.min(1, f / e)); return D3(p1, [p3[0] + d2[0] * t, p3[1] + d2[1] * t, p3[2] + d2[2] * t]); }
  const c = DOT(d1, r);
  if (e <= 1e-12) { s = Math.max(0, Math.min(1, -c / a)); return D3([p1[0] + d1[0] * s, p1[1] + d1[1] * s], p3); }
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
function run(label, atkStyle, defStyle) {
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
    {const cf=pose(d);a.hit=1;a.throwMove='ippon';d.st='carry';d.t=0;d.throwStyle='ippon';d.carryFrom=cf;d.ic='mid';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;}
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
  // Window label per frame: thrower turn-in uses atk ticks; victim windows use vicSt/vicT.
  const win = (f) => {
    if (f.vicSt === 'carry' && f.vicT <= 15) return 'GRAB';
    if (f.vicSt === 'carry') return 'LOCK';
    if (f.vicSt === 'air' && f.vicT <= 6) return 'RELEASE';
    if (f.vicSt === 'air') return 'FLIGHT';
    if (f.vicSt === 'down') return 'LANDING';
    if (f.vicSt === 'getup') return 'RECOVERY';
    return 'OTHER';
  };
  const lat = (W, root, mid, end, fx, fz) => {
    // Signed lateral offset of mid from the root->end axis, in facing frame.
    const ax = SUB(end, root), t = Math.max(0, Math.min(1, DOT(SUB(mid, root), ax) / Math.max(1e-12, DOT(ax, ax))));
    const cp = [root[0] + ax[0] * t, root[1] + ax[1] * t, root[2] + ax[2] * t];
    const off = SUB(mid, cp);
    return -fz * off[0] + fx * off[2];
  };
  const S = { sleeve: [], point: [], ctrlArmTorso: [], tt: [], headT: [], pelT: [], limbT: [] };
  const angS = { thr: { elbowL: [], elbowR: [], kneeL: [], kneeR: [] }, vic: { elbowL: [], elbowR: [], kneeL: [], kneeR: [] } };
  const flipS = { thr: { elbowL: 0, elbowR: 0, kneeL: 0, kneeR: 0 }, vic: { elbowL: 0, elbowR: 0, kneeL: 0, kneeR: 0 } };
  const flipTicks = { thr: { elbowL: [], elbowR: [], kneeL: [], kneeR: [] }, vic: { elbowL: [], elbowR: [], kneeL: [], kneeR: [] } };
  const prevSign = { thr: {}, vic: {} };
  const feet = { thr: { fl: [], fr: [] }, vic: { fl: [], fr: [] } };
  let maxHN = 0, maxPN = 0, maxStep = { v: 0, t: null, j: null }, maxSegDev = { v: 0, w: null };
  let vicFeetLeave = null, heldTick = null, lostTick = null, prevHl = null, handStepMax = { v: 0, t: null };
  for (let i = 0; i < F.length; i++) {
    const f = F[i], wa = jointsW(f, 'a'), wd = jointsW(f, 'd'), w = win(f);
    f._w = w; f._wa = wa; f._wd = wd;
    // Release hand continuity (spec v1.1): the thrower's lead hand must follow
    // through during air 0-6, not snap back. Distance to the flying victim is
    // NOT gated (separation is expected ballistics).
    if (prevHl && w === 'RELEASE') { const d = D3(wa.hl, prevHl); if (d > handStepMax.v) handStepMax = { v: +d.toFixed(3), t: f.tick }; }
    prevHl = wa.hl;
    // Sleeve grip: thrower lead hand (hl) to victim controlled-arm segments (SL->el, el->hl).
    const sg = Math.min(ptSeg(wa.hl, wd.SL, wd.el), ptSeg(wa.hl, wd.el, wd.hl));
    S.sleeve.push(sg);
    let mg = 9;
    for (const h of ['hl', 'hr']) for (const j of ['hl', 'hr', 'el', 'er', 'neck', 'pel']) mg = Math.min(mg, D3(wa[h], wd[j]));
    S.point.push(mg);
    S.ctrlArmTorso.push(Math.min(ptSeg(wd.hl, wa.pel, wa.neck), ptSeg(wd.el, wa.pel, wa.neck)));
    S.tt.push(segSeg(wd.pel, wd.neck, wa.pel, wa.neck));
    S.headT.push(ptSeg(wd.head, wa.pel, wa.neck));
    S.pelT.push(ptSeg(wd.pel, wa.pel, wa.neck));
    let limb = 9; for (const j of ['hl', 'hr', 'fl', 'fr']) limb = Math.min(limb, ptSeg(wd[j], wa.pel, wa.neck));
    S.limbT.push(limb);
    const hn = D3(wd.head, wd.neck), pn = D3(wd.pel, wd.neck);
    if (hn > maxHN) maxHN = hn; if (pn > maxPN) maxPN = pn;
    if (i > 0) { const gw = jointsW(F[i - 1], 'd'); let ms = 0, mj = null;
      for (const j of JOINTS) { const s = D3(wd[j], gw[j]); if (s > ms) { ms = s; mj = j; } }
      if (ms > maxStep.v) maxStep = { v: +ms.toFixed(3), t: f.tick, j: mj }; }
    for (const [tag, W] of [['vic', wd], ['thr', wa]]) {
      const row = {
        upperArmL: Math.abs(D3(W.SL, W.el) - 0.40), upperArmR: Math.abs(D3(W.SR, W.er) - 0.40),
        foreArmL: Math.abs(D3(W.el, W.hl) - 0.40), foreArmR: Math.abs(D3(W.er, W.hr) - 0.40),
        thighL: Math.abs(D3(W.HL, W.kl) - 0.62), thighR: Math.abs(D3(W.HR, W.kr) - 0.62),
        shinL: Math.abs(D3(W.kl, W.fl) - 0.62), shinR: Math.abs(D3(W.kr, W.fr) - 0.62),
        torso: Math.abs(D3(W.pel, W.neck) - 0.55), neckHead: Math.abs(D3(W.neck, W.head) - 0.24)
      };
      for (const k in row) if (row[k] > maxSegDev.v) maxSegDev = { v: +row[k].toFixed(3), w: tag + '.' + k + '@' + f.tick };
    }
    const aRow = (W) => ({
      elbowL: ANGLE(SUB(W.SL, W.el), SUB(W.hl, W.el)), elbowR: ANGLE(SUB(W.SR, W.er), SUB(W.hr, W.er)),
      kneeL: ANGLE(SUB(W.HL, W.kl), SUB(W.fl, W.kl)), kneeR: ANGLE(SUB(W.HR, W.kr), SUB(W.fr, W.kr))
    });
    const at = aRow(wa), vt = aRow(wd);
    for (const k in at) { angS.thr[k].push(at[k]); angS.vic[k].push(vt[k]); }
    const flips = (tag, W, fx, fz) => {
      const joints = { elbowL: [W.SL, W.el, W.hl], elbowR: [W.SR, W.er, W.hr], kneeL: [W.HL, W.kl, W.fl], kneeR: [W.HR, W.kr, W.fr] };
      for (const k in joints) {
        const [r, m, e] = joints[k];
        const s = lat(W, r, m, e, fx, fz) >= 0 ? 1 : -1;
        if (prevSign[tag][k] !== undefined && s !== prevSign[tag][k]) { flipS[tag][k]++; flipTicks[tag][k].push(f.tick); }
        prevSign[tag][k] = s;
      }
    };
    flips('thr', wa, f.afx, f.afz); flips('vic', wd, f.dfx, f.dfz);
    for (const side of ['thr', 'vic']) for (const ft of ['fl', 'fr']) {
      const W = side === 'thr' ? wa : wd;
      feet[side][ft].push(W[ft]);
    }
    const vf = Math.min(wd.fl[1], wd.fr[1]);
    if (f.vicSt === 'carry' && vicFeetLeave === null && vf > 0.05) vicFeetLeave = { tick: f.tick, vicT: f.vicT };
  }
  // Grip state machine over carry + release frames.
  const carryIdx = F.map((f, i) => (f.vicSt === 'carry' ? i : -1)).filter(i => i >= 0);
  const relIdx = F.map((f, i) => (f.vicSt === 'air' && f.vicT <= 6 ? i : -1)).filter(i => i >= 0);
  for (let k = 0; k + 2 < carryIdx.length; k++) {
    if (S.sleeve[carryIdx[k]] <= 0.10 && S.sleeve[carryIdx[k + 1]] <= 0.10 && S.sleeve[carryIdx[k + 2]] <= 0.10) { heldTick = F[carryIdx[k]].tick; break; }
  }
  const lossIdx = [...carryIdx];
  for (let k = 0; k + 1 < lossIdx.length; k++) {
    if (heldTick !== null && F[lossIdx[k]].tick > heldTick && S.sleeve[lossIdx[k]] > 0.30 && S.sleeve[lossIdx[k + 1]] > 0.30) { lostTick = F[lossIdx[k]].tick; break; }
  }
  const maxIn = (arr, idx) => idx.length ? +Math.max(...idx.map(i => arr[i])).toFixed(3) : null;
  const winIdx = (name) => F.map((f, i) => (f._w === name ? i : -1)).filter(i => i >= 0);
  const WINS = ['GRAB', 'LOCK', 'RELEASE', 'FLIGHT', 'LANDING', 'RECOVERY'];
  const sleeveByWin = {}, pointByWin = {};
  for (const wn of WINS) { sleeveByWin[wn] = maxIn(S.sleeve, winIdx(wn)); pointByWin[wn] = maxIn(S.point, winIdx(wn)); }
  // Foot sliding per window.
  const slide = (series, idx) => {
    let maxPer = 0, total = 0;
    for (let k = 1; k < idx.length; k++) {
      const a = series[idx[k - 1]], b = series[idx[k]];
      if (!a || !b) continue;
      const d = Math.hypot(b[0] - a[0], b[2] - a[2]);
      if (d > maxPer) maxPer = d; total += d;
    }
    return { maxPerTick: +maxPer.toFixed(3), totalDrift: +total.toFixed(3) };
  };
  const vicGrabIdx = F.map((f, i) => (f.vicSt === 'carry' && (vicFeetLeave === null || f.tick <= vicFeetLeave.tick) ? i : -1)).filter(i => i >= 0);
  const turnIdx = F.map((f, i) => (f.atkSt === 'atk' && f.atkT >= 24 && f.atkT <= 41 ? i : -1)).filter(i => i >= 0);
  const footReport = {
    vicGrab: { fl: slide(feet.vic.fl, vicGrabIdx), fr: slide(feet.vic.fr, vicGrabIdx) },
    thrTurn: { fl: slide(feet.thr.fl, turnIdx), fr: slide(feet.thr.fr, turnIdx) }
  };
  const thrTurnDrift = { fl: footReport.thrTurn.fl.totalDrift, fr: footReport.thrTurn.fr.totalDrift };
  const pivotFoot = thrTurnDrift.fl <= thrTurnDrift.fr ? 'fl' : 'fr';
  // Joint angles per window.
  const angByWin = {};
  for (const wn of WINS) {
    const idx = winIdx(wn);
    angByWin[wn] = {};
    for (const tag of ['thr', 'vic']) for (const k in angS[tag]) {
      const vals = idx.map(i => angS[tag][k][i]);
      angByWin[wn][tag + '.' + k] = vals.length ? { min: +Math.min(...vals).toFixed(1), max: +Math.max(...vals).toFixed(1) } : null;
    }
  }
  const belowFloor = (tag, joint, floor, wins) => {
    let ticks = 0, worst = null;
    for (const wn of wins) for (const i of winIdx(wn)) {
      const v = angS[tag][joint][i];
      if (v < floor) { ticks++; if (worst === null || v < worst) worst = v; }
    }
    return { ticks, worst: worst !== null ? +worst.toFixed(1) : null };
  };
  const jointFloors = {
    'thr.elbowL': belowFloor('thr', 'elbowL', 30, WINS), 'thr.elbowR': belowFloor('thr', 'elbowR', 30, WINS),
    'vic.elbowL': belowFloor('vic', 'elbowL', 30, WINS), 'vic.elbowR': belowFloor('vic', 'elbowR', 30, WINS),
    'thr.kneeL': belowFloor('thr', 'kneeL', 70, WINS), 'thr.kneeR': belowFloor('thr', 'kneeR', 70, WINS),
    'vic.kneeL.carryAir': belowFloor('vic', 'kneeL', 90, ['GRAB', 'LOCK', 'RELEASE', 'FLIGHT']),
    'vic.kneeR.carryAir': belowFloor('vic', 'kneeR', 90, ['GRAB', 'LOCK', 'RELEASE', 'FLIGHT'])
  };
  // Penetration ticks per pair per window (drape pairs excluded in carry + release).
  const penCount = (arr, wn, drape) => {
    const idx = winIdx(wn);
    if (drape && (wn === 'GRAB' || wn === 'LOCK' || wn === 'RELEASE')) return 0;
    return idx.filter(i => arr[i] < 0.005).length;
  };
  const pen = {};
  for (const wn of WINS) {
    pen[wn] = {
      torsoTorso: penCount(S.tt, wn, true), ctrlArmTorso: penCount(S.ctrlArmTorso, wn, true),
      headTorso: penCount(S.headT, wn, false), pelTorso: penCount(S.pelT, wn, false), limbTorso: penCount(S.limbT, wn, false)
    };
  }
  const minIn = (arr, idx) => idx.length ? +Math.min(...idx.map(i => arr[i])).toFixed(3) : null;
  const interMin = {};
  for (const wn of WINS) {
    const idx = winIdx(wn);
    interMin[wn] = { torsoTorso: minIn(S.tt, idx), ctrlArmTorso: minIn(S.ctrlArmTorso, idx), headTorso: minIn(S.headT, idx), pelTorso: minIn(S.pelT, idx), limbTorso: minIn(S.limbT, idx) };
  }
  const hard = [], soft = [];
  if (heldTick === null) soft.push('sleeve grip never held (3 consecutive carry ticks <=0.10)');
  if (lostTick !== null) hard.push('sleeve grip lost at tick ' + lostTick + ' (after hold)');
  // GRAB sleeve max and victim planted-foot slide are REPORTED, not flagged:
  // the forced path teleports the victim into carry, so it cannot measure the
  // true grab approach or pre-carry planted feet (spec v1.1).
  if (sleeveByWin.LOCK !== null && sleeveByWin.LOCK > 0.10) hard.push('sleeve grip LOCK max ' + sleeveByWin.LOCK + 'm > 0.10');
  if (handStepMax.v > 0.20) hard.push('release hand snap-back: lead-hand step ' + handStepMax.v + 'm > 0.20 at air tick ' + handStepMax.t);
  if (pointByWin.LOCK !== null && pointByWin.LOCK > 0.20) soft.push('point grip LOCK max ' + pointByWin.LOCK + 'm > 0.20');
  // Pivot: on this build the turn-in moves no thrower feet at all (pose-only
  // turn), so a 0/0 drift is a measurement gap, not a pass (spec v1.1).
  if (footReport.thrTurn[pivotFoot].totalDrift > 0.05) hard.push('pivot foot (' + pivotFoot + ') drift ' + footReport.thrTurn[pivotFoot].totalDrift + 'm > 0.05');
  for (const k in jointFloors) if (jointFloors[k].ticks > 0) hard.push('joint floor breach ' + k + ': ' + jointFloors[k].ticks + ' ticks, worst ' + jointFloors[k].worst + 'deg');
  // Bend-side flips are EXPERIMENTAL ONLY (spec v1.1): the facing-frame sign
  // is contaminated by frame rotation (turn-in yaw, victim tumble), so flip
  // counts are reported as data in joints.flips, never flagged here.
  for (const wn of WINS) for (const pair in pen[wn]) if (pen[wn][pair] > 0) hard.push('penetration ' + pair + ' in ' + wn + ': ' + pen[wn][pair] + ' ticks');
  if (maxHN > 0.26) hard.push('HN ' + maxHN.toFixed(3) + 'm > 0.26');
  if (maxPN > 0.57) hard.push('PN ' + maxPN.toFixed(3) + 'm > 0.57');
  if (maxSegDev.v > 0.10) hard.push('segment dev ' + maxSegDev.v + 'm > 0.10 (' + maxSegDev.w + ')');
  if (maxStep.v > 0.20) soft.push('joint step ' + maxStep.v + 'm > 0.20 (' + maxStep.j + '@' + maxStep.t + ') — rank 7, sacrificed last');
  return { label, hitTick: res.hitTick, releaseTick: res.releaseTick, touchTick: res.touchTick, downEnd: res.downEnd,
    grip: { sleeveByWin, pointByWin, heldTick, lostTick, feetLeave: vicFeetLeave, releaseHandStepMax: handStepMax },
    feet: { vicGrab: footReport.vicGrab, thrTurn: footReport.thrTurn, pivotFoot, pivotDrift: +thrTurnDrift[pivotFoot].toFixed(3) },
    joints: { byWin: angByWin, floors: jointFloors, flips: flipS, flipTicks, maxHN: +maxHN.toFixed(3), maxPN: +maxPN.toFixed(3), maxStep, maxSegDev },
    intersections: { minByWin: interMin, penTicks: pen },
    hard, soft };
}
const runs = [run('Blue throws Red (ippon, forced)', 1, 0), run('Red throws Blue (ippon, forced)', 0, 1)];
const out = { build: process.argv[2], spec: 'hidden_files/claude-loop/ippon-contact-constraints-spec.md v1.0', runs, gatingHasHard: runs.some(r => r.hard.length > 0) };
console.log(JSON.stringify(out, null, 1));
