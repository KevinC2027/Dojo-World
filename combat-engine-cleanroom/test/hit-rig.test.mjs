import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterRig,solveTwoBone,RIG_LENGTHS} from '../src/hit-rig.mjs';
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const moves={
  blue:{palm:{startup:7,active:3,recovery:12},straight:{startup:5,active:2,recovery:13},hook:{startup:10,active:3,recovery:16},frontKick:{startup:12,active:4,recovery:17},roundhouse:{startup:13,active:4,recovery:18}},
  red:{jab:{startup:4,active:2,recovery:10},cross:{startup:9,active:3,recovery:18},hook:{startup:11,active:3,recovery:19},uppercut:{startup:12,active:3,recovery:20},leadUppercut:{startup:10,active:3,recovery:17},overhand:{startup:12,active:3,recovery:21},frontKick:{startup:11,active:4,recovery:16}}
};
function fighter(id,move,phase,framesLeft){
  return {id,velocity:{x:0,z:0},stunFrames:0,guarding:false,
    action:move?{name:move,phase,framesLeft}:null};
}
function boneChecks(rig){
  for(const a of rig.arms){
    assert.ok(Math.abs(dist(a.shoulder,a.elbow)-RIG_LENGTHS.upperArm)<1e-8);
    assert.ok(Math.abs(dist(a.elbow,a.hand)-RIG_LENGTHS.forearm)<1e-8);
  }
  for(const l of rig.legs){
    assert.ok(Math.abs(dist(l.hip,l.knee)-RIG_LENGTHS.thigh)<1e-8);
    assert.ok(Math.abs(dist(l.knee,l.foot)-RIG_LENGTHS.shin)<1e-8);
  }
}
test('neutral, guard and every strike phase maintain constant segment lengths',()=>{
  for(const id of Object.keys(moves)){
    boneChecks(fighterRig(fighter(id),null));
    for(const [name,m] of Object.entries(moves[id]))
      for(const phase of ['startup','active','recovery']){
        const duration=m[phase];
        for(let t=0;t<=duration;t++){
          boneChecks(fighterRig(fighter(id,name,phase,duration-t),m,t/60));
        }
      }
  }
});
test('stationary support foot remains planted throughout every kick',()=>{
 for(const [id,move] of [['blue','frontKick'],['blue','roundhouse'],['red','frontKick']]){
  const m=moves[id][move];
  const base=fighterRig(fighter(id),null);
  const initial=base.legs.find(l=>l.side===-1).foot;
  for(const phase of ['startup','active','recovery'])
    for(let i=0;i<=m[phase];i++){
      const rig=fighterRig(fighter(id,move,phase,m[phase]-i),m,i/60);
      const foot=rig.legs.find(l=>l.side===-1).foot;
      assert.ok(dist(foot,initial)<1e-10,id+':'+move+' support ankle must stay fixed during isolated kick');
    }
 }
});
test('strike phases create chamber and contact rather than translating unbending arms',()=>{
  const m=moves.red.cross;
  const startup=fighterRig(fighter('red','cross','startup',m.startup),m);
  // The presentation chamber is intentionally early in startup so
  // the striking arm can accelerate into the active hit window smoothly.
  const chamberTick=Math.max(1,Math.round(m.startup*.38));
  const chamber=fighterRig(fighter('red','cross','startup',m.startup-chamberTick),m);
  const contact=fighterRig(fighter('red','cross','active',1),m);
  const u=rig=>rig.arms.find(a=>a.side===1);
  assert.ok(dist(u(startup).hand,u(chamber).hand)>.05);
  assert.ok(dist(u(chamber).hand,u(contact).hand)>.1);
  assert.ok(dist(u(chamber).elbow,u(contact).elbow)>.01);
});
test('same snapshot and clock yield identical rig and finite coordinates',()=>{
  const f=fighter('blue','frontKick','active',2),m=moves.blue.frontKick;
  const a=fighterRig(f,m,1.2),b=fighterRig(f,m,1.2);
  assert.deepEqual(a,b);
  for(const limb of [...a.legs,...a.arms])
    for(const coord of Object.values(limb))if(Array.isArray(coord))
      assert.ok(coord.every(Number.isFinite));
});
test('IK handles degenerate target and clamps target reach',()=>{
  for(const target of [[0,0,0],[0,0,10],[.3,.2,.4]]){
    const s=solveTwoBone([0,0,0],target,.38,.36,[1,0,0]);
    assert.ok(s.joint.every(Number.isFinite)&&s.end.every(Number.isFinite));
    assert.ok(Math.abs(dist([0,0,0],s.joint)-.38)<1e-8);
    assert.ok(Math.abs(dist(s.joint,s.end)-.36)<1e-8);
  }
});
