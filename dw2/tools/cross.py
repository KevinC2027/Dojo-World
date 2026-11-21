"""Street-crossing test (Step 4 gate).  Usage:
  python3 -I dw2/tools/cross.py <build.html> [--ticks 36000] [--red x,z] [--seed 7] [--json out.json]
Seeds Math.random, parks Red at a fixed spot, then runs the game's own tick() as fast as possible (no drawing) and watches every
town pedestrian and every driving kart each tick:
  crossings  = a pedestrian stepping onto a zebra (NAVN onRoad 0->1) and reaching the far kerb (onRoad back to 0)
  overlaps   = a pedestrian (or Red) inside a driving kart's body (kart half-size .65 x .45 m, plus a .2 m body radius)
  closeCalls = a moving kart (v > .02) whose nose is within 1.0 m of a pedestrian in its lane
  jaywalk    = ticks a pedestrian not on a zebra (and not a traveler crossing a side road) spends with their centre >0.3 m inside a
               carriageway; the current target S[1] (who the engine holds still in front of Red) is counted apart
Also reports honks/dodges/looks from HIT_AWARE, page errors and module errors."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); TICKS = int(arg('--ticks', 36000)); RED = [float(v) for v in arg('--red', '-1.5,14').split(',')]; SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = "(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})()" % SEED
RUN = r'''([N,rx,rz])=>{
  const R=HIT_ROADS, NAV=R.NAVN, CARS=R.cars, a=S[0];
  const st=window.__X||(window.__X={tk:0,cross:0,done:0,ov:0,ovRed:0,close:0,jay:0,maxPeds:0,ovList:[],ms:0,_on:new Map(),_c:new Map()});
  const DR=HIT_W192.ROADS,inRoad=(x,z)=>DR.some(r=>x>r[0]+.3&&x<r[1]-.3&&z>r[2]+.3&&z<r[3]-.3);
  const t0=performance.now();
  for(let k=0;k<N;k++){
    a.x=rx;a.z=rz;a.vx=a.vz=0;if(a.i){a.i.l=a.i.r=a.i.u=a.i.d=0}
    tick(); st.tk++;
    const peds=[];for(const n of crowd)if(n&&n.hp>0&&!n._sitBench&&!(n.y>1.4))peds.push(n);
    st.maxPeds=Math.max(st.maxPeds,peds.length);
    for(const n of peds){const s=NAV.get(n),on=!!(s&&s.onRoad),was=st._on.get(n)||0;
      if(on&&!was)st.cross++; if(!on&&was)st.done++; st._on.set(n,on?1:0);
      if(!on&&!n._sitBench&&!n._xing&&inRoad(n.x,n.z)&&n===S[1]){st.tgt=(st.tgt||0)+1}else if(!on&&!n._sitBench&&!n._xing&&inRoad(n.x,n.z)){st.jay++;if(window.__JL&&st.jay%50==1)__JL.push([+n.x.toFixed(1),+n.z.toFixed(1),n._tag||n.tag||"",s?s.phase:"-",n._trav?1:0,Object.keys(n).filter(k=>k[0]=="_").slice(0,12).join(" ")])}}
    for(const c of CARS){ if(!c||c.mode==='parked')continue;
      const hl=Math.hypot(c.hx,c.hz)||1,hx=c.hx/hl,hz=c.hz/hl;
      for(const n of peds.concat([a])){const dx=n.x-c.x,dz=n.z-c.z,al=dx*hx+dz*hz,la=dx*-hz+dz*hx;
        if(Math.abs(al)<.85&&Math.abs(la)<.65){const key=c;const lastT=st._c.get(n);if(lastT!==st.tk-1){if(n===a)st.ovRed++;else st.ov++;if(st.ovList.length<12)st.ovList.push({tk:st.tk,x:+n.x.toFixed(2),z:+n.z.toFixed(2),cv:+(c.v||0).toFixed(3),mode:c.mode,red:n===a,onZebra:!!(NAV.get(n)||{}).onRoad,target:n===S[1],st:n.st,tag:n._tag||(n._town?'folk:'+n._town.task:''),hold:!!n._holdFor,phase:(NAV.get(n)||{}).phase||'-'})}st._c.set(n,st.tk)}
        else if(n!==a&&(c.v||0)>.02&&al>.65&&al<1.65&&Math.abs(la)<.7)st.close++;}}
  }
  st.ms+=performance.now()-t0;
  const AW=window.HIT_AWARE||{};
  return {ticks:st.tk,crossingsStarted:st.cross,crossingsCompleted:st.done,overlaps:st.ov,redOverlaps:st.ovRed,closeCalls:st.close,jaywalkTicks:st.jay,targetInRoadTicks:st.tgt||0,maxPeds:st.maxPeds,
    simMsPerTick:+(st.ms/st.tk).toFixed(3),aware:{dodges:AW.dodges,honks:AW.honks,watch:AW.watch,flee:AW.flee,redHonks:AW.redHonks,noticeRed:AW.noticeRed,makeRoom:AW.makeRoom,kartHolds:AW.kartHolds,roadExits:AW.roadExits},kerb:{looks:R.looks,lookAborts:R.aborts,kartYields:R.yields,midHolds:R.holds,contactsResolved:R.contacts||0,drivewayWaits:R.drivewayWaits||0,postsMoved:R.postsMoved||0,spotsMoved:R.spotsMoved||0,shoulderRoutes:R.shoulder||0},
    errors:{roads:R.error,aware:AW.error||null,life:(window.HIT_LIFE||{}).error||null},ovList:st.ovList}}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await pg.wait_for_timeout(2500)
        await pg.evaluate("window.__JL=%s;window.__stopLoop=1;" % ("[]" if "--jl" in sys.argv else "null") + " requestAnimationFrame=()=>0")   # stop the render loop: only the test ticks the world
        done = 0; r = None
        while done < TICKS:
            n = min(3000, TICKS - done); r = await pg.evaluate(RUN, [n, RED[0], RED[1]]); done += n
        r['pageErrors'] = errs[:10]; r['file'] = os.path.basename(FILE); r['red'] = RED; r['seed'] = SEED
        print(json.dumps(r, indent=1))
        if '--jl' in sys.argv: print(json.dumps(await pg.evaluate('window.__JL')))
        if OUT: open(OUT, 'w').write(json.dumps(r, indent=1))
        await b.close()
asyncio.run(main())
