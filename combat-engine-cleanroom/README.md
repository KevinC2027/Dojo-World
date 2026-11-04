# Dojo World — Clean-room Combat Engine v0.10

This is an entirely new implementation. No source or implementation from the previous Dojo World project has been read, imported, copied, or reused. The original code remains unchanged on main. This work is isolated in the cleanroom/combat-engine-v1 branch, combat-engine-cleanroom/ directory.

## Review Station alpha (2026-11-04)

A separate Review Station is now committed on the **development branch only**:
- `review.html` — fixed-scenario 3D replay with frame-by-frame scrubbing, playback speed, and copyable feedback.
- `review-lite.html` — SVG compatibility replay without WebGL, as a fallback for mobile devices.
- `src/review.mjs` — deterministically records actual engine steps for palm contact, guarded cross, simultaneous trade, and range miss.
- `test/review.test.mjs` and `test/review-lite.test.mjs` — deterministic fixtures, parser/static UI contracts and feedback provenance.
- `REVIEW-STATION.md` — Cloudflare hosting guide and acceptance gates.

**No gameplay authority has changed:** damage remains range/facing based and contact damage is still range based. These review files have been committed but the new tests, mobile browser operation, and public deployment are **not yet verified**. No Replit is used and the release branch was not modified.

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

## v0.11 diagnostic discrepancy increment (2026-11-04)

- Every range-authorized hit or block event now reports `contactDiscrepancy`: `null` when the moving 3D swept-sphere/torso capsule intersects, or `range_hit_without_3d_intersection` when the authoritative range proxy says contact but the shadow geometry disagrees.
- Added `test/contact-discrepancy.test.mjs` with three regression tests covering multiple attack types, guarding, deterministic replay, and long-range non-contact.
- **No damage, guard, timing, stamina, knockback, or KO authority changes.** This is a targeted observable mismatch signal, not a switch to skeletal hit detection. The diagnostic does not yet count missed 3D contacts when the range proxy denies an attack.
- Tests are committed but require execution verification; GitHub push CI status must be confirmed independently.

## v0.12 deterministic exchange audit (2026-11-04)

- Added `src/exchange-audit.mjs`: pure deterministic aggregation of resolved hit/block events into counts by attacker and move, shadow 3D intersections, range-only contacts, and missing/unclassified telemetry.
- Added `test/exchange-audit.test.mjs` with three tests for counts/nonmutation, actual engine replay determinism, and missing probe handling.
- This report observes **only range-authorized events**. It cannot detect geometry-only intersections rejected by range/facing rules, and it does not change hit authority, damage, movement, or guarding.
- Tests and GitHub Actions results require independent verification; no passing status is implied by committing.

## Next priority

Run the complete regression suite, then inspect range-proxy versus moving-torso shadow mismatches in deterministic replays. Add anatomical limb and foot-support continuity before promoting collision to hit authority.

## v0.5 geometry increment

- Added pure deterministic 3D swept-sphere vs capsule geometry in `src/sweep.mjs`, using finite segment closest-point calculations. It detects a fast strike passing through a body capsule even when both sampled endpoints miss, and handles tangent, miss and degenerate cases.
- Added six regression tests in `test/sweep.test.mjs`. This geometry is **not wired to authoritative hit resolution yet**: the engine still uses `range_proxy_v1` for hits and blocks. `sweepFraction` is the fraction of closest approach, **not** first time of impact. No animation or biomechanics have been validated.
- New tests and CI require independent execution verification.

## v0.6 first-entry geometry increment

- Added `sweptSphereCapsuleFirstImpact` in `src/sweep.mjs`, which determines the earliest swept-sphere entry into a stationary defender capsule by deterministic 48-iteration bisection before the closest-approach fraction. Returns entry fraction, contact center, contact point, normal and initial-overlap flag.
- Added four focused tests for first-entry timing, initial overlap, misses/determinism, and tangency in `test/sweep.test.mjs`.
- **Important:** The geometry is still independent of authoritative combat hits. Moving defender capsules, anatomical strike trajectories, limb IK and phase-transition continuity are not implemented. These tests must be executed before claiming passing status.

## v0.10 moving-torso shadow integration

- Updated `src/collision-probe.mjs` to evaluate a procedural strike endpoint from the previous attacker pose to the current pose against a torso capsule translated from the previous defender pose to the current pose. Uses `movingSphereCapsuleFirstImpact` and preserves deterministic first-entry fraction, point, and normal.
- Updated `src/engine.mjs` to capture both fighters' tick-start position and facing before movement and footprint separation, and pass these to shadow collision telemetry. Only resolved range-proxy hit/block events receive the diagnostic; **damage, guarding, and trade authority are unchanged**.
- Updated `test/collision-probe.test.mjs` expectations and added two focused regressions for moving-defender contact and deterministic moving-fighter replay.
- Geometry assumes rigid torso translation and simplified limb endpoints. It does not account for joint articulation, posture, angular capsule motion, or validated biomechanics. The moving probe is not authoritative and only runs for events already accepted by range/facing rules.
- Tests/CI require verification; do not infer passing from commit success.

## v0.9 moving-defender collision geometry

