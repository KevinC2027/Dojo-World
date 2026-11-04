import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceFootSupport } from '../src/foot-support-state.mjs';

const stance = () => ({ leftFoot: { x: -0.2, z: -0.2 }, rightFoot: { x: 0.2, z: 0.2 } });

test('planted feet remain fixed under small center-of-mass motion', () => {
  const s = stance();
  const next = advanceFootSupport(s, { x: 0.05, z: 0 });
  assert.equal(next.stepped, null);
  assert.deepEqual(next.leftFoot, s.leftFoot);
  assert.deepEqual(next.rightFoot, s.rightFoot);
  assert.equal(next.support.stable, true);
});
test('large displacement takes a bounded step without teleportation', () => {
  const s = stance();
  const next = advanceFootSupport(s, { x: 1, z: 0 });
  assert.equal(next.stepped, 'leftFoot');
  assert.ok(Math.hypot(next.leftFoot.x - s.leftFoot.x, next.leftFoot.z - s.leftFoot.z) <= 0.12000000001);
  assert.deepEqual(next.rightFoot, s.rightFoot);
});
test('replayed center-of-mass path is deterministic and does not mutate input', () => {
  const path = [{ x: 0, z: 0 }, { x: 0.7, z: 0 }, { x: 1.1, z: 0.1 }];
  const run = () => path.reduce((s, p) => advanceFootSupport(s, p), stance());
  assert.deepEqual(run(), run());
  assert.deepEqual(stance(), { leftFoot: { x: -0.2, z: -0.2 }, rightFoot: { x: 0.2, z: 0.2 } });
});
test('invalid state and parameters are rejected', () => {
  assert.throws(() => advanceFootSupport({}, { x: 0, z: 0 }), TypeError);
  assert.throws(() => advanceFootSupport(stance(), { x: Infinity, z: 0 }), TypeError);
  assert.throws(() => advanceFootSupport(stance(), { x: 0, z: 0 }, { maxStep: -1 }), RangeError);
});
