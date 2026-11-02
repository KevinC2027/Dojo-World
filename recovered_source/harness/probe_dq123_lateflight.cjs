// DQ123 LATE-FLIGHT ROTATION UNWIND probe (set BEFORE dispatch, 2026-10-29 21:00 cycle).
// Queue head: DQ122 disclosed open item + Kev 12-minute auto-decide rule (DQ122 released
// 2026-10-29 ~20:27 CT, no Kev verdict recorded by 21:00; Muse decides DQ122 ACCEPTED on its
// passing measurements, revertible on Kev's word, and dispatches this next item).
// Baseline diagnosis (current build eb7a95bf, harness-forced ippon, both styles identical):
// air rotation cum rises steadily to 1.633 at airIdx 17, then REVERSES: 1.621, 1.380,
// 0.411, -0.296 over the last 4 air ticks — a -1.929 unwind driven by the DQ17 touchdown
// blend (air pose A, rotated -1.9 rad by the ippon air rule, mixes toward the UNROTATED
// touchdown pose L over the last 0.6 m of descent). That reversal, not a stall, is what
// reads as a mid-air spin/snap just before landing.
// Gates (both styles):
//  unwind = cumLast - cumMax >= -0.15 (was -1.929)
//  cumLast >= 1.50 (rotation preserved to landing; was -0.296)
//  maxAbsAngleStepLast5 <= 0.35 rad (was 0.969 — the single-tick snap)
//  rotLate = cum[19]-cum[14] >= 0.15 (DQ120 gate; was 0.051)
//  downMaxStep <= 0.32 (no new snap in the down settle)
//  downEndPose within 0.02 of the baseline rest pose (final rest must stay Dippon-exact)
// Preserved (separate probes): DQ122 gate, range probe, full-match probe, park-fix line.
// Usage: node probe_dq123_lateflight.cjs <build.html>
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
  const J=['pel','neck','head','hl','hr','fl','fr'];
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
    let releaseTick=-1, touchdownTick=-1, prevSt='carry', nan=false, sawIdleAfter=false, sawGetup=false;
    let airAngles=[], prevDPose=null, downMaxStep=0, downEndPose=null, downTicks=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d);
      if(releaseTick<0 && d.st==='air' && d.vy>1) releaseTick=i;
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel), headW=W(d,dp.head);
        airAngles.push({tick:i, ang:+Math.atan2(headW[1]-pelW[1], headW[0]-pelW[0]).toFixed(3)});
      }
      if(d.st==='down'){
        downTicks++;
        if(prevDPose){ for(const j of J){ const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>downMaxStep) downMaxStep=s; } }
      }
      if(prevSt==='down' && d.st==='getup' && !downEndPose){
        downEndPose={pel:dp.pel.map(v=>+v.toFixed(3)), neck:dp.neck.map(v=>+v.toFixed(3)), head:dp.head.map(v=>+v.toFixed(3)), hl:dp.hl.map(v=>+v.toFixed(3)), hr:dp.hr.map(v=>+v.toFixed(3)), fl:dp.fl.map(v=>+v.toFixed(3)), fr:dp.fr.map(v=>+v.toFixed(3))};
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0) touchdownTick=i;
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevDPose=dp; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    let norm=(x)=>{ while(x>Math.PI) x-=2*Math.PI; while(x<-Math.PI) x+=2*Math.PI; return x; };
    let cum=[0]; for(let k=1;k<airAngles.length;k++) cum.push(cum[k-1]+norm(airAngles[k].ang-airAngles[k-1].ang));
    const cumMax=Math.max(...cum), cumLast=cum[cum.length-1];
    const unwind=+(cumLast-cumMax).toFixed(3);
    let maxAbsAngleStepLast5=0;
    for(let k=Math.max(1,cum.length-5);k<cum.length;k++){ const s=Math.abs(cum[k]-cum[k-1]); if(s>maxAbsAngleStepLast5) maxAbsAngleStepLast5=s; }
    const rotLate=cum.length>=20?+(cum[19]-cum[14]).toFixed(3):null;
    const flightRot15=cum.length>=15?+cum[14].toFixed(3):null;
    return {ok:true, releaseTick, touchdownTick, airFrames:airAngles.length,
      cumMax:+cumMax.toFixed(3), cumLast:+cumLast.toFixed(3), unwind,
      maxAbsAngleStepLast5:+maxAbsAngleStepLast5.toFixed(3), rotLate, flightRot15,
      downTicks, downMaxStep:+downMaxStep.toFixed(3), downEndPose, hp:d.hp, nan, sawIdleAfter};
  }
  return { dq123Blue: trial(1), dq123Red: trial(0) };
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
for (const k of Object.keys(out)) {
  const t = out[k];
  const gate = t.ok && t.unwind>=-0.15 && t.cumLast>=1.50 && t.maxAbsAngleStepLast5<=0.35 && t.rotLate!==null && t.rotLate>=0.15 && t.downMaxStep<=0.32 && t.hp===100 && !t.nan && t.sawIdleAfter;
  console.log(k, 'DQ123 GATE (unwind>=-0.15, cumLast>=1.50, last5step<=0.35, rotLate>=0.15, downStep<=0.32, hp100, idleAfter):', gate ? 'PASS' : 'FAIL');
}
