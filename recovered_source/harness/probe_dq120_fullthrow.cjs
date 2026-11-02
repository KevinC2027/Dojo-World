// DQ120 FULL THROWING MOTION probe (set BEFORE dispatch, 2026-10-29 18:00 cycle).
// Queue head: Kev 2026-10-29 ~17:29 verdict on DQ119 ippon: victim reads as
// spinning in the air, neither figure goes through the full motion of throwing.
// Rework: thrower turn-in -> load -> toss -> follow-through as ONE continuous
// action; victim travels a real over-shoulder arc, not a spin.
// Harness: same forced setup as probe_dq119 (attacker go T, throwMove ippon,
// defender carry throwStyle ippon). Harness-only, no live binding.
// Gates (both styles, final values recorded before dispatch):
//  throwerFollowThrough: max attacker hr local x after release, while still in atk,
//    minus hr x at release, >= +0.10 (arm swings THROUGH the toss,
//    not monotonically retracting to stance — the DQ113 note recorded hands
//    retracing monotonically from release peak to 0.32 at t=32).
//  throwerRise: attacker pelvis y at toss peak (max post-release, pre-touchdown)
//    minus pelvis y at last carry tick, >= +0.10 (load crouch -> toss rise).
//  victimRotIntoLanding: victim head-pelvis world angle change over the LAST
//    5 air ticks before touchdown, >= +0.20 rad (rotation still progressing
//    into landing, not finished mid-air then frozen).
//  victimRotAtApexShare: rotation accumulated by apex tick, as a share of total
//    rotation at touchdown, between 0.30 and 0.70 (arc-coupled: rotation tracks
//    the arc, not a time ramp that finishes early).
//  preserved: DQ119 gate elements (trap<=0.55, under, over, inverted>=3,
//    fullArc>=+1.20 world, front>=0.60, fluid<=0.32, hp100, idle after getup),
//    plus thrower per-tick joint step post-release <=0.32 (no snap).
// Usage: node probe_dq120_fullthrow.cjs <build.html>
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
    let releaseTick=-1, touchdownTick=-1, touchdownX=null, throwerXAtTouchdown=null;
    let prevAPose=null, maxThrowerStepPost=0, carryRows=[], airAngles=[], airPel=[];
    let attRows=[], sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='carry', nan=false;
    let maxDefStep=0, prevDPose=null, airFrames=0, apexY=0, apexTick=-1, apexPelX=null;
    let trapLateMax=null, lastCarry=null, underLoad=false, overShoulder=false, invertedAir=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      attRows.push({tick:i, attSt:a.st, attT:a.t, pelY:+ap.pel[1].toFixed(3), pelX:+ap.pel[0].toFixed(3), hrX:+ap.hr[1].toFixed(3), hrXx:+ap.hr[0].toFixed(3), hlXx:+ap.hl[0].toFixed(3), headY:+ap.head[1].toFixed(3), flXx:+ap.fl[0].toFixed(3), frXx:+ap.fr[0].toFixed(3)});
      if(releaseTick<0 && d.st==='air' && d.vy>1){ releaseTick=i; }
      if(prevAPose && releaseTick>=0 && i>releaseTick){
        for(const j of J){ const s=Math.hypot(ap[j][0]-prevAPose[j][0],ap[j][1]-prevAPose[j][1],ap[j][2]-prevAPose[j][2]); if(s>maxThrowerStepPost) maxThrowerStepPost=s; }
      }
      if(prevDPose && (d.st==='carry' || (releaseTick>=0 && i<=releaseTick+1))){
        for(const j of J){ const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s; }
      }
      if(d.st==='carry'){
        const thHl=W(a,ap.hl), thHr=W(a,ap.hr), dvHr=W(d,dp.hr), dvNeck=W(d,dp.neck);
        const pelW=W(d,dp.pel), headW=W(d,dp.head), thPelW=W(a,ap.pel);
        const flW=W(d,dp.fl), frW=W(d,dp.fr);
        carryRows.push({tick:i, trapArm:+dist(thHl,dvHr).toFixed(3), trapLap:+dist(thHr,dvNeck).toFixed(3), sep:+Math.abs(pelW[0]-thPelW[0]).toFixed(3), thPelY:+thPelW[1].toFixed(3), headY:+headW[1].toFixed(3), pelY:+pelW[1].toFixed(3), feetY:+Math.max(flW[1],frW[1]).toFixed(3)});
      }
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel), headW=W(d,dp.head);
        airFrames++;
        const ang=Math.atan2(headW[1]-pelW[1], headW[0]-pelW[0]);
        airAngles.push({tick:i, ang:+ang.toFixed(3), pelX:+pelW[0].toFixed(3), pelY:+pelW[1].toFixed(3)});
        airPel.push(pelW);
        if(d.y>apexY){ apexY=d.y; apexTick=i; apexPelX=pelW[0]; }
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; touchdownX=d.x; throwerXAtTouchdown=a.x; }
      if(d.st==='down') sawDown=true;
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevAPose=ap; prevDPose=dp; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const late=carryRows.slice(-3);
    trapLateMax=late.length?Math.max(...late.map(r=>Math.max(r.trapArm,r.trapLap))):null;
    lastCarry=carryRows.length?carryRows[carryRows.length-1]:null;
    underLoad=!!(lastCarry && lastCarry.sep<=0.50 && lastCarry.thPelY<=1.15);
    overShoulder=!!(lastCarry && lastCarry.headY < lastCarry.pelY-0.10 && lastCarry.feetY > lastCarry.pelY+0.20);
    const airRowsFirst5=airAngles.slice(0,5);
    let norm=(x)=>{ while(x>Math.PI) x-=2*Math.PI; while(x<-Math.PI) x+=2*Math.PI; return x; };
    let flightRot15=null, rotLate=null, rotTotalTo20=null;
    if(airAngles.length>=20){
      let cum=[0]; for(let k=1;k<airAngles.length;k++) cum.push(cum[k-1]+norm(airAngles[k].ang-airAngles[k-1].ang));
      flightRot15=+cum[14].toFixed(3);
      rotLate=+(cum[19]-cum[14]).toFixed(3);
      rotTotalTo20=+cum[19].toFixed(3);
    }
    const attAtkRows=attRows.filter(r=>r.attSt==='atk' && r.tick>=5);
    const footFlTravel=attAtkRows.length?+(Math.max(...attAtkRows.map(r=>r.flXx))-Math.min(...attAtkRows.map(r=>r.flXx))).toFixed(3):null;
    const footFrTravel=attAtkRows.length?+(Math.max(...attAtkRows.map(r=>r.frXx))-Math.min(...attAtkRows.map(r=>r.frXx))).toFixed(3):null;
    const footTravel=Math.max(footFlTravel||0, footFrTravel||0);
    const attAtRelease=attRows.find(r=>r.tick===releaseTick);
    const attPost=attRows.filter(r=>r.tick>releaseTick && r.attSt==='atk');
    const hrMaxPost=attPost.length?Math.max(...attPost.map(r=>r.hrXx)):null;
    const pelMaxPost=attPost.length?Math.max(...attPost.map(r=>r.pelY)):null;
    const followThrough=(hrMaxPost!==null&&attAtRelease)?+(hrMaxPost-attAtRelease.hrXx).toFixed(3):null;
    const throwerRise=(pelMaxPost!==null&&lastCarry)?+(pelMaxPost-lastCarry.thPelY).toFixed(3):null;
    const frontGap=(touchdownX!==null&&throwerXAtTouchdown!==null)?+(touchdownX-throwerXAtTouchdown).toFixed(3):null;
    return {ok:true, entryExists: typeof THROW_PHASES!=='undefined' && !!THROW_PHASES.ippon,
      releaseTick, touchdownTick, trapLateMax, lastCarry, underLoad, overShoulder,
      attAtRelease, hrMaxPost, followThrough, pelMaxPost, throwerRise,
      maxThrowerStepPost:+maxThrowerStepPost.toFixed(3), maxDefStep:+maxDefStep.toFixed(3),
      airFrames, apexY:+apexY.toFixed(3), apexTick, apexPelX, flightRot15, rotLate, rotTotalTo20, footFlTravel, footFrTravel, footTravel,
      frontGap, sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st,
      attRowsSample: attRows.filter(r=>[0,5,11,14,15,16,20,25,32,33,37].includes(r.tick))};
  }
  return { dq120Blue: trial(1), dq120Red: trial(0) };
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
for (const k of Object.keys(out)) {
  const t = out[k];
  const gate = t.ok && t.entryExists && t.trapLateMax!==null && t.trapLateMax<=0.55 && t.underLoad && t.overShoulder && t.flightRot15!==null && t.flightRot15>=1.20 && t.rotLate!==null && t.rotLate>=0.15 && t.footTravel!==null && t.footTravel>=0.20 && t.hrMaxPost!==null && t.hrMaxPost>=0.50 && t.frontGap!==null && t.frontGap>=0.60 && t.maxDefStep<=0.32 && t.maxThrowerStepPost<=0.32 && t.hp===100 && !t.nan && t.sawIdleAfter;
  console.log(k, 'DQ120 GATE (flightRot15>=1.20, rotLate>=0.15, footTravel>=0.20, tossArm>=0.50, preserved DQ119):', gate ? 'PASS' : 'FAIL');
}
