import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
D=Path(__file__).resolve().parent
async def main():
 html=(D/'index.html').read_text().replace('<link rel="stylesheet" href="world.css">','<style>'+(D/'world.css').read_text()+'</style>')
 for f in ['world-vf-figure.js','world-art.js','world-environment-cinematic.js','world-interior-cinematic.js','world.js']:
  html=html.replace('<script src="'+f+'"></script>','<script>'+(D/f).read_text()+'</script>')
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':960,'height':540})
  err=[];page.on('pageerror',lambda e:err.append(str(e)))
  await page.set_content(html);await page.wait_for_timeout(600)
  await page.screenshot(path=str(D/'environment-initial.png'))
  await page.keyboard.down('ArrowLeft');await page.wait_for_timeout(750);await page.keyboard.up('ArrowLeft');await page.screenshot(path=str(D/'environment-walking.png'))
  print('errors',err,'state',await page.evaluate('window.__dojoWorld.getState()'))
  await b.close()
asyncio.run(main())
