# Whole-body motion continuity report — 2026-11-04

## Scope
All changes remain in the clean-room combat project. The current six techniques retain their original rules-engine durations and outcomes. This update changes how poses interpolate, not gameplay authority.

## Correction
- Smooth pose envelopes span windup, extension, and recovery without hard phase changes.
- Hands no longer chamber unnaturally close to the shoulders, avoiding the extreme elbow folding seen previously.
- Hips, torso, shoulders, and head retain the established grounded posture across transitions.
- The kicking foot no longer counts as planted during its airborne motion; the other leg receives gradual body-weight shift.

## Verified in isolated JavaScript evaluation of current repository source
- 12 standing/moving technique sequences evaluated.
- Worst one-frame local joint motion: approximately 0.585m before, 0.168m afterward.
- Largest one-frame world-space displacement with character translation: 0.206m.
- Largest continuing planted-foot slide across these sequences: approximately 0.005m.
- No changing limb segment lengths beyond floating-point precision.
- 42 out of 42 evaluated regression groups passed, covering limb geometry, natural gait, attack phase continuity, foot placement, independent movement, and approximate balance diagnostics.

These results are from a source-driven JavaScript test harness, NOT a verified Node test run or visual browser recording.

## Open conditions
- Static center-of-mass screening still passes only 6 of 24 independent movement scenarios; movement needs a better physically grounded balance model.
- Fast kick motion still has a world-space frame exceeding 0.20m.
- A fresh game-rendered side and three-quarter visual review is required before claiming natural movement or expanding the move list.
- Preserve the solid Blue/Red figures and HIT Fuji presentation; judge whole-body silhouette at normal speed before isolated joint inspection.
