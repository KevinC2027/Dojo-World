# Arm posture and silhouette review - 2026-11-05

## Creator feedback and status

The creator observed that the arms in the source-driven 078f007 movement video looked too short. The observation is valid: in the development rig, free hand targets were close to shoulder height, folding the elbows sharply. In one Blue forward frame (tick 40), the wrist was approximately 0.181 m from its shoulder even though the fixed arm segments total 0.74 m. The movement-review side projection also maps horizontal world X at 51 screen units per metre and height at 150, while limiting visible depth, so overlapping solid-color limbs are visually compressed. Bone-length invariance alone does not establish good proportions or an anatomically convincing silhouette.

## Increment in this revision

- Lower Blue and Red free-hand target heights by 0.23 m, maintaining the same upper-arm and forearm lengths, existing fighter identity, foot tracker, arena, controls and six current move definitions.
- Preserve the foot tracker's fading guard weight when an attack begins, so a guarded stance does not hard-switch to the new lower free arm pose at attack startup.
- Add forward/backward posture regression coverage for both arms of both fighters and guard-to-every-attack coverage standing and advancing. The posture threshold only prevents this specific tight-fold regression; it is not a biomechanical acceptance limit.
- The side-view arms still visually overlap the body, so this is a partial improvement, NOT visual approval or completion. Both side and three-quarter natural motion require creator review. Do not expand movesets before the movement gates are met.

## Executed local verification

- `npm test`: 164 tests, 164 passed, 0 failed (Node local; not GitHub Actions CI).
- `node src/solo-qualification-matrix.mjs`: 24/24 geometry screens, 24/24 provisional joint-step screens, 6/24 static-support and full-body diagnostic screens. Maximum joint step 0.191545 m; max planted-target error approximately 1.8e-15 m. These screens do not prove balance or natural human motion.
- Broader lower/forward hand-target trials failed continuity checks and were rejected; the test log and attempted parameters are preserved in the user-facing Claude source-review PDF. Changes were rerun successfully after reverting those trials.
- The source-driven video uses actual clean-room 60 Hz replay poses and the Fuji asset, encoded at 30 fps. It is not browser footage. Local browser capture was blocked by `Missing or invalid bearer token` during this work session. Neither the clip nor these diagnostics constitutes creator signoff.

## Remaining work

Investigate the horizontally compressed review projection and full-body silhouette across side and three-quarter angles without hiding grounded foot drift or changing the approved environment. Improve the arm and trunk together, including guard, attack startup, recovery and movement reversals. Review unguarded and guarded poses in genuine current-build browser footage when capture becomes available. Static support remains a diagnostic limitation; 18 of 24 cases did not meet that screen.
