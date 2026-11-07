import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld, MOVESETS } from '../src/engine.mjs';
import { strikeContactProbe } from '../src/collision-probe.mjs';

test('3D collision probe is deterministic and does not mutate fighter state', () => {
  const world = new CombatWorld({ startingGap: 1.3 });
  const a = world.fighters.blue, b = world.fighters.red;
  const before = world.snapshot();
  const one = strikeContactProbe(a,b,'palm',1,3);
  const two = strikeContactProbe(a,b,'palm',1,3);
  assert.deepEqual(one,two);
  assert.deepEqual(world.snapshot(),before);
  assert.equal(one.model,'moving_torso_sweep_diagnostic_v2');
  assert.equal(one.limb,'right_hand');
  assert.equal(typeof one.intersected,'boolean');
});

test('distant defender does not intersect procedural limb sweep', () => {
  const world = new CombatWorld({ startingGap: 4 });
  for(let tick=0;tick<3;tick++){
    const result=strikeContactProbe(world.fighters.blue,world.fighters.red,'palm',tick,3);
    assert.equal(result.intersected,false);
    assert.equal(result.firstImpactFraction,null);
    assert.equal(result.point,null);
  }
});

test('3D collision probe rejects invalid active-frame boundaries', () => {
  const world = new CombatWorld();
  const a=world.fighters.blue,b=world.fighters.red;
  for(const [index,count] of [[-1,3],[3,3],[0,0],[0,1.5],[NaN,3]]){
    assert.throws(()=>strikeContactProbe(a,b,'palm',index,count),RangeError);
  }
});

test('authoritative contact events include a deterministic shadow collision probe', () => {
  const world = new CombatWorld({ startingGap: 1.3 });
  const events=[];
  for(let tick=0;tick<35;tick++){
    events.push(...world.step({blue:tick===0?{attack:'palm'}:{},red:{}}));
  }
  const hits=events.filter(e=>e.type==='hit');
  assert.equal(hits.length,1);
  const probe=hits[0].collisionProbe;
  assert.equal(probe.model,'moving_torso_sweep_diagnostic_v2');
  assert.equal(probe.activeFrameCount,MOVESETS.blue.palm.active);
  assert.equal(typeof probe.intersected,'boolean');
  assert.equal(hits[0].contact.model,'range_proxy_v1');
});

test('shadow collision probe leaves deterministic replay and combat outcome unchanged', () => {
  function replay(){
    const world=new CombatWorld({startingGap:1.3});
    const events=[];
    for(let tick=0;tick<40;tick++)events.push(...world.step({
      blue:tick===0?{attack:'palm'}:{},
      red:{guard:true}
    }));
    return {events,state:world.snapshot()};
  }
  assert.deepEqual(replay(),replay());
  const r=replay();
  assert.equal(r.events.filter(e=>e.type==='blocked').length,1);
  assert.equal(r.events.filter(e=>e.type==='hit').length,0);
  assert.ok(r.events.find(e=>e.type==='blocked').collisionProbe);
});

test('moving defender enters a stationary strike path in shadow geometry', () => {
  const world=new CombatWorld({startingGap:3.5});
  const a=world.fighters.blue,b=world.fighters.red;
  a.position={x:0,y:0,z:0};
  b.position={x:2.5,y:0,z:0};
  const prior={
    attacker:{position:{x:0,y:0,z:0},facing:{x:1,z:0}},
    defender:{position:{x:-0.5,y:0,z:0},facing:{x:-1,z:0}}
  };
  const one=strikeContactProbe(a,b,'palm',1,3,prior);
  const two=strikeContactProbe(a,b,'palm',1,3,prior);
  assert.deepEqual(one,two);
  assert.equal(one.previousPoseProvided,true);
  assert.equal(one.model,'moving_torso_sweep_diagnostic_v2');
  assert.equal(one.intersected,true);
});

test('tick-start pose capture preserves deterministic event diagnostics', () => {
  function replay(){
    const world=new CombatWorld({startingGap:1.3});
    const events=[];
    for(let i=0;i<36;i++)events.push(...world.step({
      blue:i===0?{attack:'palm',move:{x:1,z:0}}:{move:{x:1,z:0}},
      red:{move:{x:-1,z:0}}
    }));
    return {events,state:world.snapshot()};
  }
  const first=replay(),second=replay();
  assert.deepEqual(first,second);
  const event=first.events.find(e=>e.type==='hit'||e.type==='blocked');
  assert.ok(event);
  assert.equal(event.collisionProbe.model,'moving_torso_sweep_diagnostic_v2');
  assert.equal(event.collisionProbe.previousPoseProvided,true);
  assert.equal(event.contact.model,'range_proxy_v1');
});
