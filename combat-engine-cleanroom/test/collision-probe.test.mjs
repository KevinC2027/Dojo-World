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
  assert.equal(one.model,'stationary_torso_sweep_diagnostic_v1');
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
  assert.equal(probe.model,'stationary_torso_sweep_diagnostic_v1');
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
