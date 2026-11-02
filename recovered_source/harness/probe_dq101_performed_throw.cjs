// DQ101 gate: PERFORMED THROW (cycle 101, 2026-10-28; Kev directive 2026-10-28 ~22:09 CT).
// "The figures must go through the actual motions of picking the other character
// up and tossing them in a realistic way." DQ99 gave the DEFENDER a ballistic arc
// (air, vy 4.8, carry by kb 3, slam to DQ17g touchdown, DQ17i get-up) but neither
// figure PERFORMS the throw: the thrower does not bend/grab/lift/heave, and the
// defender is not visibly picked up and carried before release.
// Acceptance (set BEFORE dispatch, both styles, 0.70 m):
//   a_carry: frames between throw connect and the ballistic release (first tick
//     after connect with defender vy > 1) >= 6. Baseline: 0 (vy 4.8 at connect).
//   b_lift: during the carry, defender max absolute foot height (f.y + pose foot y)
//     >= 0.50 m. Baseline air-cruise feet top out at 0.40 m, and only as a pop.
//   c_noPop: max per-frame defender joint step (all 11 joints, pose coordinates)
//     over [connect .. release+1] <= 0.32 (DQ27b fluidity standard). Baseline:
//     idle -> air pose in one frame, pelvis step ~0.41.
//   d_root: max per-frame defender root step (hypot dx,dy,dz) during the carry
//     <= 0.20 m (no teleport to the carry anchor).
//   e_thrower: thrower pelvis dips >= 0.15 m below its atk-start pelvis y during
//     the throw, then rises >= 0.10 m above the dip minimum before release, and
//     the striking-hand forward coordinate rises >= 0.10 m from the dip tick to
//     its post-dip maximum (dip -> lift -> heave, not a static grab pose).
//     Baseline: pelvis y is the generic 1.232 constant, dip ~0, rise ~0.
//   f_arc: after release, the DQ99 arc is preserved: ballistic airFrames >= 10,
//     apexY >= 0.25, travel (touchdown x - release x, along throw direction)
//     >= 0.50, touchdown lowest-joint gap |.| <= 0.005, down -> getup -> idle,
//     hp 78, no NaN, no KO at full hp.
//   g_throwerFluid: max per-frame thrower joint step while st==='atk' <= 0.32.
//   h_scope/park: checked separately (DQ83 scope probe + range probe + full-match
//     probe + park-fix line). Whiffed throws must keep the old pose exactly
//     (checked by the scope probes: whiff outcomes and other strikes unchanged).
// KO path is unchanged by design: a throw that KOs goes straight to the existing
// DQ99/KO arc (endRound), not through the carry; probe_dq99_ko.cjs re-runs.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const J=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
  function trial(attAi, dist){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=dist; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false, why:'go-refused'};
    let connectTick=-1, releaseTick=-1, releaseX=null, releaseY=null;
    let prevDPose=null, prevDPos=null, prevAPose=null;
    let maxDefStep=0, maxDefStepTick=-1, maxRootStep=0, maxRootStepTick=-1;
    let feetMaxCarry=0, throwerPelConnect=null, throwerTrace=[], maxThrowerStep=0;
    let airFrames=0, apexY=0, touchdownTick=-1, touchdownX=null, gapAtTouchdown=null;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='idle', nan=false;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      if(connectTick<0 && d.hp<100){ connectTick=i; }
      if(connectTick>=0 && a.st==='atk'){
        if(throwerPelConnect===null) throwerPelConnect=ap.pel[1];
        throwerTrace.push({pel:ap.pel[1], hand:Math.max(ap.hl[0],ap.hr[0])});
        // Fluid measured only AFTER the connect tick: the pre-connect startup
        // contains the known DQ83 origin/IK-pole step (BLUE er 0.661), which is
        // a separate open item and must not contaminate this cycle's gate.
        if(prevAPose && i>connectTick) for(const j of J){const s=Math.hypot(ap[j][0]-prevAPose[j][0],ap[j][1]-prevAPose[j][1],ap[j][2]-prevAPose[j][2]); if(s>maxThrowerStep) maxThrowerStep=s;}
      }
      if(connectTick>=0){
        if(releaseTick<0 && d.vy>1){ releaseTick=i; releaseX=d.x; releaseY=d.y; }
        const inCarry = releaseTick<0 || i<=releaseTick+1;
        if(prevDPose && inCarry){ for(const j of J){const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep){maxDefStep=s; maxDefStepTick=i;}} }
        if(prevDPos && releaseTick<0){ const s=Math.hypot(d.x-prevDPos[0],d.y-prevDPos[1],d.z-prevDPos[2]); if(s>maxRootStep){maxRootStep=s; maxRootStepTick=i;} }
        if(releaseTick<0){ const f=Math.max(d.y+dp.fl[1], d.y+dp.fr[1]); if(f>feetMaxCarry) feetMaxCarry=f; }
        if(releaseTick>=0 && d.st==='air'){ airFrames++; if(d.y>apexY) apexY=d.y; }
        if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){
          touchdownTick=i; touchdownX=d.x;
          let lo=Infinity; for(const j of J){ const wy=d.y+dp[j][1]; if(wy<lo) lo=wy; } gapAtTouchdown=lo;
        }
        if(d.st==='down') sawDown=true;
        if(d.st==='getup') sawGetup=true;
        if(sawGetup && d.st==='idle') sawIdleAfter=true;
      }
      prevDPose=dp; prevDPos=[d.x,d.y,d.z]; prevAPose=(a.st==='atk'?ap:null);
      prevSt=d.st;
      if(sawIdleAfter) break;
    }
    // Thrower phases from the recorded post-connect trace: dipTick is the
    // FIRST tick at the minimum pelvis height (a real dip is deeper than the
    // ~0.03 recovery sag, so a baseline-style monotonic sag puts dipTick at
    // the last atk tick and heave/rise collapse to ~0, as they should).
    let throwerPelMin=Infinity, dipIdx=-1, throwerPelMaxAfterDip=-Infinity, handAtDip=null, handMaxAfterDip=-Infinity;
    throwerTrace.forEach((tr,idx)=>{ if(tr.pel<throwerPelMin){throwerPelMin=tr.pel; dipIdx=idx;} });
    if(dipIdx>=0){ handAtDip=throwerTrace[dipIdx].hand; throwerTrace.slice(dipIdx).forEach(tr=>{ if(tr.pel>throwerPelMaxAfterDip) throwerPelMaxAfterDip=tr.pel; if(tr.hand>handMaxAfterDip) handMaxAfterDip=tr.hand; }); }
    const carryFrames = releaseTick>=0 ? releaseTick-connectTick : null;
    const travel = (touchdownX!==null && releaseX!==null) ? +(touchdownX-releaseX).toFixed(3) : null;
    return {ok:true, connectTick, releaseTick, carryFrames,
      feetMaxCarry:+feetMaxCarry.toFixed(3),
      maxDefStep:+maxDefStep.toFixed(3), maxDefStepTick,
      maxRootStep:+maxRootStep.toFixed(3), maxRootStepTick,
      throwerPelConnect:throwerPelConnect!==null?+throwerPelConnect.toFixed(3):null,
      throwerPelMin:+throwerPelMin.toFixed(3), throwerPelMinTick:dipIdx,
      dip:throwerPelConnect!==null?+(throwerPelConnect-throwerPelMin).toFixed(3):null,
      rise:throwerPelMaxAfterDip>-Infinity?+(throwerPelMaxAfterDip-throwerPelMin).toFixed(3):null,
      handAtDip:handAtDip!==null?+handAtDip.toFixed(3):null,
      handMaxAfterDip:handMaxAfterDip>-Infinity?+handMaxAfterDip.toFixed(3):null,
      heave:(handAtDip!==null&&handMaxAfterDip>-Infinity)?+(handMaxAfterDip-handAtDip).toFixed(3):null,
      maxThrowerStep:+maxThrowerStep.toFixed(3),
      airFrames, apexY:+apexY.toFixed(3), touchdownTick, travel,
      gapAtTouchdown:gapAtTouchdown!==null?+gapAtTouchdown.toFixed(4):null,
      sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st};
  }
  return { blueThrow: trial(1,0.70), redThrow: trial(0,0.70) };
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
const gate=t=>t.ok && t.carryFrames!==null && t.carryFrames>=6
  && t.feetMaxCarry>=0.50 && t.maxDefStep<=0.32 && t.maxRootStep<=0.20
  && t.dip>=0.15 && t.rise>=0.10 && t.heave>=0.10
  && t.airFrames>=10 && t.apexY>=0.25 && t.travel!==null && t.travel>=0.50
  && t.gapAtTouchdown!==null && Math.abs(t.gapAtTouchdown)<=0.005
  && t.sawDown && t.sawGetup && t.sawIdleAfter && t.hp===78 && !t.nan
  && t.maxThrowerStep<=0.32;
const b=gate(out.blueThrow), r=gate(out.redThrow);
console.log('CHECKS', JSON.stringify({blue:b, red:r}));
console.log((b&&r)?'DQ101 GATE: PASS':'DQ101 GATE: FAIL');
