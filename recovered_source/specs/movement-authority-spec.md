# Movement-authority checks — autonomous combat regression suite

Added Oct 31 2026 under Kev's standing autonomous authorization (Oct 31
~01:15 CT). Probe: `hidden_files/claude-loop/probe_movement_authority.cjs`.
Gate: the shared `diff_contact_consistency.cjs` (same {runs, hard, soft}
shape; exit 0 = promotable, 1 = revert). Baseline:
`hidden_files/claude-loop/movement_authority_baseline_20261031.json`
(build fc837003, cycle 152). The probe is READ-ONLY (sha verified unchanged
before/after). It never touches button controls, the approved baseline, or
rollback backups; it only measures.

## Rule: one authoritative movement source per fighter per tick
A fighter's position/velocity on any tick must be explainable by EXACTLY ONE
row of the table below (plus the two tick-level meta-authorities). Two
writers moving the same fighter on the same tick is a defect, even if the
result looks fine: it means the next change to either writer can silently
break the other. The probe proves single authority two ways: (1) motion-law
checks — each state's velocity/position law must hold exactly on interior
ticks; (2) paired identity — the same throw/knockdown/stumble run with
opposing defender inputs from the handoff tick onward must produce
bit-identical trajectories (tolerance 0.001) through the handoff window.

## Authority table (from engine source, prototype/index.html)
| Fighter state | Authoritative movement source | What it writes | Player inputs do |
|---|---|---|---|
| idle/walk/guard/step (free) | PLAYER INPUT (+ auto-turn facing) | vx/vz fresh each tick: walk = facing x mf x FWD/BACK; step = side x STEPV; guard = vx x 0.7; idle = 0 | Direct: they ARE the authority |
| atk | MOVE TABLE (+ C2 chain drift when chained) | vx/vz x 0.85 decay; chained links: vx=vz=0, x += ax x CHAIN_DRIFT during su+ac | Buffered ONLY: inputs from su onward go to f.buf (chain window); never direct |
| stun | DECAY + timer | vx/vz x 0.88; ends at dur -> idle (+stunExit) | Ignored; buf cleared on leaving atk |
| down | DECAY + slide/bounce set at air->down transition | vx/vz x 0.9; ends at 55f (hp>0) -> getup | Ignored |
| getup | DECAY + staged rise (pose) | vx/vz x 0.9; ends at 54f (hp>0) -> idle, NEVER stumble after a fall (DQ17k) | Ignored |
| stumble | STUBSTEP (corrective steps chase COM) + one engine desperation strike at mid-stumble if sdesp | vx = -facing x step velocity, else x 0.8 decay; ends at sdur -> idle | Ignored (desperation is engine, not player) |
| carry | THROWER (anchor law) | Victim x = thrower.x + thrower.ax x anch; z = thrower.z + thrower.az x 0.8; y = lift curve; vx=vz=vy=0 | Ignored; victim velocities zeroed |
| air | PHYSICS | vx constant; vy -= GRAV x DT x 1.5 (= 0.6/tick); ground -> down with slide fraction + one bounce | Ignored |
| tick-level: SEPARATION | FINAL distance authority (runs after both updates) | If d < 0.6 and both y < 0.6: push both apart symmetrically to 0.6 | Subordinate: state motion yields to it |
| tick-level: HITSTOP | Global freeze (hs ticks) | No updates, no input decay, no separation | Registered during freeze, consumed after |

Anchor law detail: anch = 0.8 (style throws); ippon 0.8 -> 0.3 by
smoothstep over liftFrames=18; shoulder 0.8 -> 0.5. Lift: style/shoulder
CP.lift x smoothstep; ippon 0.65 x smoothstep over ticks 19-24. Separation
cannot fight carry: carry distance is always >= 0.8 (anch + 0.8 z-offset),
so the separation rule never fires mid-carry. One-tick ordering note:
update(a) runs before update(b), so a carry victim anchored to the thrower
uses the thrower's already-updated position; the victim is still
thrower-driven, just never staler than the update order.

## Handoff rules (explicit)
- go(): clears buf, captures originPose + rootX0/rootZ0, sets atk. Any state
  may enter atk only through go().
- Leaving atk clears buf (line 160: non-atk states drop buf — no stale
  combos). atk end: buf -> chained go() (at chainAt if hit, else at move
  end); desperation -> stumble (remainder); throw -> throwExit capture +
  idle; else idle.
- tryHit throw: requires victim grounded (y <= 0.05) and in a free state;
  damage 22 exactly once; victim -> carry (carryFrom + throwStyle +
  reposition to thrower + 0.8) or, if lethal, straight to air (K.O. path,
  carry skipped). hs = 8.
- Carry -> air at release tick: launch-table velocities + ic; carryFrom and
  throwStyle cleared. Air -> down on ground contact (slide fraction scales
  with momentum; one bounce on fast touchdowns). Down -> getup at 55f;
  getup -> idle at 54f. Stumble -> idle at sdur, or -> atk (desperation) ->
  stumble (remainder) -> idle.
