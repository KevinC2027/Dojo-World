import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld } from '../src/engine.mjs';
import { summarizeContactDiscrepancies } from '../src/exchange-audit.mjs';

function exchange() {
  const world = new CombatWorld({ startingGap: 1.3 });
  const events = [];
  for (let i = 0; i < 60; i++) {
    events.push(...world.step({
      blue: i === 0 ? { attack: 'palm' } : {},
      red: { guard: true }
    }));
  }
  return events;
}

test('counts resolved events without mutating source', () => {
  const events = [
    { tick: 1, type: 'attack_started' },
    { tick: 2, type: 'hit', attacker: 'blue', defender: 'red', move: 'palm', collisionProbe: { intersected: false } },
    { tick: 3, type: 'blocked', attacker: 'red', defender: 'blue', move: 'jab', collisionProbe: { intersected: true } }
  ];
  const original = structuredClone(events);
  const result = summarizeContactDiscrepancies(events);
  assert.deepEqual(events, original);
  assert.equal(result.resolvedContacts, 2);
  assert.equal(result.hits, 1);
  assert.equal(result.blocks, 1);
  assert.equal(result.proxyOnlyContacts, 1);
  assert.equal(result.shadowIntersections, 1);
  assert.deepEqual(result.discrepancies, [{
    tick: 2, attacker: 'blue', defender: 'red', move: 'palm',
    outcome: 'hit', reason: 'range_hit_without_3d_intersection'
  }]);
});

test('engine replay audit is deterministic and preserves outcomes', () => {
  const a = exchange();
  const b = exchange();
  assert.deepEqual(summarizeContactDiscrepancies(a), summarizeContactDiscrepancies(b));
  const audit = summarizeContactDiscrepancies(a);
  assert.equal(audit.resolvedContacts, a.filter(e => e.type === 'hit' || e.type === 'blocked').length);
  assert.equal(audit.resolvedContacts, audit.shadowIntersections + audit.proxyOnlyContacts + audit.unclassifiedContacts);
});

test('missing telemetry is unclassified, not a fabricated miss', () => {
  assert.equal(summarizeContactDiscrepancies([]).resolvedContacts, 0);
  const audit = summarizeContactDiscrepancies([{ type: 'hit', attacker: 'blue', move: 'palm' }]);
  assert.equal(audit.unclassifiedContacts, 1);
  assert.equal(audit.proxyOnlyContacts, 0);
  assert.throws(() => summarizeContactDiscrepancies(null), TypeError);
});
