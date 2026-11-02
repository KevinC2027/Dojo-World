// Visual-only world-space stance pin regression, including an instant direction change.
const fs=require('fs'),path=require('path'),vm=require('vm');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'world-vf-figure.js'),'utf8'),{window,Math});
const TAU=Math.PI*2,results=[];
function sample(x,z,phase,fx,fz,anchor,walking=true){
 const soles=[];
 const g={beginPath(){},ellipse(x,y,rx,ry){soles.push({x,y,rx,ry})},fill(){},arc(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},fillText(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set lineCap(v){},set lineJoin(v){},set font(v){},set textAlign(v){}};
 const P=(xx,yy,zz)=>({x:xx*100+zz*20,y:400-yy*100+zz*10,s:100,d:zz});
 window.__dojoVF.figure(g,P,x,z,'#d6452b','',phase,walking,fx,fz,anchor);
 return soles;
}
function check(name,pass,details){results.push({name,pass:!!pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details))}
const anchor={};
const a=sample(0,0,Math.PI*.25,1,0,anchor);
const b=sample(.12,.08,Math.PI*.45,0,1,anchor);
check('same-stance turn keeps left sole planted in projected world',Math.hypot(a[1].x-b[1].x,a[1].y-b[1].y)<1e-7,{before:a[1],after:b[1]});
check('same-stance retains half-cycle anchor',anchor.half===0,{half:anchor.half});
const c=sample(.25,.20,Math.PI*1.1,0,1,anchor);
check('new half-cycle changes stance foot',anchor.half===1,{half:anchor.half});
sample(.25,.20,Math.PI*1.1,0,1,anchor,false);
check('idle clears planted-foot anchor',anchor.half===undefined,{half:anchor.half});
const d=sample(.25,.20,Math.PI*1.2,-1,0,anchor);
check('resumed walk creates fresh anchor',anchor.half===1&&Number.isFinite(anchor.x)&&Number.isFinite(anchor.z),anchor);
check('sole remains on floor during stance',Math.abs(d[2].ry)<20,{sole:d[2]});
console.log(JSON.stringify({passed:results.length,tests:results}));
