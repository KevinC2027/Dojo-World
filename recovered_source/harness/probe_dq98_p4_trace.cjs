// DQ98 P4 trace: per active frame, tip + forearm segment vs defender capsule.
// Attacker RED (a0, overhand pn4) and BLUE (a1, sweeping back palm pn4),
// defender sidesteps +z (u) or -z (d) at go (D0), dist 0.85.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
function trace(attAi, dir){
  const lines=vm.runInContext(`(()=>{
    const a=mk(0,${attAi}), d=mk(0,${attAi?0:1});
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.85; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.st='idle'; d.st='idle'; a.hp=100; d.hp=100; a.pc=4;
    const out=[];
    const tipW=()=>{ const limb=(a.pn===1||a.pn===3||a.pn===4)?'hr':'hl'; const q=pose(a), L=q[limb]; return [a.x+a.fx*L[0]-a.fz*L[2], a.y+L[1], a.z+a.fz*L[0]+a.fx*L[2]]; };
    const elbW=()=>{ const limb=(a.pn===1||a.pn===3||a.pn===4)?'hr':'hl'; const elimb=limb==='hl'?'el':'er'; const q=pose(a), E=q[elimb]; return [a.x+a.fx*E[0]-a.fz*E[2], a.y+E[1], a.z+a.fz*E[0]+a.fx*E[2]]; };
    go(a,'P');
    let prevTip=null;
    for(let i=0;i<20;i++){
      if(i===0) d.i['${dir}']=1;
      const hp0=d.hp; update(a,d);
      const cur=tipW(), elb=elbW();
      const tipHit = prevTip? segSegHit(prevTip,cur,d,0.41) : false;
      const armHit = segSegHit(elb,cur,d,0.365);
      out.push('f'+i+' aT='+a.t+' dPos=('+d.x.toFixed(3)+','+d.z.toFixed(3)+') dSt='+d.st+' tip=('+cur.map(v=>v.toFixed(3)).join(',')+') elb=('+elb.map(v=>v.toFixed(3)).join(',')+') tipHit='+(a.t>=a.mv.su&&a.t<a.mv.su+a.mv.ac?tipHit:'-')+' armHit='+(a.t>=a.mv.su&&a.t<a.mv.su+a.mv.ac?armHit:'-')+' hp='+d.hp+(d.hp<hp0?' HIT':''));
      prevTip=cur; update(d,a); d.i.u=0; d.i.d=0;
      if(a.st!=='atk') break;
    }
    return out;
  })()`, sandbox);
  console.log('=== P4 attAi='+attAi+' dir='+dir+' ===');
  lines.forEach(l=>console.log(l));
}
trace(0,'u'); trace(0,'d'); trace(1,'u'); trace(1,'d');
