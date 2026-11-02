// Cycle 154 diagnostic: forced ippon carry->air discontinuity, all victim joints.
const fs = require('fs'), vm = require('vm');
const path = process.argv[2];
const html = fs.readFileSync(path, 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const D3 = (p, q) => Math.hypot(p[0]-q[0], p[1]-q[1], p[2]-q[2]);
function run(label, atkStyle, defStyle, forced) {
  const res = vm.runInContext(`(() => {
    const a=mk(0,${atkStyle}),d=mk(0,${defStyle});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
    a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;
    d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
    a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
    a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
    const JOINTS=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
    const world=(f,p)=>{const o={};for(const j of JOINTS){const q=p[j];if(!q)continue;
      o[j]=[f.x+f.fx*q[0]-f.fz*q[2], f.y+q[1], f.z+f.fz*q[0]+f.fx*q[2]];}return o;};
    const frames=[];let prev='idle';
    go(a,'T');
    {const cf=pose(d);a.hit=1;a.throwMove='${forced}';d.st='carry';d.t=0;d.throwStyle='${forced}';d.carryFrom=cf;d.ic='${forced === 'ippon' ? 'mid' : forced}';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;}
    for(let tick=0;tick<120;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d),wa=world(a,pa),wd=world(d,pd);
      frames.push({tick,atkT:a.t,vicSt:d.st,vicT:d.t,wa,wd,paLocal:pa,pdLocal:pd});
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return frames;
  })()`, sandbox);
  console.log('=== '+label+' ===');
  let prev=null;
  for (const f of res) {
    const inWin = (f.vicSt==='carry' && f.vicT>=19) || (f.vicSt==='air' && f.vicT<=8);
    if (!inWin) continue;
    const fmt=v=>v.map(x=>x.toFixed(2)).join(',');
    let steps='';
    if (prev) { for (const j of ['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr']) { const s=D3(f.wd[j],prev.wd[j]); if(s>0.15) steps+=` ${j}:${s.toFixed(3)}`; } }
    console.log(`tick ${f.tick} ${f.vicSt} vicT ${f.vicT} atkT ${f.atkT} vicY ${f.wd.pel[1].toFixed(2)} steps>0.15:${steps||' none'} | vic hl ${fmt(f.wd.hl)} hr ${fmt(f.wd.hr)} el ${fmt(f.wd.el)} er ${fmt(f.wd.er)} pel ${fmt(f.wd.pel)} neck ${fmt(f.wd.neck)} | thr hl ${fmt(f.wa.hl)} hr ${fmt(f.wa.hr)}`);
    prev=f;
  }
}
run('Blue ippon Red', 0, 1, 'ippon');
run('Red ippon Blue', 1, 0, 'ippon');
