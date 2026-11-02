// Family B: fixed-direction world-axis bump (bx,by)*sin(pi*e)^p on BLUE hr only,
// same branches/poles as probe_dq97_throw_search.cjs. Reuses its builder via copy.
const fs=require('fs'),vm=require('vm');
const BASE='/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const src=fs.readFileSync(BASE+'/prototype/index.html','utf8');
const GEN="else if(m===M.T){p.hl=[.3+.47*e,1.2,.25];p.hr=[.3+.47*e,1.2,-.25];p.neck[0]+=.15*e;p.head[0]+=.2*e}";
const KR="&&(f.pn||0)===4))&&f.style==='lunge')p.kr=";
const ER="||(s==='atk'&&f.mv===M.L))&&f.style==='lunge')p.er=";
function build(bx,by,p){
  const blue=`else if(m===M.T&&f.style==='lunge'){const dt=Math.pow(Math.sin(Math.PI*e),${p});p.pel=[.10,.70+.543*e,.06+.05*e];p.neck=[.18+.06*e,1.25+.543*e,.09-.10*e];p.head=[.24+.11*e,1.49+.543*e,.09-.10*e];p.hl=[.92-.15*e,1.16+.04*e,.36-.11*e];p.hr=[-.22+.99*e+dt*${bx},1.72-.52*e+dt*${by},-.38+.13*e];p.fl=[1.00-.98*e,0,.34-.13*e];p.fr=[-.70+.74*e,0,-.22+.17*e]}`;
  const red=`else if(m===M.T&&f.style==='back'){p.pel=[-.04+.14*e,1.212+.031*e,.06+.05*e];p.neck=[.03+.21*e,1.762+.031*e,-.02+.01*e];p.head=[.09+.26*e,2.002+.031*e,-.02+.01*e];p.hl=[.35+.42*e,1.972-.772*e,.16+.09*e];p.hr=[.30+.47*e,1.962-.762*e,-.17-.08*e];p.fl=[.21-.19*e,.05-.05*e,.14+.07*e];p.fr=[-.15+.19*e,0,-.11+.06*e]}`;
  let s=src.replace(GEN,blue+' '+red+' '+GEN);
  s=s.replace(KR,"&&(f.pn||0)===4)||(s==='atk'&&f.mv===M.T))&&f.style==='lunge')p.kr=");
  s=s.replace(ER,"||(s==='atk'&&f.mv===M.T)||(s==='atk'&&f.mv===M.L))&&f.style==='lunge')p.er=");
  return s;
}
function measure(html){
  const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
  const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
  const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
  const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  vm.createContext(sandbox);vm.runInContext(script,sandbox);
  return vm.runInContext(`(()=>{
    const J=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
    function idle(ai,t){const f=mk(0,ai);f.st='idle';f.t=t;return pose(f)}
    function atk(ai,key,t){const f=mk(0,ai);f.st='atk';f.mv=M[key];f.pn=0;f.kn=0;f.t=t;return pose(f)}
    function maxD(p,q){let m=0;for(const j of J){const d=Math.hypot(p[j][0]-q[j][0],p[j][1]-q[j][1],p[j][2]-q[j][2]);if(d>m)m=d}return +m.toFixed(3)}
    function fluid(ai){let step=0,prev=null,stepT=-1,stepJ='';
      for(let t=0;t<=33;t++){const p=atk(ai,'T',t);if(prev)for(const j of J){const d=Math.hypot(p[j][0]-prev[j][0],p[j][1]-prev[j][1],p[j][2]-prev[j][2]);if(d>step){step=d;stepT=t;stepJ=j}}prev=p}
      return {step:+step.toFixed(3),stepT,stepJ}}
    const IB=idle(1,0),I0=idle(0,0);
    return {bO:maxD(atk(1,'T',0),IB),bF1:maxD(atk(1,'T',1),IB),bFl:fluid(1),rO:maxD(atk(0,'T',0),I0),rF1:maxD(atk(0,'T',1),I0),rFl:fluid(0)};
  })()`,sandbox);
}
let best=[];
for(const bx of [0.10,0.15,0.20,0.25,0.30])
 for(const by of [0.20,0.25,0.30,0.35,0.40])
  for(const p of [1,1.25,1.5]){
    const m=measure(build(bx,by,p));
    const ok=m.bO<=0.02&&m.bF1<=0.30&&m.bFl.step<=0.32&&m.rO<=0.02&&m.rF1<=0.30&&m.rFl.step<=0.32;
    best.push({bx,by,p,ok,...m});
    console.log(JSON.stringify(best[best.length-1]));
  }
best.sort((a,b)=>a.bFl.step-b.bFl.step);
console.log('BEST5:');best.slice(0,5).forEach(r=>console.log(JSON.stringify(r)));
console.log('PASSES:',best.filter(r=>r.ok).length,'/',best.length);
