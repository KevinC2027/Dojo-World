import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';
const D=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function fighter(id='blue',tick=0,speed=0){
 return {id,position:{x:tick*speed/60,y:0,z:0},velocity:{x:speed,z:0},
  facing:{x:1,z:0},action:null,guarding:false,knockedOut:false};
}
test('standing still keeps both foot plant targets locked',()=>{
 const t=new FootPlantTracker(),first=t.update(fighter('blue',0,0),0);
 for(let i=1;i<100;i++){
  const n=t.update(fighter('blue',i,0),i);
  for(const side of [-1,1]){assert.equal(n[side].planted,true);assert.deepEqual(n[side].world,first[side].world)}
 }
});
test('moving forward alternates independent swing and world-locked support',()=>{
 const t=new FootPlantTracker();let prev=t.update(fighter('blue',0,0),0),swingCount=0,alternations=0,lastSwing=null;
 for(let i=1;i<=150;i++){
  const now=t.update(fighter('blue',i,3.2),i);
  const airborne=[-1,1].filter(side=>!now[side].planted);
  assert.ok(airborne.length<=1,'one foot must support during ordinary walk');
  if(airborne.length){
   swingCount++;
   if(airborne[0]!==lastSwing){if(lastSwing!==null)alternations++;lastSwing=airborne[0]}
  }
  for(const side of [-1,1])if(now[side].planted&&prev[side].planted)
   assert.ok(D(now[side].world,prev[side].world)<1e-10,'support foot must not skate');
  prev=now;
 }
 assert.ok(swingCount>20);assert.ok(alternations>2);
});
test('repeated render at identical engine tick never advances a step',()=>{
 const t=new FootPlantTracker();
 for(let i=0;i<20;i++)t.update(fighter('red',i,2.5),i);
 const f=fighter('red',19,2.5),a=t.update(f,19),b=t.update(f,19);
 assert.deepEqual(a,b);
});
test('reverse and abrupt stop do not create nonfinite positions',()=>{
 const t=new FootPlantTracker();
 for(let i=0;i<=180;i++){
  const speed=i<75?3.2:i<135?-3.2:0;
  const f=fighter('blue',0,speed);f.position.x=i<75?i*3.2/60:i<135?(150-i)*3.2/60:15*3.2/60;
  const r=t.update(f,i);
  for(const side of [-1,1]){assert.ok(r[side].point.every(Number.isFinite));assert.ok(r[side].world.every(Number.isFinite))}
 }
});
test('tracker is deterministic and resets when the simulation restarts',()=>{
 const a=new FootPlantTracker(),b=new FootPlantTracker();
 for(let i=0;i<60;i++)assert.deepEqual(a.update(fighter('blue',i,3),i),b.update(fighter('blue',i,3),i));
 assert.deepEqual(a.update(fighter('blue',0,0),0),new FootPlantTracker().update(fighter('blue',0,0),0));
});

test('reverse and guard transitions bound sprint stride while preserving world-space plants',()=>{
 for(const id of ['blue','red']){
  const tracker=new FootPlantTracker();
  let last=null;
  for(let tick=0;tick<=180;tick++){
   const f=fighter(id,0,0);
   f.position.x=tick<60?tick*.05:tick<120?(120-tick)*.05:0;
   f.velocity.x=tick<60?3:tick<120?-3:0;
   f.guarding=tick>=120&&tick<150;
   const result=tracker.update(f,tick);
   for(const side of [-1,1]){
    const swing=tracker.feet[side].swing;
    if(swing){
     // Stride is capped from the stance ankle, not from the swinging
     // foot's own plant: a swing foot legitimately travels ~2x step
     // length (measured 1.15-1.33 m at 3 m/s). Bound the landing
     // against the foot staying planted (or its in-flight endpoint).
     const stance=tracker.feet[-side];
     const stancePlant=stance.swing?stance.swing.end:stance.plant;
     assert.ok(D(stancePlant,swing.end)<=.950000001,id+':'+tick+':'+side);
     // Loose sanity bound on the swing itself: a runaway endpoint
     // (the old uncapped failure reached 1.29 m stance-to-end and
     // far more foot travel) must still trip the test.
     assert.ok(D(swing.start,swing.end)<=1.500000001,id+':'+tick+':'+side);
    }
    assert.ok(result[side].world.every(Number.isFinite));
    if(last&&result[side].planted&&last[side].planted)
     assert.ok(D(result[side].world,last[side].world)<1e-10,'planted foot drift');
   }
   last=result;
  }
 }
});

