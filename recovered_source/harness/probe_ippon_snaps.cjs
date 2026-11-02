// Snap-joint identifier for ippon rotation analysis (Kev directive Oct 31 2026).
// READ-ONLY, no video, no build change. Drives forced ippon (probe_cycle150
// pattern, update-driven) both directions and prints, for every tick with a
// victim single-joint step > 0.15 m, the joint name + step + victim state/t.
// Used to identify the joints behind the rotation-capture flags.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const D3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
for (const attAi of [1, 0]) {
  const out = vm.runInContext(`(() => {
    const a=mk(0,${attAi}), d=mk(0,${attAi ? 0 : 1});
    S=[a,d]; phase='fight'; hs=0; tm=45*60; sparks=[];
    a.x=-0.375; a.z=0; d.x=0.375; d.z=0; a.fx=1; a.fz=0; d.fx=-1; d.fz=0;
    a.ax=1; a.az=0; a.st='idle'; d.st='idle'; a.hp=100; d.hp=100;
    if(!go(a,'T')) return {ok:false};
    const cf=pose(d);
    a.hit=1; a.throwMove='ippon'; d.st='carry'; d.t=0; d.throwStyle='ippon';
    d.carryFrom=cf; d.ic='mid'; d.vy=0; d.vx=0; d.vz=0; d.rm=0; d.gy=-.08; d.kp=22;
    d.x=a.x+a.ax*0.8; d.z=a.z+a.az*0.8; d.y=0;
    const J=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
    const D3=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);
    const W=(f,q)=>[f.x+f.fx*q[0]-f.fz*q[2], f.y+q[1], f.z+f.fz*q[0]+f.fx*q[2]];
    const rows=[]; let prev=null, prevSt='carry';
    for(let i=0;i<260;i++){
      update(a,d); update(d,a);
      const p=pose(d); const w={}; for(const j of J) w[j]=W(d,p[j]);
      if(prev){
        let mj=null, ms=0;
        for(const j of J){ const s=D3(w[j],prev[j]); if(s>ms){ms=s;mj=j;} }
        if(ms>0.15) rows.push({t:i, vicSt:d.st, vicT:d.t, joint:mj, step:+ms.toFixed(3)});
      }
      prev=w; prevSt=d.st;
      if(i>60&&a.st==='idle'&&d.st==='idle') break;
    }
    return {ok:true, rows};
  })()`, sandbox);
  console.log(attAi === 1 ? 'Blue throws Red (ippon):' : 'Red throws Blue (ippon):');
  for (const r of out.rows) console.log('  tick', r.t, r.vicSt, 't=' + r.vicT, r.joint, r.step + 'm');
}
