/**
 * Dynamic support diagnostic for clean-room SOLO movement replays.
 *
 * Capture point approximation: c + dc/dt / sqrt(g / h).
 * It is not a rigid-body solver, joint-torque model, ZMP measurement,
 * or evidence of anatomically validated balance.
 *
 * Unlike the static COM/ankle test, this exposes COM momentum and imminent
 * swing-foot landing targets. It does NOT grant combat/animation approval.
 */
import {measureFullBodyFrame} from './full-body-qualification.mjs';
const DIST=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const clip=(x,l,h)=>Math.max(l,Math.min(h,x));
const distanceToSegment=(p,a,b)=>{
 if(!b)return DIST(p,a);
 const dx=b[0]-a[0],dz=b[1]-a[1],sq=dx*dx+dz*dz;
 const t=sq?clip(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/sq,0,1):0;
 return DIST(p,[a[0]+dx*t,a[1]+dz*t]);
};
const XZ=p=>[p[0],p[2]];
const supportDistance=(target,points)=>{
 if(points.length===0)return null;
 if(points.length===1)return DIST(target,points[0]);
 return distanceToSegment(target,points[0],points[1]);
};
export function measureDynamicSupport(replay,{g=9.81,landingHorizonTicks=9}={}){
 if(!replay?.frames?.length||replay.rateHz<=0)throw new TypeError('Timed replay required');
 if(!Number.isFinite(g)||g<=0||!Number.isInteger(landingHorizonTicks)||landingHorizonTicks<0)
  throw new RangeError('Invalid physical-screen parameters');
 const base=replay.frames.map(measureFullBodyFrame),dt=1/replay.rateHz,rows=[];
 for(let i=0;i<base.length;i++){
  const current=base[i],frame=replay.frames[i],previous=base[Math.max(0,i-1)],next=base[Math.min(base.length-1,i+1)];
  const speedX=(next.comWorld[0]-previous.comWorld[0])/(i===0||i===base.length-1?dt:2*dt);
  const speedZ=(next.comWorld[2]-previous.comWorld[2])/(i===0||i===base.length-1?dt:2*dt);
  const omega=Math.sqrt(g/Math.max(.25,current.comWorld[1]));
  const cp=[current.comWorld[0]+speedX/omega,current.comWorld[2]+speedZ/omega];
  const support=frame.rig.legs.filter(l=>frame.footTargets?.[l.side]?.planted).map(l=>{
    const p=frame.footTargets[l.side].world;
    return [p[0],p[1]];
  });
  const landing=frame.rig.legs.filter(l=>!frame.footTargets?.[l.side]?.planted)
    .map(l=>frame.footTargets[l.side].world.slice());
  const currentDistance=supportDistance(cp,support);
  // A future touchdown counts only if it actually occurs within the horizon.
  // Track the same side through the next N recorded frames.
  const arriving=[];
  for(const leg of frame.rig.legs){
    if(frame.footTargets[leg.side]?.planted)continue;
    let touchdown=null;
    const end=Math.min(replay.frames.length-1,i+landingHorizonTicks);
    for(let k=i+1;k<=end;k++)if(replay.frames[k].footTargets[leg.side]?.planted){
      touchdown=replay.frames[k].footTargets[leg.side].world.slice();break;
    }
    if(touchdown)arriving.push(touchdown);
  }
  const candidate=support.concat(arriving);
  // With three potential contacts choose nearest pair or single foot:
  // conservative discrete check, NOT a true contact polygon.
  let anticipatedDistance=supportDistance(cp,support);
  for(let a=0;a<candidate.length;a++){
    anticipatedDistance=Math.min(anticipatedDistance??Infinity,DIST(cp,candidate[a]));
    for(let b=a+1;b<candidate.length;b++)anticipatedDistance=Math.min(anticipatedDistance,distanceToSegment(cp,candidate[a],candidate[b]));
  }
  rows.push({tick:frame.tick,capturePoint:cp,comSpeedMetersPerSecond:Math.hypot(speedX,speedZ),
    plantedContacts:support.length,plannedLandingCount:arriving.length,
    currentCaptureDistanceMeters:currentDistance,anticipatedCaptureDistanceMeters:anticipatedDistance});
 }
 const finite=rows.every(r=>Number.isFinite(r.comSpeedMetersPerSecond)&&
   (r.currentCaptureDistanceMeters===null||Number.isFinite(r.currentCaptureDistanceMeters))&&
   Number.isFinite(r.anticipatedCaptureDistanceMeters));
 const max=field=>Math.max(...rows.map(r=>r[field]??0));
 return {fighter:replay.fighterId,scenario:replay.scenarioId,samples:rows.length,
  maxCOMSpeedMetersPerSecond:max('comSpeedMetersPerSecond'),
  maxCurrentCaptureErrorMeters:max('currentCaptureDistanceMeters'),
  maxAnticipatedCaptureErrorMeters:max('anticipatedCaptureDistanceMeters'),
  finite,rows};
}
