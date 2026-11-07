# Independent Movement Qualification — Gate Before Movesets

**Status: GATE SETTLED Nov 6, 2026 — see Settlement below.** 6/24 on the static 0.14 m support screen (the six standing/guard cases pass); all other screens pass. Moveset expansion is unblocked by the settlement. A working two-bone visual rig and repeatable diagnostic scenarios do not establish biomechanical realism.

## Executable demonstrations

Open `movement-review.html` from the same hosted directory as `src/`, `hit-fuji.svg` and `hit-visual.css`. Choose Blue or Red, then one of seven independent 60 Hz scenarios: idle, forward, backward, lateral, reverse direction, stop, and guard. The stationary other fighter is 30 m away and never provides training input. The page uses real `CombatWorld.step()` snapshots and the shared `fighterRig()` presentation function, not a fabricated animation clip.

`src/movement-qualification.mjs` computes quantitative metrics for all 14 cases. `test/movement-qualification.test.mjs` validates deterministic playback, finite joint coordinates, fixed segment lengths and no foot penetration; explicit root travel checks accompany locomotion scenarios. See `test/hit-rig.test.mjs` for attack phase joint constraints.

## Acceptance criteria — all must pass, for BOTH characters

| Test | Minimum acceptance gate |
|---|---|
| Standing and guard | No drifting world-space root; stable weight and no discontinuous jumps on entry/exit |
| Forward/backward/lateral walking | Alternating planted/swung feet; grounded ankle drift ideally <= 12 mm per 60 Hz frame, measured in world coordinates |
| Stop and reverse | Recover balance without stance snapping; realistic acceleration and deceleration |
| Joint reach | Upper-arm, forearm, thigh and shin segment lengths never vary > 1 mm |
| Joint continuity | Reject obvious teleports and elbow/knee pole reversals; flag world-space joints > 0.20 m per tick for inspection, not automatic biomechanical approval |
| Foot-floor contact | Zero observable penetration; support foot actually stays planted while weight transfers |
| Visual signoff | Side-on and three-quarter playback for each scenario reviewed at full speed and slow motion by the creator |

These are prototype screening targets, not research-derived biomechanical validation thresholds. Full naturalness requires skeletal hierarchy, body balance and ground reaction integration; this diagnostic currently uses a simplified procedural presentation rig.

## Settlement — adopted Nov 6, 2026 by Kev

This section amends the gate above. It does not rewrite the acceptance criteria; it records how they are judged, following the Nov 6, 2026 gate-tuning investigation and the reversal/lateral investigation that followed it.

### Basis

The static 0.14 m support screen — the COM must stay within 0.14 m of the support segment on every frame — and the capture-point diagnostic at 0.14 m fail the same 18 traveling cases. The capture point during a 1.4 m/s walk sits ~0.5 m ahead of the COM by physics (v/omega), so a 0.14 m tolerance — a standing-balance number — cannot pass a moving gait on either screen. No capture-point variant tried (horizons 9/12/24 ticks, tail-trimmed, touchdown-frame, recovery margin) passes the traveling cases at 0.14 m, and no threshold was fitted to force a pass.

Note: the 0.14 m tolerance is a default in the qualification code; it was not previously stated in this standard. This section documents it as the gate for standing/guard.

As an informational screen alongside the static one, the dynamic diagnostic separates slow/guarded movement (0.18–0.29 m, as measured in the Nov 6 investigation) from unguarded traveling (0.66–0.83 m), and forward/backward recovery margin passed cleanly (+0.08…+0.13 m — the next step catches the capture point).

### The settled gate

- **Standing/guard** (idle, guard, guardRelease — the 6 passing cases, both fighters): the static 0.14 m support screen remains the documented gate, alongside the criteria above.
- **Traveling moves** (forward, backward, lateral, reverse, stop, guardAdvance, guardRetreat, guardLateral, guardStop): judged by the full screen set — joint steps ≤ 0.20 m, grounded ankle drift ideally ≤ 12 mm per 60 Hz frame, plant-target error 0, no-planted-foot frames 0, segment lengths never varying > 1 mm, zero foot penetration — all passing — plus the dynamic (capture-point) diagnostic as an informational screen, plus visual review by the creator (side-on and three-quarter, full speed and slow motion).
- The static screen does **not** pass traveling cases, and this settlement does not claim it does. Qualification stands at 6/24 on the static screen; all other screens pass.

