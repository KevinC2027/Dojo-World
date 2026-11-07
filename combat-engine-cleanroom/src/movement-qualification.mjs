/** Independent-fighter motion qualification, using real CombatWorld snapshots.
 * Engineering diagnostics, NOT proof of biomechanical naturalness.
 */
import {CombatWorld,TICK_RATE} from './engine.mjs';
import {fighterRig,RIG_LENGTHS} from './hit-rig.mjs';
import {FootPlantTracker} from './foot-plant-render.mjs';
const D=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const finite=v=>Array.isArray(v)&&v.every(Number.isFinite);
export const JOINT_LABELS=Object.freeze(['pelvis','chest','neck','head','leftShoulder','leftElbow','leftHand','rightShoulder','rightElbow','rightHand','leftHip','leftKnee','leftFoot','rightHip','rightKnee','rightFoot']);
const jointPoints=rig=>[rig.pelvis,rig.chest,rig.neck,rig.head,
  ...rig.arms.flatMap(a=>[a.shoulder,a.elbow,a.hand]),
  ...rig.legs.flatMap(l=>[l.hip,l.knee,l.foot])];
const toWorld=(fighter,point)=>{
  const yaw=Math.atan2(fighter.facing.x,fighter.facing.z),s=Math.sin(yaw),c=Math.cos(yaw);
  return [fighter.position.x+point[0]*c+point[2]*s,point[1],
    fighter.position.z-point[0]*s+point[2]*c];
};
const STATIC={x:0,z:0};
const sequences={
  idle:{frames:90,vector:t=>STATIC},
  forward:{frames:120,vector:t=>({x:1,z:0})},
  backward:{frames:120,vector:t=>({x:-1,z:0})},
  lateral:{frames:120,vector:t=>({x:0,z:1})},
  // Stepped-turn reversal (Nov 6 fix sketch 2): the old one-tick +x -> -x
  // flip commanded an impossible reversal — a swing launched pre-flip
  // stayed airborne 23 ticks and landed 0.38 m behind the COM, with the
  // COM outside support for ~26 ticks. A real 180-degree reversal is a
  // stepped turn: walk forward, decelerate to a stop, turn in place, then
  // step forward in the new direction. The turn phase is 40 ticks because
  // a 180-degree turn at the engine's 270 deg/s max turn rate takes
  // 180/270 = 0.667 s = 40 ticks. FLAG: the solo-motion harness cannot
  // command a facing rotation — the engine auto-rotates facing toward the
  // other fighter (30 m away, stationary), so facing stays locked along
  // the x-axis and the turn itself is a planted pause of the correct
  // duration, not a visible rotation. The reverse case now measures a
  // stop-turn-walk, not an instant flip; the gate's reverse numbers
  // change meaning accordingly (see refinement-log-20261106-1800).
  reverse:{frames:160,vector:t=>t<60?{x:1,z:0}:t<100?STATIC:{x:-1,z:0}},
  stop:{frames:160,vector:t=>t<80?{x:1,z:0}:STATIC},
  guard:{frames:90,vector:t=>STATIC,guard:true},
  guardRelease:{frames:120,vector:t=>STATIC,guard:t=>t<55},
  guardAdvance:{frames:120,vector:t=>({x:1,z:0}),guard:true},
  guardRetreat:{frames:120,vector:t=>({x:-1,z:0}),guard:true},
  guardLateral:{frames:120,vector:t=>({x:0,z:1}),guard:true},
  guardStop:{frames:150,vector:t=>t<75?{x:1,z:0}:STATIC,guard:true}
};
export const INDEPENDENT_MOTION_SCENARIOS=Object.freeze(Object.keys(sequences));
export function recordSoloMotion(fighterId,scenarioId){
  if(!['blue','red'].includes(fighterId))throw new RangeError('Unknown fighter');
  const scenario=sequences[scenarioId];
  if(!scenario)throw new RangeError('Unknown solo motion scenario');
  const world=new CombatWorld({startingGap:30});
  const frames=[];
  const tracker=new FootPlantTracker();
  for(let t=0;t<=scenario.frames;t++){
    if(t>0)world.step({[fighterId]:{move:scenario.vector(t-1),guard:typeof scenario.guard==='function'?scenario.guard(t-1):!!scenario.guard}});
    const snapshot=world.snapshot(),fighter=snapshot.fighters[fighterId];
    const footTargets=tracker.update(fighter,snapshot.tick);
    const rig=fighterRig(fighter,null,snapshot.timeSeconds,footTargets);
    frames.push({tick:snapshot.tick,fighter:structuredClone(fighter),rig,footTargets:structuredClone(footTargets)});
  }
  return {fighterId,scenarioId,rateHz:TICK_RATE,frames};
}
export function measureSoloMotion(replay){
  const errors=[],lengthErrors=[],jointSteps=[],footSlides=[],footPenetrations=[],plantTargetErrors=[];
  let horizontalTravel=0,groundedSamples=0,supportTransfers=0;
  const swingAnkleSteps=[],plantedAnkleSteps=[];
  let worstJointStep={meters:0,tick:0,joint:null};
  for(let i=0;i<replay.frames.length;i++){
    const {fighter,rig}=replay.frames[i],points=jointPoints(rig);
    if(points.some(p=>!finite(p)))errors.push({tick:i,reason:'nonfinite_joint'});
    for(const a of rig.arms){lengthErrors.push(Math.abs(D(a.shoulder,a.elbow)-RIG_LENGTHS.upperArm),Math.abs(D(a.elbow,a.hand)-RIG_LENGTHS.forearm))}
    for(const l of rig.legs){lengthErrors.push(Math.abs(D(l.hip,l.knee)-RIG_LENGTHS.thigh),Math.abs(D(l.knee,l.foot)-RIG_LENGTHS.shin));if(l.foot[1]<-.002)footPenetrations.push({tick:i,side:l.side,height:l.foot[1]});const target=replay.frames[i].footTargets?.[l.side];if(target?.planted){const actual=toWorld(fighter,l.foot);plantTargetErrors.push(Math.hypot(actual[0]-target.world[0],actual[2]-target.world[1]));}}
    if(!i)continue;
    const prev=replay.frames[i-1];
    horizontalTravel+=Math.hypot(fighter.position.x-prev.fighter.position.x,fighter.position.z-prev.fighter.position.z);
    for(const leg of rig.legs){
      const priorLeg=prev.rig.legs.find(l=>l.side===leg.side);
      const ankleStep=D(toWorld(fighter,leg.foot),toWorld(prev.fighter,priorLeg.foot));
      if(replay.frames[i].footTargets?.[leg.side]?.planted && prev.footTargets?.[leg.side]?.planted)
        plantedAnkleSteps.push(ankleStep);
      else swingAnkleSteps.push(ankleStep);
      if(!prev.footTargets?.[leg.side]?.planted && replay.frames[i].footTargets?.[leg.side]?.planted)
        supportTransfers++;
    }
    const jp=jointPoints(prev.rig);
    const steps=points.map((p,k)=>D(toWorld(fighter,p),toWorld(prev.fighter,jp[k])));
    jointSteps.push(Math.max(...steps));
    steps.forEach((meters,k)=>{if(meters>worstJointStep.meters)worstJointStep={meters,tick:i,joint:JOINT_LABELS[k]};});
    for(const l of rig.legs){
      const prevFoot=prev.rig.legs.find(a=>a.side===l.side).foot;
      if(l.foot[1]<=.045&&prevFoot[1]<=.045){
        groundedSamples++;
        footSlides.push(D(toWorld(fighter,l.foot),toWorld(prev.fighter,prevFoot)));
      }
    }
  }
  const max=items=>items.length?Math.max(...items):0;
  return {fighter:replay.fighterId,scenario:replay.scenarioId,ticks:replay.frames.length,
    horizontalTravelMeters:horizontalTravel,maxBoneErrorMeters:max(lengthErrors),
    maxJointStepMeters:max(jointSteps),worstJointStep,maxGroundedFootSlideMeters:max(footSlides),
    groundedSamples,maxPlantTargetErrorMeters:max(plantTargetErrors),footPenetrations:footPenetrations.length,
    supportTransfers,maxSwingAnkleStepMeters:max(swingAnkleSteps),
    maxPlantedAnkleStepMeters:max(plantedAnkleSteps),errors};
}
export function auditIndependentMotion(){
  return ['blue','red'].flatMap(id=>INDEPENDENT_MOTION_SCENARIOS.map(s=>measureSoloMotion(recordSoloMotion(id,s))));
}
