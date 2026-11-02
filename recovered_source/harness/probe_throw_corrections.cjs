// Cycle-150 throw corrections DIAGNOSTIC (Kev directive 2026-10-31 ~00:28 CT).
// READ-ONLY: no build change. Drives the current ippon throw (throwMove='ippon')
// both directions and at two approach distances, stepping BOTH fighters per
// tick through carry -> air -> down -> getup -> idle. Measures, per tick:
//   victim head-neck distance (anatomical target 0.24), pelvis-neck (0.55),
//   max per-joint step (snap detection), grip distance (thrower hands to
//   victim body joints), foot heights, pelvis trajectories, flight torso
//   angle (rigid-horizontal detection), landing flattening, thrower balance.
// World joints use the engine's own transform (line 521):
//   W = [f.x + f.fx*q0 - f.fz*q2, f.y + q1, f.z + f.fz*q0 + f.fx*q2]
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);

const D3=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
const JOINTS=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
function world(f,p){
  const o={};
  for(const j of JOINTS){const q=p[j];if(!q)continue;
    o[j]=[f.x+f.fx*q[0]-f.fz*q[2], f.y+q[1], f.z+f.fz*q[0]+f.fx*q[2]];}
  return o;
}
function run(label, atkStyle, defStyle, dist, forced){
  const res=vm.runInContext(`(()=>{
    const a=mk(0,${atkStyle}),d=mk(0,${defStyle});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
    a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;
    d.x=${dist};d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
    a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
    a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
    const JOINTS=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
    const world=(f,p)=>{const o={};for(const j of JOINTS){const q=p[j];if(!q)continue;
      o[j]=[f.x+f.fx*q[0]-f.fz*q[2], f.y+q[1], f.z+f.fz*q[0]+f.fx*q[2]];}return o;};
    const frames=[];let hitTick=null,releaseTick=null,touchTick=null,downEnd=null;
    let prevVictimSt='idle',prevD=null;
    go(a,'T');
    ${''/* forced-ippon mirrors probe_cycle150: victim placed directly in ippon carry */}
    if(${forced?'true':'false'}){const cf=pose(d);a.hit=1;a.throwMove='ippon';d.st='carry';d.t=0;d.throwStyle='ippon';d.carryFrom=cf;d.ic='mid';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;}
    for(let tick=0;tick<240;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d),wa=world(a,pa),wd=world(d,pd);
      const f={tick,atkT:a.t,atkSt:a.st,vicSt:d.st,vicT:d.t,
        ax:a.x,ay:a.y,dx:d.x,dy:d.y,dvx:d.vx,dvy:d.vy,
        wa,wd,pa,pd,throwerHit:a.hit?1:0};
      frames.push(f);
      if(d.st==='carry'&&hitTick===null)hitTick=tick;
      if(prevVictimSt==='carry'&&d.st==='air'&&releaseTick===null)releaseTick=tick;
      if(prevVictimSt==='air'&&d.st==='down'&&touchTick===null)touchTick=tick;
      if(d.st==='idle'&&tick>0&&prevVictimSt==='getup')downEnd=tick;
      prevVictimSt=d.st;
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return {frames,hitTick,releaseTick,touchTick,downEnd};
  })()`,sandbox);
  const F=res.frames;
  // --- derived metrics ---
  const vicHN=[],vicPN=[],vicStep=[],grip=[],gripCarry=[];
  let maxHN={v:0,t:null},maxPN={v:0,t:null},maxStep={v:0,t:null,j:null};
  let hitXJump=null,releaseVel=null,apexY=-9,airTorso=[],landAngles={};
  let vicFeetLeave=null,thrFeetMax=0;
  for(let i=0;i<F.length;i++){
    const f=F[i],wd=f.wd,wa=f.wa;
    const hn=D3(wd.head,wd.neck),pn=D3(wd.pel,wd.neck);
    vicHN.push(hn);vicPN.push(pn);
    if(hn>maxHN.v)maxHN={v:+hn.toFixed(3),t:f.tick,st:f.vicSt};
    if(pn>maxPN.v)maxPN={v:+pn.toFixed(3),t:f.tick,st:f.vicSt};
    if(i>0){const g=F[i-1].wd;let ms=0,mj=null;
      for(const j of JOINTS){const s=D3(wd[j],g[j]);if(s>ms){ms=s;mj=j}}
      vicStep.push(ms);if(ms>maxStep.v)maxStep={v:+ms.toFixed(3),t:f.tick,st:f.vicSt,j:mj};}
    // grip: thrower hands to victim joints
    let mg=9;for(const h of ['hl','hr'])for(const j of ['hl','hr','el','er','neck','pel'])mg=Math.min(mg,D3(wa[h],wd[j]));
    grip.push(mg);if(f.vicSt==='carry')gripCarry.push(mg);
    // feet
    const vf=Math.min(wd.fl[1],wd.fr[1]);
    if(f.vicSt==='carry'&&vicFeetLeave===null&&vf>0.05)vicFeetLeave={tick:f.tick,vicT:f.vicT,feet:+vf.toFixed(3)};
    thrFeetMax=Math.max(thrFeetMax,wa.fl[1],wa.fr[1]);
    if(f.vicSt==='air'){
      apexY=Math.max(apexY,f.dy);
      // torso angle from vertical: neck-pel vector
      const tv=[wd.neck[0]-wd.pel[0],wd.neck[1]-wd.pel[1],wd.neck[2]-wd.pel[2]];
      const horiz=Math.hypot(tv[0],tv[2]);
      airTorso.push({tick:f.tick,ang:+(Math.atan2(horiz,tv[1])*180/Math.PI).toFixed(1),pelY:+f.dy.toFixed(3)});
    }
    if(res.releaseTick!==null&&i>0&&F[i-1].vicSt==='carry'&&f.vicSt==='air'&&!releaseVel)
      releaseVel={vx:+f.dvx.toFixed(2),vy:+f.dvy.toFixed(2),x:+f.dx.toFixed(3),y:+f.dy.toFixed(3)};
  }
  if(res.hitTick!==null){const pre=F[res.hitTick>0?res.hitTick-1:0];hitXJump=+(F[res.hitTick].dx-pre.dx).toFixed(3);}
  // rigid-horizontal run in air: angle>70deg with <2deg/tick change
  let run=0,maxRun=0,runStart=null,maxRunStart=null;
  for(let i=0;i<airTorso.length;i++){
    const a0=airTorso[i].ang,prev=i>0?airTorso[i-1].ang:a0;
    if(a0>70&&Math.abs(a0-prev)<2){if(run===0)runStart=airTorso[i].tick;run++;if(run>maxRun){maxRun=run;maxRunStart=runStart;}}
    else run=0;
  }
  // landing angles: touchdown, +3, +6, +12
  if(res.touchTick!==null){
    const at=t=>{const f=F.find(x=>x.tick===t);if(!f)return null;
      const tv=[f.wd.neck[0]-f.wd.pel[0],f.wd.neck[1]-f.wd.pel[1],f.wd.neck[2]-f.wd.pel[2]];
      return +(Math.atan2(Math.hypot(tv[0],tv[2]),tv[1])*180/Math.PI).toFixed(1);};
    landAngles={td:at(res.touchTick),plus3:at(res.touchTick+3),plus6:at(res.touchTick+6),plus12:at(res.touchTick+12)};
  }
  const airFrames=airTorso.length;
  let gripByPhase={};
  {
    // thrower grab window approx: atkT 0..14 (grab up[4,14]); carry window: victim carry ticks
    const grab=F.filter(f=>f.atkT<=14&&f.vicSt!=='idle').map(f=>grip[F.indexOf(f)]);
    const carryMin=gripCarry.length?Math.min(...gripCarry):null;
    const carryMax=gripCarry.length?Math.max(...gripCarry):null;
    gripByPhase={grabWindowMin:grab.length?+Math.min(...grab).toFixed(3):null,carryMin:carryMin!==null?+carryMin.toFixed(3):null,carryMax:carryMax!==null?+carryMax.toFixed(3):null,atRelease:null};
    if(res.releaseTick!==null){const f=F[res.releaseTick];gripByPhase.atRelease=+grip[res.releaseTick].toFixed(3);}
  }
  // victim pelvis trajectory extremes + thrower pelvis dip
  const vicPelY=F.filter(f=>f.vicSt==='carry'||f.vicSt==='air').map(f=>f.dy);
  const thrPelMin=Math.min(...F.filter(f=>f.atkSt==='atk').map(f=>f.wa.pel[1]));
  const thrPelX0=F[0].wa.pel[0], thrPelXRel=F.find(f=>f.vicSt==='air')?F.find(f=>f.vicSt==='air').wa.pel[0]:null;
  const landX=res.touchTick!==null?F[res.touchTick].dx:null;
  const relX=releaseVel?releaseVel.x:null;
  const flightDx=(landX!==null&&relX!==null)?+(landX-relX).toFixed(3):null;
  const overHN=vicHN.filter(v=>v>0.30).length, overPN=vicPN.filter(v=>v>0.65).length;
  return {label,dist,hitTick:res.hitTick,releaseTick:res.releaseTick,touchTick:res.touchTick,downEnd:res.downEnd,
    hitXJump,maxHN,maxPN,overHNframes:overHN,overPNframes:overPN,maxStep,grip:gripByPhase,
    vicFeetLeave,thrFeetMax:+thrFeetMax.toFixed(3),releaseVel,apexRootY:+apexY.toFixed(3),
    airFrames,rigidHorizRun:{ticks:maxRun,start:maxRunStart},landAngles,
    flightDx,thrPelMin:+thrPelMin.toFixed(3),thrPelX0:+thrPelX0.toFixed(3),thrPelXAtRelease:thrPelXRel!==null?+thrPelXRel.toFixed(3):null,
    vicPelYmax:+Math.max(...vicPelY).toFixed(3)};
}
const runs=[run('Blue throws Red @0.75 (SHIPPED style throw)',1,0,0.75,false),
  run('Red throws Blue @0.75 (SHIPPED style throw)',0,1,0.75,false),
  run('Blue throws Red @0.50 (SHIPPED style throw)',1,0,0.50,false),
  run('Blue throws Red @0.70 (FORCED ippon, cycle-150 lineage)',1,0,0.70,true),
  run('Red throws Blue @0.70 (FORCED ippon, cycle-150 lineage)',0,1,0.70,true)];
const out={runs};
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
