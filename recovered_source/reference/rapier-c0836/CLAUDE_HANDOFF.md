# DOJO WORLD — C0836 SOURCE HANDOFF FOR CLAUDE

Prepared UTC: 2026-11-02T18:36:43.010598+00:00

## Critical provenance
- `C0835_OFFLINE_RUNNABLE.html` and `current_actual_source/rapier-throw-lab.mjs` are the ACTUAL tested C0835 Rapier physics code. The HTML includes local WASM and can boot without a CDN.
- `USER_PROPOSED_throwController.mjs` is the USER-SUPPLIED controller from the conversation. **It has NOT been integrated into C0835 gameplay and its runtime physics behavior has NOT been validated.**
- `controller_compatibility_tests.json` is a JavaScript/mock-driven compatibility audit, not a physics simulation of the proposed controller.
- The source archive contains the genuine user-uploaded Rapier v0.21.0 package (`rapier3d-compat-0.21.0.tgz`), with original license in package. The copied original game and V2 references are NOT modified.
- C0835 shipped Dojo World source remains untouched; C0835 is an ISOLATED 3D physics lab with a staged initial load, NOT a live-input complete throw.

## Observed C0835 physics failure
C0835 actual Rapier WASM executed with 18/18 existing tests passing (which verify runtime/instrumentation, not motion realism). At fixed 60 Hz:
- First floor contact: **right shin at 0.233 s** (fails upper-back-first requirement)
- Upper-back floor contact: **2.217 s**
- Minimum head clearance: **-0.005 m** (target ≥0.15 m)
- Max connected-grip gap: **0.300 m**
- Max joint-anchor separation: **0.177 m**
- Body-center one-step jump: **0.239 m**
- Actual physics video was captured, but recipient's iPhone ChatGPT app returned a playback error. Inspect `refs/Dojo_World_C0835_Rapier_Frame_Sheet.png` or rerender from the HTML.

## Separate C0836 source compatibility check results
- User module syntax/instantiation on expected rig: **PASS**
- C0835 actual `upper_back` naming vs snippet's `rig.torso`: **FAIL** (needs adapter)
- Contact-order validation: **FAIL**, snippet permits shin hit first then torso to enter SETTLE
- Grip release: **FAIL**, snippet keeps grip 0.15s beyond contact, while user targets release at/nearly just before contact and wants physically coherent force control
- Time-invariant `dt` damping: **FAIL**, fixed blend coefficients per call
- Rotation sign: **FAIL** for neutral torso / positive X axis: backAngle rises from 1.571 to 1.721 rad, rather than approaching zero. The sign must be tested from actual pose and geometry, not universally inverted without evidence.
- These five failures are **diagnostic compatibility checks**, not a claim that the supplied controller was integrated or that it failed a full Rapier run.

## Requested independent Claude review
1. Propose a minimal, reversible integration of the user-supplied ShoulderThrow into `current_actual_source/rapier-throw-lab.mjs` with exact body keys, collision handles, and a single owner draining contact events.
2. Correct signed 3D rotation control using the measured back-normal/throw-axis relationship; do not set all limb angular velocities to identical targets without joint constraints.
3. Produce continuous, physically plausible Blue stance/pivot, sleeve-grip reach and Red shoulder-load; evaluate true world-space joint positions (not just screen x/y).
4. Implement one ground-contact state machine that records ALL earlier contacts and only accepts an upper-back/shoulder-first sequence, head ≥0.15 m clear, legs lifted; reject shin/head-first.
5. Release grip based on actual contact/velocity and minimum reach rather than time delay or teleport; avoid 3D elbow hyperextension.
6. Simulate 60 Hz deterministically for 3.6 s and report input, first-contact part/time, head clearance, joint-anchor gap, grip gap/release time, post-contact upward motion, and frame-by-frame discontinuities. Provide a minimal patch/diff plus reproducible Node/Chromium tests and short clips.
7. Preserve user-approved V2 visual throw, C0802 anterior elbow bend, original Fuji 2.5D presentation and button controls; never merge or deploy without explicit review.

## Run commands (offline)
- `cd current_actual_source`
- `npm install --offline --no-audit --no-fund ../rapier3d-compat-0.21.0.tgz` (if npm install has an issue, use `npm install ../rapier3d-compat-0.21.0.tgz --offline`)
- `npm test` (baseline C0835 harness tests)
- `node ../test_proposed_controller.mjs` (diagnostic proposed controller mismatch check; expected 1 pass, 5 fail)
- Open `C0835_OFFLINE_RUNNABLE.html` in a browser with local file support, or use Playwright `page.set_content()` if local URLs are policy blocked.

## Reference checksums
- Shipped original: `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b` — immutable
- User-approved V2 motion visual source: `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac` — immutable
- User-approved C0802 anterior elbow: `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b` — immutable
- C0835 offline actual Rapier HTML: `1740c1163fd5a36a46cba83ce270039489af4b612e4160be783ac40fc6c0fcb6`
- C0835 actual physics module: `4a084fdcb0a4956c34f851686ee3e5019eeeacf503679ff3669933b928e03811`
- User-proposed unintegrated ShoulderThrow: `144394465b750dc0953801670d9dbfad3f3447140e51d9931ce4cd24f5b37866`
