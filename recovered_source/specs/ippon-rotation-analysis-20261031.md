# Ippon rotation analysis — cycle-150 sequences (Kev directive Oct 31 2026 ~00:59 CT)

NO BUILD CHANGE. No animation was modified. Phase B build work is HELD
pending Kev's review of these findings.

## Scope and interpretation
"Both Cycle 150 throwing sequences" is read as the two forced-ippon
directions: Blue throws Red and Red throws Blue (harness-forced, as in
probe_cycle150 — the cycle-150 subject). These are NOT gameplay G+P throws:
the forced drive bypasses tryHit, so no damage is applied (HP stays
100/100 in these captures, unlike the real G+P baseline where the throw
deals 22). All four videos are labeled FORCED IPPON on screen.
Build: prototype/index.html sha256 6c9b0e06 (cycle 150).
Evidence: `hidden_files/claude-loop/ippon_rotation_evidence_20261031.json`
(per-tick logs for the Side runs), `capture_ippon_rotation.cjs`,
`probe_ippon_snaps.cjs` (joint identification), charts in files/.
Definitions: torso angle = pelvis->neck vector from vertical (0 = upright,
90 = horizontal, >90 = head below pelvis height). Angular velocity =
per-tick angle change x 60 (rad/s). Facing = sign of (head.x - pelvis.x).

## Intended mechanics (from code + recorded directives)
- Axis 1 — carry yaw about the VERTICAL (Y) axis: the victim rotates π rad
  (facing left->right) during positioning (code: yawTh = π * smoothstep over
  carry uu 0.10->1.0). Kev directive Oct 30 ~15:43: the facing flip happens
  DURING positioning, before the toss.
- Axis 2 — overBack sagittal flip: the victim goes over the thrower's
  shoulder (code: table flip x->-x, y->1.6-y, i.e. a 180° rotation in the
  XY plane about the lateral axis). Implemented as a TABLE FLIP blended in
  via carryK (0->0.75), NOT as a time-parameterized rotation.
- Source of torque (intended): the thrower's turn-in + pelvis dip + forward
  drive + arm trap (code: thrower steps fr +0.30 / fl -0.24, pelvis dip
  -0.18 ramp, forward drive pelFwd +0.30, trap offsets trapA/trapN on the
  hands). NOTE the structural caveat in the findings: the victim's rotation
  is kinematically authored (table yaw + flip), not dynamically driven by
  the thrower's motion — there is no torque transfer in the engine.
- Release direction: forward over the shoulder along the thrower's facing:
  launch velocity (vx 4.8, vy 6.0) = 51.3° above horizontal (ippon launch
  table; release at victim t = 24).
- Airborne angular motion (intended): NONE — translational flight per the
  Oct 30 directive (code line 394: ippon air rotation th = 0 * smoothstep =
  0), except the air->down blend in the last 0.6 m of descent.
- Landing orientation (intended, Oct 29 ippon design): forward, in front of
  the thrower, flat ("lands flat in front" — cycle 119 note), facing flipped.
  NOTE: this old design intent now conflicts with the Oct 31 Priority 4
  (no flat landing, progressive contact) — see findings.

## Measured — both directions (nearly symmetric; differences noted)
Release (both directions identical): victim t = 24, velocity (4.8, 6.0),
launch angle 51.3°, victim pelvis at release (-0.075, 1.56) = thrower + 0.30
(the ippon anchor end). Touchdown: victim t = 25 air ticks later (global
tick 68), pelvis (1.925, 0.52), flight distance 2.0 m = 4.8 x 0.417 s
(coherent with launch velocity), torso 83.5°, facing +1 (flipped).
Victim ends at x 2.53 after the ground slide, back in idle facing the
thrower (facing -1 in stance — the flip is a throw-phase orientation, not
a permanent facing change).

| Phase | Torso angle | w_pitch (rad/s) | w_yaw proxy (rad/s) | Notes |
|---|---|---|---|---|
| Carry (23 ticks) | 10° -> 83.5° | mean 3.3-3.4, max 5.42 | -14.4 to +7.4 (see proxy note) | Facing flips to +1 at victim t = 15 (~65% through carry) |
| Air (25 ticks) | 87.7° -> 99.1° -> 83.8° | mid-flight mean 0.73 | -4.3 to 0 | Non-monotonic: rises to head-low 99°, landing blend returns it to 84° |
| Down (55 ticks) | 83.5° -> 91.9° | -0.37 to +4.59 | ~0 | Sits flat through down |
| Getup (54 ticks) | 90° -> 0-8° | -5.77 to +1.9 | to 29 (artifact, see note) | Rise to stance, with snaps below |

Pelvis trajectory (victim): carry start x 0.32-0.46 (by victim style),
release (-0.075, 1.56), pelvis y max 2.01, touchdown (1.925, 0.52).
Thrower (torque source, measured): pelvis dips to 0.597 in both directions;
thrower torso stays 8.5-18.1° from vertical through the whole throw — the
thrower DOES NOT ROTATE its torso. The victim yaws π and pitches 73° during
carry while the thrower's torso moves less than 10°.

