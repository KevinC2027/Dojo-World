# Step 24 — Photo walk with a film camera (v2.27) — PASSED

Build: `dw2/builds/Dojo_World_v2.27.html` (from v2.26, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.27.html` — new module `dw2 v2.27 — PHOTO WALK WITH A FILM CAMERA` (`window.HIT_PHOTO`, `?off=photo`), appended after the
  v2.26 module; one new `DC_CONFIG.shop` item (`camera`, general store, kind 'camera', once, 40 DC); the shop's `giftable()` also excludes kind
  'camera' (kept, like the kite and the net). Nothing else changed.
- `dw2/tools/photo.py` — new seeded gate test (12 checks) with an independent Python re-judge of every shot.
- `dw2/tools/shop.py` — its bag rule now lists 'camera' as a kept item (as v2.18/v2.24 did for the kite and net).
- `dw2/PLAN.md` — Step 24 status, run log.

## What was built (reason: Step 24, phase 2 non-combat activity)
- **The camera**: "Film camera · 40 DC" in the Northfield general store (a validated 'shop' debit, price from DC_CONFIG; bought once, OWNED, never in
  the gift bag). A small **CAMERA** button (in town) raises it: Red holds a little camera body in his real hand (`pose(f).hr`, no pose change) and walks
  as usual; a 3:2 viewfinder frame with corner marks appears on screen. **The game camera is not touched** (same position, follow, zoom; pinch zoom
  works and acts as the lens). **SNAP** copies what is inside the frame from the game canvas (after the world has drawn, before the viewfinder is
  drawn over it) into a 240x160 photo with a light film vignette; white flash. **ALBUM** / **PUT AWAY** buttons.
- **Twelve sights**: the Sky Tree, the Dojo, the Dojo torii, Shrine Hill, Mirror Lake pier, the farm windmill, Southbank barn and silo, the Airfield
  control tower, Town Hall, Northfield Hall, the Highlands overlook, the Ruins. Each has sample points on its
  body (a column + side points, or hand-placed ones for the Sky Tree trunk/lower canopy and Town Hall's clock tower and facade).
- **When a photo counts a sight** (judged at the moment of the shot, with the game's own projection `P()`):
  1. ahead of Red (Red is the photographer; a sight between him and the game camera does not count) and within its range of him (50 m; Sky Tree 110,
     pier 40, Town Hall/overlook/ruins 60);
  2. in frame: at least 60% of its points inside the viewfinder;
  3. big enough: projected height (or half its width) at least its share of the frame height (0.18–0.3);
  4. **not hidden**: at least half of its in-frame points visible from the game camera's real eye `(cam.mx + D sin yaw, cam.h, cam.mz − D cos yaw)`:
     a 3D ray to each point must not pass through any building volume (the world's tall, long solids, up to the drawn height of the lot they belong
     to: envlot heights, the street's shop rooms 7.6 / 4.6 m, shrine hall 6 m, teahouse 5 m; the sight's own walls excluded). No seeing through walls.
  5. not from indoors.
  The viewfinder names what would count right now ("◎ Northfield Hall (new)") or why the nearest sight doesn't ("Town Hall: hidden behind a
  building", "too small, get closer (or pinch to zoom)", "too far away", "not in the frame"); judged every 12 ticks.
- **Album** (per viewer, `localStorage`, try/catch): the last 24 photos (~11 KB each) plus each sight's first/best photo as a 120x80 thumbnail, capped
  at 900k characters (oldest photos dropped first; ~280k in the test after 49 shots). Panel: 12-sight checklist with thumbnails and dates, photo grid,
  tap for the large photo with place, time and sights, DELETE (the sight log stays).
- Packed by a hit/strike, the bus, swimming, the kite or the net coming out, fishing, or leaving town (the coliseum refuses it). One hand-held item at
  a time: CAMERA is refused while the net/kite is out, and the NET button hides while the camera is up. No coins earned, no hp/stat/combat effect, no AI
  reacts to it, no Math.random / R().

## Tests run
`python3 -I dw2/tools/photo.py dw2/builds/Dojo_World_v2.27.html --seed 7|11` — **PASS on both seeds**, all 12 checks
(`step24_2.27_photo_seed7.json`, `..._seed11.json`):

| check | result (both seeds) |
|---|---|
| nocam / short | CAMERA refused 'none' without one; with 20 DC left, buying is refused 'insufficient', 0 ledger entries, nothing charged |
| buy | through the store panel's button: 500 → 460, one 40 DC 'shop' debit (general), coins flown 40, row shows OWNED (disabled), 2nd buy 'owned', not in the gift bag, audit ok, owned after reload |
| sights | **12/12 logged**: for each, a viewpoint found south of it on open ground, Red walks the last 6 m in with the joystick (130 ticks, ends 0.25 m off), CAMERA, SNAP → logged; every photo is a real picture (8–13 KB JPEG, luminance sd 34–47) |
| refused | windmill out of frame (Red 24 m east) → 'off'; Dojo torii from 44 m → 'small' (0.175 < 0.2); **Town Hall from (116,10) or (104,12) → 'hidden'** (behind the police station, visFrac 0.14 / 0); **barn and silo from (18,−98) → 'hidden'** (behind the farmhouse); windmill from 52 m → 'far'; Dojo torii behind Red → 'behind'; from inside a Northfield room → every sight 'inside'. Each saves a photo, logs nothing, the log entry is unchanged |
| python | 19 shots x 12 sights = 228 verdicts re-judged in Python from the recorded view and the exported 186 building volumes: **0 mismatches**, max difference 0 |
| camera | game camera identical with the camera up and down (mx, mz, D, zoom, yaw, h); pinch zoom 1.6 raises the windmill's size share 0.592 → 0.947 |
| album | album + log + photo bytes identical after reload; 30 more shots → 24 kept, 12 log entries kept, 278,670 chars stored (cap 900,000); panel shows 12 sight rows and 24 thumbnails, tap → large photo, DELETE → 23 left, log still 12 |
| pack | hit, punch, coliseum (and CAMERA refused 'area' there), bus, deep water all put it away; kite/net out refuse it |
| walk | joystick walk 11.1 m with and without the camera up |
| audit / errors | eco.audit() ok, exactly one camera ledger entry; 0 module errors, 0 page errors |

Regressions (seed 7, v2.27): `bugs.py` **PASS** (the net shares the button corner; NET hides while the camera is up). `shop.py`: 17/17 buys (the
camera included), all refusals, wall and reload pass; 8/9 gifts — a traveler walked off (moved 1.64 m) before the hand-over. **v2.26 shows the same
8/9 on both of two runs**, so this is an existing timing flake, not this step. `kite.py`: fails one check per run, a different one each time
('snag' then 'pack' x2 on v2.27; on v2.26 one run passed and one failed 'snag' with the same third-TUG timing) — also an existing flake.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only; 3 interleaved runs each, medians)
| view | v2.26 fills | v2.27 fills | v2.26 ms | v2.27 ms |
|---|---|---|---|---|
| default spawn (no camera) | 3,468 | 3,467 (−0.0%) | 59.2 | 59.3 (+0.2%) |
| default spawn, camera up (v2.26: same view) | 3,468 | 3,495 (+0.8%) | 58.3 | 63.2 (+8.4%) |
| Northfield Hall viewpoint (−4, 101.75), camera up | 1,487 | 1,494 (+0.5%) | 46.0 | 41.9 (−9%) |
| windmill viewpoint (−6, −68), camera up (earlier build, same code path) | 60,128 | 60,129 (+0.0%) | 263.7 | 267.0 (+1.3%) |

Frame times swing ±5–8 ms run to run in both builds. The viewfinder is 4 dim rects + one stroked path + a label; the camera body 3 fills.
**Gate: fills and frame time within 15% at every view — met.** 0 module / page errors in every run.
Finding (not this step): the Southbank Farms view toward the windmill costs ~60,000 fills per frame in **both** builds (17x the default view) —
worth a performance pass later.

## Visual evidence
- `step24_2.27_default_before_left_after_right.jpg` — default spawn, v2.26 vs v2.27 without the camera: identical.
- `step24_2.27_default_camera_up_before_left_after_right.jpg` — same view, v2.27 with the camera up: the viewfinder, "◎ The Dojo (new)", SNAP /
  ALBUM / PUT AWAY.
- `step24_2.27_nfhall_before_left_after_right.jpg` — Northfield Hall viewpoint, before vs camera up ("◎ Northfield Hall (new)").
- `step24_2.27_hidden_townhall_silo_debug.jpg` — the two 'hidden' viewpoints with the sample points drawn (debug overlay: green = seen, red = ray hits a
  building): Town Hall behind the police station, the barn and silo behind the farmhouse; the hint reads "hidden behind a building".
- `step24_2.27_panel_shop_album_photo.jpg` — the store with "Film camera · OWNED", the album with all 12 sights logged and the photo grid, a photo opened.
- `step24_v2.27_photo_walk.mp4` — 59 s real-time recording (not sped up, no title cards): Red walks by joystick to the Dojo torii, raises the camera,
  SNAP (The Dojo + The Dojo torii, 2/12), walks east across the plaza with the camera up (the label follows what is framed), frames Shrine Hill, SNAP
  (3/12), opens the album, opens the photo, BACK, CLOSE, PUT AWAY. Taps move at a finger's pace. The headless renderer is software-only, so the frame
  rate is lower than on a phone (this recording also shared the machine with a test run).

## Regressions
None found in this step's code. The default view is unchanged when the camera is not up.

## Remaining blockers / notes for Kev
- None for the gate. Choices you may want changed: which 12 sights (Town Hall is only partly visible from the square because the police station
  stands in front of it from the fixed camera; the viewpoint that works is the square's west side); photos save the 2D frame without the optional
  GPU FX pass; trees do not count as hiding a sight (only buildings), so a pier photo through a cherry tree still counts.
- This was the last step of batch 21–24: all PASSED, so the next run writes the next batch.
