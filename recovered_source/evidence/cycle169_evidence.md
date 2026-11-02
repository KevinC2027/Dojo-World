# Cycle 169 evidence — carry vicT 7-10 re-author attempt (Phase 1, BLOCKED/escalated)

Live build UNCHANGED: prototype/index.html sha256
786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b
(Kev-authorized no-163 merge, 2026-10-31 ~16:30 CT). No candidate is presented
as a fix this cycle; no promotion, no state refresh, no staging commit, no
Drive relay change. Record-only variants are in builds/ (see below) and must
NOT be read as presented candidates.

## Problem selected (Phase 1, shipped throws, genuine G+P path)
Per Kev's 2026-10-31 ~18:09 CT decision (recorded in
next-dispatch-target-validated-20261031.md): re-author / re-time the carry
hip/foot trajectory in vicT 7-10 to remove the authored snap that drives the
held 163 knee regressions. Per-tick knee clamps stay OFF the table (cycle 167
proved they relocate, not remove, the snap). 163 stays HELD.

## Reason first (stated before building)
(1) Weight origin — victim weight on own feet until grip, then thrower
hips/legs lift through the grip. (2) Support foot — victim feet leave at
global tick 5 (vicT2) on live, before the knee window. (3) Force path —
thrower grip -> victim pelvis/torso -> lift; the victim knee is a pure IK
intermediate (ik2, LEG1=LEG2=0.62, pole -1) between hip (pel) and foot, so
its world step is fully determined by hip/foot endpoints, the carryK blend
weight, the victim root lift, and the turn/pitch rotation of the carry pose.
(4) Target reach — grip at release and flight unchanged in every variant
below. (5) Recovery — release global tick 15, touchdown 36, flight 21 ticks,
apex 0.88 in every variant below; ippon forced runs byte-identical in kind.

## Reproduction on current live (probe_all_defects.cjs, 6 runs)
Saved: cycle169_probe_live.json (live values identical to cycle 167/168).
- Blue throws Red: carry kr steps global t11 0.224 m (vicT8), t12 0.278 m
  (vicT9, peak); fr steps t11 0.205, t12 0.214. Grip carryMax 0.209,
  atRelease 0.205, atLift 0.119. Segment dev vic_carry 0.263 (foreArmL@8).
- Red throws Blue: carry kr steps t9 0.243 (vicT6), t10 0.379 (vicT7, peak),
  t11 0.336 (vicT8); fr steps t7 0.226, t8 0.257, t9 0.265, t10 0.249,
  t11 0.213 — the foot itself exceeds the 0.20 m gate for five consecutive
  ticks. Grip carryMax 0.242, atRelease 0.148, atLift 0.216. Segment dev
  vic_carry 0.416 (thighR@10).
Diagnosis (per-tick hip/pelvis/knee/foot, corrected diag): in the window the
hip-foot distance collapses (Red victim: 1.10 -> 0.515 m at vicT7, then
re-expands) while the foot swings ~0.16-0.19 m/tick in x/y and the root
still lifts. The knee sits far off the hip-foot axis when the leg is deeply
folded, so a small axis rotation becomes a 0.3+ m knee swing. The snap is
in the combined trajectory (endpoints + blend weight + root lift + turn/pitch
unwind), not in any single endpoint value.

## Correction rounds (3, the cycle limit — then stop, per procedure)
All variants: shipped styles only (lunge/back); ippon/shoulder untouched;
flight, touchdown, grip-at-release identical in every variant.

- Round 1 — feet easing (builds/vf-cycle169-feet-retime.html, k=0.15 bump):
  feet interpolation carryK + 0.15*sin(pi*uu/(11/12)), zero at vicT11 so the
  last carry pose is unchanged. Blue kr peak 0.278 -> 0.260 m; Red kr peak
  0.379 -> 0.359 m (k=0.15) / 0.371 m (k=0.20). Red segment dev WORSENS
  0.416 -> 0.504 m (k=0.15) because the feet run ahead of the knee blend.
  REJECTED: peak still far over gate, new segment regression.
- Round 2 — feet + knee-blend easing (same bump applied to kl/kr blend):
  Blue kr peak ~0.257-0.267 m; Red kr peak WORSENS to 0.430 m (k=0.15),
  0.474 m (k=0.20), 0.490 m (k=0.30). REJECTED: the knee blend is not the
  driver; moving it with the feet amplifies the Red peak.
