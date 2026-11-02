// Cycle 160 focused probe: shipped throws both directions, victim getup elbow steps.
// Read-only harness: loads build path from argv, drives go('T'), records victim
// local pose joints per tick during down+getup, reports per-joint max steps in getup
// and the full elbow trace around the largest steps.
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(script,sandbox);
const D3=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
function run(label,atkStyle,defStyle){
  const res=vm.runInContext(`(()=>{const a=mk(0,${atkStyle}),d=mk(0,${defStyle});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
    a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
    a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
    go(a,'T');const frames=[];let prev='idle';
    for(let tick=0;tick<300;tick++){update(a,d);update(d,a);const pd=pose(d);
      frames.push({tick,vicSt:d.st,vicT:d.t,el:pd.el.slice(),er:pd.er.slice(),hl:pd.hl.slice(),hr:pd.hr.slice(),pel:pd.pel.slice(),neck:pd.neck.slice(),style:d.style,ic:d.ic});
      if(d.st==='idle'&&prev==='getup')break;prev=d.st;}
    return frames;})()`,sandbox);
  const getup=res.filter(f=>f.vicSt==='getup');
  const steps=[];
  for(let i=1;i<getup.length;i++){const a=getup[i-1],b=getup[i];
    for(const j of['el','er','kl','kr','hl','hr']){/*kl/kr absent in this record; harmless*/}
    for(const j of['el','er','hl','hr'])steps.push({from:a.vicT,to:b.vicT,j,v:+D3(a[j],b[j]).toFixed(3)});
  }
  steps.sort((x,y)=>y.v-x.v);
  // full er trace getup ticks 0..55, and el trace
  const trace=getup.map(f=>({t:f.vicT,er:f.er.map(v=>+v.toFixed(3)),el:f.el.map(v=>+v.toFixed(3)),hr:f.hr.map(v=>+v.toFixed(3)),hl:f.hl.map(v=>+v.toFixed(3))}));
  // segment lengths for er/er arms in getup (need shoulders: approx from neck/rot? skip; use probe seg check separately)
  return {label,style:getup[0]&&getup[0].style,ic:getup[0]&&getup[0].ic,getupTicks:getup.length,topSteps:steps.slice(0,12),trace};
}
const out=[run('Blue throws Red (shipped)',1,0),run('Red throws Blue (shipped)',0,1)];
console.log(JSON.stringify(out,null,1));
