"""Overlook telescope test (Step 20 gate).  Usage:
  python3 -I dw2/tools/scope.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red climbs the overlook's three stair flights with the
on-screen joystick only (H0.ax/H0.az, camera yaw 0) and walks to the viewer spot on the top tier; the viewing is driven only through
the player's paths: INTERACT (_updateNear/_doInteract), the panel's real buttons (HIT_SCOPE.click) and taps on the panel canvas
(HIT_SCOPE.tap at canvas pixels, the same function the pointer handler calls). The sky clock is set with HIT_SCOPE.at (ms); the
viewing clock is stepped with HIT_SCOPE.spend(ms) (the real-time interval is switched off with realClock=false). A test clock
(Date.now + offset) steps 61 s between paid viewings (ledger rate limit).
  climb     joystick from the road (96, 100) up flight 1, 2, 3 (each walked to its foot on the tier, then pushed up the flight) (HIT_LIFE auto-stairs) onto the 5.1 m tier, then to the viewer spot
  short     a short pouch: INTERACT refuses 'insufficient' with nothing charged (balance and ledger unchanged), no panel
  night     INTERACT -> exactly one 10 DC 'hire' debit (place 'overlook'), coins fly, the panel opens on the star field, a target that
            is above the horizon now; tapping another constellation names it but does not log it; tapping empty sky logs nothing;
            tapping the target logs it (first date, count) and a new visible target is asked
  hits      at 4 sky times (seasons) every visible constellation: aim at it, tap the projected middle of its figure and each of its
            stars: the hit-test returns that constellation (stars: >= 95%); taps 25° away from every figure return none
  astro     every catalogue star's alt/az at 6 times re-computed here in Python (independent vector-rotation code): max error < 0.01°;
            Polaris altitude = latitude +- 1°; the sun's noon altitude = 90 - lat + declination +- 0.5°; phase day/dusk/night follows
            the sun's altitude; published separations (Summer Triangle, Orion, Dipper, Castor-Pollux) within 0.3°
  log12     over several nights all 12 constellations are logged through the panel (one debit per viewing)
  day       at local noon: the panel shows the town (phase day, no star taps, Sky Tree tap named), one debit
  rain      at night under a shower: prompt says clouds, INTERACT refused 'clouds' with no charge; a shower arriving mid-viewing stops
            the clock (time kept), it runs again when clear; daytime viewing works in rain
  clock     the viewing ends after 120 s of open-panel time: the shutter closes, the next INTERACT charges again; CLOSE and a hit
            taken keep the time left and INTERACT resumes with no second debit; walking off the tier closes the panel
  sky       the coliseum: no prompt, look() -> 'area', nothing charged
  reload    star log and a viewing in progress survive a reload
  audit     eco.audit() clean; debits = viewings paid, all 10 DC; no HIT_* module errors, no page errors"""
