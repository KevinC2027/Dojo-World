// Cycle 154 diagnostic: shipped throw per-tick grip + hand positions during carry.
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
    const frames=[];let prev='idle';
    go(a,'T');
    for(let tick=0;tick<120;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d),wa=world(a,pa),wd=world(d,pd);
      frames.push({tick,atkT:a.t,atkSt:a.st,vicSt:d.st,vicT:d.t,throwMove:a.throwMove||'',throwStyle:d.throwStyle||'',ax:a.x,ay:a.y,dx:d.x,dy:d.y,wa,wd});
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
      prev=d.st;
    }
    return frames;
  })()`, sandbox);
  console.log('=== '+label+' ===');
  for (const f of res) {
    if (f.vicSt!=='carry' && f.vicSt!=='air') continue;
    if (f.vicSt==='air' && f.vicT>8) continue;
    let mg=9, pair='';
    for (const h of ['hl','hr']) for (const j of ['hl','hr','el','er','neck','pel']) { const d=D3(f.wa[h],f.wd[j]); if(d<mg){mg=d;pair=h+'-'+j;} }
    const fmt=v=>v.map(x=>x.toFixed(2)).join(',');
    console.log(`tick ${f.tick} vicT ${f.vicT} vicSt ${f.vicSt} atkT ${f.atkT} atkSt ${f.atkSt} tm ${f.throwMove} ts ${f.throwStyle} grip ${mg.toFixed(3)} (${pair}) thrHl ${fmt(f.wa.hl)} thrHr ${fmt(f.wa.hr)} vicHl ${fmt(f.wd.hl)} vicHr ${fmt(f.wd.hr)} vicY ${f.dy.toFixed(2)} vicFlY ${f.wd.fl[1].toFixed(2)} vicFrY ${f.wd.fr[1].toFixed(2)}`);
  }
}
run('Blue throws Red shipped', 0, 1);
run('Red throws Blue shipped', 1, 0);
