"""Photo walk test (Step 24 gate).  Usage:
  python3 -I dw2/tools/photo.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick() and draw(). Red moves with the joystick (H0.ax/H0.az, camera yaw 0)
or is placed on open ground before a walk; the camera is used only through the player's buttons (HIT_PHOTO.input.camera / snap / album /
away, the same functions the CAMERA / SNAP / ALBUM / PUT AWAY buttons call). A shot is taken at the end of a real draw() (the frame is copied
from the game canvas). Loaded with ?gpu=0 (the 2D canvas is the picture either way).
  shop      no camera: CAMERA refused ('none'); a short pouch refuses it with nothing charged; buying through the general store panel posts one
            40 DC 'shop' debit (price from DC_CONFIG), the row shows OWNED, a second buy is refused, never in the gift bag, audit clean, owned
            after a reload
  sights    all 12 sights: a viewpoint is found south of the sight (open ground), Red walks the last 6 m to it with the joystick, raises the
            camera, SNAPs: the sight is logged, the photo is a real picture (not blank), the album count goes up by one
  refused   the same sights from wrong viewpoints: out of frame, too small (far), hidden behind a building (found by search: a viewpoint where
            it is in frame and big enough but the eye's rays hit building volumes), behind Red, too far, from indoors: SNAP saves a photo
            but logs nothing
  python    every shot of the run re-judged in Python from the recorded view (eye, frame, projection, Red) and the exported building volumes:
            in-frame share, size share, visible share and the verdict for all 12 sights match the game's
  camera    the game camera is the same with the camera up and down (mx, mz, D, zoom, yaw, height); pinch zoom still changes the size share
  album     the album and the sight log survive a reload; 30 more shots keep only the last 24 photos, the 12 log entries stay, storage stays under
            the cap; DELETE in the panel removes a photo; the panel lists 12 sights
  pack      a hit taken, a punch, the coliseum, the bus, swimming put it away; the net or the kite out refuses it
  walk      the joystick walks Red the same distance with the camera up as without it
  errors    no HIT_* module errors, no page errors"""
import asyncio, json, sys, os, math
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;a.fx=0;a.fz=1;};
window.__steer=(x,z,m)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;H0.ax=dx/d*(m||1);H0.az=-dz/d*(m||1);tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__walk=(x,z)=>{let d=1e9,n=0;for(;n<900;n++){d=__steer(x,z,d>1.5?1:.35);if(d<.25)break}H0.ax=H0.az=0;__T(40);return{d:+Math.hypot(x-S[0].x,z-S[0].z).toFixed(3),n}};
window.__ok=(x,z)=>{for(const s of WORLD.solids)if(s.h>.3&&x>s.x0-.6&&x<s.x1+.6&&z>s.z0-.6&&z<s.z1+.6)return false;try{if(HIT_ROADS.inDrive(x,z))return false}catch(e){}try{if((HIT_WATER.depthAt(x,z)||0)>0)return false}catch(e){}return true};
window.__settle=()=>{for(let w=0;w<600&&!(S[0].st==='idle'||S[0].st==='walk');w++)tick();__T(4)};
window.__reset=()=>{H0.ax=H0.az=0;if(HIT_PHOTO.st()!=='off')HIT_PHOTO.away('test');HIT_PHOTO.closeAlbum();if(window.HIT_BUGS&&HIT_BUGS.st()!=='off')HIT_BUGS.pack('test');if(window.HIT_KITE&&HIT_KITE.st()!=='off')HIT_KITE.pack('test');cam.zm=1;__T(2)};
window.__shot=()=>{const n0=HIT_PHOTO.log.filter(e=>e.e==='shot').length;HIT_PHOTO.input.snap();draw();__T(2);const s=HIT_PHOTO.log.filter(e=>e.e==='shot');return s.length>n0?s[s.length-1]:null};
// a viewpoint for sight s with verdict v (judged with the camera up after the camera has settled)
window.__find=(id,want,opt)=>{const s=HIT_PHOTO.SIGHTS.find(q=>q.id===id);opt=opt||{};const ds=opt.ds||[];if(!ds.length)for(let d=8;d<=56;d+=2)ds.push(d);const dxs=opt.dxs||[0,-4,4,-8,8,-12,12,-16,16];
  for(const d of ds)for(const dx of dxs){const x=s.x+dx,z=s.z-d;if(!__ok(x,z)||!__ok(x,z-6))continue;__at(x,z);__T(70);const j=HIT_PHOTO.judge(id);if(j.v===want)return{x,z,j:{v:j.v,inFrac:j.inFrac,share:j.share,visFrac:j.visFrac,dRed:j.dRed}}}return null};
