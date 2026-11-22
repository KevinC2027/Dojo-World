# Step 5 — Fishing (non-combat activity) — build v2.7

Built from `dw2/builds/Dojo_World_v2.6.html` (newest PASSED build). Baseline untouched (sha256 `fdb63e43…` matches `BASELINE.sha256`).

## Why fishing
Steps 1–4 were all PASSED, so this run wrote the next batch (Steps 5–8 in `PLAN.md`) from Kev's lists, checking the code first.
Most of the world wishlist already exists in some form (bank/ATMs/guards, hospital, mayor, rooftops + fall damage, Society, travelers,
swimming). Fishing existed only as a coin-flip line of text on the fisher hut's rod rack ("You cast from the dock: a carp… +15 hp"),
although the world is full of fishing hints (the fisher, the tide chart, the "Fishing the Mirror Lake" book). It is a non-combat activity
that fits the town and can be "simple to operate, stylistically deep".

## Files changed
- `dw2/builds/Dojo_World_v2.7.html` (new). One new module (`dw2 v2.7 — FISHING`, last `<script>` before `</body>`) plus one line in the
  homes module: the fisher hut's rod rack now opens the fishing log instead of the coin-flip.
- `dw2/tools/fish.py` (new): the Step 5 test.
- `dw2/PLAN.md`: Steps 5–8 written; Step 5 status; run log.
No combat rule, move, fighter AI, Red control, camera mode or character drawing was touched. No seeded `R()` calls. `?off=fish` turns it off.

