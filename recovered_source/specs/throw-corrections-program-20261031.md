# Throw corrections program — Kev directive 2026-10-31 ~00:28 CT

Source directive: "MUSE — CYCLE 150 THROW ANIMATION CORRECTIONS" (build 6c9b0e06,
cycle 150). Four priorities, five throw phases, verification requirements,
acceptance standard: every throw must communicate how one fighter causes the
other to lose balance and fall, from initial contact through final recovery.
Acceptance: autonomous per Kev's Oct 31 ~01:15 standing authorization — see Governance below.

## Diagnosis (measured on build 6c9b0e06, READ-ONLY probe, no build change)

Probe: `hidden_files/claude-loop/probe_throw_corrections.cjs`
Raw results: `hidden_files/claude-loop/throw_corrections_diag_20261031.json`
Anatomical references (engine constants): head-neck 0.24 m, pelvis-neck 0.55 m.

### Finding 0 — BINDING GAP (structural, report first)
G+P input (line 169) calls `go(f,'T')` with `throwMove` UNSET. The thrower
pose branch (line 362) then uses `THROW_PHASES[f.throwMove||f.style]` and the
victim carry/launch branches (lines 207, 340) use `THROW_PHASES[f.throwStyle]`,
where `tryHit` (line 124) sets `o.throwStyle = f.style`. There is NO assignment
to `throwMove` anywhere in the engine. Consequence: **in real gameplay, throws
are ALWAYS the style throws** (Blue arm-grab-turn, Red clinch-hip-toss). The
entire cycles 141–150 ippon lineage — facing flip, carry yaw, head convergence
— fires ONLY under harness forcing (`a.throwMove='ippon'` +
`d.throwStyle='ippon'`, probe_cycle150 pattern). **The slow-motion videos Kev
reviewed do not show what a player pressing G+P gets.** Style binding for
ippon (and shoulder) was already recorded OPEN; this program does NOT bind
without Kev's word. All phases below fix mechanics that apply to every throw
table, so whichever throw he binds is fixed.

### Shipped style throws (real G+P path; both directions, 0.50 / 0.75 m)
- P1 head-neck: max **0.505 m (2.1x anatomical 0.24)**, 25 frames > 0.30, worst
  at first air tick. Pelvis-neck max **0.785 m (1.43x 0.55)**, 24 frames > 0.65.
  CONFIRMED: head visibly separates from neck/body at the carry->air transition.
- P2 phase 1 (grip): closest approach 0.067–0.10 m during grab; drifts
  mid-carry to 0.214 m (Red throws Blue) / 0.383 m (Blue throws Red); at
  release 0.148 / 0.205 m. CORRECTION (Oct 31 ~01:00, cycle 151): the first
  probe run set throwMove='ippon' on the thrower, pairing ippon trap hands
  with a style-throw victim and overstating release drift as 0.77–0.82 m.
  The corrected probe (no throwMove on shipped runs) reproduces the capture
  evidence exactly. Grip is close at grab and near the gate at release, but
  FAILS the <=0.20 m gate mid-carry for Blue throws Red (0.383) and
  marginally at release (0.205); Red throws Blue is essentially at gate
  (max 0.214, release 0.148). The defect is mid-carry drift, not total
  grip loss.
- P2 phase 2 (balance disruption): ABSENT. Victim feet leave ground at victim
  t=2 (global tick 5), i.e. immediately at grab, before any visible unbalance
  or force generation. The victim is lifted, not unbalanced.
- P2 phase 3 (force): PRESENT in part — thrower pelvis dips to 0.597 m and
  feet stay planted (max lift 0.078–0.089 m). The victim's response does not
  follow it (see phase 2).
- P2 phase 4 (release): release (0.8, y 0.6) at (vx 3, vy 4.8); landing x 1.85,
  flightDx 1.05 over 21 ticks = 3 x 0.35 s. Displacement IS consistent with
  launch velocity; apex root y 0.88 vs ballistic 0.92 (discrete integration).
  Trajectory physics coherent; the POSE during flight is the defect, not the path.
