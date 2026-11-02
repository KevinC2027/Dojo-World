#!/usr/bin/env python3
"""Merge authorized candidates 159-166 onto live build e9112cf7.

Reconciliation (all verified from diffs before writing):
- 162 (line 370), 163 (lines 207, 340): isolated lines, applied verbatim.
- 166 line 497 already contains 165's change (166 was built on 165), so
  taking 166's line 497 merges 165+166.
- 160 + 161 conflict: both change ikBend's signature (160 adds pole,
  161 adds slew state st,tk) and the single call site (line 501).
  Resolution: unified ikBend(r,e,sd,fw,pole,st,tk) — pole defaults to sd
  (160's semantics), vs uses pole (160), slew cap block (161, verbatim)
  runs after v normalization, guarded by if(st). Call site passes both:
  el pole=1, er pole=lunge?-1:1, plus 161's slew states and reset logic.
  Pole and slew are orthogonal: pole sets the fw=0 endpoint, slew caps
  rotation rate toward it. At fw=1 (down, getup phase 1) vs has zero
  weight, so pole is inert there (160's own note).
- 159 composes: its appended touchdown direction-blend block runs after
  the ikBend calls (uses their outputs + stored air elbows); its air
  remember line is inserted after the rotS/rotH assignment, as in 159.
- Buffer candidate (vf-buffer150-working.html) is NOT included: Kev
  authorized 159-166 only.

Aborts without writing if any expected anchor text is not found exactly.
"""
import sys

BASE = '/home/hatch/workspace/goals/street-dojo-ps5-fighting-game-concept'
LIVE = BASE + '/prototype/index.html'
B = BASE + '/hidden_files/claude-loop/builds'
OUT = B + '/vf-merge-159-166-working.html'


def lines(path):
    with open(path) as f:
        return f.read().split('\n')


