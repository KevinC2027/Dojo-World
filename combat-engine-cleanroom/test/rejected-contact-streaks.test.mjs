import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRejectedContactStreaks } from '../src/rejected-contact-streaks.mjs';

const rejected = (tick, attacker = 'blue', move = 'palm') =>
  ({ tick, type: 'shadow_contact_rejected', attacker, defender: 'red', move });

test('consecutive rejected frames form one streak, not multiple attacks', () => {
  const events = [rejected(10), rejected(11), rejected(11), rejected(12), rejected(16)];
  const result = summarizeRejectedContactStreaks(events);
  assert.equal(result.observationCount, 4);
  assert.equal(result.streakCount, 2);
  assert.deepEqual(result.streaks.map(s => [s.firstTick, s.lastTick, s.observedTicks]),
    [[10, 12, 3], [16, 16, 1]]);
});
test('different fighters and moves are independently grouped without mutation', () => {
  const events = [rejected(2), rejected(2, 'red', 'jab'), rejected(3),
    { tick: 3, type: 'hit' }, rejected(3, 'red', 'jab')];
  const original = structuredClone(events);
  const first = summarizeRejectedContactStreaks(events);
  assert.equal(first.streakCount, 2);
  assert.deepEqual(first, summarizeRejectedContactStreaks(events));
  assert.deepEqual(events, original);
});
test('empty events and invalid ordering are handled deterministically', () => {
  assert.deepEqual(summarizeRejectedContactStreaks([]),
    { observationCount: 0, streakCount: 0, streaks: [] });
  assert.throws(() => summarizeRejectedContactStreaks([rejected(3), rejected(2)]), RangeError);
  assert.throws(() => summarizeRejectedContactStreaks([rejected(NaN)]), TypeError);
});
