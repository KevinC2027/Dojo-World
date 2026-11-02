/* Dojo World v0.1.17: JOB 1 cohesive environment art pass.
 * Existing VF figures, gameplay source, camera behavior, controls, merchant, quest,
 * movement physics, scene transitions, combat source and APIs are not modified.
 * All simulated vehicles, pedestrians and animals are visual-only.
 */
(()=>{'use strict';
const TAU=Math.PI*2, HORIZON=.40, ROAD_Z=-4.5, FRONT_Z=4.7;
const STRUCTURES=[
 {a:-19,b:-11,h:5.9,d:-15.2,z:7.55,face:'#a9b4b0',shade:'#738e91',edge:'#f0dfc5',roof:'#334c50',canopy:'#d99d81',title:'MAPLE APARTMENTS',floor:2,style:'apartments'},
 {a:-9,b:-4,h:4.4,d:-6.5,z:7.55,face:'#cab9a9',shade:'#a78e81',edge:'#ead4bd',roof:'#504744',canopy:'#a56d62',title:'TEA HOUSE',floor:2,style:'tea'},
 {a:5,b:15,h:5.45,d:10,z:7.55,face:'#e3c59f',shade:'#c5a780',edge:'#f7e6c9',roof:'#344e50',canopy:'#f0d1a9',title:'MIKA’S MARKET',floor:2,style:'market'},
 {a:23,b:33,h:6.15,d:28,z:7.55,face:'#d0c2ab',shade:'#a69888',edge:'#f4e6d0',roof:'#263f45',canopy:'#b6574a',title:'NORTHSIDE DOJO',floor:3,style:'dojo'},
 {a:38,b:44,h:5.1,d:41,z:7.55,face:'#b7c2b2',shade:'#8ca69d',edge:'#dce7d2',roof:'#354d4d',canopy:'#ca9d69',title:'MAPLE BOOKS',floor:2,style:'books'},
 {a:48,b:59,h:5.7,d:53.5,z:7.55,face:'#beb8bc',shade:'#8b8b9c',edge:'#e9d5ce',roof:'#465265',canopy:'#b9aca1',title:'ROOFTOP CAFÉ',floor:2,style:'cafe'}
];
const LAMPS=[-12,-1,2.5,17.5,35.4,46.4,62];
const TREES=[[-11.5,6.12],[-2.9,6.07],[.4,6.10],[18.1,6.15],[20.9,6.18],[35.8,6.10],[46.4,6.12]];
const SEATS=[[-4.1,5.55],[17.1,5.54],[21.3,5.60],[45.0,5.54]];
const SIGNS=[[-1.2,'MAPLE / 8TH'],[22,'DOJO DISTRICT'],[47,'EAST MAPLE']];
const CARS=[{x:-55,z:-1.88,v:3.2,dir:1,c:'#b66c59',style:0},{x:-30,z:-1.88,v:3.2,dir:1,c:'#cfb481',style:1},{x:93,z:1.65,v:2.8,dir:-1,c:'#587389',style:0},{x:118,z:1.65,v:2.8,dir:-1,c:'#728776',style:1}];
const PEDESTRIANS=[{x:-2,z:5.10,s:.60,d:1,p:.4,c:'#688395'},{x:11,z:5.35,s:.66,d:-1,p:1.6,c:'#8c746f'},{x:22,z:5.35,s:.52,d:-1,p:2.2,c:'#7f917e'},{x:34,z:5.37,s:.69,d:1,p:3.1,c:'#8b6f90'},{x:45,z:5.30,s:.56,d:-1,p:4,c:'#ab836c'}];
const PETS=[{x:17.2,z:5.75,t:'dog',c:'#a78568'},{x:3.3,z:5.79,t:'cat',c:'#59636b'},{x:43,z:5.79,t:'bird',c:'#c4bba5'},{x:21.4,z:5.73,t:'cat',c:'#b7a18c'}];
const BIKE_RACKS=[[-8.5,5.55],[39.3,5.52]], HYDRANTS=[[3.7,5.02],[34.7,5.03]];
const NEWS_STANDS=[[-5.7,5.64],[41.1,5.65]];
const obj=[];
for(const b of STRUCTURES)obj.push({kind:'building',depth:b.z,b});
for(const a of TREES)obj.push({kind:'tree',depth:a[1],x:a[0],z:a[1]});
for(const x of LAMPS)obj.push({kind:'lamp',depth:5.07,x,z:5.07});
for(const a of SEATS)obj.push({kind:'seat',depth:a[1],x:a[0],z:a[1]});
for(const a of SIGNS)obj.push({kind:'sign',depth:5.28,x:a[0],z:5.28,s:a[1]});
for(const n of PEDESTRIANS)obj.push({kind:'pedestrian',depth:n.z,n});
for(const n of PETS)obj.push({kind:'pet',depth:n.z,n});
for(const c of CARS)obj.push({kind:'car',depth:c.z,c});
for(const x of BIKE_RACKS)obj.push({kind:'bike',depth:x[1],x:x[0],z:x[1]});
for(const x of HYDRANTS)obj.push({kind:'hydrant',depth:x[1],x:x[0],z:x[1]});
for(const x of NEWS_STANDS)obj.push({kind:'news',depth:x[1],x:x[0],z:x[1]});
const hero={kind:'hero',depth:0},mika={kind:'mika',depth:0};obj.push(hero,mika);
const depthSort=(a,b)=>b.depth-a.depth;
const cam={x:15};let last=0;
function render({ctx:g,W,H,p,npc,frame,weather,coins,inventory,renQuest,nearDoor,nearGymDoor,nearNpc,dialog}){
 const F=Math.min(W*1.5,H*1.55),t=frame,dt=Math.min(.06,Math.max(0,t-last));last=t;
 const wx=(p.x-420)/28,wz=(504-p.y)/18,mx=(npc.x-420)/28,mz=(504-npc.y)/18;
 cam.x+=(wx-cam.x)*.15;
 const P=(x,y,z)=>{const s=F/Math.max(2,11+z);return{x:W*.5+(x-cam.x)*s,y:H*HORIZON+(2.4-y)*s,s};};
 const fill=(c)=>{g.fillStyle=c};
 const line=(x,y,xx,yy,w,c)=>{g.lineWidth=w;g.strokeStyle=c;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke()};
 const poly=(pts,c)=>{fill(c);g.beginPath();for(let i=0;i<pts.length;i++){const pt=pts[i],q=P(pt[0],pt[1],pt[2]);if(i)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y)}g.closePath();g.fill()};
 const quad=(x0,x1,z0,z1,c)=>{
  const a=F/Math.max(2,11+z0),b=F/Math.max(2,11+z1),h=H*HORIZON;
  fill(c);g.beginPath();g.moveTo(W*.5+(x0-cam.x)*a,h+2.4*a);
  g.lineTo(W*.5+(x1-cam.x)*a,h+2.4*a);g.lineTo(W*.5+(x1-cam.x)*b,h+2.4*b);
  g.lineTo(W*.5+(x0-cam.x)*b,h+2.4*b);g.closePath();g.fill();
 };
 const wall=(x0,y0,x1,y1,z,c)=>{
  const sc=F/Math.max(2,11+z);fill(c);
  g.fillRect(W*.5+(x0-cam.x)*sc,H*HORIZON+(2.4-y1)*sc,(x1-x0)*sc,(y1-y0)*sc);
 };
 const disc=(x,y,z,r,c)=>{const sc=F/Math.max(2,11+z);fill(c);g.beginPath();g.arc(W*.5+(x-cam.x)*sc,H*HORIZON+(2.4-y)*sc,r*sc,0,TAU);g.fill()};
 const stroke=(a,b,width,c)=>{const u=P(a[0],a[1],a[2]),v=P(b[0],b[1],b[2]);line(u.x,u.y,v.x,v.y,width*u.s,c)};
 const label=(word,x,y,z,size,color)=>{const sc=F/Math.max(2,11+z);fill(color);g.font='800 '+Math.max(9,size*sc)+'px system-ui';g.textAlign='center';g.fillText(word,W*.5+(x-cam.x)*sc,H*HORIZON+(2.4-y)*sc)};
 const box=(x0,x1,z0,z1,y0,y1,front,side,top)=>{
  poly([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],front);
  poly([[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],side);
  poly([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],top);
 };
 const hud=(word,x,y,right)=>{g.font='600 12px system-ui';const wi=g.measureText(word).width+18;fill('#fff9ede8');g.beginPath();g.roundRect(right?x-wi:x,y,wi,23,11);g.fill();fill('#26383c');g.textAlign='left';g.fillText(word,(right?x-wi:x)+9,y+16)};
 // Fully replaced landscape composition; original VF figures remain separate.
 const horizon=H*HORIZON;
 const sky=g.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#f8dbaa');sky.addColorStop(.4,'#e8a17f');sky.addColorStop(.73,'#a8a5b9');sky.addColorStop(1,'#829aa4');fill(sky);g.fillRect(0,0,W,horizon+3);
 const sun=g.createRadialGradient(W*.31,H*.21,6,W*.31,H*.21,270);sun.addColorStop(0,'#ffebbecc');sun.addColorStop(.4,'#f6bba555');sun.addColorStop(1,'#f7ba9a00');fill(sun);g.fillRect(0,0,W,horizon+8);
 // Three independent mountain contours, with a snow cap on Fuji.
 const shift=cam.x*2,fx=W*.61-shift;
 fill('#60778a');g.beginPath();g.moveTo(fx-340,horizon+4);g.lineTo(fx,46);g.lineTo(fx+340,horizon+4);g.closePath();g.fill();
 fill('#f4efe7');g.beginPath();g.moveTo(fx-90,99);g.lineTo(fx,46);g.lineTo(fx+87,100);g.lineTo(fx+32,92);g.lineTo(fx+10,111);g.lineTo(fx-20,91);g.lineTo(fx-52,108);g.closePath();g.fill();
 fill('#708990');g.beginPath();g.moveTo(-150,horizon+6);g.lineTo(W*.1,135);g.lineTo(W*.36,horizon+6);g.closePath();g.fill();
 fill('#7e9590');g.beginPath();g.moveTo(W*.70,horizon+6);g.lineTo(W*.84,154);g.lineTo(W+110,horizon+6);g.closePath();g.fill();
 // Volumetric-looking hand-drawn cloud bands and mountain haze, all in the existing canvas perspective.
 const cloud=g.createLinearGradient(0,64,0,horizon);cloud.addColorStop(0,'#fff1d000');cloud.addColorStop(.52,'#f9d7b51a');cloud.addColorStop(1,'#f9d2ad66');fill(cloud);g.fillRect(0,66,W,horizon-65);
 for(let i=0;i<10;i++){
  const cx=((i*197+Math.sin(i*17)*30-cam.x*.43)%1300+1300)%1300-160;
  const cy=69+(i*31)%110,ww=80+(i*13)%92;
  fill(i%3===0?'#fff1d52a':'#d6a4a22b');g.beginPath();g.ellipse(cx,cy,ww,5+i%4*2,-.06,0,TAU);g.fill();
 }
 // Warm rim light near Fuji's foothills; a second silhouette gives architectural depth.
 const haze=g.createLinearGradient(0,horizon-72,0,horizon+15);haze.addColorStop(0,'#f5c6a400');haze.addColorStop(.75,'#f2bca765');haze.addColorStop(1,'#9b9e9999');fill(haze);g.fillRect(0,horizon-72,W,88);
 for(let i=0;i<16;i++){
  const x=i*86-50-cam.x*.8,h=17+(i*19)%36;
  fill(i%2?'#647c8199':'#6e858a8c');g.fillRect(x,horizon-h,70,h);
  fill('#e5ccaa77');for(let j=0;j<4;j++)g.fillRect(x+9+j*14,horizon-h+7,4,6);
 }
 // Fine overhead cables and distant suspended lights give the street a lived-in scale.
 g.lineWidth=1;g.strokeStyle='#384f5259';
 for(let i=0;i<3;i++){
  const y=111+i*13;g.beginPath();g.moveTo(-30,y-20);g.quadraticCurveTo(W*.5,y+20,W+30,y-18);g.stroke();
 }
 for(let i=0;i<7;i++){
  const x=95+i*133,y=104+Math.sin(i*.8)*12;
  fill('#f7ddb174');g.beginPath();g.arc(x,y,2.2,0,TAU);g.fill();
 }
 // Near-ground atmospheric silhouettes and continuous neighborhood canopy.
 for(let i=0;i<26;i++){const x=i*53-55-(cam.x*1.3%53),h=20+(i*11)%43;fill(i%3?'#5f777888':'#84948999');g.fillRect(x,horizon-h,51,h);fill('#e4cba466');for(let j=0;j<3;j++)g.fillRect(x+10+j*12,horizon-h+9,5,7)}
 fill('#4f726c88');g.beginPath();g.moveTo(0,horizon);for(let x=0;x<=W;x+=12)g.lineTo(x,horizon-11-5*Math.sin((x+shift)*.023));g.lineTo(W,horizon+9);g.lineTo(0,horizon+9);g.closePath();g.fill();
 const pavement=g.createLinearGradient(0,horizon,0,H);pavement.addColorStop(0,'#b5a38b');pavement.addColorStop(.29,'#867e70');pavement.addColorStop(.62,'#5c7275');pavement.addColorStop(1,'#3f5259');fill(pavement);g.fillRect(0,horizon,W,H-horizon);
 // Reconstruct the complete cross-section: a verge, paving, raised curb and wet roadway.
 quad(-45,95,7.1,9,'#7b9570');quad(-45,95,6.65,7.12,'#bbb6a1');quad(-45,95,4.72,6.67,'#baad99');
 quad(-45,95,4.55,4.73,'#938979');quad(-45,95,4.46,4.54,'#e1c7a0');
 quad(-45,95,-4.7,4.45,'#657c82');quad(-45,95,-4.88,-4.72,'#d2c5ad');
 // Cobblestone-edge sidewalk, tactile ramps, crosswalks and wet concrete seams.
 for(let x=-40;x<93;x+=1.42){quad(x,x+.028,4.82,6.64,'#8f8e805e');if((Math.round(x*2)%2)===0)quad(x+.18,x+.79,5.35,5.37,'#d4c6af44')}
 for(let x=-40;x<90;x+=2.3){if(Math.floor(x/2.3)%3)quad(x,x+1.12,-.046,.046,'#e4dbc0')}
 for(const crossing of[1.3,21.25,42.7]){
  for(let j=0;j<7;j++)quad(crossing+j*.29,crossing+.19+j*.29,-3.98,3.85,'#e8e0d1');
  quad(crossing-.47,crossing+2.35,4.59,5.25,'#cfbea3');quad(crossing-.13,crossing+2.03,4.97,5.07,'#d6ad67');
  for(let i=0;i<6;i++)quad(crossing+i*.34,crossing+.065+i*.34,5.005,5.035,'#856f54');
 }
 for(let x=-32;x<91;x+=9){quad(x-.42,x+.44,4.52,4.61,'#354a4d');for(let i=0;i<4;i++)quad(x-.28+i*.18,x-.24+i*.18,4.53,4.58,'#91a5a1')}
 // Layered road sheen / dashed lane lines, with faint storefront and lamp reflections.
 for(let x=-40;x<94;x+=1.7){const z=-3.8+((x*7|0)&7)*.78;quad(x,x+.2,z,z+.022,'#c6d0c01c')}
 for(let x=-40;x<88;x+=5.6){quad(x,x+1.65,-.075,.075,'#eadcbd');quad(x-.15,x+1.3,-.45,-.43,'#c0d1cb32')}
 for(let x=-39;x<91;x+=3){if((x|0)%2===0){quad(x-.17,x+.16,-2.8,-2.74,'#e8c5a04d');quad(x-.32,x+.13,-2.48,-2.44,'#edd5b944')}}
 // Parkway with a curving planted bed at the street midpoint.
 quad(15.5,22.7,6.95,9,'#779471');for(let x=15.8;x<22.6;x+=.72){disc(x,.07,7.58,.11,(Math.floor(x)%2)?'#f0c0c2':'#d8ae9c');disc(x,.16,8.03,.15,'#698b74')}
 for(let x=-38;x<92;x+=13){quad(x-.13,x+.13,4.59,4.72,'#d5bb90');quad(x-.07,x+.07,4.65,4.68,'#e8d29d')}
 // Tiny puddle highlights reflect the sky rather than opaque white rectangles.
 for(let x=-32;x<86;x+=5.3){quad(x-.43,x+.18,1.25,1.28,'#b9d8d035');quad(x+.27,x+.80,1.18,1.20,'#e9d4b22f')}
 // Long specular wet-street streaks and crosswalk runoff. Reflections stay on the road.
 for(let i=0;i<66;i++){
  const x=-36+i*1.92,z=-4.18+(i*13%57)*.145,ww=.19+(i%4)*.15;
  quad(x,x+ww,z,z+.014,i%3===0?'#fbe1bd44':'#c3e2d844');
 }
 for(const xx of[-12,-1,2.5,17.5,35.4,46.4,62]){
  for(let j=0;j<4;j++){
   const z=1.35+j*.55;
   quad(xx-.05-j*.085,xx+.06+j*.095,z,z+.045,j%2?'#eecb9250':'#fce4b15c');
  }
 }
 // Raised tram-style paving strips and inset gutter stones near the curb.
 for(let x=-39;x<92;x+=.52){quad(x,x+.045,4.38,4.47,'#344b4b70');quad(x,x+.09,4.78,4.80,'#e9d7bb44')}
 // Receding road-tone bands, broken reflections and wet tire tracks.
 for(let i=0;i<22;i++){
  const x=-37+i*5.5;
  quad(x,x+2.3,-1.25,-1.235,'#b6c8c626');
  quad(x+.2,x+1.6,2.25,2.264,'#d7dfd129');
 }
 // Roadside kerb stones and recessed storm drains are decorative only.
 for(let i=0;i<75;i++){
  const x=-39+i*1.72;
  quad(x,x+.028,4.48,4.59,'#475c5b66');
 }
 // Architecture: true stepped side faces, roof planes, inset glazing, shop stock.
 function structure(b){
  const z=b.z,depth=z+1.35;
  poly([[b.a,0,z],[b.a,0,depth],[b.a,b.h,depth],[b.a,b.h,z]],b.shade);
  poly([[b.b,0,z],[b.b,0,depth],[b.b,b.h,depth],[b.b,b.h,z]],'#64787b');
  poly([[b.a,b.h,z],[b.b,b.h,z],[b.b,b.h+.36,depth],[b.a,b.h+.36,depth]],b.roof);
  wall(b.a,0,b.b,b.h,z,b.face);
  wall(b.a-.19,b.h-.03,b.b+.19,b.h+.23,z,b.roof);
  wall(b.a-.29,b.h+.20,b.b+.29,b.h+.29,z,b.edge);
  wall(b.a,.04,b.b,.22,z,b.edge);
  for(let x=b.a+.14;x<b.b;x+=.70){wall(x,.26,x+.021,b.h-.22,z,'#715f4a24')}
  for(let y=.64;y<b.h-.35;y+=.31){wall(b.a+.04,y,b.b-.04,y+.016,z,'#87755e38')}
  for(let y=b.h-1.35;y>1.4;y-=1.55){
   for(let x=b.a+.68;x<b.b-.95;x+=1.48){
    if(Math.abs(x-b.d)<.80&&y<2.7)continue;
    wall(x-.06,y-.70,x+.90,y+.41,z-.08,'#f7e7cc');
    wall(x,y-.62,x+.84,y+.32,z-.11,'#394f53');
    wall(x+.06,y-.58,x+.78,y+.27,z-.13,'#7ca6a7');
    wall(x+.10,y-.54,x+.33,y+.22,z-.15,'#b1cfca');
    wall(x+.43,y-.60,x+.48,y+.29,z-.16,'#e4ded0');
    wall(x-.12,y-.77,x+.95,y-.68,z-.16,b.edge);
    wall(x-.08,y+.33,x+.92,y+.41,z-.16,'#f2ddba');
    if(y>2.9)wall(x+.09,y-.29,x+.73,y-.255,z-.17,'#f2c99766');
   }
  }
  // Recessed glass shop windows with stocked shelving, furniture silhouettes.
  for(const xx of[b.a+.85,b.b-2.25]){
   if(Math.abs(xx-b.d)<1.18)continue;
   wall(xx-.10,.48,xx+1.55,2.53,z-.16,'#e7dcc6');wall(xx,.58,xx+1.46,2.43,z-.18,'#334b4f');
   wall(xx+.09,.64,xx+1.38,2.34,z-.20,'#759d9d');wall(xx+.16,.71,xx+.45,2.30,z-.22,'#b4d1c3');
   for(let j=0;j<3;j++){
    const yy=.92+j*.46;wall(xx+.24,yy,xx+1.25,yy+.08,z-.24,'#d4b995');
    for(let k=0;k<4;k++)wall(xx+.3+k*.23,yy+.09,xx+.44+k*.23,yy+.33,z-.27,(j+k)%3?'#e2c18f':'#8eb092');
   }
   wall(xx+.66,.62,xx+.73,2.41,z-.27,'#e8d7b5');
  }
  // Open entrance, shallow stoop, roofed cloth canopy, warm entrance lanterns.
  quad(b.d-.87,b.d+.87,6.80,7.40,'#b39b82');quad(b.d-.75,b.d+.75,6.57,6.82,'#e2c5a3');
  wall(b.d-.76,.12,b.d+.76,2.62,z-.16,'#334a4b');
  wall(b.d-.54,.15,b.d+.54,2.48,z-.19,'#d1ad82');
  wall(b.d-.38,.56,b.d+.40,2.31,z-.21,'#7ea5a2');
  wall(b.d+.39,1.12,b.d+.45,1.23,z-.24,'#f4e5bd');
  box(b.d-1.72,b.d+1.72,z-.47,z+.35,2.73,2.91,b.roof,'#32474a',b.canopy);
  for(let i=0;i<12;i++)wall(b.d-1.65+i*.275,2.42,b.d-1.52+i*.275,2.72,z-.50,(i%2)?b.canopy:'#f8e8d1');
  for(const side of[-1,1]){
   const x=b.d+side*1.25;wall(x-.07,2.48,x+.07,2.84,z-.16,'#355157');wall(x-.10,2.53,x+.10,2.75,z-.18,'#ffdb97');
   box(x-.17,x+.17,6.76,7.03,.04,.39,'#8f7867','#6a6055','#d4b79a');
   disc(x,.53,6.87,.16,'#709c78');disc(x-.08,.67,6.91,.11,'#8cac81');
  }
  wall(b.d-1.85,3.29,b.d+1.85,3.90,z-.09,'#243a3e');
  wall(b.d-1.90,3.89,b.d+1.90,3.99,z-.08,b.edge);
  label(b.title,b.d,3.53,z-.12,.31,'#f9e9c9');
  // Roof hatches, vents, narrow pipes, small clock and storefront number.
  box(b.a+.74,b.a+1.26,z+.48,z+1.05,b.h+.24,b.h+.68,'#4f6566','#3e5457','#8ea4a0');
  wall(b.b-.35,.24,b.b-.24,b.h+.53,z-.11,'#708486');
  wall(b.d+1.0,1.02,b.d+1.2,1.34,z-.22,'#3b5459');
  label(String(Math.round(b.d*7+96)),b.d-.92,2.32,z-.22,.15,'#f7ebd5');
  // Individual building identity: trim, ironwork, fire escape, ceramic tile, wood and masonry.
  const s=b.style;
  if(s==='market'||s==='books'){
   // Deep shop fascia, enamel trim and recessed transom lights.
   wall(b.a+.13,2.84,b.b-.13,2.99,z-.19,s==='market'?'#d69c66':'#7e9c86');
   for(let x=b.a+.28;x<b.b-.2;x+=.55)wall(x,2.88,x+.18,2.92,z-.21,'#f6e6c188');
   for(let x=b.a+.42;x<b.b-.2;x+=1.26){
    if(Math.abs(x-b.d)<1.7)continue;
    wall(x,2.12,x+.04,2.82,z-.22,'#e4c99c');
   }
  }else if(s==='dojo'){
   // Japanese-influenced timber framing, wide eaves and vertical fabric noren.
   wall(b.a-.28,b.h-.46,b.b+.28,b.h-.31,z-.38,'#283e43');
   for(let x=b.a+.32;x<b.b-.3;x+=1.8)wall(x,.34,x+.15,b.h-.42,z-.14,'#65594b');
   for(let i=0;i<4;i++){
    const xx=b.d-1.15+i*.65;
    wall(xx,2.02,xx+.51,2.48,z-.53,i%2?'#b86253':'#f0d8ae');
   }
  }else if(s==='tea'){
   // Tea-house slatted wood frontage and warm paper-lantern rhythm.
   for(let x=b.a+.26;x<b.b-.25;x+=.31){
    if(Math.abs(x-b.d)<.85)continue;
    wall(x,.35,x+.035,2.72,z-.14,'#6d6559b5');
   }
   for(let x=b.a+.4;x<b.b-.1;x+=1.8)disc(x,2.95,z-.38,.16,'#ffe4b8');
  }else if(s==='apartments'){
   // A restrained black iron fire escape with landings and ladders.
   const xx=b.b-1.65;
   for(let y=2.22;y<b.h-.7;y+=1.42){
    box(xx-.16,xx+1.08,z-.55,z+.02,y,y+.09,'#47585a','#3d5053','#6f7771');
    for(let j=0;j<7;j++)stroke([xx-.05+j*.17,y+.12,z-.58],[xx-.05+j*.17,y+.51,z-.58],.018,'#354c4f');
    stroke([xx+.91,y,z-.59],[xx+.16,y-1.18,z-.59],.034,'#34494c');
   }
  }else if(s==='cafe'){
   // Upper-story terrace planters and decorative balustrade.
   box(b.a+.36,b.b-.36,z-.53,z+.28,b.h-1.62,b.h-1.51,'#5a6466','#3c5052','#d1b99a');
   for(let x=b.a+.4;x<b.b-.3;x+=.37)stroke([x,b.h-1.5,z-.55],[x,b.h-1.08,z-.55],.025,'#45585b');
   for(let x=b.a+.5;x<b.b-.4;x+=1.2)disc(x,b.h-1.37,z-.57,.21,'#71947b');
  }
  // Deep cast shadows and individual awning seams give every facade a coherent scale.
  wall(b.a+.06,2.68,b.b-.06,2.80,z-.10,'#4c55514d');
  for(let x=b.a+.25;x<b.b-.25;x+=.84){
   wall(x,2.74,x+.038,2.98,z-.47,'#6c5c5088');
  }
  // Ground-floor inset stone panels, small carved masonry and varied window sills.
  for(let x=b.a+.20;x<b.b-.20;x+=1.25){
   if(Math.abs(x-b.d)<1.5)continue;
   wall(x,.18,x+.90,.38,z-.10,'#e8d4b778');
   wall(x+.10,.39,x+.13,.72,z-.11,'#816f5d50');
   wall(x+.81,.39,x+.84,.72,z-.11,'#816f5d50');
  }
  // A vertical projecting sign and readable shop identity, placed over the sidewalk.
  if(s==='market'||s==='dojo'||s==='tea'){
   const sx=b.d+2.10;
   stroke([sx,3.98,z-.10],[sx,3.98,z-.83],.042,'#30474a');
   box(sx-.25,sx+.25,z-.84,z-.75,3.06,3.89,'#314d50','#21383c','#cfac83');
   label(s==='market'?'M':s==='dojo'?'道':'茶',sx,3.39,z-.86,.23,'#f6e2b6');
  }
  // Dim warm glazing beneath the awning, deliberately separate from collision geometry.
  for(let x=b.a+.60;x<b.b-.5;x+=2.05){
   if(Math.abs(x-b.d)<1.55)continue;
   wall(x,1.75,x+.57,1.82,z-.25,'#ffdfa456');
   wall(x,1.36,x+.57,1.40,z-.25,'#ffdfa435');
  }
  // Door-mounted vertical hours placard and light pools under awnings.
  wall(b.d+.59,.85,b.d+.83,1.37,z-.24,'#e9dfc9');
  wall(b.d+.63,.95,b.d+.78,1.00,z-.25,'#6d807d');
  wall(b.d+.63,1.08,b.d+.78,1.13,z-.25,'#6d807d');
  quad(b.d-1.5,b.d+1.5,6.82,7.00,'#ffe3aa3b');
  // Modest architectural age without chaotic procedural noise.
  wall(b.a+.13,.72,b.a+.23,1.36,z-.09,'#f0e3cc5a');
 }
 function tree(x,z){
  // Cherry trees grow exclusively in sidewalk verge beds, never road lanes.
  quad(x-.55,x+.55,z-.32,z+.32,'#88775e');quad(x-.44,x+.44,z-.25,z+.25,'#53795b');
  stroke([x,0,z],[x,2.25,z],.155,'#70574d');
  for(let j=0;j<5;j++){
   const a=-1.12+j*.55,ex=x+Math.sin(a)*1.08,ey=2.6+Math.cos(a)*.56;
   stroke([x,1.58,z],[ex,ey,z+.02],.055,'#775e56');
  }
  // Asymmetrical canopy clusters: tiny blossom rosettes over darker inner foliage.
  for(let k=0;k<17;k++){
   const a=k*2.399,dx=Math.sin(a)*(.37+(k%4)*.19),dy=2.77+Math.cos(a)*(.35+(k%3)*.13);
   disc(x+dx,dy,z+.06,.25+(k%3)*.07,k%4===0?'#bb7f98':k%4===1?'#f3c3d1':k%4===2?'#e8a3b9':'#f7d5d9');
  }
  for(let j=0;j<25;j++){
   const a=j*2.4,dx=Math.sin(a)*(.35+(j%6)*.14),yy=2.75+Math.cos(a)*(.27+(j%5)*.10);
   disc(x+dx,yy,z-.05,.037,j%3?'#fff0e8':'#fbe0a8');
  }
  // Falling petals gather only in tree wells and on sidewalk.
  for(let j=0;j<7;j++)disc(x-.43+j*.14,.016,z-.18+(j%3)*.14,.028,'#e8afbd');
 }
 function lantern(x,z){
  stroke([x,0,z],[x,3.23,z],.09,'#3b5157');stroke([x-.18,3.2,z],[x+.20,3.2,z],.09,'#33494c');
  disc(x,3.33,z,.19,'#ffe4ae');disc(x,3.33,z,.30,'#ffe1a426');
  quad(x-.16,x+.16,z-.09,z+.1,'#52605c');
 }
 function seat(x,z){
  for(let j=0;j<3;j++)stroke([x-.65,.49+j*.18,z],[x+.65,.49+j*.18,z],.073,'#a7795e');
  stroke([x-.52,0,z],[x-.52,.93,z],.077,'#435b5d');stroke([x+.52,0,z],[x+.52,.93,z],.077,'#435b5d');
  quad(x-.8,x+.8,z-.32,z+.34,'#d7b78b33');
 }
 function streetSign(x,z,s){
  stroke([x,0,z],[x,3.25,z],.074,'#455b61');wall(x-.70,2.75,x+.70,3.16,z-.05,'#f2dec0');
  label(s,x,2.90,z-.08,.14,'#31494b');
 }
 function vehicle(c){
  // Ambient vehicles are 2.7 world units long, approximately 2.2 human heights.
  // Unlike the oversized v0.1.16 cars, these share the VF figure's projected scale.
  const span=126,x=-42+(((c.x+42)+c.dir*t*c.v+span*1000)%span+span)%span,z=c.z;
  const q=P(x,0,z),k=q.s*.78,dir=c.dir;
  // Underbody contact shadow, two-dimensional road footprint and wet reflection.
  quad(x-1.11,x+1.12,z-.48,z+.48,'#253e4655');
  fill('#c5d7d01f');g.fillRect(q.x-1.05*k,q.y+.04*k,2.12*k,.08*k);
  const left=q.x-1.37*k,top=q.y-.88*k;
  // Dark wheel arches and steel lower sill.
  fill('#29383b');g.fillRect(left,q.y-.37*k,2.74*k,.34*k);
  fill(c.c);g.fillRect(left,top,2.74*k,.53*k);
  g.beginPath();g.moveTo(q.x-.93*k,top);g.lineTo(q.x-.64*k,q.y-1.29*k);g.lineTo(q.x+.60*k,q.y-1.29*k);g.lineTo(q.x+.98*k,top);g.closePath();g.fill();
  // Angled glass reads as a real car rather than a flat truck.
  fill('#8faeaf');g.beginPath();g.moveTo(q.x-.57*k,q.y-1.22*k);g.lineTo(q.x-.84*k,top+.03*k);g.lineTo(q.x+.84*k,top+.03*k);g.lineTo(q.x+.55*k,q.y-1.22*k);g.closePath();g.fill();
  fill('#3c626a');g.fillRect(q.x-.024*k,q.y-1.22*k,.048*k,.38*k);
  fill('#d9e6d3aa');g.fillRect(q.x-.50*k,q.y-1.17*k,.26*k,.055*k);
  // Bumper, door seam, trim and handles.
  line(q.x-.16*k,top+.07*k,q.x-.16*k,q.y-.39*k,1.15,'#243c4199');
  fill('#e8dbbe');g.fillRect(q.x+.11*k,top+.13*k,.20*k,.045*k);
  fill('#e2d2ad66');g.fillRect(q.x-.96*k,q.y-.45*k,1.95*k,.045*k);
  for(const dx of[-.89,.93]){
   fill('#26383b');g.beginPath();g.arc(q.x+dx*k,q.y-.13*k,.23*k,0,TAU);g.fill();
   fill('#c3cac2');g.beginPath();g.arc(q.x+dx*k,q.y-.13*k,.105*k,0,TAU);g.fill();
  }
  fill(dir>0?'#ffe8bd':'#d97a68');g.fillRect(q.x+(dir>0?1.20:-1.37)*k,top+.22*k,.16*k,.12*k);
  fill('#fff1cd44');g.fillRect(q.x+(dir>0?1.22:-1.43)*k,q.y+.04*k,.38*k,.045*k);
 }
 function pet(n){const x=n.x+Math.sin(t*.5+n.x)*.22,z=n.z;
  if(n.t==='bird'){
   disc(x,.16,z,.10,'#b7b6a5');stroke([x-.12,.25,z],[x,.36,z],.023,'#c7beb3');stroke([x,.36,z],[x+.12,.25,z],.023,'#c7beb3');
  }else{
   const q=P(x,.28,z);fill(n.c);g.beginPath();g.ellipse(q.x,q.y,.32*q.s,.18*q.s,0,0,TAU);g.fill();
   disc(x+.30,.39,z,.15,n.c);for(const dx of[-.17,.18])stroke([x+dx,.23,z],[x+dx,0,z],.07,n.c);
   stroke([x-.27,.36,z],[x-.48,.48+Math.sin(t*2)*.07,z],.05,n.c);
   if(n.t==='cat'){disc(x+.21,.53,z,.05,n.c);disc(x+.37,.53,z,.05,n.c)}
  }
 }
 function bike(x,z){
  // Sidewalk bicycle locked to a short black rack.
  for(const dx of[-.43,.45]){
   const q=P(x+dx,.30,z);fill('#314b4d');g.beginPath();g.arc(q.x,q.y,.27*q.s,0,TAU);g.lineWidth=.035*q.s;g.strokeStyle='#314b4d';g.stroke();
  }
  stroke([x-.42,.30,z],[x,.80,z],.028,'#4b6968');stroke([x,.80,z],[x+.45,.30,z],.028,'#4b6968');
  stroke([x-.42,.30,z],[x+.17,.34,z],.028,'#4b6968');stroke([x+.17,.34,z],[x,.80,z],.028,'#4b6968');
  stroke([x-.13,.85,z],[x+.22,.85,z],.025,'#2f464a');stroke([x-.20,.81,z],[x-.25,.96,z],.025,'#2f464a');
 }
 function hydrant(x,z){
  const q=P(x,.02,z),s=q.s;fill('#a34f43');g.fillRect(q.x-.13*s,q.y-.57*s,.26*s,.53*s);
  disc(x,.61,z,.18,'#b76750');stroke([x-.24,.31,z],[x+.24,.31,z],.15,'#b76750');
  disc(x,.74,z,.075,'#e6ba82');
 }
 function news(x,z){
  box(x-.35,x+.34,z-.25,z+.25,0,1.25,'#3e6268','#304c52','#658b8c');
  wall(x-.30,.58,x+.29,1.10,z-.27,'#e5d6b7');
  wall(x-.23,.81,x+.20,.85,z-.28,'#9b7160');
  label('MAPLE',x,.95,z-.29,.09,'#395258');
 }
 const HJ=window.__dojoVF.figure;
 hero.depth=wz;mika.depth=mz;obj.sort(depthSort);
 for(let i=0;i<obj.length;i++){
  const o=obj[i];
  if(o.kind==='building')structure(o.b);
  else if(o.kind==='tree')tree(o.x,o.z);
  else if(o.kind==='lamp')lantern(o.x,o.z);
  else if(o.kind==='seat')seat(o.x,o.z);
  else if(o.kind==='sign')streetSign(o.x,o.z,o.s);
  else if(o.kind==='car')vehicle(o.c);
  else if(o.kind==='pet')pet(o.n);
  else if(o.kind==='bike')bike(o.x,o.z);
  else if(o.kind==='hydrant')hydrant(o.x,o.z);
  else if(o.kind==='news')news(o.x,o.z);
  else if(o.kind==='pedestrian'){
   const n=o.n,x=-15+(((n.x+15)+n.d*t*n.s+80*1000)%80+80)%80;
   HJ(g,P,x,n.z,n.c,'',t*n.s/1.12*TAU+n.p,true,n.d,0);
  }else if(o.kind==='mika')HJ(g,P,mx,mz,'#66788f','Mika',0,false,0,-1);
  else if(o.kind==='hero')HJ(g,P,wx,wz,'#d6452b','You',p.step,p.walking,p.headingX,p.headingZ,p.gaitAnchor);
 }
 // Sky silhouettes, floating petals, restrained weather: same original Maple Street language.
 g.strokeStyle='#3f536259';g.lineWidth=1.3;for(let i=0;i<6;i++){
  const x=(i*163+frame*7)%1120-90,y=58+(i*11)%49;
  g.beginPath();g.moveTo(x-5,y-2);g.quadraticCurveTo(x-3,y-7,x,y);g.quadraticCurveTo(x+3,y-7,x+7,y-2);g.stroke();
 }
 for(let i=0;i<27;i++){
  const x=((i*97+frame*(6+i%4))%1090)-60,y=((i*77+frame*(11+i%3))%340)+97;
  fill(i%3?'#f2bdc8a6':'#fff0e5ad');g.fillRect(x,y,3,2);
 }
 if(weather==='rain')for(let i=0;i<100;i++){
  const x=(i*131+t*110)%W,y=(i*67+t*220)%H;line(x,y,x-8,y+17,1.1,'#bdd6d8a8');
 }
 // Keep the existing HUD and fixed camera, as explicitly accepted by the owner.
 hud(wx<4?'Cherry park':wx<20?'Maple Street':wx<35?'Northside Dojo':'East Maple',12,76);
 hud('Coins '+coins+(inventory.wraps?' · Hand wraps':'')+(inventory.dojoPass?' · Dojo Pass':''),W-12,76,true);
 hud((p.walking?'Walking':'Idle')+' · stride-linked · x '+wx.toFixed(1)+' z '+wz.toFixed(1),12,103);
 if(nearDoor||nearGymDoor||nearNpc||dialog>0)hud(nearDoor?'E · Enter Mika’s Market':nearGymDoor?'E · Enter Northside Dojo':'E · Talk to Mika',W/2-94,H-40);
 if(renQuest==='completed')hud('Coach Ren quest complete',W/2-95,64);
}
window.__dojoPerspectiveArt=render;
window.__dojoVisualVersion='0.1.17-cinematic-streetscape';
})();
