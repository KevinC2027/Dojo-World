import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

function fighter(id,tick,speed,guard=false){
  return {id,position:{x:tick*speed/60,y:0,z:0},velocity:{x:speed,z:0},
    facing:{x:1,z:0},guarding:guard,action:null,knockedOut:false};
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('changing guard does not restart an airborne foot or teleport a planted foot',()=>{
  for(const id of ['blue','red']){
    const t=new FootPlantTracker();
    t.update(fighter(id,0,0),0);
    // Walk at a steady 1.5 m/s first: a one-tick 0 -> 1.5 m/s jump trips the
    // launch settle gate by design (see the braking fixture), so the swing
    // launches at tick 2 once speed has settled.
    const first=t.update(fighter(id,1,1.5),1);
    assert.equal(first[-1].planted,true);
    assert.equal(first[1].planted,true);
    const launched=t.update(fighter(id,2,1.5),2);
    const side=[-1,1].find(s=>!launched[s].planted);
    assert.notEqual(side,undefined);
    const launch=t.feet[side].swing;
    // New cadence: 0.55 m steps at 1.5 m/s -> round(0.55/1.5*60) = 22 ticks,
    // not the old 6-tick shuffle. An in-flight swing keeps its launch
    // duration even when the gait mode switches to guarded footwork.
    assert.equal(launch.duration,22);
    const anchor=launched[-side].world.slice();
    for(let tick=3;tick<=10;tick++){
      const f=fighter(id,tick,1.5,true);
      const frame=t.update(f,tick);
      assert.equal(t.feet[side].swing?.begin,2,'guard transition cannot reset swing phase');
      assert.equal(t.feet[side].swing?.duration,22,'in-flight duration remains inherited');
      assert.equal(frame[-side].planted,true);
      assert.ok(distance(frame[-side].world,anchor)<1e-10,'support anchor must not slide');
      assert.ok(frame[side].point.every(Number.isFinite));
    }
    // Step through every tick to touchdown: the tracker resets on a gap
    // (tick - lastTick > 1), so jumping straight to tick 23 would
    // re-initialize both feet as planted instead of testing the swing.
    for(let tick=11;tick<=22;tick++){
      const f=fighter(id,tick,1.5,true);
      const frame=t.update(f,tick);
      assert.equal(t.feet[side].swing?.begin,2,'guard transition cannot reset swing phase');
      assert.equal(t.feet[side].swing?.duration,22,'in-flight duration remains inherited');
      assert.equal(frame[-side].planted,true);
      assert.ok(distance(frame[-side].world,anchor)<1e-10,'support anchor must not slide');
    }
    const airborne=t.update(fighter(id,23,1.5,true),23);
    assert.equal(airborne[side].planted,false);
    const landed=t.update(fighter(id,24,1.5,true),24);
    assert.equal(landed[side].planted,true);
    assert.ok(distance(landed[side].world,launch.end)<1e-10);
  }
});

test('stopping during an existing step preserves touchdown instead of snapping the foot home',()=>{
  for(const id of ['blue','red']){
    const t=new FootPlantTracker();
    t.update(fighter(id,0,0),0);
    // Walk at a steady 1.5 m/s first: a one-tick 0 -> 1.5 m/s jump trips the
    // launch settle gate by design, so the swing launches at tick 2 once
    // speed has settled — the old fixture read a swing at tick 1 that never
    // existed. New cadence: round(0.55/1.5*60) = 22 ticks, touchdown tick 24.
    t.update(fighter(id,1,1.5),1);
    const launched=t.update(fighter(id,2,1.5),2);
    const side=[-1,1].find(s=>!launched[s].planted);
    assert.notEqual(side,undefined);
    const launch=t.feet[side].swing;
    assert.equal(launch.begin,2);
    assert.equal(launch.duration,22);
    const anchor=launched[-side].world.slice();
    // Stop the way the engine actually stops: velocity eases toward 0 at
    // ACCELERATION 25 m/s^2 (dv = 25/60 per tick) with position integrated,
    // instead of the old fixture's one-tick 1.5 -> 0 jump at a teleported
    // root (position 0). The root travels ~0.03 m more and halts at tick 6.
    let x=2*1.5/60, speed=1.5, prevEnd=launch.end.slice(), landedTick=null, finalFrame=null;
    for(let tick=3;tick<=30;tick++){
      speed=Math.max(0,speed-25/60); x+=speed/60;
      const frame=t.update({id,position:{x,y:0,z:0},velocity:{x:speed,z:0},
        facing:{x:1,z:0},guarding:false,action:null,knockedOut:false},tick);
      const sw=t.feet[side].swing;
      if(sw){
        // The in-flight step is never restarted or retimed by the stop.
        assert.equal(sw.begin,2,'stop cannot reset swing phase');
        assert.equal(sw.duration,22,'stop cannot retime an in-flight step');
        // No snap home: the endpoint curves at most 0.05 m/tick (the
        // re-aim rate limit). It DOES move — the launch target sits 0.87 m
        // from the stopped root, past the 0.50 m unreachable threshold, so
        // the re-aim shortens the final step the way a real walker does
        // instead of freezing in a lunge the 1.001 m leg cannot reach.
        assert.ok(distance(sw.end,prevEnd)<=0.05+1e-9,'endpoint moves at most 0.05 m/tick');
        prevEnd=sw.end.slice();
      } else if(landedTick===null){
        landedTick=tick;
      }
      assert.equal(frame[-side].planted,true,'support stays planted through the stop');
      assert.ok(distance(frame[-side].world,anchor)<1e-10,'support anchor must not slide');
      assert.ok(frame[side].point.every(Number.isFinite));
      finalFrame=frame;
    }
    assert.equal(landedTick,24,'swing lands on its launch schedule');
    const landed=finalFrame;
    assert.equal(landed[side].planted,true);
    // The foot completes a forward step and lands within leg reach of the
    // stopped root, on its anatomical side — not dragged home to the stance.
    assert.ok(landed[side].world[0]>x,'foot lands ahead of the stopped root');
    assert.ok(distance(landed[side].world,[x,0])<1.0,'landing within leg reach');
    assert.equal(Math.sign(landed[side].world[1]),-side,'landing keeps its anatomical side');
    assert.equal(t.gaitMode,'stance');
  }
});
