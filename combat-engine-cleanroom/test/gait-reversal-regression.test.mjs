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
    let x=1.5/60;
    const first=tracker.update(fighter(id,x,1.5),1);
    const movingSide=[-1,1].find(side=>!first[side].planted);
    assert.notEqual(movingSide,undefined);
    const anchor=first[-movingSide].world.slice();
    const start=tracker.feet[movingSide].swing.start.slice();
    const end=tracker.feet[movingSide].swing.end.slice();
    for(let tick=2;tick<=7;tick++){
      x-=1.5/60;
      const frame=tracker.update(fighter(id,x,-1.5,tick>=4),tick);
      assert.ok(frame[-movingSide].planted,'support foot must remain planted');
      assert.ok(distance(frame[-movingSide].world,anchor)<1e-9,'support anchor cannot teleport');
      assert.ok(frame[movingSide].point.every(Number.isFinite));
      if(tick<7)assert.equal(tracker.feet[movingSide].swing?.begin,1,'reversal must not restart the swing');
    }
    assert.equal(tracker.feet[movingSide].swing,null);
    assert.ok(distance(tracker.feet[movingSide].plant,end)<1e-9);
    assert.ok(distance(start,end)>0);
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