0'''

async def boot(pg):
    await pg.wait_for_function('window.HIT_PHOTO&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP', timeout=30000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

# ---------- the Python re-judge ----------
def hits(E, T, o):
    t0, t1 = 0.0, .999
    for p, d, lo, hi in ((E[0], T[0] - E[0], o[0], o[1]), (E[1], T[1] - E[1], 0, o[4]), (E[2], T[2] - E[2], o[2], o[3])):
        if abs(d) < 1e-9:
            if p < lo or p > hi: return False
            continue
        a, b = (lo - p) / d, (hi - p) / d
        if a > b: a, b = b, a
        t0 = max(t0, a); t1 = min(t1, b)
        if t0 >= t1: return False
    return True
def rejudge(view, s, occ, cfg):
    c = view['cam']; W, H = view['W'], view['H']; F = view['frame']; E = view['eye']; yw = c['yaw']
    Fp = min(W * 1.5, H * 1.55) * (1.3 if W > H else 1)
    def P(x, y, z):
        rx, rz = x - c['mx'], z - c['mz']; cc, ss = math.cos(yw), math.sin(yw)
        a = rx * cc + rz * ss; dp = -rx * ss + rz * cc; k = Fp / max(2, (c['D'] + dp) / c['zm'])
        return (W / 2 + a * k + view['ox'] + c['px'] + c['sx'], H * .4 + (c['h'] - y) * k + view['oy'] + c['py'] + c['vy'], dp)
    rx, rz = math.cos(yw), math.sin(yw)
    if s.get('pts'): pts = [(s['x'] + dx, y, s['z'] + dz) for dx, y, dz in s['pts']]
    else:
        pts = [(s['x'], s['y1'] * f, s['z']) for f in (.12, .32, .52, .72, .9)]
        for sg in (-1, 1):
            for f in (.2, .5): pts.append((s['x'] + rx * s['hw'] * .6 * sg, s['y1'] * f, s['z'] + rz * s['hw'] * .6 * sg))
    near = -c['D'] + 1; inF = vis = 0; Ev = (E['x'], E['y'], E['z'])
    own = s['own']
    for t in pts:
        q = P(*t)
        if q[2] > near and F['x'] <= q[0] <= F['x'] + F['w'] and F['y'] <= q[1] <= F['y'] + F['h']:
            inF += 1
            ok = True
            for o in occ:
                if o[1] > own[0] and o[0] < own[1] and o[3] > own[2] and o[2] < own[3]: continue
                if o[0] < Ev[0] < o[1] and o[2] < Ev[2] < o[3] and Ev[1] < o[4]: continue
                if hits(Ev, t, o): ok = False; break
            if ok: vis += 1
    qb, qt = P(s['x'], 0, s['z']), P(s['x'], s['y1'], s['z'])
    ql, qr = P(s['x'] - rx * s['hw'], s['y1'] * .5, s['z'] - rz * s['hw']), P(s['x'] + rx * s['hw'], s['y1'] * .5, s['z'] + rz * s['hw'])
    front = qb[2] > near
    share = (max(abs(qb[1] - qt[1]), abs(qr[0] - ql[0]) * .5) if front else 0) / F['h']
    inFrac = inF / len(pts); visFrac = vis / inF if inF else 0
    R = view['red']; dpR = -(R['x'] - E['x']) * math.sin(yw) + (R['z'] - E['z']) * math.cos(yw); dpS = -(s['x'] - E['x']) * math.sin(yw) + (s['z'] - E['z']) * math.cos(yw)
    dR = math.hypot(s['x'] - R['x'], s['z'] - R['z'])
    if dpS < 1 or dpS > 260: return {'v': 'inside' if view['inside'] else 'off', 'inFrac': 0, 'share': 0, 'visFrac': 0}
    if view['inside']: v = 'inside'
    elif dpS < dpR - 4: v = 'behind'
    elif dR > s['range']: v = 'far'
    elif not front or inFrac < cfg['inFrac']: v = 'off'
    elif share < s['min']: v = 'small'
    elif visFrac < cfg['visFrac']: v = 'hidden'
    else: v = 'ok'
    return {'v': v, 'inFrac': round(inFrac, 3), 'share': round(share, 3), 'visFrac': round(visFrac, 3)}

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        url = 'file://' + FILE + '?gpu=0'
        await pg.goto(url); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- shop ----------
        C['nocam'] = await pg.evaluate('''()=>{__at(-48,-24);__T(20);HIT_PHOTO.input.camera();__T(3);const r=HIT_PHOTO.log.filter(e=>e.e==='refused').slice(-1)[0];return{why:r&&r.why,st:HIT_PHOTO.st(),ok:!!r&&r.why==='none'&&HIT_PHOTO.st()==='off'}}''')
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(const [it,sh] of [['cake','bakery'],['cake','bakery'],['cake','bakery'],['cake','bakery'],['cake','bakery'],['flowers','general']]){window.__dt+=61000;await HIT_SHOP.buy(it,sh)}
            while(e.summary().available>=40){window.__dt+=61000;const r=await HIT_SHOP.buy('melonpan','bakery');if(!r.ok)break}
            const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await HIT_SHOP.buy('camera','general');o.avail=b0;o.code=r.code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.owned=HIT_PHOTO.owned(true);
            o.ok=b0<40&&r.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.owned;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        C['buy'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};const it=HIT_DC.config.shop.items.find(x=>x.id==='camera');o.price=it.price;o.b0=e.summary().available;
            __at(-30,-24);__T(5);HIT_SHOP.open('general',S[0].x,S[0].z);await new Promise(r=>setTimeout(r,100));const btn=document.querySelector('#shop-box button[data-item="camera"]');o.btn0=btn&&btn.textContent;btn.click();
            for(let i=0;i<40&&HIT_SHOP.busy!==false||i<3;i++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,200));
            o.b1=e.summary().available;const deb=e.history(1e6).filter(x=>x.t==='d'&&x.src==='shop'&&x.meta&&x.meta.item==='camera');o.debits=deb.map(x=>({amt:x.amt,shop:x.meta.shop}));o.flown=(HIT_SHOP.log.slice(-1)[0]||{}).price;
            const btn2=document.querySelector('#shop-box button[data-item="camera"]');o.btn1=btn2&&btn2.textContent;o.btn1dis=btn2&&btn2.disabled;
            window.__dt+=61000;const r2=await HIT_SHOP.buy('camera','general');o.second=r2.code;o.b2=e.summary().available;o.bag=HIT_SHOP.bag.map(x=>x.item);o.audit=e.audit();
            document.querySelectorAll('#shop-pan').forEach(x=>x.remove());HIT_SHOP.panel=null;o.owned=HIT_PHOTO.owned(true);
            o.ok=o.b0-o.b1===it.price&&it.price===40&&o.debits.length===1&&o.debits[0].amt===it.price&&o.debits[0].shop==='general'&&o.flown===it.price&&o.btn1==='OWNED'&&o.btn1dis&&o.second==='owned'&&o.b2===o.b1&&!o.bag.includes('camera')&&o.audit.ok&&o.owned;return o}''')
        await pg.reload(); await boot(pg)
        C['buy']['ownedAfterReload'] = await pg.evaluate('HIT_PHOTO.owned(true)'); C['buy']['ok'] = C['buy']['ok'] and C['buy']['ownedAfterReload']
        sights = json.loads(await pg.evaluate('JSON.stringify(HIT_PHOTO.SIGHTS)'))
        cfg = await pg.evaluate('HIT_PHOTO.cfg')
        # ---------- every sight from a real viewpoint ----------
        res = {}
        for s in sights:
            r = await pg.evaluate('''(id)=>{__reset();const f=__find(id,'ok');if(!f)return{err:'no viewpoint'};
                // start 6 m further south on open ground and walk in with the joystick
                let st=null;for(const dz of [6,5,4,3]){if(__ok(f.x,f.z-dz)){st=[f.x,f.z-dz];break}}if(st){__at(st[0],st[1]);__T(80);}else{__at(f.x,f.z);__T(80)}
                const w=st?__walk(f.x,f.z):{d:0,n:0};__settle();HIT_PHOTO.input.camera();__T(20);const up=HIT_PHOTO.st();const n0=HIT_PHOTO.count(),a0=HIT_PHOTO.album().photos.length;
                const sh=__shot();const L=HIT_PHOTO.album().log[id];const ph=HIT_PHOTO.album().photos.slice(-1)[0];
                return{at:[+S[0].x.toFixed(2),+S[0].z.toFixed(2)],view:f,walk:w,up,logged:!!L&&sh&&sh.got.includes(id),fresh:sh&&sh.fresh,count:[n0,HIT_PHOTO.count()],photos:[a0,HIT_PHOTO.album().photos.length],
                  bytes:sh&&sh.bytes,lum:sh&&sh.lum,place:ph&&ph.place,msg:HIT_PHOTO.lastMsg}}''', s['id'])
            r['ok'] = bool(r.get('logged')) and r.get('up') == 'up' and r['photos'][1] >= min(24, r['photos'][0] + 1) and (r.get('bytes') or 0) > 3000 and (r.get('lum') or {}).get('sd', 0) > 8
            res[s['id']] = r
        C['sights'] = {'per': res, 'logged': await pg.evaluate('HIT_PHOTO.count()'), 'ok': all(v['ok'] for v in res.values()) and await pg.evaluate('HIT_PHOTO.count()') == 12}
        # ---------- refused viewpoints ----------
        ref = {}
        cases = [('windmill', 'off', {'dxs': [24, 28, -24, -28], 'ds': [10, 12, 14, 16]}), ('dojogate', 'small', {'dxs': [0, 2, -2], 'ds': [30, 32, 34, 36, 38, 40, 42, 44]}),
                 ('townhall', 'hidden', {}), ('silo', 'hidden', {}),
                 ('windmill', 'far', {'dxs': [0, 4, -4], 'ds': [52, 54, 56, 58, 60]}), ('dojogate', 'behind', {'dxs': [0, 2, -2], 'ds': [-6, -8, -10, -12]})]
        for sid, want, opt in cases:
            r = await pg.evaluate('''([id,want,opt])=>{__reset();const f=__find(id,want,opt);if(!f)return{err:'no viewpoint'};__settle();HIT_PHOTO.input.camera();__T(20);const n0=HIT_PHOTO.count();
                const lg=JSON.stringify(HIT_PHOTO.album().log[id]||null);const sh=__shot();const r=sh&&sh.res.find(q=>q.id===id);return{view:f,verdict:r&&r.v,logged:sh&&sh.got.includes(id),logSame:JSON.stringify(HIT_PHOTO.album().log[id]||null)===lg,msg:HIT_PHOTO.lastMsg,shot:sh&&sh.id}}''', [sid, want, opt])
            r['ok'] = r.get('verdict') == want and not r.get('logged') and r.get('logSame')
            ref[sid + ':' + want] = r
        # from indoors (Northfield inn lot): every sight 'inside'
        r = await pg.evaluate('''()=>{__reset();let room=null;for(const l of HIT_W192.lots){__at(l.x,l.z);__T(3);if(HIT_LIFE.insideId()){room=l.id;break}}__settle();HIT_PHOTO.input.camera();__T(10);const sh=__shot();
            return{room,up:HIT_PHOTO.st(),verdicts:sh&&[...new Set(sh.res.map(q=>q.v))],got:sh&&sh.got}}''')
        r['ok'] = bool(r.get('room')) and r.get('up') == 'up' and r.get('got') == [] and set(r.get('verdicts') or []) <= {'inside'}
        ref['indoors'] = r
        C['refused'] = {'per': ref, 'ok': all(v.get('ok') for v in ref.values())}
        # ---------- python re-judge of every shot ----------
        shots = json.loads(await pg.evaluate("JSON.stringify(HIT_PHOTO.log.filter(e=>e.e==='shot'))"))
        occ = await pg.evaluate('HIT_PHOTO.occ()')
        mism = []; n = 0; worst = 0
        for sh in shots:
            for r in sh['res']:
                s = next(q for q in sights if q['id'] == r['id']); py = rejudge(sh['view'], s, occ, cfg); n += 1
                d = max(abs(py['inFrac'] - r['inFrac']), abs(py['share'] - r['share']), abs(py['visFrac'] - r['visFrac'])); worst = max(worst, d)
                if py['v'] != r['v'] or d > .0015: mism.append({'shot': sh['id'], 'sight': r['id'], 'game': r, 'py': py})
        C['python'] = {'shots': len(shots), 'judged': n, 'mismatches': len(mism), 'first': mism[:3], 'maxDiff': round(worst, 4), 'occluders': len(occ), 'ok': len(shots) >= 15 and not mism}
        # ---------- the game camera is unchanged; pinch zoom acts as the lens ----------
        C['camera'] = await pg.evaluate('''()=>{__reset();__at(-6,-68);__T(400);const k=()=>JSON.stringify([cam.mx,cam.mz,cam.D,cam.zm,cam.yaw||0,cam.h]);const a=k();HIT_PHOTO.input.camera();__T(200);const b=k();
            const j1=HIT_PHOTO.judge('windmill');cam.zm=1.6;__T(1);const j2=HIT_PHOTO.judge('windmill');cam.zm=1;HIT_PHOTO.input.away();__T(200);const c=k();
            const same=(p,q)=>JSON.parse(p).every((v,i)=>Math.abs(v-JSON.parse(q)[i])<1e-3);return{down:a,up:b,downAgain:c,share:[j1.share,j2.share],ok:same(a,b)&&same(b,c)&&j2.share>j1.share*1.5}}''')
        # ---------- album: reload, cap, delete, panel ----------
        al0 = await pg.evaluate('JSON.stringify(HIT_PHOTO.album())')
        img0 = await pg.evaluate("(()=>{const a=HIT_PHOTO.album();return HIT_PHOTO.photoImg(a.photos[a.photos.length-1].id)})()")
        await pg.reload(); await boot(pg)
        al1 = await pg.evaluate('JSON.stringify(HIT_PHOTO.album())')
        img1 = await pg.evaluate("(()=>{const a=HIT_PHOTO.album();return HIT_PHOTO.photoImg(a.photos[a.photos.length-1].id)})()")
        cap = await pg.evaluate('''()=>{__reset();__at(-6,-68);__T(60);__settle();HIT_PHOTO.input.camera();__T(10);for(let i=0;i<30;i++){__shot();__T(3)}const a=HIT_PHOTO.album();
            HIT_PHOTO.input.album();const sl=document.querySelectorAll('#pho-panel .si').length,th=document.querySelectorAll('#pho-panel .grid img').length;const first=document.querySelector('#pho-panel .grid img');first.click();
            const big=!!document.querySelector('#pho-panel img.big');const id=HIT_PHOTO.albumView;document.querySelector('#pho-panel button.del').click();const after=HIT_PHOTO.album();
            HIT_PHOTO.closeAlbum();let raw=0;try{raw=(localStorage.getItem('dw2_photo_v1')||'').length}catch(e){}
            return{photos:a.photos.length,log:Object.keys(a.log).length,shots:a.shots,sightRows:sl,thumbs:th,big,deleted:id,afterDelete:after.photos.length,stillThere:after.photos.some(p=>p.id===id),logAfter:Object.keys(after.log).length,storedChars:raw,cap:HIT_PHOTO.cfg.maxChars}}''')
        C['album'] = {'reloadSame': al0 == al1, 'imgSame': img0 == img1 and bool(img0), **cap,
                      'ok': al0 == al1 and img0 == img1 and bool(img0) and cap['photos'] == 24 and cap['log'] == 12 and cap['sightRows'] == 12 and cap['thumbs'] == 24 and cap['big'] and cap['afterDelete'] == 23 and not cap['stillThere'] and cap['logAfter'] == 12 and 0 < cap['storedChars'] <= cap['cap']}
        # ---------- pack ----------
        C['pack'] = await pg.evaluate('''()=>{const Ph=HIT_PHOTO,o={ups:[]};const M=[-48,-24];const up=()=>{__reset();__at(M[0],M[1]);__settle();__T(10);Ph.input.camera();__T(5);o.ups.push(Ph.st()==='up')};
            const last=()=>(Ph.log.filter(e=>e.e==='away').slice(-1)[0]||{}).why;
            up();S[0].hp-=5;__T(3);o.hit={st:Ph.st(),why:last()};S[0].hp+=5;__T(30);
            up();press('p',1);__T(3);press('p',0);__T(10);o.punch={st:Ph.st(),why:last()};__T(60);
            up();HIT_SKY.on=true;__T(3);o.sky={st:Ph.st(),why:last()};const rs=Ph.up();o.skyUp=rs.code;HIT_SKY.on=false;__T(3);
            up();if(window.HIT_BUS){HIT_BUS.aboard=true;__T(3);o.bus={st:Ph.st(),why:last()};HIT_BUS.aboard=false;__T(3)}
            up();__at(42,51);__T(30);o.swim={st:Ph.st(),why:last(),swim:!!S[0]._swim};__at(M[0],M[1]);__T(60);
            __reset();__at(M[0],M[1]);__settle();const refused=[];
            if(window.HIT_KITE&&HIT_KITE.K){HIT_KITE.K.st='hand';refused.push(['kite',Ph.up().code]);HIT_KITE.K.st='off'}
            if(window.HIT_BUGS&&HIT_BUGS.N){HIT_BUGS.N.st='out';refused.push(['net',Ph.up().code]);HIT_BUGS.N.st='off'}
            o.refused=refused;up();Ph.input.away();o.away={st:Ph.st(),why:last()};
            o.ok=o.ups.every(u=>u)&&o.hit.st==='off'&&o.hit.why==='fight'&&o.punch.why==='fight'&&o.sky.why==='area'&&o.skyUp==='area'&&(!o.bus||o.bus.why==='bus')&&o.swim.why==='water'&&refused.every(q=>q[0]===q[1])&&refused.length===2&&o.away.st==='off';return o}''')
        # ---------- walk ----------
        C['walk'] = await pg.evaluate('''()=>{const run=(c)=>{__reset();__at(-48,-24);__T(30);__settle();if(c)HIT_PHOTO.input.camera();const x0=S[0].x,z0=S[0].z;for(let i=0;i<180;i++){cam.yaw=0;H0.ax=-1;H0.az=0;tick()}H0.ax=H0.az=0;__T(20);const d=Math.hypot(S[0].x-x0,S[0].z-z0);const st=HIT_PHOTO.st();__reset();return{d:+d.toFixed(4),st}};
            run(false);const a=run(false),b=run(true),c=run(false);return{without:a,with:b,withoutAgain:c,ok:b.st==='up'&&Math.abs(a.d-b.d)<.01*a.d+1e-3&&Math.abs(c.d-b.d)<.01*c.d+1e-3}}''')
        C['audit'] = await pg.evaluate('()=>{const a=HIT_DC.eco.audit();const n=HIT_DC.eco.history(1e6).filter(x=>x.meta&&x.meta.item==="camera").length;return{ok:a.ok&&n===1,cameraEntries:n,issues:(a.issues||[]).slice(0,5)}}')
        mods = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        C['errors'] = {'module': mods, 'page': errs[:10], 'ok': not mods and not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    s = json.dumps(out, indent=1); print(s)
    if OUT: open(OUT, 'w').write(s)
asyncio.run(main())
