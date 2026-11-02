// Promotion gate for contact-consistency diagnostics.
// Usage: node diff_contact_consistency.cjs <baseline.json> <candidate.json>
// Compares the 4 gating runs (INFO shoulder runs excluded) run by run.
// Exit 0 = PROMOTABLE: no NEW hard-flag kind and no hard-kind regression
// beyond tolerance. Exit 1 = REVERT: a new hard kind appeared, or a shared
// hard kind worsened beyond tolerance. Soft flags never block alone; they
// are reported for the auto-refine queue. The cycle's own target
// improvement is judged by the cycle report, not by this script.
// Direction: most hard kinds are greater-is-worse; 'collapse' (angle) and
// 'pass-through' (distance) are smaller-is-worse.
const fs = require('fs');
const base = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const cand = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const kindOf = (s) => s.replace(/[0-9]+(\.[0-9]+)?/g, '#');
const firstNum = (s) => { const m = s.match(/[0-9]+(\.[0-9]+)?/); return m ? parseFloat(m[0]) : null; };
const dirOf = (kind) => (kind.includes('collapse') || kind.includes('pass-through')) ? -1 : 1;
const tolOf = (kind) => kind.includes('ticks') ? 1 : kind.includes('deg') ? 1 : 0.01;
let fail = false;
const report = [];
for (const b of base.runs) {
  if (b.label.includes('INFO')) continue;
  const c = cand.runs.find(r => r.label === b.label);
  if (!c) { report.push(b.label + ': MISSING in candidate'); fail = true; continue; }
  const bKinds = new Map(b.hard.map(h => [kindOf(h), h]));
  const cKinds = new Map(c.hard.map(h => [kindOf(h), h]));
  for (const [k, h] of cKinds) {
    if (!bKinds.has(k)) { report.push(b.label + ': NEW HARD: ' + h); fail = true; continue; }
    const bv = firstNum(bKinds.get(k)), cv = firstNum(h);
    if (bv !== null && cv !== null) {
      const d = dirOf(k), tol = tolOf(k);
      if (d === 1 && cv > bv + tol) { report.push(b.label + ': REGRESSED HARD ' + k + ': ' + bv + ' -> ' + cv); fail = true; }
      if (d === -1 && cv < bv - tol) { report.push(b.label + ': REGRESSED HARD ' + k + ': ' + bv + ' -> ' + cv); fail = true; }
    }
  }
  for (const k of bKinds.keys()) if (!cKinds.has(k)) report.push(b.label + ': FIXED HARD: ' + bKinds.get(k));
  const bSoft = new Set(b.soft.map(kindOf)), cSoft = new Set(c.soft.map(kindOf));
  for (const k of cSoft) if (!bSoft.has(k)) report.push(b.label + ': new soft: ' + k);
  for (const k of bSoft) if (!cSoft.has(k)) report.push(b.label + ': fixed soft: ' + k);
}
console.log(report.join('\n') || 'no hard change');
console.log(fail ? 'VERDICT: REVERT' : 'VERDICT: PROMOTABLE (hard gate)');
process.exit(fail ? 1 : 0);
