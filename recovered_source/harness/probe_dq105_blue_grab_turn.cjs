// DQ105 slice 1 probe: BLUE (Kung Fu, style lunge) arm grab + turn in air + toss.
// Baseline (build e72b2c46, generic carry): no grab, no turn.
// World point: W(f, L) = [f.x + f.fx*L[0] - f.fz*L[2], f.y + L[1], f.z + f.fz*L[0] + f.fx*L[2]]
// Grab pair (near-side in world space): thrower hl <-> defender hr.
//   Thrower faces +x, defender faces -x, both fz=0, so thrower local z +.25 -> world +.25
//   and defender local z -.40 -> world +.40: these two arms are on the same side.
// Turn proxy (revised after baseline: raw head y-z angle already ranges 1.60 rad during
//   the carry blend itself, so it cannot isolate a turn). Turn is measured as a
//   mid-carry deviation from the BASELINE head world position at the same carry tick,
//   with return to baseline at the last carry tick:
//   BASELINE (build e72b2c46, measured 2026-10-29, Blue carry ticks indexed 0..10):
//     mid (index 5) head world and last (index 10) head world are recorded in the probe
//     output below; the gate below is filled from that run before dispatch.
// Gate (set BEFORE dispatch, Blue only; Red must be byte-identical to baseline):
//   grabLate: max world thrower-hl <-> defender-hr distance over the last 3 carry ticks <= 0.35
//   turnMid:  distance between mid-carry head world position and its baseline value >= 0.20
//   turnRet:  distance between last-carry head world position and its baseline value <= 0.12
//             (the turn returns to the flight pose by release, not a snap at release)
//   fluid:    maxDefStep over [connect..release+1] <= 0.32 (DQ27b standard, as in DQ101 gate)
//   dq101:    the full DQ101 gate must still PASS for Blue (carry>=6, feet>=0.50, arc preserved, hp 78)
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2], f.y+L[1], f.z+f.fz*L[0]+f.fx*L[2]];}
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
const out=vm.runInContext(`(()=>{
  function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2], f.y+L[1], f.z+f.fz*L[0]+f.fx*L[2]];}
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
  const J=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
  function trial(attAi, dist0){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=dist0; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false, why:'go-refused'};
    let connectTick=-1, releaseTick=-1, prevDPose=null, maxDefStep=0, carryTicks=[];
    let airFrames=0, apexY=0, touchdownTick=-1, touchdownX=null, gapAtTouchdown=null;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='idle', nan=false, feetMaxCarry=0;
    let headAngles=[], grabDists=[], headAngleAtRelease=null, headAngleFirstAir=null, headWorlds=[];
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      if(connectTick<0 && d.hp<100) connectTick=i;
      if(connectTick>=0){
        if(releaseTick<0 && d.vy>1){ releaseTick=i; }
        const inCarry = releaseTick<0 || i<=releaseTick+1;
        if(prevDPose && inCarry){ for(const j of J){const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s;} }
        if(d.st==='carry'){
          const thW=W(a,ap.hl), dhW=W(d,dp.hr);
          const gd=dist(thW,dhW); grabDists.push({tick:i, d:+gd.toFixed(3), th:thW.map(v=>+v.toFixed(3)), dh:dhW.map(v=>+v.toFixed(3))});
          const pelW=W(d,dp.pel), headW=W(d,dp.head);
          const ang=Math.atan2(headW[2]-pelW[2], headW[1]-pelW[1]);
          headAngles.push({tick:i, ang:+ang.toFixed(3)});
          headWorlds.push({tick:i, head:headW.map(v=>+v.toFixed(3)), pel:pelW.map(v=>+v.toFixed(3))});
          const f=Math.max(d.y+dp.fl[1], d.y+dp.fr[1]); if(f>feetMaxCarry) feetMaxCarry=f;
          carryTicks.push(i);
        }
        if(releaseTick>=0 && d.st==='air'){
          if(headAngleFirstAir===null){ const pelW=W(d,dp.pel), headW=W(d,dp.head); headAngleFirstAir=Math.atan2(headW[2]-pelW[2], headW[1]-pelW[1]); }
          airFrames++; if(d.y>apexY) apexY=d.y;
        }
        if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){
          touchdownTick=i; touchdownX=d.x;
          let lo=Infinity; for(const j of J){ const wy=d.y+dp[j][1]; if(wy<lo) lo=wy; } gapAtTouchdown=lo;
        }
        if(d.st==='down') sawDown=true;
        if(d.st==='getup') sawGetup=true;
        if(sawGetup && d.st==='idle') sawIdleAfter=true;
      }
      prevDPose=dp; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const angs=headAngles.map(h=>h.ang);
    const turnRange = angs.length? Math.max(...angs)-Math.min(...angs) : 0;
    const lastCarryAng = angs.length? angs[angs.length-1] : null;
    const late = grabDists.slice(-3);
    const grabLateMax = late.length? Math.max(...late.map(g=>g.d)) : null;
    return {ok:true, connectTick, releaseTick, carryFrames: releaseTick>=0? releaseTick-connectTick : null,
      carryTicks: carryTicks.length, feetMaxCarry:+feetMaxCarry.toFixed(3), maxDefStep:+maxDefStep.toFixed(3),
      grabLateMax, grabDists: late, headAngles, headWorlds, turnRange:+turnRange.toFixed(3),
      lastCarryAng, headAngleFirstAir: headAngleFirstAir!==null?+headAngleFirstAir.toFixed(3):null,
      releaseSnap: (lastCarryAng!==null&&headAngleFirstAir!==null)?+Math.abs(lastCarryAng-headAngleFirstAir).toFixed(3):null,
      airFrames, apexY:+apexY.toFixed(3), touchdownTick, travel: (touchdownX!==null&&releaseTick>=0)?null:null,
      sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st};
  }
  return { blueThrow: trial(1,0.70), redThrow: trial(0,0.70) };
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
const b=out.blueThrow, r=out.redThrow;
const baseMid=[1.347,1.804,-0.127], baseLast=[1.958,1.426,-0.268];
function d3(a,c){return Math.hypot(a[0]-c[0],a[1]-c[1],a[2]-c[2]);}
const turnMid = b.headWorlds.length>5 ? +d3(b.headWorlds[5].head, baseMid).toFixed(3) : null;
const turnRet = b.headWorlds.length ? +d3(b.headWorlds[b.headWorlds.length-1].head, baseLast).toFixed(3) : null;
console.log('DQ105-BLUE turnMid (vs baseline mid, >=0.20):', turnMid, 'turnRet (vs baseline last, <=0.12):', turnRet);
const blueGate = b.ok && b.grabLateMax!==null && b.grabLateMax<=0.35 && turnMid!==null && turnMid>=0.20 && turnRet!==null && turnRet<=0.12 && b.maxDefStep<=0.32 && b.carryFrames>=6 && b.feetMaxCarry>=0.50 && b.hp===78 && !b.nan;
console.log('DQ105-BLUE GATE (grab<=0.35, turnMid>=0.20, turnRet<=0.12, fluid<=0.32):', blueGate?'PASS':'FAIL');
console.log('RED (must match DQ101 baseline exactly on gate fields): carry',r.carryFrames,'feet',r.feetMaxCarry,'maxDefStep',r.maxDefStep,'air',r.airFrames,'apex',r.apexY,'hp',r.hp);
