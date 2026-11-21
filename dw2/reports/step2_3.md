# Step 2 — Sky Tree realism — build v2.3 (PASSED)

Run: 2026-11-21 (scheduled, Claude). Built from `dw2/builds/Dojo_World_v2.2.html` (Step 1 PASSED build). Baseline untouched (sha256 OK).

## What I found first
Kev's v2.2 already carried the v3.261 Sky Tree canopy (ten giant oak lobes drawn with the town-tree foliage renderer, bark ridges,
plates, root flares, limbs). Two things were still short of the step:
1. **The doorway** was a flat glowing panel with a thin outline — it didn't read as an opening in a trunk.
2. **Cost while moving near it.** At rest the near view was fine, but walking toward the Sky Tree re-drew tree sprites almost every
   frame (each ~2,000 fills), because every tree re-rendered its sprite each time its on-screen size moved one 7% bucket.
   At phone walking pace that averaged **7,804 fills/frame** (2.4x the default view).

## Files changed
- `dw2/builds/Dojo_World_v2.3.html` (new build)
  - `SC.tierCache`: sprite hysteresis. A tree keeps its sprite while its shown scale stays within 0.6–1.02x of the pixel scale it was
    drawn at; when a tree is growing on screen the re-draw is made with 25% headroom, so sprites are never magnified (no blur).
    The Sky Tree's lobes opt in via `tcTol` and at most one lobe re-draws per frame. Yaw changes still re-draw as before.
  - Sky Tree doorway (HIT_TRAVEL drawTree): rolled bark lip with sun highlight and moss, dark reveal showing trunk depth (shadowed
    left wall, sun-lit right wall), wind glow set back inside, worn root-wood threshold, glow spilling on the ground.
    Door position, size, walk-in trigger, HIT_TRAVEL logic and travel timing are unchanged.
  - Removed the unused `blob()` helper (dead code from the pre-v3.261 canopy).
- `dw2/tools/walk.py` (phone-pace walk measurement), `dw2/tools/lift.py` (lift round-trip test).

## Measurements (perf.py, 430x932 @2x, software renderer — relative only; views settled 6 s after teleport)
| View | v2.2 fills | v2.3 fills | v2.2 ms avg/p95 | v2.3 ms avg/p95 |
|---|---|---|---|---|
| Default spawn | 3,253 | 3,255 | 58.3 / 83.3 | 60.0 / 83.4 |
| Near Sky Tree (Red x68 z3) | 3,673 | 3,653 | 66.0 / 100 | 64.7 / 100 |
| Far Sky Tree (Red x50 z-6) | 3,754 | 3,772 | 60.9 / 83.4 | 60.1 / 83.4 |

Walking toward the Sky Tree at phone pace (`dw2/tools/walk.py`, 300 frames, x68 z-12→1.2):

| | v2.2 | v2.3 |
|---|---|---|
| fills/frame avg | 7,804 | **4,940** (−37%) |
| sprite re-draws | 261 | **60** |
| frames with a re-draw | 157 / 300 | 52 / 300 |
| ms avg / p95 / max | 85.5 / 133 / 200 | 75.5 / 117 / 150 |

Note: an earlier perf.py run with only its default 1.5 s settle caught the cache warm-up right after teleporting (12,389 fills near);
that is a one-off load after a teleport, not steady play, so the gate uses settled views plus the walking test.

## Release gate
- Screenshots near and far match town-tree style: **yes** — lobes use the town foliage renderer; trunk has bark ridges/plates/moss;
  doorway now reads as a hollow in the trunk (`step2_2.3_door_before_after.jpg`).
- Fills/frame near the Sky Tree within 20% of Step 1's default view: **3,653 vs 3,253 = +12.3%** (settled). Walking up to it: 4,940.
- Lift still works both ways: **yes** (`dw2/tools/lift.py`, both builds identical: walk-in starts lift at z 7.4 → area `sky`,
  trips 1 → INTERACT "Wind gate down to town" → area `town`, trips 2, Red at the tree door 68, 6.1).

**STATUS: PASSED.**

## Tests run
perf.py default/near/far on v2.2 and v2.3; walk.py on both; lift.py on both; pixel diff of settled screenshots
(mean abs diff 0.6 default, 3.9 near, 1.7 far — from the new door, NPCs/cars and wind; trees match side by side).

## Regressions
None found. 0 page errors, 0 HIT_* module errors, `SC.TC.err` null, `HIT_TRAVEL.error` null. Default view unchanged.

## Visual evidence
- `step2_2.3_near_before_after.jpg`, `step2_2.3_far_before_after.jpg`, `step2_2.3_default_before_after.jpg`, `step2_2.3_door_before_after.jpg`
- `step2_v2.3_skytree_walkin_lift.mp4` — 45 s real-time recording (not sped up): walk up to the Sky Tree, through the door, wind
  lift to the Sky Coliseum, wind gate back down. Headless Chrome uses a software renderer, so the video's frame rate is far lower
  than on a phone.

## Remaining blockers / notes
- None for Step 2. The same hysteresis lowers sprite re-draws for all town trees while walking (Step 1 leftover).
- Still open from Step 1 (cheap later): SC.poly (~1,100 fills/frame) hot spot, DPR cap at 2.
