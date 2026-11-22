# Step 14 — Riding the town bus (fares) (v2.17) — PASSED

Build: `dw2/builds/Dojo_World_v2.17.html` (from v2.16, the newest PASSED build). Baseline untouched (`BASELINE.sha256` OK).

## Why
Roadmap phase 2 (widen the world, non-combat activities, "travelers between areas", "modern countryside with roads and vehicles").
The four areas Red already uses (Northfield, the airfield, the farms, the civic square) were only connected on foot. Note: the
Step 14 text said "the yellow bus that already drives the roads" — it doesn't any more. Since v3.215 every vehicle is a kart, and the
old bus body was still in the code but unused. So this step brings the bus back as one real vehicle and builds riding on top of it.

## Files changed
- `dw2/builds/Dojo_World_v2.17.html` — new build:
  - DC ledger (DC_CONFIG): new `fare` table (bus fare 10 DC, the four stop ids), limits `farePerMin 4` / `fareDaily 400`, a validated
    `eco.fare(item, stop, key, where)` debit (price and stop checked, towns only, refused when short), and `audit()` checks every
    fare against the table.
  - roads193 (traffic): `dw2 v2.17 — THE TOWN BUS` block. One yellow bus (4.2 x 1.44 m, drawn with the old v3.201 bus body: white
    roof, window bays, TOWN sign, passengers at the windows). It's a normal member of `CARS`, so it brakes for people, animals, karts,
    red lights and fights the way the karts do, and those checks now use each vehicle's real length (they come out exactly as before
    for a kart). It never drifts, hops or boosts. It drives a fixed 719 m loop on the real roads (right-hand lane, rounded corners,
    a U-turn at the airfield end). At each stop it slows to a halt and waits 7 s, up to 15 s while Red is near the stop, and always
    while a fare is being paid.
  - Four shelters (glass back, roof, bench, stop pole with a green BUS disc, the stop name, a timetable board). They have no collision,
    so walkers and doors are untouched: Northfield (the avenue), Airfield (by the terminal), Southbank Farms, Civic Square.
  - Bus-only safety rules: someone on the pavement doesn't hold the bus unless they're right against its body (a passenger waiting at
    the stop could otherwise block it forever). At the airfield turn-round the bus only turns when nobody is within 3.6 m of the turn,
    because the body sweeps past the road edge there. If someone steps right in front of it, it stops dead. Kerb-crossing and walker
    car checks, and the kart backstop, use the bus's real size.
  - Drawing fix: tall boxes now use the real eye position for their face tests (the old proxy was the look-at point, which showed the
    wrong faces on a tall bus). This only applies while the bus or a shelter is drawn, so karts are unchanged.
  - New `dw2 v2.17 — RIDING THE TOWN BUS: FARES` script (window.HIT_BUS). `?off=bus` turns off both the bus and riding.
- `dw2/tools/bus.py` — new gate test.
- `dw2/PLAN.md` — Step 14 status, run log.

## How to play (phone)
- Walk to a shelter. With no bus there, the INTERACT prompt reads "Bus stop Farms: next bus ~40 s", and INTERACT shows the timetable
  (next bus, the route Northfield → Airfield → Southbank Farms → Civic Square, ~4 min loop, fare). Nothing is charged.
- When the bus pulls in, INTERACT says **"Board the bus · 10 DC (next: …)"**. This posts a 'fare' debit. Only when the ledger accepts it
  do the coins fly from the pouch to the bus and Red step aboard. If the pouch is short you get "Not enough coins…" and are charged
  nothing. One fare per ride, any distance.
- Aboard: Red is hidden inside (he shows at a window in his red shirt). The camera rides with the bus, and the chip reads "BUS · next:
  Southbank Farms · 120 m". The stick, attacks and jump do nothing. A round **BELL** button appears (INTERACT works too): "Get off at
  the next stop". When the bus pulls in, Red is set down on the pavement beside the shelter. If the bus is already standing at a stop,
  the button reads **GET OFF** and lets Red off right there.
- Leaving town (coliseum) while aboard sets Red down at the nearest stop first. No coins are earned and nothing changes Red's pose,
  camera rules, controls or combat.

## Tests run
`python3 -I dw2/tools/bus.py dw2/builds/Dojo_World_v2.17.html --seed 7 --laps 2 --ticks 30000` and `--seed 11`: **PASS** both
(`step14_2.17_bus_seed7.json`, `step14_2.17_bus_seed11.json`). Same paths as the buttons: `_updateNear`/`_doInteract`, joystick off.
- timetable: INTERACT at a stop with no bus shows the timetable, charges 0.
- rides: 8/8 per seed. Every stop gets boarded twice, the bell is rung, and Red gets off at the next stop. Each ride makes exactly one
  'fare' debit of 10 DC with the right stop in its meta. Balance, pouch and ledger agree, the audit is clean and nothing goes into the
  gift bag. Red is set down at the alighting spot (0.00 m off), never in the carriageway and never inside a solid. Ride times are
  15–97 s (894–5,652 ticks).
