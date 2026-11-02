# Input buffer evaluation — 50 / 100 / 150 ms (2026-10-31)

Directed task (Kev, Oct 31 ~09:35 CT): evaluate input buffers of 50, 100, 150 ms for
punch-to-kick, punch-to-guard, evade-to-punch, grab-to-throw. Record accepted,
executed, expired, rejected; measure input-to-action delay, animation
discontinuities, balance violations, unintended repeated actions. Preserve
deterministic combat timing and server-authoritative results. Select on
responsiveness + biomechanical quality, not speed alone. Refine autonomously.

## Method

Probe `hidden_files/claude-loop/probe_input_buffers.cjs` on live build e9112cf7.
227 trials, each run twice (fresh load, same seed): **227/227 deterministic** —
same inputs give same results, so timing is deterministic and reproducible from
inputs alone (server-authoritative shape). Buffers tested as press-liveness
countdowns: 3 / 6 / 9 ticks at 60 fps = 50 / 100 / 150 ms. Current engine = 6.
Analysis `analyze_input_buffers.cjs`; raw JSON
`hidden_files/claude-loop/input_buffer_sweep_20261031.json`.

## Mechanism (read from source before measuring — reason-first)

- **Press liveness:** press() sets i.bp/i.bk = 6, decayed 1/tick. H0 carries only
  held keys (l/r/u/d/g); bp/bk survive tick()'s H0 assign because they are not
  in H0. So the current input buffer is 6 frames ≈ 100 ms.
- **Chain slot f.buf:** during atk, from su onward, a live bp/bk is captured
  (line 193) and fires at chainAt = su+ac+(rc>>1) if the strike connected, else
  at end of recovery (line 197). A captured buffer NEVER expires on its own;
  it is only dropped if the attack is interrupted (line 160).
- **Guard is level-held, not buffered:** i.g engages guard only from free
  states (line 174). A tap during atk is never read. A hold through recovery
  engages guard 1 tick after idle (measured: idle tick 25 -> guard tick 26).
- **Throw has TWO gates:** input gate d < 1.4 (G+P starts the throw) AND
  connect gate (thrower's strike point, at facing*0.75, within HURT_T 0.4 of the
  victim -> victim distance in [0.35, 1.15]). Between 1.15 and 1.4 the throw
  starts but ALWAYS whiffs — a 33-tick dead zone.
- **Chain slot has no 'T':** a G+P press during an attack feeds the slot as
  'P', never 'T'. Throws can never chain out of attacks.
- **Evade (step) is a free state:** a punch pressed during a step fires
  immediately (attack priority over movement); the held direction then steps
  again after the attack ends.
- **Hitstop freezes decay:** a hit sets hs=6 (strikes) / 8 (throws); frozen
  ticks do not decay bp/bk, so presses made during hitstop live longer in
  wall-clock terms. All delays below are game ticks unless noted.

## Results

### Punch-to-kick (hit; punch su=6, chainAt f.t=14, end f.t=19; hit freeze shifts fire to tick 20)

| buffer | press tick 1 | 5 | 6 | 9 | 13 | 16 | 19 |
|---|---|---|---|---|---|---|---|
| 50 ms (3f) | EXPIRED | K@20 | K@20 | K@20 | K@20 | K@20 | K@20 |
| 100 ms (6f) | EXPIRED | K@20 | K@20 | K@20 | K@20 | K@20 | K@20 |
| 150 ms (9f) | K@20 | K@20 | K@20 | K@20 | K@20 | K@20 | K@20 |

Capture boundary (press tick T chains iff T > 7-B, su tick 6): 50 ms needs the
press within the last 1 tick before su; 100 ms within 4 ticks; 150 ms catches
the whole startup. Once captured, fire timing is FIXED by chainAt/end — buffer
size changes WHICH presses survive, never how fast a chain fires. Whiff chains
fire at end of recovery (tick 19) for all buffers/offsets. Identical for both
styles. Zero repeats (one press -> at most one kick, all trials).

### Punch-to-guard (connecting punch; idle tick 25, first free tick 26)

- HOLD guard through recovery: guard@26 (delay 1 tick from idle). Works today.
- TAP during recovery (ticks 1-20, 25): NO guard in every case — including a
  tap ON the recovery-end tick (25), because the free-state check does not run
  on the tick the state flips. A tap on the first idle tick (26) guards at once.
- SIMULATED guard buffer (tap keeps g live B ticks): guard engages iff the
  live window covers tick 26. 50 ms bridges taps at 24-25; 100 ms at 22-25;
  150 ms at 20-25.
- STALE cost of a guard buffer: tap at 22 + punch press at 27 -> with 100/150
  ms the punch becomes a THROW (live g + bp in range), and guard had already
  engaged at 26. With 50 ms the punch stays a punch. Kick after a tap is never
  converted (kick fires normally; stale guard is 1 tick, then the kick).
- Reading: a tap that ENDS before recovery is a release, not a missed hold —
  the player let go of guard. Buffering it would create a guard state the
  player released. Holds already work. **No guard buffer is added.**

### Evade-to-punch (sidestep, then punch)

Buffer-INDEPENDENT: identical for 50/100/150 ms. Punch fires on the press
tick (delay 0-1) during the step, during step cooldown, and from idle.
Displacement at fire grows with step time (0.10 m at tick 1 -> 0.86 m at
tick 20). Connect pattern is geometry, not buffer: Blue connects at every
offset; Red connects only at tick 16 (idle after step, 0.76 m displaced) —
punches pressed in the first ticks after a step ends whiff (step-exit blend
still resolving), then connect. A punch ordered the same tick as a step fires
first; the held direction steps after the attack ends (deferred, not rejected).

