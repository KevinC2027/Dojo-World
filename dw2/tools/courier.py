"""Bakery courier test (Step 8 gate).  Usage:
  python3 -I dw2/tools/courier.py <build.html> [--seed 7] [--rounds 2] [--json out.json]
Seeds Math.random and drives the real game (requestAnimationFrame stopped, tick() stepped by hand):
  deliver   for every destination (8 houses + farmhouse, the inn, Northfield Hall, the Town Hall), --rounds times:
            Red stands at the bakery counter, INTERACT ("Baker: courier job") opens the panel, TAKE THE PARCEL is clicked in the DOM,
            then Red WALKS with the joystick (H0.ax/az, real collision) along the route the game computed, through the door into the
            destination. Every tick checks that Red never stands inside a tall solid and never crosses a wall between two ticks
            (wallBetween). Inside, the recipient must walk to meet him; the prompt "Hand over the parcel to <name>" is used; the delivery,
            stamp, thank-you and the recipient walking back to their spot (where they stood, or their post) are checked. Ticks used vs the time limit are recorded.
  cancel    DROP THE JOB button, Red lands a punch on a townsperson, a townsperson lands a hit on Red, travelling to the coliseum,
            and accepting in the coliseum: each cancels cleanly (no job, no chip text, recipient back home, parcel on the ground).
  late      a delivery after the limit is thanked without a stamp.
  card      10 on-time stamps fill a card (stamps reset, cards +1); the card survives a page reload.
  errors    no HIT_* module errors, no page errors."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json'); ROUNDS = int(arg('--rounds', 2))
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})()" % SEED)

HELP = r'''window.__C=HIT_COURIER; window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;H0.ax=H0.az=0;};
window.__find=(id)=>crowd.find(n=>n._rec&&n._rec.id===id);
window.__tall=(x,z)=>WORLD.solids.some(s=>s.h>1&&Math.max(s.x1-s.x0,s.z1-s.z0)>=2&&x>s.x0+.02&&x<s.x1-.02&&z>s.z0+.02&&z<s.z1-.02);
window.__bakery=()=>{__C.reset(); for(const n of crowd)if(n._rec){n.prov=0} lockT=null; __at(12,88.35); S[0].fx=0;S[0].fz=1; __T(3); __at(12,88.35); S[0].fx=0;S[0].fz=1;};
window.__walk=(pts,maxT)=>{const a=S[0];let i=0,t=0,cross=0,inside=0,stuck=0,px=a.x,pz=a.z,best=1e9,bt=0;
  for(;t<(maxT||9000)&&i<pts.length;t++){const p=pts[i],dx=p[0]-a.x,dz=p[1]-a.z,d=Math.hypot(dx,dz);if(d<.4){i++;best=1e9;continue}
    if(d<best-.05){best=d;bt=t} else if(t-bt>240){stuck++;bt=t;best=1e9;H0.ax=-dz/d;H0.az=-dx/d;__T(12)}
    cam.yaw=0;H0.ax=dx/d;H0.az=-dz/d;tick();
    if(typeof wallBetween==='function'&&wallBetween(px,pz,a.x,a.z))cross++; if(__tall(a.x,a.z))inside++; px=a.x;pz=a.z}
  H0.ax=H0.az=0;__T(4);return{reached:i>=pts.length,ticks:t,cross:cross,inside:inside,stuck:stuck,x:+a.x.toFixed(2),z:+a.z.toFixed(2)}};
window.__take=(id)=>{__bakery(); _updateNear(); const o={prompt:_near&&_near.label}; __C.offer(id); _doInteract(); o.panel=__C.panel;
  const b=document.querySelector('#cou-box button[data-act="accept"]'); o.btn=!!b; if(b)b.click(); o.job=!!__C.job; o.dest=__C.job&&__C.job.dest.id; o.limit=__C.job&&__C.job.limit; o.len=__C.job&&+__C.job.len.toFixed(1); return o};
0'''

async def main():
    out = {'seed': SEED, 'deliveries': [], 'cancels': {}, 'late': None, 'card': None, 'errors': [], 'moduleErrors': {}}
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await pg.wait_for_function('window.HIT_COURIER&&window.HIT_LIFE', timeout=20000)
        await pg.wait_for_timeout(1500); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP)
        await pg.evaluate("()=>{__C.setCard({});__T(60)}")
        dests = await pg.evaluate("()=>__C.DEST.map(d=>d.id)")
        # ---------- deliveries: every destination, walked with the joystick ----------
        for rnd in range(ROUNDS):
            for d in dests:
                r = await pg.evaluate('''(id)=>{const o=__take(id); if(!o.job)return o; const J=__C.job, D=J.dest, a=S[0];
                  const rt=__C.route(a.x,a.z,D.meet.x,D.meet.z); o.routePts=rt?rt.pts.length:0; if(!rt)return o;
                  const st0=__C.card().stamps, cards0=__C.card().cards; o.who=D.name;
                  o.walk=__walk(rt.pts); o.inRoom=HIT_LIFE.insideId()===D.room; o.phase=J.phase;
                  let w=0; while(!__C.canHand()&&w<600){tick();w++} o.meetTicks=w; if(!__C.canHand()){const m=__find(D.who); if(m){const t=J.walk&&J.walk.stay&&D.desk?D.desk:{x:m.x,z:m.z}, r2=__C.route(a.x,a.z,t.x,t.z,5,.15,true,.2); o.walk2=__walk(r2.partial||t===D.desk?r2.pts.concat([[t.x,t.z]]):r2.pts.slice(0,-1)); o.walk.cross+=o.walk2.cross; o.walk.inside+=o.walk2.inside; let w2=0; while(!__C.canHand()&&w2<300){tick();w2++} o.meetTicks+=w2}} o.canHand=__C.canHand();
                  const nn=__find(D.who), hm=J.walk&&J.walk.from; o.stay=J.walk&&J.walk.stay; o.recipDist=nn?+Math.hypot(nn.x-a.x,nn.z-a.z).toFixed(2):null; o.recipFromDoor=nn?+Math.hypot(nn.x-D.meet.x,nn.z-D.meet.z).toFixed(2):null;
                  _updateNear(); o.handPrompt=_near&&_near.label; draw(); o.chip=(document.getElementById('cou-chip')||{}).textContent||null;
                  o.used=tk-J.t0; _doInteract(); o.last=__C.last; o.stamp=__C.card().stamps-st0+(__C.card().cards-cards0)*10;
                  __T(40); o.thx=!!(nn&&nn._cThx); o.faces=nn?+((nn.fx*(a.x-nn.x)+nn.fz*(a.z-nn.z))/(Math.hypot(a.x-nn.x,a.z-nn.z)||1)).toFixed(2):null;
                  __T(300); o.jobAfter=!!__C.job; __T(1200); const post=nn&&nn._rec._cHome; o.home=nn&&hm?+Math.min(Math.hypot(nn.x-hm[0],nn.z-hm[1]),post?Math.hypot(nn.x-post[0],nn.z-post[1]):1e9).toFixed(2):null; return o}''', d)
                r['round'] = rnd
                r['ok'] = bool(r.get('prompt') == 'Baker: courier job' and r.get('panel') == 'offer' and r.get('job') and r.get('walk', {}).get('reached')
                               and r['walk']['cross'] == 0 and r['walk']['inside'] == 0 and r.get('inRoom') and r.get('canHand')
                               and r.get('handPrompt') == 'Hand over the parcel to ' + str(r.get('who')) and str(r.get('last', {}) and r['last'].get('dest')) == d and not r['last']['late'] and r.get('stamp') == 1
                               and r.get('thx') and r.get('faces', 0) > .7 and not r.get('jobAfter') and r.get('home') is not None and r['home'] < 1.0)
                out['deliveries'].append(r)
                print(d, rnd, 'OK' if r['ok'] else 'FAIL', r.get('walk'), r.get('used'), '/', r.get('limit'), r.get('meetTicks'), r.get('home'), flush=True)
        # ---------- cancels ----------
        C = out['cancels']
        C['drop'] = await pg.evaluate('''()=>{const o=__take('nf_n3'); __T(30); o.panelBtn=!!document.getElementById('cou-btn'); document.getElementById('cou-btn').click(); const b=document.querySelector('#cou-box button[data-act="drop"]'); o.btn=!!b; if(b)b.click(); __T(5);
            o.after=!!__C.job; o.why=(__C.log.filter(e=>e.ev==='cancel').pop()||{}).why; o.dropped=!!__C.dropped; o.ok=o.job&&o.btn&&!o.after&&o.why==='drop'&&o.dropped; return o}''')
        C['punch'] = await pg.evaluate('''()=>{const o=__take('nf_n2'); __T(10); const a=S[0]; let v=__find('b1'); if(!v){const r=HIT_LIFE.actors.find(r=>r.id==='b1'); __at(r.x,r.z+1.5); __T(25); v=__find('b1')}
            o.victim=v&&v._rec.tag; const vx0=v.x,vz0=v.z, hold=(n)=>{for(let i=0;i<n;i++){tick();v.x=vx0;v.z=vz0;v.vx=v.vz=0;v.fx=-1;v.fz=0}}; __at(vx0-.8,vz0); a.fx=1;a.fz=0; const hp0=v.hp; for(let k=0;k<8&&v.hp>=hp0-1e-6;k++){ for(let w=0;w<200&&!(a.st==='idle'||a.st==='walk');w++)hold(1); __at(vx0-.8,vz0); a.fx=1;a.fz=0; press('p',1);hold(3);press('p',0);hold(22)}
            o.hit=v.hp<hp0-1e-6; o.after=!!__C.job; o.why=(__C.log.filter(e=>e.ev==='cancel').pop()||{}).why; v.prov=0; lockT=null; if(window.HIT_POLICE)HIT_POLICE.reset(); __T(60); o.ok=o.job&&o.hit&&!o.after&&o.why==='fight'; return o}''')
        C['takeHit'] = await pg.evaluate('''()=>{const o=__take('nf_s4'); __T(10); const a=S[0]; let v=__find('b1'); if(!v){const r=HIT_LIFE.actors.find(r=>r.id==='b1'); __at(r.x,r.z+1.5); __T(25); v=__find('b1')}
            o.attacker=v&&v._rec.tag; __at(v.x-1.0,v.z); a.fx=1;a.fz=0; v.prov=1; S[1]=v; const hp0=a.hp; let w=0; for(;w<1500&&a.hp>=hp0-1e-6&&__C.job;w++){tick(); if(Math.hypot(v.x-a.x,v.z-a.z)>1.4)__at(v.x-1.0,v.z)}
            o.ticks=w; o.redHit=a.hp<hp0-1e-6; o.after=!!__C.job; o.why=(__C.log.filter(e=>e.ev==='cancel').pop()||{}).why; v.prov=0; lockT=null; if(window.HIT_POLICE)HIT_POLICE.reset(); __T(60); o.ok=o.job&&o.redHit&&!o.after&&o.why==='fight'; return o}''')
        C['coliseum'] = await pg.evaluate('''()=>{const o=__take('townhall'); __T(10); HIT_TRAVEL.jump('sky'); __T(10); o.sky=HIT_SKY.on; o.after=!!__C.job; o.why=(__C.log.filter(e=>e.ev==='cancel').pop()||{}).why;
            const r=__C.accept('inn'); o.acceptInSky=r&&r.code; __C.open(); o.panelInSky=!!document.getElementById('cou-pan'); HIT_TRAVEL.jump('town'); __T(30); o.back=!HIT_SKY.on;
            o.ok=o.job&&o.sky&&!o.after&&o.why==='area'&&o.acceptInSky==='area'&&!o.panelInSky&&o.back; return o}''')
        C['meetThenCancel'] = await pg.evaluate('''()=>{let o=null; for(const id of ['nf_s2','nf_n4','nf_n2','nf_s4']){ o=__take(id); const J=__C.job,D=J.dest,a=S[0];
            const rt=__C.route(a.x,a.z,D.meet.x,D.meet.z); o.walk=__walk(rt.pts); __T(150); const n=__find(D.who),hm=__C.job.walk.from; o.phase=__C.job&&__C.job.phase; o.moved=+Math.hypot(n.x-hm[0],n.z-hm[1]).toFixed(2); o.stay=__C.job.walk.stay; __C.cancel('drop'); __T(1500);
            o.home=+Math.hypot(n.x-hm[0],n.z-hm[1]).toFixed(2); o.ok=o.phase==='meet'&&o.moved>.5&&o.home<1.0&&!__C.job; if(!o.stay)break} return o}''')
        out['late'] = await pg.evaluate('''()=>{const o=__take('nf_s4'); const J=__C.job,D=J.dest,a=S[0]; J.t0-=J.limit+60; const st0=__C.card().stamps,c0=__C.card().cards; __T(5); draw(); o.chip=(document.getElementById('cou-chip')||{}).textContent;
            const rt=__C.route(a.x,a.z,D.meet.x,D.meet.z); o.walk=__walk(rt.pts); let w=0; while(!__C.canHand()&&w<900){tick();w++} _updateNear(); _doInteract(); o.last=__C.last; o.stamp=__C.card().stamps-st0+(__C.card().cards-c0)*10; __T(1600);
            o.ok=!!(o.last&&o.last.late&&o.stamp===0&&/LATE/.test(o.chip||'')); return o}''')
        out['card'] = await pg.evaluate('''()=>{__C.setCard({stamps:9,cards:0,done:20,late:0}); const o=__take('nf_s4'); const J=__C.job,D=J.dest,a=S[0]; const rt=__C.route(a.x,a.z,D.meet.x,D.meet.z); __walk(rt.pts); let w=0; while(!__C.canHand()&&w<900){tick();w++} _updateNear(); _doInteract(); __T(1600);
            o.card=__C.card(); o.ok=o.card.stamps===0&&o.card.cards===1; return o}''')
        await pg.reload(); await pg.wait_for_function('window.HIT_COURIER', timeout=20000); await pg.wait_for_timeout(800)
        out['card']['afterReload'] = await pg.evaluate("()=>HIT_COURIER.card()"); out['card']['ok'] = out['card']['ok'] and out['card']['afterReload']['cards'] == 1
        out['moduleErrors'] = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error);return m}")
        await b.close()
    dv = out['deliveries']
    out['summary'] = {'deliveries': len(dv), 'ok': sum(1 for r in dv if r['ok']), 'wallCrossTicks': sum(r.get('walk', {}).get('cross', 0) for r in dv), 'insideSolidTicks': sum(r.get('walk', {}).get('inside', 0) for r in dv),
                      'onTime': sum(1 for r in dv if r.get('last') and not r['last'].get('late')), 'worstUsedVsLimit': max((r['used'] / r['limit'] for r in dv if r.get('used')), default=None),
                      'cancels': {k: v['ok'] for k, v in out['cancels'].items()}, 'late': out['late']['ok'], 'card': out['card']['ok'], 'errors': len(out['errors']), 'moduleErrors': out['moduleErrors']}
    out['pass'] = bool(out['summary']['ok'] == len(dv) and all(out['summary']['cancels'].values()) and out['late']['ok'] and out['card']['ok'] and not out['errors'] and not out['moduleErrors'])
    print(json.dumps(out['summary'], indent=1)); print('PASS' if out['pass'] else 'FAIL')
    if OUT: json.dump(out, open(OUT, 'w'), indent=1)
asyncio.run(main())
