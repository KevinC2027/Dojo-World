/* v0.1.16 environment-only rebuild of EXISTING market/dojo rooms. Figures remain
 * rendered by the byte-identical VF figure file. No scene architecture, collision,
 * interaction, merchant, economy, combat, quest or navigation changes. */
(()=>{'use strict';
const F=837,D=10.5,TAU=Math.PI*2;
const A={ink:'#263e41',ivory:'#f5e7cd',wall:'#dac3a5',dark:'#344e50',teal:'#779d9a',wood:'#a88461',tan:'#c4a487'};
function render({ctx:g,W,H,scene,inside,dojoInside,p,frame,weather,renQuest,renNotice,renNoticeTime,nearMerchant,nearCoach}){
 const market=scene==='market',hero=market?inside:dojoInside;
 const P=(x,y,z)=>{const s=F/Math.max(2,D+z);return{x:W*.5+x*s,y:H*.42+(2.4-y)*s,s};};
 const fill=c=>{g.fillStyle=c};
 const poly=(pts,c)=>{fill(c);g.beginPath();for(let i=0;i<pts.length;i++){const v=pts[i],a=P(v[0],v[1],v[2]);if(i)g.lineTo(a.x,a.y);else g.moveTo(a.x,a.y)}g.closePath();g.fill()};
 const quad=(x0,x1,z0,z1,c)=>poly([[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]],c);
 const wall=(x0,y0,x1,y1,z,c)=>{const a=P(x0,y1,z),b=P(x1,y0,z);fill(c);g.fillRect(a.x,a.y,b.x-a.x,b.y-a.y)};
 const stroke=(x0,y0,z0,x1,y1,z1,w,c)=>{const a=P(x0,y0,z0),b=P(x1,y1,z1);g.strokeStyle=c;g.lineWidth=w*a.s;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()};
 const cube=(x0,x1,z0,z1,y0,y1,c0,c1,c2)=>{
  poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],c0);
  poly([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],c1);
  poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],c2);
 };
 const txt=(s,x,y,z,sz,c)=>{const q=P(x,y,z);g.font='800 '+Math.max(11,sz*q.s)+'px system-ui';fill(c);g.textAlign='center';g.fillText(s,q.x,q.y)};
 const spot=(x,y,z,r,c)=>{const q=P(x,y,z);fill(c);g.beginPath();g.arc(q.x,q.y,r*q.s,0,TAU);g.fill()};
 const pill=(s,x,y)=>{g.font='600 12px system-ui';const wd=g.measureText(s).width+18;fill('#fff8e8eb');g.beginPath();g.roundRect(x,y,wd,23,11);g.fill();fill('#293f43');g.textAlign='left';g.fillText(s,x+9,y+16)};
 const fig=(px,py,col,name,st,walk,dir,anchor)=>{
  const x=(px-480)/75,z=(350-py)/40,h=dir==='left'?[-1,0]:dir==='right'?[1,0]:dir==='up'?[0,1]:[0,-1];
  window.__dojoVF.figure(g,P,x,z,col,name,st,walk,h[0],h[1],anchor);
 };
 const tint=g.createLinearGradient(0,0,0,H);tint.addColorStop(0,'#f0d7ae');tint.addColorStop(.56,'#d9c2a7');tint.addColorStop(1,'#978c7d');fill(tint);g.fillRect(0,0,W,H);
 // Shared 2.5D room geometry and identical golden-hour material/lighting language.
 poly([[-7,0,6.5],[7,0,6.5],[7,4.75,6.5],[-7,4.75,6.5]],market?'#e1c5a0':'#d0bda7');
 poly([[-7,0,-4.5],[-7,0,6.5],[-7,4.75,6.5],[-7,4.75,-4.5]],'#bca38c');
 poly([[7,0,-4.5],[7,0,6.5],[7,4.75,6.5],[7,4.75,-4.5]],'#9e9382');
 quad(-7,7,-4.5,6.5,market?'#a89178':'#b3a591');
 for(let x=-7;x<7;x+=.74)quad(x,x+.022,-4.5,6.5,market?'#7f776773':'#8b8a7d8c');
 for(let z=-4.5;z<6.5;z+=1.30)quad(-7,7,z,z+.028,'#e3d2b682');
 wall(-7,3.94,7,4.1,6.45,A.dark);wall(-7,.09,7,.22,6.43,'#8c806f');
 // Tall glazed windows frame the outside color palette; rain remains visual only.
 for(const x of[-5.25,5.24]){
  wall(x-1.10,1.32,x+1.10,3.71,6.41,'#314d50');wall(x-.99,1.44,x+.99,3.59,6.38,'#eab487');
  wall(x-.99,1.44,x+.99,2.6,6.37,'#819ba6');wall(x-.05,1.44,x+.04,3.61,6.36,'#f7e5ca');
  wall(x-1.16,1.26,x+1.16,1.36,6.34,'#f3e0c1');
  if(weather==='rain')for(let j=0;j<7;j++)wall(x-.85+j*.27,2.0,x-.82+j*.27,2.68,6.34,'#d0e3e7aa');
 }
 // Warm ceiling canopy, pendant lamps, their light pools and shadow bands.
 poly([[-7,4.75,6.5],[7,4.75,6.5],[7,4.75,-4.5],[-7,4.75,-4.5]],'#f0d4aa');
 for(let i=-3;i<=3;i++)stroke(i*1.7,4.72,6.32,i*1.7,4.72,-4.5,.035,'#a88e72');
 for(const x of[-3.7,-1.2,1.3,3.8]){
  stroke(x,4.75,4.12,x,3.68,4.12,.035,'#486166');spot(x,3.59,4.12,.23,'#ffe1a4');spot(x,3.59,4.12,.37,'#ffe1a43b');
 }
 function artPrint(x,y,s){wall(x-.85,y-.48,x+.85,y+.48,6.37,'#344a4c');wall(x-.76,y-.39,x+.76,y+.39,6.35,'#e4d4b9');txt(s,x,y-.05,6.33,.20,'#45665e')}
 function marketRoom(){
  wall(-2.7,3.24,2.7,3.88,6.38,'#28494b');txt('MIKA’S MARKET',0,3.45,6.35,.35,'#fff0cb');
  for(const [xx,s] of[[-2.2,'FRESH PRODUCE'],[2.15,'LOCAL GOODS']])artPrint(xx,2.78,s);
  for(let j=0;j<5;j++){const x=-4.6+j*2.1;wall(x-.58,.52,x+.58,1.86,6.36,'#906c51');wall(x-.50,1.09,x+.50,1.16,6.34,'#e6c99a');for(let k=0;k<5;k++)wall(x-.47+k*.19,1.17,x-.36+k*.19,1.44,6.33,(j+k)%2?'#7fa383':'#d5a074')}
  // Full depth refrigerated display: glazing, stocked tiers and cashier desk.
  cube(4.0,5.75,4.45,5.50,0,2.07,'#3d5b5c','#30484e','#a8cfbe');
  wall(4.10,.3,5.66,1.94,4.43,'#8bbab4');
  for(let y=.58;y<1.88;y+=.39){wall(4.17,y,5.55,y+.07,4.41,'#ead9b9');for(let j=0;j<5;j++)wall(4.2+j*.25,y+.08,4.33+j*.25,y+.31,4.39,j%2?'#d6a777':'#7f9d7f')}
  cube(3.2,5.2,1.9,3.05,0,1.05,'#a17857','#755d4d','#e4c29b');
  cube(4.32,4.83,1.94,2.30,1.05,1.34,'#3b5052','#293c3e','#a2b5a6');
  cube(4.85,5.11,1.97,2.27,1.05,1.25,'#dbc48e','#91846a','#f4dfb4');
  // Freestanding shelves with individually silhouetted merchandise.
  const shelf=(x,z)=>{
   for(const side of[-.65,.61])cube(x+side,x+side+.045,z-.83,z+.87,0,1.85,'#715b4b','#665344','#ab8a67');
   for(let ty=0;ty<4;ty++){
    const y=.25+ty*.43;
    cube(x-.67,x+.68,z-.88,z+.90,y-.07,y,'#9a7658','#775d49','#e6c59a');
    if(ty<3)for(let j=0;j<5;j++){
     const xx=x-.57+j*.25;cube(xx,xx+.16,z-.69,z-.47,y,y+.26,(j+ty)%3?'#819c80':'#cb9475','#547470','#edd4aa');
    }
   }
  };
  // Entrance endcap produce baskets and queue graphics.
  for(let i=0;i<4;i++){const x=-5.7+i*.63;cube(x-.20,x+.24,3.57,4.16,0,.58,'#99704e','#77583c','#c2a27f');for(let j=0;j<3;j++)spot(x+(j-1)*.11,.64,3.82,.09,(i+j)%2?'#d6a66b':'#8da676')}
  quad(2.2,5.0,-2.4,-1.85,'#d4bb99');for(let i=0;i<5;i++)quad(2.3+i*.49,2.34+i*.49,-2.37,-1.87,'#9f856e');
  fig(735,230,'#d6452b','Mika',0,false,'down',null);
  const tz=(350-hero.y)/40;
  if(tz<=1.1)for(const [x,z] of[[-3.50,.9],[-.64,.9],[2.19,.9]])shelf(x,z);
  fig(hero.x,hero.y,'#2b6fd6','You',hero.step,hero.walking,p.dir,hero.gaitAnchor);
  if(tz>1.1)for(const [x,z] of[[-3.50,.9],[-.64,.9],[2.19,.9]])shelf(x,z);
  pill('Mika’s Market · redesigned environment',12,75);
  pill(nearMerchant?'E · Shop / talk to Mika':'Exit at the front · E',12,H-63);
 }
 function dojoRoom(){
  wall(-3.35,3.24,3.35,3.87,6.37,'#253e44');txt('NORTHSIDE DOJO',0,3.45,6.34,.33,'#fff0d2');
  for(const [x,word] of[[-4.6,'FOCUS'],[-1.45,'RESPECT'],[1.45,'DISCIPLINE'],[4.5,'BALANCE']]){
   wall(x-.92,2.09,x+.92,2.91,6.35,'#ead8b8');txt(word,x,2.44,6.33,.17,'#476267');
  }
  // Full competition mat surface; existing collision and quest remain unchanged.
  quad(-5.45,1.60,-1.43,3.96,'#52767a');
  for(let x=-5.40;x<1.55;x+=1.02)quad(x,x+.035,-1.40,3.92,'#8da8a2');
  for(let z=-1.4;z<3.96;z+=1.02)quad(-5.40,1.55,z,z+.035,'#8da8a2');
  quad(-4.68,.85,-.82,3.31,'#658b86');quad(-4.51,.71,-.70,3.20,'#72958d');
  for(const x of[-5.25,-3.38]){
   wall(x,1.17,x+1.51,3.17,6.38,'#405b60');wall(x+.12,1.31,x+1.39,3.07,6.34,'#b6cac2');
   wall(x+.18,1.40,x+.50,2.95,6.31,'#d9d9c6');
  }
  for(const x of[-2.25,0,2.25]){
   wall(x-.31,3.49,x+.31,4.21,6.36,x===0?'#e4d4ba':'#b96657');txt(x===0?'道':'武',x,3.76,6.34,.25,x===0?'#334a4e':'#fff0d2');
  }
  // Training equipment: bags suspended in 3D and padded racks.
  for(const x of[3.44,5.10]){
   stroke(x,4.6,3.42,x,2.62,3.42,.038,'#56656a');cube(x-.31,x+.31,3.28,3.61,1.13,2.54,'#8f514a','#613f3c','#b97960');
   wall(x-.32,2.39,x+.32,2.45,3.27,'#d8ba96');
  }
  cube(3.42,5.50,-1.4,-.9,0,.58,'#8b745e','#674f42','#bc9d7b');
  for(let j=0;j<4;j++){const xx=3.6+j*.48;cube(xx-.18,xx+.14,-1.13,-.92,.6,.94,j%2?'#536b6b':'#a76357','#365051','#c5b19a')}
  // Trophy and class board.
  wall(-5.83,.8,-4.16,.93,6.35,'#425b5e');
  for(let j=0;j<3;j++){const xx=-5.55+j*.5;wall(xx,.95,xx+.25,1.40,6.33,'#c5a16c');spot(xx+.125,1.42,6.32,.12,'#efddb7')}
  wall(2.65,1.59,4.45,2.87,6.32,'#e9d7b8');wall(2.75,1.68,4.36,2.79,6.30,'#f6edda');
  for(let j=0;j<5;j++)wall(2.91,2.52-j*.16,4.17,2.56-j*.16,6.28,'#b4a98e');
  fig(665,267,'#66788f','Coach Ren',0,false,'down',null);
  fig(hero.x,hero.y,'#2b6fd6','You',hero.step,hero.walking,p.dir,hero.gaitAnchor);
  pill('Northside Dojo · redesigned environment',12,75);
  pill(renNoticeTime>0?renNotice:(renQuest==='completed'?'Dojo Pass earned':renQuest==='active'?'Deliver hand wraps to Coach Ren':'Talk to Coach Ren'),12,H-63);
  if(nearCoach)pill('E · Talk to Coach Ren',W/2-110,106);
 }
 if(market)marketRoom();else dojoRoom();
}
window.__dojoInteriorArt=render;
window.__dojoInteriorVisualVersion='0.1.16-environment-redesign';
})();
