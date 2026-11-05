# Movement facing, support, and continuity report — 2026-11-05

## Scope and baseline

Work uses only the clean-room source under `combat-engine-cleanroom/`, based on development commit `4d153be99badd77273b9a4a47d29e1a6723f9bed`. No legacy gameplay source was read or reused. `CombatWorld` rules, attacks, Fuji art, visual CSS, and release branch were not changed. Moveset expansion remains gated on actual motion review and creator approval.

The live `movement-review` page was opened and exercised for Blue and Red. Its forward scenarios reported 208.3 mm and 206.5 mm maximum world-joint step respectively and displayed a full-body diagnostic failure. The page did not expose a build identifier, so those observations do **not** identify its exact deployed commit. Browser capture was sampled at approximately 8 fps and is evidence only of that existing deployed preview. An attempted local browser preview returned `Missing or invalid bearer token`; the changed build was not browser-recorded.

A separately labeled 30 fps offline video was rendered from every other actual 60 Hz `recordSoloMotion` snapshot using the shared clean-room rig, the Fuji SVG and the movement page's side-stage projection. It includes forward, reverse, and stop for both fighters. This source render is **not browser footage** and does not establish creator approval or three-quarter-view validation.

## Correction

- Foot landing lanes now follow fighter-facing local left and right instead of rotating with travel direction. This fixes left/right crossing in forward/backward/reversal fixtures without moving an already planted foot or retargeting an in-flight swing.
- Faster longitudinal travel uses a seven-tick swing with a 0.90 m maximum stride. Fast lateral travel uses six ticks and a 0.76 m cap. Guard retains the ten-tick swing and 0.52 m cap. These are presentation-only choices; the authoritative engine's movement speed and timing are unchanged.
- Blue's moving torso has a higher reach-limited preferred posture. The torso, head, shoulders, and hips share that lift; the legs are still solved from fixed segment lengths and foot contact. Landing and near-future support are estimated ahead, allowing posture to prepare for touchdown while retaining actual planted reach as a hard limit. These forecasts are approximate and do not simulate ground reaction forces.
- The existing guard-stride test was changed to a same-speed 3.2 m/s stress case because its former 1.5 m/s Red fixture did not make the guarded cap shorter than the normal target. Guard cap itself remains 0.52 m. An attempted 0.46 m guard cap was rejected after ten-second runs exposed loss of planted-foot reach; it is not in the change.

## Executed verification

- `npm test` on native Node v24.22.1: **160/160 passed**, including the existing six moves tested from standing and moving stances, plus four new regression groups.
- `node src/solo-qualification-matrix.mjs`: 24/24 geometry screens, 24/24 provisional joint-step screens (formerly 14/24), and **6/24 static-support screens** (unchanged). Worst joint step fell from 229.5 mm to 191.5 mm per 60 Hz tick. The 0.20 m threshold is an engineering screen, not a biomechanical standard.
- The 24 cases recorded 230 support transfers. Maximum continuously planted ankle displacement was approximately 1.8e-15 m per tick; the separate low-height grounded-slide measure peaked at 7.6 mm. These measures have different contact definitions and must not be conflated.
- The new extended test runs both fighters for ten seconds in forward, backward, and lateral directions, with and without guard: 12 cases, 600 ticks each. Every case completed more than 40 support transfers, held planted-ankle displacement below 12 mm/tick and planted target error below 50 mm, and had no reported floor penetration or segment-length error beyond floating-point tolerance.
- New tests also cover the longitudinal left/right lanes, preserving the launch and planted-support state across a sudden directional change, and a provisional 25 mm/tick pelvis-height bound in stop, reverse, and lateral fixtures. Worst pelvis-height change in the 24-case matrix was 23.0 mm per tick; this does not prove natural motion.

| Scenario | Blue max joint step | Red max joint step | Static-support screen |
|---|---:|---:|---|
| idle | 0.0 mm | 0.0 mm | pass for both |
| forward | 181.6 mm | 191.5 mm | flagged for both |
| backward | 191.5 mm | 191.5 mm | flagged for both |
| lateral | 183.9 mm | 183.9 mm | flagged for both |
| reverse | 191.5 mm | 191.5 mm | flagged for both |
| stop | 181.6 mm | 191.5 mm | flagged for both |
| guard | 51.9 mm | 34.2 mm | pass for both |
| guardRelease | 51.9 mm | 34.2 mm | pass for both |
| guardAdvance | 82.5 mm | 98.9 mm | flagged for both |
| guardRetreat | 85.2 mm | 113.3 mm | flagged for both |
| guardLateral | 97.1 mm | 102.4 mm | flagged for both |
| guardStop | 82.5 mm | 98.9 mm | flagged for both |

## Remaining gates and deployment

The static COM-support approximation flags all 18 moving cases; it is not a complete model of dynamic balance. Velocity-aware support estimates are also diagnostic approximations, so the remaining flags cannot be dismissed as proof either of stability or instability. Side and three-quarter browser playback, full-speed and slow-motion review, actual changed-build browser footage, and explicit creator visual sign-off remain open. The offline render alone cannot close these gates.

The GitHub Actions test run for the parent commit `4d153be` reported success. Its separate Cloudflare Pages check also reported success, while a separate Workers Builds check failed; neither check validates this new candidate. Cloudflare Pages and Workers Builds can both react to repository pushes. A commit with the `[skip ci]` prefix is intended to suppress those automatic builds and GitHub Actions; the current local test results are not a new CI run. No deployment is authorized by this work.
