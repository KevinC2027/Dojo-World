/* Shared VF faceless IK figure, shared by outdoor and existing interiors.
   Art-only rendering: no changes to movement, combat, collisions, or gameplay. */
(()=>{'use strict';
const TAU=Math.PI*2,STEP=.56,ARM=.4,LEG=.62,SCALE=.88;
 const ik=(r,e,L1,L2,sg)=>{const dx=e[0]-r[0],dy=e[1]-r[1],dz=e[2]-r[2],rd=Math.hypot(dx,dy,dz),u=rd>1e-6?[dx/rd,dy/rd,dz/rd]:[1,0,0],d=Math.min(Math.max(rd,.05),L1+L2-.005),bn=Math.hypot(u[1],u[0]);let v;if(bn>=1e-4)v=[sg*u[1]/bn,-sg*u[0]/bn,0];else{const t=-sg*u[0];v=[-sg-t*u[0],-t*u[1],-t*u[2]]}const vl=Math.hypot(...v)||1,a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));return[r[0]+u[0]*a+v[0]/vl*h,r[1]+u[1]*a+v[1]/vl*h,r[2]+u[2]*a+v[2]/vl*h]};
 // The display rig is 0.88x combat height; compensate foot travel/lift so the
 // planted sole still travels 0.56 WORLD metres per half-cycle, not 0.4928.
 const foot=c=>{c-=Math.floor(c);if(c<.5)return[STEP*(.5-c*2)/SCALE,0];const q=(c-.5)*2;return[STEP*(q-.5)/SCALE,Math.sin(q*Math.PI)*.14/SCALE]};
 const figure=(g,P,x,z,color,name,phase,walking,fx=1,fz=0,stanceAnchor=null)=>{
  const b=walking?Math.sin(phase*.12)*.02:0,walk=walking?phase:0;
  const p0={pel:[0,1.232+b,.11],neck:[.09,1.782+b,-.01],head:[.15,2.022+b,-.01],hl:[.13,1.18,.28],hr:[.12,1.18,-.28],fl:[.02,0,.21],fr:[.04,0,-.05]};
  let rot=0;if(walking){const cf=walk/TAU,L=foot(cf),R=foot(cf+.5);p0.fl=[.02+L[0],L[1],.2];p0.fr=[-.02+R[0],R[1],-.2];p0.pel[2]=.045*Math.sin(walk);p0.pel[1]=1.21+b-.015*Math.cos(2*walk);p0.neck[1]=p0.pel[1]+.55;p0.head[1]=p0.pel[1]+.79;p0.hl=[.12-.22*Math.cos(walk),1.18+b+.06*Math.sin(walk),.28];p0.hr=[.12+.22*Math.cos(walk),1.18+b-.06*Math.sin(walk),-.28];rot=-.3*Math.sin(walk)}
  // Inset shoulder roots into torso contour; avoid protruding shoulder caps.
  p0.SL=[p0.neck[0]-.025,p0.neck[1]-.14,.085];p0.SR=[p0.neck[0]-.025,p0.neck[1]-.14,-.085];p0.HL=[p0.pel[0],p0.pel[1],p0.pel[2]+.12];p0.HR=[p0.pel[0],p0.pel[1],p0.pel[2]-.12];
  // Walking hands travel opposite their corresponding feet; relaxed at rest.
  const swing=walking?Math.sin(walk):0;
  // Lower wrists to the hip line so 0.4+0.4 m IK arms hang naturally,
  // rather than bowing out into large floating loops around the shoulders.
  // The small forward/back displacement keeps the opposite-foot swing readable.
  p0.hl=[p0.SL[0]-.045-.095*swing,p0.SL[1]-.72+.025*Math.abs(swing),.18];
  p0.hr=[p0.SR[0]-.045+.095*swing,p0.SR[1]-.72+.025*Math.abs(swing),-.18];
  p0.el=ik(p0.SL,p0.hl,ARM,ARM,-1);p0.er=ik(p0.SR,p0.hr,ARM,ARM,1);p0.kl=ik(p0.HL,p0.fl,LEG,LEG,-1);p0.kr=ik(p0.HR,p0.fr,LEG,LEG,-1);
  // Job 1 visual-only foot pin: preserve the world-space planted sole through
  // instant direction changes. The stance anchor is never used by collisions,
  // movement or combat. Reset on idle; start a new anchor every half-cycle.
  if(stanceAnchor){
   if(!walking){stanceAnchor.half=undefined;stanceAnchor.scene=undefined}
   else{
    const half=Math.floor(phase/Math.PI),left=(half%2===0),sole=left?p0.fl:p0.fr;
    const rx0=-fz,rz0=fx;
    if(stanceAnchor.half!==half){
     stanceAnchor.half=half;
     stanceAnchor.x=x+SCALE*(fx*sole[0]+rx0*sole[2]);
     stanceAnchor.z=z+SCALE*(fz*sole[0]+rz0*sole[2]);
    }
    const dx=(stanceAnchor.x-x)/SCALE,dz=(stanceAnchor.z-z)/SCALE;
    sole[0]=fx*dx+fz*dz;sole[2]=rx0*dx+rz0*dz;sole[1]=0;
   }
  }
  const rx=-fz,rz=fx,J=q=>P(x+SCALE*(fx*q[0]+rx*q[2]),SCALE*q[1],z+SCALE*(fz*q[0]+rz*q[2]));
  const sh=P(x,0,z);g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(sh.x,sh.y,.35*sh.s,.12*sh.s,0,0,TAU);g.fill();
  const ln=(a,b,w,c)=>{g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()};
  const dot=(a,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(a.x,a.y,r,0,TAU);g.fill()};
  const a=J(p0.pel),n=J(p0.neck),hd=J(p0.head),k=a.s;
  const segment=(q,r,w)=>{ln(q,r,w*k*SCALE,color);dot(q,w*k*SCALE/2,color);dot(r,w*k*SCALE/2,color)};
  const limb=(q,m,r,w,arm)=>{g.strokeStyle=color;g.lineWidth=w*k*SCALE;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(q.x,q.y);if(arm){g.lineTo(m.x,m.y)}else{g.quadraticCurveTo(m.x,m.y,(m.x+r.x)/2,(m.y+r.y)/2)}g.lineTo(r.x,r.y);g.stroke();dot(q,w*k*SCALE/2,color);dot(r,w*k*SCALE/2,color)};
  // Depth-sorted limbs retain the combat engine's faceless, solid silhouette.
  const limbs=[[p0.SL,p0.el,p0.hl,.17],[p0.SR,p0.er,p0.hr,.17],[p0.HL,p0.kl,p0.fl,.15],[p0.HR,p0.kr,p0.fr,.15]];
  const parts=limbs.map(([aa,bb,cc,w],i)=>{const a=J(aa),b=J(bb),c=J(cc);return{a,b,c,w,arm:i<2,depth:(a.d+c.d)/2}});
  // Reuse already projected foot points: ground shadows without extra per-frame P() allocations.
  const lf=parts[2].c,rf=parts[3].c;
  g.fillStyle='rgba(27,27,31,.22)';g.beginPath();g.ellipse(lf.x,lf.y+SCALE*p0.fl[1]*lf.s,.105*lf.s,.032*lf.s,0,0,TAU);g.fill();
  g.beginPath();g.ellipse(rf.x,rf.y+SCALE*p0.fr[1]*rf.s,.105*rf.s,.032*rf.s,0,0,TAU);g.fill();
  parts.filter(o=>o.depth>=a.d).sort((u,v)=>v.depth-u.depth).forEach(o=>limb(o.a,o.b,o.c,o.w,o.arm));// Narrow clavicle bridge, with fuller upper arms and forearms for a solid-color VF silhouette.
  segment(a,n,.18);const jl=J(p0.SL),jr=J(p0.SR);
  ln(jl,jr,.085*k*SCALE,color);
  dot(hd,.17*k*SCALE,color);
  parts.filter(o=>o.depth<a.d).sort((u,v)=>v.depth-u.depth).forEach(o=>limb(o.a,o.b,o.c,o.w,o.arm));
  if(name){g.font='600 12px system-ui';g.textAlign='center';g.fillStyle='#1b1b1f';g.fillText(name,hd.x,hd.y-.17*k*SCALE-8)}
 };

window.__dojoVF={figure,scale:SCALE,nominalHeight:2.022*SCALE};
})();
