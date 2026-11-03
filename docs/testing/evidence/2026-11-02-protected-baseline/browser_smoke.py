#!/usr/bin/env python3
"""Controlled browser smoke checks; no source edits, installs or remote access."""
from datetime import datetime, timedelta, timezone
from functools import partial
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import subprocess
from threading import Thread
import traceback

from playwright.sync_api import sync_playwright

ROOT = Path('/workspace/Dojo-World')
SOURCE = ROOT / 'recovered_source/index.html'
OUT = Path(__file__).resolve().parent
EXPECTED = '786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b'
SNAPSHOT = """() => ({phase,pt,tm,round,msg,hs,sweptContact:XIAO_SWEEP,
  fighters:S.map(f=>({x:f.x,y:f.y,z:f.z,hp:f.hp,st:f.st,t:f.t,hit:f.hit,
    wins:f.wins,pc:f.pc,kc:f.kc,pn:f.pn,kn:f.kn,combo:f.combo,chainN:f.chainN,
    aiT:f.aiT,move:f.mv===M.P?'P':f.mv===M.K?'K':f.mv===M.L?'L':f.mv===M.T?'T':null,
    finite:[f.x,f.y,f.z,f.vx,f.vy,f.vz,f.hp].every(Number.isFinite)}))})"""
OBSERVER = """(() => {
  window.__smokeTrace=[];
  function observe(){
    try{if(typeof S!=='undefined')window.__smokeTrace.push((SNAPSHOT)());}catch(e){}
    requestAnimationFrame(observe);
  }
  requestAnimationFrame(observe);
})()""".replace('SNAPSHOT', SNAPSHOT)


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
        else:
            super().do_GET()


