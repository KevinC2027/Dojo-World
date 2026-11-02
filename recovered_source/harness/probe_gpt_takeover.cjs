// GPT takeover smoke test — real G+P input and preserved contact/KO path.
// Run: node harness/probe_gpt_takeover.cjs <build.html>
// Does not write to, or evaluate, the canonical live build by default.
const fs=require('fs'),vm=require('vm');
if(!process.argv[2]){console.error('Usage: node probe_gpt_takeover.cjs <build.html>');process.exit(2)}
const html=fs.readFileSync(process.argv[2],'utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];
if(!script)throw Error('Source script missing');
const ctx2d=new Proxy({}, {get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:900,height:500}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=> '#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(script,sandbox);
const runs=[];
for(const style of ['lunge','back'])for(const distance of [.75,1.15,1.30,1.40,1.50]){
 const expr=`(()=>{
 const a=mk(0,${style==='lunge'?1:0}),d=mk(0,${style==='lunge'?0:1});
 S=[a,d];phase='fight';pt=0;hs=0;shake=0;msgT=0;tm=2700;sparks=[];
 a.x=0;a.z=0;a.fx=1;a.ax=1;a.fz=0;a.az=0;
 d.x=${distance};d.z=0;d.fx=-1;d.ax=-1;d.fz=0;d.az=0;
 a.st='idle';d.st='idle';a.aiT=d.aiT=1e9;
 press('g',1);press('p',1);tick();press('g',0);press('p',0);
 let carry=false,air=false,down=false,getup=false,recovered=false,firstCarryTick=null,releaseTick=null;
 let last=d.st;
 for(let i=0;i<220;i++){
 tick();if(d.st==='carry'){carry=true;if(firstCarryTick===null)firstCarryTick=i}
 if(last==='carry'&&d.st==='air')releaseTick=i;
 if(d.st==='air')air=true;if(d.st==='down')down=true;if(d.st==='getup')getup=true;
 if(getup&&d.st==='idle')recovered=true;last=d.st;
 }
 return {style:'${style}',distance:${distance},hp:d.hp,carry,air,down,getup,recovered,firstCarryTick,releaseTick,finite:[a.x,a.y,d.x,d.y].every(Number.isFinite)};
 })()`;
 runs.push(vm.runInContext(expr,sandbox));
}
const near=runs.filter(r=>r.distance===.75),far=runs.filter(r=>r.distance>=1.4);
const pass=near.every(r=>r.hp===78&&r.carry&&r.air&&r.down&&r.getup&&r.recovered&&r.finite)
    &&far.every(r=>!r.carry&&r.hp===100&&r.finite);
console.log(JSON.stringify({runs,smokePass:pass},null,2));
if(!pass)process.exitCode=1;
