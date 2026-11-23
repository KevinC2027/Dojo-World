# Step 26 — Goldfish scooping (kingyo-sukui) at Shrine Hill (v2.29) — PASSED

Build: `dw2/builds/Dojo_World_v2.29.html` (from v2.28, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.29.html` — new module `dw2 v2.29 — GOLDFISH SCOOPING (KINGYO-SUKUI) AT SHRINE HILL` (`window.HIT_KINGYO`,
  `?off=kingyo`), appended after the v2.28 module; one new row in `DC_CONFIG.hire` (`kingyo`, place `shrine`, 10 DC). Nothing else changed
  (no new collision solids: 0 `kgy*` solids, Red is never lifted onto the stall).
- `dw2/tools/kingyo.py` — new seeded gate test (16 checks) with a Python re-judge of every lift and tear.
- `dw2/PLAN.md` — Step 26 status, run log.

## What was built (reason: Step 26, phase 2 non-combat activity)
- **The stall**: a festival yatai on the sando just outside the torii, east of the path (x 54.2, z 6.4): red-and-white striped awning and
  valance, a navy back cloth reading 金魚すくい, a shallow blue tank on legs with goldfish moving under the surface, a stack of poi, a
  "3 POI · 10 DC" card. (A first spot west of the path was hidden from the game camera behind the plaza maple, so it moved east.)
- **Paying**: INTERACT "Goldfish scooping · 10 DC" posts a validated 'hire' debit (price/place from DC_CONFIG, audited); coins fly from
  the pouch to the stall only when the ledger accepts it. Short pouch / coliseum refuse with nothing charged.
- **The panel**: the tank seen from above in real units (120 x 64 cm, 14 goldfish of 5 kinds: wakin, red-and-white, black telescope
  demekin, ryukin fantail, one big wakin; 4.5–9.5 cm). Touch the water = the poi dips in there; drag = it follows your finger; let go =
  lift. Strip on top: poi left (3), paper strength bar, catch count; a bowl in the corner shows this game's catch.
- **Paper physics** (one fixed 1/30 s step, the same in the panel timer and the test):
  wetness rises under water with a 4 s time constant and dries slowly in the air; strength = 24 g x (1 − wet)^0.8; a lift holds if
  weight x (1 + 0.6 panic) + 0.12 x lift speed ≤ strength, else the paper rips and the fish drops back; dragging faster than
  90 x (1 − 0.7 wet) cm/s rips it in the water; at wet 0.96 (~13 s under water) it falls apart by itself. Weight = 0.022 L³ g
  (5 cm ≈ 2.8 g, 9 cm ≈ 16 g).
- **Fish**: a loose shoal (separation, light alignment and cohesion, wander, wall turns). They flee a poi they can SEE coming: within
  16 cm, inside a 230° field of view, moving faster than 14 cm/s; a poi dipped within 4 cm splashes them. A poi eased up from behind or
  moved slowly is not noticed — the real technique.
- **End of game**: the third rip ends it; the result card lists the catch, the two biggest are pre-picked, tap to choose up to 2,
  TAKE HOME. They swim in a glass kingyo-bachi on the low table in House No. 41 (per viewer, up to 6; the oldest goes to the shrine pond
  when a 7th comes; INTERACT at the table names them). The rest are released.
- A paid game is never lost: CLOSE, a hit/strike, walking off or the coliseum close the panel and keep poi left + catch; INTERACT resumes
  with no charge; it survives a reload. While playing, Red holds a poi in his real right hand (no pose change).
- Flavour only: no coins earned, no hp/stat/combat effect, camera and controls unchanged; no seeded R() calls (the tank uses Math.random).

## Tests run
`python3 -I dw2/tools/kingyo.py dw2/builds/Dojo_World_v2.29.html --seed 7|11` — **PASS on both seeds**, every check:

| check | seed 7 | seed 11 |
|---|---|---|
| walk: joystick from the torii to the stall, prompt, 0 solids, Red not lifted crossing it | 0.23 m, ok | ok |
| short: drained pouch → `insufficient`, 0 entries, no panel, no game | ok | ok |
| play: one 10 DC 'hire' debit (place shrine), panel, 3 poi, 14 fish | ok | ok |
| careful: 6 careful scoops by pointer events (wakin, red-and-white, demekin, ryukin, …) + 1 with REAL Playwright mouse | 6/6 + mouse caught | 6/6 + mouse caught |
| sight: fast poi from in front → flees (at 15 cm); same speed from behind / slow from in front → not; dip within 4 cm → splash | ok | ok |
| soak: held still, tears at the predicted step 4 ln((1−wet0)/0.04) s | 356 vs 358 | 350 vs 352 |
| shear: 25 and 35 cm/s on a fresh poi hold; 35 cm/s on a soaked poi (wet .93, limit 31) rips; 100 cm/s rips a fresh one | ok | ok |
| heavy: big wakin 16 g: fresh poi (wet .16, strength 20.9 g) lifts it; wet poi (.57, 12.2 g) rips; the same wet poi lifts a 3.5 g wakin; a soaked poi (.85) rips under a 7.5 cm ryukin | ok | ok |
| over: third rip → result, 7 caught, pick by tapping (3rd refused), TAKE HOME → 2 in the bowl, best = 7 | ok | ok |
| resume: CLOSE, a punch and walking off keep the game; INTERACT resumes with no second debit, same poi + catch | ok | ok |
| bowl: games 3–4 fill it to 6 and let the oldest go; inside House No. 41 the bowl is drawn (not outside), INTERACT names the fish | ok | ok |
| sky: coliseum: no prompt, `area`, nothing charged | ok | ok |
| reload: bowl + a game in progress (2 poi, 1 fish) survive | ok | ok |
| python: every lift (16) and tear (13) re-judged from its logged inputs | 0 mismatches | 0 mismatches |
| audit: eco.audit() ok, debits = games = 5, all 10 DC; 0 module / page errors | ok | ok |

Regressions (seed 7, v2.29): `omikuji.py` PASS (same forecourt, same `_updateNear` / `_doInteract` / `tick` wrapper chain), `taiko.py`
PASS (the previous module, same `draw` wrapper).

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only; 3 interleaved runs each, medians)
| view | v2.28 fills | v2.29 fills | v2.28 ms | v2.29 ms |
|---|---|---|---|---|
| default spawn | 3,467 | 3,494 (+0.8%) | 59.7 | 58.5 (-2.0%) |
| at the stall (Red at 54.2, 5.55) | 3,741 | 3,768 (+0.7%) | 65.2 | 63.6 (-2.5%) |
| at the stall, panel open, poi in the water (v2.29) vs the stall view of v2.28 — 5 interleaved runs each | 3,741 | 3,828 (+2.3%) | 69.1 | 62.0 (−10%) |

The perf counter counts the panel canvas too (tank, fish, poi). Frame times swing several ms run to run in both builds. History of the
playing row: a first 3-run batch measured +4%; a second gave +18.9% (medians 77.5 vs 65.2 ms) with one run carrying a 5,000-fill transient
that also shows up in v2.28 runs (5,076 fills, 77 ms) — not from this module. To be safe the panel's static water (gradient, ripple lines,
rim; the panel redraws 30x a second on its own timer) is now drawn once into a sprite, and the row above is a fresh 5+5-run interleaved
measurement of the final build. 0 module errors,
0 page errors in every run. **Gate: within 15% at all three views — met.**

## Visual evidence
- `step26_2.29_stall_before_left_after_right.jpg` — Red at the stall spot: v2.28 left, v2.29 right (the yatai and its prompt).
- `step26_2.29_forecourt_before_left_after_right.jpg` — the shrine approach from south of the torii, same view.
- `step26_2.29_house41_before_left_after_right.jpg` — inside House No. 41 with three fish taken home: the bowl on the low table (v2.29) and
  the empty table (v2.28).
- `step26_2.29_panel_tank.jpg` — the panel mid-game (poi in the water, five kinds of fish).
- `step26_2.29_walk_scoop_scoop_result_frames.jpg` — frames from the video: walking to the stall, two catches, the result card (7 caught).
- `step26_v2.29_goldfish_scooping.mp4` — 73 s real-time recording (made just before the water-sprite cache above; the only visible
  difference is that the faint ripple lines in the tank no longer drift) (not sped up, no title cards): Red walks by joystick from the torii to
  the stall, opens it, eight scoops with real mouse drags (7 fish caught), a deliberate fast drag that rips a poi, a poi held in the water
  until it falls apart, the result card, TAKE HOME, walks off. The headless renderer is software-only, so the video's frame rate is lower
  than on a phone.

## Regressions
None found. The world is unchanged apart from the stall (no solid) and the bowl drawn in House No. 41 once fish are taken home.

## Remaining blockers / notes for Kev
- None for the gate. Tunables if it feels too easy/hard on the phone: the paper's soak time (4 s constant, ~13 s total under water),
  the speed fish notice (14 cm/s) and the strength (24 g dry). In the real-time video a scripted player caught 7 fish with 3 poi.
- The fish in the panel are drawn at true scale (a 5 cm goldfish is ~17 px wide on an iPhone); they can be drawn larger if you prefer.
