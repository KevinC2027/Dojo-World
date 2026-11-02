/* v0.1.15 comprehensive Job 1 interior visual congruency ONLY. Retains existing market/dojo scene switches,
   collision rectangles, coordinates, inventory, quests and merchant overlay.
   One-camera seamless traversal is explicitly NOT implemented (Job 2 locked). */
(()=>{'use strict';
const TAU=Math.PI*2, F=837, D=10.5;
const shelves=[{x:-3.43,z:1.0},{x:-.64,z:1.0},{x:2.16,z:1.0}];
const C={ink:'#1b1b1f',wall:'#d9c3a0',roof:'#314a4d',floor:'#b5ab98',wood:'#997a5a',window:'#7caba9',blue:'#2b6fd6',accent:'#d6452b'};
function render({ctx:g,W,H,scene,inside,dojoInside,p,frame,weather,renQuest,renNotice,renNoticeTime,nearMerchant,nearCoach}){
 const market=scene==='market',hero=market?inside:dojoInside;
 // Reuse the outdoor Pj camera math and one consistent VF physical scale.
 const P=(x,y,z)=>{const k=F/Math.max(2,D+z);return{x:W/2+x*k,y:H*.42+(2.4-y)*k,s:k,d:z}};
 const R=(x0,y0,x1,y1,z,c)=>{const a=P(x0,y1,z),b=P(x1,y0,z);g.fillStyle=c;g.fillRect(a.x,a.y,b.x-a.x,b.y-a.y)};
 const poly=(points,c)=>{g.fillStyle=c;g.beginPath();points.forEach((v,i)=>{const q=P(v[0],v[1],v[2]);if(i)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y)});g.closePath();g.fill()};
 const quad=(x0,x1,z0,z1,c)=>poly([[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]],c);
 const line=(a,b,width,c)=>{g.strokeStyle=c;g.lineWidth=width;g.lineCap='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()};
 const label=(str,x,y,z,sz=14,color=C.ink)=>{const a=P(x,y,z);g.fillStyle=color;g.font='700 '+Math.max(10,sz*a.s/75)+'px system-ui';g.textAlign='center';g.fillText(str,a.x,a.y)};
 const pill=(str,x,y)=>{g.font='600 12px system-ui';const w=g.measureText(str).width+20;g.fillStyle='rgba(255,252,244,.91)';g.beginPath();g.roundRect(x,y,w,24,12);g.fill();g.fillStyle=C.ink;g.textAlign='left';g.fillText(str,x+10,y+16)};
 // Golden-hour environmental bounce and matching flat architectural materials.
 const wall=g.createLinearGradient(0,0,0,H);wall.addColorStop(0,'#e8c69f');wall.addColorStop(.7,'#d4b69a');wall.addColorStop(1,'#a39b86');g.fillStyle=wall;g.fillRect(0,0,W,H);
 poly([[-7,0,6.5],[7,0,6.5],[7,4.8,6.5],[-7,4.8,6.5]],market?'#d9c3a0':'#c9b89a');
 poly([[-7,0,-4.3],[-7,0,6.5],[-7,4.8,6.5],[-7,4.8,-4.3]],'#bba58e');
 poly([[7,0,-4.3],[7,0,6.5],[7,4.8,6.5],[7,4.8,-4.3]],'#aa9984');
 quad(-7,7,-4.3,6.5,market?'#b5ab98':'#c7c0b0');
 // Same inset seams and trim language as Maple Street storefronts.
 for(let x=-6.5;x<7;x+=1.2)quad(x,x+.022,-4.3,6.5,'#948b7e');
 for(let z=-4.3;z<6.5;z+=1.2)quad(-7,7,z,z+.022,'#9f9687');
 R(-7,3.8,7,4.04,6.48,C.roof);R(-7,.05,7,.22,6.48,'#8f806c');
 // Exterior atmosphere visible through matching storefront windows.
 for(const x of[-4.9,4.5]){
  R(x-1.03,1.6,x+1.03,3.55,6.46,'#314a4d');R(x-.92,1.7,x+.92,3.45,6.44,'#e8a87c');
  R(x-.92,1.7,x+.92,2.6,6.43,'#9db4c8');R(x-.04,1.7,x+.04,3.45,6.42,'#f4e4c7');
  if(weather==='rain')for(let j=0;j<7;j++)R(x-.8+j*.25,2.1,x-.77+j*.25,2.65,6.4,'#d2e7e9a3');
 }
 // Ceiling lamps cast warm light without switching rendering style.
 for(const x of[-2.6,0,2.6]){
  line(P(x,4.75,5.7),P(x,3.65,5.7),3,'#314a4d');const q=P(x,3.6,5.7);
  g.fillStyle='#ffe3a8';g.beginPath();g.arc(q.x,q.y,11,0,TAU);g.fill();
 }
 const cuboid=(x0,x1,z0,z1,h,front,top,side)=>{
  poly([[x0,h,z0],[x1,h,z0],[x1,h,z1],[x0,h,z1]],top);
  poly([[x0,0,z0],[x1,0,z0],[x1,h,z0],[x0,h,z0]],front);
  poly([[x1,0,z0],[x1,0,z1],[x1,h,z1],[x1,h,z0]],side);
 };
 function shelf(s){
  const x=s.x,z=s.z;
  // Real open-shelf geometry: stock sits on tiers, never floor-to-ceiling pillars.
  const box=(x0,x1,z0,z1,y0,y1,front,top,side)=>{
   poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],front);
   poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],top);
   poly([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],side);
  };
  for(const dx of[-.76,.69])box(x+dx,x+dx+.07,z-.95,z+.95,0,1.68,'#725b46','#b89a77','#6e5846');
  for(const y of[.33,.77,1.22,1.66])box(x-.76,x+.76,z-.95,z+.95,y-.08,y,'#8b7055','#d9b78a','#6e5948');
  for(let tier=0;tier<3;tier++)for(let j=0;j<4;j++){
   const px=x-.59+j*.38,y=.34+tier*.44;
   const c=(tier+j)%3===0?'#bb7c61':(tier+j)%2?'#759a76':'#d2a878';
   box(px,px+.22,z-.72,z-.43,y,y+.24,c,'#f1d8aa','#5d795e');
   box(px+.02,px+.20,z+.16,z+.40,y,y+.19,c,'#f1d8aa','#5d795e');
  }
  box(x-.77,x+.77,z-.98,z-.90,0,.28,'#725b46','#c9ab87','#705641');
 }
 function bag(x,z){
  line(P(x,4.65,z),P(x,2.55,z),3,'#4a5351');
  const a=P(x,2.45,z),b=P(x,1.1,z);g.fillStyle='#9a6455';g.fillRect(a.x-.29*a.s,a.y,.58*a.s,b.y-a.y);
  line(P(x-.3,2.4,z),P(x+.3,2.4,z),2,'#e8dcb8');
 }
 function player(px,py,color,name,step,walking,dir){
  const x=(px-480)/75,z=(350-py)/40;
  const f=dir==='left'?[-1,0]:dir==='right'?[1,0]:dir==='up'?[0,1]:[0,-1];
  window.__dojoVF.figure(g,P,x,z,color,name,step,walking,f[0],f[1],name==='You'?hero.gaitAnchor:null);
 }
 // Depth order for preexisting static obstacles and player; gameplay collision remains unchanged.
 const px=(hero.x-480)/75,pz=(350-hero.y)/40;
 if(market){
  R(-2.2,3.1,2.2,3.72,6.45,C.ink);label('MIKA’S MARKET',0,3.3,6.43,22,'#fff');
  R(-3.4,1.15,3.5,1.85,6.4,'#bca17a');
  for(let x=-2.9;x<3.4;x+=.65)R(x,1.26,x+.35,1.68,6.38,x>0?'#6f9874':'#b67d64');
  // Market inventory silhouettes: jar rows, hanging price tags and crate labels.
  for(let i=0;i<5;i++){
   const xx=-2.65+i*1.1;
   R(xx,1.00,xx+.36,1.28,6.38,i%2?'#b67d64':'#71966d');
   R(xx+.08,1.29,xx+.28,1.36,6.37,'#f2d8b0');
   R(xx-.02,.83,xx+.39,.91,6.37,'#f5e6c7');
  }
  R(-2.8,2.65,-1.4,3.03,6.39,'#f2dfb9');label('LOCAL PRODUCE',-2.1,2.79,6.38,12,'#355653');
  // Comprehensive market fit-out: refrigerated case, produce baskets, overhead
  // bunting and warm shop lighting. Decorative only; no added colliders.
  R(-6.25,.32,-4.6,2.35,6.38,'#3b5659');
  R(-6.10,.51,-4.74,2.16,6.36,'#8eb5b2');
  for(let j=0;j<3;j++){
   const y=.72+j*.43;R(-6.05,y,-4.8,y+.08,6.35,'#e7d6b8');
   for(let i=0;i<4;i++)R(-5.98+i*.28,y+.09,-5.79+i*.28,y+.33,6.33,i%2?'#f3ddab':'#79a189');
  }
  for(let i=0;i<8;i++){
   const x=-4.9+i*1.35;
   R(x,4.1,x+.04,4.6,6.37,'#6a5549');
   R(x-.17,3.97,x+.21,4.14,6.36,i%2?'#f3e0b4':'#a3bd9b');
  }
  for(let i=0;i<4;i++){
   const x=-5.2+i*.7;
   cuboid(x-.24,x+.24,4.1,4.6,.55,'#9a7656','#d2b18a','#775b49');
   for(let j=0;j<3;j++){
    const q=P(x+(j-1)*.12,.64,4.25);g.fillStyle=j%2?'#e2aa74':'#7d9d71';
    g.beginPath();g.arc(q.x,q.y,.12*q.s,0,TAU);g.fill();
   }
  }
  // Price boards and a functional-looking but noninteractive register.
  R(3.75,2.92,5.8,3.58,6.39,'#29494c');
  label('FRESH • LOCAL',4.78,3.32,6.38,13,'#f6e6c9');
  R(4.07,2.96,5.46,3.04,6.37,'#dfb98b');
  cuboid(4.0,4.7,2.65,3.15,.48,'#354c4d','#8fb0a9','#273f43');
  // Perspective-matched floor rug and checkout queue markings.
  quad(2.0,5.5,-2.1,-1.45,'#d1b58e');
  for(let x=2.15;x<5.4;x+=.55)quad(x,x+.04,-2.1,-1.45,'#9c826d');
  // Counter at right side, leaving the original merchant proximity coordinates intact.
  cuboid(3.0,5.4,2.4,3.7,1.0,'#8c6d55','#c7b18a','#6d5748');
  // Mika is at the same world position as the existing merchant trigger.
  player(735,230,C.accent,'Mika',0,false,'down');
  if(pz<=1.0)for(const s of shelves)shelf(s);
  player(hero.x,hero.y,C.blue,'You',hero.step,hero.walking,p.dir);
  if(pz>1.0)for(const s of shelves)shelf(s);
  pill('Mika’s Market · same Maple Street perspective',12,74);
  pill(nearMerchant?'E · Shop / talk to Mika':'Exit at the front · E',12,H-62);
 }else{
  R(-2.6,3.15,2.6,3.8,6.45,C.ink);label('NORTHSIDE DOJO',0,3.4,6.43,22,'#fff');
  for(const [x,word] of[[-3.4,'FOCUS'],[-1.15,'RESPECT'],[1.15,'DISCIPLINE'],[3.45,'BALANCE']]){
   R(x-.82,2.0,x+.82,2.72,6.43,'#f4e4c7');label(word,x,2.27,6.4,13,'#455b5b');
  }
  for(let x=-5.0;x<1.6;x+=1.25)for(let z=-.1;z<3.8;z+=1.25)quad(x,x+1.2,z,z+1.2,Math.floor(x+z)%2?'#73948e':'#668c87');
  // Training equipment and wall-mounted class schedule, art-only.
  R(2.65,1.62,4.05,2.72,6.40,'#eadcc1');R(2.73,1.7,3.97,2.64,6.39,'#f5ead3');
  for(let i=0;i<4;i++)R(2.83,2.36-i*.17,3.85,2.39-i*.17,6.38,'#a7a28e');
  R(-5.85,.35,-4.05,.52,6.38,'#3a555a');
  for(let i=0;i<3;i++)R(-5.65+i*.5,.54,-5.34+i*.5,.91,6.37,'#c49b58');
  // Dojo fit-out: large practice mirrors, wall banners, spare pads,
  // paired training bags, and perimeter seating. None changes collision.
  for(const x of[-5.3,-3.35]){
   R(x,1.18,x+1.42,3.08,6.38,'#344b4e');
   R(x+.09,1.27,x+1.33,2.98,6.36,'#9db7b6');
   R(x+.16,1.34,x+.47,2.90,6.34,'#d1d4c2');
  }
  for(const x of[-2.2,0,2.2]){
   R(x-.24,3.35,x+.24,4.3,6.35,x<0?'#c65042':'#e6d7b4');
   label(x===0?'道':'武',x,3.7,6.34,14,x<0?'#fff':'#344d50');
  }
  // Mats show a continuous training surface with boundary seams.
  quad(-5.4,1.4,-1.2,3.9,'#55777a');
  for(let x=-5.3;x<1.4;x+=.9)quad(x,x+.02,-1.2,3.9,'#89a39d');
  for(let z=-1.2;z<3.9;z+=.9)quad(-5.4,1.4,z,z+.02,'#89a39d');
  cuboid(-5.4,-3.9,-2.6,-2.25,.43,'#7c5c4b','#c8aa83','#644c40');
  for(let i=0;i<3;i++){
   const x=-5.16+i*.47;
   cuboid(x-.12,x+.12,-2.40,-2.23,.56,i%2?'#c16c58':'#46646c','#e2c99c','#40555a');
  }
  bag(3.25,3.35);
  bag(4.8,3.4);
  cuboid(3.5,5.4,-1.4,-.95,.65,'#8b775e','#c7b18a','#6d5748');
  player(665,267,'#66788f','Coach Ren',0,false,'down');
  player(hero.x,hero.y,C.blue,'You',hero.step,hero.walking,p.dir);
  pill('Northside Dojo · same Maple Street perspective',12,74);
  pill(renNoticeTime>0?renNotice:(renQuest==='completed'?'Dojo Pass earned':renQuest==='active'?'Deliver hand wraps to Coach Ren':'Talk to Coach Ren'),12,H-62);
  if(nearCoach)pill('E · Talk to Coach Ren',W/2-110,104);
 }
}
window.__dojoInteriorArt=render;
})();
