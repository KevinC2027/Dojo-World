# HIT // DOJO WORLD — Visual Standard 01

## Scope
Applies to the clean-room playable preview (`index.html`), deterministic 3D review (`review.html`), SVG compatibility review (`review-lite.html`), HIT standalone demonstration, and any recorded combat clips. **No legacy gameplay code is permitted in the clean-room implementation.**

## Original prototype visual reference (provided by the creator)
- Golden-hour Japanese landscape: Mount Fuji with snowcap, cherry blossoms and distant tree line.
- Wet stone / subtly reflective ground plane and a legible, grounded fighting surface.
- Blue Kung Fu and Red Boxing must be unmistakable and retain consistent color identity.
- Solid, faceless stick-fighter silhouettes are a baseline readable **prototype** style, not the end state. No unrequested costume/skin detail or different arenas that make comparison difficult.
- Maintain consistent fighter proportions, relative scale, combat camera, foot contact line, and movement direction across live/replay/compatibility views.
- HIT is the brand of the surrounding test workstation: dark charcoal, copper/ember, restrained parchment typography. Keep HIT branding around the arena; do not replace the arena with a generic industrial fight club.

## Presentation architecture
Shared CSS `hit-visual.css` and SVG backdrop `hit-fuji.svg` are used by all three clean-room pages. The WebGL canvas must preserve alpha for the scenery to show. The WebGL floor is an independently rendered ground plane: when shader or camera framing changes, check that it aligns with the backdrop horizon. The SVG compatibility view uses the same scenery asset. Geometry is simplified and is NOT validated skeletal animation.

## Long-term aesthetic
Preserve the setting, color identity and camera grammar as assets/lighting quality improves toward physically based 3D materials, realistic characters, believable anatomy, foot-support continuity, cloth, shadows and reflections. Photorealism is an aspirational rendering target, not an assertion about the present stick-prototype.

## Required visual gates for any advancement
1. **Engine truth:** render only state originating from the actual clean-room CombatWorld for real-engine claims.
2. **Congruence:** comparison footage uses Fuji golden-hour stage, recognizable BLUE/RED silhouettes and a comparable camera/scale. Document intentional aesthetic changes.
3. **Motion truth:** preserve transitions and quantify discontinuities in root, limbs and contact if telemetry exists. Do not call cosmetic interpolation biomechanical correctness.
4. **Evidence:** capture a short actual build video or GIF if environment permits, with timestamp, commit and demo/actual-engine label. If capture unavailable, explicitly report limitation and share review steps instead.
5. **Change discipline:** no hourly auto-publishing, no Replit, no borrowing legacy gameplay code, no editing unrelated branches. Keep development and release branches isolated.

## Current status
2026-11-04: Shared asset and visual stylesheet introduced. HTML page transforms committed to development branch. These changes are **visual only**; no combat rules changes. Full browser rendering and 3D visual validation require independent verification. Preview is not claimed deployed.
