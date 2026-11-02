/* Dojo World v0.1.16: JOB 1 environment-only redesign.
 * Existing VF figures, gameplay source, camera behavior, controls, merchant, quest,
 * movement physics, scene transitions, combat source and APIs are not modified.
 * All simulated vehicles, pedestrians and animals are visual-only.
 */
(()=>{'use strict';
const TAU=Math.PI*2, HORIZON=.40, ROAD_Z=-4.5, FRONT_Z=4.7;
const STRUCTURES=[
 {a:-19,b:-11,h:5.9,d:-15.2,z:7.55,face:'#a9b4b0',shade:'#738e91',edge:'#f0dfc5',roof:'#334c50',canopy:'#d99d81',title:'MAPLE APARTMENTS',floor:2},
 {a:-9,b:-4,h:4.4,d:-6.5,z:7.55,face:'#cab9a9',shade:'#a78e81',edge:'#ead4bd',roof:'#504744',canopy:'#a56d62',title:'TEA HOUSE',floor:2},
 {a:5,b:15,h:5.45,d:10,z:7.55,face:'#e3c59f',shade:'#c5a780',edge:'#f7e6c9',roof:'#344e50',canopy:'#f0d1a9',title:'MIKA’S MARKET',floor:2},
 {a:23,b:33,h:6.15,d:28,z:7.55,face:'#d0c2ab',shade:'#a69888',edge:'#f4e6d0',roof:'#263f45',canopy:'#b6574a',title:'NORTHSIDE DOJO',floor:3},
 {a:38,b:44,h:5.1,d:41,z:7.55,face:'#b7c2b2',shade:'#8ca69d',edge:'#dce7d2',roof:'#354d4d',canopy:'#ca9d69',title:'MAPLE BOOKS',floor:2},
 {a:48,b:59,h:5.7,d:53.5,z:7.55,face:'#beb8bc',shade:'#8b8b9c',edge:'#e9d5ce',roof:'#465265',canopy:'#b9aca1',title:'ROOFTOP CAFÉ',floor:2}
];
const LAMPS=[-12,-1,2.5,17.5,35.4,46.4,62];
const TREES=[[-11.5,6.12],[-2.9,6.07],[.4,6.10],[18.1,6.15],[20.9,6.18],[35.8,6.10],[46.4,6.12]];
const SEATS=[[-4.1,5.55],[17.1,5.54],[21.3,5.60],[45.0,5.54]];
const SIGNS=[[-1.2,'MAPLE / 8TH'],[22,'DOJO DISTRICT'],[47,'EAST MAPLE']];
const CARS=[{x:-55,z:-1.88,v:3.2,dir:1,c:'#b66c59',style:0},{x:-30,z:-1.88,v:3.2,dir:1,c:'#cfb481',style:1},{x:93,z:1.65,v:2.8,dir:-1,c:'#587389',style:0},{x:118,z:1.65,v:2.8,dir:-1,c:'#728776',style:1}];
const PEDESTRIANS=[{x:-2,z:5.10,s:.60,d:1,p:.4,c:'#688395'},{x:11,z:5.35,s:.66,d:-1,p:1.6,c:'#8c746f'},{x:22,z:5.35,s:.52,d:-1,p:2.2,c:'#7f917e'},{x:34,z:5.37,s:.69,d:1,p:3.1,c:'#8b6f90'},{x:45,z:5.30,s:.56,d:-1,p:4,c:'#ab836c'}];
const PETS=[{x:17.2,z:5.75,t:'dog',c:'#a78568'},{x:3.3,z:5.79,t:'cat',c:'#59636b'},{x:43,z:5.79,t:'bird',c:'#c4bba5'},{x:21.4,z:5.73,t:'cat',c:'#b7a18c'}];
const obj=[];
for(const b of STRUCTURES)obj.push({kind:'building',depth:b.z,b});
for(const a of TREES)obj.push({kind:'tree',depth:a[1],x:a[0],z:a[1]});
for(const x of LAMPS)obj.push({kind:'lamp',depth:5.07,x,z:5.07});
for(const a of SEATS)obj.push({kind:'seat',depth:a[1],x:a[0],z:a[1]});
for(const a of SIGNS)obj.push({kind:'sign',depth:5.28,x:a[0],z:5.28,s:a[1]});
for(const n of PEDESTRIANS)obj.push({kind:'pedestrian',depth:n.z,n});
for(const n of PETS)obj.push({kind:'pet',depth:n.z,n});
for(const c of CARS)obj.push({kind:'car',depth:c.z,c});
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
 const quad=(x0,x1,z0,z1,c)=>poly([[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]],c);
 const wall=(x0,y0,x1,y1,z,c)=>{const a=P(x0,y1,z),b=P(x1,y0,z);fill(c);g.fillRect(a.x,a.y,b.x-a.x,b.y-a.y)};
 const disc=(x,y,z,r,c)=>{const q=P(x,y,z);fill(c);g.beginPath();g.arc(q.x,q.y,r*q.s,0,TAU);g.fill()};
 const stroke=(a,b,width,c)=>{const u=P(a[0],a[1],a[2]),v=P(b[0],b[1],b[2]);line(u.x,u.y,v.x,v.y,width*u.s,c)};
 const label=(word,x,y,z,size,color)=>{const q=P(x,y,z);fill(color);g.font='800 '+Math.max(9,size*q.s)+'px system-ui';g.textAlign='center';g.fillText(word,q.x,q.y)};
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
  // Modest architectural age without chaotic procedural noise.
  wall(b.a+.13,.72,b.a+.23,1.36,z-.09,'#f0e3cc5a');
 }
 function tree(x,z){
  quad(x-.53,x+.53,z-.30,z+.31,'#786c5c');quad(x-.40,x+.40,z-.21,z+.21,'#4b6753');
  stroke([x,0,z],[x,2.3,z],.18,'#79594f');stroke([x,1.52,z],[x-.74,2.85,z],.085,'#79594f');stroke([x,1.72,z],[x+.78,3.01,z],.085,'#79594f');
  for(let k=0;k<7;k++){
   const dx=Math.sin(k*2.4)*.73,dy=2.65+Math.cos(k*2.4)*.47,r=.53+(k%3)*.065;
   disc(x+dx,dy,z+.08,r,k%3===0?'#e9a6bc':k%3===1?'#f7cbd4':'#f2b8cb');
  }
  for(let j=0;j<9;j++){const dx=Math.sin(j*2.7)*.81,yy=2.58+(j%4)*.23;disc(x+dx,yy,z-.02,.064,'#fff1ef')}
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
  const span=126,x=-42+(((c.x+42)+c.dir*t*c.v+span*1000)%span+span)%span,z=c.z;
  const body={length:4.25,height:1.45,width:1.78};
  quad(x-2.08,x+2.08,z-.91,z+.91,'#203d4650');
  const q=P(x,.08,z),k=q.s;
  const front=P(x,1.2,z),wheelY=q.y-.05*k;
  fill('#1d3035');g.fillRect(q.x-2.13*k,q.y-.62*k,4.26*k,.48*k);
  fill(c.c);g.fillRect(q.x-2.13*k,q.y-1.06*k,4.26*k,.49*k);
  g.beginPath();g.moveTo(q.x-1.37*k,q.y-.96*k);g.lineTo(q.x-.79*k,front.y);g.lineTo(q.x+.82*k,front.y);g.lineTo(q.x+1.44*k,q.y-.96*k);g.closePath();g.fill();
  fill('#b3d3ce');g.beginPath();g.moveTo(q.x-.68*k,front.y+.05*k);g.lineTo(q.x+.67*k,front.y+.05*k);g.lineTo(q.x+1.09*k,q.y-.98*k);g.lineTo(q.x-1.02*k,q.y-.98*k);g.closePath();g.fill();
  fill('#415c65');g.fillRect(q.x-.035*k,front.y+.035*k,.06*k,.35*k);
  for(const dx of[-1.42,1.43]){
   fill('#202c30');g.beginPath();g.arc(q.x+dx*k,wheelY,.32*k,0,TAU);g.fill();
   fill('#cbd1c6');g.beginPath();g.arc(q.x+dx*k,wheelY,.16*k,0,TAU);g.fill();
  }
  fill(c.dir>0?'#ffe2aa':'#d8685d');g.fillRect(q.x+(c.dir>0?1.88:-2.1)*k,q.y-.85*k,.19*k,.2*k);
  fill('#f5d5ac3a');g.fillRect(q.x-1.12*k,q.y+.03*k,2.5*k,.06*k);
  line(q.x-1.93*k,q.y-.63*k,q.x+1.9*k,q.y-.63*k,1,'#f0dcc290');
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
window.__dojoVisualVersion='0.1.16-environment-redesign';
})();
