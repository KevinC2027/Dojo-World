# Contact-consistency diagnostics — autonomous combat evaluation loop

Added Oct 31 2026 under Kev's standing autonomous authorization (Oct 31
~01:15 CT). Probe: `hidden_files/claude-loop/probe_contact_consistency.cjs`.
Promotion gate: `hidden_files/claude-loop/diff_contact_consistency.cjs`.
Baseline: `hidden_files/claude-loop/contact_consistency_baseline_20261031.json`
(build fc837003, cycle 152). The probe is READ-ONLY (sha verified unchanged
before/after every run). It never touches button controls, the approved
baseline, or rollback backups; it only measures.

## Runs (6, every cycle)
- Shipped style throws, both directions, real go('T') path (gameplay truth).
- Forced ippon, both directions (harness-forced; NOT gameplay until bound).
- Forced shoulder, both directions — INFORMATIONAL ONLY: unapproved variant,
  not gameplay. Its flags are reported, never promotion-blocking.
- Method: node vm harness, world joints via the engine's own transform
  (line 521). Shoulders/hips reconstructed with the engine's own line-466
  formulas from pose rotS/rotH (verified identical to drawF lines 525-526).
  Grip definition reused exactly from the throw-corrections probe: min over
  thrower hands x victim {hands, elbows, neck, pelvis} — so all grip numbers
  stay comparable across cycles.

## Metrics, tolerances, flags
| Metric | Tolerance | Severity | Notes |
|---|---|---|---|
| Head-neck distance | ≤0.26 m, all throw frames | HARD | Cycle 152 fixed the throw path; max now in getup |
| Pelvis-neck distance | ≤0.57 m, all throw frames | HARD | Same |
| Single-joint step | ≤0.20 m/tick | HARD | Known: down/getup elbow snaps, carry feet cliff |
| Inversion (head >0.10 m below pelvis height in air) | 0 ticks | HARD | Shoulder variant inverts by design (INFO only) |
| Torso pass-through (torso-torso seg dist, air/down/getup) | ≥0.005 m | HARD | Carry-phase contact is NOT pass-through (see below) |
| Grip at release | ≤0.20 m gate; >0.30 m = loss | SOFT / HARD over 0.30 | Ippon 0.769 = hard loss; shipped 0.205 = soft |
| Grip carry max / over-gate ticks | ≤0.20 m / 0 ticks | SOFT | Phase C target |
| Segment deviation (arm 0.40/0.40, leg 0.62/0.62, torso 0.55/0.24) | ≤0.05 soft, ≤0.10 hard | SOFT/HARD | Worst in carry (table blends) + throwExit window |
| Joint fold angle (elbow/knee) | ≥5° (collapse) | HARD below 5° | 7.4° ippon thrower rear elbow = watch item |
| Torso proximity, air/down/getup | ≥0.03 m | SOFT | Bodies separating after release |
| Lift sequencing | grip ≤0.20 AT lift tick; lift ≥ stable grip | SOFT | Shipped lifts with NO grip (see baseline) |
| Thrower dip | dip tick ≤ release tick | SOFT only if dip AFTER release | Dip AT release is not a defect |
| Rigid flight run (>70°, <2°/tick change) | ≤5 ticks | SOFT | 10 shipped / 21 ippon |
| Touchdown torso angle | ≤70° | SOFT | 56.8 shipped / 83.5 ippon |
| Touchdown contact (min victim joint y at touchdown) | [-0.05, +0.20] m | SOFT outside | Ippon 0.479 = body still airborne at transition |
| Flight displacement coherence (flightDx vs vx x time) | report, ≈1.0 | INFO | Always 1.00: vx constant in air |
| Apex root y vs ballistic (h + vy²/48) | report only | INFO | Air root-y is POSE-driven, not ballistic (0.88 vs 1.08 shipped) |
| Torso-torso carry contact | report only | INFO | Throws are contact techniques; 0.000 in one ippon direction = drape contact |

## Corrected v1 errors (caught before baseline adoption, documented honestly)
- v1 flagged flight time vs a vertical ballistic prediction (ratio 0.70 on
  EVERY run). That prediction is inapplicable: air root-y is pose-driven and
  air ends on body contact (shipped touchdown min joint y = 0 exactly) or on
  a pose/timer transition (ippon 0.479 gap), not on ballistic ground contact.
  The valid flight check is horizontal displacement coherence (exactly 1.00).
  The false hard flag was removed, not tuned away.
