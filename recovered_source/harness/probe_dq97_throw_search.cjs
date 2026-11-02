// DQ97 search: BLUE throw rear-hand detour family + RED straight interpolation.
// Candidate = current build with the generic M.T line replaced by two style
// branches (BLUE: idle->contact lerp for all joints except hr, which gains a
// perpendicular detour D*sin(pi*e)^p; RED: straight idle->contact lerp) plus
// BLUE er (-1) and kr (+1) pole lines gated to M.T, matching the idle poles.
// Gate (same as probe_dq83): origin<=0.02, frame1<=0.30, fluid<=0.32,
// contact core within 0.015 of the generic audit, reach, scope.
const fs = require('fs'), vm = require('vm');
const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const src = fs.readFileSync(BASE + '/prototype/index.html', 'utf8');
const GEN = "else if(m===M.T){p.hl=[.3+.47*e,1.2,.25];p.hr=[.3+.47*e,1.2,-.25];p.neck[0]+=.15*e;p.head[0]+=.2*e}";
if (!src.includes(GEN)) { console.log('GENERIC THROW LINE NOT FOUND'); process.exit(1); }
const KR_ANCHOR = "&&(f.pn||0)===4))&&f.style==='lunge')p.kr=";
const ER_ANCHOR = "||(s==='atk'&&f.mv===M.L))&&f.style==='lunge')p.er=";
if (!src.includes(KR_ANCHOR) || !src.includes(ER_ANCHOR)) { console.log('POLE ANCHORS NOT FOUND'); process.exit(1); }

