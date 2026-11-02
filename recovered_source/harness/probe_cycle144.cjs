// Cycle 144 probe (facing flip during positioning) (Muse, 2026-10-30): ippon instant-flip at carry->air transition.
// Harness-forced ippon: attacker throw attack, victim forced into ippon carry.
// Metrics, both styles (Blue attacker = lunge, Red attacker = back):
//  lastCarryAngle: victim head-pelvis world angle at last carry tick (upright ~+1.5)
//  firstAirAngle: same angle at first air tick
//  carryAirDelta: absolute change lastCarry -> firstAir (snap if large, e.g. >0.5 rad)
//  firstAirInverted: head world y < pelvis world y - 0.10 at first air tick
//  airInvertedTicks: count of air ticks inverted (gate 0)
//  carryInvertedTicks: count of carry ticks inverted (gate 0)
//  maxAirAngleStep: largest single-tick angle change during air (continuity)
//  facingFlip: sign of (headWorldX - pelWorldX) at carry start vs at release
//    (Kev directive: victim flips facing left->right DURING positioning, before toss)
//  landingFront: touchdown pelvis x minus thrower pelvis x (must stay >0, forward)
// Usage: node probe_cycle143.cjs <build.html>
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
    let releaseTick=-1, touchdownTick=-1, lastCarryAngle=null, firstAirAngle=null, firstAirInv=null, lastCarryHeadY=null, firstAirHeadY=null, lastCarryPelY=null, firstAirPelY=null;
    let carryInvertedTicks=0, airInvertedTicks=0, airAngles=[], carryAngles=[];
    let firstCarryFacing=null, lastCarryFacing=null, tdPelX=null, tdThPelX=null, sawIdleAfter=false, sawDown=false, sawGetup=false, prevSt='carry', nan=false;
    let carrySignChanges=0, prevFacing=null, maxCarryHeadStep=0, prevHeadW=null, firstFootLiftTick=-1, carryTickCount=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      const vicPelW=W(d,dp.pel), vicHeadW=W(d,dp.head);
      const ang=Math.atan2(vicHeadW[1]-vicPelW[1], vicHeadW[0]-vicPelW[0]);
      const facing=Math.sign(vicHeadW[0]-vicPelW[0])||1;
      if(d.st==='carry'){
        carryAngles.push(ang); lastCarryAngle=ang; lastCarryFacing=facing; lastCarryHeadY=vicHeadW[1]; lastCarryPelY=vicPelW[1];
        if(firstCarryFacing===null) firstCarryFacing=facing;
        if(prevFacing!==null && facing!==prevFacing) carrySignChanges++;
        prevFacing=facing;
        if(prevHeadW!==null) maxCarryHeadStep=Math.max(maxCarryHeadStep, Math.hypot(vicHeadW[0]-prevHeadW[0], vicHeadW[1]-prevHeadW[1], vicHeadW[2]-prevHeadW[2]));
        prevHeadW=vicHeadW;
        const flW=W(d,dp.fl), frW=W(d,dp.fr);
        if(firstFootLiftTick<0 && (flW[1]>0.05 || frW[1]>0.05)) firstFootLiftTick=carryTickCount;
        carryTickCount++;
        if(vicHeadW[1] < vicPelW[1]-0.10) carryInvertedTicks++;
      }
      if(releaseTick<0 && d.st==='air'){ releaseTick=i; }
      if(d.st==='air'){
        airAngles.push(ang);
        if(firstAirAngle===null){ firstAirAngle=ang; firstAirInv=(vicHeadW[1] < vicPelW[1]-0.10); firstAirHeadY=vicHeadW[1]; firstAirPelY=vicPelW[1]; }
        if(vicHeadW[1] < vicPelW[1]-0.10) airInvertedTicks++;
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0){ touchdownTick=i; tdPelX=W(d,dp.pel)[0]; tdThPelX=W(a,ap.pel)[0]; }
      if(d.st==='down') sawDown=true;
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevSt=d.st;
      if(sawIdleAfter) break;
    }
    let norm=(x)=>{ while(x>Math.PI) x-=2*Math.PI; while(x<-Math.PI) x+=2*Math.PI; return x; };
    let maxStep=0; for(let k=1;k<airAngles.length;k++) maxStep=Math.max(maxStep, Math.abs(norm(airAngles[k]-airAngles[k-1])));
    return {ok:true, releaseTick, touchdownTick, carryTicks:carryAngles.length, airTicks:airAngles.length,
      lastCarryAngle:lastCarryAngle!==null?+lastCarryAngle.toFixed(3):null,
      firstAirAngle:firstAirAngle!==null?+firstAirAngle.toFixed(3):null,
      carryAirDelta:(lastCarryAngle!==null&&firstAirAngle!==null)?+Math.abs(norm(firstAirAngle-lastCarryAngle)).toFixed(3):null,
      firstAirInverted:firstAirInv,
      lastCarryHeadY:lastCarryHeadY!==null?+lastCarryHeadY.toFixed(3):null,
      firstAirHeadY:firstAirHeadY!==null?+firstAirHeadY.toFixed(3):null,
      headYSnap:(lastCarryHeadY!==null&&firstAirHeadY!==null)?+(firstAirHeadY-lastCarryHeadY).toFixed(3):null,
      carryInvertedTicks, airInvertedTicks, maxAirAngleStep:+maxStep.toFixed(3),
      firstCarryFacing, lastCarryFacing, facingFlippedBeforeRelease:firstCarryFacing!==null&&lastCarryFacing!==null?(firstCarryFacing!==lastCarryFacing):null,
      carrySignChanges, maxCarryHeadStep:+maxCarryHeadStep.toFixed(3), firstFootLiftTick, carryTickCount,
      landingFront:(tdPelX!==null&&tdThPelX!==null)?+(tdPelX-tdThPelX).toFixed(3):null,
      hp:d.hp, nan, sawIdleAfter};
  }
  const blue=trial(1), red=trial(0);
  // firstAirInverted recomputed from angle is not sufficient; expose via air inverted count at tick0 separately in summary:
  return {blue, red};
})()`, sandbox);
// Print raw so the integrator can read first-air angle directly (upright ~+1.5, inverted ~negative).
console.log(JSON.stringify(out, null, 1));
