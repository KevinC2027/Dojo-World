"""Taiko rhythm game test (Step 25 gate).  Usage:
  python3 -I dw2/tools/taiko.py <build.html> [--seed 7] [--json out.json] [--shots DIR]
Seeds Math.random, stops the game's render loop and runs the game's own tick(). Red moves only by the on-screen joystick (H0.ax/H0.az,
camera yaw 0). The drum panel is opened with INTERACT (_updateNear/_doInteract). Songs are played in real time on the panel's drum face:
  * one song with REAL mouse clicks (Playwright mouse down/up at the note times, scheduled from Python), and
  * the rest with pointer events dispatched on the drum canvas at the note times (a timer then a spin to the exact millisecond, so the
    event's own timeStamp is the hit time), the same pointerdown handler a finger uses.
The game logs every hit (song ms + colour); every finished song is re-judged here in Python (independent code, same rules).
  walk      Red walks from his dojo spawn to the drum by joystick; prompt "Taiko drum · play a song"; no solids added near the drum
  open      INTERACT opens the panel: 3 songs, START / SOUND / CLOSE; nothing charged (free)
  mouse     Dojo Matsuri played with real mouse clicks (centre = DON, rim = KA) on time: cleared
  ontime    all 3 songs played on time (seeded human jitter, sd 12 ms): every one CLEARED with FULL COMBO
  grades    one Dojo Matsuri run in groups of 6 notes hit at 0 / +-30 ms (GOOD), +-80 ms (OK), +-130 ms (BAD) and on time with the wrong
            colour (BAD): every note judged as its group should be; accuracy falls as the offset grows
  none      a song with no input at all: every note MISS, score 0, not cleared
  mash      random drumming every 70 ms: not cleared
  sweep     pure judge over all 3 songs at offsets 0..300 ms (early and late): accuracy and score never rise as the error grows (every offset
            for the easy song, within the 110 ms OK window for all three); Python agrees at every offset
  python    every finished song re-judged in Python from the logged hit times: same note-by-note results, counts, combo, score, accuracy
  records   best score / accuracy / FC / clears per song saved; a reload keeps them; STOP mid-song counts nothing
  closes    a hit taken mid-song closes the panel and the song is not counted; walking off closes it; coliseum: no prompt, 'area'
  audit     no ledger entry at all (free), eco.audit() clean; no HIT_* module errors, no page errors"""
import asyncio, json, sys, os, math, random, time
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
window.__interact=()=>{const n=__near();if(!n||n.act!=='taikogame')return{label:n&&n.label,act:n&&n.act};_doInteract();return{label:n.label,act:n.act}};
window.__pt=(c,u,v)=>{const cv=HIT_TAIKO.canvas(),r=cv.getBoundingClientRect(),G=HIT_TAIKO.drumGeo();return{x:r.left+(G.cx+u*G.R)/G.W*r.width,y:r.top+(G.cy+v*G.R)/G.H*r.height}};
/* play: plan = [{t (song ms), c, u, v}] -> pointer events on the drum canvas at those song times */
window.__play=(plan)=>new Promise(res=>{const pl=HIT_TAIKO.playing();if(!pl){res({err:'not playing'});return}const cv=HIT_TAIKO.canvas();let i=0,late=[];
  const fire=(p)=>{const q=__pt(p.c,p.u,p.v);const o={clientX:q.x,clientY:q.y,bubbles:true,cancelable:true,pointerId:1,isPrimary:true,pointerType:'touch',button:0,buttons:1};
    cv.dispatchEvent(new PointerEvent('pointerdown',o));cv.dispatchEvent(new PointerEvent('pointerup',Object.assign(o,{buttons:0})))};
  function step(){if(!HIT_TAIKO.playing()){res({i,late,stopped:true});return}if(i>=plan.length){res({i,late});return}const p=plan[i],target=pl.t0+p.t,now=performance.now();
    if(target-now>6){setTimeout(step,Math.max(0,target-now-5));return}while(performance.now()<target){}late.push(+(performance.now()-target).toFixed(2));fire(p);i++;step()}
  step()});
