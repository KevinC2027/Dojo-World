import test from 'node:test';
import assert from 'node:assert/strict';
import {recordSoloMotion,INDEPENDENT_MOTION_SCENARIOS} from '../src/movement-qualification.mjs';
import {measureDynamicSupport} from '../src/dynamic-support.mjs';

test('dynamic support evaluates 24 independent no-attack motion fixtures',()=>{
 let count=0;
 for(const id of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
  const replay=recordSoloMotion(id,scenario);
  const audit=measureDynamicSupport(replay);
  assert.equal(audit.samples,replay.frames.length);
  assert.equal(audit.finite,true);
  assert.ok(Number.isFinite(audit.maxCurrentCaptureErrorMeters));
  assert.ok(Number.isFinite(audit.maxAnticipatedCaptureErrorMeters));
  // Planned reachable touchdown must never worsen nearest-support error.
  assert.ok(audit.maxAnticipatedCaptureErrorMeters<=audit.maxCurrentCaptureErrorMeters+1e-10);
  count++;
 }
 assert.equal(count,24);
});

test('capture-point estimate is exactly reproducible across repeated simulations',()=>{
 for(const id of ['blue','red'])for(const name of ['guardAdvance','reverse','stop']){
  const a=measureDynamicSupport(recordSoloMotion(id,name));
  const b=measureDynamicSupport(recordSoloMotion(id,name));
  assert.deepEqual(a,b);
 }
});

test('standing stance has less projected support error than a stepped-turn reversal',()=>{
 for(const id of ['blue','red']){
  const still=measureDynamicSupport(recordSoloMotion(id,'idle'));
  const reverse=measureDynamicSupport(recordSoloMotion(id,'reverse'));
  assert.ok(still.maxAnticipatedCaptureErrorMeters<.14);
  assert.ok(reverse.maxAnticipatedCaptureErrorMeters>still.maxAnticipatedCaptureErrorMeters);
 }
});

test('invalid balance diagnostic parameters are rejected',()=>{
 const f=recordSoloMotion('blue','idle');
 assert.throws(()=>measureDynamicSupport(f,{g:0}),RangeError);
 assert.throws(()=>measureDynamicSupport(f,{landingHorizonTicks:-1}),RangeError);
});

test('launch-frame support includes the foot still touching the floor',()=>{
 for(const id of ['blue','red']){
  const replay=recordSoloMotion(id,'forward');
  const result=measureDynamicSupport(replay);
  assert.equal(result.rows[1].plantedContacts,2);
  assert.equal(result.rows[2].plantedContacts,1);
 }
});
