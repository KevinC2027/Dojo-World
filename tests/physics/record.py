#!/usr/bin/env python3
"""Real-input, fixed-clock throw observations; original source stays untouched."""
import argparse
import base64
from datetime import datetime, timedelta, timezone
from functools import partial
import gzip
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from importlib.metadata import version
import json
from pathlib import Path
import subprocess
from threading import Thread

from playwright.sync_api import sync_playwright
from scorecard import score_case

ROOT=Path(__file__).resolve().parents[2]
BASELINE_SHA='786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b'
SEED=20261102
INIT="""(()=>{let r=20261102;Math.random=()=>{r|=0;r=r+0x6D2B79F5|0;
let t=Math.imul(r^r>>>15,1|r);t=t+Math.imul(t^t>>>7,61|t)^t;
return ((t^t>>>14)>>>0)/4294967296;};window.__physicsRng=()=>r;
// Measurement fixture: deterministic render scheduling; original DT remains 1/60.
// Native RAF's initial phase varies per fresh page even with Playwright's clock.
window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),16);
window.cancelAnimationFrame=id=>clearTimeout(id);
})()"""
INSTALL=r"""o=>{
const inputSlot=o.slot;
S=[mk(0,o.style==='lunge'?1:0),mk(0,o.style==='lunge'?0:1)];
// Select style and input slot without changing update order or invoking go/tryHit.
if(inputSlot===1)S.reverse();
const a=S[inputSlot],v=S[1-inputSlot];
a.x=0;v.x=o.facing*o.distance;a.fx=o.facing;v.fx=-o.facing;
a.ax=o.facing;v.ax=-o.facing;a.aiT=v.aiT=1e9;
for(const f of S){for(const k of Object.keys(f.i))f.i[k]=0;}
for(const k of Object.keys(H0))H0[k]=0;
phase='fight';pt=0;tm=2700;round=1;hs=0;shake=0;sparks=[];cmbT=0;
cam.yaw=o.facing===1?0:Math.PI;cam.mx=0;cam.mz=0;cam.D=11;
const startClock=performance.now();
let engineTick=0,simulationTick=0,renderIndex=0,poseDepth=0,drawing=null;
let poseCalls=0;const rendered=new Map(),frames=[],states=[],shots=[];
const imageEvents=new Set();
const clone=x=>JSON.parse(JSON.stringify(x));
const origPress=press;
press=function(k,val){
 if(inputSlot===0)return origPress(k,val);
 // Only route the existing keyboard/button handler to selected native slot.
 const keep=S;S=[keep[1],keep[0]];try{return origPress(k,val);}finally{S=keep;}
};
const origTick=tick;
tick=function(){
 const frozen=hs>0;engineTick++;
 if(inputSlot===1){
  const held={...H0};Object.assign(S[1].i,held);
  for(const k of Object.keys(H0))H0[k]=0;
  try{origTick();}finally{Object.assign(H0,held);}
 }else origTick();
 if(!frozen)simulationTick++;
};
const actor=(f,p)=>{
 const rs=p.rotS||0,rh=p.rotH||0;
 const local={...p,
  SL:[p.neck[0]+.11*rs,p.neck[1]-.05,.22-.03*rs],
  SR:[p.neck[0]-.11*rs,p.neck[1]-.05,-.22+.03*rs],
  HL:[p.pel[0]+.04*rh,p.pel[1],p.pel[2]+.12-.009*rh],
  HR:[p.pel[0]-.04*rh,p.pel[1],p.pel[2]-.12+.009*rh]};
 const world={};
 for(const j of ['pel','neck','head','hl','hr','el','er','kl','kr','fl','fr','SL','SR','HL','HR']){
  const q=local[j];world[j]=[f.x+f.fx*q[0]-f.fz*q[2],f.y+q[1],f.z+f.fz*q[0]+f.fx*q[2]];
 }
 return {slot:S.indexOf(f),style:f.style,st:f.st,t:f.t,hp:f.hp,hit:f.hit,
  move:f.mv===M.P?'P':f.mv===M.K?'K':f.mv===M.L?'L':f.mv===M.T?'T':null,
  root:[f.x,f.y,f.z],velocity:[f.vx,f.vy,f.vz],facing:[f.fx,f.fz],
  local_pose:clone(p),world};
};
const origPose=pose;
pose=function(f){
 poseCalls++;const direct=poseDepth===0&&drawing===f;poseDepth++;
 let p;try{p=origPose(f);}finally{poseDepth--;}
 if(direct&&o.capture)rendered.set(f,actor(f,p));
 return p;
};
const origDrawF=drawF;
drawF=function(f,col){const previous=drawing;drawing=f;try{return origDrawF(f,col);}finally{drawing=previous;}};
const origDraw=draw;
draw=function(){
 origDraw();renderIndex++;
 // Full actor state includes pose-owned caches. Reading JSON adds no pose/RNG calls.
 states.push({engine_tick:engineTick,simulation_tick:simulationTick,phase,tm,round,hs,
   rng:window.__physicsRng(),pose_calls:poseCalls,S:clone(S)});
 if(o.capture){
  const actors=S.map(f=>rendered.get(f));
  if(actors.some(x=>!x))throw Error('Missing direct drawF pose capture');
  frames.push({engine_tick:engineTick,simulation_tick:simulationTick,
   render_index:renderIndex,elapsed_ms:performance.now()-startClock,phase,tm,actors});
  const d=actors[1-inputSlot],key=d.st==='carry'&&[1,3,6,9,11].includes(d.t)?'carry-'+d.t:
   ['air','down','getup'].includes(d.st)?d.st:d.st==='idle'&&imageEvents.has('getup')?'recovered':null;
  if(o.images&&key&&!imageEvents.has(key)){
   imageEvents.add(key);shots.push({event:key,engine_tick:engineTick,
    simulation_tick:simulationTick,png:cv.toDataURL('image/png').split(',')[1]});
  }
 }
};
window.__physicsResult=()=>({frames,states,shots,pose_calls:poseCalls});
}"""