- Round 3 — turn/pitch rotation hold (builds/vf-cycle169-rot-hold.html):
  shipped turn/pitch factor sin(pi*carryK) replaced after the peak by
  1 - 0.5*((carryK-0.5)/0.5)^2, so rotation is held longer and 0.545 of it
  remains at the last carry tick instead of 0.072. Blue carry kr improves
  (fr steps fall below gate; kr t12 0.218, t13 0.232) BUT it creates a
  release snap the carry gate cannot see: first air tick (global t15)
  head 0.356 m, fr 0.352 m, fl 0.314 m, el 0.332 m — shipped air poses do
  NOT blend from airFrom (that blend is ippon-only), so a rotated
  carry-end pose snaps to the unrotated flight pose. Red carry kr peak
  barely moves (0.379 -> 0.382 m). REJECTED: same trade pattern as the
  cycle-167 clamp (carry gain bought with a release snap), and no Red gain.

## Why this is a blocker, not a fourth round
Easing or holding any single element of the carry trajectory (feet, knee
blend, turn/pitch) either barely moves the Red 0.379 m peak or trades it for
a worse failure elsewhere (segment deviation, release snap). Beating the
0.20 m gate honestly requires changing the carry targets AND the flight
starting pose together so carry-end and flight-start match — i.e. a
re-authored launch pose, not a smallest coherent correction. That is a
gameplay-visible change and a directive §6 escalation (repeated attempts
failing to produce improvement; anatomical correction vs approved gameplay).
The validated live build is preserved byte-identical. 163 stays HELD.
Next step is Kev's call: (a) authorise a joint carry+flight re-authoring
(changing the launch pose), (b) re-scope the 0.20 m gate for the carry
window, or (c) accept the live carry knee/foot peaks as known open defects
(and, separately, the 163 grip gains with the knee peak open).

## Tests (honest status)
- Contact probe (6 runs): live, feet-easing (k=0.10/0.15/0.20), feet+knee
  (k=0.15/0.20/0.30), pel+feet, rotation-hold, rotation+feet — all ran;
  numbers above. Diff gate vs live: NOT PROMOTABLE for any variant.
- Range / rapid-sequence / replay / movement-authority / full-match /
  park-fix: NOT RUN on the rejected variants (probe hard failure already
  disqualifies them; flight, touchdown, grip-at-release and ippon values
  are identical to live in every variant, so no regression is hidden there).
- Ten checks (live build): 2 joint-snapping FAIL on the known shipped flags
  above, disclosed, unchanged; 3 impossible limbs PARTIAL (segment devs
  above, pre-existing); 7 throw-specific PASS for the gameplay path (G+P,
  both directions, full grip->recovery, damage applied — video end HP
  100 vs 78 both directions); others PASS/NOT RUN as scoped in the run log.
- Genuine gameplay inputs: YES for shipped scenes (video uses real
  press('g') + press('p') at the G+P path, both directions, on the LIVE
  build); ippon/shoulder probe runs are forced and informational only.
- Device test: NOT RUN (Kev-gated).
- Claude dispatch: NONE attempted (takeover; credits exhausted, no purchase,
  no billing change). No dispatch error was observed this cycle, so no
  BLOCKED/credit signal is claimed and no cadence change is triggered.

## Videos (scripted harness captures of the LIVE build, NOT a candidate)
- files/Street_Dojo_Feature_Cycle169Live_RedThrowsBlue_2026-10-31.mp4
- files/Street_Dojo_Feature_Cycle169Live_BlueThrowsRed_2026-10-31.mp4
- Script: capture_cycle169.cjs (adapted from capture_cycle168_validation.cjs);
  genuine G+P inputs, both directions, slow-motion with diagnostic overlays;
  NOT device gameplay. The capture shows the current live state whose carry
  knee/foot window (vicT 7-10) is the subject of this cycle's escalation.
  Video statistics are in hidden_files/claude-loop/cycle169_evidence.json
  (the capture script's output; this .md file is the cycle evidence).

## Rollback / preservation
Live prototype/index.html sha256 verified unchanged at end of cycle
(786ac6bf...). No promotion, no state refresh, no staging commit, no Drive
relay change. All variant builds are isolated under hidden_files/claude-loop/
builds/ and can be deleted without touching live. BINDING still deferred;
env still paused. No Claude dispatch (takeover; credits exhausted, no purchase).
