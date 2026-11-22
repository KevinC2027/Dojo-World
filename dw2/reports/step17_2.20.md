# Step 17 — Omikuji fortunes at Shrine Hill (v2.20) — PASSED

Build: `dw2/builds/Dojo_World_v2.20.html` (from v2.19, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.20.html` — new build:
  - `DC_CONFIG.hire.items` gains `{ id: 'omikuji', place: 'shrine', price: 10 }` (Kev's PRICES rule). It uses the existing validated
    'hire' debit, so the ledger code and `eco.audit()` (price + place checked against the table) needed no change.
  - New module `dw2 v2.20 — OMIKUJI FORTUNES AT SHRINE HILL` (`window.HIT_OMIKUJI`, `?off=omikuji`), appended after the v2.19 module.
- `dw2/tools/omikuji.py` — new seeded gate test (11 checks).
- `dw2/PLAN.md` — new batch Steps 17–20, Step 17 status, run log.

## What was built (reason: Step 17, phase 2 non-combat activity)
- **Stand**: a small roofed omikuji stand east of the offering box (x 52.9, z 12.8): counter, back board of little drawers, red
  hexagonal box, tray of slips, おみくじ · 10 DC sign. **Rack**: a musubi rack right behind it, in front of the shrine hall
  (x 51.3, z 14.75): posts, beam, three cords, 11 slips other visitors left plus the viewer's own knots (newest 42 shown).
- **Drawing a fortune**: INTERACT "Draw a fortune · 10 DC" -> 'hire' debit; only when the ledger accepts do the coins fly from the
  pouch to the stand and the stick is chosen (Math.random, no seeded R()). Touch panel: SHAKE x3 (or tap the box; it rattles), the
  numbered stick slides out of the hole, TAKE THE SLIP unrolls slip No. 1–32: grade in kanji + English (Great blessing 5 sticks,
  Middle 4, Small 5, Blessing 6, Future 5, Curse 5, Great curse 2), a short verse and lines for wish / travel / fishing / garden /
  weather. Every stick always reads the same.
- **KEEP** -> per-viewer fortune book (32 slips, times kept). **TIE IT ON THE RACK** -> Red carries the slip, drawn at his right
  hand's real position (no pose change), a chip shows the distance, a marker floats over the rack; INTERACT at the rack ties it and
  the knot appears on the cords (saved).
- A paid draw is never lost: CLOSE, a hit taken / Red swinging (tick-exact), walking off, the cell or the coliseum close the panel but
  keep the stick and its stage; INTERACT at the stand resumes without a second charge. Three draws per calendar day (refused before
  any charge). Coliseum: no prompt, `draw()` returns 'area'. Flavour only: no hp/stat/combat effect, no coins earned.
- Collision: like the shrine's existing offering box, the stand and rack add no collision solid (solids count 1,041, unchanged). A
  first version made them solids, but the engine's climb then lifted Red onto the 1.7 m cord rack, so that was dropped.

## Tests run
`python3 -I dw2/tools/omikuji.py dw2/builds/Dojo_World_v2.20.html --seed 7|11` — **PASS on both seeds**, every check:

| check | result (both seeds) |
|---|---|
| walk | from the torii, joystick-only walks reach the stand (0.19 m) and rack (0.21 m) spots; prompts correct; Red never lifted onto them |
| short | pouch < 10 DC: refused 'insufficient', balance and ledger unchanged, no panel, no pending draw |
| draw | one 10 DC 'hire' debit (place shrine) per draw, coins flown, SHAKE x3 -> stick -> TAKE -> slip -> KEEP -> book |
| carry | slip in hand (drawn, 0.17 m from Red), new draw refused 'holding' with no charge, walk to rack, tie -> exactly one new knot |
| resume | hit taken mid-shake closes ('fight'), stick + shakes kept, INTERACT resumes same stick, no second debit; CLOSE at the slip keeps it |
| daily | 4th draw refused 'daily' with no charge; next day draws again (one debit) |
| sky | coliseum: no prompt, 'area', nothing charged |
| table | 3,200 sampled sticks: every grade within ±1.0 point of its 32-stick share (gate ±2.5); slips fixed per stick; bad = Curse / Great curse only |
| reload | book, knots, a half-shaken paid draw all kept |
| audit | `eco.audit()` ok, debits = paid draws, all 10 DC, book view renders, 0 module errors, `draw()` clean in every panel state |
| errors | 0 page errors |

Regressions (seed 7, v2.20): `boat.py` (also a 'hire' debit) — hire/board/drain OK, 3,000 random ticks 0 hull / swimmer / pier
violations; `shop.py` — PASS (15/15 buys, all refusals, 9/9 gifts, wall, reload).

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| view | v2.19 fills | v2.20 fills | v2.19 ms (median of 3) | v2.20 ms (median of 3) |
|---|---|---|---|---|
| default spawn | 3,448 | 3,467 (+0.6%) | 53.2 | 54.1 (+2%) |
| at the stand (52.9, 11.95) | 3,513 | 3,536 (+0.7%) | 60.9 | 58.7 (−4%) |

Single runs saved as `step17_2.20_perf_v2.{19,20}_{default,shrine}.json`; single-run ms in this software renderer swing ±25%, hence the
medians. Ellipses/strokes/drawImage level. 0 module errors, 0 page errors. Gate (within 15%): met.

## Visual evidence
- `step17_2.20_stand_before_left_after_right.jpg`, `step17_2.20_rack_before_left_after_right.jpg`,
  `step17_2.20_forecourt_before_left_after_right.jpg` — same views, v2.19 left, v2.20 right (game camera, 2x crops).
- `step17_2.20_panel_stick_slip_book.jpg` — the stick sliding out, a Curse slip, the fortune book.
- `step17_v2.20_omikuji.mp4` — 24 s real-time recording (not sped up, no cards): walk from the torii, INTERACT, pay, shake x3, stick,
  slip, TIE IT ON THE RACK, walk with the slip, tie. The headless renderer is software-only, so the video's frame rate is lower than
  on a phone.

## Regressions / remaining blockers
- None found. Note: the game camera sits well back here, so the stand and rack are small on screen (as the offering box is).
- Next: Step 18 (the mayors' town requests).
