# Independent Movement Qualification — Gate Before Movesets

**Status: NOT YET QUALIFIED.** A working two-bone visual rig and repeatable diagnostic scenarios do not establish biomechanical realism.

## Executable demonstrations

Open `movement-review.html` from the same hosted directory as `src/`, `hit-fuji.svg` and `hit-visual.css`. Choose Blue or Red, then one of seven independent 60 Hz scenarios: idle, forward, backward, lateral, reverse direction, stop, and guard. The stationary other fighter is 30 m away and never provides training input. The page uses real `CombatWorld.step()` snapshots and the shared `fighterRig()` presentation function, not a fabricated animation clip.

`src/movement-qualification.mjs` computes quantitative metrics for all 14 cases. `test/movement-qualification.test.mjs` validates deterministic playback, finite joint coordinates, fixed segment lengths and no foot penetration; explicit root travel checks accompany locomotion scenarios. See `test/hit-rig.test.mjs` for attack phase joint constraints.

## Acceptance criteria — all must pass, for BOTH characters

| Test | Minimum acceptance gate |
|---|---|
| Standing and guard | No drifting world-space root; stable weight and no discontinuous jumps on entry/exit |
| Forward/backward/lateral walking | Alternating planted/swung feet; grounded ankle drift ideally <= 12 mm per 60 Hz frame, measured in world coordinates |
| Stop and reverse | Recover balance without stance snapping; realistic acceleration and deceleration |
| Joint reach | Upper-arm, forearm, thigh and shin segment lengths never vary > 1 mm |
| Joint continuity | Reject obvious teleports and elbow/knee pole reversals; flag world-space joints > 0.20 m per tick for inspection, not automatic biomechanical approval |
| Foot-floor contact | Zero observable penetration; support foot actually stays planted while weight transfers |
| Visual signoff | Side-on and three-quarter playback for each scenario reviewed at full speed and slow motion by the creator |

These are prototype screening targets, not research-derived biomechanical validation thresholds. Full naturalness requires skeletal hierarchy, body balance and ground reaction integration; this diagnostic currently uses a simplified procedural presentation rig.

## Sequencing rule

**DO NOT add or expand combat movesets until the independent-movement gate is established and visually approved.** Fix and rerun locomotion defects first. Once approved: implement and review one basic hand strike per fighter, then basic kicks, then complete ordinary movesets, then believable multi-move exchanges, and only then throws/special moves. Existing six clean-room moves stay available for regression but do not count as newly approved animations.

## Observed concerns to investigate

1. Foot swing is driven by elapsed time and instantaneous speed, not a persistent planted-foot world-space target. Skating is plausible and must be measured; do not assert that it is already fixed.
2. Torso twist is small and is not yet driven by feet, pelvis and shoulder force transfer.
3. Statelesness of current `fighterRig()` means stop/reverse transitions may snap or phase-slip.
4. The current mesh is a simple solid silhouette, not true character anatomy or mocap.
5. CI and browser playback for these new cases must be independently checked before stating any numerical test result passed.

## Hourly evidence protocol

Each hour report the 14-case qualification matrix (pass/fail/unverified), identified movement defect, actual file/commit changes, the latest verified CI result, and a captured short actual engine replay clip if available. If recording unavailable, provide the review URL or reproducible instructions, without inventing a clip or pretending visual acceptance.
