# Combat physics program ledger

## Cycle 1 — deterministic shipped throws and blocked carry-IK experiment

**Disposition: BLOCKED. No verified improvement is delivered or approved.** The immutable recovered source remains byte-exact. Work is isolated on `physics/shipped-throw-cycle-1`, based on program commit `fe22c12`; root `AGENTS.md` and issue #5 explicitly authorize this work. No merge, deployment, expense, world/MMO/Rapier integration or special-move binding occurred.

### Measurement baseline

- Source: `recovered_source/index.html`, SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`.
- Eight conditions: two attacker styles × both native update slots × mirrored ±X facing, at 0.85 m starting separation. Native Red/S0 and Blue/S1 are included. Blue/S1 receives real keyboard events through a disclosed fixture that routes the original `press()`/held-input path to that slot; physics/update ordering is unchanged. This does not claim a native second-player keyboard binding exists.
- Each condition has two full deterministic replays plus a counter-only observer-control run: **all eight replay checks and all eight observer-neutral checks pass**, for baseline and candidate independently. Full actor state (including pose-owned caches), RNG state, event times and pose-call counts match the controls. Rendered geometry is captured from each existing direct `drawF` pose result; no extra `pose()` evaluations are introduced.
- Initial native-RAF clock calibration failed reproducibility and was rejected before candidate editing. The measurement fixture now schedules rendering at a disclosed 16 ms cadence while the original simulation `DT=1/60` remains unchanged. Engine ticks, advancing simulation ticks and rendered frames are separate. This proves fixed-condition repeatability, not frame-rate invariance or biological realism.
- Full unrounded traces, distributions, events and frame captures: [baseline](cycle-1/baseline/), [attempt 2](cycle-1/attempt-2/), [comparison](cycle-1/comparison/report.md).

### Before editing: mechanics and hypothesis

The victim starts grounded. Preserve the authored support-foot positions and stance, root lift, hip/torso path, hand/foot endpoints, hit response and recovery. The current early grab uses a rear-hand-to-victim-pelvis geometry target; it is not an actual sleeve constraint. The engine has no measured masses, ground-reaction forces or articulated contact impulses, so its pelvis/support geometry is a proxy rather than center of mass or a validated force chain.

The proposed narrow change replaces the final Cartesian elbow/knee interpolation during the two shipped carry states with a two-bone constraint solve. Each 0.40 m arm half and 0.62 m leg half should retain length while the bend direction follows a continuous transported pole. Existing load path, roots, endpoints, release speed and timing remain unchanged. This targets limb consistency only; it does not repair or certify kuzushi, grip-before-lift, impact or settling.

### Attempt budget and outcome

1. **Rejected diagnostic shortcut:** nearest-circle projection fixes lengths but the exploratory VM probe reported a knee jump increasing from about 0.379 m to 1.022 m. It was not promoted or counted as real-keyboard acceptance evidence.
2. **Blocked candidate:** `workbench/throw-carry-ik-v1/index.html`, rebuilt from protected bytes by `tests/physics/build_candidate.py`; SHA-256 `39e425f2318debf00743700cfb283a89d875901c02e5e9ba75fdcd1b1e96b930`. Only the shipped carry post-IK joint blend is replaced, with a tick-keyed transported-pole solver. The old ippon/shoulder paths remain separate and unchanged. This file is an archived rejected experiment, not the selected runtime.
3. **Not attempted:** a delegated comparator review hit the account usage limit. Further repair attempts stopped at that budget boundary. The third permitted focused attempt remains unused; no future run is scheduled.

The browser measurements reproduce the historical defect class, with small differences from forced historical probes because real input/guard entry, idle phase and slot ordering differ:

| Representative native condition | Baseline carry max bone error | Candidate carry max bone error |
| --- | --- | --- |
| Red/S0 throws Blue, +X | 0.415782451 m | 3.33e-16 m |
| Blue/S1 throws Red, +X | 0.260878736 m | numerical noise below 1e-15 m |

The length improvement alone is insufficient. For Red/S0 throwing Blue, the candidate raises rear-elbow maximum step **0.092534402 → 0.115291789 m**, left-knee maximum step **0.139413317 → 0.148100312 m**, and right-knee RMS step **0.191562931 → 0.219458492 m**, even though right-knee maximum step decreases **0.377885226 → 0.356245159 m**. The full rankwise per-case/slot/phase comparison rejects **56 continuity distributions**, including release transitions. No measured timing, damage, root, velocity, endpoint or non-carry geometry invariant changed. **Physics gate: FAIL; candidate stays blocked.**

### Tests and limits

- Candidate browser regression: **25/25 PASS**, zero failed/skipped/unrun, with both profiles and no browser errors. [Preserved result](cycle-1/candidate-browser/results.json).
- Candidate and baseline deterministic evidence: 8/8 cases, two repeats and observer-control checks each, PASS.
- Original integrity: all 179 ZIP/extracted bytes, all 178 manifest hashes and protected combat hash PASS.
- Physics comparison: **FAIL, expected for this rejected candidate**, exit 1 with all distributions and reasons retained. Green browser smoke cannot override this failure.
- Dedicated measurements include segment residuals, joint angles and declared bend-side proxies; root-lift/grip timing; pelvis/support and planted-foot slip proxies; signed clearance/descending-ground-crossing proxies; rebound velocity and recovery events. True COM, anatomical hyperextension certification, rigid contact ordering/impulses, sleeve constraints and restitution remain unavailable. The leg renderer is a screen-space curve, so skeleton clearance is not exact rendered-outline collision.
- At the unvalidated 0.10 m pelvic-grip diagnostic threshold, native Red's root lift precedes two-tick grip establishment by **4 simulation ticks**, and native Blue's by **3 ticks**. These are observations of the existing proxy, not proof of physical grip failure or a validated acceptance threshold.
- Gap sweeps, KO sweeps, full natural matches, physical devices, Safari, validated biomechanics and frame-rate invariance were **not run in this cycle**. Existing 25-check controlled KO/hit/guard/whiff cases did pass. The candidate is not accepted, so broader acceptance testing was not expanded after the budget stop.

### Video evidence and hourly request

[Regular-speed gameplay](cycle-1/videos/gameplay-regular-speed.mp4) and [0.25× slow motion](cycle-1/videos/gameplay-slow-motion-0.25x.mp4) show actual canvas frames from real G+P-triggered, controlled Red and Blue throw fixtures. Each baseline sequence is followed by the visibly labeled **BLOCKED CANDIDATE**. Normal duration is 16.4 s; slow duration about 65.58 s. Capture/encoding details, source hashes and host capture time are in [metadata](cycle-1/videos/metadata.json). These are not full natural-match or physical-device videos.

**Hourly capture is NOT configured.** No persistent scheduling/Goal/automation tool is available in this task. A script exists to generate a batch when invoked; this is not a recurring service. No workflow was merged or production schedule activated to bypass review. The active task is stopping at the documented account-usage boundary, so no background hourly promise is made.

### Reproduce

Use the existing Python Playwright/Chromium/ffmpeg installations; no game dependencies or source replacements are required:

```sh
python3 tests/physics/build_candidate.py
python3 tests/physics/record.py --source recovered_source/index.html --output-dir artifacts/physics-baseline --check-observer --images --browser-executable /usr/bin/chromium
python3 tests/physics/record.py --source workbench/throw-carry-ik-v1/index.html --output-dir artifacts/physics-candidate --check-observer --images --browser-executable /usr/bin/chromium
python3 tests/physics/compare.py --baseline-dir artifacts/physics-baseline --candidate-dir artifacts/physics-candidate --output-dir artifacts/physics-comparison
# Comparison intentionally exits 1 for this blocked candidate.
python3 tests/browser_smoke/run.py --source workbench/throw-carry-ik-v1/index.html --output-dir artifacts/candidate-smoke --browser-executable /usr/bin/chromium
python3 tests/physics/video.py --output-dir artifacts/physics-videos --browser-executable /usr/bin/chromium
```

Every output directory should be fresh. Measurement, comparison and video definitions are reviewable under `tests/physics/`. No automatically required merge protection is claimed.

### Continuation queue: next three narrow measured issues

1. **Carry constraints without continuity regression.** Keep the protected endpoints but solve a continuous joint path with constrained velocity/acceleration across carry and release. This cycle demonstrates why minimizing bone error or maximum step alone is insufficient: right-knee RMS worsened. Preserve full distributions and attempt-budget history.
2. **Grip-before-lift semantics.** Validate the actual intended hand/contact anchor and widen the input/idle-phase/range measurement matrix before changing lift timing. Current pelvic proxy establishes after root lift by 3–4 simulation ticks in native conditions; no physical sleeve constraint exists.
3. **Air/recovery continuity and contact proxies.** Both native throws contain about **0.31755 m** rear-elbow air-phase steps; Red's victim also has about **0.21776 m** right-knee getup step. Isolate the exact frame/transition, retain signed head/floor clearances and rebound telemetry, and avoid treating rendered stick proxies as collision truth.

Resume repair only in an active task with available budget. No candidate is owner-approved, merged or deployed.
