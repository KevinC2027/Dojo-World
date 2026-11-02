// Cycle 166 diagnostic (same harness as 165): thrower elbow steps + forearm lengths during throw-exit window.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
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
    const frames=[]; go(a,'T');
    for(let tick=0;tick<60;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d);
      frames.push({tick,atkSt:a.st,atkT:a.t,vicSt:d.st,vicT:d.t,pa,pd,exitT:a.throwExitT});
    }
    return {frames};
  })()`, sandbox);
  console.log('### '+label);
  let prev=null, maxEl=0, maxEr=0, maxFaDev=0;
  for (const f of res.frames) {
    if (f.tick<30||f.tick>48) continue;
    const faL=D3(f.pa.el,f.pa.hl), faR=D3(f.pa.er,f.pa.hr);
    maxFaDev=Math.max(maxFaDev, Math.abs(faL-0.40), Math.abs(faR-0.40));
    let sEl='-', sEr='-';
    if (prev) { sEl=D3(f.pa.el,prev.pa.el).toFixed(3); sEr=D3(f.pa.er,prev.pa.er).toFixed(3); maxEl=Math.max(maxEl,+sEl); maxEr=Math.max(maxEr,+sEr); }
    console.log(`tick ${f.tick} atk ${f.atkSt}/${f.atkT} exitT ${f.exitT} faL ${faL.toFixed(3)} faR ${faR.toFixed(3)} elStep ${sEl} erStep ${sEr} er ${f.pa.er.map(v=>v.toFixed(2))}`);
    prev=f;
  }
  console.log(`MAX window elStep ${maxEl.toFixed(3)} erStep ${maxEr.toFixed(3)} faDev ${maxFaDev.toFixed(3)}`);
}
run('Blue throws Red (shipped)', 1, 0);
run('Red throws Blue (shipped)', 0, 1);