test('swing liftoff is position-continuous and planted support stays fixed',()=>{
 for(const id of ['blue','red']){
  const tracker=new FootPlantTracker();
  let previous=tracker.update(fighter(id,0,0),0);
  let liftoffs=0;
  for(let tick=1;tick<=140;tick++){
   const f=fighter(id,tick,3);
   const current=tracker.update(f,tick);
   for(const side of [-1,1]){
    if(previous[side].planted&&!current[side].planted){
     liftoffs++;
     assert.ok(D(previous[side].world,current[side].world)<1e-10,'no jump at swing start');
     assert.ok(Math.abs(current[side].point[1]-.035)<1e-10,'no vertical lift on first swing frame');
    }
    if(previous[side].planted&&current[side].planted)
     assert.ok(D(previous[side].world,current[side].world)<1e-10,'support stays planted');
   }
   previous=current;
  }
  assert.ok(liftoffs>=3,'exercise multiple liftoffs');
 }
});

test('projected travel selects trailing foot, including when it overrides alternation',()=>{
 const tracker=new FootPlantTracker();
 // Start cruising: the launch gate holds a step until speed settles, so the
 // root must already be moving at tick 0 for a launch at tick 1.
 const f=fighter('blue',0,3);
 tracker.update(f,0);
 // Future touchdown reach overrides alternation when one foot will trail.
 tracker.swingSide=1;
 tracker.feet[-1].plant=[-.24,0];
 tracker.feet[1].plant=[.24,0];
 f.velocity={x:3,z:0};
 const first=tracker.update(f,1);
 assert.equal(first[-1].planted,false,'projected trailing foot starts first');
 assert.equal(first[1].planted,true);
 // A strongly lagging opposite foot must override the alternating preference.
 const next=new FootPlantTracker();
 next.update(fighter('blue',0,3),0);
 next.swingSide=1;
 next.feet[-1].plant=[-1.1,0];
 next.feet[1].plant=[.24,0];
 const second=next.update(f,1);
 assert.equal(second[-1].planted,false,'lagging foot gets priority');
 assert.equal(second[1].planted,true);
});

test('guarded shuffle respects its shorter stride cap despite longer touchdown interval',()=>{
 for(const id of ['blue','red']){
  const normal=new FootPlantTracker(),guarded=new FootPlantTracker();
  // Start cruising: the launch gate holds a step until speed settles, so the
  // root must already be moving at tick 0 for a launch at tick 1. The old
  // fixture jumped 0 -> 3.2 m/s in one tick and nothing launched.
  const cruise=fighter(id,0,3.2),cruiseGuard=fighter(id,0,3.2);
  cruiseGuard.guarding=true;
  normal.update(cruise,0);guarded.update(cruiseGuard,0);
  // Exercise the actual cap: at 1.5 m/s Red's normal target is already
  // shorter than the guarded cap, so comparing endpoints there is invalid.
  const run=fighter(id,0,3.2),shuffle=fighter(id,0,3.2);
  shuffle.guarding=true;
  normal.update(run,1);guarded.update(shuffle,1);
  const normalSwing=Object.values(normal.feet).find(l=>l.swing)?.swing;
  const guardSwing=Object.values(guarded.feet).find(l=>l.swing)?.swing;
  assert.ok(normalSwing&&guardSwing,'both modes must initiate a swing');
  // Cadence is derived from speed now (2 steps/s at 1.4 m/s): at 3.2 m/s
  // the normal swing is round(0.55/3.2*60) = 10 ticks, the same as the
  // guarded shuffle's fixed 10. The old 7-tick shuffle duration is gone,
  // so the cap difference alone makes the guarded step shorter.
  assert.equal(normalSwing.duration,10);
  assert.equal(guardSwing.duration,10);
  assert.ok(guardSwing.end[0]<normalSwing.end[0],
    'guarded step must remain shorter when its stride cap is reached');
  // Stride is capped from the stance ankle, not from the swinging foot's
  // own plant (see the reverse/guard stride test): a swing foot
  // legitimately travels ~2x step length. The cap bounds reach in the
  // travel direction; the ~0.44 m lateral lane separation is fixed
  // anatomy, so the fore-aft component from the stance ankle is the
  // capped quantity (measured: guard 0.385 blue / 0.429 red vs the 0.52
  // guard cap; normal 0.483 blue / 0.619 red vs 0.75).
  const alongFromStance=(tracker)=>{
   const side=[-1,1].find(s=>tracker.feet[s].swing);
   const sw=tracker.feet[side].swing,stance=tracker.feet[-side];
   const stancePlant=stance.swing?stance.swing.end:stance.plant;
   return sw.end[0]-stancePlant[0];
  };
  assert.ok(alongFromStance(guarded)<=.520000001,'guarded stride cap');
  assert.ok(alongFromStance(normal)<=.750000001,'normal stride cap');
  // Loose sanity bound on the swing itself: a runaway endpoint must
  // still trip the test (measured travel 0.79-1.11 m at 3 m/s).
  assert.ok(D(guardSwing.start,guardSwing.end)<=1.500000001);
  assert.ok(D(normalSwing.start,normalSwing.end)<=1.500000001);
 }
});


