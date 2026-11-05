/**
 * Full-body congruency audit for the clean-room presentation skeleton.
 * All measurements are diagnostic, not a physical stability solver.
 * A weighted landmark COM is an approximation, not an anatomical mass model.
 */
const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const diff=(a,b)=>a.map((v,i)=>v-b[i]);
const centroid=(pairs)=>{
  const sum=pairs.reduce((a,[v,w])=>a+w,0);
  return [0,1,2].map(i=>pairs.reduce((a,[v,w])=>a+v[i]*w,0)/sum);
};
export function poseCenterOfMass(rig){
  const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2);
  const masses=[
    [mid(rig.pelvis,rig.chest),.42],
    [mid(rig.chest,rig.neck),.11],
    [rig.head,.08],
    [rig.pelvis,.07],
    ...rig.arms.flatMap(a=>[[mid(a.shoulder,a.elbow),.03],[mid(a.elbow,a.hand),.02]]),
    ...rig.legs.flatMap(l=>[[mid(l.hip,l.knee),.09],[mid(l.knee,l.foot),.065]])
  ];
  return centroid(masses);
}
export function toWorld3(f,point){
  const yaw=Math.atan2(f.facing.x,f.facing.z),s=Math.sin(yaw),c=Math.cos(yaw);
  return [f.position.x+point[0]*c+point[2]*s,point[1],f.position.z-point[0]*s+point[2]*c];
}
const planeDistance=(p,a,b)=>{
  if(!b)return Math.hypot(p[0]-a[0],p[2]-a[2]);
  const u=[b[0]-a[0],b[2]-a[2]],d=u[0]*u[0]+u[1]*u[1];
  const t=d?Math.max(0,Math.min(1,((p[0]-a[0])*u[0]+(p[2]-a[2])*u[1])/d)):0;
  return Math.hypot(p[0]-a[0]-t*u[0],p[2]-a[2]-t*u[1]);
};
const angle=(a,b)=>{const d=a.reduce((s,v,i)=>s+v*b[i],0);return Math.acos(Math.max(-1,Math.min(1,d/(Math.hypot(...a)*Math.hypot(...b)||1))))};
export function measureFullBodyFrame(frame){
  const {rig,fighter,footTargets}=frame,comLocal=poseCenterOfMass(rig),comWorld=toWorld3(fighter,comLocal);
  const feet=rig.legs.filter(l=>footTargets?.[l.side]?.planted)
    .map(l=>toWorld3(fighter,l.foot));
  const supportDistance=feet.length?planeDistance(comWorld,feet[0],feet[1]):null;
  const spineA=diff(rig.chest,rig.pelvis),spineB=diff(rig.neck,rig.chest),
    spineAngle=angle(spineA,spineB);
  const left=rig.arms.find(a=>a.side===-1),right=rig.arms.find(a=>a.side===1);
  const shoulderMid=centroid([[left.shoulder,1],[right.shoulder,1]]);
  const chestShoulderGap=length(shoulderMid,rig.chest);
  const headNeckGap=length(rig.neck,rig.head);
  const hipMid=centroid(rig.legs.map(l=>[l.hip,1]));
  const hipPelvisGap=length(hipMid,rig.pelvis);
  const landmarks=[rig.pelvis,rig.chest,rig.neck,rig.head,
    ...rig.arms.flatMap(a=>[a.shoulder,a.elbow,a.hand]),
    ...rig.legs.flatMap(l=>[l.hip,l.knee,l.foot])];
  const finite=landmarks.every(p=>p.length===3&&p.every(Number.isFinite));
  return {comLocal,comWorld,plantedFeet:feet.length,supportDistance,
    spineAngleRadians:spineAngle,chestShoulderGapMeters:chestShoulderGap,
    hipPelvisGapMeters:hipPelvisGap,headNeckGapMeters:headNeckGap,finite};
}
export function auditFullBodyReplay(replay,{supportTolerance=.14,jointTickLimit=.2}={}){
  if(!replay?.frames?.length)throw new TypeError('Replay frames required');
  const frames=replay.frames.map(measureFullBodyFrame);
  const flags=[],max={supportDistance:0,spineAngle:0,headStep:0,comStep:0};
  for(let i=0;i<frames.length;i++){
    const f=frames[i];
    if(!f.finite)flags.push({tick:i,code:'nonfinite'});
    if(f.plantedFeet&&f.supportDistance!==null){
      max.supportDistance=Math.max(max.supportDistance,f.supportDistance);
      if(f.supportDistance>supportTolerance)
        flags.push({tick:i,code:'unsupported_com',meters:f.supportDistance});
    }else flags.push({tick:i,code:'no_planted_foot'});
    max.spineAngle=Math.max(max.spineAngle,f.spineAngleRadians);
    if(i){
      const headStep=length(toWorld3(replay.frames[i].fighter,replay.frames[i].rig.head),
        toWorld3(replay.frames[i-1].fighter,replay.frames[i-1].rig.head));
      const comStep=length(f.comWorld,frames[i-1].comWorld);
      max.headStep=Math.max(max.headStep,headStep);max.comStep=Math.max(max.comStep,comStep);
      if(headStep>jointTickLimit)flags.push({tick:i,code:'head_jump',meters:headStep});
      if(comStep>jointTickLimit)flags.push({tick:i,code:'com_jump',meters:comStep});
    }
  }
  const counts=Object.fromEntries([...new Set(flags.map(f=>f.code))].map(code=>[code,flags.filter(f=>f.code===code).length]));
  return {fighter:replay.fighterId,scenario:replay.scenarioId,frames:frames.length,
    max,counts,flagged:flags.length,firstFlags:flags.slice(0,12),passed:flags.length===0};
}
