# Combat Motion Specification v0.1 — DRAFT (Muse consolidation, 2026-10-30)

Status: DRAFT for Sonnet refinement. This consolidates standing rules already on
file (run log, legs-anatomy rules, DQ programs, Kev verdicts). Nothing here is
new canon until it survives a cycle gate. Where this draft conflicts with a live
Kev directive, the directive wins.

## 0. Pre-generation reasoning — MANDATORY for every technique (Kev, 2026-10-30 ~15:55 CT)

Errors are reduced at their source, not just caught afterward. BEFORE generating
any animation, Sonnet must internally determine — and state in its reply, ahead
of the diff — these five things for the technique in question:

1. WEIGHT ORIGIN — where the fighter's weight begins: pelvis/COM position
   relative to the feet at technique start, and which leg carries the load.
2. SUPPORT FOOT — which foot supports the movement, and through which
   single-support phases it stays planted while the other foot moves.
3. FORCE PATH — how force travels through the legs, hips, torso, and striking
   limb, in that order. Hips commit before the limb arrives; a limb arriving
   before the hips is a broken chain, not a faster strike.
4. TARGET REACH — how the technique reaches its target: posture-bound reach
   from the stance the fighter is actually in (DQ26 origin rule), the contact
   point, and the range at which contact happens. No snapping into a
   strike position to manufacture reach.
5. RECOVERY — how the fighter recovers balance and returns to an appropriate
   stance: foot repositioning, COM settling back over a support foot, and the
   move's recovery frames honored (rc), not silently shortened.

Only after stating all five may Sonnet generate the animation. Then Muse's nine
checks run on the result (combat-motion-checks.md). A diff that contradicts its
own stated determinations fails the consistency check, however clean it looks.

For throws, the same five apply with "target" read as the grip/contact on the
opponent and the throw path: weight origin, support foot through positioning,
force path through the turn-in, how the opponent is carried to the release,
and how the thrower recovers to stance after the toss.

## 1. Stance

- General idle: near-extended legs, slight natural bend only (idle knees
  ≥160° guide); upright posture; pelvis shifted toward the support leg.
- INDEPENDENT-LEG SUPPORT (standing law): legs never mirror. At any moment one
  leg is SUPPORT (foot planted, knee near-straight, hip–ankle line under the
  center of mass, carrying the load) and the other is FREE (unloaded, may
  bend/lift/swing/rest). Checks measure legs independently: per-leg knee
  angles, pelvis-to-support-foot offset.
- Style stances are directed exceptions: Blue = Kung Fu, Red = Boxing.
  DQ25 is Blue's adopted default: wide low, pelvis 0.70, feet 1.79 m apart.
- Support-foot gate: LIVE for neutral starts only, threshold 0.06.

## 2. Balance and weight transfer

- PHYSICS + CENTER OF GRAVITY is the acceptance focus for all motion work.
- Power follows base and weight transfer, not arm/leg extension alone.
- Walking and striking run through single-support phases with pelvis/COM over
  the support foot. Poor weight transfer = detectable failure (see checks).
- Stumble is a STANDING hit reaction at power ≥12 (below: recoil/hitstun only;
  above the band: fall), with COG-driven corrective steps and ~15% desperation
  strike. Never a post-fall event.

## 3. Kinetic chains

- DQ26 STANDING PROGRAM: strikes originate from the position the figure is
  already in. Reach is posture-bound. Figures do not snap into a strike
  position. No teleporting into a pose.
- Chain order runs base → hips → torso → limb. A limb arriving before the
  hips have committed is a snapping/continuity failure.
- Combo chaining: every startup tick chains for P/K/L (responsiveness fix);
  chain drift executed at 0.030.

## 4. Strikes (engine move table M, verbatim)

- P {su:6, ac:3, rc:10, dmg:8, reach:.85, h:1.35, kb:2.2, hs:14, bs:7}
- K {su:9, ac:4, rc:18, dmg:14, reach:1.15, h:1.0, kb:3.2, hs:20, bs:12, lunge:1.5}
- L {su:13, ac:3, rc:28, dmg:16, reach:1.0, h:.9, kb:4.0, hs:30, bs:18, launch:7}
- T {su:5, ac:2, rc:26, dmg:22, reach:.75, h:1.1, kb:3, hs:30, bs:0, throw:1}
- HURT=.3, HURT_T=.4. Skeleton: ARM1/ARM2 = 0.40/0.40, LEG1/LEG2 = 0.62/0.62.
- Swept contact is LIVE (XIAO_SWEEP=1): jab connects ~1.21 m, back palm ~1.32 m.
- POC technique mapping (to be confirmed in POC setup, not asserted here):
  jab and rear straight live in the P family; roundhouse kick lives in the
  K family. The POC names the exact engine moves before comparing.
- Reaction proportionality: reactions scale per MOVE (DQ16 base, DQ19 audit
  complete). Falls stay distinct per strike impact point.

## 5. Defense

- Sidestep is POSITIONAL: it dodges a throw only by physically leaving grab
  range, never by state/invulnerability. Open question (cycle 98, unanswered):
  whether a reactive sidestep may beat throws / RED overhand P4, or stays
  positional per the Oct 27 ruling. The layer does not settle this; Kev does.
