import test from 'node:test';
import assert from 'node:assert/strict';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';
import {fighterRig} from '../src/hit-rig.mjs';

const fighter=(id,tick,vx,vz)=>({
  id,position:{x:tick/60,y:0,z:0},velocity:{x:vx,z:vz},
  facing:{x:1,z:0},guarding:false,action:null,knockedOut:false
});

test('invalid velocity samples stay finite across the tracker-to-rig handoff',()=>{
  for(const id of ['blue','red']){
    const tracker=new FootPlantTracker();
    for(const [tick,vx,vz] of [[0,0,0],[1,0,Infinity],[2,-Infinity,NaN],[3,1.5,0]]){
      const f=fighter(id,tick,vx,vz),feet=tracker.update(f,tick);
      const actual=fighterRig(f,null,tick/60,feet);
      const sanitized={...f,velocity:{x:Number.isFinite(vx)?vx:0,z:Number.isFinite(vz)?vz:0}};
      const expected=fighterRig(sanitized,null,tick/60,feet);
      assert.deepEqual(actual,expected,`${id} tick ${tick}: rig must use the same finite velocity as foot tracking`);
      const joints=[actual.pelvis,actual.chest,actual.neck,actual.head,
        ...actual.arms.flatMap(a=>[a.shoulder,a.elbow,a.hand]),
        ...actual.legs.flatMap(l=>[l.hip,l.knee,l.foot])];
      assert.ok(joints.every(p=>p.every(Number.isFinite)),`${id} tick ${tick}: nonfinite joint`);
    }
  }
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
