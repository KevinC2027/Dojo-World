// READ-ONLY trace: victim elbow world positions around air->down and down->getup, shipped throws, live build.
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(script,sandbox);
function run(label,atk,def){
 const res=vm.runInContext(`(()=>{const a=mk(0,${atk}),d=mk(0,${def});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
 a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
 a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
 const JOINTS=['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr'];
 const world=(f,p)=>{const o={};for(const j of JOINTS){const q=p[j];if(!q)continue;o[j]=[f.x+f.fx*q[0]-f.fz*q[2],f.y+q[1],f.z+f.fz*q[0]+f.fx*q[2]];}return o;};
 const frames=[];go(a,'T');
 for(let tick=0;tick<260;tick++){update(a,d);update(d,a);const pa=pose(a),pd=pose(d);frames.push({tick,vicSt:d.st,vicT:d.t,dy:d.y,wa:world(a,pa),wd:world(d,pd)});if(tick>100&&a.st==='idle'&&d.st==='idle')break;}
 return {frames};})()`,sandbox);
 console.log('### '+label);
 let prev=null;
 for(const f of res.frames){
   const er=f.wd.er; let step=prev?Math.hypot(er[0]-prev[0],er[1]-prev[1],er[2]-prev[2]):0;
   if((f.vicSt==='air'&&f.vicT>=15)||(f.vicSt==='down'&&f.vicT<=6)||(f.vicSt==='getup'&&f.vicT<=4)||step>0.2){
     console.log(`tick ${f.tick} ${f.vicSt} vicT ${f.vicT} dy ${f.dy.toFixed(3)} er ${er.map(v=>v.toFixed(3))} step ${step.toFixed(3)} el ${f.wd.el.map(v=>v.toFixed(3))}`);
   }
   prev=er;
 }
}
run('Blue throws Red',"'lunge'","'back'");
run('Red throws Blue',"'back'","'lunge'");
