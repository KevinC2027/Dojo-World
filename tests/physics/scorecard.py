"""Stdlib-only kinematic scorecard for recorded, keyboard-triggered throws.

``score_case(case)`` consumes a trace; it never executes source, calls pose(), or
changes the supplied objects.  Rendered skeleton coordinates are measurements
of presentation geometry, not articulated rigid bodies or collision contacts.
The full per-frame evidence remains in the caller's original trace.
"""

from __future__ import annotations

import math
from collections import defaultdict
from statistics import fmean


SCHEMA_VERSION = 1
JOINTS = ("pel", "neck", "head", "hl", "hr", "el", "er", "kl", "kr", "fl", "fr")
SEGMENTS = {
    "upper_arm_l": ("SL", "el", 0.40),
    "forearm_l": ("el", "hl", 0.40),
    "upper_arm_r": ("SR", "er", 0.40),
    "forearm_r": ("er", "hr", 0.40),
    "thigh_l": ("HL", "kl", 0.62),
    "shin_l": ("kl", "fl", 0.62),
    "thigh_r": ("HR", "kr", 0.62),
    "shin_r": ("kr", "fr", 0.62),
}
HINGES = {"el": ("SL", "el", "hl"), "er": ("SR", "er", "hr"),
          "kl": ("HL", "kl", "fl"), "kr": ("HR", "kr", "fr")}
RADII = {"head": 0.17, "pel": 0.085, "neck": 0.085,
         "hl": 0.065, "hr": 0.065, "el": 0.065, "er": 0.065,
         "kl": 0.075, "kr": 0.075, "fl": 0.075, "fr": 0.075}
SUPPORT_HEIGHT = 0.06
ROOT_LIFT = 0.01
EPS = 1e-9


def _number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _vec(value):
    if isinstance(value, (tuple, list)) and len(value) == 3 and all(_number(x) for x in value):
        return tuple(value)
    return None


def _sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def _dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def _length(a):
    return math.sqrt(_dot(a, a))


def _distance(a, b):
    return _length(_sub(a, b))


def _horizontal_distance(a, b):
    return math.hypot(a[0] - b[0], a[2] - b[2])


def _percentile(sorted_values, fraction):
    if not sorted_values:
        return None
    location = (len(sorted_values) - 1) * fraction
    lo, hi = math.floor(location), math.ceil(location)
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (location - lo)


def distribution(values, *, error_thresholds=False):
    """Finite-value descriptive statistics; percentiles use linear interpolation.

    Optional gt_1mm/gt_1cm counts apply only to metre-valued length errors,
    never angles or velocities. They are diagnostic counts, not acceptance tests.
    """
    data = sorted(x for x in values if _number(x))
    result = {"n": len(data), "min": data[0] if data else None,
            "max": data[-1] if data else None, "mean": fmean(data) if data else None,
            "rms": math.sqrt(fmean(x * x for x in data)) if data else None,
            "p50": _percentile(data, 0.5), "p95": _percentile(data, 0.95),
            "p99": _percentile(data, 0.99)}
    if error_thresholds:
        result.update(gt_1mm=sum(x > 0.001 for x in data), gt_1cm=sum(x > 0.01 for x in data))
    return result


def _event(frame, **extra):
    return {key: frame.get(key) for key in
            ("engine_tick", "simulation_tick", "render_index", "elapsed_ms")} | extra


def _actors(frame):
    return {a.get("slot", i): a for i, a in enumerate(frame.get("actors", []))}


def _local(actor):
    pose = actor.get("local_pose") or {}
    result = {key: _vec(pose.get(key)) for key in JOINTS}
    neck, pelvis = result["neck"], result["pel"]
    rot_s, rot_h = pose.get("rotS", 0), pose.get("rotH", 0)
    if neck and _number(rot_s):
        result["SL"] = (neck[0] + 0.11 * rot_s, neck[1] - 0.05, 0.22 - 0.03 * rot_s)
        result["SR"] = (neck[0] - 0.11 * rot_s, neck[1] - 0.05, -0.22 + 0.03 * rot_s)
    if pelvis and _number(rot_h):
        result["HL"] = (pelvis[0] + 0.04 * rot_h, pelvis[1], pelvis[2] + 0.12 - 0.009 * rot_h)
        result["HR"] = (pelvis[0] - 0.04 * rot_h, pelvis[1], pelvis[2] - 0.12 + 0.009 * rot_h)
    return result


