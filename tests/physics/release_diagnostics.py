#!/usr/bin/env python3
"""Focused release-elbow diagnostics from existing traces; executes no game."""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
from scorecard import _unique_samples, _angle, distribution

ROOT=Path(__file__).resolve().parents[2]


def read_case(path):return json.loads(gzip.decompress(path.read_bytes()))


def analyze(case):
    frames,_=_unique_samples(case['frames']);slot=1-case['attacker_slot']
    release=next(i for i in range(1,len(frames))
                 if frames[i]['actors'][slot]['st']=='air' and frames[i-1]['actors'][slot]['st']=='carry')
    rows=[];by_phase={}
    for i,f in enumerate(frames):
        if i<2:continue
        actor=f['actors'][slot];w=actor['world']
        old=frames[i-1]['actors'][slot]['world'];older=frames[i-2]['actors'][slot]['world']
        velocity=[60*(w['el'][j]-old['el'][j]) for j in range(3)]
        acceleration=[3600*(w['el'][j]-2*old['el'][j]+older['el'][j]) for j in range(3)]
        angle=_angle(w['SL'],w['el'],w['hl']);previous_angle=_angle(old['SL'],old['el'],old['hl'])
        row=dict(simulation_tick=f['simulation_tick'],engine_tick=f['engine_tick'],state=actor['st'],state_tick=actor['t'],
                 position_m=w['el'],step_m=math.dist(w['el'],old['el']),velocity_m_per_s=velocity,
                 speed_m_per_s=math.hypot(*velocity),acceleration_m_per_s2=acceleration,
                 acceleration_norm_m_per_s2=math.hypot(*acceleration),flexion_angle_deg=angle,
                 flexion_rate_deg_per_s=(angle-previous_angle)*60,
                 upper_arm_error_m=abs(math.dist(w['SL'],w['el'])-.4),forearm_error_m=abs(math.dist(w['el'],w['hl'])-.4))
        rows.append(row)
        phase=by_phase.setdefault(actor['st'],{})
        for metric in ('step_m','speed_m_per_s','acceleration_norm_m_per_s2','flexion_angle_deg','flexion_rate_deg_per_s'):
            phase.setdefault(metric,[]).append(row[metric])
    # A geometric lower bound is diagnostic, not a hand-authored replacement path.
    carry=frames[release-1]['actors'][slot]['world'];air=frames[release]['actors'][slot]['world']
    a,end,goal=carry['SL'],carry['hl'],air['el'];d=math.dist(a,end)
    axis=[(end[j]-a[j])/d for j in range(3)];center=[(a[j]+end[j])/2 for j in range(3)]
    v=[goal[j]-center[j] for j in range(3)];dot=sum(v[j]*axis[j]for j in range(3))
    v=[v[j]-dot*axis[j]for j in range(3)];length=math.hypot(*v);radius=math.sqrt(max(0,.16-d*d/4))
    closest=[center[j]+radius*v[j]/length for j in range(3)]
    return dict(case=case['id'],attacker_slot=case['attacker_slot'],attacker_style=case['attacker_style'],facing=case['facing'],
                release_simulation_tick=frames[release]['simulation_tick'],
                release_step_m=math.dist(air['el'],carry['el']),feasible_last_carry_circle_minimum_step_m=math.dist(closest,goal),
                boundary_rows=[r for r in rows if frames[release]['simulation_tick']-3<=r['simulation_tick']<=frames[release]['simulation_tick']+3],
                phase_distributions={phase:{name:distribution(values) for name,values in metrics.items()}for phase,metrics in by_phase.items()})


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--candidate-dir');p.add_argument('--output',required=True);args=p.parse_args()
    sources={'protected':ROOT/'docs/physics/cycle-1/baseline','cycle1_rejected':ROOT/'docs/physics/cycle-1/attempt-2'}
    if args.candidate_dir:sources['cycle2_candidate']=Path(args.candidate_dir)
    data={tag:[analyze(read_case(path)) for path in sorted(folder.glob('*.json.gz'))]for tag,folder in sources.items()}
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    result=dict(target='First ordered Cycle1 carry-to-air regression: victim left elbow in Red/S0 +X throw.',
                definition='60Hz finite differences of observed world joint centers. Flexion derivative is not full anatomical angular velocity; no mass or force interpretation.',
                diagnosis='Cycle1 handoff targets current carry IK, while the next air pose uses different authored geometry. A changed last-carry joint causes a release-step regression although the air frame itself is unchanged.',
                sources=data,protected_sha256=hashlib.sha256((ROOT/'recovered_source/index.html').read_bytes()).hexdigest())
    output.write_text(json.dumps(result,indent=2)+'\n')
    for name,rows in data.items():
        row=next(r for r in rows if r['case']=='back-slot0-face+1-gap0.85')
        print(name,'release_step_m=',row['release_step_m'])


if __name__=='__main__':main()
