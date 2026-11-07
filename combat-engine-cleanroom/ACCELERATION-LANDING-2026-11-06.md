# Acceleration-aware first landing - 2026-11-06

Clean-room development basis: 3a6f2e64597419403df36e0531e13435e7366ce6. No legacy source or rules used.

## Correction and scope

The existing planner assumed the root would keep its current speed during early acceleration. Blue's forward replay therefore selected its left foot for both the first and second steps: the first landing target, set while speed was low, was quickly overtaken as the root accelerated. For newly planned longitudinal steps, estimate speed gain from consecutive finite velocity samples, bound it by the current unguarded/guarded engine speed ceilings (3.2/1.344m/s), and use the average estimated speed for touchdown planning. The established braking forecast is retained. Already airborne targets, planted anchors, combat authority and button controls are not changed.

This is a presentation prediction, not measured biomechanics. It is a partial movement correction. Guarded Blue still repeats its initial stepping foot in advance and retreat; reversal may repeat a foot when reach-based selection overrides alternation. The planner's speed ceilings must track any future engine speed changes.

## Verified locally

- Unrestricted acceleration forecasting produced 167/168 passing tests: `whole-body height changes remain bounded through stop, reverse and sidestep` failed at Blue lateral tick 27, 0.03215302058428482m (> 0.025m). That version was rejected. Complete affected trial source and output are in the Claude PDF.
- Limiting acceleration forecasting to longitudinal travel preserves the prior lateral planning. Native `npm test`: 169/169 passed. The added test checks the first two forward and backward steps for both fighters use different feet, without imposing alternation during reversals.
- Blue forward's first three swing launches changed from left, left, right to left, right, left. Blue guarded advance/retreat still repeat their first foot; no claim of natural gait or complete alternation.
- 24-case matrix: geometry 24/24, provisional joint continuity 24/24, static support 6/24. Thresholds unchanged; all 18 moving cases remain flagged.
- Estimated maximum static support offsets in Red forward decreased 0.337268m to approximately 0.286m, backward 0.390431m to 0.316m, reverse 0.401927m to 0.315m; whole-matrix worst remains Blue lateral 0.403481m. These are engineering screens, not physical balance proof.
- Maximum world joint step reduced from 0.191545m to 0.186047m across the 24 cases. 0 of 244 launch samples rose more than 1mm above the locked target (max 1.39e-16m). Existing ten-second planting/ground/reach checks and attack, stop and reversal tests were part of the local suite.
- Creator visual sign-off remains open. Source-rendered video is not browser footage. No deployment, moveset expansion, stage art or buttons were changed.

## Next

Address guarded step selection, preload and torso support together; investigate why the 18 static screens remain over 0.14m while checking momentum-based diagnostics, foot placement, and realistic movement. Test side and three-quarter views at normal and slow speed and request creator review before moveset expansion.
