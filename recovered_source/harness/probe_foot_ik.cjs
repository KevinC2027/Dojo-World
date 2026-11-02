// Foot-IK feasibility evaluation (Kev directive 2026-10-30 ~23:16 CT).
// READ-ONLY vs prototype/index.html: poses are sampled from the live engine
// via the vm harness; ground scenarios are computed, never written back.
// Method:
//  - Knee angle is a pure function of hip-foot distance d (bones .62+.62):
//    angle = acos((.62^2+.62^2-d^2)/(2*.62*.62)) in degrees; 180 = straight.
//    Validated against the DQ25 note (Blue idle front 134.9 / rear 120.7).
//  - Hip anchors approximated as pelvis +/- 0.12 in z (engine line 466;
//    rotH term <=0.044 in x, <=0.01 in z — sensitivity reported).
//  - For each ground scenario, planted feet get the scenario height; then a
//    grid search over pelvis offsets (x,y) finds the best achievable pair
//    of knee angles and whether both legs stay in the stance band.
//  - ik2 clamp artifact: foot targets beyond 1.235 m solve the knee on the
//    clamped ray while the endpoint stays put -> rendered segment stretch.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const kneeDeg=d=>{const c=Math.max(-1,Math.min(1,(0.62*0.62+0.62*0.62-d*d)/(2*0.62*0.62)));return Math.acos(c)*180/Math.PI};
  const hips=pel=>({L:[pel[0],pel[1],pel[2]+0.12],R:[pel[0],pel[1],pel[2]-0.12]});
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  function setup(ai){const a=mk(0,ai),d=mk(0,ai?0:1);S=[ai?d:a,ai?a:d];phase='fight';hs=0;tm=45*60;sparks=[];a.x=0;a.z=0;d.x=1.0;d.z=0;d.st='idle';return{a,d}}
  function step(a,d){update(a,d);if(a.i.bp>0)a.i.bp--;if(a.i.bk>0)a.i.bk--;d.x=1.0;d.z=0}
  // --- sample real poses ---
  const poses={};
  {const{a,d}=setup(1);a.st='idle';a.t=0;const p=pose(a);poses.blueIdle={pel:p.pel,fl:p.fl,fr:p.fr}}
  {const{a,d}=setup(0);a.st='idle';a.t=0;const p=pose(a);poses.redIdle={pel:p.pel,fl:p.fl,fr:p.fr}}
  {const{a,d}=setup(1);a.i.r=1;const frames=[];for(let i=0;i<70;i++){step(a,d);const p=pose(a);frames.push({t:i,st:a.st,pel:[...p.pel],fl:[...p.fl],fr:[...p.fr]})}poses.blueWalk=frames}
  {const{a,d}=setup(1);go(a,'K');a.kn=1;let p=null;for(let i=0;i<40;i++){step(a,d);if(a.st==='atk'&&a.t>=a.mv.su){p=pose(a);break}}poses.blueSweepContact={pel:p.pel,fl:p.fl,fr:p.fr}}
  {const{a,d}=setup(0);go(a,'K');a.kn=1;let p=null;for(let i=0;i<40;i++){step(a,d);if(a.st==='atk'&&a.t>=a.mv.su){p=pose(a);break}}poses.redRoundContact={pel:p.pel,fl:p.fl,fr:p.fr}}
  // --- knee angles for a pose, given foot-height overrides (planted feet) ---
  function knees(pose,dyL,dyR,pelDx,pelDy){
    const pel=[pose.pel[0]+(pelDx||0),pose.pel[1]+(pelDy||0),pose.pel[2]];
    const H=hips(pel);
    const fl=[pose.fl[0],pose.fl[1]+(dyL||0),pose.fl[2]];
    const fr=[pose.fr[0],pose.fr[1]+(dyR||0),pose.fr[2]];
    const dL=dist(H.L,fl),dR=dist(H.R,fr);
    return{dL:+dL.toFixed(3),dR:+dR.toFixed(3),kL:+kneeDeg(dL).toFixed(1),kR:+kneeDeg(dR).toFixed(1),
      reachL:dL>1.235,reachR:dR>1.235,stretchL:Math.max(0,dL-1.235),stretchR:Math.max(0,dR-1.235)};
  }
  // --- pelvis compensation grid search: best worst-deviation from baseline knees ---
  function compensate(pose,dyL,dyR){
    const base=knees(pose,0,0);
    let best=null;
    for(let dx=-0.30;dx<=0.301;dx+=0.01)for(let dy=-0.30;dy<=0.301;dy+=0.01){
      const k=knees(pose,dyL,dyR,dx,dy);
      if(k.reachL||k.reachR)continue;
      const dev=Math.max(Math.abs(k.kL-base.kL),Math.abs(k.kR-base.kR));
      if(!best||dev<best.dev)best={dev:+dev.toFixed(1),dx:+dx.toFixed(2),dy:+dy.toFixed(2),kL:k.kL,kR:k.kR};
    }
    // also: does ANY offset keep both knees in the stance band 100..170?
    let inBand=null;
    for(let dx=-0.30;dx<=0.301;dx+=0.01)for(let dy=-0.30;dy<=0.301;dy+=0.01){
      const k=knees(pose,dyL,dyR,dx,dy);
      if(k.reachL||k.reachR)continue;
      if(k.kL>=100&&k.kL<=170&&k.kR>=100&&k.kR<=170){inBand={dx:+dx.toFixed(2),dy:+dy.toFixed(2),kL:k.kL,kR:k.kR};break}
    }
    return{base:{kL:base.kL,kR:base.kR},best,inBand:!!inBand,inBandAt:inBand};
  }
  const scenarios=[
    {name:'flat',dyL:0,dyR:0},
    {name:'step-up +0.10 both',dyL:0.10,dyR:0.10},
    {name:'step-up +0.20 both',dyL:0.20,dyR:0.20},
    {name:'step-down -0.10 both',dyL:-0.10,dyR:-0.10},
    {name:'step-down -0.20 both',dyL:-0.20,dyR:-0.20},
    {name:'slope: lead +0.15, rear 0',dyL:0.15,dyR:0},
    {name:'slope: lead 0, rear +0.15',dyL:0,dyR:0.15},
    {name:'slope: lead +0.15, rear -0.15',dyL:0.15,dyR:-0.15},
  ];
  const table={};
  for(const key of['blueIdle','redIdle','blueSweepContact','redRoundContact']){
    table[key]={};
    for(const s of scenarios){
      table[key][s.name]={noComp:knees(poses[key],s.dyL,s.dyR),compensated:compensate(poses[key],s.dyL,s.dyR)};
    }
  }
  // --- walk stability baseline: planted-foot drift on flat ground ---
  const walkDrift=(()=>{const fr=poses.blueWalk;let maxL=0,maxR=0,planted=0;
    for(let i=1;i<fr.length;i++){
      const a=fr[i-1],b=fr[i];
      if(a.fl[1]<=0.01&&b.fl[1]<=0.01){maxL=Math.max(maxL,Math.hypot(b.fl[0]-a.fl[0],b.fl[2]-a.fl[2]));planted++}
      if(a.fr[1]<=0.01&&b.fr[1]<=0.01){maxR=Math.max(maxR,Math.hypot(b.fr[0]-a.fr[0],b.fr[2]-a.fr[2]));planted++}
    }
    return{frames:fr.length,plantedPairs:planted,maxDriftL:+maxL.toFixed(3),maxDriftR:+maxR.toFixed(3)}})();
  // --- pelvis-over-support offset during walk (balance read) ---
  const supportOffset=(()=>{const fr=poses.blueWalk;let worst=0,worstT=0;
    for(const f of fr){
      const sup=f.fl[1]<=f.fr[1]?f.fl:f.fr;
      const off=Math.hypot(f.pel[0]-sup[0],f.pel[2]-sup[2]);
      if(off>worst){worst=off;worstT=f.t}
    }
    return{maxPelvisToSupport:+worst.toFixed(3),atTick:worstT}})();
  // --- ik2 clamp artifact, direct ---
  const clamp=(()=>{const hip=[0,1.0,0];const foot=[0.9,0,0];const d0=Math.hypot(0.9,1.0);
    const k=ik2(hip,foot,0.62,0.62,-1);
    const thigh=Math.hypot(k[0]-hip[0],k[1]-hip[1],k[2]-hip[2]);
    const shin=Math.hypot(foot[0]-k[0],foot[1]-k[1],foot[2]-k[2]);
    return{hipFootDist:+d0.toFixed(3),solvedThigh:+thigh.toFixed(3),renderedShin:+shin.toFixed(3),shinStretch:+Math.max(0,shin-0.62).toFixed(3)}})();
  // --- hip-approximation sensitivity: rotH +/-1 vs 0 on Blue idle ---
  const sens=(()=>{const p=poses.blueIdle;const out={};
    for(const r of[-1,0,1]){
      const HL=[p.pel[0]+0.04*r,p.pel[1],p.pel[2]+0.12-0.009*r];
      const HR=[p.pel[0]-0.04*r,p.pel[1],p.pel[2]-0.12+0.009*r];
      out['rotH'+r]={kL:+kneeDeg(dist(HL,p.fl)).toFixed(1),kR:+kneeDeg(dist(HR,p.fr)).toFixed(1)};
    }
    return out})();
  return{poses:{blueIdle:poses.blueIdle,redIdle:poses.redIdle,blueSweepContact:poses.blueSweepContact,redRoundContact:poses.redRoundContact},
    table,walkDrift,supportOffset,clamp,sensitivity:sens};
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
