# Step 19 — Darts at the inn — build v2.22

Built from `dw2/builds/Dojo_World_v2.21.html` (newest PASSED build, Step 18). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).
(The 21:59Z run logged STARTED but left no build, report or FINISHED line; this run restarted Step 19 from v2.21 once that start was 2 h old.)

## Why
Step 19 of the current batch (phase 2: depth and non-combat activities). The inn already had gomoku at the bar; a dartboard is the other
classic pub game and fits "simple to operate, stylistically deep": tap, wait for a steady hand, throw.

## Files changed
- `dw2/builds/Dojo_World_v2.22.html` (new):
  - One new module (`dw2 v2.22 — DARTS AT THE INN`, last `<script>`). `?off=darts` turns it off.
  - homes193 inn block: the inn's Guest is now the **Regular** (same NPC, same colour, `post` mode), moved from (−25.4, 108.0) to
    (−26.24, 108.25), beside the oche and clear of it, with one extra line; one extra notice-board line ("Darts by the window …").
- `dw2/tools/darts.py` (new): the Step 19 test, with its own Python board model and 301 / round-the-clock rules.
- `dw2/PLAN.md`: Step 19 status, run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No new solids, no coins, no seeded `R()` calls.

## What was built (how to play on the phone)
- A bristle **dartboard in a dark cabinet** hangs on the inn's back wall between the left window and the bar (centre 1.73 m up, the real
  height), with a chalk **oche** line on the floor 2.37 m out. The back wall was used instead of a side wall because the inn's camera
  looks straight at the back wall; a side-wall board would be seen edge-on.
- Stand on the oche and INTERACT **"Darts: throw at the board"**. A touch panel opens with the board face-on (numbers, wires, red/green
  rings). Red turns to face the board; nothing else about him changes.
- **Aim:** tap the board to put the aim there (drag to nudge it). **Throw:** tap THROW. The reticle drifts with a **steadiness wobble**:
  it is shaky right after you aim (~25 mm), settles in about a second (~12 mm), then your arm tires after 3 s and it wanders again (up to
  24 mm). The dart lands where the reticle was, plus a small release scatter (σ 5 mm), and flies in on the panel. It is scored by the
  **real board geometry** (bull 6.35 mm = 50, outer bull 15.9 mm = 25, treble 99–107, double 162–170, 20 at the top, clockwise).
  The darts also show stuck in the board on the wall, red for Red and blue for the regular, until the visit's darts are pulled.
