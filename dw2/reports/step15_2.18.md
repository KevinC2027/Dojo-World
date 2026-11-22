# Step 15 — Kite flying (v2.18) — PASSED

Build: `dw2/builds/Dojo_World_v2.18.html` (from v2.17, the newest PASSED build). Baseline untouched (`BASELINE.sha256` OK).

## Why
Roadmap phase 2 (non-combat activities, "large scenic open spaces"). The South Meadow and the Highlands were open ground with nothing
to do there. A kite you buy once and fly gives them a use, and it adds a second "hold to manage tension" game alongside fishing.

## Files changed
- `dw2/builds/Dojo_World_v2.18.html` — new build:
  - DC_CONFIG.shop: new item `kite` (general store, 35 DC, `kind: 'kite'`, `once: true`). It's an ordinary validated 'shop' debit.
    `eco.buy` refuses a second kite (`owned`), and `audit()` flags a once-only item bought twice.
  - Town shops: the kite is never giftable (it never goes in the gift bag). Its row shows **OWNED** (disabled) once bought. New
    "You already have one" message. The kite icon is drawn by the kite module (`addGlyph`).
  - New `dw2 v2.18 — KITE FLYING` script (`window.HIT_KITE`). `?off=kite` turns it off.
- `dw2/tools/kite.py` — new gate test.
- `dw2/tools/shop.py` — two test-side updates for the new item. The kite is expected not to enter the gift bag, the same as seed
  packets. The rate-limit check now buys daikon seeds (6 DC) instead of eggs, so the 500 DC starting balance still covers 8 buys
  after the kite.
- `dw2/PLAN.md` — Step 15 status, run log.

## How it plays (phone)
- **Buy:** Northfield general store, "Paper kite · 35 DC". Coins fly to the counter. From then on it's yours (checked against the
  ledger, so it survives reloads).
