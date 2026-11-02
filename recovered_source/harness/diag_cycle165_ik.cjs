// Cycle 165 diagnostic: current IK elbow vs candidate elbow around tick 37.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const res = vm.runInContext(`(() => {
  const a=mk(0,1),d=mk(0,0);S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
  a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;
  d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;
  a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
  a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
  const frames=[]; go(a,'T');
  for(let tick=0;tick<50;tick++){
    update(a,d);update(d,a);
    const pa=pose(a);
    const rotS=pa.rotS||0;
    const SR=[pa.neck[0]-0.11*rotS,pa.neck[1]-0.05,-0.22+0.03*rotS];
    const ikEr=ik2(SR,pa.hr,0.40,0.40,-1);
    const cap=a.throwExit?a.throwExit.er:null;
    frames.push({tick,atkSt:a.st,atkT:a.t,exitT:a.throwExitT,pa:JSON.parse(JSON.stringify(pa)),SR,ikEr,cap});
  }
  return {frames};
})()`, sandbox);
for (const f of res.frames) {
  if (f.tick<31||f.tick>42) continue;
  console.log(`tick ${f.tick} ${f.atkSt}/${f.atkT} exitT ${f.exitT} neck ${f.pa.neck.map(v=>v.toFixed(2))} hr ${f.pa.hr.map(v=>v.toFixed(2))} er ${f.pa.er.map(v=>v.toFixed(2))} ikEr ${f.ikEr.map(v=>v.toFixed(2))} capEr ${f.cap?f.cap.map(v=>v.toFixed(2)):'-'} rotS ${(f.pa.rotS||0).toFixed(3)}`);
}
