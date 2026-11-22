# Step 16 — Rain showers that change the town (v2.19) — PASSED

Build: `dw2/builds/Dojo_World_v2.19.html`, made from v2.18 (the newest PASSED build). The baseline is untouched (`BASELINE.sha256` OK).

## Why
This step stays in roadmap phase 2: depth and scenic open spaces. The town always had the same golden-hour sky. A passing shower makes
it feel alive: people react, and the non-combat activities change (the beds get watered, the fish bite). It also gives the bus
shelters and shop awnings a use.

## Files changed
- `dw2/builds/Dojo_World_v2.19.html` — new build:
  - New `dw2 v2.19 — RAIN SHOWERS` script (`window.HIT_RAIN`), added last. `?off=rain` turns it off, `?rain=1` keeps it raining (so
    you can see it), and `?rain=0` keeps it dry.
  - Fishing module: the bite wait is multiplied by `HIT_FISH.biteMul` (1 normally, 0.7 while it rains). It's one marked line.
  - Garden module: new `HIT_GARDEN.rainWet()`, which wets every bed (sown or not) the same way a pour from the can does. Empty wet
    beds now draw dark too, and sowing a bed the rain has wetted keeps it wet.
  - Town-folk module (v3.168): someone walking to or waiting under a shelter isn't pulled back to their job spot and doesn't make
    job gestures. These are two marked lines.
- `dw2/tools/rain.py` — new gate test.
- `dw2/tools/{garden,fish,swim,boat,shop,cook,kite,bus,cross}.py` — one test-side change each: an optional `--q` query string, so
  regressions can run with `?rain=0` (deterministic: the weather is wall-clock and some tests jump the clock) or `?rain=1`.
- `dw2/PLAN.md` — Step 16 status and run log.

## How it plays
- **Weather cycle (wall clock):** the day is cut into 15-minute slots. About half of them hold one shower, which starts 1–7 min into
  the slot and lasts 2.5–5 min. It builds up over 25 s and eases off over 25 s. A hash of the slot number decides it (no random
  calls), so every viewer sees the same weather at the same moment and it carries on between visits.
- **Look:** an overcast grey sky, a cool dark wash over the ground and roofs, two layers of slanted rain streaks, and ripples popping
  in the puddles round Red. The ripples are drawn on the ground layer, under people and props. Nothing is drawn indoors or in the
  coliseum (it keeps its own sky). Toasts read "It's starting to rain · townsfolk head for cover" and "The shower passes · the town
  dries off".
