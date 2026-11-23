"""Goldfish scooping test (Step 26 gate).  Usage:
  python3 -I dw2/tools/kingyo.py <build.html> [--seed 7] [--json out.json] [--shots dir]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red walks to the stall by the on-screen joystick (H0.ax/H0.az,
camera yaw 0) from the torii; the game is driven only through the player's paths: INTERACT (_updateNear/_doInteract), pointer events on
the panel's tank canvas (pointerdown = dip, pointermove = drag, pointerup = lift; one run with REAL mouse events from Playwright) and the
panel's real buttons. The tank runs in manual mode (HIT_KINGYO.manual; HIT_KINGYO.sim(n) = n fixed 1/30 s steps, the same step() the
panel's timer runs). A test clock (Date.now + offset) steps 61 s between paid games (ledger rate limit).
  walk      joystick from the torii to the stall spot, prompt "Goldfish scooping · 10 DC"; no collision solid, Red never lifted onto it
  short     a short pouch: INTERACT refuses with nothing charged, no panel, no game
  play      INTERACT -> exactly one 10 DC 'hire' debit (item kingyo, place shrine, price from DC_CONFIG), panel open, 3 poi, 14 fish
  careful   careful scoops (dip 9 cm behind a fish, follow it at <= 8 cm/s, lift under it) catch: every small/medium kind, real mouse once
  sight     a poi coming fast from in front scares the fish (flees); the same speed from behind (outside the field of view) or slowly
            from in front does not; dipping within 4 cm of a fish splashes it
  soak      a poi held still in the water tears by itself when wet reaches 0.96 (t = 4 ln((1 - wet0)/0.04) s; 12.9 s dry, +-2 steps); a slow scoop after
            ~6 s under water (wet ~0.8) tears under a medium fish that a fresh poi lifts
  shear     dragging at 100 cm/s tears a fresh poi; 25 cm/s does not; 35 cm/s tears a soaked poi (limit 90 x (1 - 0.7 wet))
  heavy     the big wakin (9 cm, ~16 g): a fresh poi lifts it, a wet poi (2.5 s under water) tears under it, the same wet poi lifts a small fish
  over      the third tear ends the game -> result; pick 2 by tapping (a 3rd tap is refused) -> TAKE HOME -> 2 fish in the bowl, the rest released
  resume    CLOSE mid-game and a punch mid-game keep the paid game (poi left, catch); INTERACT resumes it with no second debit
  bowl      the bowl holds 6: a 4th game's take-home lets the oldest go; inside House No. 41 the bowl is drawn on the low table and
            INTERACT names the fish
  sky       the coliseum refuses with nothing charged, no prompt
  reload    bowl and a paid game in progress survive a reload
  python    every logged lift and tear re-judged in Python from its inputs: load / strength / holds, soak threshold, shear limit
  audit     eco.audit() clean; debits = games paid, all 10 DC; no HIT_* module errors, no page errors; draw() runs with the panel open"""
