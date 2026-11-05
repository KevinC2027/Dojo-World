# Dojo World — Anatomical Movement Standard
Effective: 2026-11-04 · Clean-room combat system · HIT visual identity

## Creative principle

**Judge movement as a single living body, not as independently animated anatomical parts.** The fighter must move naturally and read clearly as a solid Blue or Red figure. Visible elbows and knees should not become the focus of the presentation. Realistic leg extension should emerge from foot placement, pelvis height, support, trunk orientation, and momentum, not by forcing knee angles in isolation.

### Whole-body chain (always together)

1. **Foot-ground interaction:** a planted foot must remain at its world-space contact point; the other foot may swing, clear the floor, and land. No teleports or unrealistic skating.
2. **Ankle → knee → hip:** the knee bends to accommodate foot support and pelvis location while thigh/shin lengths stay constant. The supporting leg naturally approaches extension near mid-stance. Avoid deep crouching throughout the entire walking cycle.
3. **Pelvis → spine → shoulders:** vertical stance adjustment must propagate through pelvis, chest, neck, head and shoulders together. Preserve torso lengths and shoulder attachment when the hips rise or fall.
4. **Arms and head:** arms respond subtly and in counterphase to the legs during unguarded movement; guard suppresses exaggerated swings. Head alignment follows the torso without looking mechanically rigid.
5. **Momentum and phase transitions:** gait, guard, attack startup, attack completion and stopping must carry pose and contact history. No sudden reset to a separately authored neutral stance when attack/guard/landing phases begin.
6. **Composition and presentation:** evaluate full-body silhouettes at normal speed before slow-motion joint inspection. Preserve HIT Fuji/cherry-blossom environment, blue/red solid figures and agreed camera/visual standard.

## Engineering screening criteria (not scientific biomechanics standards)

- No significant bone-length variation, foot penetration, or unbounded foot-target/IK discrepancy.
- Torso vertical spans, shoulders, hips, and head/neck remain connected in every frame.
- Planted-leg flex visibly transitions between more extended mid-stance and bent swing/loading/retreat poses. Do not force identical knee angles across phases.
- Per-tick joint travel and acceleration are monitored with named joints and exact frames. High abrupt velocities remain defects even if endpoints look correct.
- Measure COM/support and future landing with static and velocity-aware diagnostics; neither approximation alone proves human balance.
- All independent movement and phase-transition fixtures must be re-run for BOTH fighters after changes anywhere in the rig.

## Current implementation

- `src/foot-plant-render.mjs`: reach-constrained posture elevation with smoothed adjustment, preserving world-space feet.
- `src/hit-rig.mjs`: pelvis/chest/neck/head/shoulders/arms/hips share the same vertical lift, with subtle torso lean and contralateral arm swing. Attack startup retains inherited stance height, anchor feet, and wrist baseline.
- `test/anatomical-gait.test.mjs`: guards torso proportions, midstance extension, full limb reach/floor grounding, natural arm participation, and movement-to-attack startup continuity.
- Reference low-activity planted-knee flex screening: Blue idle originally ~64° median, now ~36°; Red idle ~41° to ~18°. Blue/Red forward movement currently ~27°/~24°. These are computational posture measurements, not captured human gait.
- **Known limitation:** static full-body support diagnostic remains failed for 18 of 24 movement cases, and existing very short active attack windows can produce excessive striking-hand velocity. Neither realistic whole-body walking nor combat action is fully approved yet.

## Approval process

For each movement: inspect the complete body at normal speed from side and three-quarter cameras; then inspect frame-by-frame landmarks, foot support, segment lengths, pelvis/spine/head continuity, arm counter-swing and contacts. Request the creator's visual acceptance after metrics and actual-source video evidence. Preserve and test known-good move/phase boundaries whenever changing any body region. Ordinary moveset expansion stays gated until independent body movement has been accepted.
