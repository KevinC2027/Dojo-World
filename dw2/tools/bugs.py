"""Bug catching test (Step 21 gate).  Usage:
  python3 -I dw2/tools/bugs.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red moves only with the joystick (H0.ax/H0.az, camera yaw 0)
or is placed on open ground before a check; the net is used only through the player's paths: the NET / SWING / BOOK / PUT AWAY button
functions (HIT_BUGS.input.*). A test clock (Date.now + offset) steps 61 s between purchases. The hour is fixed with HIT_BUGS.phaseOverride
(the same switch as ?bugs=day|dusk|night); the 'clock' check uses the real local clock path.
  shop      no net: NET refused ('none'); a short pouch refuses it with nothing charged; buying posts one 25 DC 'shop' debit (price from
            DC_CONFIG), the panel shows OWNED, a second buy is refused, never in the gift bag, audit clean, still owned after a reload
  out       NET works on open ground in town; indoors, in the water, in the coliseum, aboard the boat and with the kite up it is refused
  catch     every one of the 10 species, at its own habitat and hour: Red creeps up with the joystick (stick 0.3), stops in reach and SWINGs:
            caught, never startled on the way; the book gains it
  hours     for every slot and phase the species comes from the habitat table; live insects in each phase are only that phase's species;
            the real clock path agrees with the telescope's sun (noon = day, 22:00 = night) and dusk falls between
  rain      a shower: no insects anywhere near Red; when it passes they come back
  sight     running at a perched insect startles it (in sight); creeping to the same spot does not; running past on the far side of a wall
            at the same distance never startles it (no seeing through walls)
  reach     144 still targets around Red: caught exactly when the hoop path (re-computed in Python) passes within the catch radius
  miss      a swing that misses startles an insect close by that can see Red
  release   a caught insect flies off free, its slot rests 40 s (no new insect there), then a new one arrives
  book      counts and biggest sizes match the catch log, the panel shows N of 10, all kept after a reload
  pack      a punch, a hit taken, the coliseum, water, indoors and the boat pack the net away
  walk      the joystick walks Red the same distance with the net out as without it
  errors    no HIT_* module errors, no page errors; draw() runs in every net state"""
import asyncio, json, sys, os, math
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__steer=(x,z,m)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;H0.ax=dx/d*(m||1);H0.az=-dz/d*(m||1);tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__stop=()=>{H0.ax=H0.az=0;__T(12)};
window.__drawErr=null;window.__draw=()=>{try{draw()}catch(e){__drawErr=String(e)}};
window.__ok=(x,z)=>{for(const s of WORLD.solids)if(s.h>.3&&x>s.x0-.45&&x<s.x1+.45&&z>s.z0-.45&&z<s.z1+.45)return false;try{if(HIT_ROADS.inDrive(x,z))return false}catch(e){}try{if((HIT_WATER.depthAt(x,z)||0)>0)return false}catch(e){}return true};
window.__reset=()=>{H0.ax=H0.az=0;if(HIT_BUGS.st()!=='off')HIT_BUGS.pack('test');HIT_BUGS.closeBook();if(window.HIT_KITE&&HIT_KITE.st()!=='off')HIT_KITE.pack('test');__T(2)};
window.__ev=(e)=>HIT_BUGS.log.filter(q=>q.e===e);
// walk up to insect u: approach point at distance R in front of it (from the side Red comes from), creeping with stick m for the last 5 m
window.__approach=(u,R,m,far)=>{const B=HIT_BUGS;let i=B.find(u);if(!i)return{err:'gone'};const a=S[0];let steps=0;const st0=B.log.filter(e=>e.e==='startle'&&e.uid===u).length;
  for(;steps<1800;steps++){i=B.find(u);if(!i||i.st==='flee'||i.st==='hop'||i.st==='drop')break;const d=Math.hypot(i.x-a.x,i.z-a.z);if(d<=R)break;
    if(i.d.kind!=='trunk'&&i.d.kind!=='beetle'&&i.st!=='rest'&&d<4.5){H0.ax=H0.az=0;tick();continue}   // wait for it to settle before the last steps
    __steer(i.x,i.z,d>(far||6)?1:m)}
  H0.ax=H0.az=0;__T(10);i=B.find(u);return{steps,startled:B.log.filter(e=>e.e==='startle'&&e.uid===u).length-st0,st:i&&i.st,d:i?+Math.hypot(i.x-a.x,i.z-a.z).toFixed(3):null}};
