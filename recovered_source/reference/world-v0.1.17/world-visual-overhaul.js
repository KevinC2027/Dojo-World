/* Dojo World v0.1.15 FULL VISUAL OVERHAUL (Job 1 only). Original world.js owns all
   collisions, quest, NPC merchant, inventory, input, and scene transitions.
   This module intentionally has no access to gameplay mutation functions. */
(()=>{'use strict';
const TAU=Math.PI*2,STEP=.56,CYCLE=1.12,ARM=.4,LEG=.62;
const REFLECTION_X=[1,9,24,29,40,48],VERGE_POST_X=[4,16,22,34,45];
const CROSSWALK_X=[2,21,42],DRAIN_X=[-3,11,27,38,49],POSTER_X=[6.1,12.6,25.2,30.5];
const B=[{x0:5,x1:15,h:5.2,face:'#d9c3a0',roof:'#314a4d',label:'Mika’s Market',door:10,awn:'#f4e4c7'},
{x0:23,x1:33,h:5.6,face:'#c9b89a',roof:'#263a3f',label:'Northside Dojo',door:28,awn:'#c8503a'},
{x0:38,x1:44,h:4.2,face:'#b9c4b3',roof:'#3d4f55',label:'MAPLE BOOKS',door:41,awn:'#d6a771'},
{x0:-9,x1:-4,h:4,face:'#c4b5a2',roof:'#4a4140',label:'TEA HOUSE',door:-6.5,awn:'#8a5d57'}];
// Fixed decorative actors: no collisions, AI, combat or networking.
const pedestrians=[{x:1,z:5.5,dir:1,speed:.68,phase:.3,color:'#637e8c'},
{x:20,z:5.3,dir:-1,speed:.86,phase:2.1,color:'#9d695f'},
{x:36,z:5.6,dir:-1,speed:.62,phase:1.2,color:'#85758c'},
{x:44,z:5.4,dir:-1,speed:.76,phase:4.3,color:'#536d5b'},
{x:9,z:5.5,dir:1,speed:.52,phase:1.8,color:'#b48c73'},
{x:30,z:5.4,dir:-1,speed:.53,phase:3.8,color:'#708b7d'}];
// Fixed lanes; same-lane vehicles keep a constant 25 m gap and wrap off-camera.
const cars=[{x:12,z:-1.8,speed:3.2,color:'#bd715b',dir:1,min:-45,max:82},
{x:68,z:1.7,speed:2.9,color:'#526b7e',dir:-1,min:-45,max:82},
{x:37,z:-1.8,speed:3.2,color:'#b9a16e',dir:1,min:-45,max:82},
{x:43,z:1.7,speed:2.9,color:'#667f70',dir:-1,min:-45,max:82}];
const animals=[{x:3,z:5.7,type:'dog',color:'#ae8664'},
{x:17,z:6.0,type:'cat',color:'#55565b'},
{x:39,z:5.8,type:'bird',color:'#e6d9c7'},
{x:28,z:5.8,type:'cat',color:'#b58c75'}];
let last=0;const camera={x:14};
// Stable draw records: do not rebuild arrays, records or closures on every frame.
const renderables=[];
for(const b of B)renderables.push({kind:'building',z:7.5,b});
for(const [x,z] of [[-10.5,6.15],[-3.0,6.1],[0,6.2],[18.1,6.2],[20.2,6.2],[35.6,6.15],[46.8,6.15]])renderables.push({kind:'tree',x,z});
for(let x=-8;x<47;x+=9)renderables.push({kind:'lamp',x,z:4.9});
for(const x of[-4,18,37])renderables.push({kind:'bench',x,z:5.5});
for(const x of[7,34])renderables.push({kind:'bike',x,z:5.3});
for(const x of[6.8,15.8,22.1,33.7,43.5])renderables.push({kind:'planter',x,z:5.95});
renderables.push({kind:'kiosk',x:16.4,z:5.65});
for(const x of[2.3,21.2,41.4])renderables.push({kind:'crossSign',x,z:5.55});
for(const c of cars)renderables.push({kind:'car',z:c.z,c});
for(const n of pedestrians)renderables.push({kind:'pedestrian',z:n.z,n});
for(const n of animals)renderables.push({kind:'animal',z:n.z,n});
const mikaRenderable={kind:'mika',z:0},heroRenderable={kind:'hero',z:0};
renderables.push(mikaRenderable,heroRenderable);
const byDepth=(a,b)=>b.z-a.z;

function draw({ctx:g,W,H,p,npc,frame,weather,coins,inventory,renQuest,nearDoor,nearGymDoor,nearNpc,dialog}){
 const D=11, F=Math.min(W*1.5,H*1.55),dt=Math.max(0,Math.min(.05,frame-last));last=frame;
 // Coordinate bridge from the existing pixel world. This does NOT alter gameplay speed.
 const wx=(p.x-420)/28,wz=(504-p.y)/18;
 camera.x+=(wx-camera.x)*.15;
 const P=(x,y,z)=>{const k=F/Math.max(2,D+z);return{x:W/2+(x-camera.x)*k,y:H*.4+(2.4-y)*k,s:k,d:z}};
 const ln=(a,b,w,c)=>{g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()};
 const dot=(a,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(a.x,a.y,r,0,TAU);g.fill()};
 const quad=(x0,x1,z0,z1,c)=>{const a=P(x0,0,z0),b=P(x1,0,z0),d=P(x1,0,z1),e=P(x0,0,z1);g.fillStyle=c;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(d.x,d.y);g.lineTo(e.x,e.y);g.closePath();g.fill()};
 const rect=(x0,y0,x1,y1,z,c)=>{const a=P(x0,y1,z),b=P(x1,y0,z);g.fillStyle=c;g.fillRect(a.x,a.y,b.x-a.x,b.y-a.y)};
 const txt=(s,x,y,z,size,color,weight='700')=>{const a=P(x,y,z);g.font=weight+' '+Math.max(8,size*a.s)+'px system-ui';g.fillStyle=color;g.textAlign='center';g.fillText(s,a.x,a.y)};
 const pill=(s,x,y,right=false)=>{g.font='600 12px system-ui';const w=g.measureText(s).width+16;g.fillStyle='rgba(255,252,244,.88)';g.beginPath();g.roundRect(right?x-w:x,y,w,22,11);g.fill();g.fillStyle='#1b1b1f';g.textAlign='left';g.fillText(s,(right?x-w:x)+8,y+15)};
 // The user's supplied golden-hour, Fuji, wet-pavement and cherry-blossom art language.
 g.fillStyle='#eceae4';g.fillRect(0,0,W,H);const hz=H*.4;
 const sky=g.createLinearGradient(0,0,0,hz*1.15);sky.addColorStop(0,'#f6d8a8');sky.addColorStop(.45,'#e8a87c');sky.addColorStop(.75,'#9db4c8');sky.addColorStop(1,'#6e8299');g.fillStyle=sky;g.fillRect(0,0,W,hz+2);
 const sun=g.createRadialGradient(W*.32,H*.14,4,W*.32,H*.14,W*.28);sun.addColorStop(0,'rgba(255,236,190,.95)');sun.addColorStop(1,'rgba(255,236,190,0)');g.fillStyle=sun;g.fillRect(0,0,W,hz+2);
 const fx=W*.58-camera.x*2,fw=W*.3,fa=H*.1,fb=hz+4;g.fillStyle='#66788f';g.beginPath();g.moveTo(fx-fw,fb);g.lineTo(fx,fa);g.lineTo(fx+fw,fb);g.closePath();g.fill();
 g.fillStyle='#f4f7f9';g.beginPath();g.moveTo(fx-fw*.22,fa+(fb-fa)*.22);g.lineTo(fx,fa);g.lineTo(fx+fw*.22,fa+(fb-fa)*.22);g.lineTo(fx+fw*.07,fa+(fb-fa)*.32);g.lineTo(fx,fa+(fb-fa)*.26);g.lineTo(fx-fw*.07,fa+(fb-fa)*.32);g.closePath();g.fill();
 // Distant low-rise neighborhood silhouette, mist and sunlit cloud banks.
 for(let i=0;i<24;i++){
  const sx=i*57-48-(camera.x*1.6)%57,hh=19+(i*17%34);
  g.fillStyle=i%3?'#71878c66':'#82938a77';g.fillRect(sx,hz-hh,49,hh);
  g.fillStyle='#f8d9ae66';for(let j=0;j<3;j++)g.fillRect(sx+8+j*12,hz-hh+9,4,5);
 }
 for(let i=0;i<5;i++){
  const x=(i*223+110-camera.x*.6)%1170-100,y=hz*.29+(i%3)*17;
  g.fillStyle='rgba(255,228,197,.20)';g.beginPath();g.ellipse(x,y,68,9,0,0,TAU);g.fill();
 }
 g.fillStyle='rgba(84,96,84,.55)';g.beginPath();g.moveTo(0,hz);for(let x=0;x<=W;x+=W/8)g.lineTo(x,hz-10-Math.sin((x+camera.x*8)*.01)*8);g.lineTo(W,hz+2);g.lineTo(0,hz+2);g.closePath();g.fill();
 const wet=g.createLinearGradient(0,hz,0,H);wet.addColorStop(0,'#9a8f7a');wet.addColorStop(.35,'#6f6a5e');wet.addColorStop(1,'#3d3a36');g.fillStyle=wet;g.fillRect(0,hz,W,H-hz);
 quad(-40,80,7,70,'#7f9d76');quad(-40,80,4.6,7,'#b5ab98');quad(-40,80,-4.6,4.6,'#697b7c');quad(-40,80,4.5,4.7,'#867f72');quad(-40,80,-4.65,-4.5,'#b3a48c');
 // Continuous, subtle wet-asphalt sheen with perspective ripples and reflections.
 for(let x=-38;x<78;x+=2.5){
  const z=-3.7+((Math.round(x*7)%9)+9)%9*.76;
  quad(x,x+.52,z,z+.032,'#d9c8aa26');
  if(Math.round(x*3)%3===0)quad(x+.25,x+.71,z+.17,z+.20,'#c5e0d12b');
 }
 // Shopfront reflections stretch across the wet roadway, without becoming obstacles.
 for(const b of B){
  for(let j=0;j<5;j++){
   const x=b.door+(j-2)*.26,z=-2.6+j*.42;
   quad(x-.045,x+.065,z,z+.11,j%2?'#f4c9a837':'#b5d5cc30');
  }
 }
 // Sidewalk seams, lane paint, drains, crosswalks. No trees in road.
 for(let x=-40;x<80;x+=2.6){quad(x,x+.035,4.6,7,'#928b7d');quad(x,x+.035,-4.9,-4.6,'#a7a08f')}
 for(let x=-38;x<78;x+=3.5){if(Math.abs(x-28)<5)continue;quad(x,x+1.7,-.08,.08,'#e8dcb8')}
 for(const x of CROSSWALK_X){
  for(let j=0;j<6;j++)quad(x+j*.28,x+j*.28+.18,-3.8,3.8,'#e9dfc8');
  // Sidewalk curb ramp and tactile warning panel, outside the road lanes.
  quad(x-.65,x+2.05,4.65,5.20,'#c6b89f');
  quad(x-.38,x+1.79,4.89,5.12,'#e3c787');
  for(let j=0;j<6;j++)quad(x-.24+j*.32,x-.17+j*.32,5.00,5.045,'#aa905f');
 }
 for(const x of DRAIN_X){
  quad(x-.42,x+.42,4.53,4.63,'#394a4c');
  for(let j=0;j<4;j++)quad(x-.33+j*.18,x-.28+j*.18,4.55,4.61,'#a6b1a8');
 }
 for(let x=-35;x<75;x+=8){quad(x,x+.45,4.65,4.78,'#4e5a5a');quad(x+.3,x+.35,4.78,5.15,'#a49a8c')}
 // Low-relief curb reflectors and verge utility plates; all outside lanes.
 for(const x of POSTER_X){
  quad(x-.42,x+.42,5.02,5.36,'#a99d88');
  quad(x-.29,x+.29,5.09,5.28,'#d8c8aa');
  quad(x-.20,x+.20,5.14,5.20,'#6e8582');
 }
 for(let x=-31;x<72;x+=11){quad(x-.09,x+.09,4.69,4.74,'#e8d6aa')}

 // Damp road: broken sunset and shop-light reflections, low contrast and lane-safe.
 for(const x of REFLECTION_X){
  quad(x-.25,x+.32,-2.7,-2.63,'#c9ac8d4b');
  quad(x-.38,x+.21,-2.42,-2.38,'#f0cda95a');
  quad(x-.13,x+.17,-2.16,-2.12,'#c9b8a146');
 }
 // Verge details, not navigation blockers or traffic obstacles.
 for(const x of VERGE_POST_X){
  quad(x-.11,x+.11,4.79,4.9,'#48595a');
  rect(x-.065,.03,x+.065,.42,4.89,'#3d505a');
  rect(x-.09,.40,x+.09,.46,4.88,'#e8d6b4');
 }
 const ring=[[24,-4],[32,-4],[32,4],[24,4]].map(q=>P(q[0],0,q[1]));g.fillStyle='#c7c0b0';g.beginPath();ring.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fill();g.strokeStyle='#263a3f88';g.lineWidth=2;g.stroke();
 for(let x=24;x<=32;x++)ln(P(x,0,-4),P(x,0,4),1,'#28383a35');for(let z=-4;z<=4;z++)ln(P(24,0,z),P(32,0,z),1,'#28383a35');
 const figure=(...args)=>window.__dojoVF.figure(g,P,...args);
 const building=b=>{const z=7,k=P(b.x0,b.h,z).s;rect(b.x0,0,b.x1,b.h,z,b.face);
  for(let yy=.35;yy<b.h-.4;yy+=.28){rect(b.x0+.08,yy,b.x1-.08,yy+.018,z,'#695e4b35');for(let xx=b.x0+.3+(Math.floor(yy/.28)%2)*.27;xx<b.x1-.3;xx+=.8)rect(xx,yy,xx+.025,yy+.22,z,'#6657442a')}
  rect(b.x0-.4,b.h,b.x1+.4,b.h+.5,z,b.roof);rect(b.x0,b.h-.15,b.x1,b.h,z,'#0003');rect(b.x0-.2,.15,b.x0+.05,b.h,z,'#fff3');rect(b.x1-.05,.15,b.x1+.2,b.h,z,'#0002');
  // Small rooftop silhouettes and parapet caps; stay above storefronts.
  rect(b.x0-.44,b.h+.47,b.x1+.44,b.h+.53,z,'#f2dfc1');
  rect(b.x0+.65,b.h+.52,b.x0+1.18,b.h+.82,z,'#4c5c5d');
  rect(b.x0+.72,b.h+.82,b.x0+1.11,b.h+.86,z,'#b3b4a6');
  rect(b.x1-1.15,b.h+.52,b.x1-.94,b.h+1.06,z,'#4a5859');
  rect(b.x1-1.23,b.h+1.04,b.x1-.86,b.h+1.11,z,'#b1a28b');
  for(const wx of[b.x0+1.2,b.x1-2.1]){rect(wx-.12,1.55,wx+1.03,3.24,z,'#f2dabb');rect(wx-.08,1.62,wx+.98,3.18,z,'#4a5351');rect(wx,1.7,wx+.9,3.1,z,'#7caba9');rect(wx,1.7,wx+.35,3.1,z,'#acd2cc');rect(wx+.43,1.7,wx+.47,3.1,z,'#e5dfc9');rect(wx-.17,1.48,wx+1.09,1.59,z,'#b49c7b');
   rect(wx-.18,3.21,wx+1.10,3.32,z,'#e4d2b2');
   rect(wx-.06,3.01,wx+.96,3.065,z,'#f5ead1a8');
  }
  // Grounded stoop, threshold and weathered edge: decorative only, no collider.
  quad(b.door-.82,b.door+.82,6.72,7,'#c7b39a');quad(b.door-.72,b.door+.72,6.56,6.72,'#a18f79');
  rect(b.door-.82,.06,b.door+.82,.13,z,'#f2dfb9');
  rect(b.door-.7,0,b.door+.7,2.35,z,'#283b40');rect(b.door-.5,0,b.door+.5,2.2,z,'#c2a178');rect(b.door-.3,.5,b.door+.3,1.9,z,'#79a7a5');rect(b.door+.33,1,b.door+.37,1.1,z,'#fff1ca');
  if(b.awn)for(let i=0;i<8;i++)rect(b.door-1.2+i*.3,2.45,b.door-.9+i*.3,2.85,z,i%2?b.awn:'#314a4d');
  if(b.awn){rect(b.door-1.27,2.4,b.door+1.27,2.48,z,'#314a4d');rect(b.door-.55,3.16,b.door+.55,3.24,z,'#f5e6c7')}
  // Two small entrance planters and lanterns stay on the storefront verge, never in traffic.
  for(const side of[-1,1]){
   const bx=b.door+side*1.04;
   rect(bx-.15,.02,bx+.15,.38,6.88,'#8b775e');
   rect(bx-.12,.36,bx+.12,.65,6.86,'#63856a');
   rect(bx-.06,.64,bx+.06,.84,6.85,'#86a981');
   rect(b.door+side*.83,2.2,b.door+side*.99,2.52,z,'#3d505a');
   rect(b.door+side*.86,2.26,b.door+side*.96,2.45,z-.015,'#ffe3a8');
  }
  // Projected shop fascia, rain gutters and shallow display bays.
  rect(b.x0-.12,b.h-.32,b.x1+.12,b.h-.25,z,'#e8d4b3');
  rect(b.x0+.2,.94,b.x0+1.15,2.18,z,'#314a4d');
  rect(b.x0+.29,1.04,b.x0+1.06,2.07,z,'#8bb5ae');
  rect(b.x0+.34,1.12,b.x0+.57,1.52,z,'#e8c98c');
  rect(b.x0+.65,1.12,b.x0+.94,1.67,z,'#6d9578');
  rect(b.x1-.15,.15,b.x1-.08,b.h+.45,z,'#526468');
  rect(b.x1-.25,.12,b.x1-.01,.18,z,'#b1a28b');
  if(b.label){rect(b.door-2,3.7,b.door+2,4.5,z,'#1b1b1f');txt(b.label,b.door,3.95,z,.3,'#fff')}
  for(let i=0;i<3;i++){rect(b.x0+.4+i*.5,.15,b.x0+.7+i*.5,.48,z,'#526e5c');rect(b.x0+.44+i*.5,.48,b.x0+.66+i*.5,.76,z,'#71966d')}
  // FULL STREETSCAPE PASS: continuous 3D fascia, lit window bays, parapets and depth.
  // Facade objects are render-only; original building/door colliders are untouched.
  const side=b.x1-b.x0,mid=(b.x0+b.x1)*.5;
  const roofTop=P(mid,b.h+.58,z),roofRear=P(mid,b.h+.58,z+1.4);
  g.fillStyle='#24383c';g.beginPath();
  let q=P(b.x0-.38,b.h+.51,z);g.moveTo(q.x,q.y);
  q=P(b.x1+.38,b.h+.51,z);g.lineTo(q.x,q.y);
  q=P(b.x1+.18,b.h+.77,z+1.4);g.lineTo(q.x,q.y);
  q=P(b.x0-.18,b.h+.77,z+1.4);g.lineTo(q.x,q.y);g.closePath();g.fill();
  // Upper-level cornice, inset windows, shutters, lintels and stone sills.
  rect(b.x0+.18,b.h-.44,b.x1-.18,b.h-.32,z-.035,'#f1dfbf');
  for(let wx=b.x0+.58;wx<b.x1-1.2;wx+=1.65){
   if(Math.abs(wx-b.door)<.45)continue;
   rect(wx,2.92,wx+1.08,3.60,z-.055,'#4d5550');
   rect(wx+.07,3.00,wx+1.01,3.53,z-.07,'#7fa5a3');
   rect(wx+.12,3.06,wx+.48,3.46,z-.09,'#b8d0c3');
   rect(wx+.52,3.06,wx+.90,3.46,z-.09,'#d3a889');
   rect(wx+.49,3.0,wx+.54,3.53,z-.095,'#f2e3c8');
   rect(wx-.08,2.86,wx+1.16,2.95,z-.09,'#ead7b6');
   rect(wx-.06,3.57,wx+1.14,3.65,z-.08,'#e9d8c3');
  }
  // Glazed ground-floor display bays with visible silhouettes of merchandise.
  for(const x of[b.x0+.75,b.x1-1.95]){
   if(Math.abs(x-b.door)<1.2)continue;
   rect(x,.44,x+1.3,2.30,z-.08,'#314a4d');
   rect(x+.10,.54,x+1.2,2.18,z-.10,'#c2c9b4');
   rect(x+.14,.60,x+1.16,2.08,z-.12,'#587b79');
   rect(x+.20,1.05,x+1.08,1.12,z-.14,'#e5c99b');
   for(let i=0;i<4;i++)rect(x+.22+i*.22,1.12,x+.36+i*.22,1.48,z-.15,i%2?'#d3a47c':'#96b28a');
   rect(x+.23,1.52,x+.98,1.59,z-.14,'#d7bd8f');
   rect(x+.19,1.65,x+.30,2.02,z-.15,'#a3c4bb');
   rect(x+.62,.58,x+.68,2.08,z-.15,'#e7d9bc');
  }
  // Richer canopy, hanging fabric and painted business trim.
  if(b.awn){
   rect(b.door-1.65,2.52,b.door+1.65,2.76,z-.12,b.roof);
   for(let j=0;j<11;j++)rect(b.door-1.58+j*.29,2.29,b.door-1.45+j*.29,2.53,z-.16,j%2?'#f6e6cc':b.awn);
   rect(b.door-1.72,2.25,b.door+1.72,2.30,z-.18,'#273e43');
  }
  // Mounted lamps, mailbox and street number reinforce human scale.
  for(const side of[-1,1]){
   const lx=b.door+side*1.52;
   rect(lx-.08,2.68,lx+.08,2.94,z-.13,'#34484a');
   rect(lx-.10,2.71,lx+.10,2.86,z-.15,'#ffe1a3');
  }
  rect(b.door+.78,.82,b.door+1.04,1.20,z-.13,'#3e5962');
  txt(String(Math.round(b.door*8+80)),b.door-.86,2.03,z-.17,.18,'#f9e9c8');
  // Vertical downspouts, brick pilasters, and roof vents.
  for(const x of[b.x0+.16,b.x1-.16]){
   rect(x-.05,.1,x+.05,b.h+.47,z-.07,'#697d79');
   rect(x-.12,.13,x+.11,.18,z-.09,'#e6d2b5');
  }
  for(let i=0;i<3;i++){
   const xx=b.x0+.9+i*side/4;
   rect(xx,b.h+.54,xx+.10,b.h+.87,z+.35,'#4c5d5c');
  }
 };

 const tree=(x,z)=>{
  const a=P(x,0,z),k=a.s;
  g.fillStyle='rgba(28,43,41,.22)';g.beginPath();g.ellipse(a.x,a.y,.62*k,.14*k,0,0,TAU);g.fill();
  ln(P(x,0,z),P(x,2.45,z),.20*k,'#6a524c');
  ln(P(x,1.62,z),P(x-.65,2.78,z),.10*k,'#6a524c');
  ln(P(x,1.82,z),P(x+.74,2.88,z),.10*k,'#6a524c');
  for(const [dx,dy,r,c] of [[-.75,2.92,.58,'#e9a1b6'],[.58,3.12,.63,'#f4bfcc'],[0,3.42,.72,'#f8d2d9'],[-.98,2.65,.37,'#e7a6b8'],[.99,2.75,.40,'#eab1c1']])dot(P(x+dx,dy,z),r*k,c);
  for(let j=0;j<5;j++){const q=P(x+(j-2)*.27,2.55+(j%2)*.25,z-.03);dot(q,.08*k,j%2?'#fbe1e5':'#f2bcc9')}
 };
 const lamp=(x,z)=>{const a=P(x,0,z),t=P(x,3.6,z),k=a.s;ln(a,t,.1*k,'#3d505a');dot(P(x,3.75,z),.2*k,'#ffe3a8')};
 const bench=(x,z)=>{for(const y of[.45,.68,.9])ln(P(x-.65,y,z),P(x+.65,y,z),P(x-.65,y,z).s*.075,'#a47c60');for(const dx of[-.52,.52])ln(P(x+dx,0,z),P(x+dx,.9,z),.08*P(x,0,z).s,'#3d505a')};
 const bike=(x,z)=>{const k=P(x,0,z).s,a=P(x-.4,.32,z),b=P(x+.4,.32,z);g.strokeStyle='#3d505a';g.lineWidth=Math.max(2,k*.05);for(const q of[a,b]){g.beginPath();g.arc(q.x,q.y,.28*k,0,TAU);g.stroke()}ln(a,P(x,.67,z),k*.05,'#3d505a');ln(P(x,.67,z),b,k*.05,'#3d505a')};
 // 4.2m long / 1.75m wide / 1.35m high: consistent with 1.78m VF adults.
 const car=(x,z,color,dir)=>{
  const k=P(x,0,z).s,center=P(x,0,z),top=P(x,1.35,z),nose=dir>0?1:-1;
  quad(x-2.1,x+2.1,z-.875,z+.875,'#27363b44');
  // Full-length body and tapered cabin; solid, faceless VF palette, no sprite swap.
  const bodyY=P(x,.28,z).y,roofY=P(x,1.13,z).y;
  g.fillStyle='#28363d';g.fillRect(center.x-2.10*k,bodyY-.06*k,4.20*k,.28*k);
  g.fillStyle=color;g.fillRect(center.x-2.10*k,roofY+.28*k,4.20*k,.71*k);
  g.beginPath();g.moveTo(center.x-1.08*k,roofY+.32*k);g.lineTo(center.x-.63*k,roofY);
  g.lineTo(center.x+.81*k,roofY);g.lineTo(center.x+1.25*k,roofY+.32*k);g.closePath();g.fill();
  g.fillStyle='#a5c8ce';g.beginPath();g.moveTo(center.x-.55*k,roofY+.07*k);
  g.lineTo(center.x+.66*k,roofY+.07*k);g.lineTo(center.x+1.0*k,roofY+.33*k);
  g.lineTo(center.x-.86*k,roofY+.33*k);g.closePath();g.fill();
  g.fillStyle='#344f59';g.fillRect(center.x-.03*k,roofY+.07*k,.055*k,.27*k);
  for(const dx of[-1.35,1.32]){
   g.fillStyle='#242c31';g.beginPath();g.arc(center.x+dx*k,center.y-.19*k,.33*k,0,TAU);g.fill();
   g.fillStyle='#aeb9b8';g.beginPath();g.arc(center.x+dx*k,center.y-.19*k,.16*k,0,TAU);g.fill();
  }
  g.fillStyle=nose>0?'#f7e0a4':'#de645b';g.fillRect(center.x+(nose>0?1.89:-2.06)*k,roofY+.62*k,.17*k,.18*k);
  // Body contours, door seams, trim and road reflections emphasize a 4.2m vehicle.
  g.strokeStyle='#e4cdb399';g.lineWidth=Math.max(1,k*.015);g.beginPath();
  g.moveTo(center.x-1.9*k,roofY+.76*k);g.lineTo(center.x+1.84*k,roofY+.76*k);g.stroke();
  g.strokeStyle='#2b424a88';g.beginPath();g.moveTo(center.x+.05*k,roofY+.35*k);g.lineTo(center.x+.05*k,roofY+.96*k);g.stroke();
  g.fillStyle='#f5dfad44';g.fillRect(center.x-1.3*k,center.y+.10*k,2.6*k,.05*k);

 };
 const animal=(x,z,type,color,t)=>{const a=P(x,0,z),k=a.s;g.fillStyle=color;if(type==='bird'){dot(P(x,.2+.05*Math.sin(t*4),z),.12*k,color);ln(P(x-.14,.23,z),P(x,.34,z),.03*k,color);ln(P(x,.34,z),P(x+.14,.23,z),.03*k,color)}else{g.beginPath();g.ellipse(a.x,a.y-.26*k,.32*k,.2*k,0,0,TAU);g.fill();dot(P(x+.31,.38,z),.17*k,color);for(const dx of[-.2,.18])ln(P(x+dx,.2,z),P(x+dx,0,z),.08*k,color);ln(P(x-.3,.35,z),P(x-.48,.5+Math.sin(t*3)*.05,z),.06*k,color)}};
 // Cohesive, non-interactive street furniture and public space details.
 const planter=(x,z)=>{
  const k=P(x,0,z).s;
  rect(x-.28,.04,x+.28,.42,z,'#9b8065');rect(x-.33,.38,x+.33,.47,z,'#b99b75');
  for(const dx of[-.15,.1,.22]){ln(P(x+dx,.42,z),P(x+dx*.7,.82,z),.038*k,'#4d785a');dot(P(x+dx*.7,.83,z),.12*k,dx<0?'#d5a4b0':'#82a97b')}
 };
 const kiosk=(x,z)=>{
  const k=P(x,0,z).s;
  rect(x-.6,.04,x+.6,1.55,z,'#354e51');rect(x-.52,.16,x+.52,1.39,z,'#d6b68c');
  rect(x-.47,.83,x+.47,1.24,z,'#456c72');txt('MAPLE',x,1.01,z,.19,'#f6e7c6');
  rect(x-.67,1.54,x+.67,1.72,z,'#253d44');
 };
 const crossSign=(x,z)=>{
  const k=P(x,0,z).s;ln(P(x,0,z),P(x,3.1,z),.075*k,'#40545a');
  rect(x-.45,2.58,x+.45,3.03,z,'#f4e4c7');txt('8TH ST',x,2.77,z,.17,'#314a4d');
 };
 // World-space depth sort uses persistent render records; no per-frame actor
 // arrays, callback closures or new draw objects are created here.
 const t=frame,mx=(npc.x-420)/28,mz=(504-npc.y)/18;
 mikaRenderable.z=mz;heroRenderable.z=wz;
 renderables.sort(byDepth);
 for(let i=0;i<renderables.length;i++){
  const o=renderables[i];
  switch(o.kind){
   case 'building':building(o.b);break;
   case 'tree':tree(o.x,o.z);break;
   case 'lamp':lamp(o.x,o.z);break;
   case 'bench':bench(o.x,o.z);break;
   case 'bike':bike(o.x,o.z);break;
   case 'planter':planter(o.x,o.z);break;
   case 'kiosk':kiosk(o.x,o.z);break;
   case 'crossSign':crossSign(o.x,o.z);break;
   case 'car':{
    const c=o.c,span=c.max-c.min;
    const x=c.min+((c.x-c.min+c.dir*c.speed*t+10000*span)%span+span)%span;
    car(x,c.z,c.color,c.dir);break;
   }
   case 'pedestrian':{
    const n=o.n,x=-10+((n.x+10+n.dir*n.speed*t+700000)%70+70)%70;
    figure(x,n.z,n.color,'',t*n.speed/CYCLE*TAU+n.phase,true,n.dir,0);break;
   }
   case 'animal':{
    const n=o.n;animal(n.x+Math.sin(t*.6)*.25,n.z,n.type,n.color,t);break;
   }
   case 'mika':figure(mx,mz,'#66788f','Mika',0,false,0,-1);break;
   case 'hero':window.__dojoVF.figure(g,P,wx,wz,'#d6452b','You',p.step,p.walking,p.headingX,p.headingZ,p.gaitAnchor);break;
  }
 }
 // Background bird flock and occasional wind-carried blossoms; purely decorative.
 g.strokeStyle='#354d5866';g.lineWidth=1.3;
 for(let i=0;i<7;i++){
  const bx=((i*143+frame*8)%1140)-90,by=55+(i*13%50)+Math.sin(frame*1.2+i)*3;
  g.beginPath();g.moveTo(bx-5,by-2);g.quadraticCurveTo(bx-2,by-7,bx,by);g.quadraticCurveTo(bx+3,by-7,bx+7,by-2);g.stroke();
 }
 for(let i=0;i<22;i++){
  const bx=((i*97+frame*(4+i%4))%1050)-40,by=((i*83+frame*(9+i%3))%370)+90;
  g.fillStyle=i%3?'#f2bfcba6':'#ffe0e5a6';g.fillRect(bx,by,3,2);
 }
 if(weather==='rain')for(let i=0;i<95;i++){const x=(i*131+t*110)%W,y=(i*67+t*220)%H;ln({x,y},{x:x-8,y:y+17},1.3,'#b3d8e0a3')}
 pill(wx<4?'Cherry park':wx<20?'Maple Street':wx<35?'Northside Dojo':'East gate',12,76);
 pill('Coins '+coins+(inventory.wraps?' · Hand wraps':'')+(inventory.dojoPass?' · Dojo Pass':''),W-12,76,true);
 pill((p.walking?'Walking':'Idle')+' · stride-linked · x '+wx.toFixed(1)+' z '+wz.toFixed(1),12,102);
 if(nearDoor||nearGymDoor||nearNpc||dialog>0)pill(nearDoor?'E · Enter Mika’s Market':nearGymDoor?'E · Enter Northside Dojo':'E · Talk to Mika',W/2-94,H-40);
 if(renQuest==='completed')pill('Coach Ren quest complete',W/2-95,64);
}
window.__dojoPerspectiveArt=draw;
window.__dojoVisualVersion='0.1.15';
})();
