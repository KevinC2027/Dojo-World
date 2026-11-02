// DQ122 POSITIONING-BEAT probe (set BEFORE dispatch, 2026-10-29 20:00 cycle).
// Queue head: Kev 2026-10-29 ~19:36 verdict on DQ121: the throw "looks like he's
// spinning him around mid air instead of the physics of the player positioning
// himself in front of the other player playing out before the over the shoulder
// toss." + Kev 2026-10-29 ~18:43 sequence: pull arm -> body in front -> bend
// over -> toss forward over shoulder into the ground.
// Harness: same forced ippon setup as probe_dq120_fullthrow.cjs.
// Metrics (both styles):
//  releaseTick: loop tick defender leaves carry (baseline ~15).
//  firstInvertedTick: first carry tick where victim head world y < pelvis world
//    y - 0.10 (the overBack drape read). If this is early, the victim is already
//    draped during the pull/position beat instead of draping at the bend.
//  victimAngleAtCarry6: victim head-pelvis world angle at carry tick 6
//    (upright ~ +1.5 rad in this side view; inverted ~ negative).
//  throwerPelForwardPre: thrower pelvis world x at release minus at atk start.
//  footAtReleaseFrac: thrower foot travel achieved by release, as a share of
//    the full-atk foot travel (steps should COMPLETE before the toss, not after).
//  airRotShareAtApex / airRotLast5: rotation accumulated by apex tick as a
//    share of total at touchdown, and rotation over the last 5 air ticks
//    (spin read: rotation finished early then stalled = share near 1 + last5 ~0).
// Preserved (from dq120): trapLateMax<=0.55, frontGap>=0.60, flightRot15>=1.20,
// thrower step<=0.32, hp100, idle after getup, no NaN.
// Usage: node probe_dq126_upright_toss.cjs <build.html>
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
    let releaseTick=-1, touchdownTick=-1, firstInvertedTick=-1;
    let relPelY=null, relPelX=null, apexPelY=-99, tdPelX=null, tdThPelX=null, firstAirInvertedTick=-1, airPelYs=[];
    let carryRows=[], airAngles=[], attRows=[], prevAPose=null, maxThrowerStepPost=0;
    let sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='carry', nan=false;
    let trapLateMax=null, lastCarry=null, apexTick=-1, apexY=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      const thPelW=W(a,ap.pel), vicPelW=W(d,dp.pel), vicHeadW=W(d,dp.head);
      attRows.push({tick:i, attSt:a.st, attT:a.t, thPelWX:+thPelW[0].toFixed(3), thPelY:+ap.pel[1].toFixed(3), flXx:+ap.fl[0].toFixed(3), frXx:+ap.fr[0].toFixed(3)});
      if(d.st==='carry'){
        const ang=Math.atan2(vicHeadW[1]-vicPelW[1], vicHeadW[0]-vicPelW[0]);
        const inverted = vicHeadW[1] < vicPelW[1]-0.10;
        if(inverted && firstInvertedTick<0) firstInvertedTick=i;
        const thHl=W(a,ap.hl), thHr=W(a,ap.hr), dvHr=W(d,dp.hr), dvNeck=W(d,dp.neck);
        carryRows.push({tick:i, defT:d.t, angle:+ang.toFixed(3), inverted, headY:+vicHeadW[1].toFixed(3), pelY:+vicPelW[1].toFixed(3), sep:+Math.abs(vicPelW[0]-thPelW[0]).toFixed(3), trapArm:+dist(thHl,dvHr).toFixed(3), trapLap:+dist(thHr,dvNeck).toFixed(3)});
      }
      if(releaseTick<0 && d.st==='air' && d.vy>1){ releaseTick=i; }
      if(prevAPose && releaseTick>=0 && i>releaseTick){
        for(const j of J){ const s=Math.hypot(ap[j][0]-prevAPose[j][0],ap[j][1]-prevAPose[j][1],ap[j][2]-prevAPose[j][2]); if(s>maxThrowerStepPost) maxThrowerStepPost=s; }
      }
      if(releaseTick>=0 && d.st==='air'){
        const pelW=W(d,dp.pel), headW=W(d,dp.head);
        if(relPelY===null){relPelY=pelW[1]; relPelX=pelW[0];}
        airPelYs.push(pelW[1]); if(pelW[1]>apexPelY) apexPelY=pelW[1];
        if(headW[1]<pelW[1]-0.10 && firstAirInvertedTick<0) firstAirInvertedTick=i;
        airAngles.push({tick:i, ang:+Math.atan2(headW[1]-pelW[1], headW[0]-pelW[0]).toFixed(3), pelY:+pelW[1].toFixed(3)});
        if(d.y>apexY){ apexY=d.y; apexTick=i; }
      }
      if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; tdPelX=W(d,dp.pel)[0]; tdThPelX=W(a,ap.pel)[0]; }
      if(d.st==='down') sawDown=true;
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevAPose=ap; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    const late=carryRows.slice(-3);
    trapLateMax=late.length?Math.max(...late.map(r=>Math.max(r.trapArm,r.trapLap))):null;
    lastCarry=carryRows.length?carryRows[carryRows.length-1]:null;
    let norm=(x)=>{ while(x>Math.PI) x-=2*Math.PI; while(x<-Math.PI) x+=2*Math.PI; return x; };
    let cum=[0]; for(let k=1;k<airAngles.length;k++) cum.push(cum[k-1]+norm(airAngles[k].ang-airAngles[k-1].ang));
    const apexIdx=airAngles.findIndex(r=>r.tick===apexTick);
    const totalRot=cum.length?cum[cum.length-1]:null;
    const rotAtApex=apexIdx>=0?cum[apexIdx]:null;
    const rotLast5=cum.length>=5?cum[cum.length-1]-cum[cum.length-6]:null;
    const flightRot15=cum.length>=15?+cum[14].toFixed(3):null;
    const preRows=attRows.filter(r=>r.tick>=1 && r.tick<=releaseTick);
    const pelYRows=preRows.filter(r=>r.tick>=5);
    let minPelYRow=pelYRows.length?pelYRows.reduce((m,r)=>r.thPelY<m.thPelY?r:m,pelYRows[0]):null;
    const atkRows=attRows.filter(r=>r.attSt==='atk');
    const footPre=Math.max(Math.max(...preRows.map(r=>r.flXx))-Math.min(...preRows.map(r=>r.flXx)), Math.max(...preRows.map(r=>r.frXx))-Math.min(...preRows.map(r=>r.frXx)));
    const footAll=Math.max(Math.max(...atkRows.map(r=>r.flXx))-Math.min(...atkRows.map(r=>r.flXx)), Math.max(...atkRows.map(r=>r.frXx))-Math.min(...atkRows.map(r=>r.frXx)));
    const thPelStart=attRows[1]?attRows[1].thPelWX:null;
    const thPelRel=attRows.find(r=>r.tick===releaseTick);
    return {ok:true, releaseTick, touchdownTick, carryTicks:carryRows.length,
      firstInvertedTick, victimAngleAtCarry6:carryRows[6]?carryRows[6].angle:null,
      victimAngleAtCarry0:carryRows[0]?carryRows[0].angle:null,
      victimAngleAtLastCarry:lastCarry?lastCarry.angle:null,
      throwerPelForwardPre:thPelRel&&thPelStart!==null?+(thPelRel.thPelWX-thPelStart).toFixed(3):null,
      bendArgminTick:minPelYRow?minPelYRow.tick:null, bendMinPelY:minPelYRow?minPelYRow.thPelY:null,
      victimAngleAtCarry8:carryRows[8]?carryRows[8].angle:null,
      footTravelPre:+footPre.toFixed(3), footTravelAll:+footAll.toFixed(3),
      footAtReleaseFrac:footAll?+(footPre/footAll).toFixed(3):null,
      trapLateMax, airFrames:airAngles.length, apexTick,
      flightRot15, totalRot:totalRot!==null?+totalRot.toFixed(3):null,
      rotShareAtApex:(rotAtApex!==null&&totalRot)?+(rotAtApex/totalRot).toFixed(3):null,
      rotLast5:rotLast5!==null?+rotLast5.toFixed(3):null,
      maxThrowerStepPost:+maxThrowerStepPost.toFixed(3),
      frontGap:null, hp:d.hp, nan, sawIdleAfter,
      relPelY:relPelY!==null?+relPelY.toFixed(3):null, apexPelY:+apexPelY.toFixed(3),
      tossLift:relPelY!==null?+(apexPelY-relPelY).toFixed(3):null,
      tdPelX:tdPelX!==null?+tdPelX.toFixed(3):null,
      landingFront:tdPelX!==null&&tdThPelX!==null?+(tdPelX-tdThPelX).toFixed(3):null,
      tossTravel:tdPelX!==null&&relPelX!==null?+(tdPelX-relPelX).toFixed(3):null,
      firstAirInvertedTick,
      carryRowsSample:carryRows.filter(r=>[0,3,6,9,12,14].includes(r.tick)),
      attRowsSample:attRows.filter(r=>[0,5,11,14,15,16,20,25,32].includes(r.tick))};
  }
  return { dq122Blue: trial(1), dq122Red: trial(0) };
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
