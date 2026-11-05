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
    const first=t.update(fighter(id,1,1.5),1);
    const side=[-1,1].find(s=>!first[s].planted);
    assert.notEqual(side,undefined);
    const launch=t.feet[side].swing;
    assert.equal(launch.duration,6);
    const anchor=first[-side].world.slice();
    for(let tick=2;tick<=5;tick++){
      const f=fighter(id,tick,1.5,true);
      const frame=t.update(f,tick);
      assert.equal(t.feet[side].swing?.begin,1,'guard transition cannot reset swing phase');
      assert.equal(t.feet[side].swing?.duration,6,'in-flight duration remains inherited');
      assert.equal(frame[-side].planted,true);
      assert.ok(distance(frame[-side].world,anchor)<1e-10,'support anchor must not slide');
      assert.ok(frame[side].point.every(Number.isFinite));
    }
    const touchdown=t.update(fighter(id,6,1.5,true),6);
    assert.equal(touchdown[side].planted,false);
    const landed=t.update(fighter(id,7,1.5,true),7);
    assert.equal(landed[side].planted,true);
    assert.ok(distance(landed[side].world,launch.end)<1e-10);
  }
});

test('stopping during an existing step preserves touchdown instead of snapping the foot home',()=>{
  for(const id of ['blue','red']){
    const t=new FootPlantTracker();
    t.update(fighter(id,0,0),0);
    const first=t.update(fighter(id,1,1.5),1);
    const side=[-1,1].find(s=>!first[s].planted);
    const target=t.feet[side].swing.end.slice();
    let prev=first;
    for(let tick=2;tick<=7;tick++){
      const f=fighter(id,1,0);
      const frame=t.update(f,tick);
      if(prev[-side].planted&&frame[-side].planted)
        assert.ok(distance(prev[-side].world,frame[-side].world)<1e-10);
      prev=frame;
    }
    assert.equal(prev[side].planted,true);
    assert.ok(distance(prev[side].world,target)<1e-10);
    assert.equal(t.gaitMode,'stance');
  }
});
