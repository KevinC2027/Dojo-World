# Step 12 — Mirror Lake swim course — build v2.15

Built from `dw2/builds/Dojo_World_v2.14.html` (newest PASSED build, Step 11). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Why
Step 12 of the current batch (phase 2: depth and non-combat activities). Mirror Lake already had real swimming and diving (depth by
body of water, wading, diving under, oxygen), and the town notice board told people to "swim only inside the buoy line" — but there was
no buoy line and nothing to do in the water. This turns the lake into a timed swim course using the swimming physics that already exist.

## Files changed
- `dw2/builds/Dojo_World_v2.15.html` (new):
  - One new module (`dw2 v2.15 — MIRROR LAKE SWIM COURSE`, last `<script>`). `?off=swim` turns it off.
  - homes193 block: one extra line on the council notice board ("Mirror Lake swim course now open: start board on the south beach...").
- `dw2/tools/swim.py` (new): the Step 12 test.
- `dw2/PLAN.md`: Step 12 status, run log.
No combat rule, move, fighter AI, Red control, camera mode, swimming/diving physics or character drawing was touched. No new solids,
no NPC routes changed, no seeded `R()` calls, no coins.

## What was built (how to play on the phone)
- **A sandy beach** on the south shore of Mirror Lake (drawn in the ground pass after the water, so the dry sand, the darker wet sand and
  the lapping foam meet the real waterline). On it, a **start board**: "MIRROR LAKE SWIM", a map of the course, your best time, and a
  lifebuoy on the post.
- Stand in front of the board and INTERACT **"Swim course: start (best 0:39.0)"**. A big **3 · 2 · 1 · GO!**; the clock starts on GO.
  Going into the water before GO is a **false start** (run over).
- **Five numbered orange buoys** bob on the lake (each with a number flag, a white band and a shadow on the water), all in 3–5.5 m of
  water. Swim to them **in order** — touching one (within 1.8 m) counts it, it turns green and splashes. The **next** buoy has a pulsing
  yellow ring on the water; when it is off screen a yellow arrow at the screen edge points to it.
- Then swim back through the **FINISH gate**: two green buoys with a red-and-white float line, just off the beach. Cross it heading for
  the shore to stop the clock: "FINISH 0:39.0 · NEW BEST!".
- The chip at the top shows `SWIM 0:13.7 · BUOY 3/5 · 7 m · BEST 0:39.0`.
- **Missed buoy:** touching a later buoy before the next one (e.g. 1 → 3) shows "Missed buoy 2! Go back for it" and that buoy flashes red;
  the later buoy does not count. Reaching the finish gate with a buoy left shows "Missed buoy N: go back for it before the finish" and
  the run does not finish. Go back, collect it, and the run carries on.
- **The run ends (no time kept)** when Red leaves the water after getting in (a third of a second on dry land), doesn't get in within 12 s
  of GO, INTERACTs the board again ("Swim course: cancel the run"), takes a boat, is knocked down or leaves town (the coliseum).
- Best time and the last five finishes are kept per viewer (this browser, try/catch); a reload keeps them.
- It is all the existing swimming: same speed, wading in the shallows, JUMP to dive under (a buoy touched while diving still counts),
  same pose and animation. A good line takes about 40 s.

## Tests run
`python3 -I dw2/tools/swim.py dw2/builds/Dojo_World_v2.15.html --seed 7|11` (`step12_2.15_swim_seed{7,11}.json`). The scripted swimmer
uses the joystick (H0.ax/az, the same camera-relative mapping as walking), JUMP and INTERACT only; Red is never put in the water by
the test — every run starts on the beach at the board.

