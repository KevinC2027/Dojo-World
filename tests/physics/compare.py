#!/usr/bin/env python3
"""Fail closed on incomplete evidence or any preregistered physics regression."""
import argparse
from collections import defaultdict
import gzip
import hashlib
import io
import json
import math
from pathlib import Path
import zipfile

from scorecard import SEGMENTS, JOINTS, distribution, _unique_samples

ROOT=Path(__file__).resolve().parents[2]
PROTECTED='786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b'


def distance(a,b):return math.dist(a,b)


def close(a,b,tol=1e-10):
    if isinstance(a,(int,float)) and isinstance(b,(int,float)):
        return math.isfinite(a) and math.isfinite(b) and abs(a-b)<=tol
    if isinstance(a,list) and isinstance(b,list):return len(a)==len(b) and all(close(x,y,tol) for x,y in zip(a,b))
    return a==b


def rows(case):
    result=defaultdict(list)
    frames,_=_unique_samples(case['frames']);previous=None
    for frame in frames:
        phase=frame['actors'][1-case['attacker_slot']]['st']
        for slot,actor in enumerate(frame['actors']):
            w=actor['world']
            for seg,(start,end,length) in SEGMENTS.items():
                result[(slot,phase,'bone',seg)].append(abs(distance(w[start],w[end])-length))
            if previous:
                for joint in JOINTS:
                    result[(slot,phase,'step',joint)].append(distance(w[joint],previous['actors'][slot]['world'][joint]))
        previous=frame
    return result


def verify_reference():
    original=ROOT/'recovered_source'
    parts=sorted((ROOT/'recovery/chunks').glob('part-*.bin'))
    raw=b''.join(p.read_bytes() for p in parts)
    if len(parts)!=14 or hashlib.sha256(raw).hexdigest()!='f19bbd15d963a93f62d4ce44914cf13f4c78e06bd4a481d5a976fc4850038dc6':
        raise ValueError('Protected archive changed')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names=archive.namelist()
        actual={p.relative_to(original).as_posix() for p in original.rglob('*') if p.is_file()}
        if len(names)!=179 or set(names)!=actual or archive.testzip() is not None:raise ValueError('Original inventory/CRC mismatch')
        for name in names:
            if (original/name).read_bytes()!=archive.read(name):raise ValueError('Original bytes changed: '+name)
    manifest=json.loads((original/'SOURCE_MANIFEST.json').read_text())['files']
    if len(manifest)!=178 or any(hashlib.sha256((original/n).read_bytes()).hexdigest()!=h for n,h in manifest.items()):
        raise ValueError('Original manifest mismatch')
    if hashlib.sha256((original/'index.html').read_bytes()).hexdigest()!=PROTECTED:raise ValueError('Protected combat changed')
    return dict(archive_entries=179,manifest_hashes=178,protected_combat_sha256=PROTECTED)


