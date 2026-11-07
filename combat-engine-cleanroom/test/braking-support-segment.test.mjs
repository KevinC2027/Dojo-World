import test from 'node:test';
import assert from 'node:assert/strict';
import {brakingSupportSnapshot} from '../src/braking-support.mjs';
test('between-feet projected stop is supported despite distance from both ankles',()=>{
 const r=brakingSupportSnapshot({root:[0,0],velocity:[0,0],contacts:[[-.3,0],[.3,0]],contactRadius:.12});
 assert.equal(r.supportSegmentDistance,0);
 assert.equal(r.outsideSupportSegmentRadius,0);
 assert.ok(r.outsideContactRadius>.1);
});
test('segment endpoint projection is clamped and reports geometric gap',()=>{
 const r=brakingSupportSnapshot({root:[.6,.4],velocity:[0,0],contacts:[[-.3,0],[.3,0]],contactRadius:.1});
 assert.ok(Math.abs(r.supportSegmentDistance-.5)<1e-12);
 assert.ok(Math.abs(r.outsideSupportSegmentRadius-.4)<1e-12);
});
test('one or no planted foot is handled without a false support pass',()=>{
 const one=brakingSupportSnapshot({root:[.2,0],velocity:[0,0],contacts:[[0,0]]});
 const none=brakingSupportSnapshot({root:[.2,0],velocity:[0,0],contacts:[]});
 assert.equal(one.supportSegmentDistance,one.nearestContactDistance);
 assert.equal(none.supportSegmentDistance,null);
 assert.equal(none.outsideSupportSegmentRadius,null);
});
test('degenerate feet and repeated evaluations are deterministic and nonmutating',()=>{
 const args={root:[0,0],velocity:[2,0],contacts:[[.2,0],[.2,0]]};
 const a=brakingSupportSnapshot(args);
 assert.deepEqual(a,brakingSupportSnapshot(args));
 assert.equal(a.supportSegmentDistance,a.nearestContactDistance);
 assert.deepEqual(args.contacts,[[.2,0],[.2,0]]);
});
