# HIT Gait Reach / Whole-Body Congruency — Iteration 2
Date: 2026-11-04 · Branch: `cleanroom/combat-engine-v1`

## Implemented

- `src/foot-plant-render.mjs`: re-timed footstep cycles to six 60Hz ticks per swing at the current 3.2m/s simulation speed; stride budget raised to 0.95m; forward touchdown aim reduced to velocity lead + 0.15m. This avoids progressively trapping the support ankle several meters behind the fighter root. Planted feet remain fixed in world space between steps; one foot swings at a time. Added a smoothed per-tick support-leg sway signal.
- `src/hit-rig.mjs`: small, linked pelvis -> chest -> neck/head and shoulder/hip lateral displacement in response to support-leg state. Preserves fixed segment lengths and clean-room attack definitions.
- `test/foot-plant-render.test.mjs`: updated stride bound to match the speed-matched gait. `test/movement-qualification.test.mjs`: regression check requires planted-foot target/IK mismatch <0.10m in all ten movement scenarios. Tests are source-controlled; the full Node suite and CI have **not** been independently confirmed.

## Actual numeric evaluation

Executed all 16 deterministic no-attack replays in an isolated JavaScript harness using latest GitHub modules: `engine`, `hit-rig`, `foot-plant-render`, `movement-qualification`, `full-body-qualification`. The harness supplies a JSON clone polyfill and inert contact hooks (solo no-attack tests do not use collisions).

| Metric | Previous | Current |
|---|---:|---:|
| Worst planted target to rendered ankle discrepancy | 1.54m | **0.066m** |
| Worst COM-to-planted-foot support distance | 0.951m | **0.568m** |
| Worst moving joint displacement / 60Hz tick | 0.219m | **0.254m (regression)** |
| Numerical full-body support-screening passes | 6 / 16 | **6 / 16** |
| Moving scenarios within <0.10m ankle-reach discrepancy | not established | **10 / 10** |
| Limb segment length variations | within floating precision | within floating precision |
| Foot floor penetration | zero observed | zero observed |

**Remaining blockers are real:** all ten locomotion/stop/reverse scenarios continue to fail the current static support projection criterion, and faster swing joints exceed a 0.20m/tick motion review threshold. The existing static COM test is conservative and not a full dynamic stability criterion for fast running. It must not be used as proof of actual balance, nor should the test be weakened just to report more passes. A physical gait model with velocity-aware support and real foot contact dynamics is needed.

At 3.2m/s the simulated fighter is moving at a brisk running speed, not at normal martial-arts shuffle speed. The rendering layer currently attempts to depict it with a simplified walk-like gait. Next major architecture decision is to distinguish **stance/guard footwork**, **walking shuffle**, and **running/dashing** presentation states while leaving authoritative combat speed intact. The state transitions must carry stance and contact history.

## Next step (gated)

1. Explicitly model a walk/shuffle gait vs fast run; use speed/acceleration to pick timing with continuous phase handoffs.
2. Track dynamic supporting contact and upper-body momentum; validate leg reach and sway as well as continuous joint velocity.
3. Check user-visible side/3-quarter playback and run complete Node suite/CI. No real gameplay video was captured in this iteration.
4. Only after credible full-body motion and user visual approval, move from solo locomotion to punch/kick movesets.

**Moveset expansion remains on hold.**
