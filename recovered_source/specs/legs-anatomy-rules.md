# Legs Anatomy Rules — Dojo World (saved 2026-10-28, Kev directive "remember the legs' anatomy")

Read this BEFORE authoring or reviewing any new kick, leg move, stance change, or
leg-touching pose edit. These rules are the distilled cost of Oct 27–28: the side
kick (4 versions), both launchers' knees, and the Blue sweep. The knee is never
fixed directly — it is fixed by routing the foot and hip.

## 0. First principle: the knee is DERIVED, not authored

- ik2 solves the knee from hip → foot. Knee ANGLE depends ONLY on hip–foot
  distance d (law of cosines, bones 0.62 + 0.62 = 1.24 max).
- Knee POSITION: bend direction v = [sg·u_y/bn, −sg·u_x/bn, 0] (u = hip→foot
  unit vector, bn = hypot(u_y, u_x)); the bend plane is the XY projection alone,
  so a z detour changes the fold ANGLE (via 3D d) but not the bend plane.
- Consequence: a broken-looking knee always means a broken foot path and/or hip
  path. Measure d(t) and the knee-angle curve before proposing a fix.

## 1. The recurring failure (recognize it on sight)

- Foot path dives NEAR the hip (d ≈ 0.6 m) → knee folds deep (38–61°) →
  then whips open 25–50° in a single frame as the foot extends.
- Numbers that read as broken: fold below ~75°, any single-frame knee jump
  above ~27°, knee retreating backward during extension.
- Numbers that read as correct: fold 84–90°+ (a real chamber, not a collapse),
  max knee Δ ≈ 19–22°/frame, knee driving FORWARD (or holding) through contact.

## 2. The three proven fixes (use these shapes first)

- (a) Route the foot AROUND the hip, never at it. Side kick v4: chamber foot
  FORWARD of the hip plane (chamber [0.30, 0.55, −0.05]), extension on raw
  phase with a forward arc bulge. Sweep: foot arcs OUT in z (0.50·sin(πe)
  bulge) so it circles around the hip — a wide sweep arc is correct shape.
- (b) Move the HIP away from the foot. RED launcher: pelvis leans BACK
  0.26·sin(πe) during the windup (0 at origin and contact, both byte-identical)
  — the lean-back pulls the hip off the diving foot. Sweep: pelvis stays UP
  through the chamber (0.15·sin(πe) bump) and drops into the crouch at contact.
- (c) Keep d ≥ ~0.85–0.88 m through the whole chamber. At d = 0.88 the fold is
  ~90°. Any path segment that takes d below 0.85 will fold the knee past 90°
  and whip on the way out.

## 3. Pole rules (DQ26a lines 409/410 — do not re-break these)

- The +1 rear-knee pole PINS Blue's rear knee back-up through chambers. Its
  signature: kneeX−hipX stuck at −0.60, then a late swing forward. That is the
  "knee isn't moving properly" look.
- Striking legs use pole −1: the knee travels forward continuously through the
  kick (Blue launcher: −0.20 → +0.58; Blue side kick kn2: −1 for kn2 only).
