"""Mayors' town requests test (Step 18 gate).  Usage:
  python3 -I dw2/tools/mayor.py <build.html> [--seed 7] [--json out.json]
Seeds Math.random, stops the render loop and steps the game's own tick(). A test clock (Date.now + window.__dt, kept in sessionStorage
across the reload) moves the calendar on a day at a time, so each mayor can post a new request. HIT_MAYOR.force(who, kind) only picks
which kind is posted that day (the request itself and everything after it is the real game). Every request is taken and handed in through
INTERACT at the mayor and the panel's DOM buttons, and completed only through the real activity paths:
  courier  baker INTERACT + TAKE THE PARCEL, Red walks the joystick route to the house, hands over (on time)
  fish     INTERACT at the farm pond rod rest, cast/strike/reel with the fishing input, until the asked species is landed
  swim     INTERACT at the beach board, swim buoys 1-5 + gate with the joystick
  kite     the kite is bought through the real 'shop' debit; INTERACT FLY on the Highlands, KITE button held/released to climb
  crop     seed packets bought at the honesty box panel, sown, the can filled at the pond, watered, grown, harvested by INTERACT,
           then given with INTERACT "Give a gift" + the gift bag's button
  dish     eggs from the honesty box, an omelette cooked at a home stove (INTERACT, COOK, SEAR/SERVE taps), given the same way
Checks:
  prompts   both mayors prompt inside their hall; none outside the door, behind the back wall, or across the room
  kinds     all 6 kinds completed and handed in, a ribbon each, board counts match
  before    a catch made before taking the fish request does not count; wrong species / non-perfect dish / slow swim do not count
  refuse    not_done, wrong (other hall), handed (second take same day), active (take twice), expired (next day), area (coliseum)
  expiry    after midnight, progress no longer counts and hand-in is refused 'expired', the request is cleared
  reload    ribbons, the board and a held request survive a reload; the wall board draws in both halls
  ledger    no coins earned: no credits at all, debits = shop buys only, eco.audit() ok
  errors    no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const n0=Date.now.bind(Date);window.__dt=+(sessionStorage.getItem('__dt')||0);Date.now=()=>n0()+window.__dt})()" % SEED)
DAY = 86400000
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__stick=(x,z)=>{H0.ax=x;H0.az=z};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;a._cl=null;H0.ax=H0.az=0;};
window.__M=HIT_MAYOR;
window.__near=()=>{HIT_SHOP.close();HIT_GARDEN.close();_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__act=(x,z)=>{__at(x,z);__T(2);__at(x,z);const n=__near();_doInteract();return n};
window.__st=()=>{const e=HIT_DC.eco,s=e.summary(),h=e.history(1e6);return{avail:s.available,n:s.count,debits:h.filter(x=>x.t==='d').length,
  shopDebits:h.filter(x=>x.t==='d'&&x.src==='shop').length,debitSum:h.filter(x=>x.t==='d').reduce((t,x)=>t+x.amt,0),credits:h.filter(x=>x.t!=='d').length,audit:e.audit()}};
window.__HALL={hale:[104,20.6],ines:[0,110.9]};
window.__toMayor=(who)=>{__M.close();const[x,z]=__HALL[who];__at(x,z);S[0].fx=0;S[0].fz=1;__T(20);__at(x,z);S[0].fx=0;S[0].fz=1;__T(2);return __near()};
window.__openMayor=(who)=>{const n=__toMayor(who);_doInteract();return{prompt:n&&n.label,act:n&&n.act,panel:__M.panel,btns:__M.shown()}};
window.__lastRefuse=()=>{const r=__M.log.filter(e=>e.ev==='refuse').pop();return r&&r.code};
window.__takeVia=(who)=>{const o=__openMayor(who);o.click=__M.click('take');o.kind=(__M.state().act[who]||{}).kind;o.refused=o.click?null:__lastRefuse();__M.close();return o};
window.__handVia=(who)=>{const o=__openMayor(who);const n0=__M.state().ribbons.length,r0=__M.log.length;o.click=__M.click('hand');o.ribbons=__M.state().ribbons.length-n0;
  const rf=__M.log.slice(r0).filter(e=>e.ev==='refuse').pop();o.refused=rf&&rf.code;o.board=__M.boardShown();__M.close();return o};
window.__done=(who)=>{const a=__M.state().act[who];return a?{done:a.done,how:a.how||null,best:a.best==null?null:a.best,prog:a.prog}:null};
/* courier (from courier.py) */
window.__C=HIT_COURIER;
window.__tall=(x,z)=>WORLD.solids.some(s=>s.h>1&&Math.max(s.x1-s.x0,s.z1-s.z0)>=2&&x>s.x0+.02&&x<s.x1-.02&&z>s.z0+.02&&z<s.z1-.02);
window.__bakery=()=>{__C.reset(); for(const n of crowd)if(n._rec){n.prov=0} __at(12,88.35); S[0].fx=0;S[0].fz=1; __T(3); __at(12,88.35); S[0].fx=0;S[0].fz=1;};
window.__walk=(pts,maxT)=>{const a=S[0];let i=0,t=0,cross=0,inside=0,stuck=0,px=a.x,pz=a.z,best=1e9,bt=0;
  for(;t<(maxT||9000)&&i<pts.length;t++){const p=pts[i],dx=p[0]-a.x,dz=p[1]-a.z,d=Math.hypot(dx,dz);if(d<.4){i++;best=1e9;continue}
    if(d<best-.05){best=d;bt=t} else if(t-bt>240){stuck++;bt=t;best=1e9;H0.ax=-dz/d;H0.az=-dx/d;__T(12)}
    cam.yaw=0;H0.ax=dx/d;H0.az=-dz/d;tick();
    if(typeof wallBetween==='function'&&wallBetween(px,pz,a.x,a.z))cross++; if(__tall(a.x,a.z))inside++; px=a.x;pz=a.z}
  H0.ax=H0.az=0;__T(4);return{reached:i>=pts.length,ticks:t,cross:cross,inside:inside,stuck:stuck}};
/* fishing (from fish.py, the 'good' player) */
window.__fishOnce=(id)=>{const FI=HIT_FISH,F=FI.F,a=S[0],sp=FI.spots.find(s=>s.id===id),I=FI.input,res={out:'?'};
  if(F.st!=='off')FI.stop();H0.ax=0;H0.az=0;a.x=sp.x;a.z=sp.z;a.vx=a.vz=0;a._tgx=a.x;a._tgz=a.z;__T(20);a.x=sp.x;a.z=sp.z;a.vx=a.vz=0;
  _updateNear();if(!_near||_near.act!=='fishspot'){res.out='noPrompt';return res}_doInteract();
  I.down();__T(40+Math.floor(Math.random()*80));I.up();__T(1);let g=0;while(F.st==='charge'||F.st==='fly'){__T(1);if(++g>400)break}
  g=0;while(F.st==='wait'){__T(1);if(++g>3000)break} if(F.st!=='bite'){res.out='noBite:'+F.st;return res}
  __T(10+Math.floor(Math.random()*6));I.down();__T(1);I.up();__T(1);if(F.st!=='reel'){res.out='noHook';return res}
  g=0;while(F.st==='reel'&&g<6000){g++;const want=!F.pull&&F.ten<.6;if(want&&!F.held)I.down();if(!want&&F.held)I.up();__T(1)}I.up();
  if(F.st==='done'){res.out='caught';res.sp=F.card.f.id;__T(25);I.down();__T(1);I.up();__T(1)}else res.out=F.st;FI.stop&&FI.stop();__T(2);return res};
window.__fishUntil=(id,sp,max)=>{const o={casts:0,caught:[],got:false};for(let i=0;i<(max||80)&&!o.got;i++){const r=__fishOnce(id);o.casts++;if(r.out==='caught'){o.caught.push(r.sp);if(r.sp===sp)o.got=true}}return o};
/* swimming (from swim.py) */
window.__steer=(x,z,wob)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;if(wob){const c=Math.cos(wob),s=Math.sin(wob);[dx,dz]=[dx*c-dz*s,dx*s+dz*c]}cam.yaw=0;__stick(dx,-dz);tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__swim=()=>{const SW=HIT_SWIM,C=SW.cfg,a=S[0],o={};const c=C.spot,x=c.x,z=c.z;__at(x,z-1.5);__T(30);
  for(let i=0;i<400;i++){const dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);if(d<.35)break;cam.yaw=0;__stick(dx/d,-dz/d);tick()}__stick(0,0);__T(10);
  const n=__near();o.label=n&&n.label;_doInteract();let k=0;while(SW.st()==='count'&&k<400){__stick(0,0);tick();k++}
  const plan=['b0','b1','b2','b3','b4','gate'];const tgt=(p)=>p==='gate'?[(C.gate.x0+C.gate.x1)/2,C.gate.z-1.6]:C.buoys[+p.slice(1)];
  for(const p of plan){const t=tgt(p);const legs=p==='gate'?[[t[0],C.gate.z+2.2],[t[0],t[1]]]:[t];
    for(const L of legs){for(let i=0;i<4000&&SW.st()==='run';i++){const d=__steer(L[0],L[1],0);if(d<(p==='gate'?.4:.9))break}}if(SW.st()!=='run')break}
  __stick(0,0);o.res=SW.R.res&&{ok:SW.R.res.ok,s:+(SW.R.res.t/60).toFixed(2)};__T(400);return o};
/* kite (from kite.py) */
window.__down=()=>HIT_KITE.input.down();window.__up=()=>HIT_KITE.input.up();
window.__tk=(n,f)=>{for(let i=0;i<n;i++){if(f)f(i);tick()}};
window.__pulse=(n,stop)=>{const K=HIT_KITE.K;let held=true,mx=0;__tk(n,()=>{if(K.st!=='fly')return;if(stop&&stop())return;if(held&&K.slack<=0&&K.b>.6)held=false;else if(!held&&K.slack>1.3)held=true;held?__down():__up();if(K.y>mx)mx=K.y});__up();return mx};
/* cooking (from cook.py) */
window.__K=HIT_COOK;
window.__tick=(n)=>{for(let i=0;i<n;i++){tick();__K.watch()}};
window.__stove=(i)=>{__K.close();const s=__K.STOVES[i];__at(s.x,s.z);S[0].fx=s.tx-s.x;S[0].fz=s.tz-s.z;const l=Math.hypot(S[0].fx,S[0].fz)||1;S[0].fx/=l;S[0].fz/=l;__T(3);__at(s.x,s.z);return __near()};
window.__tapAt=(h)=>{let w=0;while(__K.cook&&__K.heat()<h&&w<600){__tick(1);w++}const b=document.getElementById('cook-tap');if(!b)return{ok:false,w};b.click();return{ok:true,w}};
window.__cook=(i,rid,plan)=>{const n=__stove(i);_doInteract();const o={prompt:n&&n.label,panel:!!__K.panel};const b=document.querySelector('#cook-box button[data-recipe="'+rid+'"]');o.btn=!!b;if(b)b.click();
  const R=__K.RECIPES.find(r=>r.id===rid);for(let ph=0;ph<2;ph++){const g=R.gold[ph],t=plan[ph];__tapAt(t==='g'?g:t==='g+'?g+.12:t)}o.q=__K.last&&__K.last.q;o.pid=__K.last&&__K.last.pid;__K.close();return o};
/* giving: INTERACT "Give a gift" at the person, then the gift bag's GIVE button for that item */
window.__give=(tag,pid)=>{const rec=HIT_LIFE.actors.find(r=>r.tag===tag);const o={};__at(rec.x,rec.z+1.3);__T(45);const n=crowd.find(n=>n._rec===rec);if(!n){o.why='nobody';return o}
  for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){__at(n.x+dx*1.1,n.z+dz*1.1);if(!WORLD.solids.some(s=>S[0].x>s.x0&&S[0].x<s.x1&&S[0].z>s.z0&&S[0].z<s.z1)&&!wallBetween(S[0].x,S[0].z,n.x,n.z))break}
  S[0].fx=(n.x-S[0].x)/1.1;S[0].fz=(n.z-S[0].z)/1.1;o.prompt=__near().label;_doInteract();o.panel=HIT_SHOP.panel;
  const btn=document.querySelector('#shop-box button[data-pid="'+pid+'"]');o.btn=!!btn;if(btn)btn.click();o.line=HIT_SHOP.lastLine;o.item=n._gft&&n._gft.item;HIT_SHOP.close();__T(30);return o};
window.__bedSpot=(i)=>{const B=HIT_GARDEN.BEDS[i];return[B.x,B.z-B.hz-.4]};
window.__buyStand=async(id)=>{window.__dt+=61000;const c=HIT_LIFE.SPEC.stand.items.find(i=>/Honesty/.test(i[2]));__at(c[0],c[1]);__T(3);__at(c[0],c[1]);HIT_SHOP.close();_updateNear();_doInteract();
  let w=0;while(!HIT_SHOP.panel&&w<200){tick();w++}const btn=document.querySelector('#shop-box button[data-item="'+id+'"]');const ok=!!btn&&!btn.disabled;if(btn)btn.click();
  for(let i=0;i<40&&HIT_SHOP.busy;i++)await new Promise(r=>setTimeout(r,25));HIT_SHOP.close();__T(30);return ok&&HIT_DC.eco.history(1)[0].meta.item===id};
window.__drawErr=()=>{try{draw();return null}catch(e){return String(e)}};0'''

async def boot(pg):
    await pg.wait_for_function('window.HIT_DC&&HIT_DC.eco&&HIT_DC.eco.summary().count>0&&window.HIT_SHOP&&window.HIT_MAYOR&&window.HIT_COOK&&HIT_COOK.STOVES.length', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)
    await pg.evaluate("()=>{for(let i=0;i<150;i++)tick()}")

async def main():
    out = {'seed': SEED, 'checks': {}, 'errors': [], 'trace': {}}
    C = out['checks']; T = out['trace']
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 430, 'height': 932}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await boot(pg)
        start = await pg.evaluate("()=>__st()")
        day = lambda: pg.evaluate("()=>{window.__dt+=%d;sessionStorage.setItem('__dt',String(window.__dt));return HIT_MAYOR.today()}" % DAY)
        # ---------- prompts ----------
        C['prompts'] = await pg.evaluate('''()=>{const o={};o.hale=__toMayor('hale');o.ines=__toMayor('ines');
            const no=(x,z)=>{__M.close();__at(x,z);__T(10);__at(x,z);const n=__near();return n&&n.act==='townreq'?n.label:null};
            o.outsideDoor=no(104,15.2);o.behindWall=no(104,24.4);o.acrossRoom=no(99.2,16.8);o.nfOutside=no(0,105.9);o.nfBehind=no(0,113.6);
            o.ok=o.hale&&o.hale.act==='townreq'&&o.ines&&o.ines.act==='townreq'&&!o.outsideDoor&&!o.behindWall&&!o.acrossRoom&&!o.nfOutside&&!o.nfBehind;return o}''')
        # ================= DAY 1: Hale courier, Ines fish =================
        d1 = await pg.evaluate("()=>{__M.force('hale','courier');__M.force('ines','fish',{spot:'pond',sp:'crucian'});return __M.today()}")
        t = {}
        t['take'] = await pg.evaluate("()=>__takeVia('hale')")
        t['takeTwice'] = await pg.evaluate("()=>{const r=__M.take('hale');return r.code}")
        t['notDone'] = await pg.evaluate("()=>__handVia('hale')")
        t['inesPanelNoHand'] = await pg.evaluate("()=>{const o=__openMayor('ines');__M.close();return o.btns}")
        t['wrong'] = await pg.evaluate("()=>{__toMayor('ines');return __M.handIn('ines').code}")
        t['deliver'] = await pg.evaluate('''()=>{__bakery();_updateNear();__C.offer('nf_s4');_doInteract();const b=document.querySelector('#cou-box button[data-act="accept"]');if(b)b.click();
            const J=__C.job,D=J.dest,a=S[0];const rt=__C.route(a.x,a.z,D.meet.x,D.meet.z);const w=__walk(rt.pts);let k=0;while(!__C.canHand()&&k<900){tick();k++}_updateNear();_doInteract();__T(5);
            return{walk:w,last:__C.last,state:__done('hale')}}''')
        t['handIn'] = await pg.evaluate("()=>__handVia('hale')")
        t['handedAgain'] = await pg.evaluate("()=>{__toMayor('hale');return __M.take('hale').code}")
        T['courier'] = t
        C['courier'] = {'ok': t['take']['click'] and t['take']['kind'] == 'courier' and t['takeTwice'] == 'active' and t['notDone']['refused'] == 'not_done' and t['notDone']['ribbons'] == 0
                        and 'hand' not in t['inesPanelNoHand'] and t['wrong'] == 'wrong' and t['deliver']['walk']['cross'] == 0 and t['deliver']['last'] and not t['deliver']['last']['late']
                        and t['deliver']['state']['done'] and t['handIn']['ribbons'] == 1 and t['handIn']['board'] and t['handedAgain'] == 'handed'}
        t = {}
        t['before'] = await pg.evaluate("()=>{const r=__fishUntil('pond','crucian',30);return r}")
        t['take'] = await pg.evaluate("()=>__takeVia('ines')")
        t['afterTake'] = await pg.evaluate("()=>__done('ines')")
        t['fish'] = await pg.evaluate("()=>{const r=__fishUntil('pond','crucian',80);r.state=__done('ines');return r}")
        t['handIn'] = await pg.evaluate("()=>__handVia('ines')")
        T['fish'] = t
        wrongCatches = sum(1 for s in t['fish']['caught'] if s != 'crucian')
        C['fish'] = {'casts': t['fish']['casts'], 'caught': t['fish']['caught'], 'ok': t['before']['got'] and t['afterTake'] and not t['afterTake']['done'] and t['fish']['got']
                     and t['fish']['state']['done'] and t['fish']['state']['prog'] == wrongCatches and t['handIn']['ribbons'] == 1}
        # ================= DAY 2: Hale swim, Ines kite =================
        d2 = await day()
        await pg.evaluate("()=>{__M.force('hale','swim',{t:75});__M.force('ines','kite',{h:15})}")
        t = {}
        t['postedNew'] = await pg.evaluate("()=>{const o=__openMayor('hale');__M.close();return o.btns}")
        t['take'] = await pg.evaluate("()=>__takeVia('hale')")
        t['swim'] = await pg.evaluate("()=>{const r=__swim();r.state=__done('hale');return r}")
        t['handIn'] = await pg.evaluate("()=>__handVia('hale')")
        T['swim'] = t
        C['swim'] = {'time': t['swim']['res'], 'ok': 'take' in t['postedNew'] and t['take']['kind'] == 'swim' and t['swim']['res'] and t['swim']['res']['ok'] and t['swim']['res']['s'] < 75
                     and t['swim']['state']['done'] and abs(t['swim']['state']['best'] - t['swim']['res']['s']) < .05 and t['handIn']['ribbons'] == 1}
        t = {}
        t['buy'] = await pg.evaluate('''async ()=>{window.__dt+=61000;const r=await HIT_SHOP.buy('kite','general');HIT_SHOP.close();return{ok:r.ok,code:r.code,owned:HIT_KITE.owned(true)}}''')
        t['take'] = await pg.evaluate("()=>__takeVia('ines')")
        t['fly'] = await pg.evaluate('''()=>{__at(52,106);__T(30);const n=__near();_doInteract();const o={label:n&&n.label,st:HIT_KITE.st()};
            o.mx=+__pulse(5400,()=>__M.state().act.ines.done).toFixed(1);o.state=__done('ines');o.y=+HIT_KITE.K.y.toFixed(1);__up();if(HIT_KITE.st()!=='off')HIT_KITE.pack('test');__T(5);return o}''')
        t['handIn'] = await pg.evaluate("()=>__handVia('ines')")
        T['kite'] = t
        C['kite'] = {'ok': t['buy']['ok'] and t['take']['kind'] == 'kite' and t['fly']['st'] == 'fly' and t['fly']['state']['done'] and t['fly']['state']['best'] > 15
                     and t['handIn']['ribbons'] == 1, 'height': t['fly']['state']}
        # ================= DAY 3: Ines crop, Hale dish =================
        d3 = await day()
        await pg.evaluate("()=>{__M.force('hale','dish',{to:'Farmer'});__M.force('ines','crop',{to:'Farmer',crop:'tomatoes'})}")
        t = {}
        t['takeI'] = await pg.evaluate("()=>__takeVia('ines')")
        t['takeH'] = await pg.evaluate("()=>__takeVia('hale')")
        t['bothChip'] = await pg.evaluate("()=>__M.chipText()")
        buys = []
        for it in ['seed_tomato', 'seed_tomato', 'seed_tomato', 'eggs', 'eggs']:
            buys.append(await pg.evaluate("(id)=>__buyStand(id)", it))
        t['buys'] = buys
        t['grow'] = await pg.evaluate('''()=>{const o={};for(let i=0;i<3;i++)o['sow'+i]=HIT_GARDEN.plant(i,'seed_tomato').ok;const P=HIT_GARDEN.POST;
            const water=()=>{__act(P.x,P.z-.7);__act(-25.8,-80.0);for(let i=0;i<3;i++){const[x,z]=__bedSpot(i);__act(x,z);__T(60)}};
            if(!HIT_GARDEN.can.held)__act(P.x,P.z-.7);__act(-25.8,-80.0);for(let i=0;i<3;i++){const[x,z]=__bedSpot(i);__act(x,z);__T(60)}
            window.__dt+=110000;__act(-25.8,-80.0);for(let i=0;i<3;i++){const[x,z]=__bedSpot(i);__act(x,z);__T(60)}window.__dt+=80000;
            o.stages=HIT_GARDEN.beds().slice(0,3).map(b=>b.stage);if(HIT_GARDEN.can.held)HIT_GARDEN.hang();for(let i=0;i<3;i++){const[x,z]=__bedSpot(i);o['h'+i]=(__act(x,z)||{}).label}
            HIT_SHOP.rebag();o.toms=HIT_SHOP.bag.filter(b=>b.item==='tomatoes').map(b=>b.pid);sessionStorage.setItem('__dt',String(window.__dt));return o}''')
        toms = t['grow']['toms']
        t['goodDish'] = await pg.evaluate("()=>__cook(0,'omelette',['g','g+'])")
        t['perfectDish'] = await pg.evaluate("()=>__cook(2,'omelette',['g','g'])")
        t['giveGood'] = await pg.evaluate("(pid)=>{const r=__give('Farmer',pid);r.state=__done('hale');return r}", t['goodDish']['pid'])
        t['givePerfect'] = await pg.evaluate("(pid)=>{const r=__give('Farmer',pid);r.state=__done('hale');return r}", t['perfectDish']['pid'])
        HIT = await pg.evaluate("()=>{HIT_SHOP.rebag();return HIT_SHOP.bag.filter(b=>b.item==='tomatoes').map(b=>b.pid)}")
        t['giveCrop'] = await pg.evaluate("(pid)=>{const r=__give('Farmer',pid);r.state=__done('ines');return r}", HIT[0] if HIT else None)
        t['handH'] = await pg.evaluate("()=>__handVia('hale')")
        t['handI'] = await pg.evaluate("()=>__handVia('ines')")
        T['dish_crop'] = t
        C['dish'] = {'ok': t['takeH']['kind'] == 'dish' and t['goodDish']['q'] in ('good', 'rushed', 'overdone') and t['perfectDish']['q'] == 'perfect' and t['giveGood']['btn'] and not t['giveGood']['state']['done']
                     and t['giveGood']['state']['prog'] == 1 and t['givePerfect']['btn'] and t['givePerfect']['state']['done'] and t['handH']['ribbons'] == 1}
        C['crop'] = {'ok': t['takeI']['kind'] == 'crop' and all(buys) and len(toms) == 3 and t['giveCrop'].get('btn') and t['giveCrop']['state']['done'] and t['handI']['ribbons'] == 1
                     and 'HALE' in t['bothChip'] and 'INES' in t['bothChip']}
        # ================= DAY 4 -> 5: expiry, slow swim, coliseum =================
        d4 = await day()
        await pg.evaluate("()=>{__M.force('hale','swim',{t:20});__M.force('ines','fish',{spot:'pond',sp:'crucian'})}")
        t = {}
        t['take'] = [await pg.evaluate("()=>__takeVia('hale')"), await pg.evaluate("()=>__takeVia('ines')")]
        t['slow'] = await pg.evaluate("()=>{const r=__swim();r.state=__done('hale');return r}")
        t['area'] = await pg.evaluate('''async ()=>{HIT_TRAVEL.jump('sky');await new Promise(r=>setTimeout(r,700));__T(5);const o={sky:HIT_SKY.on,take:__M.take('hale').code,hand:__M.handIn('ines').code};
            await new Promise(r=>setTimeout(r,400));o.chip=document.getElementById('myr-chip').style.display;HIT_TRAVEL.jump('town');await new Promise(r=>setTimeout(r,700));__T(30);o.back=!HIT_SKY.on;return o}''')
        d5 = await day()
        t['lateFish'] = await pg.evaluate("()=>{const r=__fishUntil('pond','crucian',60);r.state=__done('ines');return r}")
        t['chipExpired'] = await pg.evaluate("()=>__M.chipText()")
        t['expH'] = await pg.evaluate("()=>{const r=__handVia('hale');r.after=!!__M.state().act.hale;return r}")
        t['expI'] = await pg.evaluate("()=>{const r=__handVia('ines');r.after=!!__M.state().act.ines;return r}")
        t['takeNew'] = await pg.evaluate("()=>{__M.force('hale','kite',{h:18});return __takeVia('hale')}")
        T['expiry'] = t
        C['slow'] = {'ok': t['slow']['res']['ok'] and t['slow']['res']['s'] > 20 and not t['slow']['state']['done'] and t['slow']['state']['best'] is not None}
        C['area'] = {'ok': t['area']['sky'] and t['area']['take'] == 'area' and t['area']['hand'] == 'area' and t['area']['chip'] == 'none' and t['area']['back'], 'r': t['area']}
        C['expiry'] = {'ok': t['lateFish']['got'] and not t['lateFish']['state']['done'] and 'expired' in t['chipExpired'] and t['expH']['refused'] == 'expired' and not t['expH']['after']
                       and t['expI']['refused'] == 'expired' and not t['expI']['after'] and t['expH']['ribbons'] == 0 and t['takeNew']['kind'] == 'kite'}
        # ---------- board + ledger before reload ----------
        pre = await pg.evaluate('''()=>{const o={counts:__M.counts(),ribbons:__M.state().ribbons.length,act:Object.keys(__M.state().act)};
            __toMayor('hale');const b0=__M.boardDrawn||0;o.e1=__drawErr();o.d1=(__M.boardDrawn||0)-b0;__toMayor('ines');const b1=__M.boardDrawn||0;o.e2=__drawErr();o.d2=(__M.boardDrawn||0)-b1;
            __openMayor('hale');__M.click('board');o.boardShown=__M.boardShown();__M.close();return o}''')
        C['kinds'] = {'counts': pre['counts'], 'ok': all(pre['counts'][k] == 1 for k in ['dish', 'crop', 'fish', 'swim', 'courier', 'kite']) and pre['ribbons'] == 6}
        # ---------- reload ----------
        await pg.evaluate("()=>sessionStorage.setItem('__dt',String(window.__dt))")
        await pg.reload(); await boot(pg)
        post = await pg.evaluate('''()=>{const o={counts:__M.counts(),ribbons:__M.state().ribbons.length,act:Object.keys(__M.state().act),kind:(__M.state().act.hale||{}).kind,today:__M.today()};
            __toMayor('ines');const b1=__M.boardDrawn||0;o.e=__drawErr();o.d=(__M.boardDrawn||0)-b1;o.chip=__M.chipText();return o}''')
        C['reload'] = {'ok': post['ribbons'] == 6 and post['counts'] == pre['counts'] and post['act'] == ['hale'] and post['kind'] == 'kite' and pre['d1'] >= 1 and pre['d2'] >= 1 and post['d'] >= 1
                       and not pre['e1'] and not pre['e2'] and not post['e'] and pre['boardShown'] and 'Kite' in post['chip'], 'pre': pre, 'post': post}
        end = await pg.evaluate("()=>__st()")
        C['ledger'] = {'start': start, 'end': end, 'ok': end['credits'] == start['credits'] and end['debits'] - start['debits'] == end['shopDebits'] - start['shopDebits'] and end['audit']['ok']}
        out['days'] = [d1, d2, d3, d4, d5]
        out['moduleErrors'] = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        C['errors'] = {'ok': not out['errors'] and not out['moduleErrors'], 'page': out['errors'][:5], 'module': out['moduleErrors']}
        out['stats'] = await pg.evaluate("()=>HIT_MAYOR.stats")
        await b.close()
    out['pass'] = all(v.get('ok') for v in C.values())
    print(json.dumps({k: (v if k != 'trace' else '...') for k, v in out.items()}, indent=1, default=str)[:9000])
    print('PASS' if out['pass'] else 'FAIL', {k: bool(v.get('ok')) for k, v in C.items()})
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1, default=str))
asyncio.run(main())
