// Diag: victim right-knee world trajectory during shipped carry, live vs candidate.
const fs=require('fs'),vm=require('vm');
function load(file){const html=fs.readFileSync(file,'utf8');const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const ctx2d=new Proxy({},{get:()=>()=>{},set:()=>true});const elem=()=>({getContext:()=>ctx2d,getBoundingClientRect:()=>({width:800,height:600}),addEventListener:()=>{},style:{}});
const sandbox={document:{getElementById:elem,querySelectorAll:()=>[],documentElement:{}},getComputedStyle:()=>({getPropertyValue:()=>'#000'}),ResizeObserver:class{observe(){}},devicePixelRatio:1,addEventListener:()=>{},performance:{now:()=>0},requestAnimationFrame:()=>{},console};
sandbox.window=sandbox;sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(script,sandbox);return sandbox;}
function run(file,atkStyle,defStyle,label){
 const sb=load(file);
 const outJson=vm.runInContext(`(()=>{const a=mk(0,${atkStyle}),d=mk(0,${defStyle});S=[d,a];phase='fight';hs=0;tm=45*60;sparks=[];
 a.x=0;a.z=0;a.fx=1;a.fz=0;a.ax=1;a.az=0;d.x=0.75;d.z=0;d.fx=-1;d.fz=0;d.ax=-1;d.az=0;a.st='idle';d.st='idle';a.aiT=1e9;d.aiT=1e9;
 a.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};d.i={l:0,r:0,u:0,d:0,g:0,bp:0,bk:0};
 const W=(f,p,j)=>{const q=p[j];return [f.x+f.fx*q[0]-f.fz*q[2],f.y+q[1],f.z+f.fz*q[0]+f.fx*q[2]];};
 const rows=[];go(a,'T');
 for(let tick=0;tick<20;tick++){update(a,d);update(d,a);const pd=pose(d);
   const hip=W(d,pd,'hr'),knee=W(d,pd,'kr'),foot=W(d,pd,'fr');
   const hd=Math.hypot(hip[0]-foot[0],hip[1]-foot[1],hip[2]-foot[2]);
   rows.push({tick,vicT:d.t,vicSt:d.st,rootY:+d.y.toFixed(3),hip:hip.map(x=>+x.toFixed(3)),knee:knee.map(x=>+x.toFixed(3)),foot:foot.map(x=>+x.toFixed(3)),hipFoot:+hd.toFixed(3)});}
 return JSON.stringify(rows);})()`,sb);
 const out=JSON.parse(outJson);
 console.log('== '+label);
 let prev=null;
 for(const r of out){let step=null;if(prev){step=Math.hypot(r.knee[0]-prev.knee[0],r.knee[1]-prev.knee[1],r.knee[2]-prev.knee[2]);}
   console.log(`t${r.tick} vicT${r.vicT} ${r.vicSt} rootY${r.rootY} hip${JSON.stringify(r.hip)} knee${JSON.stringify(r.knee)} foot${JSON.stringify(r.foot)} hipFoot${r.hipFoot} krStep${step===null?'-':step.toFixed(3)}`);prev=r;}
}
run(process.argv[2],1,0,'Blue throws Red');
run(process.argv[2],0,1,'Red throws Blue');
