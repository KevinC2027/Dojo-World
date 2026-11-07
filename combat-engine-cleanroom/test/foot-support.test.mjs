import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFootSupport } from '../src/foot-support.mjs';
const left = { x: -0.3, z: 0 }, right = { x: 0.3, z: 0 };
test('centered stance has support', () => {
  const result = evaluateFootSupport(left, right, { x: 0, z: 0 });
  assert.equal(result.stable, true);
  assert.equal(result.displacement, 0);
});
test('center of mass beyond planted feet is unstable', () => {
  const result = evaluateFootSupport(left, right, { x: 0.6, z: 0 });
  assert.equal(result.stable, false);
  assert.ok(Math.abs(result.displacement - 0.3) < 1e-12);
});
test('deterministic repeated support calculation', () => {
  const args = [left, right, { x: 0.1, z: 0.05 }];
  assert.deepEqual(evaluateFootSupport(...args), evaluateFootSupport(...args));
});
test('invalid coordinates and tolerance are rejected', () => {
  assert.throws(() => evaluateFootSupport(left, right, { x: Infinity, z: 0 }), TypeError);
  assert.throws(() => evaluateFootSupport(left, right, { x: 0, z: 0 }, -1), RangeError);
});
test('coincident feet use point support', () => {
  const result = evaluateFootSupport(left, left, { x: -0.3, z: 0 });
  assert.equal(result.stable, true);
  assert.equal(result.projection, 0);
});