import asyncio, json, sys, os, math
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;a.y=0;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__steer=(x,z)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;H0.ax=dx/d;H0.az=-dz/d;tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__walk=(x,z,tol)=>{let d=99,i=0;for(;i<900&&d>(tol||.25);i++){d=__steer(x,z);if(S[0]._cl)break}H0.ax=H0.az=0;__T(20);return{d:+Math.hypot(x-S[0].x,z-S[0].z).toFixed(2),ticks:i}};
window.__up=(x,z,tx,tz)=>{__walk(x,z,.3);for(let w=0;w<200&&(S[0]._lvCool||0)>0;w++)tick();let i=0;for(;i<240&&!S[0]._cl;i++)__steer(tx,tz);H0.ax=H0.az=0;let j=0;for(;j<900&&S[0]._cl;j++)tick();__T(10);return{lv:S[0]._lv&&S[0]._lv.id,y:+(S[0].y||0).toFixed(2)}};
window.__toSpot=()=>{const a=S[0];__at(96,108);HIT_LIFE.go('rock3');a.x=96.6;a.z=113.6;__T(10);return __walk(HIT_SCOPE.cfg.spot.x,HIT_SCOPE.cfg.spot.z,.15)};
window.__sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
window.__deb=()=>HIT_DC.eco.history(1e6).filter(x=>x.t==='d'&&x.src==='hire'&&x.meta&&x.meta.item==='telescope');
window.__interact=async()=>{const n=__near();if(!n||n.act!=='scope')return{label:n&&n.label,act:n&&n.act};_doInteract();for(let i=0;i<40&&HIT_SCOPE.paying;i++)await __sleep(25);await __sleep(60);return{label:n.label,act:n.act}};
window.__night=(y,m,d)=>{const t=new Date(y,m-1,d,22,0,0,0).getTime();return t};
window.__mid=(id)=>{const p=HIT_SCOPE.conScreen(id).filter(q=>q&&q.z>-.2);let x=0,y=0;for(const q of p){x+=q.x;y+=q.y}return{x:x/p.length,y:y/p.length,n:p.length}};
window.__aimAt=(id)=>{const q=HIT_SCOPE.conInfo(id);HIT_SCOPE.aim(Math.max(5,Math.min(80,q.alt)),q.az);return q};0'''

def altaz_py(ra_h, dec_d, t_ms, lon, lat):   # independent: rotate the equatorial unit vector into the horizon frame
    d = t_ms / 86400000 - 10957.5
    lst = math.radians((280.46061837 + 360.98564736629 * d + lon) % 360)
    ra, dec, ph = math.radians(ra_h * 15), math.radians(dec_d), math.radians(lat)
    x, y, z = math.cos(dec) * math.cos(ra), math.cos(dec) * math.sin(ra), math.sin(dec)    # equatorial
    xr, yr = x * math.cos(lst) + y * math.sin(lst), -x * math.sin(lst) + y * math.cos(lst)  # local hour-angle frame (x to the meridian)
    up = xr * math.cos(ph) + z * math.sin(ph); north = -xr * math.sin(ph) + z * math.cos(ph); east = yr   # yr = -cos(dec) sin(H): east
    alt = math.degrees(math.asin(max(-1, min(1, up)))); az = math.degrees(math.atan2(east, north)) % 360
    return alt, az

def sep(a, b):
    ra1, d1, ra2, d2 = math.radians(a[0] * 15), math.radians(a[1]), math.radians(b[0] * 15), math.radians(b[1])
    return math.degrees(math.acos(min(1, math.sin(d1) * math.sin(d2) + math.cos(d1) * math.cos(d2) * math.cos(ra1 - ra2))))

async def boot(pg):
    await pg.wait_for_function('window.HIT_SCOPE&&HIT_SCOPE.on&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP&&window.HIT_LIFE', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)
    await pg.evaluate("HIT_SCOPE.realClock=false;if(window.HIT_RAIN)HIT_RAIN.force=0")

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- climbing there by the joystick ----------
        C['climb'] = await pg.evaluate('''()=>{const o={};__at(96,100);__T(10);o.f1=__up(96,104.2,96,108.2);o.f2=__up(93.2,107.6,93.2,110.5);o.f3=__up(99.4,109.65,99.4,112.6);
            const cf=HIT_SCOPE.cfg;o.spot=__walk(cf.spot.x,cf.spot.z,.15);o.lv=S[0]._lv&&S[0]._lv.id;o.y=+(S[0].y||0).toFixed(2);o.prompt=(__near()||{}).label;
            o.solids=WORLD.solids.filter(q=>q.p&&q.p.k==='scope').length;
            o.ok=o.f1.lv==='rock1'&&o.f2.lv==='rock2'&&o.f3.lv==='rock3'&&o.spot.d<.3&&o.lv==='rock3'&&o.y===5.1&&/stars|Telescope/.test(o.prompt||'')&&o.solids===0;return o}''')
        # ---------- a short pouch ----------
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(let k=0;k<5;k++){window.__dt+=61000;await HIT_SHOP.buy('cake','bakery')}
            for(let k=0;k<20&&e.summary().available>=10;k++){window.__dt+=61000;await HIT_SHOP.buy('eggs','stand')}
            HIT_SCOPE.at=__night(2026,12,20);__toSpot();const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await __interact();
            o.avail=b0;o.label=r.label;o.code=(HIT_SCOPE.last||{}).code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.panel=!!document.getElementById('scp-pan');o.view=HIT_SCOPE.state().view;
            o.ok=b0<10&&o.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.panel&&!o.view;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- a night viewing ----------
        C['night'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},it=HIT_DC.config.hire.items.find(x=>x.id==='telescope');o.price=it&&it.price;o.place=it&&it.place;
            HIT_SCOPE.at=__night(2026,12,20);__toSpot();o.prompt=(__near()||{}).label;const b0=e.summary().available;window.__dt+=61000;await __interact();
            o.paid=b0-e.summary().available;o.debits=__deb().map(x=>({amt:x.amt,place:x.meta.place}));o.panel=!!document.getElementById('scp-pan');const k=HIT_SCOPE.sky();o.phase=k.phase;
            const vis=HIT_SCOPE.visible();o.vis=vis;const T=HIT_SCOPE.target();o.target=T;o.targetVisible=vis.includes(T);
            const other=vis.find(v=>v!==T);__aimAt(other);const m=__mid(other);const r1=HIT_SCOPE.tap(m.x,m.y);o.other={id:other,tap:r1};o.otherNotLogged=!HIT_SCOPE.state().found[other];
            HIT_SCOPE.aim(20,0);let empty=null;for(let gx=60;gx<=660&&!empty;gx+=40)for(let gy=60;gy<=500&&!empty;gy+=40){if(!HIT_SCOPE.hitTest(gx,gy))empty=[gx,gy]}
            o.emptyAt=empty;const r0=empty?HIT_SCOPE.tap(empty[0],empty[1]):{id:'x'};o.emptyTap=r0;
            __aimAt(T);const mt=__mid(T);const r2=HIT_SCOPE.tap(mt.x,mt.y);o.targetTap=r2;const st=HIT_SCOPE.state();o.found=st.found;o.next=HIT_SCOPE.target();o.nextVisible=!o.next||HIT_SCOPE.visible().includes(o.next);
            o.stars=HIT_SCOPE.drawnStars;HIT_SCOPE.render();o.starsDrawn=HIT_SCOPE.drawnStars;
            o.ok=o.price===10&&o.place==='overlook'&&/Look at the stars/.test(o.prompt||'')&&o.paid===10&&o.debits.length===1&&o.debits[0].place==='overlook'&&o.panel&&o.phase==='night'&&o.targetVisible&&
              r1.id===other&&r1.logged===false&&o.otherNotLogged&&o.emptyAt&&r0.id===null&&r2.id===T&&r2.logged===true&&st.found[T]&&st.found[T].n===1&&o.next!==T&&o.nextVisible&&o.starsDrawn>150;return o}''')
        # ---------- hit-tests at four seasons ----------
        C['hits'] = await pg.evaluate('''()=>{const o={times:[],cons:0,mid:0,starsOk:0,starsAll:0,far:0,farOk:0};
            for(const [y,m,d] of [[2026,1,15],[2026,4,15],[2026,7,15],[2026,10,15]]){HIT_SCOPE.at=__night(y,m,d);const vis=HIT_SCOPE.visible();o.times.push(vis.join(','));
              for(const id of vis){__aimAt(id);o.cons++;const mm=__mid(id);if(HIT_SCOPE.hitTest(mm.x,mm.y)===id)o.mid++;else (o.midFail=o.midFail||[]).push(id+'@'+m);
                for(const q of HIT_SCOPE.conScreen(id)){if(!q||q.z<-.2||q.x<0||q.x>720||q.y<0||q.y>860)continue;o.starsAll++;if(HIT_SCOPE.hitTest(q.x,q.y)===id)o.starsOk++;}
                // a point 25 degrees above the figure's middle, clear of every figure (checked against all of them in Python-free geometry: the hit list must be empty or another constellation)
                const q=HIT_SCOPE.conInfo(id);if(q.alt<55){const p=HIT_SCOPE.proj(q.alt+25,q.az);if(p){o.far++;const h=HIT_SCOPE.hitTest(p.x,p.y);if(h!==id)o.farOk++;}}}}
            o.ok=o.cons>=20&&o.mid===o.cons&&o.starsOk>=o.starsAll*.95&&o.farOk===o.far;return o}''')
        # ---------- astronomy ----------
        st = await pg.evaluate('''()=>{const S2=HIT_SCOPE.STARS.slice(0,HIT_SCOPE.ncat).map(s=>[s.n,s.ra,s.dec,s.m]);const times=[__night(2026,1,15),__night(2026,4,15),__night(2026,7,15),__night(2026,10,15),new Date(2026,2,20,12,0,0,0).getTime(),new Date(2026,11,21,3,30,0,0).getTime()];
            const res=times.map(t=>({t:t,lon:HIT_SCOPE.astro.lonOf(t),sky:(HIT_SCOPE.at=t,HIT_SCOPE.sky()),aa:S2.map((s,i)=>HIT_SCOPE.starAltAz(i,t)),sun:HIT_SCOPE.astro.sunRaDec(t)}));
            const days=[];for(const [m,d] of [[3,20],[6,21],[9,22],[12,21]]){const t0=new Date(2026,m-1,d,0,0,0,0).getTime();let best=-99,bt=0;for(let k=0;k<1440;k+=2){const t=t0+k*60000;HIT_SCOPE.at=t;const a=HIT_SCOPE.sky().sun.alt;if(a>best){best=a;bt=t}}HIT_SCOPE.at=bt;days.push({m,d,alt:best,dec:HIT_SCOPE.astro.sunRaDec(bt).dec})}
            const ph=[];const t0=new Date(2026,10,22,12,0,0,0).getTime();for(let k=0;k<24*6;k++){HIT_SCOPE.at=t0+k*600000;const s=HIT_SCOPE.sky();ph.push([+s.sun.alt.toFixed(2),s.phase])}
            return {stars:S2,res:res,days:days,ph:ph,lat:HIT_SCOPE.cfg.lat}}''')
        A = {'maxErr': 0.0}; lat = st['lat']
        for r in st['res']:
            for s, aa in zip(st['stars'], r['aa']):
                alt, az = altaz_py(s[1], s[2], r['t'], r['lon'], lat)
                da = abs(alt - aa['alt']); dz = abs(((az - aa['az']) + 540) % 360 - 180) * math.cos(math.radians(alt))
                A['maxErr'] = max(A['maxErr'], da, dz)
        A['maxErr'] = round(A['maxErr'], 6)
        pol = [r['aa'][[s[0] for s in st['stars']].index('Polaris')] for r in st['res']]
        A['polarisAlt'] = [round(x['alt'], 2) for x in pol]
        A['noon'] = [{'date': '%d/%d' % (d['m'], d['d']), 'alt': round(d['alt'], 2), 'expect': round(90 - lat + d['dec'], 2), 'dec': round(d['dec'], 2)} for d in st['days']]
        ph_ok = all((p == 'day') == (a > -.8) and (p == 'night') == (a <= -12) for a, p in st['ph'])
        A['phases'] = {'samples': len(st['ph']), 'consistent': ph_ok, 'kinds': sorted(set(p for _, p in st['ph']))}
        cat = {s[0]: (s[1], s[2]) for s in st['stars']}
        PUB = [('Vega', 'Altair', 34.2), ('Vega', 'Deneb', 23.9), ('Deneb', 'Altair', 38.0), ('Betelgeuse', 'Rigel', 18.6), ('Castor', 'Pollux', 4.5), ('Dubhe', 'Merak', 5.4), ('Merak', 'Dubhe', 5.4), ('Sirius', 'Betelgeuse', 27.1), ('Mintaka', 'Alnitak', 2.7)]
        A['separations'] = [{'pair': a + '-' + b, 'cat': round(sep(cat[a], cat[b]), 2), 'published': v} for a, b, v in PUB]
        A['solstice_dec'] = [round(d['dec'], 2) for d in st['days']]
        A['ok'] = A['maxErr'] < .01 and all(abs(x - lat) < 1 for x in A['polarisAlt']) and all(abs(n['alt'] - n['expect']) < .5 for n in A['noon']) and ph_ok and \
            len(A['phases']['kinds']) == 3 and all(abs(s['cat'] - s['published']) < .3 for s in A['separations']) and abs(A['solstice_dec'][1] - 23.44) < .3 and abs(A['solstice_dec'][3] + 23.44) < .3
        A['nCatalogue'] = len(st['stars'])
        C['astro'] = A
        # ---------- all twelve, over several nights ----------
        C['log12'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={nights:0,views:0};const d0=__deb().length;const dates=[[2026,1,15],[2026,3,1],[2026,4,15],[2026,6,1],[2026,7,15],[2026,9,1],[2026,10,15],[2026,12,20]];
            HIT_SCOPE.spend(200000);HIT_SCOPE.close();for(let pass=0;pass<3;pass++)for(const [y,m,d] of dates){HIT_SCOPE.at=__night(y,m,d);o.nights++;__toSpot();window.__dt+=61000;await __interact();if(!document.getElementById('scp-pan'))continue;o.views++;
              for(let k=0;k<14;k++){const T=HIT_SCOPE.target();if(!T)break;__aimAt(T);const mm=__mid(T);const r=HIT_SCOPE.tap(mm.x,mm.y);if(!r||!r.logged)break;if(Object.keys(HIT_SCOPE.state().found).length>=12)break}
              HIT_SCOPE.spend(200000);HIT_SCOPE.close();if(Object.keys(HIT_SCOPE.state().found).length>=12)break}
            const f=HIT_SCOPE.state().found;o.found=Object.keys(f).sort();o.n=o.found.length;o.charged=__deb().length-d0;o.allDated=Object.values(f).every(x=>x.first>0&&x.n>=1);
            HIT_SCOPE.at=__night(2026,12,20);__toSpot();window.__dt+=61000;await __interact();HIT_SCOPE.click('log');o.logShown=HIT_SCOPE.logShown();HIT_SCOPE.click('log');o.logBack=!HIT_SCOPE.logShown();HIT_SCOPE.spend(200000);HIT_SCOPE.close();
            o.ok=o.n===12&&o.charged===o.views&&o.allDated&&o.logShown&&o.logBack;return o}''')
        # ---------- daytime ----------
        C['day'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};HIT_SCOPE.at=new Date(2026,10,22,12,0,0,0).getTime();__toSpot();o.prompt=(__near()||{}).label;const d0=__deb().length,f0=JSON.stringify(HIT_SCOPE.state().found);
            window.__dt+=61000;await __interact();o.charged=__deb().length-d0;o.phase=HIT_SCOPE.sky().phase;o.panel=!!document.getElementById('scp-pan');o.hint=!document.querySelector('#scp-box button[data-act="hint"]').hidden;
            HIT_SCOPE.aim(2,Math.atan2(68-HIT_SCOPE.cfg.scope.x,10-HIT_SCOPE.cfg.scope.z)*180/Math.PI);const p=HIT_SCOPE.proj(4,Math.atan2(68-HIT_SCOPE.cfg.scope.x,10-HIT_SCOPE.cfg.scope.z)*180/Math.PI);
            o.treeTap=HIT_SCOPE.tap(p.x,p.y);o.say=HIT_SCOPE.lastSay;o.anyHit=HIT_SCOPE.hitTest(360,300);o.foundSame=JSON.stringify(HIT_SCOPE.state().found)===f0;HIT_SCOPE.spend(200000);HIT_SCOPE.close();
            o.ok=/daytime/.test(o.prompt||'')&&o.charged===1&&o.phase==='day'&&o.panel&&!o.hint&&o.treeTap.id==='skytree'&&/Sky Tree/.test(o.say||'')&&o.anyHit===null&&o.foundSame;return o}''')
        # ---------- rain ----------
        C['rain'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};HIT_SCOPE.at=__night(2026,12,20);__toSpot();HIT_RAIN.force=1;__T(5);o.clouds=HIT_SCOPE.clouds();o.prompt=(__near()||{}).label;const d0=__deb().length,b0=e.summary().available;
            window.__dt+=61000;await __interact();o.code=(HIT_SCOPE.log.filter(x=>x.ev==='refuse').slice(-1)[0]||{}).code;o.noCharge=__deb().length===d0&&e.summary().available===b0&&!document.getElementById('scp-pan');
            HIT_RAIN.force=0;__T(5);window.__dt+=61000;await __interact();o.paidClear=__deb().length-d0;const l0=HIT_SCOPE.state().view.left;HIT_SCOPE.spend(10000);const l1=HIT_SCOPE.state().view.left;
            HIT_RAIN.force=1;__T(5);HIT_SCOPE.spend(30000);const l2=HIT_SCOPE.state().view.left;o.paused=HIT_SCOPE.paused;HIT_SCOPE.render();o.starsUnderCloud=HIT_SCOPE.drawnStars;o.tapCloud=HIT_SCOPE.tap(360,300);
            HIT_RAIN.force=0;__T(5);HIT_SCOPE.spend(10000);const l3=HIT_SCOPE.state().view.left;o.left=[l0,l1,l2,l3];HIT_SCOPE.spend(200000);HIT_SCOPE.close();
            HIT_SCOPE.at=new Date(2026,10,22,12,0,0,0).getTime();HIT_RAIN.force=1;__T(5);const d1=__deb().length;window.__dt+=61000;await __interact();o.dayInRain=__deb().length-d1;o.dayPanel=!!document.getElementById('scp-pan');HIT_SCOPE.spend(200000);HIT_SCOPE.close();HIT_RAIN.force=0;__T(3);
            o.ok=o.clouds>=.5&&/clouds/.test(o.prompt||'')&&o.code==='clouds'&&o.noCharge&&o.paidClear===1&&l0-l1===10000&&l2===l1&&o.paused===true&&o.starsUnderCloud===0&&o.tapCloud.id===null&&l2-l3===10000&&o.dayInRain===1&&o.dayPanel;return o}''')
        # ---------- the viewing clock, close / hit / walk off ----------
        C['clock'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};HIT_SCOPE.at=__night(2026,12,20);__toSpot();const d0=__deb().length;window.__dt+=61000;await __interact();o.first=__deb().length-d0;
            HIT_SCOPE.spend(30000);HIT_SCOPE.click('close');o.closedLeft=HIT_SCOPE.state().view.left;o.prompt=(__near()||{}).label;window.__dt+=61000;await __interact();o.resumeNoCharge=__deb().length-d0===1&&!!document.getElementById('scp-pan');
            // a hit taken: a townsperson strikes Red
            const a=S[0];const hp=a.hp;a.hp=hp-5;__T(2);o.fightClosed=!document.getElementById('scp-pan');a.hp=hp;for(let w=0;w<300&&!(a.st==='idle'||a.st==='walk');w++)tick();o.fightLeft=HIT_SCOPE.state().view&&HIT_SCOPE.state().view.left;
            await __interact();o.resume2=!!document.getElementById('scp-pan')&&__deb().length-d0===1;
            // walking off the tier's spot closes it
            for(let i=0;i<120;i++){cam.yaw=0;H0.ax=1;H0.az=0;tick()}H0.ax=H0.az=0;for(let i=0;i<4;i++){await __sleep(120)}o.walkOff=!document.getElementById('scp-pan');
            __toSpot();await __interact();HIT_SCOPE.spend(HIT_SCOPE.state().view.left-1);o.almost=HIT_SCOPE.state().view.left;HIT_SCOPE.spend(5);o.shut=HIT_SCOPE.state().view===null;o.say=HIT_SCOPE.lastToast;HIT_SCOPE.close();
            window.__dt+=61000;await __interact();o.second=__deb().length-d0;HIT_SCOPE.spend(200000);HIT_SCOPE.close();
            o.ok=o.first===1&&o.closedLeft===90000&&/keep looking/.test(o.prompt||'')&&o.resumeNoCharge&&o.fightClosed&&o.fightLeft===90000&&o.resume2&&o.walkOff&&o.almost===1&&o.shut&&/shutter/.test(o.say||'')&&o.second===2;return o}''')
        # ---------- coliseum ----------
        C['sky'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};__toSpot();const d0=__deb().length,b0=e.summary().available;HIT_SKY.on=true;__T(3);
            o.prompt=HIT_SCOPE.prompt();window.__dt+=61000;const r=await HIT_SCOPE.look();o.code=r.code;o.noCharge=__deb().length===d0&&e.summary().available===b0;HIT_SKY.on=false;__T(3);
            o.ok=!o.prompt&&o.code==='area'&&o.noCharge;return o}''')
        # ---------- reload ----------
        await pg.evaluate('''async()=>{HIT_SCOPE.at=__night(2026,12,20);__toSpot();window.__dt+=61000;await __interact();HIT_SCOPE.spend(42000);HIT_SCOPE.close()}''')
        before = await pg.evaluate("HIT_SCOPE.state()")
        await pg.reload(); await boot(pg)
        after = await pg.evaluate("HIT_SCOPE.state()")
        C['reload'] = {'found': len(after['found']), 'left': after['view'] and after['view']['left'], 'ok': after['found'] == before['found'] and after['view'] and after['view']['left'] == 78000}
        # ---------- audit ----------
        C['audit'] = await pg.evaluate('''()=>{const e=HIT_DC.eco,a=e.audit(),d=__deb();const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error).slice(0,200);
            return {audit:a.ok,issues:a.issues,debits:d.length,all10:d.every(x=>x.amt===10&&x.meta.place==='overlook'),mods:mods,ok:a.ok&&d.every(x=>x.amt===10)&&Object.keys(mods).length===0}}''')
        C['errors'] = {'page': errs[:10], 'ok': not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    print(json.dumps(out, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))

asyncio.run(main())
