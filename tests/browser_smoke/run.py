#!/usr/bin/env python3
"""Portable 25-check browser regression suite; no gameplay source edits."""
import argparse
from datetime import datetime, timedelta, timezone
from functools import partial
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from importlib.metadata import version as package_version
from pathlib import Path
import subprocess
import sys
from threading import Thread
import traceback
import xml.etree.ElementTree as ET

from gate import EXPECTED_CASES, validate_report

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'recovered_source/index.html'
OUT = ROOT / 'artifacts/browser-smoke'
EXPECTED = '786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b'
SEED = 20261102
PROFILE_SETTINGS = {
    'desktop': dict(viewport=dict(width=1280,height=800),device_scale_factor=1,
                    is_mobile=False,has_touch=False,color_scheme='light'),
    'mobile-chromium-emulation': dict(viewport=dict(width=390,height=844),device_scale_factor=3,
                                     is_mobile=True,has_touch=True,color_scheme='light'),
}
SNAPSHOT = """() => ({phase,pt,tm,round,msg,hs,sweptContact:XIAO_SWEEP,
  fighters:S.map(f=>({x:f.x,y:f.y,z:f.z,hp:f.hp,st:f.st,t:f.t,hit:f.hit,
    wins:f.wins,pc:f.pc,kc:f.kc,pn:f.pn,kn:f.kn,combo:f.combo,chainN:f.chainN,
    aiT:f.aiT,move:f.mv===M.P?'P':f.mv===M.K?'K':f.mv===M.L?'L':f.mv===M.T?'T':null,
    finite:[f.x,f.y,f.z,f.vx,f.vy,f.vz,f.hp].every(Number.isFinite)}))})"""
OBSERVER = """(() => {
  let rng=SMOKE_SEED;
  Math.random=()=>{rng|=0;rng=rng+0x6D2B79F5|0;let t=Math.imul(rng^rng>>>15,1|rng);
    t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
  window.__smokeTrace=[];
  window.__smokeObservationErrors=[];
  function observe(){
    try{if(typeof S!=='undefined')window.__smokeTrace.push((SNAPSHOT)());}
    catch(e){window.__smokeObservationErrors.push(String(e));}
    requestAnimationFrame(observe);
  }
  requestAnimationFrame(observe);
})()""".replace('SNAPSHOT', SNAPSHOT).replace('SMOKE_SEED',str(SEED))


def expect(condition, message):
    if not condition:
        raise AssertionError(message)


def contains_ordered_states(states, expected):
    """Observe each required state after its predecessor, including final idle."""
    i=0
    for state in states:
        if i<len(expected) and state==expected[i]:
            i+=1
    return i==len(expected)


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
        self.active_touches=[]
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
            frames=self.trace()
            expect(bool(frames),'No observation frames captured')
            expect(not self.page.evaluate('window.__smokeObservationErrors'), 'Observer errors occurred')
            expect(all(all(f['finite'] for f in frame['fighters']) for frame in frames),
                   'Nonfinite fighter state observed')
            self.traces.append(dict(test=name,frames=frames))
            item = dict(name=name, status='PASS', scope=scope, evidence=evidence)
        except Exception as exc:
            item = dict(name=name, status='FAIL', scope=scope, error=str(exc),
                        traceback=traceback.format_exc())
            try:
                item['state'] = self.state()
                item['screenshot'] = self.screenshot(name+'-failure')
            except Exception:
                pass
            try:
                self.traces.append(dict(test=name,frames=self.trace()))
            except Exception as trace_error:
                item['trace_error']=str(trace_error)
        finally:
            for key in ('KeyL','KeyJ','KeyK','Space','ArrowRight','KeyA','ArrowUp'):
                try:self.page.keyboard.up(key)
                except Exception:pass
            if self.active_touches:
                try:self.touch('touchEnd',[])
                except Exception:pass
        self.results.append(item)
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
        self.active_touches=points

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
            states=[t['fighters'][1]['st'] for t in self.trace()]
            ordered=['carry','air','down','getup','idle'] if move=='T' else ['air','down','getup','idle']
            expect(contains_ordered_states(states,ordered),'Victim recovery states missing or out of order')
            expect(state['fighters'][1]['st']=='idle','Victim did not finish recovery')
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
        observer_errors=self.page.evaluate('window.__smokeObservationErrors')
        expect(not observer_errors,'Observer errors: '+json.dumps(observer_errors))
        return dict(page_errors=self.errors,console_errors=self.console_errors,observer_errors=observer_errors)



