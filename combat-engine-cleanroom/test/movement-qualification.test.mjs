import test from 'node:test';
import assert from 'node:assert/strict';
import {recordSoloMotion,measureSoloMotion,auditIndependentMotion,INDEPENDENT_MOTION_SCENARIOS} from '../src/movement-qualification.mjs';
test('14 independent deterministic 60Hz motion demonstrations exist',()=>{
  const reports=auditIndependentMotion();
  assert.equal(reports.length,14);
  assert.equal(INDEPENDENT_MOTION_SCENARIOS.length,7);
  assert.equal(new Set(reports.map(r=>r.fighter+':'+r.scenario)).size,14);
  for(const r of reports){assert.ok(r.ticks>=91);assert.equal(r.errors.length,0);assert.equal(r.footPenetrations,0);assert.ok(r.maxBoneErrorMeters<1e-8)}
});
test('replays are deterministic for both characters and all scenarios',()=>{
  for(const id of ['blue','red'])for(const s of INDEPENDENT_MOTION_SCENARIOS){
    const a=recordSoloMotion(id,s),b=recordSoloMotion(id,s);
    assert.deepEqual(a.frames,b.frames);
  }
});
test('idle and guarding do not translate fighter root',()=>{
  for(const id of ['blue','red'])for(const s of ['idle','guard']){
    const r=measureSoloMotion(recordSoloMotion(id,s));
    assert.ok(r.horizontalTravelMeters<1e-8,JSON.stringify(r));
  }
});
test('independent locomotion actually translates the fighter',()=>{
  for(const id of ['blue','red'])for(const s of ['forward','backward','lateral']){
    const r=measureSoloMotion(recordSoloMotion(id,s));
    assert.ok(r.horizontalTravelMeters>1,JSON.stringify(r));
  }
});
test('motion qualification does not claim grounded feet are correct before evidence',()=>{
  for(const id of ['blue','red'])for(const scenario of ['forward','backward','lateral']){
    const r=measureSoloMotion(recordSoloMotion(id,scenario));
    assert.ok(r.groundedSamples>0);
    assert.ok(Number.isFinite(r.maxGroundedFootSlideMeters));
  }
});

test('planted world-space foot targets expose IK reach mismatch deterministically',()=>{
  for(const id of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
    const replay=recordSoloMotion(id,scenario);
    const a=measureSoloMotion(replay),b=measureSoloMotion(replay);
    assert.ok(Number.isFinite(a.maxPlantTargetErrorMeters),`${id}:${scenario}`);
    assert.ok(a.maxPlantTargetErrorMeters>=0);
    assert.equal(a.maxPlantTargetErrorMeters,b.maxPlantTargetErrorMeters);
  }
});
