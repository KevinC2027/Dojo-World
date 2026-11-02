// DQ134 diagnostic (pre-dispatch, 2026-10-30 08:00 cycle): why does the ippon
// carry NOT read as pulled by the arm? Dump per-tick world geometry for the
// harness-forced ippon, both styles. Same setup as probe_dq126.
// Metrics: thrower hand <-> victim hand distances (grip tautness), victim
// captured-arm height above pelvis, victim arm shoulder->hand distance
// (arm reach 0.80), victim pelvis trajectory.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const out = vm.runInContext(`(() => {
  function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2], f.y+L[1], f.z+f.fz*L[0]+f.fx*L[2]];}
  function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);}
  function trial(attAi){
    const a=mk(0,attAi), d=mk(0,attAi?0:1);
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[]; msgT=0;
    a.x=0; a.z=0; d.x=0.70; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false};
    const cf=pose(d);
    a.hit=1; a.throwMove='ippon'; d.st='carry'; d.t=0; d.throwStyle='ippon';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    let rows=[];
    for(let i=0;i<30;i++){
      update(a,d); update(d,a);
      const dp=pose(d), ap=pose(a);
      const thHl=W(a,ap.hl), thHr=W(a,ap.hr), thPel=W(a,ap.pel);
      const vPel=W(d,dp.pel), vHead=W(d,dp.head), vNeck=W(d,dp.neck), vHl=W(d,dp.hl), vHr=W(d,dp.hr);
      const vEl=W(d,dp.el), vEr=W(d,dp.er);
      if(d.st==='carry'){
        rows.push({tick:i, defT:d.t,
          thHl:[+thHl[0].toFixed(2),+thHl[1].toFixed(2)], thHr:[+thHr[0].toFixed(2),+thHr[1].toFixed(2)],
          vPel:[+vPel[0].toFixed(2),+vPel[1].toFixed(2)], vHead:[+vHead[0].toFixed(2),+vHead[1].toFixed(2)],
          vHl:[+vHl[0].toFixed(2),+vHl[1].toFixed(2)], vHr:[+vHr[0].toFixed(2),+vHr[1].toFixed(2)],
          thHl_vHr:+dist(thHl,vHr).toFixed(3), thHr_vHr:+dist(thHr,vHr).toFixed(3),
          thHl_vHl:+dist(thHl,vHl).toFixed(3), thHr_vHl:+dist(thHr,vHl).toFixed(3),
          minGrip:+Math.min(dist(thHl,vHr),dist(thHr,vHr),dist(thHl,vHl),dist(thHr,vHl)).toFixed(3),
          vHrAbovePel:+(vHr[1]-vPel[1]).toFixed(3), vHlAbovePel:+(vHl[1]-vPel[1]).toFixed(3),
          neck_vHr:+dist(vNeck,vHr).toFixed(3), neck_vHl:+dist(vNeck,vHl).toFixed(3),
          vHrFwdVsPel:+((vHr[0]-vPel[0])*a.ax).toFixed(3),
          localHr:[+dp.hr[0].toFixed(2),+dp.hr[1].toFixed(2)], localHl:[+dp.hl[0].toFixed(2),+dp.hl[1].toFixed(2)],
          localPel:[+dp.pel[0].toFixed(2),+dp.pel[1].toFixed(2)]});
      }
    }
    return {rows};
  }
  return {blue: trial(1), red: trial(0)};
})()`, sandbox);
console.log(JSON.stringify(out, null, 1));
