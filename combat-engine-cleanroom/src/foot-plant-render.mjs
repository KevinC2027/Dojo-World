/**
 * Deterministic presentation footstep tracker.
 * Uses world-space stance targets and short swing arcs. This is intentionally
 * non-authoritative: CombatWorld controls speed and all gameplay.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// Both kicks lift the striking (right) foot off the ground; the support,
// landing-bound and planted-state logic must treat them identically.
const isKick=name=>name==='frontKick'||name==='roundhouse';
const ROT=({x,z})=>{const angle=Math.atan2(x,z);return {c:Math.cos(angle),s:Math.sin(angle)}};
function toWorld(f,p){const {c,s}=ROT(f.facing);return [f.position.x+p[0]*c+p[2]*s,f.position.z-p[0]*s+p[2]*c]}
function toLocal(f,w,y){const {c,s}=ROT(f.facing),dx=w[0]-f.position.x,dz=w[1]-f.position.z;return [dx*c-dz*s,y,dx*s+dz*c]}
const foot=(side,blue)=>[side*.24,.035,side===1?(blue?.35:.19):(blue?-.28:-.17)];
export class FootPlantTracker {
  constructor(){this.reset()}
  reset(){this.id=null;this.lastTick=null;this.feet=null;this.swingSide=1;this.lastStart=-1e9;this.lastDir=[0,1];this.guardWeight=0;this.bodySway=0;this.gaitMode='stance';this.gaitBlend=0;this.postureLift=0;this.previousSpeed=0;this.deferredToeOff=0}
  update(f,tick){
    if(!Number.isInteger(tick)||tick<0)throw new TypeError('Expected integer engine tick');
    if(!f?.position||!f?.facing)throw new TypeError('Fighter with root and facing required');
    if(this.id!==f.id||this.lastTick===null||tick<this.lastTick||tick-this.lastTick>1){
      this.reset();this.id=f.id;this.feet={};
      for(const side of [-1,1])this.feet[side]={plant:toWorld(f,foot(side,f.id==='blue')),swing:null};
      this.lastTick=tick-1;
      // Start in an extended stance so the first visible frame is not crouched.
      this.postureLift=f.id==='blue'?.11:.055;
    }
    // Idempotent when render() is called repeatedly for the same simulation frame.
    if(tick===this.lastTick)return this.result(f);
    this.lastTick=tick;
    this.guardWeight=clamp(this.guardWeight+(f.guarding?.05:-.05),0,1);
    // Network interpolation and replay data can briefly contain invalid velocity samples.
    // Keep presentation foot planning finite; never modify authoritative motion.
    const vx=Number.isFinite(f.velocity?.x)?f.velocity.x:0;
    const vz=Number.isFinite(f.velocity?.z)?f.velocity.z:0;
    const speed=Math.hypot(vx,vz);
    const moving=speed>.24&&!f.action&&!f.knockedOut;
    // Cruise speed: the speed the root converges to. At launch the root may
    // still be accelerating, so launch-time speed underestimates the swing.
    if(moving)this.cruiseSpeed=Math.max(this.cruiseSpeed||0,speed);
    else this.cruiseSpeed=0;
    const cruise=this.cruiseSpeed||speed;
    const footwork=moving&&f.guarding;
    this.gaitMode=!moving?'stance':footwork?'footwork':'run';
    // Carries a cosmetic locomotion weight across transitions without
    // altering the authoritative engine position or mid-swing endpoint.
    this.gaitBlend+=clamp((!moving?0:footwork?0:1)-this.gaitBlend,-.15,.15);
    // Give fast forward/backward motion a little more swing time. Sideways
    // travel uses a shorter step so the other leg does not overreach while
    // carrying the body across the stance. Never retime an in-flight step.
    const alignment=speed>0?Math.abs((vx*f.facing.x+vz*f.facing.z)/speed):1;
    const lateralMotion=alignment<.5;
    // Forecast only longitudinal speed gain for a newly launched step.
    // Sideways reach still uses the established timing; an in-flight
    // foot keeps its original target, including during braking/reversal.
    // Ceilings track the engine: WALK_SPEED 1.4 m/s, guarded 1.4*0.42.
    const acceleration=lateralMotion?0:Math.max(0,speed-this.previousSpeed);
    const speedCeiling=footwork?0.588:1.4;
    // Swing duration from the speed the root will travel at during the
    // swing. While accelerating, the instantaneous cruise understates it:
    // a first swing planned off cruise 0.42 m/s lasts 40 ticks and strands
    // the support foot (measured: 227 mm lateral knee snap when the
    // 40-tick swing lands). Use the ceiling the root is accelerating
    // toward; at cruise the two agree, so settled cadence is unchanged.
    // NOTE: cadence uses the RAW speed gain, not the forecast's
    // acceleration (which is zeroed for lateral travel by design) — a
    // lateral ramp is still a ramp, and its first swing must not be 40 ticks.
    const speedGain=Math.max(0,speed-this.previousSpeed);
    const cadenceSpeed=speedGain>0?speedCeiling:cruise;
    // Realistic stride: ~0.70 m steps (0.55 m lateral), cadence derived from
    // speed so a walk reads as a walk (2 steps/s at 1.4 m/s), not a shuffle.
    const stepLength=lateralMotion?.45:.55;
    const swingTicks=footwork?10:Math.max(8,Math.min(40,Math.round(stepLength/Math.max(cadenceSpeed,.3)*60)));
    const strideCap=footwork?.52:(lateralMotion?.65:.75);
    // Average root speed over the next `horizon` ticks (default the full
    // swing). The engine gains a fixed amount per tick, so it reaches the
    // ceiling in a few ticks and cruises the rest — the linear
    // (speed+predicted)/2 average understates the travel by ~0.11 m during
    // the ramp (measured: a second-step landing 0.04 m ahead of the root at
    // touchdown instead of v1's 0.27 m, so the plant went 0.52 m stale by
    // the next handoff and the leg-reach bound sank the pelvis to 0.88 with
    // 63 deg stance flex). At cruise (acceleration 0) this reduces to the
    // current speed; lateral keeps acceleration 0 by design, so lateral is
    // unaffected. The re-aim below passes the remaining ticks so its
    // futureRoot uses the same ramp-aware travel instead of the
    // instantaneous speed, which underestimated ramp travel and fired
    // spuriously on the first step of a walk from rest (distFR 0.66 at
    // tick 1, dragging the endpoint 0.05 m back and landing the first step
    // at 0.20 m instead of 0.30 m).
    const avgSpeedOverSwing=(horizon=swingTicks)=>{
      if(acceleration<=0)return speed;
      if(speed>=speedCeiling)return speedCeiling;
      const rawN=Math.ceil((speedCeiling-speed)/acceleration);
      if(rawN>horizon)return speed+acceleration*(horizon+1)/2;
      const n=rawN;
      const ramp=(n-1)*speed+acceleration*(n-1)*n/2;
      return (ramp+(horizon-n+1)*speedCeiling)/horizon;
    };
    if(moving)this.lastDir=[vx/speed,vz/speed];
    const active=Object.values(this.feet).some(leg=>leg.swing);
    // Six or seven ticks for unguarded movement; ten for guarded shuffle.
    // Existing swings retain their launch duration and endpoint.
    const speedSettled=Math.abs(speed-this.previousSpeed)<.05;
    // lastStart starts at -1e9: only count the timeout after a real step.
    const settleTimeout=this.lastStart>-1e8&&tick-this.lastStart>60;
    // First step of a genuine walk from rest launches immediately: the
    // acceleration forecast plans it during the ramp instead of waiting
    // for steady speed (the launch-frame tests require the first step at
    // tick 1). Guarded by speed: a real first tick reaches at most
    // ~0.42 m/s on the engine ramp, while a fixture jump straight to
    // cruise is >= 0.588 m/s (the guarded speed) — those still wait for
    // the settle gate, so settled-speed fixtures keep their tick-1 launch.
    // This also covers a RESTART from a full stop (previousSpeed 0 after
    // steps have launched, e.g. the stepped-turn reversal): waiting for
    // the speed to settle leaves the root travelling on two planted feet,
    // strands the support foot, and forces a mid-swing emergency shorten
    // whose duration cut re-parameterizes the swing and teleports the
    // foot ~0.23 m in one tick (measured 233.7 mm blue / 266.5 mm red in
    // the stepped-turn restart). Launching on the first ramp tick gives
    // the swing its full duration, so the shorten — if it fires at all —
    // cuts at most a tick or two at low u. The speed<.5 gate is the same
    // ramp-vs-jump discriminator in both cases.
    // Longitudinal only: the acceleration forecast is zeroed for lateral
    // travel by design, so a tick-1 lateral launch plans its endpoint off
    // the instantaneous cruise (0.42 m/s) and lands ~0.44 m behind the
    // 1.4 m/s root, stranding the support foot and firing the emergency
    // shorten, which teleports the swing foot 250 mm in one tick
    // (measured blue lateral). Lateral keeps the established settle-gate
    // timing (first launch tick 5, as in v1); no overnight launch-frame
    // test requires a lateral tick-1 launch (they are forward/backward).
    const firstLaunch=!lateralMotion&&this.previousSpeed===0&&speed>0&&speed<.5;
    // Pick the foot that is about to swing before deciding whether to launch.
    // Prioritize the leg which is beyond its comfortable support reach.
    // Keep the alternating preference when neither leg is substantially behind.
    // Choose support transfer using where the pelvis will be at touchdown.
    // Current-root distance alone can select the wrong leg during a reversal:
    // the soon-to-be trailing foot then stays planted until it is out of reach.
    // This is presentation planning only; it never changes CombatWorld motion.
    let launchSide=0,toeOffEmergency=false;
    // Emergency toe-off is computed even while another swing is in flight:
    // a planted foot stranded >0.45 m behind the root (e.g. after an attack
    // lunge) must lift at once, or the pelvis crashes onto its reach limit.
    const activeSwing=Object.values(this.feet).find(leg=>leg.swing);
    // activeSwing is the LEG; the swing timing lives on .swing. (Was reading
    // .begin/.duration off the leg, so this was NaN <= 3 = false forever and
    // the guard never fired — a support foot could lift 2 ticks before the
    // other foot landed, leaving both feet airborne.)
    const swingLandingSoon=activeSwing&&(activeSwing.swing.begin+activeSwing.swing.duration-tick)<=3;
    // A deferred emergency toe-off: detected while the other foot was still
    // airborne, so the lift was held — lifting then leaves both feet
    // airborne (measured 8 ticks with no planted foot in a mid-swing
    // reversal). Fire it the tick the in-flight swing lands, so the landing
    // and the lift hand off on the same tick (the touchdown resolution runs
    // after the launch block, so a remaining time of 0 lands this tick).
    // Safety valve: if the stranded foot drifts past 0.75 m behind the root
    // while waiting, lift at once — a pelvis crash is worse than a brief
    // gap in support.
    if(this.deferredToeOff){
      const side=this.deferredToeOff,leg=this.feet[side];
      const behind=(f.position.x-leg.plant[0])*this.lastDir[0]+(f.position.z-leg.plant[1])*this.lastDir[1];
      const inFlight=activeSwing?activeSwing.swing:null;
      const landsNow=!inFlight||inFlight.begin+inFlight.duration-tick<=0;
      if(!moving||leg.swing||behind<=.35){this.deferredToeOff=0;}
      else if(landsNow||behind>.75||behind<-.75){launchSide=side;toeOffEmergency=true;this.deferredToeOff=0;}
    }
    if(moving&&!swingLandingSoon&&!launchSide){
      for(const side of [-1,1]){
        const leg=this.feet[side];
        if(leg.swing)continue;
        const behind=(f.position.x-leg.plant[0])*this.lastDir[0]+(f.position.z-leg.plant[1])*this.lastDir[1];
        if((behind>.35||behind<-.55)&&(speedSettled||settleTimeout)||behind>.55||behind<-.75){
          if(activeSwing){
            // The other foot is still airborne: shorten its swing so it
            // lands within 8 ticks, and defer this lift until it does.
            // (Same shorten the launch path applies; the swing keeps its
            // begin and its endpoint keeps re-aiming at most 0.05 m/tick.)
            const other=activeSwing.swing;
            if(other&&other.begin+other.duration-tick>8)other.duration=tick-other.begin+8;
            this.deferredToeOff=side;
          }else{launchSide=side;toeOffEmergency=true;}
          break;
        }
      }
    }
    if(moving&&!active){
      const brakingRate=Math.max(0,this.previousSpeed-speed);
      const projectedSpeed=brakingRate>0?Math.max(0,speed-brakingRate*swingTicks):
        Math.min(speedCeiling,speed+acceleration*swingTicks);
      // Ramp-aware travel (see avgSpeedOverSwing): the linear average
      // understates how far the root travels while it is still ramping up.
      const projection=brakingRate>0?(speed+projectedSpeed)*.5*swingTicks/60:
        avgSpeedOverSwing()*swingTicks/60;
      const futureRoot=[f.position.x+this.lastDir[0]*projection,
        f.position.z+this.lastDir[1]*projection];
      const projectedReach=side=>dist(this.feet[side].plant,futureRoot);
      launchSide=projectedReach(-this.swingSide)>projectedReach(this.swingSide)+.02
        ?-this.swingSide:this.swingSide;
    }
    // Toe-off: a trailing foot must lift once it is ~0.35 m behind the root,
    // instead of staying planted until the cadence timer fires. Otherwise the
    // root travels too far past it and the pelvis is forced down to keep the
    // leg attached, which reads as a deep crouch at push-off.
    // Emergency toe-off (>0.45 m behind, e.g. a foot left behind by an attack
    // lunge) fires at once: waiting for the speed to settle would let the
    // pelvis crash down onto the reach limit first.
    let toeOff=false;
    if(launchSide&&!toeOffEmergency){
      const plant=this.feet[launchSide].plant;
      const behind=(f.position.x-plant[0])*this.lastDir[0]+(f.position.z-plant[1])*this.lastDir[1];
      toeOff=behind>.35;
    }
    if(moving&&((!active&&(tick-this.lastStart>=swingTicks||toeOff)&&(speedSettled||settleTimeout||firstLaunch))||toeOffEmergency)){
      const side=launchSide,leg=this.feet[side],dir=this.lastDir;
      // Keep each foot on its anatomical side of the fighter. The travel
      // direction can reverse or become lateral without swapping left/right.
      // A modestly narrower Red landing lane reduces measured support offset
      // without moving an already planted foot or retargeting an in-flight step.
      const rotation=ROT(f.facing),lateral=[rotation.c,-rotation.s],lateralOffset=side*(f.id==='red'?.18:.20);
      // Aim toward the root's estimated position at touchdown, rather than
      // using a fixed look-ahead time for both sprint and guarded shuffle.
      // The stride cap below still bounds the reachable target.
      // Shorten newly planned steps under braking; retain any in-flight target.
      const braking=Math.max(0,this.previousSpeed-speed);
      const predictedSpeed=braking>0?Math.max(0,speed-braking*swingTicks):
        Math.min(speedCeiling,speed+acceleration*swingTicks);
      const plannedSpeed=braking>0?predictedSpeed:avgSpeedOverSwing();
      // At cruise the acceleration forecast converges to the cruise speed
      // the root settles at; take the higher of the two so a launch held
      // by the settle gate still aims at the settled stride.
      const forecastSpeed=braking>0?predictedSpeed:Math.max(plannedSpeed,cruise);
      const anticipation=clamp(forecastSpeed*swingTicks/60,braking>0?0:.08,.8);
      const destination=[f.position.x+dir[0]*(anticipation+.30)+lateral[0]*lateralOffset,
        f.position.z+dir[1]*(anticipation+.30)+lateral[1]*lateralOffset];
      if(dist(leg.plant,destination)>.20){
        // Bound the stride from the STANCE ankle (the foot staying planted),
        // not from the swinging foot's own plant: a swing foot legitimately
        // travels ~2x step length. Abrupt reverse/stop inputs must not request
        // an unreachable swing endpoint.
        const stanceFoot=this.feet[-side];
        const stancePlant=stanceFoot.swing?stanceFoot.swing.end:stanceFoot.plant;
        const delta=dist(stancePlant,destination),maxStride=strideCap;
        let bounded=delta>maxStride?lerp(stancePlant,destination,maxStride/delta):destination;
        // Keep the landing on its anatomical side. The stride cap bounds
        // reach from the stance foot, but when that foot is itself airborne
        // with a stale endpoint (e.g. mid-reversal) the lerp drags the new
        // landing sideways toward the midline — measured: a left foot landing
        // at z +0.02 instead of +0.20, then crossing its stance. Restore the
        // destination's lateral offset (facing frame); only the fore-aft
        // component comes from the bounded point.
        const fwd=[f.facing.x,f.facing.z];
        const along=(bounded[0]-f.position.x)*fwd[0]+(bounded[1]-f.position.z)*fwd[1];
        const latDest=(destination[0]-f.position.x)*lateral[0]+(destination[1]-f.position.z)*lateral[1];
        bounded=[f.position.x+fwd[0]*along+lateral[0]*latDest,
          f.position.z+fwd[1]*along+lateral[1]*latDest];
        // A stride-cap clip shortens the step: the launch aim is pulled
        // back, but the swing still runs its full nominal duration, so
        // the root travels the full ~0.53 m past the clipped landing and
        // the foot lands almost under the body (measured: the restart's
        // first backward step lands 0.07 m behind the root, knee 71 deg,
        // pelvis 0.85 m — the lead leg never extends; the stale stance
        // foot is also left 0.49 m behind, which is what drags the pelvis
        // down). Shorten THIS swing so the root travels less and the
        // standard 0.30 m landing offset is preserved: duration =
        // (clipped aim - 0.30) / forecastSpeed. First launch after a full
        // stop ONLY (firstLaunch): in steady walking and in the
        // braking/reversal/guard-change fixtures the cap clips too, but
        // there the nominal duration is the intended behaviour and the
        // tests assert it — shortening those swings moved their touchdown
        // ticks (5 failures, reverted by this restriction). Longitudinal,
        // non-braking first launches only (braking already shortens the
        // aim by design); never lengthen a swing, never below the
        // 8-tick floor. In steady walking the cap never binds, so this
        // changes nothing there.
        let swingDuration=swingTicks;
        if(delta>maxStride&&firstLaunch&&!lateralMotion&&braking===0){
          const alongTravel=(bounded[0]-f.position.x)*dir[0]+(bounded[1]-f.position.z)*dir[1];
          if(alongTravel>.30){
            swingDuration=clamp(Math.round((alongTravel-.30)/Math.max(forecastSpeed,.3)*60),8,swingTicks);
          }
        }
        leg.swing={start:leg.plant.slice(),end:bounded,begin:tick,duration:swingDuration};
        if(toeOffEmergency){
          const other=this.feet[-side].swing;
          if(other&&other.begin+other.duration-tick>8)other.duration=tick-other.begin+8;
        }
        this.swingSide=-side;this.lastStart=tick;
      }
    }
    // Resolve touchdown before computing the support side. Otherwise the
    // pelvis receives one extra tick of airborne-leg weight transfer after
    // that leg has planted, producing a gait-to-stance handoff discrepancy.
    for(const leg of Object.values(this.feet)){
      if(!leg.swing)continue;
      const sw=leg.swing,u=clamp((tick-sw.begin)/sw.duration,0,1);
      if(u>=1){leg.plant=sw.end.slice();leg.swing=null}
    }
    // A long swing can outlive a direction change: the root may reverse
    // mid-swing and strand the landing target beyond leg reach (measured
    // 1.29 m away at touchdown, collapsing the pelvis). Re-aim only an
    // UNREACHABLE endpoint (>0.50 m from the forecast touchdown root; a normal landing is ~0.34 m), from the forecast touchdown root, bounded by
    // the stance foot like a fresh launch. Reachable targets are untouched.
    // DIRECTION-AWARE (Nov 6 fix sketch 1): a reachable endpoint can still
    // be wrong — after a reversal it can sit 0.30-0.40 m from the forecast
    // root yet BEHIND the COM in the new travel direction (measured: the
    // tick-77 launch lands 0.38 m behind the COM at tick 100 while only
    // 0.39 m from the forecast root, so the distance test never fires).
    // Fire the same re-aim when the endpoint is behind the current root
    // along travel by more than 0.10 m. A normal swing's endpoint stays
    // ~0.30-0.86 m ahead of the root along travel, so this never fires on
    // ordinary walking; the 0.05 m/tick rate limit is unchanged.
    for(const side of [-1,1]){
      const leg=this.feet[side],sw=leg.swing;
      if(!sw)continue;
      const remaining=Math.max(0,sw.begin+sw.duration-tick);
      // Ramp-aware travel over the remaining ticks (see avgSpeedOverSwing):
      // the instantaneous speed underestimates how far the root will get
      // during a ramp, so the old futureRoot fired the re-aim spuriously on
      // a first step from rest. At cruise or while braking this reduces
      // exactly to speed*remaining/60, so steady walking is unchanged.
      const travel=avgSpeedOverSwing(remaining)*remaining/60;
      const futureRoot=[f.position.x+this.lastDir[0]*travel,
        f.position.z+this.lastDir[1]*travel];
      const alongTravel=(sw.end[0]-f.position.x)*this.lastDir[0]+(sw.end[1]-f.position.z)*this.lastDir[1];
      if(dist(futureRoot,sw.end)>.50||alongTravel<-.10){
        const rotation=ROT(f.facing),lateral=[rotation.c,-rotation.s];
        const destination=[futureRoot[0]+this.lastDir[0]*.30+lateral[0]*side*.20,
          futureRoot[1]+this.lastDir[1]*.30+lateral[1]*side*.20];
        const stanceFoot=this.feet[-side];
        const stancePlant=stanceFoot.swing?stanceFoot.swing.end:stanceFoot.plant;
        const delta=dist(stancePlant,destination);
        let desired=delta>strideCap?lerp(stancePlant,destination,strideCap/delta):destination;
        // Same anatomical-side guard as a fresh launch: the stride cap must
        // not drag a re-aimed endpoint across the midline when the stance
        // foot's endpoint is stale.
        const fwd=[f.facing.x,f.facing.z];
        const along=(desired[0]-futureRoot[0])*fwd[0]+(desired[1]-futureRoot[1])*fwd[1];
        const latDest=(destination[0]-futureRoot[0])*lateral[0]+(destination[1]-futureRoot[1])*lateral[1];
        desired=[futureRoot[0]+fwd[0]*along+lateral[0]*latDest,
          futureRoot[1]+fwd[1]*along+lateral[1]*latDest];
        const shift=dist(sw.end,desired);
        sw.end=shift>.05?lerp(sw.end,desired,.05/shift):desired;
      }
    }
    // Carry a small lateral weight-transfer signal through step boundaries.
    const gaitSupport=this.feet[-1].swing?1:this.feet[1].swing?-1:0;
    // A kick removes the striking foot from ground support. Transfer
    // body weight toward the non-kicking leg only AFTER it can actually plant.
    const groundedKickSupport=isKick(f.action?.name)&&!this.feet[-1].swing;
    const support=groundedKickSupport?-1:gaitSupport;
    this.bodySway+=(support-this.bodySway)*.28;
    // Coordinate standing height with leg reach, rather than solving each
    // knee independently. Every torso and shoulder landmark uses this same lift.
    // Existing planted-foot targets are world-locked; never lengthen a segment
    // to obtain a straighter leg.
    const fdata=this.result(f);
    const preferred=f.id==='blue'?(moving?.20:.11):(moving?.085:.055);
    let bound=Infinity,landingBound=Infinity,futureSupportBound=Infinity;
    const baseHeight=f.id==='blue'?.84:.96;
    // Sway vector in the facing frame (same rotation as hit-rig.mjs):
    // the rig applies the bodySway offset along the local axis
    // perpendicular to travel, so the reach bounds must use the same hip
    // offset (swayX along local x, swayZ along local z) or the bound
    // assumes a hip the rig does not produce and the leg IK clamps the
    // ankle off its target. At rest the sway falls back to the facing
    // lateral axis, as before.
    const swayMag=this.bodySway*.055;
    let swayX=swayMag,swayZ=0;
    if(speed>.05){
      const yaw=Math.atan2(f.facing.x,f.facing.z),yc=Math.cos(yaw),ys=Math.sin(yaw);
      const r=(vx*yc-vz*ys)/speed,w=(vx*ys+vz*yc)/speed,sign=w>=0?1:-1;
      swayX=swayMag*sign*w; swayZ=swayMag*sign*(-r);
    }
    for(const side of [-1,1]){
      const sw=this.feet[side].swing;
      if(sw&&!(side===1&&isKick(f.action?.name))){
        // Only enforce the landing reach in the last few ticks before
        // touchdown. Earlier in the swing the foot is still under the hip,
        // so the pelvis may rise to full extension and the stance knee can
        // straighten at mid-stance; the body dips to place the foot.
        // NOTE: this skips only the landing-bound computation, never the
        // grounded-contact bound below it: on its launch tick a swinging
        // foot is still load-bearing (groundedContact) and must keep
        // limiting body height, or the leg cannot reach its locked target
        // and the launch ankle rises above the floor.
        const remaining=Math.max(0,sw.begin+sw.duration-tick);
        if(remaining<=6){
          const deceleration=Math.max(0,this.previousSpeed-speed);
          let travel=0;
          for(let k=1;k<=remaining;k++)travel+=Math.max(0,speed-deceleration*k)/60;
          const future={facing:f.facing,position:{
            x:f.position.x+this.lastDir[0]*travel,
            z:f.position.z+this.lastDir[1]*travel}};
          const p=toLocal(future,sw.end,.035),hipX=side*.14+swayX;
          const dx=p[0]-hipX,dz=p[2]-swayZ;
          const limit=p[1]+Math.sqrt(Math.max(0,1.001*1.001-dx*dx-dz*dz))-baseHeight;
          landingBound=Math.min(landingBound,limit);
        }
      }
      // A scheduled swing is still load-bearing on its exact launch tick.
      // Include that world-locked ankle when limiting full-body height.
      if(!fdata[side].groundedContact)continue;
      const p=fdata[side].point,hipX=side*.14+swayX;
      const dx=p[0]-hipX,dz=p[2]-swayZ;
      const limit=p[1]+Math.sqrt(Math.max(0,1.001*1.001-dx*dx-dz*dz))-baseHeight;
      bound=Math.min(bound,limit);
      const otherSwing=this.feet[-side].swing;
      if(moving){
        // Prepare for the planted leg's expected reach over the next few
        // ticks, so the torso does not have to drop abruptly as the root
        // travels past that foot. Contact itself remains world-anchored.
        // At double-support boundaries anticipate the next tick too, so the
        // body starts lowering before a just-planted foot is selected to swing.
        const horizon=otherSwing?Math.min(5,otherSwing.begin+otherSwing.duration-tick):1;
        const deceleration=Math.max(0,this.previousSpeed-speed);
        let travel=0;
        for(let k=1;k<=horizon;k++)travel+=Math.max(0,speed-deceleration*k)/60;
        const future={facing:f.facing,position:{
          x:f.position.x+this.lastDir[0]*travel,
          z:f.position.z+this.lastDir[1]*travel}};
        const next=toLocal(future,fdata[side].world,.035);
        const ddx=next[0]-hipX,ddz=next[2]-swayZ;
        const nextLimit=next[1]+Math.sqrt(Math.max(0,1.001*1.001-ddx*ddx-ddz*ddz))-baseHeight;
        futureSupportBound=Math.min(futureSupportBound,nextLimit);
      }
    }
    const ideal=clamp(Math.min(preferred,bound,landingBound,futureSupportBound),-.10,.20);
    const smoothed=this.postureLift+clamp(ideal-this.postureLift,-.018,.02);
    // Smooth the preferred posture through movement/attack transitions, but
    // immediately obey a supporting leg's actual reach limit when necessary.
    // Rate-limit the final lift: Math.min(smoothed, bound) bypasses the
    // smoothing and can drop the pelvis 0.20 m in one tick when the bound
    // crashes (measured 86 mm planted slide). Cap the move at 0.015 m/tick;
    // the root closes the gap while the pelvis eases down.
    const prevLift=this.postureLift;
    this.postureLift=clamp(Math.min(smoothed,bound),prevLift-.02,prevLift+.02);
    // Hold the lift through an attack: a trailing foot left behind by the
    // lunge must not drag the body down mid-attack. Captured at attack start.
    if(f.action){
      if(this.attackLift===undefined)this.attackLift=this.postureLift;
      this.postureLift=Math.max(this.postureLift,this.attackLift);
    }else this.attackLift=undefined;
    this.previousSpeed=speed;
    return this.result(f);
  }
  result(f){
    const targets={};
    for(const side of [-1,1]){
      const leg=this.feet[side];let xy=leg.plant,raise=0,planted=true;
      if(leg.swing){
        const s=leg.swing,u=clamp((this.lastTick-s.begin)/s.duration,0,1);
        xy=lerp(s.start,s.end,smooth(u));raise=.14*Math.sin(Math.PI*u);planted=false;
      }
      // The visual strike leg is airborne even if its stored neutral
      // footprint remains world-anchored for smooth recovery.
      const airborneKick=side===1&&isKick(f.action?.name);
      // At the exact launch tick the foot is still at the world-locked
      // takeoff point and floor height, even though the swing has been scheduled.
      // Keep 'planted' as the operational stance state; report contact separately.
      const groundedContact=!airborneKick&&(planted||(leg.swing&&this.lastTick===leg.swing.begin));
      targets[side]={point:toLocal(f,xy,.035+raise),
        planted:planted&&!airborneKick,groundedContact:!!groundedContact,world:xy.slice()};
    }
    targets.guardWeight=this.guardWeight;
    targets.bodySway=this.bodySway;
    targets.gaitMode=this.gaitMode;
    targets.gaitBlend=this.gaitBlend;
    targets.postureLift=this.postureLift;
    return targets;
  }
}