def _world(actor):
    return {key: _vec((actor.get("world") or {}).get(key)) for key in
            (*JOINTS, "SL", "SR", "HL", "HR")}


def _angle(a, b, c):
    first, second = _sub(a, b), _sub(c, b)
    denominator = _length(first) * _length(second)
    if denominator <= EPS:
        return None
    return math.degrees(math.acos(max(-1.0, min(1.0, _dot(first, second) / denominator))))


def _hemisphere(a, b, c):
    """Signed bend relative to cross(root->end, local +Z), not anatomy.

    Return None at a near-straight joint or undefined reference plane. Reference
    changes across an axis singularity may change sign without a physical flip.
    """
    axis = _sub(c, a)
    length = _length(axis)
    if length <= EPS:
        return None
    axis = tuple(x / length for x in axis)
    normal = (axis[1], -axis[0], 0.0)
    norm = _length(normal)
    if norm < 1e-6:
        return None
    offset = _sub(b, a)
    lateral = tuple(offset[i] - axis[i] * _dot(offset, axis) for i in range(3))
    if _length(lateral) < 1e-6:
        return None
    measure = _dot(lateral, normal) / norm
    if abs(measure) < 1e-6:
        return None
    return 1 if measure > 0 else -1


def _point_segment_xz(point, a, b):
    dx, dz = b[0] - a[0], b[2] - a[2]
    denominator = dx * dx + dz * dz
    t = max(0, min(1, ((point[0] - a[0]) * dx + (point[2] - a[2]) * dz) / denominator)) if denominator > EPS else 0
    return math.hypot(point[0] - a[0] - t * dx, point[2] - a[2] - t * dz)


def _unique_samples(frames):
    seen_engine, seen_simulation = set(), set()
    kept, counts = [], {"engine_tick_duplicates": 0, "hitstop_simulation_duplicates": 0,
                        "non_monotonic_engine_ticks": 0, "non_monotonic_simulation_ticks": 0,
                        "simulation_tick_gaps": 0}
    previous = None
    for frame in frames:
        engine, simulation = frame.get("engine_tick"), frame.get("simulation_tick")
        if engine is not None and engine in seen_engine:
            counts["engine_tick_duplicates"] += 1
            continue
        if engine is not None:
            seen_engine.add(engine)
        if simulation is not None and simulation in seen_simulation:
            counts["hitstop_simulation_duplicates"] += 1
            continue
        if simulation is not None:
            seen_simulation.add(simulation)
        if previous is not None:
            for key, count_key in (("engine_tick", "non_monotonic_engine_ticks"),
                                   ("simulation_tick", "non_monotonic_simulation_ticks")):
                now, before = frame.get(key), previous.get(key)
                if _number(now) and _number(before) and now <= before:
                    counts[count_key] += 1
            if _number(simulation) and _number(previous.get("simulation_tick")) and simulation - previous["simulation_tick"] > 1:
                counts["simulation_tick_gaps"] += 1
        kept.append(frame)
        previous = frame
    return kept, counts


def _events(frames, attacker_slot, victim_slot):
    names = ("attack_start", "hit", "carry", "release", "land", "getup", "recovered",
             "first_root_lift", "first_both_feet_unplanted_after_support")
    events = dict.fromkeys(names)
    if not frames:
        return events
    previous_victim, previous_attacker = None, None
    initial_root_y = None
    support_seen = False
    carry_seen = False
    for frame in frames:
        actors = _actors(frame)
        victim, attacker = actors.get(victim_slot, {}), actors.get(attacker_slot, {})
        root = _vec(victim.get("root"))
        if initial_root_y is None and root:
            initial_root_y = root[1]
        if (events["attack_start"] is None and attacker.get("st") == "atk"
                and str(attacker.get("move", "")).upper() in {"T", "THROW"}):
            events["attack_start"] = _event(frame)
        if (events["hit"] is None and attacker.get("hit")
                and not (previous_attacker or {}).get("hit")):
            events["hit"] = _event(frame, victim_hp=victim.get("hp"))
        state, before = victim.get("st"), (previous_victim or {}).get("st")
        for name, condition in (("carry", state == "carry" and before != "carry"),
                                ("release", before == "carry" and state == "air"),
                                ("land", before == "air" and state == "down"),
                                ("getup", before == "down" and state == "getup"),
                                ("recovered", before == "getup" and state == "idle")):
            if condition and events[name] is None:
                events[name] = _event(frame)
        carry_seen |= state == "carry"
        active = events["attack_start"] is not None or carry_seen
        if (active and root and initial_root_y is not None and root[1] > initial_root_y + ROOT_LIFT
                and events["first_root_lift"] is None):
            events["first_root_lift"] = _event(frame, height_above_initial_m=root[1] - initial_root_y)
        world = _world(victim)
        feet = [world[key] for key in ("fl", "fr")]
        if all(feet):
            planted = any(point[1] <= SUPPORT_HEIGHT for point in feet)
            if active and support_seen and not planted and events["first_both_feet_unplanted_after_support"] is None:
                events["first_both_feet_unplanted_after_support"] = _event(frame)
            support_seen |= planted
        previous_victim, previous_attacker = victim, attacker
    return events


