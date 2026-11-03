# Owner-supplied ippon seoi nage motion references — 2026-11-03

**Status: REFERENCE ONLY. No code change or creative/visual signoff.** The owner supplied a 24.08-second portrait demonstration video, an 8-panel illustrated ippon seoi nage sequence, and an airborne throw photograph in the current ChatGPT conversation. **The binary media are NOT uploaded to this GitHub branch**; obtain the attached reference ZIP directly from the owner in a Codex task before claiming visual inspection. The reference ZIP contains original files, a dated video frame storyboard, a longer implementation brief and SHA-256 manifest.

## Media inventory and provenance
- Video: `v24044gl0000d70mdc7og65k3bp9qnkg.mp4` — 512×910, 30 fps, 24.08 s. SHA256 `72dc9f81c507a6bfb8c09383f647c251aad6d59d3159359d6b40bd90ba90ca6e`. Private instructional demonstration; introductory throw followed by a slower staged explanation.
- Infographic: `437A2D75-50F1-405F-8FE9-9D8F882032B9(1).jpeg` — 8 steps: grip sleeve; pull/step; turn/lock; bend knees; pull arm; keep pulling; throw; ippon. SHA256 `960f85589774139d382ea6a5510c38b47710aee811fea8ca1a0da79fea1fbc6f`.
- Still photo: `IMG_7944(2).jpeg` — opponent upside/airborne near grounded thrower, a pose cue only; exact technique not established by a single image. SHA256 `dee1f5bddcece3245f3eb3deb8958ccd248f798843d42d74038a0de3a423cdac`.

Licensing of original media for public redistribution has **not** been established. Use for private technical reference only; do not publish original images/video in public project assets or claim owned footage.

## Video event map (approximate timestamps, single camera)
- **0–2 s**: introductory full throw/landing demonstration.
- **3–7 s**: grip/step explanation and initial contact.
- **8–13 s**: arm and elbow lift, front-foot maneuvering and position.
- **13–16 s**: foot pivot, turn in; feet square, opponent kept close through arm control.
- **16–18 s**: hip/shoulder load; knees flex, hips across and torso hinges forward.
- **18–20 s**: force transfer, opponent rotates forward over shoulder/back and lands; continued arm pull rather than a disconnected free toss.
Camera angles, occlusion and slow presentation do **not** establish exact joint angles, impulse, mass-based center of mass or release time. Verify against actual frames before using precise timestamps.

## Required causal motion model
1. **Grip and kuzushi:** controlled arm/sleeve contact must be visibly established, then the opponent's support and balance disrupted *before* liftoff.
2. **Entry / tsukuri:** one coordinated step and pivot, load-bearing foot support, turn to place back/shoulder beneath opponent; **not** an arbitrary 360° spin.
3. **Load:** knee flex and hip placement, opponent weight line across the thrower, connected limbs and body. A 2D image cannot prove exact COM position.
4. **Kake / execution:** linked base–hip–torso–arm mechanics, continuous grip-directed rotation around shoulder/back. Do not substitute a horizontal toss, instant teleport or detached flight.
5. **Release / flight:** track grip gap, controlled-arm geometry and release conditioned on actual motion and load. Avoid violent elbow extension, shoulder inversion and wrist separation during load.
6. **Landing:** aim for upper-back/shoulder-blade-first contact in the selected variant, head safely clear, hips/legs settle after upper torso; reject head/shin-first, hover, and implausible rebound.
7. **Recovery:** retain planted support for thrower, credible gravity and existing game down/getup/recovery states.

## Codex measurement and visual validation contract
- Preserve immutable `recovered_source/`, original byte/hash manifests, established button controls, existing 25 browser regression checks and dedicated physics gate.
- For each candidate, record exact source/hash, real-input vs harness-forced trigger, both fighters/facings, contact/grip distance, feet planted/sliding, pelvis/support proxy, limb-length residual, elbow/knee range and bend side, velocity/acceleration discontinuity, torso/ground proxy, landing order/head clearance where measurable, post-contact vertical velocity and recovery.
- Use the real video as **temporal reference**, infographic for phase ordering, still for an isolated pose. Do not invent motion-capture coordinates or treat pixel distances as physical units.
- Compare **before/after** original game captures at normal and 0.25× speed, ideally with on-screen joint/trajectory diagnostics. Report uncertain physics as proxies, not rigid-body force truth.
- **Current priority remains Issue #7 / blocked PR #8:** next action is victim right-elbow carry→air distribution diagnosis using saved traces. This reference collection does not authorize changing ippon input binding, special-move implementation, an engine migration, mixing Rapier/world branches or auto-merging any rejected candidate.
- No implemented changes or approvals follow from importing a reference package alone. Any new ippon implementation requires its own scoped task and acceptance evidence.

## Codex reference-analysis prompt
Once the owner has supplied the ZIP in the Codex task: "Inspect all original files and the complete video. Build a timestamped, uncertainty-labeled event map for grip, foot pivot, hip load, arm pull, flight and landing. Map each to measurable 3D/contact constraints and existing protected game phases; explicitly distinguish physical facts from video cues and game proxies. Add a reference-only analysis to the issue/ledger, **without changing gameplay**, then return to the existing right-elbow Cycle 2 diagnostic only if separately resuming a coding task within quota. Do not merge, charge usage, or override prior acceptance gates."