def write_outputs(report, output):
    """Write machine-readable and human-readable evidence even on setup failures."""
    (output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    suites=ET.Element('testsuites',name='Dojo World browser smoke regression')
    junit_tests=0; junit_failures=0; junit_skipped=0
    for profile in report['profiles']:
        tests=profile['tests']
        failures=sum(t['status']=='FAIL' for t in tests)
        skipped=sum(t['status'] in ('SKIP','UNRUN') for t in tests)
        suite=ET.SubElement(suites,'testsuite',name=profile['profile'],tests=str(len(tests)),
                            failures=str(failures),skipped=str(skipped),errors='0')
        for test in tests:
            case=ET.SubElement(suite,'testcase',classname=profile['profile'],name=test['name'])
            properties=ET.SubElement(case,'properties')
            ET.SubElement(properties,'property',name='status',value=test['status'])
            if test['status']=='FAIL':
                failure=ET.SubElement(case,'failure',type='BrowserSmokeFailure',
                                      message=test.get('error','Check failed'))
                failure.text=test.get('traceback',test.get('error','Check failed'))
            elif test['status'] in ('SKIP','UNRUN'):
                ET.SubElement(case,'skipped',type=test['status'],
                              message=f"{test['status']}: {test.get('error','Check did not execute')}")
            elif test['status']!='PASS':
                ET.SubElement(case,'error',type='UnknownResultStatus',message=str(test['status']))
            if test.get('scope'):
                ET.SubElement(case,'system-out').text=test['scope']
        junit_tests+=len(tests);junit_failures+=failures;junit_skipped+=skipped
    # This metadata gate is additional to the 25 browser checks, never a replacement.
    gate=ET.SubElement(suites,'testsuite',name='infrastructure-and-completeness-gate',tests='1',
                       failures='0',skipped='0',errors='1' if report['gate_errors'] else '0')
    case=ET.SubElement(gate,'testcase',classname='runner',name='all-25-checks-and-source-preservation')
    if report['gate_errors']:
        error=ET.SubElement(case,'error',type='RegressionGateFailure',
                            message='; '.join(report['gate_errors']))
        error.text=json.dumps(dict(gate_errors=report['gate_errors'],
                                   infrastructure_errors=report['infrastructure_errors']),indent=2)
    suites.set('tests',str(junit_tests+1));suites.set('failures',str(junit_failures))
    suites.set('skipped',str(junit_skipped));suites.set('errors','1' if report['gate_errors'] else '0')
    ET.indent(suites)
    ET.ElementTree(suites).write(output/'junit.xml',encoding='utf-8',xml_declaration=True)
    lines=['# Dojo World browser smoke regression','',
           f"Checked-out commit: `{report['commit'] or 'unavailable'}`",
           f"Source last-modified commit: `{report['source_last_modified_commit'] or 'unavailable'}`",
           f"Source: `{report['source']}`",
           f"Actual source SHA-256 before: `{report['source_sha256_before'] or 'unavailable'}`",
           f"Actual source SHA-256 after: `{report['source_sha256_after'] or 'unavailable'}`",
           f"Protected October 31 reference SHA-256: `{EXPECTED}`",
           f"Runner SHA-256: `{report['runner_sha256']}`",'',
           f"**Gate: {report['gate_status']}. PASS {report['passed']}; FAIL {report['failed']}; "
           f"SKIP {report['skipped']}; UNRUN {report['unrun']}. Expected browser checks: 25.**",'',
           f"Browser: {report['browser'] or 'not launched'}. Python: {report['python_version'].split()[0]}. "
           f"Playwright: {report['playwright_version'] or 'unavailable'}. Test-side RNG seed: {SEED}.",
           '', '| Profile | Check | Result |','| --- | --- | --- |']
    for profile in report['profiles']:
        for test in profile['tests']:
            lines.append(f"| {profile['profile']} | {test['name']} | {test['status']} |")
    if report['gate_errors']:
        lines+=['','## Gate failures','']+['- '+error for error in report['gate_errors']]
    if report['infrastructure_errors']:
        lines+=['','## Infrastructure failures','']
        for error in report['infrastructure_errors']:
            lines.append(f"- {error['stage']}: {error['message']}")
    failures=[(p['profile'],t) for p in report['profiles'] for t in p['tests'] if t['status']=='FAIL']
    if failures:
        lines+=['','## Failed checks','']
        for profile,test in failures:
            lines.append(f"- {profile}/{test['name']}: {test.get('error','Check failed')}")
    lines+=['',f"Source preservation verified: {report['source_unchanged']}. "
            f"Initial worktree clean: {report['git_worktree_clean_before']}. "
            f"Final worktree clean: {report['git_worktree_clean_after']}.",'',
            'A dirty infrastructure development worktree is recorded, not rejected. '
            'The source byte-preservation gate applies independently.','',
            '## Scope and limitations','']+['- '+line for line in report['limitations']]
    lines+=['','## Artifacts','',
            '- `results.json`: full check results, exact source/runner metadata and infrastructure failures.',
            '- `junit.xml`: 25 browser checks plus one infrastructure/completeness gate; SKIP and UNRUN are labeled distinctly.',
            '- Per-profile trace JSON and available screenshots, including failure captures.',
            '- This output directory was required to be empty before the run; images are never reused from an older run.','']
    (output/'report.md').write_text('\n'.join(lines))


def main():
    from urllib.parse import quote
    global SOURCE,OUT
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir',default=str(OUT),help='Fresh empty artifact directory')
    parser.add_argument('--source',default=str(SOURCE),help='Combat HTML to test (repository-relative or absolute)')
    parser.add_argument('--browser-executable',help='Optional system Chromium; default is the pinned Playwright browser')
    parser.add_argument('--require-source-sha256',help='Optional explicit SHA-256 preflight requirement')
    args=parser.parse_args()
    OUT=Path(args.output_dir).expanduser().resolve()
    SOURCE=Path(args.source).expanduser()
    if not SOURCE.is_absolute():SOURCE=ROOT/SOURCE
    SOURCE=SOURCE.resolve()
    if OUT.exists() and (not OUT.is_dir() or any(OUT.iterdir())):
        parser.error(f'Output directory must be empty; refusing stale artifacts: {OUT}')
    OUT.mkdir(parents=True,exist_ok=True)
    try:source_name=SOURCE.relative_to(ROOT).as_posix()
    except ValueError:source_name=str(SOURCE)
    report=dict(started_at_utc=datetime.now(timezone.utc).isoformat(),commit=None,
                source_last_modified_commit=None,source=source_name,
                protected_baseline_sha256=EXPECTED,source_sha256_before=None,
                source_sha256_after=None,source_sha256=None,source_unchanged=None,
                runner_sha256=sha256(Path(__file__).read_bytes()).hexdigest(),
                python_version=sys.version,playwright_version=None,browser=None,
                browser_executable=args.browser_executable or 'Playwright bundled Chromium',
                required_source_sha256=args.require_source_sha256,
                profile_settings=PROFILE_SETTINGS,seed=SEED,profiles=[],
                infrastructure_errors=[],git_worktree_clean_before=None,
                git_worktree_clean_after=None,
                limitations=[
                    'Chromium desktop and mobile touch emulation only; no physical-device or Safari/WebKit validation.',
                    'Runtime fixtures disclose neutral range, health, timer and AI-freeze preparation. '
                    'Tests use real browser input and the original animation loop, with a fixed test-side RNG seed.',
                    'Clock-stepped checks do not measure real-time frame rate or latency.',
                    'Most controlled attack checks use default human Red; this is not a complete two-fighter move-variant regression.',
                    'No full natural match, biomechanics/animation acceptance, or world/Rapier integration claim.',
                    'The protected baseline hash is a reference; actual candidate source hashes are recorded independently. '
                    'An optional --require-source-sha256 adds an explicit source identity gate.',
                    'The runner edits no game source, installs no dependencies, and performs no Git commits, pushes or merges. '
                    'The temporary loopback server and browser are closed after the run.'])
    for name,names in EXPECTED_CASES.items():
        report['profiles'].append(dict(profile=name,tests=[dict(name=test,status='UNRUN',
            error='Runner did not reach this check') for test in names],page_errors=[],console_errors=[]))

    def infrastructure_error(stage,error):
        report['infrastructure_errors'].append(dict(stage=stage,message=str(error),
                                                   traceback=traceback.format_exc()))

    def git_value(arguments):
        return subprocess.check_output(['git',*arguments],cwd=ROOT,stderr=subprocess.PIPE).decode().strip()

    try:
        report['commit']=git_value(['rev-parse','HEAD'])
        report['git_worktree_clean_before']=not bool(git_value(['status','--porcelain']))
        if not Path(source_name).is_absolute():
            tracked=subprocess.run(['git','ls-files','--error-unmatch','--',source_name],cwd=ROOT,
                                   capture_output=True).returncode==0
            if tracked:
                report['source_last_modified_commit']=git_value(['log','-1','--format=%H','--',source_name]) or None
    except Exception as error:
        infrastructure_error('git-metadata',error)
    try:report['playwright_version']=package_version('playwright')
    except Exception:pass
    before=None;server=None;server_started=False;browser=None
    try:
        before=SOURCE.read_bytes()
        report['source_sha256_before']=sha256(before).hexdigest()
        report['source_sha256']=report['source_sha256_before']
        if args.require_source_sha256:
            expect(report['source_sha256_before']==args.require_source_sha256.lower(),
                   'Actual source SHA-256 does not match --require-source-sha256')
        # Kept inside the reporting boundary: missing dependencies must not leave an empty artifact set.
        from playwright.sync_api import sync_playwright
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(SOURCE.parent)))
        Thread(target=server.serve_forever,daemon=True).start();server_started=True
        with sync_playwright() as p:
            try:
                launch=dict(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
                if args.browser_executable:launch['executable_path']=args.browser_executable
                browser=p.chromium.launch(**launch)
                report['browser']=browser.version
                for profile in report['profiles']:
                    label=profile['profile'];mobile=label=='mobile-chromium-emulation'
                    context=None;page=None;smoke=None
                    try:
                        context=browser.new_context(**PROFILE_SETTINGS[label])
                        page=context.new_page()
                        page.set_default_timeout(10000)
                        page.set_default_navigation_timeout(15000)
                        base=datetime(2026,11,3,tzinfo=timezone.utc)
                        page.clock.install(time=base);page.clock.pause_at(base+timedelta(seconds=1))
                        page.add_init_script(OBSERVER)
                        smoke=Smoke(page,label,context.new_cdp_session(page) if mobile else None)
                        response=page.goto(f'http://127.0.0.1:{server.server_port}/{quote(SOURCE.name)}')
                        expect(response is not None and response.status==200,'Game HTTP request failed')
                        smoke.check('startup-and-render',smoke.startup,
                                    'original game startup; controlled browser clock and fixed test-side RNG seed')
                        if not mobile:
                            smoke.check('natural-opponent-ai',smoke.natural_ai,
                                        'normal game AI logic with fixed test-side RNG seed; no state fixture or player attacks')
                        smoke.check('movement-and-sidestep',lambda:smoke.movement(mobile))
                        smoke.check('guard-hold-release',lambda:smoke.guard_input(mobile))
                        for move in ('P','K','L','T'):
                            smoke.check('attack-'+move,lambda move=move:smoke.attack_hit(move,mobile))
                        if not mobile:
                            smoke.check('out-of-range-whiff',smoke.whiff)
                            smoke.check('guard-chip-and-blockstun',smoke.chip)
                            smoke.check('buffered-punch-kick-chain',smoke.chain)
                            smoke.check('timeout-win',smoke.timeout,
                                        'timer=1 and unequal-HP fixture; ordinary loop resolves timeout')
                            smoke.check('timeout-draw',lambda:smoke.timeout(True),
                                        'timer=1 and equal-HP fixture; ordinary loop resolves draw')
                            smoke.check('ring-out',smoke.ringout,
                                        'opponent beyond ring fixture; ordinary gravity/loop resolves fall')
                        smoke.check('ko-next-round-match-rematch',lambda:smoke.round_and_rematch(mobile),
                                    'opponent HP=1 and neutral range fixtures; real attack/canvas inputs; normal round timers')
                        smoke.check('browser-errors',smoke.diagnostics,'collected across entire browser profile')
                    except Exception as error:
                        infrastructure_error('profile:'+label,error)
                    finally:
                        if smoke is not None:
                            # Preserve duplicates/unknown tests for the fail-closed gate to reject.
                            completed=[]
                            for declared in EXPECTED_CASES[label]:
                                matches=[test for test in smoke.results if test['name']==declared]
                                completed.extend(matches or [dict(name=declared,status='UNRUN',
                                    error='Profile setup/execution failed before this check')])
                            completed.extend(test for test in smoke.results
                                             if test['name'] not in EXPECTED_CASES[label])
                            profile['tests']=completed
                            profile['page_errors']=list(smoke.errors)
                            profile['console_errors']=list(smoke.console_errors)
                        try:
                            traces=smoke.traces if smoke is not None else []
                            (OUT/f'{label}-trace.json').write_text(json.dumps(traces,separators=(',',':'))+'\n')
                        except Exception as error:infrastructure_error('trace-artifact:'+label,error)
                        if page is not None and any(t['status']!='PASS' for t in profile['tests']):
                            try:page.screenshot(path=str(OUT/f'{label}-partial-failure.png'))
                            except Exception:pass
                        if context is not None:
                            try:context.close()
                            except Exception as error:infrastructure_error('context-close:'+label,error)
            finally:
                if browser is not None:
                    try:browser.close()
                    except Exception as error:infrastructure_error('browser-close',error)
    except Exception as error:
        infrastructure_error('setup-or-execution',error)
    finally:
        if server is not None:
            try:
                if server_started:server.shutdown()
                server.server_close()
            except Exception as error:infrastructure_error('server-close',error)
        if before is not None:
            try:
                after=SOURCE.read_bytes();report['source_sha256_after']=sha256(after).hexdigest()
                report['source_unchanged']=after==before
                if not report['source_unchanged']:
                    infrastructure_error('source-preservation',RuntimeError('Source bytes changed during browser checks'))
            except Exception as error:infrastructure_error('source-preservation',error)
        try:report['git_worktree_clean_after']=not bool(git_value(['status','--porcelain']))
        except Exception as error:infrastructure_error('git-metadata-after',error)
    tests=[test for profile in report['profiles'] for test in profile['tests']]
    for status,key in [('PASS','passed'),('FAIL','failed'),('SKIP','skipped'),('UNRUN','unrun')]:
        report[key]=sum(test['status']==status for test in tests)
    report['total']=len(tests)
    report['gate_errors']=validate_report(report)
    report['gate_status']='FAIL' if report['gate_errors'] else 'PASS'
    report['finished_at_utc']=datetime.now(timezone.utc).isoformat()
    write_outputs(report,OUT)
    print(json.dumps({key:report[key] for key in ('gate_status','passed','failed','skipped','unrun','total',
                                                 'source_unchanged')}),flush=True)
    return int(bool(report['gate_errors']))


if __name__=='__main__':
    raise SystemExit(main())