### Grab-to-throw

- Stationary, all buffers identical: 1.5 m -> punch (degraded, whiffs);
  1.39/1.2 m -> throw fires but WHIFFS on strike-point range (no connect);
  0.75/0.5 m -> throw connects tick 5, releases tick 24 (Red) / 25 (Blue),
  22 damage, full recovery to idle.
- Walking in from 1.6 m, all buffers identical: presses at 0/2/4/5 -> punch
  (out of input range); at tick 6 (distance ~1.37) -> throw fires, whiffs on
  range. No gate-refusal delayed fires observed in any walking trial (the
  support-foot gate passed at every tested press tick).
- During a punch (all buffers, both styles): G+P -> chained PUNCH at tick 20
  (chainAt), throw NEVER fires, 0 connects. Total: first punch 8 + chained
  punch 8.5 = hp 83.5.
- During a sidestep, in range: throw fires immediately, connects (tick 11),
  22 damage. Evade-to-throw works.
- State whiff (corrected control): uppercut stumbles the defender; G+P at
  tick 27 fires a throw whose active frames run during the stumble -> NO
  connect, hp unchanged by the throw (86 = uppercut damage only).
- Style reach asymmetry (not a buffer effect): Red's jab fist extends to
  1.01 m (+0.065 forearm test) vs Blue's palm 0.85 m — so a degraded
  out-of-range punch connects for Red at walking offsets where Blue whiffs.

### Stun late-fire (press made while stunned)

- 50/100 ms: presses at stun ticks 14 and 20 EXPIRE; press at 26 fires at 27
  (1 tick, stun just ended).
- 150 ms: press at stun tick 20 fires at 27 (7 ticks late — fires at the
  FIRST free tick after stun, not after any unrelated action). This is
  standard input buffering (honor at earliest legal moment), not a repeat:
  one press -> one fire, in every trial of the sweep (repeat check empty).

### Animation / balance quality — buffer-INVARIANT (the selection's key fact)

Local-frame metrics (root-relative pose, flip-invariant) are IDENTICAL across
50/100/150 ms within every family: local joint step, local planted-foot
drift, neck-head max (0.256-0.264), pelvis-neck max (0.583-0.626). World-frame
maxima (up to 0.97 m) are root motion (knockback/launch) and facing-mirror
artifacts, not pose snaps — they do not vary with buffer either. No trial at
any buffer produced a double-fire, a stale fire after an unrelated action, or
a corrupted state. Pre-existing observations, NOT buffer effects, for a
future cycle: hit-reaction entry poses snap ~0.9 m local (idle->stun has no
entry blend); pelvis-neck exceeds the throw-program 0.57 m gate in strike /
stumble poses (that gate was throw-phase scoped).

## Selection

- **Press liveness: 150 ms (9 ticks).** Only size with zero expiries across
  all tested chain offsets; honors stun presses at the first legal tick;
  zero quality cost (metrics invariant), zero repeats. 100 ms (current) is
  the conservative fallback: it loses only near-simultaneous chain presses
  (1 tick after the punch) and mid-stun presses. 50 ms is rejected: it drops
  normal fast chains (presses 2-4 ticks after punch start).
- **Evade-to-punch / grab-to-throw: no separate timing.** Both are
  buffer-independent for fresh presses (immediate fire); the global press
  buffer covers them.
- **Punch-to-guard: no guard buffer.** Holds already guard 1 tick after
  recovery; taps ending before recovery are releases and are correctly
  ignored; any guard buffer introduces punch->throw conversion for follow-up
  punches pressed inside its window.

## Refinement (isolated candidate, PRESENTED-ONLY, not promoted)

`hidden_files/claude-loop/builds/vf-buffer150-working.html` — copied from live
e9112cf7, diff EXACTLY one line: press() 6 -> 9 (p/k/pk branches). AI presses
(lines 234-235) deliberately left at 6: AI timing is AI logic, not the player
input buffer. Live build byte-unchanged (sha e9112cf7e30df03b).
Verification through the real press() path (verify_buffer150.cjs, 2 runs each,
all deterministic):
- LIVE (6): P tick 0 + K tick 1 -> K LOST (P only, hp 92); P+K tick 5 -> chains
  K@20; stun press tick 20 -> expired (no fire).
- CANDIDATE (9): P+K tick 1 -> chains K@20 (hp 80.1); P+K tick 5 -> chains;
  stun press tick 20 -> P@27 (first legal tick).
Rapid-sequence regression on candidate vs live: BYTE-IDENTICAL (timed chains
4 presses -> 4 fires; mash 53 -> 7 fires; 0 NaN; 0 bad states; ends idle;
same hp/X). Chaining logic untouched; only press liveness changed.
Promotion to prototype/index.html requires Kev's authorization (directive
§6). Fallback to 100 ms is a one-number change (9 -> 6) if he dislikes the
stun late-fire.

## Recommendations (NOT implemented — design decisions for Kev)

- R1: Throw dead zone [1.15, 1.4): the input gate (1.4) is wider than the
  connect gate (1.15). Consider narrowing the input gate to the connect range
  or extending grab reach, so a throw press never buys a guaranteed whiff.
- R2: Chain slot has no 'T'. Consider adding throw to the chain slot so a
  throw pressed during an attack chains instead of degrading to a punch —
  a balance/feel decision, not a buffer fix.
- R3 (future cycle candidates): step-exit blend vs punch connect (ticks
  13-16 after step end); hit-reaction entry blends (~0.9 m local snap).
