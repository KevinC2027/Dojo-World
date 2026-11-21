# Step 3 — Buildings toward GTA V-level detail — build v2.4 (PASSED)

Run: 2026-11-21T17:15Z (scheduled, Claude). Built from `dw2/builds/Dojo_World_v2.3.html` (Step 2 PASSED). Baseline untouched (sha256 OK).

## What I found first
v2.3 already carried a large building-detail layer (v3.261 HIT_BDET: wall materials, quoins, downpipes, sills, blinds, AC units,
rooftop plant, tile courses). What was still missing against the step: windows were flat stickers on the wall (no depth),
flat-roofed blocks had no real cornice, the Northfield shops (General Store, Bakery, Smithy) and the farm stand looked like
houses with no signage, and the BANK / POLICE / HOSPITAL / TOWN HALL name boards were hidden behind the roof edge.

## Files changed
- `dw2/builds/Dojo_World_v2.4.html` (new build)
  - **Inset window reveals** (HIT_BDET.win, all envlot buildings): head soffit shadow, the jamb on the side away from the eye
    (picked from the camera position along the face, so it flips as you walk past), lit sill reveal, inner shadow on the glass.
    The camera sits ~30 m back, so a true 0.15 m projection is sub-pixel; depth is drawn stylised like the rest of the 2.5D town.
  - **Street facades** (SC.win, the dojo-street apt/house/hall): same inset shadows inside the pane, jamb chosen from eye x.
  - **Projecting cornice** on flat-roofed blocks (hospital, town hall, bank, police, airport terminal): lit fascia, shaded
    soffit, dentil course on near views, shadow on the wall below.
  - **Storefronts**: General Store (green), Bakery (red), Smithy (charcoal), Farm Stand (olive) each get a named sign board,
    a striped canvas awning with valance and shadow, and lit display windows with goods; warm glow at night.
  - **Civic signage**: name boards moved from 0.9–0.95 h to 0.8 h so they sit on the facade under the cornice and are readable.
  - No change to solids, rooms, doors, characters, controls, camera or combat.
- `dw2/tools/door.py` (new): door / collision regression walk.

## Measurements (perf.py, 430x932 @2x, software renderer — relative only; views settled ~6 s)
| View | v2.3 fills | v2.4 fills | change | v2.3 ms avg | v2.4 ms avg |
|---|---|---|---|---|---|
| Default spawn | 3,251 | 3,447 | +6.0% | 41.5 | 39.6 |
| Dojo street (x-30 z-4) | 3,967 | 4,117 | +3.8% | 43.5 | 47.9 |
| Civic square (x96 z-4) | 3,377 | 3,782 | +12.0% | 40 / 44 / 46 | 47.1 / 45.5 / 48.3 |
| Northfield (x0 z80) | 1,966 | 2,244 | +14.1% | 43.5 | 47.2 |

Frame-time differences are within run-to-run noise (civic repeated 3x: +3–7%). p95 66.7 ms in all views of both builds.

## Release gate
- Before/after screenshots of each building type: **yes** — `step3_2.4_types1/2/3_*.jpg` (dojo street facades, civic blocks,
  Northfield houses/shops/inn/hall, stonehouse, airport terminal + silo, farmhouse, dock shack, ruins) and close-ups
  `step3_2.4_closeups_before_left_after_right.jpg`. The barn is hidden behind the airport terminal from the default camera,
  so it has no clean view (it gets the cornice-free gable treatment unchanged plus window reveals). Ruins are intentionally unchanged.
- Fills/frame in a town-centre view ≤ 25% above Step 2: **yes** — worst case +14.1% (Northfield), civic +12.0%, street +3.8%.
- No collision/door regressions: **yes** — all 1,039 solids identical in both builds (geometry compared), same 32 rooms;
  `door.py` walks give the same results on v2.3 and v2.4 (enter General Store and the street apartment; walls stop Red at the
  bank, bakery, stand and shop fronts at the same spots).

**STATUS: PASSED.**

## Tests run
perf.py on 4 views x 2 builds (+2 civic repeats); solids/rooms comparison; door.py on both builds; HIT_BDET.error null;
0 page errors, 0 HIT_* module errors.

## Regressions
None found.

## Visual evidence
- `step3_2.4_types1_before_top_after_bottom.jpg`, `step3_2.4_types2_...`, `step3_2.4_types3_...`, `step3_2.4_closeups_before_left_after_right.jpg`
- `step3_v2.4_storefronts_civic_walk.mp4` — 43 s real-time recording (not sped up, no cards): walk along the Northfield shops
  row, step toward the General Store and back, then walk across the civic square past the bank, hospital, hall and police.
  Headless Chrome uses a software renderer, so the video's frame rate is far lower than on a phone.

## Remaining blockers / notes
- Static facade sprite caching was not needed: the extra detail stays well inside the fills budget. Worth doing later if more
  facade detail is added (the face-space affine mapping already used for the material patterns would carry a cached layer).
- Still open from Step 1 (cheap later): SC.poly hot spot, DPR cap at 2.
