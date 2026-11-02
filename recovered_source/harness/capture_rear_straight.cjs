// Rear-straight video capture (Kev directive 2026-10-31 ~00:22 CT).
// Subject: BLUE pn1, DQ70 rear straight, vs passive Red at 0.85 m.
// Two slow-motion renders of the SAME scripted sequence: side view
// (cam.yaw=0, the engine's profile view) and three-quarter view
// (cam.yaw=0.6). HUD: phase + tick + live fist speed + chain stage +
// rear-foot status. Slow motion = each move tick held 4 frames (~0.25x);
// lead-in/settle at normal rate. Scripted harness capture of the real
// build (prototype/index.html, sha verified at run); NOT device gameplay.
// No build change.
const fs = require('fs'), vm = require('vm'), { spawn } = require('child_process');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');
const crypto = require('crypto');

const SRC = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/prototype/index.html';
const DIR = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/files';
const html = fs.readFileSync(SRC, 'utf8');
const sha = crypto.createHash('sha256').update(html).digest('hex');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];

const Wpx = 960, Hpx = 540;
const canvas = createCanvas(Wpx, Hpx);
const ctx = canvas.getContext('2d');
canvas.getBoundingClientRect = () => ({ width: Wpx, height: Hpx });
canvas.addEventListener = () => {};
canvas.style = {};
const COLORS = { '--bg': '#eceae4', '--fg': '#1b1b1f', '--panel': '#ffffff', '--accent': '#d6452b', '--blue': '#2b6fd6', '--ring': '#d6d0c0' };
const dummy = { addEventListener() {}, classList: { add() {}, toggle() {}, remove() {} }, style: {}, dataset: {} };
const sandbox = {
  console, Math, performance: { now: () => 0 },
  devicePixelRatio: 1,
  getComputedStyle: () => ({ getPropertyValue: n => COLORS[n] || '' }),
  ResizeObserver: class { constructor(cb) { this.cb = cb; } observe() { this.cb(); } },
  document: {
    getElementById: id => (id === 'c' ? canvas : dummy),
    querySelectorAll: () => [],
    documentElement: {},
    body: dummy,
  },
  addEventListener: () => {},
  requestAnimationFrame: () => {},
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(script, sandbox);
const run = s => vm.runInContext(s, sandbox);

function stageFor(ph) {
  if (ph === 'stance') return 'STANCE — BLUE rear straight (pn1, DQ70)';
  if (ph === 'startup') return 'CHAIN: rear foot drives · pelvis turns · shoulder follows';
  if (ph === 'active') return 'CONTACT: fist at full extension';
  return 'RECOVERY: return to stance';
}

async function renderView(yaw, outPath) {
  run(`cam.yaw=${yaw};`);
  // fresh fighters, Blue attacker at 0, passive Red at 0.85 (no const
  // bindings: this function runs twice in one vm context, and const
  // redeclaration would throw on the second view)
  run(`S=[mk(0,0),mk(0,1)];phase='fight';pt=200;msgT=0;hs=0;tm=45*60;sparks=[];S[1].x=0;S[1].z=0;S[0].x=0.85;S[0].z=0;S[0].st='idle';`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath]);
  ff.stderr.pipe(process.stderr);
  const writeFrames = async (buf, n) => {
    for (let i = 0; i < n; i++) {
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
  };
  let prevHr = null;
  const capture = async (phHint, tickHint, hold) => {
    run(`update(S[1],S[0])`);
    // keep Red passive and positions fixed like the probes (hit still
    // registers on its HP bar; its reaction pose never renders)
    run(`S[0].x=0.85;S[0].z=0;S[0].st='idle';`);
    run(`draw()`);
    // derive phase/tick from live engine state (go() starts t at 0 and
    // update() advances it, so caller indices would be off by one)
    let ph = phHint, tick = tickHint;
    try {
      const st = run(`S[1].st`);
      const tt = +run(`S[1].t`);
      if (st === 'atk') { ph = tt < 6 ? 'startup' : tt < 9 ? 'active' : 'recovery'; tick = tt; }
    } catch (e) { /* keep hints */ }
    let fistSpeed = 0;
    try {
      const p = JSON.parse(run(`JSON.stringify(pose(S[1]))`));
      if (prevHr) {
        const dx = p.hr[0] - prevHr[0], dy = p.hr[1] - prevHr[1], dz = p.hr[2] - prevHr[2];
        fistSpeed = Math.hypot(dx, dy, dz);
      }
      prevHr = p.hr;
      var rearY = p.fr[1];
    } catch (e) { var rearY = 0; }
    ctx.fillStyle = '#101925'; ctx.fillRect(0, 0, Wpx, 58); ctx.fillRect(0, Hpx - 68, Wpx, 68);
    ctx.textAlign = 'left'; ctx.fillStyle = '#eee7d8';
    ctx.font = '700 17px sans-serif';
    ctx.fillText('DOJO WORLD — BLUE REAR STRAIGHT (pn1, DQ70) — SLOW MOTION', 20, 24);
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#bfcbd5';
    ctx.fillText('SCRIPTED HARNESS CAPTURE OF THE REAL BUILD — NOT DEVICE GAMEPLAY', 20, 44);
    ctx.font = '700 20px sans-serif'; ctx.fillStyle = '#eee7d8';
    ctx.fillText(`${ph.toUpperCase()}  ·  tick ${ph === 'stance' ? '—' : tick}  ·  fist speed ${fistSpeed.toFixed(3)} m/frame`, 20, Hpx - 38);
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#bfcbd5';
    ctx.fillText(`${stageFor(ph)}  ·  rear foot: ${rearY <= 0.02 ? 'PLANTED' : 'lifted'}`, 20, Hpx - 14);
    await writeFrames(canvas.toBuffer('image/png'), hold);
  };
  // lead-in: idle stance, normal rate
  for (let i = 0; i < 20; i++) await capture('stance', -20 + i, 1);
  run(`go(S[1],'P');S[1].pn=1;`);
  const su = 6, ac = 3, rc = 10;
  for (let t = 0; t < su + ac + rc; t++) {
    const ph = t < su ? 'startup' : t < su + ac ? 'active' : 'recovery';
    await capture(ph, t, 4); // slow motion: each tick held 4 frames
  }
  for (let i = 0; i < 20; i++) await capture('stance', 100 + i, 1);
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', n => (n ? rej(new Error('ffmpeg exit ' + n)) : res())));
  console.log('done:', outPath);
}

(async () => {
  console.log('build sha256:', sha);
  await renderView(0, `${DIR}/Street_Dojo_Rear_Straight_Side_SlowMo_2026-10-31.mp4`);
  await renderView(0.6, `${DIR}/Street_Dojo_Rear_Straight_ThreeQuarter_SlowMo_2026-10-31.mp4`);
  console.log('capture complete');
})().catch(e => { console.error('CAPTURE FAILED:', e); process.exit(1); });