def _new_geometry_bucket():
    return {"segments": {name: {"local": [], "world": [], "transform_difference": []} for name in SEGMENTS},
            "joint_steps": {name: [] for name in JOINTS},
            "angles_deg": {name: [] for name in HINGES},
            "bend_hemisphere": {name: {"positive": 0, "negative": 0, "indeterminate": 0,
                                        "sign_changes": 0} for name in HINGES},
            "root_steps": [], "samples": 0}


def _geometry(frames, attacker_slot, victim_slot):
    buckets = defaultdict(lambda: defaultdict(_new_geometry_bucket))
    previous_world, previous_root, previous_sign = {}, {}, {}
    missing_coordinates = defaultdict(int)
    for frame in frames:
        actors = _actors(frame)
        victim_phase = actors.get(victim_slot, {}).get("st", "unknown")
        for slot in (attacker_slot, victim_slot):
            actor = actors.get(slot)
            if actor is None:
                missing_coordinates[f"slot_{slot}_actor"] += 1
                continue
            local, world = _local(actor), _world(actor)
            groups = [buckets[str(slot)]["all"], buckets[str(slot)][victim_phase]]
            for bucket in groups:
                bucket["samples"] += 1
            for name, (a, b, target) in SEGMENTS.items():
                local_length = _distance(local[a], local[b]) if local.get(a) and local.get(b) else None
                world_length = _distance(world[a], world[b]) if world.get(a) and world.get(b) else None
                for bucket in groups:
                    if local_length is not None:
                        bucket["segments"][name]["local"].append(abs(local_length - target))
                    if world_length is not None:
                        bucket["segments"][name]["world"].append(abs(world_length - target))
                    if local_length is not None and world_length is not None:
                        bucket["segments"][name]["transform_difference"].append(abs(world_length - local_length))
            for name in JOINTS:
                point = world.get(name)
                if point is None:
                    missing_coordinates[f"slot_{slot}_world_{name}"] += 1
                prior = previous_world.get((slot, name))
                if prior and point:
                    for bucket in groups:
                        bucket["joint_steps"][name].append(_distance(point, prior))
                previous_world[slot, name] = point
            root = _vec(actor.get("root"))
            if root and previous_root.get(slot):
                for bucket in groups:
                    bucket["root_steps"].append(_distance(root, previous_root[slot]))
            previous_root[slot] = root
            for name, (a, b, c) in HINGES.items():
                angle, sign = None, None
                if local.get(a) and local.get(b) and local.get(c):
                    angle = _angle(local[a], local[b], local[c])
                    sign = _hemisphere(local[a], local[b], local[c])
                changed = sign is not None and previous_sign.get((slot, name)) is not None and sign != previous_sign[slot, name]
                for bucket in groups:
                    if angle is not None:
                        bucket["angles_deg"][name].append(angle)
                    bucket["bend_hemisphere"][name]["positive" if sign == 1 else "negative" if sign == -1 else "indeterminate"] += 1
                    bucket["bend_hemisphere"][name]["sign_changes"] += int(changed)
                previous_sign[slot, name] = sign
    output = {}
    for slot, phases in buckets.items():
        result = {}
        for phase, bucket in phases.items():
            result[phase] = {"n_samples": bucket["samples"],
                             "segments": {name: {"target_m": SEGMENTS[name][2],
                                                  "local_abs_error_m": distribution(data["local"], error_thresholds=True),
                                                  "world_abs_error_m": distribution(data["world"], error_thresholds=True),
                                                  "local_world_length_difference_m": distribution(data["transform_difference"], error_thresholds=True)}
                                          for name, data in bucket["segments"].items()},
                             "joint_step_m": {name: distribution(data) for name, data in bucket["joint_steps"].items()},
                             "root_step_m": distribution(bucket["root_steps"]),
                             "angles_deg": {name: distribution(data) for name, data in bucket["angles_deg"].items()},
                             "bend_hemisphere": bucket["bend_hemisphere"]}
        output[slot] = {"role": "attacker" if int(slot) == attacker_slot else "victim",
                        "by_victim_phase": result}
    return output, dict(missing_coordinates)


