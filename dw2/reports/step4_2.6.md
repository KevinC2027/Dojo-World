# Step 4 — NPC logic and vehicle awareness — build v2.6

Built from `dw2/builds/Dojo_World_v2.5.html` (newest PASSED build: Step 3 + the bushes revamp). Baseline untouched (sha256 OK).

## What was already there (Kev's v3.261 "street awareness", kept)
Townsfolk already dodged karts in their lane, reacted to honks, glanced along the road while waiting at a zebra and watched
fights they could see. Karts already eased off for people 6–12 m ahead and honked at people blocking them. The new test
(`dw2/tools/cross.py`) showed what was still wrong in v2.5: 314 pedestrian–kart overlaps in 864,000 ticks, people standing in the
carriageway for 847k person-ticks, and 8,066 honks.

## Files changed
- `dw2/builds/Dojo_World_v2.6.html` (new). Edits are only in the roads module (roads193) and the awareness module (v3.261);
  every edit is marked `dw2 v2.6`. No combat rule, move, fighter AI, Red control, camera or character drawing was touched.
- `dw2/tools/cross.py` (new): the Step 4 crossing test.

## Changes (and why)
Crossing the road
1. **Kerb drill on every crossing.** Before, the light/car check only ran if the person happened to be within 1.4 m of the previous
   node, so the walk home after an errand (whose route started mid-block) went straight across the road without checking. Now:
   walk to the kerb corner, wait for the walk light, look one way then the other (~0.4 s each), re-check, then step off. After a
   25 s wait the light is ignored, but never the cars.
2. **Looking for cars, not a radius.** A kart counts as coming if its own route (sampled 1 m at a time, so turning karts count)
   reaches the zebra strip within ~3 s, or it is sitting on the strip. Memoised per zebra per tick.
3. **Errands start from a reachable corner.** The first leg no longer walks across a road to the nearest "gate"; the walk home
   starts at the nearest corner reachable without entering a carriageway.
4. **Mid-crossing hold.** Someone on the zebra waits if a kart body is in their way instead of walking into it.

Drivers
5. **Yield at the zebra.** A kart stops for anyone on a crosswalk 0–8 m ahead that the driver can see.
6. **Line of sight for drivers.** Early easing-off and the fight-ahead stop now need a clear line of sight (`wallBetween`), so a brawl
   inside a building no longer stops traffic. Results are cached for 12 ticks per kart/person (wall tests were 12% of tick time).
7. **Honks only at someone in the carriageway.** Karts still stop for anyone near their path, but people on the pavement are no
   longer honked at. A driver held up by Red honks and Red gets a line ("BEEP! The kart driver waves you off the road.").
8. **Driveways.** Pulling into or out of a garage now waits while someone is in the way (it used to slide through them).

People
9. **Off the road.** Anyone standing in a carriageway for more than ~0.75 s (not on a zebra) walks straight out to the nearest kerb.
   If a pole is in the way, they try the next nearest kerb. Strollers whose home spot is in a road get a new home on the kerb.
10. **Never walk into a kart.** If a kart body is ahead of them: people in front of its nose step out of its path, and people beside
    it wait. A kart may roll on past someone waiting beside it, but never toward someone in front of its nose.
11. **Townsfolk notice Red (line of sight only).** Someone standing about looks at Red for ~2 s when he is 1.5–6 m away and in front
    of them, then won't stare again for ~10 s. Someone Red walks straight into steps aside. The sprint dodge now also needs line of sight.
12. **Map fixes found by the test.** The five travelers walked the road centre line for 40–220 m; their routes now run along the
    shoulder 2.7 m out, on whichever side crosses fewer side roads and obstacles, and they pause at a side road until it is clear.
    The farmer's post had ended up on a garage front at the road edge, so he moved 1 m. Two job spots that sat in the carriageway
    (the site foreman, the stretcher on the west ring) now sit just past the kerb.
13. **Backstop.** An unprovoked townsperson whose body still overlaps a kart's body after the karts move is slid out to its side, the
    same way a wall would push them. This never applies to Red or to anyone in a fight. In the test it acted on 193 person-ticks out of
    864,000, almost all of them the current target `S[1]`, whose movement the engine's fight AI drives.

