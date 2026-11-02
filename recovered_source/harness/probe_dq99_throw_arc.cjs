// DQ99 gate: THROW TOSS ARC (cycle 99, 2026-10-28; queued by Kev 2026-10-28 ~20:11 CT).
// "Make the throw read as a real toss — lift, carry, arc, slam."
// Current behavior (baseline): M.T connect places the defender 0.8 m in front
// of the thrower with kb 3 and sends it straight to 'down' (DQ17f mid-class
// back-down landing, no roll-through), gy=-.08, kp=22. No airborne phase.
// Acceptance (set BEFORE dispatch):
//   a_airborne: defender enters 'air' after throw connect, airFrames >= 10,
//     apexY (max f.y during the first air phase) >= 0.25 m.
//   b_travel: touchdown x minus connect-placement x, along throw direction,
//     >= 0.50 m.
//   c_touchdown: at the first 'down' tick after the air phase, the lowest
//     rendered joint world-y (f.y + pose joint y, all 11 joints) has
//     |gap| <= 0.005 (DQ17g ground-contact sync).
//   d_landing: sequence reaches down -> getup -> idle; hp 78 at connect
//     (dmg 22 preserved); no NaN; no KO at full hp.
//   e_scope: all other strikes byte-identical (checked separately with the
//     DQ83 scope probe + range probe on the working copy).
//   f_park: park-fix line present (checked separately).
// Roll-through (rm>=3) and the DQ17e rebound hop are RECORDED, not gated:
// they are existing DQ17e/f machinery shared with launchers.
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
    let connectTick=-1, placeX=null, airFrames=0, apexY=0, firstAirTick=-1;
    let touchdownTick=-1, touchdownX=null, gapAtTouchdown=null, rmAtTouchdown=null;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='idle';
    let nan=false, maxDownT=0;
    for(let i=0;i<300;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)) nan=true;
      if(connectTick<0 && d.hp<100){ connectTick=i; placeX=d.x; }
      if(connectTick>=0){
        if(d.st==='air'){
          if(firstAirTick<0) firstAirTick=i;
          airFrames++; if(d.y>apexY) apexY=d.y;
        }
        if(prevSt==='air' && d.st==='down' && touchdownTick<0){
          touchdownTick=i; touchdownX=d.x; rmAtTouchdown=d.rm;
          const p=pose(d); let lo=Infinity;
          for(const j of J){ const wy=d.y+p[j][1]; if(wy<lo) lo=wy; }
          gapAtTouchdown=lo;
        }
        if(d.st==='down'){ sawDown=true; if(d.t>maxDownT) maxDownT=d.t; }
        if(d.st==='getup') sawGetup=true;
        if(sawGetup && d.st==='idle') sawIdleAfter=true;
      }
      prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const travel=(touchdownX!==null&&placeX!==null)?+(touchdownX-placeX).toFixed(3):null;
    return {ok:true, connectTick, placeX:placeX!==null?+placeX.toFixed(3):null,
      firstAirTick, airFrames, apexY:+apexY.toFixed(3), touchdownTick,
      touchdownX:touchdownX!==null?+touchdownX.toFixed(3):null, travel,
      gapAtTouchdown:gapAtTouchdown!==null?+gapAtTouchdown.toFixed(4):null,
      rmAtTouchdown, sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan,
      endSt:d.st, downTicks:maxDownT};
  }
  return { blueThrow: trial(1,0.70), redThrow: trial(0,0.70) };
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
const gate=t=>t.ok && t.airFrames>=10 && t.apexY>=0.25 && t.travel!==null && t.travel>=0.50
  && t.gapAtTouchdown!==null && Math.abs(t.gapAtTouchdown)<=0.005
  && t.sawDown && t.sawGetup && t.sawIdleAfter && t.hp===78 && !t.nan;
const b=gate(out.blueThrow), r=gate(out.redThrow);
console.log('CHECKS', JSON.stringify({blue:b, red:r}));
console.log((b&&r)?'DQ99 GATE: PASS':'DQ99 GATE: FAIL');
