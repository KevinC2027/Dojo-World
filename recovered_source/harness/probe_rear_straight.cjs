// Rear-straight analysis (Kev directive 2026-10-31 ~00:22 CT).
// Subject: BLUE pn1, DQ70 rear straight (the engine's explicitly named rear
// straight; RED's boxing cross exists as a separate move and is NOT analyzed
// here). READ-ONLY: no build change. Drive Blue vs passive Red at 0.85 m
// (P reach) through the full move: startup 6 + active 3 + recovery 10 = 19
// ticks, plus settle to idle. Per frame: pelvis, neck, head, hands, elbows,
// feet; derived: fist speed/accel, pelvis/torso speeds, rear-foot slide,
// guard-to-chin distance, elbow angle (shoulders reconstructed from the
// DQ70 branch's own rotS formula + neck: SL/SR=[neck.x +/- 0.11*rotS,
// neck.y-0.05, +/-0.22 ∓ 0.03*rotS]; rotS=-0.5*e, rotH=-0.35*e).
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{
  const a=mk(0,1),d=mk(0,0);S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
  a.x=0;a.z=0;d.x=0.85;d.z=0;d.st='idle';
  const dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
  const frames=[];
  // stance baseline (2 idle ticks)
  for(let i=0;i<2;i++){update(a,d);d.x=0.85;d.z=0;const p=pose(a);frames.push({t:-2+i,ph:'stance',pel:[...p.pel],neck:[...p.neck],head:[...p.head],hl:[...p.hl],hr:[...p.hr],el:[...p.el],er:[...p.er],fl:[...p.fl],fr:[...p.fr],st:a.st})}
  go(a,'P');a.pn=1;
  const su=a.mv.su,ac=a.mv.ac,rc=a.mv.rc;
  for(let i=0;i<su+ac+rc+30;i++){
    update(a,d);d.x=0.85;d.z=0;const p=pose(a);
    const t=a.t;
    const ph=t<su?'startup':t<su+ac?'active':t<su+ac+rc?'recovery':'settle';
    frames.push({t,ph,pel:[...p.pel],neck:[...p.neck],head:[...p.head],hl:[...p.hl],hr:[...p.hr],el:[...p.el],er:[...p.er],fl:[...p.fl],fr:[...p.fr],st:a.st});
    if(a.st==='idle'&&i>su+ac+rc)break;
  }
  // derived per-frame quantities
  const eOf=f=>f.ph==='startup'?f.t/su:f.ph==='active'?1:Math.max(0,1-(f.t-su-ac)/rc);
  for(let i=0;i<frames.length;i++){
    const f=frames[i],e=eOf(f);
    f.rotS=-0.5*e;f.rotH=-0.35*e;
    f.SL=[f.neck[0]+0.11*f.rotS,f.neck[1]-0.05,0.22-0.03*f.rotS];
    f.SR=[f.neck[0]-0.11*f.rotS,f.neck[1]-0.05,-0.22+0.03*f.rotS];
    // elbow angle at rear elbow: angle SR-er-hr
    const v1=[f.SR[0]-f.er[0],f.SR[1]-f.er[1],f.SR[2]-f.er[2]];
    const v2=[f.hr[0]-f.er[0],f.hr[1]-f.er[1],f.hr[2]-f.er[2]];
    const d1=Math.hypot(...v1),d2=Math.hypot(...v2);
    f.elbowRear=d1*d2>1e-9?+(Math.acos(Math.max(-1,Math.min(1,(v1[0]*v2[0]+v1[1]*v2[1]+v1[2]*v2[2])/(d1*d2))))*180/Math.PI).toFixed(1):null;
    f.guardToChin=+dist(f.hl,f.head).toFixed(3);
    f.pelToLead=+Math.hypot(f.pel[0]-f.fl[0],f.pel[2]-f.fl[2]).toFixed(3);
    f.pelToRear=+Math.hypot(f.pel[0]-f.fr[0],f.pel[2]-f.fr[2]).toFixed(3);
    if(i>0){const g=frames[i-1];
      f.fistSpeed=+dist(f.hr,g.hr).toFixed(3);
      f.pelSpeed=+dist(f.pel,g.pel).toFixed(3);
      f.neckSpeed=+dist(f.neck,g.neck).toFixed(3);
      f.rearFootDx=+(f.fr[0]-g.fr[0]).toFixed(3);
      if(i>1){const gg=frames[i-2];f.fistAccel=+(dist(f.hr,g.hr)-dist(g.hr,gg.hr)).toFixed(3)}
    }
  }
  const atk=frames.filter(f=>f.t>=0);
  const peak=key=>{let m=-1,mt=null;for(const f of atk){if(f[key]!=null&&f[key]>m){m=f[key];mt=f.t}}return{t:mt,val:m}};
  const firstOver=(key,th)=>{for(const f of atk){if(f[key]!=null&&f[key]>th)return f.t}return null};
  const contact=atk.find(f=>f.ph==='active');
  const stance0=frames[0],end=frames[frames.length-1];
  const endDiff={};
  for(const j of['pel','neck','head','hl','hr','fl','fr'])endDiff[j]=+dist(end[j],stance0[j]).toFixed(3);
  return{move:{su,ac,rc,total:su+ac+rc},
    peaks:{fistSpeed:peak('fistSpeed'),fistAccel:peak('fistAccel'),pelSpeed:peak('pelSpeed'),neckSpeed:peak('neckSpeed')},
    onsets:{pelSpeed:firstOver('pelSpeed',0.02),neckSpeed:firstOver('neckSpeed',0.02),fistSpeed:firstOver('fistSpeed',0.02)},
    contact:{t:contact.t,hr:contact.hr,elbowRear:contact.elbowRear,fistSpeed:contact.fistSpeed,guardToChin:contact.guardToChin,pelToLead:contact.pelToLead,pelToRear:contact.pelToRear,rearFoot:contact.fr,leadFoot:contact.fl,pel:contact.pel},
    rearFoot:{yMin:Math.min(...atk.map(f=>f.fr[1])),yMax:Math.max(...atk.map(f=>f.fr[1])),xStart:atk[0].fr[0],xEnd:atk[atk.length-1].fr[0],xSlide:+((Math.max(...atk.map(f=>f.fr[0]))-Math.min(...atk.map(f=>f.fr[0])))).toFixed(3)},
    leadFoot:{yMin:Math.min(...atk.map(f=>f.fl[1])),yMax:Math.max(...atk.map(f=>f.fl[1]))},
    guardRange:{min:Math.min(...atk.map(f=>f.guardToChin)),max:Math.max(...atk.map(f=>f.guardToChin))},
    elbowRange:{min:Math.min(...atk.map(f=>f.elbowRear)),max:Math.max(...atk.map(f=>f.elbowRear))},
    recovery:{finalSt:end.st,endDiff},
    frames:frames.map(f=>({t:f.t,ph:f.ph,pel:f.pel.map(v=>+v.toFixed(3)),neck:f.neck.map(v=>+v.toFixed(3)),head:f.head.map(v=>+v.toFixed(3)),hl:f.hl.map(v=>+v.toFixed(3)),hr:f.hr.map(v=>+v.toFixed(3)),el:f.el.map(v=>+v.toFixed(3)),er:f.er.map(v=>+v.toFixed(3)),fl:f.fl.map(v=>+v.toFixed(3)),fr:f.fr.map(v=>+v.toFixed(3)),fistSpeed:f.fistSpeed??null,fistAccel:f.fistAccel??null,pelSpeed:f.pelSpeed??null,neckSpeed:f.neckSpeed??null,elbowRear:f.elbowRear,rotS:+f.rotS.toFixed(2),rotH:+f.rotH.toFixed(2)}))};
})()`, sandbox);
console.log(JSON.stringify(out,null,1));
