// Verify the 150 ms press buffer through the REAL player path: press() itself.
// Usage: node verify_buffer150.cjs <build.html>
// V1: P tick 0 + K tick 1 (1 tick apart) -> candidate (9f) chains K@20; live (6f) expires.
// V2 (control): P tick 0 + K tick 5 -> both chain K@20.
// V3 (stun): defender jab tick 0, attacker P press tick 20 -> candidate P@27 (late fire);
//   live expires. Each trial runs twice; both runs must match exactly.
const fs = require('fs'), vm = require('vm');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');
const COLORS = { '--bg': '#eceae4', '--fg': '#1b1b1f', '--panel': '#ffffff', '--accent': '#d6452b', '--blue': '#2b6fd6', '--ring': '#d6d0c0' };
function loadBuild(path) {
  const html = fs.readFileSync(path, 'utf8');
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const canvas = createCanvas(960, 540); canvas.getContext('2d');
  canvas.getBoundingClientRect = () => ({ width: 960, height: 540 });
  canvas.addEventListener = () => {}; canvas.style = {};
  const dummy = { addEventListener() {}, classList: { add() {}, toggle() {}, remove() {} }, style: {}, dataset: {} };
  const sandbox = { console, Math, performance: { now: () => 0 }, devicePixelRatio: 1,
    getComputedStyle: () => ({ getPropertyValue: n => COLORS[n] || '' }),
    ResizeObserver: class { constructor(cb) { this.cb = cb; } observe() { this.cb(); } },
    document: { getElementById: id => (id === 'c' ? canvas : dummy), querySelectorAll: () => [], documentElement: {}, body: dummy },
    addEventListener: () => {}, requestAnimationFrame: () => {} };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox); vm.runInContext(script, sandbox);
  return { run: s => vm.runInContext(s, sandbox) };
}
function trial(build, id, setup) {
  const { run } = loadBuild(build);
  run(`S=[mk(-1.3,0),mk(1.3,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0;`);
  run(`S[0].x=0; S[0].z=0; S[1].x=0.7; S[1].z=0; S[0].fx=1; S[0].fz=0; S[1].fx=-1; S[1].fz=0; S[0].ax=1; S[0].az=0; S[1].ax=-1; S[1].az=0;`);
  run(`S[0].st='idle'; S[1].st='idle'; S[0].aiT=1e9; S[1].aiT=1e9;`);
  run(`S[0].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0}; S[1].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};`);
  run(`H0.l=0; H0.r=0; H0.u=0; H0.d=0; H0.g=0;`);
  const fires = [];
  let prevSt = 'idle', prevChain = 0;
  for (let tk = 0; tk <= setup.endTick; tk++) {
    for (const e of (setup.events[tk] || [])) run(e);
    run(`tick();`);
    const st = run(`S[0].st`), chain = run(`S[0].chainN`), mv = run(`S[0].mv===M.P?'P':S[0].mv===M.K?'K':S[0].mv===M.L?'L':S[0].mv===M.T?'T':'-'`);
    if (st === 'atk' && (prevSt !== 'atk' || chain > prevChain)) fires.push(`${mv}@${tk}`);
    prevSt = st; prevChain = chain;
  }
  return { id, fires, defHp: run(`S[1].hp`), attSt: run(`S[0].st`) };
}
const build = process.argv[2];
const trials = [
  { id: 'V1-P0-K1', endTick: 40, events: { 0: [`press('p',1);`], 1: [`press('k',1);`] } },
  { id: 'V2-P0-K5', endTick: 40, events: { 0: [`press('p',1);`], 5: [`press('k',1);`] } },
  { id: 'V3-STUN-P20', endTick: 40, events: { 0: [`S[1].i.bp=6;`], 20: [`press('p',1);`] } },
];
for (const t of trials) {
  const r1 = trial(build, t.id, t), r2 = trial(build, t.id, t);
  console.log(`${t.id}: fires=[${r1.fires.join(',')}] defHp=${r1.defHp} attSt=${r1.attSt} deterministic=${JSON.stringify(r1) === JSON.stringify(r2)}`);
}
