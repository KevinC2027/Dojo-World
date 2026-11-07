# HIT Locomotion States — Increment 3 (2026-11-04)

## Implemented

Added an isolated **guarded combat-footwork** state to `src/foot-plant-render.mjs`. While guarding and moving, the engine's existing movement speed is rendered with a ten-tick swing and bounded 0.52m stride. Unguarded fast locomotion retains its existing six-tick swing and 0.95m maximum stride. Idle has a neutral gait blend. Existing mid-swing launch targets and durations survive changes of state, avoiding a direct foot switch when entering/exiting guard.

Added `guardAdvance` scenario to `src/movement-qualification.mjs` and expanded both fighters' coverage from eight to nine scenarios (18 total). Updated `test/movement-qualification.test.mjs` and `test/full-body-qualification.test.mjs` expected counts, plus explicit reach and joint-step checks for guarded advances.

## Executed diagnostic comparison

The latest branch modules were evaluated in a source-driven isolated JavaScript harness with inert contact hooks; these are no-attack scenarios. This is **not** a full Node test suite, GitHub CI result, or captured/browser-verified gameplay video.

| Measurement | Blue guarded advance | Red guarded advance |
|---|---:|---:|
| Planted target-to-foot reach mismatch | 0.0018 m | 0.0000 m |
| Max world-space joint step per 60Hz frame | 0.0982 m | 0.0773 m |
| COM-to-foot support displacement | 0.5317 m | 0.3019 m |
| Footwork mode recognized | yes | yes |
| Full-body preliminary support screen | FAIL | FAIL |

In the complete 18-case screening, the original 16-case fast and idle metrics stayed unchanged: maximum planted-foot mismatch 0.0665 m, largest joint step 0.2544 m, maximum COM-support offset 0.5676 m. Six stationary/guard scenarios preliminarily passed, twelve movement scenarios failed balance screening.

**Important:** The 0.14m center-of-mass-to-foot support threshold is a static screening approximation, not dynamic stability proof. Do not weaken it to claim success; a velocity-aware dynamic support model and proper foot-to-ground contact are needed.

## Remaining work

- Full-body congruency and realistic running are **not** established. Fix large support mismatch in walking/running, stop/reverse, and guarded advance.
- Preserve one leg's planted contact while planning the other leg's touchdown. Improve center-of-mass motion and grounded orientation of the hips, knees and torso.
- Add genuine footwork-to-running transitions, turn-and-guard fixture, and transition velocity checks; the current continuous `gaitBlend` value is presentation metadata, not a fully blended gait controller.
- Confirm full Node test suite, visual browser playback and realistic side/three-quarter video; request user visual approval before ordinary moveset expansion.

No additional combat moves have been introduced. All edits stay on branch `cleanroom/combat-engine-v1` within `combat-engine-cleanroom/`.
