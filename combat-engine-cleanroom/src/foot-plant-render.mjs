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
  reset(){this.id=null;this.lastTick=null;this.feet=null;this.swingSide=1;this.lastStart=-1e9;this.lastDir=[0,1]}
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
    const vx=f.velocity?.x||0,vz=f.velocity?.z||0,speed=Math.hypot(vx,vz);
    const moving=speed>.24&&!f.action&&!f.guarding&&!f.knockedOut;
    if(moving)this.lastDir=[vx/speed,vz/speed];
    const active=Object.values(this.feet).some(leg=>leg.swing);
    // One swinging foot at a time: other foot is a world-locked support.
    if(moving&&!active&&tick-this.lastStart>=10){
      const side=this.swingSide,leg=this.feet[side],dir=this.lastDir;
      const lateral=[-dir[1],dir[0]],lateralOffset=side*.20;
      const anticipation=clamp(speed*.10,.10,.32);
      const destination=[f.position.x+dir[0]*(anticipation+.24)+lateral[0]*lateralOffset,
        f.position.z+dir[1]*(anticipation+.24)+lateral[1]*lateralOffset];
      if(dist(leg.plant,destination)>.20){
        leg.swing={start:leg.plant.slice(),end:destination,begin:tick,duration:10};
        this.swingSide=-side;this.lastStart=tick;
      }
    }
    for(const leg of Object.values(this.feet)){
      if(!leg.swing)continue;
      const sw=leg.swing,u=clamp((tick-sw.begin+1)/sw.duration,0,1);
      if(u>=1){leg.plant=sw.end.slice();leg.swing=null}
    }
    return this.result(f);
  }
  result(f){
    const targets={};
    for(const side of [-1,1]){
      const leg=this.feet[side];let xy=leg.plant,raise=0,planted=true;
      if(leg.swing){
        const s=leg.swing,u=clamp((this.lastTick-s.begin+1)/s.duration,0,1);
        xy=lerp(s.start,s.end,smooth(u));raise=.14*Math.sin(Math.PI*u);planted=false;
      }
      targets[side]={point:toLocal(f,xy,.035+raise),planted,world:xy.slice()};
    }
    return targets;
  }
}
