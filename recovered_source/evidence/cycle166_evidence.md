# Cycle 166 evidence — shipped throw-exit elbow step clamp (Phase 1)

Parent: cycle 165 presented-only candidate builds/vf-cycle165-working.html
(sha256 a30ddc4432be97d26defa926b7428f742fc57ae47974b44950e7205719a5f391).
Candidate: builds/vf-cycle166-working.html
(sha256 db5748bf5b8afbcac2517dbc74e2af52918bc14de6ee2b7aacd093209cb02711).
Live build UNCHANGED: prototype/index.html sha256
e9112cf7e30df03b42e0f33f3f6d556985d8438cba4f095f49d2be4433672858.
Rollback checkpoint: live build e9112cf7; parent candidate 165 (a30ddc44);
candidate 166 is ISOLATED and PRESENTED-ONLY — deleting it loses nothing live.

## Problem selected (Phase 1, shipped throws, genuine G+P path)
Cycle 165's disclosed partial: Blue thrower right-elbow step 0.320 m at the
throw-exit blend peak (global tick 36 -> 37, throwExitT 4 -> 5), vs the strict
0.20 m per-joint step gate. Everything else in 165 passed (forearm segments
exactly 0.400 m through the window, both directions).

## Reason first (stated before building)
(1) Weight origin — pelvis/COM/root untouched; only thrower elbows move, only
during idle+throwExit. (2) Support foot — feet, ground contact, touchdown pose
untouched. (3) Force path — landing impact path unchanged; torso, hands, feet,
shoulders untouched; elbows stay on the 0.40/0.40 circle by construction.
(4) Target reach — release tick, launch, flight, landing untouched (hands and
shoulders are inputs, never outputs, of this block). (5) Recovery — the block
fires only in idle+throwExit and rejoins the plain idle IK elbow by window end
(exitT 10, blend weight 1), so no snap at exit; verified: window-end steps
0.023 m (Blue) / 0.033 m (Red), and post-window steps stay within the window max.

## Diagnosis (instrumented scratch copy builds/vf-cycle166-scratch-instr.html)
At the flip tick the thrower right shoulder-hand axis swings ~72 degrees in
one tick (axis (-0.03,-0.89,-0.45) -> (-0.71,0.01,-0.71)) because the blended
hand passes near the shoulder, and the idle IK elbow target swings with it
((1.00,-0.03,0) -> (-0.01,-1.00,0)). Any segment-exact elbow must lie on the
current tick's 0.40/0.40 circle, so the smallest achievable step at that tick
is the distance from the previous elbow to that circle — the closest-point
distance. That is what round 2 implements.

## Change (exactly one appended block after the cycle 165 block, nothing else)
After the 165 direction slerp, when idle+throwExit: for each thrower elbow,
if its step from the previous tick's elbow exceeds 0.20 m, replace it with the
closest point on the current tick's elbow circle to the previous elbow
(center = shoulder + axis*a, radius h, same ARM1/ARM2 construction as the
165 solver; previous elbow stored per fighter/side, reset on a new throwExit
object). Endpoints, shoulders, hands, pelvis, feet, knees untouched.

## Correction rounds (2, within the 3-round limit)
- Round 1 (clamp along the slerp direction, then re-project onto the circle):
  peak 0.320 -> 0.290 m, segments exact. Rejected as insufficient: the
  re-projection step overshoots the cap because the clamped point is not the
  closest circle point.
- Round 2 (closest point on the current circle to the previous elbow):
  peak 0.320 -> 0.260 m, segments exact, trajectory rejoins the slerp path by
  tick 39 (step 0.197 m) and window-end steps are 0.023/0.033 m. KEPT.
- No round 3 used: beating 0.260 m at the flip tick would require moving an
  earlier tick's elbow (lookahead/anticipation) or moving endpoints or breaking
  segments — all outside this cycle's "smallest coherent change" scope. The
  0.260 m figure is the floor for any fix that leaves earlier ticks untouched.

## Measured before/after (diag_cycle166_steps.cjs, live go('T') path at 0.75 m)
- Blue throws Red: window elStep max 0.123 m (unchanged), erStep max
  0.320 -> 0.260 m; forearm deviation 0.000 m both directions (unchanged).
  Tick 36->37 erStep 0.320 -> 0.260 m; tick 37->38 erStep 0.200 -> 0.086 m.
- Red throws Blue: window elStep max 0.148 m, erStep max 0.162 m, forearm
  deviation 0.000 m — all unchanged (no clamp fires for Red).
- Strict 0.20 m step gate: NOT met at the single Blue flip tick (0.260 m).
  Disclosed as a partial, not passed off as a pass.

## Event timing (shipped throws, contact probe on the candidate; identical to 165)
- Blue: hit tick 4, grip established tick 6, release 15, touchdown 36,
  down ends 145. Grip carryMax 0.209 m, atRelease 0.205 m, atLift 0.201 m.
- Red: hit tick 4, grip established tick 7, release 15, touchdown 36,
  down ends 145. Grip carryMax 0.242 m, atRelease 0.148 m, atLift 0.216 m.
- Flight: rigid run 10 ticks, landing angle 56.8 deg at touchdown, 83.4 deg
  at +12 ticks, both directions.

## Tests
- Contact probe (probe_contact_consistency.cjs, 6 runs): all six runs
  BYTE-IDENTICAL to the 165 candidate; diff verdict PROMOTABLE (hard gate),
  no hard change, no new hard kind. Pre-existing hard flags unchanged
  (Blue: victim touchdown step 0.444 m, vic.foreArmL 0.263 m; Red: getup step
  0.756 m, vic.thighR 0.416 m).
- Range (probe_range.js): PASS — connects 1.00/1.15/1.30 m, whiffs 1.40/1.45 m.
- Full match (probe_vf.js): PASS — completes to finalPhase end, min distance
  0.60, overlap 0, hover 0, NaN 0. (AI-match tick counts vary run to run on
  both builds; the pass criteria above are stable.)
- Rapid sequence (probe_rapid_sequence.cjs): PASS — timed chains 4 presses ->
  4 fires; mash 53 -> 7 fires by 6-frame buffer design; ends idle; NaN 0.
- Replay/authority (probe_replay.cjs): PASS — replayOk, authorityOk, gatePass.
- Park fix: PASS — phase!=='fight'&&f.y<-3 present, 1 occurrence.
- Device test: NOT RUN (Kev-gated).

## Trade-offs
- Gain: Blue flip-tick elbow step 0.320 -> 0.260 m; follow-on tick
  0.200 -> 0.086 m; segments stay exact; zero other measured change.
- Cost: none measured — but the strict 0.20 m gate is still missed at one
  tick, so this candidate does NOT fully close the cycle 165 item. It is
  presented as a partial improvement at the provable single-tick floor, and
  the 0.20 m gate itself may need Kev's re-scoping (or a lookahead design)
  before this defect can read as fully closed.
- If this candidate is rejected, cycle 165's candidate stands on its own;
  nothing live changes either way.

## Videos (scripted harness captures of the ISOLATED candidate, NOT the live build)
- files/Street_Dojo_Feature_Cycle166ThrowExitStep_2026-10-31.mp4
  (350 frames @60fps, 5.83 s, 324K)
- files/Street_Dojo_Feature_Cycle166ThrowExitStep_SlowMo_2026-10-31.mp4
  (same 350 frames @15fps ~0.25x, 23.33 s, 515K)
- Script: video_cycle166.cjs (adapted from video_cycle165.cjs); live shipped
  go('T') path at 0.75 m, both directions; NOT device gameplay.
