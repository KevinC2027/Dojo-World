# Foot IK Feasibility Evaluation — Dojo World (Kev directive, 2026-10-30 ~23:16 CT)

Build tested: 3c69ea8f (cycle 149). READ-ONLY evaluation: no change to
prototype/index.html. Probes: probe_foot_ik.cjs, probe_foot_ik2.cjs;
raw results: foot_ik_results_20261030.json.

## Verdict

FEASIBLE as a ground-alignment layer on top of the existing rig, NOT as a
standalone fix for balance or animation. The rig ALREADY has analytic
two-bone IK (ik2): knees are derived from hip→foot, bones 0.62+0.62.
What is missing is ground awareness: foot targets are authored in body
space, feet are points (no ankle joint), and three thresholds assume the
ground is exactly y=0. A ground pass can fix foot placement; it cannot
decide where feet step, move the pelvis over the support foot, or pitch a
foot to a slope. Those stay animation/balance work.

## What the rig already does (why "foot IK" is a layer, not a new system)

- ik2 solves the knee from hip + foot + lengths only; endpoints never
  move ("hands/feet never move"). Knee angle is a pure function of
  hip–foot distance d: d=1.24 → 180° (straight), d=0.88 → ~90°.
- Validation: probe computes Blue idle knees 136.4°/120.2° vs the DQ25
  note's 134.9°/120.7° — within 1.5°. Hip approximation (pelvis ±0.12 z,
  rotH=0) is sound at idle; at high-rotH strike poses it carries up to
  ~±8° uncertainty, which does not change any conclusion below.
- LEGFIX, C2 drift-cancel, and the J6 reach clamp already do IK-adjacent
  work on feet. A ground pass composes with them; it does not replace them.

## Measured results

### Ground alignment — uniform ground change (both feet ±0.10 / ±0.20)
Pelvis compensation is EXACT for every pose tested: shifting pelvis y by
the ground delta restores both knee angles to baseline (deviation 0.0°).
A ground pass that moves foot targets AND pelvis together by the ground
height preserves approved poses exactly. This is the core feasibility win.

### Ground alignment — slopes (differential foot heights)
- BLUE idle (pelvis 0.70, feet 1.70 apart): fully compensable. Worst case
  tested (lead +0.15, rear −0.15 — a 0.30 differential): best pelvis
  shift (−0.12, −0.04) restores knees within 1.0°. All Blue slope cases
  ≤1.0° deviation. Blue's low, wide stance has headroom both ways.
- RED idle (pelvis 1.212, feet 0.36 apart): NOT compensable past small
  differentials. Lead +0.15/rear 0: best deviation 10.4°. Lead 0/rear
  +0.15: 12.3°. Lead +0.15/rear −0.15: 35.9°. Worse: the optimizer hit
  the ±0.30 search-box edge in all three cases, so these are optimistic —
  no pelvis shift within ±0.30 restores RED's knees on a 0.15+ slope.
  Cause: RED's legs are near-straight (147°/158°) with a narrow base, so
  a slope drives one leg toward lock while the other folds, and lateral
  pelvis shift has almost no leverage. RED step-down of just −0.10 with
  no compensation already locks BOTH legs (180°) — see reach below.

### Knee joint limits
- Stance band used: 100°–170° for stance/walk legs. Near-lock (>170°)
  and deep fold (<100°) flagged, not auto-failed: the Blue sweep's
  support knee is 68.6° at contact and that is the APPROVED crouch price
  (anatomy rules §7), not a defect. Ground compensation preserves the
  sweep's geometry (uniform: 0.0° deviation; slopes: ≤4.5°).
- The binding limit is not the knee band — it is REACH (next section).

### Reach / stretch — the hard guard
- ik2 clamps solve distance to 1.235 but leaves the endpoint untouched.
  Direct test: foot 1.345 from hip → solved thigh 0.62, rendered shin
  0.73 — 0.11 m of visible stretch. Any ground pass WITHOUT a reach
  guard renders stretched limbs on dips.
