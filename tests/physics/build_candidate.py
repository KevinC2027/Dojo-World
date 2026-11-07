#!/usr/bin/env python3
"""Rebuild the isolated carry-IK candidate from the exact protected baseline."""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASELINE = ROOT / 'recovered_source/index.html'
DIRECTORY = ROOT / 'workbench/throw-carry-ik-v1'
EXPECTED = '786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b'
ANCHOR = b'const THROW_PHASES={'
ORIGINAL = b"  if(s==='carry'&&f.carryFrom){for(const j of['el','er','kl','kr']){const a=f.carryFrom[j],bb=p[j],kk=(f.throwStyle==='ippon'&&j==='er')?carryKArm:carryK;p[j]=[a[0]+(bb[0]-a[0])*kk,a[1]+(bb[1]-a[1])*kk,a[2]+(bb[2]-a[2])*kk]}}"
REPLACEMENT = (b"  if(s==='carry'&&f.carryFrom&&(f.throwStyle==='lunge'||f.throwStyle==='back')){solveCarriedJoints(f,p,{SL,SR,HL,HR},carryK);}else " + ORIGINAL.strip())


def main():
    source = BASELINE.read_bytes()
    if sha256(source).hexdigest() != EXPECTED:
        raise SystemExit('Protected source hash mismatch; refusing candidate build')
    if source.count(ANCHOR) != 1 or source.count(ORIGINAL) != 1:
        raise SystemExit('Expected bounded insertion/replacement sites are ambiguous')
    # The complete helper is embedded so the candidate remains standalone HTML.
    helper = (DIRECTORY / 'solver.js').read_bytes()
    candidate = source.replace(ANCHOR, helper + b'\n' + ANCHOR, 1).replace(ORIGINAL, REPLACEMENT, 1)
    target = DIRECTORY / 'index.html'
    target.write_bytes(candidate)
    if BASELINE.read_bytes() != source:
        raise SystemExit('Protected source changed during candidate build')
    print('baseline_sha256=' + EXPECTED)
    print('solver_sha256=' + sha256(helper).hexdigest())
    print('candidate_sha256=' + sha256(candidate).hexdigest())
    print('candidate=' + str(target))


if __name__ == '__main__':
    main()
