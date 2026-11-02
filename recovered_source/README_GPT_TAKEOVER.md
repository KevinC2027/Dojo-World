# Dojo World — Combat Takeover Candidate v1
**Status:** ISOLATED EXPERIMENT, NOT APPROVED FOR PROMOTION. No change to the preserved live `index.html`.

**Date:** 31 October 2026 handoff; prototype evaluated from the uploaded snapshot.
**Source:** `index.html` SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`.
**Candidate:** `candidates/gpt-throw-trajectory-v1.html` SHA-256 `b343b6fafd05754cdd96651c385fc2144bed4c74522b630a4809a8872f2c068b`.

## Engineering changes
1. Replace the shipped-throw victim-foot straight-line carry chord with a hip-relative spherical-arc trajectory between the **same** initial and final foot targets. This avoids passing the feet close to the pelvis in mid-carry.
2. Reconstruct carried elbow and knee positions from the two-bone inverse-kinematics geometry and a transported bend plane (with an alternate spherical pole solution for the Red-victim legs), instead of directly blending joint points. Segment lengths are preserved in the carry window.
3. Retiming of shipped carried torso/head/arm endpoints from smoothstep to linear progression while retaining exact terminal targets, to lessen the Red-victim head discontinuity.
4. Add a short six-tick pose transition from shipped carry to flight, with anatomical bend-plane recomputation. Existing ippon interpolation logic remains unchanged.
5. No changes to approved grab-and-punch control binding, damage, round/health display, attack hit boxes, knockback velocities, collision rules, or environment.

## Quantitative comparison — exact shipped inputs, 60 Hz probe
| Metric | Live Blue throws Red | Candidate Blue throws Red | Live Red throws Blue | Candidate Red throws Blue |
|---|---:|---:|---:|---:|
| Peak victim joint step **during carry** (m/tick) | 0.278 | 0.237 | 0.379 | 0.245 |
| Peak victim limb-segment deviation **during carry** (m) | 0.263 | 0.000 | 0.416 | 0.000 |
| Peak victim joint step **all phases** (m/tick) | 0.318 | 0.318 | 0.379 | 0.318 |
| Grip at release (m) | 0.205 | 0.182 | 0.148 | 0.148 |
| Release tick | 15 | 15 | 15 | 15 |
| Touchdown tick | 36 | 36 | 36 | 36 |
| Flight duration (ticks) | 21 | 21 | 21 | 21 |

**Still blocked:** The absolute 0.20 m/tick continuity gate remains failed. A 0.318 m elbow step near air touchdown persists on both shipped throws. Blue carry also peaks at ~0.237 m/tick and Red at ~0.245 m/tick. The candidate is not promotable under the existing gate.

## Checks completed
- Exact source hash: PASS, original `index.html` not modified.
- Six-run full defect diagnostic: completed; original forced ippon and shoulder variants compare **exactly byte-for-byte in structured run outputs**, candidate differs only on shipped styles.
- Movement authority: PASS (no hard flags).
- Deterministic replay / input authority comparison: PASS.
- Rapid sequences: PASS (timed 4/4; mash 53 presses -> 7 fires).
- New genuine G+P real-input smoke harness: PASS both styles at 0.75 and 1.15 m; damage 22 (HP 100 -> 78), carry -> air -> down -> getup -> idle; no non-finite state; whiffs at 1.40 and 1.50 m.
- Existing DQ99 KO probe: PASS both directions.
- Existing DQ101 throw mechanics probe: red PASS, blue FAIL because the pre-existing thrower-hand heave is 0.092 m below its 0.100 m threshold (improved from prior baseline where both directions FAIL).
- Existing DQ98 evasions probe: FAIL for both original and candidate; not introduced by this change.
- Forced ippon constraints: existing failure, unchanged; not bound to gameplay.
- Old `probe_input_buffers.cjs` graphical diagnostic: not run (missing original native canvas binary/absolute dependency path in uploaded package). Existing real G+P input path separately exercised by the new smoke harness.
- Full AI-versus-AI match and real iPhone/Chromebook device playtest: not run; no device claims.

## Additional discovered baseline discrepancy
At starting separation 1.30 m, the authentic G+P input misses in **both** the original and candidate, whereas the prior handoff suggests 1.30 m should connect. At 1.15 m both connect. This discrepancy is an **existing range issue**, not a new change. Do not alter range without specific review.

## Before/after preview
`Dojo_World_Combat_Before_After.mp4` is a **scripted Chromium browser** rendering of actual G+P input in both throw directions, comparing the original snapshot to the candidate. The test is not footage from a physical mobile device or a human playtest.

## Recommended next candidate
Finish cross-phase continuity at the **air-to-touchdown elbow** (0.318 m/tick) and the remaining sub-0.25 carry joint peaks using a continuous trajectory (not per-tick joint clamping); then rerun the full defect dump and the smoke/replay/authority probes. Preserve the original damage, reach, controls, and output authority. Do not implement or bind ippon until separately authorized.

**Approval rule:** The original live build stays canonical. Any promotion must be explicitly authorized by the user after visual review and full gate evidence. This package does not promote anything.
