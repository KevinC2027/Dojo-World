// Ippon rotation analysis capture (Kev directive Oct 31 2026 ~00:59 CT).
// Subjects: the TWO cycle-150 sequences — forced ippon, Blue throws Red and
// Red throws Blue (harness-forced, as in probe_cycle150; NOT gameplay G+P).
// Side + three-quarter slow-mo with a ROTATION overlay drawn after the engine
// render: victim pelvis position + trail, torso line (pelvis->neck->head),
// torso angle, pitch + yaw angular velocity, live sparkline, and red flags
// for angle jumps, angular-velocity reversals, unexplained accelerations,
// and joint snaps. NO BUILD CHANGE. Scripted harness capture, NOT device
// gameplay. Drive uses update() directly (as the cycle probes did), so the
// tick() separation push does not distort the carry anchoring.
// Slow-mo: 1 sim tick per 2 video frames (0.25x) at 30 fps.
const fs = require('fs'), vm = require('vm'), { spawn } = require('child_process');
const { createCanvas } = require('/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept/hidden_files/incoming-20261019/original-source/node_modules/@napi-rs/canvas');

const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const SRC = BASE + '/prototype/index.html';
const EVID = BASE + '/hidden_files/claude-loop/ippon_rotation_evidence_20261031.json';
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
 return {st:f.st,t:f.t,x:f.x,y:f.y,vx:f.vx,vy:f.vy,hp:f.hp,w,s};};