- Guard-to-idle, walk-to-idle, idle-to-step, stun-exit blends are CLOSED for
  non-throw transitions (DQ91–96).

## 6. Footwork

- DQ15 walk accepted; gait by displacement; sidestep velocity ease; identical
  total displacement preserved across refinements (0.7348 vs 0.7349 m precedent).
- World-pinned feet: a planted foot does not slide. Foot sliding is a
  detectable failure (see checks).
- Thrower stepping: thrower step measured (0.696 → 0.246 precedent in DQ121);
  steps are part of the motion, not decoration.

## 7. Recovery

- Recovery frames (rc) are part of the move's cost and may not be silently
  shortened to make a motion "look" faster. The special move (DQ28, LAST)
  carries real travel arc, top-of-scale power, and real recovery cost.
- Landing variety, touchdown slide/bounce, and impact timing sync are part of
  fall recovery (DQ17b–g).

## 8. Legs anatomy (from legs-anatomy-rules.md, standing law)

- The knee is DERIVED from hip→foot distance (ik2), never authored directly.
- Route the foot around the hip, never at it. Move the hip away when the
  chamber collapses. Keep chamber distance at or above ~0.85 m.
- LEGFIX is gated OFF for kicks.

## 9. Throws (Oct 30 governing constraints, latest first)

- Victim flips facing left→right during positioning, then flies FORWARD over
  the thrower's shoulder (2026-10-30 ~15:43, confirmed ~15:44).
- Victim NEVER turns upside down at any point of grab, positioning, or throw;
  flight arc is translational, not rotational. Supersedes the earlier
  "flip only at toss/flight" allowance.
- Throw is ARM-DRIVEN: victim visibly pulled over the shoulder by the arm.
- Feet stay GROUNDED through pull-in and positioning; feet leave the ground
  only once the thrower has positioned into the throw position.
- Thrower does a 360 holding the opponent's arm to position in front.
- Thrower's arms drive FORWARD, never backwards; thrower positions himself so
  his arms are already set to throw.
- Figures stay realistically vertical (natural upright posture, slight natural
  bend allowed) while the thrower gets into position.

## 10. Technique classification — authentic core vs bonus (Kev's reference-library handoff, 2026-10-30)

- move_class is MANDATORY on every technique record: authentic_core or
  bonus_original. No missing provenance may be papered over with an invented
  style label.
- AUTHENTIC CORE: a recognizable documented technique and variant, correctly
  identified by discipline and name, backed by credible sources — not by the
  model's confidence alone. A named technique must visually express the
  mechanics distinguishing it from nearby techniques. If nomenclature or
  provenance is uncertain, mark UNVERIFIED LABEL and withhold it from the
  authentic core.
- BONUS / ORIGINAL: novel or hybrid concepts, explicitly labeled original or
  hybrid, offered as optional gameplay unlocks — never silently mixed into
  the base move set, never presented as historically authentic. Bonus moves
  still obey joint mechanics, support base, hit detection, responsiveness,
  and fair-combat constraints. No bonus technique is approved simply because
  Sonnet can code it.
- Authentic is not photorealistic: body mechanics must be credible; timing
  may be tuned for responsiveness so long as the technique stays legible,
  stable, and under player control. Every gameplay departure from reference
  is recorded as a gameplay adaptation, not claimed as raw biomechanics.
- The ten checks cannot certify authenticity. A separate authenticity review
  compares the motion to a credible style reference and the documented
  variant; with no reference evidence, authenticity is NOT_VERIFIED, never
  declared on a clean diff.
- DESIGN PRINCIPLE (Kev, 2026-10-30, Pilot C decision): authenticity
  describes HOW a technique is performed; progression determines WHEN the
  player gains access to it. A Muay Thai fighter may carry a Muay Thai
  technique in a standard moveset; a fighter from another discipline
  learning it as an unlockable bonus is a proposal requiring approval, not
  an approved unlock.

## 11. Failure patterns extracted from rejected work (for Sonnet to reason from)

- Mirrored legs / knee authored directly / chamber collapse.
- Snap into a strike pose instead of originating from the current pose.
- Victim inversion during a throw; victim draped/folded over the back during
  carry reading as upside down; victim "spinning in the air" instead of being
  thrown (positioning beat missing or too short).
- Thrower arms retracting backwards through the toss.
- Grabbed feet leaving the ground before the thrower is positioned.
- Elbow IK pop (0.696 vs ≤0.32 gate precedent, DQ120).
- Late-flight unwind before landing (DQ123 precedent: −0.152 vs ≥−0.15 gate).
- Load-shot fold reading as inversion even when the probe says carry is
  never inverted — the video read, not just the probe, is the verdict.
- Spin-peak arm dip (hr −0.140 at attT 11–12, DQ139 disclosed limit).
- Overwriting accepted work: any candidate based on a stale base that drops
  later cycles is rejected outright (refinement-batch precedent: base 19310adb
  vs current 2e0e80ad).
