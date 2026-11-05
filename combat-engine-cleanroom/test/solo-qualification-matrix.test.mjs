import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSoloQualificationMatrix} from '../src/solo-qualification-matrix.mjs';
test('24 clean-room movement reports retain diagnostic provenance',()=>{
 const rows=buildSoloQualificationMatrix();
 assert.equal(rows.length,24);
 assert.equal(new Set(rows.map(r=>r.fighter+':'+r.scenario)).size,24);
 for(const row of rows){
  assert.equal(row.visualApproval,'unverified');
  assert.ok(Number.isFinite(row.jointStepMeters));
  assert.ok(Number.isFinite(row.plantedTargetErrorMeters));
  assert.ok(Number.isFinite(row.captureDistanceMeters));
  assert.equal(typeof row.geometryPass,'boolean');
  assert.equal(typeof row.continuityPass,'boolean');
 }
});
