import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld } from '../src/engine.mjs';
import { summarizeRejectedAttackInstances } from '../src/rejected-attack-instances.mjs';

const rejected = (tick, attackInstanceId, move = 'straight') => ({
  tick, attackInstanceId, type: 'shadow_contact_rejected',
  attacker: 'blue', defender: 'red', move
});

test('multiple frames and duplicate observations count as one attack', () => {
  const events = [rejected(10, 1), rejected(10, 1), rejected(11, 1),
    rejected(15, 1), rejected(18, 2)];
  const summary = summarizeRejectedAttackInstances(events);
  assert.equal(summary.uniqueRejectedAttacks, 2);
  assert.equal(summary.observationCount, 4);
  assert.deepEqual(summary.instances.map(a => [a.attackInstanceId, a.observedTicks]),
    [[1, 3], [2, 1]]);
});

test('same move on distinct attacks remains distinct and does not mutate input', () => {
  const events = [rejected(2, 3), { type: 'hit', tick: 3 },
    rejected(4, 4), rejected(5, 3)];
  const original = structuredClone(events);
  assert.deepEqual(summarizeRejectedAttackInstances(events),
    summarizeRejectedAttackInstances(events));
  assert.equal(summarizeRejectedAttackInstances(events).uniqueRejectedAttacks, 2);
  assert.deepEqual(events, original);
});

test('invalid IDs, ordering, and conflicting attack identity are rejected', () => {
  assert.deepEqual(summarizeRejectedAttackInstances([]),
    { uniqueRejectedAttacks: 0, observationCount: 0, instances: [] });
  assert.throws(() => summarizeRejectedAttackInstances([rejected(1, 0)]), TypeError);
  assert.throws(() => summarizeRejectedAttackInstances([rejected(3, 1), rejected(2, 2)]), RangeError);
  assert.throws(() => summarizeRejectedAttackInstances([
    rejected(2, 1), rejected(3, 1, 'palm')
  ]), RangeError);
});

test('real engine replay produces deterministic instance audit', () => {
  const replay = () => {
    const world = new CombatWorld({ startingGap: 1.3 });
    const events = [];
    for (let tick = 0; tick < 90; tick++) {
      events.push(...world.step({
        blue: tick === 0 || tick === 40 ? { attack: 'straight' } : {},
        red: tick === 0 ? { attack: 'jab' } : {}
      }));
    }
    return summarizeRejectedAttackInstances(events);
  };
  assert.deepEqual(replay(), replay());
});
