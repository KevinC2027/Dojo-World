# Step 20 — Stargazing on the Highlands overlook (v2.23) — PASSED

Build: `dw2/builds/Dojo_World_v2.23.html` (from v2.22, the newest PASSED build). Baseline untouched (`sha256sum -c dw2/BASELINE.sha256`: OK).

## Files changed
- `dw2/builds/Dojo_World_v2.23.html` — new build:
  - `DC_CONFIG.hire.items` gains `{ id: 'telescope', place: 'overlook', price: 10 }` (Kev's PRICES rule). It uses the existing validated
    'hire' debit, so the ledger code and `eco.audit()` needed no change.
  - New module `dw2 v2.23 — STARGAZING ON THE HIGHLANDS OVERLOOK` (`window.HIT_SCOPE`, `?off=scope`; `?scope=night|day|dusk` shows a fixed
    local 22:00 / 12:00 / dusk sky so it can be seen at any hour), appended after the v2.22 module.
- `dw2/tools/scope.py` — new seeded gate test (13 checks, includes an independent Python astronomy re-computation).
- `dw2/PLAN.md` — Step 20 status, run log.

## What was built (reason: Step 20, phase 2 non-combat activity)
- **The viewer**: a green coin-op tower viewer (base plate, post, coin box, binocular head with two lenses facing out west, eyepiece hood,
  "★ 10 DC" plate) on the top tier of the overlook rock (x 94.75, z 112.9, 5.1 m), by the west railing. Red uses it from the spot just east
  of it, on the tier (reached by the existing three stair flights). No collision solid (the tier itself has collision off, as before).
  It sorts with the tier like Red does on a level, then in front of / behind Red by real distance.
- **Paying**: INTERACT "Look at the stars · 10 DC" -> 'hire' debit (place overlook, price from DC_CONFIG); only when the ledger accepts it
  do coins fly to the coin box and 2:00 of viewing start. Short pouch, rate limit and coliseum are refused before any charge.
- **Night / dusk sky (real astronomy)**: 12 constellations — Orion, Big Dipper, Little Dipper, Cassiopeia, Cygnus, Lyra, Aquila, Scorpius,
  Leo, Taurus, Gemini, Canis Major — from 91 catalogue stars (J2000 RA/Dec, true magnitudes, colour tints) plus 31 more bright named stars
  (Capella, Procyon, Arcturus, Spica, Fomalhaut, Canopus, the Pleiades, …) and a 1,500-star faint field (hash-placed filler, not catalogue
  positions, stated in the code). Positions come from sidereal time at latitude 35.7° N with the device's time-zone meridian as longitude,
  so the sky matches the player's own local clock. The sun's real altitude decides the phase: day (> −0.8°), dusk (to −12°, only the
  brighter stars, twilight glow at the sun's azimuth), night. Stereographic 64° finder field, drag to pan; horizon hills, compass points,
  the Sky Tree's silhouette at its true bearing (SSW, 106 m) and the town's lights below the horizon.
- **Find and log**: the viewer asks for one constellation that is up now (centre > 12°, 70% of its stars above 3°), preferring ones not yet
  logged. Tapping it logs it in the per-viewer STAR LOG (first-seen date, times seen; gold figure + name flash) and asks for the next one;
  tapping another constellation names it (blue flash) but does not log it; empty sky logs nothing. HINT gives the direction and altitude
  and an edge arrow / ring. STAR LOG shows all 12 as small charts drawn from their RA/Dec (unfound ones greyed with "?").
- **Daylight**: no stars; the viewer zooms (34°) on the town from the eye 1.5 m above the tier: the real buildings' boxes from the
  collision solids, trees, the Sky Tree (labelled; tapping it names it with its distance), the real sun, distance haze.
- **Rain** (the v2.19 showers): clouds drift over; at night the stars fade out, the viewing clock stops (time kept, "paused" shown),
  taps do nothing, and a new night viewing is refused 'clouds' before any charge. Daytime viewing still works, hazier.
- **The clock** runs only while the panel is open and the stars are not clouded over. CLOSE, a hit taken / Red swinging (tick-exact),
  walking off the spot/tier, the cell or the coliseum close the panel and keep the time left; INTERACT resumes without a second debit.
  At 0:00 the shutter closes ("TIME UP"); the next viewing is a new 10 DC debit. Flavour only: no hp/stat/combat effect, no coins earned.
- No `Math.random` calls in the module (a first version used one for the ledger key; that shifted the seeded random stream other tests
  rely on, so it now uses `performance.now()`), no seeded R() calls.

## Tests run
`python3 -I dw2/tools/scope.py dw2/builds/Dojo_World_v2.23.html --seed 7|11` — **PASS on both seeds**, every check (the module has no
randomness, so both seeds give the same numbers):

| check | result (both seeds) |
|---|---|
| climb | joystick from the road (96, 100): flight 1 -> rock1 (1.7 m), flight 2 -> rock2 (3.4 m), flight 3 -> rock3 (5.1 m), walk to the spot 0.15 m; prompt "Look at the stars · 10 DC"; no solid |
| short | pouch < 10 DC: refused 'insufficient', balance and ledger unchanged, no panel, no viewing |
| night | Dec 20 22:00: one 10 DC 'hire' debit (place overlook), panel open, phase night, 7 constellations up, target Orion (up); tapping another names it, not logged; empty sky nothing; tapping Orion logs it (n 1) and asks a new visible one; 165 stars drawn in view |
| hits | 4 seasons, 25 visible constellations: tap at each figure's middle -> itself 25/25; tap on each of its stars -> itself 179/179; a point 25° above each figure -> never that figure 18/18 |
| astro | 122 catalogue stars x 6 times re-computed in Python by vector rotation: max error 0.000°; Polaris altitude 35.17–36.26° (lat 35.7, Polaris is 0.74° off the pole); noon sun 54.3° / 77.7° / 54.4° / 30.9° at the equinoxes / solstices = 90 − lat + dec; sun dec +23.43° / −23.44° at the solstices; 144 ten-minute samples: phase always matches the sun's altitude, all three phases occur; separations from the catalogue vs published: Vega–Altair 34.19 (34.2), Vega–Deneb 23.84 (23.9), Deneb–Altair 38.01 (38.0), Betelgeuse–Rigel 18.60 (18.6), Castor–Pollux 4.50 (4.5), Dubhe–Merak 5.37 (5.4), Sirius–Betelgeuse 27.10 (27.1), Mintaka–Alnitak 2.74 (2.7) |
| log12 | over 6 nights (Jan–Dec) all 12 constellations logged through the panel; 6 viewings = 6 debits; every entry dated; STAR LOG opens and closes |
| day | Nov 22 12:00: prompt "(daytime: the town)", one debit, phase day, no HINT, tapping the Sky Tree names it, no constellation hit-tests, log unchanged |
| rain | night + shower: clouds 1.0, prompt "clouds hide the stars", INTERACT refused 'clouds' with no charge; clear: paid; clock 120 -> 110 s, shower: stays 110 s (paused, 0 stars drawn, taps nothing), clear again: 100 s; daytime in rain: paid and shown |
| clock | CLOSE after 30 s keeps 90 s ("keep looking (paid, 1:30 left)"), resume no charge; a hit taken closes it, 90 s kept, resume no charge; walking off closes it; at 0 the shutter closes, the next INTERACT is the second debit |
| sky | coliseum: no prompt, look() -> 'area', nothing charged |
| reload | star log and a half-used viewing (78 s left) survive a reload |
| audit | `eco.audit()` ok, 14 debits all 10 DC place overlook, 0 HIT_* module errors |
| errors | 0 page errors |

Regressions (seed 7, v2.23): `omikuji.py` (also a 'hire' debit) PASS; `boat.py` (also 'hire') — 10/10 board, hire charged 150 = 150,
drain OK, 3,000 random ticks 0 hull / 0 swimmer overlap / 0 pier hits, 0 errors; `kite.py` (launches on the same overlook top) PASS.
Note: one earlier `kite.py` run on v2.23 failed its 'pack' check because a townsperson's fight interrupted a relaunch; it is wall-clock
dependent (crowd/rain timing). Re-run back to back with v2.22 at the same time: both PASS with identical results.

## Measurements (`perf.py`, 430x932 @2x, software renderer: compare relative only)
| view | v2.22 fills | v2.23 fills | v2.22 ms (median of 3) | v2.23 ms (median of 3) |
|---|---|---|---|---|
| default spawn | 3,468 | 3,474 (+0.2%) | 52.6 | 52.7 (+0.2%) |
| overlook top, at the viewer (95.45, 112.9) | 707 | 716 (+1.3%) | 41.4 | 40.2 (−3%) |
| viewing (night panel open) | — | 814 | — | 34.6 |

Single runs saved as `step20_2.23_perf_v2.{22,23}_{default,overlook}.json` and `step20_2.23_perf_v2.23_overlook_viewing.json`. Ellipses
and drawImage level; 0 module errors, 0 page errors. Gate (within 15%): met. (The two last code tweaks — ledger key without Math.random,
a wider price plate — came after the perf runs; they do not change what is drawn per frame.)

## Visual evidence
- `step20_2.23_overlook_before_left_after_right.jpg` — the top tier, v2.22 left, v2.23 right (game camera, 2x crop, upscaled);
  `step20_2.23_overlook_full_before_left_after_right.jpg` — the full screens.
- `step20_2.23_panel_night_found_cloud_log_day.jpg` — the viewer: night field asking for Orion, Orion found (gold figure), a shower's
  clouds (clock paused), the STAR LOG, the daytime town view with the Sky Tree.
- `step20_v2.23_telescope.mp4` — 43 s real-time recording (not sped up, no cards): Red climbs the last flight onto the top tier with the
  joystick, walks to the viewer, INTERACT pays 10 DC, two drags around the night sky, HINT, two constellations found and logged, the
  STAR LOG, CLOSE. The headless renderer is software-only, so the video's frame rate is lower than on a phone.

## Regressions / remaining blockers
- None found. Notes: the game camera sits well back at the overlook, so the viewer is small on screen (like Red up there). The sky uses
  J2000 positions without precession (about 0.36° off for 2026) and no Moon or planets.
- Batch Steps 17–20 are all PASSED: the next run writes the next batch.