| Check | seed 7 | seed 11 |
|---|---|---|
| Prompt: none away from the board; "Swim course: start" at the board; INTERACT → countdown; INTERACT during countdown cancels | yes | yes |
| False start: swimming off during the countdown ends the run, no time kept | yes | yes |
| 4 full runs (wobbly random lines; one dives under before buoy 3 and holds down): buoys 1–5 reached in order, each while in the water (≥1 m deep, swimming or diving); finish through the gate | 4/4 | 4/4 |
| Time = ticks the test counted from GO to finish = go/finish event ticks; best = min of finishes; last-five list matches | yes | yes |
| Finish times (s) | 40.15 / 39.98 / 40.02 / 40.65 | 39.95 / 40.72 / 40.70 / 40.68 |
| Skip buoy 2 (1 → 3): "missed 2" flagged, buoy 3 not counted; gate with buoys left: "missed 2 at finish", no finish; go back for 2–5 → finish | yes | yes |
| GO → straight to the gate: "missed 1 at finish"; then the course → finish | yes | yes |
| Swim back to the beach after buoy 1: run ends ('out'), best unchanged | yes | yes |
| Never get in: run ends exactly 12 s after GO ('dry') | yes | yes |
| Aboard a boat: start refused ('boat'); travel to the coliseum mid-run: run ends ('area'), start refused there; back in town the 7 course props return | yes | yes |
| Reload keeps best + last five | yes | yes |
| HUD / buoys / board drawn during runs with no error | yes | yes |
| Page / module errors | 0 / 0 | 0 / 0 |

Regression (v2.15, seed 7): `boat.py` and `fish.py` (both use Mirror Lake) — see below.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.14 fills (3 runs) | v2.15 fills (3 runs) | v2.14 ms | v2.15 ms |
|---|---|---|---|---|
| default spawn | 3,444 / 3,449 / 3,447 | 3,452 / 3,449 / 3,450 | 62.7 / 51.0 / 56.9 | 52.0 / 58.0 / 44.9 |
| beach (Red at 40.8, 38.4 by the board) | 2,516 / 2,516 / 2,517 | 2,554 / 2,553 / 2,552 | 49.9 / 60.4 / 60.1 | 53.8 / 56.1 / 60.9 |
| lake (Red swimming at 44.5, 53.5; v2.15 with a run in progress, HUD on) | 2,035 / 2,035 / 2,033 | 2,076 / 2,077 / 2,077 | 7 runs: median 44.0, mean 45.8 | 7 runs: median 49.0, mean 48.7 |

Fills: default +0.1%, beach +1.5%, lake +2.0% (ellipses +25 there: the buoy floats). Frame time: default and beach level; the lake view
with a run in progress is about +6% (mean) to +11% (median) over 7 runs each — the extra is mostly the run HUD and the buoy number text,
which are only drawn while you are near the lake / running. Within the 15% budget; the weakest number of this step, noted for later.

## Visual evidence
- `step12_v2.15_swim_course.mp4` — 57 s, real time, CHASE camera: Red walks up the beach to the board with the joystick, INTERACT,
  3-2-1-GO, swims buoys 1–5 (ring and arrow guiding, buoys turning green), back through the finish gate: FINISH 0:38.9, NEW BEST.
  The swimmer's line is steered by a script through the joystick. No title or report cards (the first 3 s of page loading are trimmed).
- `step12_2.15_beach_before_left_after_right.jpg` — same view, v2.14 / v2.15: the new beach, start board, buoys 1–3 and the finish gate.
- `step12_2.15_lake_before_left_after_right.jpg` — Red swimming mid-lake, v2.14 / v2.15 (buoy 3 in view).
- `step12_2.15_run_countdown_buoy3_finish.jpg` — during the video: the countdown at the board, approaching buoy 3 (chip, ring, buoy 2
  done in green), and crossing the finish gate.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions
None found. `boat.py` seed 7 on v2.15 (`step12_2.15_regress_boat_seed7.json`): board/moor 10/10, hire 150/150 DC charged, 8 directions
OK, 3,000 random ticks with 3 swimmers: 0 hull violations, 0 overlaps, Red never wet, drain ends 'insufficient' with nothing charged,
audit clean. `fish.py` seed 7 (`step12_2.15_regress_fish_seed7.json`): 240 casts at all four rod rests, all in water, no bad cases.
0 page / module errors in both. Swimming and diving elsewhere are untouched (the module only reads Red's water depth).

Known cosmetic limitation: the rowing boat does not treat the buoys as obstacles (it can be rowed through one; nothing breaks). The
buoys sit away from the pier, the boat berth and the main fishing line from the pier end.

## Remaining blockers
None for the gate. Open question for Kev (not built): whether finishing should earn anything (it can't be coins without his OK), and
whether he wants NPC swimmers to race the course too.