## Central finding: rotation is posed, not caused
The victim's rotation has no visible source in the thrower's body. The
thrower dips and drives forward, but its torso never turns; the victim's
π yaw and 73° pitch are applied directly to the victim's pose table
(yaw rotation + overBack flip + carryK blend). That is the mechanical
reason the throws read as "scripted launches": the causal chain
(thrower rotation -> grip -> victim rotation) is missing its first link
in the animation itself. Fixing this means either giving the thrower a
visible turn/drive that precedes and matches the victim's rotation, or
re-timing the victim's rotation to follow a thrower motion that is
already there. This is a Phase B/C design decision, NOT made here.

## Flags — abrupt reversals, unexplained accelerations, discontinuities
No torso angle jump over 15° in any tick, in either direction — the torso
itself never teleports. All discontinuities are limb-level (joints
identified by probe_ippon_snaps.cjs; victim t shown, probe ticks = capture
ticks - 20):
- Late carry feet (BOTH directions): lead foot 0.26-0.69 m at victim
  t = 20-23, rear foot / lead foot 0.67 m at release (air t = 0). Cause:
  carryKFeet starts at uu = 0.79, so the feet must cover their full blend
  in ~5 ticks. This is the largest discontinuity family.
- Mid-carry rear elbow (BLUE THROWS RED ONLY): 0.25-0.29 m at victim
  t ≈ 11-12. Red throws Blue has no equivalent. Cause under investigation
  (trap-arm blend geometry differs by victim style).
- Late-air hand/knee (BOTH): rear hand 0.19 m + rear knee 0.25-0.28 m at
  air t = 21-24 — the landing-blend onset (last 0.6 m) repositions the
  limbs just before touchdown.
- Getup elbows (BOTH): 0.21-0.28 m at getup t = 6-7 (staged-rise
  boundary).
- Getup HEAD (BOTH): 0.22-0.23 m at getup t = 25-26 — the head jumps during
  recovery; a Priority 1 (head-neck) issue in the recovery phase, not just
  in the throw.
- Getup rear elbow (RED THROWS BLUE ONLY): 0.70 m at getup t = 36 — exactly
  a staged-rise phase boundary (3 x 18f). Blue throws Red has no
  equivalent. Largest single recovery discontinuity.
- Reversal + acceleration (RED THROWS BLUE ONLY): getup t = 48,
  w_pitch -1.6 -> +1.9 rad/s (dW 3.5 rad/s) — a genuine small reversal as
  the victim settles to idle. No other reversals or unexplained
  accelerations anywhere (no ACCEL flags outside this one; no REVERSAL
  flags elsewhere).
- Flight non-monotonicity (BOTH, not flagged as abrupt because it is slow):
  torso 87.7° -> 99.1° -> 83.8°. Mid-flight pitch rate averages 0.73 rad/s
  (0.7°/tick); the longest sub-2°/tick run is 20 of 25 air ticks. So flight
  IS near-rigid mid-flight (the Oct 31 complaint stands), with motion
  concentrated at release transition and landing blend — and it peaks
  9° past horizontal (neck ~0.09 m below pelvis height), inside the
  existing inversion gate (0.10 m) but visibly head-low.

## Method notes (read before reusing the numbers)
- Yaw proxy caution: w_yaw here is the head-pelvis azimuth rate. Once the
  torso pitches past ~60°, the horizontal projection shrinks and azimuth
  becomes unstable — the getup w_yaw peaks (13.5 / 29.1 rad/s) are PROXY
  ARTIFACTS, not real spins. The reliable yaw evidence is the facing sign:
  flips to +1 at carry victim t = 15, is +1 at touchdown, and returns to
  stance facing (-1) by idle. A true yaw measurement needs a dedicated
  facing-axis tracker, not the head-pelvis azimuth.
- Forced vs gameplay: these ippon numbers do NOT describe the shipped G+P
  throws (style tables, release (3, 4.8), rigid run 10 ticks, touchdown
  56.8° -> 83.4°). Phase B must verify fixes on BOTH paths, or on the
  bound path once Kev binds it.
- Head-neck during ippon: max 0.481 m (2.0x anatomical 0.24), 29 frames
  over 0.30 — Priority 1 still fails on the ippon path too (from the
  cycle-151 diagnosis; unchanged here since no build change).

## What passes (for the record)
- No torso teleportation anywhere (no angle jumps > 15°).
- Facing flip completes during carry (t = 15) and holds through landing.
- Release velocity, flight distance, and apex are mutually coherent.
- Both directions symmetric except the four noted asymmetries (mid-carry
  elbow, getup elbow, getup reversal, carry-start pelvis x).

## Hold
No build change was made in this analysis. Phase B (torso-chain integrity)
and all later phases are HELD until Kev reviews these findings and
releases the hold. Open decisions for Kev (not made here): binding (which
throw G+P activates), whether the thrower should visibly turn to source
the victim's rotation, and whether flight should pitch toward landing
(the Oct 31 direction) or stay translational (the Oct 30 direction) —
the bounded-pitch resolution in the program doc covers the middle path.