def _grip(frames, attacker_slot, victim_slot, events):
    distances, sampled = [], []
    start = events["attack_start"] or events["carry"]
    end = events["release"]
    for frame in frames:
        simulation = frame.get("simulation_tick")
        if start and _number(simulation) and _number(start.get("simulation_tick")) and simulation < start["simulation_tick"]:
            continue
        if end and _number(simulation) and _number(end.get("simulation_tick")) and simulation > end["simulation_tick"]:
            continue
        actors = _actors(frame)
        hand = _world(actors.get(attacker_slot, {})).get("hr")
        pelvis = _world(actors.get(victim_slot, {})).get("pel")
        if hand and pelvis:
            gap = _distance(hand, pelvis)
            distances.append(gap)
            sampled.append((frame, gap))
    thresholds = {}
    lift = events["first_root_lift"]
    foot_lift = events["first_both_feet_unplanted_after_support"]
    for threshold in (0.05, 0.10, 0.15):
        count = 0
        previous_tick = None
        first_crossing, established = None, None
        for frame, distance in sampled:
            tick = frame.get("simulation_tick")
            if distance <= threshold:
                first_crossing = first_crossing or _event(frame)
                count = count + 1 if _number(tick) and _number(previous_tick) and tick == previous_tick + 1 else 1
                if count >= 2 and established is None:
                    established = _event(frame)
            else:
                count = 0
            previous_tick = tick
        def before(event):
            if not established or not event or not _number(established.get("simulation_tick")) or not _number(event.get("simulation_tick")):
                return None
            return established["simulation_tick"] < event["simulation_tick"]
        thresholds[str(threshold)] = {"within_threshold_samples": sum(d <= threshold for _, d in sampled),
                                      "first_crossing": first_crossing,
                                      "established_after_two_consecutive_simulation_ticks": established,
                                      "established_before_root_lift": before(lift),
                                      "established_before_both_feet_unplanted": before(foot_lift),
                                      "root_lift_minus_established_ticks":
                                      lift["simulation_tick"] - established["simulation_tick"]
                                      if established and lift and _number(lift.get("simulation_tick")) and _number(established.get("simulation_tick")) else None}
    return {"definition": "Fixed thrower hr to victim pelvis center; shipped back/lunge early-carry pelvic-grip geometry proxy, not sleeve contact or a physical constraint.",
            "window": "first T attack (or carry) through first carry-to-air release, inclusive",
            "distance_m": distribution(distances), "thresholds_m": thresholds,
            "acceptance_threshold_validated": False}


def _support(frames, slots):
    output = {}
    for slot in slots:
        distance, supported_distance, per_foot = [], [], {}
        no_support = 0
        for foot in ("fl", "fr"):
            steps, drift, previous, anchor = [], [], None, None
            episodes = 0
            for frame in frames:
                point = _world(_actors(frame).get(slot, {})).get(foot)
                if point and point[1] <= SUPPORT_HEIGHT:
                    if anchor is None:
                        anchor = point
                        episodes += 1
                    drift.append(_horizontal_distance(point, anchor))
                    if previous:
                        steps.append(_horizontal_distance(point, previous))
                    previous = point
                else:
                    previous, anchor = None, None
            per_foot[foot] = {"planted_episodes": episodes, "planted_step_xz_m": distribution(steps),
                              "distance_from_episode_anchor_xz_m": distribution(drift)}
        for frame in frames:
            world = _world(_actors(frame).get(slot, {}))
            pelvis, left, right = (world.get(key) for key in ("pel", "fl", "fr"))
            if pelvis and left and right:
                distance.append(_point_segment_xz(pelvis, left, right))
                planted = [p for p in (left, right) if p[1] <= SUPPORT_HEIGHT]
                if len(planted) == 2:
                    supported_distance.append(_point_segment_xz(pelvis, *planted))
                elif len(planted) == 1:
                    supported_distance.append(_horizontal_distance(pelvis, planted[0]))
                else:
                    no_support += 1
        output[str(slot)] = {"pelvis_projection_to_both_feet_segment_xz_m": distribution(distance),
                             "pelvis_projection_to_planted_point_or_segment_xz_m": distribution(supported_distance),
                             "samples_without_planted_foot": no_support, "feet": per_foot}
    return {"definition": "Pelvis projection and foot-center support segment/point, not COM or a support polygon. No mass, foot shape, pressure or force measurement.",
            "planted_center_height_threshold_m": SUPPORT_HEIGHT, "actors": output}


