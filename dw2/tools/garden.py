"""Allotment garden test (Step 10 gate).  Usage:
  python3 -I dw2/tools/garden.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random and drives the real game through the INTERACT path (_updateNear/_doInteract) and DOM buttons, like a player.
A test clock (Date.now + window.__dt) stands in for real minutes of growth. Checks:
  nopacket   an empty bed with no packet: prompt points at the honesty box, INTERACT sows nothing, ledger unchanged
  buy        one packet of each kind at the farm stand honesty box: 'shop' debit at the DC_CONFIG price, packets +1, gift bag unchanged
  sow        all four beds sown through INTERACT (+ the SOW panel when more than one kind is held), one packet used per bed
  can        take the can at the post; empty can refuses to water; filling away from the pond refused; fill at the pond = 4 pours
  grow       water all four beds; +60 s grows 60 s; +90 s more grows only to 120 s (the bed dried at 120 s: dry pause);
             +300 s dry: no growth at all; harvest refused while unripe; water again, +70 s: all ripe
  harvest    INTERACT harvests all four beds: produce in the gift bag, beds empty, no coins credited by sow/water/harvest
  ledger     seed debits == packets sown + packets held; balance == start - prices; audit clean
  give       a harvested crop given to the farmer through the gift flow (reaction)
  reload     a bed mid-growth, its wetness and the harvested produce survive a reload (growth also runs on during the few real seconds
             the reload takes); growth continues on the clock after it
  area       in the coliseum: no sow / water / fill, the can goes back on its post
  errors     no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__st=()=>{const e=HIT_DC.eco,s=e.summary(),h=e.history(1e6);return{bal:s.balance,avail:s.available,n:s.count,seedDebits:h.filter(x=>x.t==='d'&&x.src==='shop'&&/^seed_/.test(x.meta&&x.meta.item)).length,
  seedSum:h.filter(x=>x.t==='d'&&x.src==='shop'&&/^seed_/.test(x.meta&&x.meta.item)).reduce((t,x)=>t+x.amt,0),credits:h.filter(x=>x.t!=='d').length,bag:HIT_SHOP.bag.map(b=>b.item),packets:HIT_GARDEN.packets().length,audit:e.audit()}};
window.__near=()=>{HIT_SHOP.close();HIT_GARDEN.close();_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__bedSpot=(i)=>{const B=HIT_GARDEN.BEDS[i];return[B.x,B.z-B.hz-.4]};
window.__act=(x,z)=>{__at(x,z);__T(2);__at(x,z);const n=__near();_doInteract();return n};0'''

async def boot(pg):
    await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0&&window.HIT_SHOP&&window.HIT_GARDEN', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP)

async def main():
    out = {'seed': SEED, 'checks': {}, 'errors': []}
    C = out['checks']
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        await pg.evaluate("()=>{for(let i=0;i<150;i++)tick()}")
        start = await pg.evaluate("()=>__st()")
        out['start'] = {'bal': start['bal'], 'avail': start['avail']}
        # ---------- no packet ----------
        C['nopacket'] = await pg.evaluate('''()=>{const s0=__st(),[x,z]=__bedSpot(0),n=__act(x,z);__T(3);const b=HIT_GARDEN.beds()[0],s1=__st();
            return{prompt:n&&n.label,crop:b.crop,code:HIT_GARDEN.lastToast,ok:/seeds at the honesty box/.test(n&&n.label||'')&&!b.crop&&s1.n===s0.n&&s1.avail===s0.avail}}''')
        # ---------- buy one packet of each kind at the honesty box ----------
        seeds = await pg.evaluate("()=>HIT_DC.config.shop.items.filter(i=>i.kind==='seed').map(i=>({id:i.id,price:i.price,crop:i.crop}))")
        buys = []
        for it in seeds:
            await pg.evaluate("()=>{window.__dt+=61000}")
            r = await pg.evaluate('''async (it)=>{const c=HIT_LIFE.SPEC.stand.items.find(i=>/Honesty/.test(i[2]));__at(c[0],c[1]);__T(3);__at(c[0],c[1]);HIT_SHOP.close();_updateNear();
              const o={item:it.id,prompt:_near&&_near.label};_doInteract();let w=0;while(!HIT_SHOP.panel&&w<200){tick();w++}o.panel=HIT_SHOP.panel;const s0=__st();
              const btn=document.querySelector('#shop-box button[data-item="'+it.id+'"]');o.btn=!!btn&&!btn.disabled;if(btn)btn.click();for(let i=0;i<40&&HIT_SHOP.busy;i++)await new Promise(r=>setTimeout(r,25));
              const s1=__st(),h=HIT_DC.eco.history(1)[0];o.entry={src:h.src,amt:h.amt,item:h.meta&&h.meta.item};HIT_SHOP.close();__T(90);
              o.ok=o.panel==='shop:stand'&&o.btn&&s1.avail===s0.avail-it.price&&o.entry.src==='shop'&&o.entry.amt===it.price&&o.entry.item===it.id&&s1.packets===s0.packets+1&&s1.bag.length===s0.bag.length&&s1.audit.ok;return o}''', it)
            buys.append(r)
        C['buy'] = {'n': len(buys), 'okN': sum(1 for x in buys if x['ok']), 'detail': buys, 'ok': all(x['ok'] for x in buys) and len(buys) == 4}
        # ---------- sow all four beds through INTERACT ----------
        sows = []
        for i, it in enumerate(seeds):
            r = await pg.evaluate('''([i,id])=>{const[x,z]=__bedSpot(i),p0=HIT_GARDEN.packets().length,n=__act(x,z);const o={bed:i,prompt:n&&n.label,panel:HIT_GARDEN.panel||null};
              if(HIT_GARDEN.panel){const b=document.querySelector('#gar-box button[data-seed="'+id+'"]');o.btn=!!b;if(b)b.click()}
              const bd=HIT_GARDEN.beds()[i];o.crop=bd.crop;o.seed=bd.seed;o.stage=bd.stage;o.packets=[p0,HIT_GARDEN.packets().length];
              o.ok=/^Sow bed /.test(o.prompt||'')&&bd.seed===id&&o.packets[1]===p0-1&&!HIT_GARDEN.panel;return o}''', [i, it['id']])
            sows.append(r)
        C['sow'] = {'detail': sows, 'ok': all(x['ok'] for x in sows), 'panelUsed': sum(1 for x in sows if x['panel'])}
        C['sowOccupied'] = await pg.evaluate("()=>{const r=HIT_GARDEN.plant(0);return{code:r.code,ok:r.code==='occupied'}}")
        # ---------- the can ----------
        C['can'] = await pg.evaluate('''()=>{const o={};const P=HIT_GARDEN.POST;o.dryWater=HIT_GARDEN.water(0).code;
            o.takePrompt=__act(P.x,P.z-.7);o.held=HIT_GARDEN.can.held;o.emptyWater=HIT_GARDEN.water(0).code;
            o.farFill=HIT_GARDEN.fill().code;o.pondPrompt=__act(-25.8,-80.0);o.water=HIT_GARDEN.can.water;
            o.ok=o.dryWater==='no_can'&&/Take the watering can/.test(o.takePrompt&&o.takePrompt.label||'')&&o.held&&o.emptyWater==='empty_can'&&o.farFill==='far'&&/Fill the watering can/.test(o.pondPrompt&&o.pondPrompt.label||'')&&o.water===4;return o}''')
        # ---------- water, grow, dry pause ----------
        C['grow'] = await pg.evaluate('''()=>{const o={},s0=__st();o.water=[];for(let i=0;i<4;i++){const[x,z]=__bedSpot(i),n=__act(x,z);o.water.push(n&&n.label);__T(60)}
            o.canAfter=HIT_GARDEN.can.water;const g=()=>HIT_GARDEN.beds().map(b=>Math.round(b.grown/1000));
            o.g0=g();window.__dt+=60000;o.g60=g();o.st60=HIT_GARDEN.beds().map(b=>b.stage);window.__dt+=90000;o.g150=g();o.wet150=HIT_GARDEN.beds().map(b=>b.wet);
            o.promptDry=(()=>{const[x,z]=__bedSpot(1);__at(x,z);return __near().label})();
            window.__dt+=300000;o.g450=g();o.notRipe=HIT_GARDEN.harvest(0).code;
            const P=HIT_GARDEN.POST;o.refill=__act(-25.8,-80.0).label;for(let i=0;i<4;i++){const[x,z]=__bedSpot(i);__act(x,z);__T(60)}
            window.__dt+=70000;o.g520=g();o.stages=HIT_GARDEN.beds().map(b=>b.stage);const s1=__st();o.noCoins=s1.avail===s0.avail&&s1.n===s0.n;
            const near=(a,v,t)=>a.every(x=>Math.abs(x-v)<=t);
            o.ok=o.water.every(l=>/^Water the /.test(l||''))&&o.canAfter===0&&near(o.g0,0,1)&&near(o.g60,60,1)&&near(o.g150,120,1)&&o.wet150.every(w=>!w)&&/dry, needs water/.test(o.promptDry||'')
              &&near(o.g450,120,1)&&o.notRipe==='not_ripe'&&/Fill/.test(o.refill||'')&&near(o.g520,180,0)&&o.stages.every(s=>s===4)&&o.noCoins;return o}''')
        # ---------- harvest ----------
        C['harvest'] = await pg.evaluate('''()=>{const o={},s0=__st();o.h=[];for(let i=0;i<4;i++){const[x,z]=__bedSpot(i),n=__act(x,z);o.h.push(n&&n.label)}
            const s1=__st();o.bag=s1.bag;o.beds=HIT_GARDEN.beds().map(b=>b.crop);o.noCoins=s1.avail===s0.avail&&s1.n===s0.n&&s1.credits===s0.credits;
            o.ok=o.h.every(l=>/^Harvest the /.test(l||''))&&['tomatoes','daikon','sunflowers','strawberries'].every(c=>s1.bag.includes(c))&&s1.bag.length===s0.bag.length+4&&o.beds.every(c=>!c)&&o.noCoins;return o}''')
        # ---------- ledger ----------
        C['ledger'] = await pg.evaluate('''(start)=>{const s=__st(),used=Object.keys(HIT_GARDEN.state().used).length;
            return{seedDebits:s.seedDebits,sown:used,held:s.packets,seedSum:s.seedSum,bal:s.avail,start:start.avail,audit:s.audit.ok,
              ok:s.seedDebits===used+s.packets&&s.avail===start.avail-s.seedSum&&s.audit.ok}}''', start)
        # ---------- give a harvested crop to the farmer ----------
        C['give'] = await pg.evaluate('''()=>{const rec=HIT_LIFE.actors.find(r=>r.id==='farmer');const o={};__at(rec.x,rec.z+1.3);__T(45);const n=crowd.find(n=>n._rec===rec);if(!n){o.ok=false;o.why='no farmer';return o}
            for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){__at(n.x+dx*1.1,n.z+dz*1.1);if(!WORLD.solids.some(s=>S[0].x>s.x0&&S[0].x<s.x1&&S[0].z>s.z0&&S[0].z<s.z1)&&!wallBetween(S[0].x,S[0].z,n.x,n.z))break}
            S[0].fx=(n.x-S[0].x)/1.1;S[0].fz=(n.z-S[0].z)/1.1;const b0=HIT_SHOP.bag.length;o.prompt=__near().label;_doInteract();o.panel=HIT_SHOP.panel;
            const sf=HIT_SHOP.bag.find(b=>b.item==='sunflowers');const btn=sf&&document.querySelector('#shop-box button[data-pid="'+sf.pid+'"]');o.btn=!!btn;if(btn)btn.click();
            o.react=!!n._gft;o.item=n._gft&&n._gft.item;o.love=n._gft&&n._gft.love;o.line=HIT_SHOP.lastLine;o.bag=[b0,HIT_SHOP.bag.length];
            o.ok=/^Give a gift/.test(o.prompt||'')&&o.panel==='bag'&&o.btn&&o.react&&o.item==='sunflowers'&&o.bag[1]===b0-1;return o}''')
        # ---------- reload mid-growth ----------
        mid = await pg.evaluate('''async ()=>{window.__dt+=61000;const c=HIT_LIFE.SPEC.stand.items.find(i=>/Honesty/.test(i[2]));__at(c[0],c[1]);HIT_SHOP.open('stand',c[0],c[1]);
            const r=await HIT_SHOP.buy('seed_tomato','stand');HIT_SHOP.close();const[x,z]=__bedSpot(2);__act(x,z);
            __act(-25.8,-80.0);__act(x,z);window.__dt+=30000;const b=HIT_GARDEN.beds()[2];return{buy:r.ok,crop:b.crop,grown:b.grown,wet:b.wet,bag:HIT_SHOP.bag.map(b=>b.item).sort(),dt:window.__dt}}''')
        await pg.reload(); await boot(pg)
        aft = await pg.evaluate('''(dt)=>{window.__dt=dt;HIT_SHOP.rebag();const b=HIT_GARDEN.beds()[2];const o={crop:b.crop,grown:b.grown,wet:b.wet,bag:HIT_SHOP.bag.map(b=>b.item).sort(),can:HIT_GARDEN.can.held};
            window.__dt+=40000;o.grownLater=HIT_GARDEN.beds()[2].grown;return o}''', mid['dt'])
        C['reload'] = {'before': mid, 'after': aft, 'ok': mid['buy'] and mid['crop'] == 'tomatoes' and aft['crop'] == 'tomatoes' and 0 <= aft['grown'] - mid['grown'] < 10000 and aft['wet']
                       and aft['bag'] == mid['bag'] and abs(aft['grownLater'] - aft['grown'] - 40000) < 1500 and not aft['can']}
        # ---------- coliseum ----------
        C['area'] = await pg.evaluate('''async ()=>{const P=HIT_GARDEN.POST;__act(P.x,P.z-.7);const o={held0:HIT_GARDEN.can.held};HIT_TRAVEL.jump('sky');await new Promise(r=>setTimeout(r,700));
            o.sky=HIT_SKY.on;o.held1=HIT_GARDEN.can.held;o.codes=[HIT_GARDEN.plant(0).code,HIT_GARDEN.water(2).code,HIT_GARDEN.fill().code,HIT_GARDEN.take().code];
            o.props=WORLD.props.filter(q=>q.k==='allot').length;HIT_TRAVEL.jump('town');await new Promise(r=>setTimeout(r,1300));o.back=!HIT_SKY.on;o.propsBack=WORLD.props.filter(q=>q.k==='allot').length;
            o.ok=o.held0&&o.sky&&!o.held1&&o.codes.every(c=>c==='area')&&o.back&&o.propsBack===4;return o}''')
        C['final'] = await pg.evaluate("()=>{const s=__st();return{audit:s.audit,stats:HIT_GARDEN.stats}}")
        out['moduleErrors'] = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        await b.close()
    s = out['summary'] = {k: v.get('ok') for k, v in C.items() if isinstance(v, dict) and 'ok' in v}
    s['pageErrors'] = len(out['errors']); s['moduleErrors'] = out['moduleErrors']
    s['PASS'] = all(v for k, v in s.items() if k not in ('pageErrors', 'moduleErrors')) and not out['errors'] and not out['moduleErrors']
    print(json.dumps(s, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
