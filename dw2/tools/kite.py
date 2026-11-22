"""Kite flying test (Step 15 gate).  Usage:
  python3 -I dw2/tools/kite.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red moves only with the joystick (H0.ax/H0.az, camera yaw 0)
or is placed on dry land before a check; the kite is driven only through the player's paths: INTERACT (_updateNear/_doInteract) and the
KITE button's two functions (HIT_KITE.input.down / up). A test clock (Date.now + offset) steps 61 s between purchases.
  shop      no kite: no "Fly the kite" prompt; a short pouch refuses the kite with nothing charged; buying it posts one 35 DC 'shop'
            debit (price from DC_CONFIG), the coins fly, a second buy is refused ('owned'), the panel shows OWNED, it is never in the
            gift bag, the audit is clean, and it is still owned after a reload
  open      launch works only on open ground: the South Meadow, the Highlands and the overlook top launch; trees, buildings, the
            carriageway, the lake and indoors refuse (no prompt, the reason code), nothing flies
  hold      a steady hold keeps it aloft for 60 s (3 different wind phases): never stalls, crashes or snags
  slack     letting the line run stalls it (3 wind phases), it falls and lands; holding REEL IN drags it back to the hand; FLY relaunches
  gust      in a strong gust letting out stays taut (line pays out, no stall, the kite climbs); a lull at a long line drops it
  skill     a pulsing flyer (let out, hold to re-tension) climbs past 20 m and stays up 90 s
  snag      flown low and walked toward a tree (and a building) it snags below the canopy top; three TUGs free it, it lands, reels in;
            flown high over the same tree line it passes over without snagging
  walk      the joystick walks Red the same distance with the kite up as without it
  pack      a punch, taking a hit, the coliseum, a boat, water and going indoors pack it away; the coliseum refuses a launch
  records   best height = the highest kite height seen, best time aloft = the longest flight, saved per viewer, kept after a reload
  errors    no HIT_* module errors, no page errors; draw() runs in every kite state"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__steer=(x,z)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;H0.ax=dx/d;H0.az=-dz/d;tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__K=()=>HIT_KITE.K;
window.__down=()=>HIT_KITE.input.down();window.__up=()=>HIT_KITE.input.up();
window.__drawErr=null;window.__draw=()=>{try{draw()}catch(e){__drawErr=String(e)}};
window.__fly=()=>{const n=__near();if(!n||n.act!=='kitefly')return{ok:false,label:n&&n.label};_doInteract();return{ok:HIT_KITE.st()==='fly',label:n.label}};
window.__trackH=0;window.__trackT=0;let __ft=0;
{const _t=tick;tick=function(){const r=_t.apply(this,arguments);const K=HIT_KITE.K;if(K.st==='fly'){__ft++;if(K.y>__trackH)__trackH=K.y;if(__ft>__trackT)__trackT=__ft}else __ft=0;return r}}   // an independent observer of every tick
window.__tk=(n,f)=>{for(let i=0;i<n;i++){if(f)f(i);tick()}};
window.__reset=()=>{HIT_KITE.windOverride=null;__up();if(HIT_KITE.st()!=='off')HIT_KITE.pack('test');__T(2)};
window.__toHand=()=>{__down();__tk(2400,()=>{});__up();__tk(2);return HIT_KITE.st()};
window.__pulse=(n,cap)=>{const K=HIT_KITE.K;let held=true,mx=0;__tk(n,()=>{if(K.st!=='fly')return;if(cap&&K.y>cap)held=true;else if(held&&K.slack<=0&&K.b>.6)held=false;else if(!held&&K.slack>1.3)held=true;held?__down():__up();if(K.y>mx)mx=K.y});return mx};0'''
OPEN = [['meadow', -48, -24], ['meadow2', -40, -26], ['highlands', 52, 106], ['highlands2', 70, 80], ['overlook', 'rock3']]
SHUT = [['trees', -10, -21], ['walls', 46, -22.4], ['road', -62, -20], ['water', 42, 51]]
MEADOW = [-48, -24]; HIGH = [52, 106]

async def boot(pg):
    await pg.wait_for_function('window.HIT_KITE&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + (arg('--q') or '')); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- shop: no kite, a short pouch ----------
        C['nokite'] = await pg.evaluate('''()=>{__at(-30,-24);__T(20);const n=__near(),r=HIT_KITE.launch();return{prompt:n&&n.label,code:r.code,ok:(!n||n.act!=='kitefly')&&r.code==='none'&&HIT_KITE.st()==='off'}}''')
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(const [it,sh] of [['cake','bakery'],['cake','bakery'],['cake','bakery'],['cake','bakery'],['cake','bakery'],['honey','general']]){window.__dt+=61000;await HIT_SHOP.buy(it,sh)}
            const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await HIT_SHOP.buy('kite','general');o.avail=b0;o.code=r.code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.owned=HIT_KITE.owned(true);
            o.ok=b0<35&&r.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.owned;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        C['buy'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};const it=HIT_DC.config.shop.items.find(x=>x.id==='kite');o.price=it.price;o.b0=e.summary().available;
            __at(-30,-24);__T(5);HIT_SHOP.open('general',S[0].x,S[0].z);await new Promise(r=>setTimeout(r,100));const btn=document.querySelector('#shop-box button[data-item="kite"]');o.btn0=btn&&btn.textContent;btn.click();
            for(let i=0;i<40&&HIT_SHOP.busy!==false||i<3;i++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,200));
            o.b1=e.summary().available;const deb=e.history(1e6).filter(x=>x.t==='d'&&x.src==='shop'&&x.meta&&x.meta.item==='kite');o.debits=deb.map(x=>({amt:x.amt,shop:x.meta.shop}));o.flown=(HIT_SHOP.log.slice(-1)[0]||{}).price;
            const btn2=document.querySelector('#shop-box button[data-item="kite"]');o.btn1=btn2&&btn2.textContent;o.btn1dis=btn2&&btn2.disabled;
            window.__dt+=61000;const r2=await HIT_SHOP.buy('kite','general');o.second=r2.code;o.b2=e.summary().available;o.bag=HIT_SHOP.bag.map(x=>x.item);o.audit=e.audit();
            document.querySelectorAll('#shop-pan').forEach(x=>x.remove());HIT_SHOP.panel=null;o.owned=HIT_KITE.owned(true);
            o.ok=o.b0-o.b1===it.price&&o.debits.length===1&&o.debits[0].amt===it.price&&o.debits[0].shop==='general'&&o.flown===it.price&&o.btn1==='OWNED'&&o.btn1dis&&o.second==='owned'&&o.b2===o.b1&&!o.bag.includes('kite')&&o.audit.ok&&o.owned;return o}''')
        await pg.reload(); await boot(pg)
        C['buy']['ownedAfterReload'] = await pg.evaluate('HIT_KITE.owned(true)'); C['buy']['ok'] = C['buy']['ok'] and C['buy']['ownedAfterReload']
        await pg.evaluate("()=>{try{localStorage.removeItem('dw2_kite_v1')}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- open ground ----------
        C['open'] = await pg.evaluate('''([OPEN,SHUT])=>{const o={open:[],shut:[]};
            for(const [n,x,z] of OPEN){__reset();if(typeof x==='string'){__at(96,108);__T(5);HIT_LIFE.go(x);S[0].x=94.6;S[0].z=113.9;__T(30)}else{__at(x,z);__T(30)}const f=__fly();__T(60);o.open.push({n,label:f.label,ok:f.ok,st:HIT_KITE.st(),y:+(S[0].y||0).toFixed(1)})}
            for(const [n,x,z] of SHUT){__reset();__at(x,z);__T(30);const nr=__near(),r=HIT_KITE.launch();o.shut.push({n,prompt:nr&&nr.act==='kitefly',code:r.code,st:HIT_KITE.st()})}
            // indoors: Red placed inside a building's room
            let room=null;for(const l of HIT_W192.lots){__at(l.x,l.z);__T(3);if(HIT_LIFE.insideId()){room=l.id;break}}const nr=__near(),r=HIT_KITE.launch();o.shut.push({n:'inside',room,prompt:nr&&nr.act==='kitefly',code:r.code,st:HIT_KITE.st()});
            o.ok=o.open.every(q=>q.ok&&q.st==='fly')&&o.shut.every(q=>!q.prompt&&q.code===q.n&&q.st==='off')&&!!room;return o}''', [OPEN, SHUT])
        # ---------- steady hold: 60 s aloft at three wind phases ----------
        C['hold'] = await pg.evaluate('''(M)=>{const o={trials:[]};for(const ph of [0,41000,97000]){__reset();tk+=ph;__at(M[0],M[1]);__T(30);__fly();__down();let minY=99,maxSlack=0,stF=0,u=[99,0];
              __tk(3600,(i)=>{const K=__K();if(K.st!=='fly')stF++;if(i>120)minY=Math.min(minY,K.y);maxSlack=Math.max(maxSlack,K.slack);u=[Math.min(u[0],K.u),Math.max(u[1],K.u)]});
              const K=__K();o.trials.push({phase:ph,st:HIT_KITE.st(),aloftTicks:K.t,notFlying:stF,minY:+minY.toFixed(2),maxSlack:+maxSlack.toFixed(2),wind:u.map(v=>+v.toFixed(2)),line:+K.L.toFixed(1)});__up()}
            o.ok=o.trials.every(t=>t.st==='fly'&&t.notFlying===0&&t.aloftTicks>=3600&&t.minY>2);return o}''', MEADOW)
        # ---------- letting it slack stalls it; land, reel in, relaunch ----------
        C['slack'] = await pg.evaluate('''(M)=>{const o={trials:[]};for(const ph of [0,23000,61000]){__reset();tk+=ph;__at(M[0],M[1]);__T(30);__fly();__down();__tk(300);__up();let stallAt=-1,landAt=-1,i0=0;
              __tk(1800,(i)=>{const s=HIT_KITE.st();if(stallAt<0&&s==='fall')stallAt=i;if(landAt<0&&s==='down')landAt=i});
              const hand=__toHand();const re=HIT_KITE.st()==='hand'?(__down(),__tk(2),__up(),HIT_KITE.st()):null;__tk(30);
              o.trials.push({phase:ph,stallAfterS:+(stallAt/60).toFixed(2),landAfterS:+(landAt/60).toFixed(2),hand,relaunch:re})}
            o.ok=o.trials.every(t=>t.stallAfterS>0&&t.stallAfterS<8&&t.landAfterS>t.stallAfterS&&t.hand==='hand'&&t.relaunch==='fly');return o}''', MEADOW)
        # ---------- gusts and lulls ----------
        C['gust'] = await pg.evaluate('''(M)=>{const o={};__reset();__at(M[0],M[1]);__T(30);__fly();__down();__tk(300);const K=__K();const d0=K.dir;
            HIT_KITE.windOverride={u:7.6,dir:d0};__tk(60);const y0=K.y,L0=K.L;__up();let st=[],minVa=99;__tk(360,()=>{minVa=Math.min(minVa,K.Va);if(K.st!=='fly')st.push(K.st)});
            o.gust={L0:+L0.toFixed(1),L1:+K.L.toFixed(1),y0:+y0.toFixed(1),y1:+K.y.toFixed(1),minVa:+minVa.toFixed(2),stalled:st.length>0};
            __tk(900);o.gust.Lmax=+K.L.toFixed(1);   // at full line nothing more pays out: the line holds taut on its own
            HIT_KITE.windOverride={u:6.5,dir:d0};__tk(240);const yA=K.y;HIT_KITE.windOverride={u:3.5,dir:d0};__tk(240);const yB=K.y;HIT_KITE.windOverride={u:6.5,dir:d0};__tk(240);const yC=K.y;
            o.lull={line:+K.L.toFixed(1),y_wind:+yA.toFixed(2),y_lull:+yB.toFixed(2),y_back:+yC.toFixed(2),st:HIT_KITE.st()};
            o.ok=!o.gust.stalled&&o.gust.L1>o.gust.L0+10&&o.gust.y1>o.gust.y0+5&&o.gust.minVa>=HIT_KITE.cfg.Vst&&yB<yA-.3&&yC>yB+.3&&HIT_KITE.st()==='fly';__up();return o}''', MEADOW)
        # ---------- a skilled flyer ----------
        C['skill'] = await pg.evaluate('''(M)=>{ /* natural wind, the open Highlands */ __reset();__at(M[0],M[1]);__T(30);__fly();const mx=__pulse(5400);const K=__K();const o={maxY:+mx.toFixed(1),st:HIT_KITE.st(),aloftS:+(K.t/60).toFixed(1),line:+K.L.toFixed(1)};o.ok=mx>20&&o.st==='fly'&&K.t>=5400;__up();return o}''', HIGH)
        # ---------- snags ----------
        C['snag'] = await pg.evaluate('''(M)=>{const o={};HIT_KITE.obstacles();
            const trees=[...WORLD.props,...SCENE].filter(p=>p.k==='tree').map(p=>{const sc=p.sc||1,sp=p.sp||'oak';return{x:p.x,z:p.z,top:(sp==='pine'?5.5:sp==='sakura'?3.85:4.2)*sc,r:1.5*sc}});
            const tr=trees.filter(t=>t.top>7).sort((a,b)=>Math.hypot(a.x-M[0],a.z-M[1])-Math.hypot(b.x-M[0],b.z-M[1]))[0];o.target={x:+tr.x.toFixed(1),z:+tr.z.toFixed(1),top:+tr.top.toFixed(1),dist:+Math.hypot(tr.x-M[0],tr.z-M[1]).toFixed(1)};
            const runLow=(sx,sz,tx,tz)=>{__reset();__at(sx,sz);__T(30);const f=__fly();HIT_KITE.windOverride={u:6.5,dir:Math.atan2(tz-sz,tx-sx)};__down();__tk(300);let steps=0;for(;steps<1500&&HIT_KITE.st()==='fly';steps++)__steer(tx,tz);H0.ax=H0.az=0;
              const K=__K(),ev=HIT_KITE.log.filter(e=>e.e==='snag').slice(-1)[0]||{};const r={launched:f.ok,label:f.label,st:HIT_KITE.st(),on:ev.on,y:ev.y,kite:[+K.x.toFixed(1),+K.y.toFixed(1),+K.z.toFixed(1)],steps,red:[+S[0].x.toFixed(1),+S[0].z.toFixed(1)]};
              __up();const tugs=[];for(let i=0;i<3;i++){__down();__tk(2);__up();__tk(20);tugs.push(HIT_KITE.st())}r.tugs=tugs;__tk(400);r.landed=HIT_KITE.st();r.hand=__toHand();return r};
            o.tree=runLow(M[0],M[1],tr.x,tr.z);o.tree.belowTop=o.tree.y<tr.top+.3;
            // a roof: the open spot nearest a tall building, walking toward its middle
            const B=WORLD.solids.filter(q=>q.h>=5&&Math.min(q.x1-q.x0,q.z1-q.z0)>=4);let best=null;
            for(const q of B){const cx=(q.x0+q.x1)/2,cz=(q.z0+q.z1)/2;for(let k=0;k<16;k++){const an=k/16*6.283,rx=Math.max((q.x1-q.x0)/2,(q.z1-q.z0)/2)+6;const x=cx+Math.cos(an)*rx,z=cz+Math.sin(an)*rx;__at(x,z);if(!HIT_KITE.whyNotOpen()){const d=Math.hypot(x-cx,z-cz);if(!best||d<best.d)best={x,z,cx,cz,d,h:q.h}}}}
            o.roofAt=best&&{x:+best.x.toFixed(1),z:+best.z.toFixed(1),h:best.h};o.roof=best?runLow(best.x,best.z,best.cx,best.cz):{launched:false};
            // high: let out to full line in a steady wind blowing away from the tree, then the wind veers onto it and Red walks the kite over the tree line
            __reset();__at(M[0],M[1]);__T(30);__fly();const away=Math.atan2(M[1]-tr.z,M[0]-tr.x),onto=Math.atan2(tr.z-M[1],tr.x-M[0]);HIT_KITE.windOverride={u:7.5,dir:away};__down();__tk(200);__up();__tk(1200);
            HIT_KITE.windOverride={u:7.5,dir:onto};__tk(400);const K=__K();const d0=Math.hypot(K.x-K.ax,K.z-K.az);let sn=0,minD=99,hAt=null,steps=0;
            let over=0,overMinClear=99;const overSet=new Set();
            for(;steps<1500;steps++){if(Math.hypot(tr.x-S[0].x,tr.z-S[0].z)<6)break;__steer(tr.x,tr.z);if(HIT_KITE.st()==='snag')sn++;const dd=Math.hypot(K.x-tr.x,K.z-tr.z);if(dd<minD){minD=dd;hAt=K.y}
              for(const t of trees){if(Math.abs(K.x-t.x)<4&&Math.abs(K.z-t.z)<4&&Math.hypot(K.x-t.x,K.z-t.z)<t.r){over++;overSet.add(t.x+','+t.z);overMinClear=Math.min(overMinClear,K.y-t.top)}}}H0.ax=H0.az=0;
            o.high={line:+K.L.toFixed(1),reach:+d0.toFixed(1),st:HIT_KITE.st(),snagTicks:sn,ticksOverACanopy:over,treesPassedOver:overSet.size,lowestClearanceOverACanopy:+overMinClear.toFixed(1),closestToTarget:+minD.toFixed(2),heightThere:hAt&&+hAt.toFixed(1),treeTop:+tr.top.toFixed(1),steps};__up();
            const low=(r,kind)=>r.launched&&r.st==='snag'&&r.on===kind&&r.tugs[2]!=='snag'&&r.landed==='down'&&r.hand==='hand';
            o.ok=low(o.tree,'tree')&&o.tree.belowTop&&low(o.roof,'wall')&&o.high.st==='fly'&&o.high.snagTicks===0&&o.high.treesPassedOver>=1&&o.high.lowestClearanceOverACanopy>0;return o}''', MEADOW)
        # ---------- walking with the kite up ----------
        C['walk'] = await pg.evaluate('''(M)=>{const run=(kite)=>{__reset();__at(M[0],M[1]);__T(30);if(kite){__fly();__down()}const x0=S[0].x,z0=S[0].z;for(let i=0;i<180;i++){cam.yaw=0;H0.ax=-1;H0.az=0;tick()}H0.ax=H0.az=0;__T(20);const d=Math.hypot(S[0].x-x0,S[0].z-z0);__up();return{d:+d.toFixed(3),st:HIT_KITE.st()}};
            const a=run(false),b=run(true);return{without:a,with:b,ok:b.st==='fly'&&Math.abs(a.d-b.d)<.01*a.d+1e-3}}''', MEADOW)
        # ---------- packed away ----------
        C['pack'] = await pg.evaluate('''async(M)=>{const o={ups:[]};const up=()=>{__reset();for(const n of crowd)if(n&&n._rec)n.prov=0;   /* nobody still angry from the punch test */ __at(M[0],M[1]);for(let w=0;w<600&&!(S[0].st==='idle'||S[0].st==='walk');w++)tick();__T(30);__fly();__down();__tk(60);const ok=HIT_KITE.st()==='fly';o.ups.push(ok?true:{red:S[0].st,hp:S[0].hp,msg:HIT_KITE.lastMsg,log:HIT_KITE.log.slice(-3).map(e=>e.e+':'+(e.why||''))});return ok};
            const last=()=>(HIT_KITE.log.filter(e=>e.e==='pack').slice(-1)[0]||{}).why;
            up();{const a=S[0];const n=crowd.filter(q=>q&&q.hp>0&&!q.prov&&q.st!=='down'&&!q._rec?.room).sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0];o.punchAt=n&&(n.tag||n.id);
              if(n){const dx=(a.x-n.x)||1,dz=(a.z-n.z),d=Math.hypot(dx,dz)||1;__at(n.x+dx/d*.8,n.z+dz/d*.8);a.fx=-dx/d;a.fz=-dz/d;for(let k=0;k<6&&HIT_KITE.st()==='fly';k++){press('p',1);__T(3);press('p',0);__T(10)}}
              o.punch={st:HIT_KITE.st(),why:last(),redSt:a.st};}
            up();H0.g=1;__T(10);H0.g=0;__T(10);o.guard={st:HIT_KITE.st(),why:last()};
            up();S[0].hp-=5;__T(3);o.hit={st:HIT_KITE.st(),why:last()};S[0].hp+=5;
            up();HIT_SKY.on=true;__T(3);o.sky={st:HIT_KITE.st(),why:last(),launch:HIT_KITE.launch().code};HIT_SKY.on=false;__T(3);
            up();if(window.HIT_BOAT&&HIT_BOAT.B){HIT_BOAT.B.aboard=true;__T(3);o.boat={st:HIT_KITE.st(),why:last()};HIT_BOAT.B.aboard=false}
            up();__at(42,51);__T(20);o.water={st:HIT_KITE.st(),why:last(),wd:+(S[0]._wd||0).toFixed(2)};__at(M[0],M[1]);__T(60);
            up();let room=null;for(const l of HIT_W192.lots){__at(l.x,l.z);__T(2);if(HIT_LIFE.insideId()){room=l.id;break}}o.inside={st:HIT_KITE.st(),why:last(),room};
            __reset();__at(M[0],M[1]);__T(30);__fly();__T(60);__up();__tk(1200);const sd=HIT_KITE.st();__near();const lab=_near&&_near.label;_doInteract();o.packDown={st0:sd,label:lab,st:HIT_KITE.st()};
            o.ok=o.ups.every(u=>u===true)&&o.punch.st==='off'&&o.punch.why==='fight'&&o.guard.st==='off'&&o.guard.why==='fight'&&o.hit.st==='off'&&o.hit.why==='fight'&&o.sky.st==='off'&&o.sky.why==='area'&&o.sky.launch==='area'&&(!o.boat||o.boat.st==='off'&&o.boat.why==='boat')&&o.water.st==='off'&&o.water.why==='water'&&o.inside.st==='off'&&o.inside.why==='inside'&&o.packDown.st0==='down'&&o.packDown.st==='off';return o}''', MEADOW)
        # ---------- draw in every state ----------
        C['draw'] = await pg.evaluate('''(M)=>{__reset();__at(M[0],M[1]);__T(30);const seen={};__fly();__draw();seen.fly=HIT_KITE.st();__down();__tk(120);__draw();HIT_KITE.windOverride={u:4.5,dir:Math.PI/2};__up();__tk(900,()=>{const s=HIT_KITE.st();if(!seen[s]){__draw();seen[s]=1}});__toHand();__draw();seen.hand=HIT_KITE.st();__reset();__draw();
            return{states:Object.keys(seen),err:__drawErr,modErr:HIT_KITE.error,ok:!__drawErr&&!HIT_KITE.error&&['fly','fall','down'].every(k=>k in seen)}}''', MEADOW)
        # ---------- records ----------
        rec = await pg.evaluate('()=>({rec:HIT_KITE.rec(),H:__trackH,T:__trackT})')
        await pg.reload(); await boot(pg)
        rec2 = await pg.evaluate('HIT_KITE.rec()')
        C['records'] = {'rec': rec['rec'], 'maxHeightSeen': round(rec['H'], 2), 'longestFlightTicks': rec['T'], 'afterReload': rec2,
                        'ok': abs(rec['rec']['bestH'] - rec['H']) < .06 and rec['rec']['bestT'] == rec['T'] and rec2 == rec['rec'] and rec['rec']['flights'] > 10}
        mods = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        C['errors'] = {'page': errs[:10], 'modules': mods, 'ok': not errs and not mods}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    print(json.dumps(out, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))

asyncio.run(main())
