# Step 6 — Paying with real coins in town shops — build v2.8

Built from `dw2/builds/Dojo_World_v2.7.html` (newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Why
Before this step, every counter in town said spending was not set up: the general store cashier ("Everything is a free sample until the
town sets its prices"), the snack counters ("free sample: spending is not set up yet") and the farm stand honesty box ("Coins are not wired
up yet"). Red's coins could be earned, put down, banked and gifted to players, but never spent in town.

## Files changed
- `dw2/builds/Dojo_World_v2.8.html` (new):
  - DC engine block (v3.178): `DC_CONFIG.shop` (5 counters, 10 items with prices), two new limits (`shopPerMin` 8, `shopDaily` 2000),
    a new engine method `eco.buy(shop, item, key, where)` that posts the validated **'shop' debit** (price, counter and limits read from
    `DC_CONFIG`, never from the caller; refused outside town), an `audit()` rule that flags any shop debit that does not match the price table,
    and a read-only `HIT_DC.pouch()` (the coins drawn in Red's pouch, for the test).
  - homes193 block: the cashier, a new bakery counter item, the smithy counter (was the workbench) and the honesty box open the shops; the
    snacks/drinks stay free ("on the house") instead of "spending is not set up yet".
  - One new module (`dw2 v2.8 — TOWN SHOPS`, last `<script>`): shop panel, gift bag, giving, reactions. `?off=shop` turns it off.
- `dw2/tools/shop.py` (new): the Step 6 test.
- `dw2/PLAN.md`: Step 6 status, run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No seeded `R()` calls.

## What was built
How to play (phone): walk to a counter and press INTERACT (MENU > INTERACT, or E):
| Counter | Where | Sells (DC) |
|---|---|---|
| General store cashier | Northfield south row | Bouquet of flowers 30, Jar of Highlands honey 45, Notebook and pen 15 |
| Bakery counter | Northfield south row | Melon pan 12, Box of red-bean knots 28, Celebration cake 90 |
| Smithy counter | Northfield south row | Iron lantern 70, Good-luck charm 40 |
| Honesty box | Farm stand | Carton of eggs 10 |
| Ramen stall counter | Dojo street | Ramen to go 18 |

- The shop panel shows the coins in your pouch and each item drawn as a small picture with its price. BUY is greyed out when you cannot
  afford it. A purchase is charged through the ledger first; only when the ledger accepts it do the coins (gold 100 / silver 10 / bronze 1)
  fly out of Red's belt pouch and land on the counter, and the pouch shrinks. If the ledger refuses (not enough DC, limits, coliseum,
  storage failure) nothing is charged and no coins move.
- Everything sold is **presentation / gift only** (Kev's DC rule): it goes in Red's **gift bag**, never changes hp, stats or moves, and nothing
  is sold or usable in the coliseum. No cash-out.
- **Giving**: walk up to a townsperson you can see and INTERACT ("Give a gift to Baker"), or MENU > GIFT BAG. They stop, turn to face Red
  (their own facing turn, no pose change), the item passes from Red to them, and a speech bubble shows the gift and their words with a
  heart; some people love particular things (three hearts and a warmer line, e.g. businesspeople love notebooks, the baker loves flowers).
  Giving needs a clear line of sight (`wallBetween`), so nothing is given through a wall, and people inside a building only take gifts when
  Red is in that room. Shop counters keep their own prompt; next to a counter the give prompt only appears when Red faces someone close.
- The gift bag is rebuilt from the ledger (shop debits) minus what has been given away (stored in this browser, try/catch), so purchases
  survive a reload.
- Pre-existing problem avoided: long lines through the big HUD banner overflow the screen (visible in the v2.7 honesty-box screenshot);
  shop and gift messages use the small toasts and the in-world speech bubble instead.

## Measurements
### Shop test (`shop.py`, real game; INTERACT path + DOM button clicks; a test clock steps 61 s between buys)
Two seeds (7, 11): identical results (the test is deterministic apart from Math.random, which the shop code does not use for outcomes).
| Check | Result (each seed) |
|---|---|
| Every item at every counter (10 buys, 5 counters) | 10/10: prompt -> panel -> BUY; balance −price; ledger entry `src:'shop'`, amount = DC_CONFIG price, right item/counter; pouch coins = wallet; coins flown to the counter = price; bag +1; audit clean |
| Not enough DC (62 DC, cake 90) | refused `insufficient`, button greyed, balance and ledger unchanged |
| Wrong counter / unknown item | `wrong_shop` / `unknown_item` |
| Rate limit (9 buys inside a minute) | 8 ok, 9th `shop_rate` |
| Coliseum | engine `area`, HIT_SHOP `area`, no panel opens, nothing charged; back to town OK |
| Gifts to 9 townsfolk (farmer, traveler, businessman, baker, blacksmith, clerk, innkeeper, deputy mayor, mayor) | 9/9: prompt, bag panel, GIVE, reaction, they face Red (facing 1.0) and stop (moved 0.0 m), bag −1 |
| Behind a wall (0.6 m wall at 28, −4.4; person 1.7 m away) | no prompt, give refused `far`, bag unchanged, no reaction |
| Reload | bag (9 items) and balance (62) rebuilt from the ledger; audit clean (19 entries) |
| Page / module errors | none |
Raw: `step6_2.8_shop_seed7.json`, `step6_2.8_shop_seed11.json`. Also re-run: `fish.py` (seed 7, n 6: all paths behave as in v2.7, no
errors) and `lift.py` (Sky Tree lift up and down OK).

### Rendering (`perf.py`, 430x932 @2x, software renderer: compare these runs only with each other; 3 runs each, medians)
| View | v2.7 fills | v2.8 fills | v2.7 ms | v2.8 ms |
|---|---|---|---|---|
| Default spawn | 3,441 | 3,442 (+0.03%) | 44.1 | 42.7 |
| Northfield street (outside the bakery) | 2,045 | 2,046 (+0.05%) | 34.4 | 32.7 |
| Inside the bakery (v2.8: just bought, baker reacting to a gift) | 845 | 851 (+0.7%) | 41.3 | 34.2 |
Frame time swings ±10–20% between identical runs here; within that noise v2.8 is level with v2.7. Gate (within 15%): met. Raw: `step6_2.8_perf_*.json`.

## Visual evidence
- `step6_2.8_bakery_before_left_after_right.jpg`: the bakery counter, v2.7 (free-sample prompt) vs v2.8 (shop panel).
- `step6_2.8_farmstand_before_left_after_right.jpg`: the honesty box, v2.7 ("Coins are not wired up yet", overflowing banner) vs v2.8 (paid).
- `step6_2.8_gift_before_left_after_right.jpg`: a businessman on the Sky Tree road, v2.7 vs v2.8 reacting to a cake.
- `step6_2.8_panels_shop_left_giftbag_right.jpg`: after buying a cake (pouch 500 -> 410) and the gift bag.
- `step6_v2.8_shop_and_gift.mp4`: 25 s real-time recording (not sped up, no cards): Red walks into the general store, buys flowers at the
  cashier (coins leave the pouch), opens the gift bag and gives them to the clerk, who reacts, then walks out.
The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions
None found. Snack counters still heal as before (now "on the house"); the store ATM, bank, safe and coin piles are unchanged; the ledger
engine's existing paths are untouched (new method + new audit rule only).

## Remaining blockers / notes
- None for the gate. The gift bag's "given" list lives in the browser (like the fishing log); the purchases themselves are in the ledger.
- Gifts are flavour only (lines and hearts). A later step could let townsfolk remember gifts (e.g. a friendlier greeting).
