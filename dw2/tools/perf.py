"""Dojo World perf harness.  Usage:
  python3 -I dw2/tools/perf.py <file.html> [--eval "JS run before measuring"] [--shot out.png] [--json out.json]
Reports per-frame canvas fill/ellipse/stroke counts, average frame ms, top fill call sites,
trees drawn per frame, HIT_* module errors and page errors.
Headless Chrome uses a software renderer, so absolute ms are far slower than an iPhone;
compare runs against each other (same machine, same view), never against a phone.
"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

FILE = os.path.abspath(sys.argv[1])
PRE = arg('--eval')
SHOT = arg('--shot')
OUT = arg('--json')
FRAMES = 40

MEASURE = r'''(FRAMES)=>new Promise(res=>{
  const C=CanvasRenderingContext2D.prototype, st={fill:0,stroke:0,ellipse:0,arc:0,drawImage:0}, sites={}; let n=0;
  for(const k of Object.keys(st))(o=>{C[k]=function(){st[k]++;
    if(k==='fill'&&(++n)%53===0){const s=new Error().stack.split('\n').slice(2,4).map(l=>(l.match(/at (\S+).*:(\d+):\d+\)?$/)||[]).slice(1).join(':')).join(' < ');sites[s]=(sites[s]||0)+53}
    return o.apply(this,arguments)}})(C[k]);
  const fr=[]; let last=performance.now();
  function f(t){fr.push(t-last);last=t;if(fr.length<FRAMES){requestAnimationFrame(f);return}
    let trees=0;try{const all=[...WORLD.props,...SCENE].filter(p=>p.k==='tree');for(const p of all){const q=P(p.x,0,p.z);if(q.x>-260&&q.x<W+260&&q.d>-cam.D)trees++}}catch(e){trees='?'}
    const mods={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)mods[k]=String(window[k].error).slice(0,200);
    const s=fr.slice().sort((a,b)=>a-b);
    res({perFrame:Object.fromEntries(Object.entries(st).map(([k,v])=>[k,Math.round(v/FRAMES)])),
      frameMsAvg:+(fr.reduce((a,b)=>a+b)/FRAMES).toFixed(1), frameMsP95:+s[Math.floor(FRAMES*.95)].toFixed(1),
      treesInView:trees, moduleErrors:mods,
      topFillSites:Object.entries(sites).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>[Math.round(v/FRAMES),k])})}
  requestAnimationFrame(f)})'''

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 430, 'height': 932}, device_scale_factor=2)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('file://' + FILE)
        await pg.wait_for_timeout(3000)
        if PRE:
            await pg.evaluate(PRE)
            await pg.wait_for_timeout(1500)
        r = await pg.evaluate(MEASURE, FRAMES)
        r['pageErrors'] = errs[:20]
        r['file'] = os.path.basename(FILE)
        if SHOT:
            await pg.screenshot(path=SHOT)
        print(json.dumps(r, indent=1))
        if OUT:
            open(OUT, 'w').write(json.dumps(r, indent=1))
        await b.close()

asyncio.run(main())
