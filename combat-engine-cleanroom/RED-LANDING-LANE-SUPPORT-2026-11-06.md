# Red landing lane support experiment - 2026-11-06

Clean-room development basis: 8cf497ed7ef4c3cc28532ebe104e976fc0b6a0da. No legacy combat source was read or reused.

## Narrow increment

The landing planner uses a 0.18m lateral offset per side for Red (previously 0.20m); Blue retains 0.20m. Only newly scheduled step targets use the new value: existing planted anchors and in-flight targets are not moved. This is a small presentation change under review, not a new fighting style or a complete weight-transfer solution. Engine speed, moves, contact limits, support threshold, Fuji art and buttons are unchanged. Side/three-quarter creator visual sign-off remains open.

## Executed validation

- `npm test`: 168 tests passed, 0 failed (local Node, not GitHub Actions).
- `node src/solo-qualification-matrix.mjs`: geometry 24/24, provisional joint continuity 24/24, static support 6/24. Every one of the 18 moving cases still fails the unmodified 0.14m static screen.
- Against 8cf497e: Red forward maximum static offset 0.347133m to 0.337268m; Red lateral 0.325890m to 0.314997m; Red reverse 0.409673m to 0.401927m; Red guarded retreat 0.289298m to 0.278368m. These are approximate diagnostic maxima and do not establish physical balance.
- All twelve Blue matrix rows exactly match the prior local matrix. Maximum 24-case joint step remains 0.191545m. Planted-target error remains near floating-point precision. 0 of 244 launch samples rose more than 1mm above their target (max about 1.39e-16m).
- An earlier 0.17m trial for both fighters failed 1 of 168 tests: advancing Blue front kick local joint step 0.19011381164391336m exceeded the existing <0.19m bound. It was rejected; complete trial source and output are included in the user-facing Claude PDF.
- Source-rendered visual footage uses actual 60Hz clean-room replay snapshots, 30fps encoding and the HIT/Fuji asset. It is not browser footage and does not establish creator sign-off.

## Remaining work

A narrower target alone cannot fix single-support timing or center-of-mass preload, and all 18 moving cases remain flagged. Develop preload, foot landing and trunk support together, preserve position/velocity/contact state and existing move transitions, then test both fighters across starts, stops, reversals and guarding. Keep static tolerance unchanged and monitor dynamic estimates separately. Do not expand movesets until movement and creator visual gates are satisfied.
