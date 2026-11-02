// DQ113 THROWER FOLLOW-THROUGH AFTER THE TOSS: measure what the thrower does
// in the recovery frames after the victim is released, and at the atk->idle
// boundary. Kev 2026-10-29 ~10:12: after release the thrower must continue the
// throwing motion (arm/torso completing the throw arc and settling) rather than
// cutting back to stance while the victim flies.
// Metrics (live trials, 0.70 m, as probe_dq112):
//  (a) timeline: attacker t at victim release (carry->air), attacker t at atk->idle.
//  (b) thrower hand forward extent + pelvis/head trajectory from release through
//      atk end and the first 10 idle ticks (does the arm continue forward/down
//      then settle, or retrace/pull straight back?).
//  (c) per-tick max joint jump (local pose joints pel/neck/head/hl/hr/fl/fr +
//      IK joints when present) across the whole throw, and specifically at the
//      atk->idle boundary — a boundary jump >> the in-recovery per-tick jumps
//      is the "cut back to stance" snap.
// Usage: node probe_dq113.cjs <build.html>
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox); vm.runInContext(script,sandbox);
const JOINTS=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
const out=vm.runInContext(`(()=>{
  function trial(attAi,blue){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false,why:'go-refused'};
    const rows=[]; let prev=null, prevSt=null, releaseAttT=null, idleAttT=null, releaseRow=null;
    for(let i=0;i<120;i++){
      const defStBefore=d.st;
      update(a,d); update(d,a);
      const ap=pose(a);
      const row={i, attT:a.t, attSt:a.st, defSt:d.st, defT:d.t,
        pel:ap.pel.slice(), neck:ap.neck.slice(), head:ap.head.slice(),
        hl:ap.hl.slice(), hr:ap.hr.slice(), fl:ap.fl.slice(), fr:ap.fr.slice(),
        el:ap.el?ap.el.slice():null, er:ap.er?ap.er.slice():null,
        kl:ap.kl?ap.kl.slice():null, kr:ap.kr?ap.kr.slice():null};
      if(defStBefore==='carry'&&d.st==='air'&&releaseAttT===null){releaseAttT=a.t; releaseRow=row;}
      if(prevSt==='atk'&&a.st==='idle'&&idleAttT===null) idleAttT=a.t;
      let maxJump=null;
      if(prev){ let mx=0, mj=null; for(const j of ${JSON.stringify(JOINTS)}){ if(!prev[j]||!row[j]) continue; const dd=Math.hypot(row[j][0]-prev[j][0],row[j][1]-prev[j][1],row[j][2]-prev[j][2]); if(dd>mx){mx=dd; mj=j;} } maxJump={joint:mj, val:+mx.toFixed(3)}; }
      row.maxJump=maxJump;
      rows.push(row); prev=row; prevSt=a.st;
      if(idleAttT!==null && rows.length>0 && row.attT>=idleAttT+12) break;
    }
    return {ok:true, releaseAttT, idleAttT, rows};
  }
  return {blue:trial(1,true), red:trial(0,false)};
})()`, sandbox);
for (const [name,t] of [['BLUE',out.blue],['RED',out.red]]) {
  console.log('=====',name,'releaseAttT:',t.releaseAttT,'atk->idle attT:',t.idleAttT);
  const rel=t.rows.findIndex(r=>r.attT===t.releaseAttT&&r.defSt==='air');
  // print trajectory: release-2 .. idle+10, attacker t, state, hl/hr x+y, pel, head, maxJump
  for (const r of t.rows) {
    if (t.releaseAttT!==null && r.attT>=t.releaseAttT-2 && r.attT<=t.idleAttT+10) {
      console.log(` attT=${r.attT} ${r.attSt} def=${r.defSt} hl=[${r.hl.map(v=>v.toFixed(2)).join(',')}] hr=[${r.hr.map(v=>v.toFixed(2)).join(',')}] pel=[${r.pel.map(v=>v.toFixed(2)).join(',')}] head=[${r.head.map(v=>v.toFixed(2)).join(',')}] jump=${r.maxJump?r.maxJump.joint+':'+r.maxJump.val:'-'}`);
    }
  }
  // boundary jump + max in-recovery jump after release (excluding boundary)
  const bnd=t.rows.find(r=>r.attSt==='idle'&&r.attT===t.idleAttT);
  const afterRel=t.rows.filter(r=>r.attT>t.releaseAttT&&r.attT<t.idleAttT&&r.maxJump);
  const maxRec=afterRel.length?Math.max(...afterRel.map(r=>r.maxJump.val)):null;
  console.log(' BOUNDARY atk->idle jump:', bnd&&bnd.maxJump?bnd.maxJump.joint+':'+bnd.maxJump.val:'n/a',
    '| max per-tick jump in recovery after release (excl boundary):', maxRec,
    '| hl x at release:', t.rows.find(r=>r.attT===t.releaseAttT)?.hl[0].toFixed(3),
    '| hl x max after release (pre-idle):', Math.max(...t.rows.filter(r=>r.attT>=t.releaseAttT&&r.attT<t.idleAttT).map(r=>r.hl[0])).toFixed(3),
    '| hl x at idle+10:', t.rows.find(r=>r.attT===t.idleAttT+10)?.hl[0].toFixed(3));
}
