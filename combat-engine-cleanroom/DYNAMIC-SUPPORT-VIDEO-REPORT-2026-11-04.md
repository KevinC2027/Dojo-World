# HIT Whole-Body Lab — Current Video and Dynamic Balance (2026-11-04)

## Visual evidence
A 5.96s MP4 was generated in the session working directory as `HIT-Dojo-World-Full-Body-Progress-Source-Preview.mp4`. Its pose samples originate from the current clean-room `CombatWorld` snapshots and the `fighterRig` presentation module on `cleanroom/combat-engine-v1`: Blue `guardAdvance` and Red `reverse` at six-tick intervals. For a lightweight video, source-derived 2D joint projections were interpolated between engine samples, drawn on an HIT-themed Fuji/cherry blossom backdrop using a standalone renderer. **This is NOT browser/game screen capture, not a direct rendered engine video, and not visual approval.** The project source and HIT visual design remain separate from that preview, and the preview's interpolation does not preserve every biomechanical invariant.

## Continuing development
Added `src/dynamic-support.mjs`, an isolated deterministic momentum-support diagnostic:
- Approximate body center of mass from `full-body-qualification.mjs`.
- Estimate COM velocity using finite differences of actual simulation replay frames.
- Estimate capture point as COM + COM_velocity / sqrt(9.81/COM_height).
- Compare distance to the current planted-foot support and a candidate support formed from feet scheduled to land within nine fixed ticks.
- Return per-tick metrics and max current/anticipated support error. It is NOT a physical controller, force/torque model, ZMP solver or verified biomechanical test.

Added `test/dynamic-support.test.mjs` with 24-scenario deterministic and finite-value checks, capture-point consistency and invalid-parameter tests. The tests are committed but **Node and GitHub CI have not been verified**.

Extended `movement-review.html` with current and imminent-landing capture-point gaps so that the relative benefit of future steps can be inspected alongside static COM support and IK reach errors.

## Executed isolated JavaScript diagnostic
The new module was executed using the clean-room engine, rig, footprint recorder and support module across all 24 existing solo scenarios. No non-finite results were observed. Selected maximum values:

| Scenario | Current capture-point gap | Future-landing gap |
|---|---:|---:|
| Blue reverse | 1.493m | 1.065m |
| Red reverse | 1.429m | 1.203m |
| Blue guarded advance | 0.910m | 0.804m |
| Red guarded advance | 0.649m | 0.600m |
| Blue stationary guard | 0.031m | 0.031m |
| Red stationary guard | 0.034m | 0.034m |

These are screening distances under an approximate inverted-pendulum model, **not measured real balance**. Including touchdown helps but does not solve acceleration, stopping or reversing.

## Next priority
Focus on planned *touchdown location and braking* together, carrying COM velocity and support history across phase transitions. A short support step that stays under IK reach but misses the movement's capture point cannot create believable weight acceptance. Keep full-body motion approval and moveset expansion gated on numerical improvement, real browser video evidence and user signoff.

Clean-room restriction: no old combat source used or modified.
