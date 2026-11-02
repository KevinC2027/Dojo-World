# IPPON SEOI NAGE — CONTACT CONSTRAINTS SPECIFICATION

Version: 1.0 — 2026-10-31 (Kev directive, main chat ~18:11 CT).
Status: SPEC ONLY. No engine change, no binding change. Ippon stays
harness-forced and unbound from G+P (binding deferred per the autonomous
directive §7). A build that implements this spec is a Phase 3 candidate and
promotes only on Kev's authorization per §6.
Probe: hidden_files/claude-loop/probe_ippon_constraints.cjs.
Baseline: hidden_files/claude-loop/ippon_constraints_baseline_20261031.json
(forced ippon, both directions, live build 786ac6bf).

## 0. Scope and honesty

- This spec governs the IPPON variant only (THROW_PHASES.ippon). Shipped
  G+P throws (lunge/back) keep their existing gates; nothing here changes
  them.
- This build has NO netcode. "Server-authoritative" in §7 therefore means
  SIM-authoritative: the single simulation's throw resolution is the
  outcome of record. There is no server in this build, and no claim is made
  otherwise. A future network layer must treat the sim outcome as
  authoritative and may only interpolate presentation, never re-resolve a
  hit, a miss, or damage.
- Bodies are stick figures: segments, not volumes. "Intersection" in §5 is
  a segment-distance proxy (§5.4), not volumetric collision. Drape contact
  (a limb lying across the torso during carry) is CONTACT, not penetration.
- Angles are interior angles from the probe's ANGLE convention (angle
  between the two segments meeting at the joint; 180 = straight). A joint
  passing through straight flips its bend side; that flip is the measurable
  hyperextension event (§5.3), since an interior angle alone cannot exceed
  180.

## 1. Engine grounding (live build 786ac6bf, verified from source)

THROW_PHASES.ippon:
- grab: up [4,14], hold 24, down 38; thrower offsets hl [-.05,-.12,.02],
  hr [0,-.15,-.02], pel [.14,-.16,0]; trapA [-.60,.45,.10] (rear hand),
  trapN [-.30,.40,.05] (lead hand).
- carry: lift .65, liftFrames 18, release 24, carryFrames 24,
  victim overBack: 1.
- launch: vy 6.0, vx 4.8, ic 'ippon'.
- Carry branch: thrower anchors at victim + facing * anch, anch 0.8 -> 0.3
  over carry; lift is a smoothstep completing at victim tick ~24.
- Victim carry pose: overBack flips x and mirrors y about 1.6; ippon
  overrides the victim rear hand to [0.57, 0.53, -0.32]; yaw rotates the
  victim a full 180 degrees over carry; feet bow outward late in carry
  (carryKFeet from uu 0.79 -> 1.0).
- Thrower ippon grab branch: step-in footwork (rear foot +0.30, lead foot
  -0.24 over the grab), pelvis dip, head/neck forward drive, both hands
  pulled in -0.40 plus trapA/trapN, then a turn-in over thrower ticks
  24-41 (rear hand +0.46, lead hand +0.12/+0.30).
- Cycle 153 grip anchoring (already in live): the thrower's LEAD hand (hl)
  blends to the victim's trapped hand (hl) over victim carry ticks 16-20,
  clamped to the 0.795 m arm reach, then fades out over the first 6 air
  ticks so the hand follows through instead of snapping back at release.
  This anchoring IS the sleeve grip's implementation; the constraints in
  §2 measure whether it actually holds.
- Rig constants: upper arm / forearm 0.40 / 0.40, thigh / shin 0.62 / 0.62,
  pelvis-neck 0.55, neck-head 0.24 (renormalized every throw-state tick).

## 2. Phase windows (victim ticks unless noted)

- GRAB (victim carry 0-15): grip establishing. Thrower steps in, turns,
  locks. Victim feet planted until balance breaks.
- LOCK/LIFT (victim carry 16-24): grip must be HELD (anchoring window
  16-20). Victim feet leave the ground; thrower completes the lift.
- RELEASE (carry 24 -> air 0-6): carry->air blend window. Grip fades out
  (hand follows through); it must not snap back.
- FLIGHT (air): ballistic + authored rotation to the ippon landing pose.
- LANDING (down): uke flat on back, tori standing in control (8-panel
  beat 8).
