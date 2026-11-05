import test from 'node:test';
import assert from 'node:assert/strict';
import {recordSoloMotion} from '../src/movement-qualification.mjs';
import {auditBrakingReplay} from '../src/braking-replay.mjs';

test('actual Blue and Red engine solo snapshots produce deterministic finite braking telemetry',()=>{
  for(const id of ['blue','red'])for(const scenario of ['idle','forward','reverse','stop','guardAdvance']){
    const replay=recordSoloMotion(id,scenario);
    const a=auditBrakingReplay(replay),b=auditBrakingReplay(replay);
    assert.deepEqual(a,b);
    assert.equal(a.frames,replay.frames.length);
    assert.ok(a.samples.every(s=>Number.isFinite(s.stoppingDistance)&&s.plantedFeet>=0));
    assert.ok(a.maxProjectedGapMeters===null||Number.isFinite(a.maxProjectedGapMeters));
  }
});
test('stationary planted idle has zero projected stopping distance',()=>{
  for(const id of ['blue','red']){
    const a=auditBrakingReplay(recordSoloMotion(id,'idle'));
    assert.equal(a.unknownSupportFrames,0);
    assert.ok(a.samples.every(s=>s.stoppingDistance===0));
  }
});
test('missing support stays unknown rather than falsely passing',()=>{
  const replay=recordSoloMotion('blue','idle');
  replay.frames[0].footTargets[-1].planted=false;
  replay.frames[0].footTargets[1].planted=false;
  const a=auditBrakingReplay(replay);
  assert.equal(a.samples[0].outsideContactRadius,null);
  assert.equal(a.unknownSupportFrames,1);
});
