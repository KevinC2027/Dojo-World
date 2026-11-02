// Cycle 161 diag: lunge victim (Red throws Blue, shipped) getup ticks 0-10:
// shoulder SR, hand hr, axis u, flat vector vf (unnormalized) + magnitude vl, elbow er.
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(script,sandbox);
const res=vm.runInContext(`(()=>{const a=mk(0,0),d=mk(0,1);S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
  a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
  a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
  go(a,'T');const frames=[];let prev='idle';
  for(let tick=0;tick<300;tick++){update(a,d);update(d,a);const pd=pose(d);
    frames.push({tick,vicSt:d.st,vicT:d.t,er:pd.er.slice(),hr:pd.hr.slice(),neck:pd.neck.slice(),rotS:pd.rotS});
    if(d.st==='idle'&&prev==='getup')break;prev=d.st;}
  return frames.filter(f=>f.vicSt==='getup');})()`,sandbox);
for(const f of res.slice(0,12)){
  // SR with rotS=0 approx: [neck0, neck1-0.05, -0.22] (rotS term tiny; use pd.rotS)
  const SR=[f.neck[0]-0.11*f.rotS, f.neck[1]-0.05, -0.22+0.03*f.rotS];
  const dx=f.hr[0]-SR[0],dy=f.hr[1]-SR[1],dz=f.hr[2]-SR[2],rd=Math.hypot(dx,dy,dz);
  const u=[dx/rd,dy/rd,dz/rd], sd=-1, wu=sd*u[2];
  const vf=[-wu*u[0],-wu*u[1],sd-wu*u[2]], vl=Math.hypot(...vf);
  const vfn=vl<1e-4?[0,1,0]:vf.map(v=>v/vl);
  console.log(`t=${f.vicT} SR=[${SR.map(v=>v.toFixed(3))}] hr=[${f.hr.map(v=>v.toFixed(3))}] u=[${u.map(v=>v.toFixed(3))}] vf=[${vf.map(v=>v.toFixed(3))}] vl=${vl.toFixed(4)} vfn=[${vfn.map(v=>v.toFixed(3))}] er=[${f.er.map(v=>v.toFixed(3))}]`);
}
