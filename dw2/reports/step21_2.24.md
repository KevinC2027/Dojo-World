# Step 21 — Bug catching with a net (mushi-tori) (v2.24) — PASSED

Build: `dw2/builds/Dojo_World_v2.24.html` (from v2.23, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.24.html` — new build:
  - `DC_CONFIG.shop.items` gains `{ id: 'net', shop: 'general', kind: 'net', once: true, price: 25 }` (Kev's PRICES rule). It uses the existing
    validated 'shop' debit, so the ledger code and `eco.audit()` needed no change. `giftable()` in the shop module also excludes kind 'net'
    (the net is kept, never in the gift bag).
  - New module `dw2 v2.24 — BUG CATCHING WITH A NET` (`window.HIT_BUGS`, `?off=bugs`; `?bugs=day|dusk|night` fixes the hour so it can be
    seen at any time), appended after the v2.23 module.
- `dw2/tools/bugs.py` — new seeded gate test (16 checks, includes a Python re-computation of the hoop geometry).
- `dw2/tools/shop.py` — two test-only updates: kind 'net' joins 'seed'/'kite' as "not a gift" in the bag check, and the rate-limit check
  now runs last on a fresh ledger (the every-item loop spends 454 of the 500 DC start with the net, leaving too little for 8 packets).
- `dw2/PLAN.md` — new batch Steps 21–24, Step 21 status, run log.

## What was built (reason: Step 21, phase 2 non-combat activity)
- **The net**: a tamo net (bamboo pole, white mesh hoop 0.6 m across with a mesh bag) at the Northfield general store, 25 DC, bought once and
  kept. With the net owned, a small green **NET** button appears outdoors in town; it takes the net out. Then **SWING** (big button),
  **BUG BOOK** and **PUT AWAY** replace it. Red keeps his pose and animation: the pole is drawn from his real hand (`pose(f).hr`), held up
  over the shoulder with the hoop tipped back.
- **The swing**: a 16-tick sweep of the hoop across the front of Red, from 40° left of his facing to 40° right, 1.25 m out, at the height of
  the insect the hoop's path comes closest to (else hip height). Anything within 0.36 m of the hoop during the sweep is caught. It sits in
  the mesh for 0.8 s ("NEW! Asian swallowtail · 8.2 cm (in your bug book)"), then flies off free. That habitat spot rests 40 s.
- **Ten real Japanese insects, real habitats, real hours** (295 habitat spots built from the world: 47 flower beds, 68 grass tufts, 59
  shoreline points on every lake, pond and river, 121 tree trunks (60 oaks); none inside solids, on the road or in water):

  | habitat | day | dusk | night |
  |---|---|---|---|
  | flower beds | cabbage white, Asian swallowtail | — | — |
  | grass | migratory locust, red dragonfly | red dragonfly, bell cricket | bell cricket |
  | water's edge | shiokara dragonfly | Genji firefly | Genji firefly |
  | tree trunks (not pines) | large brown cicada | — | — |
  | oak trunks | large brown cicada | saw stag beetle | rhinoceros beetle, saw stag beetle |

  The hour is the device's local clock with the telescope's sun (HIT_SCOPE.astro): sun up = day, down to 12° below = dusk, then night.
  Sizes are real ranges (cabbage white 4.5–6.5 cm wingspan, rhinoceros beetle 4–8 cm, firefly 1.0–1.6 cm, ...). Seasons are not modelled.
- **How they live**: butterflies perch on the flowers and flutter loops around them; dragonflies hold a perch and dart out on a fast patrol
  loop back to the same perch; cicadas and beetles sit on the south (camera) side of a trunk; locusts shuffle in the grass; crickets sit
  still with a little ♪; fireflies float over the water flashing about every two seconds.
- **They notice Red only by sight**: within each species' alert distance (beetles 1.2 m … shiokara 3.2 m), with no wall between
  (`wallBetween`, never through walls), and only when Red moves faster than a creep (1.4 m/s; full stick is 3.7 m/s, a light touch about
  1.1) or is fighting. Startled: butterflies, dragonflies and fireflies fly 7–11 m away and settle; a cicada flies to another trunk;
  locusts hop ~4 m, crickets ~1.3 m; beetles let go, drop into the grass and play dead for 5 s, then climb back. A miss close by startles
  anything that can see Red. A shower (HIT_RAIN) sends every insect into hiding until it passes.
- **BUG BOOK** (per viewer, try/catch storage): 10 entries drawn as small icons; unfound ones greyed "? ? ?" with their habitat hint; found
  ones show the Japanese name, size range, times caught, biggest, first date. Catch-and-release only: no coins, no hp/stat/combat effect.
- Packed by any fight (attacking, guarding, a hit), water, the boat, the bus, fishing, the swim course, the kite going up, going indoors,
  leaving town. The coliseum never sees it. Insects are drawn 4x their real size so they read on a phone, and are skipped when a
  building stands between the camera and them (they are drawn after the scene). No Math.random / seeded R() calls (all hashes of spot and
  game time). Only players who own a net see the insects (they are tiny otherwise).

## Tests run
`python3 -I dw2/tools/bugs.py dw2/builds/Dojo_World_v2.24.html --seed 7|11` — **PASS on both seeds**, every check (identical numbers:
the module has no randomness):

| check | result (both seeds) |
|---|---|
| nonet / short | no net: NET refused 'none', no insects; pouch < 25 DC: refused 'insufficient', balance and ledger unchanged |
| buy | through the shop panel's real button: one 25 DC 'shop' debit (general), coins flown 25, panel shows OWNED (disabled), second buy 'owned', not in the gift bag, audit clean, owned after reload |
| out | NET works on the meadow; refused water / inside (nf_s0) / coliseum ('area') / boat / kite up |
| catch | all 10 species caught through the joystick (creep, stick 0.3) + SWING at their own habitat and hour, 0 startles of the target on the way: cabbage white 6.4 cm, swallowtail 11.9, red dragonfly 4.2, shiokara 5.5, cicada 5.4 (yh 1.89 m on a trunk), rhinoceros beetle 4.7, stag beetle 5.9, firefly 1.1, locust 4.9, bell cricket 2.1 |
| hours | 295 spots x 3 phases: every species from its habitat's table (0 violations); live insects at 6 places per phase only that phase's species (day: cabbage/swallow/akatombo/batta/cicada/shiokara; dusk: akatombo/suzumushi/kuwagata/hotaru; night: suzumushi/kabuto/kuwagata/hotaru); real clock: local noon = day, 22:00 = night, same as the telescope's sun; 60 min of dusk between |
| rain | 34 insects around Red -> shower: 0 -> dry again: 34 |
| sight | running at a perched butterfly: startled at 2.2 m (flees); creeping the same line: not startled, still perched at 1.21 m; running past a 9 m wall (thin, h 9) 2.1 m from a shiokara (alert 3.2 m) at 3.7 m/s: 0 startles (wall between); the same run with it in view: startled |
| reach | 144 still targets around Red (0.4–2.2 m, −100°..+80°): 39 caught, 0 mismatches with the Python hoop path; caught only at 0.9–1.6 m, ±45° |
| miss | a swing that misses a butterfly 2.3 m away: 1 miss, it is startled (why 'miss') |
| release | caught -> 'hold' -> it flies off free and despawns, the net is back up; the spot gets no new insect for 40 s, then one arrives |
| book | 51 catches; counts and biggest sizes per species = the catch log; panel "10 of 10 species · 51 caught and let go"; kept after reload |
| pack | punch / hit taken -> 'fight', coliseum 'area', boat, water, indoors; PUT AWAY |
| walk | the joystick walks Red 11.10 m with the net out, 11.10 m without (before and after) |
| draw / audit / errors | draw() in day/dusk/night, out/swing/after-catch/book open: no errors; `eco.audit()` ok; 0 HIT_* module errors, 0 page errors |

Regressions (seed 7, v2.24): `shop.py` PASS (16/16 buys incl. the net, all refusals, 9/9 gifts, wall, reload; v2.23 also PASS 15/15 with
the same test); `kite.py` PASS (shares the general store and the open meadow); `garden.py` PASS (shares the 'shop' debit).

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only; 3 runs each, medians)
| view | v2.23 fills | v2.24 fills | v2.23 ms | v2.24 ms |
|---|---|---|---|---|
| default spawn | 3,474 | 3,472 (−0.1%) | 45.5 | 42.7 (−6%) |
| meadow flower bed (−45.2, −15.2), day; v2.24 with the net out among insects | 4,606 | 4,633 (+0.6%) | 56.9 | 52.8 (−7%) |

Ellipses +4.6% at the meadow (788 vs 753, the insects), strokes/drawImage level. Single runs saved as
`step21_2.24_perf_v2.23_{default,meadow}.json`, `step21_2.24_perf_v2.24_default.json`, `step21_2.24_perf_v2.24_meadow_net_out.json`.
0 module errors, 0 page errors. Gate (within 15%): met.

## Visual evidence
- `step21_2.24_meadow_before_left_after_right.jpg` (full screens) and `step21_2.24_meadow_closeup_before_left_after_right.jpg` — the same
  view, v2.23 left, v2.24 right with the net out: the pole and hoop in Red's hand and small insects on the flowers and grass (they are tiny at this camera distance).
- `step21_2.24_catch_hold_firefly_beetle_book.jpg` — a swallowtail in the mesh just after the swing; it flying off free; fireflies over
  Mirror Lake at night; beetles on an oak trunk at night; the BUG BOOK.
- `step21_v2.24_bug_catching.mp4` — 23 s real-time recording (not sped up, no cards; the first 2.5 s of page load trimmed): NET out, Red
  creeps up to a cabbage white and swings (it had taken off: "Missed!"), runs straight at a locust (it hops away), creeps after it and
  catches it ("NEW! Migratory locust · 4.3 cm"), opens the BUG BOOK. The headless renderer is software-only, so the video's frame rate is
  lower than on a phone.

## Regressions / remaining blockers
- None found. Notes: the game camera sits well back, so even at 4x the insects are small on screen (as Red is); the HUD chip counts the
  insects within 8 m and says "creeping" / "too fast!" to help. Seasons are not modelled (a November player still finds fireflies and
  cicadas) — easy to add if Kev wants real seasons.
- Next: Step 22 (mini golf), from v2.24.
