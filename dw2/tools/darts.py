"""Darts at the inn test (Step 19 gate).  Usage:
  python3 -I dw2/tools/darts.py <build.html> [--seed 7] [--rtc 12] [--x301 40] [--json out.json]
Seeds Math.random and drives the real game: INTERACT on the oche opens the panel, games start with the panel's real buttons, Red aims
with real pointer events on the board canvas (or sets the aim the way a drag does) and throws with the real THROW button. Every dart
in the game log is re-scored here in Python from its landing point with an independent board model, and every game is replayed here
with independent Round-the-Clock and 301 (straight in, double out, bust) rules, so the game cannot grade itself. Checks:
  prompt    no darts prompt on the street / elsewhere in the inn; on the oche "Darts: throw at the board"; INTERACT opens the panel
  ruleTable every remaining score 2..301 x every possible dart value: bust / win / new score match Python
  geometry  fixed points (bulls, every treble/double/single bed centre of all 20 numbers, misses, wire-adjacent points) and 20,000
            random points: the game's scorer agrees with Python
  tap       a real pointerdown on the canvas puts the aim at that board point
  wobble    the reticle settles after aiming (amplitude at 0.8 s < at 0 s) and wanders more once the arm tires (6 s > 0.8 s)
  throws    every Red dart lands within wobble + 5 sigma of the aim point and within 5 sigma (release scatter) of the reticle
  rtc       N round-the-clock games: targets advance only on the right number (bull at the end), dart count and record best match
  x301      M games of 301 vs the regular (Red: random mix of the checkout strategy and wild aim, so busts happen): every dart's score,
            every bust (below zero, leaving 1, zero without a double), every finish (double or bull's-eye only), turn order, visits of at
            most three darts, the winner and the W/L record all match the Python replay; the regular aims at a real bed every dart and
            goes for the double when he is on one
  flow      start refused mid-game; QUIT ends a game uncounted; CLOSE ends it uncounted; buttons shown match the state
  leave     stepping off the oche, walking out of the inn, a hit taken, the coliseum: the panel closes, the game is dropped (not counted);
            the coliseum refuses to open (area); a downed regular refuses 301 (regular) but allows round the clock
  reload    records survive a reload
  errors    no HIT_* module errors, no page errors"""
