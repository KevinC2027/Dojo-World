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
    // Exercise bounds follow the realistic-stride cadence (1.4 m/s walk,
    // 0.42 guard speed scale), not the old 3.2 m/s shuffle: unguarded
    // covers ~14 m in 10 s at ~2.5 steps/s; guarded covers ~5.9 m
    // (0.588 m/s) with 10-tick footwork swings.
    assert.ok(m.horizontalTravelMeters>(guard?5:10),name+' did not exercise travel');
    assert.ok(m.supportTransfers>(guard?30:20),name+' did not exercise support transfer');
    assert.ok(m.maxPlantedAnkleStepMeters<.012,name+' planted ankle slid');
    assert.ok(m.maxPlantTargetErrorMeters<.05,name+' planted target out of reach');
    assert.ok(m.maxBoneErrorMeters<1e-8,name+' bone length changed');
    assert.equal(m.footPenetrations,0,name+' foot penetrated floor');
  }
});

test('changing direction during a step preserves its target and support anchor',()=>{
  // The mid-swing re-aim (knee-straightening work, Nov 5) deliberately moves
  // an UNREACHABLE endpoint toward the forecast touchdown root, rate-limited
  // to 0.05 m/tick so the foot curves instead of snapping. A 90-degree turn
  // strands the launch target, so the endpoint moves — but the swing is never
  // restarted, the support foot never teleports, and each tick's move stays
  // within the re-aim rate limit. That is what this test now asserts.
  for(const id of ['blue','red']){
    const tracker=new FootPlantTracker();
    const fighter={id,position:{x:0,y:0,z:0},velocity:{x:0,z:0},
      facing:{x:1,z:0},guarding:false,action:null,knockedOut:false};
    tracker.update(fighter,0);
    // Walk at a steady 1.4 m/s: the launch gate holds a swing until speed
    // settles, so a one-tick 0 -> 3.2 jump launches nothing by design.
    fighter.position.x+=1.4/60;fighter.velocity={x:1.4,z:0};
    tracker.update(fighter,1);
    fighter.position.x+=1.4/60;
    const first=tracker.update(fighter,2),side=[-1,1].find(s=>!first[s].planted);
    assert.notEqual(side,undefined);
    const launch=structuredClone(tracker.feet[side].swing),anchor=first[-side].world.slice();
    // 90-degree turn mid-swing.
    fighter.position.z+=1.4/60;fighter.velocity={x:0,z:1.4};
    const next=tracker.update(fighter,3);
    assert.equal(tracker.feet[side].swing.begin,launch.begin,'turn must not restart the swing');
    assert.equal(tracker.feet[side].swing.duration,launch.duration,'in-flight duration is inherited');
    const moved=Math.hypot(tracker.feet[side].swing.end[0]-launch.end[0],
      tracker.feet[side].swing.end[1]-launch.end[1]);
    assert.ok(moved<=.05+1e-9,`re-aim moves the endpoint at most 0.05 m/tick, moved ${moved}`);
    assert.equal(next[-side].planted,true);
    assert.deepEqual(next[-side].world,anchor);
    // Run the swing to touchdown: it is never restarted, the endpoint never
    // jumps, and the foot lands within leg reach of the root.
    let prevEnd=tracker.feet[side].swing.end.slice();
    for(let tick=4;tick<=40;tick++){
      fighter.position.z+=1.4/60;
      const frame=tracker.update(fighter,tick);
      const sw=tracker.feet[side].swing;
      if(!sw)break;
      assert.equal(sw.begin,launch.begin,'turn must not restart the swing');
      const step=Math.hypot(sw.end[0]-prevEnd[0],sw.end[1]-prevEnd[1]);
      assert.ok(step<=.05+1e-9,`endpoint step ${step} exceeds the 0.05 m/tick re-aim limit`);
      prevEnd=sw.end.slice();
      assert.ok(frame[side].point.every(Number.isFinite));
    }
    assert.equal(tracker.feet[side].swing,null,'swing must reach touchdown');
    const landed=tracker.feet[side].plant;
    assert.ok(Math.hypot(landed[0]-fighter.position.x,landed[1]-fighter.position.z)<1.0,
      'landing must stay within leg reach of the root');
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
  // Cadence-dependent floor: the realistic 24-tick stride launches ~5x per
  // 121-frame scenario (~112 across the matrix), where the old 7-tick
  // shuffle launched ~3x as often. 50 still guards against a vacuous pass
  // (no launches exercised) without encoding the old cadence.
  assert.ok(launches>=50,'must exercise repeated real gait launches');
});

test('first accelerating forward and backward steps use both feet for each fighter',()=>{
  for(const id of ['blue','red'])for(const scenario of ['forward','backward']){
    const frames=recordSoloMotion(id,scenario).frames;
    const launches=[];
    for(let i=1;i<frames.length&&launches.length<2;i++)for(const side of [-1,1]){
      const previous=frames[i-1].footTargets[side],current=frames[i].footTargets[side];
      if(previous.planted&&!current.planted)launches.push({tick:frames[i].tick,side});
    }
    assert.equal(launches.length,2,`${id}:${scenario} needs two steps`);
    assert.notEqual(launches[0].side,launches[1].side,
      `${id}:${scenario} repeated the takeoff foot while accelerating`);
  }
});
