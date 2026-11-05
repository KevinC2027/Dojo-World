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
/**
 * Presentation-only C1 strike envelopes. Contact reaches its endpoint on the
 * final authoritative active tick, but the arm starts to accelerate during
 * startup. No combat timing, damage or collision rule is changed.
 */
const frameProgress=(f,m)=>{
  if(!f.action||!m)return {phase:'idle',u:0,windup:0,thrust:0,retract:0};
  const a=f.action;
  const duration=a.phase==='startup'?m.startup:a.phase==='active'?m.active:m.recovery;
  const elapsed=a.phase==='startup'?m.startup-a.framesLeft:
    a.phase==='active'?m.startup+m.active-a.framesLeft:
    m.startup+m.active+m.recovery-a.framesLeft;
  const chamberTick=Math.max(1,Math.round(m.startup*.38));
  const contactTick=Math.max(chamberTick+2,m.startup+m.active-1);
  const returnTick=contactTick+Math.max(3,Math.round(m.recovery*.75));
  return {phase:a.phase,u:sm(1-C(a.framesLeft/Math.max(1,duration),0,1)),
    windup:sm(elapsed/chamberTick),
    thrust:sm((elapsed-chamberTick)/(contactTick-chamberTick)),
    retract:sm((elapsed-contactTick)/(returnTick-contactTick))};
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
  // Match the foot tracker when a replay sample contains invalid velocity.
  // This is presentation-only and does not mutate the engine snapshot.
  const vx=Number.isFinite(f.velocity?.x)?f.velocity.x:0;
  const vz=Number.isFinite(f.velocity?.z)?f.velocity.z:0;
  const speed=Math.hypot(vx,vz);
  const gait=Math.sin(clock*6.5)*C(speed/3.2,0,1);
  const strike=action?strikeSide[action.name]:undefined;
  const kick=action?.name==='frontKick';
  const attack=!!(action&&m);
  // Share continuous anticipation, contact and recovery envelopes across the
  // limbs and trunk. Avoid hard resets at the startup/active/recovery seams.
  const load=attack?pr.windup*(1-pr.retract):0;
  const extend=attack?pr.thrust:0;
  const retract=attack?pr.retract:0;
  const twist=(strike===-1?-.12:.12)*load;
  // Presentation-level linked pelvis, spine and shoulder response to support.
  const sway=(footTargets?.bodySway||0)*.055;
  const recoil=f.stunFrames>0?-.09:0;
  // Elevation comes from the gait contact state, not a per-knee pose correction.
  const postureLift=footTargets?.postureLift||0;
  // The upper body participates in each step: subtle forward lean and arm
  // counter-swing derived from the SAME planted/swing-foot gait state.
  const forwardSpeed=vx*(f.facing?.x||0)+vz*(f.facing?.z||0);
  const forwardLean=C(forwardSpeed/3.2,-1,1)*(footTargets?.gaitBlend||0)*.038;
  const stanceContrast=footTargets?C((footTargets[1]?.point[2]-footTargets[-1]?.point[2])*.9,-1,1):0;
  const freeArms=1-(footTargets?.guardWeight??(f.guarding?1:0));
  const armCounterSwing=stanceContrast*C(speed/3.2,0,1)*freeArms*.11;
  const pelvis=[twist*.14+sway,(blue?.84:.96)+postureLift,recoil-.045*load-forwardLean*.12];
  const chest=[twist*.42+sway*.7,(blue?1.31:1.46)+postureLift,recoil+.025*load+forwardLean*.65];
  const neck=[twist*.45+sway*.45,(blue?1.51:1.66)+postureLift,recoil+forwardLean*.83];
  const head=[twist*.40+sway*.4,(blue?1.75:1.89)+postureLift,recoil+forwardLean*.70];
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const shoulder=anchorArm(side,blue,twist);
    shoulder[0]+=twist*.40+sway*.7;
    shoulder[1]+=postureLift;
    shoulder[2]+=forwardLean*.65;
    let wrist=hand(side,blue);
    wrist[1]+=postureLift;
    wrist[2]+=forwardLean*.55-side*armCounterSwing;
    if(!attack)wrist=mix(wrist,[side*.18,(blue?1.51:1.71)+postureLift,.31],footTargets?.guardWeight??(f.guarding?1:0));
    if(attack&&side===strike&&!kick){
      // Chamber draws fist back before extension; hook wraps horizontally, not telescopically.
      // Startup inherits the exact stance wrist, including arm counter-swing.
      const base=wrist.slice();
      // The hand must never chamber directly on the shoulder; that forces
      // a fully folded elbow and unstable IK bend-direction changes.
      const chamber=action.name==='hook'?[side*.37,1.55,.23]:
        [side*.25,(blue?1.40:1.58)+postureLift,.34];
      const contact=action.name==='hook'?[side*.09,1.51,.60]:
        [side*.20,blue?1.48:1.64,.68];
      if(action.name==='hook')chamber[1]+=postureLift;
      contact[1]+=postureLift;
      const loaded=mix(base,chamber,pr.windup);
      wrist=mix(mix(loaded,contact,extend),base,retract);
    }else if(attack&&side!==strike&&!kick){
      wrist=mix(wrist,[side*.19,(blue?1.56:1.71)+postureLift,.28+forwardLean*.55],load);
    }
    const elbowPole=[side*.95,blue?-.14:-.04,-.20];
    const arm=solveTwoBone(shoulder,constrain(shoulder,wrist,RIG_LENGTHS.upperArm+RIG_LENGTHS.forearm-.002),
      RIG_LENGTHS.upperArm,RIG_LENGTHS.forearm,elbowPole);
    arms.push({side,shoulder,elbow:arm.joint,hand:arm.end});
    const hip=anchorLeg(side,blue,pelvis[2]);
    hip[0]+=sway;
    hip[1]+=postureLift;
    hip[2]+=-forwardLean*.12;
    let ankle=foot(side,blue);
    const stepping=(!attack&&speed>.25);
    if(stepping){
      const phase=gait*side;
      ankle=[ankle[0],ankle[1]+Math.max(0,phase)*.13,ankle[2]+phase*.20];
    }
    // Inherit BOTH contact anchors across action startup/recovery. A punch
    // must not teleport either foot to an unrelated neutral animation pose.
    if(footTargets?.[side])ankle=footTargets[side].point.slice();
    if(kick&&side===strike){
      const neutral=footTargets?.[side]?.point?.slice()||foot(side,blue);
      const chamber=[side*.22,.55,.27];
      const contact=[side*.24,.88,.78];
      ankle=mix(mix(mix(neutral,chamber,pr.windup),contact,extend),neutral,retract);
    }
    const kneePole=[side*.32,.38,.58];
    const leg=solveTwoBone(hip,constrain(hip,ankle,RIG_LENGTHS.thigh+RIG_LENGTHS.shin-.002),
      RIG_LENGTHS.thigh,RIG_LENGTHS.shin,kneePole);
    legs.push({side,hip,knee:leg.joint,foot:leg.end});
  }
  return {pelvis,chest,neck,head,arms,legs,phase:pr.phase,move:action?.name||null};
}