import asyncio, json, sys, os, math
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json'); SHOTS = arg('--shots')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__steer=(x,z)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;const k=d<.6?Math.max(.25,d/.6):1;H0.ax=dx/d*k;H0.az=-dz/d*k;tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__walk=(x,z,tol)=>{let d=99,i=0;for(;i<900&&d>(tol||.25);i++)d=__steer(x,z);H0.ax=H0.az=0;__T(20);return{d:+Math.hypot(x-S[0].x,z-S[0].z).toFixed(2),ticks:i}};
window.__drawErr=null;window.__draw=()=>{try{draw()}catch(e){__drawErr=String(e)}};
window.__sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
window.__deb=()=>HIT_DC.eco.history(1e6).filter(x=>x.t==='d'&&x.src==='hire'&&x.meta&&x.meta.item==='kingyo');
window.__interact=async()=>{const n=__near();if(!n)return{label:null};_doInteract();for(let i=0;i<40&&HIT_KINGYO.paying;i++)await __sleep(25);await __sleep(60);return{label:n.label,act:n.act}};
window.K=()=>HIT_KINGYO;
window.__cv=()=>document.querySelector('#kgy-box canvas');
window.__pe=(type,x,y)=>{const c=K().toClient(x,y);__cv().dispatchEvent(new PointerEvent(type,{clientX:c.x,clientY:c.y,pointerId:1,bubbles:true,pointerType:'touch',isPrimary:true}))};
window.__fish=(id)=>K().fish().find(f=>f.id===id);
// a careful scoop: dip the poi at (60,32) (optionally hold it still for waitSteps), a fish of the given kind swims at it from 7 cm away
// (placed there; two decoys far off), the poi follows it at <= spd cm/s (below the 14 cm/s the fish notice) and lifts when under it.
window.__P0=[60,32];
window.__scoop=(spec,spd,waitSteps)=>{spd=spd||6;const x0=__P0[0],y0=__P0[1];let x=x0,y=y0;__pe('pointerdown',x,y);K().sim(1);
  for(let i=0;i<(waitSteps||0);i++){__pe('pointermove',x,y);K().sim(1)}
  if((K().poi()||{}).torn)return Object.assign({res:'torn-before-lift'},K().tears.slice(-1)[0]);
  __only([Object.assign({x:x0-7,y:y0,h:0,panic:0},spec),{k:'wakin',L:5,x:8,y:8,h:3,panic:0},{k:'wakin',L:5,x:112,y:58,h:1,panic:0}]);const id=K().fish()[0].id;
  const step=spd/30;for(let i=0;i<600;i++){const f=__fish(id);if(!f||(K().poi()||{}).torn)break;const dx=f.x-x,dy=f.y-y,d=Math.hypot(dx,dy);if(d<.6)break;const m=Math.min(d,step);x+=dx/d*m;y+=dy/d*m;__pe('pointermove',x,y);K().sim(1)}
  if((K().poi()||{}).torn)return Object.assign({res:'torn-before-lift'},K().tears.slice(-1)[0]);
  const n0=K().lifts.length;__pe('pointerup',x,y);K().sim(1);return K().lifts.length>n0?K().lifts[K().lifts.length-1]:{res:'nolift'}};
