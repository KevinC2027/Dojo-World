// Cycle 155 diagnostic (read-only): per-tick shipped grip, closest pair, victim lift.
// Reuses the contact probe's harness + world transform; never modifies the build.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const D3 = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1], p[2]-q[2]);
const JOINTS = ['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
function run(label, atkStyle, defStyle) {
  const res = vm.runInContext(`(() => {
    const a=mk(0,${atkStyle}),d=mk(0,${defStyle});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
    a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;
    d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
    a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
    a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
    const JOINTS=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
    const world=(f,p)=>{const o={};for(const j of JOINTS){const q=p[j];if(!q)continue;
      o[j]=[f.x+f.fx*q[0]-f.fz*q[2], f.y+q[1], f.z+f.fz*q[0]+f.fx*q[2]];}return o;};
    const frames=[]; go(a,'T');
    for(let tick=0;tick<240;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d);
      frames.push({tick,atkT:a.t,atkSt:a.st,vicSt:d.st,vicT:d.t,ay:a.y,dy:d.y,wa:world(a,pa),wd:world(d,pd),paLocal:pa,pdLocal:pd,afx:a.fx,afz:a.fz,ax:a.x,az:a.z,dfx:d.fx,dfz:d.fz,dx:d.x,dz:d.z,rotSa:pa.rotS||0,rotSd:pd.rotS||0});
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return {frames};
  })()`, sandbox);
  console.log('### '+label);
  let prevHr = null;
  for (const f of res.frames) {
    if (f.vicSt !== 'carry' && f.vicSt !== 'air') { if (f.atkSt==='atk') prevHr = f.wa.hr; continue; }
    if (f.vicSt === 'air' && f.vicT > 2) break;
    let best = [9, null, null];
    for (const h of ['hl','hr']) for (const j of ['hl','hr','el','er','neck','pel']) {
      const d = D3(f.wa[h], f.wd[j]); if (d < best[0]) best = [d, h, j];
    }
    const hrStep = prevHr ? D3(f.wa.hr, prevHr).toFixed(3) : 'n/a';
    console.log(`tick ${f.tick} vicT ${f.vicT} ${f.vicSt} grip ${best[0].toFixed(3)} (${best[1]}->${best[2]}) thrHrStep ${hrStep} thrHr ${f.wa.hr.map(v=>v.toFixed(2))} vicY ${f.dy.toFixed(2)} atkT ${f.atkT}`);
    prevHr = f.wa.hr;
  }
}
run('Blue throws Red (shipped)', 1, 0);
run('Red throws Blue (shipped)', 0, 1);
