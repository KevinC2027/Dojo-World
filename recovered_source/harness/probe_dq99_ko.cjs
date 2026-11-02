// DQ99 KO check: a throw that KOs must still end the round, park the
// defender down (no get-up at hp 0), and never NaN — for both styles.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  function trial(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=20;
    if(!go(a,'T')) return {ok:false};
    let nan=false, sawAir=false, finalSt=null;
    for(let i=0;i<200;i++){ update(a,d); update(d,a);
      if(!isFinite(d.x)||!isFinite(d.y)) nan=true;
      if(d.st==='air') sawAir=true; finalSt=d.st; }
    return {ok:true, phase, hp:d.hp, sawAir, finalSt, nan, wins:a.wins};
  }
  return {blueKO: trial(1), redKO: trial(0)};
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
const pass=t=>t.ok&&t.phase==='end'&&t.hp===0&&t.finalSt==='down'&&!t.nan;
console.log('KO CHECKS', JSON.stringify({blue:pass(out.blueKO), red:pass(out.redKO)}));
