# Launch-foot reach and whole-body transition - 2026-11-05

Basis: clean-room development commit 067b3440fa54676432c5042de950da42fda0fe72. The supplied 2909585 CSV and trace analysis identified launch ankles lifting despite their commanded floor height. No legacy source used.

## Correction

The tracker now includes the still-grounded launch foot when computing posture reach limits, without changing `planted`'s operational swing semantics, in-flight targets, gameplay speed, or support tolerance. It also forecasts reach one tick ahead during double support; this starts coordinated body-height adjustment before a foot begins a swing. Existing longer-horizon forecasts remain intact during a swing. This is a small ground-contact and phase-continuity correction, not a complete dynamic gait controller.

## Actual local verification

- Before: 138 of 244 launch samples had solved ankle elevation more than 1mm above the target; maximum 20.8669mm. With only the contact-limit change, 0 of 244 exceeded 1mm, but one of 167 local tests failed: Blue reverse tick 104 torso height step 0.026059928724389336m exceeded 0.025m. That incomplete trial is not the final implementation.
- After adding one-tick double-support reach anticipation: 0 of 244 launch samples above 1mm; max elevation error 1.39e-16m. Final `npm test`: 168 passed, 0 failed, including a new regression covering launches for both fighters and nine moving scenarios. This is local execution, not GitHub CI.
- `node src/solo-qualification-matrix.mjs`: 24/24 geometry, 24/24 provisional joint continuity, 6/24 static support. All 18 moving scenarios remain flagged. Fixed-length and contact checks are screening measures, not biomechanical approval.
- The 0.14m static support tolerance is unchanged. Pre-liftoff weight shift, single-support timing, momentum, and 18 static-support cases remain open. Side and three-quarter current-build creator visual sign-off remains required before moveset expansion.
- Current render uses actual clean-room 60Hz replay data projected at 30fps; it is a source-driven render, not browser footage.