- P3 flight: rigid-horizontal run **10 consecutive ticks** (start tick 22,
  angle > 70 deg with < 2 deg/tick change). Prolonged rigid plank: CONFIRMED.
- P4 landing: torso angle 56.8 deg at touchdown -> 73.2 (+3) -> 76.5 (+6) ->
  83.4 (+12). Not an instant snap, but it SETTLES INTO a fully flat plank
  (83 deg) with no recovery shape until getup.
- P2 phase 5 / P3 snaps: max single-joint step 0.444 m (down, elbow, tick 36);
  Red-throws-Blue run: **0.756 m elbow jump in getup (tick 96)** — recovery
  discontinuity.
- Hit snap: at 0.50 m approach the victim teleports 0.30 m at hit
  (reposition to thrower+0.8); at 0.75 m the jump is 0.05 m. Close-range
  entries read as scripted.
- Symmetry: both directions nearly identical (good); distance-independent
  except the hit snap.

### Forced ippon (cycle-150 lineage; harness-forced, NOT gameplay)
- P1: head-neck max **0.481 m (2.0x)**, 29 frames > 0.30; pelvis-neck max
  0.661 m, 21 frames > 0.65. The ippon lineage ALSO violates Priority 1.
  Mechanism (code): carry table head-neck distance is ~0.368 m in the table
  itself, plus the differential end-lift (head +0.22 vs neck +0.11 at full lu).
- P1/P3 carry snaps: single-tick foot jumps **0.686 m (fl, tick 21)** and
  **0.888 m (kr, tick 22)** — the carryKFeet blend starts at uu=0.79, so feet
  snap late in carry.
- P2 phase 2: BETTER than shipped — feet stay grounded until victim t=20
  (lift curve starts t=19). Grip still lost by release (0.769 m).
- P3 flight: rigid-horizontal run **21 ticks — the ENTIRE flight** (25 air
  frames). Cause (code line 394): ippon air rotation th = 0 * smoothstep =
  0, i.e. the Oct 30 "translational flight" directive implemented literally.
- P4 landing: touchdown ALREADY at **83.5 deg** (fully horizontal at contact)
  -> 91 deg. The defender arrives flat; the progressive weighted fall is
  bypassed, not preserved.
- Release (0.3, y 0.65) at (vx 4.8, vy 6.0); flightDx 2.0 over 25 ticks =
  4.8 x 0.417 s; apex 1.1 vs ballistic 1.15. Trajectory coherent.

### Root causes (code-level)
1. No torso-chain renormalization in carry/air. J3 (line 432) forces
   pelvis-neck 0.55 / neck-head 0.24 ONLY in down/getup. Carry blends and air
   tables stretch the chain freely.
2. Air pose rotation is zero (ippon, line 394) or near-frozen (style throws).
   Rotation INTO landing is absent.
3. Grip is positional, not anchored: thrower hands follow the thrower branch,
   victim follows its own table; nothing constrains hand-to-body distance.
4. Shipped throws lift at t=2: no grip -> unbalance -> lift sequencing.
5. Binding gap (Finding 0): ippon/shoulder unreachable in gameplay.
6. Late-onset blends: carryKFeet (uu>=0.79) and getup elbow path snap.

## Resolution of the Oct 30 vs Oct 31 flight directives
Oct 30: "flight translational, never upside down." Oct 31: "body rotation
follows the direction and mechanism of the throw." Both are honored by
BOUNDED PITCH TOWARD LANDING: the body pitches progressively from carry
attitude to a non-flat landing attitude across flight — no tumbling, no
inversion, never upside down (Oct 30 preserved), rigid plank removed
(Oct 31 satisfied). Tumbling would be a NEW directive, not assumed.

## Work plan (one measurable change per cycle, in order)
- Cycle 151: diagnostics-overlay capture tooling + BASELINE videos (NO build
  change): side + three-quarter slow-mo of shipped throws AND forced ippon,
  both directions, with overlay markers for grip anchors, foot contacts,
  pelvis trajectories, head-neck segment. This is the visual baseline the
  program measures against. No camera-change disguise: same cameras as cycles
  147–150, overlay ADDS information only.
