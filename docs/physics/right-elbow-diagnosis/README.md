# Right-elbow carry-to-air diagnosis — BLOCKED

Resumed Issue #7 / draft PR #8 at `9b784ca886575a14a2c79fb4b27759b491bfb024`. This is a diagnostic checkpoint, with **zero candidate edits and zero repair revisions**. The protected baseline remains SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`. No baseline, gameplay, comparator, thresholds or historical evidence was changed.

## One hypothesis and cause

Hypothesis: extend late-carry pole anticipation to victim right elbow `er`, retaining 0.40/0.40 m segments, saved shoulder/wrist trajectories, and unchanged air geometry. **Rejected before source editing: geometrically infeasible under the current gate.**

Case `back-slot0-face+1-gap0.85`: attacker Red/native slot 0, victim Blue/slot 1, +X, gap 0.85 m. Recorded input: 32ms neutral; hold KeyL 32ms; real KeyJ press; 32ms; release KeyL; 4000ms loop. Release is simulation tick 20 (`carry,t=11` at tick 19 → `air,t=0`).

The carry solver constrains the elbow to the intersection circle of two radius-0.40 m spheres. Its transported pole approaches the current carry IK target. Only `el` receives first-air anticipation in Cycle 2. At release, the back/lunge path switches to authored air IK; the existing `airFrom` blend is ippon-only. The observed air geometry is exactly identical to protected geometry. The changed last-carry elbow therefore changes only the first air-phase step, from 0.011729731305 m to 0.029375425041 m.

Protected last-carry right-arm segments are 0.394997282203 / 0.388254195957 m; Cycle 2 enforces 0.40 / 0.40 m. That correction moves the joint off the protected location. With unchanged endpoints, **no pole choice can restore its small release step**. This is an inter-phase constraint mismatch, not evidence that a different alpha/cache/pole interpolation alone will fix acceptance. The bound below is independent of those choices. The endpoint separation is 0.370775401068 m versus 0.80 m full reach, ruling out a near-full-extension singularity at this boundary.

## Existing measurements and strict gate

| Victim air-phase right-elbow step, m | Protected | Cycle 2 |
| --- | --- | --- |
| Minimum / sorted rank 0 | 0.011729731305 | 0.029375425041 |
| p50 | 0.069059315794 | 0.069059315794 |
| p95 | 0.278660200530 | 0.278660200530 |
| p99 | 0.309770342068 | 0.309770342068 |
| Maximum | 0.317547877452 | 0.317547877452 |
| RMS | 0.127275271258 | 0.127410887093 |

There are 21 advancing air samples. The original comparator rejects **every sorted joint-step rank** greater than protected + 1e-6 m; unchanged summary percentiles do not imply acceptance. Rank 0 alone fails here. All 20 subsequent air steps are unchanged, so the release step must be <= **0.011730731305 m** to retain the protected minimum.

Analytic fixed-length feasibility: center = midpoint(SR,hr), axis = unit(hr-SR), radius = sqrt(0.40² - distance(SR,hr)²/4). Orthogonally project the first-air elbow onto that circle. The globally nearest feasible last-carry elbow is **0.022830137790 m** from the first-air elbow, exceeding the gate bound by **0.011099406485 m**. Projection and independent closed-form point-to-circle distance agree; both segment lengths are checked.

For discrete velocity continuity into unchanged air tick 1, required last carry = 2*air0 - air1. Its distance to the feasible last-carry circle is **0.064018101215 m**, leaving at least **3.841086072877 m/s** mismatch at 60 Hz. Even this velocity goal lies outside the circle. Continuous-time C1 interpolation between samples is not certified by this discrete check.

The force path, load-bearing foot, pelvis/torso lift, grip/endpoints, reach and stance recovery are inherited and untouched. These traces provide joint-center kinematics, not measured COM, pressure, forces or anatomical contact. No new physical-realism claim is made.

## Verification and stop

- Reused two saved matched traces; SHA-256 matches existing Cycle 1/Cycle 2 manifests. See machine-readable `result.json` for source hashes, input, full boundary positions/derivatives and sorted distributions.
- Existing harness `_unique_samples`, `distribution`, and comparator `rows` are reused without modification.
- Exact air world geometry, gameplay fields and right shoulder/wrist equality checked across the selected matched traces. Only this selected case was independently analyzed; no new eight-case acceptance claim.
- Diagnostic command below returns **1**, preserving the saved failure. All diagnostic assertions complete before that deliberate red result. Full eight-case comparator and 25 Chromium smoke checks **UNRUN in this session**. Previous PR #8 results remain historical 8/8, 25/25 and physics FAIL/48.
- Environment started with an empty workspace. Git clone failed: configured proxy port 8080 could not connect. GitHub connector supplied selected saved files for local Python analysis. No dependencies were installed and no proxy bypass attempted.
- Settings → Usage is unavailable; no remaining allowance/reset is claimed. No agents, purchases, merge, deployment, promotion or recurring task.

Reproduce from this checkpoint in a complete checkout:

```sh
python3 tests/physics/right_elbow_feasibility.py --output artifacts/right-elbow-diagnosis/result.json
# Expected exit 1: BLOCKED. Do not invert this into a passing physics gate.
```

**Next single action:** diagnose whether a fixed-endpoint right-elbow handoff that also changes early-air elbow geometry has any feasible path under every existing rankwise bone/step gate in the saved eight cases, before editing a new candidate. That is a new hypothesis for a later explicitly launched task; it was not attempted here. Preserve all gates and protected bytes. No improvement is approved.
