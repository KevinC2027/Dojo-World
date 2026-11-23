# Dojo World v2 — optimisation & realism plan (Kev, approved Nov 20, 2026)

Branch: `dojo-world-v2-perf`. Do NOT touch `main` or `add-hit-1v1` (the live GitHub Pages build).

## Ground rules (Kev's standing rules — every run follows them)
- `dw2/Dojo_World_v2_BASELINE.html` is the immutable reference (since Nov 21 this is Kev's Dojo_World_v2_2 upload; the earlier v2.0 is in `dw2/archive/`). Never edit it; its sha256 is in `dw2/BASELINE.sha256`.
- Each step writes a NEW build file `dw2/builds/Dojo_World_v2.<n>.html`, starting from the newest build whose step is marked PASSED below.
- Same game: keep the thin stick-figure characters, the animation style, controls, camera, combat logic, move rules and responsiveness. No character geometry/animation changes.
- Single self-contained HTML file, plays on iPhone Safari.
- No AI (Red, foes, NPCs) may detect anything through walls.
- A step is PASSED only when its release gate is met. Never build on a failing step — finish it instead.
- Every step's report (`dw2/reports/step<n>.md`) lists: files changed, reason, before/after measurements (from `dw2/tools/perf.py`), tests run, regressions, visual evidence, remaining blockers.
- Visual evidence: before/after screenshots at the same views, plus recorded gameplay video in real time (not sped up, no title/report cards). Note in the report that the headless renderer is software-only, so the video's frame rate is lower than on a phone.
- Deliver the playable single-file HTML as an attached file in the session every run (Kev's standing preference), not only a link.

## NEW BASELINE (Nov 21, 2026): Kev uploaded Dojo_World_v2_2 = `dw2/builds/Dojo_World_v2.2.html` (internal module version v3.261)
- Default spawn view: ~3,250 fills + 300 ellipses + ~440 drawImage per frame (trees are now cached sprites); 0 page/module errors; frame time ~10x faster than v2.0 in perf.py. Report: `dw2/reports/v2.2_baseline_perf.json`.
- Remaining top fill sites: SC.poly (~1,100/frame), wall quads, worldGround surface, drawLot.
- All new builds start from v2.2 (or later PASSED builds), never from v2.0.

## Old baseline measurements (v2.0, default spawn view, 430x932 @2x) — history only
- ~266,000 canvas fills + ~135,000 ellipses per frame; 74 trees drawn per frame (264 in world), 58 of them >40 m away and mostly hidden behind the dojo roof/buildings.
- ~97% of fills come from `sceneTree` leaf tufts (lines ~2299–2320: 3 sub-tufts x 26 clusters/tier, two-tone tip, ellipse cap, 3 leaf dabs each). Only culling is a left/right screen check.
- Quick test: screen-size LOD of clusters/dabs alone halved frame time — real headroom is much bigger.
- Town NPCs (life192) never check for vehicles; cars stop for pedestrians (roads193) but awareness is one-way.
- The Sky Tree (v3.181 block) predates the realistic tree renderer.

## Steps

### Step 1 — Performance (trees first)  — STATUS: PASSED (met by Kev's v2.2 baseline: ~3,250 fills/frame vs 266,000; ~10x faster). Small leftovers (DPR cap at 2, SC.poly hot spot) may be folded into later steps if cheap.
- Cache each tree's foliage (and bark) to an offscreen canvas sprite, keyed by species/seed/scale and a screen-size bucket; redraw per frame with drawImage. Keep wind sway as a cheap bend (e.g. 3–4 horizontal slices drawn with increasing lateral offset, height² falloff as now), so the tree still bends from a planted base.
- Distance/size LOD: full detail only when large on screen; simplified far trees; skip trees fully occluded behind solid buildings/roofs where cheap to test.
- Check other hot spots the profiler shows after trees (SC.c colour-string building per fill, ground/lot fills) and fix any cheap wins.
- Cap backing-store DPR at 2 if it costs nothing visually (iPhone is 3x).
- Release gate: default spawn view under ~15,000 fills/frame AND ≥4x faster average frame time than v2.0 in perf.py; near trees look the same in side-by-side screenshots (wind sway still visible in video); zero new page/module errors; town, Sky Tree lift and coliseum still reachable.

### Step 2 — Sky Tree realism  — STATUS: PASSED (v2.3, Nov 21: near view 3,653 fills vs 3,253 default = +12%; walking up to it 4,940 vs 7,804 in v2.2; doorway rebuilt as a hollow in the trunk; lift both ways OK. Report: `dw2/reports/step2_3.md`)
- Rebuild the Sky Tree visuals with the same bark ridges/plates, branch structure, two-tone tufts, leaf texture and wind sway as the town trees, scaled to its giant size, plus a convincing doorway in the trunk. Use Step 1's sprite cache so it stays cheap.
- Do not change the wind-lift travel logic (HIT_TRAVEL) or the door position.
- Release gate: screenshots near and far match town-tree style; fills/frame near the Sky Tree within 20% of Step 1's default view; lift still works both ways.

### Step 3 — Buildings toward GTA V-level detail  — STATUS: PASSED (v2.4, Nov 21: inset window reveals, projecting cornices, named storefronts with awnings, readable civic signs; town-centre fills +4% to +14% vs v2.3; solids/doors unchanged. Report: `dw2/reports/step3_2.4.md`)
- Facade depth (inset windows with frames/sills/reflections), trim and cornices, signage, weathering/grime, rooftop clutter, varied materials per lot type; keep interiors and doors working.
- Cache static facade layers to sprites so detail doesn't bring the lag back.
- Release gate: before/after screenshots of each building type; fills/frame in a town-centre view no more than 25% above Step 2; no collision/door regressions.

### Step 3b — Bushes revamp (Kev, Nov 21: "The bushes need to be revamped with the rest of the game")  — STATUS: PASSED (v2.5: bushes now use the tree foliage style, with flowering variants, drawn from the sprite cache; fills −1%, frame time within noise. Report: `dw2/reports/bushes_2.5.md`)

### Step 4 — NPC logic and vehicle awareness  — STATUS: PASSED (v2.6, Nov 21: kerb drill (walk to the corner, wait for the light, look both ways, route-aware car check), karts yield at zebras and need line of sight, honks only at people in the road, driveways wait, people leave the carriageway and never walk into a kart, townsfolk notice Red by sight; travelers moved to the shoulder. Crossing test: 269 crossings / 864k ticks with 0 overlaps (v2.5: 314), carriageway person-ticks 847k -> 3.7k, honks 8,066 -> 195; fills unchanged, frame time within noise. Report: `dw2/reports/step4_2.6.md`)
- NPCs look before crossing, prefer crosswalks and lights, step back from an approaching car, react to horns; drivers and NPCs notice Red (line of sight only — never through walls).
- Don't change combat rules or Red's controls.
- Release gate: scripted test of N crossings with zero NPC–car overlaps; a short real-time video of crossings; no new errors; frame time within 10% of Step 3.
- Test: `python3 -I dw2/tools/cross.py <build> --ticks 72000 --red x,z --seed n` (seeded, no drawing; counts crossings, overlaps, carriageway ticks, honks).

### Step 5 — Fishing (non-combat activity)  — STATUS: PASSED (v2.7, Nov 22: rod rests at the lake pier, Eastwater pools, river bank and farm pond; cast/nibble/bite/strike/reel with tension, 13 species by water body, fishing log; 480/480 casts in water, good play 200/200 caught, early strikes 0 hooks, greedy reeling snaps, no reeling slips; fills +0.03% default / +0.6% pier while reeling, ms level. Also fixed the pier deck being painted over by the lake and Red standing 1.5 m down in it. Report: `dw2/reports/step5_2.7.md`)
- A real cast-and-reel game at rod rests on Mirror Lake pier, the Eastwater pools, the river bank and the farm pond, using the
  existing INTERACT flow to start: hold to swing back (power meter), release to cast; nibbles vs the bite; tap to strike; hold to reel,
  ease off when the fish runs (tension), slack too long and the hook slips. Species, length and weight depend on the water body and
  depth; a fishing log (fisher hut rod rack). Catch-and-release: no DC, no hp, no stats. Joystick/attack/hit packs the rod away.
- Rules: no change to Red's pose/animation, camera, controls or combat; no seeded R() calls; town only.
- Release gate: scripted test (`dw2/tools/fish.py`, two seeds) at all four spots: 100% of casts land in water; good timing catches
  fish, early strikes never hook, late strikes lose the bait, holding through runs snaps the line, never reeling slips the hook, the
  joystick packs up; species differ by water body; zero page/module errors; fills/frame and frame time within 15% of v2.6 at the
  default view and at the pier while reeling; real-time video of cast -> bite -> reel -> catch.

### Step 6 — Paying with real coins in town shops  — STATUS: PASSED (v2.8, Nov 22: general store, bakery, smithy, farm-stand honesty box and ramen stall sell 10 gift items through a validated 'shop' ledger debit (prices from DC_CONFIG.shop); coins fly from the pouch to the counter; gift bag + giving with reactions (line of sight only). shop.py x2 seeds: 10/10 buys agree (balance, ledger, pouch, coins flown), insufficient/wrong counter/rate limit/coliseum refused, 9/9 gifts react, none through a wall, bag survives reload, audit clean, 0 errors; fills +0.03% default / +0.7% bakery, ms level. Report: `dw2/reports/step6_2.8.md`)
- Wire up spending (today: "free sample: spending is not set up yet", "Coins are not wired up yet"): the Northfield general store,
  bakery and smithy counters, the farm stand honesty box and the ramen stall take real coins from Red's pouch through the existing
  DC ledger (a new validated 'shop' debit, prices from DC_CONFIG), with the coins flying from the pouch to the counter.
- What can be bought stays presentation/gift only (Kev's DC rule): e.g. flowers, pastries or a lantern to give to townsfolk, who react.
  Nothing that changes fighting ability, nothing in the coliseum, no cash-out.
- Release gate: scripted purchase test (balance, pouch coins and ledger agree; insufficient funds refused; coliseum refuses); gifts
  given to townsfolk show a reaction; no ledger errors; fills/frame and frame time within 15% of Step 5.

### Step 7 — Police response (line of sight only)  — STATUS: PASSED (v2.9, Nov 22: three patrol officers (civic ring road, Northfield south pavement x2) + the station officers; they respond only to Red's first strike on an unprovoked townsperson they can SEE (16 m, in front, same room, no wallBetween): callout, fight broken up, walk over, warning; a second within 90 s -> fade -> rebuilt holding cell for 20 s, the door unlocks by itself; desk explains the rules. police.py x2 seeds: in view responds, behind a wall / from inside a shop none, provoked fights + dojo foes + coliseum none, cell releases at 1,200 ticks and Red walks out, 40 random incidents each with 0 stuck states, 0 errors; fills +0.1% default / +1.4% civic responding / −0.8% cell, ms level. Also fixed 'route' walkers (b1, travelers) freezing after their first leg. Report: `dw2/reports/step7_2.9.md`)
- Officers patrol the civic square and Northfield. If an officer SEES Red (wallBetween line of sight, never through walls) attack a
  townsperson who did not provoke him, the officer calls out, then walks over; repeat offences within a short window get Red escorted
  to the holding cell for a short timed wait (the door unlocks by itself). The police desk explains the rules.
- No change to combat rules, Red's moves or the coliseum; fights Red is challenged into (provoked foes, the dojo ring) never count.
- Release gate: scripted test: an assault in view triggers a response, the same assault behind a wall triggers none, provoked fights
  trigger none; the cell timer releases Red; no stuck states; fills/frame and frame time within 15% of Step 6.

### Step 8 — Bakery courier errands  — STATUS: PASSED (v2.10, Nov 22: "Baker: courier job" at the bakery counter; 12 destinations (8 houses, farmhouse, inn, Northfield Hall, Town Hall); parcel drawn in Red's hand, door marker (never through walls), chip with distance and timer set from a wall-aware route; the recipient walks round their furniture to meet Red at the door (bar/desk staff hand over across it), thanks him; on-time = stamp on a 10-stamp card. courier.py x2 seeds: 24/24 deliveries walked with the joystick, 0 wall crossings, worst 58% of the time limit; drop / punch / hit taken / coliseum / mid-walk cancels clean; late = no stamp; card fills and survives reload; 0 errors; fills +0.0% to +0.5%, ms level. No coin tip (needs Kev's OK). Report: `dw2/reports/step8_2.10.md`)
- A simple job: the Northfield bakery hands Red a parcel (drawn in hand) to deliver to a named house, the inn or the town hall; a
  waypoint marker and a timer; the recipient thanks Red at the door. Rewards: a stamp card and, only if Kev approves, a small
  daily-capped coin tip through the ledger (a new validated 'job' source).
- Release gate: scripted test of N deliveries to every destination (all reachable without walking through walls; doors open);
  dropping the job, fights and the coliseum cancel cleanly; no errors; fills/frame and frame time within 15% of Step 7.

### Step 9 — Rowing boats on Mirror Lake  — STATUS: PASSED (v2.11, Nov 22: wasen moored at the pier, Red sculls standing with a ro oar (no pose change), camera-relative heading with inertia, wake/oar swirls/bob; grounds in shallows, never through the pier, stops short of swimmers; MOOR button. boat.py x2 seeds: 20/20 board+moor, 8 directions within 20°, 12,000 random ticks with swimmers: 0 hull violations, 0 swimmer overlaps, Red never swimming; attacks/jump off aboard; leaving town moors; 0 errors; fills +0.0% to +0.3%, ms level. Report: `dw2/reports/step9_2.11.md`)
- Follow-up v2.12 (Kev, Nov 22: "Yes boats cost coins"): boat hire is a validated 'hire' debit, 15 DC per trip (DC_CONFIG.hire), coins fly to the BOATS post, refused without charge when the pouch is short; not a gift item; audit checks it. Also: stick-behind now turns the boat round, and a swimmer beside the boat can no longer trap it. Report: `dw2/reports/step9_2.12.md`. Step 10 starts from v2.12.
- A boat jetty on the Mirror Lake pier: INTERACT "Take a boat" puts Red in a small wooden wasen moored at the pier. Red stands at the
  stern and sculls it with a long ro oar (the Japanese standing stroke, so Red keeps his normal stance: no new pose). The joystick sets
  the heading (camera-relative, like walking); the boat turns toward it with real inertia (builds speed stroke by stroke, glides and
  slows when the stick is released), leaves a wake and oar swirls, and bobs on the waves. Shallows ground the boat (it scrapes and
  stops), it never leaves the lake or passes through the pier, and it never runs into a swimmer (it stops short of anyone in the water).
  INTERACT near the pier: "Moor the boat" puts Red back on the deck.
- Rules: no change to Red's pose/animation, camera, controls or combat; Red can't attack from the boat; no Dojo Credits; town only;
  no seeded R() calls; ?off=boat turns it off.
- Release gate: scripted test (`dw2/tools/boat.py`, two seeds): board/moor from the pier always works; joystick in 8 directions moves
  the boat in the matching world direction; 2,000+ random-steer ticks keep the boat inside the lake, out of the pier and out of the
  shallows, never overlapping a swimmer; Red is never swimming while aboard; fills/frame and frame time within 15% of v2.10 at the
  default view and on the lake; zero page/module errors; real-time video of boarding, rowing and mooring.

### Step 10 — Allotment garden at the farm  — STATUS: PASSED (v2.13, Nov 22: four raised beds + can post east of the farm stand; tomato/daikon/sunflower/strawberry packets (6–12 DC) at the honesty box via the existing 'shop' debit, never in the gift bag; sow by INTERACT (SOW panel for several kinds), fill the can at the farm pond (4 pours), water; 3 min of wet soil to ripen, one pour = 2 min wet, dry beds pause and droop; 5 drawn stages; harvest into the gift bag, giftable. garden.py x2 seeds: 4/4 buys, 4/4 sown, growth 60/120/120(dry 300 s)/180 s exact, 4/4 harvested, 0 coins from growing, 4 debits = 4 sown, audit clean, reload keeps beds + bag, coliseum refuses and returns the can, 0 errors; regressions shop/fish/boat/courier/police PASS; fills +3.4% at the allotment, +0.0% default, ms level. Report: `dw2/reports/step10_2.13.md`)
- Four allotment beds by the farm stand: buy a seed packet at the honesty box (the existing validated 'shop' debit), INTERACT a bed to
  plant, fill the watering can at the farm pond and water; crops grow through visible stages over a few real minutes (dry beds pause),
  then harvest into the gift bag (giftable like the shop items). Growth is saved per viewer. Never changes fighting ability.
- Release gate: scripted test (plant -> water -> grow -> harvest at all four beds, dry beds pause, no coins without a buy, ledger
  agrees); zero errors; fills/frame and frame time within 15% of the previous PASSED build.

### Step 11 — Gomoku board at the inn  — STATUS: PASSED (v2.14, Nov 22: 13x13 goban on the inn bar beside the innkeeper; INTERACT opens a touch board (tap = ghost, tap again = place); threat-aware AI (win > block four > own open four > block open three > score, with variety); per-viewer W/L/D record, CLOSE pauses, reload keeps game. gomoku.py x2 seeds, 120 games / 5,701 moves re-checked in Python: 0 illegal, results + record all match, 2,836 innkeeper moves: every win taken, 192/192 fours and 224/224 open threes blocked; hand-built positions 7/7; full-board draw detected; leave/coliseum/downed keeper close cleanly; 0 errors; fills +2.4% inn / +0.0% default, ms level. Report: `dw2/reports/step11_2.14.md`)
- A real board game: INTERACT the board table in the inn to play five-in-a-row (9x9 or 13x13) against the innkeeper on a touch overlay
  (tap to place; the innkeeper answers with a simple threat-aware AI); wins/losses on a per-viewer record. Simple to operate.
- Release gate: scripted test (legal moves only, the AI blocks open fours, win/draw detection correct over many random games);
  zero errors; perf within 15% of the previous PASSED build.

### Step 12 — Mirror Lake swim course  — STATUS: PASSED (v2.15, Nov 22: sandy beach + start board on the south shore, INTERACT -> 3-2-1-GO, five numbered buoys in order (next one ringed, edge arrow), finish gate float line, chip with time/next buoy/distance/best; missed buoys flagged and not counted; leaving the water, false start, never getting in, cancel, boat, coliseum end the run; per-viewer best + last five. swim.py x2 seeds: 8/8 full runs (one diving) all buoys in order while swimming, time = counted ticks, best = min, skip/straight-to-gate missed detected and recovered, out/dry/false/area/reload all correct, 0 errors; regressions boat/fish PASS; fills +0.1% default / +1.5% beach / +2.0% lake, ms level at default/beach, +6% to +11% on the lake mid-run. Report: `dw2/reports/step12_2.15.md`)
- The buoy line becomes a timed swim course: a start board on the beach, numbered buoys drawn on the water, a lap timer and best
  times, using the existing swimming/diving physics (no new poses). Missing a buoy is shown; leaving the water ends the run.
- Release gate: scripted swim of the course (all buoys reachable, timer and best time correct, missed buoy detected); zero errors;
  perf within 15% of the previous PASSED build.

### Step 13 — Home cooking with your produce  — STATUS: PASSED (v2.16, Nov 22: all 10 home stoves open a recipe book when the bag holds an ingredient; 6 recipes; SEAR/SERVE heat-needle panel graded perfect/good/rushed/overdone; ingredients used only on SERVE (oldest first); cancel/leave/fight/coliseum use nothing; dish giftable, perfect = loved; book saved. cook.py x2 seeds all PASS (6/6 grades as aimed, 0 coins, audit clean, reload keeps book + dishes, empty bag = old stove); shop/garden regressions PASS; fills +0.0% default / +5% kitchen while cooking, ms level / +7%. Report: `dw2/reports/step13_2.16.md`)
- The home stoves (the Northfield houses, the farmhouse and the stone house) become real kitchens: when Red's gift bag holds ingredients,
  INTERACT the stove opens a recipe book (6 recipes from allotment produce + shop goods, e.g. tomato omelette = tomatoes + eggs, daikon
  oden = daikon + eggs, strawberry sando = strawberries + melon pan, loaded ramen = ramen + eggs + daikon). COOK runs a short pan
  minigame on a touch panel (heat needle: tap SEAR, then SERVE, in the golden zone): perfect / good / overdone. The ingredients leave
  the bag only when the dish is served; cancelling, a fight or leaving the house returns them. The dish goes in the gift bag (giftable;
  a perfect dish is loved by anyone). Recipe book remembers dishes cooked and best quality per viewer. With an empty bag the stove keeps
  its old "cook a meal" behaviour.
- Rules: no coins earned, no new hp/stat effects (the old stove heal is unchanged), no change to Red's pose, camera, controls or combat;
  towns only; no seeded R() calls; ?off=cook turns it off.
- Release gate: scripted test (`dw2/tools/cook.py`, two seeds): every recipe cooked through INTERACT + the panel at a real stove; perfect /
  good / overdone timing graded correctly; ingredients consumed exactly once and only on SERVE; cancel / fight / leaving return them;
  missing-ingredient recipes refused; dish in the bag, giftable, perfect = love; book survives reload; empty bag keeps the old stove;
  ledger untouched, audit clean; zero errors; fills/frame and frame time within 15% of v2.15; real-time video.

### Step 14 — Riding the town bus (fares)  — STATUS: PASSED (v2.17, Nov 22: the karts had replaced the old bus, so one yellow town bus (old v3.201 body, 4.2 m minibus) was brought back as a CARS member on a fixed 719 m loop; 4 shelters + timetables (Northfield avenue, Airfield, Southbank Farms, Civic Square); 'fare' ledger debit 10 DC (DC_CONFIG.fare, stop validated, audited), BELL / GET OFF button, Red hidden aboard (at a window), camera rides along. bus.py x2 seeds: 16/16 rides one fare each, set down on the pavement 0.00 m from the spot, never in road/solid; ~130k ticks 0 bus-pedestrian overlaps, 0 contacts while moving; yield, get-off-now, attacks off, coliseum set-down, free run in order, drain ends 'insufficient' with nothing charged; 0 errors; regressions shop/boat/cross PASS; fills +0.0% default / +3.9% at a stop / +9.5% riding vs walking the same road, ms level/−17%. Report: `dw2/reports/step14_2.17.md`)
- Bus stops with shelters and timetables at the civic square, Northfield, the Southbank farms and the airport. The yellow bus that
  already drives the roads runs a fixed loop and stops at each one; INTERACT at a stop while it waits = "Board (fare)": a validated
  'fare' ledger debit (price in DC_CONFIG, ~10 DC, Kev's PRICES rule), Red rides inside (camera follows the bus), the chip shows the
  next stop, INTERACT "Get off at the next stop" sets him down on the pavement. Refused without charge when the pouch is short.
- Rules: Red keeps his pose (standing aboard, hidden behind the bus body), no combat aboard, the bus still stops for pedestrians, towns
  only, no coliseum; ?off=bus.
- Release gate: scripted test: board/alight at every stop, the fare charged once per ride and refused when short, Red never left inside
  a wall or the road, the bus never overlaps a pedestrian while carrying him; zero errors; perf within 15% of Step 13; real-time video.

### Step 15 — Kite flying on the south meadow  — STATUS: PASSED (v2.18, Nov 22: paper kite at the general store (35 DC 'shop' debit, bought once, OWNED, never a gift); launch only on open ground (meadow, Highlands, overlook top; trees/walls/road/water/indoors refused); KITE button hold = reel in, release = let out, slack >2.2 s stalls; wind model with veer, lulls and gusts; low kites snag trees/roofs, TUG x3 frees; down -> REEL IN -> FLY; line from Red's real hand; packed by fights/coliseum/boat/bus/water/indoors; records per viewer. kite.py x2 seeds PASS: 60 s steady hold x3 wind phases 0 stalls, slack stalls 3/3 at 2.2 s, gust taut, skilled flyer 31 m/90 s, tree + roof snags below the top, high pass over canopies 0 snags, records match, 0 errors; regressions shop/garden/cook/bus PASS; fills +0.0% default / +0.2-0.3% flying, ms within noise. Report: `dw2/reports/step15_2.18.md`)
- A kite (sold at the general store, ~35 DC, kept, not a gift) flown from the open south meadow / Highlands top: INTERACT to launch,
  the joystick walks Red as usual while the line pulls; hold the KITE button to reel in / release to let out; gusts from a wind model
  lift or drop it, too much slack and it stalls and falls, too low over trees snags it. Height and time-aloft records per viewer;
  the kite and line drawn in the world (line from Red's real hand position, no pose change).
- Rules: never in the coliseum, packed away by any fight; no AI reacts through walls; no seeded R() calls; ?off=kite.
- Release gate: scripted test: launch works only in open ground, a steady hold keeps it aloft for 60 s, letting it slack stalls it,
  trees snag it, records correct and saved; zero errors; perf within 15% of Step 14; real-time video.

### Step 16 — Rain showers that change the town  — STATUS: PASSED (v2.19, Nov 22: wall-clock showers (15-min slots, ~half rain, 2.5–5 min, 25 s build-up/ease-off; ?rain=1/0, ?off=rain); grey sky, wet wash, 2-layer streaks, ground ripples; outdoor townsfolk walk by route to 42 spots (bus shelters, pavilion, awnings) or open umbrellas, walk back after; beds watered, fish ×0.7 wait, WEATHER line on notice boards; coliseum dry. rain.py x2 seeds PASS: start/end within 1 tick of schedule, 0 uncovered at +70 s, 29k steered steps 0 wall/solid/road, all back within 0.3 m, none stuck; regressions garden/shop/cook/kite/bus/swim/fish/boat/cross PASS (swim+boat also in rain); fills +0.0–0.8%, ms −0.5%/+0.8% while raining. Report: `dw2/reports/step16_2.19.md`)
- Occasional rain showers (a wall-clock weather cycle, a few minutes long): rain streaks and puddle ripples, darker wet ground and roofs,
  townsfolk open umbrellas or walk to the nearest shelter/awning (by walkable route, never through walls) and come back after; rain
  waters the allotment beds; fish bite a little faster; the swim course and boats stay open. A WEATHER line on the town board.
- Rules: no change to fighting, camera or controls; the coliseum keeps its own sky; ?off=rain.
- Release gate: scripted test: a shower starts and ends on schedule, wets all four beds, townsfolk under cover by line of route with no
  wall crossings and none stuck after it ends; fills/frame and frame time within 15% of Step 15 while raining (rain drawn cheaply).

### Step 17 — Omikuji fortunes at Shrine Hill  — STATUS: PASSED (v2.20, Nov 22: roofed stand by the offering box + musubi rack in front of the hall; 10 DC 'hire' debit (place shrine, DC_CONFIG); SHAKE x3 -> stick 1–32 -> slip (7 grades, verse, 5 lines, fixed per stick); KEEP -> 32-slip book, or carry the slip (drawn in Red's real hand) and tie it on the rack; paid draws survive close/fight/reload; 3 a day. omikuji.py x2 seeds all PASS: one debit per draw, short/daily/coliseum/holding refused with no charge, 3,200 sticks within ±1.0 pt of the table, audit clean, 0 errors; regressions boat/shop PASS; fills +0.6–0.7%, ms median +2% default / −4% shrine. No new collision solids (a solid let the engine climb Red onto the rack). Report: `dw2/reports/step17_2.20.md`)
- An omikuji stand beside the Shrine Hill offering box: INTERACT "Draw a fortune · 10 DC" posts a validated 'hire' debit (DC_CONFIG.hire,
  place 'shrine', Kev's PRICES rule), the coins fly to the stand, and a touch panel opens: SHAKE the hexagonal box three times, a numbered
  stick (1–32) slides out, the slip unrolls with its grade (Great blessing … Great curse) and short lines for wish / travel / fishing /
  garden / weather. KEEP puts it in a per-viewer fortune book (32 slips to collect); a bad slip can be carried (drawn in Red's real hand)
  to the musubi rack across the forecourt and tied there with INTERACT (knots stay on the rack, saved per viewer). Three draws a day.
- Rules: flavour only (no hp/stat/combat/coin-earning effects); no change to Red's pose, camera, controls or combat; a paid draw is never
  lost (closing or a fight keeps the stick for later); coliseum refuses; no seeded R() calls; ?off=omikuji.
- Release gate: scripted test (`dw2/tools/omikuji.py`, two seeds): draws through INTERACT + the panel's real buttons; exactly one 10 DC
  debit per draw, refused without charge when short / over the daily cap / in the coliseum; 3,200 sampled sticks match the grade table;
  keep → book, carry → tie → knot on the rack, all kept after a reload; a fight mid-draw keeps the paid stick; audit clean; zero errors;
  fills/frame and frame time within 15% of v2.19 at the default view and at the shrine; real-time video.

### Step 18 — The mayors' town requests  — STATUS: PASSED (v2.21, Nov 22: Mayor Hale + Deputy Mayor Ines each post one request a day (date hash, never the same kind): perfect dish to a named person, grown crop to a named person, species at a water, swim course under a time, baker parcel on time, kite above a height; INTERACT at the mayor -> TAKE IT, chip tracks it, HAND IN -> civic ribbon on a per-viewer TOWN FRIEND board (room prop on both halls' back walls + panel view), no coins. mayor.py x2 seeds all PASS: all 6 kinds done through the real activity paths and handed in, before-taking / wrong species / rushed dish / slow swim don't count, not_done / wrong / handed / active / expired / area refused, board + held request survive reload, no credits, audit clean, 0 errors; regressions courier/shop/cook/swim PASS; fills +0.0% default / +0.5% Town Hall, ms median +8–9%. Report: `dw2/reports/step18_2.21.md`)
- Mayor Hale (Town Hall) and Deputy Mayor Ines (Northfield Hall) each post a small daily request built on activities that already exist
  (e.g. bring a perfect dish to someone named, catch a fish species from a given water, give a harvested crop, swim the course under a
  time, deliver for the baker on time, fly the kite above a height). INTERACT the mayor to take it, the chip tracks it, hand in at the
  hall. Reward: a civic ribbon on a per-viewer "Town Friend" board in the hall (no coins: new earning still needs Kev's OK).
- Release gate: scripted test completes every request type through the real activity paths, wrong/expired requests are refused, the
  board survives reload; zero errors; perf within 15% of the previous PASSED build; real-time video.

### Step 19 — Darts at the inn  — STATUS: PASSED (v2.22, Nov 22: dartboard cabinet on the inn's back wall (the camera faces it; a side wall would be edge-on) + oche at 2.37 m; INTERACT opens a face-on touch board: tap to aim, THROW, reticle wobble that settles then tires, σ 5 mm release; real ring radii; ROUND THE CLOCK solo and 301 straight-in double-out vs the Regular (the inn guest, moved beside the oche), who aims like a pub player; per-viewer records; quit/close/step off/walk out/hit/coliseum end it uncounted. darts.py x2 seeds all PASS: 20,115 points scored = Python, 18,900-case 301 rule table = Python, 24 RTC + 80 x 301 games (2,300+ darts) replayed in Python with 0 mismatches, regular aims at the double every time he is on one; regressions gomoku/courier PASS; fills +0.0% default / +0.5% inn / +2.5% playing, ms +6.6% playing. Report: `dw2/reports/step19_2.22.md`)
- A dartboard on the inn's side wall: INTERACT opens a touch throw panel (the board seen face-on, an aiming reticle that drifts with a
  steadiness wobble, tap to throw; Red keeps his pose). Games: Round the Clock solo and 301 against a regular; per-viewer records.
  Free (house board). Closing, a fight or leaving the inn ends it cleanly.
- Release gate: scripted test: thrown darts score by the real board geometry (doubles/trebles/bull), 301 bust/finish rules correct over
  many random games, the regular plays legal throws; zero errors; perf within 15% of the previous PASSED build; real-time video.

### Step 20 — Stargazing on the Highlands overlook  — STATUS: NOT STARTED (Step 19 PASSED: next)
- A coin-op telescope on the overlook top (10 DC 'hire' debit for a viewing, Kev's PRICES rule). At dusk/night a touch sky panel shows a
  real star field (bright stars at their true relative positions); drag to pan, find and tap the asked-for constellation to log it
  (a per-viewer star log of ~12 constellations). In daylight it shows the town and the Sky Tree instead. Rain clouds hide the stars.
- Release gate: scripted test: one debit per viewing, refused when short; constellation hit-tests correct; rain/daylight handled; log
  saved; zero errors; perf within 15% of the previous PASSED build; real-time video.

## After Step 4 — new objectives (Kev, Nov 21: "once you've met all objectives, create new ones")
When Steps 1–4 are all PASSED, the run that finds them so writes the NEXT batch of 3–4 steps here (Step 5, 6, ...), each in the same
format (what to build, rules, release gate, STATUS), then starts the first one in that same run. Repeat whenever a batch is all PASSED.
Rules for choosing them:
- Each objective must build or improve a real, playable feature (not planning-only, audit-only or QA-only work).
- Stay in the current roadmap phase: (2) widen the world, add depth and non-combat activities. Kev decides when phases advance, so do NOT start
  phase (3) multiplayer expansion (proximity chat, message bubbles) or (4) a photo-real / Unreal Engine port on your own.
- Do NOT build the declined combat items: pose-matched move selection ("item 4") or policy search ("item 5").
- Keep performance in budget: every new step's gate includes fills/frame and frame time within 15% of the previous PASSED build.
- Prefer items from Kev's own lists that the build doesn't yet do well (check the code before choosing):
  * World wishlist: coins that move like real coins in a bag; safes/ATMs/banks with guards; a police system; a mayor for each town;
    towns ruined by tragedy; large scenic open spaces; multi-level buildings with scalable rooftops; realistic PG-13 fall damage with a
    timed recovery penalty; hospitals; an underground secret society; travelers between areas; businessmen.
  * World directives: swimmable water with realistic effects and depth by body of water; every building open, fully furnished, with
    working items unique to it; stairs inside buildings, no ladders outside (ladders only where relevant); modern countryside with roads
    and vehicles; airport placed for future map expansion.
  * Dojo Credits: physical coins in a belt pouch, only in towns/apartments (not the coliseum); wallet menu lives in MENU only; never buys
    combat advantage, no cash-out.
  * Non-combat activities that fit the town (jobs, errands, shops, games) and keep "simple to operate, stylistically deep".
  * PRICES (Kev, Nov 22: standing rule): new paid services and goods (hires, rentals, entry fees, seed packets, gift items) may be
    priced without asking Kev. Each charge is a validated ledger debit (like 'shop' / 'hire') with its price in DC_CONFIG, in the same
    range as the existing tables (about 10–90 DC; boat hire is 15), towns only, refused without charging when the pouch is short,
    checked by eco.audit(). Never for combat advantage, never in the coliseum, no cash-out. New ways to EARN coins (tips, rewards)
    still need Kev's OK.
- Standing rules still apply: thin stick figures, same animation style, controls, camera and combat logic; no AI sees through walls;
  Red moves by the on-screen joystick only; Dojo Credits stay out of the coliseum.

## Run log
- 2026-11-20: plan, baseline copy, perf harness and baseline report committed (Claude).
- 2026-11-21: added the "new objectives" rule after Step 4 (Claude).
- 2026-11-21: Kev set Dojo_World_v2_2 as the new baseline; Step 1 marked PASSED from its measurements; next is Step 2 (Claude).
- 2026-11-21T13:01Z STARTED step 2 (Claude, scheduled run)
- 2026-11-21T13:15Z FINISHED step 2: PASSED — v2.3 (sprite hysteresis −37% fills while walking to the Sky Tree; trunk doorway rebuilt; lift OK)
- 2026-11-21T16:58Z STARTED step 3 (Claude, scheduled run)
- 2026-11-21T17:15Z FINISHED step 3: PASSED — v2.4 (window reveals, cornices, Northfield storefronts + signs; fills +14% worst case; doors/solids unchanged)
- 2026-11-21: Kev asked for the bushes to be revamped; v2.5 built live in the session from v2.4 (Claude). Step 4 starts from v2.5.
- 2026-11-21T20:58Z STARTED step 4 (Claude, scheduled run)
- 2026-11-21T22:08Z FINISHED step 4: PASSED — v2.6 (0 pedestrian–kart overlaps in 269 crossings / 864k ticks vs 314 in v2.5; jaywalking −99.6%; honks −98%; perf level). Steps 1–4 all PASSED: next run writes the new batch (Step 5+).
- 2026-11-22T00:58Z STARTED step 5 (Claude, scheduled run; writing new batch Steps 5–8)
- 2026-11-22T01:34Z FINISHED step 5: PASSED — v2.7 fishing at four rod rests (480/480 casts in water, 0 early hooks, perf level) + pier deck/height fix; new batch Steps 5–8 written
- 2026-11-22T04:59Z STARTED step 6 (Claude, scheduled run)
- 2026-11-22T05:25Z FINISHED step 6: PASSED — v2.8 town shops take real coins (5 counters, 10 gift items, validated 'shop' debit) + gift bag and townsfolk reactions; perf level
- 2026-11-22T08:58Z STARTED step 7 (Claude, scheduled run)
- 2026-11-22T09:40Z FINISHED step 7: PASSED — v2.9 police (3 patrol officers + station; line-of-sight only: warning, then 20 s holding cell that unlocks itself; wall/shop/provoked/foe/coliseum none; 80 random incidents 0 stuck; perf level) + fixed frozen route walkers
- 2026-11-22T09:59Z STARTED step 8 (Claude, scheduled run)
- 2026-11-22T11:12Z FINISHED step 8: PASSED — v2.10 bakery courier (12 destinations, parcel in hand, wall-aware route + timer, door marker never through walls, recipient meets Red at the door, stamp card; 48/48 deliveries walked, 0 wall crossings; drop/fight/coliseum cancels clean; perf level; no coin tip pending Kev). Batch Steps 5–8 all PASSED: next run writes the new batch.
- 2026-11-22T11:58Z STARTED step 9 (Claude, scheduled run; writing new batch Steps 9–12)
- 2026-11-22T12:18Z FINISHED step 9: PASSED — v2.11 rowing boats on Mirror Lake (ro-oar sculling, inertia, wake; 0 hull/swimmer violations in 12k random ticks; perf level); new batch Steps 9–12 written
- 2026-11-22: Kev approved coins for boats; v2.12 built live in the session from v2.11 (15 DC 'hire' debit + two boat fixes) (Claude).
- 2026-11-22T12:59Z STARTED step 10 (Claude, scheduled run)
- 2026-11-22T13:24Z FINISHED step 10: PASSED — v2.13 allotment garden (seeds at the honesty box, sow/fill/water/grow/harvest at 4 beds, dry beds pause, produce giftable; garden.py 2 seeds all checks, 0 coins without a buy, ledger agrees; fills +3.4%, ms level)
- 2026-11-22T13:59Z STARTED step 11 (Claude, scheduled run)
- 2026-11-22T14:16Z FINISHED step 11: PASSED — v2.14 gomoku vs the innkeeper at the inn bar (touch board, threat-aware AI, W/L/D record; 120 games 0 illegal, every four/open three blocked; perf level)
- 2026-11-22: Kev set a standing rule: new paid services/goods may be priced without asking (see PRICES under "After Step 4") (Claude).
- 2026-11-22T14:59Z STARTED step 12 (Claude, scheduled run)
- 2026-11-22T15:22Z FINISHED step 12: PASSED — v2.15 Mirror Lake swim course (beach start board, 5 buoys + finish gate, timer/best, missed-buoy detection; swim.py 2 seeds all checks, ~40 s course; perf within budget). Batch Steps 9–12 all PASSED: next run writes the new batch.
- 2026-11-22T15:59Z STARTED step 13 (Claude, scheduled run; writing new batch Steps 13–16)
- 2026-11-22T16:21Z FINISHED step 13: PASSED — v2.16 home cooking (10 stoves, 6 recipes, SEAR/SERVE pan game; cook.py 2 seeds all checks, ingredients used only on serve, 0 coins, perf in budget); new batch Steps 13–16 written
- 2026-11-22T16:59Z STARTED step 14 (Claude, scheduled run)
- 2026-11-22T17:39Z FINISHED step 14: PASSED — v2.17 town bus + fares (4 stops with shelters/timetables, 10 DC validated 'fare' debit, bell to get off; bus.py 2 seeds 16/16 rides, 0 overlaps, 0 moving contacts; perf in budget)
- 2026-11-22T17:59Z STARTED step 15 (Claude, scheduled run)
- 2026-11-22T18:44Z FINISHED step 15: PASSED — v2.18 kite flying (general store 35 DC, open-ground launch, hold/release line tension with stalls, wind gusts/lulls, tree + roof snags with TUG, records; kite.py 2 seeds all checks; perf in budget)
- 2026-11-22T18:59Z STARTED step 16 (Claude, scheduled run)
- 2026-11-22T19:56Z FINISHED step 16: PASSED — v2.19 rain showers (wall-clock schedule, townsfolk shelter by route or umbrella and walk back, beds watered, fish bite faster, WEATHER on boards; rain.py 2 seeds all checks, 0 wall crossings; perf level while raining). Batch Steps 13–16 all PASSED: next run writes the new batch.
- 2026-11-22T19:58Z STARTED step 17 (Claude, scheduled run; writing new batch Steps 17–20)
- 2026-11-22T20:28Z FINISHED step 17: PASSED — v2.20 omikuji at Shrine Hill (10 DC 'hire' draw, shake/stick/slip panel, 32-slip book, tie bad slips on the musubi rack; omikuji.py 2 seeds all checks, audit clean; perf in budget); new batch Steps 17–20 written
- 2026-11-22T20:59Z STARTED step 18 (Claude, scheduled run)
- 2026-11-22T21:27Z FINISHED step 18: PASSED — v2.21 mayors' town requests (Hale + Ines, 6 request kinds on existing activities, TOWN FRIEND ribbon board, expiry/wrong-hall refusals; mayor.py 2 seeds all checks; perf in budget)
- 2026-11-22T21:59Z STARTED step 19 (Claude, scheduled run)
- 2026-11-22T23:59Z STARTED step 19 (Claude, scheduled run; the 21:59Z run left no build or FINISHED line, so this run restarts step 19 from v2.21)
- 2026-11-23T00:21Z FINISHED step 19: PASSED — v2.22 darts at the inn (back-wall board + oche, tap-aim/THROW with settle-then-tire wobble, real ring geometry, round the clock + 301 double-out vs the Regular, records; darts.py 2 seeds all checks, 0 rescoring/replay mismatches; perf in budget)
- 2026-11-23T01:01Z STARTED step 20 (Claude, scheduled run)
