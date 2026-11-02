# Rear Straight Analysis — Blue pn1, DQ70 (Kev directive, 2026-10-31 ~00:22 CT)

Build: 6c9b0e06 (cycle 150). READ-ONLY: no change to the approved
animation. Subject is Blue's pn1 rear straight — the engine's explicitly
named rear straight (DQ70 branch). RED's boxing cross is a separate move
and is NOT analyzed here. Probe: probe_rear_straight.cjs; raw numbers:
rear_straight_results_20261031.json. Move: startup 6 + active 3 +
recovery 10 = 19 ticks. Shoulder positions are reconstructed from the
DQ70 branch's own rotation formulas (rotS=−0.5·e, rotH=−0.35·e) + neck,
since pose() does not return shoulder anchors; elbow angles carry a
small reconstruction caveat, all other numbers are direct pose reads.

## The six elements, measured

- REAR-FOOT SUPPORT: rear foot stays grounded the whole move (max lift
  0.022 m, a bounce, not a step). It is a support foot in the sense of
  contact — but see inconsistency 1: it slides.
- PELVIS ROTATION: rotH reaches −0.35 rad (~20°) at contact, and the
  pelvis drives forward 0.06 m and RISES 0.24 m (0.70 → 0.94) out of the
  low stance. Pelvis-to-feet at contact: 0.813 (lead) / 0.711 (rear) —
  centered between the feet.
- TORSO ROTATION: neck speed tracks pelvis speed almost exactly (both
  peak 0.077–0.078 at t=5). The torso rides the pelvis; it does not
  counter-rotate or lag it.
- SHOULDER MOVEMENT: rotS reaches −0.5 rad (~29°) at contact — shoulder
  rotation EXCEEDS pelvis rotation, which is the correct relationship
  for a cross. But both rotations grow in lockstep with the same phase
  variable e (see inconsistency 3).
- FIST ACCELERATION: fist speed peaks at t=5 (0.346 m/frame, last
  startup frame), then FALLS at contact (0.284) and freezes during
  active (0.001–0.002 for t=7–9). Acceleration peaks early (t=3,
  +0.111) and is already negative at contact (−0.062). The largest
  acceleration in the whole move is the START of retraction (t=10,
  +0.123), not the punch.
- RECOVERY: clean endpoint. Returns to idle exactly (all joints ≤0.025
  from stance, feet exact). But the retraction itself is perfectly
  linear (0.125 m/frame, zero acceleration) after a 1-frame hang at
  full extension — interpolation, not muscle (see inconsistency 5).

## Kinetic-chain verdict: plausible in gross structure, compressed in detail

The gross chain IS there: rear-foot drive → body rotation/translation →
arm extension → exact return to stance. Guard at chin at contact
(0.248 m), pelvis centered, elbow 160.2° at contact (extended, not
hyperextended), recovery exact. But the fine sequencing is NOT a
textbook kinetic chain: onsets are nearly simultaneous (fist actually
moves first, t=2, vs pelvis/neck t=3); pelvis, torso, and fist speeds
ALL peak on the same frame (t=5); pelvis and shoulder rotation are
phase-locked rather than staggered. The power curve is front-loaded:
acceleration peaks early, velocity peaks pre-contact, and contact
itself is a pose hold, not a power peak.

## Mechanical inconsistencies (reported, NOT fixed — animation unchanged)

1. REAR FOOT SLIDES, NOT PIVOTS. Rear foot translates 0.22 m forward
   (x −0.70 → −0.48) while y stays ≤0.022 — a planted foot sliding on
   the ground. The branch comment says "rear foot pivots back," but the
   geometry moves the ankle point FORWARD, toward the lead foot. Side
   effect: the base narrows 1.70 → 1.42 m at contact, costing stability
   exactly when the pelvis is at its highest (0.94).
2. ELBOW SNAPS 76° IN THE FINAL STARTUP FRAME (84.4° → 160.2°, t=5→6)
   while fist speed FALLS (0.346 → 0.284). The last frame of extension
   comes from joint snap, not drive.
3. PELVIS AND SHOULDER ROTATION ARE PHASE-LOCKED (both ∝ e). A real
   chain staggers them — hips rotate first, shoulders whip past later.
   Here they fire simultaneously, so the torso reads as one rotating
   block rather than a sequenced chain.
4. FIST FREEZES DURING ACTIVE. Speed ~0.001 for t=7–9: the fist hangs
   at full extension instead of following through the target. Standard
   for a game hit window, but not a physical follow-through.
5. RECOVERY RETRACTION IS PERFECTLY LINEAR (0.125 m/frame, zero
   acceleration) after a 1-frame hang. No ease — reads as interpolation.
6. OBSERVATION, NOT A VIOLATION: pelvis rises 0.24 m through the punch.
   Leg drive expressed as upward drive is plausible from a crouch, but
   combined with (1) it leaves the fighter tall and narrow at contact.

## Videos (scripted harness captures of the real build, NOT device gameplay)

- Street_Dojo_Rear_Straight_Side_SlowMo_2026-10-31.mp4 (side view,
  cam.yaw=0) — 960×540, 3.87 s.
- Street_Dojo_Rear_Straight_ThreeQuarter_SlowMo_2026-10-31.mp4
  (three-quarter view, cam.yaw=0.6) — same sequence, verified
  frame-distinct from the side view.
- Both: stance lead-in → rear straight → settle, move ticks held 4×
  (~0.25× slow motion), HUD shows phase, tick, live fist speed, chain
  stage, and rear-foot planted/lifted status. Red is passive at 0.85 m;
  the punch connects (HP bar drops) but Red's reaction pose is
  suppressed so Blue's mechanics read cleanly.
