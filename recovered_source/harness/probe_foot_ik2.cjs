// Foot-IK refinement: (a) mid-stance planted drift (exclude lift/land edges);
// (b) pelvis-to-support distance during SINGLE support only (one foot airborne).
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const a=mk(0,1),d=mk(0,0);S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];a.x=0;a.z=0;d.x=1.0;d.z=0;d.st='idle';a.i.r=1;
  const fr=[];
  for(let i=0;i<120;i++){update(a,d);if(a.i.bp>0)a.i.bp--;if(a.i.bk>0)a.i.bk--;d.x=1.0;d.z=0;const p=pose(a);fr.push({t:i,pel:[...p.pel],fl:[...p.fl],fr:[...p.fr]})}
  // (a) mid-stance drift: foot planted (y<=0.01) for 3+ consecutive frames, middle frames only
  let driftL=0,driftR=0,pairs=0;
  for(let i=2;i<fr.length-1;i++){
    const prev=fr[i-1],cur=fr[i],nxt=fr[i+1];
    if(prev.fl[1]<=0.01&&cur.fl[1]<=0.01&&nxt.fl[1]<=0.01){driftL=Math.max(driftL,Math.hypot(cur.fl[0]-prev.fl[0],cur.fl[2]-prev.fl[2]));pairs++}
    if(prev.fr[1]<=0.01&&cur.fr[1]<=0.01&&nxt.fr[1]<=0.01){driftR=Math.max(driftR,Math.hypot(cur.fr[0]-prev.fr[0],cur.fr[2]-prev.fr[2]));pairs++}
  }
  // (b) single-support pelvis offset: exactly one foot airborne (y>0.10)
  let worst=0,worstT=0,count=0;
  for(const f of fr){
    const lAir=f.fl[1]>0.10, rAir=f.fr[1]>0.10;
    if(lAir!==rAir){count++;const sup=lAir?f.fr:f.fl;const off=Math.hypot(f.pel[0]-sup[0],f.pel[2]-sup[2]);if(off>worst){worst=off;worstT=f.t}}
  }
  return{midStance:{maxDriftL:+driftL.toFixed(3),maxDriftR:+driftR.toFixed(3),pairs},singleSupport:{frames:count,maxPelvisToSupport:+worst.toFixed(3),atTick:worstT}};
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
