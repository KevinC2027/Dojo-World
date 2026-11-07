import test from 'node:test';
import assert from 'node:assert/strict';
import {recordSoloMotion,measureSoloMotion,auditIndependentMotion,INDEPENDENT_MOTION_SCENARIOS} from '../src/movement-qualification.mjs';
test('24 independent deterministic 60Hz motion demonstrations exist',()=>{
  const reports=auditIndependentMotion();
  assert.equal(reports.length,24);
  assert.equal(INDEPENDENT_MOTION_SCENARIOS.length,12);
  assert.equal(new Set(reports.map(r=>r.fighter+':'+r.scenario)).size,24);
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

test('worst moving joint is labeled with its exact reproducible frame',()=>{
  for(const id of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
    const replay=recordSoloMotion(id,scenario);
    const report=measureSoloMotion(replay);
    const worst=report.worstJointStep;
    assert.ok(Number.isFinite(worst.meters));
    assert.equal(worst.meters,report.maxJointStepMeters);
    assert.ok(worst.tick>=0&&worst.tick<replay.frames.length);
    if(worst.meters>0)assert.match(worst.joint,/^(pelvis|chest|neck|head|(left|right)(Shoulder|Elbow|Hand|Hip|Knee|Foot))$/);
    assert.deepEqual(worst,measureSoloMotion(recordSoloMotion(id,scenario)).worstJointStep);
  }
});

test('speed-matched gait prevents accumulating planted-foot reach debt',()=>{
  for(const id of ['blue','red'])
    for(const scenario of ['forward','backward','lateral','reverse','stop']){
      const report=measureSoloMotion(recordSoloMotion(id,scenario));
      assert.ok(report.maxPlantTargetErrorMeters<.10,
        id+':'+scenario+' planted foot escaped IK reach by '+report.maxPlantTargetErrorMeters+' m');
      assert.equal(report.footPenetrations,0);
      assert.ok(report.maxBoneErrorMeters<1e-8);
    }
});

test('guarded footwork remains distinct from fast gait and has reachable planted ankles',()=>{
  for(const id of ['blue','red']){
    const replay=recordSoloMotion(id,'guardAdvance');
    const report=measureSoloMotion(replay);
    assert.equal(replay.frames.at(-1).footTargets.gaitMode,'footwork');
    assert.ok(report.horizontalTravelMeters>1);
    assert.ok(report.maxPlantTargetErrorMeters<.02,id+' footwork target escaped leg reach');
    assert.ok(report.maxJointStepMeters<.12,id+' footwork joint jumped');
    assert.equal(report.footPenetrations,0);
  }
});

test('guarded retreat, lateral shuffle and stop preserve floor and reach',()=>{
 for(const id of ['blue','red'])
  for(const scenario of ['guardRetreat','guardLateral','guardStop']){
   const replay=recordSoloMotion(id,scenario),report=measureSoloMotion(replay);
   assert.ok(report.maxPlantTargetErrorMeters<.03,id+':'+scenario+':reach');
   assert.ok(report.maxJointStepMeters<.15,id+':'+scenario+':joint');
   assert.equal(report.footPenetrations,0);
   assert.ok(report.maxBoneErrorMeters<1e-8);
  }
});

test('support-reach-aware stepping bounds actual rendered ankle error in all 24 fixtures',()=>{
 for(const id of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
  const report=measureSoloMotion(recordSoloMotion(id,scenario));
  assert.ok(report.maxPlantTargetErrorMeters<.05,id+':'+scenario+' reach error '+report.maxPlantTargetErrorMeters);
  assert.equal(report.errors.length,0);
  assert.equal(report.footPenetrations,0);
 }
});
