// DQ98 gate probe: sidestep-at-go (D0) must EVADE every strike type, both
// styles, at 0.85 and 1.0 m; sidestep L6 (step in progress at go) likewise;
// back-walk and static cases are REPORTED, not gated (unchanged by a
// STEPV change by design, except back-walk x-distance is STEPV-independent).
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  function trial(attAi, move, variant, dist, mode, lead, delay){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=dist; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(move==='P') a.pc=variant; if(move==='K') a.kc=variant;
    let fired=false; const sk = mode==='side'?'u':(mode==='sideNeg'?'d':null);
    for(let i=0;i<lead;i++){ if(sk&&!fired){d.i[sk]=1;fired=true;} if(mode==='back')d.i.l=1; update(a,d); update(d,a); d.i.u=0; d.i.d=0; d.i.l=0; if(mode==='back')d.i.l=1; }
    if(mode==='back')d.i.l=1;
    if(!go(a,move)) return {ok:false};
    d.i.u=0;
    for(let i=0;i<50;i++){
      if(sk&&!fired&&i>=delay){d.i[sk]=1;fired=true;}
      if(mode==='back')d.i.l=1;
      update(a,d); update(d,a); d.i.u=0; d.i.d=0; d.i.l=0; if(mode==='back')d.i.l=1;
      if(a.st!=='atk') break;
    }
    return {ok:true, hp:d.hp, hit:d.hp<100};
  }
  const res={};
  for(const attAi of [0,1]) for(const dist of [0.85,1.0]){
    for(let pn=0;pn<5;pn++){ res['P'+pn+'_a'+attAi+'_d'+dist+'_sideD0']=trial(attAi,'P',pn,dist,'side',0,0); res['P'+pn+'_a'+attAi+'_d'+dist+'_sideL6']=trial(attAi,'P',pn,dist,'side',6,0); res['P'+pn+'_a'+attAi+'_d'+dist+'_sideNegD0']=trial(attAi,'P',pn,dist,'sideNeg',0,0); res['P'+pn+'_a'+attAi+'_d'+dist+'_none']=trial(attAi,'P',pn,dist,'none',0,0); }
    for(let kn=0;kn<3;kn++){ res['K'+kn+'_a'+attAi+'_d'+dist+'_sideD0']=trial(attAi,'K',kn,dist,'side',0,0); res['K'+kn+'_a'+attAi+'_d'+dist+'_sideNegD0']=trial(attAi,'K',kn,dist,'sideNeg',0,0); }
    res['L_a'+attAi+'_d'+dist+'_sideD0']=trial(attAi,'L',0,dist,'side',0,0); res['L_a'+attAi+'_d'+dist+'_sideNegD0']=trial(attAi,'L',0,dist,'sideNeg',0,0);
    res['T_a'+attAi+'_d'+dist+'_sideD0']=trial(attAi,'T',0,dist,'side',0,0); res['T_a'+attAi+'_d'+dist+'_sideNegD0']=trial(attAi,'T',0,dist,'sideNeg',0,0);
    res['T_a'+attAi+'_d'+dist+'_none']=trial(attAi,'T',0,dist,'none',0,0);
  }
  return res;
})()`, sandbox);
let pSideD0=true, pSideL6=true, kSide=true, lSide=true, tSide=true, pNone=true, tNone=true;
for(const [k,v] of Object.entries(out)){
  const hit=v.ok?v.hit:'GO-REFUSED';
  if(k.includes('_sideD0')&&k.startsWith('P')&&hit!==false) pSideD0=false;
  if(k.includes('_sideL6')&&hit!==false) pSideL6=false;
  if(k.includes('_sideD0')&&k.startsWith('K')&&hit!==false) kSide=false;
  if(k.includes('_sideD0')&&k.startsWith('L')&&hit!==false) lSide=false;
  if(k.includes('_sideD0')&&k.startsWith('T')&&hit!==false) tSide=false;
  if(k.includes('_none')&&k.startsWith('P')&&hit!==true) pNone=false;
  if(k.includes('_none')&&k.startsWith('T')&&hit!==true) tNone=false;
  console.log(k, 'hp='+(v.ok?v.hp:'-'), 'hit='+hit);
}
console.log('CHECKS', JSON.stringify({punch_sideD0_evades:pSideD0, punch_sideL6_evades:pSideL6, kick_sideD0_evades:kSide, launcher_sideD0_evades:lSide, throw_sideD0_evades:tSide, punch_none_still_hits:pNone, throw_none_still_hits:tNone}));
console.log((pSideD0&&pSideL6&&kSide&&lSide&&tSide&&pNone&&tNone)?'DQ98 GATE: PASS':'DQ98 GATE: FAIL');