- RED (style 'back') never gets the +1 override — it always uses −1.
- Changing a pole flips the knee to the other side of the leg axis at the SAME
  angle (the pole price: side kick 0.187 m, Blue launcher 0.644 m at contact —
  the knee sits higher/further out, like the other fighter's). Disclose it; do
  not silently trade it.
- Idle/getup/stumble and P/punch clauses keep their poles — only touch the
  clause for the move being fixed.

## 4. LEGFIX (do not let it fire on kicks)

- LEGFIX latches when an airborne foot (y > 0.01) closes within 0.30 m of the
  other foot in facing-axis x while closing, and extends the ankle toward
  1.229 m on a 0.25/frame ramp — up to ~0.7 m in one frame on a folded leg.
- It MUST stay gated off for atk kn2 (side kick) and atk M.L (launcher); its
  latch state freezes while gated. Any new kick whose chamber folds the leg
  near the support foot needs the same gate, or the leg will teleport mid-move.

## 5. Geometry constraints (check before authoring a path)

- Leg 0.62 + 0.62 = 1.24 max. Hip at ~1.21 (RED boxing) means a foot on the
  ground must stay within ~0.27 m in x of the hip or the leg locks straight
  (knee ~180°).
- A foot passing hip HEIGHT must be ≥ ~0.85 m forward of the hip in x, or the
  leg collapses (d < 0.85 → fold past 90°).
- A foot passing UNDER the pelvis in x while low WILL fold the knee — that is
  only acceptable if the fold stays ≥ 84° (see §2: arc out in z, or lift the hip).
- Contact is sacred: never move a contact foot/pelvis to fix a chamber. All
  fixes above are sin(πe) bumps — exactly 0 at e = 0 and e = 1 — so origin and
  contact stay byte-identical.

## 6. Blend attenuation (tune for it, don't fight it)

- The Xiao captured-pose blend (originPose) attenuates branch-level changes
  mid-startup (ku ≈ 0.7 at t = 6–7): a branch bulge of 0.50 measures only
  ~0.37 in the live move. Size branch bumps ~1.35× the measured change wanted.
- The blend completing (ku → 1) while the branch foot is mid-travel adds a
  jump on top of the branch's own steep middle — that is why long-travel kicks
  (sweep: 1.58 m) whip hardest. Keep branch travel out of the blend-completion
  window where possible, or accept foot speed and fix the KNEE curve instead.

## 7. Support leg (don't chase the crouch)

- Pelvis must sit over/near the support foot; each leg supports weight
  independently, never mirrored.
- A deep crouch FORCES a bent support knee by geometry (sweep contact: pelvis
  0.64 + support foot 0.30 → support knee 68°). That is the price of the
  crouch, not a separate defect — unless the pelvis is also off the support
  foot, in which case the body reads as collapsing, not crouching.
- DQ29 blended leg: legs render as ONE smooth curved limb through the knee
  (quadratic curve, knee joint circles gone), extension eased, final-frame snap
  cut. OPEN: the side kick's late-extension snap (87° → 137° in one frame)
  still fails the DQ29 probe — CLOSED 2026-10-28 by Kev's DQ86 verdict ('Side kick is fine'); do not re-open without his word.

## 8. Per-move status at build ddbcfbc7 (2026-10-28)

- Blue snap (kn0): fold 89°, contact 162°, max Δ ~23 — no complaint.
- Blue sweep (kn1): FIXED + PROMOTED (z-arc 0.50 + pelvis-up 0.15; fold 84°,
  max Δ 19, connects at 1.0 m, hp 88).
- Blue side (kn2): DQ86 PROMOTED 2026-10-28 on Kev's verdict 'Side kick is fine' (step-through chamber [0.65,0.05], pelvis rise 0.22, linear chamber / blended extension; merged onto cycle-87 build 128a72df → 958c4d1e). The §7 late-extension snap item is CLOSED by that verdict.
- Blue launcher: knee fix PROMOTED (pole −1, knee drives forward).
- RED launcher: knee fix PROMOTED (pelvis lean-back, fold 71°, retreat 0.03).
- RED kicks (front/roundhouse/crescent): smooth, no pinning, no snap, no
  origin snap (0.000) — measured 2026-10-28.

## 9. Code hazard (re-learned twice — do not repeat)

- NEVER insert a `//` comment mid-line in these single-line pose/branch code
  blocks: it comments out the rest of the line and breaks the else-if chain
  (broke go() twice Oct 27, broke the sweep branch Oct 28). Append notes at
  end of line only, or document in the run log.

## 10. Verification bar for any new leg move (all must hold)

- Origin foot 0.000, contact foot/pelvis byte-identical vs the pre-change build.
- Knee curve: fold ≥ 84°, max Δ ≤ ~22°/frame, knee drives forward (or holds)
  into contact — never retreats.
- Full AI-vs-AI match completes; park-fix line intact.
- Every other strike's traces byte-identical (the fix lives in one branch only).
- Candidate first for Kev's verdict on kicks (his eye governs); promote only on
  his word. Video: normal speed + slow-mo, chamber/contact/recovery snapshots.

## 11. DQ86 side-kick candidate (2026-10-28 08:00 cycle — NOT promoted, with Kev for verdict)
- Candidate files/Dojo_World_SideKick_Knee_Candidate_2026-10-28.html (= cycle-86 working copy, sha 7ca09a3e): step-through chamber rebuild of the side-kick branch ONLY. Chamber [0.65,0.05] (foot steps through low past the hip, knee leads forward) + 0.22 m pelvis rise through the chamber + ru-window pelvis surge + linear chamber path + blended extension easing. Branch numbers: min hip-foot d 0.934 (was 0.277), min knee 97.7° (was 25.8°), max knee Δ 22.0°/frame (was 40.9°), max knee step 0.305 m (was 0.599 m), contact byte-identical, all other strikes byte-identical.
- Live numbers (update-driven): min knee 65.3° (was 37.2°), worst live jump 38.8° (was 50.6°), collapse gone. Remaining live final-frame step (126.6° -> 162.7°) is the originPose blend-completion floor for a 9-frame kick (~30° even for a perfect branch) — a rig-level window/blend decision, NOT another branch tweak. Do NOT re-tweak this branch without Kev's verdict on the candidate; S1–S4 exhausted the branch shapes.
- Gate note: DQ86 probe passes 7/8 on the candidate; the only miss is pose()-direct frame1 (0.851 vs the 0.79 no-worse bar), which is pole-price-dominated (kr alone is 0.618 at t=0 in every build) and blend-suppressed live (rendered t=1 diff vs idle 0.627 candidate vs 0.625 baseline — identical where it renders). The gate was NOT revised to force a pass.
