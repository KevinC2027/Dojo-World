// DQ138 POSITION-TO-THROW probe (set BEFORE dispatch, 2026-10-30 12:00 cycle).
// Kev 2026-10-30 ~09:20 verdict on DQ135: "Yes that's better. Now instead of the
// thrower's arms going behind him, he should do a 360 while holding the
// opponent's arm to position himself in front of the opponent's body."
// Design (thrower atk pose only, ippon, hit, harness-forced): spin window
// attacker t in [6,23] (ends at the victim release boundary); spin angle
// theta = 2*pi*ssu((t-6)/17); rotS/rotH = sin(theta) (full period: +peak,
// 0, -peak, 0); thrower feet scissor +/-0.30*sin(theta) with a small lift
// (1-cos(theta))/2*0.08 mid-spin, back to 0 at the end; free hand swings
// with the spin; gripping hand (hr, trap arm) carries NO spin offset, so it
// stays pinned to the victim's arm. Victim carry/launch untouched.
// Metrics (both styles): thrower rotS/rotH per attacker t through the window;
// spin peaks (max/min rotS in window, rotS at window start/end); thrower
// foot x-swing range in window; holding-hand distance = min(dist(thrower hr,
// victim hr), dist(thrower hl, victim hr)) per tick, max over the window;
// thrower pelvis forward at spin end vs baseline; preserved DQ135/DQ126/
// DQ134 gates (feet grounded, release, toss, grip late/load, arm lead,
// trap, firstInverted, hp, idle, NaN).
// Usage: node probe_dq138_position.cjs <build.html>
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
    let rows=[], spinRows=[], airRows=[], firstInvertedTick=-1, releaseTick=-1, relPelY=null, relPelX=null, apexPelY=-99, tdPelX=null, tdThPelX=null, touchdownTick=-1, sawIdleAfter=false, sawGetup=false, nan=false, prevSt='carry';
    let firstBothLiftTick=-1, firstAnyLiftTick=-1;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      const thHr=W(a,ap.hr), thHl=W(a,ap.hl), vicHr=W(d,dp.hr), vicPelW=W(d,dp.pel), vicHeadW=W(d,dp.head);
      const flW=W(d,dp.fl), frW=W(d,dp.fr), thPelW=W(a,ap.pel), thFlW=W(a,ap.fl), thFrW=W(a,ap.fr);
      if(d.st==='carry'){
        if(vicHeadW[1] < vicPelW[1]-0.10 && firstInvertedTick<0) firstInvertedTick=i;
        const minF=Math.min(flW[1],frW[1]), maxF=Math.max(flW[1],frW[1]);
        if(minF>0.10 && firstBothLiftTick<0) firstBothLiftTick=i;
        if(maxF>0.10 && firstAnyLiftTick<0) firstAnyLiftTick=i;
        rows.push({tick:i, vicT:d.t, rootY:+d.y.toFixed(3), flY:+flW[1].toFixed(3), frY:+frW[1].toFixed(3), minFootY:+minF.toFixed(3), maxFootY:+maxF.toFixed(3), headY:+vicHeadW[1].toFixed(3), pelY:+vicPelW[1].toFixed(3), grip:+dist(thHl,vicHr).toFixed(3), thPelX:+thPelW[0].toFixed(3), thPelY:+thPelW[1].toFixed(3), attSt:a.st, attT:a.t, vicX:+d.x.toFixed(3)});
      }
      if(a.st==='atk' && a.t>=5 && a.t<=45){
        const holdD=Math.min(dist(thHr,vicHr), dist(thHl,vicHr));
        spinRows.push({attT:a.t, rotS:+((ap.rotS||0).toFixed(3)), rotH:+((ap.rotH||0).toFixed(3)), thFlX:+thFlW[0].toFixed(3), thFrX:+thFrW[0].toFixed(3), thFlY:+thFlW[1].toFixed(3), thFrY:+thFrW[1].toFixed(3), holdD:+holdD.toFixed(3), thHrD:+dist(thHr,vicHr).toFixed(3), thPelX:+thPelW[0].toFixed(3), thPelY:+thPelW[1].toFixed(3), thNeckX:+W(a,ap.neck)[0].toFixed(3), thNeckY:+W(a,ap.neck)[1].toFixed(3), thHeadX:+W(a,ap.head)[0].toFixed(3), thHeadY:+W(a,ap.head)[1].toFixed(3), hlFwd:+((thHl[0]-thPelW[0]).toFixed(3)), hrFwd:+((thHr[0]-thPelW[0]).toFixed(3)), hlX:+thHl[0].toFixed(3), hrX:+thHr[0].toFixed(3), vicX:+d.x.toFixed(3), vicHeadMinusPel:+((vicHeadW[1]-vicPelW[1]).toFixed(3)), vicSt:d.st});
      if(d.st==='air'){airRows.push({tick:i, headMinusPel:+((vicHeadW[1]-vicPelW[1]).toFixed(3))});}
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
    const spinMaxRotS=spinRows.length?+Math.max(...spinRows.map(r=>r.rotS)).toFixed(3):null;
    const spinMinRotS=spinRows.length?+Math.min(...spinRows.map(r=>r.rotS)).toFixed(3):null;
    const spinStart=spinRows.find(r=>r.attT===6);
    const spinEnd=spinRows.find(r=>r.attT===23);
    const spinMaxHold=spinRows.length?+Math.max(...spinRows.map(r=>r.holdD)).toFixed(3):null;
    const spinHold12=spinRows.filter(r=>r.attT>=12&&r.attT<=23);
    const spinHoldMax12=spinHold12.length?+Math.max(...spinHold12.map(r=>r.holdD)).toFixed(3):null;
    const spinMaxHrD=spinRows.length?+Math.max(...spinRows.map(r=>r.thHrD)).toFixed(3):null;
    const armWin=(lo,hi)=>spinRows.filter(r=>r.attT>=lo&&r.attT<=hi);
    const armSum=(lo,hi)=>{const w=armWin(lo,hi); if(!w.length) return null; return {minHlFwd:+Math.min(...w.map(r=>r.hlFwd)).toFixed(3), minHrFwd:+Math.min(...w.map(r=>r.hrFwd)).toFixed(3), minRotS:+Math.min(...w.map(r=>r.rotS)).toFixed(3), maxRotS:+Math.max(...w.map(r=>r.rotS)).toFixed(3), endHlFwd:w[w.length-1].hlFwd, endHrFwd:w[w.length-1].hrFwd, startHlFwd:w[0].hlFwd, startHrFwd:w[0].hrFwd};};
    const armSpin=armSum(6,23), armSpin2=armSum(14,23), armToss=armSum(24,41), armAll=armSum(6,41), armSet=armSum(20,23);
    const setRows=spinRows.filter(r=>r.attT>=20&&r.attT<=23);
    const setEnd=setRows[setRows.length-1];
    const torsoAtSet=setEnd?+(Math.hypot(setEnd.thNeckX-setEnd.thPelX,setEnd.thNeckY-setEnd.thPelY)+Math.hypot(setEnd.thHeadX-setEnd.thNeckX,setEnd.thHeadY-setEnd.thNeckY)).toFixed(3):null;
    let maxHipFoot=0; for(const r of spinRows){for(const hz of [0.12,-0.12]){const hx=r.thPelX, hy=r.thPelY; const d1=Math.hypot(r.thFlX-hx,r.thFlY-hy), d2=Math.hypot(r.thFrX-hx,r.thFrY-hy); maxHipFoot=Math.max(maxHipFoot,d1,d2);}}
    const vicPull=rows.length?+(rows[0].vicX-rows[rows.length-1].vicX).toFixed(3):null;
    const airMinHeadMinusPel=airRows.length?+Math.min(...airRows.map(r=>r.headMinusPel)).toFixed(3):null;
    const airInvertedTicks=airRows.filter(r=>r.headMinusPel<-0.10).length;
    const thFlRange=spinRows.length?+(Math.max(...spinRows.map(r=>r.thFlX))-Math.min(...spinRows.map(r=>r.thFlX))).toFixed(3):null;
    const thFrRange=spinRows.length?+(Math.max(...spinRows.map(r=>r.thFrX))-Math.min(...spinRows.map(r=>r.thFrX))).toFixed(3):null;
    const minFootThrough18=rows.filter(r=>r.tick<=18).length?+Math.min(...rows.filter(r=>r.tick<=18).map(r=>r.minFootY)).toFixed(3):null;
    return {ok:true, releaseTick, firstInvertedTick, carryTicks:rows.length,
      firstBothLiftTick, firstAnyLiftTick, minFootThrough18,
      gripLateMean, gripTick18:r18?r18.grip:null,
      tossLift:relPelY!==null?+(apexPelY-relPelY).toFixed(3):null,
      tossTravel:tdPelX!==null&&relPelX!==null?+(tdPelX-relPelX).toFixed(3):null,
      landingFront:tdPelX!==null&&tdThPelX!==null?+(tdPelX-tdThPelX).toFixed(3):null,
      hp:d.hp, nan, sawIdleAfter,
      spinMaxRotS, spinMinRotS,
      spinRotSStart:spinStart?spinStart.rotS:null, spinRotSEnd:spinEnd?spinEnd.rotS:null,
      spinRotHStart:spinStart?spinStart.rotH:null, spinRotHEnd:spinEnd?spinEnd.rotH:null,
      spinMaxHold, spinHoldMax12, spinMaxHrD, thFlRange, thFrRange,
      spinEndPelX:spinEnd?spinEnd.thPelX:null, armSpin, armSpin2, armToss, armAll, armSet, torsoAtSet, maxHipFoot:+maxHipFoot.toFixed(3), vicPull, airMinHeadMinusPel, airInvertedTicks, airTicks:airRows.length, spinEndPelY:spinEnd?spinEnd.thPelY:null,
      spinEndFlY:spinEnd?spinEnd.thFlY:null, spinEndFrY:spinEnd?spinEnd.thFrY:null,
      spinRowsSample:spinRows.filter(r=>[5,6,10,11,12,14,17,18,19,23,24].includes(r.attT))};
  }
  return {blue: trial(1), red: trial(0)};
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
