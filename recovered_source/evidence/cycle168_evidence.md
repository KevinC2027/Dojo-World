# Cycle 168 evidence — live-build validation-only (Phase 1, VALIDATION-ONLY)

Live build UNCHANGED: prototype/index.html sha256
786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b
(Kev-authorized no-163 merge, 2026-10-31 ~16:30 CT). No candidate built, no
candidate presented, no promotion, no state refresh, no staging commit.

## Why validation-only (not a new build cycle)
Cycle 167 (17:00 CT) ended BLOCKED/ESCALATED on the held 163 knee fix after
3 correction rounds, with an explicit next step: Kev's call on (a) carry
vicT 7-10 trajectory re-author/re-time, (b) re-scoping the 0.20 m knee gate
for that window, or (c) accepting 163/v8 grip gains with the knee peak as a
known open defect. It also directed that the next cycle must NOT re-attempt
per-tick knee clamps (proven to relocate, not remove, the snap) and must NOT
present v8 as a knee fix. This cycle honors that: no knee work, no new
candidate stacked on unauthorised presented candidates, no churn. It
re-verifies the live build instead.

## Problem selected (Phase 1, shipped throws, genuine G+P path)
Confirm the live build's current state one hour after the 167 escalation:
shipped G+P throws through genuine inputs, gameplay preservation, and
whether any new hard flag has appeared since cycle 167.

## Reason-first
No build change, so no new reasoning case. The shipped throw's force path
and timing are as measured on the live build in prior cycles — thrower
hips/legs drive, victim weight on own feet until lift, release tick 15,
touchdown tick 36, recovery to idle.

## Change
NONE. No working copy created, no edit to prototype/index.html, protected
files untouched.

## Measured on live 786ac6bf this run (probe_all_defects.cjs, 6 runs)
Shipped, Blue throws Red: hit 4, release 15, touchdown 36, down end 145,
flight 21 ticks, dx 1.05 m, apex 0.88. Grip carryMax 0.209 m, atRelease
0.205 m, atLift 0.119 m, over-gate 1 tick, feet leave tick 5, liftAfterStable
0. HN max 0.247 m, PN max 0.560 m. Hard flags (pre-existing, identical to
cycle 167's live file): joint step 0.318 m (er @34, air descent), segment
dev 0.263 m (vic.foreArmL @8). Inverted ticks 0.
Shipped, Red throws Blue: hit 4, release 15, touchdown 36, down end 145,
flight 21 ticks, dx 1.05 m, apex 0.88. Grip carryMax 0.242 m, atRelease
0.148 m, atLift 0.216 m, over-gate 3 ticks, feet leave tick 5,
liftAfterStable -2. HN max 0.247 m, PN max 0.557 m. Hard flags (pre-existing,
identical to cycle 167's live file): joint step 0.379 m (kr @10, carry),
segment dev 0.416 m (vic.thighR @10). Inverted ticks 0.
Forced ippon / shoulder runs: informational only, values unchanged in kind
from cycle 167 (ippon forced kr step 0.892 m Red; shoulder inverted 21 ticks
— both are unbound/forced variants, not gameplay, never promotion-blocking).
No NEW hard flag vs cycle 167's live measurement; shipped runs match
cycle167_live_alldefects.json exactly on the headline values above.

## Tests (honest status)
- Contact probe (6 runs): RAN — shipped hard flags are the two pre-existing
  pairs above, no new hard kind; gatingHasHard TRUE on the pre-existing
  shipped defects only (not a new failure).
- Rapid-sequence: PASS — timed chains 4 presses -> 4 fires, mash 53 presses
  -> 7 fires, 0 NaN, ends idle.
- Movement-authority: PASS — smoke OK, 15 runs, hard [] / soft [], gatingHasHard FALSE.
- Replay: PASS — reference and replay identical (carry 45, release 64,
  touchdown 85, idle 194, landingX 1.730).
- Park fix: PASS — line 222 present in live build.
- Full match: NOT RUN this cycle (range/rapid/replay cover its thresholds;
  throw timing/flight identical to cycle 167's verified values).
- Ten checks (live build): 1 foot sliding PASS by measurement (no new
  skating reported); 2 joint snapping NOT PASS on the known shipped flags
  above, disclosed, unchanged; 3 impossible limbs PARTIAL (segment devs
  above, pre-existing); 4 weight transfer PASS by preservation; 5 stance
  PASS by preservation; 6 continuity PARTIAL (known carry/air steps);
  7 throw-specific PASS for gameplay path (G+P, both directions, full
  grip->recovery, damage applied — video end HP 100 vs 78 both directions);
  8 base integrity PASS (live sha verified before and after); 9 input
  responsiveness PASS (rapid); 10 reasoning-consistency PASS for this
  validation-only scope (no new reasoning claim made; authenticity gate
  not invoked for a no-change cycle).
- Genuine gameplay inputs: YES for shipped scenes (video uses real
  press('g') + press('p') at the G+P path, both directions, side view,
  slow-motion with diagnostic overlays: grip line, foot-contact dots,
  pelvis trails, head-neck distance).
- Device test: NOT RUN (Kev-gated).
- Claude dispatch: NONE attempted (takeover; credits exhausted, no purchase,
  no billing change). No dispatch error was observed this cycle, so no
  BLOCKED/credit signal is claimed and no cadence change is triggered.

## Videos (scripted harness captures of the LIVE build, NOT a candidate)
- files/Street_Dojo_Feature_Cycle168Validation_RedThrowsBlue_2026-10-31.mp4
  (368 frames, 12.27 s slow-mo w/ overlays, 483K)
- files/Street_Dojo_Feature_Cycle168Validation_BlueThrowsRed_2026-10-31.mp4
  (368 frames, 12.27 s slow-mo w/ overlays, 482K)
Both: genuine G+P inputs, both fighters end idle, victim HP 100 -> 78.

## Remaining
- Cycle 167 escalation still open: Kev's call on the 163 knee-fix options
  (re-author/re-time carry vicT 7-10, re-scope the knee gate, or accept
  grip gains with the knee peak open). Until then, no knee-clamp re-attempt.
- Presented candidates 159-166 were authorized and merged 16:30 CT except
  163 (held); 163 remains held, its v8 grip variant is NOT presented as a
  knee fix.
- Pre-existing shipped hard flags on live: Blue er 0.318 m @34 +
  foreArmL 0.263 m @8; Red kr 0.379 m @10 + thighR 0.416 m @10; plus soft
  grip/lift items (Blue liftAfterStable 0, Red -2; Red grip at lift 0.216 m).
- Buffer candidate still isolated; ippon binding still deferred; env still paused.
