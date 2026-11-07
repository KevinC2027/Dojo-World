# Support transfer diagnostic - 2026-11-05

Development basis: 63fc4aa2ee8b3c7e6e7132e260d8c74032e6970d. No legacy code used.

The creator requested correction of all 24 static-support cases. This increment does not yet meet that request. The static screen uses estimated center-of-mass distance to a planted ankle or the line between planted ankles, with a 0.14m engineering tolerance. A moving person may be dynamically balanced outside that static region; passing the screen alone does not prove physical balance.

## Increment

The full-body audit and 24-case matrix report `worstSupport` / `worstStaticSupport`, giving actual replay tick, measured offset, planted sides, and gait mode. A regression checks every reported result directly against the source frame for both fighters and all scenarios. This is diagnostic instrumentation; it does not alter body movement, combat rules, support thresholds, or the HIT/Fuji visuals.

## Local execution

- `npm test`: 165 tests passed, zero failed. No new GitHub Actions run is claimed.
- `node src/solo-qualification-matrix.mjs`: 24/24 geometry, 24/24 provisional joint continuity, 6/24 static support. All 18 moving scenarios remain flagged.
- Worst Blue forward: tick 1, 0.396658m, side +1 planted. Worst Red reverse: tick 102, 0.409673m, side +1 planted. These are screen values, not human balance measurements.
- Experimental support-side sway 0.10m: 162/164 local tests passed; attack and whole-body height continuity failed. Static support stayed 6/24 and some lateral cases worsened. Rejected and reverted.
- Experimental sway 0.07m: 163/164 passed; whole-body height continuity failed. Static support stayed 6/24 and Blue lateral worsened. Rejected and reverted.

Full trial output and complete trial sources are included in this update's Claude error-review PDF. The final diagnostic revision does not include either motion trial. Visual qualification and creator signoff remain open. No deployment or moveset expansion was made.

## Next

Use the worst tick and support-side data to investigate pre-liftoff weight transfer, then maintain body, support, in-flight foot and next pose continuously across acceleration, stop and reversal. Evaluate actual planted-foot drift, reach, natural leg extension, dynamic momentum, both fighters, and side/three-quarter footage. Do not inflate static tolerance to manufacture a pass.
