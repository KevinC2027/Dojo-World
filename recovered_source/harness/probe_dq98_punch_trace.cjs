// DQ98 trace: why does a live sidestep evade K/L but never P?
// Per-frame: attacker t, facing, tip prev->cur, defender pos, seg distance.
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
function trace(move,variant,dist,mode,lead,delay){
  const lines=vm.runInContext(`(()=>{
    const a=mk(0,0), d=mk(0,1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=${dist}; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    ${move==='P'?`a.pc=${variant};`:`a.kc=${variant};`}
    const out=[]; let fired=false;
    const tip=()=>{ const q=pose(a), limb=${move==='P'?"((a.pn===1||a.pn===3||a.pn===4)?'hr':'hl')":"'fr'"}; const L=q[limb]; return [a.x+a.fx*L[0]-a.fz*L[2], a.y+L[1], a.z+a.fz*L[0]+a.fx*L[2]]; };
    for(let i=0;i<${lead};i++){ if(${mode==='side'?'true':'false'}&&!fired){d.i.u=1;fired=true;} update(a,d); update(d,a); d.i.u=0; }
    const goFx=a.fx, goFz=a.fz;
    const ok=go(a,'${move}');
    out.push('go ok='+ok+' aFx='+a.ax.toFixed(3)+' aFz='+a.az.toFixed(3)+' dPos=('+d.x.toFixed(3)+','+d.z.toFixed(3)+')');
    let prevTip=null;
    for(let i=0;i<30;i++){
      if(${mode==='side'?'true':'false'}&&!fired&&i>=${delay}){d.i.u=1;fired=true;}
      const hp0=d.hp;
      update(a,d);
      const cur=tip();
      const segD = prevTip? segSegHit(prevTip,cur,d,0.41) : null;
      out.push('f'+i+' aT='+a.t+' aSt='+a.st+' dPos=('+d.x.toFixed(3)+','+d.z.toFixed(3)+') dSt='+d.st+' tip=('+cur.map(v=>v.toFixed(3)).join(',')+') prevTip='+(prevTip?prevTip.map(v=>v.toFixed(3)).join(','):'-')+' segHit041='+(segD===null?'-':segD)+' hp='+d.hp+(d.hp<hp0?' HIT':''));
      prevTip=cur;
      update(d,a); d.i.u=0;
      if(a.st!=='atk') break;
    }
    return out;
  })()`, sandbox);
  console.log('=== '+move+variant+' d'+dist+' '+mode+' L'+lead+' D'+delay+' ===');
  lines.forEach(l=>console.log(l));
}
trace('P',0,0.85,'side',0,0);
trace('P',0,0.85,'side',6,0);
trace('K',0,0.85,'side',0,0);
