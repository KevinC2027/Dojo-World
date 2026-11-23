"""Town shops test (Step 6 gate).  Usage:
  python3 -I dw2/tools/shop.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random and drives the real game: Red is placed at each counter, the INTERACT path (_updateNear/_doInteract) opens the shop,
and the BUY / GIVE buttons are clicked in the DOM like a player would. A test clock (Date.now + offset) steps 61 s between purchases so
the per-minute limit does not interfere, except in the rate-limit check. Checks:
  buy        every item at every counter: balance, ledger entry (src 'shop', price from DC_CONFIG), pouch coins (+ any still flying in)
             and the coins flown to the counter all agree
  (v2.18: the rate-limit check buys daikon seed packets, the cheapest item; v2.24: it runs last, on a fresh 500 DC ledger, since the
   every-item loop now spends 454 DC with the 25 DC insect net)
  refuse     not enough DC (balance and ledger unchanged), wrong counter, unknown item, rate limit, coliseum (eco + HIT_SHOP + panel)
  give       gifts to townsfolk in view: prompt, panel, reaction (they stop and turn to Red), bag shrinks; behind a wall: no prompt, refused
  reload     the bag and balance are rebuilt from the ledger after a page reload
  audit      eco.audit() clean, no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=0;Date.now=()=>n0()+window.__dt})()" % SEED)

HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__state=()=>{HIT_DC.int.refresh();const e=HIT_DC.eco,s=e.summary(),p=HIT_DC.pouch(),h=e.history(1e6),inRed=HIT_DC.coins.filter(k=>k.to==='red').reduce((t,k)=>t+k.val,0);return{bal:s.balance,avail:s.available,n:s.count,pouch:p?p[0]*100+p[1]*10+p[2]:null,inRed,pouchOk:!!p&&p[0]*100+p[1]*10+p[2]===Math.max(0,s.available-inRed),
  shopDebits:h.filter(x=>x.t==='d'&&x.src==='shop').length,bag:HIT_SHOP.bag.length,audit:e.audit()}};
window.__counter=(sid)=>{const M={general:'nf_s1',bakery:'nf_s3',smithy:'nf_s5',stand:'stand'};if(sid==='ramen')return[-26,5.5,'Counter','ramen'];return HIT_LIFE.SPEC[M[sid]].items.find(i=>/buy|Honesty|Cashier/.test(i[2]))};0'''

async def main():
    out = {'seed': SEED, 'buys': [], 'refusals': {}, 'gifts': [], 'wall': None, 'reload': None, 'errors': [], 'moduleErrors': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + (arg('--q') or '')); await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0&&window.HIT_SHOP', timeout=20000)
        await pg.wait_for_timeout(1500); await pg.evaluate("requestAnimationFrame=()=>0")
        await pg.evaluate(HELP)
        await pg.evaluate("()=>{for(let i=0;i<150;i++)tick()}")   # the welcome coins land in the pouch first
        items = await pg.evaluate("()=>HIT_DC.config.shop.items.map(i=>({id:i.id,shop:i.shop,price:i.price,kind:i.kind||null}))")
        # ---------- buy every item at its counter, through INTERACT + the DOM button ----------
        for it in items:
            await pg.evaluate("()=>{window.__dt+=61000}")
            r = await pg.evaluate('''async (it)=>{
              const c=__counter(it.shop); __at(c[0],c[1]); __T(3); __at(c[0],c[1]); HIT_SHOP.close(); _updateNear();
              const o={item:it.id,shop:it.shop,price:it.price,prompt:_near&&_near.label}; _doInteract(); let w=0; while(!HIT_SHOP.panel&&w<200){tick();w++} o.reachTicks=w; o.panel=HIT_SHOP.panel; o.before=__state();
              const loose0=HIT_DC.coins.length; const btn=document.querySelector('#shop-box button[data-item="'+it.id+'"]'); o.btn=!!btn&&!btn.disabled;
              if(btn)btn.click(); for(let i=0;i<40&&HIT_SHOP.busy;i++)await new Promise(r=>setTimeout(r,25));
              const fl=HIT_DC.coins.slice(loose0).filter(k=>k.to!=='red'); o.flown=fl.reduce((s,k)=>s+k.val,0); o.flownTo=fl.length?[+fl[0].to.x.toFixed(2),+fl[0].to.z.toFixed(2)]:null;
              o.after=__state(); const h=HIT_DC.eco.history(1)[0]; o.entry={src:h.src,amt:h.amt,item:h.meta&&h.meta.item,shop:h.meta&&h.meta.shop,t:h.t};
              __T(90); o.landed=HIT_DC.coins.filter(k=>k.to!=='red').length===0; return o}''', it)
            r['ok'] = (r['panel'] == 'shop:' + it['shop'] and r['btn'] and r['after']['avail'] == r['before']['avail'] - it['price'] and r['after']['pouchOk']
                       and r['entry'] == {'src': 'shop', 'amt': it['price'], 'item': it['id'], 'shop': it['shop'], 't': 'd'} and r['flown'] == it['price'] and r['after']['bag'] == r['before']['bag'] + (0 if it.get('kind') in ('seed', 'kite', 'net', 'camera') else 1)   # v2.13: seed packets are sown, not gifts; v2.18: the kite is kept, not a gift; v2.24: so is the net; v2.27: and the camera
                       and r['after']['audit']['ok'])
            out['buys'].append(r)
        # ---------- refusals ----------
        R = out['refusals']
        R['insufficient'] = await pg.evaluate('''async ()=>{const o={};window.__dt+=61000; const c=__counter('bakery'); __at(c[0],c[1]);
            while(HIT_DC.eco.summary().available>=90){window.__dt+=61000; const r=await HIT_SHOP.buy('cake','bakery'); if(!r.ok)break}
            window.__dt+=61000; HIT_SHOP.open('bakery',c[0],c[1]); o.before=__state(); const b=document.querySelector('#shop-box button[data-item="cake"]'); o.btnDisabled=!!b&&b.disabled;
            const r=await HIT_SHOP.buy('cake','bakery'); o.code=r.code; o.after=__state(); HIT_SHOP.close();
            o.ok=r.code==='insufficient'&&o.btnDisabled&&o.after.avail===o.before.avail&&o.after.n===o.before.n&&o.after.pouchOk; return o}''')
        R['wrongShop'] = await pg.evaluate("async ()=>{const r=await HIT_DC.eco.buy('bakery','lantern','t-ws','town');return{code:r.code,ok:r.code==='wrong_shop'}}")
        R['unknownItem'] = await pg.evaluate("async ()=>{const r=await HIT_DC.eco.buy('general','sword','t-ui','town');return{code:r.code,ok:r.code==='unknown_item'}}")
        R['coliseum'] = await pg.evaluate('''async ()=>{window.__dt+=61000; HIT_TRAVEL.jump('sky'); const o={sky:HIT_SKY.on}; const s0=__state();
            const r1=await HIT_DC.eco.buy('stand','eggs','t-sky','sky'); const r2=await HIT_SHOP.buy('eggs','stand'); HIT_SHOP.open('stand',0,0); o.panel=HIT_SHOP.panel||null;
            o.codes=[r1.code,r2.code]; const s1=__state(); o.unchanged=s1.n===s0.n&&s1.avail===s0.avail; HIT_TRAVEL.jump('town'); o.back=!HIT_SKY.on;
            o.ok=o.sky&&r1.code==='area'&&r2.code==='area'&&!o.panel&&o.unchanged&&o.back; return o}''')
        # top up for gifts if the rate test used it all (the bag already holds items)
        # ---------- gifts ----------
        for aid in ['farmer', 'v2', 'b1', 'baker_in', 'smith', 'clk_gs', 'inn_in', 'dep', 'mayor']:
            r = await pg.evaluate('''(aid)=>{const rec=HIT_LIFE.actors.find(r=>r.id===aid); const o={id:aid,tag:rec.tag};
              const L=HIT_LIFE.ROOMOF; __at(rec.x,rec.z+1.3); if(rec.room){} for(let i=0;i<45;i++){tick()}
              const n=crowd.find(n=>n._rec===rec); if(!n){o.ok=false;o.why='not in crowd';return o}
              let ok=false; for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){__at(n.x+dx*1.1,n.z+dz*1.1); if(!WORLD.solids.some(s=>S[0].x>s.x0&&S[0].x<s.x1&&S[0].z>s.z0&&S[0].z<s.z1)&&!wallBetween(S[0].x,S[0].z,n.x,n.z)&&(!rec.room||HIT_LIFE.insideId()===rec.room)){ok=true;break}}
              S[0].fx=(n.x-S[0].x)/1.1; S[0].fz=(n.z-S[0].z)/1.1;
              HIT_SHOP.close(); _updateNear(); o.prompt=_near&&_near.label; o.bag0=HIT_SHOP.bag.length; _doInteract(); o.panel=HIT_SHOP.panel;
              const btn=document.querySelector('#shop-box button[data-pid]'); o.btn=!!btn&&!btn.disabled; const it0=HIT_SHOP.bag[0]&&HIT_SHOP.bag[0].item; if(btn)btn.click();
              o.item=it0; o.bag1=HIT_SHOP.bag.length; o.react=!!n._gft; o.love=n._gft&&n._gft.love; o.msg=HIT_SHOP.lastLine; const x0=n.x,z0=n.z;
              __at(S[0].x,S[0].z); for(let i=0;i<70;i++)tick(); const dx=S[0].x-n.x,dz=S[0].z-n.z,dl=Math.hypot(dx,dz)||1; o.facing=+((n.fx*dx+n.fz*dz)/dl).toFixed(2); o.moved=+Math.hypot(n.x-x0,n.z-z0).toFixed(2);
              o.ok=/^Give a gift to /.test(o.prompt||'')&&o.panel==='bag'&&o.btn&&o.bag1===o.bag0-1&&o.react&&o.facing>.9&&o.moved<.3&&(HIT_SHOP.lastLine||'').indexOf(rec.tag)===0; return o}''', aid)
            out['gifts'].append(r)
        out['wall'] = await pg.evaluate('''()=>{const o={};
            const s=WORLD.solids.find(s=>{const w=s.x1-s.x0,d=s.z1-s.z0;return Math.min(w,d)<=.7&&Math.max(w,d)>=4&&(s.h===undefined||s.h>1)&&Math.abs((s.x0+s.x1)/2)<120&&Math.abs((s.z0+s.z1)/2)<120&&!s.room});
            if(!s){o.ok=false;o.why='no thin wall';return o} const thinX=(s.x1-s.x0)<(s.z1-s.z0), cx=(s.x0+s.x1)/2, cz=(s.z0+s.z1)/2, hw=thinX?(s.x1-s.x0)/2:(s.z1-s.z0)/2;
            const rec=HIT_LIFE.actors.find(r=>r.id==='farmer'); let n=crowd.find(n=>n._rec===rec); if(!n){__at(rec.x,rec.z+1.3);for(let i=0;i<65;i++)tick();n=crowd.find(n=>n._rec===rec)}
            if(!n)n=crowd.find(n=>n!==S[0]&&n.hp>0&&!n.prov&&!(n._rec&&n._rec.room)); if(!n){o.ok=false;o.why='no npc';return o} o.npc=n._rec?n._rec.tag:'Townsperson'; const hx=n.x,hz=n.z;
            const off=hw+.55; if(thinX){__at(cx-off,cz);n.x=cx+off;n.z=cz}else{__at(cx,cz-off);n.x=cx;n.z=cz+off} n._gft=null;
            o.wall=[+cx.toFixed(1),+cz.toFixed(1),+(2*hw).toFixed(2)]; o.dist=+Math.hypot(n.x-S[0].x,n.z-S[0].z).toFixed(2); o.wallBetween=wallBetween(S[0].x,S[0].z,n.x,n.z);
            HIT_SHOP.close(); _updateNear(); o.prompt=_near&&_near.label||null; const b0=HIT_SHOP.bag.length; const r=HIT_SHOP.give(HIT_SHOP.bag[0]&&HIT_SHOP.bag[0].pid,n); o.code=r.code; o.bagSame=HIT_SHOP.bag.length===b0; o.react=!!n._gft;
            n.x=hx;n.z=hz; o.ok=o.wallBetween&&o.dist<1.9&&!/^Give/.test(o.prompt||'')&&r.code==='far'&&o.bagSame&&!o.react; return o}''')
        before = await pg.evaluate("()=>({bag:HIT_SHOP.bag.map(b=>b.item).sort(),st:__state()})")
        await pg.reload(); await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>1&&window.HIT_SHOP', timeout=20000)
        await pg.wait_for_timeout(1500); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP); await pg.evaluate("()=>HIT_SHOP.rebag()")
        after = await pg.evaluate("()=>({bag:HIT_SHOP.bag.map(b=>b.item).sort(),st:__state()})")
        out['reload'] = {'bagBefore': len(before['bag']), 'bagAfter': len(after['bag']), 'balBefore': before['st']['bal'], 'balAfter': after['st']['bal'], 'audit': after['st']['audit'],
                         'ok': before['bag'] == after['bag'] and before['st']['bal'] == after['st']['bal'] and after['st']['audit']['ok']}
        out['final'] = after['st']
        # v2.24: the every-item loop now spends 454 of the 500 DC start, so the rate-limit check runs last on a fresh ledger (storage cleared, reload)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0&&window.HIT_SHOP', timeout=20000)
        await pg.wait_for_timeout(1500); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP)
        out['refusals']['rateLimit'] = await pg.evaluate('''async ()=>{window.__dt+=61000; const codes=[]; for(let i=0;i<9;i++){const r=await HIT_DC.eco.buy('stand','seed_daikon','t-rl'+i,'town');codes.push(r.ok?'ok':r.code)}
            const okN=codes.filter(c=>c==='ok').length; return{codes,ok:okN===8&&codes[8]==='shop_rate'}}''')
        out['moduleErrors'] = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        await b.close()
    out['summary'] = {'buysOk': sum(1 for x in out['buys'] if x['ok']), 'buys': len(out['buys']), 'refusalsOk': {k: v['ok'] for k, v in out['refusals'].items()},
                      'giftsOk': sum(1 for x in out['gifts'] if x['ok']), 'gifts': len(out['gifts']), 'wallOk': out['wall'] and out['wall']['ok'], 'reloadOk': out['reload']['ok'],
                      'pageErrors': len(out['errors']), 'moduleErrors': out['moduleErrors']}
    s = out['summary']; s['PASS'] = (s['buysOk'] == s['buys'] and all(s['refusalsOk'].values()) and s['giftsOk'] == s['gifts'] and s['wallOk'] and s['reloadOk'] and not s['pageErrors'] and not s['moduleErrors'])
    print(json.dumps(out['summary'], indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
