/**
 * HIT Combat Lab: fresh, presentation-only 3D two-bone rig.
 * Every joint is expressed in fighter-local metres: x = right, y = up, z = forward.
 * No legacy pose source; deterministic pose from clean-room CombatWorld snapshots.
 * Not authoritative collision or biomechanics.
 */
export const RIG_LENGTHS=Object.freeze({upperArm:.38,forearm:.36,thigh:.53,shin:.48});
const C=(v,a,b)=>Math.max(a,Math.min(b,v));
const sm=t=>{const v=C(t,0,1);return v*v*(3-2*v)};
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,t)=>a.map(v=>v*t);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const len=a=>Math.hypot(...a);
const normalize=a=>mul(a,1/(len(a)||1));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const foot=(side,blue)=>[side*.24,.035,side===1?(blue?.35:.19):(blue?-.28:-.17)];
const hand=(side,blue)=>[side*(blue?.29:.22),blue?1.43:1.62,side===1?.29:.17];
const anchorArm=(side,blue,rotation)=>[side*.22,blue?1.42:1.57,side*.08+rotation*.045];
const anchorLeg=(side,blue,shift)=>[side*.14,blue?.84:.96,shift];
const frameProgress=(f,m)=>{
  if(!f.action||!m)return {phase:'idle',u:0};
  const a=f.action;
  const duration=a.phase==='startup'?m.startup:a.phase==='active'?m.active:m.recovery;
  return {phase:a.phase,u:sm(1-C(a.framesLeft/Math.max(1,duration),0,1))};
};
function constrain(origin,target,max){
  const delta=sub(target,origin),d=len(delta);
  return d>max?add(origin,mul(delta,max/d)):target.slice();
}
/** Two-bone IK, positive bend pole maintained in 3D; endpoints never stretch. */
export function solveTwoBone(root,target,a,b,pole){
  const v=sub(target,root),distance=len(v);
  const d=C(distance,Math.abs(a-b)+.001,a+b-.001);
  const u=normalize(distance>1e-7?v:[0,0,1]);
  const along=(a*a-b*b+d*d)/(2*d);
  const height=Math.sqrt(Math.max(0,a*a-along*along));
  const projected=sub(pole,mul(u,dot(pole,u)));
  const fallback=Math.abs(u[0])<.8?[1,0,0]:[0,0,1];
  const fallbackProjection=sub(fallback,mul(u,dot(fallback,u)));
  const bend=normalize(len(projected)>1e-5?projected:fallbackProjection);
  const end=add(root,mul(u,d));
  return {joint:add(add(root,mul(u,along)),mul(bend,height)),end};
}
const strikeSide={palm:1,straight:-1,frontKick:1,jab:-1,cross:1,hook:-1};
export function fighterRig(f,m,clock=0,footTargets=null){
  const blue=f.id==='blue',action=f.action,pr=frameProgress(f,m);
  const speed=Math.hypot(f.velocity?.x||0,f.velocity?.z||0);
  const gait=Math.sin(clock*6.5)*C(speed/3.2,0,1);
  const strike=action?strikeSide[action.name]:undefined;
  const kick=action?.name==='frontKick';
  const attack=!!(action&&m);
  const flow=pr.phase==='startup'?0:pr.phase==='active'?pr.u:pr.phase==='recovery'?1-pr.u:0;
  // In startup the whole body loads; in active the strike extends; in recovery it returns.
  const load=attack?(pr.phase==='startup'?pr.u:pr.phase==='active'?1:1-pr.u):0;
  const extend=sm(flow);
  const twist=(strike===-1?-.12:.12)*load;
  const recoil=f.stunFrames>0?-.09:0;
  const pelvis=[twist*.14,blue?.84:.96,recoil-.045*load];
  const chest=[twist*.42,blue?1.31:1.46,recoil+.025*load];
  const neck=[twist*.45,blue?1.51:1.66,recoil];
  const head=[twist*.40,blue?1.75:1.89,recoil];
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const shoulder=anchorArm(side,blue,twist);
    shoulder[0]+=twist*.40;
    let wrist=hand(side,blue);
    if(f.guarding&&!attack)wrist=mix(wrist,[side*.18,blue?1.51:1.71,.31],footTargets?.guardWeight??1);
    if(attack&&side===strike&&!kick){
      // Chamber draws fist back before extension; hook wraps horizontally, not telescopically.
      const base=hand(side,blue);
      const chamber=action.name==='hook'?[side*.48,1.53,-.10]:
        [side*.27,blue?1.41:1.61,-.10];
      const contact=action.name==='hook'?[side*.09,1.51,.66]:
        [side*.20,blue?1.48:1.64,.75];
      const loaded=mix(base,chamber,load);
      wrist=mix(loaded,contact,extend);
    }else if(attack&&side!==strike&&!kick){
      wrist=mix(wrist,[side*.19,blue?1.56:1.71,.28],load);
    }
    const elbowPole=[side*.95,blue?-.14:-.04,-.20];
    const arm=solveTwoBone(shoulder,constrain(shoulder,wrist,RIG_LENGTHS.upperArm+RIG_LENGTHS.forearm-.002),
      RIG_LENGTHS.upperArm,RIG_LENGTHS.forearm,elbowPole);
    arms.push({side,shoulder,elbow:arm.joint,hand:arm.end});
    const hip=anchorLeg(side,blue,pelvis[2]);
    let ankle=foot(side,blue);
    const stepping=(!attack&&speed>.25);
    if(stepping){
      const phase=gait*side;
      ankle=[ankle[0],ankle[1]+Math.max(0,phase)*.13,ankle[2]+phase*.20];
    }
    if(footTargets&&!attack&&footTargets[side])ankle=footTargets[side].point.slice();
    if(kick&&side===strike){
      const neutral=foot(side,blue);
      const chamber=[side*.22,.55,.27];
      const contact=[side*.24,.88,.78];
      ankle=mix(mix(neutral,chamber,load),contact,extend);
    }
    const kneePole=[side*.32,.38,.58];
    const leg=solveTwoBone(hip,constrain(hip,ankle,RIG_LENGTHS.thigh+RIG_LENGTHS.shin-.002),
      RIG_LENGTHS.thigh,RIG_LENGTHS.shin,kneePole);
    legs.push({side,hip,knee:leg.joint,foot:leg.end});
  }
  return {pelvis,chest,neck,head,arms,legs,phase:pr.phase,move:action?.name||null};
}
