# Step 23 — Shodo calligraphy at the dojo (v2.26) — PASSED

Build: `dw2/builds/Dojo_World_v2.26.html` (from v2.25, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.26.html` — new module `dw2 v2.26 — SHODO CALLIGRAPHY AT THE DOJO` (`window.HIT_SHODO`, `?off=shodo`), appended after
  the v2.25 module. Nothing else in the file changed (no DC_CONFIG entry: it is free).
- `dw2/tools/shodo.py` — new seeded gate test (12 checks) with an independent Python re-implementation of the grader.
- `dw2/PLAN.md` — Step 23 status, run log.

## What was built (reason: Step 23, phase 2 non-combat activity)
- **The desk**: a low lacquered bundai at the back of the dojo floor (x -3.4, z 18.4, behind the training square), with felt, a sheet of
  hanshi, a bunchin, an ink stone, a brush on its rest and a zabuton on Red's side; behind it a wooden drying rack with three hanging sheets
  (the teacher's 永 道 心 at first, then Red's own three best kanji). First tried on the west wall (x -8.7), but the big DOJO banner at the
  eave hid it from the game camera, so it moved to the back. No collision solids were added (the Step 17 lesson).
- **Writing**: INTERACT "Shodo desk · write kanji (free)" opens a touch panel: ten kanji buttons (一 二 三 山 川 木 人 力 心 道), the paper with
  the teacher's model in pale grey and the next stroke in pale red with a start dot, a direction arrow and its number (GUIDE turns it off).
  Write with a finger. The line is ink: its width comes from the real pointer speed (slow = full, fast = thin, smoothed, 0.016–0.06 of the
  paper), the brush swells where it lands and tapers as it lifts. A dab that doesn't travel is not counted as a stroke.
- **Grading** (pure functions, exposed for the test): each stroke is checked when the finger lifts against the model stroke of that number,
  both resampled to 24 points by arc length. In order: *scribble* (it matches no stroke, or is much longer than the model), *order* (it is not
  the next stroke but cleanly matches another one: "that was stroke 8, not 7"), *reversed* (the right stroke, run end to start), *off* (mean
  distance over 0.15 of the paper). Otherwise its score is 100 x (1 − mean distance / 0.20). Any flag spoils the sheet (ink can't be taken
  back: NEW SHEET). A finished sheet scores the mean of its strokes: 秀 Excellent 85+, 優 Very good 70+, 良 Good 55+, 可 Pass 40+, else 再 Try
  again. The teacher marks it in red ink: a circle on each fine stroke, a cross on the flagged one, the grade seal.
- **The scroll**: a sheet of 70+ offers HANG SCROLL: it goes up as a kakejiku (brocade mount, rods, cord, his own brush strokes, the grade
  seal) on the back wall of **House No. 41** on the residential street, which this step treats as Red's home (it is the house by the dojo;
  no house was marked as his before). One scroll at a time, saved per viewer with the best score per kanji and the last 8 sheets.
  The scroll is drawn from a cached sprite whose size bucket follows its size on screen (one drawImage).
- While the panel is open a brush is drawn from Red's real hand (`pose(f).hr`); he keeps his pose. A hit taken, a strike, walking off, or the
  coliseum close the panel. Free, flavour only: no coins, no hp/stat/combat effect, no change to camera or controls. No Math.random / R().

## Tests run
`python3 -I dw2/tools/shodo.py dw2/builds/Dojo_World_v2.26.html --seed 7|11` — **PASS on both seeds**, every check:

| check | seed 7 | seed 11 |
|---|---|---|
| walk: joystick from the dojo spawn to the desk, prompt, 0 solids at the desk, 2 props | 0.19 m, ok | 0.20 m, ok |
| open: INTERACT opens the panel, 10 kanji, GUIDE / NEW SHEET / CLOSE | ok | ok |
| correct: all 10 kanji traced by real mouse drags (seeded hand wobble ±0.015 of the paper), right order and direction | 10/10 Excellent (93.2–94.5) | 10/10 Excellent (93.1–94.9) |
| order: 木 vertical first, 三 bottom first, 道 stroke 8 before 7 | 3/3 'order', Try again, no HANG | same |
| reversed: 一 right to left, 川 stroke 3 upward, 力 stroke 2 upward | 3/3 'reversed', Try again | same |
| scribble: a zigzag on 山 = 'scribble'; a dab = not a stroke | ok | ok |
| monotonic (real traces): 人 shifted 0/.02/…/.10 | 100, 88.8, 77.6, 66.5, 55.3, 44.1 (Excellent → Pass) | same |
| monotonic (real traces): 木 scaled 1.0–1.4 | 100, 87.7, 75.4, then 1.3 = 'order', 1.4 = 'off' (0, Try again) | same |
| monotonic (pure sweep, 10 kanji x 21 error levels) + Python | monotonic, Python max diff 4e-14 | same |
| brush: slow vs fast stroke mean width | 0.0431 vs 0.0249 (limits 0.0161–0.05) | 0.0430 vs 0.0249 |
| python: every graded sheet re-graded in Python from the recorded ink | 30 sheets, 0 mismatches, max diff 3e-14 | same |
| hang: real HANG click (道, 12 strokes); reload keeps scroll + 10 best scores; joystick walk into House No. 41, scroll drawn on its wall (4/4 frames) | ok | ok |
| closes: hit taken closes, walking off closes, coliseum no prompt + 'area', coliseum closes an open panel | ok | ok |
| audit: 0 ledger entries added, eco.audit() ok, 0 module / page errors | ok | ok |

Regressions (seed 7, v2.26): `cook.py` PASS (stoves in houses, drawInterior chain), `minigolf.py` PASS (the previous module / wrappers),
`courier.py` PASS (doors, houses, INTERACT chain). `police.py`: all checks pass whenever the second-offence arrest goes through, but that arrest
sometimes aborts back to patrol in **both** builds (nondeterministic, timing-dependent): 'view' passed 1 of 3 runs on v2.25 and 3 of 6 on v2.26;
'away' (same arrest) 3/3 and 4/6. The final v2.26 run saved here failed 'view' only. Not caused by this step (nothing near the civic square, no
randomness, no police hooks); worth a look in a later pass.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only; 3 interleaved runs each, medians)
| view | v2.25 fills | v2.26 fills | v2.25 ms | v2.26 ms |
|---|---|---|---|---|
| default spawn (desk + rack in view at the back of the dojo) | 3,476 | 3,466 (−0.3%) | 54.7 | 58.6 (+7%) |
| at the desk (Red at -2.55, 18.4) | 3,357 | 3,350 (−0.2%) | 64.3 | 54.9 (−15%) |
| desk, panel open, brush in hand (v2.26) | — | 3,350 (−0.2% vs desk v2.25) | — | 48.3 |
| inside House No. 41 (v2.26: scroll hung) | 1,223 | 1,195 (−2%) | 33.1 | 27.4 (−17%) |

Frame times swing ±10 ms run to run in both builds at these views (e.g. default 48.8–65.1 ms); every median is inside 15%. The new props are
~14 polys + ~12 lines + up to 4 glyphs when near; the scroll is +1 drawImage. 0 module errors, 0 page errors in every run.
An earlier version drew the scroll from a fixed 2x sprite: house +14.5% ms; switching to a size-bucketed sprite brought it level.
**Gate: within 15% at the default view, at the desk and in the house — met.**

## Visual evidence
- `step23_2.26_desk_before_left_after_right.jpg` — the back of the dojo (pinch zoom 3.2x), v2.25 vs v2.26: the drying rack with 永 道 心 and the
  low desk with its zabuton (the desk is 30 cm high, so it is small from the game camera; the rack is what reads at a distance).
- `step23_2.26_house41_before_left_after_right.jpg` — inside House No. 41, v2.25 bare wall vs v2.26 with Red's 木 scroll hung beside the TV.
- `step23_2.26_panel_pass_ki_fail_order_michi.jpg` — the panel: 木 graded 秀 Excellent 95 with the teacher's circles and HANG SCROLL; 道 spoiled
  at stroke 7 (stroke 8 written first): red cross, 再 TRY AGAIN, "Stroke order: that was stroke 8, not 7".
- `step23_v2.26_shodo.mp4` — 90 s real-time recording (not sped up, no title cards): Red walks by joystick to the desk, opens it, writes 木
  (Excellent), 心, then 三 with the bottom line first (spoiled: stroke order), then 人 (Excellent), hangs it, closes, walks by joystick out of
  the dojo, along the residential street and into House No. 41, where the 人 scroll hangs on the wall. The mouse moves at a finger's pace.
  The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions
None found. The default view is unchanged apart from the desk and rack at the back of the dojo (fills −0.3%).

## Remaining blockers / notes for Kev
- None for the gate. Decisions you may want to change: House No. 41 is now "Red's house" for the scroll (nothing in the game marked one
  before); the model strokes are hand-authored approximations of textbook kanji (correct order and direction, simplified shapes: hooks and
  sweeps are not graded separately).