- Phase B — Torso-chain integrity (P1): extend J3-style renormalization into
  carry + air poses (neck = pelvis + 0.55 along current neck direction; head
  = neck + 0.24 along current head direction). Scope: throw states ONLY;
  idle/strikes untouched. Gate: head-neck <= 0.26, pelvis-neck <= 0.57, all
  throw frames, both directions, both throw paths.
- Phase C — Grip anchoring (P2.1, P2.4): constrain the gripping hand to the
  victim's trapped-arm anchor through carry (pin: hand tracks anchor within
  <= 0.20 m until the release frame). Release still only after momentum
  (existing release ticks preserved unless a phase gate requires moving them,
  disclosed if so).
- Phase D — Balance disruption + force sequencing (P2.2, P2.3): shipped
  throws: delay victim lift until grip is established AND the thrower's
  dip/step is visible; victim pelvis shifts toward the thrower BEFORE feet
  leave ground. Thrower planted feet + dip preserved (already passing).
- Phase E — Flight rotation (P3): replace frozen air pose with bounded pitch
  from carry attitude toward landing attitude across flight; no inversion,
  no tumbling. Gate: rigid-horizontal run <= 5 ticks; max single-tick torso
  angle change <= 15 deg.
- Phase F — Landing progression (P4): touchdown at a ROTATED attitude (<= 70
  deg), then sequential settle (existing down settle extended so the body
  does not sit at ~90 deg through down). Preserve progressive weighted fall
  direction; NO ragdoll. Getup elbow snap (0.756) fixed here or Phase G.
- Phase G — Blend snaps (P3): spread carryKFeet across carry (no uu>=0.79
  cliff); fix getup elbow path. Gate: no single-joint step > 0.20 m in
  carry/air/down/getup.
- Phase H — Verification matrix (runs at every phase, full at program end):
  both fighters as thrower AND defender; starts from idle, guard, walk;
  orientations mirrored (Blue-left and Red-left); approach distances 0.50,
  0.75, and edge 1.15 (hit test: strike point 0.75 +/- HURT_T 0.40);
  side + three-quarter slow-mo + diagnostics overlay each time. Button
  control preserved: G+P still triggers, no cutscene, thrower recovers to
  stance on the existing timing (ippon +8f preserved unless disclosed).

## Acceptance gates (numeric; ALL must pass on BOTH throw paths)
- Head-neck <= 0.26 m, pelvis-neck <= 0.57 m, every throw frame.
- Grip distance <= 0.20 m from grab through the release frame.
- No single-joint step > 0.20 m in carry/air/down/getup.
- Rigid-horizontal run <= 5 ticks; flight displacement within 10% of the
  ballistic prediction from release velocity.
- Touchdown torso angle <= 70 deg; body does not sit >= 85 deg through down.
- Range + full-match + rapid-sequence + park fix still PASS; button control
  unchanged (G+P, no cutscene).

## Governance (autonomous, per Kev's Oct 31 ~01:15 standing authorization)
- Routine improvements are accepted AUTONOMOUSLY under the directive §5
  criteria (anatomical connections intact, no unexplained discontinuities,
  coherent contact/release, plausible balance/rotation/momentum, approved
  behavior functional, regression + gameplay tests pass, visual evidence
  supports the claim, no unacceptable perf regression). Results are labeled
  AUTO-VERIFIED, never "owner-approved." Cycles still report FIXES and
  REMAINING DEFECTS SEPARATELY, with videos + numbers, and the program stays
  open as a work program until its gates pass — but completion no longer
  waits on Kev's visual approval. This supersedes the Oct 31 ~00:53
  owner-approval gate for throw corrections and the rotation-findings hold;
  a live correction or override from Kev still applies instantly, and he may
  pause or revoke at any time.
- BINDING (which throw each fighter throws in gameplay) stays DEFERRED under
  directive §6 (fundamental game-design change). The loop refines mechanics
  on both paths and does NOT bind ippon/shoulder without his word.
- The Oct 30 "never upside down" constraint stands; the Oct 30 "translational
  flight" reading is superseded ONLY as stated in the Resolution section
  above (bounded pitch toward landing, no tumbling, no inversion).
