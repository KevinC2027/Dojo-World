import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld } from '../src/engine.mjs';

function replay() {
  const world = new CombatWorld({ startingGap: 1.3 });
  const events = [];
  for (let tick = 0; tick < 100; tick++) {
    events.push(...world.step({
      blue: tick === 0 || tick === 40 ? { attack: 'straight' } : {},
      red: tick === 0 ? { attack: 'jab' } : {}
    }));
  }
  return { events, snapshot: world.snapshot() };
}

test('attack instances are unique, monotonic and deterministic across replays', () => {
  const first = replay();
  assert.deepEqual(first, replay());
  const starts = first.events.filter(e => e.type === 'attack_started');
  assert.ok(starts.length >= 2);
  assert.deepEqual(starts.map(e => e.attackInstanceId),
    starts.map((_, i) => i + 1));
  assert.equal(first.snapshot.nextAttackInstanceId, starts.length + 1);
});

test('resolved and rejected contact observations reference a started attack', () => {
  const { events } = replay();
  const starts = new Map(events.filter(e => e.type === 'attack_started')
    .map(e => [e.attackInstanceId, e]));
  for (const event of events) {
    if (!['hit', 'blocked', 'shadow_contact_rejected', 'attack_finished'].includes(event.type)) continue;
    assert.ok(Number.isSafeInteger(event.attackInstanceId));
    const start = starts.get(event.attackInstanceId);
    assert.ok(start, 'contact/finish must reference an existing attack');
    assert.ok(event.tick >= start.tick);
    if (event.attacker) assert.equal(event.attacker, start.fighter);
    if (event.fighter) assert.equal(event.fighter, start.fighter);
  }
});