- **Where:** open ground only. That means no tree canopy within 6.5 m (so a kite held on a short line never reaches a tree), no
  building within 5 m, dry land, off the carriageway, and outdoors. That covers ~30% of the South Meadow strip and ~37% of the
  Highlands. It includes the top of the overlook rock (its north-west corner: trees lower than the rock top don't count). Standing
  there, INTERACT shows **"Fly the kite (best N m)"**. Anywhere else there's no prompt. Calling launch directly gives the reason
  (trees / walls / road / water / inside).
- **Flying:** a round **KITE** button (bottom right of the game view):
  - **HOLD = reel in.** The line shortens at 1.5 m/s to a 5 m minimum, and the extra airspeed makes the kite climb.
  - **RELEASE = let out.** The wind pulls line off the spool, up to 45 m. The kite goes further and higher, but the line goes slack.
  - **Stall:** slack for more than 2.2 s stalls the kite and it flutters down.
  - **Climbing:** the skill is to pulse — let out, then hold to re-tension.
  - **Walking:** the joystick walks Red as usual. Walking upwind (away from the kite) adds airspeed, and walking at it takes some away.
  - **At full line,** nothing more pays out, so the line stays taut on its own.
- **Wind:** a smooth function of game time with no random calls. It blows mostly toward the north and veers ±35° over a minute or
  two. Speed is 3.7–7.1 m/s with lulls, plus gusts of up to 1.8 m/s more (peaks ~8.9 m/s). A gust lifts the kite, and lets you pay out line while it stays
  taut. A lull drops it. The chip shows the wind speed, where it's coming from, and "(gust)".
- **Snags:** a kite flown low over a tree canopy (or below a roof) catches. TUG (tap) three times and it drops. A stalled or crashed
  kite lies on the grass: hold **REEL IN** to drag it back to your hand, then tap **FLY** to relaunch. INTERACT "Pack the kite away"
  appears when the kite is in your hand or on the ground. While it flies there's no big prompt.
- **HUD:** a chip above the line bar: "KITE · 18 m up · line 29 m · wind 5.6 m/s from S · 0:22", with a BEST height / time-aloft
  line under it. The line bar is green when taut and amber → red when slack ("SLACK! HOLD TO RE-TENSION"). A red edge arrow marks
  the kite when it's above the screen.
- **Drawing:** the kite is a kakudako (washi sail, red sun, bamboo spars, ribbon tail that waves downwind). It faces back along the
  line, rolls in the wind, tumbles when it stalls, and lies flat on the grass when down. It casts a faint ground shadow. The line runs
  from Red's real right hand (`pose(f).hr`), sags with slack, and stays tight when taut. No pose change.
- **Packed away by:** any fight state (attacking, guarding, dodging, stun…), losing hp, the coliseum (a launch there is refused),
  boarding a boat or the bus, water, fishing, the swim course, or going indoors. No AI reacts to it. No coins are earned.
- **Records** (this browser): best height, longest time aloft for one flight (launch → stall / snag / crash / pack), flights.

## Tests run
`python3 -I dw2/tools/kite.py dw2/builds/Dojo_World_v2.18.html --seed 7` and `--seed 11`: **PASS** both
(`step15_2.18_kite_seed7.json`, `..._seed11.json`). The kite was driven only through INTERACT and the KITE button's own
down/up functions, and Red only with the joystick. Every tick was checked by an independent observer wrapped around `tick()`.
- **nokite:** without a kite there's no prompt and launch returns `none`. **short pouch:** 5 DC → `insufficient`, 0 DC charged,
  no ledger entry.
- **buy:** the BUY button posts one 35 DC 'shop' debit (general), 35 DC of coins are flown, the button turns OWNED and disabled,
  a second buy gets `owned` with nothing charged, it's not in the gift bag, the audit is clean, and it's still owned after a reload.
- **open:** launches at the South Meadow ×2, the Highlands ×2 and the overlook top (Red at y 5.1). Refused with the matching code
  and no prompt among trees, by a building, on the road, in the lake and inside a house (nf_s0).
- **hold:** a steady hold for 60 s at three wind phases (wind 3.8–8.4 m/s across them): 3,600/3,600 ticks aloft each, 0 stalls,
  lowest kite 3.2–4.3 m, max slack 0.
- **slack:** letting the line run stalls it after 2.22 s (3/3 phases). It lands 1.5–2.2 s later, REEL IN brings it back to the
  hand, and FLY relaunches (3/3).
- **gust / lull:** in a 7.6 m/s gust, letting out runs the line 5 → 23 m in 6 s, the kite climbs 5 → 13 m, it never goes slack
  (min airspeed 4.6), then reaches full line (45 m). At full line it sits at 31.3 m in 6.5 m/s, drops to 14.1 m in a 3.5 m/s
  lull, and climbs back to 30.9 m.
- **skill:** a pulsing flyer on the open Highlands in the natural wind climbs to 31.4 m and stays up 90 s.
- **snag:**
  - Low toward the nearest tall tree (8.8 m tall pine, 22 m from the launch spot): caught at 2.9 m. TUG, TUG still snagged, the
    third frees it, it lands, and it reels back to the hand.
  - Low toward the nearest tall building (h 7): caught on the roof at 4.4 m, with the same free → land → hand sequence.
  - High (full line, 31 m) and walked over the same tree line: it passed over 1–2 canopies with 18 m of clearance and 0 snag ticks.
- **walk:** 180 ticks of stick walk 11.10 m with the kite up and 11.10 m without.
- **pack:** a punch, GUARD, losing 5 hp, the coliseum (and a launch there → `area`), a boat, the lake (_wd 5.5) and indoors each
  pack it, with the matching reason. When it's down, INTERACT "Pack the kite away" packs it.
- **records:** best height 31.4 m = the highest the observer saw (31.41), best time 5,400 ticks = the longest flight it counted,
  29 flights. Identical after a reload.
- **draw / errors:** draw() runs in fly / fall / down / hand with no error. 0 module errors, 0 page errors.
- One development run failed `pack` because a townsperson annoyed by the punch check came back and hit Red, which correctly packed
  the kite. The test now calms townsfolk between checks; three later runs passed.

Regressions on v2.18 (seed 7):
- `shop.py` PASS: 15/15 buys incl. the kite, all refusals, 9/9 gifts. v2.17 also re-run with the updated test: PASS 14/14.
- `garden.py` PASS. `cook.py` PASS.
- `bus.py` (1 lap, 12k ticks) PASS.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| View | v2.17 fills | v2.18 fills | v2.17 ms | v2.18 ms |
|---|---|---|---|---|
| default spawn (3 runs) | 3,450 / 3,449 / 3,448 | 3,446 / 3,450 / 3,447 | 64.4 / 64.6 / 57.1 (mean 62.0) | 64.5 / 57.8 / 70.2 (mean 64.2) |
| South Meadow (-48,-24); v2.18 kite flying 27 m (above the screen, edge arrow) | 8,513 / 8,514 | 8,565 / 8,509 | 96.7 / 104.6 | 94.6 / 89.6 |
| Highlands (52,106); v2.18 kite flying 28 m, on screen with its line | 853 / 851 | 854 / 853 | 30.8 / 26.4 | 30.5 / 27.5 |

- Default: fills +0.0%, ms +3.5% (noise; the three v2.18 runs span 58–70 ms).
- Meadow: fills +0.3%, ms −8%. Highlands: fills +0.2%, ms +1%.
- The kite, its tail, line and shadow add about 15–25 fills while up.
- All within the 15% budget.

## Visual evidence
- `step15_v2.18_kite_flying.mp4` — 67 s, real time (the game ran at 60 ticks/s while recording), page load trimmed, no title or
  report cards. A steady 5.6 m/s south wind was set for the recording so it shows every stage. On the Highlands, Red walks onto
  open ground with the joystick and INTERACTs "Fly the kite". The KITE button pulses LET OUT / REEL IN and the kite climbs to
  ~17 m; Red walks with it up. Letting go: SLACK → stall → it flutters down → "The kite is down", REEL IN drags it back. FLY
  again, then the wind swings onto a stand of pines and Red walks it low into one: "Snagged in a tree!". TUG ×3 frees it, it drops
  into the next pine (TUG ×3 again), lands, and reels back into his hand.
- `step15_2.18_launch_stall_snag_frames.jpg` — eight frames from that video.
- `step15_2.18_meadow_before_left_after_right.jpg` and `step15_2.18_highlands_before_left_after_right.jpg` — the perf views,
  v2.17 / v2.18. In the meadow shot the kite is above the frame (27 m), so you see its line and the edge arrow. In the Highlands
  shot the kite is at the top edge (28 m).
- The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Remaining blockers / notes
None for the gate. Notes for Kev:
- The camera is unchanged. It frames the street, so a kite much above ~20–25 m leaves the top of the screen. The edge arrow and the
  chip then track it. Pinch-zoom out (the existing manual zoom) shows more sky. If you'd like, a later step could add a small
  "kite view" inset.
- The tree clearance makes launch spots fairly specific in the tree-heavy meadow. The Highlands and the open fields south-west of
  the farms are the easiest places.
- No coins are earned (kite contests with prizes would need your OK).
