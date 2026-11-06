import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const fighter=(id,x,v,guarding=false)=>({
  id,position:{x,y:0,z:0},velocity:{x:v,z:0},
  facing:{x:1,z:0},guarding,action:null,knockedOut:false
});
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

test('mid-swing reversal preserves support anchor and finite limb targets',()=>{
  for(const id of ['blue','red']){
    const tracker=new FootPlantTracker();
    tracker.update(fighter(id,0,0),0);
    // Walk at a steady 1.5 m/s first: a one-tick 0 -> 1.5 m/s jump trips the
    // launch settle gate by design, so the swing launches at tick 2 once
    // speed has settled. New cadence: round(0.55/1.5*60) = 22 ticks.
    tracker.update(fighter(id,1.5/60,1.5),1);
    const first=tracker.update(fighter(id,2*1.5/60,1.5),2);
    const movingSide=[-1,1].find(side=>!first[side].planted);
    assert.notEqual(movingSide,undefined);
    const anchor=first[-movingSide].world.slice();
    const launch=tracker.feet[movingSide].swing;
    const start=launch.start.slice(),end=launch.end.slice();
    assert.equal(launch.begin,2);
    assert.equal(launch.duration,22);
    // The support foot crosses the 0.35 m stranded threshold at a different
    // tick per fighter (blue's support starts 0.35 m ahead of the root, red's
    // 0.19 m), so the emergency detection — and the shortened landing — fall
    // on different ticks: blue 13, red 19. Both are 8 ticks after detection.
    const expectedLanding=id==='blue'?13:19;
    let x=2*1.5/60, prevEnd=end.slice(), landedTick=null, landedWorld=null;
    // Scope to the first reversal only (through the landing tick + 1): the
    // steady-state reverse walk after that is a separate regime — the
    // stranded foot keeps hitting the 0.75 m safety valve while the next
    // swing is still airborne, which leaves a bounded 3-tick gap (see log).
    for(let tick=3;tick<=expectedLanding+1;tick++){
      x-=1.5/60;
      const frame=tracker.update(fighter(id,x,-1.5,tick>=5),tick);
      // At least one foot planted on every tick: the emergency toe-off is
      // deferred while the first swing is airborne, so the reversal never
      // leaves the body with no support (measured 8 both-airborne ticks
      // before the deferral).
      assert.ok(frame[-1].planted||frame[1].planted,'a reversal must never leave both feet airborne');
      const sw=tracker.feet[movingSide].swing;
      if(sw){
        // The reversal never restarts or retimes the swing longer; the
        // emergency detection shortens it once, to land within 8 ticks.
        assert.equal(sw.begin,2,'reversal must not restart the swing');
        assert.ok(sw.duration<=22,'reversal must not retime the swing longer');
        // No snap home: the endpoint curves at most 0.05 m/tick (the
        // re-aim rate limit). It DOES move — the launch target is stranded
        // ahead of the reversing root, past the 0.50 m unreachable threshold.
        assert.ok(distance(sw.end,prevEnd)<=0.05+1e-9,'endpoint moves at most 0.05 m/tick');
        prevEnd=sw.end.slice();
      } else if(landedTick===null){
        landedTick=tick; landedWorld=frame[movingSide].world.slice();
      }
      assert.ok(frame[movingSide].point.every(Number.isFinite));
      // The support foot stays planted at its anchor until the swing lands;
      // it lifts on the landing tick itself (same-tick handoff).
      if(landedTick===null){
        assert.ok(frame[-movingSide].planted,'support foot must remain planted while the swing is airborne');
        assert.ok(distance(frame[-movingSide].world,anchor)<1e-9,'support anchor cannot teleport');
      }
    }
    assert.equal(landedTick,expectedLanding,'shortened swing lands 8 ticks after the emergency detection');
    // The foot lands on its re-aimed endpoint — not the launch target, which
    // the reversal stranded ahead of the root — within leg reach of the root,
    // on its anatomical side, after a real step (not dragged home).
    assert.ok(distance(landedWorld,end)>0,'landing endpoint moved from the stranded launch target');
    assert.ok(distance(landedWorld,[x,0])<1.0,'landing within leg reach');
    assert.equal(Math.sign(landedWorld[1]),-movingSide,'landing keeps its anatomical side');
    assert.ok(distance(landedWorld,start)>0);
    // The support foot launched on the landing tick: the handoff.
    assert.equal(tracker.feet[-movingSide].swing?.begin,landedTick,'support lifts on the landing tick');
  }
});

test('a second read at the same tick does not advance gait state',()=>{
  for(const id of ['blue','red']){
    const tracker=new FootPlantTracker();
    tracker.update(fighter(id,0,0),0);
    const state=fighter(id,1.5/60,1.5,true);
    const before=tracker.update(state,1);
    const start=tracker.lastStart,begin=tracker.feet[1].swing?.begin;
    const again=tracker.update(state,1);
    assert.deepEqual(again,before);
    assert.equal(tracker.lastStart,start);
    assert.equal(tracker.feet[1].swing?.begin,begin);
  }
});
