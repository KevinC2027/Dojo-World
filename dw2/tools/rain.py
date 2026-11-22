"""Rain showers test (Step 16 gate).  Usage:
  python3 -I dw2/tools/rain.py <build.html> [--seed 7] [--json out.json] [--q "?rain=1"]
Seeds Math.random and drives a test clock (Date.now = load time + offset, moved only by the test) by 1/60 s with every tick, so wall-clock weather and game ticks agree.
Stops the render loop and runs the game's own tick(); Red is parked at a spot. An independent observer wrapped round tick() watches
every townsperson the rain module steers (walking to / from a shelter) and checks each step: no wall between the last position and
this one (the engine's wallBetween), never inside a tall solid, never in a carriageway (HIT_W192.ROADS, 0.3 m in).
  schedule  for 3 Red spots, the next scheduled shower: dry until its start time, rain from it (to within 0.1 s), full intensity
            after the 25 s build-up, dry again at its end time; the 'raining' flag and toasts at start and end
  cover     70 s into the shower every townsperson outdoors (not fighting / swimming) is covered: under a shelter roof (bus shelter,
            pavilion, awning) or holding an open umbrella; sheltering walks: 0 wall crossings, 0 inside-solid, 0 carriageway steps
  after     90 s after the end nobody is still steered or holding an umbrella (none stuck); everyone who sheltered walked back to
            within 1 m of where they were; nobody is left standing on a shelter spot
  garden    the rain wets all four allotment beds (sown or not) within 2 s, and they stay wet 2 min after the shower, then dry
  fish      at the lake pier, the mean bite wait in rain is ~0.7x the dry wait (biteMul), back to 1 when dry
  board     the notice boards (street board, the inn) add a WEATHER line that matches the schedule
  coliseum  with the coliseum sky on, nothing rains and nobody is steered; draw() runs
  errors    draw() in rain at each spot, no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json'); Q = arg('--q', '')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};"
        "const b0=Date.now();window.__dt=0;Date.now=()=>b0+window.__dt})()" % SEED)   # the test clock moves only with ticks   # the test clock moves only with ticks
HELP = r'''window.__clock=()=>Date.now();
window.__T=(n,f)=>{for(let i=0;i<n;i++){window.__dt+=1000/60;tick();if(f)f(i)}};
window.__park=null;window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;H0.ax=H0.az=0;window.__park=[x,z]};
window.__setClock=(t)=>{window.__dt+=t-Date.now()};
const DR=HIT_W192.ROADS,inRoad=(x,z)=>DR.some(r=>x>r[0]+.3&&x<r[1]-.3&&z>r[2]+.3&&z<r[3]-.3);
const inSolid=(x,z)=>WORLD.solids.some(q=>q.h>1.5&&x>q.x0+.05&&x<q.x1-.05&&z>q.z0+.05&&z<q.z1-.05);
window.__O={steps:0,wall:0,solid:0,road:0,bad:[],seen:new Set()};
{const _t=tick;tick=function(){const prev=new Map();for(const n of crowd){const s=n&&n._rn;if(s&&(s.ph==='go'||s.ph==='back'))prev.set(n,[n.x,n.z])}
  if(window.__park){const a=S[0];a.x=__park[0];a.z=__park[1];a.vx=a.vz=0}
  const r=_t.apply(this,arguments);const O=__O;
  for(const [n,p] of prev){O.steps++;O.seen.add(n);const w=wallBetween(p[0],p[1],n.x,n.z),so=inSolid(n.x,n.z),rd=inRoad(n.x,n.z);if(w)O.wall++;if(so)O.solid++;if(rd)O.road++;
    if((w||so||rd)&&O.bad.length<10)O.bad.push({x:+n.x.toFixed(2),z:+n.z.toFixed(2),px:+p[0].toFixed(2),pz:+p[1].toFixed(2),w,so,rd,ph:n._rn&&n._rn.ph})}
  return r}}   // an independent observer of every tick
window.__folk=()=>crowd.filter(n=>n&&n!==S[0]&&n.hp>0&&!n.prov&&['idle','walk'].includes(n.st)&&!(n._rec&&n._rec.room)&&!HIT_RAIN.roomAt(n.x,n.z)&&!((n._wd||0)>.2));
0'''
SPOTS = [['civic', 0, -2], ['northfield', 0, 95], ['farms', 12, -70]]

async def boot(pg):
    await pg.wait_for_function('window.HIT_RAIN&&window.HIT_GARDEN&&window.HIT_FISH', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

SHOWER = r'''([name,x,z,last])=>{
  const RN=HIT_RAIN,o={name},sch=RN.sched;
  const s=sch.next(Date.now()+ (last?last:0));o.t0=s.t0;o.t1=s.t1;o.dur=+((s.t1-s.t0)/1000).toFixed(1);
  __setClock(s.t0-20000);__at(x,z);__O.steps=0;__O.wall=0;__O.solid=0;__O.road=0;__O.bad=[];__O.seen=new Set();RN.log.length=0;
  // dry before the start
  let maxI=0;__T(20*60-12,()=>{maxI=Math.max(maxI,RN.I)});o.dryBefore=maxI===0&&!RN.raining;
  let firstWet=null,rainOn=null,full=null;
  __T(40*60,()=>{const t=Date.now();if(firstWet===null&&RN.I>0)firstWet=t;if(rainOn===null&&RN.raining)rainOn=t;if(full===null&&RN.I>=1)full=t});
  o.startLag=firstWet===null?null:+((firstWet-s.t0)/1000).toFixed(3);o.flagLag=rainOn===null?null:+((rainOn-s.t0)/1000).toFixed(3);o.fullLag=full===null?null:+((full-s.t0)/1000).toFixed(3);
  o.startToast=(RN.log.find(e=>e.ev==='start')||{}).ev==='start';
  // 70 s in: everyone outdoors covered
  __T(Math.max(0,(s.t0+70000-Date.now()))/1000*60|0);
  const folk=__folk(),cov=[];let un=0;
  for(const n of folk){const st=RN.state(n),under=RN.coveredAt(n.x,n.z),umb=RN.umbOpen(n);const c=!!(under||umb);if(!c)un++;cov.push({tag:n._tag||'',x:+n.x.toFixed(1),z:+n.z.toFixed(1),ph:st&&st.ph,under,umb,ok:c})}
  o.cover={folk:folk.length,sheltered:cov.filter(c=>c.under&&!c.umb).length,umbrellas:cov.filter(c=>c.umb).length,uncovered:un,list:cov.filter(c=>!c.ok).slice(0,8)};
  o.atSpot=folk.filter(n=>{const st=RN.state(n);return st&&st.ph==='wait'&&Math.hypot(n.x-st.spot.x,n.z-st.spot.z)<.7}).length;
  o.waiting=folk.filter(n=>{const st=RN.state(n);return st&&st.ph==='wait'}).length;
  const origins=new Map();for(const n of crowd){const st=RN.state(n);if(st&&st.ph!=='umb')origins.set(n,[st.ox,st.oz,st.spot])}
  // to the end
  let dryAt=null,flagOff=null;const tEnd=s.t1+3000;while(Date.now()<tEnd){__T(60,()=>{const t=Date.now();if(flagOff===null&&!RN.raining)flagOff=t;if(dryAt===null&&RN.I===0&&t>s.t0+30000)dryAt=t})}
  o.endLag=dryAt===null?null:+((dryAt-s.t1)/1000).toFixed(3);o.flagOffLag=flagOff===null?null:+((flagOff-s.t1)/1000).toFixed(3);
  o.endToast=!!RN.log.find(e=>e.ev==='end');
  // 90 s after the end
  __T(90*60);
  const still=crowd.filter(n=>n&&n._rn);o.stillSteered=still.map(n=>({tag:n._tag||'',ph:n._rn.ph,x:+n.x.toFixed(1),z:+n.z.toFixed(1)}));
  const homes=RN.log.filter(e=>e.ev==='release'&&e.why==='home'),others=RN.log.filter(e=>e.ev==='release'&&e.why!=='home'&&e.why!=='dry');
  o.back={sheltered:origins.size,home:homes.length,maxHomeDist:homes.length?Math.max(...homes.map(e=>e.d)):0,otherReleases:others.map(e=>e.why),gaveUp:RN.log.filter(e=>e.ev==='giveup').length};
  let onSpot=0;for(const [n,[ox,oz,sp]] of origins){if(crowd.includes(n)&&sp&&Math.hypot(n.x-sp.x,n.z-sp.z)<.6&&Math.hypot(ox-sp.x,oz-sp.z)>.6)onSpot++}o.back.leftOnSpot=onSpot;
  o.walk={steps:__O.steps,people:__O.seen.size,wall:__O.wall,solid:__O.solid,road:__O.road,bad:__O.bad};
  o.spotsFree=RN.spots.every(p=>!p.by);
  o.ok=o.dryBefore&&o.startLag!==null&&o.startLag>=0&&o.startLag<=.1&&o.fullLag!==null&&Math.abs(o.fullLag-25)<=.1&&o.endLag!==null&&o.endLag>=-0.05&&o.endLag<=.1&&o.startToast&&o.endToast&&
       o.cover.folk>0&&o.cover.uncovered===0&&o.walk.wall===0&&o.walk.solid===0&&o.walk.road===0&&o.stillSteered.length===0&&o.back.leftOnSpot===0&&o.back.maxHomeDist<=1&&o.spotsFree;
  o.tEnd=Date.now();return o}'''

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + Q); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); await pg.reload(); await boot(pg)
        C['garden0'] = await pg.evaluate("()=>HIT_GARDEN.beds().map(b=>b.wet)")
        last = 0; C['showers'] = []
        for name, x, z in SPOTS:
            r = await pg.evaluate(SHOWER, [name, x, z, 0])
            if name == 'civic':   # the garden: wet during and for 2 min after the shower, then dry
                C['garden'] = await pg.evaluate('''()=>{const bd=HIT_GARDEN.beds();const o={wetAfter:bd.map(b=>b.wet),left:bd.map(b=>Math.round(b.wetLeft/1000))};__T(40*60);o.wet2=HIT_GARDEN.beds().map(b=>b.wet);
                  o.ok=o.wetAfter.every(Boolean)&&o.left.every(v=>v>=20&&v<=30)&&o.wet2.every(v=>!v);return o}''')
            C['showers'].append(r)
        C['garden']['dryBefore'] = not any(C['garden0']); C['garden']['ok'] = C['garden']['ok'] and C['garden']['dryBefore']
        # the garden during rain: wet within 2 s of the shower starting
        C['gardenStart'] = await pg.evaluate('''()=>{try{localStorage.removeItem('dw2.garden.v1')}catch(e){}return 1}''')
        await pg.reload(); await boot(pg)
        C['gardenStart'] = await pg.evaluate('''()=>{const s=HIT_RAIN.sched.next(Date.now());__setClock(s.t0+7000);__at(0,-2);const b0=HIT_GARDEN.beds().map(b=>b.wet);__T(60);const fl=HIT_RAIN.raining;__T(60);const b1=HIT_GARDEN.beds().map(b=>b.wet);
           return {before:b0,raining:fl,after2s:b1,ok:!b0.some(Boolean)&&b1.every(Boolean)}}''')
        # fish: bite wait in rain vs dry (same spot, 40 casts each)
        C['fish'] = await pg.evaluate('''()=>{const FI=HIT_FISH,F=FI.F,a=S[0],sp=FI.spots.find(s=>/lake|pier/.test(s.id))||FI.spots[0],o={spot:sp.id};
           const cast=()=>{if(F.st!=='off')FI.stop();__at(sp.x,sp.z);__T(10);_updateNear();if(!_near||_near.act!=='fishspot')return null;_doInteract();FI.input.down();__T(50);FI.input.up();let g=0;while(F.st!=='wait'&&g++<400)__T(1);const w=F.st==='wait'?F.wait:null;FI.stop();__T(2);return w};
           const run=(f)=>{HIT_RAIN.force=f;__T(30);const m=FI.biteMul;const ws=[];for(let i=0;i<40;i++){const w=cast();if(w!==null)ws.push(w)}return {mul:m,n:ws.length,mean:ws.reduce((a,b)=>a+b,0)/Math.max(1,ws.length)}};
           o.dry=run(0);o.rain=run(1);HIT_RAIN.force=0;__T(30);o.dryAgain=FI.biteMul;HIT_RAIN.force=null;window.__park=null;
           o.ratio=+(o.rain.mean/o.dry.mean).toFixed(3);o.ok=o.dry.mul===1&&o.rain.mul===.7&&o.dryAgain===1&&o.dry.n===40&&o.rain.n===40&&o.ratio>.6&&o.ratio<.8;return o}''')
        # notice boards
        C['board'] = await pg.evaluate('''()=>{const o={};const s=HIT_RAIN.sched.next(Date.now());
           const read=(x,z)=>{__at(x,z);__T(5);window.__park=null;_updateNear();const lab=_near&&_near.label;msg='';_doInteract();return {label:lab,msg:String(msg)}};
           __setClock(s.t0-5*60000-1000);o.dry=read(-36,1.4);o.dryOk=/WEATHER: dry; next shower in about [56] min/.test(o.dry.msg);
           __setClock(s.t0+30000);__T(5);o.wet=read(-36,1.4);o.wetOk=/WEATHER: a shower now, clearing in about \\d+ min/.test(o.wet.msg);
           let inn=null;for(const it of ((HIT_LIFE.SPEC.nf_n1||{}).items||[]))if(it[2]==='Notice board')inn=it;o.innItem=!!inn;
           if(inn){for(const [dx,dz] of [[0,-.6],[-.5,-.5],[.5,-.5],[0,-.9],[-.8,-.3],[.8,-.3],[-.9,-.7],[.9,-.7],[-1.2,0],[1.2,0],[-.6,.6],[.6,.6]]){__at(inn[0]+dx,inn[1]+dz);__T(8);window.__park=null;_updateNear();if(_near&&_near.label==='Notice board')break}o.innLabel=_near&&_near.label;msg='';if(o.innLabel==='Notice board')_doInteract();o.inn=String(msg);o.innOk=/WEATHER:/.test(o.inn)}else o.innOk=null;
           o.ok=o.dryOk&&o.wetOk&&o.innOk!==false;__at(0,-2);return o}''')
        # the coliseum keeps its own sky
        C['coliseum'] = await pg.evaluate('''()=>{HIT_RAIN.force=1;__T(120);const before=crowd.filter(n=>n._rn).length;HIT_SKY.on=true;__T(30);let e=null;try{draw()}catch(x){e=String(x)}
           const o={stateBefore:before,I:HIT_RAIN.I,raining:HIT_RAIN.raining,steered:crowd.filter(n=>n._rn).length,drawErr:e};HIT_SKY.on=false;__T(30);HIT_RAIN.force=null;
           o.ok=o.I===0&&!o.raining&&o.steered===0&&!e;return o}''')
        # draw in rain at each spot
        C['draw'] = await pg.evaluate('''(sp)=>{const o=[];HIT_RAIN.force=1;for(const [n,x,z] of sp){__at(x,z);__T(240);let e=null;try{draw()}catch(x){e=String(x)}o.push({n,err:e,umb:crowd.filter(q=>HIT_RAIN.umbOpen(q)).length})}HIT_RAIN.force=null;window.__park=null;return {spots:o,ok:o.every(q=>!q.err)}}''', SPOTS)
        mods = await pg.evaluate("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        C['errors'] = {'module': mods, 'page': errs[:10], 'ok': not mods and not errs}
        C['stats'] = await pg.evaluate("HIT_RAIN.stats")
        await b.close()
    for r in C['showers']: r.pop('tEnd', None)
    out['pass'] = all(r['ok'] for r in C['showers']) and all(C[k]['ok'] for k in ['garden', 'gardenStart', 'fish', 'board', 'coliseum', 'draw', 'errors'])
    s = json.dumps(out, indent=1); print(s)
    if OUT: open(OUT, 'w').write(s)

asyncio.run(main())
