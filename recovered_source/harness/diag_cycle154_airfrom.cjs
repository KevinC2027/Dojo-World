// Check airFrom (captured carry pose at transition) world steps vs last carry frame.
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
    const frames=[];
    go(a,'T');
    {const cf=pose(d);a.hit=1;a.throwMove='ippon';d.st='carry';d.t=0;d.throwStyle='ippon';d.carryFrom=cf;d.ic='mid';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;}
    let prev=null;
    for(let tick=0;tick<120;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d),wa=world(a,pa),wd=world(d,pd);
      const fr={tick,vicSt:d.st,vicT:d.t,wd,wa,airFrom:d.airFrom?world(d,d.airFrom):null};
      frames.push(fr);
      prev=fr;
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return frames;
  })()`, sandbox);
  const JOINTS2=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
  for(let i=1;i<res.length;i++){ if(res[i].vicSt==='air'&&res[i].vicT===0){ console.log('FIRST AIR prevTick '+res[i-1].tick); for(const j of JOINTS2){ console.log('  '+j+' lastCarry->airFrom '+D3(res[i-1].wd[j],res[i].airFrom[j]).toFixed(3)+'  lastCarry->airPose '+D3(res[i-1].wd[j],res[i].wd[j]).toFixed(3)); } break; } }
  console.log('--- '+label+' done');
}
run('Blue ippon Red', 0, 1);
run('Red ippon Blue', 1, 0);