- **ROUND THE CLOCK** (solo): 1, 2 … 20 in order (any bed of the number), then the bull. Fewest darts is your best.
- **301 vs THE REGULAR**: both on 301, three darts a visit, straight in, **double out** (last dart a double or the bull's-eye).
  Below zero, leaving 1, or zero without a double is a **BUST**: the visit doesn't count and the turn passes. Chalk scores top left and
  right. The regular throws three darts with a pause between, like a pub player: T20 while high, sets up a favourite double
  (32/40/16 …), then goes for it; his own scatter is σ 12 mm.
- **Records** (this browser, try/catch): round-the-clock best and games, 301 wins/losses, best checkout, best visit, 180s, fewest darts
  to win. Shown in the panel header.
- **Ending cleanly:** QUIT GAME, CLOSE, stepping off the oche, walking out of the inn, taking a hit, the holding cell or the coliseum end
  the game; it is not counted and the darts are pulled. A downed regular can't play 301 (round the clock still works).
- Free (the house board). The panel's board is its own small canvas; the world board is a cached 128 px sprite (one drawImage).

## Tests run
`python3 -I dw2/tools/darts.py dw2/builds/Dojo_World_v2.22.html --seed 7|11` (`step19_2.22_darts_seed{7,11}.json`): real game, INTERACT
path, the panel's real buttons, real pointer events for the aim tap. Every dart in the game's log is re-scored in Python from where it
landed, and every game is replayed in Python with independent rules.

| Check | seed 7 | seed 11 |
|---|---|---|
| Prompt: none on the street / elsewhere in the inn; "Darts: throw at the board" on the oche; INTERACT opens the panel (ROUND THE CLOCK, 301, CLOSE) | yes | yes |
| Geometry: 115 fixed points (both bulls, every T/D/S bed centre of all 20 numbers, both sides of each wire, each ring edge, misses) + 20,000 random points: game = Python | 20,115 / 0 mismatches | 20,115 / 0 |
| 301 rule table: every remaining score 2–301 × every possible dart (63 values): new score / bust / win = Python | 18,900 cases (1,314 busts, 21 wins), 0 mismatches | same |
| Tap: a real pointerdown on the canvas puts the aim at that board point (±0.6 mm) | yes | yes |
| Wobble: shaky at 0 s > settled at 0.8 s; tired at 6 s > settled | yes | yes |
| Every Red dart within wobble + 5σ of the aim and within 5σ of the reticle | yes | yes |
| 12 round-the-clock games: targets advance only on the right number, bull last; darts count and record best match the replay | 23–29 darts | 23–32 darts |
| 40 games of 301 vs the regular, replayed dart by dart: scores, busts, double-out finishes, ≤3 darts a visit, turn order, winner, W/L record | all match (1,169 darts) | all match (1,135 darts) |
| — the regular aimed at a real bed with every dart; when on a double (or 50) he aimed at exactly that double | 129/129 | 121/121 |
| Flow: start refused mid-game; QUIT and CLOSE end it uncounted (records unchanged); reopen = no game | yes | yes |
| Leave: stepping off the oche, walking out, a hit taken, the coliseum all close the panel and drop the game; coliseum refuses to open (`area`); downed regular refuses 301 (`regular`), round the clock allowed | yes | yes |
| Reload keeps the records | yes | yes |
| Page / module errors | 0 / 0 | 0 / 0 |

The scripted player throws the instant it aims (unsettled wobble), so it loses most 301 games (3–37 and 11–29); waiting for the reticle
to settle, as a person would, is clearly better (in the video Red reaches 20 left before the regular checks out). The wobble runs on
the wall clock, so these tallies differ a little between runs; the checks don't.

Regression (v2.22, seed 7): `gomoku.py` (same room, 20 games) PASS, `courier.py` (the inn is a destination, 24 deliveries) PASS.
(`step19_2.22_regress_*_seed7.json`)

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.21 fills (3 runs) | v2.22 fills (3 runs) | v2.21 ms (median) | v2.22 ms (median) |
|---|---|---|---|---|
| default spawn | 3,469 / 3,468 / 3,469 | 3,469 / 3,468 / 3,470 | 55.5 | 49.6 |
| inn, Red on the oche (−25.35, 108.13), panel closed | 792 / 791 / 792 | 796 / 796 / 796 | 40.9 | 39.5 |
| inn, 301 in progress, panel open, two darts in the board | (792, no darts in v2.21) | 811 / 812 / 812 | 40.9 | 43.6 |
| inn, Red by the bed (board in view), one run | 836 | 840 | 43.0 | 41.5 |

Default view unchanged; inn +0.5% fills while standing on the oche, **+2.5% fills / +6.6% ms while playing** (the panel canvas redraws each
frame: one drawImage of the cached board face plus the darts and reticle). Within the 15% budget.

## Visual evidence
- `step19_v2.22_darts_301.mp4` — 54 s, real time (page load trimmed off the start, no title or report cards): Red walks to the oche with
  the joystick, INTERACT, 301 vs the regular: Red's aim taps on the board, a short wait for the reticle to settle, THROW; the regular's
  visits; the regular checks out on a double with Red on 20; CLOSE, Red walks off. Red's aim points are chosen by a script (the same
  checkout table the regular uses), the throws go through the real THROW button.
- `step19_2.22_inn_before_left_after_right.jpg` — same view, v2.21 / v2.22: the dartboard cabinet on the back wall, the Guest now the Regular.
- `step19_2.22_panel_aim_regular_checkout.jpg` — the panel: two darts in on the first visit with the reticle; mid-game; the regular's checkout.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers
None for the gate. Open questions for Kev (not built): a harder/easier regular setting; whether a darts win should go on the
mayors' request list (cosmetic, no coins).