## What was built
How to play (phone): walk to a **rod rest** (a Y-stick, a resting rod and a bucket) and press INTERACT (MENU > INTERACT on a phone,
E on a keyboard), the same as every other interactable. While the rod is out, a big round button appears in the corner of the game
view (INTERACT itself also works):
1. **CAST**: hold to swing the rod back (a power meter swings), release to cast. The float flies in an arc and lands with a splash and
   ripples (the water module's own ripples/drops). The cast stops short of land, so it always lands in water.
2. **WAIT**: the float bobs. Small dips are nibbles (strike now and you just reel in: "Too early"). The bite is a hard plunge, a splash
   and a flashing "!".
3. **STRIKE!**: tap within the species' bite window (0.43–0.77 s) or "it stole the bait".
4. **REEL**: hold to reel. The fish alternates runs and rests. During a run the float jerks sideways and splashes, the line pays out if you
   let go, and tension climbs fast if you hold, so you ease off; a full tension bar snaps the line. Leave it slack ~2.7 s and the hook
   slips out. Fish tire as you play them. A running fish stays inside the water body.
5. **Landed**: the fish dangles from the rod tip, a catch card shows species, length (cm), weight (kg), NEW SPECIES / PERSONAL BEST and
   the log count, then it is released with a splash. Tap AGAIN to cast.
Moving the joystick, attacking, or being hit packs the rod away.

Spots and what bites (13 species + the occasional old boot):
| Rod rest | Cast | Fish |
|---|---|---|
| Mirror Lake pier end (27.2, 51) | 2.5–10.5 m east | shelf: mirror carp, black bass; far/deep: lake trout; rare golden koi |
| Eastwater pools (100, −86.6) | 1.8–5.5 m south | marsh perch, mud loach, snakehead (deeper water) |
| River north bank (−20, −36.6) | 1.8–4.6 m south | deep west water: channel catfish, rainbow trout, dace, rare eel |
| Farm pond (−34.4, −80) | 1.6–5.6 m east | crucian carp, bluegill, rare koi |
Length is skewed toward smaller fish, larger when cast far/deep; weight = species coefficient × length³; bigger fish fight harder.
The **fishing log** (rod rack in the fisher hut) lists each species caught, count and best length. It is stored in the viewer's browser
(localStorage, wrapped in try/catch), so it is a convenience, not save data. No Dojo Credits, no hp, no stats: fishing never changes
fighting ability.

The rod is drawn from Red's right hand as read from `pose()` (the pose itself is not changed): it tips back while charging, whips on the
cast and bows under tension; the line sags when slack and tightens (and pales) near breaking; a dark fish shape shows under the float
while reeling.

### Pre-existing bug fixed on the way: the Mirror Lake pier
Since v3.193 the lake surface was drawn after the ground, so it painted over the pier deck and its railings (only the river bridges got
the v3.203 "deck on top" redraw), and the ground height under the pier was the lakebed, so Red stood at y = −1.53 m, sunk into the
water at the end of the pier. The deck, planks and railings are now redrawn after the water like the bridges, and Red stands on the
deck (ground height 0 on the pier's footprint). Measured: Red's y at the pier end −1.53 (v2.6) → 0.00 (v2.7). See
`step5_2.7_pier_before_left_after_mid_fishing_right.jpg`.

## Measurements
### Fishing test (`fish.py`, game ticks with no drawing, `Math.random` seeded, input through the button's own down/up functions)
Two seeds (7, 11) × 4 spots × 60 sessions = 480 sessions.
| | seed 7 | seed 11 |
|---|---|---|
| Casts landing in water | 240/240 | 240/240 |
| Good play (strike after ~0.2 s, reel only while the fish rests and tension < .6) | 100/100 caught | 100/100 caught |
| Early strike (during the wait) | 32/32 reeled in, 0 hooked | 32/32 reeled in, 0 hooked |
| Never strike | 24/24 "stole the bait" | 24/24 |
| Hold the reel the whole time | 43 snapped, 5 landed (weak fish) | 37 snapped, 11 landed |
| Never reel | 24/24 hook slipped | 24/24 |
| Joystick mid-wait | 12/12 rod packed, Red walked | 12/12 |
| Species seen per water body | lake: carp, bass, lake trout, koi, boot · pools: perch, loach, snakehead · river: trout, dace, catfish, eel · pond: crucian, bluegill, koi | same sets (no koi at the lake in this seed) |
| Page / module errors | none | none |
Raw: `step5_2.7_fish_seed7.json`, `step5_2.7_fish_seed11.json`.

### Rendering (`perf.py`, 430x932 @2x, software renderer: compare these runs only with each other; 3 runs each)
| View | v2.6 fills (median) | v2.7 fills | v2.6 ms (median) | v2.7 ms |
|---|---|---|---|---|
| Default spawn | 3,440 | 3,441 (+0.03%) | 54.6 | 51.3 |
| Mirror Lake pier end (v2.6 idle / v2.7 reeling a fish) | 2,390 | 2,404 (+0.6%) | 47.3 | 46.8 |
Frame time swings ±10–20% between identical runs here; within that noise v2.7 is level with v2.6. Raw: `step5_2.7_perf_*.json`.

## Other tests
- Sky Tree lift (`lift.py`): walk-in starts the lift, up to the sky, wind gate back down — OK, no errors.
- Doors/collision (`door.py`): same rooms entered / facades blocked as v2.6 (end positions within the usual run-to-run noise).
- Real button path: the video run presses MENU (hold), INTERACT, then the fishing button with real pointer events.
- Module syntax check, zero page errors in every run above.

## Release gate
- 100% of casts land in water at all four spots: **met** (480/480).
- Good timing catches, early never hooks, late loses the bait, holding through runs snaps, never reeling slips, joystick packs up: **met**.
- Species differ by water body: **met**.
- Zero page/module errors: **met**.
- Fills/frame and frame time within 15% of v2.6 (default and pier while reeling): **met** (+0.03% / +0.6% fills, ms level).
- Real-time video of cast → bite → reel → catch: **met** (`step5_v2.7_fishing_pier.mp4`).
**Step 5: PASSED.**

## Visual evidence
- `step5_v2.7_fishing_pier.mp4` — ~60 s, real time, not sped up, no title cards. Red walks to the pier rest with the stick, MENU >
  INTERACT, casts, waits, strikes, reels (easing off on runs) and lands a fish (catch card); then casts again and holds the reel through a
  run, and the line snaps. Recorded with the game's own CHASE camera (CAM option) so the float is visible; the default SKY camera
  works the same but the float is small. Headless Chrome renders in software, so the video's frame rate is far lower than on a phone.
- `step5_2.7_pier_before_left_after_mid_fishing_right.jpg` — CHASE camera at the pier end: v2.6 (deck painted over, Red sunk) / v2.7
  idle (deck, railings, rod rest) / v2.7 reeling.
- `step5_2.7_spots_before_top_after_bottom.jpg` — default SKY camera at the four spots: v2.6 idle (top), v2.7 reeling (bottom).

## Regressions
None found. The fisher hut rod rack no longer gives a coin-flip +15 hp (it opens the log); the cooler and the farm stand eggs still heal.

## Remaining blockers / notes for Kev
- On a phone INTERACT lives in the MENU fold-out, so starting needs MENU (hold) > INTERACT; once fishing, the big round button does
  everything. If Kev wants a one-tap start, the rod rests could start on walking up (like the stairs), but that changes the shared
  INTERACT convention, so it is left as is.
- Catch-and-release only for now; selling fish or cooking them would touch the DC rules (Step 6 decides coins in shops).
