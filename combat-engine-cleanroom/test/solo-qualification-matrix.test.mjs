import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
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
  assert.equal(typeof row.staticSupportPass,'boolean');
  assert.equal(typeof row.fullBodyDiagnosticPass,'boolean');
 }
});

test('relative-path Node CLI emits machine-readable actual-engine audit',()=>{
 const run=spawnSync(process.execPath,['src/solo-qualification-matrix.mjs'],{
  cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024
 });
 assert.equal(run.error,undefined,String(run.error));
 assert.equal(run.status,0,run.stderr);
 const report=JSON.parse(run.stdout);
 assert.equal(report.count,24);
 assert.equal(report.rows.length,24);
 assert.ok(report.rows.every(r=>r.visualApproval==='unverified'));
});
