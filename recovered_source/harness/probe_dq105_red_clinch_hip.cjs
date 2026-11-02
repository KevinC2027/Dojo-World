// DQ105 slice 2 probe: RED (Boxing, style 'back') clinch + hip/body toss.
// Baseline: current build 04bc0861 (Blue slice 1 merged, Red still generic DQ104 carry).
// World: W(f,L) = [f.x + f.fx*L[0] - f.fz*L[2], f.y + L[1], f.z + f.fz*L[0] + f.fx*L[2]]
// Per carry tick record: thrower hl/hr world, defender pel/neck/head world,
// clinch distances thrower-hands <-> defender pel, defender pitch (head-pel vector,
// world x-y plane), thrower pel (hip), defender feet max, fluid maxDefStep.
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
  function trial(attAi, dist0){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=dist0; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false, why:'go-refused'};
    let connectTick=-1, releaseTick=-1, prevDPose=null, maxDefStep=0, carryTicks=[];
    let airFrames=0, apexY=0, touchdownTick=-1, sawDown=false, sawGetup=false, sawIdleAfter=false, prevSt='idle', nan=false, feetMaxCarry=0;
    let rows=[];
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
          const thlW=W(a,ap.hl), thrW=W(a,ap.hr), pelW=W(d,dp.pel), neckW=W(d,dp.neck), headW=W(d,dp.head);
          const pitch=Math.atan2(headW[1]-pelW[1], headW[0]-pelW[0]);
          const apPelW=W(a,ap.pel);
          rows.push({tick:i, attT:a.t, clinchL:+dist(thlW,pelW).toFixed(3), clinchR:+dist(thrW,pelW).toFixed(3),
            clinchLneck:+dist(thlW,neckW).toFixed(3), clinchRneck:+dist(thrW,neckW).toFixed(3),
            pitch:+pitch.toFixed(3), headW:headW.map(v=>+v.toFixed(3)), pelW:pelW.map(v=>+v.toFixed(3)),
            attPel:apPelW.map(v=>+v.toFixed(3)), attHl:thlW.map(v=>+v.toFixed(3)), attHr:thrW.map(v=>+v.toFixed(3)),
            defY:+d.y.toFixed(3), attY:+a.y.toFixed(3)});
          const f=Math.max(d.y+dp.fl[1], d.y+dp.fr[1]); if(f>feetMaxCarry) feetMaxCarry=f;
          carryTicks.push(i);
        }
        if(releaseTick>=0 && d.st==='air'){ airFrames++; if(d.y>apexY) apexY=d.y; }
        if(prevSt==='air' && d.st==='down' && touchdownTick<0 && releaseTick>=0){ touchdownTick=i; }
        if(d.st==='down') sawDown=true;
        if(d.st==='getup') sawGetup=true;
        if(sawGetup && d.st==='idle') sawIdleAfter=true;
      }
      prevDPose=dp; prevSt=d.st;
      if(sawIdleAfter) break;
    }
    return {ok:true, connectTick, releaseTick, carryFrames: releaseTick>=0? releaseTick-connectTick : null,
      carryTicks: carryTicks.length, feetMaxCarry:+feetMaxCarry.toFixed(3), maxDefStep:+maxDefStep.toFixed(3),
      rows, airFrames, apexY:+apexY.toFixed(3), touchdownTick, sawDown, sawGetup, sawIdleAfter, hp:d.hp, nan, endSt:d.st};
  }
  return { blueThrow: trial(1,0.70), redThrow: trial(0,0.70) };
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
for (const k of ['redThrow','blueThrow']) {
  const t=out[k];
  const late=t.rows.slice(-3);
  console.log(k, 'clinchLateL', late.map(r=>r.clinchL), 'clinchLateR', late.map(r=>r.clinchR),
    'pitchMid', t.rows.length>5?t.rows[5].pitch:null, 'pitchLast', t.rows.length?t.rows[t.rows.length-1].pitch:null,
    'carry',t.carryFrames,'feet',t.feetMaxCarry,'maxDefStep',t.maxDefStep,'air',t.airFrames,'apex',t.apexY,'hp',t.hp);
}
// DQ105-SLICE-2 GATE (set BEFORE dispatch; baselines on build 04bc0861):
//   Red mid pitch (6th carry row) baseline 0.649; last pitch baseline 0.015.
//   Red clinchLate baseline max 0.41; Blue gate fields baseline: carry 11, feet 1.265,
//   maxDefStep 0.281, air 21, apex 0.88, hp 78.
const r=out.redThrow, b=out.blueThrow;
const clinchLateMax=Math.max(...r.rows.slice(-3).flatMap(x=>[x.clinchL,x.clinchR]));
const pitchMidDev=Math.abs(r.rows[5].pitch-0.649), pitchRetDev=Math.abs(r.rows[r.rows.length-1].pitch-0.015);
console.log('DQ105-RED clinchLateMax (<=0.25):', +clinchLateMax.toFixed(3), 'pitchMidDev (>=0.20):', +pitchMidDev.toFixed(3), 'pitchRetDev (<=0.12):', +pitchRetDev.toFixed(3));
const redGate = r.ok && clinchLateMax<=0.25 && pitchMidDev>=0.20 && pitchRetDev<=0.12 && r.maxDefStep<=0.32 && r.carryFrames>=6 && r.feetMaxCarry>=0.50 && r.airFrames===21 && r.apexY===0.88 && r.hp===78 && !r.nan;
console.log('DQ105-RED GATE:', redGate?'PASS':'FAIL');
const blueParity = b.carryFrames===11 && b.feetMaxCarry===1.265 && b.maxDefStep===0.281 && b.airFrames===21 && b.apexY===0.88 && b.hp===78;
console.log('BLUE PARITY (must be byte-identical gate fields):', blueParity?'PASS':'FAIL');
