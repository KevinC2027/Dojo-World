/**
 * Dojo World C0829 — isolated Rapier v0.21.0 3D throw landing physics lab.
 * Not imported by shipped Dojo World. A staged shoulder-load INITIAL CONDITION,
 * not the user-approved V2 entry motion or a full-match move.
 * Coordinates: x lateral, y vertical/meters, z depth; fixed step 1/60 s.
 */
export const DT = 1 / 60;
export const RELEASE_VERTICAL_SPEED = 0.35;
export const RELEASE_UPWARD_SPEED = 0.05;
export function shouldReleaseGrip(upperBackContact, verticalSpeed) {
  return upperBackContact && Number.isFinite(verticalSpeed) && verticalSpeed >= -RELEASE_VERTICAL_SPEED && verticalSpeed <= RELEASE_UPWARD_SPEED;
}
// Collision-order gate: only a verified upper-back-first event can qualify.
// A later upper-back collision cannot erase an earlier head/hip/leg collision.
export function evaluateLandingContacts(hits, headClearance, requiredClearance=0.15) {
  const first = hits[0] ?? null;
  const backFirst = first?.part === 'upper_back';
  const headSafe = Number.isFinite(headClearance) && headClearance >= requiredClearance;
  return {firstPart:first?.part ?? null, backFirst, headSafe,
    pass:backFirst && headSafe, reason:!first?'NO_CONTACT':!backFirst?'WRONG_FIRST_CONTACT':!headSafe?'HEAD_CLEARANCE':'PASS'};
}
export const GRAVITY = {x:0,y:-9.81,z:0};
const v=(x=0,y=0,z=0)=>({x,y,z});
const add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z);
const len=a=>Math.hypot(a.x,a.y,a.z);
const turn=(p,angle)=>v(p.x*Math.cos(angle)-p.y*Math.sin(angle),p.x*Math.sin(angle)+p.y*Math.cos(angle),p.z);
const qZ=angle=>({x:0,y:0,z:Math.sin(angle/2),w:Math.cos(angle/2)});
const quatRotate=(q,p)=>{const u=v(q.x,q.y,q.z);const s=q.w;const c=v(u.y*p.z-u.z*p.y,u.z*p.x-u.x*p.z,u.x*p.y-u.y*p.x);const d=v(u.y*c.z-u.z*c.y,u.z*c.x-u.x*c.z,u.x*c.y-u.y*c.x);return add(p,v(2*(s*c.x+d.x),2*(s*c.y+d.y),2*(s*c.z+d.z)));};

