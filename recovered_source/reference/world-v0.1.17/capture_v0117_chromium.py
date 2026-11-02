"""Capture actual running Chromium canvas + UI with scripted keyboard input.
Screenshots are taken from the browser, not synthesized or redrawn. 10 fps output.
"""
import asyncio,time,json
from pathlib import Path
from playwright.async_api import async_playwright
D=Path(__file__).resolve().parent

def inlined_html():
 html=(D/'index.html').read_text().replace('<link rel="stylesheet" href="world.css">','<style>'+(D/'world.css').read_text()+'</style>')
 for f in ['world-vf-figure.js','world-art.js','world-environment-cinematic.js','world-interior-cinematic.js','world.js']:
  html=html.replace('<script src="'+f+'"></script>','<script>'+(D/f).read_text()+'</script>')
 return html

async def main():
 frames=D/'chromium_frames_v0117';frames.mkdir(exist_ok=True)
 for f in frames.glob('*.jpg'):f.unlink()
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  context=await browser.new_context(viewport={'width':960,'height':540},device_scale_factor=1)
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(inlined_html());await page.wait_for_timeout(250)
  # Existing v0.1.5 gameplay route; original scene switching retained.
  # Timed real keyboard inputs; longer down-leg avoids shelves when returning to exit.
  events=[
   (1.0,'down','ArrowUp'),(1.75,'up','ArrowUp'),(1.95,'press','e'),
   (2.25,'down','ArrowRight'),(3.92,'up','ArrowRight'),
   (4.10,'down','ArrowUp'),(5.18,'up','ArrowUp'),
   (5.38,'press','e'),(5.88,'press','1'),(6.45,'press','e'),
   (6.75,'down','ArrowDown'),(8.08,'up','ArrowDown'),
   (8.25,'down','ArrowLeft'),(9.85,'up','ArrowLeft'),(10.10,'press','e'),
   (10.50,'down','ArrowRight'),(13.05,'up','ArrowRight'),(13.30,'press','e'),
   (13.65,'down','ArrowRight'),(14.35,'up','ArrowRight'),
   (14.55,'down','ArrowUp'),(15.65,'up','ArrowUp'),
   (15.88,'press','e'),(16.55,'press','e'),
   (17.10,'down','ArrowDown'),(18.20,'up','ArrowDown'),
   (18.35,'down','ArrowLeft'),(19.10,'up','ArrowLeft'),(19.35,'press','e'),
   (20.00,'press','r'),(20.40,'down','ArrowLeft'),(24.20,'up','ArrowLeft'),
   (24.50,'down','ArrowRight'),(25.0,'down','ArrowUp'),(26.5,'up','ArrowUp'),(28.70,'up','ArrowRight'),(29.0,'press','r')]
  start=time.monotonic();next_event=0;count=300;snapshots=[]
  for i in range(count):
   target=start+i*.1;now=time.monotonic()
   if target>now:await asyncio.sleep(target-now)
   elapsed=time.monotonic()-start
   while next_event<len(events) and events[next_event][0]<=elapsed:
    _,act,key=events[next_event]
    if act=='down':await page.keyboard.down(key)
    elif act=='up':await page.keyboard.up(key)
    else:await page.keyboard.press(key)
    next_event+=1
   await page.screenshot(path=str(frames/f'{i:04d}.jpg'),type='jpeg',quality=80)
   if i in [0,18,36,56,76,100,120,140,160,180,198,220,256,290]:
    st=await page.evaluate('window.__dojoWorld.getState()')
    snapshots.append({'frame':i,'time':round(elapsed,2),'scene':st['scene'],'player':st['player'],'interiorPlayer':st['interiorPlayer'],'dojoPlayer':st['dojoPlayer'],'coins':st['coins'],'inventory':st['inventory'],'weather':st['weather'],'renQuest':st['renQuest']})
    if i in [0,36,100,140,180,220,256]:await page.screenshot(path=str(D/f'capture-frame-{i:03d}.png'))
  verification={'frames':count,'nominal_video_duration_s':count/10,'actual_capture_duration_s':round(time.monotonic()-start,2),'capture':'Real Chromium 960x540 browser screenshots from the running build with scripted keyboard inputs, encoded at 10fps; NOT a real-time screen recording or device capture.','snapshots':snapshots,'page_errors':errors}
  (D/'capture-verification-v0.1.17.json').write_text(json.dumps(verification,indent=2))
  print(json.dumps(verification,indent=2),flush=True)
  await browser.close()
if __name__=='__main__':asyncio.run(main())
