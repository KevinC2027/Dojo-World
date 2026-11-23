"""Shodo calligraphy test (Step 23 gate).  Usage:
  python3 -I dw2/tools/shodo.py <build.html> [--seed 7] [--json out.json] [--shots DIR]
Seeds Math.random, stops the render loop and runs the game's own tick(). Red moves only by the on-screen joystick (H0.ax/H0.az,
camera yaw 0). The desk panel is opened with INTERACT (_updateNear/_doInteract); every stroke is written with a REAL mouse drag on the
panel canvas (Playwright mouse down / move / up -> the panel's pointer handlers), with a seeded hand wobble; kanji are chosen and
sheets hung with real clicks on the panel's buttons. Every graded sheet is re-graded here in Python (independent code, same rules).
  walk      Red walks from his spawn in the dojo to the desk by joystick; prompt "Shodo desk"; the desk adds no collision solids
  open      INTERACT opens the panel; all 10 kanji buttons, GUIDE / NEW SHEET / CLOSE; nothing charged (free)
  correct   every one of the 10 kanji traced stroke by stroke in the right order and direction passes (grade Very good or better)
  python    every sheet of the test re-graded in Python from the ink the game recorded: same flags, scores within 1e-9
  order     wrong stroke order fails (木: the vertical before the horizontal; 三: the bottom line first; 道: inner lines swapped)
  reversed  a stroke written end to start fails (一 right to left; 川 stroke 3 upward; 力 stroke 2 upward)
  scribble  a zigzag scribble fails (山); a dab does not count as a stroke
  monotonic real traces of 人 shifted 0..0.10 and 木 scaled 1.0..1.4: scores never rise as the error grows, grades never improve;
            pure sweep of all 10 kanji over 21 error levels: monotonic too, and Python agrees
  brush     a slow stroke leaves a fuller line than a fast one (mean width), widths stay within the brush's limits
  hang      a good sheet hangs (real HANG click); a reload keeps the scroll and the best scores; Red walks into House No. 41 by joystick
            and the scroll is drawn on its back wall; HANG is not offered on a failing sheet
  closes    a hit taken closes the panel; walking off closes it; coliseum: no prompt, the desk refuses ('area')
  audit     no ledger entry at all (free), eco.audit() clean; no HIT_* module errors, no page errors"""