- Added `src/moving-capsule.mjs` implementing deterministic first-entry contact between a moving sphere and a defender capsule undergoing **rigid translation** during one fixed simulation tick. Relative motion prevents false misses when a defender moves into a strike and false hits when both move at the same speed.
- Added `test/moving-capsule.test.mjs` with six focused tests: stationary-capsule entry, moving-defender crossing, same-velocity miss, initial overlap, determinism, and invalid/nonrigid motion.
- The new geometry was independently executed on local Node 22 with **6/6 focused tests passing** before commit. The complete repository suite and GitHub CI still require verification.
- **Not yet integrated into engine damage or shadow contact events.** Existing v0.8 range/facing hit authority and stationary diagnostic probe are unchanged. Capsule articulation, joint motion, foot support, and network authority remain unimplemented.

## v0.8 3D collision shadow telemetry

- Added `src/collision-probe.mjs`, evaluating the current attack's active-frame hand/foot sweep against a stationary defender torso capsule with deterministic first-entry geometry.
- `src/engine.mjs` now attaches `collisionProbe` to every resolved hit/block event. It identifies the limb, active frame, whether the 3D sweep intersected, and first-impact geometry when available. This makes disagreements between range-proxy damage and visible limb contact inspectable.
- Added `test/collision-probe.test.mjs` with five tests covering deterministic replay, non-mutation, range miss, invalid active frames, and event attachment.
- **No hit authority changed:** the range/facing gate still determines damage, guarding, and simultaneous trades. The 3D probe is deliberately diagnostic-only. It samples a stationary defender capsule at each tick and is not a validated articulated limb/body collision model.
- Test results and CI are **not confirmed** until the full Node test suite runs. The release branch and Cloudflare deployment remain unchanged.

## v0.7 procedural trajectory increment

- Added `src/trajectory.mjs` with deterministic 3D world-space striking endpoint paths for Blue palm, straight and front kick, plus Red jab, cross and hook. Each move specifies striking limb and radius; trajectories rotate with the fighter's facing, translate with their world position, and use a smooth extend-and-return curve with matching endpoints at active-phase boundaries.
- Added `strikeTickSweep` to expose consecutive per-frame endpoint geometry and a nominal defender torso capsule, ready for `sweptSphereCapsuleFirstImpact`. Six new regression tests cover finite/deterministic poses, boundary continuity, world rotation, hit/miss geometry, and invalid inputs.
- **Not yet authoritative:** existing `engine.mjs` hit resolution remains the range-based proxy. These are procedural endpoint approximations, not skeletal IK or validated biomechanics. A stationary torso is assumed for each tick; true moving-defender relative sweeps and animation blending remain open.
- Tests were committed but must be executed before reporting passing results. The GitHub workflow lives outside the permitted edit directory and was only inspected, not changed.

## Changelog

2026-11-04: v0.10 integrated moving-defender relative sweeps into the non-authoritative hit/block diagnostic, with tick-start pose capture and two additional regression cases. No change to combat outcomes.


2026-11-04: v0.9 introduced isolated relative-motion first-contact geometry for a rigidly translating defender capsule, with six locally passing focused tests; no change to hit authority.

2026-11-04: v0.8 added per-active-tick swept 3D collision shadow telemetry to resolved hit/block events, plus five targeted tests; authoritative damage still uses range/facing proxy.

2026-11-04: Review Station alpha committed separately from the gameplay engine. Four replay scenarios, frame scrubbers, 3D and SVG viewers, and structured reviewer packets; mobile and CI unverified.

2026-11-04: v0.7 added six deterministic 3D strike endpoint paths and six regression tests; collision geometry can now consume per-tick paths, but authoritative hit resolution is unchanged.


2026-11-04: v0.6 added deterministic first-entry time and contact geometry for swept sphere/capsule intersection (four new regression tests). Hit authority remains unchanged.


2026-11-04: v0.5 added isolated swept-sphere/capsule contact geometry and six focused tests without changing hit authority or existing gameplay.

2026-11-04: v0.4 added `src/contact.mjs` for deterministic 3D range-proxy contact telemetry on hit and block events (striking limb, world-space surface point, normal, and separation). Three new tests target geometry, guarding, and replay. This does not claim skeletal collision or validated biomechanics; CI and tests require independent verification.

2026-11-04: v0.3 introduced a deterministic single-slot, eight-tick recovery attack buffer. Inputs during startup and active phases do not queue; valid recovery presses can launch on the first free tick if not expired, interrupted, or guarded. Hit stun and KO clear the queue. Added four regression tests (16 engine tests total). GitHub CI status must be verified separately; these new tests are not yet claimed passing.


2026-11-04: v0.2 added capped angular turning and directional guarding; added three targeted regression tests (12 total). GitHub CI execution must be checked separately.

2026-11-04: Created fresh v0.1 combat rules engine, six moves, fixed-timestep movement, guard, hits and KO. Local Node 22 test suite: 9/9 passed.

## v0.13 rejected shadow-contact observations (2026-11-04)

- The active attack loop now evaluates moving 3D shadow contact even when the existing range/facing proxy rejects a hit. It emits `shadow_contact_rejected` only when geometry intersects despite proxy rejection; it never applies damage or marks the attack connected.
- Exchange audits now count `rejectedShadowIntersections` and record these discrepancies separately from proxy-authorized contacts. Multiple active ticks can report the same rejected strike; this is a per-tick observation, not a count of unique strikes.
- Added regression tests for audit classification and deterministic non-authoritative replay. Test suite and push CI require independent verification.
