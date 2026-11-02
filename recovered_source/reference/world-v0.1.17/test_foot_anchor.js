// Render-level check: planted foot shadow must remain fixed in world coordinates.
// No gameplay mutation; evaluates the real VF figure renderer with a linear projection.
const fs=require('fs'),path=require('path'),vm=require('vm');
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'world-vf-figure.js'),'utf8'),{window,Math});
const TAU=Math.PI*2;
function sample(x,z,phase,fx,fz){
 const ellipses=[],projected=[];
 const g={beginPath(){},ellipse(x,y,rx,ry){ellipses.push({x,y,rx,ry})},fill(){},arc(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},fillText(){},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set lineCap(v){},set lineJoin(v){},set font(v){},set textAlign(v){}};
 const P=(xx,yy,zz)=>{projected.push({x:xx,y:yy,z:zz});return{x:xx*100+zz*20,y:400-yy*100+zz*10,s:100,d:zz}};
 window.__dojoVF.figure(g,P,x,z,'#d6452b','',phase,true,fx,fz);
 if(ellipses.length!==3)throw Error('Unexpected shadow count: '+ellipses.length);
 return {left:ellipses[1],right:ellipses[2],projected};
}
const tests=[];function check(name,ok,details){tests.push({name,pass:!!ok,details});if(!ok)throw Error(name+': '+JSON.stringify(details))}
const a=sample(0,0,0,1,0),b=sample(.56,0,Math.PI,1,0);
check('straight stance foot is world-anchored',Math.abs(a.left.x-b.left.x)<1e-8,{before:a.left.x,after:b.left.x});
const v=Math.SQRT1_2,da=sample(0,0,0,v,v),db=sample(.56*v,.56*v,Math.PI,v,v);
check('diagonal stance foot is world-anchored',Math.abs(da.left.x-db.left.x)<1e-8,{before:da.left.x,after:db.left.x});
const swing=sample(0,0,1.5*Math.PI,1,0);
check('swing sole reaches 0.14m world lift',swing.projected.some(q=>Math.abs(q.y-.14)<1e-9),{maxSwingY:Math.max(...swing.projected.filter(q=>q.y<.5).map(q=>q.y))});
console.log(JSON.stringify({passed:tests.length,tests}));
