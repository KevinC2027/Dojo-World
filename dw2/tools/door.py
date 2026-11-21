"""Door/collision regression test: walks Red (H0.u=1, 3.5 s) at six facades/doorways and prints end position + room. Usage: python3 -I dw2/tools/door.py <build.html>"""
import asyncio,sys,os,json
from playwright.async_api import async_playwright
T=[('nf_s1',-24,84),('bank',86,0),('nf_s3',12,84),('stand',6,-70),('shop',-21,-1),('apt_wall',-32.5,-1)]
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':430,'height':932})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('file://'+os.path.abspath(sys.argv[1]));await pg.wait_for_timeout(3000)
    out=[]
    for n,x,z in T:
      await pg.evaluate(f"H0.u=0;S[0].x={x};S[0].z={z};S[0]._tgx={x};S[0]._tgz={z};cam.mx={x};cam.mz={z};cam.yaw=0")
      await pg.wait_for_timeout(600);await pg.evaluate("H0.u=1");await pg.wait_for_timeout(3500)
      r=await pg.evaluate("[+S[0].x.toFixed(2),+S[0].z.toFixed(2),(typeof _insideRoom==='function'?_insideRoom():null)||(window.HIT_INT&&HIT_INT.insideId&&HIT_INT.insideId())||null]")
      await pg.evaluate("H0.u=0");out.append([n,r])
    print(json.dumps(out));print(errs);await b.close()
asyncio.run(main())