function branchFor(D, px, py, p) {
  // perp (px,py) is unit-ish perpendicular to BLUE hr travel (0.99,-0.52).
  const blue = `else if(m===M.T&&f.style==='lunge'){const dt=${D}*Math.pow(Math.sin(Math.PI*e),${p});p.pel=[.10,.70+.543*e,.06+.05*e];p.neck=[.18+.06*e,1.25+.543*e,.09-.10*e];p.head=[.24+.11*e,1.49+.543*e,.09-.10*e];p.hl=[.92-.15*e,1.16+.04*e,.36-.11*e];p.hr=[-.22+.99*e+dt*${px},1.72-.52*e+dt*${py},-.38+.13*e];p.fl=[1.00-.98*e,0,.34-.13*e];p.fr=[-.70+.74*e,0,-.22+.17*e]}`;
  const red = `else if(m===M.T&&f.style==='back'){p.pel=[-.04+.14*e,1.212+.031*e,.06+.05*e];p.neck=[.03+.21*e,1.762+.031*e,-.02+.01*e];p.head=[.09+.26*e,2.002+.031*e,-.02+.01*e];p.hl=[.35+.42*e,1.972-.772*e,.16+.09*e];p.hr=[.30+.47*e,1.962-.762*e,-.17-.08*e];p.fl=[.21-.19*e,.05-.05*e,.14+.07*e];p.fr=[-.15+.19*e,0,-.11+.06*e]}`;
  return blue + ' ' + red + ' ' + GEN;
}
function build(D, px, py, p) {
  let s = src.replace(GEN, branchFor(D, px, py, p));
  s = s.replace(KR_ANCHOR, "&&(f.pn||0)===4)||(s==='atk'&&f.mv===M.T))&&f.style==='lunge')p.kr=");
  s = s.replace(ER_ANCHOR, "||(s==='atk'&&f.mv===M.T)||(s==='atk'&&f.mv===M.L))&&f.style==='lunge')p.er=");
  return s;
}
function measure(html) {
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const ctx2d = new Proxy({}, { get: () => () => {}, set: () => true });
  const elem = () => ({ getContext: () => ctx2d, getBoundingClientRect: () => ({ width: 800, height: 600 }), addEventListener: () => {}, style: {} });
  const sandbox = { document: { getElementById: elem, querySelectorAll: () => [], documentElement: {} }, getComputedStyle: () => ({ getPropertyValue: () => '#000' }), ResizeObserver: class { observe() {} }, devicePixelRatio: 1, addEventListener: () => {}, performance: { now: () => 0 }, requestAnimationFrame: () => {}, console };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox); vm.runInContext(script, sandbox);
  return vm.runInContext(`(()=>{
    const J=['pel','neck','head','hl','hr','fl','fr','el','er','kl','kr'];
    const CORE=['pel','neck','head','hl','hr','fl','fr'];
    function idle(ai,t){const f=mk(0,ai);f.st='idle';f.t=t;return pose(f)}
    function atk(ai,key,t){const f=mk(0,ai);f.st='atk';f.mv=M[key];f.pn=0;f.kn=0;f.t=t;return pose(f)}
    function atkK(ai,kn,t){const f=mk(0,ai);f.st='atk';f.mv=M.K;f.pn=kn;f.kn=kn;f.t=t;return pose(f)}
    function atkP(ai,pn,t){const f=mk(0,ai);f.st='atk';f.mv=M.P;f.pn=pn;f.kn=pn;f.t=t;return pose(f)}
    function maxD(p,q,keys){let m=0;for(const j of (keys||J)){const d=Math.hypot(p[j][0]-q[j][0],p[j][1]-q[j][1],p[j][2]-q[j][2]);if(d>m)m=d}return +m.toFixed(3)}
    function fluid(ai){let step=0,prev=null,stepT=-1,stepJ='';
      for(let t=0;t<=33;t++){const p=atk(ai,'T',t);if(prev)for(const j of J){const d=Math.hypot(p[j][0]-prev[j][0],p[j][1]-prev[j][1],p[j][2]-prev[j][2]);if(d>step){step=d;stepT=t;stepJ=j}}prev=p}
      return {step:+step.toFixed(3),stepT,stepJ}}
    function hitAt(ai,dist){const a=mk(0,ai),d=mk(dist,1-ai);S=[a,d];phase='fight';hs=0;tm=45*60;
      a.x=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;a.st='atk';a.mv=M.T;a.hit=0;a.t=5;a.prevTip=null;
      d.fx=-1;d.fz=0;d.st='idle';d.hp=100;tryHit(a,d);return {hp:d.hp,st:d.st};}
    const AUD={pel:[0.1,1.243,0.11],neck:[0.24,1.793,-0.01],head:[0.35,2.033,-0.01],hl:[0.77,1.2,0.25],hr:[0.77,1.2,-0.25],fl:[0.02,0,0.21],fr:[0.04,0,-0.05]};
    function cDiff(p){let m=0;for(const j of CORE){const d=Math.hypot(p[j][0]-AUD[j][0],p[j][1]-AUD[j][1],p[j][2]-AUD[j][2]);if(d>m)m=d}return +m.toFixed(4)}
    const IB=idle(1,0), I0=idle(0,0);
    const bF=fluid(1), rF=fluid(0);
    return {
      bO:maxD(atk(1,'T',0),IB), bF1:maxD(atk(1,'T',1),IB), bFl:bF, bC:cDiff(atk(1,'T',5)),
      bH70:hitAt(1,0.70), bH130:hitAt(1,1.30),
      rO:maxD(atk(0,'T',0),I0), rF1:maxD(atk(0,'T',1),I0), rFl:rF, rC:cDiff(atk(0,'T',5)),
      rH70:hitAt(0,0.70), rH130:hitAt(0,1.30),
      scope: { jab:maxD(atkP(0,0,0),I0), rL:maxD(atk(0,'L',0),I0), bL:maxD(atk(1,'L',0),IB),
        bPalm:maxD(atkP(1,0,0),IB), bSnap:maxD(atkK(1,0,0),IB), bSweep:maxD(atkK(1,1,0),IB), bSide:maxD(atkK(1,2,0),IB) },
    };
  })()`, sandbox);
}
function pass(m) {
  return m.bO <= 0.02 && m.bF1 <= 0.30 && m.bFl.step <= 0.32 && m.bC <= 0.015 &&
    m.bH70.hp === 78 && m.bH70.st === 'down' && m.bH130.hp === 100 &&
    m.rO <= 0.02 && m.rF1 <= 0.30 && m.rFl.step <= 0.32 && m.rC <= 0.015 &&
    m.rH70.hp === 78 && m.rH70.st === 'down' && m.rH130.hp === 100 &&
    m.scope.jab <= 0.02 && m.scope.rL <= 0.02 && m.scope.bL <= 0.02 && m.scope.bPalm <= 0.02 &&
    m.scope.bSnap <= 0.02 && m.scope.bSweep <= 0.02 && Math.abs(m.scope.bSide - 0.618) <= 0.03;
}
const PERPS = [[0.466, 0.885], [-0.466, -0.885]];
const results = [];
for (const [px, py] of PERPS)
  for (const D of [0.30, 0.35, 0.40, 0.45, 0.50])
    for (const p of [1, 1.5, 2, 2.5]) {
      const m = measure(build(D, px, py, p));
      const ok = pass(m);
      results.push({ perp: [px, py], D, p, ok, bO: m.bO, bF1: m.bF1, bFl: m.bFl, bC: m.bC, rO: m.rO, rF1: m.rF1, rFl: m.rFl, rC: m.rC });
      console.log(JSON.stringify(results[results.length - 1]));
    }
console.log('PASSES:', results.filter(r => r.ok).length, '/', results.length);