- RECOVERY (getup -> idle): both fighters return to stance.

## 3. Contact constraints

### 3.1 Gripping hand — thrower's lead hand (hl) to the victim's sleeve arm

The grip is the throw's causal chain: it is what makes the throw seoi
nage rather than a shove. It is measured two ways (§5.1):
- (a) Point grip (existing probe definition): min over thrower hands x
  victim {hands, elbows, neck, pelvis}. Carried over: <= 0.20 m during
  carry, <= 0.30 m at release (hard above 0.30).
- (b) Sleeve grip (NEW, this spec): distance from the thrower's lead hand
  (hl) to the victim's CONTROLLED-ARM segments (shoulder -> elbow ->
  wrist of the victim's lead arm, the trapped sleeve arm). Gates:
  - GRAB (carry 0-15): <= 0.20 m (establishing; the hand is travelling
    to the sleeve).
  - LOCK/LIFT (carry 16-24): <= 0.10 m (HELD — the hand is on the sleeve
    through the lift; this is the strict window).
  - RELEASE (air 0-6): fade-out allowed, <= 0.30 m, monotonically
    non-snapping (no single-tick jump > 0.20 m).
  - LOST = sleeve-grip distance > 0.30 m for 2 consecutive ticks inside
    GRAB or LOCK/LIFT, or > 0.30 m at release. A lost grip triggers §6,
    never a silent continuation as if held.

### 3.2 Defender's controlled arm — victim's lead arm (the trapped sleeve arm)

- Segment integrity: shoulder-elbow 0.40 and elbow-wrist 0.40 within the
  §5 segment-deviation gate (<= 0.10 m) at every tick. A stretched or
  collapsed controlled arm is a failed trap, not a style choice.
- Attachment: the controlled arm's shoulder stays attached to the victim
  torso (shoulder position is derived from neck + rotS; any shoulder
  reconstruction error shows up as segment deviation — no separate gate).
- Path: during LOCK/LIFT the controlled arm must be drawn ACROSS the
  thrower's back/shoulder line — measured as the controlled-arm midpoint
  passing within 0.25 m of the thrower's shoulder line (neck +/- shoulder
  offsets) at least once during carry 16-24, and the arm must end the
  carry draped over the thrower's back (overBack pose), not hanging free.
- No detachment steps: the controlled arm's wrist and elbow obey the
  §5 single-joint step gate (<= 0.20 m/tick). A wrist teleport is a lost
  grip even if the distance gate passes on the next tick.
- No hyperextension: the controlled elbow obeys §4 (interior >= 30,
  no bend-side flip). If the trap geometry demands an elbow beyond its
  range, the geometry is wrong (§6), not the joint.

### 3.3 Planted feet — all four feet, per window

A foot is PLANTED in a window when its world height is <= 0.02 m and the
window designates it weight-bearing. Sliding is horizontal displacement
while planted. Gates per window:
- VICTIM FEET (both), GRAB through feet-leave: both feet planted until
  balance breaks. Slide gate: <= 0.02 m per tick, <= 0.05 m total drift
  in the window. Feet-leave tick = first tick min(victim foot heights)
  > 0.05 m. Feet leaving BEFORE stable grip (3 consecutive carry ticks
  with point grip <= 0.20) is the shipped-throw lift-before-grip defect
  and is flagged the same way here: lift-after-stable must be >= 3 ticks
  (soft) and feet must not leave before FIRST grip contact (hard).
- THROWER PIVOT FOOT, turn-in (thrower atk ticks 24-41): the thrower
  rotates 180 degrees in front of the victim; one foot pivots. The pivot
  foot is DEFINED by the data as the lesser-sliding thrower foot in this
  window (no pre-designation by style — both directions are measured).
  Slide gate: pivot <= 0.02 m per tick, <= 0.05 m total drift. If BOTH
  thrower feet slide past the gate, the turn has no base (§6).
- THROWER STEP FOOT, grab (thrower atk ticks 0-24): the stepping foot
  travels (step-in +0.30/-0.24 authored); it is NOT planted during travel.
  It becomes planted at turn-in start (tick 24): from tick 24 it obeys
  the pivot-foot gate if it is the pivot foot, else it must re-plant
  within 3 ticks (world height <= 0.02 and slide gate thereafter).
