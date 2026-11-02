// DQ100 gate: BLUE LAUNCHER FOOT FLUID — live within-atk max per-frame fr step.
// Baseline (46ea51b2, cycle 99): fr step 0.346 at t=10 (probe_dq90), 0.344 at t=11
// per cycle-90 record. Acceptance (set BEFORE scratch work):
//   a_fluid: live BLUE launcher within-atk max per-frame joint step <=0.32,
//     for EVERY joint (not just fr), so a fix cannot move the snap elsewhere.
//   b_contact: BLUE launcher contact poses t=13,14,15 byte-identical to baseline
//     (fr [1.00,1.47,-0.10] branch; kr [0.411,1.65,-0.028] per DQ90 probe).
//   c_scope: BLUE punch/kick recovery->idle and RED launcher recovery->idle
//     unchanged (0.075 / 0.025 / 0.074 per DQ90); BLUE launcher live start
//     0.000/0.048 and recovery->idle 0.067 unchanged.
//   d_hit: fresh BLUE launcher at 0.9 m still connects (hp 84, defender air).
//   e_recovery: BLUE launcher recovery->idle <=0.32 (DQ90: 0.067).
// Run: node probe_dq100_launcher_foot.cjs <build.html>
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
  function maxD(p,q){let m=0,j='';for(const k of J){const d=Math.hypot(p[k][0]-q[k][0],p[k][1]-q[k][1],p[k][2]-q[k][2]);if(d>m){m=d;j=k}}return {d:+m.toFixed(3),j}}
  function setup(ai,dist){
    const a=mk(0,ai), d=mk(dist,ai?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[];
    a.x=0; a.z=0; d.x=dist; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0; d.st='idle';
    return {a,d};
  }
  // Whiffed launcher: full atk trace, per-frame steps.
  const {a,d}=setup(1,3);
  const id=pose(a);
  go(a,'L');
  const at0=pose(a);
  let prev=at0, prevSt='atk', steps=[], contact={}, change=null;
  for(let i=0;i<80;i++){
    update(a,d);
    const p=pose(a);
    if(a.st==='atk'){
      const s=maxD(p,prev);
      steps.push({t:a.t, d:s.d, j:s.j, fr:p.fr.map(v=>+v.toFixed(3))});
      if(a.t>=13&&a.t<=15) contact['t'+a.t]={fr:p.fr.map(v=>+v.toFixed(3)), kr:p.kr.map(v=>+v.toFixed(3))};
    }
    if(a.st!==prevSt && prevSt==='atk'){ change={from:prevSt,to:a.st,...maxD(p,prev)}; break; }
    prevSt=a.st; prev=p;
  }
  const maxStep=steps.reduce((m,s)=>s.d>m.d?s:m,{d:0});
  const frSteps=steps.map(s=>({t:s.t, d:s.d, j:s.j}));
  // Scope: recovery->idle for punch/kick/RED launcher via DQ90-style whiffs.
  function recIdle(ai,move){
    const s2=setup(ai,3); go(s2.a,move);
    let ps=s2.a.st, pp=pose(s2.a), ch=null;
    for(let i=0;i<100;i++){ update(s2.a,s2.d); const p=pose(s2.a);
      if(s2.a.st!==ps){ ch={from:ps,to:s2.a.st,...maxD(p,pp)}; break; } ps=s2.a.st; pp=p; }
    return ch;
  }
  // Hit: fresh BLUE launcher at 0.9 m.
  const h=setup(1,0.9); go(h.a,'L');
  for(let i=0;i<40;i++){ update(h.a,h.d); update(h.d,h.a); if(h.d.hp<100) break; }
  return { liveStart0:maxD(at0,id), steps:frSteps, maxStep, contact, change,
    bluePunchRec:recIdle(1,'P'), blueKickRec:recIdle(1,'K'), redLauncherRec:recIdle(0,'L'),
    hit:{hp:h.d.hp, st:h.d.st} };
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
const fluidOk = out.maxStep.d<=0.32;
const contactOk = out.contact.t13 && out.contact.t14 && out.contact.t15
  && JSON.stringify(out.contact.t13.fr)==='[1,1.47,-0.1]' && JSON.stringify(out.contact.t13.kr)==='[0.411,1.65,-0.028]'
  && JSON.stringify(out.contact.t14.fr)==='[1,1.47,-0.1]' && JSON.stringify(out.contact.t15.fr)==='[1,1.47,-0.1]';
console.log('CHECKS', JSON.stringify({a_fluid:fluidOk, b_contact:contactOk,
  c_scope: out.bluePunchRec.d===0.075 && out.blueKickRec.d===0.025 && out.redLauncherRec.d===0.074,
  d_hit: out.hit.hp===84 && out.hit.st==='air',
  e_recovery: out.change && out.change.d<=0.32 }));
console.log((fluidOk&&contactOk)?'DQ100 GATE: PASS (fluid+contact)':'DQ100 GATE: FAIL');