return JSON.stringify({a:one(S[0]),b:one(S[1])});})()`;
const D3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const torsoAngle = w => {
  const v = [w.neck[0] - w.pel[0], w.neck[1] - w.pel[1], w.neck[2] - w.pel[2]];
  return Math.atan2(Math.hypot(v[0], v[2]), v[1]);
};
const azimuth = w => Math.atan2(w.head[2] - w.pel[2], w.head[0] - w.pel[0]);
const unwrap = (prev, cur) => {
  let d = cur - prev;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

const RUNS = [
  { label: 'Blue throws Red (ippon)', swap: true, yaw: 0, view: 'Side', file: BASE + '/files/Street_Dojo_IpponRotation_BlueThrowsRed_Side_SlowMo_2026-10-31.mp4' },
  { label: 'Blue throws Red (ippon)', swap: true, yaw: 0.6, view: 'ThreeQuarter', file: BASE + '/files/Street_Dojo_IpponRotation_BlueThrowsRed_ThreeQuarter_SlowMo_2026-10-31.mp4' },
  { label: 'Red throws Blue (ippon)', swap: false, yaw: 0, view: 'Side', file: BASE + '/files/Street_Dojo_IpponRotation_RedThrowsBlue_Side_SlowMo_2026-10-31.mp4' },
  { label: 'Red throws Blue (ippon)', swap: false, yaw: 0.6, view: 'ThreeQuarter', file: BASE + '/files/Street_Dojo_IpponRotation_RedThrowsBlue_ThreeQuarter_SlowMo_2026-10-31.mp4' },
];

function overlay(r, t, th, vi, m, trailV, flags) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#101925'; ctx.fillRect(0, 0, Wpx, 58); ctx.fillRect(0, Hpx - 88, Wpx, 88);
  ctx.fillStyle = '#eee7d8'; ctx.font = '700 17px sans-serif';
  ctx.fillText(`IPPON ROTATION — ${r.label} — ${r.view} slow-mo — build 6c9b0e06`, 20, 24);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#bfcbd5';
  ctx.fillText('FORCED IPPON (harness) — NOT GAMEPLAY G+P — SCRIPTED HARNESS CAPTURE — NOT DEVICE GAMEPLAY', 20, 44);
  ctx.font = '700 15px sans-serif'; ctx.fillStyle = '#eee7d8';
  ctx.fillText(`tick ${t} | victim ${vi.st} t=${vi.t} | pelvis (${m.pelX.toFixed(2)}, ${m.pelY.toFixed(2)}) | torso ${m.torsoDeg.toFixed(1)}deg | w_pitch ${m.wPitch.toFixed(1)} rad/s | w_yaw ${m.wYaw.toFixed(1)} rad/s`, 20, Hpx - 62);
  ctx.font = '12px sans-serif'; ctx.fillStyle = flags.length ? '#ff5555' : '#bfcbd5';
  ctx.fillText(flags.length ? `FLAG: ${flags.join(' | ')}` : 'no flag this tick  |  white line = victim torso (pelvis-neck-head)  |  amber trail = victim pelvis  |  sparkline = w_pitch history', 20, Hpx - 40);
  ctx.font = '12px sans-serif'; ctx.fillStyle = '#bfcbd5';
  ctx.fillText(`thrower pelvis y ${m.thrPelY.toFixed(2)} | thrower torso ${m.thrTorsoDeg.toFixed(1)}deg`, 20, Hpx - 18);
  // victim pelvis trail
  for (let i = 1; i < trailV.length; i++) {
    ctx.strokeStyle = '#ffb020'; ctx.globalAlpha = (i / trailV.length) * 0.85; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(trailV[i - 1][0], trailV[i - 1][1]); ctx.lineTo(trailV[i][0], trailV[i][1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // victim torso line + pelvis dot
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(vi.s.pel[0], vi.s.pel[1]); ctx.lineTo(vi.s.neck[0], vi.s.neck[1]); ctx.lineTo(vi.s.head[0], vi.s.head[1]); ctx.stroke();
  ctx.beginPath(); ctx.arc(vi.s.pel[0], vi.s.pel[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#ffb020'; ctx.fill();
  // w_pitch sparkline (bottom-right box)
  const bx = Wpx - 250, by = Hpx - 84, bw = 230, bh = 64;
  ctx.fillStyle = '#0a0f16'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#445060'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
  ctx.strokeStyle = '#667788';
  ctx.beginPath(); ctx.moveTo(bx, by + bh / 2); ctx.lineTo(bx + bw, by + bh / 2); ctx.stroke();
  const hist = m.wHist;
  if (hist.length > 1) {
    ctx.strokeStyle = '#35c4ff'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < hist.length; i++) {
      const x = bx + (i / Math.max(1, hist.length - 1)) * bw;
      const y = by + bh / 2 - Math.max(-1, Math.min(1, hist[i] / 15)) * (bh / 2 - 2);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#bfcbd5'; ctx.font = '11px sans-serif';
  ctx.fillText('w_pitch rad/s (+/-15)', bx + 6, by + 12);
}

(async () => {
  const evidence = [{ build: SRC, sha256: sha, note: 'Ippon rotation analysis: forced ippon both directions, no build change' }];
  for (const r of RUNS) {
    run(`reset(1);`);
    run(`phase='fight'; pt=200; msgT=0;`);
    if (r.swap) run(`S=[S[1],S[0]];`);
    run(`S[0].x=-0.375;S[0].z=0;S[1].x=0.375;S[1].z=0;S[0].fx=1;S[0].fz=0;S[0].ax=1;S[0].az=0;S[1].fx=-1;S[1].fz=0;S[1].ax=-1;S[1].az=0;S[0].hp=100;S[1].hp=100;`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-vcodec', 'png', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', r.file]);
    ff.stderr.pipe(process.stderr);
    const trailV = [], log = [], flagsAll = [];
    let prevAng = null, prevAz = null, prevWPitch = null, prevW = null;
    let wHist = [], releaseTick = null, touchdownTick = null, forced = false, settle = 0, simTicks = 0, frames = 0;
    for (let t = 0; t < 260; t++) {
      simTicks = t;
      if (t === 20 && !forced) {
        forced = true;
        const ok = run(`go(S[0],'T')`);
        if (!ok) throw new Error('go refused at force tick');
        run(`S[1].carryFrom=pose(S[1]);S[0].hit=1;S[0].throwMove='ippon';S[1].st='carry';S[1].t=0;S[1].throwStyle='ippon';S[1].ic='mid';S[1].vy=0;S[1].vx=0;S[1].vz=0;S[1].rm=0;S[1].gy=-.08;S[1].kp=22;S[1].x=S[0].x+S[0].ax*0.8;S[1].z=S[0].z+S[0].az*0.8;S[1].y=0;`);
      }
      run(`update(S[0],S[1]);update(S[1],S[0]);`);
      run(`cam.yaw=${r.yaw};`);
      run(`draw();`);
      const d = JSON.parse(run(DIAG));
      const th = d.a, vi = d.b;
      if (prevAng !== null && vi.st === 'air' && log[log.length - 1].vicSt === 'carry' && releaseTick === null) releaseTick = t;
      if (vi.st === 'down' && log.length && log[log.length - 1].vicSt === 'air' && touchdownTick === null) touchdownTick = t;
      const ang = torsoAngle(vi.w);
      const azRaw = azimuth(vi.w);
      const az = prevAz === null ? azRaw : prevAz + unwrap(prevAz, azRaw);
      const wPitch = prevAng === null ? 0 : (ang - prevAng) * 60;
      const wYaw = prevAz === null ? 0 : (az - prevAz) * 60;
      let maxStep = 0;
      if (prevW) for (const j of ['pel', 'neck', 'head', 'hl', 'hr', 'el', 'er', 'fl', 'fr']) maxStep = Math.max(maxStep, D3(vi.w[j], prevW[j]));
      const flags = [];
      if (prevAng !== null && Math.abs(ang - prevAng) > 0.262) flags.push(`ANGLE_JUMP ${(Math.abs(ang - prevAng) * 57.3).toFixed(0)}deg`);
      if (prevWPitch !== null && Math.sign(wPitch) !== Math.sign(prevWPitch) && Math.abs(wPitch) > 1 && Math.abs(prevWPitch) > 1) flags.push(`REVERSAL ${prevWPitch.toFixed(1)}->${wPitch.toFixed(1)} rad/s`);
      if (prevWPitch !== null && Math.abs(wPitch - prevWPitch) > 3 && Math.abs(t - (releaseTick || -99)) > 1 && Math.abs(t - (touchdownTick || -99)) > 1) flags.push(`ACCEL dW ${(wPitch - prevWPitch).toFixed(1)} rad/s`);
      if (maxStep > 0.20) flags.push(`JOINT_SNAP ${maxStep.toFixed(2)}m`);
      if (flags.length) flagsAll.push({ t, vicSt: vi.st, vicT: vi.t, flags: [...flags] });
      wHist.push(wPitch); if (wHist.length > 120) wHist.shift();
      const thrAng = torsoAngle(th.w);
      log.push({ t, atkSt: th.st, atkT: th.t, vicSt: vi.st, vicT: vi.t,
        pelX: +vi.w.pel[0].toFixed(3), pelY: +vi.w.pel[1].toFixed(3), pelZ: +vi.w.pel[2].toFixed(3),
        torsoDeg: +(ang * 57.2958).toFixed(1), wPitch: +wPitch.toFixed(2), wYaw: +wYaw.toFixed(2),
        facing: vi.w.head[0] >= vi.w.pel[0] ? 1 : -1,
        thrPelY: +th.w.pel[1].toFixed(3), thrTorsoDeg: +(thrAng * 57.2958).toFixed(1),
        vicVx: vi.vx, vicVy: vi.vy, maxStep: +maxStep.toFixed(3), flags });
      trailV.push(vi.s.pel); if (trailV.length > 150) trailV.shift();
      const m = { pelX: vi.w.pel[0], pelY: vi.w.pel[1], torsoDeg: ang * 57.2958, wPitch, wYaw, thrPelY: th.w.pel[1], thrTorsoDeg: thrAng * 57.2958, wHist: [...wHist] };
      overlay(r, t, th, vi, m, trailV, flags);
      const png = canvas.toBuffer('image/png');
      for (let k = 0; k < 2; k++) {
        if (!ff.stdin.write(png)) await new Promise(res => ff.stdin.once('drain', res));
        frames++;
      }
      prevAng = ang; prevAz = az; prevWPitch = wPitch; prevW = vi.w;
      if (forced && th.st === 'idle' && vi.st === 'idle') { settle++; if (settle >= 10) break; }
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', n => (n ? rej(new Error('ffmpeg exit ' + n)) : res())));
    const byState = st => log.filter(x => x.vicSt === st);
    const summ = st => {
      const xs = byState(st); if (!xs.length) return null;
      const wps = xs.map(x => x.wPitch), wys = xs.map(x => x.wYaw), angs = xs.map(x => x.torsoDeg);
      return { ticks: xs.length, torsoDegMin: Math.min(...angs), torsoDegMax: Math.max(...angs),
        wPitchMin: +Math.min(...wps).toFixed(2), wPitchMax: +Math.max(...wps).toFixed(2),
        wYawMin: +Math.min(...wys).toFixed(2), wYawMax: +Math.max(...wys).toFixed(2) };
    };
    const rel = releaseTick !== null ? log[releaseTick] : null;
    const td = touchdownTick !== null ? log[touchdownTick] : null;
    const td12 = touchdownTick !== null ? log[touchdownTick + 12] : null;
    const endState = JSON.parse(run(`JSON.stringify({st:[S[0].st,S[1].st],hp:[Math.round(S[0].hp*10)/10,Math.round(S[1].hp*10)/10],x:[S[0].x,S[1].x]})`));
    const rec = { run: r.label, view: r.view, file: r.file, simTicks, frames,
      releaseTick, releaseVel: rel ? { vx: rel.vicVx, vy: rel.vicVy } : null,
      releasePelvis: rel ? { x: rel.pelX, y: rel.pelY } : null,
      touchdownTick, touchdown: td ? { torsoDeg: td.torsoDeg, pelX: td.pelX, pelY: td.pelY, facing: td.facing } : null,
      touchdownPlus12: td12 ? { torsoDeg: td12.torsoDeg } : null,
      byState: { carry: summ('carry'), air: summ('air'), down: summ('down'), getup: summ('getup') },
      thrPelMinY: +Math.min(...log.filter(x => x.atkSt === 'atk').map(x => x.thrPelY)).toFixed(3),
      thrTorsoRange: (() => { const a = log.filter(x => x.atkSt === 'atk').map(x => x.thrTorsoDeg); return a.length ? [Math.min(...a), Math.max(...a)] : null; })(),
      facingAtEnd: log[log.length - 1].facing,
      flags: flagsAll, endState, log: r.view === 'Side' ? log : undefined };
    evidence.push(rec);
    console.log('run done:', r.label, r.view, 'sim', simTicks, 'frames', frames, 'release', releaseTick, 'touchdown', touchdownTick, 'flags', flagsAll.length, 'end', JSON.stringify(endState));
  }
  fs.writeFileSync(EVID, JSON.stringify(evidence, null, 2));
  console.log('capture complete');
})().catch(e => { console.error('CAPTURE FAILED:', e); process.exit(1); });