- v1 flagged ippon dip as "does not precede release" when dip tick EQUALS
  release tick. Dip AT release is not a sequencing defect; only dip AFTER
  release flags.
- v1 flagged any torso-torso distance <0.005 as pass-through, including
  carry-phase drape contact. Pass-through now applies only to air/down/
  getup, where bodies must be separate.

## Promotion policy (automatic refine / revert)
- Every cycle runs the probe on the candidate build AND the baseline build,
  then the diff script. PROMOTABLE iff: no NEW hard-flag kind, and no shared
  hard kind regressed beyond tolerance (0.01 m / 1 tick / 1° in the worse
  direction). Otherwise AUTO-REVERT (restore pre-cycle backup, log the diff).
- Pre-existing hard flags do NOT block promotion by themselves: a cycle
  promotes when it improves its target without adding or regressing hard
  flags. (Zero-hard would freeze all work until every historical defect is
  fixed; phases fix one thing at a time.)
- Soft flags never block alone. The probe's nextTarget (worst remaining flag,
  hard first) feeds the auto-refine queue; the program's phase order still
  governs which phase runs next.
- INFO (shoulder) runs never gate promotion.
- Results are reported as AUTO-VERIFIED under the standing authorization,
  never as owner-approved. No approval is requested.

## Baseline (build fc837003, cycle 152) — headline numbers
- HN 0.247 / PN 0.556-0.560 everywhere (cycle 152 fix confirmed by this
  independent probe). Zero over-gate HN/PN frames.
- Grip: shipped carryMax 0.374/0.277, release 0.205/0.148; ippon carryMax
  0.722/0.715, release 0.769 (hard loss). Grip at lift: shipped 0.238/0.216
  (lift WITHOUT grip — first contact tick 9-10, lift tick 5); ippon
  0.284/0.289 (grip established then loosened before lift).
- Segment dev by phase: victim carry 0.220-0.492 (table-blend distortion),
  victim air 0-0.025 (clean), victim down 0-0.156, victim getup 0.113-0.339,
  thrower air/down/getup 0.344 (throwExit window).
- Steps: shipped 0.444 (down elbow) / 0.756 (getup elbow); ippon 0.687/0.892
  (carry feet cliff). Flight: ratio 1.00 all runs; rigid 10/21 ticks;
  touchdown 56.8°/83.5°; touchdown contact 0 shipped / 0.479 ippon.
- Intersections: no air/down/getup pass-through on gating runs; carry drape
  contact 0.145/0.000; torso proximity air/down 0.593-0.747 (clean separation).
- Min fold angles: 19.9-22° shipped getup elbow; 7.4° ippon thrower rear
  elbow (watch, above the 5° bound).
- Systemic backlog (mechanism PROVEN, not just observed): exit-blend limb
  distortion. Thrower rear forearm collapses 0.40 -> 0.056 and lead forearm
  stretches to 0.536 during the 10-frame throwExit window (ticks 33-41),
  recovering to exactly 0.40 at tick 42 when the blend completes. Cause:
  exit blends lerp each joint independently, so bone lengths are not
  preserved when start/end arm directions differ. Same mechanism applies to
  stun/step/guard/walk exit blends. Fix direction (future cycle, not this
  turn): blend the arm as a chain (interpolate shoulder->hand vector +
  pole, re-solve IK) instead of lerping joints. Queued for Phase G (blend
  snaps) or a dedicated systemic cycle; Phase C (grip) stays next.

## Limitations (stated, not hidden)
- Stick figures have no body volume: "intersection" = skeleton-segment
  proximity, not volume collision. Thresholds are v1 and may be retuned on
  cycle evidence, with the retune recorded here.
- Grip = min hand-to-body distance, a proxy for a true grab anchor. Phase C
  will define the trapped-arm anchor precisely; the proxy stays comparable
  until then.
- Shoulder/hip joints are reconstructed (exact engine formulas), not stored
  joints. Segment deviations that use only pose joints (forearm, shin) were
  verified by direct coordinate dumps and are independent of reconstruction.
