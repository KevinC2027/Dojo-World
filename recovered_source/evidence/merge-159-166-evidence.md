# Merge + promotion attempt — candidates 159–166 (2026-10-31 ~16:20–16:40 CT)

Kev authorized 159–166 (~16:19 CT). Candidates are separate isolated builds
off live e9112cf7 (164 was validation-only, no candidate; buffer candidate
NOT included — not authorized). Promotion requires a merge pass, not a copy.

## Merge construction (script: merge_159_166.py, parameterized by cycle list)

- 162 (line 370 grip ramp), 163 (lines 207 lift gate, 340 feet lag): isolated
  lines, applied verbatim.
- 166 line 497 already contains 165's change (166 was built on 165), so
  taking 166's line 497 merges 165+166.
- 160 + 161 CONFLICT, reconciled: both change ikBend's signature (160 adds
  `pole`, 161 adds slew state `st,tk`) and the single call site (line 501).
  Unified `ikBend(r,e,sd,fw,pole,st,tk)`: pole defaults to sd (160),
  vs uses pole (160), 161's slew-cap block runs after v normalization,
  guarded by if(st). Call site passes both (el pole=1, er pole=lunge?-1:1,
  plus 161's slew states and reset logic). Pole and slew are orthogonal:
  pole sets the fw=0 endpoint, slew caps rotation rate toward it.
  At fw=1 (down, getup phase 1) vs has zero weight, so pole is inert there.
- 159 composes: its appended touchdown direction-blend block runs after the
  ikBend calls; its air-remember line inserted after the rotS assignment.
  Found during merge: 159's line 501 drops live's trailing ANATOMY comment,
  so the merged line re-attaches 161's version of that comment AFTER 159's
  block — no code lands after a `//` comment.
- Full merge: builds/vf-merge-159-166-working.html, sha256 ea3a92da…,
  syntax-checked. No-163 merge: builds/vf-merge-no163-working.html,
  sha256 786ac6bf…, syntax-checked.

## Gate result: full merge = REVERT (diff gate vs fc837003 baseline)

Full-merge gate NEW hards: Blue kr step 0.326, Red kr step 0.476,
Blue vic.foreArmL@8 dev 0.263, Red vic.shinR@9 dev 0.348.

## Diagnosis: the diff gate compares single maxima only — it both
## unmasks pre-existing defects AND hides true regressions

Probe source (probe_contact_consistency.cjs): maxStep keeps only the single
largest step; maxSegDev keeps only the single largest deviation. Fixing the
largest defect therefore surfaces the next-largest pre-existing defect,
which the gate mislabels NEW. Conversely a regression smaller than the
current max stays invisible. New tool probe_all_defects.cjs dumps ALL steps
> 0.20 and ALL segment devs > 0.10 per run; it is the reliable comparison.

All-defects evidence (live e9112cf7 vs candidates, shipped runs):
- Red kr@10 0.379: present in LIVE (carry frame 10). Trio (159–161) shows
  exactly 0.379 — unmasked by fixing er 0.756, NOT created. Elbow code
  cannot move knees (carry frames precede any down/getup code).
- Blue vic.foreArmL@8 0.263: present in LIVE (carry frame 8). 165/166
  change nothing there; unmasked by fixing thr.foreArmR@36 0.344.
- Red vic.shinR@9: LIVE 0.396 → 163 0.348 (IMPROVEMENT, mislabeled NEW
  because live's max was thighR@10 0.416, a different joint).
- 163's GENUINE regressions (knee steps, vs live):
  Blue kr@12 0.278 → 0.326, kr@11 0.224 → 0.25;
  Red kr@11 0.336 → 0.476, kr@12 new 0.381 (live ≤ 0.20 there).
  163's genuine gains: Blue gripAtLift 0.201 → 0.038, liftAfterStable
  −1 → +2; Red thighR@10 0.416 → 0.293, shinR@9 0.396 → 0.348,
  liftAfterStable −2 → −1. Red gripAtLift slightly worse 0.216 → 0.228.
- 162 alone: kr values byte-identical to live both directions; clean.
- Full-merge knee values = 163's values exactly: merge is faithful,
  no trio/162/165 interaction on knees.
- No-163 merge vs live (full defect dump): kr IDENTICAL both directions;
  shin/thigh/foreArmL IDENTICAL; thrForeArmR@36 dev GONE (165 fix);
  getup er snaps GONE (160/161 fixes); gripAtLift Blue 0.119 (162 fix).
  Zero measured worsening. The gate would still flag unmasked kr 0.379 /
  foreArmL 0.263 as "NEW" — the gate's max-only comparison, not new defects.

## Status: NOT PROMOTED. Live build unchanged at e9112cf7.

Awaiting Kev's call (presented ~16:40 CT):
  A. Promote full 159–166 merge (accept 163's knee trade-off).
  B. Promote no-163 merge (all other fixes, zero measured worsening).
  C. Hold all for a 163 knee-regression fix cycle.
Follow-up offered (not done): upgrade diff_contact_consistency.cjs to
compare full defect distributions instead of single maxima, so future
gates neither cry wolf on unmasking nor hide true regressions.
Buffer candidate (press 6→9) remains isolated, unaffected.
