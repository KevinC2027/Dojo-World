import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const fighter=(id,tick,vx,vz)=>({
  id,position:{x:tick/60,y:0,z:0},velocity:{x:vx,z:vz},
  facing:{x:1,z:0},guarding:false,action:null,knockedOut:false
});

test('nonfinite network velocity samples cannot corrupt presentation gait targets',()=>{
  for(const id of ['blue','red']){
    const tracker=new FootPlantTracker();
    tracker.update(fighter(id,0,0,0),0);
    for(const [tick,vx,vz] of [[1,Infinity,0],[2,-Infinity,NaN],[3,0,Infinity],[4,1.5,0]]){
      const frame=tracker.update(fighter(id,tick,vx,vz),tick);
      assert.ok(Number.isFinite(tracker.previousSpeed));
      assert.ok(tracker.lastDir.every(Number.isFinite));
      assert.ok(Number.isFinite(frame.postureLift));
      for(const side of [-1,1]){
        assert.ok(frame[side].point.every(Number.isFinite));
        assert.ok(frame[side].world.every(Number.isFinite));
        const swing=tracker.feet[side].swing;
        if(swing){
          assert.ok(swing.start.every(Number.isFinite));
          assert.ok(swing.end.every(Number.isFinite));
        }
      }
    }
  }
});