import asyncio, json, sys, os, math, random
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); NRTC = int(arg('--rtc', 12)); N301 = int(arg('--x301', 40)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__D=HIT_DARTS;
window.__oche=()=>{const c=__D.cfg.spot;__at(c.x,c.z);__T(30);__at(c.x,c.z);__T(1);__at(c.x,c.z)};
window.__open=()=>{if(__D.panel)return{label:'already',panel:__D.panel};__oche();const n=__near();_doInteract();return{label:n&&n.label,panel:__D.panel}};
window.__aimThrow=(x,y)=>{__D.setAim(x,y);const ok=__D.click('throw');return ok};0'''

# ---------------- independent board model (Python) ----------------
ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
def py_score(x, y):
    r = math.hypot(x, y)
    if r <= 6.35: return (50, 2, 25)
    if r <= 15.9: return (25, 1, 25)
    if r > 170: return (0, 0, 0)
    ang = math.degrees(math.atan2(x, y)) % 360          # clockwise from straight up
    seg = int(((ang + 9) % 360) // 18) % 20
    num = ORDER[seg]
    if r < 99: m = 1
    elif r <= 107: m = 3
    elif r < 162: m = 1
    else: m = 2
    return (num * m, m, num)
def bed(num, m):
    if num == 25: return (0.0, 0.0) if m == 2 else (0.0, 11.0)
    a = math.radians(ORDER.index(num) * 18); r = {3: 103, 2: 166, 1: 135}[m]
    return (math.sin(a) * r, math.cos(a) * r)

def replay(log, mode_games):
    """Replays the dart/visit/turn/end events of the log. Returns (games, bad list)."""
    bad = []; games = []; g = None
    for e in log:
        ev = e.get('ev')
        if ev == 'start':
            g = {'mode': e['mode'], 'darts': 0, 'visit': 0, 'turn': 'red', 'target': 1, 'rem': {'red': 301, 'reg': 301}, 'start': 301,
                 'over': None, 'busts': 0, 'redDarts': 0, 'regAimBad': 0, 'regDoubleChances': 0, 'regDoubleAimed': 0, 'finishes': []}
            games.append(g); continue
        if g is None: continue
        if ev == 'abandon': g['abandoned'] = True; g = None; continue
        if ev == 'dart':
            v, m, num = py_score(e['x'], e['y'])
            if (v, m, num) != (e['v'], e['m'], e['num']): bad.append(('score', e['x'], e['y'], (v, m, num), (e['v'], e['m'], e['num'])))
            if g['over']: bad.append(('dart after game over',)); continue
            if e['who'] != g['turn']: bad.append(('wrong thrower', e['who'], g['turn']))
            g['visit'] += 1; g['darts'] += 1
            if g['visit'] > 3: bad.append(('4th dart in a visit',))
            if g['mode'] == 'rtc':
                hit = (num == g['target']) if g['target'] <= 20 else (num == 25)
                if bool(e.get('hit')) != hit or e.get('target') != g['target']: bad.append(('rtc hit', g['target'], num, e.get('hit')))
                if hit: g['target'] += 1
                if g['target'] > 21: g['over'] = 'done'
            else:
                who = e['who']; rem = g['rem'][who]
                if e['before'] != rem or e['start'] != g['start']: bad.append(('301 rem before', rem, e['before'], g['start'], e['start']))
                if who == 'reg':
                    ax, ay = e['ax'], e['ay']
                    if not any(abs(ax - bx) < 1e-6 and abs(ay - by) < 1e-6 for bx, by in [bed(n, mm) for n in range(1, 21) for mm in (1, 2, 3)] + [bed(25, 1), bed(25, 2)]): g['regAimBad'] += 1
                    if rem == 50 or (rem <= 40 and rem % 2 == 0):
                        g['regDoubleChances'] += 1
                        want = bed(25, 2) if rem == 50 else bed(rem // 2, 2)
                        if abs(ax - want[0]) < 1e-6 and abs(ay - want[1]) < 1e-6: g['regDoubleAimed'] += 1
                n = rem - v
                if n < 0 or n == 1 or (n == 0 and m != 2): bust, win = True, False
                elif n == 0: bust, win = False, True
                else: bust, win = False, False
                if bool(e.get('bust')) != bust: bad.append(('bust flag', rem, v, m, e.get('bust')))
                if bool(e.get('win')) != win: bad.append(('win flag', rem, v, m, e.get('win')))
                if bust: g['rem'][who] = g['start']; g['busts'] += 1
                else: g['rem'][who] = n
                if win: g['over'] = who; g['finishes'].append((rem, v, m))
                if e['after'] != g['rem'][who]: bad.append(('301 rem after', g['rem'][who], e['after']))
                if who == 'red': g['redDarts'] += 1
            continue
        if ev == 'visit':
            g['visit'] = 0; continue
        if ev == 'turn':
            if g['mode'] != '301': bad.append(('turn in rtc',)); continue
            nt = 'reg' if g['turn'] == 'red' else 'red'
            if e['who'] != nt: bad.append(('turn order', e['who'], nt))
            g['turn'] = nt; g['start'] = g['rem'][nt]
            if e['start'] != g['start']: bad.append(('turn start', e['start'], g['start']))
            continue
        if ev == 'end':
            if g['mode'] == 'rtc':
                if g['over'] != 'done' or e['darts'] != g['darts']: bad.append(('rtc end', g['over'], e['darts'], g['darts']))
            else:
                if e['winner'] != g['over']: bad.append(('winner', e['winner'], g['over']))
                if e['redDarts'] != g['redDarts']: bad.append(('redDarts', e['redDarts'], g['redDarts']))
            g['ended'] = True
    return games, bad

async def boot(pg):
    await pg.wait_for_function('window.HIT_DC&&window.HIT_DARTS&&window.HIT_LIFE', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate(HELP)

async def main():
    out = {'seed': SEED, 'checks': {}, 'errors': []}
    C = out['checks']
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{for(let i=0;i<120;i++)tick()}")
        # ---------- prompt ----------
        C['prompt'] = await pg.evaluate('''()=>{const o={};__at(-24,103);__T(30);o.street=__near();const c=__D.cfg.spot;__at(c.x+2.2,c.z-.4);__T(30);__at(c.x+2.2,c.z-.4);o.inside=HIT_LIFE.insideId();o.away=__near();
            const r=__open();o.at=r.label;o.panel=r.panel;o.btns=__D.shown();o.ok=(!o.street||o.street.act!=='darts')&&o.inside==='nf_n1'&&(!o.away||o.away.act!=='darts')&&o.at==='Darts: throw at the board'&&o.panel==='darts'&&o.btns.join()==='rtc,x301,close';return o}''')
        # ---------- geometry ----------
        pts = [(0, 0), (0, 6.0), (0, 6.7), (0, 15.5), (0, 16.3), (0, 98.5), (0, 99.5), (0, 106.5), (0, 107.5), (0, 161.5), (0, 162.5), (0, 169.5), (0, 170.5), (0, 200), (300, 0)]
        for n in range(1, 21):
            for m in (1, 2, 3): pts.append(bed(n, m))
        for k in range(20):   # just either side of each wire between segments, in the treble ring
            a = math.radians(k * 18 + 9)
            for da in (-0.4, 0.4): pts.append((math.sin(a + math.radians(da)) * 103, math.cos(a + math.radians(da)) * 103))
        rnd = random.Random(SEED)
        pts += [(rnd.uniform(-240, 240), rnd.uniform(-240, 240)) for _ in range(20000)]
        got = await pg.evaluate('(pts)=>pts.map(([x,y])=>{const s=__D.rules.score(x,y);return[s.v,s.m,s.num]})', pts)
        gbad = [(pts[i], got[i], py_score(*pts[i])) for i in range(len(pts)) if tuple(got[i]) != py_score(*pts[i])]
        beds_ok = all(py_score(*bed(n, m)) == (n * m, m, n) for n in range(1, 21) for m in (1, 2, 3))
        C['geometry'] = {'points': len(pts), 'mismatch': len(gbad), 'examples': gbad[:5], 'bedCentresScoreRight': beds_ok, 'ok': not gbad and beds_ok}
        # ---------- 301 dart rule table: every remaining score 2..301 x every possible dart ----------
        darts = sorted({(n * m, m) for n in range(1, 21) for m in (1, 2, 3)} | {(25, 1), (50, 2), (0, 0)})
        tab = await pg.evaluate('(ds)=>{const o=[];for(let r=2;r<=301;r++)for(const [v,m] of ds){const s=__D.rules.step301(r,{v:v,m:m});o.push([r,v,m,s.rem,s.bust,s.win])}return o}', darts)
        tbad = []
        for r, v, m, rem, bust, win in tab:
            n = r - v
            eb, ew = (n < 0 or n == 1 or (n == 0 and m != 2)), (n == 0 and m == 2)
            er = r if eb else n
            if (rem, bust, win) != (er, eb, ew): tbad.append((r, v, m, rem, bust, win))
        C['ruleTable'] = {'cases': len(tab), 'busts': sum(1 for t in tab if t[4]), 'wins': sum(1 for t in tab if t[5]), 'mismatch': len(tbad), 'examples': tbad[:5], 'ok': not tbad and len(tab) > 10000}
        # ---------- tap path ----------
        C['tap'] = await pg.evaluate('''()=>{const o={};__D.click('rtc');const a=__D.tapBoard(-40,85);o.aim=a;o.ok=Math.abs(a.x+40)<.6&&Math.abs(a.y-85)<.6;return o}''')
        # ---------- wobble ----------
        C['wobble'] = await pg.evaluate('''async()=>{const o={};const amp=()=>__D.wobble().amp;__D.setAim(0,0);o.a0=amp();await new Promise(r=>setTimeout(r,800));o.a08=amp();await new Promise(r=>setTimeout(r,5200));o.a6=amp();
            o.ok=o.a0>o.a08+5&&o.a6>o.a08+3;__D.quit();return o}''')
        # ---------- round the clock ----------
        rtc = await pg.evaluate('''async(n)=>{__D.fast=true;const res=[];const R=__D.rules;
            for(let k=0;k<n;k++){__D.click('rtc');let guard=0;while(__D.game()&&!__D.game().over&&guard++<600){const g=__D.game();const t=g.target>20?{num:25,m:2}:{num:g.target,m:1};
              let p=R.aimPoint(t);if(Math.random()<.25)p={x:p.x+(Math.random()-.5)*120,y:p.y+(Math.random()-.5)*120};if(!__aimThrow(p.x,p.y))return{err:'throw refused',g}}
              const g=__D.game();res.push({darts:g.darts,over:g.over,best:__D.records().rtc.best});__D.click('quit')}
            return{res,rec:__D.records().rtc}}''', NRTC)
        # ---------- 301 ----------
        x301 = await pg.evaluate('''async(n)=>{__D.fast=true;const res=[];const R=__D.rules;const rec0=__D.records().x;
            for(let k=0;k<n;k++){if(!__D.click('x301'))return{err:'no 301 button',shown:__D.shown()};let guard=0;
              while(__D.game()&&!__D.game().over&&guard++<900){const g=__D.game();if(g.turn!=='red')return{err:'stuck on regular',g};
                let p=R.aimPoint(R.regularTarget(g.rem.red));const u=Math.random();if(u<.2)p={x:(Math.random()-.5)*360,y:(Math.random()-.5)*360};else if(u<.35)p={x:p.x+(Math.random()-.5)*50,y:p.y+(Math.random()-.5)*50};
                if(!__aimThrow(p.x,p.y))return{err:'throw refused',why:__D.canThrow(),g}}
              const g=__D.game();res.push({over:g.over,rem:g.rem});__D.click('quit')}
            return{res,rec0,rec1:__D.records().x}}''', N301)
        log = await pg.evaluate('()=>__D.log')
        games, bad = replay(log, None)
        throws = await pg.evaluate('''()=>{const s=__D.cfg.sigma;let n=0,far=0,farR=0,worst=0;for(const e of __D.log)if(e.ev==='dart'&&e.who==='red'){n++;const d=Math.hypot(e.x-e.ax,e.y-e.ay),dr=Math.hypot(e.x-e.rx,e.y-e.ry);worst=Math.max(worst,d);if(d>__D.cfg.ampMax*Math.SQRT2+5*s*Math.SQRT2)far++;if(dr>5*s*Math.SQRT2)farR++}return{n,far,farR,worstMm:+worst.toFixed(1)}}''')
        throws['ok'] = throws['n'] > 100 and throws['far'] == 0 and throws['farR'] == 0
        C['throws'] = throws
        rg = [g for g in games if g['mode'] == 'rtc' and not g.get('abandoned')]
        C['rtc'] = {'games': len(rg), 'darts': [g['darts'] for g in rg], 'allDone': all(g['over'] == 'done' and g.get('ended') for g in rg),
                    'bestMatches': (rtc.get('rec') or {}).get('best') == min([g['darts'] for g in rg] or [0]) and rtc['rec']['games'] == len(rg),
                    'err': rtc.get('err')}
        C['rtc']['ok'] = len(rg) == NRTC and C['rtc']['allDone'] and C['rtc']['bestMatches'] and not rtc.get('err')
        xg = [g for g in games if g['mode'] == '301' and not g.get('abandoned')]
        w = sum(1 for g in xg if g['over'] == 'red'); l = sum(1 for g in xg if g['over'] == 'reg')
        rec0, rec1 = x301.get('rec0') or {}, x301.get('rec1') or {}
        fin_ok = all(m == 2 for g in xg for (_, _, m) in g['finishes'])
        C['x301'] = {'games': len(xg), 'red_W': w, 'reg_W': l, 'busts': sum(g['busts'] for g in xg), 'darts': sum(g['darts'] for g in xg),
                     'regAimNotABed': sum(g['regAimBad'] for g in xg), 'regOnADouble': sum(g['regDoubleChances'] for g in xg),
                     'regAimedThatDouble': sum(g['regDoubleAimed'] for g in xg), 'finishesAllDoubles': fin_ok,
                     'recordMatches': rec1.get('w', -1) - rec0.get('w', 0) == w and rec1.get('l', -1) - rec0.get('l', 0) == l, 'err': x301.get('err')}
        X = C['x301']
        X['ok'] = len(xg) == N301 and w + l == N301 and X['busts'] > 0 and X['regAimNotABed'] == 0 and X['regOnADouble'] == X['regAimedThatDouble'] and fin_ok and X['recordMatches'] and not x301.get('err')
        C['replay'] = {'eventsChecked': len(log), 'dartsRescored': sum(1 for e in log if e.get('ev') == 'dart'), 'mismatches': len(bad), 'examples': bad[:8], 'ok': not bad}
        # ---------- flow ----------
        C['flow'] = await pg.evaluate('''()=>{const o={};__D.fast=true;const r0=JSON.stringify(__D.records());__D.click('rtc');o.btnsPlaying=__D.shown().join();o.again=__D.start('301').code;__aimThrow(0,0);
            __D.click('quit');o.after=__D.game();o.recSame=JSON.stringify(__D.records())===r0;__D.click('x301');__aimThrow(0,103);__D.click('close');o.closed=__D.panel;o.recSame2=JSON.stringify(__D.records())===r0;
            const ab=__D.log.filter(e=>e.ev==='abandon').slice(-2).map(e=>e.why);o.abandons=ab;__open();o.reopenGame=__D.game();
            o.ok=o.btnsPlaying==='throw,quit,close'&&o.again==='in_play'&&o.after===null&&o.recSame&&o.closed==null&&o.recSame2&&ab.join()==='quit,button'&&o.reopenGame===null;return o}''')
        # ---------- leave ----------
        C['leave'] = await pg.evaluate('''async()=>{const o={},w=()=>new Promise(r=>setTimeout(r,600));__D.fast=true;
            __open();__D.click('rtc');__aimThrow(0,0);const c=__D.cfg.spot;__at(c.x+1.6,c.z-.6);__T(3);await w();o.stepOff=__D.panel;o.g1=__D.game();
            __open();__D.click('x301');__at(-24,103.5);__T(5);await w();o.walkOut=__D.panel;o.g2=__D.game();
            __open();__D.click('rtc');S[0].hp-=5;__T(2);S[0].hp+=5;o.hit=__D.panel;o.g3=__D.game();o.hitWhy=(__D.log.filter(e=>e.ev==='close').slice(-1)[0]||{}).why;
            for(let k=0;k<600&&!(S[0].st==='idle'||S[0].st==='walk');k++)tick();
            __open();__D.click('rtc');HIT_TRAVEL.jump('sky');await new Promise(r=>setTimeout(r,900));o.sky=HIT_SKY.on;o.afterSky=__D.panel;o.g4=__D.game();o.skyOpen=__D.open().code;
            HIT_TRAVEL.jump('town');await new Promise(r=>setTimeout(r,1300));o.back=!HIT_SKY.on;
            __open();const n=crowd.find(n=>n._rec&&n._rec.id==='inn_g1');const st=n.st;n.st='down';o.downCode=__D.start('301').code;o.downRtc=__D.start('rtc').ok;__D.click('quit');n.st=st;
            o.whys=__D.log.filter(e=>e.ev==='abandon').slice(-4).map(e=>e.why);
            o.ok=o.stepOff==null&&o.g1===null&&o.walkOut==null&&o.g2===null&&o.hit==null&&o.g3===null&&o.hitWhy==='fight'&&o.sky&&o.afterSky==null&&o.g4===null&&o.skyOpen==='area'&&o.back&&o.downCode==='regular'&&o.downRtc===true;return o}''')
        rec_before = await pg.evaluate('()=>__D.records()')
        await pg.reload(); await boot(pg)
        rec_after = await pg.evaluate('()=>__D.records()')
        C['reload'] = {'before': {k: rec_before[k] for k in ('rtc', 'x')}, 'after': {k: rec_after[k] for k in ('rtc', 'x')}, 'ok': rec_before['rtc'] == rec_after['rtc'] and rec_before['x'] == rec_after['x'] and rec_after['rtc']['games'] > 0}
        out['stats'] = await pg.evaluate("()=>HIT_DARTS.stats")
        out['moduleErrors'] = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        await b.close()
    s = out['summary'] = {k: v.get('ok') for k, v in C.items() if isinstance(v, dict) and 'ok' in v}
    s['rtcDarts'] = C['rtc']['darts']; s['x301_tally'] = {k: C['x301'][k] for k in ('games', 'red_W', 'reg_W', 'busts', 'darts', 'regOnADouble', 'regAimedThatDouble')}
    s['dartsRescored'] = C['replay']['dartsRescored']; s['geometryPoints'] = C['geometry']['points']
    s['pageErrors'] = len(out['errors']); s['moduleErrors'] = out['moduleErrors']
    s['PASS'] = all(v for k, v in s.items() if isinstance(v, bool)) and not out['errors'] and not out['moduleErrors']
    print(json.dumps(s, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
