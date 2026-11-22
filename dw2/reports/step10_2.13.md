# Step 10 — Allotment garden at the farm — build v2.13

Built from `dw2/builds/Dojo_World_v2.12.html` (newest PASSED build: Step 9 + Kev's boat-hire follow-up). Baseline untouched
(`sha256sum -c dw2/BASELINE.sha256`: OK).

## Why
Step 10 of the current batch (phase 2: depth and non-combat activities). The farm had fields, a pond and an honesty box, but nothing for
Red to grow. Kev's list asks for "non-combat activities that fit the town ... simple to operate, stylistically deep".

## Files changed
- `dw2/builds/Dojo_World_v2.13.html` (new):
  - DC engine block: four seed packets added to `DC_CONFIG.shop` at the farm stand (`kind: 'seed'`): tomato 8, daikon 6, sunflower 10,
    strawberry 12 DC. They are bought through the existing validated **'shop' debit** (no new ledger source, no engine change; the audit's
    price-table check covers them).
  - homes193 block: the honesty box prompt now reads "Honesty box: eggs and seed packets".
  - Town shops module (v2.8): seed packets never enter the gift bag (they are sown, not given); a small `HIT_SHOP.addSource()` lets
    another module register gift items it produces (the harvest); drawings for the four packets and four kinds of produce; a few
    townsfolk love particular produce (farmer/nurse/mayor sunflowers, innkeeper tomatoes and daikon, baker/clerk strawberries, hermit daikon);
    the honesty-box panel shows how many packets Red holds.
  - One new module (`dw2 v2.13 — ALLOTMENT GARDEN`, last `<script>`). `?off=garden` turns it off.
- `dw2/tools/garden.py` (new): the Step 10 test.
- `dw2/tools/shop.py`: a seed packet bought at the honesty box is expected to leave the gift bag unchanged (all else as before).
- `dw2/PLAN.md`: Step 10 status, run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No seeded `R()` calls. No new solids
(the beds are low and walkable, so no NPC route or nav grid changes).

## What was built (how to play on the phone)
- Four raised wooden beds on the grass east of the farm stand (x 11–17, z −60…−65) and a post with an **ALLOTMENTS** board and a
  galvanised watering can hanging on it.
- **Buy seeds**: inside the farm stand, INTERACT the honesty box: four seed packets are listed with the eggs.
- **Sow**: walk to an empty bed and INTERACT ("Sow bed 3 (2 seed packets)"). With more than one kind in your pocket, a small SOW panel
  lets you pick. With no packet, the prompt says the seeds are at the honesty box and nothing happens.
- **Water**: INTERACT the post to take the can; walk to the farm pond (across the farm road, south-west) and INTERACT at its edge to fill
  it (4 pours); INTERACT a sown bed to water it. The can is drawn in Red's right hand (his real hand position, no pose change); it tips
  and water streams onto the soil while pouring.
- **Grow**: a crop needs 3 minutes of wet soil. One pour keeps a bed wet for 2 minutes, so every crop needs two waterings. Wet soil is
  dark and glints; as it dries it pales back. A **dry bed pauses**: no growth until it is watered again, and the leaves droop.
  Stages drawn in the bed: seed drill → sprouts → leafy → flowering (yellow tomato flowers, sunflower buds, white strawberry flowers) →
  ripe (red tomatoes on bamboo stakes, daikon shoulders out of the soil, open sunflower heads, red strawberries).
  A small chip over the prompt shows the bed you stand at: "BED 3 · SUNFLOWERS · 66% · DRY · CAN 2/4".
- **Harvest**: INTERACT a ripe bed: the produce (basket of tomatoes, pair of daikon, bunch of sunflowers, punnet of strawberries) goes
  in the **gift bag** and the bed is empty again. Give it like any shop gift (people you can see; no giving through walls).
- Growth is computed from saved timestamps (this browser, try/catch), so it carries on between visits and survives a reload.
- Never changes fighting: no hp, stats or moves. Harvests never credit coins. The can goes back on its post if Red lands or takes a
  strike, leaves town, or is taken to the holding cell. Nothing works in the coliseum.

## Tests run
`python3 -I dw2/tools/garden.py dw2/builds/Dojo_World_v2.13.html --seed 7|11` (`step10_2.13_garden_seed{7,11}.json`), real game,
INTERACT path + DOM buttons; a test clock stands in for minutes of growth.

| Check | seed 7 | seed 11 |
|---|---|---|
| Empty bed, no packet: prompt points at the honesty box, nothing sown, ledger unchanged | yes | yes |
| 4 packets bought at the honesty box (INTERACT + BUY): 'shop' debit at the table price, packets +1, gift bag unchanged, audit clean | 4/4 | 4/4 |
| All 4 beds sown through INTERACT (3 via the SOW panel), one packet each; sowing an occupied bed refused | 4/4 | 4/4 |
| Can: watering without it refused, empty can refused, filling away from the pond refused, fill at the pond = 4 pours | yes | yes |
| Growth (s) after +60 s / +150 s / +450 s / water again +70 s | 60 / 120 / 120 / 180 (all beds) | same |
| Dry pause: bed dried at 120 s, prompt "dry, needs water", 300 s dry = 0 growth; harvest refused while unripe | yes | yes |
| Harvest at all 4 beds: tomatoes, daikon, sunflowers, strawberries in the gift bag; beds empty | 4/4 | 4/4 |
| No coins from sowing/watering/harvesting (balance, entry count and credits unchanged) | yes | yes |
| Ledger: 4 seed debits = 4 sown + 0 held; balance 500 − 36 = 464; audit clean | yes | yes |
| Harvested sunflowers given to the farmer (gift flow, he loves them) | yes | yes |
| Reload mid-growth: crop, wetness and the harvested bag survive; growth runs on (+40 s clock = +40 s growth) | yes | yes |
| Coliseum: can returns to the post; sow / water / fill / take refused (`area`); beds back on return | yes | yes |
| Page / module errors | 0 / 0 | 0 / 0 |

Regression (v2.13, seed 7): `shop.py` PASS (14/14 buys incl. the 4 packets, refusals, 9/9 gifts, wall, reload); `fish.py` 240/240 casts
in water (farm pond included), 0 errors; `boat.py` 10/10 paid boardings, 3,000 random ticks 0 hull/swimmer/pier violations, 0 errors;
`courier.py` PASS; `police.py` PASS. (`step10_2.13_regress_*_seed7.json`)

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.12 fills | v2.13 fills | v2.12 ms (3 runs) | v2.13 ms (3 runs) |
|---|---|---|---|---|
| default spawn | 3,446 | 3,447 | 71.0 / 56.7 / 62.3 (median 62.3) | 57.1 / 52.9 / 53.6 (median 53.6) |
| allotment, Red at (14, −66.8), all four beds ripe, after the tree sprites settle | 6,890 / 6,917 / 6,915 | 7,159 / 7,144 / 7,149 | 82.2 / 74.1 / 110.6 (median 82.2) | 80.9 / 76.6 / 95.8 (median 80.9) |

Allotment view: fills **+3.4%**, frame time level (within noise); ellipses 650 → 835 (the plants). Default view unchanged. Within the
15% budget.

Found while measuring (pre-existing, both builds): right after Red is moved to the farm, the trees there draw uncached until their sprites
are built (~57,000 fills/frame and ~250 ms per software frame for a few seconds, `sceneTree` `_tier`). Steady state is the ~6,900 above.
This happens after teleports/travel, not while walking; not changed here.

The perf runs were taken before two cosmetic tweaks (the honesty box label text; the bed chip moved down under the coin toasts). Neither
draws in the measured views (Red stands 2 m from the beds there, so the chip is off), and the garden test was re-run on the final file.

## Visual evidence
- `step10_v2.13_allotment.mp4` — 92 s, real time (HIGH camera mode): buy sunflower and tomato packets at the honesty box, walk out of
  the stand, sow two beds (SOW panel), take the can, walk to the farm pond and fill it, walk back, water both beds (pour + darkening soil),
  then the beds grow and dry, water again, harvest both, hang the can up, open the gift bag. Growth needs minutes of watered time, so
  **the wall clock is moved forward three times in the video (+70 s, +70 s, then +62 s after the second watering, all in the last third of the clip)**; the frames themselves
  are real time, not sped up. No title or report cards.
- `step10_2.13_allotment_v2.12_left_growing_mid_ripe_right.jpg` — same view (HIGH camera, Red at 14, −66.8): v2.12 empty grass /
  v2.13 beds growing (wet soil, tomato stakes, daikon leaves, sunflower stalks, strawberry flowers) / v2.13 all ripe and dry.
- `step10_2.13_chase_before_left_after_right.jpg` — CHASE camera at the same spot, v2.12 / v2.13.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers
None for the gate. Open questions for Kev (not built): whether the farmer should buy produce for coins (a new 'sell' credit source would
need his OK, like the courier tip), and whether growth time (3 min of wet soil) should be longer.
