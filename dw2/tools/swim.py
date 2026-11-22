"""Mirror Lake swim course test (Step 12 gate).  Usage:
  python3 -I dw2/tools/swim.py <build.html> [--seed 7] [--runs 4] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick(). The scripted swimmer uses only the player's paths: the
joystick (H0.ax/H0.az, SKY camera yaw 0, the same mapping walking uses) to run and swim, JUMP to dive, and INTERACT
(_updateNear/_doInteract) at the start board. Red is never placed in the water by the test: every run starts on the beach.
  prompt    no prompt away from the board; at the board "Swim course: start"; INTERACT starts the 3-2-1 countdown
  false     moving into the water before GO = false start, the run ends, no time kept
  courses   --runs full runs (wobbly random lines, one with a dive under buoy 3): every buoy reached in order while actually in the
            water (swimming or diving), the finish gate crossed, the time = the ticks the test counted between GO and the finish
            (and = the go/finish event ticks), the best time = the minimum of the finishes, the last-five list matches
  missed    skip buoy 2 (1 -> 3): "Missed buoy 2" flagged and buoy 3 not counted; reaching the gate with buoys left flags the next one
            and does not finish; going back for them all then finishes; a straight GO -> gate swim flags buoy 1
  out       swimming back to the beach mid-course ends the run ('out'); no best time is changed
  dry       never getting in ends the run after 12 s ('dry'); INTERACT at the board during the countdown cancels
  area      a boat ride refuses to start (code 'boat'); the coliseum mid-run ends it ('area')
  reload    the best time and last-five list survive a reload
  draw      the HUD / buoys / board draw with no module error at several moments of a run
  errors    no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); RUNS = int(arg('--runs', 4)); OUT = arg('--json')
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};})()" % SEED)
HELP = r'''window.__T=(n)=>{for(let i=0;i<n;i++)tick()};
window.__stick=(x,z)=>{H0.ax=x;H0.az=z};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._tgx=x;a._tgz=z;a._lv=null;H0.ax=H0.az=0;};
window.__near=()=>{_updateNear();return _near?{label:_near.label,act:_near.act}:null};
window.__board=()=>{const c=HIT_SWIM.cfg.spot;return[c.x,c.z]};
// walk on land to the board spot (teleport only on dry land, never into the water)
window.__toBoard=()=>{const[x,z]=__board();__at(x,z-1.5);__T(30);for(let i=0;i<400;i++){const a=S[0],dx=x-a.x,dz=z-a.z,d=Math.hypot(dx,dz);if(d<.35)break;cam.yaw=0;__stick(dx/d,-dz/d);tick()}__stick(0,0);__T(10)};
// one tick of joystick toward (x,z) with an optional sideways wobble; returns the distance left
window.__steer=(x,z,wob)=>{const a=S[0];let dx=x-a.x,dz=z-a.z;const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;if(wob){const c=Math.cos(wob),s=Math.sin(wob);[dx,dz]=[dx*c-dz*s,dx*s+dz*c]}cam.yaw=0;__stick(dx,-dz);tick();return Math.hypot(x-S[0].x,z-S[0].z)};
window.__ev=()=>HIT_SWIM.log.slice();
window.__draws=()=>{try{draw();return null}catch(e){return String(e)}};0'''

COURSE = r'''async ([plan,dive])=>{   // plan: list of targets: 'b<i>' (buoy index), 'gate', 'beach'
  const SW=HIT_SWIM,C=SW.cfg,a=S[0],o={};
  const log0=SW.log.length;__toBoard();const lab=__near();_doInteract();o.label=lab&&lab.label;o.st0=SW.st();
  let n=0;while(SW.st()==='count'&&n<400){__stick(0,0);tick();n++}o.countTicks=n;
  let ran=0,inWater=[],drawErr=null,dived=false,phase=0;const wob0=Math.random()*6.28;
  const tgt=(p)=>p==='gate'?[(C.gate.x0+C.gate.x1)/2,C.gate.z-1.6]:p==='beach'?[42,39.6]:C.buoys[+p.slice(1)];
  for(const p of plan){
    const t=tgt(p);let pass=0;
    // the gate: approach from the lake side (north of the line) and swim on through it heading for the shore
    const legs=p==='gate'?[[t[0],C.gate.z+2.2],[t[0],t[1]]]:[t];
    for(const L of legs){for(let i=0;i<4000&&SW.st()==='run';i++){
      const wob=(p.startsWith('b')?.35:.15)*Math.sin(wob0+ran*.013);
      if(dive&&p==='b2'&&!dived&&Math.hypot(a.x-t[0],a.z-t[1])<4.5&&a._wd>=1){jumpFlag=1;dived=true}
      if(dive&&dived&&a._dive>0)H0.d=1;
      const d=__steer(L[0],L[1],wob);ran++;H0.d=0;
      if(ran%700===0){const e=__draws();if(e)drawErr=e}
      const nb=SW.R.done.filter(Boolean).length;if(nb>inWater.length)inWater.push({n:nb,wd:+(a._wd||0).toFixed(2),swim:!!a._swim,dive:+(a._dive||0).toFixed(2)});
      if(d<(p==='beach'?.6:p==='gate'?.4:.9))break;}}
    if(SW.st()!=='run')break;
  }
  // let a finished run settle
  __stick(0,0);
  const ev=SW.log.slice(log0),go=ev.find(e=>e.e==='go'),fin=ev.find(e=>e.e==='finish'),end=ev.find(e=>e.e==='end');
  o.events=ev.map(e=>e.e+(e.n?e.n:'')+(e.buoy?'(' + e.buoy+'@'+e.at+')':'')+(e.why?':'+e.why:''));
  o.ran=ran;o.reach=inWater;o.go=go&&go.tk;o.fin=fin?fin.t:null;o.finTk=fin&&go?fin.tk-go.tk:null;o.end=end?end.why:null;o.dived=dived;
  o.rec=SW.rec();o.st=SW.st();o.drawErr=drawErr;o.red=[+a.x.toFixed(2),+a.z.toFixed(2),+(a._wd||0).toFixed(2)];
  __T(400);return o}'''

async def boot(pg):
    await pg.wait_for_function('window.HIT_SWIM&&window.HIT_WATER&&window.HIT_DC&&HIT_DC.eco', timeout=20000)
    await pg.wait_for_timeout(1200); await pg.evaluate("requestAnimationFrame=()=>0;camMode=0"); await pg.evaluate(HELP)

async def main():
    out = {'file': os.path.basename(FILE), 'seed': SEED}; C = out['checks'] = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + (arg('--q') or '')); await boot(pg)
        await pg.evaluate("()=>{try{localStorage.removeItem('dw2_swim_v1')}catch(e){}}")
        await pg.reload(); await boot(pg)
        # ---------- prompt ----------
        C['prompt'] = await pg.evaluate('''()=>{const o={};__at(30,36);__T(20);o.away=__near();o.awayNotSwim=!o.away||o.away.act!=='swimstart';
            __toBoard();o.at=__near();_doInteract();o.st=HIT_SWIM.st();__T(5);o.cancelLabel=__near();_doInteract();o.after=HIT_SWIM.st();__T(400);
            o.ok=o.awayNotSwim&&!!o.at&&o.at.label.startsWith('Swim course: start')&&o.st==='count'&&o.cancelLabel&&/cancel/.test(o.cancelLabel.label)&&o.after==='done';return o}''')
        # ---------- false start ----------
        C['false'] = await pg.evaluate('''()=>{const o={};__toBoard();_updateNear();_doInteract();let n=0;while(HIT_SWIM.st()==='count'&&n<180){__steer(42,44);n++}
            o.st=HIT_SWIM.st();o.why=HIT_SWIM.R.why;o.ticks=n;o.best=HIT_SWIM.rec().best;__stick(0,0);__T(400);o.ok=o.st==='done'&&o.why==='false'&&n<180&&o.best===null;return o}''')
        # ---------- full courses ----------
        full = ['b0', 'b1', 'b2', 'b3', 'b4', 'gate']
        runs = []
        for k in range(RUNS):
            r = await pg.evaluate(COURSE, [full, k == 1]); runs.append(r)
        fins = [r['fin'] for r in runs if r['fin'] is not None]
        okr = []
        for r in runs:
            okr.append(r['label'].startswith('Swim course: start') and r['countTicks'] == 180 and r['fin'] is not None and r['fin'] == r['finTk']
                       and [x['n'] for x in r['reach']] == [1, 2, 3, 4, 5] and all(x['wd'] >= 1 for x in r['reach'])
                       and r['events'] == ['start', 'go', 'buoy1', 'buoy2', 'buoy3', 'buoy4', 'buoy5', 'finish'] and not r['drawErr'])
        last = runs[-1]['rec']
        C['courses'] = {'runs': runs, 'times_s': [round(t / 60, 2) for t in fins], 'ok': all(okr) and len(fins) == RUNS and last['best'] == min(fins)
                        and last['last'] == list(reversed(fins))[:5] and last['fins'] == RUNS and any(r['dived'] and any(x['dive'] > 0 for x in r['reach']) for r in runs),
                        'perRun': okr}
        best0 = last['best']
        # ---------- missed buoys ----------
        m1 = await pg.evaluate(COURSE, [['b0', 'b2', 'gate', 'b1', 'b2', 'b3', 'b4', 'gate'], False])
        m2 = await pg.evaluate(COURSE, [['gate', 'b0', 'b1', 'b2', 'b3', 'b4', 'gate'], False])
        C['missed'] = {'skip2': m1, 'straightToGate': m2,
                       'ok': m1['events'][:4] == ['start', 'go', 'buoy1', 'missed(2@3)'] and 'missed(2@finish)' in m1['events'] and m1['fin'] is not None
                       and m1['events'][-1] == 'finish' and m1['events'].count('buoy3') == 1 and m1['fin'] == m1['finTk']
                       and m2['events'][2] == 'missed(1@finish)' and m2['events'][-1] == 'finish' and m2['fin'] == m2['finTk']}
        # ---------- leaving the water ----------
        o1 = await pg.evaluate(COURSE, [['b0', 'beach'], False])
        C['out'] = {'run': o1, 'ok': o1['end'] == 'out' and o1['fin'] is None and o1['rec']['best'] == min(fins + [m1['fin'], m2['fin']]) and o1['red'][2] < .12}
        # ---------- dry + cancel ----------
        C['dry'] = await pg.evaluate('''()=>{const o={};__toBoard();_updateNear();_doInteract();let n=0;while(HIT_SWIM.st()!=='done'&&n<2000){__stick(0,0);tick();n++}
            o.why=HIT_SWIM.R.why;o.ticks=n;__T(400);o.ok=o.why==='dry'&&n===180+720;return o}''')
        # ---------- boat / coliseum ----------
        C['area'] = await pg.evaluate('''async ()=>{const o={},SW=HIT_SWIM;
            if(window.HIT_BOAT){__toBoard();HIT_BOAT.B.aboard=true;o.boat=SW.start().code;HIT_BOAT.B.aboard=false}else o.boat='boat';
            __toBoard();_updateNear();_doInteract();__T(200);o.running=SW.st();HIT_TRAVEL.jump('sky');await new Promise(r=>setTimeout(r,900));tick();o.sky=HIT_SKY.on;o.why=SW.R.why;
            o.skyStart=SW.start().code;HIT_TRAVEL.jump('town');await new Promise(r=>setTimeout(r,1300));o.back=!HIT_SKY.on;__T(400);
            o.props=WORLD.props.filter(q=>/^w2swim/.test(q.k)).length;
            o.ok=o.boat==='boat'&&o.running==='run'&&o.sky&&o.why==='area'&&o.skyStart==='area'&&o.back&&o.props===7;return o}''')
        rec = await pg.evaluate("HIT_SWIM.rec()")
        await pg.reload(); await boot(pg)
        aft = await pg.evaluate("HIT_SWIM.rec()")
        C['reload'] = {'before': rec, 'after': aft, 'ok': rec == aft and aft['best'] is not None}
        out['stats'] = await pg.evaluate("HIT_SWIM.stats")
        out['moduleErrors'] = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        out['errors'] = errs[:10]
        await b.close()
    s = out['summary'] = {k: v.get('ok') for k, v in C.items()}
    s['times_s'] = C['courses']['times_s']; s['pageErrors'] = len(out['errors']); s['moduleErrors'] = out['moduleErrors']
    s['PASS'] = all(v for k, v in s.items() if isinstance(v, bool)) and not out['errors'] and not out['moduleErrors']
    print(json.dumps(s, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
