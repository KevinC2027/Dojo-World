// DQ111 LIVE-GRAB PHASE PROBE (follow-up queued by cycle 110).
// Cycle 110 removed the shoulder early-segment gate because the harness forces carry
// at attacker t=1, before the grab ramp window up[5,11] even starts, so early harness
// distances measure a skipped grab phase, not a grip failure. This probe closes that
// gap honestly with LIVE measurements, in two parts:
//  A) WHIFF (pre-connect): defender placed at 1.40 m so tryHit never connects; record
//     thrower-hand to STANDING victim grip points while attacker t runs 5..11 (the
//     grab-ramp window) with f.hit=0, so ramp=0 by construction in pose().
//  B) LIVE CONNECT: defender at 0.70 m, connect at attacker t=5; record per carry tick
//     attacker t, ramp (replicated throwRamp, up[5,11] hold16 down23), and hand-to-
//     moving-grip distances, segmented by attacker-t window: rise [5,11], hold [12,16],
//     decline [17,23]. Blue grip = hl->victim hr (arm grab); Red grip = both hands ->
//     victim pel (waist clinch). Shoulder is harness-only/unbound, so no live slice.
// Usage: node probe_dq111_livegrab.cjs <build.html>
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
  function ramp(t){const u0=Math.min(1,Math.max(0,(t-5)/6)),u=u0*u0*(3-2*u0),d0=t<=16?1:Math.min(1,Math.max(0,(23-t)/7)),d=d0*d0*(3-2*d0);return u*d;}
  function whiff(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=1.40; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false,why:'go-refused'};
    let rows=[];
    for(let i=0;i<60;i++){
      update(a,d); update(d,a);
      if(a.st!=='atk') break;
      const ap=pose(a), dp=pose(d);
      const thl=W(a,ap.hl), thr=W(a,ap.hr);
      const vNeck=W(d,dp.neck), vHr=W(d,dp.hr), vPel=W(d,dp.pel);
      rows.push({attT:a.t, hit:a.hit, hl_hr:+dist(thl,vHr).toFixed(3), hr_hr:+dist(thr,vHr).toFixed(3), hl_neck:+dist(thl,vNeck).toFixed(3), hr_neck:+dist(thr,vNeck).toFixed(3), hl_pel:+dist(thl,vPel).toFixed(3), hr_pel:+dist(thr,vPel).toFixed(3), handX:+thl[0].toFixed(3)});
      if(a.t>33) break;
    }
    return {ok:true, rows, hit:a.hit, defSt:d.st};
  }
  function live(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false,why:'go-refused'};
    let rows=[], sawIdleAfter=false, sawGetup=false;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      const dp=pose(d), ap=pose(a);
      if(d.st==='carry'){
        const thl=W(a,ap.hl), thr=W(a,ap.hr);
        const vNeck=W(d,dp.neck), vHr=W(d,dp.hr), vPel=W(d,dp.pel);
        rows.push({attT:a.t, defT:d.t, ramp:+ramp(a.t).toFixed(3),
          hl_hr:+dist(thl,vHr).toFixed(3), hr_hr:+dist(thr,vHr).toFixed(3),
          hl_neck:+dist(thl,vNeck).toFixed(3), hr_neck:+dist(thr,vNeck).toFixed(3),
          hl_pel:+dist(thl,vPel).toFixed(3), hr_pel:+dist(thr,vPel).toFixed(3)});
      }
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      if(sawIdleAfter) break;
    }
    return {ok:true, rows, hp:d.hp, sawIdleAfter};
  }
  function seg(rows,key,lo,hi){const v=rows.filter(r=>r.attT>=lo&&r.attT<=hi).map(r=>r[key]); return v.length?{n:v.length, max:+Math.max(...v).toFixed(3), last:+v[v.length-1].toFixed(3)}:null;}
  function report(t,blue){
    if(!t.ok) return t;
    const gripKey = blue?'hl_hr':null;
    const out={hp:t.hp, sawIdleAfter:t.sawIdleAfter, ticks:t.rows.length};
    if(blue){ out.hl_hr_rise=seg(t.rows,'hl_hr',5,11); out.hl_hr_hold=seg(t.rows,'hl_hr',12,16); out.hl_hr_decline=seg(t.rows,'hl_hr',17,23); out.hl_hr_allMax=t.rows.length?+Math.max(...t.rows.map(r=>r.hl_hr)).toFixed(3):null; }
    else { const both=t.rows.map(r=>Math.min(r.hl_pel,r.hr_pel)); out.pelBest_rise=(()=>{const v=t.rows.filter(r=>r.attT>=5&&r.attT<=11).map(r=>Math.min(r.hl_pel,r.hr_pel)); return v.length?{n:v.length,max:+Math.max(...v).toFixed(3),last:+v[v.length-1].toFixed(3)}:null;})(); out.pelBest_hold=(()=>{const v=t.rows.filter(r=>r.attT>=12&&r.attT<=16).map(r=>Math.min(r.hl_pel,r.hr_pel)); return v.length?{n:v.length,max:+Math.max(...v).toFixed(3),last:+v[v.length-1].toFixed(3)}:null;})(); out.pelBest_allMax=both.length?+Math.max(...both).toFixed(3):null; out.hl_pel_allMax=t.rows.length?+Math.max(...t.rows.map(r=>r.hl_pel)).toFixed(3):null; out.hr_pel_allMax=t.rows.length?+Math.max(...t.rows.map(r=>r.hr_pel)).toFixed(3):null; }
    return out;
  }
  return { whiffBlue: whiff(1), whiffRed: whiff(0), blueLive: live(1), redLive: live(0), blueReport: report(live(1),true), redReport: report(live(0),false) };
})()`, sandbox);
for (const k of ['whiffBlue','whiffRed']) {
  const t=out[k];
  console.log('=====',k,'hit:',t.hit,'defSt:',t.defSt);
  for (const r of t.rows.filter(r=>r.attT>=5&&r.attT<=11)) console.log(' attT',r.attT,'hl_hr',r.hl_hr,'hr_hr',r.hr_hr,'hl_neck',r.hl_neck,'hr_neck',r.hr_neck,'hl_pel',r.hl_pel,'hr_pel',r.hr_pel);
}
for (const k of ['blueLive','redLive']) {
  const t=out[k];
  console.log('=====',k,'hp:',t.hp,'sawIdleAfter:',t.sawIdleAfter);
  for (const r of t.rows) console.log(' attT',r.attT,'defT',r.defT,'ramp',r.ramp,'hl_hr',r.hl_hr,'hr_hr',r.hr_hr,'hl_pel',r.hl_pel,'hr_pel',r.hr_pel,'hl_neck',r.hl_neck,'hr_neck',r.hr_neck);
}
console.log('BLUE REPORT', JSON.stringify(out.blueReport));
console.log('RED REPORT', JSON.stringify(out.redReport));
