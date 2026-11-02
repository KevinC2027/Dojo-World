// VISION GAMEPLAY VIDEO - what Muse understands Kev's combat vision to be.
// Live build ONLY: prototype/index.html (e9112cf7, cycle 155). NOT device gameplay:
// scripted harness capture (node-canvas + vm sandbox), same pattern as video_cycle159.cjs.
// Segments: (1) AI-vs-AI genuine gameplay via tick(); (2) scripted style showcase
// (Red boxing variants, Blue kicks, launcher + weighted fall, punch chain); (3) shipped
// G+P throws BOTH directions via the real go('T') path at 0.75 m; (4) closing idle.
// Every segment logs defender hp so contacts are verified, not assumed.
// ffmpeg (run after): 60 fps = normal speed, 15 fps = ~0.25x slow motion.
const fs = require('fs'), vm = require('vm');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');
const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const BUILD = BASE + '/prototype/index.html';
const OUT = '/tmp/vision-20261031/frames';
fs.mkdirSync(OUT, { recursive: true });
const COLORS = { '--bg': '#eceae4', '--fg': '#1b1b1f', '--panel': '#ffffff', '--accent': '#d6452b', '--blue': '#2b6fd6', '--ring': '#d6d0c0' };
function loadBuild(path) {
  const html = fs.readFileSync(path, 'utf8');
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const Wpx = 960, Hpx = 540;
  const canvas = createCanvas(Wpx, Hpx);
  canvas.getContext('2d');
  canvas.getBoundingClientRect = () => ({ width: Wpx, height: Hpx });
  canvas.addEventListener = () => {};
  canvas.style = {};
  const dummy = { addEventListener() {}, classList: { add() {}, toggle() {}, remove() {} }, style: {}, dataset: {} };
  const sandbox = { console, Math, performance: { now: () => 0 }, devicePixelRatio: 1,
    getComputedStyle: () => ({ getPropertyValue: n => COLORS[n] || '' }),
    ResizeObserver: class { constructor(cb) { this.cb = cb; } observe() { this.cb(); } },
    document: { getElementById: id => (id === 'c' ? canvas : dummy), querySelectorAll: () => [], documentElement: {}, body: dummy },
    addEventListener: () => {}, requestAnimationFrame: () => {} };
  sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox); vm.runInContext(script, sandbox);
  return { canvas, run: s => vm.runInContext(s, sandbox) };
}
const C = loadBuild(BUILD);
const run = C.run;
let n = 0;
function frame(upd) { run(upd); const buf = C.canvas.toBuffer('image/png'); fs.writeFileSync(`${OUT}/f${String(n++).padStart(4, '0')}.png`, buf); }
// Fresh fight state; attIdx attacks, defIdx receives. S[0]=Red (back/boxing), S[1]=Blue (lunge/kung fu).
function setup(attIdx, dist) {
  const defIdx = 1 - attIdx;
  run(`S=[mk(0,0),mk(0,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0;`);
  run(`S[${attIdx}].x=0; S[${attIdx}].z=0; S[${defIdx}].x=${attIdx === 1 ? -dist : dist}; S[${defIdx}].z=0;`);
  run(`S[${attIdx}].fx=${attIdx === 1 ? -1 : 1}; S[${attIdx}].fz=0; S[${defIdx}].fx=${attIdx === 1 ? 1 : -1}; S[${defIdx}].fz=0;`);
  run(`S[${attIdx}].ax=${attIdx === 1 ? -1 : 1}; S[${attIdx}].az=0; S[${defIdx}].ax=${attIdx === 1 ? 1 : -1}; S[${defIdx}].az=0;`);
  run(`S[${attIdx}].st='idle'; S[${defIdx}].st='idle'; S[${attIdx}].aiT=1e9; S[${defIdx}].aiT=1e9;`);
  run(`S[${attIdx}].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0}; S[${defIdx}].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};`);
  return defIdx;
}
function step(k) { for (let i = 0; i < k; i++) frame(`update(S[0],S[1]); update(S[1],S[0]); draw();`); }
function hp(i) { return run(`S[${i}].hp`); }

// --- Segment 1: genuine AI-vs-AI gameplay (tick path, default AI active) ---
run(`S=[mk(-1.3,0),mk(1.3,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0;`);
const hp0 = [hp(0), hp(1)];
for (let i = 0; i < 300; i++) frame(`tick(); cam.yaw=0;`);
console.log('AI segment hp before', hp0, 'after', [hp(0), hp(1)], 'states', run(`S[0].st`), run(`S[1].st`));

// --- Segment 2a: Red boxing variants (pc 0..3), defender idle at 0.7 m ---
for (const pc of [0, 1, 2, 3]) {
  const d = setup(0, 0.7);
  const before = hp(d);
  run(`S[0].pc=${pc}; go(S[0],'P');`);
  step(30);
  console.log('Red punch pc', pc, 'def hp', before, '->', hp(d));
}

// --- Segment 2b: Blue kicks (kc 0,1) at 1.0 m ---
for (const kc of [0, 1]) {
  const d = setup(1, 1.0);
  const before = hp(d);
  run(`S[1].kc=${kc}; go(S[1],'K');`);
  step(45);
  console.log('Blue kick kc', kc, 'def hp', before, '->', hp(d));
}

// --- Segment 2c: Blue launcher -> weighted fall -> getup -> idle ---
{
  const d = setup(1, 0.9);
  const before = hp(d);
  run(`go(S[1],'L');`);
  step(170);
  console.log('Blue launcher def hp', before, '->', hp(d), 'st', run(`S[${d}].st`));
}

// --- Segment 2d: Red punch chain (go at recovery, 3 fires) ---
{
  const d = setup(0, 0.7);
  const before = hp(d);
  for (let c = 0; c < 3; c++) { run(`go(S[0],'P');`); step(20); }
  step(20);
  console.log('Red chain def hp', before, '->', hp(d), 'cmb', run(`cmb`));
}

// --- Segment 3: shipped G+P throws, BOTH directions, real go('T') at 0.75 m ---
function shippedThrow(attIdx) {
  const d = setup(attIdx, 0.75);
  const before = hp(d);
  run(`go(S[${attIdx}],'T');`);
  step(160);
  console.log('Throw att', attIdx, 'def hp', before, '->', hp(d), 'st', run(`S[${d}].st`), 'x', run(`S[${d}].x`));
}
shippedThrow(1); // Blue throws Red
shippedThrow(0); // Red throws Blue

// --- Segment 4: closing idle face-off ---
run(`S=[mk(-1.1,0),mk(1.1,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0;`);
step(30);
console.log('total frames:', n);
