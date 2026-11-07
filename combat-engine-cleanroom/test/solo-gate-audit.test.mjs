import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSoloGate} from '../src/solo-gate-audit.mjs';

test('both fighters receive all twelve source-driven solo qualifications',()=>{
  const report=auditSoloGate();
  assert.equal(report.total,24);
  assert.equal(report.passed+report.failed,24);
  assert.equal(new Set(report.cases.map(c=>c.fighter+':'+c.scenario)).size,24);
  for(const c of report.cases){
    assert.equal(c.passed,c.failures.length===0);
    for(const metric of ['maxPlantTargetErrorMeters','maxJointStepMeters','maxStaticSupportGapMeters'])
      assert.ok(Number.isFinite(c[metric]),c.fighter+':'+c.scenario+':'+metric);
    assert.ok(c.maxProjectedBrakeGapMeters===null||Number.isFinite(c.maxProjectedBrakeGapMeters));
    assert.ok(c.unknownBrakeSupportFrames>=0);
  }
});
test('gate is deterministic and does not silently approve moving support failures',()=>{
  const a=auditSoloGate(),b=auditSoloGate();
  assert.deepEqual(a,b);
  const moving=a.cases.filter(c=>!['idle','guard','guardRelease'].includes(c.scenario));
  assert.equal(moving.length,18);
  assert.ok(moving.some(c=>c.failures.includes('static_com_support')),
    'Existing support defects must remain visible until corrected');
});
