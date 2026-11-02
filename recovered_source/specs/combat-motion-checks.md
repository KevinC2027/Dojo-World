# Combat Motion Automatic Checks — v0.1 (Muse, 2026-10-30)

Purpose: detectable failures Sonnet must correct BEFORE an animation reaches
Kev. A candidate failing any check returns to Sonnet within the cycle; it is
not delivered as a verdict item. Existing cycle gates (acceptance target,
full-match, park fix) still apply on top.

## Stage 1 — PRE-GENERATION REASONING (Kev, 2026-10-30 ~15:55 CT; runs BEFORE generation)

Sonnet's reply MUST open with the five determinations from spec §0, in this
order, before any diff:

1. Weight origin. 2. Support foot. 3. Force path (legs → hips → torso →
   striking limb). 4. Target reach. 5. Recovery to stance.

A reply with no five-point reasoning, or with the diff first and the reasoning
after, is incomplete and is sent back before integration begins.

## Stage 2 — THE CHECKS (nine existing + check 10, run on the generated animation)

10. CONSISTENCY (check 10 per the 2026-10-30 reference-library handoff; the
   nine existing checks keep their coverage) — the animation must match
   Sonnet's own stated determinations:
   the stated support foot is the planted foot, the stated force order is the
   order the motion follows, the stated recovery is the recovery shown. A
   contradiction fails here even if every other check passes.

## Check list (from Kev's directive §5)

1. FOOT SLIDING — a planted/support foot's ground position must not drift
   while loaded. Measure per-foot ground displacement during support phases;
   gate TBD in POC setup from the approved walk/stance baselines.
2. JOINT SNAPPING — no single-tick joint-angle jump beyond the motion's
   established continuity band. Precedents: single-tick step ≤0.050 m
   (cycle 141); maxAbsAngleStepLast5 ≤0.35 (cycle 139 landing work).
3. IMPOSSIBLE LIMB POSITIONS — limb lengths preserved (ARM 0.40/0.40,
   LEG 0.62/0.62); knee derived from hip→foot distance (ik2), never authored;
   chamber distance ≥ ~0.85 m; elbow IK pop ≤0.32 (DQ120 gate).
4. POOR WEIGHT TRANSFER — pelvis/COM must track over the support foot through
   single-support phases; strike power must follow base/hip commitment, not
   limb extension alone. Gate TBD in POC setup.
5. STANCE VIOLATIONS — idle knees ≥160° guide outside directed style stances;
   legs never mirrored; one support + one free leg at all times; DQ25 Blue
   default preserved where it governs.
6. MOTION CONTINUITY — no pose teleporting (DQ26 origin rule); blends
   between states must not jump; flight/landing rotation continuous
   (late-flight unwind ≥−0.15 precedent, cycle 139: unwind 0.000).
7. THROW-SPECIFIC (Oct 30 directives) — victim facing flips left→right during
   positioning before release; flight forward over the shoulder; inversion
   ticks = 0 across grab, positioning, throw, and flight; feet grounded until
   thrower positioned; arms drive forward, never backwards.
8. BASE INTEGRITY — candidate must be built on the CURRENT verified build
   (2e0e80ad as of 2026-10-30). A stale-base candidate is rejected outright,
   not repaired.
9. COMBAT PRESERVATION — move timing (su/ac/rc), hit detection, and
   button-based controls unchanged unless the cycle's acceptance target says
   otherwise. Range probe and full-match probe must still pass.

## Procedure

- The dispatch brief attaches combat-motion-specification.md + this file and
  requires the reply structure: (1) five determinations, (2) unified diff,
  (3) ten-check report with measured values.
- Sonnet's reply must report each check PASS/FAIL with the measured value,
  not a blanket "looks good."
- On FAIL: Sonnet corrects and re-reports within the same cycle when the
  dispatch budget allows (narrow/split dispatches; ~271 s ceiling). If the
  budget does not allow, the cycle logs the failure honestly and does NOT
  deliver the failing candidate to Kev as progress.
- Kev's video verdict remains the final acceptance for anything that reaches
  him; these checks only stop detectable failures from reaching him.
