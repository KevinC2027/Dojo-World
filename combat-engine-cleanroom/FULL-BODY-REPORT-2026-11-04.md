# HIT Whole-Body Congruency — 2026-11-04

## Purpose

Before implementing more attacks, require Blue and Red to move as complete linked bodies. A sound arm or leg IK solver is necessary but insufficient. This increment adds `src/full-body-qualification.mjs`, which audits head/spine/pelvis/arms/legs, weighted landmark center of mass (COM), support from planted feet and frame-to-frame continuity.

**Scope caution:** the estimated COM is a deliberately simplified landmark weighting, not a measured human segment-mass model. The support region is a point (one foot) or line segment (two feet), not a real 2D sole-contact polygon. Thresholds are engineering screening heuristics, not biomechanical validation. No physics, collision, damage or move rules have been changed.

## Executed diagnostic results (isolated JavaScript harness)

The actual branch modules were evaluated using the clean-room engine with inert contact hooks (no attacks in these fixtures). This is not `npm test`, browser playback, CI, or visual creator sign-off.

- **16 scenarios** evaluated: idle, forward, backward, lateral, reverse, stop, guard, and guardRelease for both fighters.
- **6 preliminary full-body passes** (idle, guard and guardRelease per fighter).
- **10 failures**, all locomotion/stop/reverse cases, caused by COM drifting beyond planted-foot support.
- Largest estimated COM-to-support displacement **0.951 m**, Red lateral (Blue lateral **0.944 m**).
- Largest mismatch between a planted world-space foot target and actual rendered IK foot **1.54 m**, Blue forward. This shows the current step constraints cannot keep up with the engine's 3.2 m/s root motion. It must be fixed by speed-aware gait architecture, not by increasing limb lengths.
- Largest moving-joint step after cadence adjustment approximately **0.219 m** per 60 Hz tick.
- Guard release hand position changes at most approximately **0.039 m** for Blue and **0.034 m** for Red across inspected frames; smoothed entry and exit.

## Changes

- Introduced `src/full-body-qualification.mjs` with deterministic COM/support/head/spine/landmark evaluations.
- Expanded `src/movement-qualification.mjs` to include `guardRelease`, giving eight independent scenarios per fighter.
- Shortened step intervals and increased step reach in `src/foot-plant-render.mjs`; this reduced some joint jumps but did **not** fix balance.
- Corrected `src/hit-rig.mjs` to blend on guard exit as well as guard entry.
- Added `test/full-body-qualification.test.mjs` and updated scenario counts in `test/movement-qualification.test.mjs`. Standalone automated test and GitHub CI outcomes are **unverified**.
- Updated `movement-review.html` to show an estimated COM marker and planted support feet; **red COM marker = support offset over 14 cm**. It also reports peak reach error. No browser capture performed.

## Blocking next step

Address the mismatch between engine root speed and foot planting: redesign gait speed/cadence, landing placement, and stop/reversal transitions as one consistent stateful locomotion model. A world-locked planted target that is 1.54 m beyond leg reach cannot be cosmetically fixed by elbow/knee bending. Retest all 16 cases including peak support displacement and peak IK target error, then verify playback in both side and three-quarter views.

**No new movesets until full-body movement passes numerical screening and receives user visual approval.**
