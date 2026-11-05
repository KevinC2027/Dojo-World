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
  reset(){this.id=null;this.lastTick=null;this.feet=null;this.swingSide=1;this.lastStart=-1e9;this.lastDir=[0,1];this.guardWeight=0;this.bodySway=0;this.gaitMode='stance';this.gaitBlend=0}
  update(f,tick){
    if(!Number.isInteger(tick)||tick<0)throw new TypeError('Expected integer engine tick');
    if(!f?.position||!f?.facing)throw new TypeError('Fighter with root and facing required');
    if(this.id!==f.id||this.lastTick===null||tick<this.lastTick||tick-this.lastTick>1){
      this.reset();this.id=f.id;this.feet={};
      for(const side of [-1,1])this.feet[side]={plant:toWorld(f,foot(side,f.id==='blue')),swing:null};
      this.lastTick=tick-1;
    }
    // Idempotent when render() is called repeatedly for the same simulation frame.
    if(tick===this.lastTick)return this.result(f);
    this.lastTick=tick;
    this.guardWeight=clamp(this.guardWeight+(f.guarding?.2:-.2),0,1);
    const vx=f.velocity?.x||0,vz=f.velocity?.z||0,speed=Math.hypot(vx,vz);
    const moving=speed>.24&&!f.action&&!f.knockedOut;
    const footwork=moving&&f.guarding;
    this.gaitMode=!moving?'stance':footwork?'footwork':'run';
    // Carries a cosmetic locomotion weight across transitions without
    // altering the authoritative engine position or mid-swing endpoint.
    this.gaitBlend+=clamp((!moving?0:footwork?0:1)-this.gaitBlend,-.15,.15);
    const swingTicks=footwork?10:6;
    const strideCap=footwork?.52:.95;
    if(moving)this.lastDir=[vx/speed,vz/speed];
    const active=Object.values(this.feet).some(leg=>leg.swing);
    // Six ticks for unguarded 3.2m/s movement; ten for guarded shuffle.
    // Existing swings retain their launch duration and endpoint.
    if(moving&&!active&&tick-this.lastStart>=swingTicks){
      // Prioritize the leg which is beyond its comfortable support reach.
      // Keep the alternating preference when neither leg is substantially behind.
      const distToRoot=side=>dist(this.feet[side].plant,[f.position.x,f.position.z]);
      const side=distToRoot(-this.swingSide)>distToRoot(this.swingSide)+.02
        ?-this.swingSide:this.swingSide,leg=this.feet[side],dir=this.lastDir;
      const lateral=[-dir[1],dir[0]],lateralOffset=side*.20;
      const anticipation=clamp(speed*.12,.08,.4);
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
    // Carry a small lateral weight-transfer signal through step boundaries.
    const support=this.feet[-1].swing?1:this.feet[1].swing?-1:0;
    this.bodySway+=(support-this.bodySway)*.28;
    for(const leg of Object.values(this.feet)){
      if(!leg.swing)continue;
      const sw=leg.swing,u=clamp((tick-sw.begin)/sw.duration,0,1);
      if(u>=1){leg.plant=sw.end.slice();leg.swing=null}
    }
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
      targets[side]={point:toLocal(f,xy,.035+raise),planted,world:xy.slice()};
    }
    targets.guardWeight=this.guardWeight;
    targets.bodySway=this.bodySway;
    targets.gaitMode=this.gaitMode;
    targets.gaitBlend=this.gaitBlend;
    return targets;
  }
}