class Smoke:
    def __init__(self, page, label, cdp=None):
        self.page, self.label, self.cdp = page, label, cdp
        self.results, self.traces, self.errors, self.console_errors = [], [], [], []
        page.on('pageerror', lambda error: self.errors.append(str(error)))
        page.on('console', lambda message: self.console_errors.append(message.text)
                if message.type == 'error' else None)

    def run(self, ms):
        self.page.clock.run_for(ms)

    def state(self):
        return self.page.evaluate(SNAPSHOT)

    def trace(self):
        return self.page.evaluate('window.__smokeTrace')

    def fixture(self, gap=1.0, guard=False, hp=100, player_hp=100, timer=2700):
        self.page.evaluate("""o=>{
          for(const k of Object.keys(H0))H0[k]=0;
          reset(1);phase='fight';pt=0;tm=o.timer;hs=0;shake=0;cmbT=0;
          S[0].x=-o.gap/2;S[1].x=o.gap/2;S[0].fx=1;S[1].fx=-1;
          S[0].hp=o.player_hp;S[1].hp=o.hp;
          S[1].aiT=1e9;for(const k of Object.keys(S[1].i))S[1].i[k]=0;
          if(o.guard){S[1].st='guard';S[1].i.g=1;}
          cam.yaw=0;cam.mx=0;cam.mz=0;cam.D=11;
          window.__smokeTrace=[];
        }""", dict(gap=gap, guard=guard, hp=hp, player_hp=player_hp, timer=timer))
        self.run(40)

    def screenshot(self, name):
        target = OUT / f'{self.label}-{name}.png'
        self.page.screenshot(path=str(target))
        return target.name

    def check(self, name, function, scope='controlled in-memory fixture; real browser input and original animation loop'):
        try:
            evidence = function()
            item = dict(name=name, status='PASS', scope=scope, evidence=evidence)
        except Exception as exc:
            item = dict(name=name, status='FAIL', scope=scope, error=str(exc),
                        traceback=traceback.format_exc())
            try:
                item['state'] = self.state()
                item['screenshot'] = self.screenshot(name+'-failure')
            except Exception:
                pass
        self.results.append(item)
        try:
            self.traces.append(dict(test=name, frames=self.trace()))
        except Exception:
            pass
        print(f'{self.label}: {name}: {item["status"]}', flush=True)

    def attack(self, move, touch=False):
        if touch:
            if move == 'T':
                g = self.point('g', 0)
                p = self.point('p', 1)
                self.touch('touchStart', [g]); self.run(60)
                self.touch('touchStart', [g, p]); self.run(40)
                self.touch('touchEnd', [g]); self.run(20)
                self.touch('touchEnd', [])
            else:
                key = {'P':'p', 'K':'k', 'L':'pk'}[move]
                self.page.locator(f'button[data-k="{key}"]').tap()
        elif move == 'T':
            self.page.keyboard.down('KeyL'); self.run(60)
            self.page.keyboard.press('KeyJ'); self.run(40)
            self.page.keyboard.up('KeyL')
        else:
            self.page.keyboard.press({'P':'KeyJ', 'K':'KeyK', 'L':'Space'}[move])

    def point(self, key, identity=0):
        box = self.page.locator(f'button[data-k="{key}"]').bounding_box()
        return dict(x=box['x']+box['width']/2, y=box['y']+box['height']/2, id=identity)

    def touch(self, kind, points):
        self.cdp.send('Input.dispatchTouchEvent', dict(type=kind, touchPoints=points))

    def startup(self):
        expect(self.page.title() == 'Dojo World — mobile fighting prototype', 'Unexpected page title')
        initial = self.state()
        self.run(2000)
        state = self.state()
        canvas = self.page.evaluate("""()=>{
          const c=document.querySelector('canvas'),ctx=c.getContext('2d');
          const d=ctx.getImageData(0,0,c.width,c.height).data,colors=new Set();let opaque=0,n=0;
          for(let y=0;y<c.height;y+=Math.max(1,Math.floor(c.height/30)))
          for(let x=0;x<c.width;x+=Math.max(1,Math.floor(c.width/30))){
            const i=(y*c.width+x)*4;colors.add(`${d[i]},${d[i+1]},${d[i+2]}`);opaque+=d[i+3]>0;n++;
          }
          return {width:c.width,height:c.height,colors:colors.size,opaqueFraction:opaque/n};
        }""")
        expect(initial['phase']=='intro' and state['phase']=='fight', 'Intro did not enter fight')
        expect(state['tm'] < 2700, 'Fight timer did not advance')
        expect(canvas['width']>300 and canvas['height']>100 and canvas['colors']>20
               and canvas['opaqueFraction']>.95, 'Canvas did not render a nonblank scene')
        expect(self.page.locator('button[data-k]').count()==8, 'Missing touch controls')
        expect(all(f['finite'] for f in state['fighters']), 'Nonfinite startup state')
        return dict(initial=initial, state=state, canvas=canvas,
                    screenshot=self.screenshot('startup'))

    def natural_ai(self):
        self.page.evaluate('window.__smokeTrace=[]')
        for _ in range(8):
            self.run(1000)
            trace=self.trace()
            if any(t['fighters'][1]['move'] and t['fighters'][1]['st']=='atk' for t in trace):
                break
        trace=self.trace()
        attacks=[t for t in trace if t['fighters'][1]['st']=='atk']
        expect(bool(attacks), 'AI did not attack during the observation window')
        expect(all(all(f['finite'] for f in t['fighters']) for t in trace), 'Nonfinite natural AI state')
        return dict(observed_frames=len(trace), attack_frames=len(attacks), final=self.state())

    def movement(self, touch=False):
        self.fixture(gap=3)
        before=self.state()['fighters'][0]
        if touch:
            self.touch('touchStart',[self.point('r')]);self.run(240);self.touch('touchEnd',[])
        else:
            self.page.keyboard.down('ArrowRight');self.run(240);self.page.keyboard.up('ArrowRight')
        self.run(40);forward=self.state()['fighters'][0]
        expect(forward['x']-before['x']>.2, 'Forward input did not move player')
        if touch:
            self.touch('touchStart',[self.point('l')]);self.run(240);self.touch('touchEnd',[])
        else:
            self.page.keyboard.down('KeyA');self.run(240);self.page.keyboard.up('KeyA')
        self.run(40);back=self.state()['fighters'][0]
        expect(back['x']<forward['x']-.15, 'Back input did not move player')
        z=back['z']
        if touch:
            self.touch('touchStart',[self.point('u')]);self.run(180);self.touch('touchEnd',[])
        else:
            self.page.keyboard.down('ArrowUp');self.run(180);self.page.keyboard.up('ArrowUp')
        self.run(80);side=self.state()['fighters'][0]
        expect(abs(side['z']-z)>.15,'Sidestep input did not change lateral position')
        return dict(before=before,forward=forward,back=back,sidestep=side)

    def guard_input(self, touch=False):
        self.fixture(gap=3)
        if touch:self.touch('touchStart',[self.point('g')])
        else:self.page.keyboard.down('KeyL')
        self.run(100);held=self.state()
        expect(held['fighters'][0]['st']=='guard','Held guard did not enter guard state')
        if touch:self.touch('touchEnd',[])
        else:self.page.keyboard.up('KeyL')
        self.run(100);released=self.state()
        expect(released['fighters'][0]['st']=='idle','Releasing guard did not return to idle')
        return dict(held=held,released=released)

    def attack_hit(self, move, touch=False):
        self.fixture(gap=.85)
        self.attack(move,touch)
        self.run(550)
        trace=self.trace();state=self.state()
        expect(any(t['fighters'][0]['st']=='atk' and t['fighters'][0]['move']==move for t in trace),
               'Requested move did not enter attack state')
        expected={'P':92,'K':86,'L':84,'T':78}[move]
        expect(abs(state['fighters'][1]['hp']-expected)<1e-6,
               f'Expected defender HP {expected}; got {state["fighters"][1]["hp"]}')
        if move=='L':expect(any(t['fighters'][1]['y']>.05 for t in trace),'Launcher did not lift opponent')
        if move=='T':
            states={t['fighters'][1]['st'] for t in trace}
            expect({'carry','air'}.issubset(states),'Throw did not enter carry and air')
        self.run(3000)
        state=self.state()
        expect(state['fighters'][0]['st']=='idle','Attacker did not recover to idle')
        expect(all(f['finite'] for f in state['fighters']),'Nonfinite combat state')
        if move in ('T','L'):
            states={t['fighters'][1]['st'] for t in self.trace()}
            expect({'down','getup','idle'}.issubset(states),'Victim landing/getup/recovery missing')
        return dict(move=move,defender_expected_hp=expected,final=state,
                    victim_states=sorted({t['fighters'][1]['st'] for t in self.trace()}))

    def whiff(self):
        self.fixture(gap=3)
        self.attack('P');self.run(500)
        expect(any(t['fighters'][0]['st']=='atk' for t in self.trace()),'Whiff attack did not start')
        state=self.state()
        expect(state['fighters'][1]['hp']==100 and state['fighters'][0]['hit']==0,
               'Out-of-range punch incorrectly connected')
        return state

    def chip(self):
        self.fixture(gap=.85,guard=True)
        self.attack('P');self.run(500)
        trace=self.trace();state=self.state()
        expect(abs(state['fighters'][1]['hp']-99.2)<1e-6,'Guard did not produce expected chip damage')
        expect(any(t['fighters'][1]['st']=='stun' for t in trace),'No blockstun observed')
        return state

    def chain(self):
        self.fixture(gap=.85)
        self.attack('P');self.run(190);self.attack('K');self.run(550)
        trace=self.trace()
        expect(any(t['fighters'][0]['chainN']>=1 and t['fighters'][0]['move']=='K' for t in trace),
               'Buffered kick did not chain from punch')
        return self.state()

    def round_and_rematch(self, touch=False):
        self.fixture(gap=.85,hp=1)
        self.attack('P',touch);self.run(350)
        ko=self.state()
        expect(ko['phase']=='end' and ko['msg']=='K.O.' and ko['fighters'][1]['hp']==0
               and ko['fighters'][0]['wins']==1,'First KO did not award one round')
        self.run(2750);next_round=self.state()
        expect(next_round['phase']=='intro' and next_round['round']==2
               and [f['hp'] for f in next_round['fighters']]==[100,100]
               and next_round['fighters'][0]['wins']==1,'Normal next-round reset failed')
        self.page.evaluate('S[1].aiT=1e9;for(const k of Object.keys(S[1].i))S[1].i[k]=0')
        self.run(1600)
        self.page.evaluate("""()=>{S[0].x=-.425;S[1].x=.425;S[0].z=S[1].z=0;
          S[0].vx=S[1].vx=S[0].vz=S[1].vz=0;S[1].hp=1;window.__smokeTrace=[];}""")
        self.attack('P',touch);self.run(3300);over=self.state()
        expect(over['phase']=='over' and over['fighters'][0]['wins']==2
               and 'TAP TO REMATCH' in over['msg'],'Two wins did not reach match-over state')
        shot=self.screenshot('match-over')
        if touch:self.page.locator('#c').tap(position=dict(x=100,y=100))
        else:self.page.locator('#c').click(position=dict(x=100,y=100))
        self.run(40);rematch=self.state()
        expect(rematch['phase']=='intro' and rematch['round']==1
               and [f['wins'] for f in rematch['fighters']]==[0,0]
               and [f['hp'] for f in rematch['fighters']]==[100,100]
               and rematch['tm']==2700,'Canvas rematch input did not reset match')
        return dict(first_ko=ko,next_round=next_round,match_over=over,rematch=rematch,screenshot=shot)

    def timeout(self, draw=False):
        self.fixture(gap=3,hp=100 if draw else 70,timer=1)
        self.run(40);state=self.state()
        expect(state['phase']=='end' and state['tm']==0,'Timer did not end round')
        expect(state['msg']==('DRAW' if draw else 'TIME UP'),'Wrong timeout result')
        expect([f['wins'] for f in state['fighters']]==([0,0] if draw else [1,0]),'Incorrect timeout winner')
        return state

    def ringout(self):
        self.fixture(gap=3)
        self.page.evaluate('S[1].x=4.1;S[1].z=0;S[1].vx=S[1].vz=0')
        self.run(1000);state=self.state()
        expect(state['phase']=='end' and state['msg']=='RING OUT!' and state['fighters'][0]['wins']==1,
               'Falling outside ring did not award round')
        return state

    def diagnostics(self):
        expect(not self.errors,'Browser page errors: '+json.dumps(self.errors))
        expect(not self.console_errors,'Browser console errors: '+json.dumps(self.console_errors))
        return dict(page_errors=self.errors,console_errors=self.console_errors)


