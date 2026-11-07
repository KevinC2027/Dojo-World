import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatWorld,MOVESETS} from '../src/engine.mjs';
import {fighterRig,RIG_LENGTHS} from '../src/hit-rig.mjs';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';

const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const toWorld=(f,p)=>{
  const yaw=Math.atan2(f.facing.x,f.facing.z),c=Math.cos(yaw),s=Math.sin(yaw);
  return [f.position.x+p[0]*c+p[2]*s,p[1],f.position.z-p[0]*s+p[2]*c];
};
const parts=r=>[r.pelvis,r.chest,r.neck,r.head,
  ...r.arms.flatMap(a=>[a.shoulder,a.elbow,a.hand]),
  ...r.legs.flatMap(l=>[l.hip,l.knee,l.foot])];
function executeAttack(id,move,moving){
 const world=new CombatWorld({startingGap:30}),feet=new FootPlantTracker();
 const moveDef=MOVESETS[id][move],last=60+moveDef.startup+moveDef.active+moveDef.recovery+8;
 let previous=null,maxLocal=0,maxWorld=0,maxStanceFootSlide=0,maxLengthError=0;
 let kickoffSamples=0,invalidKickContacts=0;
 const visited=new Set(),events=[];
 for(let tick=1;tick<=last;tick++){
  const input={move:{x:moving?(id==='blue'?1:-1):0,z:0}};
  if(tick===61)input.attack=move;
  events.push(...world.step({[id]:input}));
  const fighter=world.snapshot().fighters[id];
  const targets=feet.update(fighter,world.tick);
  const rig=fighterRig(fighter,fighter.action?MOVESETS[id][fighter.action.name]:null,world.tick/60,targets);
  if(fighter.action)visited.add(fighter.action.phase);
  if((move==='frontKick'||move==='roundhouse')&&fighter.action){
   kickoffSamples++;
   if(targets[1].planted)invalidKickContacts++;
  }
  for(const a of rig.arms){
   maxLengthError=Math.max(maxLengthError,
    Math.abs(distance(a.shoulder,a.elbow)-RIG_LENGTHS.upperArm),
    Math.abs(distance(a.elbow,a.hand)-RIG_LENGTHS.forearm));
  }
  for(const l of rig.legs){
   maxLengthError=Math.max(maxLengthError,
    Math.abs(distance(l.hip,l.knee)-RIG_LENGTHS.thigh),
    Math.abs(distance(l.knee,l.foot)-RIG_LENGTHS.shin));
  }
  assert.ok(Math.abs(rig.chest[1]-rig.pelvis[1]-(id==='blue'?.47:.50))<1e-8,
    id+':'+move+' torso vertical span');
  assert.ok(Math.abs(rig.neck[1]-rig.chest[1]-.20)<1e-8);
  assert.ok(Math.abs(rig.head[1]-rig.neck[1]-(id==='blue'?.24:.23))<1e-8);
  if(previous&&tick>=60){
   const now=parts(rig),old=parts(previous.rig);
   for(let k=0;k<now.length;k++){
    maxLocal=Math.max(maxLocal,distance(now[k],old[k]));
    maxWorld=Math.max(maxWorld,distance(toWorld(fighter,now[k]),toWorld(previous.fighter,old[k])));
   }
   for(const leg of rig.legs){
    const before=previous.rig.legs.find(l=>l.side===leg.side);
    if(targets[leg.side].planted&&previous.targets[leg.side].planted){
     const a=toWorld(fighter,leg.foot),b=toWorld(previous.fighter,before.foot);
     maxStanceFootSlide=Math.max(maxStanceFootSlide,Math.hypot(a[0]-b[0],a[2]-b[2]));
    }
   }
  }
  previous={rig,fighter,targets};
 }
 return {id,move,moving,maxLocal,maxWorld,maxStanceFootSlide,maxLengthError,
  kickoffSamples,invalidKickContacts,visited:[...visited],events};
}

test('all twelve attacks transition continuously from standing and advancing stances',()=>{
 let count=0;
 for(const id of ['blue','red'])for(const move of Object.keys(MOVESETS[id]))
  for(const moving of [false,true]){
   const r=executeAttack(id,move,moving);
   assert.ok(r.maxLocal<.19,id+':'+move+':'+moving+' local jump '+r.maxLocal);
   assert.ok(r.maxWorld<.22,id+':'+move+':'+moving+' world jump '+r.maxWorld);
   assert.ok(r.maxLengthError<1e-8);
   assert.ok(r.maxStanceFootSlide<.012,id+':'+move+':'+moving+' planted slide '+r.maxStanceFootSlide);
   assert.deepEqual(r.visited,['startup','active','recovery']);
   assert.ok(r.events.some(e=>e.type==='attack_started'));
   assert.ok(r.events.some(e=>e.type==='attack_finished'));
   count++;
  }
 assert.equal(count,24);
});

test('kick leg is never falsely counted as planted during the attack',()=>{
 for(const [id,move] of [['blue','frontKick'],['blue','roundhouse'],['red','frontKick']])
  for(const moving of [false,true]){
   const r=executeAttack(id,move,moving);
   assert.ok(r.kickoffSamples>15,id+':'+move);
   assert.equal(r.invalidKickContacts,0,id+':'+move);
  }
});

test('combat pose and support history are deterministic across replays',()=>{
 for(const [id,move] of [['blue','straight'],['red','hook'],['blue','frontKick'],['blue','hook'],['red','uppercut'],['red','leadUppercut'],['blue','roundhouse'],['red','frontKick'],['red','overhand']]){
  const a=executeAttack(id,move,true),b=executeAttack(id,move,true);
  assert.deepEqual(a,b);
 }
});

// Off hand, decoupled from the strike (Nov 7, Kev's "both arms moving"
// question): a strike launched from guard keeps the off hand at guard
// height — it settles from full guard to mid-guard during startup, then
// does not move at all while the punch extends (active phase).
test('off hand is still during the active phase of a strike launched from guard',()=>{
 const strikeSide={palm:1,straight:-1,jab:-1,cross:1,hook:-1,uppercut:1,leadUppercut:-1,overhand:1};
 for(const id of ['blue','red'])for(const move of Object.keys(strikeSide)){
  if(!(move in MOVESETS[id]))continue;
  const world=new CombatWorld({startingGap:30}),feet=new FootPlantTracker();
  const moveDef=MOVESETS[id][move],last=60+moveDef.startup+moveDef.active+moveDef.recovery+8;
  const offSide=-strikeSide[move];
  let prev=null,activePath=0,guardY=null;
  for(let tick=1;tick<=last;tick++){
   const input={move:{x:0,z:0}};
   if(tick<61)input.guard=true;
   if(tick===61)input.attack=move;
   world.step({[id]:input});
   const fighter=world.snapshot().fighters[id];
   const targets=feet.update(fighter,world.tick);
   const rig=fighterRig(fighter,fighter.action?MOVESETS[id][fighter.action.name]:null,world.tick/60,targets);
   const off=rig.arms.find(a=>a.side===offSide).hand;
   if(tick===60)guardY=off[1];
   if(prev&&fighter.action?.phase==='active')activePath+=distance(off,prev);
   prev=off;
  }
  // Guard beat holds the hand at the chin (blue 1.62, red 1.71 local).
  assert.ok(guardY>(id==='blue'?1.55:1.65),id+':'+move+' guard hand height '+guardY);
  assert.ok(activePath<.05,id+':'+move+' off hand moved '+activePath+' during active');
 }
});
