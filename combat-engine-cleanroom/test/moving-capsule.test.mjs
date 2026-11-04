import test from 'node:test';
import assert from 'node:assert/strict';
import { movingSphereCapsuleFirstImpact as impact } from '../src/moving-capsule.mjs';
const p=(x,y=1,z=0)=>({x,y,z});
const capsule=x=>[p(x,0.8),p(x,1.6)];
const run=(a,b,ra,x0,x1,r=.2)=>impact(a,b,ra,...capsule(x0),...capsule(x1),r);

test('stationary defender with fast passing strike returns earliest entry',()=>{
 const hit=run(p(-2),p(2),.1,0,0);
 assert.ok(hit);
 assert.ok(Math.abs(hit.firstImpactFraction-.425)<1e-6);
 assert.ok(Math.abs(hit.firstImpactCenter.x+.3)<1e-6);
});
test('moving defender crossing stationary fist registers relative-motion impact',()=>{
 const hit=run(p(0),p(0),.1,-2,2);
 assert.ok(hit);
 assert.ok(Math.abs(hit.firstImpactFraction-.425)<1e-6);
 assert.ok(Math.abs(hit.firstImpactPoint.x+.1)<1e-6);
});
test('same velocity strike and defender never close separation',()=>{
 assert.equal(run(p(-2),p(2),.1,0,4),null);
});
test('starting overlap yields zero time',()=>{
 const hit=run(p(0),p(1),.1,0,1);
 assert.ok(hit.startsOverlapping);
 assert.equal(hit.firstImpactFraction,0);
});
test('miss and repeat runs are deterministic',()=>{
 assert.equal(run(p(-2,3),p(2,3),.1,0,0),null);
 const a=run(p(-2),p(2),.1,0,0);
 assert.deepEqual(a,run(p(-2),p(2),.1,0,0));
});
test('rejects non-rigid capsule movement and invalid inputs',()=>{
 assert.throws(()=>impact(p(0),p(1),.1,p(0),p(0,2),p(1),p(1.2,2),.2),RangeError);
 assert.throws(()=>run(p(0),p(1),-1,0,0),RangeError);
 assert.throws(()=>run(p(NaN),p(1),.1,0,0),TypeError);
});
