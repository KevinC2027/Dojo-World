import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const snapshot=(id,tick,x,speed,guard=false)=>({
 id,position:{x,y:0,z:0},velocity:{x:speed,z:0},
 facing:{x:1,z:0},guarding:guard,action:null,knockedOut:false
});
const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('reverse and guard while a swing is airborne preserve original touchdown and grounded support',()=>{
 for(const id of ['blue','red']){
  const tracker=new FootPlantTracker();
  tracker.update(snapshot(id,0,0,0),0);
  const first=tracker.update(snapshot(id,1,.025,1.5),1);
  const airborne=[-1,1].find(side=>!first[side].planted);
  assert.notEqual(airborne,undefined);
  const support=-airborne;
  const anchor=first[support].world.slice();
  const destination=tracker.feet[airborne].swing.end.slice();
  let frame=first;
  for(let tick=2;tick<=7;tick++){
   // Abrupt reversal + guard transition is intentionally a presentation stress fixture.
   frame=tracker.update(snapshot(id,tick,.025-(tick-1)*.015,-.9,true),tick);
   for(const side of [-1,1]){
    assert.ok(frame[side].point.every(Number.isFinite));
    assert.ok(frame[side].world.every(Number.isFinite));
   }
   if(tick<7){
    assert.equal(frame[support].planted,true,'support stays planted until touchdown');
    assert.ok(gap(frame[support].world,anchor)<1e-9,'no support foot teleport');
    assert.equal(tracker.feet[airborne].swing?.begin,1,'reverse must not restart swing');
   }
  }
  assert.equal(frame[airborne].planted,true,'original swing reaches touchdown');
  assert.ok(gap(frame[airborne].world,destination)<1e-9,'landing endpoint preserved');
  const repeated=tracker.update(snapshot(id,7,-.065,-.9,true),7);
  assert.deepEqual(repeated,frame,'same-tick render must be idempotent');
 }
});