class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_GET(self):
        if self.path=='/favicon.ico':self.send_response(204);self.end_headers()
        else:super().do_GET()


def digest(value):
    return hashlib.sha256(json.dumps(value,separators=(',',':'),sort_keys=True).encode()).hexdigest()


def run_case(browser,url,case,capture=True,images=False):
    errors=[]
    context=browser.new_context(viewport={'width':960,'height':640},device_scale_factor=1,color_scheme='light')
    try:
        page=context.new_page();page.set_default_timeout(10000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        base=datetime(2026,11,3,tzinfo=timezone.utc)
        page.clock.install(time=base);page.clock.pause_at(base+timedelta(seconds=1))
        page.add_init_script(INIT)
        response=page.goto(url)
        if not response or response.status!=200:raise RuntimeError('Source HTTP request failed')
        page.evaluate(INSTALL,dict(slot=case['attacker_slot'],style=case['attacker_style'],
                                  facing=case['facing'],distance=case['distance'],capture=capture,images=images))
        page.clock.run_for(32)
        page.keyboard.down('KeyL');page.clock.run_for(32)
        page.keyboard.press('KeyJ');page.clock.run_for(32)
        page.keyboard.up('KeyL');page.clock.run_for(4000)
        result=page.evaluate('window.__physicsResult()')
        if errors:raise RuntimeError('Browser errors: '+str(errors))
        result['state_sha256']=digest(result['states'])
        result['geometry_sha256']=digest(result['frames']) if capture else None
        result['final']=result['states'][-1]
        return result
    finally:context.close()


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',default='recovered_source/index.html')
    parser.add_argument('--output-dir',required=True)
    parser.add_argument('--browser-executable')
    parser.add_argument('--distances',default='0.85')
    parser.add_argument('--repeat',type=int,default=2)
    parser.add_argument('--check-observer',action='store_true')
    parser.add_argument('--images',action='store_true')
    parser.add_argument('--case-id',action='append',help='Optional exact-case filter for probe diagnostics')
    args=parser.parse_args()
    source=(ROOT/args.source).resolve();out=(ROOT/args.output_dir).resolve()
    if out.exists() and any(out.iterdir()):raise SystemExit('Output must be fresh/empty')
    out.mkdir(parents=True,exist_ok=True)
    before=source.read_bytes();sha=hashlib.sha256(before).hexdigest()
    cases=[dict(id=f'{style}-slot{slot}-face{facing:+d}-gap{distance:g}',attacker_slot=slot,
                attacker_style=style,facing=facing,distance=distance,hp=100,seed=SEED,
                input_schedule='32ms neutral; hold KeyL32ms; real KeyJ press;32ms; release KeyL;4000ms loop',
                input_routing='original S0 keyboard handlers' if slot==0 else
                'fixture routes original press()/held inputs to native S1; update order unchanged')
           for distance in map(float,args.distances.split(','))
           for style in ('back','lunge') for slot in (0,1) for facing in (1,-1)]
    if args.case_id:
        cases=[c for c in cases if c['id'] in args.case_id]
        if len(cases)!=len(set(args.case_id)):raise SystemExit('Unknown/duplicate case filter')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(source.parent)))
    Thread(target=server.serve_forever,daemon=True).start()
    scores=[];failures=[]
    try:
        with sync_playwright() as p:
            launch=dict(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
            if args.browser_executable:launch['executable_path']=args.browser_executable
            browser=p.chromium.launch(**launch);browser_version=browser.version
            try:
                for case in cases:
                    runs=[]
                    for repeat in range(args.repeat):
                        runs.append(run_case(browser,f'http://127.0.0.1:{server.server_port}/{source.name}',case,
                            images=args.images and repeat==0 and case['facing']==1 and
                            ((case['attacker_style']=='back' and case['attacker_slot']==0) or
                             (case['attacker_style']=='lunge' and case['attacker_slot']==1))))
                    primary=runs[0]
                    determinism=all(r['state_sha256']==primary['state_sha256'] and
                                    r['geometry_sha256']==primary['geometry_sha256'] for r in runs)
                    observer=None
                    if args.check_observer:
                        control=run_case(browser,f'http://127.0.0.1:{server.server_port}/{source.name}',case,capture=False)
                        observer=control['state_sha256']==primary['state_sha256'] and control['pose_calls']==primary['pose_calls']
                    if not determinism or observer is False:failures.append(case['id']+': replay/observer mismatch')
                    case_data={**case,'frames':primary['frames']}
                    summary=score_case(case_data)
                    summary.update({'id':case['id'],'replay_deterministic':determinism,
                                    'observer_neutral':observer,'state_sha256':primary['state_sha256'],
                                    'repeat_state_sha256':[r['state_sha256'] for r in runs],
                                    'repeat_geometry_sha256':[r['geometry_sha256'] for r in runs],
                                    'geometry_sha256':primary['geometry_sha256'],'pose_calls':primary['pose_calls']})
                    scores.append(summary)
                    blob=json.dumps({**case_data,'states':primary['states']},separators=(',',':')).encode()
                    (out/(case['id']+'.json.gz')).write_bytes(gzip.compress(blob,mtime=0))
                    shots=[]
                    for shot in primary['shots']:
                        path=case['id']+'-'+shot['event']+'.png'
                        (out/path).write_bytes(base64.b64decode(shot['png']))
                        shots.append({k:v for k,v in shot.items() if k!='png'}|{'path':path})
                    if shots:(out/(case['id']+'-frames.json')).write_text(json.dumps(shots,indent=2)+'\n')
                    print(case['id'],'deterministic='+str(determinism),'observer='+str(observer),flush=True)
            finally:browser.close()
    finally:server.shutdown();server.server_close()
    if source.read_bytes()!=before:failures.append('Source bytes changed')
    result={'schema_version':1,'source':args.source,'source_sha256':sha,'protected_baseline_sha256':BASELINE_SHA,
            'commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip(),
            'runner_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'browser':browser_version,'playwright':version('playwright'),'seed':SEED,'cases':scores,
            'render_scheduler':'Test-side16ms timer drives original RAF callback; engine DT1/60 unchanged',
            'case_count':len(cases),'repeat':args.repeat,'observer_control':args.check_observer,'failures':failures,
            'original_source_unchanged':source.read_bytes()==before,
            'limits':['Kinematic stick/segment proxies, not an articulated rigid-body or anatomical solver.',
                      'S1 keyboard control uses disclosed input-routing fixture; native update ordering is preserved.',
                      'No forced go(), tryHit(), ippon or shoulder binding. No additional pose evaluations.',
                      'Snapshots are per rendered pose; engine and advancing simulation ticks are separately recorded.']}
    (out/'scorecard.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'cases':len(scores),'failures':failures,'source_sha256':sha}),flush=True)
    return bool(failures)


if __name__=='__main__':raise SystemExit(main())
