# Step 9 — Rowing boats on Mirror Lake (v2.11) — PASSED

## Files changed
- `dw2/builds/Dojo_World_v2.11.html` — new build, copied from v2.10 (Step 8 PASSED) plus one new module at the end of the file
  (`dw2 v2.11 — ROWING BOATS ON MIRROR LAKE`, `window.HIT_BOAT`, `?off=boat` turns it off). Nothing else in the file changed.
- `dw2/tools/boat.py` — new seeded test for this gate.
- `dw2/PLAN.md` — new batch Steps 9–12 written (rowing boats, allotment garden, gomoku at the inn, Mirror Lake swim course); Step 9 status.
- `dw2/Dojo_World_v2_BASELINE.html` untouched (sha256 matches `dw2/BASELINE.sha256`).

## What it does (reason: phase 2 "depth and non-combat activities"; the inn notice board already advertised "Boat hire at Mirror Lake" but there were no boats)
- A small wooden wasen is moored on the north side of the Mirror Lake pier with a mooring line and a BOATS sign at the boat steps.
  INTERACT at the steps: **Take a boat (Mirror Lake)**.
- Red stands at the stern and sculls with a long **ro** oar (the Japanese standing stroke). That keeps his existing stance and
  animation: no pose, geometry or animation change. The oar is drawn from his hands to the stern pivot and into the water, sweeping
  side to side; the near planking of the hull is drawn over his shins so he reads as standing in the boat.
- **Joystick** = heading, camera-relative exactly like walking. The boat turns toward it with inertia, each oar sweep adds speed
  (max 2.2 m/s), it glides and slows when the stick is released; pulling the stick back toward the stern backs water slowly.
- Bow wake, oar swirls and a slow rocking ring use the water module's own ripples; the hull bobs and rolls on the waves and leans
  into turns. A HUD line shows speed, depth and the lake; a round **MOOR / ROWING** button sits where the fishing button does
  (INTERACT lives in the MENU fold-out on a phone).
- Shallows ground the boat (scrape + hint, it stops; turn away or back off), it never passes through the pier and never leaves the
  lake (hull outline checked at 8 points, 3 sub-steps per tick), and it **stops short of anyone swimming**; a swimmer who drifts
  into a resting boat is eased aside.
- **Moor the boat** (INTERACT or the button) within ~3 m of the berth puts Red back on the pier deck; farther out it says
  "Row back to the pier to tie up". Leaving town (coliseum) moors it automatically.
- Aboard, Red is logically standing on a dry deck: the lake depth and ground read 0 under his feet only (a 1 m patch that moves
  with him), so the swimming/diving code never engages. Attacks, throws and jumps are off while aboard. No Dojo Credits, no hp,
  no stats; no seeded `R()` calls; town only.

## Tests run
`python3 -I dw2/tools/boat.py dw2/builds/Dojo_World_v2.11.html --seed 7|11 --ticks 6000`
(JSON: `step9_2.11_boat_seed7.json`, `step9_2.11_boat_seed11.json`)

| Check | seed 7 | seed 11 |
|---|---|---|
| Board at the steps + moor at the berth (INTERACT path) | 10/10 | 10/10 |
| INTERACT far from the pier refuses to moor | yes | yes |
| 8 stick directions, worst error vs the walking direction | 20.2° | 9.8° |
| Random steering ticks (3 townsfolk put in the water) | 6,000 | 6,000 |
| Ticks with the hull out of the lake / in the pier / in the shallows | 0 | 0 |
| Ticks overlapping a swimmer (swimmer-ticks checked) | 0 (22,183) | 0 (22,110) |
| Closest swimmer to the hull | 2.15 m | 0.30 m |
| Ticks with Red swimming / wading / diving / airborne aboard | 0 | 0 |
| Distance rowed; groundings / pier bumps / swimmer stops | 68 m; 3 / 7 / 0 | 110 m; 4 / 0 / 2 |
| PUNCH / KICK / THROW / JUMP aboard | Red stays idle, y 0 | same |
| Leaving town moors the boat | yes | yes |
| Page / module errors | 0 / 0 | 0 / 0 |

Video run (real time, CHASE camera): walk to the steps, board, row a 9-waypoint loop round the lake, back to the berth, moor:
1 board, 1 moor, 0 groundings, 0 errors.

## Before / after measurements (`dw2/tools/perf.py`, 430x932 @2x, 3 runs each, medians; JSON = median run)
| View | v2.10 fills | v2.11 fills | change | v2.10 ms | v2.11 ms | change |
|---|---|---|---|---|---|---|
| default spawn | 3,441 | 3,447 | +0.2% | 59.9 | 57.0 | −4.8% |
| pier (Red at the boat steps, boat moored in view) | 2,440 | 2,448 | +0.3% | 49.6 | 46.3 | −6.7% |
| lake (v2.11 rowing at 34,51; v2.10 Red swimming there) | 2,296 | 2,297 | +0.0% | 49.5 | 48.7 | −1.6% |

Gate (within 15% of v2.10): met. ms are software-rendered and noisy; compare relative only. (A first, parallel run showed a +33%
spike at the pier that turned out to be the tree sprite cache warming at a different moment; sequential runs are level.)

## Regressions
None found. Fishing, the pier deck fix, swimming and diving elsewhere are untouched (the depth/ground override only applies within
0.5 m of Red while he is aboard). Known cosmetic limitation (pre-existing): the pier railings are drawn in the ground pass, so the
moored boat is painted over the north rail where they overlap on screen.

## Visual evidence
- `step9_v2.11_rowing_boat.mp4` — 47 s real-time gameplay (CHASE camera): walk to the steps, board, row round the lake, moor.
- `step9_2.11_pier_chase_before_left_after_right.jpg` — CHASE camera at the boat steps: v2.10 / v2.11 (boat, line, sign, prompt).
- `step9_2.11_lake_chase_before_left_after_right.jpg` — same spot on the lake: v2.10 Red swimming / v2.11 rowing.
- `step9_2.11_pier_sky_before_left_after_right.jpg`, `step9_2.11_default_before_left_after_right.jpg` — default SKY camera.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers
None for the gate. Possible follow-ups (not built): fishing from the boat; a second boat; boat hire fee (would need Kev's OK on
coins for services).