- **Townsfolk:** when it starts, each person outdoors makes one choice:
  - **Shelter.** They walk to the nearest free sheltered spot within ~30 m. There are 42 standing spots: the four bus shelters, the
    dojo pavilion, the three Northfield shop awnings, the farm stand and the two civic-square stores. They go by a walkable route
    (the courier's grid search around walls, furniture and water). A route that would step into a carriageway or water is refused.
    They wait there facing out. 1–5 s after the shower ends they walk back to where they were, by route again, and carry on.
  - **Umbrella.** Otherwise they open an umbrella and carry on. The canopy and shaft are drawn above the figure: there's no new
    pose.
  - People in a fight, provoked, swimming, on a bench, the current target, a responding officer and the courier's recipient are
    never steered. They get an umbrella if they're outdoors. People indoors are already covered.
- **Also while it rains:** all four allotment beds are watered and stay wet 2 min after the shower. Fish bite ~30% sooner. The swim
  course and boats stay open.
- **Notice boards** (the street board, the inn, Northfield Hall) add a WEATHER line, e.g. "WEATHER: dry; next shower in about
  5 min, for about 3 min." or "WEATHER: a shower now, clearing in about 2 min."

## Tests run
`python3 -I dw2/tools/rain.py dw2/builds/Dojo_World_v2.19.html --seed 7` and `--seed 11`: **PASS** both
(`step16_2.19_rain_seed7.json`, `..._seed11.json`).

The test clock moves 1/60 s per tick, so wall-clock weather and game time agree. An independent observer wrapped round `tick()`
checks every step of every steered walk: `wallBetween(prev, now)`, inside a tall solid, and in a carriageway.

| seed / spot | shower | outdoors at +70 s | sheltered / umbrella | uncovered | walked back (max dist) | steered steps | wall / solid / road |
|---|---|---|---|---|---|---|---|
| 7 civic | 178 s | 13 | 4 / 9 | 0 | 6/6 (0.29 m) | 4,114 | 0 / 0 / 0 |
| 7 Northfield | 276 s | 9 | 3 / 6 | 0 | 5/5 (0.30 m) | 7,255 | 0 / 0 / 0 |
| 7 farms | 277 s | 8 | 2 / 6 | 0 | 4/4 (0.30 m) | 6,098 | 0 / 0 / 0 |
| 11 civic | 178 s | 14 | 4 / 10 | 0 | 6/6 (0.29 m) | 5,687 | 0 / 0 / 0 |
| 11 Northfield | 276 s | 10 | 3 / 7 | 0 | 3/3 (0.29 m) | 3,089 | 0 / 0 / 0 |
| 11 farms | 277 s | 10 | 2 / 8 | 0 | 2/2 (0.29 m) | 2,711 | 0 / 0 / 0 |

- **Schedule:**
  - Dry for the 20 s before each shower.
  - The first rain falls 0.017 s (one tick) after the scheduled start, and intensity reaches 1 at exactly +25 s.
  - It's dry again 0.007–0.013 s after the scheduled end.
  - The "raining" flag turns on at +7.5 s and off at −3.7 s (the 0.3 / 0.15 thresholds). Both toasts fire.
- **None stuck:** 90 s after each shower ends, nobody is steered or holding an umbrella, every shelter spot is free, and nobody was
  left on a spot. 0 give-ups and 0 re-plans were needed in the gate runs.
- **Garden:** all four beds are dry before the shower and wet 2 s after it starts. They're still wet 93 s after it ends (22 s left)
  and dry 40 s later.
- **Fish** (lake pier, 40 casts each): the mean bite wait is 271 → 190 ticks in rain (×0.70, seed 7) and 286 → 191 (×0.67, seed
  11). `biteMul` returns to 1 when it's dry.
- **Board:** the street board and the inn's board both show a WEATHER line that matches the schedule (dry / shower now).
- **Coliseum:** with its sky on, intensity is 0, nothing rains, nobody is steered, and draw() is OK.
- **Errors:** 0 module errors, 0 page errors. draw() in rain is OK at all three spots.

Regressions on v2.19, seed 7, all **PASS**:
- With `?rain=0`: `garden.py`, `shop.py` (15/15), `cook.py`, `kite.py`, `bus.py`, `swim.py`, `fish.py` (240 casts, all in water,
  early strikes never hook), `boat.py` (0 hull / swimmer / pier violations).
  - The first garden run failed its reload check only because 7 tests ran in parallel and the reload took 12 s of real time
    (limit 10 s). Run alone it passed (4.5 s).
- With `?rain=1`: `swim.py` PASS and `boat.py` PASS, so both stay open in the rain.
- With `cross.py` (36k ticks, Red at the plaza): 0 pedestrian–kart overlaps, 0 close calls, and 0 jaywalk ticks, with or without
  rain. There were 9 completed crossings in rain vs 21 dry, because people shelter instead of running errands.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
All v2.19 numbers are with rain at full intensity (forced) unless marked dry. Each view was held 6 s after setting the weather, so
people had already walked to cover or opened umbrellas.

| View | v2.18 fills | v2.19 fills | v2.18 ms (mean) | v2.19 ms (mean) |
|---|---|---|---|---|
| default spawn (10 runs v2.18, 5 rain, 3 dry) | 3,455–3,458 | rain 3,457–3,485 · dry 3,448–3,458 | 53.5 | rain 53.3 (−0.5%) · dry 52.4 |
| Northfield (6,84) (6 / 4 runs) | 2,299–2,307 | 2,290–2,292 | 51.0 | 51.4 (+0.8%) |
| civic square (78,12) (2 / 2 runs) | 3,672–3,674 | 3,676–3,677 | 75.0 | 66.1 (−12%, noise) |

- Fills are +0.0% to +0.8% at default, −0.6% in Northfield and +0.1% at civic. Ellipses are +15–30 (ripples) and strokes +3–30.
  These are within budget.
- How the rain is drawn: the overlay is a 1 × 64 gradient strip stretched with drawImage. A full-screen gradient fill measured ~10×
  slower here, and the first version (a multiply grade plus a gradient fill) cost +16–19% ms. The streaks are two strokes, and the
  ripples three strokes on the ground layer.
- The rain module's tick logic costs less than 0.1 ms. People decide one per tick, so the route searches are spread out.

## Visual evidence
- `step16_v2.19_rain_shower.mp4` — 75 s, real time (the game ran at 60 ticks/s), page load trimmed, no title or report cards.
  - Red stands by the civic-square stores (x −25), using the existing zoom (mouse wheel = pinch). It's dry, then the scheduled
    shower builds up: toast, streaks, ripples, grey sky. Strollers walk to the store awnings and stop under them; the talking pair
    nearby keep talking. Red walks left and right with the joystick.
  - At 37 s the test clock jumps from 30 s into the shower to 14 s before its end. **This is a cut, not a speed-up:** the shower
    lasts ~3 min. The rain eases off ("The shower passes"), and a few seconds later the sheltered people walk back to where they
    were.
- `step16_2.19_start_shelter_end_frames.jpg` — eight frames from that video.
- `step16_2.19_{default,northfield,civic}_before_left_after_right.jpg` — the perf views: v2.18 (left) and v2.19 in rain (right),
  same view. The civic view shows an open umbrella on the businessman.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions / notes
- None found. Combat, Red's pose, controls and camera are unchanged.
- The engine keeps re-picking a sheltering person as the background target S[1], and the module hands that back to someone else
  (the same rule life192 uses). It's invisible in play but shows up as a high `retargets` counter.
- Rain waters the beds only while the game is running. A shower that falls while the game is closed doesn't count, because the
  garden runs on saved timestamps.

## Remaining blockers
None for the gate. Things Kev might want to decide:
- Shower frequency: about half the 15-minute slots, 2.5–5 min each, so roughly every half hour.
- Whether Red should get an umbrella too. That would need a held-item pose, so it's not done.
- Whether rain should ever reach the coliseum. It doesn't now, per the rule.
