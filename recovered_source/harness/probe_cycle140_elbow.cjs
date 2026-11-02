// Cycle 140 fresh probe (body program A): sprawl-rest elbow ground penetration.
// Measures solved elbow world y (f.y=0 at touchdown, so local y) through the
// down settle, for both styles and both impact classes (mid, low/face-down,
// ippon), direct-pose and via a full launcher sequence.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const rows=[];
  for (const style of ['lunge','back']) for (const ic of ['mid','low','ippon']) {
    for (const t of [0,3,6,9,12,18,27,40]) {
      const f=mk(0,0); f.style=style; f.st='down'; f.t=t; f.ic=ic; f.rm=0; f.y=0;
      if (ic==='ippon') f.ipponAirRot=0;
      const p=pose(f);
      rows.push({style,ic,t,elY:+p.el[1].toFixed(3),erY:+p.er[1].toFixed(3),hlY:+p.hl[1].toFixed(3),hrY:+p.hr[1].toFixed(3),pelY:+p.pel[1].toFixed(3)});
    }
  }
  // full sequence: launcher, then min elbow y during down
  const seq=[];
  for (const [ax,dx] of [[0,0.9]]) {
    const a=mk(0,0), d=mk(0.9,0); S=[a,d]; phase='fight'; hs=0; tm=45*60; go(a,'L');
    let minEl=9,minEr=9,downSeen=false,restEl=null,restEr=null;
    for(let i=0;i<400;i++){ update(a,d); update(d,a); if(d.st==='down'){ downSeen=true; const p=pose(d); minEl=Math.min(minEl,p.el[1]); minEr=Math.min(minEr,p.er[1]); if(d.t>=27){restEl=p.el[1];restEr=p.er[1];} } if(i>60 && d.st==='idle') break; }
    seq.push({minEl:+minEl.toFixed(3),minEr:+minEr.toFixed(3),restEl:restEl===null?null:+restEl.toFixed(3),restEr:restEr===null?null:+restEr.toFixed(3),downSeen});
  }
  return {rows,seq};
})()`, sandbox);
for (const r of out.rows) console.log(`${r.style} ic=${r.ic} t=${r.t} elY=${r.elY} erY=${r.erY} hlY=${r.hlY} hrY=${r.hrY} pelY=${r.pelY}`);
console.log('SEQ', JSON.stringify(out.seq));
let worst=9, worstRow=null;
for (const r of out.rows) { const m=Math.min(r.elY,r.erY); if (m<worst){worst=m;worstRow=r;} }
console.log('WORST direct elbow y:', worst, JSON.stringify(worstRow));
console.log(worst>=0?'ELBOW PENETRATION: NONE (all elbows at/above ground plane)':'ELBOW PENETRATION: PRESENT (below plane)');
