import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld } from '../src/engine.mjs';
import { summarizeContactDiscrepancies } from '../src/exchange-audit.mjs';

test('rejected shadow intersections are counted without fabricating resolved hits', () => {
  const report = summarizeContactDiscrepancies([
    { tick: 4, type: 'shadow_contact_rejected', attacker: 'blue', defender: 'red', move: 'palm', collisionProbe: { intersected: true } },
    { tick: 5, type: 'shadow_contact_rejected', attacker: 'blue', defender: 'red', move: 'palm', collisionProbe: { intersected: false } },
    { tick: 6, type: 'hit', attacker: 'red', defender: 'blue', move: 'jab', collisionProbe: { intersected: true } }
  ]);
  assert.equal(report.rejectedShadowIntersections, 1);
  assert.equal(report.resolvedContacts, 1);
  assert.equal(report.hits, 1);
  assert.equal(report.discrepancies[0].reason, '3d_intersection_without_range_authority');
});

test('shadow-only event does not change engine state and replay remains deterministic', () => {
  const run = () => {
    const world = new CombatWorld({ startingGap: 2.2 });
    const events = [];
    for (let i = 0; i < 48; i++) events.push(...world.step({ blue: i === 0 ? { attack: 'straight' } : {}, red: {} }));
    return { events, state: world.snapshot() };
  };
  assert.deepEqual(run(), run());
  const result = run();
  const report = summarizeContactDiscrepancies(result.events);
  assert.equal(report.resolvedContacts, result.events.filter(e => e.type === 'hit' || e.type === 'blocked').length);
  assert.equal(report.rejectedShadowIntersections, result.events.filter(e => e.type === 'shadow_contact_rejected' && e.collisionProbe?.intersected).length);
});
