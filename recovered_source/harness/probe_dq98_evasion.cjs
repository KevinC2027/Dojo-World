// DQ98 (DQ27c slice 1 audit): DYNAMIC positional evasion on the current build.
// Question: does a live sidestep / back-walk, started at a given lead/delay
// relative to the attacker's go(), actually move the defender out of the
// strike's path before its active frames? Static offset (DQ88) is already
// known; this matrix is the dynamic timing behaviour, never probed before.
// Timing convention: lead>=0 = defender starts moving `lead` frames BEFORE
// attacker go(); delay>=0 = defender starts `delay` frames AFTER go().
// Modes: side (one-frame u input -> full 13-tick step), back (held l input
// = walk away), none, guard (held g).
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  function trial(move, variant, dist, mode, lead, delay){
    const a=mk(0,0), d=mk(0,1); // a=RED(back), d=BLUE(lunge) as defender; attacker RED for P/K/L/T
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=dist; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(move==='P') a.pc=variant; if(move==='K') a.kc=variant;
    let stepFired=false, zAtActive=null, hitFrame=-1;
    const fire=()=>{ if(mode==='side'){ d.i.u=1; stepFired=true; } };
    // lead phase: defender moves while attacker idles
    for(let i=0;i<lead;i++){
      if(mode==='side'&&!stepFired) fire();
      if(mode==='back') d.i.l=1;
      if(mode==='guard') d.i.g=1;
      update(a,d); update(d,a);
      d.i.u=0; d.i.d=0; d.i.l=0; d.i.r=0;
      if(mode==='back') d.i.l=1; if(mode==='guard') d.i.g=1;
    }
    if(mode==='back') d.i.l=1; if(mode==='guard') d.i.g=1;
    const ok=go(a,move);
    if(!ok) return {ok:false};
    d.i.u=0;
    for(let i=0;i<50;i++){
      if(mode==='side'&&!stepFired&&i>=delay) fire();
      if(mode==='back') d.i.l=1; if(mode==='guard') d.i.g=1;
      const wasHp=d.hp;
      update(a,d);
      if(zAtActive===null && a.st==='atk' && a.t>=a.mv.su) zAtActive=+d.z.toFixed(3);
      if(d.hp<wasHp && hitFrame<0) hitFrame=i;
      update(d,a);
      d.i.u=0; d.i.d=0; d.i.l=0; d.i.r=0;
      if(mode==='back') d.i.l=1; if(mode==='guard') d.i.g=1;
      if(a.st!=='atk') break;
    }
    return {ok:true, hp:d.hp, hit: d.hp<100, hitFrame, zAtActive, zEnd:+d.z.toFixed(3), dSt:d.st};
  }
  const res={};
  const moves=[['P',0],['P',2],['K',0],['K',1],['L',0],['T',0]];
  for(const [mv,vn] of moves) for(const dist of [0.85,1.0]){
    for(const [mode,lead,delay] of [['none',0,0],['side',13,0],['side',6,0],['side',0,0],['side',0,3],['back',13,0],['back',0,0],['guard',0,0]]){
      const k=mv+vn+'_d'+dist+'_'+mode+'_L'+lead+'_D'+delay;
      res[k]=trial(mv,vn,dist,mode,lead,delay);
    }
  }
  return res;
})()`, sandbox);
for(const [k,v] of Object.entries(out)){
  console.log(k, v.ok?`hp=${v.hp} hit=${v.hit} hitFrame=${v.hitFrame} zActive=${v.zAtActive} zEnd=${v.zEnd} st=${v.dSt}`:'GO-REFUSED');
}
