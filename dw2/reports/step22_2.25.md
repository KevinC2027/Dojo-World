# Step 22 — Mini golf in the civic park (v2.25) — PASSED

Build: `dw2/builds/Dojo_World_v2.25.html` (from v2.24, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.25.html` — new build:
  - `DC_CONFIG.hire.items` gains `{ id: 'minigolf', place: 'minigolf', name: 'Mini golf round', price: 10 }` (Kev's PRICES rule). It uses the
    existing validated 'hire' debit, so the ledger code and `eco.audit()` needed no change.
  - New module `dw2 v2.25 — MINI GOLF IN THE CIVIC PARK` (`window.HIT_MINIGOLF`, `?off=minigolf`), appended after the v2.24 module.
- `dw2/tools/minigolf.py` — new seeded gate test (12 checks) with an independent Python re-implementation of the ball physics.
- `dw2/PLAN.md` — Step 22 status, run log.

## What was built (reason: Step 22, phase 2 non-combat activity)
- **The course**: six holes on the open lawn south of the civic square (x 76–114, z -26 to -9, between the square and the south ring road), in a
  Japanese garden: a raked-gravel bed with kerb stones, felt greens on wooden skirts with low wooden rails, flags with hole numbers, tee mats.
  1 Ishidoro 石灯籠 (par 2, putt round a stone lantern) · 2 Kakeyama 掛山 (par 2, a cross-slope: 5% falling left, 3% uphill) · 3 Magari 曲がり
  (par 3, dogleg right, bank it) · 4 Taikobashi 太鼓橋 (par 3, a red drum bridge with 10% ramps over a garden stream; the water beside it costs a
  stroke) · 5 Sekimon 石門 (par 2, a 0.5 m stone gate) · 6 Torii no wa 鳥居の輪 (par 2, under a torii, a bowl round the cup). Par 14.
  No new collision solids (as in Step 17, a solid lets the engine climb Red onto it); Red walks on the greens.
- **Paying**: the starter's board at the west entrance (x 81.4, z -9.9; a roofed sign, a putter box, a coin box). INTERACT
  "Mini golf · 10 DC (6 holes)" posts the 'hire' debit; only when the ledger accepts it do the coins fly to the coin box and the ball is set on
  the first tee. Refused with nothing charged when the pouch is short, in the coliseum, or while a round is already paid (then the board opens
  the scorecard instead).
- **Putting**: Red walks to his ball with the joystick (nothing ever moves him). Within 1.1 m, INTERACT "Putt · hole 2, stroke 1 (par 2)" opens a
  top-down touch panel of the hole: drag back from anywhere, the dashed aim line points the other way and a power bar fills (full power at a
  300-canvas-px pull = 4.2 m/s); let go to putt. The ball rolls on game time; the panel shows it, then closes so Red can walk on. Red keeps his
  pose: the putter is drawn from his real hand (`pose(f).hr`) to the ball, its head drawn back along the aim while dragging.
- **The ball** (fixed 1/60 s ticks, 8 sub-steps, pure functions exposed for the tests): a 42.7 mm ball on felt, rolling friction mu 0.065
  (a 3 m/s putt rolls 7.05 m); slopes push it by g x grade (cross-slope 0.57 m/s², the bridge ramps 0.98 m/s², the bowl up to 0.39 m/s² toward
  the cup); it rests only when the slope's pull is below static friction (mu_s 0.09), so it rolls back off the bridge ramps but rests on the
  cross-slope; rails reflect it with normal restitution 0.70 and 10% tangential loss; the 108 mm cup takes it only below the lip-out speed
  1.3 m/s x sqrt(1 − (b/R)²) (b = how far off-centre its line passes), faster balls are kicked off line, slowed by 40% and run on; water: +1
  stroke, the ball goes back where it was played. Six strokes at most per hole (then it is picked up and scored 7).
- **Scorecard**: hole names in Japanese, par, strokes (birdies ringed), running total vs par, best round, rounds played, last five rounds,
  best per hole (per viewer, try/catch storage). A green chip over the HUD (hole, par, stroke, vs par, distance to the ball) and a small marker
  over the ball while on the course.
- **The paid round is kept**: CLOSE, a hit taken or a strike, walking away from the ball, or the coliseum close the panel; the round, the
  hole, the strokes and where the ball lies survive a reload. QUIT ROUND on the card (two taps) abandons it (no refund).
- **Seeing the course**: the game camera sits 30 m behind Red, south across the river, so the seven riverbank sakura (z -28 to -35) stand
  between it and every green. While Red is inside the course (and only then) those seven crowns are drawn at 30% opacity. No other tree,
  wall, camera, AI or collision change. Kev's pinch zoom (cam.zm) brings the course close (the close-up screenshots and the video use 2.2x).
- No Math.random / seeded R() calls. No coins earned, no hp/stat/combat effect, no change to Red's pose, animation, camera or controls.

## Tests run
`python3 -I dw2/tools/minigolf.py dw2/builds/Dojo_World_v2.25.html --seed 7|11` — **PASS on both seeds**, every check (identical numbers:
the course has no randomness):

| check | result (both seeds) |
|---|---|
| walk | Red walks from the plaza to the starter's board by joystick (0.20 m); prompt "Mini golf · 10 DC (6 holes)"; 0 new solids, 15 course props |
| short | pouch 0 DC: INTERACT refused 'insufficient', balance and ledger unchanged, no round |
| start | INTERACT: exactly one 10 DC 'hire' debit, place 'minigolf'; round on hole 1, ball on the tee (79, -24.3); INTERACT at the board again opens the scorecard, charges nothing |
| round | all 6 holes holed through the real panel (joystick walk to the ball, INTERACT, a Playwright mouse drag on the canvas; drags chosen by searching integer-pixel drags with the game's own sim): 8 putts, scores 1-1-2-3-1-1 = 9 (hole 4 started with a deliberate putt into the stream: strokes 2 after it, ball back on its lie (104.7, -24.3)); card total, best round 9, last rounds [9] |
| python | all 8 putts re-computed in Python from their recorded start + velocity: rest points identical (max error 0.0 m), 0 outcome mismatches, 7 rail hits at the same points, every one obeying v_out = 0.9 v_t − 0.7 v_n exactly |
| stopdist | flat putts on hole 3's first leg, game = Python exactly, and v²/(2 mu g) within 3.1 mm: 0.5 m/s 0.196 m · 1.0 0.783 · 1.5 1.763 · 2.0 3.134 · 2.5 4.898 · 3.0 7.054 m |
| angles | bank shots at 3.2 m/s into hole 3's east rail, 15/30/45/60/75° from the normal: out 19.0/36.6/52.1/65.8/78.2° = atan(0.9 tan(in)/0.7) to 0.01°, Python identical, 72–89% of the speed kept |
| lip | straight at the cup: arriving 1.92 m/s lips out (kicked, run on), 0.70 m/s drops; 4 cm off centre the capture speed is 0.873 m/s: 0.83 drops, 0.97 lips out; Python agrees on all four |
| slopes | at rest on the cross-slope (|a| 0.57 < mu_s g 0.88): stays put; at rest on the bridge ramp: rolls back off it (z -20.07), no water; 1.9 m/s up the bridge rolls back, 2.6 m/s crosses (z -16.2); bowl speed scan 1.20–1.90 m/s from 2.3 m out: on a flat green only 1.70+ m/s drops, with the bowl 1.52+ does (1.52–1.68 m/s would stop short and are fed in); Python agrees on all 36 |
| pickup | a second round (one more 10 DC debit): six soft putts on hole 1 -> scored 7, ball moves to the hole 2 tee |
| keep | a reload keeps hole, strokes, scores and the ball's lie exactly; a hit taken closes the panel, round kept, INTERACT reopens; walking away closes it; coliseum: no prompt, start() 'area', nothing charged; QUIT ROUND: first tap arms, second ends it, no refund; the board offers a new round |
| audit / errors | `eco.audit()` ok, 2 debits (2 rounds paid) all 10 DC 'minigolf'; best round 9 kept after the reload; 0 HIT_* module errors, 0 page errors |

Regressions (seed 7, v2.25): `omikuji.py` PASS, `scope.py` PASS, `boat.py` (board 10/10, hire ok, 3,000 random ticks 0 violations, drain ok, 0 errors)
— all share the 'hire' debit and its rate limits; `shop.py` PASS (16/16 buys, all refusals, 9/9 gifts); `bugs.py` PASS (the course sits on
grass-habitat ground and wraps draw/tick after the bug module).

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only; 3 runs each, medians)
| view | v2.24 fills | v2.25 fills | v2.24 ms | v2.25 ms |
|---|---|---|---|---|
| default spawn | 3,477 | 3,476 (−0.0%) | 58.5 | 56.7 (−3%) |
| on the course (Red at 84, -17) | 5,818 | 4,808 (−17%) | 96.3 | 92.6 (−4%) |
| tee 1 (v2.25: round paid, Red at the ball, putter + chip drawn) | 7,624 | 4,858 (−36%) | 91.2 | 77.6 (−15%) |

Course-view fills swing 4.4k–6.0k between runs in both builds (townsfolk walking through the view); every v2.25 run is below the v2.24 median.
The faded riverbank crowns are the likely reason the course views got cheaper (fewer leaf layers fully drawn over the scene); the course itself
is ~40 polygons and ~90 lines when in view and nothing when the camera is more than 75 m away. 0 module errors, 0 page errors in every run.
**Gate: within 15% at the default view and on the course — met.**

## Visual evidence
- `step22_2.25_west_before_left_after_right.jpg`, `step22_2.25_east_before_left_after_right.jpg` — the same spots (Red at 83.5,-16 and 108.5,-16,
  pinch zoom 2.3x): v2.24 lawn behind the riverbank cherry vs v2.25 course (starter's board, holes 1–3; the stone gate and torii of holes 5–6).
- `step22_2.25_tee1_default_zoom_before_left_after_right.jpg` — tee 1 at the default zoom (the perf shot), v2.24 vs v2.25 with a round paid.
- `step22_2.25_panel_bridge_hole_scorecard.jpg` — the putt panel on hole 4 (drum bridge over the stream) and the scorecard mid-round.
- `step22_v2.25_minigolf.mp4` — 66 s real-time recording (not sped up, no title cards): Red walks to the starter's board, pays, walks to the tee,
  putts hole 1 (in), hole 2 (in), hole 3 (bank off the far rail, then in), with thumb-speed drags on the panel. Pinch zoom 2.2x. The headless
  renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions
None found. The default view is unchanged (same fills). The seven riverbank cherries are drawn at 30% only while Red stands on the course.

## Remaining blockers / notes for Kev
- None for the gate. Design notes: the course is on the lawn the plan named; from the default camera distance it is small on screen, so the
  putt panel is the main view and pinch zoom helps when walking between holes. Holes 5 and 6 can be aced straight from the tee with exact speed;
  if they feel too easy, the gate or the cup can be offset in a later pass.
