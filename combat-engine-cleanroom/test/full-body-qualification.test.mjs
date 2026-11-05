import test from 'node:test';
import assert from 'node:assert/strict';
import {recordSoloMotion,INDEPENDENT_MOTION_SCENARIOS} from '../src/movement-qualification.mjs';
import {auditFullBodyReplay,measureFullBodyFrame,poseCenterOfMass} from '../src/full-body-qualification.mjs';

test('full-body audit covers all twenty-four independent movement fixtures deterministically',()=>{
 const names=['blue','red'].flatMap(id=>INDEPENDENT_MOTION_SCENARIOS.map(name=>[id,name]));
 assert.equal(names.length,24);
 for(const [id,name] of names){
  const replay=recordSoloMotion(id,name);
  const a=auditFullBodyReplay(replay),b=auditFullBodyReplay(replay);
  assert.deepEqual(a,b);
  assert.equal(a.frames,replay.frames.length);
  assert.ok(Number.isFinite(a.max.spineAngle)&&Number.isFinite(a.max.supportDistance));
 }
});

test('estimated COM is finite and reported independently of foot placement',()=>{
 for(const id of ['blue','red']){
  const frames=recordSoloMotion(id,'idle').frames;
  for(const f of frames){
   const com=poseCenterOfMass(f.rig);
   assert.equal(com.length,3);
   assert.ok(com.every(Number.isFinite));
   assert.deepEqual(com,measureFullBodyFrame(f).comLocal);
  }
 }
});

test('idle and steady guard have center of mass near foot support',()=>{
 for(const id of ['blue','red'])for(const s of ['idle','guard']){
  const report=auditFullBodyReplay(recordSoloMotion(id,s));
  assert.ok(report.max.supportDistance<.14,JSON.stringify(report.max));
  assert.equal(report.counts.no_planted_foot||0,0);
  assert.equal(report.counts.nonfinite||0,0);
 }
});

test('moving full-body defects are exposed, never silently marked as approved',()=>{
 for(const id of ['blue','red']){
  const report=auditFullBodyReplay(recordSoloMotion(id,'forward'));
  assert.ok(report.max.supportDistance>=0);
  assert.ok(Number.isInteger(report.flagged));
  assert.equal(typeof report.passed,'boolean');
  if(report.max.supportDistance>.14)assert.equal(report.passed,false);
 }
});

test('guard release does not cause a single-frame hand teleport',()=>{
 for(const id of ['blue','red']){
  const replay=recordSoloMotion(id,'guardRelease').frames;
  let maxStep=0;
  for(let i=55;i<64;i++){
   const f=replay[i],p=replay[i-1];
   for(let arm=0;arm<2;arm++){
    const x=f.rig.arms[arm].hand,y=p.rig.arms[arm].hand;
    maxStep=Math.max(maxStep,Math.hypot(...x.map((v,k)=>v-y[k])));
   }
  }
  assert.ok(maxStep<.09,'guard release hand motion should be blended, not hard-switched');
 }
});
