# Dojo World — Clean-room Combat Engine v0.7

This is an entirely new implementation. No source or implementation from the previous Dojo World project has been read, imported, copied, or reused. The original code remains unchanged on main. This work is isolated in the cleanroom/combat-engine-v1 branch, combat-engine-cleanroom/ directory.

## Review Station alpha (2026-11-04)

A separate Review Station is now committed on the **development branch only**:
- `review.html` — fixed-scenario 3D replay with frame-by-frame scrubbing, playback speed, and copyable feedback.
- `review-lite.html` — SVG compatibility replay without WebGL, as a fallback for mobile devices.
- `src/review.mjs` — deterministically records actual engine steps for palm contact, guarded cross, simultaneous trade, and range miss.
- `test/review.test.mjs` and `test/review-lite.test.mjs` — deterministic fixtures, parser/static UI contracts and feedback provenance.
- `REVIEW-STATION.md` — Cloudflare hosting guide and acceptance gates.

**No gameplay authority has changed:** engine remains v0.7 and contact damage is still range based. These review files have been committed but the new tests, mobile browser operation, and public deployment are **not yet verified**. No Replit is used and the release branch was not modified.

## Run

Requires Node.js 20 or later, with no external dependencies.

Run `npm test` in `combat-engine-cleanroom/` to execute the test suite.
Run `npm run demo` for an example duel.

## v0.1 implemented

- 60 Hz deterministic fixed-step logic.
- Two fighters with x/y/z positions, mass, planar velocity, facing, stamina, and cumulative condition.
- Blue attacks: palm, straight, front kick.
- Red attacks: jab, cross, hook.
- Button-triggered attack startup, active, and recovery frames.
- Movement acceleration, guard speed restrictions, separate footprints.
- Range and facing checks, no duplicate contact within one attack.
- Damage/stun/guard stamina logic, simultaneous hit trades, KO, finished match and event logging.
- Nine passing local tests on Node 22, including deterministic state replay.

## Not implemented yet

This is a headless rules core, not a playable 3D game: no skeletal animation, camera, controller UI, limb-level collision, actual vertical physics, grapples, throws, network play, Unreal integration, sound or visuals. Facing turns at a bounded 270 degrees/second; directional guard covers a 130-degree frontal arc. Recovery attack buffering is limited to eight ticks. Resolved hit and block events now expose a deterministic world-space 3D contact proxy (nominal head/body height, defender surface point, normal, and striking limb label). This is not actual limb-level collision, IK, or joint geometry; range and facing remain authoritative until skeletal collision is implemented. Internal condition thresholds are preliminary gameplay parameters, not a real biomechanical model.

## Clean-room development principles

1. The authoritative combat simulation owns hit timing; presentation follows it.
2. Preserve state across phase transitions and test all boundaries.
3. New collision and animation work must use full 3D geometry and anatomically credible constraints.
4. Every hourly increment identifies specific source changes, test results, remaining failures, and next scope.
5. Do not merge legacy combat implementations into this engine.

## Next priority

Connect the new procedural per-tick 3D strike trajectories to authoritative hit resolution, replacing the range-only gate. First preserve current hit/trade tests and phase continuity; then add moving defender capsules and realistic articulated joints.

## v0.5 geometry increment

- Added pure deterministic 3D swept-sphere vs capsule geometry in `src/sweep.mjs`, using finite segment closest-point calculations. It detects a fast strike passing through a body capsule even when both sampled endpoints miss, and handles tangent, miss and degenerate cases.
- Added six regression tests in `test/sweep.test.mjs`. This geometry is **not wired to authoritative hit resolution yet**: the engine still uses `range_proxy_v1` for hits and blocks. `sweepFraction` is the fraction of closest approach, **not** first time of impact. No animation or biomechanics have been validated.
- New tests and CI require independent execution verification.

## v0.6 first-entry geometry increment

- Added `sweptSphereCapsuleFirstImpact` in `src/sweep.mjs`, which determines the earliest swept-sphere entry into a stationary defender capsule by deterministic 48-iteration bisection before the closest-approach fraction. Returns entry fraction, contact center, contact point, normal and initial-overlap flag.
- Added four focused tests for first-entry timing, initial overlap, misses/determinism, and tangency in `test/sweep.test.mjs`.
- **Important:** The geometry is still independent of authoritative combat hits. Moving defender capsules, anatomical strike trajectories, limb IK and phase-transition continuity are not implemented. These tests must be executed before claiming passing status.

## v0.7 procedural trajectory increment

- Added `src/trajectory.mjs` with deterministic 3D world-space striking endpoint paths for Blue palm, straight and front kick, plus Red jab, cross and hook. Each move specifies striking limb and radius; trajectories rotate with the fighter's facing, translate with their world position, and use a smooth extend-and-return curve with matching endpoints at active-phase boundaries.
- Added `strikeTickSweep` to expose consecutive per-frame endpoint geometry and a nominal defender torso capsule, ready for `sweptSphereCapsuleFirstImpact`. Six new regression tests cover finite/deterministic poses, boundary continuity, world rotation, hit/miss geometry, and invalid inputs.
- **Not yet authoritative:** existing `engine.mjs` hit resolution remains the range-based proxy. These are procedural endpoint approximations, not skeletal IK or validated biomechanics. A stationary torso is assumed for each tick; true moving-defender relative sweeps and animation blending remain open.
- Tests were committed but must be executed before reporting passing results. The GitHub workflow lives outside the permitted edit directory and was only inspected, not changed.

## Changelog

2026-11-04: Review Station alpha committed separately from the gameplay engine. Four replay scenarios, frame scrubbers, 3D and SVG viewers, and structured reviewer packets; mobile and CI unverified.

2026-11-04: v0.7 added six deterministic 3D strike endpoint paths and six regression tests; collision geometry can now consume per-tick paths, but authoritative hit resolution is unchanged.


2026-11-04: v0.6 added deterministic first-entry time and contact geometry for swept sphere/capsule intersection (four new regression tests). Hit authority remains unchanged.


2026-11-04: v0.5 added isolated swept-sphere/capsule contact geometry and six focused tests without changing hit authority or existing gameplay.

2026-11-04: v0.4 added `src/contact.mjs` for deterministic 3D range-proxy contact telemetry on hit and block events (striking limb, world-space surface point, normal, and separation). Three new tests target geometry, guarding, and replay. This does not claim skeletal collision or validated biomechanics; CI and tests require independent verification.

2026-11-04: v0.3 introduced a deterministic single-slot, eight-tick recovery attack buffer. Inputs during startup and active phases do not queue; valid recovery presses can launch on the first free tick if not expired, interrupted, or guarded. Hit stun and KO clear the queue. Added four regression tests (16 engine tests total). GitHub CI status must be verified separately; these new tests are not yet claimed passing.


2026-11-04: v0.2 added capped angular turning and directional guarding; added three targeted regression tests (12 total). GitHub CI execution must be checked separately.

2026-11-04: Created fresh v0.1 combat rules engine, six moves, fixed-timestep movement, guard, hits and KO. Local Node 22 test suite: 9/9 passed.