### The two findings named in the draft — investigated and fixed

The draft named the reversal excursion and the lateral sway overshoot as the two concrete dynamic findings to investigate next, before any moveset expansion. Both were investigated (Nov 6, 2026) and fixed, and both fixes are on the branch:

- **Reversal:** mostly a scenario artifact — the reverse case flipped the commanded travel vector +x → −x in one tick, which no real fighter does — plus one real tracker gap (mid-swing re-aim was distance-only). Fixed by a stepped-turn reversal scenario (60 ticks forward, 40-tick turn, 60 back), a direction-aware re-aim, and a restart-from-stop first launch (committed 61524bd, Nov 6, 2026). Turn-window COM excursion fell 0.47 → 0.16 m (Blue) / 0.50 → 0.19 m (Red); ticks over 0.14 m fell 26/26 → 2/26 / 4/26. **Flag: the reverse case now measures a stop-turn-walk, not an instant flip** — the solo-motion harness cannot command a facing rotation, so the turn is a planted pause of the correct duration (180° at 270°/s), not a visible rotation.
- **Lateral:** a model/metric artifact — the movement was sound (COM caught by every landing, 0.00–0.01 m at every touchdown); the "sustained 1.76 m/s sway" was walk speed, and the negative margins were a touchdown COM-velocity transient. Fixed by rotating the sway axis to travel-perpendicular (committed 61524bd). Lateral recovery margins are now all positive (Blue −0.10 → +0.02 m, Red −0.09 → +0.04 m); lateral COM speed max fell 2.20 → 1.74 m/s (Blue).
- **Backward lead leg** (raised by Kev on visual review of the fix video, Nov 6, 2026): the restart step after the stepped turn landed only 0.07 m behind the root because the stride cap clipped the launch aim. Fixed by shortening the swing when the stride cap clips a first launch after a full stop, and by re-aiming on average speed over the swing (committed 5cf182a, Nov 6, 2026). The restart step now lands 0.30 m behind the root; pure backward walking is 0.30 m / ~13° on every step.

Current numbers (branch head 5cf182a, Nov 6, 2026): 24-case qualification 6/24 on the static screen only; max joint step 112.1 mm (screen 0.20 m); foot slide 0.0 mm; plant-target error 0; floor penetrations 0; no-planted-foot frames 0.

### Effect on sequencing

The sequencing rule below waits on the gate being "established and visually approved." This settlement establishes the gate as documented here. Moveset expansion is unblocked by the settlement — implement and review one basic hand strike per fighter first, then basic kicks, then complete ordinary movesets, per the sequencing rule.

## Sequencing rule

**DO NOT add or expand combat movesets until the independent-movement gate is established and visually approved.** Fix and rerun locomotion defects first. Once approved: implement and review one basic hand strike per fighter, then basic kicks, then complete ordinary movesets, then believable multi-move exchanges, and only then throws/special moves. Existing six clean-room moves stay available for regression but do not count as newly approved animations.

## Observed concerns to investigate

1. Foot swing is driven by elapsed time and instantaneous speed, not a persistent planted-foot world-space target. Skating is plausible and must be measured; do not assert that it is already fixed.
2. Torso twist is small and is not yet driven by feet, pelvis and shoulder force transfer.
3. Statelesness of current `fighterRig()` means stop/reverse transitions may snap or phase-slip.
4. The current mesh is a simple solid silhouette, not true character anatomy or mocap.
5. CI and browser playback for these new cases must be independently checked before stating any numerical test result passed.

## Hourly evidence protocol

Each hour report the 14-case qualification matrix (pass/fail/unverified), identified movement defect, actual file/commit changes, the latest verified CI result, and a captured short actual engine replay clip if available. If recording unavailable, provide the review URL or reproducible instructions, without inventing a clip or pretending visual acceptance.