- LANDING/RECOVERY: tori standing in control at beat 8 — both tori feet
  planted (height <= 0.02) and slide-free from touchdown +12 ticks
  onward; uke on his back (torso angle and joint heights per the existing
  touchdown gates).

## 4. Joint-range limits

Interior angles, both fighters, all phases unless a window says otherwise.
Limits are initial gates: if the baseline (§8) violates a limit on every
run, that is a reported conflict (§6), not a license to silently loosen
the limit.
- Elbow (both arms, both fighters): [30, 180] degrees. Below 30 = collapse
  (the existing probe hard-flags only below 5; this spec tightens it for
  ippon). No bend-side flip (§5.3) at any tick.
- Knee, THROWER: [70, 180] degrees. The tsukuri squat (tori low in front,
  hips under uke, 8-panel beat 4) is a deep bend but never a fold: 70 is
  the floor.
- Knee, VICTIM during carry/air: [90, 180] degrees. Uke is loaded, not
  squatting; a folded victim knee during carry is a rig failure.
- Knee, both fighters, down/getup: [60, 180] degrees (landing and
  recovery allow deeper bends).
- Neck/head: head-neck <= 0.26 m and pelvis-neck <= 0.57 m at every tick
  (carried over from the contact gate; the J3 renormalization holds these
  by construction in throw states — a violation here means the
  renormalization itself broke).
- Segment deviations (all bones): <= 0.10 m (carried over).
- Torso lean, THROWER at kake (carry 20-24): torso angle from vertical
  <= 60 degrees forward (tori bends over to throw, does not fold flat).
- Torso, VICTIM at landing: touchdown torso angle <= 70 degrees from
  vertical is the existing soft gate; for ippon beat 8 (flat on back)
  the landing pose must additionally show uke's head height within
  0.25 m of ground level at touchdown +12 ticks (flat, not propped).

## 5. Measurement protocol (per-tick series, grip -> recovery)

The probe records a full per-tick series for the whole throw (grip
establishment through getup -> idle) and summarizes per window. All
distances are world-space, via the engine's own transform.

### 5.1 Grip separation
- pointGrip[t]: existing definition (min thrower hands x victim
  {hands, elbows, neck, pelvis}).
- sleeveGrip[t]: distance from thrower's lead hand (hl) to the victim's
  controlled-arm segments (shoulder->elbow, elbow->wrist), point-to-
  segment, min of the two segments.
- Grip state machine per run: ESTABLISHING (carry 0-15), HELD (first tick
  of 3 consecutive carry ticks with sleeveGrip <= 0.10), LOST (tick of
  first 2-consecutive-tick breach per §3.1, or null). Report: held tick,
  lost tick, max sleeveGrip per window, ticks over each gate.

### 5.2 Foot sliding
- Per foot (thrower fl/fr, victim fl/fr): world height series, horizontal
  displacement per tick, cumulative drift per window.
- Report per window: max per-tick slide, total drift, planted-tick count,
  feet-leave tick (victim), pivot foot identity + drift (thrower
  turn-in), re-plant tick (thrower step foot).

### 5.3 Joint-limit violations
- Per joint (elbows, knees, both fighters): interior-angle series, min/max
  per window, ticks below the §4 floor, max exceedance.
- Bend-side flip: sign of the elbow/knee offset perpendicular to its
  shoulder->hand / hip->foot axis, per tick; a sign change between
  consecutive ticks = a flip event (joint passed through straight).
  Report: flip count + ticks. Any flip is hard.

### 5.4 Body intersections
- Segment-distance series (existing probe definitions): torso-torso,
  head-to-thrower-torso, pelvis-to-thrower-torso, limb-to-thrower-torso
  (min over victim hands/feet).
- Penetration ticks: ticks where a pair distance < 0.005 m, counted per
  pair per window — EXCEPT drape pairs, which are contact by design and
  are never counted as penetration: (a) victim torso vs thrower torso
  during carry (the load), (b) victim controlled arm vs thrower torso
  during carry (the drape over the back), (c) victim torso vs thrower
  torso during the first 6 air ticks (release follow-through).
