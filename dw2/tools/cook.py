"""Home cooking test (Step 13 gate).  Usage:
  python3 -I dw2/tools/cook.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random and drives the real game through the INTERACT path (_updateNear/_doInteract) and the panel's DOM buttons, like a player.
Garden produce is seeded as earlier harvests (the v2.13 allotment's saved state); shop goods are bought through the real 'shop' debit.
Checks:
  oldstove   with nothing cookable in the bag every stove keeps its old prompt, and INTERACT runs the old warm meal (same hp result as v2.15)
  stoves     all 10 home stoves: the prompt becomes the recipe book once the bag holds an ingredient; the book opens there
  cook       all 6 recipes cooked through INTERACT + COOK + SEAR/SERVE taps at 6 different stoves, with the grades aimed for
             (perfect / good / overdone (needle ran off the top) / rushed (tapped early)); each serve uses exactly the recipe's
             ingredients (the oldest of each kind), once, and puts the dish in the bag
  missing    a recipe with an ingredient missing: COOK disabled, start refused, nothing used
  cancels    CANCEL, walking out of the house, a fight (Red punches someone) and the coliseum each stop a cook mid-way: nothing used
  warm       the WARM MEAL button still runs the old stove action
  give       a perfect dish is loved by someone with no love for it; a good dish is only liked
  ledger     coins spent == the shop goods bought; cooking never credits or debits; audit clean; consumed pids unique, all real bag items
  reload     dishes in the bag and the recipe book survive a reload
  errors     no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=+(sessionStorage.getItem('__dt')||0);Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;H0.ax=H0.az=0;};
window.__K=HIT_COOK;
window.__st=()=>{const e=HIT_DC.eco,s=e.summary(),h=e.history(1e6);return{bal:s.balance,avail:s.available,n:s.count,debits:h.filter(x=>x.t==='d').length,
  debitSum:h.filter(x=>x.t==='d').reduce((t,x)=>t+x.amt,0),credits:h.filter(x=>x.t!=='d').length,audit:e.audit()}};
window.__bag=()=>{HIT_SHOP.rebag();const c={};for(const b of HIT_SHOP.bag)c[b.item]=(c[b.item]||0)+1;return c};
window.__pids=()=>{HIT_SHOP.rebag();return HIT_SHOP.bag.map(b=>b.pid)};
window.__near=()=>{HIT_SHOP.close();_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__stove=(i)=>{__K.close();const s=__K.STOVES[i];__at(s.x,s.z);S[0].fx=s.tx-s.x;S[0].fz=s.tz-s.z;const l=Math.hypot(S[0].fx,S[0].fz)||1;S[0].fx/=l;S[0].fz/=l;__T(3);__at(s.x,s.z);return __near()};
window.__open=(i)=>{const n=__stove(i);_doInteract();return{prompt:n&&n.label,act:n&&n.act,panel:!!__K.panel,room:__K.panel&&__K.panel.stove.room}};
window.__tick=(n)=>{for(let i=0;i<n;i++){tick();__K.watch()}};
window.__tapAt=(h)=>{let w=0;while(__K.cook&&__K.heat()<h&&w<600){__tick(1);w++}const b=document.getElementById('cook-tap');if(!b)return{ok:false,w};const h0=__K.heat();b.click();return{ok:true,h:+h0.toFixed(3),w}};
window.__runOff=()=>{const ph=__K.cook&&__K.cook.ph;let w=0;while(__K.cook&&__K.cook.ph===ph&&w<800){__tick(1);w++}return w};0'''

async def boot(pg):
    await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0&&window.HIT_SHOP&&window.HIT_GARDEN&&window.HIT_COOK&&HIT_COOK.STOVES.length', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP)

CROPS = {'tomatoes': 4, 'daikon': 4, 'strawberries': 2, 'sunflowers': 2}
BUY = [('eggs', 'stand'), ('eggs', 'stand'), ('eggs', 'stand'), ('eggs', 'stand'), ('melonpan', 'bakery'), ('honey', 'general'), ('ramen', 'ramen')]
# recipe -> (stove index, tap plan) ; plan entries: number = tap at that heat, 'g' = gold centre, 'g+'/'g-' = inside green, 'off' = let it run off the top
PLAN = [('omelette', 0, ['g', 'g'], 'perfect'), ('oden', 2, ['g+', 'g-'], 'good'), ('salad', 4, ['g', 'off'], 'overdone'),
        ('sando', 6, [.2, 'g'], 'rushed'), ('bars', 8, ['g', 'g'], 'perfect'), ('ramen2', 9, ['g', 'g+'], 'good')]

async def main():
    out = {'seed': SEED, 'checks': {}, 'errors': []}
    C = out['checks']
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + (arg('--q') or '')); await boot(pg)
        await pg.evaluate("()=>{for(let i=0;i<150;i++)tick()}")
        # ---------- empty bag: the old stove ----------
        C['oldstove'] = await pg.evaluate('''()=>{const o={labels:[]};for(let i=0;i<__K.STOVES.length;i++){const n=__stove(i);o.labels.push(n&&n.label)}
            const a=S[0];const n=__stove(3);a.hp=40;_doInteract();o.panel=!!__K.panel;o.hp=a.hp;
            o.ok=o.labels.every(l=>/stove: cook/i.test(l||'')&&!/recipe/.test(l))&&!o.panel&&o.hp>60;a.hp=100;return o}''')
        # ---------- seed earlier harvests, buy shop goods ----------
        await pg.evaluate('''(cr)=>{const crops=[];let k=0;for(const id in cr)for(let i=0;i<cr[id];i++)crops.push({pid:'garden:test:'+(k++)+':'+id,item:id,ts:Date.now()-1e6+k,bed:0});
            const blank={crop:null,seed:null,pid:null,sown:0,grown:0,wetUntil:0,last:0};localStorage.setItem('dw2.garden.v1',JSON.stringify({v:1,beds:[blank,blank,blank,blank],used:{},crops:crops,harvested:k}))}''', CROPS)
        await pg.evaluate("()=>sessionStorage.setItem('__dt',String(window.__dt))")
        await pg.reload(); await boot(pg)
        start = await pg.evaluate("()=>__st()")
        buys = []
        for it, shop in BUY:
            r = await pg.evaluate('''async ([it,shop])=>{const r=await HIT_SHOP.buy(it,shop);HIT_SHOP.close();return{item:it,ok:!!(r&&r.ok),code:r&&r.code}}''', [it, shop])
            buys.append(r)
        prices = await pg.evaluate("()=>Object.fromEntries(HIT_DC.config.shop.items.map(i=>[i.id,i.price]))")
        spent = sum(prices[i] for i, _ in BUY)
        bag0 = await pg.evaluate("()=>__bag()")
        C['setup'] = {'buys': buys, 'bag': bag0, 'ok': all(x['ok'] for x in buys) and all(bag0.get(k, 0) == v for k, v in CROPS.items()) and bag0.get('eggs') == 4}
        # ---------- all 10 stoves: the recipe book ----------
        C['stoves'] = await pg.evaluate('''()=>{const o={n:__K.STOVES.length,rooms:[],bad:[]};for(let i=0;i<__K.STOVES.length;i++){const r=__open(i);o.rooms.push(r.room);if(!(r.act==='cookbook'&&/^Stove: recipe book/.test(r.prompt||'')&&r.panel&&r.room===__K.STOVES[i].room))o.bad.push([i,r]);__K.close()}
            o.ok=o.n===10&&!o.bad.length;return o}''')
        # ---------- cook every recipe ----------
        cooks = []
        for rid, si, plan, want in PLAN:
            r = await pg.evaluate('''([rid,si,plan])=>{const o={rid,stove:si};HIT_SHOP.rebag();const bagL=HIT_SHOP.bag.map(b=>({pid:b.pid,item:b.item}));const b0=__bag(),p0=__pids(),s0=__st(),R=__K.RECIPES.find(r=>r.id===rid);
              const op=__open(si);o.prompt=op.prompt;o.room=op.room;const btn=document.querySelector('#cook-box button[data-recipe="'+rid+'"]');o.btn=!!btn&&!btn.disabled;if(btn)btn.click();
              o.cooking=!!__K.cook;o.taps=[];o.panAdded=WORLD.props.some(q=>q.k==='cookpan');o.midBag=JSON.stringify(__bag())===JSON.stringify(b0);
              for(let ph=0;ph<2;ph++){const g=R.gold[ph],t=plan[ph];if(t==='off'){o.taps.push({off:__runOff()});continue}
                const h=t==='g'?g:t==='g+'?g+.12:t==='g-'?g-.12:t;o.taps.push(__tapAt(h));if(ph===0)o.midBag2=JSON.stringify(__bag())===JSON.stringify(b0)}
              const L=__K.last,b1=__bag(),p1=__pids(),s1=__st();o.q=L&&L.r===rid?L.q:null;o.used=L&&L.used;o.cookAfter=!!__K.cook;o.panGone=!WORLD.props.some(q=>q.k==='cookpan');
              o.usedItems=(L&&L.used||[]).map(pid=>{const was=HIT_SHOP.bag;return pid});
              const exp={};for(const id of R.need)exp[id]=(b0[id]||0)-1;exp['dish_'+rid]=(b0['dish_'+rid]||0)+1;o.bagOk=Object.keys(exp).every(k=>(b1[k]||0)===exp[k]);
              const oldest=R.need.map(id=>HIT_SHOP.__last=null);o.usedFromBag=(L&&L.used||[]).every(pid=>p0.includes(pid)&&!p1.includes(pid));o.dishInBag=!!(L&&p1.includes(L.pid));
              o.oldestOk=!!L&&R.need.every((id,k)=>(bagL.find(b=>b.item===id)||{}).pid===L.used[k]);o.noCoins=s1.n===s0.n&&s1.avail===s0.avail;o.panelBook=!!__K.panel&&!__K.cook;__K.close();return o}''', [rid, si, plan])
            r['want'] = want
            r['ok'] = bool(r['btn'] and r['cooking'] and r['panAdded'] and r['midBag'] and r.get('midBag2', True) and r['q'] == want and r['used'] and len(r['used']) == len(set(r['used']))
                           and r['bagOk'] and r['oldestOk'] and r['usedFromBag'] and r['dishInBag'] and r['noCoins'] and not r['cookAfter'] and r['panGone'] and r['panelBook'])
            cooks.append(r); print(rid, want, r['q'], 'OK' if r['ok'] else 'FAIL', flush=True)
        C['cook'] = {'detail': cooks, 'ok': all(x['ok'] for x in cooks) and len(cooks) == 6}
        # oldest-first: each serve used the oldest pid of each ingredient kind (by bag order at the time)
        C['oldest'] = await pg.evaluate('''()=>{const L=__K.log.filter(e=>e.ev==='serve');return{n:L.length,ok:L.length===6&&L.every(e=>e.used.every(p=>!/^cook:/.test(p)))}}''')
        # ---------- missing ingredient ----------
        C['missing'] = await pg.evaluate('''()=>{const o={};const b0=__bag();__open(1);const btn=document.querySelector('#cook-box button[data-recipe="sando"]');o.disabled=!!btn&&btn.disabled;
            o.miss=__K.missing('sando');o.code=__K.start('sando').code;o.cooking=!!__K.cook;o.same=JSON.stringify(__bag())===JSON.stringify(b0);__K.close();
            o.ok=o.disabled&&o.miss.includes('melonpan')&&o.code==='missing'&&!o.cooking&&o.same;return o}''')
        # ---------- cancels ----------
        cn = {}
        cn['button'] = await pg.evaluate('''()=>{const o={};const b0=__bag();__open(1);document.querySelector('#cook-box button[data-recipe="omelette"]').click();o.cooking=!!__K.cook;__tapAt(.3);
            document.getElementById('cook-cancel').click();o.after=!!__K.cook;o.why=(__K.log.filter(e=>e.ev==='cancel').pop()||{}).why;o.same=JSON.stringify(__bag())===JSON.stringify(b0);o.book=!!__K.panel;__K.close();
            o.ok=o.cooking&&!o.after&&o.why==='button'&&o.same&&o.book;return o}''')
        cn['left'] = await pg.evaluate('''()=>{const o={};const b0=__bag();__open(3);document.querySelector('#cook-box button[data-recipe="omelette"]').click();o.cooking=!!__K.cook;
            const s=__K.STOVES[3],R=ROOMS[s.room];__at(R.doorX,R.z1+1.6);__tick(2);o.room=_insideRoom();__K.watch();
            o.after=!!__K.cook;o.why=(__K.log.filter(e=>e.ev==='cancel').pop()||{}).why;o.panel=!!__K.panel;o.same=JSON.stringify(__bag())===JSON.stringify(b0);
            o.ok=o.cooking&&!o.after&&o.why==='left'&&!o.panel&&o.same;return o}''')
        cn['fight'] = await pg.evaluate('''()=>{const o={};const b0=__bag();__open(5);document.querySelector('#cook-box button[data-recipe="omelette"]').click();o.cooking=!!__K.cook;
            const a=S[0],v=crowd.find(n=>n._rec&&n.hp>50);o.victim=v&&v._rec.tag;const s=__K.STOVES[5];const vx0=a.x+.8,vz0=a.z;a.fx=1;a.fz=0;
            const hold=(n)=>{for(let i=0;i<n;i++){tick();v.x=vx0;v.z=vz0;v.vx=v.vz=0;v.fx=-1;v.fz=0;a.x=s.x;a.z=s.z}};const hp0=v.hp;
            for(let k=0;k<8&&v.hp>=hp0-1e-6&&__K.cook;k++){for(let w=0;w<200&&!(a.st==='idle'||a.st==='walk');w++)hold(1);a.fx=1;a.fz=0;press('p',1);hold(3);press('p',0);hold(22)}
            o.hit=v.hp<hp0-1e-6;o.after=!!__K.cook;o.why=(__K.log.filter(e=>e.ev==='cancel').pop()||{}).why;o.same=JSON.stringify(__bag())===JSON.stringify(b0);
            v.prov=0;lockT=null;if(window.HIT_POLICE)HIT_POLICE.reset();__T(60);o.ok=o.cooking&&o.hit&&!o.after&&o.why==='fight'&&o.same;return o}''')
        cn['area'] = await pg.evaluate('''async ()=>{const o={};const b0=__bag();__open(7);document.querySelector('#cook-box button[data-recipe="omelette"]').click();o.cooking=!!__K.cook;
            HIT_TRAVEL.jump('sky');await new Promise(r=>setTimeout(r,700));__K.watch();o.sky=HIT_SKY.on;o.after=!!__K.cook;o.why=(__K.log.filter(e=>e.ev==='cancel').pop()||{}).why;o.same=JSON.stringify(__bag())===JSON.stringify(b0);
            o.openSky=__K.openAt(0)&&__K.openAt(0).code;o.panel=!!__K.panel;HIT_TRAVEL.jump('town');await new Promise(r=>setTimeout(r,1300));o.back=!HIT_SKY.on;
            o.ok=o.cooking&&o.sky&&!o.after&&o.why==='area'&&o.same&&o.openSky==='area'&&!o.panel&&o.back;return o}''')
        C['cancels'] = {'detail': cn, 'ok': all(v['ok'] for v in cn.values())}
        # ---------- warm meal button ----------
        C['warm'] = await pg.evaluate('''()=>{const o={};const a=S[0];__open(5);a.hp=50;const b=document.getElementById('cook-warm');o.btn=!!b;if(b)b.click();o.hp=a.hp;o.panel=!!__K.panel;a.hp=100;
            o.ok=o.btn&&o.hp>70&&!o.panel;return o}''')
        # one more perfect omelette (uses the last eggs), then give: a perfect dish is loved, a good one liked
        C['give'] = await pg.evaluate('''()=>{const o={};__open(1);document.querySelector('#cook-box button[data-recipe="omelette"]').click();__tapAt(__K.RECIPES[0].gold[0]);__tapAt(__K.RECIPES[0].gold[1]);o.q=__K.last.q;__K.close();
            const giveTo=(pid)=>{const rec=HIT_LIFE.actors.find(r=>r.id==='farmer');__at(rec.x,rec.z+1.3);__T(45);const n=crowd.find(n=>n._rec===rec);if(!n)return{why:'no farmer'};
              for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){__at(n.x+dx*1.1,n.z+dz*1.1);if(!WORLD.solids.some(s=>S[0].x>s.x0&&S[0].x<s.x1&&S[0].z>s.z0&&S[0].z<s.z1)&&!wallBetween(S[0].x,S[0].z,n.x,n.z))break}
              S[0].fx=(n.x-S[0].x)/1.1;S[0].fz=(n.z-S[0].z)/1.1;n._gft=null;__near();_doInteract();const btn=document.querySelector('#shop-box button[data-pid="'+pid+'"]');const r={btn:!!btn};if(btn)btn.click();
              r.item=n._gft&&n._gft.item;r.love=n._gft&&n._gft.love;r.line=HIT_SHOP.lastLine;HIT_SHOP.close();__T(200);return r};
            const st=__K.state(),perf=st.dishes.find(d=>d.q==='perfect'&&d.item==='dish_omelette'),good=st.dishes.find(d=>d.q==='good'&&d.item==='dish_oden');
            o.perfect=giveTo(perf.pid);o.good=giveTo(good.pid);
            o.ok=o.q==='perfect'&&o.perfect.btn&&o.perfect.item==='dish_omelette'&&o.perfect.love===true&&o.good.btn&&o.good.item==='dish_oden'&&o.good.love===false;return o}''')
        # ---------- ledger ----------
        C['ledger'] = await pg.evaluate('''([start,spent])=>{const s=__st(),st=__K.state(),used=[].concat(...st.dishes.map(d=>d.used));
            const given=JSON.parse(localStorage.getItem('dw2.shop.given.v1')||'{}'),cookUsed=Object.keys(given).filter(k=>/^@cook:/.test(given[k].to));
            return{spent:start.avail-s.avail,want:spent,credits:[start.credits,s.credits],audit:s.audit.ok,used:used.length,unique:new Set(used).size,cookUsed:cookUsed.length,
              ok:start.avail-s.avail===spent&&s.credits===start.credits&&s.audit.ok&&used.length===new Set(used).size&&cookUsed.length===used.length&&used.every(p=>cookUsed.includes(p))}}''', [start, spent])
        # ---------- reload ----------
        mid = await pg.evaluate("()=>{sessionStorage.setItem('__dt',String(window.__dt));return{book:__K.state().book,bag:__bag()}}")
        await pg.reload(); await boot(pg)
        aft = await pg.evaluate("()=>({book:__K.state().book,bag:__bag()})")
        C['reload'] = {'before': mid, 'after': aft, 'ok': mid == aft and len(aft['book']) == 6}
        C['final'] = await pg.evaluate("()=>({stats:__K.stats,book:__K.state().book})")
        out['moduleErrors'] = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        await b.close()
    s = out['summary'] = {k: v.get('ok') for k, v in C.items() if isinstance(v, dict) and 'ok' in v}
    s['pageErrors'] = len(out['errors']); s['moduleErrors'] = out['moduleErrors']
    s['PASS'] = all(v for k, v in s.items() if k not in ('pageErrors', 'moduleErrors')) and not out['errors'] and not out['moduleErrors']
    print(json.dumps(s, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
