// Cycle 150 CARRY LOAD POSE (candidate comparison) - scripted harness render.
// NOT device gameplay. HARNESS-FORCED: live gameplay binding awaits Kev's style verdict, so the video forces
// defender st='carry', throwStyle='ippon' + attacker throwMove='ippon' exactly as probe_dq108_shoulder.cjs does.
// Build: prototype/index.html (PROMOTED cycle 137).
// Segments: face-off 30f; BLUE ippon throw vs RED (harness-forced at 0.70 m) 160f; RED ippon throw vs BLUE 160f. Total 350f.
// Probe timing (probe_dq126_upright_toss.cjs): forced carry 23f (release frame 23),
// air 25f, apex ~frame 32, touchdown ~frame 48, down 55f, getup, idle ~frame 160.
// ffmpeg: 60 fps = normal speed, 15 fps = ~0.25x slow motion.
const fs = require('fs'), vm = require('vm');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');
const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const BUILD = process.argv[2]; const TAG = process.argv[3];
const OUT = '/tmp/dq160-vid-'+TAG+'/frames';
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
const snaps = {};
function frame(upd) { run(upd); const buf = C.canvas.toBuffer('image/png'); fs.writeFileSync(`${OUT}/f${String(n++).padStart(4, '0')}.png`, buf); return buf; }
function shot(name, buf) { snaps[name] = buf; fs.writeFileSync(`${BASE}/hidden_files/claude-loop/shot-cycle160-${TAG}-${name}.png`, buf); }


// Face-off idle
run(`S=[mk(-1.1,0),mk(1.1,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0;`);
for (let i = 0; i < 30; i++) { const buf = frame(`update(S[0],S[1]); update(S[1],S[0]); draw();`); if (i === 15) shot('idle', buf); }

// Shipped scene: LIVE gameplay path (no forcing) - attacker go('T') at 0.75 m, defender idle.
// Timing from contact probe: hit tick 4, release tick 15, touchdown tick 36, down ends ~145.
function shippedScene(attIdx, prefix) {
  const defIdx = 1 - attIdx;
  run(`S=[mk(0,0),mk(0,1)]; phase='fight'; hs=0; tm=45*60; cmb=0; cmbT=0; sparks=[]; msgT=0; S[${attIdx}].x=0; S[${attIdx}].z=0; S[${defIdx}].x=0.75; S[${defIdx}].z=0; S[${attIdx}].fx=1; S[${attIdx}].fz=0; S[${defIdx}].fx=-1; S[${defIdx}].fz=0; S[${attIdx}].ax=1; S[${attIdx}].az=0; S[${defIdx}].ax=-1; S[${defIdx}].az=0; S[${attIdx}].st='idle'; S[${defIdx}].st='idle'; S[${attIdx}].aiT=1e9; S[${defIdx}].aiT=1e9; S[${attIdx}].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0}; S[${defIdx}].i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0}; go(S[${attIdx}],'T');`);
  for (let i = 0; i < 160; i++) {
    const buf = frame(`update(S[0],S[1]); update(S[1],S[0]); draw();`);
    if (i === 5) shot(prefix + 'grab', buf);
    if (i === 11) shot(prefix + 'spinquarter', buf);
    if (i === 14) shot(prefix + 'position', buf);
    if (i === 15) shot(prefix + 'release', buf);
    if (i === 24) shot(prefix + 'apex', buf);
    if (i === 30) shot(prefix + 'flight', buf);
    if (i === 36) shot(prefix + 'slam', buf);
    if (i === 75) shot(prefix + 'rest', buf);
  }
  console.log('shipped scene', prefix, 'defender hp', run(`S[${defIdx}].hp`), 'st', run(`S[${defIdx}].st`), 'y', run(`S[${defIdx}].y`), 'x', run(`S[${defIdx}].x`));
}
shippedScene(1, 'blue');
shippedScene(0, 'red');
console.log('total frames:', n, 'snaps:', Object.keys(snaps));