window.__calm=()=>{const F=K().fish();K().setFish(F.map(f=>Object.assign({},f,{panic:0})))};
window.__only=(arr)=>K().setFish(arr);0'''
TORII = [48, 5.2]

async def boot(pg):
    await pg.wait_for_function('window.HIT_KINGYO&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

async def newgame(pg):
    return await pg.evaluate('''async()=>{const cf=K().cfg;if(K().state().game){if(!K().open())await __interact();return{resumed:true}}__at(cf.spot.x,cf.spot.z);__T(3);window.__dt+=61000;const d0=__deb().length;await __interact();K().manual=true;return{debit:__deb().length-d0,open:K().open()}}''')

def rejudge(lifts, tears):
    bad = 0; n = 0
    for r in lifts:
        if r['res'] == 'empty': continue
        n += 1; load = r['w'] * (1 + 0.6 * r['panic']) + 0.12 * r['v']; cap = 24 * max(0, 1 - r['wet']) ** 0.8
        holds = load <= cap
        if abs(load - r['load']) > 1e-9 or abs(cap - r['cap']) > 1e-9 or holds != (r['res'] == 'caught'): bad += 1
    nt = 0
    for t in tears:
        nt += 1
        if t['why'] == 'soak' and not (t['wet'] >= 0.96): bad += 1
        if t['why'] == 'shear' and not (t['v'] > 90 * (1 - 0.7 * t['wet']) and abs(t['vmax'] - 90 * (1 - 0.7 * t['wet'])) < 1e-9): bad += 1
        if t['why'] == 'lift' and not (t['load'] > t['cap']): bad += 1
    return {'lifts': n, 'tears': nt, 'mismatches': bad}

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        C['walk'] = await pg.evaluate('''(T)=>{const o={},cf=K().cfg;__at(T[0],T[1]);__T(20);o.walk=__walk(cf.spot.x,cf.spot.z);o.prompt=(__near()||{}).label;
            const cross=(x,z)=>{__at(x,z-1.2);__T(5);let my=0;for(let i=0;i<120;i++){cam.yaw=0;H0.ax=0;H0.az=-1;tick();if(Math.abs(S[0].z-z)<.3)my=Math.max(my,S[0].y||0)}H0.ax=H0.az=0;return +my.toFixed(2)};
            o.solids=WORLD.solids.filter(q=>q.p&&/^kgy/.test(q.p.k)).length;o.climbY=cross(cf.stall.x,cf.stall.z);
            o.ok=o.walk.d<.3&&/^Goldfish scooping · 10 DC$/.test(o.prompt||'')&&o.solids===0&&o.climbY<.05;return o}''', TORII)
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(let k=0;k<5;k++){window.__dt+=61000;await HIT_SHOP.buy('cake','bakery')}
            for(let k=0;k<30&&e.summary().available>=10;k++){window.__dt+=61000;await HIT_SHOP.buy('eggs','stand')}
            const cf=K().cfg;__at(cf.spot.x,cf.spot.z);__T(5);const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await __interact();
            o.avail=b0;o.label=r.label;o.code=(K().last||{}).code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.panel=K().open();o.game=K().state().game;
            o.ok=b0<10&&o.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.panel&&!o.game;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- a paid game ----------
        C['play'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=K().cfg,it=HIT_DC.config.hire.items.find(x=>x.id==='kingyo');o.price=it&&it.price;o.place=it&&it.place;
            __at(cf.spot.x,cf.spot.z);__T(5);const b0=e.summary().available;window.__dt+=61000;const r=await __interact();K().manual=true;o.label=r.label;o.charged=b0-e.summary().available;
            o.debits=__deb().map(x=>({amt:x.amt,place:x.meta.place}));const s=K().state();o.poi=s.game&&s.game.poi;o.fish=K().fish().length;o.open=K().open();__draw();
            o.ok=o.price===10&&o.charged===10&&o.debits.length===1&&o.debits[0].place==='shrine'&&o.poi===3&&o.fish===14&&o.open&&!__drawErr;return o}''')
        # ---------- careful scoops catch (pointer events), one with the REAL mouse ----------
        C['careful'] = await pg.evaluate('''()=>{const o={rows:[]};const kinds=['wakin','kohaku','demekin','ryukin','wakin','kohaku'];
            for(const k of kinds){if(!K().state().game||K().state().game.poi<3)break;K().sim(30*40);const r=__scoop({k:k,L:k==='ryukin'?7:k==='demekin'?6.5:5.5},6);o.rows.push({k:k,res:r.res,wet:r.wet&&+r.wet.toFixed(3),v:r.v&&+r.v.toFixed(1),w:r.w,load:r.load&&+r.load.toFixed(2),cap:r.cap&&+r.cap.toFixed(2)});K().sim(40)}
            o.caught=K().state().game.caught.length;o.poiLeft=K().state().game.poi;o.ok=o.rows.length===6&&o.rows.every(r=>r.res==='caught')&&o.caught===6&&o.poiLeft===3;return o}''')
        # real mouse scoop: Playwright's mouse dips at (60,32), a wakin swims at it from 7 cm, the mouse follows it at 4 cm/s, mouse up lifts
        await pg.evaluate('K().sim(30*40)')
        x, y = 60.0, 32.0
        c = await pg.evaluate('([x,y])=>K().toClient(x,y)', [x, y]); await pg.mouse.move(c['x'], c['y']); await pg.mouse.down(); await pg.evaluate('K().sim(1)')
        await pg.evaluate("()=>{__only([{k:'wakin',L:5.2,x:53,y:32,h:0,panic:0},{k:'wakin',L:5,x:8,y:8,h:3,panic:0}]);window.__mf=K().fish()[0].id}")
        for i in range(400):
            fp = await pg.evaluate('()=>__fish(window.__mf)')
            if not fp: break
            dx, dy = fp['x'] - x, fp['y'] - y; d = math.hypot(dx, dy)
            if d < .6: break
            m = min(d, 4 / 30); x += dx / d * m; y += dy / d * m
            c = await pg.evaluate('([x,y])=>K().toClient(x,y)', [x, y]); await pg.mouse.move(c['x'], c['y']); await pg.evaluate('K().sim(1)')
        n0 = await pg.evaluate('K().lifts.length'); await pg.mouse.up(); await pg.evaluate('K().sim(1)')
        mr = await pg.evaluate('(n0)=>K().lifts.length>n0?K().lifts[K().lifts.length-1]:null', n0)
        C['careful']['mouse'] = {'res': mr and mr['res'], 'v': mr and round(mr['v'], 2), 'd': mr and mr['d'] and round(mr['d'], 2)}
        C['careful']['ok'] = C['careful']['ok'] and bool(mr) and mr['res'] == 'caught'
        # ---------- sight ----------
        C['sight'] = await pg.evaluate('''()=>{const o={};const run=(fromFront,spd)=>{__only([{k:'wakin',L:5,x:60,y:32,h:0,panic:0}]);const id=K().fish()[0].id;
              let x=fromFront?82:38,y=32;__pe('pointerdown',x,y);K().sim(1);let fled=false,minD=99;
              for(let i=0;i<90;i++){const f=__fish(id);x+=(fromFront?-1:1)*spd/30;__pe('pointermove',x,y);K().sim(1);const g=__fish(id);if(g.panic>.5)fled=true;minD=Math.min(minD,Math.hypot(g.x-x,g.y-y));if(fled||minD<3)break}
              const torn=(K().poi()||{}).torn;__only([{k:'wakin',L:5,x:5,y:5,h:0,panic:0}]);__pe('pointerup',x,y);K().sim(1);return{fled,minD:+minD.toFixed(1),torn}};
            o.frontFast=run(true,24);K().sim(60);o.behindFast=run(false,24);K().sim(60);o.frontSlow=run(true,8);K().sim(60);
            __only([{k:'wakin',L:5,x:60,y:32,h:0,panic:0}]);const id=K().fish()[0].id;__pe('pointerdown',61,33);const sp=__fish(id).panic;K().sim(1);__only([{k:'wakin',L:5,x:5,y:5,h:0,panic:0}]);__pe('pointerup',61,33);K().sim(1);o.splash=sp;
            o.ok=o.frontFast.fled&&!o.behindFast.fled&&!o.frontSlow.fled&&o.splash===1&&!o.frontFast.torn&&!o.behindFast.torn&&!o.frontSlow.torn;K().sim(30);return o}''')
        # ---------- soak / shear / heavy (these tear the three poi; game 1 ends) ----------
        C['soak'] = await pg.evaluate('''()=>{const o={};const g0=K().state().game;o.poi0=g0.poi;__only([{k:'wakin',L:5,x:10,y:10,h:0,panic:0}]);K().sim(30*40);   // dry the poi out between tests
            const n0=K().tears.length;o.wet0=+K().poi().wet.toFixed(4);__pe('pointerdown',100,50);let s=0;for(;s<600&&!(K().poi()||{}).torn;s++){__pe('pointermove',100,50);K().sim(1)}const t=K().tears[n0]||{};
            o.steps=s;o.want=Math.ceil(K().K.tau*Math.log((1-o.wet0)/.04)*30);o.why=t.why;o.wet=t.wet&&+t.wet.toFixed(4);o.poi1=K().state().game.poi;__pe('pointerup',100,50);K().sim(1);
            o.ok=t.why==='soak'&&Math.abs(s-o.want)<=2&&t.wet>=.96&&o.poi1===o.poi0-1;return o}''')
        C['shear'] = await pg.evaluate('''()=>{const o={};const pe=__pe;const drag=(spd,wait)=>{__only([{k:'wakin',L:5,x:110,y:60,h:0,panic:0}]);K().sim(30*40);const n0=K().tears.length;let x=20,y=20;pe('pointerdown',x,y);K().sim(1);
              for(let i=0;i<wait;i++){pe('pointermove',x,y);K().sim(1)}const w0=K().poi().wet;let torn=false;for(let i=0;i<40;i++){x+=spd/30;pe('pointermove',x,y);K().sim(1);if(K().poi().torn){torn=true;break}}
              const t=K().tears[n0];if(!torn){pe('pointerup',x,y);K().sim(1)}return{spd,wet0:+w0.toFixed(3),torn,why:t&&t.why,v:t&&+t.v.toFixed(1),vmax:t&&t.vmax!=null?+t.vmax.toFixed(1):null}};
            o.fresh25=drag(25,0);o.fresh35=drag(35,0);o.soaked35=drag(35,300);o.poiAfter=K().state().game.poi;
            o.ok=!o.fresh25.torn&&!o.fresh35.torn&&o.soaked35.torn&&o.soaked35.why==='shear';return o}''')
                # the third poi: fast drag tears it (game 1 ends)
        C['shear']['fast'] = await pg.evaluate('''()=>{K().sim(30*40);const n0=K().tears.length;let x=10,y=30;__pe('pointerdown',x,y);K().sim(1);let torn=false;for(let i=0;i<20;i++){x+=100/30;__pe('pointermove',x,y);K().sim(1);if((K().poi()||{}).torn){torn=true;break}}
            const t=K().tears[n0];return{torn,why:t&&t.why,v:t&&+t.v.toFixed(1),vmax:t&&t.vmax!=null?+t.vmax.toFixed(1):null,stage:K().state().game&&K().state().game.stage}}''')
        C['shear']['ok'] = C['shear']['ok'] and C['shear']['fast']['torn'] and C['shear']['fast']['why'] == 'shear'
        # ---------- over: the result, pick 2, take home ----------
        C['over'] = await pg.evaluate('''async()=>{const o={},g=K().state().game;o.stage=g&&g.stage;o.caught=g&&g.caught.length;o.pick0=g&&g.pick.slice();K().render();__draw();
            const tap=(i)=>{const c=K().cellClient(i);__cv().dispatchEvent(new PointerEvent('pointerdown',{clientX:c.x,clientY:c.y,pointerId:2,bubbles:true}))};
            tap(o.pick0[0]);tap(o.pick0[1]);o.pickNone=K().state().game.pick.length;tap(0);tap(3);o.pick2=K().state().game.pick.slice();tap(5);o.pick3=K().state().game.pick.slice();
            o.homeBtn=!document.querySelector('#kgy-box button[data-act="home"]').hidden;o.click=K().click('home');const s=K().state();o.bowl=s.bowl.map(f=>f.k+':'+f.L);o.game=s.game;o.best=s.best;o.open=K().open();
            o.ok=o.stage==='result'&&o.caught===7&&o.pick0.length===2&&o.pickNone===0&&o.pick2.join()==='0,3'&&o.pick3.join()==='0,3'&&o.homeBtn&&o.click&&s.bowl.length===2&&!o.game&&o.best===7&&!o.open;return o}''')
        if SHOTS: os.makedirs(SHOTS, exist_ok=True)
        # ---------- heavy (game 2) ----------
        C['heavy'] = await pg.evaluate('''async()=>{const o={},cf=K().cfg,d0=__deb().length;__at(cf.spot.x,cf.spot.z);__T(3);window.__dt+=61000;await __interact();K().manual=true;o.debit=__deb().length-d0;
            o.w=K().weight(9);K().sim(30*40);const r1=__scoop({k:'big',L:9},6);o.fresh={res:r1.res,wet:+(r1.wet||0).toFixed(3),load:+(r1.load||0).toFixed(2),cap:+(r1.cap||0).toFixed(2)};K().sim(30*40);
            const r2=__scoop({k:'big',L:9},6,75);o.wet={res:r2.res,wet:+(r2.wet||0).toFixed(3),load:+(r2.load||0).toFixed(2),cap:+(r2.cap||0).toFixed(2)};K().sim(30*40);
            // the same wet poi lifts a small fish: it is the weight that tears it
            const r3=__scoop({k:'wakin',L:5},6,75);o.wetSmall={res:r3.res,wet:+(r3.wet||0).toFixed(3),load:+(r3.load||0).toFixed(2),cap:+(r3.cap||0).toFixed(2)};K().sim(30*40);
            // and a medium fish: fresh lifts it, ~6 s soaked tears
            const r4=__scoop({k:'ryukin',L:7.5},6,180);o.soakedMed={res:r4.res,wet:+(r4.wet||0).toFixed(3),load:+(r4.load||0).toFixed(2),cap:+(r4.cap||0).toFixed(2)};
            o.poi=K().state().game.poi;o.ok=o.debit===1&&o.fresh.res==='caught'&&o.wet.res==='tear'&&o.wetSmall.res==='caught'&&o.soakedMed.res==='tear'&&o.wet.wet>.5;return o}''')
        if SHOTS:
            await pg.evaluate('''()=>{__only([{k:'wakin',L:5.5,x:30,y:20,h:.4},{k:'kohaku',L:5.8,x:52,y:40,h:2.6},{k:'demekin',L:6.6,x:80,y:22,h:3.6},{k:'ryukin',L:7.2,x:95,y:46,h:5},{k:'big',L:9,x:66,y:30,h:1.2},{k:'wakin',L:4.9,x:40,y:50,h:-.6},{k:'wakin',L:5.1,x:15,y:40,h:.2}]);__pe('pointerdown',58,34);K().sim(6);__pe('pointermove',62,32);K().sim(3);K().render()}''')
            await pg.screenshot(path=os.path.join(SHOTS, 'kingyo_panel_seed%d.png' % SEED))
            await pg.evaluate("()=>{__pe('pointerup',62,32);K().sim(1)}")
        # ---------- resume: CLOSE and a punch keep the paid game ----------
        C['resume'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=K().cfg;for(const n of crowd)if(n&&n._rec)n.prov=0;const g0=K().state().game;o.poi0=g0.poi;o.c0=g0.caught.length;const d0=__deb().length,b0=e.summary().available;
            o.click=K().click('close');o.closed=!K().open();o.kept=!!K().state().game;o.prompt=(__near()||{}).label;await __interact();o.reopen=K().open();K().manual=true;
            S[0].hp-=5;__T(3);o.why=(K().log.filter(x=>x.ev==='close').slice(-1)[0]||{}).why;S[0].hp+=5;o.closedFight=!K().open();__T(60);for(let w=0;w<600&&!(S[0].st==='idle'||S[0].st==='walk');w++)tick();
            __at(cf.spot.x,cf.spot.z);__T(5);window.__dt+=61000;await __interact();K().manual=true;const g1=K().state().game;o.resumed=K().open();o.same=g1&&g1.poi===o.poi0&&g1.caught.length===o.c0;o.noCharge=__deb().length===d0&&e.summary().available===b0;
            __at(cf.spot.x+3.5,cf.spot.z);__T(1);await __sleep(500);o.walkOff=!K().open();__at(cf.spot.x,cf.spot.z);__T(3);await __interact();K().manual=true;
            o.ok=o.click&&o.closed&&o.kept&&/finish your game/.test(o.prompt||'')&&o.reopen&&o.why==='fight'&&o.closedFight&&o.resumed&&o.same&&o.noCharge&&o.walkOff&&K().open();return o}''')
        # finish game 2: tear the remaining poi, take home 2 (bowl 4)
        await pg.evaluate('''()=>{for(let k=0;k<5&&K().state().game&&K().state().game.stage==='play';k++){K().sim(30);let x=10,y=30;__pe('pointerdown',x,y);K().sim(1);for(let i=0;i<20&&!(K().poi()||{}).torn;i++){x+=100/30;__pe('pointermove',x,y);K().sim(1)}}K().click('home')}''')
        # ---------- the bowl: 4th game lets the oldest go; drawn in the house ----------
        C['bowl'] = await pg.evaluate('''async()=>{const o={};const play=async()=>{const cf=K().cfg;__at(cf.spot.x,cf.spot.z);__T(3);window.__dt+=61000;await __interact();K().manual=true;
              for(let j=0;j<2;j++){K().sim(30*40);__scoop({k:'wakin',L:5+j*.3},6);K().sim(10)}
              for(let k=0;k<5&&K().state().game.stage==='play';k++){K().sim(30);let x=10,y=30;__pe('pointerdown',x,y);K().sim(1);for(let i=0;i<20&&!(K().poi()||{}).torn;i++){x+=100/30;__pe('pointermove',x,y);K().sim(1)}}K().click('home')};
            o.b0=K().state().bowl.length;const first=JSON.stringify(K().state().bowl[0]);await play();o.b1=K().state().bowl.length;await play();o.b2=K().state().bowl.length;o.oldestGone=!K().state().bowl.some(f=>JSON.stringify(f)===first);
            const B=K().cfg.bowlSpot;__at(B.x,B.z);__T(3);o.inside=_insideRoom();o.prompt=(__near()||{}).label;const d0=K().stats.bowlDrawn;__draw();o.drawn=K().stats.bowlDrawn-d0;await __interact();o.toast=K().lastToast;
            __at(K().cfg.spot.x,K().cfg.spot.z);__T(3);const d1=K().stats.bowlDrawn;__draw();o.notOutside=K().stats.bowlDrawn===d1;
            o.ok=o.b0===4&&o.b1===6&&o.b2===6&&o.oldestGone&&o.inside==='house'&&o.prompt==='Goldfish bowl (6)'&&o.drawn===1&&/^Your goldfish: /.test(o.toast||'')&&o.notOutside;return o}''')
        C['sky'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=K().cfg;__at(cf.spot.x,cf.spot.z);__T(5);const d0=__deb().length,b0=e.summary().available;HIT_SKY.on=true;__T(3);
            o.prompt=K().prompt();window.__dt+=61000;const r=await K().play();o.code=r.code;o.noCharge=__deb().length===d0&&e.summary().available===b0;HIT_SKY.on=false;__T(3);
            o.ok=!o.prompt&&o.code==='area'&&o.noCharge&&!K().open();return o}''')
        pre = await pg.evaluate('''async()=>{const cf=K().cfg;__at(cf.spot.x,cf.spot.z);__T(3);window.__dt+=61000;await __interact();K().manual=true;K().sim(30*40);__scoop({k:'kohaku',L:5.4},6);
            K().sim(10);let x=10,y=30;__pe('pointerdown',x,y);K().sim(1);for(let i=0;i<20&&!(K().poi()||{}).torn;i++){x+=100/30;__pe('pointermove',x,y);K().sim(1)}K().click('close');
            return{st:K().state(),lifts:K().lifts,tears:K().tears}}''')
        lifts = pre['lifts']; tears = pre['tears']
        await pg.reload(); await boot(pg)
        C['reload'] = await pg.evaluate('''(pre)=>{const s=K().state();const o={bowl:JSON.stringify(s.bowl)===JSON.stringify(pre.bowl),game:!!s.game&&s.game.poi===pre.game.poi&&s.game.caught.length===pre.game.caught.length&&s.game.poi===2&&s.game.caught.length===1,prompt:(()=>{const cf=K().cfg;__at(cf.spot.x,cf.spot.z);__T(3);return(__near()||{}).label})()};
            o.ok=o.bowl&&o.game&&/finish your game/.test(o.prompt||'')&&s.bowl.length===6;return o}''', pre['st'])
        C['python'] = rejudge(lifts, tears)
        C['python']['ok'] = C['python']['mismatches'] == 0 and C['python']['lifts'] >= 12 and C['python']['tears'] >= 8
        C['audit'] = await pg.evaluate('''async()=>{await __interact();K().manual=true;__draw();const a=HIT_DC.eco.audit(),d=__deb(),s=K().state();K().close();
            const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error).slice(0,200);
            return{audit:a,debits:d.length,games:s.games,allTen:d.every(x=>x.amt===10),mods,drawErr:__drawErr,ok:a.ok&&d.length===s.games&&d.every(x=>x.amt===10)&&!Object.keys(mods).length&&!__drawErr}}''')
        C['errors'] = {'page': errs[:10], 'ok': not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values() if isinstance(v, dict) and 'ok' in v)
    print(json.dumps(out, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))

asyncio.run(main())
