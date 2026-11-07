# Tracker-to-rig velocity handoff - 2026-11-05

Based on clean-room development commit f3ddb603dfe41aca52dd5fcc916d69428c311648. No legacy code, authoritative combat rules, movesets, environment assets or release branch were changed.

The foot tracker treated nonfinite velocity components as zero, but the presentation rig independently read raw values. With Blue facing +X and velocity {x:0,z:Infinity}, Infinity multiplied by zero yielded NaN in the upper-body rig. A newly added end-to-end test reproduced this: `node --test test/gait-nonfinite-velocity.test.mjs` returned 1 pass and 1 fail with `blue tick 1: rig must use the same finite velocity as foot tracking` and NaN arm joints.

The presentation rig now uses the same finite-component fallback as the tracker for speed and lean. The regression compares the complete resulting rig against an equivalent sanitized snapshot for Blue and Red through invalid and recovered samples, checks all joint coordinates, and preserves engine snapshots. It is not a balance or motion-realism fix.

Executed locally on Node v24.22.1: targeted suite 2/2 passed; complete `npm test` 162/162 passed; `node src/solo-qualification-matrix.mjs` generated 24/24 geometry and 24/24 provisional joint-continuity passes, with static-support screening only 6/24 and worst joint step 0.191545 m/tick. Static support is an approximation, not proof of dynamic imbalance or stability. The previous test failure was fixed locally; no new CI pass is asserted.

The deployed movement review page was reachable, and Blue forward reported 208.3 mm maximum joint step and a full-body screen failure; its commit is not exposed. This differs from the current development replay's 181.6 mm Blue-forward step and cannot be presented as the latest branch. Actual changed-build browser footage and three-quarter review remain outstanding. Creator previously gave provisional feedback on a source-rendered preview, not approval of full movement qualification. Do not expand movesets or deploy without satisfying the gates and authorization.