// Independent 3D continuity instrumentation: these are measured world-space
// anchor separations, not a claim that a joint constraint passed.
export function worldAnchor(position, rotation, local) {return add(position,quatRotate(rotation,local));}
export function jointAnchorGap(a,b,localA,localB) {
  return len(sub(worldAnchor(a.position,a.rotation,localA),worldAnchor(b.position,b.rotation,localB)));
}
export function buildRapierThrowLab(RAPIER) {
  if (!RAPIER?.World || !RAPIER?.JointData?.spherical || !RAPIER?.EventQueue) throw Error('Rapier 3D with spherical joints and EventQueue is required.');
  let world, queue, ground, groundCollider, rig, blueHand, gripJoint, elapsed, frame, started, hits, releaseFrame;
  let lastMetrics, backContactSeen, previousCenters, minimumPostContactHeadClearance;
  const dynamic = (name,pos,shape,density=420,angle=-0.70) => {
    const desc=RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setRotation(qZ(angle)).setLinearDamping(0.30).setAngularDamping(0.85).setCanSleep(true).setCcdEnabled(true);
    const body=world.createRigidBody(desc);
    const cd=shape.setDensity(density).setRestitution(0).setFriction(0.85).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    const collider=world.createCollider(cd,body);
    return {name,body,collider};
  };
  const joint=(a,b,pa,pb)=>{
    // Anchors expressed in each body's LOCAL 3D coordinates, no screen-space hacks.
    const jd=RAPIER.JointData.spherical(pa,pb);
    return world.createImpulseJoint(jd,a.body,b.body,true);
  };
  const child=(name,parent,pa,pb,shape,density=450)=>{
    const pp=parent.body.translation(); const qa=parent.body.rotation();
    const pos=sub(add(pp,quatRotate(qa,pa)),quatRotate(qa,pb));
    return dynamic(name,pos,shape,density,-.70);
  };
  function reset(){
    world = new RAPIER.World(GRAVITY);world.timestep=DT;
    // Floor surface exactly at y=0.00 meters.
    ground=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-0.10,0));
    groundCollider=world.createCollider(RAPIER.ColliderDesc.cuboid(12,.10,12).setFriction(1).setRestitution(0).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),ground);
    queue = new RAPIER.EventQueue(true);
    const torso=dynamic('upper_back',v(-.15,1.85,0),RAPIER.ColliderDesc.cuboid(.21,.36,.14),560);
    rig={upper_back:torso};
    rig.head=child('head',torso,v(0,.39,0),v(0,-.16,0),RAPIER.ColliderDesc.ball(.15),300);
    rig.pelvis=child('pelvis',torso,v(0,-.39,0),v(0,.17,0),RAPIER.ColliderDesc.cuboid(.19,.17,.15),480);
    for(const side of [-1,1]){
      const s=side<0?'L':'R';
      const thigh=child('thigh'+s,rig.pelvis,v(side*.12,-.15,0),v(0,.25,0),RAPIER.ColliderDesc.capsule(.21,.105),450);
      rig['thigh'+s]=thigh;
      rig['shin'+s]=child('shin'+s,thigh,v(0,-.26,0),v(0,.23,0),RAPIER.ColliderDesc.capsule(.20,.085),390);
      rig['arm'+s]=child('arm'+s,torso,v(side*.21,.26,side*.045),v(0,.28,0),RAPIER.ColliderDesc.capsule(.26,.075),380);
      joint(rig.pelvis,thigh,v(side*.12,-.15,0),v(0,.25,0));
      joint(thigh,rig['shin'+s],v(0,-.26,0),v(0,.23,0));
      joint(torso,rig['arm'+s],v(side*.21,.26,side*.045),v(0,.28,0));
    }
    joint(torso,rig.pelvis,v(0,-.39,0),v(0,.17,0));
    joint(torso,rig.head,v(0,.39,0),v(0,-.16,0));
    // Blue's grip is kinematic: its path will be controlled, and the red arm is fully dynamic.
    // The hand is only a visual/physical anchor (no collider to push Red through its body).
    const arm=rig.armL;
    const armQ=arm.body.rotation(); const wrist=add(arm.body.translation(),quatRotate(armQ,v(0,-.29,0)));
    blueHand=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(wrist.x,wrist.y,wrist.z));
    gripJoint=null; elapsed=0;frame=0;started=false;hits=[];releaseFrame=null;backContactSeen=false;previousCenters=null;minimumPostContactHeadClearance=null;
    lastMetrics={phase:'STAGED',step:0,upperBackContact:false,firstGroundContact:null,headClearance:null,gripConnected:false,gripGap:0,frameTime:0};
    return lastMetrics;
  }
  function start(){
    if(started)return false;
    gripJoint=world.createImpulseJoint(RAPIER.JointData.spherical(v(0,0,0),v(0,-.29,0)),blueHand,rig.armL.body,true);
    started=true;lastMetrics.phase='THROWING'; return true;
  }
  function step(){
    if (!started) return lastMetrics;
    // Fixed 60Hz. Blue moves down and slightly forward through the planted pivot;
    // Red's dynamic bodies are NOT teleported or assigned scripted positions.
    elapsed+=DT;frame++;
    const base=blueHand.translation();
    const speed=elapsed<.7?0.8:elapsed<1.35?1.3:0.2;
    const next=v(base.x+speed*.23*DT,Math.max(.69,base.y-speed*DT),base.z + .045*DT);
    if(gripJoint) blueHand.setNextKinematicTranslation(next);
    world.step(queue);
    queue.drainCollisionEvents((c1,c2,isStart)=>{
      if(!isStart)return;
      const other=c1===groundCollider.handle?c2:c2===groundCollider.handle?c1:null;
      if(other===null)return;
      const entry=Object.values(rig).find(e=>e.collider.handle===other);
      if(entry){hits.push({frame,part:entry.name,time:elapsed});
        // Release only in response to detected upper-back ground contact; no arbitrary authored frame.
        if(entry.name==='upper_back') backContactSeen=true;
      }
    });
    // Keep sleeve constraint through initial upper-back collision and release only
    // once the torso has slowed; avoids a premature unconstrained rebound.
    const backVerticalSpeed=rig.upper_back.body.linvel().y;
    if(gripJoint && shouldReleaseGrip(backContactSeen,backVerticalSpeed)){
      world.removeImpulseJoint(gripJoint,true);gripJoint=null;releaseFrame=frame;
    }
    const centers=Object.fromEntries(Object.entries(rig).map(([name,part])=>[name,part.body.translation()]));
    const maxCenterStep=previousCenters?Math.max(...Object.keys(centers).map(name=>len(sub(centers[name],previousCenters[name])))):null;
    previousCenters=centers;
    const anchors=[];
    const audit=(name,a,b,pa,pb)=>anchors.push({name,gap:jointAnchorGap(
      {position:a.body.translation(),rotation:a.body.rotation()},
      {position:b.body.translation(),rotation:b.body.rotation()},pa,pb)});
    audit('neck',rig.upper_back,rig.head,v(0,.39,0),v(0,-.16,0));
    audit('spine',rig.upper_back,rig.pelvis,v(0,-.39,0),v(0,.17,0));
    for(const side of [-1,1]){
      const s=side<0?'L':'R';
      audit('shoulder'+s,rig.upper_back,rig['arm'+s],v(side*.21,.26,side*.045),v(0,.28,0));
      audit('hip'+s,rig.pelvis,rig['thigh'+s],v(side*.12,-.15,0),v(0,.25,0));
      audit('knee'+s,rig['thigh'+s],rig['shin'+s],v(0,-.26,0),v(0,.23,0));
    }
    const maxJointGap=Math.max(...anchors.map(a=>a.gap));
    const head=rig.head.body.translation();const first=hits[0]||null;
    // C0834: never certify a landing using only the current head position.
    // A later head-floor near miss or penetration invalidates the entire contact sequence.
    const currentHeadClearance=head.y-.15;
    if(hits.length) minimumPostContactHeadClearance=minimumPostContactHeadClearance===null
      ? currentHeadClearance : Math.min(minimumPostContactHeadClearance,currentHeadClearance);
    const landingAudit=evaluateLandingContacts(hits,minimumPostContactHeadClearance);
    const forearm=rig.armL.body;const redWrist=add(forearm.translation(),quatRotate(forearm.rotation(),v(0,-.29,0)));
    const gripGap=len(sub(blueHand.translation(),redWrist));
    lastMetrics={phase:gripJoint?'THROWING':(hits.some(h=>h.part==='upper_back')?'CONTACT':'RELEASED'),step:frame,frameTime:elapsed,gravity:GRAVITY.y,firstGroundContact:first,landingAudit,minimumPostContactHeadClearance,upperBackContact:hits.some(h=>h.part==='upper_back'),hits:[...hits],maxJointGap,maxCenterStep,jointAnchorGaps:anchors,headClearance:head.y-.15,headPenetration:head.y-.15<-.025,gripConnected:!!gripJoint,gripGap,gripReleaseFrame:releaseFrame,upperBackContactLatched:backContactSeen,torsoY:rig.upper_back.body.translation().y,torsoVerticalVelocity:rig.upper_back.body.linvel().y};
    return lastMetrics;
  }
  function pose(){
    return {blueHand:blueHand.translation(),bodies:Object.fromEntries(Object.entries(rig).map(([k,e])=>[k,{position:e.body.translation(),rotation:e.body.rotation()}])),metrics:lastMetrics};
  }
  reset();
  return {reset,start,step,pose,metrics:()=>lastMetrics,DT};
}