def main():
    include = set(sys.argv[1].split(',')) if len(sys.argv) > 1 else {'159','160','161','162','163','165','166'}
    out = sys.argv[2] if len(sys.argv) > 2 else OUT
    live = lines(LIVE)
    c159 = lines(B + '/vf-cycle159-working.html')
    c160 = lines(B + '/vf-cycle160-working.html')
    c161 = lines(B + '/vf-cycle161-working.html')
    c162 = lines(B + '/vf-cycle162-working.html')
    c163 = lines(B + '/vf-cycle163-working.html')
    c166 = lines(B + '/vf-cycle166-working.html')

    # --- anchors (1-based line numbers in each candidate == live, since
    # each candidate's diff vs live is confined to the hunks named) ---
    assert live[496].lstrip().startswith("if(s==='idle'&&f.throwExit)"), 'live 497 anchor'
    assert live[369].lstrip().startswith('if(f.hit)'), 'live 370 anchor'
    assert live[206].lstrip().startswith("if(f.st==='carry')"), 'live 207 anchor'
    assert live[339].lstrip().startswith("if(s==='carry')"), 'live 340 anchor'
    assert live[500].lstrip().startswith("if((s==='down'||s==='getup'))"), 'live 501 anchor'
    assert live[310].startswith('function ikBend(r,e,sd,fw){'), 'live 311 anchor'
    assert c166[496] != live[496] and 'CYCLE165' in c166[496] and 'CYCLE166' in c166[496], '166 line 497 must contain 165+166'
    assert c162[369] != live[369], '162 line 370 must differ'
    assert c163[206] != live[206] and c163[339] != live[339], '163 lines must differ'
    # 161's file is shifted +1 by the slew insertion at line 322, so its
    # down/getup statement sits at line 502, not 501; locate by content.
    stmt161_idx = next(i for i, ln in enumerate(c161)
                       if ln.lstrip().startswith("if((s==='down'||s==='getup'))"))
    # 159's line 501 keeps live's CODE but drops live's trailing ANATOMY
    # comment (verified char-by-char); its appended block starts at the
    # if(s==='down'&&f._airEl marker. The merged line re-attaches the
    # ANATOMY comment (161's version, which also carries the CYCLE161 note)
    # AFTER 159's block, so no code lands after a // comment.
    live_code501 = live[500].split(' // ANATOMY')[0]
    assert c159[500].startswith(live_code501), '159 501 must keep live code'
    m159 = c159[500].index(" if(s==='down'&&f._airEl")
    appended159 = c159[500][m159:]

    # air-remember line + its anchor in 159
    air_line = None
    for i, ln in enumerate(c159):
        if "f._airEl=p.el.slice()" in ln:
            air_line = ln
            air_prev = c159[i - 1]
            break
    assert air_line, '159 air-remember line not found'
    assert air_prev.strip() == 'p.rotS=rotS;p.rotH=rotH;', f'air anchor mismatch: {air_prev[:80]}'
    assert sum(1 for ln in live if ln.strip() == 'p.rotS=rotS;p.rotH=rotH;') == 1, 'rotS anchor not unique'

    # unified ikBend: 160 function text + signature extended + 161 slew line
    i160 = next(i for i, ln in enumerate(c160) if ln.startswith('function ikBend('))
    j160 = next(i for i, ln in enumerate(c160) if ln.startswith('function gaitFoot('))
    func160 = c160[i160:j160]
    assert func160[0].startswith('function ikBend(r,e,sd,fw,pole)'), '160 signature'
    slew = next(ln for ln in c161 if ln.startswith('  if(st){if(st.tk===tk'))
    vnorm = next(i for i, ln in enumerate(func160) if 'v=wl<1e-4?vs:' in ln)
    unified = list(func160)
    unified[0] = func160[0].replace(
        'function ikBend(r,e,sd,fw,pole)',
        'function ikBend(r,e,sd,fw,pole,st,tk)')
    # keep 160's comment lines, add 161's slew description
    unified.insert(1, '  // MERGE 159-166: 161 slew state added (st={tk,dir}, tk="state:tick"); '
                      'caps bend-direction rotation at 0.35 rad/tick; ticks under the cap '
                      'are byte-identical to the uncapped solution.')
    # vnorm index shifts by the inserted comment line
    vnorm2 = next(i for i, ln in enumerate(unified) if 'v=wl<1e-4?vs:' in ln)
    unified.insert(vnorm2 + 1, slew)
    unified_text = '\n'.join(unified)
    assert 'pole=pole===undefined?sd:pole;' in unified_text
    assert 'if(st){if(st.tk===tk' in unified_text

    # merged line 501: 161 statement + pole args + 159 appended block
    stmt161 = c161[stmt161_idx]
    assert "ikBend(SL,p.hl,1,fw,f._bendEl,s+':'+f.t)" in stmt161
    assert "ikBend(SR,p.hr,-1,fw,f._bendEr,s+':'+f.t)" in stmt161
    assert ' // ANATOMY-PORT-J3' in stmt161, '161 must carry ANATOMY comment'
    head161, _, anatomy161 = stmt161.partition(' // ANATOMY-PORT-J3')
    anatomy161 = ' // ANATOMY-PORT-J3' + anatomy161
    stmt = head161.replace(
        "ikBend(SL,p.hl,1,fw,f._bendEl,s+':'+f.t)",
        "ikBend(SL,p.hl,1,fw,1,f._bendEl,s+':'+f.t)")
    stmt = stmt.replace(
        "ikBend(SR,p.hr,-1,fw,f._bendEr,s+':'+f.t)",
        "ikBend(SR,p.hr,-1,fw,f.style==='lunge'?-1:1,f._bendEr,s+':'+f.t)")
    stmt = stmt + appended159 + anatomy161

    # --- assemble bottom-to-top so earlier line numbers stay valid ---
    merged = list(live)
    if '166' in include:
        merged[496] = c166[496]      # 165+166 throwExit line
    elif '165' in include:
        merged[496] = lines(B + '/vf-cycle165-working.html')[496]
    if '162' in include:
        merged[369] = c162[369]      # 162 grip ramp
    if '163' in include:
        merged[339] = c163[339]      # 163 feet lag
        merged[206] = c163[206]      # 163 lift gate
    assert {'159','160','161'} <= include, 'unified elbow block needs 159+160+161'
    merged[500] = stmt               # unified 159+160+161 down/getup line
    # insert air-remember after the rotS line (now shifted by nothing above
    # it except the 501 replacement, which is count-neutral)
    rot_idx = next(i for i, ln in enumerate(merged) if ln.strip() == 'p.rotS=rotS;p.rotH=rotH;')
    merged.insert(rot_idx + 1, air_line)
    # replace ikBend function (live lines 311..gaitFoot) with unified text
    i_live = next(i for i, ln in enumerate(merged) if ln.startswith('function ikBend('))
    j_live = next(i for i, ln in enumerate(merged) if ln.startswith('function gaitFoot('))
    merged[i_live:j_live] = unified_text.split('\n')

    with open(out, 'w') as f:
        f.write('\n'.join(merged))
    print('wrote', out)


if __name__ == '__main__':
    main()
