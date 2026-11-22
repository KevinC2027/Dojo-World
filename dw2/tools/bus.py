"""Town bus test (Step 14 gate).  Usage:
  python3 -I dw2/tools/bus.py <build.html> [--seed 7] [--laps 2] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick() with no drawing. The scripted player uses the same paths as
the buttons: Red is put on the pavement at a stop, waits there for the bus, _updateNear/_doInteract (INTERACT) to board, rides,
INTERACT again = the bell ("Get off at the next stop"), and is set down when the bus pulls in.
  timetable  INTERACT at a stop with no bus shows the timetable (next bus, route, fare) and charges nothing
  rides      --laps x 4 rides: board at every stop, bell, get off at the next stop. Each ride: exactly one 'fare' debit at the fare price
             (balance, pouch and ledger agree, audit clean, nothing in the gift bag); Red set down on the pavement at the right stop,
             not in the carriageway, not inside a solid; Red hidden aboard (never in the road as a pedestrian), never swimming / falling
  overlap    every tick of every ride (and of the free run below): no townsperson's body overlaps the bus body (checked after the tick,
             0.22 m margin); and the backstop (townsfolk slid out of a vehicle body) never fires while the bus is MOVING. Contacts with the
             bus standing still (someone brushing past a parked bus's nose) are counted and reported, not failed.
  yield      a townsperson put in the bus lane ahead while Red rides: the bus stops short of them and waits (never overlaps)
  getoffnow  INTERACT while the bus waits at a stop = off right there
  attack     PUNCH / KICK / THROW / JUMP aboard do nothing (Red stays in his seat, state idle)
  leave      leaving town (coliseum) while aboard sets Red down at the nearest stop first, on the pavement
  free       --ticks of plain running: the bus keeps calling at its stops in order (no stuck states)
  drain      repeat fares until the pouch is short: ends in 'insufficient', nothing charged, Red left at the stop
Reports counts, worst values, and page/module errors."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); LAPS = int(arg('--laps', 2)); TICKS = int(arg('--ticks', 30000)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
RUN = r'''async ([LAPS,TICKS])=>{
  const RD=HIT_ROADS,B=RD.bus,BU=HIT_BUS,ST=RD.busStops,a=S[0],out={stops:ST.map(s=>s.id),price:BU.price};
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<200&&!(window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0);i++)await sleep(50);
  const st=()=>{try{HIT_DC.int.refresh();const e=HIT_DC.eco,s=e.summary(),p=HIT_DC.pouch&&HIT_DC.pouch(),inRed=(HIT_DC.coins||[]).filter(k=>k.to==='red').reduce((t,k)=>t+k.val,0),h=e.history(1e6);
    return{avail:s.available,n:s.count,fares:h.filter(x=>x.t==='d'&&x.src==='fare').length,fareMeta:h.filter(x=>x.t==='d'&&x.src==='fare').map(x=>x.meta&&x.meta.stop),bag:window.HIT_SHOP?HIT_SHOP.bag.length:0,audit:e.audit().ok,issues:e.audit().issues.slice(0,3),pouchOk:!p||p[0]*100+p[1]*10+p[2]===Math.max(0,s.available-inRed)}}catch(e){return{err:String(e)}}};
  const SO=WORLD.solids||[], inSolid=(x,z)=>SO.some(q=>x>q.x0&&x<q.x1&&z>q.z0&&z<q.z1), inDrive=(x,z)=>RD.inDrive?RD.inDrive(x,z):false;
  const W=.72,body=()=>{const hl=Math.hypot(B.hx,B.hz)||1;return{hx:B.hx/hl,hz:B.hz/hl}};
  const ov={ticks:0,overlap:0,minGap:99,worst:null};
  const overlapCheck=()=>{const o=body();for(const n of crowd){if(!n||n.hp<=0||(n.y||0)>.3)continue;const dx=n.x-B.x,dz=n.z-B.z;if(Math.abs(dx)>4||Math.abs(dz)>4)continue;const al=dx*o.hx+dz*o.hz,la=dx*-o.hz+dz*o.hx;
      const gap=Math.max(Math.abs(al)-B.len,Math.abs(la)-W)-.22;if(gap<ov.minGap){ov.minGap=gap}if(gap<0){ov.overlap++;ov.worst=ov.worst||{n:n.tag||n.id||'?',st:n.st,al:+al.toFixed(2),la:+la.toFixed(2),bx:+B.x.toFixed(1),bz:+B.z.toFixed(1)}}}ov.ticks++};
  const T=(n,chk)=>{for(let i=0;i<n;i++){tick();overlapCheck();if(chk&&chk()===true)return i}return n};
  const interact=async()=>{window.__dt+=61000;_doInteract();for(let i=0;i<80&&BU.paying;i++)await sleep(25);await sleep(30)};
  const put=(i)=>{const s=ST[i];if(BU.aboard)BU.alight(i,true);a.x=s.b[0]+(Math.random()-.5)*.6;a.z=s.b[1];a.vx=a.vz=0;a._tgx=a.x;a._tgz=a.z;a.st='idle';H0.ax=H0.az=0;};
  const waitBus=(i)=>T(40000,()=>{if(Math.hypot(a.x-ST[i].b[0],a.z-ST[i].b[1])>1){a.x=ST[i].b[0];a.z=ST[i].b[1]}return B.bAt===i});
  const c0=RD.contacts||0, s0=st();
  // ---- timetable at a stop with no bus ----
  { let i=0;for(;i<ST.length&&B.bAt===i;i++);put(i);if(B.bAt===i)T(500);_updateNear();const lab=_near&&_near.label;const t0=st();BU.stats.timetables=0;await interact();const t1=st();
    out.timetable={label:lab,shown:BU.stats.timetables===1,charged:t0.avail-t1.avail,ok:/next bus/.test(lab||'')&&BU.stats.timetables===1&&t0.avail===t1.avail&&!BU.aboard}; }
  // ---- rides: board at every stop, ring, off at the next ----
  const rides=[];let red={hidden:0,ticks:0,wet:0,air:0,inRoadPed:0,offSeat:0};
  for(let lap=0;lap<LAPS;lap++)for(let i=0;i<ST.length;i++){
    put(i);const w=waitBus(i);_updateNear();const lab=_near&&_near.label;const b0=st();await interact();const b1=st();const on=BU.aboard;
    const r={from:ST[i].id,waited:w,label:lab,boarded:on,charged:b0.avail-b1.avail,fares:b1.fares-b0.fares,meta:b1.fareMeta[0]};
    // ride until the bus has left the stop, then ring the bell
    T(3000,()=>B.bAt<0);_updateNear();r.rideLabel=_near&&_near.label;await interact();r.bell=BU.bell;
    const want=(i+1)%ST.length;let n=0;
    n=T(20000,()=>{red.ticks++;if(BU.aboard){const sp=PEOPLE_HAS_RED();if(sp)red.inRoadPed++;if(Math.hypot(a.x-B.x,a.z-B.z)>.01)red.offSeat++;if(a._wd||a._swim)red.wet++;if(Math.abs(a.y||0)>.05)red.air++}return!BU.aboard});
    const e1=st();
    r.rideTicks=n;r.offAt=BU.lastOff;r.wantStop=ST[want].id;r.red=[+a.x.toFixed(2),+a.z.toFixed(2)];r.distToAlight=+Math.hypot(a.x-ST[want].al[0],a.z-ST[want].al[1]).toFixed(2);
    r.inDrive=inDrive(a.x,a.z);r.inSolid=inSolid(a.x,a.z);r.extraCharge=b1.avail-e1.avail;r.audit=e1.audit;r.pouchOk=e1.pouchOk;r.bag=e1.bag-b0.bag;
    r.ok=on&&/Board the bus/.test(lab||'')&&r.charged===BU.price&&r.fares===1&&r.meta===ST[i].id&&r.bell&&r.offAt===ST[want].id&&r.distToAlight<.05&&!r.inDrive&&!r.inSolid&&r.extraCharge===0&&r.audit&&r.pouchOk&&r.bag===0;
    rides.push(r);T(60)}
  out.contactsAfterRides=(RD.contacts||0)-c0;
  out.rides={n:rides.length,ok:rides.filter(r=>r.ok).length,list:rides};out.red=red;
  // ---- yield: a townsperson in the lane ahead while Red rides ----
  { put(1);waitBus(1);_updateNear();await interact();T(3000,()=>B.bAt<0);T(240);const o=body();const n=crowd.find(q=>q&&q.hp>0&&!q.prov&&q.st!=='down');let res=null;
    if(n){const sv={x:n.x,z:n.z};const px=B.x+o.hx*(B.len+5),pz=B.z+o.hz*(B.len+5);n.x=px;n.z=pz;n.vx=n.vz=0;let minGap=99,stopped=false;
      for(let t=0;t<240;t++){n.x=px;n.z=pz;n.vx=n.vz=0;tick();overlapCheck();const dx=n.x-B.x,dz=n.z-B.z,al=dx*o.hx+dz*o.hz;minGap=Math.min(minGap,al-B.len);if(B.v===0&&t>60)stopped=true}
      res={who:n.tag||n.id,minGapFront:+minGap.toFixed(2),stopped,aboard:BU.aboard,ok:stopped&&minGap>.3&&BU.aboard};n.x=sv.x;n.z=sv.z}
    out.yield=res; }
  // ---- get off right now at a stop, and attacks aboard ----
  { T(20000,()=>B.bAt>=0);_updateNear();const lab=_near&&_near.label;const at=B.bAt;await interact();out.getoffnow={label:lab,off:!BU.aboard,at:ST[at]&&ST[at].id,lastOff:BU.lastOff,inDrive:inDrive(a.x,a.z),inSolid:inSolid(a.x,a.z),ok:/Get off here/.test(lab||'')&&!BU.aboard&&BU.lastOff===(ST[at]&&ST[at].id)&&!inDrive(a.x,a.z)&&!inSolid(a.x,a.z)}; }
  { const i=B.bAt>=0?B.bAt:0;put(i);waitBus(i);_updateNear();await interact();T(3000,()=>B.bAt<0);const hp0=crowd.map(n=>n.hp),sts=[];
    for(const k of ['p','k','ip']){press(k,1);T(2);press(k,0);T(30);sts.push(a.st)}jumpFlag=1;T(30);sts.push(a.st,+(a.y||0).toFixed(2));
    H0.ax=1;H0.az=0;T(30);const seat=Math.hypot(a.x-B.x,a.z-B.z);H0.ax=0;
    out.attack={states:sts,aboard:BU.aboard,seatGap:+seat.toFixed(3),hpLost:crowd.map((n,k)=>({k,d:+Math.hypot(n.x-B.x,n.z-B.z).toFixed(1),lost:(hp0[k]||0)-n.hp,st:n.st,prov:!!n.prov})).filter(q=>q.lost>0),ok:BU.aboard&&sts.slice(0,4).every(s=>s==='idle')&&seat<.01}; }
  out.contactsBeforeLeave=(RD.contacts||0)-c0;
  // ---- leave town while aboard ----
  { let r=null;try{if(window.HIT_SKY){const sv=HIT_SKY.on;HIT_SKY.on=true;tick();const x=a.x,z=a.z;r={aboard:BU.aboard,forced:BU.stats.forced,at:BU.lastOff,inDrive:inDrive(x,z),inSolid:inSolid(x,z)};HIT_SKY.on=sv;tick();r.ok=!r.aboard&&r.forced>0&&!r.inDrive&&!r.inSolid}}catch(e){r=String(e)}out.leave=r; }
  // ---- free run: the bus keeps calling at its stops in order ----
  { const cf=RD.contacts||0;const seq=[];let stuckAt=null;let last=B.bAt,stuck=0,maxStuck=0;a.x=-1.5;a.z=14;
    for(let t=0;t<TICKS;t++){tick();overlapCheck();if(B.bAt!==last){if(B.bAt>=0)seq.push(B.bAt);last=B.bAt}if(B.v===0&&B.bAt<0){stuck++;if(stuck>maxStuck){maxStuck=stuck;stuckAt={x:+B.x.toFixed(1),z:+B.z.toFixed(1),turnWait:!!B._tw,light:!B.blkPerson&&!B._tw,person:B.blkPerson?[+B.blkPerson.x.toFixed(1),+B.blkPerson.z.toFixed(1),B.blkPerson.st,B.blkPerson===S[0]]:null}}}else stuck=0}
    let inOrder=true;for(let k=1;k<seq.length;k++)if(seq[k]!==(seq[k-1]+1)%ST.length)inOrder=false;
    out.free={contacts:(RD.contacts||0)-cf,ticks:TICKS,calls:seq.length,inOrder,maxStoppedTicks:maxStuck,stuckAt,ok:inOrder&&seq.length>=Math.floor(TICKS/20000)&&maxStuck<3600}; }
  // ---- drain the pouch with fares ----
  { let n=0,last=null,a0=null,i=0,dailyHit=null;
    let dbg=null;for(let k=0;k<200;k++){i=B.bAt>=0?B.bAt:B.bnext;put(i);const wt=waitBus(i);_updateNear();dbg={k,i,wt,label:_near&&_near.label,bAt:B.bAt,bus:[+B.x.toFixed(1),+B.z.toFixed(1)],v:B.v,tw:!!B._tw,red:[+a.x.toFixed(1),+a.z.toFixed(1)],st:a.st,aboard:BU.aboard,paying:BU.paying};a0=st();BU.last=null;await interact();last=BU.last;for(let rt=0;rt<3&&last&&(last.code==='busy'||last.code==='no_bus');rt++){T(20);put(i);waitBus(i);_updateNear();a0=st();BU.last=null;await interact();last=BU.last}if(last&&last.code==='fare_daily'){dailyHit=n;window.__dt+=86400000;BU.last=null;await interact();last=BU.last}if(!last||!last.ok)break;n++;BU.alight(i,true);B.dwell=Math.max(B.dwell,30)}
    const a1=st();out.drain={fares:n,dailyCapAt:dailyHit,lastTry:dbg,lastCode:last&&last.code,atStop:!BU.aboard&&Math.hypot(a.x-ST[i].b[0],a.z-ST[i].b[1])<1,unchanged:a1.avail===a0.avail&&a1.n===a0.n,availLeft:a1.avail,audit:a1.audit,pouchOk:a1.pouchOk,
      ok:!!last&&last.code==='insufficient'&&!BU.aboard&&a1.avail===a0.avail&&a1.n===a0.n&&a1.avail<BU.price&&a1.audit}; }
  out.ledger={before:s0,after:st()};
  out.overlap={ticks:ov.ticks,overlaps:ov.overlap,minGap:+ov.minGap.toFixed(3),worst:ov.worst,backstopContacts:(RD.contacts||0)-c0,busBackstopContacts:RD.busContacts||0,busContactsWhileMoving:RD.busContactsMoving||0,busContactLog:(RD.busContactLog||[]).slice(0,40)};
  out.busStats=Object.assign({},BU.stats);out.busError=BU.error;out.roadsError=RD.error;
  return out}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + (arg('--q') or '')); await pg.wait_for_timeout(2500)
        try: await pg.wait_for_function('!window.HIT_DC||(HIT_DC.eco&&HIT_DC.eco.summary().count>0)', timeout=20000)
        except Exception: pass
        await pg.evaluate("requestAnimationFrame=()=>0")
        await pg.evaluate("window.PEOPLE_HAS_RED=()=>{try{return S[0]._onBus!==true}catch(e){return true}}")
        out = await pg.evaluate(RUN, [LAPS, TICKS])
        out['moduleErrors'] = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        out['pageErrors'] = errs[:10]; out['file'] = os.path.basename(FILE); out['seed'] = SEED
        g = ['timetable', 'yield', 'getoffnow', 'attack', 'leave', 'free', 'drain']
        out['PASS'] = bool(out['rides']['ok'] == out['rides']['n'] and all(isinstance(out.get(k), dict) and out[k].get('ok') for k in g)
                           and out['overlap']['overlaps'] == 0 and out['overlap']['busContactsWhileMoving'] == 0 and out['red']['inRoadPed'] == 0 and out['red']['offSeat'] == 0 and out['red']['wet'] == 0 and out['red']['air'] == 0
                           and not out['moduleErrors'] and not out['pageErrors'] and out['ledger']['after'].get('audit'))
        print(json.dumps(out, indent=1))
        if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
        await b.close()
asyncio.run(main())
