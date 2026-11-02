// DQ108 SHOULDER THROW acceptance probe (set BEFORE dispatch, 2026-10-29).
// Queue: Kev 2026-10-29 ~05:34 CT "Build the shoulder throw from this at 6 AM" —
// a NEW phase-table entry under the DQ107 structure, from the filed reference
// files/dojo-world-throw-reference-shoulder-sequence-20261029.jpg:
// grab (clinch/grip + foot step-in) -> turn-in -> load (victim draped over back/
// shoulder) -> release (launch over the back, victim inverted in flight) -> recovery.
// It does NOT replace or alter either DQ105 throw. Style binding is OPEN (Kev did
// not assign Blue or Red), so the entry is demonstrated HARNESS-FORCED here:
// the probe sets defender st='carry', throwStyle='shoulder' directly, exactly as
// the DQ107 carry machinery consumes it. Live gameplay binding awaits Kev's
// verdict and is NOT guessed in this cycle (no tryHit / M.T / AI / input change).
// Proposed numbers from Kev's pasted shoulderThrow design (PROPOSED ONLY, not
// approved): reach 0.70, damage 14. The harness models damage 14 (hp 86) because
// tryHit is deliberately unwired; the probe reports this modelling explicitly.
// World point: W(f,L) = [f.x + f.fx*L[0] - f.fz*L[2], f.y + L[1], f.z + f.fz*L[0] + f.fx*L[2]]
// Gates (set BEFORE dispatch; both attacker styles, same entry):
//   entryExists: THROW_PHASES.shoulder is defined (else the carry falls back to
//     the generic DQ105 numbers — the BEFORE state, which must FAIL drape/invert).
//   gripLateMax: max over last 3 carry ticks of thrower-hl <-> defender-hr world
//     distance (same pair as DQ105) <= 0.50 (looser than DQ105's 0.35: a shoulder
//     grip is across the body, not same-side).
//   draped: at the LAST carry tick, victim head world y < pelvis world y - 0.10
//     AND max(feet world y) > pelvis world y + 0.20 (head down, feet up over back).
//   invertedAir: among the first 5 air ticks, >= 3 have victim head world y <
//     pelvis world y (genuine over-the-back inverted flight, distinct from the
//     DQ99 mid-sprawl flight where head sits above pelvis).
//   fluid: maxDefStep over carry..release+1 air tick <= 0.32 (DQ27b standard).
//   flight: airFrames >= 15, apexY >= 0.60, no NaN, defender reaches idle after
//     getup, hp === 86 (modelled proposed damage), carryFrames >= 6.
// Usage: node probe_dq108_shoulder.cjs <build.html>
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
function W(f, L) { return [f.x + f.fx * L[0] - f.fz * L[2], f.y + L[1], f.z + f.fz * L[0] + f.fx * L[2]]; }
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
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
    // HARNESS-FORCED shoulder throw: bypass tryHit (unwired by design this cycle).
    // a.throwMove='shoulder' selects the shoulder grab offsets in the M.T pose
    // branch (THROW_PHASES[f.throwMove||f.style]); live code never sets it.
    const cf=pose(d);
    a.hit=1; a.throwMove='shoulder'; d.hp=86; d.st='carry'; d.t=0; d.throwStyle='shoulder';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    let releaseTick=-1, prevDPose=null, maxDefStep=0, carryRows=[], airRows=[];
    let airFrames=0, apexY=0, touchdownTick=-1, touchdownX=null, releaseX=null;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='carry', nan=false, feetMaxCarry=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      if(releaseTick<0 && d.st==='air' && d.vy>1){ releaseTick=i; releaseX=d.x; }
      if(prevDPose && (d.st==='carry' || (releaseTick>=0 && i<=releaseTick+1))){
        for(const j of J){ const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s; }
      }
      if(d.st==='carry'){
        const thW=W(a,ap.hl), dhW=W(d,dp.hr), pelW=W(d,dp.pel), headW=W(d,dp.head);
        const flW=W(d,dp.fl), frW=W(d,dp.fr);
        carryRows.push({tick:i, grip:+dist(thW,dhW).toFixed(3),
          headY:+headW[1].toFixed(3), pelY:+pelW[1].toFixed(3),
          feetY:+Math.max(flW[1],frW[1]).toFixed(3),
          head:headW.map(v=>+v.toFixed(3)), pel:pelW.map(v=>+v.toFixed(3))});
        const f=Math.max(d.y+dp.fl[1], d.y+dp.fr[1]); if(f>feetMaxCarry) feetMaxCarry=f;
      }
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel), headW=W(d,dp.head);
        if(airRows.length<5) airRows.push({tick:i, headY:+headW[1].toFixed(3), pelY:+pelW[1].toFixed(3), inverted: headW[1]<pelW[1]});
        airFrames++; if(d.y>apexY) apexY=d.y;
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; touchdownX=d.x; }
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
    return {ok:true, entryExists: typeof THROW_PHASES!=='undefined' && !!THROW_PHASES.shoulder,
      carryTicks:carryRows.length, releaseTick, gripLateMax, lastCarry, draped,
      airRows, invertedAir, maxDefStep:+maxDefStep.toFixed(3), feetMaxCarry:+feetMaxCarry.toFixed(3),
      airFrames, apexY:+apexY.toFixed(3), touchdownTick,
      travel: (touchdownX!==null&&releaseX!==null)?+(touchdownX-releaseX).toFixed(3):null,
      sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st};
  }
  return { shoulderBlue: trial(1), shoulderRed: trial(0) };
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
for (const k of Object.keys(out)) {
  const t = out[k];
  const gate = t.ok && t.entryExists && t.gripLateMax !== null && t.gripLateMax <= 0.50 && t.draped && t.invertedAir >= 3 && t.maxDefStep <= 0.32 && t.carryTicks >= 6 && t.airFrames >= 15 && t.apexY >= 0.60 && t.hp === 86 && !t.nan && t.sawIdleAfter;
  console.log(k, 'GATE (entry, grip<=0.50, draped, invertedAir>=3, fluid<=0.32, flight):', gate ? 'PASS' : 'FAIL');
}
console.log('NOTE: hp 86 is the PROPOSED damage-14 value modelled in the harness; tryHit is unwired this cycle by design (style binding open, awaits Kev verdict). Reach 0.70 is the proposed entry value, likewise not yet engine-enforced.');
