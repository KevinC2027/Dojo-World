// Cycle 151 baseline capture (Kev-approved throw corrections program, Oct 31 2026).
// Subjects: the ACTUAL G+P throws via the real press() input path -> go('T') ->
// tryHit -> style throw tables. NOT forced ippon. Both directions, side +
// three-quarter slow-mo, with diagnostics overlay drawn AFTER the engine render:
//   - grip anchor: line between the closest thrower-hand / victim-joint pair + distance
//   - foot contacts: dots, green = grounded (world y <= 0.06), red = airborne
//   - pelvis trajectories: fading trails, cyan = thrower, amber = victim
//   - head-neck: victim neck->head segment, red if > 0.30 m, with distance label
//   - HUD: states, ticks, grip distance, head-neck distance
// NO BUILD CHANGE in this cycle. Scripted harness capture, NOT device gameplay.
// Slow-mo: 1 sim tick per 2 video frames (0.25x) at 30 fps.
const fs = require('fs'), vm = require('vm'), { spawn } = require('child_process');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');

const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const SRC = BASE + '/prototype/index.html';
const EVID = BASE + '/hidden_files/claude-loop/throw_baseline_evidence_20261031.json';
const html = fs.readFileSync(SRC, 'utf8');
const sha = require('crypto').createHash('sha256').update(html).digest('hex');
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

const DIAG = `(()=>{const J=['pel','neck','head','hl','hr','el','er','fl','fr'];
const W=(f,q)=>[f.x+f.fx*q[0]-f.fz*q[2],f.y+q[1],f.z+f.fz*q[0]+f.fx*q[2]];
const one=f=>{const p=pose(f);const w={},s={};
 for(const j of J){const q=p[j];if(!q)continue;w[j]=W(f,q);const pr=P(w[j][0],w[j][1],w[j][2]);s[j]=[pr.x,pr.y];}
 return {st:f.st,t:f.t,x:f.x,y:f.y,hp:f.hp,w,s};};
return JSON.stringify({a:one(S[0]),b:one(S[1])});})()`;
const D3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

const RUNS = [
  { label: 'Red throws Blue', swap: false, yaw: 0, view: 'Side', file: BASE + '/files/Street_Dojo_ThrowBaseline_RedThrowsBlue_Side_SlowMo_2026-10-31.mp4' },
  { label: 'Red throws Blue', swap: false, yaw: 0.6, view: 'ThreeQuarter', file: BASE + '/files/Street_Dojo_ThrowBaseline_RedThrowsBlue_ThreeQuarter_SlowMo_2026-10-31.mp4' },
  { label: 'Blue throws Red', swap: true, yaw: 0, view: 'Side', file: BASE + '/files/Street_Dojo_ThrowBaseline_BlueThrowsRed_Side_SlowMo_2026-10-31.mp4' },
  { label: 'Blue throws Red', swap: true, yaw: 0.6, view: 'ThreeQuarter', file: BASE + '/files/Street_Dojo_ThrowBaseline_BlueThrowsRed_ThreeQuarter_SlowMo_2026-10-31.mp4' },
];

