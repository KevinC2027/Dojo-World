import test from 'node:test';
import assert from 'node:assert/strict';
import { closestSegments, sweptSphereCapsule } from '../src/sweep.mjs';
const v=(x,y,z)=>({x,y,z});
const torsoA=v(0,0.8,0),torsoB=v(0,1.7,0);

test('sweep detects crossing even when both sampled endpoints miss',()=>{
  const hit=sweptSphereCapsule(v(-2,1.2,0),v(2,1.2,0),0.08,torsoA,torsoB,0.3);
  assert.ok(hit);
  assert.equal(hit.model,'swept_sphere_capsule_v1');
  assert.ok(Math.abs(hit.sweepFraction-0.5)<1e-9);
  assert.ok(hit.penetrationDepth>0);
});
test('sweep misses when hand travels outside capsule',()=>{
  assert.equal(sweptSphereCapsule(v(-2,2.5,0),v(2,2.5,0),0.08,torsoA,torsoB,0.3),null);
});
test('tangency counts as a single valid contact',()=>{
  const hit=sweptSphereCapsule(v(-2,1.2,0.4),v(2,1.2,0.4),0.1,torsoA,torsoB,0.3);
  assert.ok(hit);
  assert.ok(Math.abs(hit.penetrationDepth)<1e-8);
});
test('zero-length sweep and capsule endpoints stay finite',()=>{
  const hit=sweptSphereCapsule(v(0,0,0),v(0,0,0),0.1,v(0,0,0),v(0,0,0),0.2);
  assert.ok(hit);
  assert.ok(Object.values(hit.normal).every(Number.isFinite));
  assert.equal(closestSegments(v(1,0,0),v(1,0,0),v(0,0,0),v(0,0,0)).distance,1);
});
test('invalid coordinates and radii are rejected',()=>{
  assert.throws(()=>sweptSphereCapsule(v(0,0,0),v(1,0,0),-1,torsoA,torsoB,0.3),RangeError);
  assert.throws(()=>closestSegments(v(NaN,0,0),v(1,0,0),torsoA,torsoB),TypeError);
});
test('identical geometry produces identical deterministic output',()=>{
  const args=[v(-2,1.3,0.1),v(2,1.3,0.1),0.11,torsoA,torsoB,0.3];
  assert.deepEqual(sweptSphereCapsule(...args),sweptSphereCapsule(...args));
});
