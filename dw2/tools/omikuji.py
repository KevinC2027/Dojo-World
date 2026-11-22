"""Omikuji test (Step 17 gate).  Usage:
  python3 -I dw2/tools/omikuji.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red reaches the stand and the rack by the on-screen joystick
(H0.ax/H0.az, camera yaw 0) from the torii; the draw is driven only through the player's paths: INTERACT (_updateNear/_doInteract) and
the panel's real buttons (HIT_OMIKUJI.click -> button.click()). A test clock (Date.now + offset) steps 61 s between draws (ledger rate
limit) and a day forward for the daily cap.
  walk      from the torii (48, 8.6) Red walks to the stand spot and to the rack spot with the joystick; like the shrine's
            offering box the stand and rack add no collision solid (none in WORLD.solids; Red is never lifted onto them)
  short     a short pouch: INTERACT refuses with nothing charged (balance and ledger unchanged), no panel
  draw      INTERACT -> exactly one 10 DC 'hire' debit (place 'shrine', price from DC_CONFIG), coins fly, the panel opens at SHAKE;
            SHAKE x3 -> stick; TAKE -> the slip for that stick; KEEP -> fortune book; the prompt and the book count agree
  carry     a second draw -> TIE IT ON THE RACK: slip in Red's hand (drawn at the hand), a new draw at the stand is refused (no charge),
            walking to the rack and INTERACT ties it: one more knot on the rack
  resume    a third draw: a punch mid-shake closes the panel, the paid stick is kept; INTERACT resumes with no second debit, same stick;
            CLOSE mid-slip also keeps it
  daily     a fourth draw the same day is refused before any charge; the next day it works again
  sky       the coliseum refuses with nothing charged
  table     3,200 sticks drawn by the stand's own sampler: grade shares within +-2.5 points of the 32-stick table; every stick's slip is
            fixed (same lines each time), bad grades are exactly Curse / Great curse
  reload    book, knots, pending draw and hand survive a reload
  audit     eco.audit() clean; debits = draws paid; no HIT_* module errors, no page errors; draw() runs in every panel state"""
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
window.__walk=(x,z,tol)=>{let d=99,i=0;for(;i<900&&d>(tol||.25);i++)d=__steer(x,z);H0.ax=H0.az=0;__T(20);return{d:+Math.hypot(x-S[0].x,z-S[0].z).toFixed(2),ticks:i}};
window.__drawErr=null;window.__draw=()=>{try{draw()}catch(e){__drawErr=String(e)}};
window.__sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
window.__deb=()=>HIT_DC.eco.history(1e6).filter(x=>x.t==='d'&&x.src==='hire'&&x.meta&&x.meta.item==='omikuji');
window.__interact=async()=>{const n=__near();if(!n)return{label:null};_doInteract();for(let i=0;i<40&&HIT_OMIKUJI.paying;i++)await __sleep(25);await __sleep(60);return{label:n.label,act:n.act}};0'''
TORII = [48, 8.6]

async def boot(pg):
    await pg.wait_for_function('window.HIT_OMIKUJI&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- walking there; solids ----------
        C['walk'] = await pg.evaluate('''(T)=>{const o={};const cf=HIT_OMIKUJI.cfg;__at(T[0],T[1]);__T(20);o.stand=__walk(cf.standSpot.x,cf.standSpot.z);o.standPrompt=(__near()||{}).label;
            __at(T[0],T[1]);__T(20);o.rack=__walk(cf.rackSpot.x,cf.rackSpot.z);o.rackPrompt=(__near()||{}).label;
            // walk straight across each, and across the shrine's own offering box: Red stays on the ground (no solid to climb)
            const cross=(x,z)=>{__at(x,z-1.2);__T(5);let my=0;for(let i=0;i<120;i++){cam.yaw=0;H0.ax=0;H0.az=-1;tick();if(Math.abs(S[0].z-z)<.25)my=Math.max(my,S[0].y||0)}H0.ax=H0.az=0;return +my.toFixed(2)};
            o.solids=WORLD.solids.filter(q=>q.p&&/^omk/.test(q.p.k)).length;o.nSolids=WORLD.solids.length;o.climbY={offeringBox:cross(48,13.2),stand:cross(cf.stand.x,cf.stand.z),rack:cross(cf.rack.x,cf.rack.z)};
            o.ok=o.stand.d<.3&&o.rack.d<.3&&/Draw a fortune/.test(o.standPrompt||'')&&/Musubi rack/.test(o.rackPrompt||'')&&o.solids===0&&o.climbY.stand===0&&o.climbY.rack===0&&o.climbY.offeringBox===0;return o}''', TORII)
        # ---------- a short pouch ----------
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(let k=0;k<5;k++){window.__dt+=61000;await HIT_SHOP.buy('cake','bakery')}
            for(let k=0;k<20&&e.summary().available>=10;k++){window.__dt+=61000;await HIT_SHOP.buy('eggs','stand')}
            const cf=HIT_OMIKUJI.cfg;__at(cf.standSpot.x,cf.standSpot.z);__T(5);const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await __interact();
            o.avail=b0;o.label=r.label;o.code=(HIT_OMIKUJI.last||{}).code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.panel=!!document.getElementById('omk-pan');o.pending=HIT_OMIKUJI.state().pending;
            o.ok=b0<10&&o.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.panel&&!o.pending;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- draw -> keep ----------
        C['draw'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=HIT_OMIKUJI.cfg,it=HIT_DC.config.hire.items.find(x=>x.id==='omikuji');o.price=it.price;
            __at(cf.standSpot.x,cf.standSpot.z);__T(5);const b0=e.summary().available,c0=(HIT_DC.int.coins?1:0);window.__dt+=61000;const r=await __interact();o.label=r.label;
            o.b0=b0;o.b1=e.summary().available;o.debits=__deb().map(x=>({amt:x.amt,place:x.meta.place}));const st=HIT_OMIKUJI.state();o.stage0=st.pending&&st.pending.stage;o.n=st.pending&&st.pending.n;
            o.panel=!!document.getElementById('omk-pan');o.shakeBtn=!document.querySelector('#omk-box button[data-act="shake"]').hidden;__draw();
            const steps=[];for(let k=0;k<3;k++){HIT_OMIKUJI.click('shake');steps.push(HIT_OMIKUJI.state().pending.stage)}o.steps=steps;__draw();
            o.take=HIT_OMIKUJI.click('take');const s=HIT_OMIKUJI.slip(o.n);o.grade=s.en;HIT_OMIKUJI.render();__draw();
            o.slipShown=HIT_OMIKUJI.state().pending.stage==='slip';o.keep=HIT_OMIKUJI.click('keep');const s2=HIT_OMIKUJI.state();o.book=s2.book;o.pendingAfter=s2.pending;o.panelAfter=!!document.getElementById('omk-pan');
            o.ok=o.b0-o.b1===it.price&&o.debits.length===1&&o.debits[0].amt===10&&o.debits[0].place==='shrine'&&o.stage0==='shake'&&o.panel&&o.shakeBtn&&steps.join()==='shake,shake,stick'&&o.take&&o.slipShown&&o.keep&&s2.book[o.n]===1&&!o.pendingAfter&&!o.panelAfter&&/Draw a fortune/.test(o.label)&&!__drawErr;return o}''')
        # ---------- draw -> carry -> tie ----------
        C['carry'] = await pg.evaluate('''async(T)=>{const e=HIT_DC.eco,o={},cf=HIT_OMIKUJI.cfg;__at(cf.standSpot.x,cf.standSpot.z);__T(5);window.__dt+=61000;await __interact();const n=HIT_OMIKUJI.state().pending.n;o.n=n;
            for(let k=0;k<3;k++)HIT_OMIKUJI.click('shake');HIT_OMIKUJI.click('take');o.carry=HIT_OMIKUJI.click('carry');o.hand=HIT_OMIKUJI.state().hand;
            const d0=__deb().length,b0=e.summary().available;window.__dt+=61000;o.again=await __interact();o.againCode=(HIT_OMIKUJI.log.filter(x=>x.ev==='refuse').slice(-1)[0]||{}).code;o.noCharge=__deb().length===d0&&e.summary().available===b0;
            HIT_OMIKUJI.drawnHand=0;const k0=HIT_OMIKUJI.knotSlots();__at(T[0],T[1]);__T(10);o.walk=__walk(cf.rackSpot.x,cf.rackSpot.z);__draw();o.handDrawn=HIT_OMIKUJI.drawnHand>0;
            const hp=HIT_OMIKUJI.handPt(),a=S[0];o.handDist=+Math.hypot(hp.x-a.x,hp.z-a.z).toFixed(2);o.prompt=(__near()||{}).label;await __interact();o.k1=HIT_OMIKUJI.knotSlots()-k0;const s=HIT_OMIKUJI.state();o.handAfter=s.hand;o.knots=s.knots.length;
            o.ok=o.carry&&o.hand&&o.hand.n===n&&o.againCode==='holding'&&o.noCharge&&o.walk.d<.3&&o.handDrawn&&o.handDist<1&&o.prompt==='Tie your slip on the rack'&&o.k1===1&&!o.handAfter&&o.knots===1;return o}''', TORII)
        # ---------- a fight mid-draw keeps the paid stick ----------
        C['resume'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=HIT_OMIKUJI.cfg;for(const n of crowd)if(n&&n._rec)n.prov=0;__at(cf.standSpot.x,cf.standSpot.z);__T(5);window.__dt+=61000;await __interact();const d1=__deb().length,b1=e.summary().available;
            const n=HIT_OMIKUJI.state().pending.n;HIT_OMIKUJI.click('shake');
            S[0].hp-=5;__T(3);o.why=(HIT_OMIKUJI.log.filter(x=>x.ev==='close').slice(-1)[0]||{}).why;S[0].hp+=5;
            o.closed=!document.getElementById('omk-pan');o.pend=HIT_OMIKUJI.state().pending;__T(60);for(let w=0;w<600&&!(S[0].st==='idle'||S[0].st==='walk');w++)tick();__at(cf.standSpot.x,cf.standSpot.z);__T(5);
            o.prompt=(__near()||{}).label;window.__dt+=61000;await __interact();const p=HIT_OMIKUJI.state().pending;o.resumed=!!document.getElementById('omk-pan');o.sameStick=p&&p.n===n;o.shakesKept=p&&p.shakes;o.noSecondCharge=__deb().length===d1&&e.summary().available===b1;
            HIT_OMIKUJI.click('shake');HIT_OMIKUJI.click('shake');HIT_OMIKUJI.click('take');HIT_OMIKUJI.click('close');o.closeKeeps=(HIT_OMIKUJI.state().pending||{}).stage;await __interact();o.reopen=(HIT_OMIKUJI.state().pending||{}).stage;HIT_OMIKUJI.click('keep');
            o.ok=o.why==='fight'&&o.closed&&o.pend&&o.pend.n===n&&/finish your draw/.test(o.prompt||'')&&o.resumed&&o.sameStick&&o.shakesKept===1&&o.noSecondCharge&&o.closeKeeps==='slip'&&o.reopen==='slip'&&!HIT_OMIKUJI.state().pending;return o}''')
        # ---------- daily cap ----------
        C['daily'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=HIT_OMIKUJI.cfg;__at(cf.standSpot.x,cf.standSpot.z);__T(5);o.draws=HIT_OMIKUJI.state().draws;o.prompt=(__near()||{}).label;const d0=__deb().length,b0=e.summary().available;
            window.__dt+=61000;await __interact();o.code=(HIT_OMIKUJI.log.filter(x=>x.ev==='refuse').slice(-1)[0]||{}).code;o.noCharge=__deb().length===d0&&e.summary().available===b0;
            window.__dt+=86400000;__T(2);o.prompt2=(__near()||{}).label;await __interact();o.nextDay=(HIT_OMIKUJI.state().pending||{}).stage;o.charged=__deb().length-d0;
            for(let k=0;k<3;k++)HIT_OMIKUJI.click('shake');HIT_OMIKUJI.click('take');HIT_OMIKUJI.click('keep');
            o.ok=o.draws===3&&/back tomorrow/.test(o.prompt)&&o.code==='daily'&&o.noCharge&&/Draw a fortune/.test(o.prompt2)&&o.nextDay==='shake'&&o.charged===1;return o}''')
        # ---------- coliseum ----------
        C['sky'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},cf=HIT_OMIKUJI.cfg;__at(cf.standSpot.x,cf.standSpot.z);__T(5);const d0=__deb().length,b0=e.summary().available;HIT_SKY.on=true;__T(3);
            o.prompt=HIT_OMIKUJI.prompt();window.__dt+=61000;const r=await HIT_OMIKUJI.draw();o.code=r.code;o.noCharge=__deb().length===d0&&e.summary().available===b0;HIT_SKY.on=false;__T(3);
            o.ok=!o.prompt&&o.code==='area'&&o.noCharge;return o}''')
        # ---------- the grade table ----------
        C['table'] = await pg.evaluate('''()=>{const O=HIT_OMIKUJI,G=O.GRADES,cnt=G.map(()=>0),N=3200;for(let i=0;i<N;i++){const n=O.drawStick();cnt[O.ORDER[n-1]]++}
            const rows=G.map((g,i)=>({g:g.en,want:+(g.n/32*100).toFixed(1),got:+(cnt[i]/N*100).toFixed(1)}));
            let fixed=true,bad=[];for(let n=1;n<=32;n++){const a=JSON.stringify(O.slip(n)),b=JSON.stringify(O.slip(n));if(a!==b)fixed=false;if(O.slip(n).bad)bad.push(O.slip(n).en)}
            const range=[...Array(32)].every((_,k)=>O.slip(k+1).lines.length===5);
            return{rows,fixed,badKinds:[...new Set(bad)],range,ok:rows.every(r=>Math.abs(r.got-r.want)<=2.5)&&fixed&&range&&[...new Set(bad)].sort().join()==='Curse,Great curse'}}''')
        # ---------- reload keeps everything ----------
        pre = await pg.evaluate('''async()=>{const cf=HIT_OMIKUJI.cfg;__at(cf.standSpot.x,cf.standSpot.z);__T(5);window.__dt+=61000;await __interact();HIT_OMIKUJI.click('shake');HIT_OMIKUJI.click('close');return HIT_OMIKUJI.state()}''')
        await pg.reload(); await boot(pg)
        C['reload'] = await pg.evaluate('''(pre)=>{const s=HIT_OMIKUJI.state();const o={book:JSON.stringify(s.book)===JSON.stringify(pre.book),knots:s.knots.length===pre.knots.length,pending:s.pending&&pre.pending&&s.pending.n===pre.pending.n&&s.pending.shakes===1};
            o.ok=o.book&&o.knots&&o.pending&&s.knots.length>=1;return o}''', pre)
        C['audit'] = await pg.evaluate('''()=>{const a=HIT_DC.eco.audit(),d=__deb(),s=HIT_OMIKUJI.state();HIT_OMIKUJI.openBook();__draw();const book=HIT_OMIKUJI.bookShown();HIT_OMIKUJI.close();
            const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error).slice(0,200);
            return{audit:a,debits:d.length,paidDraws:s.total,allTen:d.every(x=>x.amt===10),book,mods,drawErr:__drawErr,ok:a.ok&&d.length===s.total&&d.every(x=>x.amt===10)&&book&&!Object.keys(mods).length&&!__drawErr}}''')
        C['errors'] = {'page': errs[:10], 'ok': not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    print(json.dumps(out, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))

asyncio.run(main())
