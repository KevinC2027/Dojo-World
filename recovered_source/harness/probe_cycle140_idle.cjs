// Cycle 140 fresh probe (body NATURAL WEIGHT rule): idle knees >=160 deg,
// per-leg, both styles; pelvis-to-foot horizontal offsets.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const angle=(a,j,b)=>{ const v1=[a[0]-j[0],a[1]-j[1],a[2]-j[2]], v2=[b[0]-j[0],b[1]-j[1],b[2]-j[2]]; const d1=Math.hypot(...v1),d2=Math.hypot(...v2); const cos=Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2])/(d1*d2))); return Math.acos(cos)*180/Math.PI; };
  const rows=[];
  for (const style of ['lunge','back']) for (const t of [0,10,20,40]) {
    const f=mk(0,0); f.style=style; f.st='idle'; f.t=t; f.y=0;
    const p=pose(f);
    const HL=[p.pel[0]+.04*(p.rotH||0),p.pel[1],p.pel[2]+.12-.009*(p.rotH||0)], HR=[p.pel[0]-.04*(p.rotH||0),p.pel[1],p.pel[2]-.12+.009*(p.rotH||0)];
    rows.push({style,t,kneeL:+angle(HL,p.kl,p.fl).toFixed(1),kneeR:+angle(HR,p.kr,p.fr).toFixed(1),pelX:+p.pel[0].toFixed(3),pelY:+p.pel[1].toFixed(3),flX:+p.fl[0].toFixed(3),frX:+p.fr[0].toFixed(3),pelToFl:+Math.abs(p.pel[0]-p.fl[0]).toFixed(3),pelToFr:+Math.abs(p.pel[0]-p.fr[0]).toFixed(3)});
  }
  return rows;
})()`, sandbox);
for (const r of out) console.log(JSON.stringify(r));