import asyncio, json, sys, os, math, random
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json'); SHOTS = arg('--shots')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;a.y=0;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__steer=(x,z)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;cam.yaw=0;const k=d<.6?Math.max(.25,d/.6):1;H0.ax=dx/d*k;H0.az=-dz/d*k;tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__walk=(x,z,tol)=>{let d=99,i=0;for(;i<1500&&d>(tol||.25);i++){d=__steer(x,z)}H0.ax=H0.az=0;__T(12);return{d:+Math.hypot(x-S[0].x,z-S[0].z).toFixed(2),ticks:i}};
window.__calm=()=>{for(const f of crowd){if(f!==S[0]){f.x+=0}}};
window.__interact=()=>{const n=__near();if(!n||n.act!=='shodo')return{label:n&&n.label,act:n&&n.act};_doInteract();return{label:n.label,act:n.act}};0'''

# ---------------- the grading, written again in Python ----------------
def plen(p): return sum(math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) for i in range(1, len(p)))
def resample(p, n):
    L = plen(p); out = []
    if not (L > 1e-9): return [[p[0][0], p[0][1]] for _ in range(n)]
    seg = 1; acc = 0.0
    for i in range(n):
        t = L * i / (n - 1)
        while seg < len(p) - 1 and acc + math.hypot(p[seg][0] - p[seg - 1][0], p[seg][1] - p[seg - 1][1]) < t:
            acc += math.hypot(p[seg][0] - p[seg - 1][0], p[seg][1] - p[seg - 1][1]); seg += 1
        a, b = p[seg - 1], p[seg]; l = math.hypot(b[0] - a[0], b[1] - a[1]); u = (t - acc) / l if l > 1e-12 else 0.0; u = min(1.0, max(0.0, u))
        out.append([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u])
    return out
def mdist(A, B): return sum(math.hypot(A[i][0] - B[i][0], A[i][1] - B[i][1]) for i in range(len(A))) / len(A)
def grade_stroke(K, G, ki, k, pts):
    M = K[ki]['s']; N = G['N']; U = resample(pts, N); Mk = resample(M[k], N); Mr = Mk[::-1]
    eF = mdist(U, Mk); eR = mdist(U, Mr); lu = plen(pts); lm = plen(M[k])
    eJ, j = 1e9, -1
    for i in range(len(M)):
        if i == k: continue
        e = mdist(U, resample(M[i], N))
        if e < eJ: eJ, j = e, i
    ux, uy = U[-1][0] - U[0][0], U[-1][1] - U[0][1]; mx, my = Mk[-1][0] - Mk[0][0], Mk[-1][1] - Mk[0][1]; nu, nm = math.hypot(ux, uy), math.hypot(mx, my)
    d = (ux * mx + uy * my) / (nu * nm) if nu > 1e-6 and nm > 1e-6 else 1.0
    flag = None
    if lu > G['LONG'] * lm + G['LONGA'] or (eF > G['SCRIB'] and eR > G['SCRIB'] and eJ > G['SCRIB']): flag = 'scribble'
    elif eF > G['TOK'] and eJ <= G['TOK'] and eJ < G['ORD'] * eF: flag = 'order'
    elif lm >= G['MINREV'] and eR < eF and d < 0: flag = 'reversed'
    elif eF > G['OFF']: flag = 'off'
    return {'k': k, 'eF': eF, 'flag': flag, 'score': 0.0 if flag else 100 * max(0.0, 1 - eF / G['ZERO'])}
def grade_sheet(K, G, ki, strokes):
    res = [grade_stroke(K, G, ki, k, p) for k, p in enumerate(strokes)]; bad = next((r for r in res if r['flag']), None)
    score = 0.0 if bad else (sum(r['score'] for r in res) / len(res) if res else 0.0)
    name = 'Try again'
    if not bad:
        for b in G['BANDS']:
            if score >= b[0]: name = b[2]; break
    return {'flag': bad['flag'] if bad else None, 'score': score, 'grade': name, 'strokes': res}
RANK = {'Try again': 0, 'Pass': 1, 'Good': 2, 'Very good': 3, 'Excellent': 4}

# ---------------- the hand ----------------
RNG = random.Random(SEED)
def dense(poly, step=.02):
    out = [poly[0]]
    for a, b in zip(poly, poly[1:]):
        n = max(1, int(math.ceil(math.hypot(b[0] - a[0], b[1] - a[1]) / step)))
        for i in range(1, n + 1): out.append([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n])
    return out
def wobble(pts, amp):
    ph1, ph2 = RNG.uniform(0, 6.3), RNG.uniform(0, 6.3); n = len(pts)
    return [[p[0] + amp * math.sin(ph1 + 5.1 * i / n) + RNG.uniform(-amp, amp) * .3, p[1] + amp * math.cos(ph2 + 4.3 * i / n) + RNG.uniform(-amp, amp) * .3] for i, p in enumerate(pts)]

async def boot(pg):
    await pg.wait_for_function('window.HIT_SHODO&&HIT_SHODO.on&&window.HIT_DC&&HIT_DC.eco', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)
    await pg.evaluate("if(window.HIT_RAIN)HIT_RAIN.force=0")

class Hand:
    def __init__(s, pg): s.pg = pg; s.bb = None; s.geo = None
    async def setup(s):
        s.bb = await (await s.pg.query_selector('#sd-box canvas')).bounding_box()
        s.geo = await s.pg.evaluate("HIT_SHODO.paperToCanvas(0,0)")
    def css(s, u, v):
        g = s.geo; PS = 640
        return s.bb['x'] + (g['x'] + u * PS) / g['W'] * s.bb['width'], s.bb['y'] + (g['y'] + v * PS) / g['H'] * s.bb['height']
    async def stroke(s, pts, pause=.012):
        m = s.pg.mouse; x, y = s.css(*pts[0]); await m.move(x, y); await m.down()
        for p in pts[1:]:
            x, y = s.css(*p); await m.move(x, y)
            if pause: await asyncio.sleep(pause)
        await m.up(); await asyncio.sleep(.02)
    async def pick(s, i): await s.pg.click('#sd-box .ks button[data-k="%d"]' % i); await asyncio.sleep(.03)
    async def btn(s, a): await s.pg.click('#sd-box .row button[data-act="%s"]' % a); await asyncio.sleep(.03)

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    sheets = []   # every graded sheet: (ki, ink, game result) for the Python re-grade
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        K = await pg.evaluate("HIT_SHODO.KANJI"); G = await pg.evaluate("HIT_SHODO.G"); BR = await pg.evaluate("HIT_SHODO.BRUSH")
        led0 = await pg.evaluate("HIT_DC.eco.history(1e6).length")
        H = Hand(pg)
        async def sheet():
            r = await pg.evaluate("HIT_SHODO.sheet()"); sheets.append(r); return r
        async def write(ki, strokes, pause=.012):
            await H.pick(ki)
            for s in strokes: await H.stroke(s, pause)
            return await sheet()
        def trace(ki, amp=.015):
            return [wobble(dense(s), amp) for s in K[ki]['s']]
        # ---------- walk to the desk ----------
        C['walk'] = await pg.evaluate('''()=>{const o={};__at(-1.5,14);__T(10);const D=HIT_SHODO.cfg;o.w=__walk(D.spot.x,D.spot.z,.2);o.prompt=(__near()||{}).label;
            const d=D.desk;o.solids=WORLD.solids.filter(q=>q.x1>d.x-.3&&q.x0<d.x+.3&&q.z1>d.z-.6&&q.z0<d.z+.6).length;o.props=WORLD.props.filter(q=>q.sd).length;
            o.ok=o.w.d<=.25&&/Shodo desk/.test(o.prompt||'')&&o.solids===0&&o.props===2;return o}''')
        # ---------- open ----------
        C['open'] = await pg.evaluate('''()=>{const o={};o.r=__interact();o.open=HIT_SHODO.isOpen();o.kanji=[...document.querySelectorAll('#sd-box .ks button')].map(b=>b.textContent).join('');
            o.buttons=[...document.querySelectorAll('#sd-box .row button')].filter(b=>!b.hidden).map(b=>b.dataset.act);o.ok=o.open&&o.kanji==='一二三山川木人力心道'&&o.buttons.join()==='guide,new,close';return o}''')
        await H.setup()
        # ---------- every kanji, correctly ----------
        cor = []
        for ki in range(10):
            r = await write(ki, trace(ki))
            res = r['result'] or {}
            cor.append({'c': K[ki]['c'], 'n': len(r['ink']), 'score': round(res.get('score', 0), 2), 'grade': res.get('grade'), 'flag': res.get('flag')})
            if ki == 9 and SHOTS: await pg.screenshot(path=os.path.join(SHOTS, 'panel_michi_s%d.png' % SEED))
        C['correct'] = {'sheets': cor, 'ok': all(c['flag'] is None and c['n'] == len(K[i]['s']) and RANK.get(c['grade'], 0) >= 3 for i, c in enumerate(cor))}
        # ---------- hang the 道 sheet (real click) ----------
        hg = await pg.evaluate("(()=>{const b=document.querySelector('#sd-box .row button[data-act=hang]');return {shown:!b.hidden}})()")
        await H.btn('hang'); st = await pg.evaluate("HIT_SHODO.state()")
        C['hangClick'] = {'shown': hg['shown'], 'scroll': st['scroll'] and {'c': st['scroll']['c'], 'score': st['scroll']['score'], 'strokes': len(st['scroll']['ink'])},
                          'ok': hg['shown'] and bool(st['scroll']) and st['scroll']['c'] == '道' and len(st['scroll']['ink']) == 12}
        # ---------- wrong order ----------
        o = []
        s = trace(5); r = await write(5, [s[1], s[0], s[2], s[3]]); o.append(('木 vertical first', r['result']['flag'], len(r['ink']), r['result']['grade']))
        s = trace(2); r = await write(2, [s[2], s[0], s[1]]); o.append(('三 bottom first', r['result']['flag'], len(r['ink']), r['result']['grade']))
        s = trace(9); r = await write(9, s[:6] + [s[7]]); o.append(('道 stroke 8 before 7', r['result']['flag'], len(r['ink']), r['result']['grade']))
        nohang = await pg.evaluate("document.querySelector('#sd-box .row button[data-act=hang]').hidden")
        C['order'] = {'cases': o, 'hangHidden': nohang, 'ok': all(c[1] == 'order' and c[3] == 'Try again' for c in o) and nohang}
        # ---------- reversed ----------
        o = []
        s = trace(0); r = await write(0, [s[0][::-1]]); o.append(('一 right to left', r['result']['flag'], r['result']['grade']))
        s = trace(4); r = await write(4, [s[0], s[1], s[2][::-1]]); o.append(('川 stroke 3 upward', r['result']['flag'], r['result']['grade']))
        s = trace(7); r = await write(7, [s[0], s[1][::-1]]); o.append(('力 stroke 2 upward', r['result']['flag'], r['result']['grade']))
        C['reversed'] = {'cases': o, 'ok': all(c[1] == 'reversed' and c[2] == 'Try again' for c in o)}
        # ---------- scribble, and a dab ----------
        await H.pick(3)
        await H.stroke([[.5, .5], [.502, .501]], 0); dab = await pg.evaluate("({n:HIT_SHODO.sheet().ink.length,say:HIT_SHODO.lastSay})")
        zig = [[.2 + .6 * (i % 2) + RNG.uniform(-.04, .04), .15 + .7 * i / 13] for i in range(14)]
        await H.stroke(zig); r = await sheet()
        C['scribble'] = {'dab': dab, 'flag': r['result'] and r['result']['flag'], 'grade': r['result'] and r['result']['grade'],
                         'ok': dab['n'] == 0 and r['result'] is not None and r['result']['flag'] == 'scribble' and r['result']['grade'] == 'Try again'}
        # ---------- monotonic: real traces with growing error ----------
        base6 = [dense(s) for s in K[6]['s']]; ser1 = []
        for a in [0, .02, .04, .06, .08, .10]:
            r = await write(6, [[[p[0] + a, p[1] + a * .5] for p in s] for s in base6], .004); ser1.append((a, round(r['result']['score'], 3), r['result']['grade'], r['result']['flag']))
        base5 = [dense(s) for s in K[5]['s']]; ser2 = []
        for f in [1.0, 1.1, 1.2, 1.3, 1.4]:
            r = await write(5, [[[.5 + (p[0] - .5) * f, .5 + (p[1] - .5) * f] for p in s] for s in base5], .004); ser2.append((f, round(r['result']['score'], 3), r['result']['grade'], r['result']['flag']))
        mono = lambda ser: all(ser[i + 1][1] <= ser[i][1] + 1e-9 and RANK[ser[i + 1][2]] <= RANK[ser[i][2]] for i in range(len(ser) - 1))
        # pure sweep (the game's own grader, no panel) for every kanji at 21 error levels; Python grades the same inputs
        sweep = await pg.evaluate('''()=>{const K=HIT_SHODO.KANJI,o=[];for(let ki=0;ki<10;ki++){const row=[];for(let i=0;i<=20;i++){const a=i*.0097;
            const st=K[ki].s.map(s=>s.map(p=>[p[0]+a*.8,p[1]-a*.6]));const r=HIT_SHODO.gradeSheet(ki,st);row.push([a,r.score,r.grade,r.flag])}o.push(row)}return o}''')
        smono = all(mono(row) for row in sweep); pyd = 0.0
        for ki, row in enumerate(sweep):
            for a, sc, gr, fl in row:
                pr = grade_sheet(K, G, ki, [[[p[0] + a * .8, p[1] - a * .6] for p in s] for s in K[ki]['s']]); pyd = max(pyd, abs(pr['score'] - sc))
                if pr['grade'] != gr or pr['flag'] != fl: pyd = 99
        C['monotonic'] = {'shift人': ser1, 'scale木': ser2, 'sweepRows': len(sweep), 'sweepMonotonic': smono, 'sweepPyMaxDiff': pyd,
                          'sweepEnds': [[r[0][1], r[-1][1], r[-1][2]] for r in sweep][:3],
                          'ok': mono(ser1) and mono(ser2) and ser1[0][1] > ser1[-1][1] and ser2[0][1] > ser2[-1][1] and smono and pyd < 1e-9}
        # ---------- brush: slow vs fast ----------
        line = dense([[.12, .5], [.88, .5]], .03)
        await H.pick(0); await H.stroke(line, .06); slow = (await sheet())['ink'][0]
        await H.pick(0); await H.stroke(line, 0); fast = (await sheet())['ink'][0]
        mw = lambda s: sum(p[2] for p in s[1:]) / max(1, len(s) - 1)
        allw = [p[2] for sh in sheets for st in sh['ink'] for p in st]
        C['brush'] = {'slowMean': round(mw(slow), 4), 'fastMean': round(mw(fast), 4), 'min': round(min(allw), 4), 'max': round(max(allw), 4),
                      'ok': mw(slow) > mw(fast) * 1.3 and min(allw) >= BR['MIN'] - 1e-9 and max(allw) <= BR['MAX'] + 1e-9}
        # ---------- Python re-grade of every sheet ----------
        mism = 0; md = 0.0; n = 0
        for sh in sheets:
            if not sh['result']: continue
            n += 1; pr = grade_sheet(K, G, sh['ki'], [[[q[0], q[1]] for q in st] for st in sh['ink']])
            d = abs(pr['score'] - sh['result']['score']); md = max(md, d)
            if pr['flag'] != sh['result']['flag'] or pr['grade'] != sh['result']['grade']: mism += 1
            for a_, b_ in zip(pr['strokes'], sh['result']['strokes']):
                if a_['flag'] != b_['flag'] or abs(a_['score'] - b_['score']) > 1e-9: mism += 1
        C['python'] = {'sheets': n, 'mismatches': mism, 'maxScoreDiff': md, 'ok': n >= 25 and mism == 0 and md < 1e-9}
        # ---------- closes: a hit, walking off, the coliseum ----------
        C['closes'] = await pg.evaluate('''()=>{const o={},a=S[0],D=HIT_SHODO.cfg;o.open0=HIT_SHODO.isOpen();const hp=a.hp;a.hp=hp-5;__T(2);o.fightClosed=!HIT_SHODO.isOpen();a.hp=hp;
            for(let w=0;w<300&&!(a.st==='idle'||a.st==='walk');w++)tick();__walk(D.spot.x,D.spot.z,.2);__interact();o.reopen=HIT_SHODO.isOpen();
            a.x+=2.2;__T(2);o.walkClosed=!HIT_SHODO.isOpen();__walk(D.spot.x,D.spot.z,.2);
            HIT_SKY.on=true;__T(3);o.skyPrompt=HIT_SHODO.prompt();o.skyWhy=HIT_SHODO.whyOpen();HIT_SKY.on=false;__T(3);o.backPrompt=HIT_SHODO.prompt();
            __interact();o.reopen2=HIT_SHODO.isOpen();HIT_SKY.on=true;__T(2);o.skyClosed=!HIT_SHODO.isOpen();HIT_SKY.on=false;__T(3);
            o.ok=o.open0&&o.fightClosed&&o.reopen&&o.walkClosed&&!o.skyPrompt&&o.skyWhy==='area'&&/Shodo/.test(o.backPrompt||'')&&o.reopen2&&o.skyClosed;return o}''')
        # ---------- reload: the scroll and the records are kept; walk into House No. 41 and see it on the wall ----------
        before = await pg.evaluate("HIT_SHODO.state()")
        await pg.reload(); await boot(pg)
        after = await pg.evaluate("HIT_SHODO.state()")
        house = await pg.evaluate('''()=>{const o={};__at(-43.5,-1);__T(10);o.w1=__walk(-43.5,1.6,.25);o.w2=__walk(-43.6,5.6,.25);o.room=_insideRoom();
            const n0=HIT_SHODO.stats.scrollDrawn;for(let i=0;i<4;i++){tick();draw()}o.drawn=HIT_SHODO.stats.scrollDrawn-n0;o.sprite=!!HIT_SHODO.scrollSprite();
            o.ok=o.room==='house'&&o.drawn>=4&&o.sprite;return o}''')
        if SHOTS:
            await pg.evaluate("cam.zm=2.2;for(let i=0;i<90;i++){tick()}draw()"); await pg.screenshot(path=os.path.join(SHOTS, 'house_scroll_s%d.png' % SEED))
        C['hang'] = {'click': C.pop('hangClick'), 'reloadScroll': after['scroll'] == before['scroll'], 'reloadBest': after['best'] == before['best'], 'best': after['best'],
                     'sheets': after['sheets'], 'house': house}
        C['hang']['ok'] = C['hang']['click']['ok'] and C['hang']['reloadScroll'] and C['hang']['reloadBest'] and house['ok'] and len(after['best']) == 10
        # ---------- audit ----------
        au = await pg.evaluate("(()=>{const e=HIT_DC.eco;let a;try{a=e.audit()}catch(x){a={ok:false,err:String(x)}}const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error);return{audit:a&&(a.ok!==undefined?a.ok:a),n:e.history(1e6).length,mods}})()")
        C['audit'] = {'ledgerEntriesBefore': led0, 'ledgerEntriesAfter': au['n'], 'audit': au['audit'], 'moduleErrors': au['mods'], 'pageErrors': errs[:10],
                      'ok': au['n'] == led0 and (au['audit'] is True or au['audit'] == {'ok': True} or (isinstance(au['audit'], dict) and au['audit'].get('ok'))) and not au['mods'] and not errs}
        await b.close()
    out['pass'] = all(c.get('ok') for c in C.values())
    print(json.dumps(out, indent=1, ensure_ascii=False, default=str))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1, ensure_ascii=False, default=str))
    sys.exit(0 if out['pass'] else 1)

asyncio.run(main())
