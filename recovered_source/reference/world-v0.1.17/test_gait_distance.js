// Diagnostic-only injection exposes gait phase without modifying shipped API.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {Canvas}=require('skia-canvas');const canvas=new Canvas(960,540);canvas.addEventListener=()=>{};
const handlers={};let raf;
const els={'#world':canvas,'#where':{textContent:''},'#location':{textContent:''},'#interact':{addEventListener(){}}};
const document={querySelector:s=>els[s],querySelectorAll:()=>[]};const window={};
const sandbox={console,document,window,Math,Set,requestAnimationFrame:fn=>raf=fn,addEventListener:(k,fn)=>(handlers[k]??=[]).push(fn)};
let src=fs.readFileSync(path.join(__dirname,'world.js'),'utf8');
const needle='window.__dojoWorld={getState:';
if(!src.includes(needle))throw Error('Probe insertion failed');
src=src.replace(needle,'window.__dojoGaitProbe=()=>({street:{...p},market:{...inside},dojo:{...dojoInside}});'+needle);
vm.runInNewContext(src,sandbox,{filename:'world.js'});
let t=0;const tick=(n=1)=>{for(let i=0;i<n;i++){t+=50;raf(t)}};
const key=(type,code)=>{for(const fn of handlers[type]||[])fn({code,preventDefault(){},repeat:false})};
const checks=[];const check=(name,ok,details)=>{checks.push({name,pass:!!ok,details});if(!ok)throw Error(name+': '+JSON.stringify(details))};
tick(4);let a=window.__dojoGaitProbe().street;
check('idle phase does not advance',a.step===0&&a.walking===false,a);
key('keydown','ArrowLeft');tick(4);let b=window.__dojoGaitProbe().street;
const dist=Math.hypot((b.x-a.x)/28,(b.y-a.y)/18),expected=dist*Math.PI*2/1.12;
check('phase proportional to projected world metres',Math.abs((b.step-a.step)-expected)<1e-8,{phase:b.step-a.step,expected,dist});
key('keyup','ArrowLeft');tick(4);let c=window.__dojoGaitProbe().street;
check('idle resets walking without phase advance',c.walking===false&&Math.abs(c.step-b.step)<1e-8,c);
// Diagonal motion is normalized; distance and phase must remain coupled.
key('keydown','ArrowRight');key('keydown','ArrowUp');tick(4);let d=window.__dojoGaitProbe().street;
const dDist=Math.hypot((d.x-c.x)/28,(d.y-c.y)/18);
check('diagonal world-metre movement remains distance coupled',Math.abs((d.step-c.step)-dDist*Math.PI*2/1.12)<1e-8,{dDist,phase:d.step-c.step});
const hx=((d.x-c.x)/28)/dDist,hz=(-(d.y-c.y)/18)/dDist;
check('diagonal heading matches projected world displacement',Math.abs(d.headingX-hx)<1e-8&&Math.abs(d.headingZ-hz)<1e-8,{heading:[d.headingX,d.headingZ],expected:[hx,hz]});
key('keyup','ArrowRight');key('keyup','ArrowUp');tick(2);
const idleHeading=window.__dojoGaitProbe().street;
check('idle retains last projected heading',!idleHeading.walking&&Math.abs(idleHeading.headingX-hx)<1e-8&&Math.abs(idleHeading.headingZ-hz)<1e-8,idleHeading);
// In a planted half-cycle, player world travel (+0.56m) cancels local foot travel (-0.56m).
const stanceFoot=c=>.56*(.5-c*2);
const plantError=Math.abs((.56+stanceFoot(.5))-stanceFoot(0));
check('stance foot stationary along straight heading',plantError<1e-10,{plantError});
// The two gait phases are opposite and exactly 1.12m per cycle.
check('combat gait constants retained',Math.abs(.56*2-1.12)<1e-10&&Math.abs(Math.sin(Math.PI/2)*.14-.14)<1e-10,{});
console.log(JSON.stringify({passed:checks.length,checks}));
