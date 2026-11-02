// DQ135 FEET-GROUNDED probe (set BEFORE dispatch, 2026-10-30 09:00 cycle).
// Kev 2026-10-30 ~08:31 verdict on DQ134: "The player being grabbed should never
// leave his feet. Not until the throwing player has positioned themselves into
// the throw position." Feet-grounded rule, ippon only, harness-forced.
// Metrics (both styles): per carry tick victim root y, foot world y (fl, fr),
// min/max foot y; firstFootLiftTick = first carry tick where BOTH feet world y
// > 0.10 m (both feet off the ground); footYAtTick rows sampled; thrower pelvis
// world x/y and atk t per tick (thrower-positioning context); preserved DQ134/
// DQ126 gates (gripLateMean, gripTick18, armLeadTick18, firstInverted, release,
// tossLift, tossTravel, landingFront, trapLateMax, hp, idle, NaN).
// Usage: node probe_dq135_feet.cjs <build.html>
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
  function trial(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false};
    const cf=pose(d);
    a.hit=1; a.throwMove='ippon'; d.st='carry'; d.t=0; d.throwStyle='ippon';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    let rows=[], firstInvertedTick=-1, releaseTick=-1, relPelY=null, relPelX=null, apexPelY=-99, tdPelX=null, tdThPelX=null, touchdownTick=-1, sawIdleAfter=false, sawGetup=false, nan=false, prevSt='carry';
    let firstBothLiftTick=-1, firstAnyLiftTick=-1;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      const thHl=W(a,ap.hl), vicHr=W(d,dp.hr), vicPelW=W(d,dp.pel), vicHeadW=W(d,dp.head);
      const flW=W(d,dp.fl), frW=W(d,dp.fr), thPelW=W(a,ap.pel);
      if(d.st==='carry'){
        if(vicHeadW[1] < vicPelW[1]-0.10 && firstInvertedTick<0) firstInvertedTick=i;
        const minF=Math.min(flW[1],frW[1]), maxF=Math.max(flW[1],frW[1]);
        if(minF>0.10 && firstBothLiftTick<0) firstBothLiftTick=i;
        if(maxF>0.10 && firstAnyLiftTick<0) firstAnyLiftTick=i;
        rows.push({tick:i, vicT:d.t, rootY:+d.y.toFixed(3), flY:+flW[1].toFixed(3), frY:+frW[1].toFixed(3), minFootY:+minF.toFixed(3), maxFootY:+maxF.toFixed(3), headY:+vicHeadW[1].toFixed(3), pelY:+vicPelW[1].toFixed(3), grip:+dist(thHl,vicHr).toFixed(3), thPelX:+thPelW[0].toFixed(3), thPelY:+thPelW[1].toFixed(3), attSt:a.st, attT:a.t, vicX:+d.x.toFixed(3)});
      }
      if(releaseTick<0 && d.st==='air' && d.vy>1){ releaseTick=i; }
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel); if(relPelY===null){relPelY=pelW[1]; relPelX=pelW[0];}
        if(pelW[1]>apexPelY) apexPelY=pelW[1];
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; tdPelX=W(d,dp.pel)[0]; tdThPelX=W(a,ap.pel)[0]; }
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const late=rows.slice(-3);
    const gripLateMean=late.length?+(late.reduce((s,r)=>s+r.grip,0)/late.length).toFixed(3):null;
    const r18=rows.find(r=>r.tick===18);
    const last=rows[rows.length-1];
    const hrShare=null;
    const trapLateMax=null;
    return {ok:true, releaseTick, firstInvertedTick, carryTicks:rows.length,
      firstBothLiftTick, firstAnyLiftTick,
      minFootYOverCarry:rows.length?+Math.min(...rows.map(r=>r.minFootY)).toFixed(3):null,
      maxMinFootY:rows.length?+Math.max(...rows.map(r=>r.minFootY)).toFixed(3):null,
      minFootYAtLastCarry:last?last.minFootY:null, maxFootYAtLastCarry:last?last.maxFootY:null,
      rootYAtLastCarry:last?last.rootY:null,
      gripLateMean, gripTick18:r18?r18.grip:null,
      tossLift:relPelY!==null?+(apexPelY-relPelY).toFixed(3):null,
      tossTravel:tdPelX!==null&&relPelX!==null?+(tdPelX-relPelX).toFixed(3):null,
      landingFront:tdPelX!==null&&tdThPelX!==null?+(tdPelX-tdThPelX).toFixed(3):null,
      hp:d.hp, nan, sawIdleAfter,
      rowsSample:rows.filter(r=>[0,3,6,9,12,15,18,21,22].includes(r.tick))};
  }
  return {blue: trial(1), red: trial(0)};
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
