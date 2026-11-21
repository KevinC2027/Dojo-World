# Bushes revamp — build v2.5 (Kev's request, Nov 21: "The bushes need to be revamped with the rest of the game")

Built from `dw2/builds/Dojo_World_v2.4.html` (Step 3 PASSED build). Baseline untouched (sha256 OK).

## Files changed
- `dw2/builds/Dojo_World_v2.5.html`: only `SC.bush` was replaced (plus a new `SC.BUSHPAL`).
  - Before: three flat stacked circles per bush, plus a few dots, all drawn live.
  - After: the same foliage style as the realistic trees. A dark core dome so no gaps show, then 4 rings of drooping leaf
    clusters (3-tuft fans, two-tone tips, rounded caps, leaf-dab texture when big on screen). Sun from the upper left,
    gentle wind sway that grows with height, and a soft contact shadow. Each bush varies (width, height, one of three green
    tones), and about half of them flower with pink or white blossoms. Drawn through the tree sprite cache (`SC.tierCache`).
  - Bush positions, sizes, the prop list and the FRW shadow wrapper are unchanged. There are 4 bushes in the world:
    (35, 3.9) and (44, 3.9) by the bank, and (18, −8) and (58, −8) on the south road.

## Measurements (perf.py, 430x932 @2x, software renderer, views settled 6 s after teleport)
| View | v2.4 fills | v2.5 fills | v2.4 ms avg/p95 | v2.5 ms avg/p95 |
|---|---|---|---|---|
| Default spawn | 3,446 | 3,445 | 46.3 / 66.7 | 48.7 / 83.4 |
| Bank (Red 39.5, 1.5) | 3,929 | 3,910 | 59.2 / 100 | 66.9 / 100 |
| Plaza / south road (Red 18, −11) | 4,398 | 4,361 | 55.5 / 66.7 | 47.9 / 66.7 |

The bank-view frame time from perf.py swings ±15% from run to run (repeat runs: v2.4 54.7, 54.5; v2.5 67.7, 55.7).
A steadier 3×30-frame probe at the bank view gave v2.4 47–52 ms vs v2.5 46–49 ms, with 0 sprite re-draws in both. So the
bushes cost slightly fewer fills than before and frame time is unchanged.

## Gate (same rule as later steps: fills/frame and frame time within 15% of the previous PASSED build)
Met: fills are −0.5% to −1%, frame time is within noise. 0 page errors, 0 module errors, and `SC.TC.err` is null.

## Visual evidence
- `v2.5_bushes_closeup_before_after.jpg`: 4 test bushes placed by the Sky Tree for a clear close view (test only; not in the build)
- `v2.5_bushes_bank_before_after.jpg`, `v2.5_bushes_plaza_before_after.jpg`: the real bushes in place
- `v2.5_bushes_walk.mp4`: 26 s real-time walk past the bank bushes and the south-road bush. Headless Chrome renders in
  software, so the frame rate is lower than on a phone.

## Notes
- The flat south hedge line (`gq(...)` ground strip at z −25) is a painted ground band, not a bush prop, so it was left as is.
