# Dojo World — Reach-Aware Gait Iteration (2026-11-04)

## Changes committed
- `src/foot-plant-render.mjs`: Support-reach-aware swing-leg selection, prioritizing whichever foot is falling behind the moving root while retaining alternating stepping where possible. World-space planted ankles remain locked until liftoff; swing destinations and durations persist across locomotion phases.
- `src/movement-qualification.mjs`: Three new independent guarded scenarios for both characters: guarded retreat, guarded lateral movement, guarded advance-to-stop. Total now **24** cases (12 Blue, 12 Red).
- `test/movement-qualification.test.mjs`: count and coverage updated; all 24 cases now assert less than 0.05m planted-target-to-rendered-ankle discrepancy, finite geometry and zero floor penetration; specific guarded scenarios require max joint step under 0.15m.
- `test/full-body-qualification.test.mjs`: updated to 24-case deterministic audit.
- `movement-review.html`: displays STANCE / FOOTWORK / RUN and planted-foot count during scrubbing.

## Source-driven screening (isolated JavaScript harness)
The actual current branch engine and animation modules were executed together with a JSON clone compatibility shim and inert strike-contact hooks (the solo fixtures do not attack). This is **not a verified full `npm test`, GitHub CI result, actual game video or creator visual review**.

| Measured maximum across 24 cases | Previous 18-case audit | New 24-case audit |
|---|---:|---:|
| Planted ankle reach mismatch | 0.0665m | **0.0362m** |
| Joint movement in one 60Hz tick | 0.2544m | **0.2443m** |
| COM-to-planted support gap | 0.5676m | **0.5223m** |
| Preliminary static-support passes | 6/18 | **6/24** |

Guarded movement results:
- Blue forward: reach 0.0046m, joint step 0.0972m, max static support gap 0.5223m.
- Red forward: reach 0.0000m, joint step 0.0773m, support gap 0.3019m.
- Blue retreat/lateral: reach 0, joint 0.0773m; Red retreat/lateral: reach ~0.0115–0.0117m, joint 0.1215–0.129m.
- All 18 moving sequences still FAIL preliminary static COM support screening.

## Important limitation
Static point/segment support is overly conservative for dynamic running at up to 3.2m/s, but it should not simply be waived. A proper motion solver should estimate changing base of support and COM velocity, foot pressure/contact, and push-off impulse. Current animation is still a procedural two-bone visual rig, **not physically verified biomechanics**.

## Next action
Improve stateful locomotion transition mechanics and momentum-aware balance, then execute full Node suite and capture actual normal-speed and slow-motion side/three-quarter replays. No new moveset variants until the full-body quality gate passes and the creator approves the motion. The Fuji/HIT/solid Blue and Red visual identity remains unchanged.
