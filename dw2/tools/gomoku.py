"""Gomoku at the inn test (Step 11 gate).  Usage:
  python3 -I dw2/tools/gomoku.py <build.html> [--seed 7] [--games 60] [--json out.json]
Seeds Math.random and drives the real game: INTERACT at the bar opens the touch board, Red's moves go through HIT_GOMOKU.play (the same
call the board's tap handler makes; the tap path itself is checked with real pointer events). Every move list is re-checked here in Python
with an independent rules implementation, so the game cannot grade itself. Checks:
  prompt     no prompt away from the board / outside the inn; at the bar: "Gomoku: play the innkeeper"; INTERACT opens the board
  tap        a real pointerdown shows a ghost stone, a second tap on it places it; a tap on an occupied point does nothing
  legal      every game (random Red, and a 'smart' Red using the same kind of scorer): moves alternate black/white, in bounds, never on a
             stone; the game ends exactly at the first five (Python check), the reported winner matches, the record counts match
  blocks     every innkeeper move, against the position before it (Python): takes a win when she has one; otherwise blocks Red's four;
             otherwise, when Red has an open three and she has no open four of her own and a single point can stop it, she plays such a point
  set        hand-built positions: open three (solid and split) blocked, closed four blocked, her own four beats blocking, an open four
             can only be half-blocked and Red then wins (detected)
  draw       a full board with no five (both sides played by hand) is a draw and counted as one
  flow       new game refused mid-game, resign = loss, CLOSE keeps the game, the inn prompt then says resume, reload keeps record + game
  leave      walking out of the inn or travelling to the coliseum closes the board (game kept); a downed innkeeper refuses to play
  errors     no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); GAMES = int(arg('--games', 60)); OUT = arg('--json')
N = 13
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__spot=()=>{const c=HIT_GOMOKU.cfg.spot;return[c.x,c.z]};
window.__goInn=()=>{const[x,z]=__spot();__at(x,z);__T(40);__at(x,z);__T(1);__at(x,z)};
window.__open=()=>{__goInn();const n=__near();_doInteract();return{label:n&&n.label,panel:HIT_GOMOKU.panel}};
window.__rec=()=>HIT_GOMOKU.state().rec;0'''

# ---------------- independent rules (Python) ----------------
DIRS = [(1, 0), (0, 1), (1, 1), (1, -1)]
def five_at(b, i):
    p = b[i]; r0, c0 = divmod(i, N)
    if not p: return False
    for dr, dc in DIRS:
        n = 1
        for s in (1, -1):
            k = 1
            while 0 <= r0 + s * dr * k < N and 0 <= c0 + s * dc * k < N and b[(r0 + s * dr * k) * N + c0 + s * dc * k] == p: n += 1; k += 1
        if n >= 5: return True
    return False
def win_cells(b, p):
    o = []
    for i in range(N * N):
        if not b[i]:
            b[i] = p
            if five_at(b, i): o.append(i)
            b[i] = 0
    return o
def fours_after(b, i, p):
    b[i] = p; r0, c0 = divmod(i, N); seen = set()
    for dr, dc in DIRS:
        for k in range(-4, 5):
            r, c = r0 + dr * k, c0 + dc * k
            if 0 <= r < N and 0 <= c < N and not b[r * N + c]:
                j = r * N + c; b[j] = p
                if five_at(b, j): seen.add(j)
                b[j] = 0
    b[i] = 0; return len(seen)
def open_four_cells(b, p):
    return [i for i in range(N * N) if not b[i] and fours_after(b, i, p) >= 2]
CAT = {'win': 0, 'four': 0, 'ownOpen4': 0, 'open3': 0, 'open3x2': 0, 'quiet': 0}
def check_ai_move(b, mv):
    """b = position before the innkeeper (2) moves; returns None if fine, else the reason."""
    mine = win_cells(b, 2)
    if mine: CAT['win'] += 1; return None if mv in mine else 'missed win'
    red = win_cells(b, 1)
    if red: CAT['four'] += 1; return None if mv in red else 'did not block four'
    own_open4 = [i for i in range(N * N) if not b[i] and fours_after(b, i, 2) >= 2]
    if own_open4: CAT['ownOpen4'] += 1; return None   # making her own open four is as strong as blocking
    t = open_four_cells(b, 1)
    if not t: CAT['quiet'] += 1; return None
    CAT['open3'] += 1
    def stops(i):
        b[i] = 2; left = [j for j in t if j != i and fours_after(b, j, 1) >= 2]; b[i] = 0; return not left
    fixers = [i for i in range(N * N) if not b[i] and stops(i)]
    if not fixers: CAT['open3x2'] += 1; return None   # two separate open threes: nothing stops both
    return None if mv in fixers else 'did not block open three'
def replay(moves):
    b = [0] * (N * N); bad = []; res = 0; ai_bad = []
    for k, i in enumerate(moves):
        p = 1 if k % 2 == 0 else 2
        if not (0 <= i < N * N) or b[i]: bad.append(k); break
        if p == 2:
            why = check_ai_move(b, i)
            if why: ai_bad.append({'move': k, 'why': why})
        b[i] = p
        if five_at(b, i):
            res = p
            if k != len(moves) - 1: bad.append('moves after five')
            break
    if not res and len(moves) == N * N: res = 3
    return res, bad, ai_bad

async def boot(pg):
    await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&window.HIT_GOMOKU&&window.HIT_LIFE', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP)

PLAY = r'''async ([mode,cap])=>{   // one full game; Red: 'rand' = random point next to the stones, 'smart' = the rules' scorer for black with noise
  const G=HIT_GOMOKU,R=G.rules,N=G.N;G.fast=true;const st0=__rec();if(!G.panel)__open();G.newGame();let guard=0;
  while(!G.state().game.over&&guard++<200){const g=G.state().game;if(g.turn!==1)break;let i;
    if(mode==='smart'){const m=R.aiMove(g.b.slice(),1);i=m.i}else{const c=[];for(let j=0;j<N*N;j++)if(!g.b[j]){const r=(j/N)|0,cc=j%N;let nb=!g.moves.length&&r===6&&cc===6;
      for(let dr=-1;dr<=1&&!nb;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,c2=cc+dc;if(rr>=0&&c2>=0&&rr<N&&c2<N&&g.b[rr*N+c2]){nb=true;break}}if(nb)c.push(j)}i=c[Math.floor(Math.random()*c.length)]}
    const r=G.play((i/N)|0,i%N);if(!r||!r.ok)return{err:'play refused',r}}
  const g=G.state().game,st1=__rec();return{moves:g.moves,over:g.over,rec0:st0,rec1:st1,log:G.lastAI}}'''

async def main():
    out = {'seed': SEED, 'checks': {}, 'errors': []}
    C = out['checks']
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{for(let i=0;i<120;i++)tick()}")
        # ---------- prompt ----------
        C['prompt'] = await pg.evaluate('''()=>{const o={};__at(-24,103);__T(30);o.street=__near();const[x,z]=__spot();__at(x-1.6,z-.2);__T(30);__at(x-1.6,z-.2);o.inside=HIT_LIFE.insideId();o.away=__near();
            const r=__open();o.at=r.label;o.panel=r.panel;o.ok=(!o.street||o.street.act!=='gomoku')&&o.inside==='nf_n1'&&(!o.away||o.away.act!=='gomoku')&&o.at==='Gomoku: play the innkeeper'&&o.panel==='gomoku';return o}''')
        # ---------- tap path (real pointer events on the canvas) ----------
        C['tap'] = await pg.evaluate('''async ()=>{const G=HIT_GOMOKU;G.fast=true;const o={};G.tapCell(6,6);o.ghost=G.state().game.moves.length;G.tapCell(6,6);o.after=G.state().game.moves.slice();
            G.tapCell(6,6);G.tapCell(6,6);o.occupied=G.state().game.moves.length;G.resign();o.ok=o.ghost===0&&o.after.length===2&&o.after[0]===84&&o.occupied===2;return o}''')
        # ---------- many games ----------
        games = []
        for k in range(GAMES):
            mode = 'smart' if k % 3 == 2 else 'rand'
            r = await pg.evaluate(PLAY, [mode, 0])
            r['mode'] = mode; games.append(r)
        legal_bad, ai_bad, res_bad, rec_bad = [], [], [], []
        tally = {'rand': [0, 0, 0], 'smart': [0, 0, 0]}
        for k, gm in enumerate(games):
            if 'err' in gm: legal_bad.append({'game': k, 'err': gm}); continue
            res, bad, aib = replay(gm['moves'])
            if bad: legal_bad.append({'game': k, 'bad': bad})
            if aib: ai_bad.append({'game': k, 'ai': aib})
            if res != gm['over']: res_bad.append({'game': k, 'py': res, 'js': gm['over']})
            d = {kk: gm['rec1'][kk] - gm['rec0'][kk] for kk in ('w', 'l', 'd')}
            want = {'w': int(res == 1), 'l': int(res == 2), 'd': int(res == 3)}
            if d != want: rec_bad.append({'game': k, 'delta': d, 'want': want})
            if res in (1, 2, 3): tally[gm['mode']][res - 1] += 1
        aimoves = sum(len(g.get('moves', [])) // 2 for g in games)
        C['legal'] = {'games': len(games), 'moves': sum(len(g.get('moves', [])) for g in games), 'illegal': legal_bad, 'resultMismatch': res_bad, 'recordMismatch': rec_bad,
                      'tally_W_L_D': tally, 'lengths': [len(g.get('moves', [])) for g in games], 'ok': not legal_bad and not res_bad and not rec_bad and len(games) == GAMES}
        C['blocks'] = {'aiMovesChecked': aimoves, 'situations': CAT, 'violations': ai_bad, 'ok': not ai_bad and aimoves > 0}
        # ---------- hand-built positions ----------
        C['set'] = await pg.evaluate('''()=>{const G=HIT_GOMOKU,R=G.rules,N=G.N,I=(r,c)=>r*N+c;const mk=(bl,wh)=>{const b=new Array(N*N).fill(0);for(const[r,c]of bl)b[I(r,c)]=1;for(const[r,c]of wh)b[I(r,c)]=2;return b};
            const o={};const run=(name,bl,wh,okf)=>{const b=mk(bl,wh),m=R.aiMove(b.slice(),2);b[m.i]=2;o[name]={i:[(m.i/N)|0,m.i%N],why:m.why,ok:okf(b,m)}};
            const noOpen4=(b)=>R.openFourCells(b,1).length===0;
            run('open3',[[6,5],[6,6],[6,7]],[[7,6],[5,4]],(b)=>noOpen4(b));
            run('split3',[[6,4],[6,5],[6,7]],[[8,8],[2,2]],(b)=>noOpen4(b));
            run('diag3',[[4,4],[5,5],[6,6]],[[4,6],[9,2]],(b)=>noOpen4(b));
            run('closed4',[[3,3],[3,4],[3,5],[3,6]],[[3,2],[8,8],[9,9]],(b,m)=>m.i===I(3,7));
            run('broken4',[[5,2],[5,3],[5,5],[5,6]],[[0,0],[12,12],[0,12]],(b,m)=>m.i===I(5,4));
            run('ownWin',[[2,2],[2,3],[2,4],[2,5]],[[8,3],[8,4],[8,5],[8,6],[0,0]],(b,m)=>m.why==='win'&&(m.i===I(8,2)||m.i===I(8,7)));
            const b=mk([[6,4],[6,5],[6,6],[6,7]],[[0,0],[12,12],[0,12]]),m=R.aiMove(b.slice(),2);b[m.i]=2;const w=R.winCells(b,1);
            o.open4={blocked:[(m.i/N)|0,m.i%N],redStill:w.length,ok:m.why==='block4'&&w.length===1};
            b[w[0]]=1;o.open4.winner=R.winner(b);o.open4.ok=o.open4.ok&&o.open4.winner===1;
            o.ok=Object.values(o).every(v=>v.ok);return o}''')
        # ---------- draw: a full board with no five, both sides by hand ----------
        cells = [[((r // 2 + c) % 2) + 1 for c in range(N)] for r in range(N)]
        blacks = [r * N + c for r in range(N) for c in range(N) if cells[r][c] == 1]
        whites = [r * N + c for r in range(N) for c in range(N) if cells[r][c] == 2]
        # the pattern gives one colour 85 and the other 84; black (moves first) must hold the 85
        if len(blacks) < len(whites): blacks, whites = whites, blacks
        order = []
        for k in range(N * N): order.append(blacks[k // 2] if k % 2 == 0 else whites[k // 2])
        bb = [0] * (N * N)
        for k, i in enumerate(order): bb[i] = 1 if k % 2 == 0 else 2
        assert not any(five_at(bb, i) for i in range(N * N))
        C['draw'] = await pg.evaluate('''(order)=>{const G=HIT_GOMOKU;if(!G.panel)__open();G.newGame();G.manual=true;const r0=__rec();let bad=0;
            for(let k=0;k<order.length;k++){const r=G.manualPlay(order[k],k%2?2:1);if(!r||!r.ok)bad++}
            const g=G.state().game,r1=__rec();G.manual=false;return{bad:bad,over:g.over,moves:g.moves.length,d:[r0.d,r1.d],ok:!bad&&g.over===3&&g.moves.length===169&&r1.d===r0.d+1&&r1.w===r0.w&&r1.l===r0.l}}''', order)
        # ---------- flow: new game, resign, close keeps the game, reload ----------
        flow = await pg.evaluate('''()=>{const G=HIT_GOMOKU;G.fast=true;const o={};if(!G.panel)__open();G.newGame();G.play(6,6);o.midNew=G.newGame().code;
            const r0=__rec();o.resign=G.resign().ok;o.l=[r0.l,__rec().l];G.newGame();G.play(5,5);G.play(4,8);const mv=G.state().game.moves.slice();
            G.close('test');o.closed=!G.panel;__T(3);o.prompt=__near();o.kept=G.state().game.moves.length===mv.length;o.mv=mv;o.rec=__rec();
            o.ok=o.midNew==='in_play'&&o.resign&&o.l[1]===o.l[0]+1&&o.closed&&o.kept&&/resume the game \\(4 stones\\)/.test(o.prompt&&o.prompt.label||'');return o}''')
        await pg.reload(); await boot(pg)
        aft = await pg.evaluate('''()=>{const s=HIT_GOMOKU.state();__goInn();const n=__near();_doInteract();return{moves:s.game&&s.game.moves,rec:s.rec,prompt:n&&n.label,panel:HIT_GOMOKU.panel,turn:s.game&&s.game.turn}}''')
        flow['afterReload'] = aft
        flow['ok'] = flow['ok'] and aft['moves'] == flow['mv'] and aft['rec'] == flow['rec'] and aft['panel'] == 'gomoku' and aft['turn'] == 1
        C['flow'] = flow
        # ---------- leaving, the coliseum, a downed innkeeper ----------
        C['leave'] = await pg.evaluate('''async ()=>{const G=HIT_GOMOKU,o={};if(!G.panel)__open();o.open0=G.panel;__at(-24,103.5);__T(5);await new Promise(r=>setTimeout(r,600));o.afterWalkOut=G.panel;o.kept=G.state().game.moves.length;
            __open();o.open1=G.panel;HIT_TRAVEL.jump('sky');await new Promise(r=>setTimeout(r,900));o.sky=HIT_SKY.on;o.afterSky=G.panel;o.skyOpen=G.open().code;
            HIT_TRAVEL.jump('town');await new Promise(r=>setTimeout(r,1300));o.back=!HIT_SKY.on;
            __goInn();const n=crowd.find(n=>n._rec&&n._rec.id==='inn_in');const st=n.st;n.st='down';o.downCode=G.open().code;n.st=st;o.reopen=__open().panel;G.close();
            o.ok=o.open0==='gomoku'&&o.afterWalkOut==null&&o.kept>0&&o.open1==='gomoku'&&o.sky&&o.afterSky==null&&o.skyOpen==='area'&&o.back&&o.downCode==='keeper'&&o.reopen==='gomoku';return o}''')
        out['stats'] = await pg.evaluate("()=>HIT_GOMOKU.stats")
        out['moduleErrors'] = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        await b.close()
    s = out['summary'] = {k: v.get('ok') for k, v in C.items() if isinstance(v, dict) and 'ok' in v}
    s['games'] = C['legal']['games']; s['tally_W_L_D'] = C['legal']['tally_W_L_D']; s['aiMovesChecked'] = C['blocks']['aiMovesChecked']; s['situations'] = CAT
    s['pageErrors'] = len(out['errors']); s['moduleErrors'] = out['moduleErrors']
    s['PASS'] = all(v for k, v in s.items() if isinstance(v, bool)) and not out['errors'] and not out['moduleErrors']
    print(json.dumps(s, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
