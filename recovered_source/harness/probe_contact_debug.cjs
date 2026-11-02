// One-off verification for contact-consistency segment deviations.
// Prints actual world joint coordinates at flagged ticks to confirm the
// deviations are real pose data, not reconstruction artifacts.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox); vm.runInContext(script, sandbox);
const D3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const JOINTS = ['pel', 'neck', 'head', 'hl', 'hr', 'el', 'er', 'kl', 'kr', 'fl', 'fr'];
function run(label, atkStyle, defStyle, forced, wantTicks) {
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
    if(${forced ? `'${forced}'` : 'null'}){const cf=pose(d);a.hit=1;a.throwMove='${forced}';d.st='carry';d.t=0;d.throwStyle='${forced}';d.carryFrom=cf;d.ic='${forced === 'ippon' ? 'mid' : forced}';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;}
    for(let tick=0;tick<240;tick++){
      update(a,d);update(d,a);
      const pa=pose(a),pd=pose(d);
      frames.push({tick,atkSt:a.st,vicSt:d.st,vicT:d.t,wa:world(a,pa),wd:world(d,pd),
        afx:a.fx,afz:a.fz,ax:a.x,ay:a.y,az:a.z,dfx:d.fx,dfz:d.fz,dx:d.x,dy:d.y,dz:d.z,
        rotSa:pa.rotS||0,rotHa:pa.rotH||0,rotSd:pd.rotS||0,rotHd:pd.rotH||0,paLocal:pa,pdLocal:pd});
      if(tick>60&&a.st==='idle'&&d.st==='idle')break;
    }
    return {frames};
  })()`, sandbox);
  const W = (f, side) => {
    const loc = side === 'a' ? f.paLocal : f.pdLocal;
    const rotS = side === 'a' ? f.rotSa : f.rotSd, rotH = side === 'a' ? f.rotHa : f.rotHd;
    const fx = side === 'a' ? f.afx : f.dfx, fz = side === 'a' ? f.afz : f.dfz;
    const rx = side === 'a' ? f.ax : f.dx, ry = side === 'a' ? f.ay : f.dy, rz = side === 'a' ? f.az : f.dz;
    const T = (q) => [rx + fx * q[0] - fz * q[2], ry + q[1], rz + fz * q[0] + fx * q[2]];
    const w = side === 'a' ? f.wa : f.wd;
    return { ...w,
      SL: T([loc.neck[0] + .11 * rotS, loc.neck[1] - .05, .22 - .03 * rotS]),
      SR: T([loc.neck[0] - .11 * rotS, loc.neck[1] - .05, -.22 + .03 * rotS]),
      HL: T([loc.pel[0] + .04 * rotH, loc.pel[1], loc.pel[2] + .12 - .009 * rotH]),
      HR: T([loc.pel[0] - .04 * rotH, loc.pel[1], loc.pel[2] - .12 + .009 * rotH]) };
  };
  console.log('### ' + label);
  for (const t of wantTicks) {
    const f = res.frames.find(x => x.tick === t);
    if (!f) { console.log(' tick', t, 'not found'); continue; }
    const wa = W(f, 'a'), wd = W(f, 'd');
    console.log(' tick', t, 'atkSt', f.atkSt, 'vicSt', f.vicSt, 'vicT', f.vicT);
    console.log('  THR SR', wa.SR.map(v => +v.toFixed(3)), 'er', wa.er.map(v => +v.toFixed(3)), 'hr', wa.hr.map(v => +v.toFixed(3)),
      '| SR-hr', +D3(wa.SR, wa.hr).toFixed(3), 'foreArmR', +D3(wa.er, wa.hr).toFixed(3));
    console.log('  VIC HL', wd.HL.map(v => +v.toFixed(3)), 'kl', wd.kl.map(v => +v.toFixed(3)), 'fl', wd.fl.map(v => +v.toFixed(3)),
      '| thighL', +D3(wd.HL, wd.kl).toFixed(3), 'shinL', +D3(wd.kl, wd.fl).toFixed(3));
    console.log('  VIC HR', wd.HR.map(v => +v.toFixed(3)), 'kr', wd.kr.map(v => +v.toFixed(3)), 'fr', wd.fr.map(v => +v.toFixed(3)),
      '| thighR', +D3(wd.HR, wd.kr).toFixed(3), 'shinR', +D3(wd.kr, wd.fr).toFixed(3));
    console.log('  VIC pel', wd.pel.map(v => +v.toFixed(3)), 'neck', wd.neck.map(v => +v.toFixed(3)),
      'THR pel', wa.pel.map(v => +v.toFixed(3)), 'neck', wa.neck.map(v => +v.toFixed(3)));
  }
}
run('Shipped Blue throws Red', 1, 0, null, [36]);
run('Forced ippon Blue throws Red', 1, 0, 'ippon', [21, 22]);
