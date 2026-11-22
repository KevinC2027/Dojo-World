"""Rowing boat test (Step 9 gate).  Usage:
  python3 -I dw2/tools/boat.py <build.html> [--seed 7] [--ticks 3000] [--json out.json]
v2.12+: boarding is a paid hire (HIT_BOAT.price > 0): INTERACT posts a 'hire' debit and Red boards only when the ledger accepts it.
  hire      every boarding costs exactly the hire price (balance, pouch and ledger agree, audit clean, nothing enters the gift bag);
            draining the pouch with repeat hires ends in an 'insufficient' refusal that charges nothing and leaves Red on the pier
Seeds Math.random, stops the render loop and runs the game's own tick() with no drawing. The scripted player uses the same paths
as the buttons: walk Red to the boat steps, _updateNear/_doInteract (INTERACT) to board and moor, H0.ax/H0.az (the joystick).
  board     10x board at the pier steps and moor at the berth; Red must end up aboard / back on the pier deck, never swimming
  far       INTERACT far from the pier must refuse to moor
  dirs      from mid-lake, stick in 8 directions (SKY camera, yaw 0): the boat must travel within 30 deg of the camera-relative
            world direction walking uses
  random    random stick changes for --ticks ticks with 3 townsfolk put in the water as swimmers: every tick the hull must float
            (inside the lake, out of the pier, out of the shallows), never overlap a swimmer, Red never swimming / wading / falling
  attack    PUNCH / KICK / THROW / JUMP aboard do nothing; leaving town moors the boat
Reports counts, worst values, and page/module errors."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); TICKS = int(arg('--ticks', 3000)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
RUN = r'''async ([TICKS])=>{
  const BO=HIT_BOAT,B=BO.B,a=S[0],out={};
  const T=(n,chk)=>{for(let i=0;i<n;i++){tick();if(chk)chk()}};
  const paid=(BO.price||0)>0, sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const st=()=>{try{HIT_DC.int.refresh();const e=HIT_DC.eco,s=e.summary(),p=HIT_DC.pouch&&HIT_DC.pouch(),inRed=(HIT_DC.coins||[]).filter(k=>k.to==='red').reduce((t,k)=>t+k.val,0),h=e.history(1e6);
    return{avail:s.available,n:s.count,hires:h.filter(x=>x.t==='d'&&x.src==='hire').length,bag:window.HIT_SHOP?HIT_SHOP.bag.length:0,audit:e.audit().ok,pouchOk:!p||p[0]*100+p[1]*10+p[2]===Math.max(0,s.available-inRed)}}catch(e){return{err:String(e)}}};
  const interact=async()=>{window.__dt+=61000;_doInteract();for(let i=0;i<80&&(BO.paying||(paid&&!B.aboard&&BO.last===null));i++)await sleep(25);await sleep(30)};
  if(paid){for(let i=0;i<200&&!(window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0);i++)await sleep(50)}
  const s0=st();
  const stick=(x,z)=>{H0.ax=x;H0.az=z};
  const toStep=()=>{if(B.aboard)BO.moor(true);stick(0,0);a.x=BO.step.x;a.z=BO.step.z;a.vx=a.vz=0;a._tgx=a.x;a._tgz=a.z;T(10);a.x=BO.step.x;a.z=BO.step.z;};
  // ---- board / moor ----
  let ok=0,bad=[];
  for(let k=0;k<10;k++){toStep();_updateNear();const lab=_near&&_near.label;BO.last=null;await interact();T(30);
    const on=B.aboard&&!a._wd&&!a._swim;stick(Math.random()*2-1,Math.random()*2-1);T(20);stick(0,0);T(60);
    // row back to the berth if it drifted, then moor with INTERACT
    B.x=BO.berth.x+(Math.random()-.5);B.z=BO.berth.z+(Math.random()-.5)*.3;if(BO.why(B.x,B.z,B.h)){B.x=BO.berth.x;B.z=BO.berth.z;B.h=BO.berth.h}
    _updateNear();const lab2=_near&&_near.label;_doInteract();T(20);
    const back=!B.aboard&&BO.why(BO.berth.x,BO.berth.z,BO.berth.h)===null&&Math.hypot(a.x-BO.step.x,a.z-BO.step.z)<1.5&&!a._wd&&!a._swim&&Math.abs(a.y||0)<.1;
    if(on&&back&&/Take a boat/.test(lab)&&/Moor/.test(lab2))ok++;else bad.push({k,lab,lab2,on,back,ax:a.x,az:a.z,ay:a.y,wd:a._wd})}
  out.board={tries:10,ok,bad};
  const s1=st();out.hire={price:BO.price||0,before:s0,after10:s1,charged:s0.avail-s1.avail,expect:10*(BO.price||0),ok:!paid||(s0.avail-s1.avail===10*BO.price&&s1.hires-s0.hires===10&&s1.bag===s0.bag&&s1.audit&&s1.pouchOk)};
  // ---- far from the pier ----
  toStep();_updateNear();BO.last=null;await interact();B.x=44;B.z=51;B.h=0;B.v=0;T(5);_updateNear();const farLab=_near&&_near.label;_doInteract();T(5);
  out.far={label:farLab,stillAboard:B.aboard};
  // ---- 8 directions (SKY camera) ----
  const dirs=[];
  for(let k=0;k<8;k++){const an=k*Math.PI/4,ax=Math.cos(an),az=Math.sin(an);B.x=42;B.z=51;B.h=Math.random()*6.28-3.14;B.v=0;B.w=0;stick(0,0);T(2);const g0=BO.stats.groundings,w0=BO.stats.swimStops,p0=BO.stats.pierStops;
    const c=Math.cos(cam.yaw||0),s=Math.sin(cam.yaw||0),wx=ax*c+az*s,wz=ax*s-az*c;
    stick(ax,az);T(180);const x0=B.x,z0=B.z;T(60);stick(0,0);const dx=B.x-x0,dz=B.z-z0,m=Math.hypot(dx,dz);
    const err=m>0?Math.acos(Math.max(-1,Math.min(1,(dx*wx+dz*wz)/m/Math.hypot(wx,wz))))*180/Math.PI:180;
    dirs.push({k,yaw:+(cam.yaw||0).toFixed(3),moved:+m.toFixed(2),errDeg:+err.toFixed(1),grounded:BO.stats.groundings>g0,swimmerStop:BO.stats.swimStops>w0,pierStop:BO.stats.pierStops>p0,swimmersNear:BO.swimmers().filter(n=>Math.hypot(n.x-B.x,n.z-B.z)<4).length})}
  out.dirs=dirs;
  // ---- random steering with swimmers ----
  B.x=40;B.z=51;B.h=0;B.v=0;B.w=0;stick(0,0);T(5);
  const sw=crowd.filter(n=>n&&n.hp>0).slice(0,3);const spots=[[34,47],[48,55],[54,49]];
  sw.forEach((n,i)=>{n.x=spots[i][0];n.z=spots[i][1];n.vx=n.vz=0;});
  const R={ticks:0,hullBad:0,overlap:0,redWet:0,redAir:0,minSwimGap:99,minDepth:99,pierHits:0,stuckMax:0,maxV:0,swimmerTicks:0,dist:0};
  let lx=B.x,lz=B.z,still=0,next=0;
  for(let t=0;t<TICKS;t++){
    if(t>=next){const an=Math.random()*6.28,m=Math.random()<.15?0:.5+Math.random()*.5;stick(Math.cos(an)*m,Math.sin(an)*m);next=t+40+Math.floor(Math.random()*160)}
    if(t%300===0)sw.forEach((n,i)=>{if((n._wd||0)<.3){n.x=spots[i][0]+(Math.random()-.5)*4;n.z=spots[i][1]+(Math.random()-.5)*2;}});
    tick();R.ticks++;
    const w=BO.why(B.x,B.z,B.h);if(w&&w!=='swimmer')R.hullBad++;
    for(const n of BO.swimmers()){R.swimmerTicks++;const d=BO.hullDist(n.x,n.z,B.x,B.z,B.h);if(d<R.minSwimGap)R.minSwimGap=d;if(d<=0)R.overlap++}
    if(a._wd||a._swim||(a._dive||0)>0)R.redWet++; if(a.st==='air'||Math.abs(a.y||0)>.05)R.redAir++;
    if(!B.aboard){R.fellOut=(R.fellOut||0)+1;break}
    const st=Math.hypot(B.x-lx,B.z-lz);R.dist+=st;if(st<1e-4&&(H0.ax||H0.az)){R.blocked=R.blocked||{};const c=Math.cos(B.h),s2=Math.sin(B.h),k=BO.why(B.x+c*.05,B.z+s2*.05,B.h)||'free';R.blocked[k]=(R.blocked[k]||0)+1;R.blockedAt=R.blockedAt||[+B.x.toFixed(1),+B.z.toFixed(1),+B.h.toFixed(2)]}lx=B.x;lz=B.z;R.maxV=Math.max(R.maxV,Math.abs(B.v));
    const s0=Math.hypot(a.x-BO.seat().x,a.z-BO.seat().z);if(s0>.01)R.seatOff=(R.seatOff||0)+1;
  }
  stick(0,0);R.minSwimGap=+R.minSwimGap.toFixed(3);R.dist=+R.dist.toFixed(1);R.maxVms=+(R.maxV*60).toFixed(2);R.stats=Object.assign({},BO.stats);R.swimmers=sw.length;
  out.random=R;
  // ---- attacks / jump aboard, leaving town ----
  const st0=[];for(const k of ['p','k','ip']){press(k,1);T(2);press(k,0);T(30);st0.push(a.st)}
  jumpFlag=1;T(30);st0.push(a.st,+(a.y||0).toFixed(2));
  out.attack={states:st0,aboard:B.aboard};
  let townOut=null;try{if(window.HIT_SKY){const sv=HIT_SKY.on;HIT_SKY.on=true;T(3);townOut={aboard:B.aboard,api:BO.st};HIT_SKY.on=sv;T(3)}}catch(e){townOut=String(e)}
  out.leaveTown=townOut;
  // ---- drain the pouch with repeat hires: must end in 'insufficient', nothing charged, Red stays on the pier ----
  if(paid){let n=0,last=null,a0=null;BO.moor(true);
    for(let i=0;i<60;i++){toStep();_updateNear();a0=st();BO.last=null;await interact();last=BO.last;if(!last||!last.ok)break;n++;BO.moor(true)}
    const a1=st();out.drain={hires:n,lastCode:last&&last.code,onPier:!B.aboard,unchanged:a1.avail===a0.avail&&a1.n===a0.n,availLeft:a1.avail,audit:a1.audit,pouchOk:a1.pouchOk,
      ok:!!last&&last.code==='insufficient'&&!B.aboard&&a1.avail===a0.avail&&a1.n===a0.n&&a1.avail<BO.price&&a1.audit}}
  out.boatError=BO.error;
  return out}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await pg.wait_for_timeout(2500)
        try: await pg.wait_for_function('!window.HIT_DC||(HIT_DC.eco&&HIT_DC.eco.summary().count>0)', timeout=20000)
        except Exception: pass
        await pg.evaluate("requestAnimationFrame=()=>0")
        out = await pg.evaluate(RUN, [TICKS])
        out['moduleErrors'] = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        out['pageErrors'] = errs[:10]; out['file'] = os.path.basename(FILE); out['seed'] = SEED
        print(json.dumps(out, indent=1))
        if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
        await b.close()
asyncio.run(main())
