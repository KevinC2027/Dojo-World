import test from 'node:test';
import assert from 'node:assert/strict';
import { strikeSpec, strikeEndpoint, strikeTickSweep } from '../src/trajectory.mjs';
import { sweptSphereCapsuleFirstImpact } from '../src/sweep.mjs';

const fighter=(x=0,forward=1)=>({
  position:{x,y:0,z:0}, facing:{x:forward,z:0}
});
const defender=x=>({position:{x,y:0,z:0}});

test('all ten strikes have deterministic finite endpoints and limb labels',()=>{
  for(const name of ['palm','straight','frontKick','roundhouse','jab','cross','hook','uppercut','leadUppercut','overhand']){
    const a=strikeEndpoint(fighter(),name,.5);
    assert.ok(Object.values(a).every(Number.isFinite));
    assert.deepEqual(a,strikeEndpoint(fighter(),name,.5));
    assert.match(strikeSpec(name).limb,/_(hand|foot)$/);
  }
});

test('endpoint is continuous at active-phase boundaries and returns to guard',()=>{
  for(const name of ['palm','straight','frontKick','roundhouse','jab','cross','hook','uppercut','leadUppercut','overhand']){
    const f=fighter();
    assert.deepEqual(strikeEndpoint(f,name,0),strikeEndpoint(f,name,1));
    const before=strikeEndpoint(f,name,.001),start=strikeEndpoint(f,name,0);
    assert.ok(Math.hypot(before.x-start.x,before.y-start.y,before.z-start.z)<.0001);
  }
});

test('trajectory rotates with fighter facing and translates with world position',()=>{
  const a=strikeEndpoint(fighter(), 'straight', .5);
  const b=strikeEndpoint({position:{x:4,y:.3,z:2},facing:{x:0,z:1}},'straight',.5);
  assert.ok(Math.abs((b.z-2)-a.x)<1e-8);
  assert.ok(Math.abs(b.y-a.y-.3)<1e-8);
});

test('nearby defender capsule intersects active strike trajectory',()=>{
  const f=fighter();
  const params=strikeTickSweep(f,'straight',.25,.5,defender(1.25));
  const hit=sweptSphereCapsuleFirstImpact(params.previous,params.current,params.strikeRadius,
    params.capsuleStart,params.capsuleEnd,params.capsuleRadius);
  assert.ok(hit);
  assert.ok(hit.firstImpactFraction>=0 && hit.firstImpactFraction<=1);
});

test('lateral miss does not create contact despite horizontal proximity',()=>{
  const f=fighter();
  const d={position:{x:1.25,y:0,z:1.2}};
  const params=strikeTickSweep(f,'straight',.25,.5,d);
  const hit=sweptSphereCapsuleFirstImpact(params.previous,params.current,params.strikeRadius,
    params.capsuleStart,params.capsuleEnd,params.capsuleRadius);
  assert.equal(hit,null);
});

test('invalid pose, fraction and unknown moves are rejected',()=>{
  assert.throws(()=>strikeSpec('fake'),RangeError);
  assert.throws(()=>strikeEndpoint(fighter(),'jab',NaN),TypeError);
  assert.throws(()=>strikeEndpoint({position:{x:0,y:0,z:0},facing:{x:0,z:0}},'jab',.5),RangeError);
  assert.throws(()=>strikeTickSweep(fighter(),'jab',.8,.2,defender(1)),RangeError);
});
