# Dojo World v2 — optimisation & realism plan (Kev, approved Nov 20, 2026)

Branch: `dojo-world-v2-perf`. Do NOT touch `main` or `add-hit-1v1` (the live GitHub Pages build).

## Ground rules (Kev's standing rules — every run follows them)
- `dw2/Dojo_World_v2_BASELINE.html` is the immutable reference (since Nov 21 this is Kev's Dojo_World_v2_2 upload; the earlier v2.0 is in `dw2/archive/`). Never edit it; its sha256 is in `dw2/BASELINE.sha256`.
- Each step writes a NEW build file `dw2/builds/Dojo_World_v2.<n>.html`, starting from the newest build whose step is marked PASSED below.
- Same game: keep the thin stick-figure characters, the animation style, controls, camera, combat logic, move rules and responsiveness. No character geometry/animation changes.
- Single self-contained HTML file, plays on iPhone Safari.
- No AI (Red, foes, NPCs) may detect anything through walls.
- A step is PASSED only when its release gate is met. Never build on a failing step — finish it instead.
- Every step's report (`dw2/reports/step<n>.md`) lists: files changed, reason, before/after measurements (from `dw2/tools/perf.py`), tests run, regressions, visual evidence, remaining blockers.
- Visual evidence: before/after screenshots at the same views, plus recorded gameplay video in real time (not sped up, no title/report cards). Note in the report that the headless renderer is software-only, so the video's frame rate is lower than on a phone.
- Deliver the playable single-file HTML as an attached file in the session every run (Kev's standing preference), not only a link.

## NEW BASELINE (Nov 21, 2026): Kev uploaded Dojo_World_v2_2 = `dw2/builds/Dojo_World_v2.2.html` (internal module version v3.261)
- Default spawn view: ~3,250 fills + 300 ellipses + ~440 drawImage per frame (trees are now cached sprites); 0 page/module errors; frame time ~10x faster than v2.0 in perf.py. Report: `dw2/reports/v2.2_baseline_perf.json`.
- Remaining top fill sites: SC.poly (~1,100/frame), wall quads, worldGround surface, drawLot.
- All new builds start from v2.2 (or later PASSED builds), never from v2.0.

## Old baseline measurements (v2.0, default spawn view, 430x932 @2x) — history only
- ~266,000 canvas fills + ~135,000 ellipses per frame; 74 trees drawn per frame (264 in world), 58 of them >40 m away and mostly hidden behind the dojo roof/buildings.
- ~97% of fills come from `sceneTree` leaf tufts (lines ~2299–2320: 3 sub-tufts x 26 clusters/tier, two-tone tip, ellipse cap, 3 leaf dabs each). Only culling is a left/right screen check.
- Quick test: screen-size LOD of clusters/dabs alone halved frame time — real headroom is much bigger.
- Town NPCs (life192) never check for vehicles; cars stop for pedestrians (roads193) but awareness is one-way.
- The Sky Tree (v3.181 block) predates the realistic tree renderer.

## Steps

### Step 1 — Performance (trees first)  — STATUS: PASSED (met by Kev's v2.2 baseline: ~3,250 fills/frame vs 266,000; ~10x faster). Small leftovers (DPR cap at 2, SC.poly hot spot) may be folded into later steps if cheap.
- Cache each tree's foliage (and bark) to an offscreen canvas sprite, keyed by species/seed/scale and a screen-size bucket; redraw per frame with drawImage. Keep wind sway as a cheap bend (e.g. 3–4 horizontal slices drawn with increasing lateral offset, height² falloff as now), so the tree still bends from a planted base.
- Distance/size LOD: full detail only when large on screen; simplified far trees; skip trees fully occluded behind solid buildings/roofs where cheap to test.
- Check other hot spots the profiler shows after trees (SC.c colour-string building per fill, ground/lot fills) and fix any cheap wins.
- Cap backing-store DPR at 2 if it costs nothing visually (iPhone is 3x).
- Release gate: default spawn view under ~15,000 fills/frame AND ≥4x faster average frame time than v2.0 in perf.py; near trees look the same in side-by-side screenshots (wind sway still visible in video); zero new page/module errors; town, Sky Tree lift and coliseum still reachable.

### Step 2 — Sky Tree realism  — STATUS: PASSED (v2.3, Nov 21: near view 3,653 fills vs 3,253 default = +12%; walking up to it 4,940 vs 7,804 in v2.2; doorway rebuilt as a hollow in the trunk; lift both ways OK. Report: `dw2/reports/step2_3.md`)
- Rebuild the Sky Tree visuals with the same bark ridges/plates, branch structure, two-tone tufts, leaf texture and wind sway as the town trees, scaled to its giant size, plus a convincing doorway in the trunk. Use Step 1's sprite cache so it stays cheap.
- Do not change the wind-lift travel logic (HIT_TRAVEL) or the door position.
- Release gate: screenshots near and far match town-tree style; fills/frame near the Sky Tree within 20% of Step 1's default view; lift still works both ways.

### Step 3 — Buildings toward GTA V-level detail  — STATUS: PASSED (v2.4, Nov 21: inset window reveals, projecting cornices, named storefronts with awnings, readable civic signs; town-centre fills +4% to +14% vs v2.3; solids/doors unchanged. Report: `dw2/reports/step3_2.4.md`)
- Facade depth (inset windows with frames/sills/reflections), trim and cornices, signage, weathering/grime, rooftop clutter, varied materials per lot type; keep interiors and doors working.
- Cache static facade layers to sprites so detail doesn't bring the lag back.
- Release gate: before/after screenshots of each building type; fills/frame in a town-centre view no more than 25% above Step 2; no collision/door regressions.

### Step 3b — Bushes revamp (Kev, Nov 21: "The bushes need to be revamped with the rest of the game")  — STATUS: PASSED (v2.5: bushes now use the tree foliage style, with flowering variants, drawn from the sprite cache; fills −1%, frame time within noise. Report: `dw2/reports/bushes_2.5.md`)

### Step 4 — NPC logic and vehicle awareness  — STATUS: PENDING (Step 3 PASSED; start from v2.5, which includes the bushes revamp)
- NPCs look before crossing, prefer crosswalks and lights, step back from an approaching car, react to horns; drivers and NPCs notice Red (line of sight only — never through walls).
- Don't change combat rules or Red's controls.
- Release gate: scripted test of N crossings with zero NPC–car overlaps; a short real-time video of crossings; no new errors; frame time within 10% of Step 3.

## After Step 4 — new objectives (Kev, Nov 21: "once you've met all objectives, create new ones")
When Steps 1–4 are all PASSED, the run that finds them so writes the NEXT batch of 3–4 steps here (Step 5, 6, ...), each in the same
format (what to build, rules, release gate, STATUS), then starts the first one in that same run. Repeat whenever a batch is all PASSED.
Rules for choosing them:
- Each objective must build or improve a real, playable feature (not planning-only, audit-only or QA-only work).
- Stay in the current roadmap phase: (2) widen the world, add depth and non-combat activities. Kev decides when phases advance, so do NOT start
  phase (3) multiplayer expansion (proximity chat, message bubbles) or (4) a photo-real / Unreal Engine port on your own.
- Do NOT build the declined combat items: pose-matched move selection ("item 4") or policy search ("item 5").
- Keep performance in budget: every new step's gate includes fills/frame and frame time within 15% of the previous PASSED build.
- Prefer items from Kev's own lists that the build doesn't yet do well (check the code before choosing):
  * World wishlist: coins that move like real coins in a bag; safes/ATMs/banks with guards; a police system; a mayor for each town;
    towns ruined by tragedy; large scenic open spaces; multi-level buildings with scalable rooftops; realistic PG-13 fall damage with a
    timed recovery penalty; hospitals; an underground secret society; travelers between areas; businessmen.
  * World directives: swimmable water with realistic effects and depth by body of water; every building open, fully furnished, with
    working items unique to it; stairs inside buildings, no ladders outside (ladders only where relevant); modern countryside with roads
    and vehicles; airport placed for future map expansion.
  * Dojo Credits: physical coins in a belt pouch, only in towns/apartments (not the coliseum); wallet menu lives in MENU only; never buys
    combat advantage, no cash-out.
  * Non-combat activities that fit the town (jobs, errands, shops, games) and keep "simple to operate, stylistically deep".
- Standing rules still apply: thin stick figures, same animation style, controls, camera and combat logic; no AI sees through walls;
  Red moves by the on-screen joystick only; Dojo Credits stay out of the coliseum.

## Run log
- 2026-11-20: plan, baseline copy, perf harness and baseline report committed (Claude).
- 2026-11-21: added the "new objectives" rule after Step 4 (Claude).
- 2026-11-21: Kev set Dojo_World_v2_2 as the new baseline; Step 1 marked PASSED from its measurements; next is Step 2 (Claude).
- 2026-11-21T13:01Z STARTED step 2 (Claude, scheduled run)
- 2026-11-21T13:15Z FINISHED step 2: PASSED — v2.3 (sprite hysteresis −37% fills while walking to the Sky Tree; trunk doorway rebuilt; lift OK)
- 2026-11-21T16:58Z STARTED step 3 (Claude, scheduled run)
- 2026-11-21T17:15Z FINISHED step 3: PASSED — v2.4 (window reveals, cornices, Northfield storefronts + signs; fills +14% worst case; doors/solids unchanged)
- 2026-11-21: Kev asked for the bushes to be revamped; v2.5 built live in the session from v2.4 (Claude). Step 4 starts from v2.5.
