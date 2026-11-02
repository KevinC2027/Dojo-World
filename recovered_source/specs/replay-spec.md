# Deterministic replay test — spec

## Purpose

Prove the combat simulation is deterministic, and measure exactly where
network-style input timing changes outcomes — without building netcode.
This build has NO network layer, no input tick stamps, and no
client/server split. The replay test therefore models network timing as
input-schedule transformations inside a single simulation:

- **Reference** = the server timeline. On-time inputs, fixed seed.
- **Replay** = the same schedule, fresh simulation, same seed.
  Must match the reference at every tick.
- **Delayed** = one fighter's inputs shifted +3 ticks.
- **Reordered** = one fighter's two input edges delivered swapped.
- **Authority re-run** = the reference schedule run again AFTER all
  variants, in a fresh simulation. Must match the original reference
  exactly. This is the server-authority check: variant simulations run
  in isolated simulations and can never mutate the authoritative
  timeline. A mismatch here means cross-run contamination, and it is a
  HARD failure.

Delayed and reordered divergences are EXPECTED FINDINGS, not engine
defects. They demonstrate that input timing matters and pinpoint where.
A delayed or reordered run with ZERO divergences would be suspicious
(the schedule change did not matter) and must be investigated, not
celebrated. Only replay and authority mismatches fail the gate.

## Determinism controls

- Fresh vm context per run; the engine script is loaded fresh each time.
- `Math.random` is replaced BEFORE load with a seeded PRNG
  (mulberry32, fixed seed), because the engine captures it at load
  (`const R = Math.random`). Both fighters' AI is disabled
  (`aiT = 1e9`, so `ai()` returns every tick without consuming
  randomness or touching inputs). The only remaining randomness in this
  scenario is the stumble desperation roll, which the seed fixes.
- Identical starting state every run: Blue (S[0], press-driven) at
  x = 0 facing +x, Red (S[1], directly driven) at x = 0.75 facing −x,
  both idle, hp 100, `phase = 'fight'`, `tm = 45*60`, hitstop 0.
- The real `tick()` drives every run. No tick-equivalent loop, so there
  is no loop-fidelity question: replay compares the engine against
  itself.

## Input schedules (ticks)

Attacker (Blue, via `press()`):
- tick 10: punch (`p`).
- tick 40: guard + punch together (`g` held, `p`) = throw (G+P).
- tick 45: guard released.

Defender (Red, direct `i` state each tick):
- Reference: guard held ticks 14–29, idle otherwise.
- Delayed: guard held ticks 17–32 (the whole guard window +3).
- Reordered: the guard-on edge (14) and guard-off edge (30) swap
  delivery: off arrives at 14 (no-op, already off), on arrives at 30,
  so guard is held from tick 30 to the end of the run.

Why this schedule: the attacker punch lands at tick 16. In the
reference the defender is guarding, so it blocks. In both variants the
defender is NOT guarding at tick 16, so it takes the full hit. Measured
first divergence is tick 14 (defender state: guard vs idle, the moment
the guard input itself differs), with the hit consequence at tick 16
(block chip vs full damage). The later throw (tick 40) still exercises
throw outcomes in all runs, since the defender is free again by then in
every run. Measured throw timing is identical across all runs (carry
45, release 64, touchdown 85, idle 194); only damage and landing
position differ.

Run length: 260 ticks, covering punch, block/hit, throw, carry,
release, flight, landing, down, getup, and idle re-entry.

## Compared state (every tick, both fighters)

Position (x, y, z), velocity (vx, vy, vz), combat state (`st`),
state time (`t`), hp, facing (`fx`). Floats within 0.001, states/hp/
facing exact. Also derived per run: hp-change events, and a throw
summary (first carry-entry tick, release tick, touchdown tick,
idle-entry tick, landing x, final hp both fighters).

## Divergence report

For each variant vs the reference:
- First divergence: tick, fighter, field, reference value, variant
  value.
- First input delta: first tick where the defender's guard input
  differs between the schedules, with reference vs variant values.
- Cause: assembled from those two facts plus the hp events near the
  divergence tick (e.g. full hit vs block). The probe reports the
  input delta and the state consequence; it does not guess beyond the
  recorded data.
- Total divergent ticks, and the throw-summary difference.

## Promotion policy

- Gate PASS requires: replay 0 divergences AND authority re-run 0
  divergences. Exit code 0 with both flags true.
- Delayed/reordered divergences never change the exit code.
- Replay or authority mismatch → exit 1, HARD failure, auto-revert
  any candidate built on the failing build; the divergence and its
  cause go in the run log.
- The probe is READ-ONLY: it never writes to `prototype/index.html`
  (build sha verified unchanged before/after every run).
- Baseline: `hidden_files/claude-loop/replay_baseline_20261031.json`,
  on the build current at first run.

## Honest scope

- Single-simulation model only. This test does NOT prove real
  networked play works, does NOT implement rollback, and does NOT
  change the engine. It proves determinism and measures timing
  sensitivity, which is the prerequisite any future netcode would
  need.
- One scenario, one delay (+3), one reorder (guard edges). Wider
  delays, both fighters delayed, and packet-loss models are future
  extensions, not claimed here.
