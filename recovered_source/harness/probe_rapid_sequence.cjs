// Rapid button-sequence test (Kev directive 2026-10-30 ~19:15 CT):
// Do transitions preserve balance and player responsiveness under rapid input?
// Two sequences, Blue attacker vs passive defender at 1.0 m, phase='fight'.
// SEQ A (timed chains): P, then press P at t=10 (recovery) of each attack x4.
//   Expect: every in-window press fires at recovery end; combo progresses.
// SEQ B (mash): alternate P/K presses every 3 ticks for 120 ticks.
//   Expect: no NaN, no unforced down/air, ends idle/guard, no state corruption.
//   Out-of-window presses expire by design (6-frame buffer); only an in-window
//   press that fails to fire counts as a dropped input.
// Balance measures: attacker st never down/air unforced; final st idle;
// max per-joint pose step across each chain transition (continuity).
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const JOINTS=['pel','neck','head','hl','hr','fl','fr'];
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])}
  function setup(){
    const a=mk(0,1), d=mk(0,0);
    S=[d,a]; phase='fight'; hs=0; tm=45*60; sparks=[];
    a.x=0; a.z=0; d.x=1.0; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0; d.st='idle';
    return {a,d};
  }
  function step(a,d){ update(a,d); if(a.i.bp>0)a.i.bp--; if(a.i.bk>0)a.i.bk--; d.x=1.0; d.z=0; }
  // SEQ A
  const A=(()=>{ const {a,d}=setup(); go(a,'P');
    let presses=0, fires=[], nan=0, badSt=0, worst={joint:null,val:0};
    for(let i=0;i<200;i++){
      if(a.st==='atk' && a.t===10 && presses<4){ a.i.bp=6; presses++; }
      const pre=(a.st==='atk')?pose(a):null;
      const wasAtk=a.st==='atk', wasT=a.t;
      step(a,d);
      if(!isFinite(a.x+a.y+a.z+a.hp)) nan++;
      if(a.st==='down'||a.st==='air') badSt++;
      if(wasAtk && a.st==='atk' && a.t===0 && i>0 && pre){
        fires.push(i);
        for(const j of JOINTS){const v=dist(pre[j],pose(a)[j]); if(v>worst.val) worst={joint:j,val:v}}
      }
      if(fires.length===4 && a.st==='idle') break;
    }
    // settle to idle
    for(let k=0;k<60 && a.st!=='idle';k++) step(a,d);
    return {presses, fires:fires.length, fireFrames:fires, maxTransJointStep:worst, nanTicks:nan, badStateTicks:badSt, finalSt:a.st, defenderHp:d.hp};
  })();
  // SEQ B
  const B=(()=>{ const {a,d}=setup(); go(a,'P');
    let presses=0, fires=0, nan=0, badSt=0, worst={joint:null,val:0}, lastMove=null;
    for(let i=0;i<160;i++){
      if(i>0 && i%3===0){ if(i%6===0) a.i.bp=6; else a.i.bk=6; presses++; }
      const pre=(a.st==='atk')?pose(a):null;
      const wasAtk=a.st==='atk';
      step(a,d);
      if(!isFinite(a.x+a.y+a.z+a.hp)) nan++;
      if(a.st==='down'||a.st==='air') badSt++;
      if(wasAtk && a.st==='atk' && a.t===0 && i>0){ fires++; if(pre) for(const j of JOINTS){const v=dist(pre[j],pose(a)[j]); if(v>worst.val) worst={joint:j,val:v}} }
      if(a.mv) lastMove=a.mv===M.K?'K':a.mv===M.L?'L':'P';
    }
    for(let k=0;k<80 && a.st!=='idle';k++) step(a,d);
    return {presses, chainFires:fires, maxTransJointStep:worst, nanTicks:nan, badStateTicks:badSt, finalSt:a.st, finalX:+a.x.toFixed(3), defenderHp:d.hp};
  })();
  return {seqA_timedChains:A, seqB_mash:B};
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
