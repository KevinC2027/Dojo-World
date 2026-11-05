import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatWorld,MOVESETS} from '../src/engine.mjs';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';
import {fighterRig,RIG_LENGTHS} from '../src/hit-rig.mjs';
import {recordSoloMotion,INDEPENDENT_MOTION_SCENARIOS,measureSoloMotion} from '../src/movement-qualification.mjs';

const near=(a,b,tol=1e-6)=>Math.abs(a-b)<tol;
const d=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const kneeFlex=leg=>{
 const a=RIG_LENGTHS.thigh,b=RIG_LENGTHS.shin,span=d(leg.hip,leg.foot);
 return 180-Math.acos(Math.max(-1,Math.min(1,(a*a+b*b-span*span)/(2*a*b))))*180/Math.PI;
};
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)]};

test('whole-body posture chain stays anatomically connected in all 24 scenarios',()=>{
 for(const id of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
  const frames=recordSoloMotion(id,scenario).frames;
  for(const {rig,footTargets} of frames){
   assert.ok(near(rig.chest[1]-rig.pelvis[1],id==='blue'?.47:.50));
   assert.ok(near(rig.neck[1]-rig.chest[1],.20));
   assert.ok(near(rig.head[1]-rig.neck[1],id==='blue'?.24:.23));
   for(const arm of rig.arms)assert.ok(near(arm.shoulder[1]-rig.chest[1],.11));
   for(const leg of rig.legs)assert.ok(near(leg.hip[1],rig.pelvis[1]));
   assert.ok(Number.isFinite(footTargets.postureLift));
  }
 }
});
test('walking includes planted-leg extension instead of continuous crouching',()=>{
 for(const id of ['blue','red']){
  for(const scenario of ['idle','forward','backward','guardAdvance']){
   const frames=recordSoloMotion(id,scenario).frames;
   const flex=frames.flatMap(({rig,footTargets})=>rig.legs
     .filter(l=>footTargets[l.side]?.planted).map(kneeFlex));
   assert.ok(flex.length>50);
   assert.ok(median(flex)<(scenario==='backward'?55:40),id+':'+scenario+' median flex '+median(flex));
   assert.ok(flex.some(angle=>angle<30),id+':'+scenario+' never straightens');
  }
 }
});
test('coordinated posture lift cannot stretch planted legs or violate floor',()=>{
 for(const id of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
  const report=measureSoloMotion(recordSoloMotion(id,scenario));
  assert.ok(report.maxBoneErrorMeters<1e-8);
  assert.ok(report.maxPlantTargetErrorMeters<.05,id+':'+scenario+' planted reach');
  assert.equal(report.footPenetrations,0);
 }
});
test('free arm swing follows the gait while the stationary upper body stays still',()=>{
 for(const id of ['blue','red']){
  const moving=recordSoloMotion(id,'forward').frames.map(f=>f.rig.arms[0].hand[2]);
  const standing=recordSoloMotion(id,'idle').frames.map(f=>f.rig.arms[0].hand[2]);
  const range=v=>Math.max(...v)-Math.min(...v);
  assert.ok(range(moving)>.06,id+' arms should participate in stride');
  assert.ok(range(standing)<1e-8,id+' must not wave its arms while stationary');
 }
});
test('moving-to-attack startup carries pelvis, head and both foot anchors without teleporting',()=>{
 for(const [id,move] of [['blue','straight'],['blue','frontKick'],['red','jab']]){
  const world=new CombatWorld({startingGap:30});
  const tracker=new FootPlantTracker();
  let before=null,after=null;
  for(let frame=0;frame<=60;frame++){
   const moveInput={x:id==='blue'?1:-1,z:0};
   world.step({[id]:{move:moveInput,...(frame===60?{attack:move}:{})}});
   const f=world.snapshot().fighters[id],feet=tracker.update(f,world.tick);
   const rig=fighterRig(f,f.action?MOVESETS[id][f.action.name]:null,world.tick/60,feet);
   if(frame===59)before=rig;
   if(frame===60)after=rig;
  }
  assert.ok(before&&after);
  assert.ok(Math.abs(after.pelvis[1]-before.pelvis[1])<.03,id+' pelvis jump');
  assert.ok(Math.abs(after.head[1]-before.head[1])<.03,id+' head jump');
  for(let side=0;side<2;side++)
   assert.ok(d(after.legs[side].foot,before.legs[side].foot)<.20,id+' foot teleported at attack startup');
 }
});