window.__waitEnd=()=>new Promise(res=>{const f=()=>{if(!HIT_TAIKO.playing())res(HIT_TAIKO.lastResult);else setTimeout(f,100)};f()});0'''

# ---------------- the judge, written again in Python ----------------
def js_round3(x): return math.floor(x * 1000 + .5) / 1000
def judge(J, notes, hits, now=float('inf'), clr=60):
    N = notes; res = [None] * len(N); by = []; lo = 0
    for h in hits:
        ht, hc = h['t'], h['c']
        while lo < len(N) and N[lo]['t'] < ht - J['BAD']: lo += 1
        best, bd, b2, d2 = -1, 1e9, -1, 1e9; i = lo
        while i < len(N) and N[i]['t'] <= ht + J['BAD']:
            if res[i] is None:
                d = abs(ht - N[i]['t'])
                if d <= J['OK']: best, bd = i, d; break
                if b2 < 0: b2, d2 = i, d
            i += 1
        if best < 0 and b2 >= 0: best, bd = b2, d2
        if best < 0: by.append(-1); continue
        by.append(best)
        res[best] = 'bad' if hc != N[best]['c'] else 'good' if bd <= J['GOOD'] else 'ok' if bd <= J['OK'] else 'bad'
    for i in range(len(N)):
        if res[i] is None and N[i]['t'] + J['BAD'] < now: res[i] = 'miss'
    good = ok = bad = miss = combo = maxc = score = 0
    for r in res:
        if r is None: continue
        if r in ('good', 'ok'):
            combo += 1; maxc = max(maxc, combo); score += (J['PG'] if r == 'good' else J['PO']) + min(J['CB'], combo - 1)
            if r == 'good': good += 1
            else: ok += 1
        else:
            combo = 0
            if r == 'bad': bad += 1
            else: miss += 1
    n = len(N); acc = math.floor((good + ok / 2) / n * 100000 + .5) / 1000; judged = good + ok + bad + miss
    return {'n': n, 'good': good, 'ok': ok, 'bad': bad, 'miss': miss, 'combo': combo, 'maxCombo': maxc, 'score': score, 'acc': acc,
            'clear': judged == n and acc >= clr, 'fc': judged == n and bad == 0 and miss == 0, 'res': res, 'by': by}

RNG = random.Random(SEED)
def spot(c):   # where a finger lands: anywhere on the skin for DON, on the rim (top or bottom, a little to the side) for KA
    if c == 'd':
        a, r = RNG.uniform(0, 6.283), RNG.uniform(0, .45); return math.cos(a) * r, math.sin(a) * r
    a = RNG.choice([-1, 1]) * math.pi / 2 + RNG.uniform(-.5, .5); r = RNG.uniform(.74, .96); return math.cos(a) * r, math.sin(a) * r

async def boot(pg):
    await pg.wait_for_function('window.HIT_TAIKO&&HIT_TAIKO.on&&window.HIT_DC&&HIT_DC.eco', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)
    await pg.evaluate("if(window.HIT_RAIN)HIT_RAIN.force=0")

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}; played = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        J = await pg.evaluate("HIT_TAIKO.J"); SONGS = await pg.evaluate("HIT_TAIKO.SONGS.map(s=>({id:s.id,name:s.name,clr:s.clr,bpm:s.bpm}))")
        NOTES = [await pg.evaluate("HIT_TAIKO.notes(%d)" % i) for i in range(3)]
        led0 = await pg.evaluate("HIT_DC.eco.history(1e6).length")

        # ---------- walk to the drum ----------
        C['walk'] = await pg.evaluate('''()=>{const o={};__at(-1.5,14);__T(10);const D=HIT_TAIKO.cfg;o.w=__walk(D.spot.x,D.spot.z,.2);o.prompt=(__near()||{}).label;
            const d=D.drum;o.solidsNear=WORLD.solids.filter(q=>q.x1>d.x-.6&&q.x0<d.x+.6&&q.z1>d.z-1.6&&q.z0<d.z+.6).length;o.ok=o.w.d<=.25&&/Taiko drum · play a song/.test(o.prompt||'');return o}''')
        # ---------- open ----------
        C['open'] = await pg.evaluate('''()=>{const o={};o.i=__interact();o.open=HIT_TAIKO.isOpen();o.songs=document.querySelectorAll('#tk-box .ss button').length;
            o.btns=[...document.querySelectorAll('#tk-box .row button')].map(b=>b.dataset.act);o.ok=o.open&&o.songs===3&&o.btns.join()==='start,sound,close';return o}''')

        async def run_plan(si, plan):
            await pg.evaluate("HIT_TAIKO.pick(%d)" % si); await pg.evaluate("HIT_TAIKO.click('start')")
            pr = await pg.evaluate("(plan)=>__play(plan)", plan)
            lr = await pg.evaluate("__waitEnd()")
            played.append({'si': si, 'lr': lr}); return pr, lr

        # ---------- real mouse: Dojo Matsuri ----------
        await pg.evaluate("HIT_TAIKO.pick(0)"); pts = []
        for n in NOTES[0]:
            u, v = spot(n['c']); pts.append((n, await pg.evaluate("([c,u,v])=>__pt(c,u,v)", [n['c'], u, v])))
        await pg.evaluate("HIT_TAIKO.click('start')")
        sync = await pg.evaluate("({t0:HIT_TAIKO.playing().t0,now:performance.now()})"); base = time.perf_counter() - sync['now'] / 1000
        lag = []
        for n, q in pts:
            target = base + (sync['t0'] + n['t']) / 1000 - .004   # mouse down reaches the page a few ms after the call
            while time.perf_counter() < target - .003: await asyncio.sleep(.001)
            while time.perf_counter() < target: pass
            await pg.mouse.move(q['x'], q['y']); await pg.mouse.down(); await pg.mouse.up()
        lr = await pg.evaluate("__waitEnd()"); played.append({'si': 0, 'lr': lr})
        dts = [d for d in lr['R']['dts'] if d is not None]
        C['mouse'] = {'R': {k: lr['R'][k] for k in ('n', 'good', 'ok', 'bad', 'miss', 'maxCombo', 'score', 'acc', 'clear', 'fc')}, 'hits': len(lr['hits']),
                      'dtMeanMs': round(sum(dts) / len(dts), 1), 'dtMaxAbsMs': round(max(abs(d) for d in dts), 1), 'ok': lr['R']['clear'] and len(lr['hits']) == len(NOTES[0])}

        # ---------- on time: all three songs, human jitter sd 12 ms ----------
        C['ontime'] = {}
        for si in range(3):
            plan = []
            for n in NOTES[si]:
                u, v = spot(n['c']); plan.append({'t': n['t'] + max(-30, min(30, RNG.gauss(0, 12))), 'c': n['c'], 'u': u, 'v': v})
            pr, lr = await run_plan(si, plan)
            C['ontime'][SONGS[si]['id']] = {k: lr['R'][k] for k in ('n', 'good', 'ok', 'bad', 'miss', 'maxCombo', 'score', 'acc', 'clear', 'fc')}
            C['ontime'][SONGS[si]['id']]['eventLateMs'] = max(pr['late'])
        C['ontime']['ok'] = all(C['ontime'][s['id']]['clear'] and C['ontime'][s['id']]['fc'] for s in SONGS)

        # ---------- grades: groups of 6 notes at fixed offsets / wrong colour ----------
        GROUPS = [('0', 0, False, 'good'), ('-30', -30, False, 'good'), ('+30', 30, False, 'good'), ('-80', -80, False, 'ok'), ('+80', 80, False, 'ok'),
                  ('-130', -130, False, 'bad'), ('+130', 130, False, 'bad'), ('wrong colour', 0, True, 'bad')]
        plan = []; want = []
        for i, n in enumerate(NOTES[0]):
            gname, off, swap, exp = GROUPS[min(len(GROUPS) - 1, i // 6) if i < 6 * len(GROUPS) else 0]
            if i >= 6 * len(GROUPS): gname, off, swap, exp = GROUPS[0]
            c = ('k' if n['c'] == 'd' else 'd') if swap else n['c']; u, v = spot(c); plan.append({'t': n['t'] + off, 'c': c, 'u': u, 'v': v}); want.append((gname, exp))
        pr, lr = await run_plan(0, plan)
        per = {}
        for i, (gname, exp) in enumerate(want):
            g = per.setdefault(gname, {'want': exp, 'got': {}}); r = lr['R']['res'][i]; g['got'][r] = g['got'].get(r, 0) + 1
        for g in per.values(): g['ok'] = list(g['got'].keys()) == [g['want']]
        offs = [abs(int(k)) for k in ('0', '-30', '+30', '-80', '+80', '-130', '+130')]
        val = {'good': 1, 'ok': .5, 'bad': 0, 'miss': 0}
        accs = {}
        for gname, off, swap, exp in GROUPS[:-1]:
            idx = [i for i, w in enumerate(want) if w[0] == gname]; accs.setdefault(abs(off), []).append(sum(val[lr['R']['res'][i]] for i in idx) / len(idx))
        mono = [min(accs[k]) for k in sorted(accs)]
        C['grades'] = {'groups': per, 'groupAccuracyByAbsOffset': {k: accs[k] for k in sorted(accs)}, 'monotonic': all(mono[i] >= mono[i + 1] for i in range(len(mono) - 1)),
                       'R': {k: lr['R'][k] for k in ('good', 'ok', 'bad', 'miss', 'acc', 'clear')}}
        C['grades']['ok'] = all(g['ok'] for g in per.values()) and C['grades']['monotonic']

        # ---------- none / mash ----------
        pr, lr = await run_plan(0, [])
        C['none'] = {k: lr['R'][k] for k in ('n', 'miss', 'score', 'acc', 'clear')}; C['none']['ok'] = lr['R']['miss'] == lr['R']['n'] and lr['R']['score'] == 0 and not lr['R']['clear']
        L = NOTES[0][-1]['t']; plan = []; t = -100.0
        while t < L + 100:
            c = RNG.choice('dk'); u, v = spot(c); plan.append({'t': t, 'c': c, 'u': u, 'v': v}); t += 70
        pr, lr = await run_plan(0, plan)
        C['mash'] = {('okNotes' if k == 'ok' else k): lr['R'][k] for k in ('n', 'good', 'ok', 'bad', 'miss', 'acc', 'clear')}; C['mash']['taps'] = len(plan); C['mash']['ok'] = not lr['R']['clear']

        # ---------- sweep (pure) ----------
        sw = {'ok': True, 'songs': {}}
        for si in range(3):
            rows = []
            for sign in (-1, 1):
                prev = None
                for off in range(0, 301, 10):
                    hits = [{'t': n['t'] + sign * off, 'c': n['c']} for n in NOTES[si]]
                    g = await pg.evaluate("([si,h])=>{const r=HIT_TAIKO.judgeAll(si,h,Infinity);return{acc:r.acc,score:r.score,res:r.res}}", [si, hits])
                    pyr = judge(J, NOTES[si], hits, clr=SONGS[si]['clr'])
                    same = g['res'] == pyr['res'] and g['acc'] == pyr['acc'] and g['score'] == pyr['score']
                    if not same: sw['ok'] = False
                    rows.append((sign * off, g['acc'], g['score']))
                    if prev and (g['acc'] > prev[0] + 1e-9 or g['score'] > prev[1]):
                        # past the OK window (110 ms) a hit on a dense run (16ths at 150 BPM = 100 ms apart) can land within OK of the NEXT
                        # note and count for it, as in arcade taiko; monotonic is required for every offset in the easy song and for
                        # |off| <= 110 ms in all three
                        if off <= J['OK'] or si == 0: sw['ok'] = False
                    prev = (g['acc'], g['score'])
            sw['songs'][SONGS[si]['id']] = [r for r in rows if abs(r[0]) in (0, 30, 50, 60, 80, 110, 120, 160, 200, 300)]
        C['sweep'] = sw

        # ---------- python: re-judge every finished song ----------
        mm = []
        for q in played:
            lr = q['lr']; si = q['si']; pyr = judge(J, NOTES[si], lr['hits'], clr=SONGS[si]['clr']); R = lr['R']
            for k in ('good', 'ok', 'bad', 'miss', 'maxCombo', 'score', 'acc', 'clear', 'fc'):
                if pyr[k] != R[k]: mm.append((si, k, pyr[k], R[k]))
            if pyr['res'] != R['res'] or pyr['by'] != R['by']: mm.append((si, 'res'))
        C['python'] = {'songs': len(played), 'hits': sum(len(q['lr']['hits']) for q in played), 'mismatches': mm[:10], 'ok': not mm}

        # ---------- records ----------
        st0 = await pg.evaluate("HIT_TAIKO.state()")
        await pg.evaluate("HIT_TAIKO.pick(1)"); await pg.evaluate("HIT_TAIKO.click('start')"); await pg.wait_for_timeout(3500)
        await pg.evaluate("HIT_TAIKO.click('start')")   # STOP
        st1 = await pg.evaluate("HIT_TAIKO.state()"); stopOk = st1['plays'] == st0['plays'] and st1['best'] == st0['best']
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True); await pg.screenshot(path=os.path.join(SHOTS, 'taiko_panel_seed%d.png' % SEED))
        await pg.evaluate("HIT_TAIKO.close()")
        await pg.reload(); await boot(pg)
        st2 = await pg.evaluate("HIT_TAIKO.state()")
        exp_best = {}
        for q in played:
            R = q['lr']['R']; sid = SONGS[q['si']]['id']; e = exp_best.setdefault(sid, {'score': 0, 'acc': 0, 'fc': False, 'clears': 0, 'plays': 0, 'maxCombo': 0})
            e['plays'] += 1; e['clears'] += 1 if R['clear'] else 0; e['score'] = max(e['score'], R['score']); e['acc'] = max(e['acc'], R['acc']); e['fc'] = e['fc'] or R['fc']; e['maxCombo'] = max(e['maxCombo'], R['maxCombo'])
        C['records'] = {'plays': st2['plays'], 'best': st2['best'], 'stopCountsNothing': stopOk, 'reloadSame': st2['best'] == st1['best'] and st2['plays'] == st1['plays'],
                        'matchesPlayed': st2['best'] == exp_best and st2['plays'] == len(played)}
        C['records']['ok'] = stopOk and C['records']['reloadSame'] and C['records']['matchesPlayed']

        # ---------- closes ----------
        C['closes'] = await pg.evaluate('''async()=>{const o={},a=S[0],D=HIT_TAIKO.cfg;__at(D.spot.x,D.spot.z);__T(5);__interact();o.open0=HIT_TAIKO.isOpen();const p0=HIT_TAIKO.state().plays;
            HIT_TAIKO.click('start');await new Promise(r=>setTimeout(r,2600));o.playing=!!HIT_TAIKO.playing();HIT_TAIKO.hit('d');
            const hp=a.hp;a.hp=hp-5;__T(2);o.fightClosed=!HIT_TAIKO.isOpen()&&!HIT_TAIKO.playing();a.hp=hp;o.notCounted=HIT_TAIKO.state().plays===p0;
            for(let w=0;w<300&&!(a.st==='idle'||a.st==='walk');w++)tick();__walk(D.spot.x,D.spot.z,.2);__interact();o.reopen=HIT_TAIKO.isOpen();
            a.x+=2.6;__T(2);o.walkClosed=!HIT_TAIKO.isOpen();__walk(D.spot.x,D.spot.z,.2);
            HIT_SKY.on=true;__T(3);o.skyPrompt=HIT_TAIKO.prompt();o.skyWhy=HIT_TAIKO.whyOpen();HIT_SKY.on=false;__T(3);o.backPrompt=HIT_TAIKO.prompt();
            __interact();o.reopen2=HIT_TAIKO.isOpen();HIT_SKY.on=true;__T(2);o.skyClosed=!HIT_TAIKO.isOpen();HIT_SKY.on=false;__T(3);
            o.ok=o.open0&&o.playing&&o.fightClosed&&o.notCounted&&o.reopen&&o.walkClosed&&!o.skyPrompt&&o.skyWhy==='area'&&/Taiko/.test(o.backPrompt||'')&&o.reopen2&&o.skyClosed;return o}''')

        # ---------- audit ----------
        au = await pg.evaluate("(()=>{const e=HIT_DC.eco;let a;try{a=e.audit()}catch(x){a={ok:false,err:String(x)}}const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error);return{audit:a&&(a.ok!==undefined?a.ok:a),n:e.history(1e6).length,mods}})()")
        C['audit'] = {'ledgerEntriesBefore': led0, 'ledgerEntriesAfter': au['n'], 'audit': au['audit'], 'moduleErrors': au['mods'], 'pageErrors': errs[:10],
                      'ok': au['n'] == led0 and (au['audit'] is True or (isinstance(au['audit'], dict) and au['audit'].get('ok'))) and not au['mods'] and not errs}
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values() if isinstance(v, dict) and 'ok' in v)
    s = json.dumps(out, indent=1, default=str); print(s)
    if OUT: open(OUT, 'w').write(s)
    print('PASS' if out['pass'] else 'FAIL', {k: v.get('ok') for k, v in C.items() if isinstance(v, dict)})

asyncio.run(main())