def main():
    before=SOURCE.read_bytes()
    expect(sha256(before).hexdigest()==EXPECTED,'Incorrect provisional combat source')
    expect(not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Checkout must start clean')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(SOURCE.parent)))
    Thread(target=server.serve_forever,daemon=True).start()
    results=[]
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
                                      args=['--no-sandbox','--disable-dev-shm-usage'])
            version=browser.version
            for label,mobile in [('desktop',False),('mobile-chromium-emulation',True)]:
                context=browser.new_context(viewport=dict(width=390,height=844) if mobile else dict(width=1280,height=800),
                                            device_scale_factor=3 if mobile else 1,
                                            is_mobile=mobile,has_touch=mobile,color_scheme='light')
                page=context.new_page()
                base=datetime(2026,11,3,tzinfo=timezone.utc)
                page.clock.install(time=base)
                page.clock.pause_at(base+timedelta(seconds=1))
                page.add_init_script(OBSERVER)
                smoke=Smoke(page,label,context.new_cdp_session(page) if mobile else None)
                response=page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
                expect(response.status==200,'Game HTTP request failed')
                smoke.check('startup-and-render',smoke.startup,'untouched game startup with browser clock control')
                if not mobile:smoke.check('natural-opponent-ai',smoke.natural_ai,'normal game AI; no state fixture or player attack input')
                smoke.check('movement-and-sidestep',lambda:smoke.movement(mobile))
                smoke.check('guard-hold-release',lambda:smoke.guard_input(mobile))
                for move in ('P','K','L','T'):
                    smoke.check('attack-'+move,lambda move=move:smoke.attack_hit(move,mobile))
                if not mobile:
                    smoke.check('out-of-range-whiff',smoke.whiff)
                    smoke.check('guard-chip-and-blockstun',smoke.chip)
                    smoke.check('buffered-punch-kick-chain',smoke.chain)
                    smoke.check('timeout-win',smoke.timeout,'timer=1 and unequal-HP fixture; ordinary loop resolves timeout')
                    smoke.check('timeout-draw',lambda:smoke.timeout(True),'timer=1 and equal-HP fixture; ordinary loop resolves draw')
                    smoke.check('ring-out',smoke.ringout,'opponent placed just beyond ring; ordinary gravity/loop resolves fall')
                smoke.check('ko-next-round-match-rematch',lambda:smoke.round_and_rematch(mobile),
                            'opponent HP=1 and neutral range fixtures; real attack/canvas inputs; normal round and match timers')
                smoke.check('browser-errors',smoke.diagnostics,'collected across this entire browser profile')
                (OUT/f'{label}-trace.json').write_text(json.dumps(smoke.traces,separators=(',',':'))+'\n')
                results.append(dict(profile=label,tests=smoke.results,page_errors=smoke.errors,console_errors=smoke.console_errors))
                context.close()
            browser.close()
    finally:
        server.shutdown();server.server_close()
    expect(SOURCE.read_bytes()==before,'Source changed during tests')
    expect(not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Checkout changed during tests')
    tests=[t for r in results for t in r['tests']]
    report=dict(commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip(),
                source='recovered_source/index.html',source_sha256=EXPECTED,browser=version,
                passed=sum(t['status']=='PASS' for t in tests),failed=sum(t['status']=='FAIL' for t in tests),
                total=len(tests),profiles=results,source_unchanged=True,git_worktree_clean=True,
                limitations=['Chromium desktop and mobile emulation only; no physical device or WebKit/Safari test.',
                             'Controlled scenarios use disclosed runtime state fixtures and Playwright clock control.',
                             'No full natural match, complete move-variant regression, biomechanics/visual acceptance or Rapier/world integration claim.',
                             'Direct file navigation is blocked by browser policy; unchanged source served by temporary loopback HTTP server.',
                             'No source edits, dependency installs, commits, pushes or merges. Temporary server and browser stopped.'])
    (OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    lines=['# Protected combat browser smoke results','',f'Commit: `{report["commit"]}`',
           f'Source SHA-256: `{EXPECTED}`','',f'**{report["passed"]}/{report["total"]} passed; {report["failed"]} failed.**',
           '',f'Browser: Chromium {version}. No dependency installation.','',
           '| Profile | Check | Result |','| --- | --- | --- |']
    for r in results:
        for t in r['tests']:
            lines.append(f'| {r["profile"]} | {t["name"]} | {t["status"]} |')
            if t['status']=='FAIL':lines.append(f'\nFailure: {t["error"]}\n')
    lines+=['','Source bytes and Git worktree remained unchanged.','',
            'The root protected snapshot has swept P/K contact enabled (`XIAO_SWEEP=1`); the earlier partial prototype differs.',
            '', 'Scope and limitations:', '']+['- '+s for s in report['limitations']]
    lines+=['','Reproduce with the existing Python Playwright and Chromium installations:',
            '', '```sh',f'python3 {Path(__file__).resolve()}','```','',
            'Detailed evidence: results.json and per-profile trace JSON in this directory.',
            'Screenshots: desktop-startup.png and mobile-chromium-emulation-startup.png; match-over captures where successful.','']
    (OUT/'report.md').write_text('\n'.join(lines))
    print(json.dumps({k:report[k] for k in ('passed','failed','total','source_unchanged','git_worktree_clean')}),flush=True)
    return int(report['failed']>0)


if __name__=='__main__':
    raise SystemExit(main())
