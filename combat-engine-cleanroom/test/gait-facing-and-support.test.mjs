import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatWorld} from '../src/engine.mjs';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';
import {fighterRig} from '../src/hit-rig.mjs';
import {recordSoloMotion,measureSoloMotion} from '../src/movement-qualification.mjs';

test('forward, backward and reversal steps keep each foot on its anatomical side',()=>{
  for(const id of ['blue','red'])for(const scenario of
    ['forward','backward','reverse','stop','guardAdvance','guardRetreat']){
    const replay=recordSoloMotion(id,scenario);
    // These longitudinal fixtures are not crossover steps. Check actual IK
    // ankles, including airborne frames and after reversals, not just targets.
    for(const {tick,rig} of replay.frames.slice(30))for(const leg of rig.legs){
      assert.ok(leg.side*leg.foot[0]>.1,
        `${id}:${scenario}:${tick} side ${leg.side} crossed its stance`);
    }
  }
});

test('ten-second fast and guarded footwork retains reachable planted feet',()=>{
  const vectors=[{x:1,z:0},{x:-1,z:0},{x:0,z:1}];
  for(const id of ['blue','red'])for(const guard of [false,true])for(const move of vectors){
    const world=new CombatWorld({startingGap:100}),tracker=new FootPlantTracker(),frames=[];
    for(let t=0;t<=600;t++){
      if(t)world.step({[id]:{move,guard}});
      const snapshot=world.snapshot(),fighter=snapshot.fighters[id];
      const footTargets=tracker.update(fighter,snapshot.tick);
      const rig=fighterRig(fighter,null,snapshot.timeSeconds,footTargets);
      frames.push({tick:snapshot.tick,fighter:structuredClone(fighter),rig,
        footTargets:structuredClone(footTargets)});
    }
    const m=measureSoloMotion({fighterId:id,scenarioId:'extendedFootwork',frames});
    const name=`${id}:guard=${guard}:move=${move.x},${move.z}`;
    assert.ok(m.horizontalTravelMeters>10,name+' did not exercise travel');
    assert.ok(m.supportTransfers>40,name+' did not exercise support transfer');
    assert.ok(m.maxPlantedAnkleStepMeters<.012,name+' planted ankle slid');
    assert.ok(m.maxPlantTargetErrorMeters<.05,name+' planted target out of reach');
    assert.ok(m.maxBoneErrorMeters<1e-8,name+' bone length changed');
    assert.equal(m.footPenetrations,0,name+' foot penetrated floor');
  }
});

test('changing direction during a step preserves its target and support anchor',()=>{
  for(const id of ['blue','red']){
    const tracker=new FootPlantTracker();
    const fighter={id,position:{x:0,y:0,z:0},velocity:{x:0,z:0},
      facing:{x:1,z:0},guarding:false,action:null,knockedOut:false};
    tracker.update(fighter,0);
    fighter.velocity={x:3.2,z:0};
    const first=tracker.update(fighter,1),side=[-1,1].find(s=>!first[s].planted);
    assert.notEqual(side,undefined);
    const launch=structuredClone(tracker.feet[side].swing),anchor=first[-side].world;
    fighter.position.z+=3.2/60;fighter.velocity={x:0,z:3.2};
    const next=tracker.update(fighter,2);
    assert.deepEqual(tracker.feet[side].swing,launch);
    assert.equal(next[-side].planted,true);
    assert.deepEqual(next[-side].world,anchor);
  }
});

test('whole-body height changes remain bounded through stop, reverse and sidestep',()=>{
  // A diagnostic bound, not a claim of naturalness or a substitute for video.
  for(const id of ['blue','red'])for(const scenario of ['stop','reverse','lateral']){
    const frames=recordSoloMotion(id,scenario).frames;
    for(let i=1;i<frames.length;i++){
      const delta=Math.abs(frames[i].rig.pelvis[1]-frames[i-1].rig.pelvis[1]);
      assert.ok(delta<.025,`${id}:${scenario}:${i} torso height step ${delta}`);
    }
  }
});

test('launching feet remain on their locked ground targets without torso height snaps',()=>{
  let launches=0;
  for(const id of ['blue','red'])for(const scenario of ['forward','backward','lateral','reverse','stop','guardAdvance','guardRetreat','guardLateral','guardStop']){
    const frames=recordSoloMotion(id,scenario).frames;
    for(const f of frames)for(const leg of f.rig.legs){
      const target=f.footTargets[leg.side];
      if(target.groundedContact&&!target.planted){
        launches++;
        assert.ok(Math.abs(leg.foot[1]-target.point[1])<1e-8,
          `${id}:${scenario}:${f.tick}:${leg.side} launch ankle rose above the target`);
        assert.ok(Math.hypot(...leg.foot.map((v,i)=>v-target.point[i]))<1e-8,
          `${id}:${scenario}:${f.tick}:${leg.side} launch foot escaped its locked target`);
      }
    }
  }
  assert.ok(launches>=200,'must exercise repeated real gait launches');
});
