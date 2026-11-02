// Cycle 165 diagnostic (read-only): thrower segment lengths around victim touchdown, shipped throws both directions.
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
    for(let tick=0;tick<240;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d);
      frames.push({tick,atkT:a.t,atkSt:a.st,vicSt:d.st,vicT:d.t,pa,pd});
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return {frames};
  })()`, sandbox);
  console.log('### '+label);
  for (const f of res.frames) {
    const pa=f.pa, pd=f.pd;
    const thrUpR=D3(pa.er, pa.hr); // placeholder order checked below via local joints: shoulder is implicit; use elbow-hand
    // Segment lengths from pose joints: upper arm uses neck-offset shoulders approx; forearm is elbow-hand exactly.
    const faR=D3(pa.er, pa.hr), faL=D3(pa.el, pa.hl);
    const vicFaR=D3(pd.er, pd.hr), vicFaL=D3(pd.el, pd.hl); const thrLegL=D3(pa.kl, pa.fl), thrLegR=D3(pa.kr, pa.fr);
    const devR=Math.abs(faR-0.40), devL=Math.abs(faL-0.40);
    if (devR>0.05 || devL>0.05 || (f.vicSt==='air'&&f.vicT>=18) || (f.vicSt==='down'&&f.vicT<=3)) {
      console.log(`tick ${f.tick} atk ${f.atkSt}/${f.atkT} vic ${f.vicSt}/${f.vicT} thrFaL ${faL.toFixed(3)} thrFaR ${faR.toFixed(3)} vicFaL ${vicFaL.toFixed(3)} vicFaR ${vicFaR.toFixed(3)} thrLegL ${thrLegL.toFixed(3)} thrLegR ${thrLegR.toFixed(3)} thrEr ${pa.er.map(v=>v.toFixed(2))} thrHr ${pa.hr.map(v=>v.toFixed(2))}`);
    }
  }
  // second pass: print thrower state transitions
  let prev='';
  for (const f of res.frames) {
    const s=`${f.atkSt}/${f.atkT}`;
    if (s!==prev) { console.log(`  transition tick ${f.tick}: atk ${s} vic ${f.vicSt}/${f.vicT}`); prev=s; }
  }
}
run('Blue throws Red (shipped)', 1, 0);
run('Red throws Blue (shipped)', 0, 1);
