import test from 'node:test';
import assert from 'node:assert/strict';
import {brakingSupportSnapshot} from '../src/braking-support.mjs';

test('stationary Blue/Red poses have zero stopping distance',()=>{
  for(const root of [[0,0],[2,-3]]){
    const r=brakingSupportSnapshot({root,velocity:[0,0],contacts:[root]});
    assert.equal(r.stoppingDistance,0);
    assert.deepEqual(r.projectedStop,root);
    assert.equal(r.outsideContactRadius,0);
  }
});
test('reverse, lateral and guarded motion use signed world-space velocity',()=>{
  for(const velocity of [[-3.2,0],[0,3.2],[1.5,0]]){
    const r=brakingSupportSnapshot({root:[0,0],velocity,contacts:[[0,0]]});
    assert.ok(r.stoppingDistance>0);
    assert.ok(r.projectedStop[0]*velocity[0]+r.projectedStop[1]*velocity[1]>0);
    assert.ok(Math.abs(Math.hypot(...r.projectedStop)-r.stoppingDistance)<1e-12);
    assert.ok(r.outsideContactRadius>=0);
  }
});
test('higher deceleration reduces stop distance without mutating inputs',()=>{
  const root=[0,0],velocity=[3.2,0],contacts=[[0,0],[.3,0]];
  const a=brakingSupportSnapshot({root,velocity,contacts,deceleration:4});
  const b=brakingSupportSnapshot({root,velocity,contacts,deceleration:8});
  assert.equal(a.stoppingDistance,2*b.stoppingDistance);
  assert.deepEqual(root,[0,0]);assert.deepEqual(velocity,[3.2,0]);
  assert.deepEqual(contacts,[[0,0],[.3,0]]);
});
test('no planted contact is explicitly unknown, not a pass',()=>{
  const r=brakingSupportSnapshot({root:[0,0],velocity:[1,0],contacts:[]});
  assert.equal(r.nearestContactDistance,null);
  assert.equal(r.outsideContactRadius,null);
});
test('invalid inputs fail deterministically',()=>{
  assert.throws(()=>brakingSupportSnapshot({root:[0,0],velocity:[1,0],contacts:[],deceleration:0}),TypeError);
  assert.throws(()=>brakingSupportSnapshot({root:[NaN,0],velocity:[1,0],contacts:[]}),TypeError);
});
