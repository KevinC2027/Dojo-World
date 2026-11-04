/** Deterministic first contact against a capsule translating rigidly during a tick.
 * Geometry only; not articulated collision or authoritative damage. Y is up.
 */
const finite=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const scale=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const length=a=>Math.hypot(a.x,a.y,a.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function movingSphereCapsuleFirstImpact(sphereFrom,sphereTo,sphereRadius,capsuleFromA,capsuleFromB,capsuleToA,capsuleToB,capsuleRadius){
  if(![sphereFrom,sphereTo,capsuleFromA,capsuleFromB,capsuleToA,capsuleToB].every(finite))
    throw new TypeError('Finite 3D positions required');
  if(![sphereRadius,capsuleRadius].every(v=>Number.isFinite(v)&&v>=0))
    throw new RangeError('Finite nonnegative radii required');
  const moveA=sub(capsuleToA,capsuleFromA),moveB=sub(capsuleToB,capsuleFromB);
  if(length(sub(moveA,moveB))>1e-8)
    throw new RangeError('Capsule must translate rigidly within one tick');
  const relEnd=sub(sphereTo,moveA),relStart=sphereFrom;
  const relMotion=sub(relEnd,relStart),limit=sphereRadius+capsuleRadius;
  const axis=sub(capsuleFromB,capsuleFromA),axisSq=dot(axis,axis);
  function sample(t){
    const center=add(relStart,scale(relMotion,t));
    const f=axisSq>1e-12?clamp(dot(sub(center,capsuleFromA),axis)/axisSq,0,1):0;
    const near=add(capsuleFromA,scale(axis,f));
    return {center,near,dist:length(sub(center,near))};
  }
  // Distance along a linear relative sweep against a convex capsule is convex.
  // Fixed-iteration golden section finds its minimum without adaptive timing.
  let left=0,right=1;
  for(let i=0;i<64;i++){
    const p=left+(right-left)*0.3819660112501051;
    const q=right-(right-left)*0.3819660112501051;
    if(sample(p).dist<=sample(q).dist)right=q;else left=p;
  }
  const closest=(left+right)*0.5,first=sample(0),nearest=sample(closest);
  if(first.dist>limit+1e-9&&nearest.dist>limit+1e-9)return null;
  let impactT=0;
  if(first.dist>limit){
    let low=0,high=closest;
    for(let i=0;i<52;i++){
      const mid=(low+high)*0.5;
      if(sample(mid).dist<=limit)high=mid;else low=mid;
    }
    impactT=high;
  }
  const impact=sample(impactT),offset=scale(moveA,impactT);
  const delta=sub(impact.center,impact.near),dist=length(delta);
  const fallback=length(relMotion)>1e-12?scale(relMotion,-1/length(relMotion)):{x:1,y:0,z:0};
  const normal=dist>1e-12?scale(delta,1/dist):fallback;
  const capsulePoint=add(impact.near,offset);
  return {
    model:'moving_translating_capsule_v1',
    firstImpactFraction:impactT,
    startsOverlapping:first.dist<=limit,
    firstImpactCenter:add(impact.center,offset),
    firstImpactPoint:add(capsulePoint,scale(normal,capsuleRadius)),
    firstImpactNormal:normal,
    centerlineDistance:impact.dist
  };
}
