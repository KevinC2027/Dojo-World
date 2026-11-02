/* Dojo World / Neighborhood Slice 03 — additive exploration module.
 * Independent of the accepted combat prototype. No network, voice, or PvP implemented.
 */
(()=>{'use strict';
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d');
const W=960,H=540;let last=0,frame=0,scene='street',dialog=0,weather='clear';
// Slice 02: local merchant prototype; inventory/currency are session-only, not MMO persistence.
let merchantOpen=false,coins=40,notice='',noticeTime=0;
// Slice 03: self-contained NPC quest state; no combat-engine or network changes.
let renQuest='not_started',renNotice='',renNoticeTime=0;
const inventory={};
const goods=[{id:'wraps',name:'Hand Wraps',price:15},{id:'tea',name:'Energy Tea',price:8},{id:'map',name:'Street Map',price:12}];
const p={x:685,y:504,dir:'up',step:0,walking:false,headingX:0,headingZ:1,gaitAnchor:{}},inside={x:480,y:410,step:0,walking:false,gaitAnchor:{}},dojoInside={x:480,y:430,step:0,walking:false,gaitAnchor:{}};
const keys=new Set();const world={w:1440,h:1050};
const shop={x:560,y:130,w:280,h:240,doorX:704,doorY:385};
const gym={x:990,y:120,w:300,h:270,doorX:1142,doorY:405};
const home={x:110,y:155,w:275,h:210};
const trees=[[80,520],[180,540],[290,530],[130,730],[300,760],[440,720],[480,880],[1260,710],[1320,900],[1030,900],[1110,770]];
const npc={x:805,y:412,name:'Mika'}; // Job 1: place Mika on storefront sidewalk; preserve interaction radius and quest
// Ring Fighter VF light-theme tokens; solid, faceless limbs and restrained HUD.
const vf={bg:'#eceae4',fg:'#1b1b1f',panel:'#fff',accent:'#d6452b',blue:'#2b6fd6',ring:'#d6d0c0'};
const colors={ink:vf.fg,road:'#697b7c',walk:vf.ring,grass:'#7ea57b'};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function line(x,y,x2,y2,c,w=1){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
function text(t,x,y,size=16,color='#fff',weight='700',align='center'){ctx.font=`${weight} ${size}px system-ui`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(t,x,y)}
function round(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function oval(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
// Job 1 detail pass: flat VF silhouettes, ink-weighted edges, warm restrained color blocks.
function drawTree(x,y){
 oval(x+7,y+7,34,11,'#233d3c44');rect(x-7,y-28,14,35,'#6d5748');
 line(x,y-15,x-15,y-41,'#6d5748',4);line(x,y-22,x+18,y-50,'#6d5748',4);
 oval(x-15,y-49,27,24,'#507e62');oval(x+16,y-53,29,26,'#416f59');
 oval(x-2,y-66,31,26,'#689b70');oval(x+10,y-76,19,15,'#87b184');
 oval(x-22,y-58,9,7,'#94bd8d');oval(x+23,y-64,8,6,'#93bd91');
}
function drawWindow(x,y){
 rect(x-4,y-5,51,64,'#4a5351');rect(x,y,43,53,'#e8d6b4');rect(x+5,y+5,33,43,'#7caba9');
 rect(x+5,y+5,13,40,'#acd2cc');line(x+21,y+5,x+21,y+48,'#f3e5c9',3);
 rect(x-7,y+51,57,7,'#b5a38d');rect(x+8,y+36,20,4,'#d2e8d5');
}
function drawAwning(x,y,w){
 rect(x,y,w,13,'#314a4d');for(let i=0;i<w;i+=20)rect(x+i,y+3,10,12,'#f4e4c7');
 rect(x,y+15,w,3,'#34494c');
}
function building(b,roof,face,label,trim){
 rect(b.x+10,b.y+22,b.w,b.h,'#20343c50');rect(b.x,b.y+36,b.w,b.h-36,face);
 // Brick seams and shallow vertical pilasters remain flat like the VF environment.
 for(let yy=b.y+85;yy<b.y+b.h-32;yy+=24){line(b.x+8,yy,b.x+b.w-8,yy,'#594b4533',1);for(let xx=b.x+14+((yy/24|0)%2)*20;xx<b.x+b.w-14;xx+=47)line(xx,yy,xx,yy+18,'#594b452c',1)}
 rect(b.x+11,b.y+62,7,b.h-70,trim);rect(b.x+b.w-18,b.y+62,7,b.h-70,trim);
 rect(b.x-11,b.y,b.w+22,64,roof);rect(b.x-11,b.y+58,b.w+22,9,'#263a3f');
 rect(b.x-14,b.y+6,b.w+28,6,'#f0dcc0');rect(b.x-13,b.y+18,b.w+26,3,'#253c40');
 for(let i=0;i<3;i++)drawWindow(b.x+29+i*(b.w-100)/2,b.y+101);
 round(b.x+23,b.y+19,b.w-46,30,4,vf.fg);text(label,b.x+b.w/2,b.y+40,16,vf.panel);
 if(b.doorX){
  drawAwning(b.doorX-48,b.y+b.h-76,96);
  rect(b.doorX-25,b.y+b.h-50,50,52,'#283b40');rect(b.doorX-20,b.y+b.h-46,40,47,'#c2a178');
  rect(b.doorX-13,b.y+b.h-39,26,33,'#79a7a5');line(b.doorX,b.y+b.h-39,b.doorX,b.y+b.h-6,'#e4d4b5',2);
  oval(b.doorX+14,b.y+b.h-21,2.5,2.5,'#fff2c9');rect(b.doorX-38,b.y+b.h+2,76,8,vf.ring);
  rect(b.doorX-43,b.y+b.h+10,86,3,'#867f72');
 }
 // Small, readable ground-floor shop details without changing collisions.
 if(b===shop){
  rect(b.x+23,b.y+b.h-45,44,31,'#395a56');rect(b.x+27,b.y+b.h-41,36,22,'#f0e1b7');
  text('OPEN',b.x+45,b.y+b.h-26,10,'#315b55');
  round(b.x+b.w-79,b.y+b.h-51,58,33,3,'#3d5d55');text('FRESH',b.x+b.w-50,b.y+b.h-30,10,'#f4e5c9');
 }else if(b===gym){
  rect(b.x+28,b.y+b.h-48,58,38,'#374c52');text('TRAIN',b.x+57,b.y+b.h-26,11,'#f4e5c9');
  rect(b.x+b.w-80,b.y+b.h-52,45,45,'#c7a981');text('道',b.x+b.w-57,b.y+b.h-21,24,'#4c4a45');
 }else{
  rect(b.x+20,b.y+b.h-53,52,43,'#866f61');rect(b.x+25,b.y+b.h-47,42,33,'#b2c6b3');
  rect(b.x+b.w-64,b.y+b.h-38,34,28,'#6e8a79');
 }
}
function drawBench(x,y){
 rect(x+4,y+16,70,5,'#303e42');for(let i=0;i<3;i++)rect(x+4,y+i*6,70,4,'#b08b64');
 rect(x+12,y+21,6,13,'#37464a');rect(x+62,y+21,6,13,'#37464a');
}
function drawStreetLamp(x,y){
 oval(x+3,y+3,14,5,'#273a4140');rect(x-3,y-74,6,77,'#3d5055');
 rect(x-15,y-77,30,7,'#273a40');round(x-11,y-89,22,12,3,'#e8d8a7');
 oval(x,y-84,10,3,'#fff2c9');
}
function drawPlanter(x,y){
 oval(x+3,y+4,19,6,'#293c3c44');round(x-18,y-15,36,18,3,'#ae8e72');
 oval(x,y-16,21,7,'#587b5c');oval(x-8,y-25,13,12,'#588c66');oval(x+7,y-29,14,14,'#6b9d73');
}
function drawBike(x,y){
 for(let i=0;i<2;i++){ctx.strokeStyle='#354e51';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+i*35,y,11,0,Math.PI*2);ctx.stroke()}
 line(x,y,x+17,y-15,'#3b5256',3);line(x+17,y-15,x+35,y,'#3b5256',3);
 line(x,y,x+23,y,'#3b5256',3);line(x+23,y,x+17,y-15,'#3b5256',3);
 line(x+17,y-15,x+14,y-20,'#35494d',3);line(x+9,y-20,x+20,y-20,'#35494d',3);
}
function drawStreet(){
 rect(0,0,world.w,world.h,'#7ba17a');
 for(let x=16;x<world.w;x+=79)for(let y=25;y<world.h;y+=87){
  if(((x*7+y*13)|0)%5===0){oval(x,y,4,2,'#a6c58b');oval(x+11,y+7,3,2,'#608b62')}
 }
 // Sidewalk slabs, drainage, crosswalks and road surface textures.
 rect(0,445,world.w,225,colors.walk);rect(0,486,world.w,138,colors.road);
 rect(0,452,world.w,7,'#e6d8bb');rect(0,473,world.w,4,'#9a9f91');
 rect(0,636,world.w,8,'#eee4ce');rect(0,654,world.w,5,'#a5ad9d');
 for(let x=0;x<world.w;x+=91){line(x,445,x,486,'#b6ad98',1);line(x,643,x,670,'#b6ad98',1)}
 for(let x=20;x<world.w;x+=105)rect(x,551,54,5,'#e1dec7');
 for(let x=34;x<world.w;x+=173){line(x,509,x+17,507,'#5b6d6c',1);line(x+35,609,x+46,611,'#84918b',1)}
 for(let crossing=0;crossing<2;crossing++){const x=crossing?1240:360;
  for(let i=0;i<6;i++){rect(x+i*17,488,11,35,'#e5e2d1');rect(x+i*17,593,11,30,'#e5e2d1')}
 }
 rect(0,90,world.w,46,'#b4bca1');rect(0,405,world.w,44,'#b9c5aa');
 for(let x=0;x<world.w;x+=48){line(x,412,x+23,412,'#d7d8bf',1);line(x,433,x+18,433,'#9aaf98',1)}
 // Park: branching walking paths, garden beds, benches, pond and picnic tables.
 rect(0,680,600,370,'#83a978');round(55,710,370,235,30,'#a3b989');round(75,730,330,195,30,'#8bb27c');
 rect(213,680,50,370,'#d5cba9');rect(0,823,590,45,'#d5cba9');
 for(let x=0;x<590;x+=61){line(x,847,x+35,847,'#b9b29b',1)}
 for(let x=70;x<430;x+=67){oval(x,737,11,5,'#d6b991');oval(x+8,924,10,4,'#c9b18c')}
 oval(90,970,76,28,'#5b9da4');oval(90,963,65,20,'#7db9bb');oval(90,960,18,9,'#d8e8dd');
 drawBench(310,783);drawBench(460,870);drawPlanter(485,752);drawPlanter(535,765);
 for(const [x,y] of trees)drawTree(x,y);
 building(home,'#8d5c59','#cda78a','MAPLE APARTMENTS','#efc9a5');
 building(shop,'#477a78','#e2c59d','MIKA’S MARKET','#f0d7ae');
 building(gym,'#625a77','#bcb6ab','NORTHSIDE DOJO','#e0d4b7');
 // Shop-front and street furniture. All props are visual-only: no new colliders.
 drawStreetLamp(460,470);drawStreetLamp(960,470);drawStreetLamp(1380,470);
 drawPlanter(548,436);drawPlanter(856,436);drawPlanter(975,436);drawPlanter(1298,436);
 drawBike(845,471);drawBench(80,414);drawBench(1310,416);
 rect(909,430,17,40,'#36556a');rect(905,424,25,8,'#f0d7a4');text('POST',918,448,8,'#e8e4d6');
 for(let x=30;x<world.w;x+=190){rect(x,470,8,13,'#f3e1ac');oval(x+4,468,8,3,'#fff3c5')}
 rect(880,700,160,110,'#b5b7a4');rect(892,712,136,87,'#c9ccba');
 oval(958,750,43,22,'#a5c2ba');oval(958,748,29,16,'#74a6aa');
 for(let i=0;i<4;i++)oval(930+i*18,737,4,3,'#d5eee5');
 text('FOUNTAIN',960,792,12,'#647978');
 text('MAPLE STREET',900,598,21,'#e4e5d1','800');
}
// VF-style uniform-width limbs, round joints and faceless head; color is the identity cue.
function vfStroke(ax,ay,bx,by,w,shade){ctx.strokeStyle='#1b1b1f';ctx.lineWidth=w+1.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();ctx.strokeStyle=shade;ctx.lineWidth=w-0.2;ctx.stroke()}
function drawPlayer(x,y,shade=vf.blue,name='YOU',dir='up',step=0,walking=false){
 // Larger VF-style alternating stride, knee lift and opposing arm swing.
 // Standing players return to a neutral planted pose instead of freezing mid-step.
 const phase=walking?Math.sin(step):0,other=walking?Math.cos(step):0;
 const side=dir==='left'||dir==='right',reach=side?18:12;
 const swing=phase*reach,heelA=walking?Math.max(0,other)*6:0,heelB=walking?Math.max(0,-other)*6:0;
 const bob=walking?Math.abs(other)*2.8:0,lean=walking?(dir==='right'?2:dir==='left'?-2:0):0;
 oval(x,y+5,walking?20:16,6,'#1b1b1f4a');
 const neck=y-37+bob,hip=y-19+bob,torso=x+lean;
 // Legs are two-segment chains with readable knees and grounded feet.
 const leftFoot=x-9+swing,rightFoot=x+9-swing;
 vfStroke(torso,hip,x-7+swing*.45,y-9+bob-heelA*.4,6,shade);
 vfStroke(x-7+swing*.45,y-9+bob-heelA*.4,leftFoot,y+4-heelA,6,shade);
 vfStroke(torso,hip,x+7-swing*.45,y-9+bob-heelB*.4,6,shade);
 vfStroke(x+7-swing*.45,y-9+bob-heelB*.4,rightFoot,y+4-heelB,6,shade);
 vfStroke(torso,neck,torso,hip,7.5,shade);
 vfStroke(torso,neck+3,torso-12-phase*12,y-24+bob+heelB*.3,5.5,shade);
 vfStroke(torso,neck+3,torso+12+phase*12,y-24+bob+heelA*.3,5.5,shade);
 oval(torso,neck-10,9.3,9.3,'#1b1b1f');oval(torso,neck-10,8.3,8.3,shade);
 round(x-27,y-73-bob,54,18,8,vf.panel);text(name,x,y-60-bob,10,vf.fg);
}
function drawNpc(){drawPlayer(npc.x,npc.y,vf.accent,'MIKA','down',0)}
function bubble(x,y,title,message){round(x-115,y-91,230,57,8,vf.fg);round(x-113,y-89,226,53,7,vf.panel);text(title,x,y-70,12,vf.accent);text(message,x,y-52,12,vf.fg,'500');ctx.fillStyle=vf.panel;ctx.beginPath();ctx.moveTo(x-7,y-34);ctx.lineTo(x+8,y-34);ctx.lineTo(x,y-24);ctx.fill()}
function drawInterior(){rect(0,0,W,H,'#c8b59a');for(let x=0;x<W;x+=58)for(let y=0;y<H;y+=58){rect(x,y,56,56,(x+y)%3===0?'#d8c4a5':'#d1bda0');rect(x+2,y+2,52,52,'#d8c7ac')}
rect(0,0,W,55,'#4c7772');rect(0,55,W,13,'#8d6f59');rect(80,110,800,95,'#8e6d53');rect(90,120,780,75,'#c0a77d');for(let x=125;x<850;x+=100){round(x,125,65,48,6,'#627d5b');oval(x+32,139,20,9,'#e9d58f');text('★',x+32,162,16,'#f4d991')}
for(let x=150;x<=750;x+=210){
 rect(x+5,268,125,130,'#5a4c40');rect(x,260,125,130,'#8b775e');rect(x+9,269,107,110,'#ddc89c');
 for(let i=0;i<3;i++){
  const sy=279+i*33;rect(x+15,sy,95,8,'#9b805c');
  for(let j=0;j<4;j++){rect(x+18+j*23,sy+9,17,18,(i+j)%2?'#6f9874':'#b67d64');rect(x+21+j*23,sy+11,11,4,'#f3d9a7')}
 }
 rect(x+1,390,123,5,'#51483f');
} 
// Hanging signs, price tags, produce crates and checkout station.
rect(35,216,78,120,'#82664f');for(let i=0;i<3;i++){rect(44,225+i*35,60,25,'#b58e68');for(let j=0;j<3;j++)oval(55+j*18,236+i*35,7,6,i%2?'#d6a15f':'#729b70')}
round(675,76,195,28,4,'#f0d9a7');text('FRESH GOODS  •  DAILY',772,95,12,'#355653');
rect(640,410,208,40,'#8c6d55');rect(650,417,188,27,'#c7b18a');rect(755,401,45,13,'#344d4d');
round(380,420,200,52,7,'#4d756f');text('EXIT TO MAPLE STREET',480,452,13,'#fff');
round(30,95,205,39,8,'#2c4c4d');text('MIKA’S MARKET',133,120,17,'#fff');
drawPlayer(inside.x,inside.y,vf.blue,'YOU',p.dir,inside.step,inside.walking);drawPlayer(735,230,vf.accent,'MIKA');if(nearMerchant()&&!merchantOpen){bubble(735,205,'MIKA','E  SHOP / TALK');}
}
// Northside Dojo is a compact explorable interior, not the combat arena.
function nearGymDoor(){return Math.hypot(p.x-gym.doorX,p.y-gym.doorY)<58}
function nearCoach(){return scene==='dojo'&&Math.hypot(dojoInside.x-665,dojoInside.y-267)<115}
function nearDojoExit(){return scene==='dojo'&&Math.hypot(dojoInside.x-480,dojoInside.y-449)<105}
function talkToRen(){
 if(!nearCoach())return false;
 if(renQuest==='not_started'){
  renQuest='active';renNotice='Ren: Bring me hand wraps from Mika’s Market.';
 }else if(renQuest==='active'&&(inventory.wraps||0)>0){
  inventory.wraps--;coins+=20;inventory.dojoPass=1;renQuest='completed';
  renNotice='Ren: Excellent! +20 coins and a Dojo Pass.';
 }else if(renQuest==='active'){
  renNotice='Ren: Mika has hand wraps. Come back with a pair.';
 }else{renNotice='Ren: You are always welcome at Northside Dojo.'}
 renNoticeTime=300;return true;
}
function drawDojo(){
 rect(0,0,W,H,'#b7aa91');for(let x=0;x<W;x+=64)for(let y=0;y<H;y+=64)rect(x+2,y+2,60,60,'#c9bba0');
 rect(0,0,W,94,'#425e65');rect(0,94,W,12,'#d8bd7c');
 for(let x=95;x<=735;x+=210){round(x,131,145,45,5,'#ece0c7');text(['FOCUS','RESPECT','DISCIPLINE','BALANCE'][(x-95)/210],x+72,158,14,'#455b5b')}
 // The training floor stays traversable; mats are decorative, not obstacles.
 round(94,205,510,177,9,'#496c71');for(let x=106;x<600;x+=81)for(let y=218;y<376;y+=77)round(x,y,76,72,3,(x+y)%2?'#668c87':'#73948e');
 rect(830,180,44,175,'#6b4c42');oval(851,173,31,15,'#b47c59');text('BAG',851,262,15,'#f1d7b1');
// Trophy shelf, framed class schedule, spare gloves and training equipment.
rect(40,175,110,13,'#3a555a');for(let i=0;i<3;i++){rect(54+i*33,158,17,17,'#c49b58');oval(62+i*33,156,10,5,'#ead5a0')}
rect(40,209,70,96,'#eadcc1');rect(46,215,58,83,'#f7eddb');text('CLASS',75,233,11,'#4c6666');for(let i=0;i<4;i++)line(53,244+i*11,100,244+i*11,'#a6a18b',2);
for(let i=0;i<4;i++){oval(760+i*17,383,9,6,i%2?'#d4a36c':'#486a70')}
rect(630,380,96,10,'#354d50');rect(635,389,7,20,'#354d50');rect(711,389,7,20,'#354d50');

 round(381,421,198,50,7,'#4d756f');text('EXIT TO MAPLE STREET',480,451,13,'#fff');
 round(24,110,244,40,7,'#263e46');text('NORTHSIDE DOJO',146,136,19,'#f4e5c9');
 drawPlayer(665,267,'#66788f','COACH REN','down',0);drawPlayer(dojoInside.x,dojoInside.y,vf.blue,'YOU',p.dir,dojoInside.step,dojoInside.walking);
 if(nearCoach())bubble(665,244,'COACH REN','E  TALK / DELIVER');
 round(25,477,910,46,7,vf.fg);
 const status=renQuest==='not_started'?'Talk to Coach Ren to begin the neighborhood quest':renQuest==='active'?'QUEST: Deliver Hand Wraps to Coach Ren': 'QUEST COMPLETE: Northside Dojo Pass earned';
 text(renNoticeTime>0?renNotice:status,480,504,14,'#f5e7c6');
}
function camera(){return {x:Math.max(0,Math.min(world.w-W,p.x-W/2)),y:Math.max(0,Math.min(world.h-H,p.y-H*.72))}}
function collide(x,y){if(x<18||x>world.w-18||y<65||y>world.h-20)return true;for(const b of [home,shop,gym])if(x>b.x-10&&x<b.x+b.w+10&&y>b.y+12&&y<b.y+b.h+5)return true;return false}
function nearDoor(){return Math.hypot(p.x-shop.doorX,p.y-shop.doorY)<58}
function nearNpc(){return Math.hypot(p.x-npc.x,p.y-npc.y)<95}
function nearMerchant(){return scene==='market'&&Math.hypot(inside.x-735,inside.y-230)<125}
function buyItem(index){
 if(!merchantOpen||!Number.isInteger(index)||index<0||index>=goods.length)return false;
 const item=goods[index];
 if(coins<item.price){notice='Not enough coins';noticeTime=180;return false}
 if(item.id==='map'&&inventory.map){notice='You already own a street map';noticeTime=180;return false}
 coins-=item.price;inventory[item.id]=(inventory[item.id]||0)+1;
 notice=item.name+' added to bag';noticeTime=180;return true;
}
function drawMerchantPanel(){
 rect(0,0,W,H,'#0b1d27ba');round(218,68,524,414,13,vf.fg);round(230,80,500,390,10,vf.panel);
 round(250,96,460,51,7,vf.accent);text('MIKA’S MARKET',480,118,21,vf.panel);text('COINS  '+coins,480,138,13,vf.panel);
 text(renQuest==='completed'?'Mika: Coach Ren said you helped his class!':'Mika: Coach Ren at Northside Dojo',480,179,16,'#24454b');
 text(renQuest==='completed'?'Come back any time.':'asked me to hold some hand wraps.',480,200,16,'#24454b','500');
 goods.forEach((item,i)=>{const y=221+i*54;round(263,y,433,44,6,'#d2d7c1');round(271,y+5,30,33,5,'#4c7570');text(String(i+1),286,y+28,17,'#fff');text(item.name,321,y+26,16,'#233c44','700','left');text(item.price+' c',678,y+26,15,'#4b4b40','700','right')});
 round(263,392,433,37,5,'#c4d8d1');text(noticeTime>0?notice:'Tap an item or press 1–3 to buy',480,416,14,'#24454b');
 text('E / INTERACT  ·  CLOSE',480,453,12,'#486268');
}

function setLocation(name,place){document.querySelector('#where').textContent=name;document.querySelector('#location').textContent=place}
function action(){
 if(merchantOpen){merchantOpen=false;noticeTime=0;return}
 if(scene==='street'){
  if(nearDoor()){scene='market';inside.x=480;inside.y=410;inside.gaitAnchor.half=undefined;dialog=0;setLocation('MIKA’S MARKET','Inside Mika’s Market')}
  else if(nearGymDoor()){scene='dojo';dojoInside.x=480;dojoInside.y=430;dojoInside.gaitAnchor.half=undefined;renNoticeTime=0;setLocation('NORTHSIDE DOJO','Inside Northside Dojo')}
  else if(nearNpc()){dialog=180}
 }else if(scene==='market'){
  if(nearMerchant()){merchantOpen=true;noticeTime=0}
  else if(Math.hypot(inside.x-480,inside.y-445)<105){scene='street';p.x=shop.doorX;p.y=shop.doorY+35;p.gaitAnchor.half=undefined;setLocation('MAPLE & 8TH','Maple Street')}
 }else if(scene==='dojo'){
  if(nearCoach())talkToRen();
  else if(nearDojoExit()){scene='street';p.x=gym.doorX;p.y=gym.doorY+35;p.gaitAnchor.half=undefined;setLocation('MAPLE & 8TH','Maple Street')}
 }
}
// Art-only conversion: world pixels -> projected metres; preserve collision and speed.
// Combat authority: 1.12 m/full gait cycle, 0.56 m stance step, 0.14 m swing lift.
const advanceGait=(actor,x0,y0,pxPerM_X,pxPerM_Y)=>{
 const mx=(actor.x-x0)/pxPerM_X,mz=-(actor.y-y0)/pxPerM_Y;
 const moved=Math.hypot(mx,mz);
 actor.walking=moved>.001;
 if(actor.walking){
  actor.step+=moved*(Math.PI*2/1.12);
  // Art-only heading follows the actual projected travel vector, including diagonals.
  // Keep last heading while idle; no acceleration, collision, or combat changes.
  actor.headingX=mx/moved;actor.headingZ=mz/moved;
 }
};
function update(dt){
 frame+=dt;dialog=Math.max(0,dialog-dt*60);noticeTime=Math.max(0,noticeTime-dt*60);renNoticeTime=Math.max(0,renNoticeTime-dt*60);
 if(merchantOpen)return;
 let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);
 if(!(dx||dy)){p.walking=false;inside.walking=false;dojoInside.walking=false;return}
 const norm=Math.hypot(dx,dy);dx/=norm;dy/=norm;
 p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
 // Visual gait phase follows *actual* travelled distance, never held input against a wall.
 // Street projection is 28 px/m (x) and 18 px/m (z); interiors are 75/40.
 // This matches visual gait distance, NOT the combat engine traversal speed.
 const speed=165*dt;
 if(scene==='street'){
  const x0=p.x,y0=p.y,nx=x0+dx*speed,ny=y0+dy*speed;
  if(!collide(nx,p.y))p.x=nx;if(!collide(p.x,ny))p.y=ny;advanceGait(p,x0,y0,28,18);
 }else if(scene==='market'){
  const x0=inside.x,y0=inside.y,nx=x0+dx*speed,ny=y0+dy*speed;
  const blocked=(x,y)=>x<35||x>925||y<218||y>500||([150,360,570].some(sx=>x>sx-14&&x<sx+139&&y>244&&y<397));
  if(!blocked(nx,inside.y))inside.x=nx;if(!blocked(inside.x,ny))inside.y=ny;advanceGait(inside,x0,y0,75,40);
 }else if(scene==='dojo'){
  const x0=dojoInside.x,y0=dojoInside.y,nx=x0+dx*speed,ny=y0+dy*speed;
  if(nx>=35&&nx<=925)dojoInside.x=nx;
  if(ny>=185&&ny<=500)dojoInside.y=ny;
  advanceGait(dojoInside,x0,y0,75,40);
 }
}
function render(){
 ctx.clearRect(0,0,W,H);
 if(scene==='market'){if(window.__dojoInteriorArt)window.__dojoInteriorArt({ctx,W,H,scene,inside,dojoInside,p,frame,weather,renQuest,renNotice,renNoticeTime,nearMerchant:nearMerchant()});else drawInterior();if(merchantOpen)drawMerchantPanel();return}
 if(scene==='dojo'){if(window.__dojoInteriorArt)window.__dojoInteriorArt({ctx,W,H,scene,inside,dojoInside,p,frame,weather,renQuest,renNotice,renNoticeTime,nearCoach:nearCoach()});else drawDojo();return}
 // Job 1 additive art adapter: perspective VF look, original gameplay coordinates remain authoritative.
 if(window.__dojoPerspectiveArt){window.__dojoPerspectiveArt({ctx,W,H,p,npc,frame,weather,coins,inventory,renQuest,nearDoor:nearDoor(),nearGymDoor:nearGymDoor(),nearNpc:nearNpc(),dialog});return}
 const c=camera();ctx.save();ctx.translate(-c.x,-c.y);
 drawStreet();drawNpc();drawPlayer(p.x,p.y,vf.blue,'YOU',p.dir,p.step,p.walking);
 if(nearNpc()||dialog>0)bubble(npc.x,npc.y-5,'MIKA',dialog>0?'Come see the new arrivals!':'Hey, neighbor!');
 if(nearDoor()){round(shop.doorX-95,shop.doorY+27,190,27,7,vf.fg);text('E  ENTER MIKA’S MARKET',shop.doorX,shop.doorY+46,12,'#f7edcc')}
 if(nearGymDoor()){round(gym.doorX-95,gym.doorY+27,190,27,7,vf.fg);text('E  ENTER NORTHSIDE DOJO',gym.doorX,gym.doorY+46,12,'#f7edcc')}
 ctx.restore();
 if(weather==='rain'){for(let i=0;i<95;i++){let x=(i*131+frame*110)%W,y=(i*67+frame*220)%H;line(x,y,x-8,y+17,'#b3d8e0a3',1.3)}}
}
function loop(t){const dt=Math.min((t-last)/1000||0,.05);last=t;update(dt);render();requestAnimationFrame(loop)}
function mapKey(k){return {ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'}[k]}
addEventListener('keydown',e=>{let d=mapKey(e.code);if(d){e.preventDefault();keys.add(d)}else if(e.code==='KeyE'&&!e.repeat){e.preventDefault();action()}else if(merchantOpen&&['Digit1','Digit2','Digit3','Numpad1','Numpad2','Numpad3'].includes(e.code)&&!e.repeat){e.preventDefault();buyItem(Number(e.code.slice(-1))-1)}else if(e.code==='KeyR'&&!e.repeat){weather=weather==='clear'?'rain':'clear'}});
addEventListener('keyup',e=>{let d=mapKey(e.code);if(d){e.preventDefault();keys.delete(d)}});
addEventListener('blur',()=>keys.clear());
for(const b of document.querySelectorAll('[data-dir]')){const d=b.dataset.dir;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(d);b.classList.add('pressed')});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys.delete(d);b.classList.remove('pressed')})}
document.querySelector('#interact').addEventListener('click',action);
// Canvas hit targets make buying possible on mobile without a keyboard.
canvas.addEventListener('pointerdown',e=>{if(!merchantOpen)return;const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;if(x>=263&&x<=696){for(let i=0;i<goods.length;i++){let top=221+i*54;if(y>=top&&y<=top+44){buyItem(i);break}}}});
window.__dojoWorld={getState:()=>({scene,player:{x:Math.round(p.x),y:Math.round(p.y)},interiorPlayer:{x:Math.round(inside.x),y:Math.round(inside.y)},dojoPlayer:{x:Math.round(dojoInside.x),y:Math.round(dojoInside.y)},nearDoor:nearDoor(),nearGymDoor:nearGymDoor(),nearMerchant:nearMerchant(),nearCoach:nearCoach(),merchantOpen,coins,inventory:{...inventory},notice,weather,renQuest,renNotice}),toggleRain:()=>{weather=weather==='clear'?'rain':'clear'}};
requestAnimationFrame(loop);
})();
