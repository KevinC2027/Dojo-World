# Dojo World — Clean-room Combat Engine v0.5

This is an entirely new implementation. No source or implementation from the previous Dojo World project has been read, imported, copied, or reused. The original code remains unchanged on main. This work is isolated in the cleanroom/combat-engine-v1 branch, combat-engine-cleanroom/ directory.

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

Connect the new swept sphere/capsule geometry to authored per-tick hand and foot trajectories and defender hit volumes; gate hit authority on verified limb intersection, then test contact continuity across phase boundaries.

## v0.5 geometry increment

- Added pure deterministic 3D swept-sphere vs capsule geometry in `src/sweep.mjs`, using finite segment closest-point calculations. It detects a fast strike passing through a body capsule even when both sampled endpoints miss, and handles tangent, miss and degenerate cases.
- Added six regression tests in `test/sweep.test.mjs`. This geometry is **not wired to authoritative hit resolution yet**: the engine still uses `range_proxy_v1` for hits and blocks. `sweepFraction` is the fraction of closest approach, **not** first time of impact. No animation or biomechanics have been validated.
- New tests and CI require independent execution verification.

## Changelog

2026-11-04: v0.5 added isolated swept-sphere/capsule contact geometry and six focused tests without changing hit authority or existing gameplay.

2026-11-04: v0.4 added `src/contact.mjs` for deterministic 3D range-proxy contact telemetry on hit and block events (striking limb, world-space surface point, normal, and separation). Three new tests target geometry, guarding, and replay. This does not claim skeletal collision or validated biomechanics; CI and tests require independent verification.

2026-11-04: v0.3 introduced a deterministic single-slot, eight-tick recovery attack buffer. Inputs during startup and active phases do not queue; valid recovery presses can launch on the first free tick if not expired, interrupted, or guarded. Hit stun and KO clear the queue. Added four regression tests (16 engine tests total). GitHub CI status must be verified separately; these new tests are not yet claimed passing.


2026-11-04: v0.2 added capped angular turning and directional guarding; added three targeted regression tests (12 total). GitHub CI execution must be checked separately.

2026-11-04: Created fresh v0.1 combat rules engine, six moves, fixed-timestep movement, guard, hits and KO. Local Node 22 test suite: 9/9 passed.
