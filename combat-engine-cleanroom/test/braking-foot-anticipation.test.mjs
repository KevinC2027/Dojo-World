import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const fighter=(speed)=>({
  id:'blue',position:{x:0,z:0},facing:{x:0,z:1},
  velocity:{x:speed,z:0},guarding:false,action:null,knockedOut:false
});
function launch(previousSpeed,speed=1.5){
  const tracker=new FootPlantTracker();
  tracker.update(fighter(0),0);
  tracker.previousSpeed=previousSpeed;
  tracker.update(fighter(speed),1);
  return tracker;
}
test('decelerating root requests a shorter future swing than steady speed',()=>{
  // Deceleration is gradual here (1.54 -> 1.5 m/s in one tick). The tracker
  // holds a new swing until speed settles (per-tick change < 0.05 m/s), so a
  // one-tick 3 -> 1.5 m/s jump launches nothing at tick 1 by design — that
  // old fixture assumed the 3.2 m/s cadence's immediate launch. A gentle
  // brake is how the engine actually decelerates, and it is the live path
  // for the braking forecast below.
  const steady=launch(1.5),braking=launch(1.54);
  const steadySwing=Object.values(steady.feet).find(leg=>leg.swing)?.swing;
  const brakingSwing=Object.values(braking.feet).find(leg=>leg.swing)?.swing;
  assert.ok(steadySwing&&brakingSwing);
  assert.ok(brakingSwing.end[0]<steadySwing.end[0]);
});
test('braking does not retarget an already airborne foot',()=>{
  const tracker=launch(1.5);
  const airborne=Object.values(tracker.feet).find(leg=>leg.swing);
  assert.ok(airborne);
  const landing=airborne.swing.end.slice();
  tracker.update(fighter(0.5),2);
  assert.deepEqual(airborne.swing.end,landing);
  assert.equal(airborne.swing.begin,1);
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
