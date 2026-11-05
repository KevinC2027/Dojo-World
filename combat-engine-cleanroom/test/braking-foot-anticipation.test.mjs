import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const fighter=(speed)=>({
  id:'blue',position:{x:0,z:0},facing:{x:0,z:1},
  velocity:{x:speed,z:0},guarding:false,action:null,knockedOut:false
});
function launch(previousSpeed){
  const tracker=new FootPlantTracker();
  tracker.update(fighter(0),0);
  tracker.previousSpeed=previousSpeed;
  tracker.update(fighter(1.5),1);
  return tracker;
}
test('decelerating root requests a shorter future swing than steady speed',()=>{
  const steady=launch(1.5),braking=launch(3);
  assert.ok(steady.feet[1].swing);
  assert.ok(braking.feet[1].swing);
  assert.ok(braking.feet[1].swing.end[0]<steady.feet[1].swing.end[0]);
});
test('braking does not retarget an already airborne foot',()=>{
  const tracker=launch(1.5);
  const landing=tracker.feet[1].swing.end.slice();
  tracker.update(fighter(0.5),2);
  assert.deepEqual(tracker.feet[1].swing.end,landing);
  assert.equal(tracker.feet[1].swing.begin,1);
});
test('same-tick replay is idempotent and does not change speed history',()=>{
  const tracker=launch(3);
  const first=tracker.result(fighter(1.5));
  const previous=tracker.previousSpeed;
  const again=tracker.update(fighter(1.5),1);
  assert.deepEqual(again,first);
  assert.equal(tracker.previousSpeed,previous);
});
test('braking lookahead does not alter world root or fighter velocity',()=>{
  const f=fighter(1.5),before=structuredClone(f);
  launch(3);
  const tracker=new FootPlantTracker();
  tracker.update(f,0);tracker.update(f,1);
  assert.deepEqual(f,before);
});