def compare(baseline,candidate):
    before=json.loads((baseline/'scorecard.json').read_text());after=json.loads((candidate/'scorecard.json').read_text())
    expected={f'{style}-slot{slot}-face{face:+d}-gap0.85' for style in ('back','lunge') for slot in (0,1) for face in (1,-1)}
    failures=[];changes=[];cases=[]
    for label,data in [('baseline',before),('candidate',after)]:
        ids=[c['id'] for c in data['cases']]
        if len(ids)!=8 or set(ids)!=expected:failures.append(label+': incomplete/duplicate case matrix')
        if data['failures'] or data['repeat']<2 or not data['observer_control']:failures.append(label+': replay evidence incomplete')
        for c in data['cases']:
            if not c['replay_deterministic'] or not c['observer_neutral']:failures.append(label+': nondeterministic/observer mismatch '+c['id'])
    source_path=ROOT/after['source']
    if hashlib.sha256(source_path.read_bytes()).hexdigest()!=after['source_sha256']:failures.append('Candidate source differs from measured source')
    if before['source_sha256']!=PROTECTED:failures.append('Baseline source not protected source')
    for case_id in sorted(expected):
        a=json.loads(gzip.decompress((baseline/(case_id+'.json.gz')).read_bytes()))
        b=json.loads(gzip.decompress((candidate/(case_id+'.json.gz')).read_bytes()))
        if len(a['frames'])!=len(b['frames']):failures.append(case_id+': frame count differs');continue
        for f,g in zip(a['frames'],b['frames']):
            for key in ('engine_tick','simulation_tick','render_index','phase','tm'):
                if f[key]!=g[key]:failures.append(case_id+': timing/rules changed '+key);break
            for slot,(x,y) in enumerate(zip(f['actors'],g['actors'])):
                for key in ('style','st','t','hp','hit','move','root','velocity','facing'):
                    if not close(x[key],y[key]):failures.append(case_id+': gameplay field changed '+key)
                for joint in (*JOINTS,'SL','SR','HL','HR'):
                    allowed=slot==1-a['attacker_slot'] and x['st']=='carry' and joint in ('el','er','kl','kr')
                    if not allowed and not close(x['world'][joint],y['world'][joint]):failures.append(case_id+': untargeted geometry changed '+joint)
                    if not all(math.isfinite(v) for v in y['world'][joint]):failures.append(case_id+': nonfinite geometry')
        ar,br=rows(a),rows(b)
        for key in ar.keys()|br.keys():
            old,new=ar.get(key,[]),br.get(key,[])
            tol=1e-9 if key[2]=='bone' else 1e-6
            violated=len(old)!=len(new) or any(n>o+tol for o,n in zip(sorted(old),sorted(new)))
            item=dict(case=case_id,slot=key[0],phase=key[1],metric=key[2],part=key[3],
                      baseline=distribution(old),candidate=distribution(new),rankwise_no_worse=not violated,
                      baseline_over_0_2m=sum(v>.2 for v in old),candidate_over_0_2m=sum(v>.2 for v in new))
            changes.append(item)
            if violated:failures.append(case_id+': distribution regression '+str(key))
        victim=1-a['attacker_slot']
        oldmax=max(max(v) for k,v in ar.items() if k[0]==victim and k[1]=='carry' and k[2]=='bone')
        newmax=max(max(v) for k,v in br.items() if k[0]==victim and k[1]=='carry' and k[2]=='bone')
        improved=newmax<=.001 and newmax<oldmax*.5
        if not improved:failures.append(case_id+': material limb-length improvement absent')
        cases.append(dict(id=case_id,baseline_carry_max_error_m=oldmax,candidate_carry_max_error_m=newmax,
                          target_improved=improved))
    return dict(status='FAIL' if failures else 'PASS',candidate_disposition='BLOCKED' if failures else 'PROPOSED',
                source_baseline_sha256=before['source_sha256'],candidate_sha256=after['source_sha256'],
                case_count=len(cases),cases=cases,failures=sorted(set(failures)),distributions=changes,
                gates='Exact game rules/endpoints; every per-case/slot/phase bone-error and joint-step rank no worse; >50% carry-error reduction and <=1mm in all8 cases.',
                limitations='Kinematic proxies, not validated anatomical contacts, real COM or rigid-body impulses. Green smoke tests cannot override physics gate failure.')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--baseline-dir',required=True)
    p.add_argument('--candidate-dir',required=True);p.add_argument('--output-dir',required=True);args=p.parse_args()
    out=Path(args.output_dir);out.mkdir(parents=True,exist_ok=True)
    try:
        integrity=verify_reference();result=compare(Path(args.baseline_dir),Path(args.candidate_dir));result['original_integrity']=integrity
    except Exception as e:result=dict(status='FAIL',candidate_disposition='BLOCKED',failures=[type(e).__name__+': '+str(e)],cases=[])
    (out/'comparison.json').write_text(json.dumps(result,indent=2)+'\n')
    lines=['# Shipped throw comparison','',f'**Physics gate: {result["status"]}; candidate: {result["candidate_disposition"]}.**','',
           '| Case | Baseline carry length error max (m) | Candidate max (m) |','| --- | --- | --- |']
    lines += [f'| {c["id"]} | {c["baseline_carry_max_error_m"]:.9f} | {c["candidate_carry_max_error_m"]:.9g} |' for c in result['cases']]
    lines+=['','## Regressions / blockers','']+['- '+x for x in result['failures']]
    lines+=['','Full unrounded distributions and invariants: comparison.json. Original source remains immutable.','']
    (out/'report.md').write_text('\n'.join(lines));print(json.dumps({k:result[k] for k in ('status','candidate_disposition')}))
    return result['status']!='PASS'


if __name__=='__main__':raise SystemExit(main())