- Crossing proxy: a pair whose distance falls below 0.005 m AND whose
  closest-point parameters swap ends between consecutive ticks is
  reported as a crossing event (stronger evidence of pass-through than
  proximity alone). Limitation stated plainly: true volumetric
  interpenetration is not modeled in a stick rig; distance + crossing
  proxy is the measurable stand-in.

### 5.5 Carried-over gates
- Single-joint step <= 0.20 m/tick (all joints, all windows).
- Segment deviation <= 0.10 m; head-neck <= 0.26 m; pelvis-neck <= 0.57 m.
- No inverted ticks in air (head > 0.10 m below pelvis height) — note:
  the 8-panel beat 7-8 shows uke rotating over the shoulder and landing
  on his back; inversion DURING the throw arc is staging, but the probe
  counts air ticks with head below pelvis as the existing inversion
  metric, and the ippon landing pose (flat on back, head at ground
  level) is judged by §4's landing rule, not by the inversion count.
- Range, full-match, rapid-sequence, park-fix regression tests run on
  any build touching these constraints (unchanged).

## 6. Conflict priorities and failure transitions

### 6.1 Priority order (highest first)
When two constraints cannot hold at once, the higher one wins and the
lower one is sacrificed openly — the sacrifice is logged, never hidden.
1. AUTHORITATIVE OUTCOME. The throw's resolved result (hit/miss, damage,
   KO state), decided at connect, NEVER changes because a constraint
   failed. Constraint failures change only the animation path.
2. INPUT RESPONSIVENESS. Input processing never waits on constraint
   solving (§7). A solver that needs a frame of lookahead is rejected.
3. GRIP CONTACT (§3.1/§3.2). The sleeve grip is the throw's causal chain.
   If it cannot hold, the throw degrades (§6.2) rather than proceeding
   as if held.
4. SUPPORT-FOOT PLANTING (§3.3). The pivot foot is the throw's base. A
   turn with no planted base cannot produce a credible throw.
5. JOINT-RANGE LIMITS (§4). No hyperextension, no collapse — anatomy
   beats appearance.
6. NO INTERPENETRATION (§5.4, non-drape pairs). A limb passing through a
   torso is worse than a stiff pose.
7. CONTINUITY (§5.5 step gate). Lowest: a brief blend discontinuity is
   preferable to violating 3-6. NOTE — this deliberately demotes the
   0.20 m step gate below anatomy/contact for ippon: cycle 167 proved
   per-tick clamps relocate snaps rather than removing them, so when a
   fix must choose, it sacrifices smoothness, not the joint or the grip.

### 6.2 Failure transitions (physically plausible, outcome-preserving)
- Grip lost BEFORE lift (GRAB window, before feet-leave): the throw
  attempt degrades to a broken clinch — victim stumbles back (stumble
  state), thrower recovers to idle. Damage already resolved at connect
  STANDS (it was impact, not the throw); no launch, no flight, no ippon
  pose. The animation must not show a throw that did not happen.
- Grip lost DURING/AFTER lift (LOCK/LIFT, RELEASE, FLIGHT): uke separates
  into a breakfall along the current ballistic path — air -> down with
  the authored landing minus the over-shoulder rotation. Damage stands;
  the ippon scoring pose does not occur.
- Pivot foot slides past gate during turn-in: one corrective re-plant
  step is allowed (foot lifts, re-plants within 3 ticks). If both feet
  slide past gate, degrade to a push/clinch break (damage stands, no
  flight).
- Joint-limit conflict (trap geometry demands an out-of-range joint):
  ease the trajectory first — widen the arc, reduce the overBack
  rotation, delay the yaw — within the same tick budget. If still
  unsatisfiable, degrade per the grip-loss transition for that window
  rather than violating anatomy.
- Intersection conflict (non-drape pair penetrates): offset the drape —
  the offending limb passes BESIDE the torso line (increase lateral
  separation) rather than through it. If the offset breaks the grip,
  grip priority (§6.1 rank 3) decides: the grip holds and the limb
  offset is found another way, or the throw degrades.
- UNRESOLVABLE: if no adjustment and no failure transition fits (e.g.
  the authored carry trajectory itself forces a violation in every
  variant, as cycle 167 found for the shipped knee chain), REPORT THE
  CONFLICT with the measurements, preserve the current build, and
  escalate per directive §6. Never silently loosen a gate to make a
  candidate pass.