- Red aboard (about 26,000 ticks per seed): 0 ticks counted as a pedestrian in the road, 0 ticks off his seat, 0 swimming, 0 airborne.
- overlap: about 65,000–67,000 ticks checked per seed. 0 townsfolk inside the bus body (0.22 m margin, checked after each tick) and 0
  backstop contacts while the bus was moving. (In development runs a few walkers brushed the nose of a bus that was standing still.
  They were counted and reported, not hidden: 35 in one run, 0 in both final runs.)
- yield: a townsperson placed in the lane 5 m ahead while Red rides makes the bus stop 4.65 m short and wait.
- getoffnow: INTERACT while the bus waits = off right there, on the pavement. attack: PUNCH / KICK / THROW / JUMP / stick aboard leave
  Red idle in his seat, and nobody is hurt.
- leave: coliseum while aboard sets Red down at the nearest stop (on the pavement).
- free: 30,000 ticks of plain running. 8 calls per seed, always in order. The longest stop between stations was 13–14 s (red lights).
- drain: repeated fares hit the daily cap (`fare_daily`) after 30 more, as designed. The test then moves the clock a day forward and
  carries on until `insufficient`. That last attempt charges nothing, Red is left at the stop and the audit is clean.
- 0 page errors, 0 module errors.

Regressions (v2.17, seed 7): `shop.py` PASS (14/14 buys, all refusals, 9/9 gifts), `boat.py` PASS (10/10 board, hire, 0 hull/swimmer
violations, drain), `cross.py` 36,000 ticks: 20/20 crossings, 0 overlaps, 0 close calls. Jaywalk ticks went from 0 to 36 (0.6 s in
total, one pedestrian stepping out of the bus's way at a kerb). v2.16 for comparison: 17/18 crossings, 0 overlaps.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.16 fills | v2.17 fills | v2.16 ms | v2.17 ms |
|---|---|---|---|---|
| default spawn (3 runs each) | 3,446 / 3,447 / 3,447 | 3,446 / 3,447 / 3,449 | 46.3 / 43.5 / 44.0 (mean 44.6) | 50.9 / 42.7 / 44.6 (mean 46.1) |
| Northfield stop, Red at the shelter (v2.17: bus waiting) | 2,180 / 2,180 | 2,264 / 2,265 | 33.8 / 32.1 | 34.9 / 31.5 |
| moving down the avenue: v2.16 Red walking it / v2.17 Red riding the bus (3 runs) | walk 3,848 / 3,741 | ride 4,196 / 4,111 (1,805 on a run that measured past the trees) | walk 60.2 / 63.4 | ride 53.1 / 49.8 / 31.8 |

- Default: fills +0.0%, ms +3% (noise level).
- Northfield stop: fills +3.9% (shelter + bus), ms level.
- Riding vs walking the same road: fills +9.5% and ms −17%. The extra fills while moving come from tree sprites being rebuilt as the
  camera travels (`SC.tierCache`). Walking the same road in v2.16 pays the same cost. For reference, walking it in v2.17 measured
  3,631 / 3,627 fills, 55.2 / 57.0 ms.
- All within the 15% budget.

## Visual evidence
- `step14_v2.17_bus_ride.mp4` — 43 s, real time, page load trimmed, no title or report cards. Red walks to the Airfield shelter with
  the joystick (driven by a script). The bus comes up the airfield road, U-turns and pulls in. INTERACT: "Bus fare −10 DC", the coins
  fly, Red boards. The ride passes the turn onto the south-bank road. The BELL button is tapped ("Ding! The bus will stop at
  Southbank Farms"), the bus pulls in, "You step down at Southbank Farms", and Red walks off.
- `step14_2.17_board_ride_alight_frames.jpg` — six frames from that video.
- `step14_2.17_stop_{northfield,airport,farms,civic}_before_left_after_right.jpg` — the same view at each stop, v2.16 / v2.17 (shelter,
  prompt, bus waiting).
- `step14_2.17_avenue_walk_v2.16_left_ride_v2.17_right.jpg` — the perf view pair for the avenue.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers / notes
None for the gate. Notes for Kev:
- The bus is 4.2 m long, a minibus size. A full-size bus can't take the town's 3.8 m roads without mounting the kerbs at corners.
- The Civic Square stop is on the square's north road (79.5, 27). Spots further west are hidden from the camera by the Sky Tree,
  and spots further east are hidden by the square's buildings.
- Possible follow-ups (not built): a bus pass, a second bus running the loop the other way, or a route-map panel at each shelter.