## Measurements
### Crossing test (`cross.py`): 6 Red positions × 2 seeds × 72,000 ticks = 864,000 ticks per build (~4 h of game time)
Red is parked at (−1.5,14), (4,24), (56,−24), (6,−64), (60,26), (−56,−26); `Math.random` is seeded; the world runs `tick()` with no drawing.
| | v2.5 | v2.6 |
|---|---|---|
| Zebra crossings completed | 389 | **269** |
| Pedestrian–kart body overlaps | 314 | **0** |
| Red–kart overlaps | 0 | 0 |
| Close calls (moving kart nose within 1 m of someone in its lane) | 0 | 0 |
| Person-ticks in a carriageway off a zebra | 846,922 | **3,705** |
| Target (S[1]) ticks in a carriageway | 114,213 | 9,440 |
| Honks | 8,066 | 195 |
| Kerb look sequences / aborted (a kart appeared) | – | 5,447 / 50 |
| Kart yields at zebras / mid-crossing holds | – | 507 / 84 |
| Errors (page, module, HIT_ROADS/AWARE/LIFE) | none | none |

There are fewer crossings because people now wait for the light, a clear road and a look both ways. Raw runs:
`step4_2.6_cross_v2.5.json`, `step4_2.6_cross_v2.6.json`. The simulation is not bit-identical from run to run (a few ticks run before the
test takes over), so totals over 12 runs are what count.

### Rendering (`perf.py`, 430x932 @2x, software renderer, so compare these runs only with each other)
| View | v2.5 fills (median) | v2.6 fills | v2.5 ms (median of runs) | v2.6 ms |
|---|---|---|---|---|
| Default spawn (3 runs each) | 3,442 | 3,443 | 58.9 | 42.8 |
| Junction, Red (4,24) (3 runs) | 3,629 | 3,425 | 65.5 | 68.2 (+4%) |
| Ring east, Red (56,−24) (6 runs) | 6,460 | 6,338 | 77.9 | 73.0 |
Frame time swings ±25% between identical runs here, and fills at street views change with how many people are in view. Within that
noise, v2.6 is level with v2.5. Simulation cost alone (6,000 ticks, no drawing, medians of 3): +0.02 to +0.1 ms per tick, which is
under 1% of a software frame. Raw: `step4_2.6_perf_*.json`.

## Gate (Step 4): scripted test of N crossings with zero NPC–car overlaps; real-time video; no new errors; frame time within 10% of Step 3
- 269 completed crossings over 864,000 ticks with **0** pedestrian–kart overlaps and 0 Red overlaps: **met**.
- Real-time video: `step4_v2.6_street_crossings.mp4`: **met**.
- No page errors, no module errors, `HIT_ROADS.error`, `HIT_AWARE.error` and `HIT_LIFE.error` all null: **met**.
- Frame time within 10%: medians at −27%, +4% and −6%, all inside run-to-run noise; fills unchanged: **met**.
- **PASSED.**

## Other tests
- `tools/lift.py`: the Sky Tree lift works up and down (trips 2, no errors).
- `tools/door.py`: all six facade/door walks end within 0.15 m of where they ended in v2.5 (same rooms).
- Red in a kart's path: the kart stops, honks after ~1.2 s, and Red gets the driver's line (12 honks in 1,500 ticks, no errors).

## Regressions
None found. Changes in behaviour: errands cross less often (people wait longer at the kerb). The foreman, the stretcher and the farmer
stand up to ~1.5 m from their old spots. The travelers walk the shoulder instead of the centre line.

## Visual evidence
- `step4_v2.6_street_crossings.mp4`: 41 s of real-time play. Red stands on the pavement by the (0,−30) junction while townsfolk run
  errands across it and karts stop and pull away. Before recording, the world was fast-forwarded (no drawing) until someone was near
  the kerb. Red is held in place each frame and nothing else is staged. Headless Chrome renders in software, so the frame rate is lower
  than on a phone.
- `step4_2.6_zebra_before_left_after_right.jpg`: the same junction view, v2.5 vs v2.6.
- `step4_2.6_spots_before_left_after_right.jpg`: the foreman by the construction site, the stretcher on the west ring (in the road
  with a kart held behind him in v2.5, at the kerb in v2.6), and the farmer by the garage.
- Most of this step is behaviour, so the video shows it better than the stills.

## Remaining blockers / notes
- None for the gate.
- The current target `S[1]` is moved by the engine's fight AI, which this step does not touch. It can still walk up to a stopped kart;
  the backstop keeps it out of the kart's body.
