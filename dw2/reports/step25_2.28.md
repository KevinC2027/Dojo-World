# Step 25 — Taiko rhythm game at the dojo drum (v2.28) — PASSED

Build: `dw2/builds/Dojo_World_v2.28.html` (from v2.27, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.28.html` — new module `dw2 v2.28 — TAIKO RHYTHM GAME AT THE DOJO DRUM` (`window.HIT_TAIKO`, `?off=taiko`), appended
  after the v2.27 module. Nothing else in the file changed (no DC_CONFIG entry: it is free; no new props or solids).
- `dw2/tools/taiko.py` — new seeded gate test (12 checks) with an independent Python re-implementation of the judge.
- `dw2/PLAN.md` — new batch Steps 25–28, Step 25 status, run log.

## What was built (reason: Step 25, phase 2 non-combat activity; improves the dojo's existing one-shot taiko prop)
- **The drum**: INTERACT at the dojo taiko (x -8.6, z 17) now says "Taiko drum · play a song (free)" and opens a touch panel: a note lane on
  top, the drum face below, three songs to pick (best score and ★FC / ✓ shown on each).
- **Songs** (hand-written charts, real tempos): Dojo Matsuri (Easy, 96 BPM, 42 notes, 8ths), Sakura Run (Normal, 128 BPM, 103 notes),
  Thunder Gate (Hard, 150 BPM, 202 notes with 16th-note runs). START gives a 2-second count-in (READY… GO!), then notes scroll to the
  judgement circle; beat lines mark the bar.
- **Playing**: red = DON, tap the skin (centre, r ≤ 0.62); blue = KA, tap the wooden rim (r ≤ 1.08). Keyboard F/J and D/K too. A hit uses the
  touch event's own timestamp, so a busy frame does not make a tap late.
- **Judging** (one pure function of the chart and the hit times, re-run on every hit and at the end, so the panel and the saved record are
  the same thing): a hit goes to the earliest open note within 110 ms of it, else the earliest within 160 ms. Right colour ≤ 50 ms GOOD 良,
  ≤ 110 ms OK 可, else BAD 不可; wrong colour = BAD; no note in reach = free hit. Unhit notes become MISS 160 ms after their time.
  Points: GOOD 100 / OK 50 + combo (max +50). Accuracy = (GOOD + OK/2) / notes; clear at 60 / 65 / 70%; no BAD or MISS = FULL COMBO.
  Clear gauge with the clear mark, combo counter, 良/可/不可 flashes, result card.
- **Sound**: synthesised Web Audio drum: a low pitched "don", a dry wooden "ka", and a soft shime-daiko beat during the song (started by the
  START tap so iOS allows it); SOUND ON/OFF is saved. This is the only sound in the game, and it only plays from this panel.
- **Records** per viewer (this browser): best score / accuracy / max combo / FC / clears / plays per song, last 8 plays.
- **In the world**: Red holds two bachi in his real hands (`pose(f).hl/.hr`, angled at the drum, they dip on each hit; his pose doesn't
  change) and the drum's own glow pulses on each hit (the existing `_taiT` effect).
- Free, flavour only: no coins, no hp/stat/combat effect, camera and controls unchanged. A hit taken, a strike, walking 2.4 m away, STOP,
  CLOSE or the coliseum end the song uncounted. No Math.random / R().

## Tests run
`python3 -I dw2/tools/taiko.py dw2/builds/Dojo_World_v2.28.html --seed 7|11` — **PASS on both seeds**, every check:

| check | seed 7 | seed 11 |
|---|---|---|
| walk: joystick from the dojo spawn to the drum, prompt "Taiko drum · play a song (free)" | 0.19 m, ok | 0.19 m, ok |
| open: INTERACT opens the panel, 3 songs, START / SOUND / CLOSE | ok | ok |
| mouse: Dojo Matsuri with REAL mouse clicks scheduled from Python | 42/42 GOOD, FC (mean +18 ms, max 25 ms) | 42/42 GOOD, FC (+12 / 20 ms) |
| ontime: all 3 songs, pointer events on the drum, human jitter sd 12 ms | 42/42, 103/103, 202/202 GOOD, all FC | same |
| grades: groups of 6 notes at 0/±30 / ±80 / ±130 ms / wrong colour | all GOOD / all OK / all BAD / all BAD; accuracy 1 → 1 → .5 → 0 | same |
| none: no input | 42 MISS, 0 pts, not cleared | same |
| mash: random taps every 70 ms (539 taps) | 8.3%, not cleared | 7.1%, not cleared |
| sweep: pure judge, all 3 songs, offsets −300…+300 ms, Python at every offset | monotonic, 0 mismatches | same |
| python: every finished song re-judged from the logged hit times | 7 songs, 970 hits, 0 mismatches | same |
| records: STOP mid-song counts nothing; reload keeps best/plays; equal to what was played | ok | ok |
| closes: hit taken mid-song closes + not counted, walk-off closes, coliseum: no prompt / 'area', closes | ok | ok |
| audit: 0 ledger entries, eco.audit() ok, 0 module / page errors | ok | ok |

Sweep note: on the Hard song (16ths, 100 ms apart) a hit more than 110 ms late lands within OK reach of the *next* note and counts for it
(as in arcade taiko), so accuracy is required to be monotonic for every offset on the Easy song and within the 110 ms OK window on all three.
An earlier "nearest note" rule failed this (a +60 ms hit stole the next 16th), which is why the rule is "earliest open note within OK".

Regressions (seed 7, v2.28): `shodo.py` PASS (same dojo floor, same `_updateNear` / `_doInteract` / `tick` / `draw` wrapper chain),
`photo.py` PASS (the previous module). Collision solids: 1,041 in both builds, the same 1 near the drum.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only; 3 interleaved runs each, medians)
| view | v2.27 fills | v2.28 fills | v2.27 ms | v2.28 ms |
|---|---|---|---|---|
| default spawn | 3,473 | 3,467 (−0.2%) | 68.2 | 64.0 (−6%) |
| at the drum (Red at -8.6, 16.1) | 3,463 | 3,436 (−0.8%) | 66.1 | 61.6 (−7%) |
| at the drum, panel open, Sakura Run playing (v2.28) vs the drum view of v2.27 | 3,463 | 3,478 (+0.4%) | 66.1 | 69.6 (+5.3%) |

The perf counter counts the panel canvas too (lane, notes, drum face). Frame times swing ±8 ms run to run in both builds. 0 module errors,
0 page errors in every run. **Gate: within 15% at all three views — met.**

## Visual evidence
- `step25_2.28_drum_before_left_after_mid_playing_right.jpg` — at the drum: v2.27 (old prompt "Taiko drum"), v2.28 (prompt "play a song"),
  v2.28 mid-song (Sakura Run: notes in the lane, combo 5, clear gauge).
- `step25_2.28_walk_play_fc_play_frames.jpg` — frames from the video: Red walking to the drum, Dojo Matsuri in play (combo 12, 良 flash),
  the song list after a full combo (★FC), Sakura Run with the rim lit by a KA hit.
- `step25_v2.28_taiko.mp4` — 84 s real-time recording (not sped up, no title cards): Red walks by joystick from his spawn to the drum, opens
  it, plays the whole of Dojo Matsuri with real mouse clicks (full combo), then the first 14 s of Sakura Run, STOP, CLOSE.
  The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions
None found. The world is unchanged apart from the taiko prompt; the old one-shot "DON! DON! DON!" is replaced by the panel (tapping the drum
face outside a song still sounds and pulses the drum).

## Remaining blockers / notes for Kev
- None for the gate. Things you may want to change: this adds the game's first sound (only inside the taiko panel, SOUND OFF saved); on an
  iPhone in silent mode Web Audio may stay quiet. The panel covers the lower ~60% of the screen while playing, so Red and the drum are
  mostly hidden behind it; a slimmer layout is possible if you prefer to watch him drum.