- Measured no-compensation stretch: RED idle step-down −0.10 → 0.05/0.08;
  RED idle step-down −0.20 → 0.15/0.18; RED roundhouse-contact support
  leg step-down −0.10 → 0.067; Blue idle step-down −0.20 → lead 0.048.
- Rule: before solving, clamp foot targets to reach OR drop the pelvis
  by the excess. Non-negotiable for any ground implementation.

### Foot stability — flat-ground baseline (what "stable" currently means)
- Planted-foot drift during walk: max 0.164 m (lead) / 0.038 m (rear),
  mid-stance frames included. Flat-ground feet already travel ~0.16 m —
  uneven-ground IK should be judged against that baseline, not zero.
  (The walk's stance foot is authored as a body-space sweep with C2
  drift-cancel; the residual shows that cancel is not pixel-perfect for
  the lead foot.)
- Single-support balance read: only 3 of 120 walk frames had exactly one
  foot airborne (y>0.10); max pelvis-to-support-foot offset in those
  frames was 0.263 m. Indicative only (tiny sample), but it bounds the
  claim: IK keeps feet planted; it does not keep the pelvis over the
  support foot — on uneven ground that offset grows unless the pelvis
  trajectory (animation) adapts.

### Uneven-surface shape limits (structural, from code, not just numbers)
- Bend plane is XY-only (ik2 bend vector has z=0 always). A lateral (z)
  slope changes the fold angle via 3D distance but the knee still bows
  in the XY plane — it will not track a lateral slope. True lateral
  slope tracking needs a bend-plane change, not a foot retarget.
- Feet are points: no ankle, no toe/heel. A ground pass can place the
  foot POINT at ground height; it cannot pitch the foot flat to a slope.
  Slope-flat feet need a new ankle segment — a rig change, not IK tuning.

## IK-achievable vs animation/balance-required

IK-ACHIEVABLE (ground pass, no pose-table changes):
- Planted-foot height snap on flat-to-moderate uneven ground (Blue
  stance fully; RED within ±0.10 uniform or small differentials).
- Knee re-solve after any retarget — free, ik2 already does this.
- Pelvis height shift for uniform ground change — exact (0.0°).
- Reach guard (pelvis drop or foot clamp before solve) — mandatory.

REQUIRES ANIMATION / BALANCE CHANGES (IK cannot do these):
- Step placement: WHERE a foot lands on uneven ground, when it lifts —
  swing targets are authored per move; IK only places the knee after.
- Pelvis lateral trajectory over the support foot during single support
  (balance); stumble corrective steps (authored step logic).
- RED stance on slopes >~0.15 differential: needs wider feet and/or a
  lower pelvis — a stance change, i.e. a design decision, not a solver.
- Ankle/foot orientation on slopes (new joint), lateral bend-plane
  tracking (solver change), throw carry poses (authored).
- Strike chambers: foot paths are authored; ground height must not move
  a contact foot/pelvis (contact is sacred — same rule as all leg fixes).

## Integration costs (not free)
Three thresholds assume ground y=0 and will misread raised-ground feet
as airborne unless made ground-relative: LEGFIX planted test (0.01),
C2 drift-cancel fade (0.10), support-foot gate (0.06). The ground pass
must thread a ground-height parameter through all three, or planted
feet on raised ground will latch/extend/refuse attacks. Pole rules are
unaffected (poles are per-state, not height-dependent); LEGFIX kick
gating still applies.

## Recommendation (preserving approved behavior)
Implement as a POST-POSE ground pass (after pose(), before render),
scoped to idle/walk/guard first: for each planted foot, set foot y to
ground height at that foot's x/z; clamp to reach or drop pelvis by the
excess; re-run ik2. Proof of preservation: on flat ground (height 0)
the pass must be byte-identical to the current build — it is a no-op
there by construction. Strikes stay excluded until per-move contact
byte-identity is proven (contact is sacred). RED-slope handling and
any ankle joint are open design questions, not implementation details —
they need Kev's word, not a cycle's guess.
