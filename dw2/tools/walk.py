"""Phone-pace walk toward the Sky Tree: Red moves 0.044 m per rendered frame (~2.6 m/s at 60 fps) from z=-12 to z=1.2 at x=68.
Reports fills/frame while moving and why tree sprites were re-drawn. Usage: python3 -I dw2/tools/walk.py <build.html>
(Software renderer: compare builds relative to each other only.)"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
FILE=os.path.abspath(sys.argv[1])
JS=r'''()=>new Promise(res=>{const T=SC.TC;const C=CanvasRenderingContext2D.prototype;let f=0;const of=C.fill;C.fill=function(){f++;return of.apply(this,arguments)};
const out=[];window._who={};const _tc=SC.tierCache;SC.tierCache=function(p){const r0=SC.TC.renders,had=!!p._tc,k1=had?p._tc.k0:0,y1=had?p._tc.yb:0;const v=_tc.apply(this,arguments);if(SC.TC.renders>r0){const k=!had?"new":(p._tc.yb!==y1?"yaw":(p._tc.k0/k1>1?"up":"down"));_who[k]=(_who[k]||0)+1}return v};let n=0,last=performance.now(),r0=T.renders;const N=300;
function s(t){const z=-12+n*.044;S[0].x=68;S[0].z=z;S[0]._tgx=68;S[0]._tgz=z;out.push([f,Math.round(t-last),T.renders-r0]);f=0;last=t;r0=T.renders;
 if(++n<N){requestAnimationFrame(s);return}C.fill=of;res(out.concat([[JSON.stringify(_who),0,0]]))}requestAnimationFrame(s)})'''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':430,'height':932},device_scale_factor=2)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('file://'+FILE);await pg.wait_for_timeout(3000)
    await pg.evaluate("S[0].x=68;S[0].z=-12;S[0]._tgx=68;S[0]._tgz=-12;cam.mx=68;cam.mz=-12");await pg.wait_for_timeout(5000)
    o=await pg.evaluate(JS)
    print(o[-1][0]);o=o[:-1];fl=[a[0] for a in o[1:]];ms=[a[1] for a in o[1:]];rr=[a[2] for a in o[1:]]
    s=sorted(ms)
    print(json.dumps({'fillsAvg':round(sum(fl)/len(fl)),'fillsMax':max(fl),'msAvg':round(sum(ms)/len(ms),1),'msP95':s[int(len(s)*.95)],'msMax':max(ms),'renders':sum(rr),'framesWithRender':sum(1 for r in rr if r)}))
    print(errs);await b.close()
asyncio.run(main())
