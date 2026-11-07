import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld } from '../src/engine.mjs';

function replay(gap, move, defenderInput = {}) {
  const world = new CombatWorld({ startingGap: gap });
  const events = [];
  for (let tick = 0; tick < 45; tick++) {
    events.push(...world.step({
      blue: tick === 0 ? { attack: move } : {},
      red: defenderInput
    }));
  }
  return { events, snapshot: world.snapshot() };
}

test('every range-authorized contact explicitly classifies shadow geometry disagreement', () => {
  for (const [gap, move] of [[1.3, 'palm'], [1.3, 'straight'], [1.6, 'frontKick']]) {
    const { events } = replay(gap, move);
    const contacts = events.filter(e => e.type === 'hit' || e.type === 'blocked');
    assert.ok(contacts.length > 0, 'expected a proxy contact for ' + move);
    for (const e of contacts) {
      assert.equal(e.contactDiscrepancy,
        e.collisionProbe.intersected ? null : 'range_hit_without_3d_intersection');
      assert.equal(e.contact.model, 'range_proxy_v1');
    }
  }
});

test('guarded contacts expose the same discrepancy contract without changing guard outcome', () => {
  const { events } = replay(1.3, 'palm', { guard: true });
  const blocked = events.filter(e => e.type === 'blocked');
  assert.equal(blocked.length, 1);
  assert.equal(events.filter(e => e.type === 'hit').length, 0);
  assert.equal(blocked[0].contactDiscrepancy,
    blocked[0].collisionProbe.intersected ? null : 'range_hit_without_3d_intersection');
});

test('diagnostic discrepancy is deterministic and does not manufacture contacts at long range', () => {
  assert.deepEqual(replay(1.3, 'palm'), replay(1.3, 'palm'));
  const distant = replay(4, 'palm');
  assert.equal(distant.events.filter(e => e.type === 'hit' || e.type === 'blocked').length, 0);
  assert.equal(distant.events.filter(e => Object.hasOwn(e, 'contactDiscrepancy')).length, 0);
});
