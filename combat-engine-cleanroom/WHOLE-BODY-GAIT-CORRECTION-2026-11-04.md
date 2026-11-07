# Dojo World — Whole-Body Gait Posture Correction
Date: 2026-11-04 · Branch: `cleanroom/combat-engine-v1`

## User visual directive

"Legs straighten up in between strides," with no overemphasis on animated knees/joints. **Whenever a movement changes, review anatomy as a congruent whole:** foot/ankle → knee/hip → pelvis → spine/chest → shoulders/arms → neck/head. The body should read as a convincing solid fighting silhouette, not a highlighted moving skeleton.

## Root cause and implementation

The original Blue presentation hip was near 0.84m while the thigh+shin chain totaled 1.01m, leaving Blue ~64° knee flex even at rest; Red was ~41°. The solution is NOT to forcibly straight-arm the knee. The presentation tracker computes a higher stance pelvis from its **planted feet and actual IK reach**, carries the elevation as continuous state and moves all landmarks with it.

Committed:
- `src/foot-plant-render.mjs`: `postureLift` tracked across fixed ticks, initialized at extended stance, constrained by existing anchored foot reach, eased upward/downward with grounded reach taking priority.
- `src/hit-rig.mjs`: same vertical posture displacement applied to pelvis, chest, neck, head, shoulder roots, arm targets and hip roots. Added subtle velocity-based torso lean and opposite-arm gait response; guard suppresses walking arm swing.
- **Critical handoff fix:** when movement enters punch/kick startup, the rig does not drop its body lift or reset its stance foot anchors. Punches inherit their current wrist baseline and elevated chamber/contact positions; kicks inherit their start foot position and continue to preserve supporting ankle targets.
- `test/anatomical-gait.test.mjs`: five whole-body anatomical regression test groups.

## Source-driven measurements

All 24 solo scenarios executed using the actual current clean-room source files in an isolated JS compatibility harness. The five new authored anatomical test groups were executed from their source using the same harness: **5/5 passed**. This is not the complete real `node --test` suite or GitHub Actions CI.

| Measurement | Before upright correction | After |
|---|---:|---:|
| Blue idle median planted-knee flex | ~63.7° | ~35.5° |
| Red idle median planted-knee flex | ~41.1° | ~18.1° |
| Blue forward median planted-knee flex | ~58° | ~26.9° |
| Red forward median planted-knee flex | ~45° | ~24.3° |
| Worst 24-scenario IK foot target mismatch | ~3.62cm | approximately 0 within floating precision |
| Worst 24-scenario joint displacement per 60Hz tick | ~24.4cm | ~23.2cm |
| Static foot-support screen passes | 6/24 | 6/24 |

The entire vertical torso span and shoulder-to-chest / hip-to-pelvis relationships stay constant within floating precision.

The movement-to-attack transition previously dropped Blue's entire body ~11cm and snapped the local foot poses by roughly 0.52–0.58m. With the shared pose and anchor fix, Blue's posture height does not drop at startup; two local foot steps at startup are ~0.046m and 0.135m, consistent with a continued pre-existing swing. The whole-body startup regression now passes the screening bound.

## Unresolved, not approved

1. **Body motion still needs actual side/three-quarter visual inspection in the game.** Computational knee angles and bone lengths cannot prove naturalness.
2. Some **active-attack window transitions remain too abrupt** (a Blue straight local joint can move ~0.58m during a single active transition in a stress test). Attack contact timing and action phase blending require separate correction before approving combat realism.
3. Static COM/support still fails for all 18 moving cases. Dynamic capture-point/landing model also remains an approximation; no physical balance proof.
4. Full Node test suite, browser playback, GitHub CI and video capture for this latest revision have not been verified.

**Next:** produce a fresh video comparing whole-body natural gait normal-speed and slow-motion after this posture update; perform human visual evaluation; add physics/phase continuity tests for support and attack transitions. No moveset expansion until accepted.
