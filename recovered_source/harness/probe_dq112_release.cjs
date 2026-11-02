// DQ112 GRIP-RELEASE AUDIT: live Blue arm-grab + Red clinch, grip hold through
// release AND clean separation after release. One behavior audited, no code change
// by design in this probe: (a) grip <=0.35 from attacker t11 through last carry tick
// (the DQ111 honest live criterion, closing the DQ110 live slices); (b) after the
// defender leaves carry into air, the thrower hand must separate from the grip
// point (distance grows, >0.50 by air tick 3) — a hand that tracks the victim into
// flight would read as dragging, not a toss.
// Usage: node probe_dq112_release.cjs <build.html>
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2], f.y+L[1], f.z+f.fz*L[0]+f.fx*L[2]];}
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
  function trial(attAi,blue){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false,why:'go-refused'};
    let carry=[], air=[], sawIdleAfter=false, sawGetup=false;
    for(let i=0;i<400;i++){
      update(a,d); update(d,a);
      const dp=pose(d), ap=pose(a);
      const thl=W(a,ap.hl), thr=W(a,ap.hr);
      const vHr=W(d,dp.hr), vPel=W(d,dp.pel);
      if(d.st==='carry') carry.push({attT:a.t, grip:+(blue?dist(thl,vHr):Math.min(dist(thl,vPel),dist(thr,vPel))).toFixed(3)});
      if(d.st==='air' && air.length<6) air.push({airTick:air.length, attT:a.t, grip:+(blue?dist(thl,vHr):Math.min(dist(thl,vPel),dist(thr,vPel))).toFixed(3), defX:+d.x.toFixed(3), defY:+d.y.toFixed(3)});
      if(d.st==='getup') sawGetup=true;
      if(sawGetup && d.st==='idle') sawIdleAfter=true;
      if(sawIdleAfter) break;
    }
    const hold=carry.filter(r=>r.attT>=11);
    return {ok:true, hp:d.hp, sawIdleAfter, carry, holdMax: hold.length?+Math.max(...hold.map(r=>r.grip)).toFixed(3):null, holdLast: hold.length?hold[hold.length-1].grip:null, air};
  }
  const b=trial(1,true), r=trial(0,false);
  return {blue:b, red:r};
})()`, sandbox);
for (const [name,t] of [['BLUE',out.blue],['RED',out.red]]) {
  console.log('=====',name,'hp:',t.hp,'sawIdleAfter:',t.sawIdleAfter,'holdMax(t>=11):',t.holdMax,'holdLast:',t.holdLast);
  console.log(' carry:', t.carry.map(r=>r.attT+':'+r.grip).join(' '));
  console.log(' air:', t.air.map(r=>'a'+r.airTick+'(attT'+r.attT+'):'+r.grip+' def('+r.defX+','+r.defY+')').join(' '));
  const a3=t.air[3];
  console.log(' GATE hold<=0.35:', t.holdMax<=0.35?'PASS':'FAIL', '| airTick3 separation>0.50:', a3&&a3.grip>0.50?'PASS':'FAIL', '('+(a3?a3.grip:'n/a')+')');
}
