# Step 7 — Police response (line of sight only) — build v2.9

Built from `dw2/builds/Dojo_World_v2.8.html` (newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Why
The police station, its desk sergeant, two officers and a "Holding cell" already existed, but only as talking props: nothing in town
reacted when Red attacked a townsperson, and the cell was a 0.5 m strip behind a row of bars. Kev's wishlist asks for a police system.

## Files changed
- `dw2/builds/Dojo_World_v2.9.html` (new):
  - One new module (`dw2 v2.9 — TOWN POLICE`, last `<script>`): patrol officers, sight check, offence tracking, the response, the
    holding cell (bars, door, timer), the desk rules, callout bubbles and a small HUD chip. `?off=police` turns it off.
  - HIT_LIFE actor routes (one-line fix, marked `dw2 v2.9 fix`): the ping-pong direction of 'route' walkers was stored in `n._wd`,
    which the water module also uses for wading depth and resets to 0 on land every tick, so **every 'route' walker (businessman b1,
    the five travelers) froze at the end of its first leg**. Renamed to `n._wdir`. They now walk their routes back and forth again.
- `dw2/tools/police.py` (new): the Step 7 test.
- `dw2/PLAN.md`: Step 7 status, run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No seeded `R()` calls.

## What was built
- **Patrols**: three new officers (the game's own actor system, same stick figures in police blue): one walks the civic square's
  ring road (the loop the businesspeople use), two walk the Northfield south pavement (west and east of the north road, they do not
  cross it). The desk sergeant and the two station officers watch inside the station.
- **What an officer sees**: Red within 16 m, in front of him (or within 2.5 m), in the same room (or both outdoors), and no wall
  between them (the game's `wallBetween`). Officers inside the station only see the station; patrol officers never see into a building.
  Red on a roof, in the society hall or in the coliseum is not seen.
- **What counts**: only Red's *first* strike on a townsperson who was not already fighting him (every strike Red lands is watched,
  including the spinning backfist's extra targets). Hits inside a fight that is already on, dojo/wave foes, Blue, the sparring ring, the
  coliseum and the society never count. Unseen assaults are not counted at all.
- **Response**: first offence in view: the officer shouts ("HEY! Hands off!", a speech bubble over his head and a "!" while he comes),
  the fight is broken up (the townsperson stops fighting back after ¾ s, like the existing 26 m leash), he walks over and gives a
  warning; a chip shows "ON A WARNING · 1:29". A second offence in view within 90 s: "That is twice. You are coming with me", he walks
  over, a short pause, a fade, and Red is in the **holding cell** for 20 s (chip: "HOLDING CELL · 0:18 · THE DOOR UNLOCKS BY ITSELF").
  Then the door swings open by itself and the sergeant sends him off; the warning is cleared. If Red gets out of the officer's sight for
  8 s (or 30 s pass) the response ends ("Slippery. I know your face."). Travelling to the coliseum while jailed releases Red.
- **The cell** was rebuilt as a real one in the back right corner of the station: bars in front and on the side, a barred door that
  swings shut and open, Red kept inside while locked; the "Holding cell" sign moved to the front of the bars.
- **The desk** explains the rules (three lines, then the sergeant's old line; if Red is on a warning it tells him how long is left).
- Long lines use a small wrapped subtitle, not the big HUD banner (which overflows a phone screen); officer lines use the bubble and only
  fall back to the subtitle when the officer is off screen.
- Honest note: the "escort" is a short fade (like the dry-well ladder), not a walk across town; the patrol officer goes back to his beat.

## Measurements
### Police test (`police.py`, real game, real punch input; two seeds, 40 random incidents each)
| Check | Result (seed 7 / seed 11) |
|---|---|
| Assault in view | callout -> walk over -> warning -> patrol; victim stops fighting; 1 offence |
| Second assault in view | callout -> walk over -> cuff -> fade -> cell; door shut; walking at the bars keeps Red inside; released after exactly 1,200 ticks (20 s); warning cleared; door open; Red walks out of the cell and the station with the joystick |
| Same assault behind a wall (wall 81–91 × 9–9.5 at the bank, officer 3.7 m away facing Red) | `wallBetween` true, not seen, no event counted, no response; control on the officer's side of the same wall: seen, response |
| Inside the general store, officer on the pavement 4.1 m away facing the shop | not seen, no response |
| Fight already on (first strike unseen, officer then watching 3 more hits) | no response, 0 offences |
| Dojo/wave foe (Blue) hit in front of an officer | no event, no response |
| Coliseum | nothing counted, state stays patrol |
| Red slips out of sight after a callout | response ends by itself (lost) |
| Leaving for the coliseum while jailed | released cleanly, back to patrol |
| Patrols over 60 s | civic 61 m, Northfield west 83 m, east 83 m |
| Desk / cell | rules explained; cell answers |
| Fuzz, 40 random incidents (random officer, victim, distance 2–18 m, facing toward/away, 1–3 hits, fleeing, travel) | 0 stuck states; every response and every jail ended |
| Page / module errors | none |
Raw: `step7_2.9_police_seed7.json`, `step7_2.9_police_seed11.json`. (In the wall check and its control the officer is held at his spot
while Red lines up the punch; otherwise he walks on along his beat and the control can miss.)

Regressions re-run on v2.9: `shop.py` (seed 7) PASS (10/10 buys, refusals, 9/9 gifts, wall, reload); `fish.py` (seed 7, n 6) same
results as v2.8, no errors; `lift.py` up and down OK; `cross.py` (36k ticks, seed 7): 0 overlaps, 0 jaywalk ticks (v2.8: 0 / 28). Because
the route walkers move again, more people are near the karts in that run: dodges 95 (v2.8: 3), honks 42 (v2.8: 0, honks are only for
people in the road), still 0 overlaps.

### Rendering (`perf.py`, 430x932 @2x, software renderer: compare these runs only with each other; 3 runs each, medians)
| View | v2.8 fills | v2.9 fills | v2.8 ms | v2.9 ms |
|---|---|---|---|---|
| Default spawn | 3,441 | 3,444 (+0.1%) | 56.2 | 58.3 |
| Civic square (v2.9: officer responding, bubble up) | 3,937 | 3,991 (+1.4%) | 72.1 | 68.6 |
| Inside the station at the cell | 1,218 | 1,208 (−0.8%) | 59.8 | 59.7 |
Frame time swings ±20% between identical runs here; within that noise v2.9 is level with v2.8. Gate (within 15%): met.
Raw: `step7_2.9_perf_*.json`.

## Visual evidence
- `step7_2.9_civic_before_left_after_right.jpg`: the civic square, v2.8 vs v2.9 (officer warning Red, "ON A WARNING" chip).
- `step7_2.9_northfield_before_left_after_right.jpg`: Northfield south pavement, v2.8 vs v2.9 (patrol officer).
- `step7_2.9_cell_before_left_after_right.jpg`: the old bars vs the new cell with Red locked in (timer chip).
- `step7_2.9_released_left_desk_right.jpg`: the door unlocked by itself; the desk explaining the rules.
- `step7_v2.9_police_warning_cell.mp4`: 45 s real-time recording (not sped up, no cards): Red punches the businessman in front of the
  patrol officer, who shouts, walks over and warns him; Red swings at the officer, is arrested, sits out 20 s in the cell, the door opens
  by itself and he walks out. The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers
None for the gate. Possible follow-ups: officers do not chase a running Red (they walk); no escort walk (fade instead).
