// Analyze input_buffer_sweep_20261031.json into per-family tables + flags.
const fs = require('fs');
const BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept';
const data = JSON.parse(fs.readFileSync(BASE + '/hidden_files/claude-loop/input_buffer_sweep_20261031.json', 'utf8'));
const T = data.trials;
const byId = id => T.find(t => t.id === id);
const nonDet = T.filter(t => !t.deterministic);
console.log(`trials=${T.length} nondeterministic=${nonDet.length} ${nonDet.map(t => t.id).join(',') || 'none'}`);
const ev = (t, type) => t.analysis.events.filter(e => e.type === type);
const fires = t => ev(t, 'fire');
// Global quality flags
let maxStep = 0, maxStepTrial = '', maxDrift = 0, driftTrial = '', bothAir = [], nhViol = [], pnViol = [];
for (const t of T) {
  const a = t.analysis;
  if (a.maxJointStepM > maxStep) { maxStep = a.maxJointStepM; maxStepTrial = t.id; }
  if (a.maxPlantedFootDriftM > maxDrift) { maxDrift = a.maxPlantedFootDriftM; driftTrial = t.id; }
  if (a.bothFeetAirborneTicks > 0) bothAir.push(`${t.id}:${a.bothFeetAirborneTicks}`);
  if (a.neckHeadRangeM[1] > 0.26) nhViol.push(`${t.id}:${a.neckHeadRangeM[1]}`);
  if (a.pelNeckRangeM[1] > 0.57) pnViol.push(`${t.id}:${a.pelNeckRangeM[1]}`);
}
console.log(`maxJointStep=${maxStep} (${maxStepTrial}) | maxFootDrift=${maxDrift} (${driftTrial})`);
console.log(`bothAirborne trials=${bothAir.length} ${bothAir.slice(0, 10).join(' ')}`);
console.log(`neckHead>0.26: ${nhViol.length} | pelNeck>0.57: ${pnViol.length}`);
console.log('\n== PUNCH-TO-KICK (hit) : kick fire tick / capture tick / delay(press->fire) ==');
for (const B of [3, 6, 9]) for (const A of [0, 1]) {
  const row = [];
  for (const off of [1, 5, 6, 9, 13, 16, 19]) {
    const t = byId(`PK-B${B}-A${A}-off${off}`);
    const kf = fires(t).filter(f => f.mv === 'K');
    const cap = ev(t, 'capture').find(c => c.buf === 'K');
    row.push(`off${off}:${kf.length ? `K@${kf[0].tick}(d${kf[0].tick - off})` : 'EXPIRED'}${cap ? `/cap${cap.tick}` : ''}`);
  }
  console.log(`B=${B} A=${A} | ${row.join(' ')}`);
}
console.log('\n== PUNCH-TO-KICK (whiff) : kick fire tick ==');
for (const B of [3, 6, 9]) for (const A of [0, 1]) {
  const row = [];
  for (const off of [9, 13, 16, 19]) {
    const t = byId(`PKW-B${B}-A${A}-off${off}`);
    const kf = fires(t).filter(f => f.mv === 'K');
    row.push(`off${off}:${kf.length ? `K@${kf[0].tick}(d${kf[0].tick - off})` : 'EXPIRED'}`);
  }
  console.log(`B=${B} A=${A} | ${row.join(' ')}`);
}
console.log('\n== PUNCH-TO-GUARD : guard engage tick (or none) ==');
{
  const t = byId('PG-HOLD'); console.log(`HOLD: guard@${(ev(t, 'guard')[0] || {}).tick ?? 'none'} defHp=${t.analysis.finalHp.def}`);
  for (const off of [1, 6, 9, 13, 16, 19, 20, 25, 26]) {
    const tt = byId(`PG-TAP-off${off}`);
    console.log(`TAP off${off}: guard@${(ev(tt, 'guard')[0] || {}).tick ?? 'none'}`);
  }
  for (const B of [3, 6, 9]) {
    const row = [];
    for (const off of [20, 22, 24]) {
      const tt = byId(`PG-SIMB${B}-off${off}`);
      row.push(`off${off}:guard@${(ev(tt, 'guard')[0] || {}).tick ?? 'none'}`);
    }
    console.log(`SIM B=${B}: ${row.join(' ')}`);
  }
  for (const B of [3, 6, 9]) {
    const tt = byId(`PG-STALE-B${B}`);
    console.log(`STALE-P B=${B}: fires=${fires(tt).map(f => `${f.mv}@${f.tick}`).join(',')} guard@${(ev(tt, 'guard')[0] || {}).tick ?? 'none'}`);
    const tk = byId(`PG-STALEK-B${B}`);
    console.log(`STALE-K B=${B}: fires=${fires(tk).map(f => `${f.mv}@${f.tick}`).join(',')} guard@${(ev(tk, 'guard')[0] || {}).tick ?? 'none'}`);
  }
}
console.log('\n== EVADE-TO-PUNCH : fire tick / attacker displacement at fire / defHp ==');
for (const B of [3, 6, 9]) for (const A of [0, 1]) {
  const row = [];
  for (const off of [1, 6, 11, 13, 16, 20]) {
    const t = byId(`EP-B${B}-A${A}-off${off}`);
    const pf = fires(t).filter(f => f.mv === 'P');
    const disp = pf.length ? Math.hypot(pf[0].aX, pf[0].aZ).toFixed(2) : '-';
    row.push(`off${off}:${pf.length ? `P@${pf[0].tick}(z${disp},hp${t.analysis.finalHp.def})` : 'none'}`);
  }
  console.log(`B=${B} A=${A} | ${row.join(' ')}`);
  const pr = byId(`EP-PREEMPT-B${B}-A${A}`);
  console.log(`  PREEMPT B=${B} A=${A}: fires=${fires(pr).map(f => `${f.mv}@${f.tick}`).join(',')} steps=${ev(pr, 'step').length}`);
}
console.log('\n== GRAB-TO-THROW stationary : fire / connect / release / defHp ==');
for (const B of [3, 6, 9]) for (const A of [0, 1]) {
  const row = [];
  for (const d of [1.5, 1.39, 1.2, 0.75, 0.5]) {
    const t = byId(`GT-STAT-B${B}-A${A}-d${d}`);
    const f0 = fires(t)[0];
    const conn = ev(t, 'throwConnect')[0], rel = ev(t, 'throwRelease')[0];
    row.push(`d${d}:${f0 ? `${f0.mv}@${f0.tick}` : 'none'}${conn ? `/conn${conn.tick}/rel${rel ? rel.tick : '?'}` : ''}/hp${t.analysis.finalHp.def}`);
  }
  console.log(`B=${B} A=${A} | ${row.join(' ')}`);
}
console.log('\n== GRAB-TO-THROW walking : fire / connect / defHp ==');
for (const B of [3, 6, 9]) for (const A of [0, 1]) {
  const row = [];
  for (const off of [0, 2, 4, 5, 6]) {
    const t = byId(`GT-WALK-B${B}-A${A}-off${off}`);
    const f0 = fires(t)[0];
    const conn = ev(t, 'throwConnect')[0];
    row.push(`off${off}:${f0 ? `${f0.mv}@${f0.tick}` : 'none'}${conn ? `/conn${conn.tick}` : ''}/hp${t.analysis.finalHp.def}`);
  }
  console.log(`B=${B} A=${A} | ${row.join(' ')}`);
}
console.log('\n== GRAB-TO-THROW during punch / step / whiff ==');
for (const B of [3, 6, 9]) for (const A of [0, 1]) {
  for (const off of [6, 9, 13]) {
    const t = byId(`GT-DURING-P-B${B}-A${A}-off${off}`);
    console.log(`DURING-P B=${B} A=${A} off${off}: fires=${fires(t).map(f => `${f.mv}@${f.tick}`).join(',')} hp=${t.analysis.finalHp.def} conn=${ev(t, 'throwConnect').length}`);
  }
  const st = byId(`GT-STEP-B${B}-A${A}`);
  console.log(`STEP B=${B} A=${A}: fires=${fires(st).map(f => `${f.mv}@${f.tick}`).join(',')} conn=${ev(st, 'throwConnect').map(e => e.tick).join(',')} hp=${st.analysis.finalHp.def}`);
}
{
  const t = byId('GT-WHIFF');
  console.log(`WHIFF: fires=${fires(t).map(f => `${f.mv}@${f.tick}`).join(',')} conn=${ev(t, 'throwConnect').length} hp=${t.analysis.finalHp.def}`);
}
console.log('\n== STUN late-fire : attacker fire after stun press ==');
for (const B of [3, 6, 9]) {
  const row = [];
  for (const off of [14, 20, 26]) {
    const t = byId(`STUN-B${B}-off${off}`);
    const pf = fires(t).filter(f => f.mv === 'P');
    row.push(`off${off}:${pf.length ? `P@${pf[0].tick}(d${pf[0].tick - off})` : 'expired'}`);
  }
  console.log(`B=${B}: ${row.join(' ')}`);
}
console.log('\n== REPEAT check : trials where one tested press produced >1 fire of the tested move ==');
for (const t of T) {
  const f = fires(t);
  const counts = {};
  for (const x of f) counts[x.mv] = (counts[x.mv] || 0) + 1;
  // Tested-press budget: PK/PKW 2 attack presses (P+K), GT-DURING-P 2 (P+GP->P), STALE 2-3, else 1.
  // Flag only same-move double fires beyond the budget (chain re-fires would show as 2x same mv).
  for (const [mv, n] of Object.entries(counts)) {
    if (n >= 3) console.log(`  ${t.id}: ${mv}x${n}`);
  }
}
console.log('\n== Discontinuity/balance extremes per family ==');
for (const fam of ['PK', 'PKW', 'PG', 'EP', 'GT', 'STUN']) {
  const ts = T.filter(t => t.id.startsWith(fam));
  const ms = Math.max(...ts.map(t => t.analysis.maxJointStepM));
  const md = Math.max(...ts.map(t => t.analysis.maxPlantedFootDriftM));
  console.log(`${fam}: maxJointStep(world)=${ms} maxFootDrift(world)=${md} n=${ts.length}`);
}
console.log('\n== LOCAL-frame quality by family x buffer (selection metrics) ==');
for (const fam of ['PK', 'PKW', 'PG', 'EP', 'GT', 'STUN']) {
  for (const B of [3, 6, 9]) {
    const ts = T.filter(t => t.id.startsWith(fam) && t.buffer === B);
    if (!ts.length) continue;
    const ls = Math.max(...ts.map(t => t.analysis.maxLocalJointStepM || 0));
    const ld = Math.max(...ts.map(t => t.analysis.maxLocalFootDriftM || 0));
    const wd = Math.max(...ts.map(t => t.analysis.maxWorldFootDriftNoFlipM || 0));
    const nh = Math.max(...ts.map(t => t.analysis.neckHeadRangeM[1]));
    const pn = Math.max(...ts.map(t => t.analysis.pelNeckRangeM[1]));
    const fl = ts.reduce((s, t) => s + (t.analysis.facingFlips || 0), 0);
    console.log(`${fam} B=${B}: localStep=${ls} localFootDrift=${ld} worldDriftNoFlip=${wd} neckHeadMax=${nh} pelNeckMax=${pn} flips=${fl} n=${ts.length}`);
  }
}
