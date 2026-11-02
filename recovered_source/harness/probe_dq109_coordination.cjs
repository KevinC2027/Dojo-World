// DQ109 THROW COORDINATION + THROW-SPECIFIC FLIGHT/LANDING (Kev verdict 2026-10-29 ~06:26 CT
// on DQ108: "Close but no cigar for both. The catch is coordinating both characters to
// realistically go through the throwing motions. Seems like the same falling sequence is
// being used for throws as for strikes.")
// Shoulder entry ONLY (harness-forced, as in DQ108 — style binding still open, DQ105 throws
// must stay byte-identical). Defects measured here, BEFORE dispatch:
//  (1) Thrower does NOT turn in / bend with the victim: M.T shoulder pose has only small
//      grab offsets + dip/heave; rotS/rotH stay 0, pelvis never drops toward a load, and the
//      thrower finishes its 33-tick move while the victim is still carried.
//  (2) Victim is NOT coupled to the thrower: update() carry anchors the victim root at a
//      fixed thrower.x + 0.8 for the whole carry, whatever the thrower does; victim pose
//      blends on its own carryK clock, not on the thrower's phase.
//  (3) Flight is frozen: AC.shoulder is a fixed table; the only flight motion is the DQ17
//      lean + loose-limb sway, then a blend into the generic strike touchdown.
//  (4) Landing IS the strike fall: air/down branches use the same L0 touchdown and D0 rest
//      for every ic except low (face-down mirror); shoulder touchdown/rest are identical
//      to a mid strike fall, and getup is the same DQ17i rise.
// World point: W(f,L) = [f.x + f.fx*L[0] - f.fz*L[2], f.y + L[1], f.z + f.fz*L[0] + f.fx*L[2]]
// Usage: node probe_dq109_coordination.cjs <build.html>
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const out = vm.runInContext(`(() => {
  function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2], f.y+L[1], f.z+f.fz*L[0]+f.fx*L[2]];}
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
  const J=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
  function trial(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false, why:'go-refused'};
    const cf=pose(d);
    a.hit=1; a.throwMove='shoulder'; d.hp=86; d.st='carry'; d.t=0; d.throwStyle='shoulder';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    let releaseTick=-1, prevDPose=null, maxDefStep=0, carryRows=[], airAngles=[], airRows=[];
    let airFrames=0, apexY=0, touchdownTick=-1, releaseX=null, releaseRootStep=null, prevRootX=null;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='carry', nan=false, feetMaxCarry=0;
    let throwerStart=null, throwerPeakDrop=0, throwerPeakFwd=0, throwerLast=null;
    let lastCarryRootX=null, firstAirRootX=null;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      const aPelW=W(a,ap.pel), aHeadW=W(a,ap.head), dPelW=W(d,dp.pel);
      if(d.st==='carry'){
        // Thrower bend measured on the LOCAL pose at the last carry tick (origin-blend-free
        // after attacker t>=5): fwd = head.x - pel.x (forward lean over the load), gap =
        // head.y - pel.y (torso pitch: a bent-forward thrower has a SMALLER vertical gap).
        // Baseline (diag 2026-10-29): last-carry fwd 0.053, gap 0.890 — the thrower crouches
        // straight down (dip/heave) and straightens AWAY from the victim, never bending over it.
        throwerLast={fwd:+((ap.head[0]-ap.pel[0]).toFixed(3)), gap:+((ap.head[1]-ap.pel[1]).toFixed(3)), pelY:+ap.pel[1].toFixed(3)};
        const thW=W(a,ap.hl), dhW=W(d,dp.hr);
        // sep = HORIZONTAL pelvis distance (x-z plane). Vertical separation IS the drape
        // (victim pelvis sits above the thrower's when draped over the shoulder), so it is
        // gated separately as vertGap, not folded into sep. Baseline horiz sepLast ~0.57:
        // the victim floats 0.57 m in FRONT of the thrower instead of on his back.
        carryRows.push({tick:i, grip:+dist(thW,dhW).toFixed(3),
          sep:+Math.hypot(aPelW[0]-dPelW[0],aPelW[2]-dPelW[2]).toFixed(3),
          vertGap:+((W(d,dp.pel)[1]-aPelW[1]).toFixed(3)),
          headY:+W(d,dp.head)[1].toFixed(3), pelY:+dPelW[1].toFixed(3),
          feetY:+Math.max(W(d,dp.fl)[1],W(d,dp.fr)[1]).toFixed(3),
          rootX:+d.x.toFixed(3)});
        const f=Math.max(d.y+dp.fl[1], d.y+dp.fr[1]); if(f>feetMaxCarry) feetMaxCarry=f;
        lastCarryRootX=d.x;
      }
      if(releaseTick<0 && d.st==='air' && d.vy>1){ releaseTick=i; releaseX=d.x; firstAirRootX=d.x; releaseRootStep=(lastCarryRootX!==null)?Math.abs(d.x-lastCarryRootX):null; }
      if(prevDPose && (d.st==='carry' || (releaseTick>=0 && i<=releaseTick+1))){
        for(const j of J){ const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s; }
      }
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel), headW=W(d,dp.head);
        const ang=Math.atan2(headW[1]-pelW[1], headW[0]-pelW[0]);
        if(airAngles.length<10) airAngles.push(+ang.toFixed(3));
        if(airRows.length<5) airRows.push({tick:i, headY:+headW[1].toFixed(3), pelY:+pelW[1].toFixed(3), inverted: headW[1]<pelW[1]});
        airFrames++; if(d.y>apexY) apexY=d.y;
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; }
      if(d.st==='down') sawDown=true;
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevDPose=dp; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const late=carryRows.slice(-3);
    const gripLateMax=late.length?Math.max(...late.map(r=>r.grip)):null;
    const lastCarry=carryRows.length?carryRows[carryRows.length-1]:null;
    const draped=!!(lastCarry && lastCarry.headY < lastCarry.pelY-0.10 && lastCarry.feetY > lastCarry.pelY+0.20);
    const invertedAir=airRows.filter(r=>r.inverted).length;
    const seps=carryRows.map(r=>r.sep);
    const vertGapLast=carryRows.length?carryRows[carryRows.length-1].vertGap:null;
    const gripMid=carryRows.filter(r=>r.tick>=5).map(r=>r.grip);
    // Static pose comparison: shoulder vs mid strike fall, same state/params.
    function staticPose(st, t, ic, rm){
      const f2=mk(0,0); f2.x=0; f2.z=0; f2.fx=1; f2.fz=0; f2.ax=1; f2.az=0;
      f2.st=st; f2.t=t; f2.ic=ic; f2.rm=rm||0; f2.vx=3; f2.vz=0; f2.vy=0; f2.y=0; f2.gy=-.08;
      const p=pose(f2); const o={};
      for(const j of ['pel','neck','head','hl','hr','fl','fr']) o[j]=W(f2,p[j]).map(v=>+v.toFixed(3));
      return o;
    }
    const downSh=staticPose('down',0,'shoulder',0), downMid=staticPose('down',0,'mid',0);
    const restSh=staticPose('down',30,'shoulder',0), restMid=staticPose('down',30,'mid',0);
    const getupSh=staticPose('getup',0,'shoulder',0);
    function meanDist(pa,pb){ const ks=Object.keys(pa); let s=0; for(const k of ks) s+=dist(pa[k],pb[k]); return +(s/ks.length).toFixed(3); }
    const flightRot = airAngles.length>=2 ? +(Math.max(...airAngles)-Math.min(...airAngles)).toFixed(3) : 0;
    return {ok:true, entryExists: typeof THROW_PHASES!=='undefined' && !!THROW_PHASES.shoulder,
      carryTicks:carryRows.length, releaseTick, gripLateMax, gripMidMax: gripMid.length?Math.max(...gripMid):null,
      gripLast: carryRows.length?carryRows[carryRows.length-1].grip:null,
      throwerLast,
      sepFirst: seps.length?seps[0]:null, sepLast: seps.length?seps[seps.length-1]:null,
      sepMax: seps.length?+Math.max(...seps).toFixed(3):null, vertGapLast,
      lastCarry, draped, airAngles, flightRot, airRows, invertedAir,
      maxDefStep:+maxDefStep.toFixed(3), releaseRootStep: releaseRootStep!==null?+releaseRootStep.toFixed(3):null,
      feetMaxCarry:+feetMaxCarry.toFixed(3), airFrames, apexY:+apexY.toFixed(3), touchdownTick,
      downDistShVsMid: meanDist(downSh,downMid), restDistShVsMid: meanDist(restSh,restMid),
      downGetupContinuity: meanDist(restSh,getupSh),
      downSh, downMid, restSh, restMid, getupSh,
      sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st};
  }
  return { shoulderBlue: trial(1), shoulderRed: trial(0) };
})()`, sandbox);
for (const k of Object.keys(out)) {
  const t = out[k];
  console.log('=====', k, '=====');
  if (!t.ok) { console.log(t); continue; }
  console.log(JSON.stringify({carryTicks:t.carryTicks, releaseTick:t.releaseTick, gripLateMax:t.gripLateMax, gripMidMax:t.gripMidMax,
    gripLast:t.gripLast, throwerLast:t.throwerLast, sepFirst:t.sepFirst, sepLast:t.sepLast, sepMax:t.sepMax, vertGapLast:t.vertGapLast,
    draped:t.draped, invertedAir:t.invertedAir, flightRot:t.flightRot, airAngles:t.airAngles,
    maxDefStep:t.maxDefStep, releaseRootStep:t.releaseRootStep, feetMaxCarry:t.feetMaxCarry,
    airFrames:t.airFrames, apexY:t.apexY, touchdownTick:t.touchdownTick,
    downDistShVsMid:t.downDistShVsMid, restDistShVsMid:t.restDistShVsMid, downGetupContinuity:t.downGetupContinuity,
    sawDown:t.sawDown, sawGetup:t.sawGetup, sawIdleAfter:t.sawIdleAfter, hp:t.hp, nan:t.nan, endSt:t.endSt}, null, 1));
}
// GATES (DQ109, set BEFORE dispatch — shoulder only; DQ105/DQ107 trace gates are separate).
// Baseline on f3ce2130 (both styles): throwerLast fwd 0.053 / gap 0.890; sepLast 0.653/0.649;
// flightRot 0; downDist 0; restDist 0; downGetupContinuity 0 (identical tables, so trivially
// continuous — the fix must KEEP continuity while making the tables distinct).
//   throwerBent: throwerLast.fwd >= 0.30 AND throwerLast.gap <= 0.78 (bent forward over the load at release)
//   anchorCoupled: sepLast (horizontal) <= 0.45 AND vertGapLast in [0.20, 0.60] (victim pelvis
//     drawn onto the back horizontally, still draped above the thrower's pelvis vertically)
//   gripHeld: gripLateMax <= 0.50 (DQ108 bar, preserved)
//   flightRotates: flightRot (head-pel angle range, first 10 air ticks) >= 0.25 rad
//   landingDistinct: downDistShVsMid >= 0.25 AND restDistShVsMid >= 0.20
//   landingContinuous: downGetupContinuity (shoulder rest -> shoulder getup t=0) <= 0.05
//   preserved: draped true, invertedAir >= 3, maxDefStep <= 0.32, releaseRootStep <= 0.20,
//     airFrames >= 15, apexY >= 0.60, hp 86, no NaN, idle after getup
for (const k of Object.keys(out)) {
  const t = out[k];
  const gate = t.ok && t.entryExists && t.throwerLast && t.throwerLast.fwd>=0.30 && t.throwerLast.gap<=0.78
    && t.sepLast<=0.45 && t.vertGapLast>=0.20 && t.vertGapLast<=0.60 && t.gripLateMax<=0.50
    && t.flightRot>=0.25 && t.downDistShVsMid>=0.25 && t.restDistShVsMid>=0.20 && t.downGetupContinuity<=0.05
    && t.draped && t.invertedAir>=3 && t.maxDefStep<=0.32 && t.releaseRootStep!==null && t.releaseRootStep<=0.20
    && t.airFrames>=15 && t.apexY>=0.60 && t.hp===86 && !t.nan && t.sawIdleAfter;
  console.log(k, 'DQ109 GATE:', gate ? 'PASS' : 'FAIL');
}