function overlay(r, t, th, vi, grip, gripPair, hn, vicFeetMin, trailT, trailV) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#101925'; ctx.fillRect(0, 0, Wpx, 58); ctx.fillRect(0, Hpx - 68, Wpx, 68);
  ctx.fillStyle = '#eee7d8'; ctx.font = '700 17px sans-serif';
  ctx.fillText(`THROW BASELINE — ${r.label} — ${r.view} slow-mo — build 6c9b0e06`, 20, 24);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#bfcbd5';
  ctx.fillText('ACTUAL G+P THROW (real input path) — SCRIPTED HARNESS CAPTURE — NOT DEVICE GAMEPLAY', 20, 44);
  ctx.font = '700 15px sans-serif'; ctx.fillStyle = '#eee7d8';
  ctx.fillText(`tick ${t} | thrower ${th.st} t=${th.t} | victim ${vi.st} t=${vi.t} | grip ${grip.toFixed(2)}m | head-neck ${hn.toFixed(3)}m | victim feet ${vicFeetMin.toFixed(2)}m`, 20, Hpx - 40);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#bfcbd5';
  ctx.fillText('yellow line = grip anchor | green dot = foot grounded, red dot = foot airborne | cyan trail = thrower pelvis, amber trail = victim pelvis | head-neck red if > 0.30m', 20, Hpx - 14);
  // pelvis trails
  const trail = (pts, col) => {
    for (let i = 1; i < pts.length; i++) {
      ctx.strokeStyle = col; ctx.globalAlpha = (i / pts.length) * 0.85; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  trail(trailT, '#35c4ff'); trail(trailV, '#ffb020');
  // grip line
  if (gripPair) {
    ctx.strokeStyle = '#ffe600'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(gripPair[0][0], gripPair[0][1]); ctx.lineTo(gripPair[1][0], gripPair[1][1]); ctx.stroke();
    ctx.fillStyle = '#ffe600'; ctx.font = '700 13px sans-serif';
    ctx.fillText(grip.toFixed(2) + 'm', (gripPair[0][0] + gripPair[1][0]) / 2 + 6, (gripPair[0][1] + gripPair[1][1]) / 2 - 6);
  }
  // foot dots
  const dot = (xy, grounded) => {
    ctx.beginPath(); ctx.arc(xy[0], xy[1], 6, 0, Math.PI * 2);
    ctx.fillStyle = grounded ? '#2ecc71' : '#ff4444'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#101925'; ctx.stroke();
  };
  dot(th.s.fl, th.w.fl[1] <= 0.06); dot(th.s.fr, th.w.fr[1] <= 0.06);
  dot(vi.s.fl, vi.w.fl[1] <= 0.06); dot(vi.s.fr, vi.w.fr[1] <= 0.06);
  // victim head-neck
  ctx.strokeStyle = hn > 0.30 ? '#ff2222' : '#ffd23f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(vi.s.neck[0], vi.s.neck[1]); ctx.lineTo(vi.s.head[0], vi.s.head[1]); ctx.stroke();
  ctx.fillStyle = hn > 0.30 ? '#ff2222' : '#ffd23f'; ctx.font = '700 13px sans-serif';
  ctx.fillText(hn.toFixed(3) + 'm', vi.s.head[0] + 8, vi.s.head[1] - 8);
}

(async () => {
  const evidence = [{ build: SRC, sha256: sha, note: 'Cycle 151 baseline: actual G+P throws, no build change' }];
  for (const r of RUNS) {
    run(`reset(1);`);
    run(`phase='fight'; pt=200; msgT=0;`);
    if (r.swap) run(`S=[S[1],S[0]];`);
    run(`S[0].x=-0.375;S[0].z=0;S[1].x=0.375;S[1].z=0;S[0].fx=1;S[0].fz=0;S[0].ax=1;S[0].az=0;S[1].fx=-1;S[1].fz=0;S[1].ax=-1;S[1].az=0;S[0].hp=100;S[1].hp=100;S[1].aiT=999;`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', r.file]);
    ff.stderr.pipe(process.stderr);
    const trailT = [], trailV = [], log = [];
    let thrown = false, settle = 0, simTicks = 0, frames = 0, threwAt = null;
    for (let t = 0; t < 260; t++) {
      simTicks = t;
      if (t === 20) run(`press('g',1);press('p',1);`);
      if (t === 45) run(`press('g',0);`);
      run(`S[1].aiT=999;`);
      run(`tick();`);
      run(`cam.yaw=${r.yaw};`);
      run(`draw();`);
      const d = JSON.parse(run(DIAG));
      const th = d.a, vi = d.b;
      if (vi.st === 'carry' && !thrown) { thrown = true; threwAt = t; }
      let grip = 9, gripPair = null;
      for (const h of ['hl', 'hr']) for (const j of ['hl', 'hr', 'el', 'er', 'neck', 'pel']) {
        const dd = D3(th.w[h], vi.w[j]);
        if (dd < grip) { grip = dd; gripPair = [th.s[h], vi.s[j]]; }
      }
      const hn = D3(vi.w.head, vi.w.neck);
      const pn = D3(vi.w.pel, vi.w.neck);
      const vicFeetMin = Math.min(vi.w.fl[1], vi.w.fr[1]);
      log.push({ t, atkSt: th.st, atkT: th.t, vicSt: vi.st, vicT: vi.t, grip: +grip.toFixed(3), hn: +hn.toFixed(3), pn: +pn.toFixed(3), vicFeetMin: +vicFeetMin.toFixed(3) });
      trailT.push(th.s.pel); if (trailT.length > 150) trailT.shift();
      trailV.push(vi.s.pel); if (trailV.length > 150) trailV.shift();
      overlay(r, t, th, vi, grip, gripPair, hn, vicFeetMin, trailT, trailV);
      const png = canvas.toBuffer('image/png');
      for (let k = 0; k < 2; k++) {
        if (!ff.stdin.write(png)) await new Promise(res => ff.stdin.once('drain', res));
        frames++;
      }
      if (thrown && th.st === 'idle' && vi.st === 'idle') { settle++; if (settle >= 10) break; }
    }
    run(`press('g',0);`);
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', n => (n ? rej(new Error('ffmpeg exit ' + n)) : res())));
    const thrownLog = log.filter(x => x.vicSt !== 'idle' || x.t >= (threwAt || 0));
    const maxHN = Math.max(...log.map(x => x.hn));
    const maxPN = Math.max(...log.map(x => x.pn));
    const relIdx = log.findIndex((x, i) => i > 0 && log[i - 1].vicSt === 'carry' && x.vicSt === 'air');
    const feetLeave = log.find(x => x.vicSt === 'carry' && x.vicFeetMin > 0.05);
    const endState = JSON.parse(run(`JSON.stringify({st:[S[0].st,S[1].st],hp:[Math.round(S[0].hp*10)/10,Math.round(S[1].hp*10)/10],x:[S[0].x,S[1].x]})`));
    evidence.push({ run: r.label, view: r.view, file: r.file, simTicks, frames, threwAt,
      maxHeadNeck: +maxHN.toFixed(3), maxPelvisNeck: +maxPN.toFixed(3),
      gripAtRelease: relIdx >= 0 ? log[relIdx].grip : null,
      gripMinCarry: (() => { const c = log.filter(x => x.vicSt === 'carry').map(x => x.grip); return c.length ? +Math.min(...c).toFixed(3) : null; })(),
      gripMaxCarry: (() => { const c = log.filter(x => x.vicSt === 'carry').map(x => x.grip); return c.length ? +Math.max(...c).toFixed(3) : null; })(),
      feetLeaveTick: feetLeave ? feetLeave.t : null, endState });
    console.log('run done:', r.label, r.view, 'simTicks', simTicks, 'frames', frames, 'maxHN', maxHN.toFixed(3), 'end', JSON.stringify(endState));
  }
  fs.writeFileSync(EVID, JSON.stringify(evidence, null, 2));
  console.log('capture complete');
})().catch(e => { console.error('CAPTURE FAILED:', e); process.exit(1); });