0'''

async def boot(pg):
    await pg.wait_for_function('window.HIT_BUGS&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

def hoop(t, fx, fz, yh, ax, az, reach=1.25, sweep=.7, T=16):
    u = min(max(t / T, 0), 1); an = (-1 + 2 * u) * sweep; ca, sa = math.cos(an), math.sin(an)
    dx, dz = fx * ca - fz * sa, fz * ca + fx * sa
    return ax + dx * reach, yh + .12 * math.sin(u * math.pi), az + dz * reach

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- shop ----------
        C['nonet'] = await pg.evaluate('''()=>{__at(-48,-24);__T(20);const r=HIT_BUGS.takeOut();__T(5);return{code:r.code,live:HIT_BUGS.live.length,ok:r.code==='none'&&HIT_BUGS.st()==='off'&&HIT_BUGS.live.length===0}}''')
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(const [it,sh] of [['cake','bakery'],['cake','bakery'],['cake','bakery'],['cake','bakery'],['cake','bakery'],['flowers','general']]){window.__dt+=61000;await HIT_SHOP.buy(it,sh)}
            while(e.summary().available>=25){window.__dt+=61000;const r=await HIT_SHOP.buy('melonpan','bakery');if(!r.ok)break}
            const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await HIT_SHOP.buy('net','general');o.avail=b0;o.code=r.code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.owned=HIT_BUGS.owned(true);
            o.ok=b0<25&&r.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.owned;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        C['buy'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};const it=HIT_DC.config.shop.items.find(x=>x.id==='net');o.price=it.price;o.b0=e.summary().available;
            __at(-30,-24);__T(5);HIT_SHOP.open('general',S[0].x,S[0].z);await new Promise(r=>setTimeout(r,100));const btn=document.querySelector('#shop-box button[data-item="net"]');o.btn0=btn&&btn.textContent;btn.click();
            for(let i=0;i<40&&HIT_SHOP.busy!==false||i<3;i++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,200));
            o.b1=e.summary().available;const deb=e.history(1e6).filter(x=>x.t==='d'&&x.src==='shop'&&x.meta&&x.meta.item==='net');o.debits=deb.map(x=>({amt:x.amt,shop:x.meta.shop}));o.flown=(HIT_SHOP.log.slice(-1)[0]||{}).price;
            const btn2=document.querySelector('#shop-box button[data-item="net"]');o.btn1=btn2&&btn2.textContent;o.btn1dis=btn2&&btn2.disabled;
            window.__dt+=61000;const r2=await HIT_SHOP.buy('net','general');o.second=r2.code;o.b2=e.summary().available;o.bag=HIT_SHOP.bag.map(x=>x.item);o.audit=e.audit();
            document.querySelectorAll('#shop-pan').forEach(x=>x.remove());HIT_SHOP.panel=null;o.owned=HIT_BUGS.owned(true);
            o.ok=o.b0-o.b1===it.price&&it.price===25&&o.debits.length===1&&o.debits[0].amt===it.price&&o.debits[0].shop==='general'&&o.flown===it.price&&o.btn1==='OWNED'&&o.btn1dis&&o.second==='owned'&&o.b2===o.b1&&!o.bag.includes('net')&&o.audit.ok&&o.owned;return o}''')
        await pg.reload(); await boot(pg)
        C['buy']['ownedAfterReload'] = await pg.evaluate('HIT_BUGS.owned(true)'); C['buy']['ok'] = C['buy']['ok'] and C['buy']['ownedAfterReload']
        # ---------- out ----------
        C['out'] = await pg.evaluate('''()=>{const o={};__reset();__at(-48,-24);__T(100);o.meadow=HIT_BUGS.takeOut().ok;o.st=HIT_BUGS.st();__reset();
            const bad=[];__at(42,51);__T(20);bad.push(['water',HIT_BUGS.takeOut().code]);__at(-48,-24);__T(60);
            let room=null;for(const l of HIT_W192.lots){__at(l.x,l.z);__T(3);if(HIT_LIFE.insideId()){room=l.id;break}}bad.push(['inside',HIT_BUGS.takeOut().code]);__at(-48,-24);__T(30);
            HIT_SKY.on=true;bad.push(['area',HIT_BUGS.takeOut().code]);HIT_SKY.on=false;__T(3);
            if(window.HIT_BOAT&&HIT_BOAT.B){HIT_BOAT.B.aboard=true;bad.push(['boat',HIT_BUGS.takeOut().code]);HIT_BOAT.B.aboard=false}
            if(window.HIT_KITE&&HIT_KITE.K){HIT_KITE.K.st='hand';bad.push(['kite',HIT_BUGS.takeOut().code]);HIT_KITE.K.st='off'}
            o.refused=bad;o.room=room;o.ok=o.meadow&&o.st==='out'&&bad.every(q=>q[0]===q[1])&&HIT_BUGS.st()==='off';return o}''')
        # ---------- catch every species ----------
        C['catch'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={sp:{}};const PH={cabbage:'day',swallow:'day',akatombo:'day',shiokara:'day',cicada:'day',kabuto:'night',kuwagata:'dusk',hotaru:'night',batta:'day',suzumushi:'night'};
            for(const sp of B.ORDER){const r={tries:[]};__reset();B.phaseOverride=PH[sp];B.clear();const slots=B.slots().filter(s=>s.sp===sp);
              // nearest-first from the middle of town; try up to 12 slots until one is caught
              slots.sort((p,q)=>Math.hypot(p.x,p.z)-Math.hypot(q.x,q.z));
              for(const s of slots.slice(0,12)){if(r.caught)break;
                // a start 6 m away with open ground and a clear view
                let st=null;for(let k=0;k<16&&!st;k++){const an=-Math.PI/2+(k%2?1:-1)*Math.floor((k+1)/2)*Math.PI/8,x=s.x+Math.cos(an)*6,z=s.z+Math.sin(an)*6;if(__ok(x,z)&&!wallBetween(x,z,s.x,s.z))st=[x,z]}
                if(!st){r.tries.push({slot:s.id,why:'no start'});continue}
                B.clear();__at(st[0],st[1]);__T(30);B.input.net();const ins=B.live.find(i=>i.slot&&i.slot.id===s.id);if(!ins||B.st()!=='out'){r.tries.push({slot:s.id,why:'no insect',net:B.st(),code:B.lastMsg});continue}
                const ap=__approach(ins.uid,1.22,.3);const n0=__ev('catch').length;B.input.swing();__T(20);const c=__ev('catch').slice(n0).find(e=>e.uid===ins.uid);
                r.tries.push({slot:s.id,hab:s.hab,ap,yh:(__ev('swing').slice(-1)[0]||{}).yh,caught:!!c,size:c&&c.size});if(c){r.caught=true;r.size=c.size;r.d=c.d;r.y=c.y;r.startled=ap.startled}
                __T(60)}
              r.tries=r.tries.slice(-3);o.sp[sp]=r}
            B.phaseOverride=null;__reset();o.book=B.book();o.ok=B.ORDER.every(k=>o.sp[k].caught&&o.sp[k].startled===0&&o.book.sp[k]&&o.book.sp[k].n>=1);return o}''')
        # ---------- hours ----------
        C['hours'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={per:{},bad:[]};const sl=B.slots();
            for(const ph of ['day','dusk','night']){const c={};for(const s of sl){const sp=B.spFor(s.id,ph);if(!sp)continue;c[sp]=(c[sp]||0)+1;const ok=(B.TABLE[s.hab][ph]||[]).some(q=>q[0]===sp);if(!ok)o.bad.push([s.id,ph,sp])}o.per[ph]=c}
            // live: walk the populate at 6 places in each phase
            o.live={};for(const ph of ['day','dusk','night']){B.phaseOverride=ph;B.clear();const seen={};for(const [x,z] of [[-48,-24],[-14,-12],[30,40],[-30,-78],[90,35],[0,58]]){__at(x,z);__T(40);for(const i of B.live)seen[i.sp]=(seen[i.sp]||0)+1}o.live[ph]=seen;
              for(const k of Object.keys(seen))if(!(k in o.per[ph]))o.bad.push(['live',ph,k])}
            B.phaseOverride=null;
            // the real clock: today's local noon and 22:00, and the telescope's sun at the same moments
            const d=new Date(Date.now());d.setHours(12,0,0,0);const noon=d.getTime();d.setHours(22,0,0,0);const late=d.getTime();
            o.clock={noon:B.phaseAt(noon),late:B.phaseAt(late)};if(window.HIT_SCOPE&&HIT_SCOPE.sky){HIT_SCOPE.at=noon;o.clock.scopeNoon=HIT_SCOPE.sky().phase;HIT_SCOPE.at=late;o.clock.scopeLate=HIT_SCOPE.sky().phase;delete HIT_SCOPE.at}
            let dusk=0;for(let t=noon;t<late;t+=300000)if(B.phaseAt(t)==='dusk')dusk++;o.clock.duskMinutes=dusk*5;
            const every=['day','dusk','night'].every(ph=>Object.keys(o.per[ph]).length>=4);
            o.ok=o.bad.length===0&&every&&o.clock.noon==='day'&&o.clock.late==='night'&&(!('scopeNoon' in o.clock)||o.clock.scopeNoon==='day'&&o.clock.scopeLate==='night')&&dusk>3;return o}''')
        # ---------- rain ----------
        C['rain'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={};__reset();B.phaseOverride='day';B.clear();__at(-48,-24);__T(60);o.before=B.live.length;
            HIT_RAIN.force=1;__T(120);o.raining=HIT_RAIN.raining;o.during=B.live.length;HIT_RAIN.force=0;__T(240);o.dry=!HIT_RAIN.raining;o.after=B.live.length;HIT_RAIN.force=null;B.phaseOverride=null;
            o.ok=o.before>0&&o.raining&&o.during===0&&o.dry&&o.after>0;return o}''')
        # ---------- sight: run vs creep vs wall ----------
        C['sight'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={};__reset();B.phaseOverride='night';B.noSpawn=true;B.clear();   /* night: no flower insects, a quiet meadow */
            const X=-48,Z=-24;const trial=(m)=>{B.clear();__at(X-6,Z);__T(5);const u=B.spawn('cabbage',X,.42,Z);const i=B.find(u);i.dur=1e6;const st0=B.stats.startled;const ap=__approach(u,1.22,m,99);return{m,startled:B.stats.startled-st0,d:ap.d,st:ap.st}};
            o.run=trial(1);o.creep=trial(.3);
            // a thin tall wall: an insect 0.5 m on one side, Red running along the other side 0.5 m from it (same distance, no view)
            let w=null;for(const s of WORLD.solids){const lx=s.x1-s.x0,lz=s.z1-s.z0;if(s.h>1.5&&Math.min(lx,lz)<1.2&&Math.max(lx,lz)>=6){w=s;break}}
            if(w){const alongX=(w.x1-w.x0)>(w.z1-w.z0),cx=(w.x0+w.x1)/2,cz=(w.z0+w.z1)/2;const iP=alongX?[cx,w.z1+.5]:[w.x1+.5,cz],r0=alongX?[cx-3,w.z0-.6]:[w.x0-.6,cz-3],r1=alongX?[cx+3,w.z0-.6]:[w.x0-.6,cz+3];
              B.clear();__at(r0[0],r0[1]);__T(5);const u=B.spawn('shiokara',iP[0],.7,iP[1]);B.find(u).dur=1e6;const st0=B.stats.startled;let minD=99,steps=0,vmax=0;
              for(;steps<300;steps++){const d=__steer(r1[0],r1[1],1);vmax=Math.max(vmax,HIT_BUGS.redV);const i=B.find(u);minD=Math.min(minD,Math.hypot(i.x-S[0].x,i.z-S[0].z));if(d<.3)break}H0.ax=H0.az=0;
              o.wall={wall:{x0:+w.x0.toFixed(1),z0:+w.z0.toFixed(1),x1:+w.x1.toFixed(1),z1:+w.z1.toFixed(1),h:w.h},closest:+minD.toFixed(2),sense:B.SP.shiokara.sense,redV:+vmax.toFixed(2),startled:B.stats.startled-st0,blocked:wallBetween(S[0].x,S[0].z,iP[0],iP[1])};
              // the same run with the insect on Red's side of the wall (in view) at the same distance
              const iQ=alongX?[cx,w.z0-1.6]:[w.x0-1.6,cz];B.clear();__at(r0[0],r0[1]);__T(5);const u2=B.spawn('shiokara',iQ[0],.7,iQ[1]);B.find(u2).dur=1e6;const s1=B.stats.startled;for(let k=0;k<300;k++){if(__steer(r1[0],r1[1],1)<.3)break}H0.ax=H0.az=0;o.open={startled:B.stats.startled-s1}}
            B.phaseOverride=null;B.noSpawn=false;B.clear();o.ok=o.run.startled===1&&o.creep.startled===0&&o.creep.st==='rest'&&!!o.wall&&o.wall.startled===0&&o.wall.closest<o.wall.sense&&o.wall.redV>1.4&&o.open.startled===1;return o}''')
        # ---------- reach: hoop geometry ----------
        reach = await pg.evaluate('''()=>{const B=HIT_BUGS,res=[];__reset();B.phaseOverride='night';B.noSpawn=true;B.clear();const X=-48,Z=-24;__at(X,Z);__T(5);
            // face +x by a short joystick tap, then stand
            for(let i=0;i<6;i++){cam.yaw=0;H0.ax=1;H0.az=0;tick()}__stop();B.input.net();__T(3);const a=S[0];const ax=a.x,az=a.z;
            for(const d of [.4,.7,.9,1.0,1.1,1.25,1.4,1.5,1.6,1.7,1.9,2.2])for(const deg of [-100,-80,-60,-45,-35,-20,0,20,35,45,60,80]){
              B.clear();if(B.st()!=='out'){B.input.net()}const l=Math.hypot(a.fx,a.fz),fx=a.fx/l,fz=a.fz/l,an=deg*Math.PI/180;const dx=fx*Math.cos(an)-fz*Math.sin(an),dz=fz*Math.cos(an)+fx*Math.sin(an);
              const y=1.0,u=B.spawn('kabuto',a.x+dx*d,y,a.z+dz*d);B.find(u).calm=1e6;const n0=__ev('catch').length;B.input.swing();__T(18);const c=__ev('catch').slice(n0).some(e=>e.uid===u);const sw=__ev('swing').slice(-1)[0];
              res.push({d,deg,c,fx:sw.fx,fz:sw.fz,x:sw.x,z:sw.z,yh:sw.yh,ix:a.x+dx*d,iz:a.z+dz*d,iy:y});__T(60)}
            B.phaseOverride=null;B.noSpawn=false;B.clear();return{res,cfg:B.cfg,moved:Math.hypot(S[0].x-ax,S[0].z-az)}}''')
        mism = []; edge = []; caught = 0
        for r in reach['res']:
            best = min(math.dist(hoop(t, r['fx'], r['fz'], r['yh'], r['x'], r['z']), (r['ix'], r['iy'], r['iz'])) for t in range(1, 17))
            exp = best <= reach['cfg']['catchR']
            if abs(best - reach['cfg']['catchR']) < 1e-6: edge.append({'d': r['d'], 'deg': r['deg'], 'engine': r['c']}); continue   # on the boundary to float precision: not compared
            if exp != r['c']: mism.append({'d': r['d'], 'deg': r['deg'], 'engine': r['c'], 'python': exp, 'best': round(best, 3)})
            caught += r['c']
        inside = [r for r in reach['res'] if r['c']]
        C['reach'] = {'targets': len(reach['res']), 'caught': caught, 'mismatches': mism[:10], 'nMismatch': len(mism), 'onBoundary': edge,
                      'caughtDistRange': [min(r['d'] for r in inside), max(r['d'] for r in inside)] if inside else None,
                      'caughtAngleRange': [min(r['deg'] for r in inside), max(r['deg'] for r in inside)] if inside else None,
                      'ok': len(mism) == 0 and caught > 10 and caught < len(reach['res']) and all(.85 <= r['d'] <= 1.65 for r in inside)}
        # ---------- miss ----------
        C['miss'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={};__reset();B.phaseOverride='night';B.noSpawn=true;B.clear();const X=-48,Z=-24;__at(X,Z);__T(5);for(let i=0;i<6;i++){cam.yaw=0;H0.ax=1;H0.az=0;tick()}__stop();B.input.net();__T(3);
            const a=S[0],u=B.spawn('cabbage',a.x+2.3,.42,a.z);B.find(u).dur=1e6;__T(5);const s0=B.stats.startled,m0=B.stats.missed;B.input.swing();__T(20);const i=B.find(u);
            o.missed=B.stats.missed-m0;o.startled=B.stats.startled-s0;o.st=i&&i.st;o.why=(__ev('startle').slice(-1)[0]||{}).why;B.phaseOverride=null;B.noSpawn=false;B.clear();__reset();o.ok=o.missed===1&&o.startled===1&&o.why==='miss';return o}''')
        # ---------- release + slot rest ----------
        C['release'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={};__reset();B.phaseOverride='night';B.clear();const s=B.slots().filter(q=>q.sp==='suzumushi').sort((p,q)=>Math.hypot(p.x+48,p.z+24)-Math.hypot(q.x+48,q.z+24))[0];
            let st=null;for(let k=0;k<16&&!st;k++){const an=k*Math.PI/8,x=s.x+Math.cos(an)*4,z=s.z+Math.sin(an)*4;if(__ok(x,z)&&!wallBetween(x,z,s.x,s.z))st=[x,z]}__at(st[0],st[1]);__T(30);B.input.net();
            const ins=B.live.find(i=>i.slot&&i.slot.id===s.id);const ap=__approach(ins.uid,1.22,.3);B.input.swing();__T(20);o.caught=__ev('catch').slice(-1)[0].uid===ins.uid;o.hold=B.st();__T(40);o.freeSt=B.find(ins.uid)&&B.find(ins.uid).st;o.netBack=B.st();__T(200);o.gone=!B.find(ins.uid);
            const t0=tk;let back=-1;for(let k=0;k<3000;k+=20){__T(20);if(B.live.some(i=>i.slot&&i.slot.id===s.id)){back=tk-t0;break}}o.backAfterS=+(back/60).toFixed(1);o.cool=B.cfg.cool/60;
            B.phaseOverride=null;__reset();o.ok=o.caught&&o.hold==='hold'&&o.freeSt==='free'&&o.netBack==='out'&&o.gone&&back>=B.cfg.cool-260&&back<=B.cfg.cool+200;return o}''')
        # ---------- pack ----------
        C['pack'] = await pg.evaluate('''()=>{const B=HIT_BUGS,o={ups:[]};const M=[-48,-24];const up=()=>{__reset();for(const n of crowd)if(n&&n._rec)n.prov=0;__at(M[0],M[1]);for(let w=0;w<600&&!(S[0].st==='idle'||S[0].st==='walk');w++)tick();__T(10);B.input.net();__T(5);const ok=B.st()==='out';o.ups.push(ok||B.lastMsg);return ok};
            const last=()=>(B.log.filter(e=>e.e==='pack').slice(-1)[0]||{}).why;
            up();press('p',1);__T(3);press('p',0);__T(10);o.punch={st:B.st(),why:last()};__T(60);
            up();S[0].hp-=5;__T(3);o.hit={st:B.st(),why:last()};S[0].hp+=5;
            up();HIT_SKY.on=true;__T(3);o.sky={st:B.st(),why:last()};HIT_SKY.on=false;__T(3);
            up();if(window.HIT_BOAT&&HIT_BOAT.B){HIT_BOAT.B.aboard=true;__T(3);o.boat={st:B.st(),why:last()};HIT_BOAT.B.aboard=false}
            up();__at(42,51);__T(20);o.water={st:B.st(),why:last()};__at(M[0],M[1]);__T(60);
            up();let room=null;for(const l of HIT_W192.lots){__at(l.x,l.z);__T(2);if(HIT_LIFE.insideId()){room=l.id;break}}o.inside={st:B.st(),why:last(),room};__at(M[0],M[1]);__T(30);
            up();B.input.away();o.away={st:B.st(),why:last()};
            o.ok=o.ups.every(u=>u===true)&&o.punch.st==='off'&&o.punch.why==='fight'&&o.hit.why==='fight'&&o.sky.why==='area'&&(!o.boat||o.boat.why==='boat')&&o.water.why==='water'&&o.inside.why==='inside'&&o.away.st==='off';return o}''')
        # ---------- walk ----------
        C['walk'] = await pg.evaluate('''()=>{const run=(net)=>{__reset();__at(-48,-24);__T(30);if(net)HIT_BUGS.input.net();const x0=S[0].x,z0=S[0].z;for(let i=0;i<180;i++){cam.yaw=0;H0.ax=-1;H0.az=0;tick()}H0.ax=H0.az=0;__T(20);const d=Math.hypot(S[0].x-x0,S[0].z-z0);const st=HIT_BUGS.st();__reset();return{d:+d.toFixed(3),st}};
            run(false);const a=run(false),b=run(true),c=run(false);return{without:a,with:b,withoutAgain:c,ok:b.st==='out'&&Math.abs(a.d-b.d)<.01*a.d+1e-3&&Math.abs(c.d-b.d)<.01*c.d+1e-3}}''')
        # ---------- draw in every state ----------
        C['draw'] = await pg.evaluate('''()=>{const B=HIT_BUGS;__reset();const seen={};for(const ph of ['day','dusk','night']){B.phaseOverride=ph;B.clear();__at(-14,-12);__T(40);__draw();__at(30,40);__T(40);__draw()}
            B.phaseOverride='day';B.input.net();__draw();seen.out=B.st();B.input.swing();__T(4);__draw();seen.swing=B.st();const a=S[0],u=B.spawn('cabbage',a.x+a.fx*1.25,.9,a.z+a.fz*1.25);__T(14);__draw();seen.after=B.st();
            B.openBook();__draw();seen.book=B.bookOpen&&document.querySelectorAll('#bug-panel .row').length;B.closeBook();__reset();__draw();B.phaseOverride=null;
            return{seen,err:__drawErr,modErr:B.error,ok:!__drawErr&&!B.error&&seen.out==='out'&&seen.swing==='swing'&&seen.book===10}}''')
        # ---------- book ----------
        bk = await pg.evaluate('''()=>{const B=HIT_BUGS,c=__ev('catch'),agg={};for(const e of c){const q=agg[e.sp]||(agg[e.sp]={n:0,best:0});q.n++;q.best=Math.max(q.best,e.size)}B.openBook();const sub=document.querySelector('#bug-panel .sub').textContent;B.closeBook();return{book:B.book(),agg,sub}}''')
        await pg.reload(); await boot(pg)
        bk2 = await pg.evaluate('HIT_BUGS.book()')
        okb = all(bk['book']['sp'].get(k, {}).get('n') == v['n'] and abs(bk['book']['sp'][k]['best'] - v['best']) < 1e-9 for k, v in bk['agg'].items()) and len(bk['agg']) == len(bk['book']['sp'])
        got = sum(1 for k in bk['book']['sp'] if bk['book']['sp'][k]['n'] > 0)
        C['book'] = {'species': got, 'catches': bk['book'].get('catches'), 'panel': bk['sub'], 'matchesLog': okb, 'keptAfterReload': bk2 == bk['book'],
                     'ok': okb and bk2 == bk['book'] and got == 10 and bk['sub'].startswith('10 of 10')}
        C['audit'] = await pg.evaluate('()=>{const a=HIT_DC.eco.audit();return{ok:a.ok,issues:(a.issues||[]).slice(0,5)}}')
        mods = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        C['errors'] = {'module': mods, 'page': errs[:10], 'ok': not mods and not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    s = json.dumps(out, indent=1); print(s)
    if OUT: open(OUT, 'w').write(s)
asyncio.run(main())