test('touchdown projection selects future trailing foot instead of current farthest foot',()=>{
 for(const id of ['blue','red']){
  const tracker=new FootPlantTracker();
  // Start cruising: the launch gate holds a step until speed settles, so
  // the root must already be moving at tick 0 for a launch at tick 1. The
  // old fixture started stationary and jumped to 3.2 m/s in one tick, so
  // nothing launched at all.
  tracker.update(fighter(id,0,3.2),0);
  // Left is currently farther from the root, but lies ahead of travel.
  // Right is close now and becomes the lagging support at touchdown.
  tracker.swingSide=-1;
  tracker.feet[-1].plant=[.22,0];
  tracker.feet[1].plant=[-.08,0];
  const moving=fighter(id,0,3.2);
  const result=tracker.update(moving,1);
  assert.equal(result[1].planted,false,'future trailing foot should swing');
  assert.equal(result[-1].planted,true,'forward support remains anchored');
  assert.deepEqual(result[-1].world,[.22,0]);
  assert.ok(Math.hypot(...tracker.feet[1].swing.end.map((v,i)=>v-tracker.feet[1].swing.start[i]))<=.950000001);
 }
});

test('pelvis support sway begins settling on the exact touchdown tick',()=>{
 for(const id of ['blue','red']){
  const tracker=new FootPlantTracker();
  // Start cruising: the launch gate holds a step until speed settles, so
  // the root must already be moving at tick 0 for a launch at tick 1. The
  // old fixture started stationary and jumped to 1.5 m/s in one tick, so
  // nothing launched at all (same root cause as the braking, projected-
  // travel, guarded-shuffle and touchdown-projection fixes).
  tracker.update(fighter(id,0,1.5),0);
  const launch=tracker.update(fighter(id,1,1.5),1);
  const side=[-1,1].find(s=>!launch[s].planted);
  assert.notEqual(side,undefined,'step launched');
  const sw=tracker.feet[side].swing;
  assert.ok(sw,'swing exists');
  // Freeze the authoritative root for a controlled landing while allowing
  // the already airborne presentation foot to finish its original swing.
  for(let tick=2;tick<sw.begin+sw.duration;tick++)
   tracker.update(fighter(id,1,0),tick);
  const before=tracker.bodySway;
  const landed=tracker.update(fighter(id,1,0),sw.begin+sw.duration);
  assert.equal(landed[side].planted,true);
  assert.equal(landed[-side].planted,true);
  assert.ok(Math.abs(landed.bodySway)<Math.abs(before),
    'pelvis sway must relax on touchdown, not one tick later');
  assert.ok(Math.abs(landed.bodySway-before)<=.28+1e-10,
    'pelvis handoff must remain bounded');
 }
});

test('braking removes minimum anticipation without changing planted support',()=>{
 for(const id of ['blue','red']){
  const steady=new FootPlantTracker(),braking=new FootPlantTracker();
  // Start cruising: the launch gate holds a step until speed settles, so
  // the root must already be moving at tick 0 for a launch at tick 1. The
  // old fixture started stationary and jumped to 1 m/s in one tick, so
  // nothing launched at all (same root cause as the braking, projected-
  // travel, guarded-shuffle, touchdown-projection and pelvis-sway fixes).
  // Braking is a 0.04 one-tick decel, inside the 0.05 settle band (same
  // pattern as run 2's 1.54 -> 1.5): the engine still treats any
  // previousSpeed > speed as braking, drops the 0.08 anticipation floor
  // to 0, and collapses the forecast to zero.
  steady.update(fighter(id,0,1),0);braking.update(fighter(id,0,1),0);
  braking.previousSpeed=1.04;
  const current=fighter(id,0,1);
  steady.update(current,1);braking.update(current,1);
  const a=Object.values(steady.feet).find(l=>l.swing)?.swing;
  const b=Object.values(braking.feet).find(l=>l.swing)?.swing;
  assert.ok(a&&b,'both planners launch a step');
  assert.ok(b.end[0]<a.end[0]-.05,'braking foot lands nearer');
  assert.equal(a.duration,b.duration);
  for(const side of [-1,1]){
   assert.ok(steady.feet[side].plant.every(Number.isFinite));
   assert.ok(braking.feet[side].plant.every(Number.isFinite));
  }
 }
});
