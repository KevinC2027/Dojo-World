# Cycle 167 evidence — 163 knee-regression fix attempt (Phase 1, BLOCKED/escalated)

Live build UNCHANGED: prototype/index.html sha256
786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b
(Kev-authorized no-163 merge, 2026-10-31 ~16:30 CT). No candidate is presented
this cycle; no promotion, no state refresh, no staging commit.

## Problem selected (Phase 1, shipped throws, genuine G+P path)
The held cycle-163 candidate (lift gate + feet lag) was never promoted because
its victim right-knee (kr) steps regressed vs live, despite real grip gains.
This cycle's objective was to keep 163's gains while removing those regressions.

## Reason first (stated before building)
(1) Weight origin — victim weight initially on own feet; thrower hips/legs lift
through the grip, not a root yank before contact. (2) Support foot — victim
feet stay planted until grip is secured, then lift with the throw. (3) Force
path — thrower grip -> victim pelvis/torso -> lift through hips; knee is a
pure IK intermediate between hip and foot (ik2, LEG1=LEG2=0.62, pole -1), so
its world step is fully determined by hip/foot endpoints. (4) Target reach —
grip <=0.20 m before feet leave. (5) Recovery — release tick 15, touchdown
36, flight 21 ticks, all untouched by every variant below.

## Reproduction on current live (163-on-live, 3 edits only)
Base: builds/vf-cycle167-163onlive.html (sha ea3a92da, not kept as candidate).
Edits vs live 786ac6bf: (1) update() carry root lift uuL=(t-3)/7 for non-ippon;
(2) pose() carry shipped feet lag smoothstep((uu-0.20)/0.80); (3) pose() kk uses
carryKFeet for fl/fr in all styles (ippon feet still its own uF curve).
Contact probe (probe_all_defects.cjs, 6 runs) reproduces the 163 hold exactly:
- Blue: grip at lift 0.119 -> 0 m, feet tick 5 -> 7, liftAfterStable 0 -> +2,
  kr@12 0.278 -> 0.326 m, new kr@13 0.235 m.
- Red: feet tick 5 -> 7, liftAfterStable -2 -> -1, grip at lift 0.216 -> 0.228 m
  (small regression on this one value), segment dev thighR 0.416 -> shinR
  0.348 m (improved, different joint), kr@11 0.336 -> 0.476 m, new kr@12
  0.381 m.
- Ippon forced runs: BYTE-IDENTICAL to live. Flight ticks 21, apex 0.88 both.
Diagnosis (diag_cycle167_knee.cjs, per-tick hip/knee/foot world positions):
the 163 lift bell is steeper than live (peak root-Y increment 0.128 m/tick vs
0.089) because delaying lift 3 ticks while still completing it by tick 10
compresses the same vertical travel; the victim knee's vertical travel is
compressed into the same window, so the knee — an IK intermediate — swings
faster at global ticks 11-13 (vicT 8-10), when the authored carry foot is
already swinging forward/up. The knee snap is in the authored carry
trajectory's hip/foot endpoints at those ticks, not in any single endpoint
value.

## Correction rounds (3, the cycle limit — then stop, per procedure)
- Round 1 (lift slowdown, variants v8/v9): uuL denominator 7 -> 8 and 9
  (full lift at tick 11/12, still before release at 15). v8: Red grip at lift
  0.228 -> 0.123 m, feet tick 7 -> 8, liftAfterStable -1 -> 0; Blue unchanged
  (grip 0, feet 7, +2). Knee peak barely moved: Blue 0.326 -> 0.336 m, Red
  0.476 -> 0.469 m (v8) / 0.460 m (v9). Flight, apex, ippon identical.
  Conclusion: lift rate is NOT the main knee driver. v8 kept as the measured
  grip-side variant (builds/vf-cycle167-v8.html); v9 in builds/vf-cycle167-v9.html.
- Round 2 (segment-exact knee clamp, on v8): shipped-carry only, victim kr
  replaced by the closest point on the current 0.62/0.62 hip-foot circle to
  the previous tick's knee when the ik2 step would exceed 0.20 m (cycle-166
  pattern, hip/foot endpoints untouched, ippon/shoulder excluded). Carry
  result: Blue kr@12 0.336 -> 0.223 m, @13 gone; Red kr@10 0.295 -> 0.226 m,
  @11/@12 gone; segment dev unchanged (0.263 / 0.348). BUT it creates a
  release snap the clamp cannot see: Blue kr@15 (first air tick) 0.415 m,
  Red kr@15 0.808 m — the clamped knee lags the true IK knee, and the air
  pose starts from the true knee. This is a regression worse than the
  defect it fixes. REJECTED.
