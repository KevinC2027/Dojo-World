# Step 18 — The mayors' town requests (v2.21) — PASSED

Build: `dw2/builds/Dojo_World_v2.21.html` (from v2.20, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.21.html` — new module `dw2 v2.21 — THE MAYORS' TOWN REQUESTS` (`window.HIT_MAYOR`, `?off=mayor`), appended after
  the v2.20 module. No existing module edited: it wraps `_updateNear` / `_doInteract` (the mayors' own prompt spot), `tick` (progress
  watcher), `HIT_SHOP.give` (gifts) and adds one room-prop kind (`myrboard`). No new collision solid, no ledger change.
- `dw2/tools/mayor.py` — new seeded gate test (14 checks).
- `dw2/PLAN.md` — Step 18 status, run log.

## What was built (reason: Step 18, phase 2 non-combat activity; Kev's wishlist "a mayor for each town")
- **Two mayors, one request each per day.** Mayor Hale (Town Hall desk) and Deputy Mayor Ines (Northfield Hall counter). INTERACT at the
  same spot as before (inside the hall only) now reads "Mayor Hale: town request" and opens a touch panel: the request card, TAKE IT /
  HAND IN, BOARD, TALK (the old lines) and CLOSE.
- **Six kinds, all built on existing activities** (only what is done after taking counts):
  - dish — cook a PERFECT dish at a home stove and give it to a named townsperson (Baker, Blacksmith, Innkeeper, Farmer, Nurse, Doctor, Old fisher);
  - crop — grow a given crop in the allotment and give it to a named townsperson (garden produce only);
  - fish — catch a given species at a given water (lake pier carp/bass/lake trout, Eastwater perch/loach, river rainbow trout/dace, pond crucian/bluegill);
  - swim — the Mirror Lake course under 55 / 65 / 75 s;
  - courier — a bakery parcel delivered on time;
  - kite — fly the kite above 12 / 15 / 18 m.
  The day's request is a hash of the calendar date and the mayor (no Math.random / seeded R()); the two mayors never post the same kind
  on the same day (checked over 365 days; every kind appears 48–70 times per mayor; every named recipient exists).
- **Chip** (top left) tracks held requests: "HALE Swim course < 65 s (best 71.2)", "✓ hand in" when done, "expired" after midnight.
- **Hand in** at the same mayor -> a civic ribbon on the per-viewer **TOWN FRIEND** board: a room prop on each hall's back wall (newest 15
  rosettes, both halls show the same board) and a BOARD view in the panel with counts per kind. **No coins** (new earning still needs Kev's OK).
- **Refusals**: not finished ('not_done'), the other hall ('wrong'; the other mayor's panel has no HAND IN and says where to go), a second
  request the same day ('handed'), taking twice ('active'), yesterday's request ('expired', cleared; progress after midnight does not
  count), the coliseum ('area'; chip hidden).
- Note: the halls' old wall decorations (the town seal, LAW board, Northfield banners) are painted under the room's own back wall in this
  renderer, so the board is drawn as a room prop in the depth-sorted pass instead (like the inn's gomoku board).

## Tests run
`python3 -I dw2/tools/mayor.py dw2/builds/Dojo_World_v2.21.html --seed 7|11` — **PASS on both seeds**, every check
(`step18_2.21_mayor_seed{7,11}.json`). A test clock moves the date a day at a time; `HIT_MAYOR.force` only chooses which kind is posted.

| check | result (both seeds) |
|---|---|
| prompts | both mayors prompt inside their hall; none outside the door, behind the back wall, across the room (both halls) |
| courier | INTERACT + TAKE IT; take twice 'active'; HAND IN early 'not_done'; Ines has no HAND IN and API 'wrong'; baker job walked by joystick (0 wall crossings), on time -> done -> ribbon; second take 'handed' |
| fish | a crucian caught BEFORE taking does not count; after taking, real casts at the farm pond until a crucian (seed 11: a bluegill first, counted as progress only) -> done -> ribbon |
| swim | full course with the joystick, 39.2 s < 75 s -> done, best recorded -> ribbon |
| kite | bought through the real 'shop' debit, FLY on the Highlands, KITE button pulsed, 15.1 m > 15 m -> done -> ribbon |
| dish | 3 tomato packets bought at the honesty box, sown, watered from the pond can, grown, harvested; eggs bought; a rushed omelette given to the Farmer = not done; a perfect one = done -> ribbon |
| crop | a harvested tomato given to the Farmer (INTERACT "Give a gift" + the bag's button) -> done -> ribbon; chip shows both held requests |
| slow | a 39.2 s swim against a 20 s request: best recorded, not done |
| area | coliseum: take/hand in 'area', chip hidden, back to town fine |
| expiry | next day: the chip says expired, a matching catch no longer counts, both hand-ins refused 'expired' and cleared, today's request can be taken |
| kinds | 6 ribbons, one of each kind, board counts match |
| reload | ribbons, counts and a held request survive a reload; the wall board draws in both halls; BOARD view opens; draw() clean |
| ledger | no credits at all; every debit is a shop buy (kite, packets, eggs); `eco.audit()` ok |
| errors | 0 module errors, 0 page errors |

Regressions (seed 7, v2.21): `courier.py --rounds 1` PASS, `shop.py` PASS, `cook.py` PASS, `swim.py` PASS
(`step18_2.21_regress_*_seed7.json`).

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| view | v2.20 fills | v2.21 fills | v2.20 ms (median of 3) | v2.21 ms (median of 3) |
|---|---|---|---|---|
| default spawn | 3,469 | 3,468 (−0.0%) | 46.0 | 49.8 (+8%) |
| inside the Town Hall (104, 18.2) | 1,230 | 1,236 (+0.5%) | 42.6 | 46.4 (+9%) |

Single runs saved as `step18_2.21_perf_v2.{20,21}_{default,townhall}.json`; single-run ms here swing ±15–25% (v2.20 default runs 45.9 /
53.3 / 46.0), hence medians. Ellipses/strokes/drawImage level. 0 module errors, 0 page errors. Gate (within 15%): met.

## Visual evidence
- `step18_2.21_townhall_before_left_after_right.jpg`, `step18_2.21_nfhall_before_left_after_right.jpg`, `step18_2.21_mayor_before_left_after_right.jpg`
  — same views, v2.20 left, v2.21 right (the TOWN FRIEND board with ribbons, the chip).
- `step18_2.21_panel_take_hand_board_chip.jpg` — Ines's request card (TAKE IT), Hale's done request (HAND IN), the board view, the chip.
- `step18_v2.21_town_requests.mp4` — 36 s real-time recording (not sped up, no cards; the page-load seconds trimmed off the start): Red walks
  up the Town Hall to Mayor Hale with the joystick, INTERACT, HAND IN (ribbon, board), walks off; Northfield Hall: INTERACT at Ines, TAKE IT.
  The headless renderer is software-only, so the video's frame rate is lower than on a phone.
- The thin red streak in some Northfield Hall stills (both builds) is Red's figure caught mid-teleport by the screenshot script, not a game change.

## Regressions / remaining blockers
- None found. Coin rewards for requests were left out on purpose (new earning needs Kev's OK) — easy to add if he wants.
- Next: Step 19 (darts at the inn).
