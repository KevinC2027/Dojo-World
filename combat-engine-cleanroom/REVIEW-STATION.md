# Dojo World Review Station — initial implementation

## Purpose
Give the creative director an affordable, device-friendly way to inspect **the current clean-room engine** rather than screenshots of unrelated animations. No Replit or third-party graphics dependencies are used.

## What was created
- `review.html` — 3D WebGL Review Station built as an adaptation of the clean-room `index.html` preview, with frame-by-frame deterministic playback and review note export.
- `review-lite.html` — compatibility player using inline SVG (no WebGL required), with the same engine replay scenarios and review feedback contract. The SVG exists in the original HTML so that the figures are visible even if scripts cannot run.
- `src/review.mjs` — pure scenario input recording and frame/snapshot capture via the real `CombatWorld.step()` API, preserving exact 60 Hz ticks and events.
- `test/review.test.mjs` — six review tests: deterministic timelines, combat outcome fixtures, scrubbing, packet limits, and source-level browser contract with syntax checking.
- `test/review-lite.test.mjs` — compatibility viewer and module syntax tests.

The four fixed scenarios are: palm contact, cross blocked by guard, simultaneous jab/straight trade, and range miss.

## Launching without paying for Replit

The existing repository is private. GitHub file links are **source**, not public playable preview URLs. No cloud deployment has been verified or created by these changes.

A dedicated `cleanroom/mobile-preview-release` branch exists to avoid Cloudflare Free Pages building every hourly dev commit. This iteration has changed **only** `cleanroom/combat-engine-v1`. Do not publish or merge until acceptance tests pass.

### Cloudflare Pages one-time setup
1. In the user's own Cloudflare account, open Workers & Pages → Create application → Pages → Connect to Git.
2. Connect only `KevinC2027/Dojo-World`; choose production branch `cleanroom/mobile-preview-release`.
3. Configure no build command, and set output directory `combat-engine-cleanroom`.
4. Deploy **after** a reviewed, tested promotion of the Review Station files to the release branch. The root site will serve `index.html`, with `/review.html` and `/review-lite.html` as distinct URLs.
5. Verify from an actual iPhone Safari session. Check both controls and fallback. Do not report success from a passing desktop-only script syntax check.

### Review workflow
1. Choose one scenario. All recorded states come from the same deterministic engine and input sequence.
2. Pause or scrub tick-by-tick using the timeline, looking for incorrect contact, phase snapping, poor footwork, or guard facing.
3. In the review, choose Approve or Needs Work and enter notes.
4. Copy the generated JSON feedback packet; paste it into ChatGPT so the next engineering cycle can reproduce the exact scenario and frame.
5. The packet records schema version, scenario ID, simulation tick, contact authority, verdict, observations, and event counts; it does **not** upload feedback automatically.

### Review limitations / quality gates
- **Important:** v0.7 still resolves hits by **range/facing proxy**. Procedural 3D strike paths and swept capsule collision have not yet been integrated into the authoritative hit gate. The UI says this explicitly.
- 3D player uses simplified procedural bodies, not anatomical IK or tested animation.
- The SVG compatibility player is a 2D visualization of actual state; it is **not** evidence of real 3D contact accuracy.
- Fixed scenarios are reproducible but do not provide an exhaustive animation QA suite.
- Browser UI tests here check structure and module syntax only. Mobile touch functionality and hosted delivery still require actual device acceptance.
- The renderer should not be promoted to release until its apparent strike/target separation is clearly labeled and visual acceptance is recorded.

## Next actions
- Get authoritative swept 3D collisions wired to strike trajectories in the clean-room engine (separate gameplay work).
- Execute the node test suite via a trustworthy runtime and capture results; previous CI workflow status retrieval did not confirm a run.
- Validate review-lite.html and review.html on Safari and a low-memory Android device.
- Establish a deliberate release/promotion gate: checks pass, scenario evidence recorded, creative approval, then one deployment.