- Mash grace: attack-button buffers live 6 ticks (bp decay). A mash press
  within 6 ticks before idle-entry may legitimately fire on the first free
  tick. Identity comparisons therefore run hit tick -> idle-entry tick
  inclusive; recovery checks start 10 ticks after idle-entry (bp decayed).

## Invariants checked every run (tolerances)
- Paired identity (HARD): post-handoff trajectories identical within 0.001
  (positions, velocities, states, timers, hp, facing) between idle-defender
  baseline and opposing-input variant. Any diff = authority leak.
- Carry anchor law (HARD): victim x/z/y within 0.02 m of the anchor law.
- Air law (HARD): interior air ticks: Δvx = 0 (±0.001), Δvy = -0.6 (±0.01).
- Down/getup law (HARD): interior ticks: velocity ratio 0.9 (±0.02).
- Attacker atk law (HARD): interior atk ticks: velocity ratio 0.85 (±0.02);
  chain-drift ticks exempt (vx = 0, x += ax x 0.030 — covered by existing
  C2 probes, not re-checked here).
- Free-state law (HARD): walk vx = facing x mf x FWD/BACK (±0.01); guard
  ratio 0.7 (±0.02); idle vx = 0 (±0.001).
- Separation (HARD): post-tick, if both y < 0.6 then distance >= 0.599.
- Facing (HARD): both free and grounded -> each faces the other.
- State validity (HARD): state in the known set every tick; all numbers
  finite; never both fighters in carry on the same tick.
- HP (HARD): damage exactly once at the hit tick (throw 22, launcher 16,
  stumble punch 14); no other hp change except a desperation hit landing
  during the victim's desperation attack window (stumble-forced-1 runs).
- Handoff bounds (HARD): throw victim idle by hit+220 ticks; knockdown
  victim idle by hit+300; stumble victim idle by hit+150; thrower idle by
  hit+60. (Generous bounds; timeouts mean a stuck state machine.)
- Recovery (HARD): after idle-entry + 10 grace ticks: 30 zero-input ticks
  with x constant (±0.001), state idle throughout, no phantom move; then
  fresh walk displaces >= 0.1 m in 10 ticks; then fresh attack fires
  (st == atk) within 10 ticks. Checked for BOTH fighters after throws.
- Separation count, desperation firing, and per-state law margins: reported
  (INFO), never gating alone.

## Scenarios (v1)
- Smoke: throw baseline driven by the REAL tick() vs the probe's
  tick-equivalent loop — state sequences must match within 0.001, or the
  probe reports PROBE_ERROR (suite invalid, not an engine flag) and stops.
  The loop mirrors tick() fight-phase core (H0 assign, bp decay, update
  order, separation, hitstop freeze) minus camera/sparks/message timers,
  which cannot affect fighters.
- Throws: shipped, both directions; baselines (idle defender) + 4 opposing
  defender-input variants each (walk away, walk toward, guard hold, attack
  mash), inputs starting at the hit tick (pre-hit approach is identical, so
  post-handoff identity is meaningful).
- Knockdown: launcher (L) baseline + combined opposing inputs during
  air/down/getup (walk away + guard + mash), identity from hit tick.
- Stumble: heavy punch (pn3, pw 14) with sdesp forced 0 (deterministic
  no-desperation) and forced 1 (desperation MUST fire mid-stumble);
  opposing inputs during stumble, identity through the handoff window.
- Recovery extensions on throw baselines (both fighters).

## Out of scope for v1 (stated, not hidden)
- Chained-move drift law (C2): documented in the table, covered by existing
  chain probes; the authority probe exempts drift ticks rather than
  re-checking them.
- Desperation-strike damage scaling detail: S2 allows one attacker hp drop
  inside the desperation attack window; exact scaling is covered by DQ19
  tests, not re-derived here.
- AI-driven inputs: the opponent in these runs is scripted, not ai();
  ai() writes only S[1].i and never touches S[0], so it cannot break the
  single-authority rule for S[0]; S[1] authority is proven by the scripted
  variants, which are strictly stronger (adversarial) than ai() choices.
- Netcode: "multiplayer state remains consistent" is verified here as
  single-simulation consistency (both fighters' state machines, shared
  damage/separation/facing invariants). There is no network layer in this
  build; no netcode claim is made.

## Promotion policy (automatic correct / revert)
- Same gate as contact diagnostics: the diff script exits 0 (promotable)
  iff no NEW hard-flag kind and no shared hard kind regressed beyond
  tolerance; otherwise AUTO-REVERT to the pre-cycle backup and log the
  diff. Soft/info findings feed the refine queue. Pre-existing hard flags
  do not block alone (a cycle promotes when it improves its target without
  adding or regressing hard flags). Results are AUTO-VERIFIED, never
  owner-approved.
