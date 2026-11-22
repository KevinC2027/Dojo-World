# Step 9 follow-up — Boat hire costs coins (v2.12)

Kev, Nov 22: "Yes boats cost coins" (answer to the open question in the Step 9 report).

## Files changed
- `dw2/builds/Dojo_World_v2.12.html` — copied from v2.11 (Step 9 PASSED). Changes:
  - `DC_CONFIG.hire` (new price table, services not goods): `boat` = Rowing boat hire, **15 DC**, place `lakepier`.
    New limits `hirePerMin: 4`, `hireDaily: 600`.
  - DC ledger: new validated **'hire' debit** (`HIT_DC.eco.hire(item, key, where)`): price/place/limits from the table, town only,
    idempotent key, refuses `insufficient` / `hire_rate` / `hire_daily` / `area` without charging. `eco.audit()` checks every hire
    debit against the price table. Hires are not 'shop' debits, so they never appear in the gift bag and don't count toward shop limits.
  - Boat module: "Take a boat (Mirror Lake) · 15 DC" posts the hire; only when the ledger accepts it do the coins fly from Red's pouch
    to the BOATS post and Red boards. One fee per trip (until he ties up). The sign reads "BOATS 15 DC". `board()` now refuses without
    an accepted hire.
  - Two fixes found while re-testing: (1) pulling the stick behind the boat now **turns it round** (pivot while backing a little);
    before it only backed water slowly and never came about. (2) A swimmer drifting up beside the boat could block every move,
    trapping it; now only moves that bring the hull *closer* to a swimmer inside the 1 m gap are blocked, moving away is always allowed.
- `dw2/tools/boat.py` — paid boarding (async INTERACT, simulated clock for the rate limit), hire ledger checks, drain-to-insufficient
  test, direction test settles 3 s before measuring, blocked-reason counters.

## Tests run
`python3 -I dw2/tools/boat.py dw2/builds/Dojo_World_v2.12.html --seed 7|11 --ticks 6000` (`step9_2.12_boat_seed{7,11}.json`)

| Check | seed 7 | seed 11 |
|---|---|---|
| Pay + board at the steps, moor at the berth | 10/10 | 10/10 |
| 10 hires charged (expected 150 DC) | 150 | 150 |
| Ledger: 10 'hire' debits, audit clean, pouch matches balance, gift bag unchanged | yes | yes |
| Drain with repeat hires: 22 accepted, then `insufficient`, nothing charged, Red stays on the pier, 5 DC left | yes | yes |
| Far from the pier refuses to moor | yes | yes |
| 8 stick directions, worst error | 0.3° | 0.9° |
| 6,000 random-steer ticks with 3 swimmers: hull violations / swimmer overlaps / Red wet or airborne | 0 / 0 / 0 | 0 / 0 / 0 |
| Attacks/jump aboard do nothing; leaving town moors | yes | yes |
| Page / module errors | 0 / 0 | 0 / 0 |

## Measurements (`perf.py`, 430x932 @2x)
| View | v2.11 fills | v2.12 fills | v2.11 ms | v2.12 ms |
|---|---|---|---|---|
| default (3 runs, medians) | 3,443 | 3,444 | 57.0 | 54.1 |
| pier (steady runs) | 2,448 | 2,448 | 50.8–58.1 | 54.8–58.1 |

At the pier both builds occasionally measure ~2,560–2,990 fills when the tree sprite cache rebuilds during the sample (seen in v2.11
and v2.12 alike); steady-state is identical. Within the 15% budget.

## Visual evidence
- `step9_v2.12_boat_hire.mp4` — 38 s real time: walk to the steps, pay (coins fly, "Boat hired −15 DC"), row a loop, moor.
- `step9_2.12_hire_v2.11_left_v2.12_mid_paid_right.jpg` — the boat steps in v2.11 / v2.12 (price on prompt and sign) / just paid.
- Headless renderer is software-only, so the video frame rate is lower than on a phone.

## Remaining
None. Price is one number in `DC_CONFIG.hire` if Kev wants it changed.
