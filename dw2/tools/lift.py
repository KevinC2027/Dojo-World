"""Sky Tree lift test: walk into the doorway, ride up, INTERACT at the ring wind gate, ride down. Usage: python3 -I dw2/tools/lift.py <build.html>"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
FILE=os.path.abspath(sys.argv[1])
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':430,'height':932},device_scale_factor=1)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    await pg.goto('file://'+FILE);await pg.wait_for_timeout(3000)
    E=pg.evaluate
    await E("S[0].x=68;S[0].z=4;S[0]._tgx=68;S[0]._tgz=4;cam.mx=68;cam.mz=4;H0.u=1")
    res={}
    for i in range(80):
      await pg.wait_for_timeout(250)
      if await E("!!HIT_TRAVEL.fly"): res['walkInStartsLift']=True; break
    await E("H0.u=0")
    res['zAtStart']=await E("S[0].z")
    for i in range(160):
      await pg.wait_for_timeout(250)
      if await E("!HIT_TRAVEL.fly"): break
    res['areaAfterUp']=await E("HIT_TRAVEL.area"); res['trips']=await E("HIT_TRAVEL.trips")
    await pg.wait_for_timeout(2500)
    # INTERACT at the wind gate
    await E("S[0].x=HIT_TRAVEL.pad.x;S[0].z=HIT_TRAVEL.pad.z;S[0]._tgx=S[0].x;S[0]._tgz=S[0].z")
    await pg.wait_for_timeout(800)
    res['nearLabel']=await E("(_updateNear(),_near&&_near.label)")
    await E("_doInteract()")
    res['downStarted']=await E("!!HIT_TRAVEL.fly")
    for i in range(160):
      await pg.wait_for_timeout(250)
      if await E("!HIT_TRAVEL.fly"): break
    res['areaAfterDown']=await E("HIT_TRAVEL.area"); res['trips2']=await E("HIT_TRAVEL.trips")
    res['redAt']=await E("[+S[0].x.toFixed(2),+S[0].z.toFixed(2)]")
    res['travelErr']=await E("HIT_TRAVEL.error"); res['tcErr']=await E("SC.TC.err||null")
    res['pageErrors']=errs
    print(json.dumps(res));await b.close()
asyncio.run(main())