def _clearance(frames, slots, victim_slot, events):
    output = {}
    for slot in slots:
        centers, radial = defaultdict(list), defaultdict(list)
        for frame in frames:
            world = _world(_actors(frame).get(slot, {}))
            for name in JOINTS:
                point = world.get(name)
                if point:
                    centers[name].append(point[1])
                    radial[name].append(point[1] - RADII[name])
        output[str(slot)] = {"joint_center_y_m": {k: distribution(v) for k, v in centers.items()},
                             "assumed_radius_clearance_m": {k: distribution(v) for k, v in radial.items()},
                             "below_plane_samples": {k: sum(x < -EPS for x in v) for k, v in centers.items()},
                             "assumed_radius_below_plane_samples": {k: sum(x < -EPS for x in v) for k, v in radial.items()}}
    liftoff = events["first_both_feet_unplanted_after_support"] or events["first_root_lift"]
    crossings = {"joint_center": None, "assumed_radius": None}
    already_below = {"joint_center": [], "assumed_radius": []}
    previous = None
    for frame in frames:
        world = _world(_actors(frame).get(victim_slot, {}))
        tick = frame.get("simulation_tick")
        after = liftoff is not None and _number(tick) and _number(liftoff.get("simulation_tick")) and tick >= liftoff["simulation_tick"]
        if after:
            at_liftoff = tick == liftoff["simulation_tick"]
            for mode in crossings:
                touched = []
                for name in JOINTS:
                    point = world.get(name)
                    if point is None:
                        continue
                    radius = RADII[name] if mode == "assumed_radius" else 0
                    now = point[1] - radius
                    if at_liftoff and now <= 0:
                        already_below[mode].append(name)
                    before_point = previous.get(name) if previous else None
                    if before_point:
                        before = before_point[1] - radius
                        if before > 0 and now <= 0 and now < before:
                            touched.append({"part": name, "clearance_m": now,
                                            "linear_crossing_fraction_of_interval": before / (before - now)})
                if touched and crossings[mode] is None:
                    crossings[mode] = _event(frame, parts=touched, same_sample_parts_are_tied=True)
        previous = world
    return {"definition": "Signed skeleton joint-center clearance and nominal-radius presentation proxies; no real ground collider. Straight segment minimum y equals its lower endpoint; screen-space Bezier legs/variable depth widths do not exactly match this skeleton proxy.",
            "assumed_radii_m": RADII.copy(), "actors": output,
            "liftoff_reference": liftoff,
            "first_descending_crossing_after_liftoff": crossings,
            "already_at_or_below_plane_at_liftoff": already_below,
            "crossing_time_uncertainty": "Bracketed by adjacent retained simulation samples; fractions assume linear interpolation and do not prove contact order within a frame."}