## 7. Input responsiveness and authoritative outcomes

- Input path UNCHANGED: G+P drives the throw exactly as shipped throws
  (go(f,'T') -> tryHit -> carry -> air -> down -> getup). No new input
  state, no new button, no input consumed by constraint solving.
- Buffer UNCHANGED: live press liveness is 6 ticks. The 150 ms (9-tick)
  buffer candidate is ISOLATED, NOT promoted, and this spec does not
  assume it. Chain-slot and guard behavior are untouched.
- Solving is closed-form per tick (IK + clamps + blends already in the
  engine). No iterative solver, no lookahead frame, no added input
  latency: pose() runs after input processing in the same tick, as now.
- Authority: the tryHit resolution is the outcome of record. The
  deterministic replay probe (probe_replay.cjs) must remain 0-divergence
  on any build changing these constraints — a build that changes
  replay behavior is rejected regardless of its constraint scores.
- The failure transitions in §6.2 change ANIMATION PATH only. They never
  re-decide hit/miss, never alter damage, never revive a KO'd fighter,
  never change the round result.

## 8. Baseline and acceptance

- Baseline (this spec's first measurement): forced ippon, both
  directions, live build 786ac6bf — see
  hidden_files/claude-loop/ippon_constraints_baseline_20261031.json.
  Headline baseline findings are summarized in the delivery message and
  in the baseline file's `notes` field.
- Acceptance for any future ippon candidate: all §3 gates per window,
  all §4 limits, zero hard intersection events (non-drape), zero
  bend-side flips, plus the carried-over regression tests (§5.5). A
  candidate that trades a §6.1 rank 3-6 violation for a continuity
  improvement is REJECTED — continuity is rank 7.
- Gates are versioned with this spec. Loosening a gate requires a new
  spec version with the reason recorded — never a quiet edit.

## v1.1 corrections (2026-10-31, from the first baseline run on live 786ac6bf)

These corrections were forced by the measurement itself and are recorded
here rather than silently edited into v1.0, per §8 versioning.
1. RELEASE sleeve-distance gate REMOVED. After release the victim flies
   ballistically away from the thrower, so sleeve distance grows by
   physics, not by failure. Replaced by RELEASE hand-continuity: the
   thrower's lead-hand step during air 0-6 must be <= 0.20 m/tick (no
   snap-back during the cycle-153 fade). Baseline: 0.167/0.164 m — PASS.
2. Grip LOSS now requires a prior HOLD, and is judged on carry ticks
   only. The v1.0 detector fired "lost at tick 0" before any grip existed
   (forced-path artifact) and would have fired again at release
   (expected separation). Baseline with the fix: held 17/18, never lost.
3. Bend-side flip metric INVALIDATED as a gate, kept as experimental
   data. The facing-frame lateral sign flips whenever the FRAME rotates
   (turn-in yaw, victim tumble), so counts (10-66 per joint) measure
   frame rotation, not hyperextension. A valid formulation needs a
   body-local reference (e.g. sign against the torso's own lateral axis
   from rotS) and is future work. §4's "no bend-side flip" gate is
   SUSPENDED until that formulation exists; interior-angle floors still
   apply.
4. GRAB-window grip, victim planted feet, and pivot foot are
   UNMEASURABLE on the forced path, not passing. The forced harness
   teleports the victim into carry (no grab approach, no pre-carry
   standing phase), and the turn-in (thrower ticks 24-41) moves NO
   thrower feet — the current ippon turn is upper-body-only. These gates
   need either a bound gameplay throw or a grab-first harness that runs
   the thrower approach before forcing carry. Their baseline numbers are
   reported, never judged.
5. Victim carry knee floor (90 degrees) RETAINED against the baseline
   conflict. The authored drape folds victim knees to 51.7-76.8 degrees,
   but the 8-panel diagram beat 6 shows legs EXTENDED over the back.
   The floor stands; the pose is the defect. Loosening the floor to fit
   the pose would bless a deviation from Kev's visual target.
6. Direction asymmetry recorded, not explained away: Red-direction LOCK
   sleeve grip (0.651 m) is far worse than Blue (0.213 m), and point
   grip agrees (0.481 vs 0.156). Suspected stance/facing geometry, NOT
   yet proven — a Phase 3 investigation item.
