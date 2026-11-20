# Dojo World v2 — optimisation & realism plan (Kev, approved Nov 20, 2026)

Branch: `dojo-world-v2-perf`. Do NOT touch `main` or `add-hit-1v1` (the live GitHub Pages build).

## Ground rules (Kev's standing rules — every run follows them)
- `dw2/Dojo_World_v2_BASELINE.html` is the immutable reference. Never edit it; its sha256 is in `dw2/BASELINE.sha256`.
- Each step writes a NEW build file `dw2/builds/Dojo_World_v2.<n>.html`, starting from the newest build whose step is marked PASSED below.
- Same game: keep the thin stick-figure characters, the animation style, controls, camera, combat logic, move rules and responsiveness. No character geometry/animation changes.
- Single self-contained HTML file, plays on iPhone Safari.
- No AI (Red, foes, NPCs) may detect anything through walls.
- A step is PASSED only when its release gate is met. Never build on a failing step — finish it instead.
- Every step's report (`dw2/reports/step<n>.md`) lists: files changed, reason, before/after measurements (from `dw2/tools/perf.py`), tests run, regressions, visual evidence, remaining blockers.
- Visual evidence: before/after screenshots at the same views, plus recorded gameplay video in real time (not sped up, no title/report cards). Note in the report that the headless renderer is software-only, so the video's frame rate is lower than on a phone.
- Deliver the playable single-file HTML as an attached file in the session every run (Kev's standing preference), not only a link.

## Baseline measurements (v2.0, default spawn view, 430x932 @2x)
- ~266,000 canvas fills + ~135,000 ellipses per frame; 74 trees drawn per frame (264 in world), 58 of them >40 m away and mostly hidden behind the dojo roof/buildings.
- ~97% of fills come from `sceneTree` leaf tufts (lines ~2299–2320: 3 sub-tufts x 26 clusters/tier, two-tone tip, ellipse cap, 3 leaf dabs each). Only culling is a left/right screen check.
- Quick test: screen-size LOD of clusters/dabs alone halved frame time — real headroom is much bigger.
- Town NPCs (life192) never check for vehicles; cars stop for pedestrians (roads193) but awareness is one-way.
- The Sky Tree (v3.181 block) predates the realistic tree renderer.

## Steps

### Step 1 — Performance (trees first)  — STATUS: PENDING
- Cache each tree's foliage (and bark) to an offscreen canvas sprite, keyed by species/seed/scale and a screen-size bucket; redraw per frame with drawImage. Keep wind sway as a cheap bend (e.g. 3–4 horizontal slices drawn with increasing lateral offset, height² falloff as now), so the tree still bends from a planted base.
- Distance/size LOD: full detail only when large on screen; simplified far trees; skip trees fully occluded behind solid buildings/roofs where cheap to test.
- Check other hot spots the profiler shows after trees (SC.c colour-string building per fill, ground/lot fills) and fix any cheap wins.
- Cap backing-store DPR at 2 if it costs nothing visually (iPhone is 3x).
- Release gate: default spawn view under ~15,000 fills/frame AND ≥4x faster average frame time than v2.0 in perf.py; near trees look the same in side-by-side screenshots (wind sway still visible in video); zero new page/module errors; town, Sky Tree lift and coliseum still reachable.

### Step 2 — Sky Tree realism  — STATUS: PENDING (needs Step 1 PASSED)
- Rebuild the Sky Tree visuals with the same bark ridges/plates, branch structure, two-tone tufts, leaf texture and wind sway as the town trees, scaled to its giant size, plus a convincing doorway in the trunk. Use Step 1's sprite cache so it stays cheap.
- Do not change the wind-lift travel logic (HIT_TRAVEL) or the door position.
- Release gate: screenshots near and far match town-tree style; fills/frame near the Sky Tree within 20% of Step 1's default view; lift still works both ways.

### Step 3 — Buildings toward GTA V-level detail  — STATUS: PENDING (needs Step 2 PASSED)
- Facade depth (inset windows with frames/sills/reflections), trim and cornices, signage, weathering/grime, rooftop clutter, varied materials per lot type; keep interiors and doors working.
- Cache static facade layers to sprites so detail doesn't bring the lag back.
- Release gate: before/after screenshots of each building type; fills/frame in a town-centre view no more than 25% above Step 2; no collision/door regressions.

### Step 4 — NPC logic and vehicle awareness  — STATUS: PENDING (needs Step 3 PASSED)
- NPCs look before crossing, prefer crosswalks and lights, step back from an approaching car, react to horns; drivers and NPCs notice Red (line of sight only — never through walls).
- Don't change combat rules or Red's controls.
- Release gate: scripted test of N crossings with zero NPC–car overlaps; a short real-time video of crossings; no new errors; frame time within 10% of Step 3.

## Run log
- 2026-11-20: plan, baseline copy, perf harness and baseline report committed (Claude).
