// Diagnostic only: dump per-air-tick cumulative head-pelvis angle for ippon (Blue).
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});
const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(script,sandbox);
const out=vm.runInContext(`(()=>{function W(f,L){return [f.x+f.fx*L[0]-f.fz*L[2],f.y+L[1],f.z+f.fz*L[0]+f.fx*L[2]];}
const a=mk(0,1),d=mk(0,0);S=[a,d];phase='fight';hs=0;tm=45*60;sparks=[];msgT=0;a.x=0;a.z=0;d.x=0.70;d.z=0;a.fx=1;a.fz=0;d.fx=-1;d.fz=0;a.ax=1;a.az=0;a.st='idle';d.st='idle';a.hp=100;d.hp=100;go(a,'T');const cf=pose(d);a.hit=1;a.throwMove='ippon';d.st='carry';d.t=0;d.throwStyle='ippon';d.carryFrom=cf;d.ic='mid';d.vy=0;d.vx=0;d.vz=0;d.rm=0;d.gy=-.08;d.kp=22;d.x=a.x+a.ax*0.8;d.z=a.z+a.az*0.8;d.y=0;let rel=-1,airs=[],prevSt='carry',sawIdle=false,sawGetup=false;for(let i=0;i<400;i++){update(a,d);update(d,a);const dp=pose(d);if(rel<0&&d.st==='air'&&d.vy>1)rel=i;if(rel>=0&&d.st==='air'){const pw=W(d,dp.pel),hw=W(d,dp.head);airs.push({tick:i,dt:d.t,ang:+Math.atan2(hw[1]-pw[1],hw[0]-pw[0]).toFixed(3),fy:+d.y.toFixed(3)});}if(d.st==='getup')sawGetup=true;if(sawGetup&&d.st==='idle'){sawIdle=true;break;}prevSt=d.st;}let norm=x=>{while(x>Math.PI)x-=2*Math.PI;while(x<-Math.PI)x+=2*Math.PI;return x};let cum=[0];for(let k=1;k<airs.length;k++)cum.push(cum[k-1]+norm(airs[k].ang-airs[k-1].ang));return airs.map((r,k)=>({...r,cum:+cum[k].toFixed(3),step:k?+(cum[k]-cum[k-1]).toFixed(3):0}));})()`,sandbox);
console.log(JSON.stringify(out,null,0));
