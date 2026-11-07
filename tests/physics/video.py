#!/usr/bin/env python3
"""Capture one evidence batch; this script does not install an hourly schedule."""
import argparse
import base64
from functools import partial
import hashlib
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
from threading import Thread
from zoneinfo import ZoneInfo
from datetime import datetime

from playwright.sync_api import sync_playwright
import record


def encode(images, path, label):
    # The probe's disclosed timer renders every16ms; original simulation DT=1/60.
    vf=f"pad=ceil(iw/2)*2:ceil(ih/2)*2,drawtext=text='{label}':fontcolor=white:fontsize=20:box=1:boxcolor=black@0.75:x=12:y=h-38,fps=60,format=yuv420p"
    command=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','125/2',
             '-vcodec','png','-i','pipe:0','-vf',vf,'-c:v','libx264','-preset','fast','-crf','22',
             '-movflags','+faststart',str(path)]
    proc=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for frame in images:proc.stdin.write(base64.b64decode(frame['png']))
        proc.stdin.close()
        error=proc.stderr.read().decode();status=proc.wait()
        if status:raise RuntimeError('Video encoder failed: '+error)
    finally:
        if proc.poll() is None:proc.kill();proc.wait()


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output-dir',required=True)
    p.add_argument('--candidate',default='workbench/throw-carry-ik-v1/index.html')
    p.add_argument('--browser-executable')
    args=p.parse_args();root=record.ROOT;out=Path(args.output_dir).resolve()
    if out.exists() and any(out.iterdir()):raise SystemExit('Use a fresh output directory')
    out.mkdir(parents=True,exist_ok=True)
    marker='if(o.images&&key&&!imageEvents.has(key)){'
    if record.INSTALL.count(marker)!=1:raise SystemExit('Video capture hook no longer matches reviewed recorder')
    record.INSTALL=record.INSTALL.replace(marker,'if(o.images){')
    parts=[];evidence=[]
    with sync_playwright() as pw:
        launch=dict(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        if args.browser_executable:launch['executable_path']=args.browser_executable
        browser=pw.chromium.launch(**launch)
        try:
            for style,slot,name in [('back',0,'Red throws Blue'),('lunge',1,'Blue throws Red')]:
                for tag,source in [('BASELINE',root/'recovered_source/index.html'),('BLOCKED CANDIDATE',root/args.candidate)]:
                    raw=source.read_bytes()
                    server=ThreadingHTTPServer(('127.0.0.1',0),partial(record.Handler,directory=str(source.parent)))
                    Thread(target=server.serve_forever,daemon=True).start()
                    try:
                        case=dict(attacker_slot=slot,attacker_style=style,facing=1,distance=.85)
                        data=record.run_case(browser,f'http://127.0.0.1:{server.server_port}/{source.name}',case,images=True)
                    finally:server.shutdown();server.server_close()
                    filename=f'{style}-{tag.lower().replace(" ","-")}.mp4'
                    encode(data['shots'],out/filename,tag+' '+name+' - real G+P input')
                    if source.read_bytes()!=raw:raise RuntimeError('Source changed during video capture')
                    parts.append(filename)
                    evidence.append(dict(source=str(source.relative_to(root)),source_sha256=hashlib.sha256(raw).hexdigest(),
                                         case=case,segment=filename,frames=len(data['shots']),
                                         first_frame_ms=data['frames'][0]['elapsed_ms'],last_frame_ms=data['frames'][-1]['elapsed_ms'],
                                         state_sha256=data['state_sha256']))
                    print('Captured:',filename,flush=True)
        finally:browser.close()
    listing=out/'segments.txt';listing.write_text(''.join("file '"+str(out/name)+"'\n" for name in parts))
    normal=out/'gameplay-regular-speed.mp4';slow=out/'gameplay-slow-motion-0.25x.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),
                    '-c','copy','-movflags','+faststart',str(normal)],check=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(normal),'-vf','setpts=4*PTS',
                    '-r','60','-c:v','libx264','-preset','fast','-crf','22','-an','-movflags','+faststart',str(slow)],check=True)
    metadata=dict(captured_at=datetime.now(ZoneInfo('America/Chicago')).isoformat(),
                  regular=normal.name,slow=slow.name,slow_playback_scale=.25,segments=evidence,
                  schedule='One batch only. No hourly scheduler configured. No scheduling tool available; no auto-merge to activate GitHub cron.',
                  methodology='Actual canvas frames from real-keyboard triggered controlled throw fixtures.16ms render cadence, original60Hz simulation. Slow video duplicates playback frames; no invented animation.',
                  limitations=['Not a natural full match or physical-device capture.','S1 input routing is a disclosed fixture.',
                               'Candidate is BLOCKED for measured continuity regressions and is not promoted or owner-approved.'])
    for path in (normal,slow):
        info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size','-of','json',str(path)]))
        metadata[path.stem]=info['format']|{'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    (out/'metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(json.dumps({'regular':str(normal),'slow':str(slow),'schedule':'NOT CONFIGURED'}),flush=True)


if __name__=='__main__':main()
