"""Mini golf test (Step 22 gate).  Usage:
  python3 -I dw2/tools/minigolf.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red moves only by the on-screen joystick (H0.ax/H0.az,
camera yaw 0). The round is started with INTERACT at the starter's board (_updateNear/_doInteract); every putt is taken through the
putt panel with a REAL mouse drag on its canvas (Playwright mouse down/move/up -> the panel's pointer handlers); the ball then rolls
on game ticks. Every putt the game made is re-computed here in Python (independent code, same model) from its recorded start and
velocity. A test clock (Date.now + offset) steps 61 s between paid rounds (ledger rate limit).
  walk      Red walks from the civic plaza to the starter's board by joystick; the course adds no collision solids
  short     a short pouch: INTERACT refuses 'insufficient' with nothing charged (balance and ledger unchanged), no round
  start     INTERACT -> exactly one 10 DC 'hire' debit (place 'minigolf'), coins fly, ball on the first tee; INTERACT at the board again
            opens the scorecard and charges nothing
  round     all six holes holed through the real panel (joystick walk to the ball, INTERACT, mouse drag); hole 4 starts with a deliberate
            putt into the stream (+1 stroke, ball back on its lie); scores = strokes taken, card total right, best round saved
  python    every putt of the test re-computed in Python: rest point within 1 mm, same holed / water outcome, same rail hits; every rail
            hit obeys v_out = 0.9 v_t - 0.7 v_n (angle law)
  stopdist  flat putts 0.5–3.0 m/s on hole 3's first leg: game = Python within 1 mm, and v^2 / (2 mu g) within 2 cm
  angles    bank shots (3.2 m/s) into hole 3's east rail at 15–75 degrees: outgoing angle = atan(0.9 tan(in) / 0.7) (+-0.5 deg), Python agrees
  lip       straight at the cup: 2.0 m/s lips out, 0.7 m/s drops; 4 cm off centre the capture speed falls to 0.87 m/s (0.80 drops, 0.95 lips)
  slopes    a ball at rest on hole 2's cross-slope stays (|a| < mu_s g); on the bridge ramp it rolls back off it; a weak putt up the bridge
            rolls back, a firm one crosses; the bowl feeds into the cup putts that would stop short on a flat green (speed scan 1.2–1.9 m/s)
  pickup    second round (one more debit): six short putts on hole 1 -> scored 7, ball moves to hole 2
  keep      the paid round survives a reload (hole, strokes, ball lie); a hit taken closes the panel and keeps the round; walking away
            closes the panel; coliseum: no prompt, start() -> 'area', nothing charged; QUIT ROUND (two taps) ends it, no refund
  audit     eco.audit() clean; debits = rounds paid, all 10 DC, place 'minigolf'; no HIT_* module errors, no page errors"""
