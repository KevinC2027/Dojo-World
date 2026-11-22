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

### Step 11 — Gomoku board at the inn  — STATUS: NOT STARTED
- A real board game: INTERACT the board table in the inn to play five-in-a-row (9x9 or 13x13) against the innkeeper on a touch overlay
  (tap to place; the innkeeper answers with a simple threat-aware AI); wins/losses on a per-viewer record. Simple to operate.
- Release gate: scripted test (legal moves only, the AI blocks open fours, win/draw detection correct over many random games);
  zero errors; perf within 15% of the previous PASSED build.

### Step 12 — Mirror Lake swim course  — STATUS: NOT STARTED
- The buoy line becomes a timed swim course: a start board on the beach, numbered buoys drawn on the water, a lap timer and best
  times, using the existing swimming/diving physics (no new poses). Missing a buoy is shown; leaving the water ends the run.
- Release gate: scripted swim of the course (all buoys reachable, timer and best time correct, missed buoy detected); zero errors;
  perf within 15% of the previous PASSED build.

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
