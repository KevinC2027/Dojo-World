"""Town police test (Step 7 gate).  Usage:
  python3 -I dw2/tools/police.py <build.html> [--seed 7] [--fuzz 40] [--json out.json]
Seeds Math.random and drives the real game with requestAnimationFrame stopped and tick() stepped by hand (60 ticks = 1 s).
Red attacks with the real punch input (press('p')), standing 0.8 m from the townsperson and facing them; officers are the real
HIT_LIFE actors (patrol officers pc1-pc3, the station officers). Checks:
  view       an assault in an officer's view: callout, the fight is broken up, the officer walks over and warns; a second assault in view
             -> walk over, fade, Red in the holding cell (kept inside the bars), the door unlocks by itself after 20 s, Red walks out of
             the cell and out of the station with the joystick
  wall       the same assault with a wall between the officer and Red: nothing; and from inside a Northfield shop with the officer
             on the pavement outside: nothing
  provoked   hits inside a fight that is already on (the first strike was not seen) -> nothing; a dojo / wave foe hit in front of an
             officer -> nothing; the coliseum: nothing counts there
  behind     an officer facing away (6 m) does not see; facing Red he does
  lost       Red slips out of sight after a callout: the response ends by itself
  away       leaving town while jailed releases cleanly
  patrol     each patrol officer walks his beat (distance over 60 s)
  desk       the front desk explains the rules; the cell answers while Red is inside
  fuzz       N random incidents (random officer, victim, timing, fleeing, travel): every response ends, no stuck states
  errors     no HIT_* module errors, no page errors"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
FILE = os.path.abspath(sys.argv[1]); SEED = int(arg('--seed', 7)); OUT = arg('--json'); FUZZ = int(arg('--fuzz', 40))
INIT = ("(()=>{let s=%d>>>0;Math.random=function(){s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}})()" % SEED)

HELP = r'''window.__hold=null; window.__tk=()=>{tick(); const h=window.__hold; if(h){h[0].x=h[1];h[0].z=h[2];h[0].fx=h[3];h[0].fz=h[4];h[0].vx=h[0].vz=0}};
window.__T=(n)=>{for(let i=0;i<n;i++)__tk()};
window.__at=(x,z)=>{const a=S[0];a.x=x;a.z=z;a.vx=a.vz=0;a._lv=null;a._cl=null;H0.ax=H0.az=0;};
window.__P=HIT_POLICE; window.__find=(id)=>crowd.find(n=>n._rec&&n._rec.id===id);
window.__spawn=(id)=>{let n=__find(id); if(n)return n; const r=HIT_LIFE.actors.find(r=>r.id===id); const a=S[0],sx=a.x,sz=a.z; __at(r.x,r.z+1.5); __T(25); n=__find(id); __at(sx,sz); return n};
window.__clean=()=>{__hold=null; __P.reset(); for(const n of crowd)if(n._rec){n.prov=0;n._dwSay=null} lockT=null; H0.ax=H0.az=0; for(const k of['p','k'])try{press(k,0)}catch(e){} };
window.__punch=(v,dx,dz)=>{const a=S[0]; dx=dx===undefined?1:dx; dz=dz||0; const L=Math.hypot(dx,dz); dx/=L; dz/=L; __at(v.x-dx*.8,v.z-dz*.8); a.fx=dx;a.fz=dz; v.vx=v.vz=0;
  for(let w=0;w<400&&!(a.st==='idle'||a.st==='walk');w++)__tk(); __at(v.x-dx*.8,v.z-dz*.8); const hp0=v.hp; for(let k=0;k<8&&v.hp>=hp0-1e-6;k++){for(let w=0;w<200&&!(a.st==='idle'||a.st==='walk');w++)__tk(); if(Math.hypot(v.x-a.x,v.z-a.z)>1.1)__at(v.x-dx*.8,v.z-dz*.8); a.fx=dx;a.fz=dz;press('p',1);__T(3);press('p',0);__T(22)} return v.hp<hp0-1e-6};
window.__steer=(pts,maxT)=>{const a=S[0];let i=0,t=0;for(;t<(maxT||1800)&&i<pts.length;t++){const p=pts[i],dx=p[0]-a.x,dz=p[1]-a.z,d=Math.hypot(dx,dz);if(d<.35){i++;continue}H0.ax=dx/d;H0.az=-dz/d;tick()}H0.ax=H0.az=0;__T(5);return{reached:i>=pts.length,ticks:t,x:+a.x.toFixed(2),z:+a.z.toFixed(2)}};
window.__phases=(n)=>{const seen=[];for(let k=0;k<n;k++){tick();const r=__P.resp,s=__P.state+(r?':'+r.phase:'')+(__P.jail?':'+__P.jail.phase:'');if(seen[seen.length-1]!==s)seen.push(s)}return seen};0'''

async def main():
    out = {'seed': SEED, 'errors': []}
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 430, 'height': 932})
        pg.on('pageerror', lambda e: out['errors'].append(str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('file://' + FILE); await pg.wait_for_function('window.HIT_LIFE&&window.HIT_POLICE&&window.HIT_SHOP', timeout=20000)
        await pg.wait_for_timeout(1500); await pg.evaluate("requestAnimationFrame=()=>0"); await pg.evaluate(HELP)
        E = pg.evaluate
        # ---------- an assault in view: warning, then arrest, cell, release, walk out ----------
        out['view'] = await E(r'''()=>{const o={}; __at(95,-0.8); __T(60); const v=__spawn('b1'), c=__spawn('pc1'); __clean();
            __at(95,-0.8); v.x=95.8; v.z=-0.8; c.x=95; c.z=-8.5; c.fx=0; c.fz=1; c._wi=undefined; __T(1); o.sees=__P.canSee(c);
            o.hit1=__punch(v); o.ev1=__P.events[__P.events.length-1]; o.provAfterHit=v.prov; o.ph1=__phases(900); o.victimCalm=v.prov===0;
            o.warned=__P.log.some(l=>l.ev==='warn'); o.offences=__P.offences.length;
            v.prov=0; c.x=S[0].x; c.z=S[0].z-6; c.fx=0; c.fz=1; v.x=S[0].x+.8; v.z=S[0].z; __T(1); o.sees2=__P.canSee(c); o.hit2=__punch(v); {const seen=[];for(let k=0;k<1500&&!(__P.jail&&__P.jail.phase==='in');k++){tick();const r=__P.resp,st=__P.state+(r?':'+r.phase:'')+(__P.jail?':'+__P.jail.phase:'');if(seen[seen.length-1]!==st)seen.push(st)}o.ph2=seen} const J=__P.jail; o.jailed=!!J&&J.phase==='in'; o.inPolice=HIT_LIFE.insideId(); o.doorShut=__P.door()===0;
            o.tIn=__P.jail&&__P.jail.tIn; o.cellPos=[+S[0].x.toFixed(2),+S[0].z.toFixed(2)];
            // try to walk out while locked: the bars hold
            o.tryOut=__steer([[109.8,6.4]],300); const C=__P.CELL; o.heldIn=S[0].x>=C.x0-1e-6&&S[0].x<=C.x1+1e-6&&S[0].z>=C.z0-1e-6&&S[0].z<=C.z1+1e-6;
            let n=0; while(__P.jail&&n<2000){tick();n++} const lj=__P.log.filter(l=>l.ev==='release').slice(-1)[0]; o.cellTicks=lj?lj.tk-o.tIn:null; o.state=__P.state; o.offencesAfter=__P.offences.length; __T(40); o.doorOpen=__P.door()>1.3;
            o.out=__steer([[109.8,8.1],[109.8,6.4],[106,4.0],[106,1.2],[106,-1.5]],2400); o.outside=HIT_LIFE.insideId()===null&&S[0].z<0;
            o.ok=o.sees&&o.hit1&&o.ev1&&o.ev1.seen==='pc1'&&o.ph1.join()==='alert:call,alert:walk,alert:talk,patrol'&&o.victimCalm&&o.warned&&o.offences===1&&o.hit2&&o.jailed&&o.inPolice==='police'&&o.doorShut&&o.heldIn
              &&o.cellTicks===1200&&o.ph2.join().indexOf('arrest:call,arrest:walk,arrest:cuff,jail:fade')===0&&o.state==='patrol'&&o.offencesAfter===0&&o.doorOpen&&o.out.reached&&o.outside; return o}''')
        # ---------- behind a wall ----------
        out['wall'] = await E(r'''()=>{const o={}; __clean();
            const s=WORLD.solids.find(s=>{const w=s.x1-s.x0,d=s.z1-s.z0;return Math.min(w,d)<=.7&&Math.max(w,d)>=6&&s.h>1&&s.x0>70&&s.x1<120&&s.z0>-10&&s.z1<30});
            if(!s){o.ok=false;o.why='no wall';return o} const thinX=(s.x1-s.x0)<(s.z1-s.z0), cx=(s.x0+s.x1)/2, cz=(s.z0+s.z1)/2, hw=thinX?(s.x1-s.x0)/2:(s.z1-s.z0)/2;
            o.wall=[s.x0,s.x1,s.z0,s.z1].map(v=>+v.toFixed(1)); __at(cx,cz-3); __T(30); const v=__spawn('b1'), c=__spawn('pc1'); __clean();
            const off=hw+1.6; let rx,rz,cxp,czp,vx,vz;
            if(thinX){rx=cx-off;rz=cz;cxp=cx+off;czp=cz;vx=rx;vz=rz+.8}else{rx=cx;rz=cz-off;cxp=cx;czp=cz+off;vx=rx+.8;vz=rz}
            __at(rx,rz); v.x=vx; v.z=vz; c.x=cxp; c.z=czp; const dl=Math.hypot(rx-cxp,rz-czp); c.fx=(rx-cxp)/dl; c.fz=(rz-czp)/dl; __hold=[c,cxp,czp,c.fx,c.fz]; __T(1);
            o.dist=+dl.toFixed(2); o.wallBetween=wallBetween(c.x,c.z,S[0].x,S[0].z); o.sees=__P.canSee(c);
            const e0=__P.events.length; o.hit=__punch(v,vx-rx,vz-rz); __hold=null; c.x=cxp; c.z=czp; o.ev=__P.events.slice(e0); o.ph=__phases(300); o.offences=__P.offences.length;
            // control: the same geometry on the officer's own side of the wall -> he responds
            __clean(); v.prov=0; __T(60); const ex=thinX?cxp+.2:cxp+.0, ez=thinX?czp:czp+.2; __at(ex+(thinX?1.5:0),ez+(thinX?0:1.5)); v.x=S[0].x+(thinX?0:.8); v.z=S[0].z+(thinX?.8:0); c.x=cxp; c.z=czp;
            const d2=Math.hypot(S[0].x-c.x,S[0].z-c.z)||1; c.fx=(S[0].x-c.x)/d2; c.fz=(S[0].z-c.z)/d2; __hold=[c,c.x,c.z,c.fx,c.fz]; __T(1); o.ctrlSees=__P.canSee(c); const e1=__P.events.length; o.ctrlHit=__punch(v,v.x-S[0].x,v.z-S[0].z); __hold=null; o.ctrlEv=__P.events.slice(e1); o.ctrlState=__P.state;
            o.ok=o.wallBetween&&!o.sees&&o.dist<5&&o.hit&&o.ev.length>=1&&o.ev.every(e=>e.seen===null)&&o.ph.join()==='patrol'&&o.offences===0&&o.ctrlSees&&o.ctrlHit&&o.ctrlEv.length&&o.ctrlEv[0].seen==='pc1'&&o.ctrlState!=='patrol';
            __clean(); return o}''')
        out['shopWindow'] = await E(r'''()=>{const o={}; __clean(); __at(-24,96); __T(40); const c=__spawn('pc2'), v=__spawn('clk_gs'); __clean(); if(!c||!v){o.ok=false;o.why='spawn';return o}
            // Red inside the general store with the clerk; the patrol officer on the pavement right outside, facing the shop
            __at(-24,91.2); __T(20); o.inside=HIT_LIFE.insideId(); v.x=-23.2; v.z=91.2; c.x=-24; c.z=95.3; c.fx=0; c.fz=-1; __T(1); o.dist=+Math.hypot(c.x-S[0].x,c.z-S[0].z).toFixed(2);
            o.sees=__P.canSee(c); const e0=__P.events.length; o.hit=__punch(v); o.ev=__P.events.slice(e0); o.ph=__phases(300);
            o.ok=!!o.inside&&!o.sees&&o.hit&&o.ev.length&&o.ev.every(e=>e.seen===null)&&o.ph.join()==='patrol'; v.prov=0; __clean(); return o}''')
        # ---------- provoked fights and foes never count ----------
        out['provoked'] = await E(r'''()=>{const o={}; __clean(); __at(95,-0.8); __T(30); const v=__spawn('b1'), c=__spawn('pc1'); __clean();
            __at(95,-0.8); v.x=95.8; v.z=-0.8; c.x=89; c.z=-0.8; c.fx=-1; c.fz=0; __T(1); o.seesFirst=__P.canSee(c);   // 6 m behind Red, facing away
            const e0=__P.events.length; o.hit1=__punch(v); o.firstSeen=__P.events[e0]&&__P.events[e0].seen; c.fx=1; c.fz=0; c.x=89; c.z=-0.8; __T(1); o.seesNow=__P.canSee(c); o.prov=v.prov;
            const h0=__P.hits; for(let k=0;k<3;k++){v.prov=1; c.x=89; c.z=-0.8; c.fx=1; c.fz=0; __punch(v)} o.moreHits=__P.hits-h0; o.ph=__phases(300); o.offences=__P.offences.length; v.prov=0;
            // a dojo / wave foe (not a townsperson) hit right in front of an officer
            __clean(); let f=crowd.find(n=>n!==S[0]&&!n._rec&&n.hp>0); o.foe=!!f;
            if(f){ const fx0=f.x,fz0=f.z; v.x=95; v.z=-20; __at(95,-0.8); f.x=95.8; f.z=-0.8; f.prov=0; c.x=95; c.z=-6; c.fx=0; c.fz=1; __T(1); o.seesFoe=__P.canSee(c); const e1=__P.events.length; o.foeInfo=[f.ck,f.st,f.hp,+f.y.toFixed(2)]; o.foeHit=__punch(f); o.foeInfo2=[f.st,f.hp,S[0].st,+S[0].x.toFixed(2),+f.x.toFixed(2)]; o.foeEv=__P.events.length-e1; o.foeState=__phases(200).join(); f.prov=0; f.x=fx0; f.z=fz0; }
            // the coliseum: nothing is judged there
            __clean(); HIT_TRAVEL.jump('sky'); o.sky=HIT_SKY.on; const e2=__P.events.length; const t=S[1]; if(t){__punch(t)} o.skyEv=__P.events.length-e2; o.skyState=__P.state; HIT_TRAVEL.jump('town'); __T(30); o.back=!HIT_SKY.on;
            o.ok=!o.seesFirst&&o.hit1&&o.firstSeen===null&&o.seesNow&&o.moreHits>=1&&o.ph.join()==='patrol'&&o.offences===0&&(!o.foe||(o.seesFoe&&o.foeHit&&o.foeEv===0&&o.foeState==='patrol'))&&o.sky&&o.skyEv===0&&o.skyState==='patrol'&&o.back;
            __clean(); return o}''')
        # ---------- lost: Red slips away after the callout ----------
        out['lost'] = await E(r'''()=>{const o={}; __clean(); __at(95,-0.8); __T(30); const v=__spawn('b1'), c=__spawn('pc1'); __clean();
            __at(95,-0.8); v.x=95.8; v.z=-0.8; c.x=95; c.z=-12; c.fx=0; c.fz=1; __T(1); o.hit=__punch(v); o.state1=__P.state;
            __at(70,14); __T(5); o.seesAfter=__P.canSee(c); let n=0; while(__P.resp&&n<2400){tick();n++} o.endTicks=n; o.end=__P.log.filter(l=>l.ev==='end').slice(-1)[0];
            o.ok=o.hit&&o.state1==='alert'&&!o.seesAfter&&n<2400&&o.end&&(o.end.why==='lost'||o.end.why==='timeout')&&__P.state==='patrol'; __clean(); return o}''')
        # ---------- leaving town while jailed ----------
        out['away'] = await E(r'''()=>{const o={}; __clean(); __at(95,-0.8); __T(30); const v=__spawn('b1'), c=__spawn('pc1'); __clean();
            __at(95,-0.8); v.x=95.8; v.z=-0.8; c.x=95; c.z=-4; c.fx=0; c.fz=1; __T(1); __punch(v); __T(400); v.prov=0; __at(95,-0.8); v.x=95.8; v.z=-0.8; c.x=95; c.z=-3; c.fx=0; c.fz=1; __punch(v);
            let n=0; while(!(__P.jail&&__P.jail.phase==='in')&&n<900){tick();n++} o.jailed=!!__P.jail; HIT_TRAVEL.jump('sky'); __T(5); o.jailSky=!!__P.jail; o.state=__P.state; HIT_TRAVEL.jump('town'); __T(30); o.back=!HIT_SKY.on;
            o.ok=o.jailed&&!o.jailSky&&o.state==='patrol'&&o.back; __clean(); return o}''')
        # ---------- patrols ----------
        out['patrol'] = await E(r'''()=>{const o={}; for(const [id,px,pz] of [['pc1',95,24],['pc2',-20,93.8],['pc3',24,93.8]]){ __clean(); __at(px,pz); __T(30); const c=__spawn(id); if(!c){o[id]=null;continue}
            __at(px,pz-0.01); let d=0,lx=c.x,lz=c.z; for(let k=0;k<3600;k++){tick(); __at(px,pz); d+=Math.hypot(c.x-lx,c.z-lz); lx=c.x; lz=c.z} o[id]=+d.toFixed(1)}
            o.ok=['pc1','pc2','pc3'].every(k=>o[k]>25); return o}''')
        # ---------- the desk and the cell ----------
        out['desk'] = await E(r'''()=>{const o={lines:[]}; __clean(); for(let k=0;k<4;k++){ACT.policeDesk(); o.lines.push(String(HIT_POLICE.lastSay).slice(0,200))}
            o.rules=o.lines.filter(l=>/warning|cell|Sparring/.test(l)).length; ACT.cell(); o.cellFree=String(msg).slice(0,60);
            o.ok=o.rules>=3&&/empty cell/.test(o.cellFree); return o}''')
        # ---------- fuzz: random incidents, every response ends ----------
        out['fuzz'] = await E(r'''(N)=>{const o={runs:N,stuck:0,arrests:0,warns:0,jailsReleased:0,notSeen:0,bad:[]}; const R=Math.random;
            const spots={pc1:[[95,-0.8,'b1'],[80,10,'b2'],[105,26.5,'b3']],pc2:[[-24,95.3,'clk_gs'],[-12,95.3,'res_nf_s2']],pc3:[[24,95.3,'res_nf_s4'],[12,95.3,'baker_in']]};
            for(let k=0;k<N;k++){ __clean(); const cid=['pc1','pc2','pc3'][Math.floor(R()*3)], sp=spots[cid][Math.floor(R()*spots[cid].length)];
              __at(sp[0],sp[1]); __T(30); const c=__spawn(cid); let v=__spawn(sp[2]); if(!v||v.hp<=0||(v._rec.room))v=crowd.find(n=>n._rec&&!n._rec.room&&!n._rec.cop&&n.hp>0); if(!c||!v){o.bad.push([k,'spawn']);continue}
              __clean(); const ang=R()*6.283, dd=2+R()*16; __at(sp[0],sp[1]); v.x=sp[0]+.8; v.z=sp[1]; c.x=sp[0]+Math.cos(ang)*dd; c.z=sp[1]+Math.sin(ang)*dd; const f=R()<.7; const dl=Math.hypot(S[0].x-c.x,S[0].z-c.z)||1; c.fx=f?(S[0].x-c.x)/dl:-(S[0].x-c.x)/dl; c.fz=f?(S[0].z-c.z)/dl:-(S[0].z-c.z)/dl;
              const hits=1+Math.floor(R()*3); for(let h=0;h<hits;h++){ if(R()<.5)v.prov=0; __punch(v); __T(Math.floor(R()*500)); if(R()<.15){__at(sp[0]+(R()-.5)*60,sp[1]+(R()-.5)*30)} if(R()<.05){HIT_TRAVEL.jump('sky');__T(30);HIT_TRAVEL.jump('town');__T(30)} }
              let n=0; while((__P.resp||__P.jail)&&n<3600){tick();n++}
              const a=S[0]; if(__P.resp||__P.jail||!isFinite(a.x)||!isFinite(a.z)||!isFinite(c.x)){o.stuck++;o.bad.push([k,__P.state,__P.resp&&__P.resp.phase])}
              o.arrests=__P.log.filter(l=>l.ev==='jail').length; o.jailsReleased=__P.log.filter(l=>l.ev==='release').length; o.warns+=0; if(v)v.prov=0; }
            o.events=__P.events.length; o.ok=o.stuck===0&&o.bad.filter(b=>b[1]!=='spawn').length===0&&!__P.error; return o}''', FUZZ)
        out['moduleErrors'] = await E("()=>{const m={};for(const k of Object.keys(window))if(/^HIT_/.test(k)&&window[k]&&typeof window[k]==='object'&&window[k].error)m[k]=String(window[k].error).slice(0,200);return m}")
        out['log'] = await E("()=>HIT_POLICE.log.slice(-30)")
        await b.close()
    keys = ['view', 'wall', 'shopWindow', 'provoked', 'lost', 'away', 'patrol', 'desk', 'fuzz']
    s = out['summary'] = {k: bool(out[k] and out[k].get('ok')) for k in keys}
    s['pageErrors'] = len(out['errors']); s['moduleErrors'] = out['moduleErrors']
    s['PASS'] = all(s[k] for k in keys) and not s['pageErrors'] and not s['moduleErrors']
    print(json.dumps(s, indent=1))
    if OUT: open(OUT, 'w').write(json.dumps(out, indent=1))
asyncio.run(main())
