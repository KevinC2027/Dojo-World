# HIT Solo Motion — Executed Diagnostic Report
Date: 2026-11-04 · Branch: `cleanroom/combat-engine-v1`

## Scope and verification
Four actual source modules (`engine.mjs`, `hit-rig.mjs`, `foot-plant-render.mjs`, `movement-qualification.mjs`) were retrieved from the development branch and executed together in an isolated JavaScript harness with a JSON structured-clone polyfill and inert hit-contact hooks, which are unused in no-attack solo scenarios. This is **not** the repository's full `npm test` run, GitHub Actions validation, browser screenshot evaluation, or a recorded game video. The numerical values below are direct outputs of `auditIndependentMotion()` after the latest targeted changes.

## Current numeric outcomes
- 14/14 scenarios executed (Blue and Red, each idle/forward/backward/lateral/reverse/stop/guard).
- Upper-arm, forearm, thigh and shin lengths remained constant to machine precision (max error approximately `4.45e-16 m`).
- No sampled foot penetration below the floor in these fixtures.
- Largest grounded foot slide from the rendered IK output: `0.0119 m` (11.9 mm) in one 60 Hz frame.
- Largest world-space joint displacement: `0.2178 m` in one 60 Hz frame.
- 5 of 14 scenarios **require review** because some joint traveled more than 0.20 m/tick:
  1. Blue forward: approximately 0.202 m.
  2. Blue reverse: approximately 0.202 m.
  3. Blue stop: approximately 0.202 m.
  4. Red backward: approximately 0.218 m.
  5. Red reverse: approximately 0.218 m.
- Other nine scenarios screened below the 0.20 m threshold; this is NOT visual or biomechanical approval.

## Work completed in this increment
- `src/foot-plant-render.mjs`: world-locked planted ankles, one-foot-at-a-time swing arcs, compact steps, direction/restart behavior, persistent five-tick guard blend.
- `src/hit-rig.mjs`: world-space ankle targets for IK, knees with upward/outward pole, smooth guard hand transition.
- `src/movement-qualification.mjs`: all solo replays use the shared tracker so diagnostic and visual pathways measure the same motion.
- `index.html`, `review.html`: world-space foot targets used during playable and replay render, including deterministic scrub reconstruction.
- `movement-review.html`: camera centered on the tested actor, not the 30 m distant inactive opponent.
- `test/foot-plant-render.test.mjs`: five new test groups committed (not yet confirmed in Node / CI).

## Next required improvements
1. Pinpoint the offending joints and frame boundaries for the five flagged sequences; improve foot swing timing, support polygon and turning without stretching bones or causing the planted leg to skate.
2. Measure guard entry and exit end-to-end (the isolated guard demo only covers entry).
3. Add visual evidence: normal-speed and slow-motion, side and three-quarter view clips from **actual source**, explicitly labelled as such. No clip was captured in this diagnostic run.
4. Run real `npm test` and confirm GitHub CI, plus browser visual validation.
5. Obtain creator approval for the independently animated stances and locomotion before implementing additional moves.

**Moveset expansion remains blocked.** Existing six rules-engine techniques remain intact and usable for regression only.
