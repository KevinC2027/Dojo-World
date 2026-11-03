#!/usr/bin/env python3
"""Read saved traces only. Exit 1 preserves the known right-elbow gate failure."""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
from scorecard import _unique_samples, distribution
from compare import rows

ROOT = Path(__file__).resolve().parents[2]
CASE = 'back-slot0-face+1-gap0.85'
INPUTS = {
    'protected': ('docs/physics/cycle-1/baseline', '32d11502adfa8cdd1cb85b8c8dd25c23789d9fd6013af1628921c84081e58527'),
    'cycle2': ('docs/physics/cycle-2/revision-1', '6b551141ba4ca24b607687eda5db641218192c0348ad1e5732d2202b6d3d06ed'),
}


def closest_on_circle(world, goal):
    root, end = world['SR'], world['hr']
    distance = math.dist(root, end)
    assert 0 < distance < .8
    axis = [(x-y)/distance for x, y in zip(end, root)]
    center = [(x+y)/2 for x, y in zip(end, root)]
    radius = math.sqrt(.4**2 - distance**2/4)
    v = [x-y for x, y in zip(goal, center)]
    axial = sum(x*y for x, y in zip(v, axis))
    radial = [x-axial*y for x, y in zip(v, axis)]
    norm = math.hypot(*radial)
    assert norm > 1e-12
    point = [x+radius*y/norm for x, y in zip(center, radial)]
    assert abs(math.dist(point, root)-.4) < 1e-12
    assert abs(math.dist(point, end)-.4) < 1e-12
    # Independent closed-form point-to-circle distance checks the projection.
    residual = math.hypot(axial, norm-radius)
    assert abs(math.dist(point, goal)-residual) < 1e-12
    return dict(goal_m=goal, closest_m=point, minimum_distance_m=residual,
                endpoint_distance_m=distance, radius_m=radius, center_m=center, axis=axis)


def analyze():
    frames, result = {}, {}
    for name, (folder, expected) in INPUTS.items():
        path = ROOT / folder / (CASE+'.json.gz')
        raw = path.read_bytes()
        assert hashlib.sha256(raw).hexdigest() == expected, 'Saved trace changed: '+str(path)
        case = json.loads(gzip.decompress(raw))
        assert case['attacker_slot'] == 0 and case['id'] == CASE
        fs, duplicates = _unique_samples(case['frames'])
        frames[name] = fs
        release = next(i for i in range(1, len(fs)) if fs[i]['actors'][1]['st']=='air'
                       and fs[i-1]['actors'][1]['st']=='carry')
        boundary = []
        for i in range(release-3, release+4):
            f = fs[i]; actor = f['actors'][1]; w = actor['world']
            old, older = [fs[k]['actors'][1]['world'] for k in (i-1, i-2)]
            boundary.append(dict(simulation_tick=f['simulation_tick'], state=actor['st'],
                state_tick=actor['t'], elbow_m=w['er'], shoulder_m=w['SR'], wrist_m=w['hr'],
                step_m=math.dist(w['er'], old['er']),
                velocity_m_per_s=[60*(x-y) for x,y in zip(w['er'],old['er'])],
                acceleration_norm_m_per_s2=3600*math.hypot(*[x-2*y+z for x,y,z in zip(w['er'],old['er'],older['er'])]),
                segment_error_m=[abs(math.dist(w['SR'],w['er'])-.4),abs(math.dist(w['er'],w['hr'])-.4)]))
        steps = rows(case)[(1,'air','step','er')]
        result[name] = dict(trace_sha256=expected, input_schedule=case['input_schedule'],
            duplicate_handling=duplicates, air_step_distribution=distribution(steps),
            sorted_air_steps_m=sorted(steps), boundary_rows=boundary)
    a, b = frames['protected'], frames['cycle2']
    assert len(a) == len(b)
    for old, new in zip(a, b):
        assert old['simulation_tick'] == new['simulation_tick']
        for x,y in zip(old['actors'],new['actors']):
            for key in ('style','st','t','hp','hit','move','root','velocity','facing'):
                assert x[key] == y[key], 'Gameplay mismatch: '+key
        if old['actors'][1]['st']=='air':
            assert old['actors'][1]['world']==new['actors'][1]['world']
        for key in ('SR','hr'):
            assert old['actors'][1]['world'][key]==new['actors'][1]['world'][key]
    r = next(i for i in range(1,len(b)) if b[i]['actors'][1]['st']=='air' and b[i-1]['actors'][1]['st']=='carry')
    carry, air, air1 = [b[i]['actors'][1]['world'] for i in (r-1,r,r+1)]
    position = closest_on_circle(carry, air['er'])
    # Discrete velocity continuity requires last carry = air0 - (air1-air0).
    velocity_goal = [2*x-y for x,y in zip(air['er'],air1['er'])]
    velocity = closest_on_circle(carry, velocity_goal)
    old_steps, new_steps = [result[n]['sorted_air_steps_m'] for n in ('protected','cycle2')]
    violations = [dict(rank=i, baseline_m=o, candidate_m=n) for i,(o,n) in enumerate(zip(old_steps,new_steps)) if n>o+1e-6]
    assert violations and position['minimum_distance_m'] > old_steps[0]+1e-6
    return dict(status='BLOCKED', source_commit='9b784ca886575a14a2c79fb4b27759b491bfb024',
        case=CASE, victim_slot=1, hypothesis='Late-carry right-elbow pole anticipation with fixed endpoints and unchanged air poses',
        decision='Infeasible under the unchanged strict gate; no candidate edit or repair revision',
        definitions='60 Hz kinematic finite differences, not forces or validated anatomical velocities',
        traces=result, air_geometry_identical=True, gameplay_fields_and_right_endpoints_identical=True,
        gate=dict(tolerance_m=1e-6, sorted_step_violations=violations,
                  necessary_release_upper_bound_m=old_steps[0]+1e-6),
        position_feasibility=position, discrete_velocity_feasibility=velocity,
        minimum_velocity_mismatch_m_per_s=60*velocity['minimum_distance_m'],
        new_gameplay_tests='UNRUN: no gameplay change; clone blocked by unavailable configured proxy',
        candidate_versions=0, repair_revisions=0)


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    result=analyze()
    output=Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(result,indent=2)+'\n')
    print('BLOCKED: saved gate reproduced; pole-only minimum',result['position_feasibility']['minimum_distance_m'],
          '> bound',result['gate']['necessary_release_upper_bound_m'])
    raise SystemExit(1)