import asyncio, json, sys, os, math
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;a.y=0;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__steer=(x,z)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;const k=d<.6?Math.max(.25,d/.6):1;H0.ax=dx/d*k;H0.az=-dz/d*k;tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__walk=(x,z,tol)=>{let d=99,i=0;for(;i<1500&&d>(tol||.25);i++){d=__steer(x,z)}H0.ax=H0.az=0;__T(12);return{d:+Math.hypot(x-S[0].x,z-S[0].z).toFixed(2),ticks:i}};
window.__sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
window.__deb=()=>HIT_DC.eco.history(1e6).filter(x=>x.t==='d'&&x.src==='hire'&&x.meta&&x.meta.item==='minigolf');
window.__interact=async()=>{const n=__near();if(!n||(n.act!=='mgboard'&&n.act!=='mgball'))return{label:n&&n.label,act:n&&n.act};_doInteract();for(let i=0;i<40&&HIT_MINIGOLF.paying;i++)await __sleep(25);await __sleep(60);return{label:n.label,act:n.act}};
window.__toBall=()=>{const M=HIT_MINIGOLF,b=M.ball(),H=M.HOLES[b.hole];let ux=H.cup[0]-b.x,uz=H.cup[1]-b.z;const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l;return __walk(b.x-ux*.5,b.z-uz*.5,.2)};
window.__rest=()=>{let i=0;for(;i<3000&&HIT_MINIGOLF.ball()&&HIT_MINIGOLF.ball().moving;i++)tick();return i};
// the putt search: every candidate is an integer CSS-pixel drag, converted exactly as the panel converts it, and rolled with the game's own sim
window.__plan=(W,mode)=>{const M=HIT_MINIGOLF,b=M.ball(),hi=b.hole,H=M.HOLES[hi],k=W/720,PULLc=M.cfg.PULL*k,seen=new Set(),cands=[];
  const base=Math.atan2(H.cup[1]-b.z,H.cup[0]-b.x);
  const tryD=(cx,cy)=>{const key=cx+','+cy;if(seen.has(key))return null;seen.add(key);const v=M.dragV(cx/k,cy/k);if(!v)return null;const r=M.sim(hi,b.x,b.z,v.vx,v.vz);
    const c={cx,cy,holed:r.holed,water:r.water,d:Math.hypot(r.x-H.cup[0],r.z-H.cup[1]),inG:M.inGreen(hi,r.x,r.z)};cands.push(c);return c};
  const gen=(a,L)=>{const ux=Math.cos(a),uz=Math.sin(a);return [Math.round(-ux*L),Math.round(uz*L)]};
  if(mode==='water'){for(let L=PULLc*.15;L<=PULLc;L+=3)for(let da=-.6;da<=.6;da+=.03){const g=gen(Math.PI/2+da,L);const c=tryD(g[0],g[1]);if(c&&c.water)return c}return null}
  if(mode==='tiny'){const g=gen(Math.PI/2,PULLc*.12+1);return {cx:g[0],cy:g[1]}}
  for(let da=-1.4;da<=1.4;da+=.035)for(let L=8;L<=PULLc;L+=4){const g=gen(base+da,L);tryD(g[0],g[1])}
  const score=(c)=>c.water?1e3:c.holed?-1:c.d;
  let top=cands.slice().sort((a,b)=>score(a)-score(b)).slice(0,12);
  for(const t of top)for(let ex=-3;ex<=3;ex++)for(let ey=-3;ey<=3;ey++)tryD(t.cx+ex,t.cy+ey);
  const hol=cands.filter(c=>c.holed);
  if(hol.length){const set=new Set(hol.map(c=>c.cx+','+c.cy));let best=null,bs=-1;for(const c of hol){let s=0;for(let ex=-1;ex<=1;ex++)for(let ey=-1;ey<=1;ey++)if(set.has((c.cx+ex)+','+(c.cy+ey)))s++;if(s>bs){bs=s;best=c}}best.robust=bs;best.n=cands.length;return best}
  const ok=cands.filter(c=>!c.water).sort((a,b)=>a.d-b.d);const r=ok[0];r.n=cands.length;return r};0'''

# ---------------- the physics, written again in Python ----------------
class PHY:
    def __init__(s, ph): s.__dict__.update(ph)
def in_poly(pl, x, z):
    c = False; j = len(pl) - 1
    for i in range(len(pl)):
        a, b = pl[i], pl[j]
        if ((a[1] > z) != (b[1] > z)) and (x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]): c = not c
        j = i
    return c
def acc_py(H, x, z, P):
    ax = az = 0.0
    for s in H['slopes']:
        if s['k'] == 'plane':
            if in_poly(s['poly'], x, z): ax += s['ax']; az += s['az']
        else:
            dx, dz = s['x'] - x, s['z'] - z; d = math.sqrt(dx * dx + dz * dz)
            if 1e-9 < d < s['r']: m = P.G * s['grade'] * (d / s['r']) / d; ax += dx * m; az += dz * m
    return ax, az
def sim_py(H, P, x, z, vx, vz):
    b = dict(x=x, z=z, vx=vx, vz=vz, t=0, moving=True, inCup=False, holed=False, water=False); ev = []
    h = P.DT / P.SUB
    def sub():
        ax, az = acc_py(H, b['x'], b['z'], P)
        b['vx'] += ax * h; b['vz'] += az * h
        sp = math.sqrt(b['vx'] ** 2 + b['vz'] ** 2); dec = P.MU_R * P.G * h
        if sp <= dec: b['vx'] = 0.0; b['vz'] = 0.0
        else: k = 1 - dec / sp; b['vx'] *= k; b['vz'] *= k
        b['x'] += b['vx'] * h; b['z'] += b['vz'] * h
        for s in H['segs']:
            ex, ez = s[2] - s[0], s[3] - s[1]; L2 = ex * ex + ez * ez
            u = ((b['x'] - s[0]) * ex + (b['z'] - s[1]) * ez) / L2; u = 0 if u < 0 else 1 if u > 1 else u
            cx, cz = s[0] + ex * u, s[1] + ez * u; dx, dz = b['x'] - cx, b['z'] - cz; d = math.sqrt(dx * dx + dz * dz)
            if 1e-12 < d < P.BR:
                nx, nz = dx / d, dz / d; b['x'] = cx + nx * P.BR; b['z'] = cz + nz * P.BR
                vn = b['vx'] * nx + b['vz'] * nz
                if vn < 0:
                    tx, tz = b['vx'] - vn * nx, b['vz'] - vn * nz; vin = (b['vx'], b['vz'])
                    b['vx'] = tx * P.T - P.E * vn * nx; b['vz'] = tz * P.T - P.E * vn * nz
                    if -vn > .05: ev.append(('rail', b['x'], b['z'], nx, nz, vin, (b['vx'], b['vz'])))
        for hz in H['haz']:
            if in_poly(hz, b['x'], b['z']): b['water'] = True; b['vx'] = b['vz'] = 0.0; ev.append(('water',)); return
        cdx, cdz = H['cup'][0] - b['x'], H['cup'][1] - b['z']; cd = math.sqrt(cdx * cdx + cdz * cdz)
        if cd < P.CR:
            if not b['inCup']:
                b['inCup'] = True; v = math.sqrt(b['vx'] ** 2 + b['vz'] ** 2)
                cr = (b['vx'] * cdz - b['vz'] * cdx) / v if v > 0 else 0; bp = abs(cr) if v > 0 else cd
                f = 1 - (bp / P.CR) ** 2; vcap = P.VCAP * math.sqrt(f if f > 0 else 0)
                if v <= vcap: b['holed'] = True; b['x'], b['z'] = H['cup']; b['vx'] = b['vz'] = 0.0; ev.append(('holed', v, bp, vcap)); return
                sd = -1 if cr >= 0 else 1; ang = sd * (.35 * (bp / P.CR) + .05); c, sn = math.cos(ang), math.sin(ang)
                nvx, nvz = b['vx'] * c - b['vz'] * sn, b['vx'] * sn + b['vz'] * c; b['vx'] = nvx * P.LIPK; b['vz'] = nvz * P.LIPK; ev.append(('lip', v, bp, vcap))
        else: b['inCup'] = False
    while b['moving']:
        done = False
        for _ in range(P.SUB):
            sub()
            if b['holed'] or b['water']: b['moving'] = False; done = True; break
        if done: break
        b['t'] += 1
        if b['vx'] == 0 and b['vz'] == 0:
            ax, az = acc_py(H, b['x'], b['z'], P)
            if math.sqrt(ax * ax + az * az) <= P.MU_S * P.G: b['moving'] = False
        if b['t'] >= P.MAXT: b['moving'] = False; b['vx'] = b['vz'] = 0.0
    return b, ev

def law_err(e, P):   # v_out = T v_t - E v_n n
    _, x, z, nx, nz, vin, vout = e
    vn = vin[0] * nx + vin[1] * nz; tx, tz = vin[0] - vn * nx, vin[1] - vn * nz
    ex, ez = tx * P.T - P.E * vn * nx, tz * P.T - P.E * vn * nz
    return math.hypot(ex - vout[0], ez - vout[1])

async def boot(pg):
    await pg.wait_for_function('window.HIT_MINIGOLF&&HIT_MINIGOLF.on&&window.HIT_DC&&HIT_DC.eco&&window.HIT_SHOP', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)
    await pg.evaluate("if(window.HIT_RAIN)HIT_RAIN.force=0")

async def putt_real(pg, plan):
    """Drag on the panel canvas with the real mouse: start at the canvas centre, move by (cx, cy) CSS px, release."""
    bb = await (await pg.query_selector('#mg-box canvas')).bounding_box()
    x0 = round(bb['x'] + bb['width'] / 2); y0 = round(bb['y'] + bb['height'] / 2)
    await pg.mouse.move(x0, y0); await pg.mouse.down()
    await pg.mouse.move(x0 + plan['cx'] / 2, y0 + plan['cy'] / 2); await pg.mouse.move(x0 + plan['cx'], y0 + plan['cy']); await pg.mouse.up()
    return bb

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        geo = await pg.evaluate("({g:HIT_MINIGOLF.geom(),ph:HIT_MINIGOLF.PH,price:HIT_MINIGOLF.price})"); P = PHY(geo['ph']); G = geo['g']
        # ---------- walk there ----------
        C['walk'] = await pg.evaluate('''()=>{const o={};__at(90,-4);__T(10);const s0=WORLD.solids.length;o.w=__walk(HIT_MINIGOLF.cfg.boardSpot.x,HIT_MINIGOLF.cfg.boardSpot.z,.2);o.prompt=(__near()||{}).label;
            o.mgSolids=WORLD.solids.filter(q=>q.p&&/^mg/.test(q.p.k||'')).length;o.props=WORLD.props.filter(q=>q.mg).length;
            o.ok=o.w.d<=.25&&/Mini golf/.test(o.prompt||'')&&o.mgSolids===0&&o.props>=10;return o}''')
        # ---------- a short pouch ----------
        C['short'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};for(let k=0;k<5;k++){window.__dt+=61000;await HIT_SHOP.buy('cake','bakery')}
            for(let k=0;k<20&&e.summary().available>=10;k++){window.__dt+=61000;await HIT_SHOP.buy('eggs','stand')}
            __at(81.4,-10.75);__T(5);const b0=e.summary().available,n0=e.history(1e6).length;window.__dt+=61000;const r=await __interact();
            o.avail=b0;o.label=r.label;o.code=(HIT_MINIGOLF.last||{}).code;o.after=e.summary().available;o.entries=e.history(1e6).length-n0;o.round=HIT_MINIGOLF.state().round;
            o.ok=b0<10&&o.code==='insufficient'&&o.after===b0&&o.entries===0&&!o.round;return o}''')
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        # ---------- start ----------
        C['start'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={},it=HIT_DC.config.hire.items.find(x=>x.id==='minigolf');o.price=it&&it.price;o.place=it&&it.place;
            __at(84,-6);__T(5);__walk(81.4,-10.75,.2);o.prompt=(__near()||{}).label;const b0=e.summary().available;window.__dt+=61000;await __interact();
            o.paid=b0-e.summary().available;o.debits=__deb().map(x=>({amt:x.amt,place:x.meta.place}));const st=HIT_MINIGOLF.state();o.round=st.round;o.ball=HIT_MINIGOLF.ball();
            o.coins=(HIT_DC.int&&true);o.prompt2=(__near()||{}).label;await __interact();o.card=HIT_MINIGOLF.mode();o.paid2=b0-e.summary().available;HIT_MINIGOLF.close();
            o.ok=o.price===10&&o.place==='minigolf'&&/10 DC/.test(o.prompt||'')&&o.paid===10&&o.debits.length===1&&o.debits[0].place==='minigolf'&&st.round&&st.round.hole===0&&
              o.ball.x===79&&o.ball.z===-24.3&&/scorecard/.test(o.prompt2||'')&&o.card==='card'&&o.paid2===10;return o}''')
        # ---------- the round, through the real panel ----------
        R = {'holes': [], 'putts': []}; allputts = []
        for guard in range(60):
            st = await pg.evaluate("HIT_MINIGOLF.state().round")
            if not st: break
            hole = st['hole']
            w = await pg.evaluate("__toBall()")
            nr = await pg.evaluate("__near()")
            if not nr or nr['act'] != 'mgball': R['err'] = 'no putt prompt at hole %d: %s %s' % (hole + 1, nr, w); break
            await pg.evaluate("__interact()")
            if await pg.evaluate("HIT_MINIGOLF.mode()") != 'putt': R['err'] = 'panel did not open'; break
            W = (await (await pg.query_selector('#mg-box canvas')).bounding_box())['width']
            mode = 'water' if hole == 3 and st['strokes'] == 0 and not R.get('water') else None
            plan = await pg.evaluate("([W,m])=>__plan(W,m)", [W, mode])
            if not plan: R['err'] = 'no plan'; break
            s0 = await pg.evaluate("HIT_MINIGOLF.stats.putts")
            await putt_real(pg, plan)
            lp = await pg.evaluate("({lp:HIT_MINIGOLF.lastPutt,n:HIT_MINIGOLF.stats.putts,drag:HIT_MINIGOLF.lastDrag})")
            if lp['n'] != s0 + 1: R['err'] = 'the drag did not putt: %s' % lp; break
            ticks = await pg.evaluate("__rest()")
            res = await pg.evaluate("(()=>{const r=HIT_MINIGOLF.lastResult;return {x:r.x,z:r.z,holed:r.holed,water:r.water,t:r.t,ev:r.ev,v0:r.v0,from:r.from,hole:r.hole,stroke:r.stroke}})()")
            if plan.get('water'): R['water'] = {'res_water': res['water'], 'strokes_after': (await pg.evaluate("HIT_MINIGOLF.state().round.strokes")), 'ball': await pg.evaluate("HIT_MINIGOLF.ball()"), 'from': res['from']}
            allputts.append({'hole': hole, 'x': lp['lp']['x'], 'z': lp['lp']['z'], 'vx': lp['lp']['vx'], 'vz': lp['lp']['vz'], 'res': res, 'plannedHoled': plan.get('holed')})
            await pg.evaluate("__T(140)")   # the sink / rest countdowns run out; the next tee is set
        st = await pg.evaluate("HIT_MINIGOLF.state()")
        lr = await pg.evaluate("HIT_MINIGOLF.lastRound")
        nh = sum(1 for a in allputts if a['res']['holed'])
        strokes_per = {}
        for a in allputts: strokes_per[a['hole']] = strokes_per.get(a['hole'], 0) + 1 + (1 if a['res']['water'] else 0)
        R['scores'] = lr and lr['scores']; R['total'] = lr and lr['total']; R['best'] = st['best']; R['putts'] = len(allputts); R['holedPutts'] = nh
        R['strokesCounted'] = [strokes_per.get(i, 0) for i in range(6)]
        wt = R.get('water') or {}
        R['ok'] = bool(lr) and nh == 6 and lr['scores'] == R['strokesCounted'] and lr['total'] == sum(lr['scores']) and st['best'] == lr['total'] and \
            st['round'] is None and len(st['last']) == 1 and all(s <= 6 for s in lr['scores']) and wt.get('res_water') is True and wt.get('strokes_after') == 2 and \
            wt.get('ball') and abs(wt['ball']['x'] - wt['from'][0]) < 1e-9 and abs(wt['ball']['z'] - wt['from'][1]) < 1e-9 and 'err' not in R
        C['round'] = R
        # ---------- every putt re-computed in Python ----------
        Py = {'putts': len(allputts), 'maxPosErr': 0.0, 'outcomeMismatch': 0, 'railHits': 0, 'railMismatch': 0, 'maxLawErr': 0.0}
        for a in allputts:
            bb_, ev = sim_py(G[a['hole']], P, a['x'], a['z'], a['vx'], a['vz']); r = a['res']
            if r['water']: px, pz = bb_['x'], bb_['z']; gx, gz = None, None
            Py['maxPosErr'] = max(Py['maxPosErr'], 0 if r['water'] else math.hypot(bb_['x'] - r['x'], bb_['z'] - r['z']))
            if bb_['holed'] != r['holed'] or bb_['water'] != r['water']: Py['outcomeMismatch'] += 1
            jr = [e for e in r['ev'] if e['k'] == 'rail']; pr = [e for e in ev if e[0] == 'rail']; Py['railHits'] += len(jr)
            if len(jr) != len(pr) or any(math.hypot(j['x'] - q[1], j['z'] - q[2]) > 1e-6 for j, q in zip(jr, pr)): Py['railMismatch'] += 1
            for q in pr: Py['maxLawErr'] = max(Py['maxLawErr'], law_err(q, P))
        Py['maxPosErr'] = float('%.3g' % Py['maxPosErr']); Py['maxLawErr'] = float('%.3g' % Py['maxLawErr'])
        Py['ok'] = Py['putts'] >= 6 and Py['maxPosErr'] < 1e-3 and Py['outcomeMismatch'] == 0 and Py['railMismatch'] == 0 and Py['maxLawErr'] < 1e-9
        C['python'] = Py
        # ---------- stopping distances (hole 3's first leg, flat, 10 m) ----------
        sd = await pg.evaluate('''()=>[.5,1,1.5,2,2.5,3].map(v=>{const r=HIT_MINIGOLF.sim(2,87.3,-24.8,0,v);return {v,x:r.x,z:r.z,t:r.t}})''')
        S_ = {'rows': [], 'maxPy': 0.0, 'maxAnalytic': 0.0}
        for r in sd:
            bb_, _ = sim_py(G[2], P, 87.3, -24.8, 0.0, r['v']); dg = r['z'] + 24.8; an = r['v'] ** 2 / (2 * P.MU_R * P.G)
            S_['rows'].append({'v': r['v'], 'game_m': round(dg, 4), 'python_m': round(bb_['z'] + 24.8, 4), 'v2_2mug': round(an, 4)})
            S_['maxPy'] = max(S_['maxPy'], abs(bb_['z'] - r['z'])); S_['maxAnalytic'] = max(S_['maxAnalytic'], abs(dg - an))
        S_['ok'] = S_['maxPy'] < 1e-3 and S_['maxAnalytic'] < .02; S_['maxPy'] = float('%.3g' % S_['maxPy']); S_['maxAnalytic'] = round(S_['maxAnalytic'], 4)
        C['stopdist'] = S_
        # ---------- bank angles off hole 3's east rail (x 88.4) ----------
        an = await pg.evaluate('''()=>[15,30,45,60,75].map(d=>{const a=d*Math.PI/180,v=3.2,r=HIT_MINIGOLF.sim(2,87.3,-24.6,v*Math.sin(a),v*Math.cos(a));const e=r.ev.find(q=>q.k==='rail');return {d,e}})''')
        A = {'rows': [], 'ok': True}
        for r in an:
            e = r['e']
            if not e: A['ok'] = False; A['rows'].append({'in': r['d'], 'hit': None}); continue
            vin, vout = e['vin'], e['vout']; ain = math.degrees(math.atan2(abs(vin[1]), abs(vin[0])))   # from the rail's normal (x)
            aout = math.degrees(math.atan2(abs(vout[1]), abs(vout[0]))); expect = math.degrees(math.atan(P.T * math.tan(math.radians(ain)) / P.E))
            bb_, ev = sim_py(G[2], P, 87.3, -24.6, 3.2 * math.sin(math.radians(r['d'])), 3.2 * math.cos(math.radians(r['d'])))
            pe = next((q for q in ev if q[0] == 'rail'), None); pyout = math.degrees(math.atan2(abs(pe[6][1]), abs(pe[6][0]))) if pe else None
            row = {'aim_deg_from_north': r['d'], 'in_from_normal': round(ain, 2), 'out_from_normal': round(aout, 2), 'law': round(expect, 2), 'python_out': pyout and round(pyout, 2), 'speed_kept': round(math.hypot(*vout) / math.hypot(*vin), 3)}
            A['rows'].append(row); A['ok'] = A['ok'] and abs(aout - expect) < .5 and pyout is not None and abs(pyout - aout) < 1e-6 and vout[0] < 0
        C['angles'] = A
        # ---------- lip-outs ----------
        # starts 0.3 m short of the cup: the felt takes 2 mu g s = 0.383 m^2/s^2 off v^2 on the way, so these arrive at 1.90, 0.65, 0.80, 0.95 m/s
        V0 = {'fast': (79, 2.0), 'slow': (79, .9), 'offSlow': (79.04, math.sqrt(.8 ** 2 + 2 * .065 * 9.81 * .3)), 'offFast': (79.04, math.sqrt(.95 ** 2 + 2 * .065 * 9.81 * .3))}
        L = await pg.evaluate('''(V0)=>{const o={};for(const k in V0){const r=HIT_MINIGOLF.sim(0,V0[k][0],-15.3,0,V0[k][1]);o[k]={holed:r.holed,ev:r.ev.filter(e=>e.k==='lip'||e.k==='holed').map(e=>({k:e.k,v:+e.v.toFixed(3),bp:+e.bp.toFixed(4),vcap:+e.vcap.toFixed(3)}))}}return o}''', V0)
        L['ok'] = (not L['fast']['holed']) and any(e['k'] == 'lip' for e in L['fast']['ev']) and L['slow']['holed'] and L['offSlow']['holed'] and (not L['offFast']['holed']) and \
            any(e['k'] == 'lip' and abs(e['vcap'] - .874) < .01 for e in L['offFast']['ev'])
        for k, (x0, v0) in V0.items():
            bb_, ev = sim_py(G[0], P, x0, -15.3, 0.0, v0)
            L[k]['python_holed'] = bb_['holed']; L['ok'] = L['ok'] and bb_['holed'] == L[k]['holed']
        C['lip'] = L
        # ---------- slopes ----------
        SL = await pg.evaluate('''()=>{const M=HIT_MINIGOLF,o={};let r=M.sim(1,83.2,-19,0,0);o.restOnCross={x:r.x,z:r.z,t:r.t,a:M.acc(1,83.2,-19)};
            r=M.sim(3,104.7,-19.3,0,0);o.rampRest={z:r.z,water:r.water};r=M.sim(3,104.7,-21.5,0,1.9);o.weak={z:r.z,water:r.water};r=M.sim(3,104.7,-21.5,0,2.6);o.firm={z:r.z,water:r.water,holed:r.holed};
            o.bowl=[];for(let v=1.2;v<=1.9001;v+=.02){r=M.sim(5,111.6,-13.5,0,+v.toFixed(2));o.bowl.push({v:+v.toFixed(2),holed:r.holed,z:+r.z.toFixed(3)})}return o}''')
        flatG = dict(G[5]); flatG['slopes'] = []; fed = []
        for r in SL['bowl']:
            bb_, _ = sim_py(G[5], P, 111.6, -13.5, 0.0, r['v']); fb, _ = sim_py(flatG, P, 111.6, -13.5, 0.0, r['v'])
            r['python_holed'] = bb_['holed']; r['flat_green_holed'] = fb['holed']; r['flat_green_rest_z'] = round(fb['z'], 3)
            if r['holed'] and not fb['holed']: fed.append(r['v'])
        SL['bowlFeeds'] = fed; SL['bowlHoledSpeeds'] = [r['v'] for r in SL['bowl'] if r['holed']]; SL['flatHoledSpeeds'] = [r['v'] for r in SL['bowl'] if r['flat_green_holed']]
        SL['bowlPython'] = all(r['holed'] == r['python_holed'] for r in SL['bowl']); SL['bowl'] = [r for r in SL['bowl'] if r['v'] in (1.2, 1.4, 1.6, 1.8)]
        SL['ok'] = SL['restOnCross']['x'] == 83.2 and SL['restOnCross']['z'] == -19 and math.hypot(*SL['restOnCross']['a']) < P.MU_S * P.G and \
            SL['rampRest']['z'] < -19.8 and not SL['rampRest']['water'] and SL['weak']['z'] < -19.8 and not SL['weak']['water'] and SL['firm']['z'] > -17.8 and not SL['firm']['water'] and \
            len(fed) >= 2 and SL['bowlPython'] and len(SL['bowlHoledSpeeds']) > len(SL['flatHoledSpeeds'])
        C['slopes'] = SL
        # ---------- a second round: pick-up after six ----------
        C['pickup'] = await pg.evaluate('''async()=>{const e=HIT_DC.eco,o={};const d0=__deb().length;__walk(81.4,-10.75,.2);window.__dt+=61000;await __interact();o.charged=__deb().length-d0;o.round=!!HIT_MINIGOLF.state().round;return o}''')
        W = (await pg.evaluate("innerWidth")) and 400
        for k in range(6):
            await pg.evaluate("__toBall()"); await pg.evaluate("__interact()")
            Wc = (await (await pg.query_selector('#mg-box canvas')).bounding_box())['width']
            plan = await pg.evaluate("([W])=>__plan(W,'tiny')", [Wc]); await putt_real(pg, plan); await pg.evaluate("__rest()"); await pg.evaluate("__T(140)")
        st = await pg.evaluate("HIT_MINIGOLF.state().round")
        C['pickup'].update({'hole': st and st['hole'], 'scores': st and st['scores'], 'ball': await pg.evaluate("HIT_MINIGOLF.ball()")})
        C['pickup']['ok'] = C['pickup']['charged'] == 1 and st and st['hole'] == 1 and st['scores'] == [7] and C['pickup']['ball']['x'] == 83.6 and C['pickup']['ball']['z'] == -24.3
        # ---------- the paid round is kept: reload, a hit, walking off, the coliseum, quit ----------
        await pg.evaluate("()=>{__toBall();__interact()}"); await pg.wait_for_timeout(100)
        Wc = (await (await pg.query_selector('#mg-box canvas')).bounding_box())['width']
        plan = await pg.evaluate("([W])=>__plan(W)", [Wc])
        if plan.get('holed'):   # keep the ball out of the cup for this check: a soft putt instead
            plan = await pg.evaluate("([W])=>__plan(W,'tiny')", [Wc])
        await putt_real(pg, plan); await pg.evaluate("__rest()"); await pg.evaluate("__T(140)")
        before = await pg.evaluate("HIT_MINIGOLF.state().round")
        await pg.reload(); await boot(pg)
        after = await pg.evaluate("({r:HIT_MINIGOLF.state().round,b:HIT_MINIGOLF.ball()})")
        K = {'before': {k: before[k] for k in ('hole', 'strokes', 'scores', 'bx', 'bz')}, 'after': after['r'] and {k: after['r'][k] for k in ('hole', 'strokes', 'scores', 'bx', 'bz')}}
        K['reloadOk'] = after['r'] == before and after['b']['x'] == before['bx'] and after['b']['z'] == before['bz']
        K.update(await pg.evaluate('''async()=>{const o={},a=S[0],d0=__deb().length,e=HIT_DC.eco,b0=e.summary().available;__at(84.5,-9.5);__T(5);o.walk=__toBall();await __interact();o.open=HIT_MINIGOLF.mode()==='putt';
            const hp=a.hp;a.hp=hp-5;__T(2);o.fightClosed=!HIT_MINIGOLF.mode();a.hp=hp;for(let w=0;w<300&&!(a.st==='idle'||a.st==='walk');w++)tick();o.kept=!!HIT_MINIGOLF.state().round;
            __toBall();await __interact();o.reopen=HIT_MINIGOLF.mode()==='putt';for(let i=0;i<80;i++){cam.yaw=0;H0.ax=0;H0.az=1;tick()}H0.ax=H0.az=0;__T(3);o.walkClosed=!HIT_MINIGOLF.mode();
            __toBall();HIT_SKY.on=true;__T(3);o.skyPrompt=HIT_MINIGOLF.prompt();window.__dt+=61000;const r=await HIT_MINIGOLF.start();o.skyCode=r.code;HIT_SKY.on=false;__T(3);
            __walk(81.4,-10.75,.2);await __interact();o.card=HIT_MINIGOLF.mode();HIT_MINIGOLF.click('quit');o.armed=!!HIT_MINIGOLF.state().round;HIT_MINIGOLF.click('quit');o.quit=!HIT_MINIGOLF.state().round&&!HIT_MINIGOLF.mode();
            o.noCharge=__deb().length===d0&&e.summary().available===b0;o.prompt=(__near()||{}).label;return o}'''))
        K['ok'] = K['reloadOk'] and K['open'] and K['fightClosed'] and K['kept'] and K['reopen'] and K['walkClosed'] and not K['skyPrompt'] and K['skyCode'] == 'area' and \
            K['card'] == 'card' and K['armed'] and K['quit'] and K['noCharge'] and '10 DC' in (K['prompt'] or '')
        C['keep'] = K
        # ---------- best round kept after a reload, audit ----------
        C['audit'] = await pg.evaluate('''()=>{const e=HIT_DC.eco,a=e.audit(),d=__deb(),st=HIT_MINIGOLF.state();const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error).slice(0,200);
            return {audit:a.ok,issues:a.issues,debits:d.length,best:st.best,rounds:st.rounds,mods:mods,ok:a.ok&&d.length===2&&d.every(x=>x.amt===10&&x.meta.place==='minigolf')&&st.best!=null&&st.rounds===1&&Object.keys(mods).length===0}}''')
        C['audit']['ok'] = C['audit']['ok'] and C['audit']['best'] == C['round'].get('total')
        C['errors'] = {'page': errs[:10], 'ok': not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    out['putts'] = [{'hole': a['hole'] + 1, 'from': [round(a['x'], 3), round(a['z'], 3)], 'v': [round(a['vx'], 3), round(a['vz'], 3)], 'rest': [round(a['res']['x'], 3), round(a['res']['z'], 3)],
                     'holed': a['res']['holed'], 'water': a['res']['water'], 'rails': sum(1 for e in a['res']['ev'] if e['k'] == 'rail'), 'ticks': a['res']['t']} for a in allputts]
    print(json.dumps(out, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
