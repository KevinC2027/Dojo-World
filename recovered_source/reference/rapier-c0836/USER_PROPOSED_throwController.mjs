// User supplied November 2, 2026. PROPOSED, not integrated into C0835.
// throwController.js — Rapier JS (@dimforge/rapier3d-compat)
const V = {
  dot:(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,
  cross:(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x}),
  rot:(q,v)=>{const u={x:q.x,y:q.y,z:q.z},s=q.w,
    c=V.cross(u,v),d=V.cross(u,c);
    return {x:v.x+2*(s*c.x+d.x),y:v.y+2*(s*c.y+d.y),z:v.z+2*(s*c.z+d.z)};},
  lerp:(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t}),
  len:(a)=>Math.hypot(a.x,a.y,a.z),
};

export class ShoulderThrow {
  // rig: {torso, pelvis, head, thighL, thighR, shinL, shinR} (RigidBody)
  // gripJoint: ImpulseJoint holding Blue's hand to Red's sleeve
  constructor(world, rig, gripJoint, throwAxis, floorHandle, partByCollider) {
    Object.assign(this,{world,rig,gripJoint,floorHandle,partByCollider});
    this.axis = throwAxis;        // unit, horizontal, perpendicular to Blue→Red
    this.phase = 'ROTATE';
    this.t = 0; this.landT = null;
    this.W_MAX = 9.0;             // rad/s peak rotation
    this.BRAKE_ANGLE = 0.45;      // rad remaining when braking starts
    this.BACK_LOCAL = {x:0,y:0,z:-1}; // torso local axis pointing out of upper back
  }

  // angle between Red's back normal and world down (0 = landing flat on back)
  backAngle() {
    const n = V.rot(this.rig.torso.rotation(), this.BACK_LOCAL);
    return Math.acos(Math.max(-1, Math.min(1, -n.y)));
  }

  step(dt, eventQueue) {
    this.t += dt;
    const {torso,pelvis,head} = this.rig;

    if (this.phase === 'ROTATE') {
      const rem = this.backAngle();
      // speed profile: fast early, proportional braking near target
      const w = Math.min(this.W_MAX, Math.max(0, rem / 0.12));
      const wTarget = rem < this.BRAKE_ANGLE ? w * 0.5 : w;
      const wv = {x:this.axis.x*wTarget, y:this.axis.y*wTarget, z:this.axis.z*wTarget};
      // blend (not snap) so the collision solver still works
      for (const b of [torso, pelvis, ...this._legs()]) {
        b.setAngvel(V.lerp(b.angvel(), wv, 0.35), true);
      }
      // head follows torso: no whip, plus slight chin tuck
      head.setAngvel(V.lerp(head.angvel(), torso.angvel(), 0.6), true);
      if (rem < 0.12) this.phase = 'FALL';   // stop driving, let gravity land it
    }

    if (this.phase === 'FALL') {
      // bleed spin so it arrives flat, not still rotating
      for (const b of [torso, pelvis, head]) {
        b.setAngvel(V.lerp(b.angvel(), {x:0,y:0,z:0}, 0.12), true);
      }
    }

    eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      const other = h1 === this.floorHandle ? h2 : h2 === this.floorHandle ? h1 : null;
      if (other == null || this.landT !== null) return;
      const part = this.partByCollider.get(other);
      if (part === 'torso' || part === 'pelvis') {   // first valid landing
        this.landT = this.t; this.phase = 'SETTLE';
      }
    });

    if (this.phase === 'SETTLE') {
      // keep sleeve grip ~0.15 s into the landing, then release
      if (this.gripJoint && this.t - this.landT > 0.15) {
        this.world.removeImpulseJoint(this.gripJoint, true);
        this.gripJoint = null;
      }
      for (const b of Object.values(this.rig)) {
        b.setAngularDamping(12); b.setLinearDamping(3);   // kill post-landing spin
        const w = b.angvel(), m = V.len(w);
        if (m > 3) b.setAngvel({x:w.x*3/m,y:w.y*3/m,z:w.z*3/m}, true); // clamp
      }
    }
  }
  _legs(){ const r=this.rig; return [r.thighL,r.thighR,r.shinL,r.shinR]; }
}
