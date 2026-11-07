import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const snapshot=(id,x,speed,guard=false)=>({
 id,position:{x,y:0,z:0},velocity:{x:speed,z:0},
 facing:{x:1,z:0},guarding:guard,action:null,knockedOut:false
});
const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('reverse and guard while a swing is airborne preserve support and land on the re-aimed endpoint',()=>{
 for(const id of ['blue','red']){
  const tracker=new FootPlantTracker();
  tracker.update(snapshot(id,0,0),0);
  // Settled-speed fixture: walk forward at a steady 1.5 m/s so the swing
  // launches at tick 2 (the old one-tick 0 -> 1.5 m/s jump tripped the
  // launch settle gate and no swing ever launched). Abrupt reversal +
  // guard transition at tick 3 is intentionally a presentation stress
  // fixture; the swing is airborne through it.
  let x=0;
  x+=1.5/60; tracker.update(snapshot(id,x,1.5),1);
  x+=1.5/60;
  const first=tracker.update(snapshot(id,x,1.5),2);
  const airborne=[-1,1].find(side=>!first[side].planted);
  assert.notEqual(airborne,undefined);
  const support=-airborne;
  const anchor=first[support].world.slice();
  let prevEnd=tracker.feet[airborne].swing.end.slice();
  let prevDuration=tracker.feet[airborne].swing.duration;
  let landingTick=-1,landingFrame=null;
  for(let tick=3;tick<=30;tick++){
   x-=0.9/60;
   const frame=tracker.update(snapshot(id,x,-0.9,true),tick);
   for(const side of [-1,1]){
    assert.ok(frame[side].point.every(Number.isFinite));
    assert.ok(frame[side].world.every(Number.isFinite));
   }
   // At least one foot planted on every tick — the deferred emergency
   // toe-off (run 13) must not lift the support while this swing flies.
   assert.ok(frame[-1].planted||frame[1].planted,'no both-airborne tick');
   const swing=tracker.feet[airborne].swing;
   if(swing){
    assert.equal(swing.begin,2,'reverse must not restart swing');
    assert.ok(swing.duration<=prevDuration,'swing duration never lengthens');
    assert.ok(gap(swing.end,prevEnd)<=0.05+1e-9,'re-aim moves at most 0.05 m/tick');
    prevEnd=swing.end.slice();
    prevDuration=swing.duration;
    assert.equal(frame[support].planted,true,'support stays planted until touchdown');
    assert.ok(gap(frame[support].world,anchor)<1e-9,'no support foot teleport');
   }else if(landingTick===-1){
    landingTick=tick;
    landingFrame=frame;
    // The launch target is stale after a 180 deg reversal: the re-aim
    // deliberately moves the endpoint (up to 0.05 m/tick), so the landing
    // is asserted against the FINAL re-aimed endpoint, within leg reach
    // of the root at landing and on its anatomical side — not the launch
    // target, which would be ~1.2 m away and collapse the pelvis.
    assert.ok(gap(frame[airborne].world,prevEnd)<1e-9,'landing on re-aimed endpoint');
    assert.ok(gap(frame[airborne].world,[x,0])<=1.0,'landing within leg reach');
    if(airborne===-1)assert.ok(frame[airborne].world[1]>0,'left foot stays on its side');
    else assert.ok(frame[airborne].world[1]<0,'right foot stays on its side');
    // Same-tick handoff: the support foot launches on the landing tick.
    assert.equal(tracker.feet[support].swing?.begin,tick,'support launches on landing tick');
    break;
   }
  }
  assert.notEqual(landingTick,-1,'swing reaches touchdown');
  assert.ok(landingTick<=24,'touchdown within the original 22-tick swing');
  assert.ok(landingFrame.guardWeight>0,'guard is raising through the reversal');
  // One more tick of guarded reverse walking, then idempotency at that tick.
  x-=0.9/60;
  const after=tracker.update(snapshot(id,x,-0.9,true),landingTick+1);
  assert.ok(after[-1].planted||after[1].planted,'no both-airborne tick after landing');
  const repeated=tracker.update(snapshot(id,x,-0.9,true),landingTick+1);
  assert.deepEqual(repeated,after,'same-tick render must be idempotent');
 }
});
