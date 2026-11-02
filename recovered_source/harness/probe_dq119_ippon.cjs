// DQ119 IPPON SEOI NAGE acceptance probe (set BEFORE dispatch, 2026-10-29).
// Queue head: Kev 2026-10-29 ~16:57 CT picked "Build ippon seoi nage (full shoulder)"
// from the Pyatt seoi-variation video breakdown. Spec: one-arm trapped setup
// (thrower's arm traps the opponent's arm, lock held through the throw); standing
// turn-in ~180 degrees, back against the opponent's chest, thrower gets fully
// under; opponent travels the FULL arc over the shoulder; lands IN FRONT of the
// thrower, flat/rolling out. DISTINCT from DQ108 back-carry drape (victim draped
// over the back, back-down rest behind the arc) and from the live DQ105 throws.
// Build pattern follows DQ108: a NEW THROW_PHASES entry, harness-first, NO live
// binding until Kev verdicts the motion. Style binding OPEN; reach/damage OPEN
// and NOT assumed — the harness leaves hp at 100 and proposes no numbers
// (do NOT assume DQ108's 0.70/14 or M.T's 0.75/22).
// Harness: probe forces attacker throwMove='ippon' + defender throwStyle='ippon'
// exactly as the DQ107 carry machinery consumes THROW_PHASES entries.
// World point: W(f,L) = [f.x + f.fx*L[0] - f.fz*L[2], f.y + L[1], f.z + f.fz*L[0] + f.fx*L[2]]
// Gates (set BEFORE dispatch; both attacker styles, same entry):
//   entryExists: THROW_PHASES.ippon defined (else carry falls back to generic
//     DQ105 numbers — the BEFORE state, which must FAIL over/under/front).
//   trapLateMax: max over last 3 carry ticks of thrower-hl <-> victim-hr and
//     thrower-hr <-> victim-neck world distances <= 0.55 (trap across the body,
//     looser than DQ105's 0.35, same family as DQ108's 0.50 allowance).
//   underLoad: at last carry tick, |victim pel world x - thrower pel world x|
//     <= 0.50 (thrower fully under) AND thrower pel world y <= 1.15 (crouched
//     under, below the ~1.22 standing pelvis).
//   overShoulder: at last carry tick, victim head world y < pelvis world y - 0.10
//     AND max(feet world y) > pelvis world y + 0.20 (loaded over the shoulder).
//   invertedAir: among first 5 air ticks, >= 3 have victim head world y <
//     pelvis world y (full-arc inverted flight).
//   landsInFront: victim touchdown x minus thrower x at touchdown >= 0.60
//     (lands in front of the thrower in the facing direction, not draped back).
//   fullArc: victim head-pelvis WORLD vector angle change from first air tick
//     to the 15th air tick >= +1.20 rad. SIGN CORRECTED 2026-10-29 post-first-run:
//     the local rotation is -1.9 rad, but the victim faces -x, so world x is
//     mirrored and the world angle change is POSITIVE (DQ109's shoulder flight,
//     local -0.9 rad, likewise measured world-positive at 0.54). Magnitude
//     threshold 1.20 is unchanged — a FULL arc, beyond shoulder's 0.54 world
//     rotation and far beyond the generic DQ99 mid flight's ~0.
//   fluid: maxDefStep over carry..release+1 air tick <= 0.32 (DQ27b standard).
//   flight: airFrames >= 15, apexY >= 0.60, no NaN, defender reaches idle after
//     getup, hp === 100 (no damage modelled — none proposed/approved).
// Usage: node probe_dq119_ippon.cjs <build.html>
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
    a.hit=1; a.throwMove='ippon'; d.st='carry'; d.t=0; d.throwStyle='ippon';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    let releaseTick=-1, prevDPose=null, maxDefStep=0, carryRows=[], airRows=[];
    let airFrames=0, apexY=0, touchdownTick=-1, touchdownX=null, throwerXAtTouchdown=null, releaseX=null;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='carry', nan=false;
    let airAngleFirst=null, airAngle15=null, airCount=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      if(releaseTick<0 && d.st==='air' && d.vy>1){ releaseTick=i; releaseX=d.x; }
      if(prevDPose && (d.st==='carry' || (releaseTick>=0 && i<=releaseTick+1))){
        for(const j of J){ const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s; }
      }
      if(d.st==='carry'){
        const thHl=W(a,ap.hl), thHr=W(a,ap.hr), dvHr=W(d,dp.hr), dvNeck=W(d,dp.neck);
        const pelW=W(d,dp.pel), headW=W(d,dp.head), thPelW=W(a,ap.pel);
        const flW=W(d,dp.fl), frW=W(d,dp.fr);
        carryRows.push({tick:i,
          trapArm:+dist(thHl,dvHr).toFixed(3), trapLap:+dist(thHr,dvNeck).toFixed(3),
          sep:+Math.abs(pelW[0]-thPelW[0]).toFixed(3),
          thPelY:+thPelW[1].toFixed(3), headY:+headW[1].toFixed(3), pelY:+pelW[1].toFixed(3),
          feetY:+Math.max(flW[1],frW[1]).toFixed(3)});
      }
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel), headW=W(d,dp.head);
        if(airRows.length<5) airRows.push({tick:i, headY:+headW[1].toFixed(3), pelY:+pelW[1].toFixed(3), inverted: headW[1]<pelW[1]});
        airFrames++; airCount++;
        const ang=Math.atan2(headW[1]-pelW[1], headW[0]-pelW[0]);
        if(airAngleFirst===null) airAngleFirst=ang;
        if(airCount===15) airAngle15=ang;
        if(d.y>apexY) apexY=d.y;
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; touchdownX=d.x; throwerXAtTouchdown=a.x; }
      if(d.st==='down') sawDown=true;
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevDPose=dp; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const late=carryRows.slice(-3);
    const trapLateMax=late.length?Math.max(...late.map(r=>Math.max(r.trapArm,r.trapLap))):null;
    const lastCarry=carryRows.length?carryRows[carryRows.length-1]:null;
    const underLoad=!!(lastCarry && lastCarry.sep<=0.50 && lastCarry.thPelY<=1.15);
    const overShoulder=!!(lastCarry && lastCarry.headY < lastCarry.pelY-0.10 && lastCarry.feetY > lastCarry.pelY+0.20);
    const invertedAir=airRows.filter(r=>r.inverted).length;
    const frontGap=(touchdownX!==null&&throwerXAtTouchdown!==null)?+(touchdownX-throwerXAtTouchdown).toFixed(3):null;
    let flightRot=null;
    if(airAngleFirst!==null && airAngle15!==null){ let dd=airAngle15-airAngleFirst; while(dd>Math.PI) dd-=2*Math.PI; while(dd<-Math.PI) dd+=2*Math.PI; flightRot=+dd.toFixed(3); }
    return {ok:true, entryExists: typeof THROW_PHASES!=='undefined' && !!THROW_PHASES.ippon,
      carryTicks:carryRows.length, releaseTick, trapLateMax, lastCarry, underLoad, overShoulder,
      airRows, invertedAir, flightRot, maxDefStep:+maxDefStep.toFixed(3),
      airFrames, apexY:+apexY.toFixed(3), touchdownTick,
      travel: (touchdownX!==null&&releaseX!==null)?+(touchdownX-releaseX).toFixed(3):null,
      frontGap, sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st};
  }
  return { ipponBlue: trial(1), ipponRed: trial(0) };
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
for (const k of Object.keys(out)) {
  const t = out[k];
  const gate = t.ok && t.entryExists && t.trapLateMax !== null && t.trapLateMax <= 0.55 && t.underLoad && t.overShoulder && t.invertedAir >= 3 && t.flightRot !== null && t.flightRot >= 1.20 && t.frontGap !== null && t.frontGap >= 0.60 && t.maxDefStep <= 0.32 && t.carryTicks >= 6 && t.airFrames >= 15 && t.apexY >= 0.60 && t.hp === 100 && !t.nan && t.sawIdleAfter;
  console.log(k, 'GATE (entry, trap<=0.55, under, over, invertedAir>=3, fullArc>=+1.20 world, front>=0.60, fluid<=0.32, flight, hp100):', gate ? 'PASS' : 'FAIL');
}
console.log('NOTE: hp 100 is deliberate — no ippon reach/damage has been proposed or approved; tryHit is unwired this cycle by design (style binding open, awaits Kev verdict).');
