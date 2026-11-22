# Step 13 — Home cooking with your produce (v2.16) — PASSED

Build: `dw2/builds/Dojo_World_v2.16.html` (from v2.15, the newest PASSED build). Baseline untouched (`BASELINE.sha256` OK).

## Why
The allotment (Step 10) grows produce and the shops (Step 6) sell eggs, melon pan, honey and ramen, but nothing used them except giving.
The home stoves only had a one-line "cook a meal" heal. This step makes the kitchens a real non-combat activity that ties the garden and
the shops together ("simple to operate, stylistically deep"), staying in roadmap phase 2.

## Files changed
- `dw2/builds/Dojo_World_v2.16.html` — new build:
  - v2.8 shop block: three small hooks — `HIT_SHOP.addGlyph` (other modules draw their items), `HIT_SHOP.consume(pids, why)` (marks bag
    items as used, like a gift but to a kitchen, never to a person) and `HIT_SHOP.loveIf` (a gift can be loved for a reason other than
    the person's list). Shop/gift behaviour is otherwise unchanged (shop.py regression PASS).
  - new `dw2 v2.16 — HOME COOKING` script (window.HIT_COOK), `?off=cook` turns it off.
- `dw2/tools/cook.py` — new gate test (two seeds).
- `dw2/PLAN.md` — new batch Steps 13–16, Step 13 status, run log.

## What was built (how to play on the phone)
- All 10 home stoves (8 Northfield houses, the farmhouse wood stove, the stone house) — when the gift bag holds an ingredient, the stove
  prompt becomes **"Stove: recipe book (N you can cook)"**. With nothing usable in the bag the stove is exactly the old one.
- The RECIPE BOOK lists six dishes with their ingredients (green = in the bag, red = missing), times cooked and best grade:
  tomato omelette (tomatoes + eggs), daikon and egg oden (daikon + eggs), garden salad (tomatoes + daikon), strawberry melon-pan sando
  (strawberries + melon pan), honey sunflower-seed bars (sunflowers + honey), loaded ramen (ramen + eggs + daikon). WARM MEAL runs the
  old stove action unchanged.
- COOK: a frying pan on the burner (flame grows, food browns, steam rises) and a heat gauge. Tap **SEAR** when the needle is in the
  gold band, then **SERVE** on the second climb. Gold + gold = Perfect; both in the green = Good; otherwise Rushed (tapped early) or
  Overdone (late, or the needle ran off the top). Each recipe has its own speeds and band positions. A pan steams on the stove in the
  world while Red cooks.
- The ingredients (the oldest of each kind) leave the bag only on SERVE. CANCEL, being hit / hitting someone, walking out of the house,
  the coliseum or the holding cell stop the cook and nothing is used.
- The dish goes in the gift bag with its own drawing; a Perfect dish is loved by anyone you give it to.
- No coins earned or spent, no new hp/stat effect (the old stove heal is untouched), no change to Red's pose, camera, controls or combat.
  The INTERACT prompt is hidden while the panel is open (so E can't trigger the old stove behind it).

## Tests run
`python3 -I dw2/tools/cook.py dw2/builds/Dojo_World_v2.16.html --seed 7` and `--seed 11`: **PASS** both
(`step13_2.16_cook_seed7.json`, `step13_2.16_cook_seed11.json`). Garden produce is seeded as earlier harvests in the allotment's saved
state; shop goods are bought through the real 'shop' debit; everything else goes through `_updateNear`/`_doInteract` and the panel buttons.
- oldstove: empty bag -> all 10 stoves keep their old labels; INTERACT gives the same hp result as v2.15 (checked side by side).
- stoves: 10/10 stoves show the recipe book prompt and open the book in their own room.
- cook: 6/6 recipes at 6 different stoves with the grade aimed for — omelette perfect, oden good, salad overdone (ran off the top),
  sando rushed, bars perfect, ramen good. Every serve: bag unchanged while cooking, exactly the recipe's ingredients used once
  (oldest pid of each kind), dish added, no ledger entry, pan prop added/removed.
- missing: sando without melon pan -> COOK disabled, start refused ('missing'), bag unchanged.
- cancels: CANCEL / walk out of the house / punch someone (fight) / coliseum — all stop the cook, nothing used.
- warm: WARM MEAL still runs the old stove action. give: a perfect omelette to the farmer = loved; a good oden = only liked.
- ledger: coins spent == the 7 shop goods bought; credits unchanged; audit clean; consumed pids unique and all marked '@cook:'.
- reload: dishes and recipe book identical after a reload. 0 page errors, 0 module errors.

Regressions (v2.16, seed 7): `shop.py` PASS (`step13_2.16_regress_shop_seed7.json`), `garden.py` PASS (`step13_2.16_regress_garden_seed7.json`).

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.15 fills | v2.16 fills | v2.15 ms | v2.16 ms |
|---|---|---|---|---|
| default spawn (3 runs) | 3,451 / 3,447 / 3,448 | 3,448 / 3,448 / 3,448 (and 3,448 / 3,451 / 3,449) | 49.9 / 57.9 / 71.3 (mean 59.7) | 6 runs mean 59.1 |
| kitchen nf_s0, Red at the stove (v2.16: salad cooking, panel open) | 889 / 890 / 890 | 933–935 | 6 interleaved runs: median 43.4, mean 45.7 | median 47.1, mean 48.7 |

Fills: default +0.0%; kitchen +5% (the pan prop and the panel's own canvas, which redraws every frame while cooking). Frame time:
default level; kitchen while cooking +7% (mean) / +8% (median). Within the 15% budget.

## Visual evidence
- `step13_v2.16_cooking.mp4` — 19 s, real time: Red walks into the Tanaka house (nf_s0) through the door with the joystick (steered by a
  script), INTERACT at the stove opens the recipe book, COOK the omelette, SEAR and SERVE in the gold band -> "Perfect! Tomato omelette",
  the book shows it, the gift bag with the dish, then he walks back out. No title or report cards (page loading trimmed).
- `step13_2.16_walkin_book_pan.jpg` — frames from the video: the recipe book, the pan mid-cook (SEAR: PERFECT), the result.
- `step13_2.16_kitchen_before_left_after_right.jpg` — same kitchen view, v2.15 / v2.16 with a cook in progress.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers
None for the gate. Notes: the gate text said perfect / good / overdone; the build also distinguishes "rushed" (tapped too early) from
"overdone" so the feedback says which way you missed. Possible follow-ups (not built): eating a dish yourself, or NPC favourite dishes.