def _rebound(frames, victim_slot, events, clearance):
    start = events["land"] or clearance["first_descending_crossing_after_liftoff"]["assumed_radius"]
    result = {"reference": start, "reference_kind": "air-to-down state event" if events["land"] else "assumed-radius skeleton crossing proxy",
              "root_vy_m_s": distribution([]), "pelvis_positive_step_m": distribution([]),
              "root_upward_samples": 0, "root_max_rise_from_reference_m": None,
              "pelvis_max_rise_from_reference_m": None,
              "definition": "From landing reference until first getup/recovered state; stored root vy and pose displacement are distinct. No restitution, impulse, energy or physical rebound certification."}
    if start is None:
        return result
    root_vy, pelvis_up = [], []
    initial_root, initial_pelvis = None, None
    previous_pelvis = None
    max_root_rise, max_pelvis_rise = 0.0, 0.0
    for frame in frames:
        tick = frame.get("simulation_tick")
        if not _number(tick) or not _number(start.get("simulation_tick")) or tick < start["simulation_tick"]:
            continue
        actor = _actors(frame).get(victim_slot, {})
        if actor.get("st") in {"getup", "idle"}:
            break
        root, velocity = _vec(actor.get("root")), _vec(actor.get("velocity"))
        pelvis = _world(actor).get("pel")
        if root:
            initial_root = root if initial_root is None else initial_root
            max_root_rise = max(max_root_rise, root[1] - initial_root[1])
        if velocity:
            root_vy.append(velocity[1])
        if pelvis:
            initial_pelvis = pelvis if initial_pelvis is None else initial_pelvis
            max_pelvis_rise = max(max_pelvis_rise, pelvis[1] - initial_pelvis[1])
            if previous_pelvis:
                pelvis_up.append(max(0, pelvis[1] - previous_pelvis[1]))
            previous_pelvis = pelvis
    result.update(root_vy_m_s=distribution(root_vy), pelvis_positive_step_m=distribution(pelvis_up),
                  root_upward_samples=sum(v > 0 for v in root_vy),
                  root_max_rise_from_reference_m=max_root_rise if initial_root is not None else None,
                  pelvis_max_rise_from_reference_m=max_pelvis_rise if initial_pelvis is not None else None)
    return result


def score_case(case):
    """Return a JSON-safe geometry summary for one recorded case, without mutation.

    ``actors[slot].by_victim_phase`` contains ``all`` and victim-state buckets.
    Frame steps crossing a state boundary belong to the new victim-state bucket.
    Event values contain both recorded clocks, or None when not observed.
    """
    original = case.get("frames", [])
    frames, dedup = _unique_samples(original)
    attacker_slot = case.get("attacker_slot", 0)
    victim_slot = 1 - attacker_slot
    events = _events(frames, attacker_slot, victim_slot)
    actors, missing = _geometry(frames, attacker_slot, victim_slot)
    clearance = _clearance(frames, (attacker_slot, victim_slot), victim_slot, events)
    return {
        "schema_version": SCHEMA_VERSION,
        "case": {k: case.get(k) for k in ("id", "attacker_slot", "attacker_style", "facing", "distance", "hp", "seed")},
        "sample_counts": {"recorded_frames": len(original), "dynamic_samples": len(frames), **dedup},
        "missing_coordinates": missing,
        "events": events,
        "event_definitions": {"first_root_lift": "Victim root y exceeds its initial value by >0.01 m during this attack/carry.",
                              "first_both_feet_unplanted_after_support": "Both victim foot centers exceed 0.06 m after an observed supporting foot, during attack/carry.",
                              "land": "Victim state air -> down; an engine state event, not articulated contact.",
                              "recovered": "Victim state getup -> idle; readiness state, not verified balance."},
        "actors": actors,
        "bend_definition": "Local joint offset sign along cross(root-to-end, local +Z). Near-collinear or undefined reference is indeterminate. Sign is not an anatomical flexion/extension certificate; reference singularities can create sign changes.",
        "grip": _grip(frames, attacker_slot, victim_slot, events),
        "support": _support(frames, (attacker_slot, victim_slot)),
        "clearance": clearance,
        "rebound": _rebound(frames, victim_slot, events, clearance),
        "unavailable": ["true center of mass and mass distribution", "ground reaction forces and pressure",
                        "articulated collision/contact impulses", "anatomical joint limits/hyperextension certification",
                        "physical sleeve/grip constraint", "restitution or energy balance", "dynamic balance certification"],
        "limitations": ["Original trace remains authoritative; this summary never calls pose or modifies gameplay.",
                        "Dynamic samples exclude duplicate engine ticks and repeated hitstop simulation ticks; render-only changes during those samples are not included.",
                        "Geometry distributions describe recorded conditions, not population biomechanics; four style/facing cases are not statistical replication.",
                        "Exact shoulder/hip construction matches recorded drawF conventions; missing coordinates reduce counts and must be inspected.",
                        "Stored root velocity can differ from finite-difference rendered pose motion; pose jumps are not impulses.",
                        "No empirical acceptance thresholds are claimed. Grip thresholds and nominal radii are explicit diagnostic assumptions.",
                        "Joint step distances span adjacent retained samples; simulation gaps are counted and must be considered.",
                        "A fixture selecting Blue style in slot 0 is not native Blue slot-1 execution-order coverage."],
    }
