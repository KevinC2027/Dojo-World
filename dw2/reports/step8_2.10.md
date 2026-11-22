# Step 8 — Bakery courier errands — build v2.10

Built from `dw2/builds/Dojo_World_v2.9.html` (newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Why
Northfield had shops, people at home and a bakery, but no simple job: nothing asked Red to go somewhere in town and come back. The plan's
Step 8 asks for a parcel run from the bakery with a waypoint, a timer and a thank-you at the door.

## Files changed
- `dw2/builds/Dojo_World_v2.10.html` (new): one new module (`dw2 v2.10 — BAKERY COURIER`, last `<script>`). `?off=courier` turns it off.
  It adds one interactable to the bakery (`Baker: courier job`, middle of the counter) and wraps `tick`, `tryHit`, `npcRoam`,
  `_updateNear`, `_doInteract`, `drawF` (Red only, while carrying) and `draw`, the same way the shop and police modules do.
- `dw2/tools/courier.py` (new): the Step 8 test.
- `dw2/PLAN.md`: Step 8 status, run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No seeded `R()` calls. No ledger change.

## What was built
- **Taking a job**: INTERACT at the bakery counter ("Baker: courier job") opens a small panel: *"Could you run a bag of melon pan over to
  Kimura (mother)?"*, where it is, about how far on foot, and the time allowed. TAKE THE PARCEL / ANOTHER ORDER / CLOSE.
- **12 destinations**: the eight Northfield houses (by family and address, e.g. "Kimura house · 4 North Row"), the Southbank farmhouse,
  the inn (innkeeper), Northfield Hall (Deputy Mayor Ines) and the Town Hall on the civic square (Mayor Hale).
- **The route and the timer**: when the order is made, the game works out the walking route from the bakery to the destination door with
  a grid search around every solid (walls, furniture, fences) and water (bridges and decks count as land), so the route never goes through
  a wall. Time allowed = 20 s + route length / 2.6 m/s × 1.6 (Red walks about 3.7 m/s, so there is room for a wrong turn).
- **Carrying**: Red holds a brown-paper parcel tied with string in his right hand. It is drawn at the hand's real position from `pose()`
  every frame (in front of or behind the body depending on which side faces the camera), so it moves with his own walk; no pose change.
- **Finding the way**: a chip at the top ("PARCEL → KIMURA HOUSE · 4 NORTH ROW · 15 M · 0:35", amber "LATE +0:12" when over time), a
  bobbing marker over the destination door, an arrow at the screen edge when the door is off screen, and — when a building stands between
  the door and Red or the camera — a small arrow on the ground at Red's feet instead, so the marker is never drawn through a wall.
- **At the door**: when Red steps inside, the recipient walks round their furniture (same grid search, their own walking) to meet him
  just inside the door and stops in front of him, facing him. People boxed in behind a bar or desk (the innkeeper, the deputy mayor) stay
  there and Red walks up to the bar/desk; the hand-over then works across it (up to 2.8 m). INTERACT: "Hand over the parcel to …".
  The parcel passes from Red's hand to theirs, they hold it, and a speech bubble thanks him (lines per house/inn/hall/mayor).
  Afterwards they walk back to where they were standing.
- **Rewards**: an on-time delivery stamps the bakery stamp card (shown in the panel, 10 stamps); a full card is pinned on the bakery's back
  wall and a new card starts. Late deliveries are thanked without a stamp. Stamps are kept in this browser (try/catch).
  **No coins**: the plan allows a small daily-capped tip only if Kev approves, so it is not wired (`CFG.tip = 0`, no new ledger source).
- **Cancels** (clean: the job ends, the parcel drops to the ground for 3 s, the recipient goes back to their spot): DROP THE JOB (bakery
  panel, or MENU > COURIER), any fight (a strike Red lands or one he takes), travelling to the coliseum, the holding cell. No job can be
  taken in the coliseum.
- Long lines use small toasts low on the screen (not the HUD banner, which overflows a phone screen).

## Measurements
### Courier test (`courier.py`, real game, Red walks with the joystick input, real collision)
Two seeds (7, 11), 2 rounds each: 24 deliveries per seed (every destination twice). Results are the same for both seeds because the
test chooses the destinations; Math.random only picks parcel contents.
| Check | Result (seed 7 / seed 11) |
|---|---|
| Deliveries (12 destinations × 2) | 24/24 / 24/24: prompt → panel → TAKE (DOM click) → walk → recipient meets Red → "Hand over the parcel to <name>" → thanked, stamp +1, faces Red, job ends, recipient back at their spot |
| Walking through walls | 0 ticks where Red stood inside a wall, 0 ticks where a wall lay between two consecutive positions (`wallBetween`), 0 stuck |
| Doors | every destination entered through its door (Red ends inside the right room: `insideId`) |
| Time used vs allowed | worst 58% of the limit (farmhouse 189 m: 3,278 of 8,174 ticks; Town Hall 123 m: 2,285 of 5,745) |
| Recipient comes to the door | houses, farmhouse, Town Hall: in 130–270 ticks; inn + Northfield Hall: boxed in → Red walks to the bar/desk, handed over across it |
| DROP THE JOB (MENU > COURIER) | job gone, reason 'drop', parcel on the ground |
| Red punches a townsperson (businessman) | the strike lands → cancelled 'fight' |
| A townsperson lands a hit on Red | cancelled 'fight' |
| Coliseum | travelling there cancels ('area'); taking a job there is refused; the panel does not open; back to town OK |
| Cancel while the recipient walks over | they walk back to where they stood |
| Late delivery | thanked, no stamp, chip shows LATE |
| Full card | 9 → 10 stamps fills the card (cards +1, stamps 0); survives a page reload |
| Page / module errors | none |
Raw: `step8_2.10_courier_seed7.json`, `step8_2.10_courier_seed11.json`. An extra run (seed 3, 1 round: 12 deliveries + all cancels) also passed.

After the video and the perf runs, the townspeople's walk back to their spot was made sturdier: they now keep 0.35 m clear of furniture
on the way back (falling back to the 0.25 m used for the walk to the door), and if they get caught on a chair they look for the way
again from where they are (up to 3 times). Before that, one resident could stay caught on a chair after a cancelled job. Logic only
(no drawing); the courier test above was re-run on the final file.

Regressions re-run on v2.10: `shop.py` (seed 7) PASS; `police.py` (seed 7, fuzz 10) PASS; `lift.py` up and down OK;
`door.py`: the same rooms are entered as with v2.9 run the same way (it is a real-time walk, so end positions vary run to run).

### Rendering (`perf.py`, 430x932 @2x, software renderer: compare these runs only with each other; 3 runs each, medians)
| View | v2.9 fills | v2.10 fills | v2.9 ms | v2.10 ms |
|---|---|---|---|---|
| Default spawn (no job; runs interleaved v2.9/v2.10) | 3,441 | 3,440 (−0.0%) | 80.4 | 75.1 |
| Bakery counter (v2.10: carrying, chip) | 864 | 867 (+0.3%) | 52.7 | 52.2 |
| South row, Red outside carrying to 5 South Row (v2.10: marker up) | 2,433 | 2,437 (+0.2%) | 59.2 | 52.4 |
| Inside 4 North Row (v2.10: hand-over, recipient holding the parcel) | 859 | 863 (+0.5%) | 58.5 | 47.9 |
Frame time swings ±25% between identical runs here (default spawn: 53–83 ms for the same build); within that noise v2.10 is level
with v2.9. The route search runs once when an order is made (3–70 ms in the headless browser, longest for the farmhouse), and once
when the recipient starts walking (a small grid around the room), never per frame. Gate (within 15%): met.
Raw: `step8_2.10_perf_*.json`.

## Visual evidence
- `step8_2.10_bakery_before_left_after_right.jpg`: the bakery counter, v2.9 vs v2.10 (courier panel with the stamp card).
- `step8_2.10_southrow_before_left_after_right.jpg`: South Row, v2.9 vs v2.10 (chip, marker over the Abe house door).
- `step8_2.10_delivery_before_left_after_right.jpg`: inside 5 South Row, v2.9 vs v2.10 (the recipient holding the parcel, thank-you, stamp).
- `step8_2.10_behind_building_before_left_after_right.jpg`: the camera behind the bakery with the destination on the far side: no marker
  is drawn through the building.
- `step8_v2.10_courier_delivery.mp4`: 29 s real-time recording (not sped up, no cards): Red walks to the bakery counter, takes the
  parcel to the Kimura house, walks there with it in his hand, steps in, Mrs Kimura comes to the door, he hands it over, stamp 4/10.
  The headless renderer is software-only, so the video's frame rate is lower than on a phone. (Red is placed at the bakery door by
  script at the start; the one-frame stretch right after that placement is the game's own teleport smoothing, same in v2.9.)

## Remaining blockers
None for the gate. Kev to decide: a small daily-capped coin tip per delivery (new validated 'job' ledger source) — not built.
Follow-ups: route hints along the way (only the door marker and a feet arrow today); deliveries to other towns once they have homes.
