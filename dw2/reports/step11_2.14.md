# Step 11 — Gomoku board at the inn — build v2.14

Built from `dw2/builds/Dojo_World_v2.13.html` (newest PASSED build, Step 10). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Why
Step 11 of the current batch (phase 2: depth and non-combat activities). The Northfield inn had a bar, beds, a fireplace and a jukebox, but
nothing to *do* with the innkeeper. Kev's list asks for games that fit the town and are "simple to operate, stylistically deep".

## Files changed
- `dw2/builds/Dojo_World_v2.14.html` (new):
  - One new module (`dw2 v2.14 — GOMOKU AT THE INN`, last `<script>`). `?off=gomoku` turns it off.
  - homes193 block: one extra line on the inn notice board ("Gomoku at the bar. Beat the innkeeper, get your name on the wall.").
- `dw2/tools/gomoku.py` (new): the Step 11 test, with its own Python rules so the game can't grade itself.
- `dw2/PLAN.md`: Step 11 status, run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No new solids, no NPC routes changed, no
seeded `R()` calls, no coins.

## What was built (how to play on the phone)
- A thick table goban (13x13) with two stone bowls sits on the inn bar, just right of the innkeeper. Walk up in front of the bar, right of
  the last stool, and INTERACT **"Gomoku: play the innkeeper"**. She stays at her post behind the bar and turns to the board.
- A touch board opens at the bottom of the screen (the room stays visible above it). Red has black and moves first.
  **Tap a point** to show a ghost stone, **tap it again** (or PLACE) to put it down. The two taps stop fat-finger mistakes on a 13x13 grid.
  The last stone has a red ring. The innkeeper answers after about half a second, with a line now and then ("Not so fast.").
- **Five or more in a row wins**, any direction; the winning line is drawn across the stones. A full board with no five is a draw.
- **Her AI** (simple, threat-aware): win if she can > block Red's four > make her own open four > block Red's open three (a point that
  leaves him no open four) > otherwise the best attack + defence window score, picking among near-best moves at random so she can be beaten.
- **Record**: "You 2 · Innkeeper 5 · Draws 1" in the board header, saved per viewer (this browser, try/catch). RESIGN counts as a loss.
  NEW GAME is only offered between games.
- **CLOSE pauses** the game; the stones stay on the goban in the inn, and the prompt reads "Gomoku: resume the game (12 stones)". A reload
  keeps the game and the record.
- Walking out of the inn, the coliseum, the holding cell, or a strike Red lands or takes closes the board (the game is kept). She won't play
  while she is down or in a scuffle.

## Tests run
`python3 -I dw2/tools/gomoku.py dw2/builds/Dojo_World_v2.14.html --seed 7|11 --games 60` (`step11_2.14_gomoku_seed{7,11}.json`), real game,
INTERACT path, real pointer events for the tap check. Every move list is replayed in Python with independent rules.

| Check | seed 7 | seed 11 |
|---|---|---|
| Prompt: none on the street / elsewhere in the inn; "Gomoku: play the innkeeper" at the bar; INTERACT opens the board | yes | yes |
| Tap: first pointerdown = ghost only, second = stone placed, tap on an occupied point ignored | yes | yes |
| 60 full games (40 random Red, 20 "smart" Red): all moves legal (alternating, in bounds, empty point) | 2,839 moves, 0 illegal | 2,862 moves, 0 illegal |
| Game ends exactly at the first five; winner matches Python; record counts match | 60/60 | 60/60 |
| Innkeeper moves checked against the position before them (Python) | 1,424 | 1,412 |
| — she had a win: took it | 46/46 | 45/45 |
| — Red had a four: blocked it | 100/100 | 92/92 |
| — Red had an open three (and she had no open four): played a point that leaves him no open four | 116/116 | 108/108 |
| — two separate open threes (nothing stops both; not graded) | 2 | 3 |
| Hand-built: solid / split / diagonal open three blocked; closed and broken four blocked; her own four beats blocking; an open four can only be half-blocked and Red's five is then detected | 7/7 | 7/7 |
| Draw: full 169-stone board with no five (both sides by hand) = draw, counted as a draw | yes | yes |
| Flow: NEW GAME refused mid-game; RESIGN = loss; CLOSE keeps the game; prompt says resume; reload keeps game + record | yes | yes |
| Leave: walking out closes the board (game kept); coliseum closes it and refuses to open (`area`); downed innkeeper refuses (`keeper`) | yes | yes |
| Page / module errors | 0 / 0 | 0 / 0 |

Results of those games: random Red W/L/D 0/40/0 (both seeds); "smart" Red 2/6/12 and 4/5/11. So she punishes careless play, a careful player
can beat her, and two careful players often fill the board.

Regression (v2.14, seed 7): `courier.py` PASS (the inn is a courier destination), `shop.py` PASS. (`step11_2.14_regress_*_seed7.json`)

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.13 fills (3 runs) | v2.14 fills (3 runs) | v2.13 ms | v2.14 ms |
|---|---|---|---|---|
| default spawn | 3,445 / 3,447 / 3,449 | 3,447 / 3,446 / 3,445 | 50.4 / 51.8 / 49.0 | 46.9 / 41.8 / 43.5 |
| inn, Red at the board (−22.75, 108.6), game in progress on the goban, panel closed | 783 / 782 / 783 | 800 / 803 / 802 | 39.1 / 35.0 / 42.0 | 36.0 / 35.6 / 39.7 |

Inn view: fills **+2.4%**, ellipses 106 → 122 (the stones), frame time level. Default view unchanged. Within the 15% budget.
The touch board is its own small canvas that redraws only when something changes (a tap, a move), not every frame.

## Visual evidence
- `step11_v2.14_gomoku_inn.mp4` — 65 s, real time: Red walks in from the inn door with the joystick, INTERACT at the bar, a full game with
  ghost-then-place taps and the innkeeper's replies (she wins with a diagonal five on move 38, line drawn), CLOSE, walk back out.
  Red's moves in the clip are picked by a script (mostly the same scorer, sometimes a random nearby point). No title or report cards.
- `step11_2.14_inn_before_left_after_right.jpg` — same view, v2.13 / v2.14: the goban and bowls on the bar next to the innkeeper.
- `step11_2.14_board_panel_end.jpg` — the touch board at the end of that game.
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers
None for the gate. Open questions for Kev (not built): whether the innkeeper should have a harder setting, and whether wins should earn
anything (it can't be coins without his OK; a name on the inn wall would be cosmetic).
