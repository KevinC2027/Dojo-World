"""Fishing test (Step 5 gate).  Usage:
  python3 -I dw2/tools/fish.py <build.html> [--seed 7] [--n 25] [--json out.json]
Seeds Math.random, stops the render loop and runs the game's own tick() with no drawing. At each of the four rod rests a scripted
player uses the same input path as the INTERACT button (HIT_FISH.input.down/up for hold/release, _doInteract for the first press):
  good    hold for a random power, release, wait for the bite, strike ~0.2 s later, reel only while the fish rests and tension < .6
  early   strike during the wait (nibble or not)        -> must never hook a fish
  late    never strike                                 -> must report "stole the bait"
  greedy  strike, then hold the reel the whole time     -> strong fish must snap the line
  lazy    strike, then never reel                      -> the hook must slip out
  cancel  push the joystick mid-wait                   -> rod packed away, Red walks
Reports per spot: casts, landings in water, bites, hooks, catches, snaps, slips, species seen, and page/module errors."""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); N = int(arg('--n', 25)); OUT = arg('--json')
INIT = "(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})()" % SEED
RUN = r'''([id,pol])=>{
  const FI=HIT_FISH,F=FI.F,a=S[0],sp=FI.spots.find(s=>s.id===id),I=FI.input,res={pol,out:'?',sp:null,water:null,L:0,ticks:0,hooked:false};
  const T=(n)=>{for(let i=0;i<n;i++){tick();res.ticks++}};
  if(F.st!=='off')FI.stop(); H0.ax=0;H0.az=0;
  a.x=sp.x;a.z=sp.z;a.vx=a.vz=0;a._tgx=a.x;a._tgz=a.z;T(20);a.x=sp.x;a.z=sp.z;a.vx=a.vz=0;
  _updateNear(); if(!_near||_near.act!=='fishspot'){res.out='noPrompt:'+(_near&&_near.label);return res}
  _doInteract(); if(F.st!=='ready'){res.out='noStart';return res}
  I.down(); T(1+Math.floor(Math.random()*120)); I.up(); T(1);
  let g=0; while(F.st==='charge'||F.st==='fly'){T(1);if(++g>400)break}
  if(F.st!=='wait'){res.out='noWait:'+F.st;return res}
  res.water=!!(HIT_WATER.bodyAt(F.bob.x,F.bob.z)&&HIT_WATER.depthAt(F.bob.x,F.bob.z)>=.2); res.body=(HIT_WATER.bodyAt(F.bob.x,F.bob.z)||{}).id; res.sp=F.fish.id;
  if(pol==='early'){T(Math.floor(Math.random()*Math.max(1,F.wait-5)));I.down();T(1);I.up();T(2);res.out=F.st==='ready'?'reeledIn':'?'+F.st;res.hooked=F.st==='reel';return res}
  if(pol==='cancel'){T(30);H0.ax=1;const x0=a.x;T(40);H0.ax=0;T(5);res.out=(F.st==='off'?'packed':'notPacked')+(Math.abs(a.x-x0)>.2?'+walked':'+stuck');return res}
  g=0; while(F.st==='wait'){T(1);if(++g>2000)break}
  if(F.st!=='bite'){res.out='noBite:'+F.st;return res}
  if(pol==='late'){T(200);res.out=F.st==='ready'?'stolen':'?'+F.st;return res}
  T(10+Math.floor(Math.random()*6)); I.down(); T(1); I.up(); T(1);
  if(F.st!=='reel'){res.out='noHook:'+F.st;return res}
  res.hooked=true; res.str=+F.fish.str.toFixed(2); res.L=F.fish.L;
  const s0=Object.assign({},FI.stats);
  g=0; while(F.st==='reel'&&g<6000){g++;
    if(pol==='greedy'){if(!F.held)I.down()} else if(pol==='lazy'){if(F.held)I.up()}
    else { const want=!F.pull&&F.ten<.6; if(want&&!F.held)I.down(); if(!want&&F.held)I.up(); }
    T(1)}
  I.up();
  const d=k=>FI.stats[k]-s0[k];
  res.out=F.st==='done'?'caught':d('snaps')?'snapped':d('slips')?'slipped':'?'+F.st; res.reelTicks=g;
  if(F.st==='done'){T(25);I.down();T(1);I.up();T(1)}
  return res}'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE + (arg('--q') or '')); await pg.wait_for_timeout(2500)
        await pg.evaluate("requestAnimationFrame=()=>0")
        plan = [('good', N), ('early', max(4, N // 3)), ('late', max(4, N // 4)), ('greedy', max(6, N // 2)), ('lazy', max(4, N // 4)), ('cancel', 3)]
        out = {}
        for sp in ['lake', 'marsh', 'river', 'pond']:
            rs = []
            for pol, n in plan:
                for _ in range(n): rs.append(await pg.evaluate(RUN, [sp, pol]))
            S = {'sessions': len(rs), 'landedInWater': sum(1 for r in rs if r.get('water')), 'withFloat': sum(1 for r in rs if r.get('water') is not None),
                 'bodies': sorted(set(r.get('body') or '-' for r in rs if r.get('water') is not None)), 'species': {}, 'byPolicy': {}, 'bad': []}
            for r in rs:
                if r.get('sp'): S['species'][r['sp']] = S['species'].get(r['sp'], 0) + 1
                k = S['byPolicy'].setdefault(r['pol'], {}); k[r['out']] = k.get(r['out'], 0) + 1
                if r['pol'] == 'early' and r['hooked']: S['bad'].append(r)
                if r['out'].startswith('no') or r['out'].startswith('?'): S['bad'].append(r)
            out[sp] = S
        out['stats'] = await pg.evaluate('HIT_FISH.stats')
        out['moduleErrors'] = await pg.evaluate("Object.fromEntries(Object.keys(window).filter(k=>/^HIT_/.test(k)&&window[k]&&window[k].error).map(k=>[k,String(window[k].error).slice(0,200)]))")
        out['pageErrors'] = errs[:10]; out['file'] = os.path.basename(FILE); out['seed'] = SEED
        print(json.dumps(out, indent=1))
        if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
        await b.close()
asyncio.run(main())
