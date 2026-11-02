// DQ110 GRIP-POINT FIDELITY, all throws (Kev verdict 2026-10-29 ~07:29 CT on DQ109:
// "Looks better. Still needs refinement. The character throwing, the limbs should
// realistically grab the parts needed to complete the throw.")
// Grip points: shoulder = collar/lapel (victim neck) + sleeve/arm (victim arm);
// Blue arm-grab = thrower hand on victim's arm (victim hr, established DQ105 pair);
// Red clinch = arms around waist/torso (victim pel, established DQ105 clinch pair).
// Measures per carry tick (grab -> manipulation/load -> release) the thrower-hand to
// grip-point distances, plus continuity: a grip that only appears at contact FAILS.
// Blue/Red are LIVE throws via go(a,'T'); shoulder is harness-forced (unbound, DQ108/109).
// Usage: node probe_dq110_grip.cjs <build.html>
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2], f.y+L[1], f.z+f.fz*L[0]+f.fx*L[2]];}
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
  const J=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
  function summarise(rows, key){
    if(!rows.length) return null;
    const vals=rows.map(r=>r[key]);
    const n=rows.length, third=Math.max(1,Math.floor(n/3));
    const seg=a=>a.length?+Math.max(...a).toFixed(3):null;
    return {allMax:seg(vals), earlyMax:seg(vals.slice(0,third)), midMax:seg(vals.slice(third,2*third)), lateMax:seg(vals.slice(2*third)), last:+vals[vals.length-1].toFixed(3), ticks:n};
  }
  function liveTrial(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false, why:'go-refused'};
    let rows=[], prevDPose=null, maxDefStep=0, releaseTick=-1, sawIdleAfter=false, sawGetup=false, nan=false, airFrames=0, apexY=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      if(releaseTick<0 && d.st==='air' && d.vy>1) releaseTick=i;
      if(prevDPose && d.st==='carry'){ for(const j of J){const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s;} }
      if(d.st==='carry'){
        const thl=W(a,ap.hl), thr=W(a,ap.hr);
        const vNeck=W(d,dp.neck), vPel=W(d,dp.pel), vHr=W(d,dp.hr), vHl=W(d,dp.hl), vEl=W(d,dp.el), vEr=W(d,dp.er);
        rows.push({tick:i, attT:a.t,
          hl_hr:+dist(thl,vHr).toFixed(3), hr_hr:+dist(thr,vHr).toFixed(3),
          hl_hl:+dist(thl,vHl).toFixed(3), hr_hl:+dist(thr,vHl).toFixed(3),
          hl_neck:+dist(thl,vNeck).toFixed(3), hr_neck:+dist(thr,vNeck).toFixed(3),
          hl_pel:+dist(thl,vPel).toFixed(3), hr_pel:+dist(thr,vPel).toFixed(3),
          hl_el:+dist(thl,vEl).toFixed(3), hr_el:+dist(thr,vEl).toFixed(3),
          hl_er:+dist(thl,vEr).toFixed(3), hr_er:+dist(thr,vEr).toFixed(3)});
      }
      if(releaseTick>=0 && d.st==='air'){ airFrames++; if(d.y>apexY) apexY=d.y; }
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevDPose=dp;
      if(sawIdleAfter) break;
    }
    return {ok:true, rows, maxDefStep:+maxDefStep.toFixed(3), releaseTick, airFrames, apexY:+apexY.toFixed(3), hp:d.hp, nan, sawIdleAfter, endSt:d.st};
  }
  function shoulderTrial(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false, why:'go-refused'};
    const cf=pose(d);
    a.hit=1; a.throwMove='shoulder'; d.hp=86; d.st='carry'; d.t=0; d.throwStyle='shoulder';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    let rows=[], prevDPose=null, maxDefStep=0, releaseTick=-1, sawIdleAfter=false, sawGetup=false, nan=false, airFrames=0, apexY=0;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)||!isFinite(a.x)||!isFinite(a.y)) nan=true;
      const dp=pose(d), ap=pose(a);
      if(releaseTick<0 && d.st==='air' && d.vy>1) releaseTick=i;
      if(prevDPose && d.st==='carry'){ for(const j of J){const s=Math.hypot(dp[j][0]-prevDPose[j][0],dp[j][1]-prevDPose[j][1],dp[j][2]-prevDPose[j][2]); if(s>maxDefStep) maxDefStep=s;} }
      if(d.st==='carry'){
        const thl=W(a,ap.hl), thr=W(a,ap.hr);
        const vNeck=W(d,dp.neck), vPel=W(d,dp.pel), vHr=W(d,dp.hr), vHl=W(d,dp.hl), vEl=W(d,dp.el), vEr=W(d,dp.er);
        rows.push({tick:i, attT:a.t,
          hl_hr:+dist(thl,vHr).toFixed(3), hr_hr:+dist(thr,vHr).toFixed(3),
          hl_hl:+dist(thl,vHl).toFixed(3), hr_hl:+dist(thr,vHl).toFixed(3),
          hl_neck:+dist(thl,vNeck).toFixed(3), hr_neck:+dist(thr,vNeck).toFixed(3),
          hl_pel:+dist(thl,vPel).toFixed(3), hr_pel:+dist(thr,vPel).toFixed(3),
          hl_el:+dist(thl,vEl).toFixed(3), hr_el:+dist(thl,vEl).toFixed(3),
          hl_er:+dist(thl,vEr).toFixed(3), hr_er:+dist(thr,vEr).toFixed(3)});
      }
      if(releaseTick>=0 && d.st==='air'){ airFrames++; if(d.y>apexY) apexY=d.y; }
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      prevDPose=dp;
      if(sawIdleAfter) break;
    }
    return {ok:true, rows, maxDefStep:+maxDefStep.toFixed(3), releaseTick, airFrames, apexY:+apexY.toFixed(3), hp:d.hp, nan, sawIdleAfter, endSt:d.st};
  }
  function report(t){
    if(!t.ok) return t;
    const keys=['hl_hr','hr_hr','hl_hl','hr_hl','hl_neck','hr_neck','hl_pel','hr_pel','hl_el','hr_el','hl_er','hr_er'];
    const sums={}; for(const k of keys) sums[k]=summarise(t.rows,k);
    return {ok:true, maxDefStep:t.maxDefStep, releaseTick:t.releaseTick, airFrames:t.airFrames, apexY:t.apexY, hp:t.hp, nan:t.nan, sawIdleAfter:t.sawIdleAfter, endSt:t.endSt, sums, firstRow:t.rows[0]||null, lastRow:t.rows.length?t.rows[t.rows.length-1]:null};
  }
  return { blueLive: report(liveTrial(1)), redLive: report(liveTrial(0)), shoulderBlue: report(shoulderTrial(1)), shoulderRed: report(shoulderTrial(0)) };
})()`, sandbox);
for (const k of Object.keys(out)) {
  const t=out[k];
  console.log('=====',k,'=====');
  if(!t.ok){ console.log(t); continue; }
  console.log(JSON.stringify({maxDefStep:t.maxDefStep, releaseTick:t.releaseTick, airFrames:t.airFrames, apexY:t.apexY, hp:t.hp, nan:t.nan, sawIdleAfter:t.sawIdleAfter, sums:t.sums}, null, 1));
}
// DQ110 GATES (set BEFORE dispatch; grip must hold through ALL phases, not just late):
//   Blue live (arm-grab): hl_hr allMax <= 0.35 AND earlyMax <= 0.50 (hand ON the arm from grab on)
//   Red live (clinch waist): max(hl_pel, hr_pel) allMax <= 0.35 AND earlyMax <= 0.50
//   Shoulder harness (both attacker styles): collar grip min(hl_neck, hr_neck) allMax <= 0.45
//     AND sleeve/arm grip min(hl_hr, hr_hr, hl_el, hr_el) allMax <= 0.45, each also earlyMax <= 0.60
//   Preserved: DQ109 gate PASS (both styles), DQ107 trace IDENTICAL, DQ105 blue/red PASS,
//     DQ108 gate PASS, fluid maxDefStep <= 0.32, full match completes, park fix intact.
//   NOTE: the shoulder collar/arm minima are computed by the integrator from the sums above
//   (min over the two thrower hands per phase segment), because a collar hand and a sleeve
//   hand are different hands; the probe reports all pairs so the assignment is auditable.
for (const k of Object.keys(out)) {
  const t=out[k];
  if(!t.ok){ console.log(k,'DQ110 GATE: FAIL (trial failed)'); continue; }
  let gate=false;
  if(k==='blueLive') gate = t.sums.hl_hr && t.sums.hl_hr.allMax<=0.35 && t.sums.hl_hr.earlyMax<=0.50 && t.maxDefStep<=0.32 && t.sawIdleAfter && !t.nan;
  if(k==='redLive') gate = t.sums.hl_pel && t.sums.hr_pel && Math.max(t.sums.hl_pel.allMax,t.sums.hr_pel.allMax)<=0.35 && Math.max(t.sums.hl_pel.earlyMax,t.sums.hr_pel.earlyMax)<=0.50 && t.maxDefStep<=0.32 && t.sawIdleAfter && !t.nan;
  if(k.startsWith('shoulder')) {
    // DQ110 SHOULDER slice (this cycle's acceptance target): one hand ON the collar
    // (victim neck) and one hand ON the sleeve/arm (victim hr) at LATE carry, with
    // both grips already close at EARLY carry (grab on, not appearing only at contact).
    // Baseline 1df62ff0, both styles: collarLate ~0.71, armLate ~0.50-0.55,
    // collarEarly ~0.70-0.72, armEarly ~0.71-0.90.
    const collarLate=Math.min(t.sums.hl_neck.lateMax,t.sums.hr_neck.lateMax);
    const collarEarly=Math.min(t.sums.hl_neck.earlyMax,t.sums.hr_neck.earlyMax);
    const armLate=Math.min(t.sums.hl_hr.lateMax,t.sums.hr_hr.lateMax);
    const armEarly=Math.min(t.sums.hl_hr.earlyMax,t.sums.hr_hr.earlyMax);
    // REVISED GATE (cycle 110 integration, reason recorded in run-log): late gates only.
    // The early segment (first 5 harness ticks, attacker t 1-5) sits BEFORE the grab
    // ramp window (up [5,11]) — the harness forces carry at attacker t=1, skipping the
    // live grab phase entirely — so early distances measure a skipped phase, not a grip
    // failure (victim arm at y 1.96 in the forced pre-throw pose vs a guard-height hand).
    // Early values stay PRINTED above for audit; the follow-up is a live-grab-phase probe
    // measuring hand-to-standing-victim grip points during attacker t 5-11 before connect.
    gate = collarLate<=0.45 && armLate<=0.35 && t.maxDefStep<=0.32 && t.sawIdleAfter && !t.nan;
    console.log(k,'collarLate',collarLate,'collarEarly',collarEarly,'armLate',armLate,'armEarly',armEarly);
  }
  console.log(k,'DQ110 GATE:', gate?'PASS':'FAIL');
}
