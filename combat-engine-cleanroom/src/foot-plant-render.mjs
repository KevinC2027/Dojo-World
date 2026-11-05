/**
 * Deterministic presentation footstep tracker.
 * Uses world-space stance targets and short swing arcs. This is intentionally
 * non-authoritative: CombatWorld controls speed and all gameplay.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const ROT=({x,z})=>{const angle=Math.atan2(x,z);return {c:Math.cos(angle),s:Math.sin(angle)}};
function toWorld(f,p){const {c,s}=ROT(f.facing);return [f.position.x+p[0]*c+p[2]*s,f.position.z-p[0]*s+p[2]*c]}
function toLocal(f,w,y){const {c,s}=ROT(f.facing),dx=w[0]-f.position.x,dz=w[1]-f.position.z;return [dx*c-dz*s,y,dx*s+dz*c]}
const foot=(side,blue)=>[side*.24,.035,side===1?(blue?.35:.19):(blue?-.28:-.17)];
export class FootPlantTracker {
  constructor(){this.reset()}
  reset(){this.id=null;this.lastTick=null;this.feet=null;this.swingSide=1;this.lastStart=-1e9;this.lastDir=[0,1];this.guardWeight=0;this.bodySway=0;this.gaitMode='stance';this.gaitBlend=0;this.postureLift=0;this.previousSpeed=0}
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
    this.guardWeight=clamp(this.guardWeight+(f.guarding?.2:-.2),0,1);
    // Network interpolation and replay data can briefly contain invalid velocity samples.
    // Keep presentation foot planning finite; never modify authoritative motion.
    const vx=Number.isFinite(f.velocity?.x)?f.velocity.x:0;
    const vz=Number.isFinite(f.velocity?.z)?f.velocity.z:0;
    const speed=Math.hypot(vx,vz);
    const moving=speed>.24&&!f.action&&!f.knockedOut;
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
    const swingTicks=footwork?10:(speed>2&&!lateralMotion?7:6);
    const strideCap=footwork?.52:(lateralMotion?.76:.90);
    if(moving)this.lastDir=[vx/speed,vz/speed];
    const active=Object.values(this.feet).some(leg=>leg.swing);
    // Six or seven ticks for unguarded movement; ten for guarded shuffle.
    // Existing swings retain their launch duration and endpoint.
    if(moving&&!active&&tick-this.lastStart>=swingTicks){
      // Prioritize the leg which is beyond its comfortable support reach.
      // Keep the alternating preference when neither leg is substantially behind.
      // Choose support transfer using where the pelvis will be at touchdown.
      // Current-root distance alone can select the wrong leg during a reversal:
      // the soon-to-be trailing foot then stays planted until it is out of reach.
      // This is presentation planning only; it never changes CombatWorld motion.
      const brakingRate=Math.max(0,this.previousSpeed-speed);
      const projectedSpeed=Math.max(0,speed-brakingRate*swingTicks);
      const projection=(speed+projectedSpeed)*.5*swingTicks/60;
      const futureRoot=[f.position.x+this.lastDir[0]*projection,
        f.position.z+this.lastDir[1]*projection];
      const projectedReach=side=>dist(this.feet[side].plant,futureRoot);
      const side=projectedReach(-this.swingSide)>projectedReach(this.swingSide)+.02
        ?-this.swingSide:this.swingSide,leg=this.feet[side],dir=this.lastDir;
      // Keep each foot on its anatomical side of the fighter. The travel
      // direction can reverse or become lateral without swapping left/right.
      const rotation=ROT(f.facing),lateral=[rotation.c,-rotation.s],lateralOffset=side*.20;
      // Aim toward the root's estimated position at touchdown, rather than
      // using a fixed look-ahead time for both sprint and guarded shuffle.
      // The stride cap below still bounds the reachable target.
      // Shorten newly planned steps under braking; retain any in-flight target.
      const braking=Math.max(0,this.previousSpeed-speed);
      const predictedSpeed=Math.max(0,speed-braking*swingTicks);
      const anticipation=clamp(predictedSpeed*swingTicks/60,braking>0?0:.08,.4);
      const destination=[f.position.x+dir[0]*(anticipation+.15)+lateral[0]*lateralOffset,
        f.position.z+dir[1]*(anticipation+.15)+lateral[1]*lateralOffset];
      if(dist(leg.plant,destination)>.20){
        // Bound the stride from the actual planted ankle, not just the moving root.
        // Abrupt reverse/stop inputs must not request an unreachable swing endpoint.
        const delta=dist(leg.plant,destination),maxStride=strideCap;
        const bounded=delta>maxStride?lerp(leg.plant,destination,maxStride/delta):destination;
        leg.swing={start:leg.plant.slice(),end:bounded,begin:tick,duration:swingTicks};
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
    // Carry a small lateral weight-transfer signal through step boundaries.
    const gaitSupport=this.feet[-1].swing?1:this.feet[1].swing?-1:0;
    // A front kick removes the striking foot from ground support. Transfer
    // body weight toward the non-kicking leg only AFTER it can actually plant.
    const groundedKickSupport=f.action?.name==='frontKick'&&!this.feet[-1].swing;
    const support=groundedKickSupport?-1:gaitSupport;
    this.bodySway+=(support-this.bodySway)*.28;
    // Coordinate standing height with leg reach, rather than solving each
    // knee independently. Every torso and shoulder landmark uses this same lift.
    // Existing planted-foot targets are world-locked; never lengthen a segment
    // to obtain a straighter leg.
    const fdata=this.result(f);
    const preferred=f.id==='blue'?(moving?.17:.11):.055;
    let bound=Infinity,landingBound=Infinity,futureSupportBound=Infinity;
    const baseHeight=f.id==='blue'?.84:.96;
    for(const side of [-1,1]){
      const sw=this.feet[side].swing;
      if(sw&&!(side===1&&f.action?.name==='frontKick')){
        // Begin adapting the whole body's height before touchdown. Forecast
        // the existing endpoint using observed deceleration, without moving
        // either the planted foot or an in-flight landing target.
        const remaining=Math.max(0,sw.begin+sw.duration-tick);
        const deceleration=Math.max(0,this.previousSpeed-speed);
        let travel=0;
        for(let k=1;k<=remaining;k++)travel+=Math.max(0,speed-deceleration*k)/60;
        const future={facing:f.facing,position:{
          x:f.position.x+this.lastDir[0]*travel,
          z:f.position.z+this.lastDir[1]*travel}};
        const p=toLocal(future,sw.end,.035),hipX=side*.14+this.bodySway*.055;
        const dx=p[0]-hipX,dz=p[2];
        const limit=p[1]+Math.sqrt(Math.max(0,1.001*1.001-dx*dx-dz*dz))-baseHeight;
        landingBound=Math.min(landingBound,limit);
      }
      if(!fdata[side].planted)continue;
      const p=fdata[side].point,hipX=side*.14+this.bodySway*.055;
      const dx=p[0]-hipX,dz=p[2];
      const limit=p[1]+Math.sqrt(Math.max(0,1.001*1.001-dx*dx-dz*dz))-baseHeight;
      bound=Math.min(bound,limit);
      const otherSwing=this.feet[-side].swing;
      if(moving&&otherSwing){
        // Prepare for the planted leg's expected reach over the next few
        // ticks, so the torso does not have to drop abruptly as the root
        // travels past that foot. Contact itself remains world-anchored.
        const horizon=Math.min(5,otherSwing.begin+otherSwing.duration-tick);
        const deceleration=Math.max(0,this.previousSpeed-speed);
        let travel=0;
        for(let k=1;k<=horizon;k++)travel+=Math.max(0,speed-deceleration*k)/60;
        const future={facing:f.facing,position:{
          x:f.position.x+this.lastDir[0]*travel,
          z:f.position.z+this.lastDir[1]*travel}};
        const next=toLocal(future,fdata[side].world,.035);
        const ddx=next[0]-hipX,ddz=next[2];
        const nextLimit=next[1]+Math.sqrt(Math.max(0,1.001*1.001-ddx*ddx-ddz*ddz))-baseHeight;
        futureSupportBound=Math.min(futureSupportBound,nextLimit);
      }
    }
    const ideal=clamp(Math.min(preferred,bound,landingBound,futureSupportBound),-.10,.20);
    const smoothed=this.postureLift+clamp(ideal-this.postureLift,-.018,.012);
    // Smooth the preferred posture through movement/attack transitions, but
    // immediately obey a supporting leg's actual reach limit when necessary.
    this.postureLift=Math.min(smoothed,bound);
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
      const airborneKick=side===1&&f.action?.name==='frontKick';
      targets[side]={point:toLocal(f,xy,.035+raise),
        planted:planted&&!airborneKick,world:xy.slice()};
    }
    targets.guardWeight=this.guardWeight;
    targets.bodySway=this.bodySway;
    targets.gaitMode=this.gaitMode;
    targets.gaitBlend=this.gaitBlend;
    targets.postureLift=this.postureLift;
    return targets;
  }
}
