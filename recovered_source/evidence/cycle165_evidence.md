# Cycle 165 evidence — shipped throw-exit elbow segment continuity (PRESENTED-ONLY)

Live build (unchanged): e9112cf7e30df03b42e0f33f3f6d556985d8438cba4f095f49d2be4433672858
Candidate (isolated): builds/vf-cycle165-working.html, sha256 a30ddc4432be97d26defa926b7428f742fc57ae47974b44950e7205719a5f391
Rollback checkpoint: live build e9112cf7; candidate is isolated only, live build byte-unchanged (verified after the cycle).

## Event timing (shipped throws, both directions; from the contact probe on the candidate)
- Hit tick 4, release tick 15, touchdown tick 36, down ends ~145, flightDx 1.05 m, inversion 0.
- Grip: Blue carryMax 0.209 m, atRelease 0.205 m; Red carryMax 0.242 m, atRelease 0.148 m — all identical to the live-build baseline.
- HN 0.247 m, PN <= 0.560 m — identical to baseline.
- Thrower idle transition (throwExit blend): thrower returns to idle at global tick 32, blend ticks 33–42 (throwExitT 0–9), rest pose identical at blend end.

## Diagnostics time series (thrower forearm length, elbow step; shipped, live go('T') path at 0.75 m)
Baseline, Blue thrower, throwExit window: forearm R collapses 0.400 -> 0.056 m at tick 36 (victim touchdown tick), forearm L grows to 0.531 m; segment-dev hard flag thr.foreArmR@36 = 0.344 m.
Candidate, same window: forearm L and R exactly 0.400 m at every throwExit tick, both directions.
Baseline, Blue thrower elbow steps in window: max el 0.138 m, er 0.219 m.
Candidate, same window: max el 0.123 m, er 0.320 m (single tick, tick 36 -> 37, exitT 4 -> 5); Red: el 0.148 m, er 0.162 m.
Root cause of the tick-37 step (measured, not assumed): the idle IK elbow target itself jumps at tick 37 — ikEr (0.51,1.44,-0.26) at tick 36 -> (0.08,1.06,-0.27) at tick 37 — because the shoulder–hand distance collapses to ~0.15 m during the blend and the shoulder–hand axis swings from near-vertical to diagonal in one tick, swinging ik2's pole direction with it. The candidate's direction slerp follows that target jump; the baseline position blend damped it to 0.219 m.

## Quantified QA summary
- Contact probe vs live baseline: Blue shipped thr_airDownGetup segment deviation 0.344 -> 0.212 m; all other segByPhase values identical across all six runs (shipped, ippon forced, shoulder informational); maxStep, HN, PN, grip, release, touchdown, flightDx identical everywhere. The diff tool's "NEW HARD vic.foreArmL@8 0.263 m" is an unmasking artifact: vic_carry segment deviation is 0.263 m in BOTH baseline and candidate (it was hidden behind the 0.344 m thrower maximum in the baseline); it is not a new defect.
- Range PASS (connects 1.00/1.15/1.30, whiffs 1.40/1.45). Full-match PASS (completes, min distance 0.60, overlap 0, hover 0, NaN 0). Rapid-sequence PASS (timed chains 4 presses -> 4 fires; mash 53 -> 7 fires by 6-frame buffer design, ends idle, NaN 0). Park-fix line present (1 occurrence).
- Genuine gameplay inputs: YES — shipped scenes use the live go('T') path at 0.75 m, not harness-forced pose tables.

## Correction history (3 rounds, limit reached)
1. ik2Pole re-solve from the blended elbow: segments exact, but elbow step 0.42 m at tick 36 -> 37 (axis-crossing direction flip).
2. Direction slerp (signed-angle rotation around the shoulder–hand axis, smoothstep weight): segments exact, step 0.303 m.
3. Linear direction weight: segments exact, step 0.320 m (proved the step is not the weight profile).
4. Angle-capped stored-direction rotation (0.25 rad/tick): REJECTED — segment deviation returned (0.131 m Blue, 0.112 m Red) and Red elbow steps reached 0.545 m, because the stored direction was not perpendicular to the current tick's axis. Reverted to the round-2 candidate, which is the preserved build above.

## Trade-offs (disclosed, not hidden)
- Target fixed: thrower forearm segments exact through the throw-exit window; thrower phase segment deviation down 0.344 -> 0.212 m.
- Trade-off: one Blue thrower elbow step worsens 0.219 -> 0.320 m at the blend-peak tick, driven by the pre-existing IK-target jump described above. It stays below the run's global maxStep (0.444 m, victim touchdown, unchanged), so the contact probe's global maxStep is unchanged and no new probe hard kind is introduced — but the strict per-joint 0.20 m step gate is NOT met on that tick. This is why the candidate is presented with a PARTIAL step result, not claimed as a full pass.
- Escalation note for the next cycle: do not iterate the throw-exit blend again. The remaining defect is the IK pole swing itself when the shoulder–hand distance is tiny during the blend; that is the next investigation, and it is a separate, narrow problem.

## Videos (scripted harness captures of the ISOLATED CANDIDATE, not the live build, not device gameplay)
- files/Street_Dojo_Feature_Cycle165ThrowExitElbow_2026-10-31.mp4 (350 frames @60fps, 5.83 s, 320K)
- files/Street_Dojo_Feature_Cycle165ThrowExitElbow_SlowMo_2026-10-31.mp4 (same 350 frames @15fps ~0.25x, 23.33 s, 503K)
- Shots: hidden_files/claude-loop/shot-cycle165-cycle165-{idle,blue,red}{grab,spinquarter,position,release,apex,flight,slam,rest}.png