- Round 3 (fade rejoin, on the clamp): clamp weight 1 through vicT 8, fading
  to 0 over vicT 9-11 so the last carry tick is true IK. Result: Blue returns
  to v8 values (clamp effectively off at the peak ticks); Red gets WORSE —
  kr@12 0.486 m, kr@13 0.549 m, because the faded knee lags, then the fade
  itself adds catch-up travel on top of the true peak travel. REJECTED.
  Saved as builds/vf-cycle167-fade.html (sha a8ab2bc2) for the record only.

## Why this is a blocker, not a fourth round
The authored carry trajectory moves the victim knee >0.20 m/tick for three
consecutive ticks (Red vicT 8-10) and the release pose is fixed. Any per-tick
knee-position fix that rejoins the true trajectory by release must put the
deferred travel back somewhere inside the same fixed window — clamp alone
puts it at release (0.808 m snap), fade puts it at the fade ticks (0.549 m).
Beating the gate honestly requires changing the trajectory itself: re-time
or re-author the carry hip/foot targets in the vicT 7-10 window, or move the
release/lift timing — both are gameplay/timing changes, not a smallest
coherent correction, and both need Kev's creative call. That is a directive
§6 escalation: anatomical correction vs approved gameplay, and repeated
attempts failing to produce improvement. The validated live build is
preserved byte-identical.

## Measured before/after (contact probe, shipped runs)
Live 786ac6bf vs best grip variant v8 (NOT presented — knee still regressed):
- Blue: feet 5 -> 7, liftAfterStable 0 -> +2, grip at lift 0.119 -> 0,
  kr carry peak 0.278 -> 0.336 m (WORSE), segment dev 0.263 unchanged.
- Red: feet 5 -> 8, liftAfterStable -2 -> 0, grip at lift 0.216 -> 0.123 m,
  kr carry peak 0.379 -> 0.469 m (WORSE), segment dev 0.416 -> 0.348 m.
- Flight 21 ticks, apex 0.88, release 15, touchdown 36 — identical in all
  variants. Ippon forced runs byte-identical to live in all variants.

## Tests (honest status)
- Contact probe (6 runs): live, 163-on-live, v8, v9, clamp, fade — all ran,
  numbers above. Diff gate vs live: NOT PROMOTABLE for any variant (new/worse
  kr hard flags vs live in every variant; clamp trades them for an air snap).
- Range (v8): PASS — connects 1.00/1.15/1.30 m, whiffs 1.40/1.45 m.
- Rapid sequence (v8): PASS — timed 4/4, mash 53 -> 7 by 6-frame buffer, ends
  idle, NaN 0.
- Replay/authority (v8): PASS — replayOk, authorityOk, gatePass; reference
  and replay identical (carry 45, release 64, touchdown 85, idle 194,
  landingX 1.730).
- Full match: NOT RUN on v8 (range/rapid/replay cover its thresholds; the
  throw timing/flight values the full-match probe checks are identical).
- Park fix: PASS — 1 occurrence in v8 and live.
- Ten checks: 2 joint-snapping FAIL (the blocker itself, pre-existing in live
  and worse in every variant); 3 limb lengths FAIL pre-existing (segment devs
  0.263/0.348, Red improved vs live in v8); 4 weight transfer PARTIAL (v8
  grip-first realised for both directions on liftAfterStable, Red grip at
  lift still 0.123); 10 consistency PARTIAL (stated grip-first determination
  realised, knee-gate determination NOT realised). Others PASS/NOT RUN as
  scoped in the run log.
- Genuine gameplay inputs: YES for shipped scenes (video uses real go('T')
  at 0.75 m, both directions, on the LIVE build); ippon/shoulder probe runs
  are forced and informational only.
- Device test: NOT RUN (Kev-gated).

## Videos (scripted harness captures of the LIVE build, NOT a candidate)
- files/Street_Dojo_Feature_Cycle167KneeDiag_2026-10-31.mp4 (350 frames @60fps, 5.83 s, 322K)
- files/Street_Dojo_Feature_Cycle167KneeDiag_SlowMo_2026-10-31.mp4 (same frames @15fps ~0.25x, 23.33 s, 504K)
- Script: video_cycle167.cjs (adapted from video_cycle166.cjs); live shipped
  go('T') path at 0.75 m, both directions; NOT device gameplay. The capture
  shows the current live state whose carry knee window (ticks 11-13) is the
  subject of this cycle's escalation.

## Rollback / preservation
Live prototype/index.html sha256 verified unchanged at end of cycle
(786ac6bf...). No promotion, no state refresh, no staging commit, no Drive
relay change. All variant builds are isolated under hidden_files/claude-loop/
builds/ and can be deleted without touching live. Next step is Kev's call:
(a) re-author/re-time the carry vicT 7-10 hip/foot trajectory, (b) re-scope
the 0.20 m knee gate for this window, or (c) accept the 163/v8 grip gains
with the knee peak as a known open defect. BINDING still deferred; env still
paused. No Claude dispatch (takeover; credits exhausted, no purchase).
