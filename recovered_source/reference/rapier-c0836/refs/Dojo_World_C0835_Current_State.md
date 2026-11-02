# Dojo World C0835 — real Rapier physics boot and browser capture

Recorded 2026-11-02T18:12:36.302464+00:00 (UTC). Isolated, reversible real physics laboratory; **NOT** merged into shipped game. User-provided exact Rapier 0.21.0 package SHA256 `e036e2e958b8d314b5731cbae256d3c4e42198cda8a56bf3b25fce983ded05b4` installed offline. Rapier actual WASM initialized in both Node and Chromium; **18/18 tests passed**, 0 skipped, Chromium JS errors 0. Offline HTML SHA256 `1740c1163fd5a36a46cba83ce270039489af4b612e4160be783ac40fc6c0fcb6`.

## Verified evidence (not proposals)
- Canvas uses live physical RAPIER.World poses on a fixed 60Hz step; user's click starts the staged fall, then capture driver runs two actual physics steps per 30fps rendered frame. **108 PNG source frames** -> H.264 normal 3.6s and same frames H.264 at 0.25x 14.4s. Capture UTC 2026-11-02T18:09:03Z.
- First floor hit: `shinR` at 0.233s; upper-back event later at frame 133 (2.217s); **NOT back-first**.
- Global minimum head clearance -0.0050m (require ≥0.15m). Maximum physically connected wrist/grip gap 0.3002m; maximum skeletal joint-anchor gap 0.1773m; maximum body-center displacement in one 60Hz step 0.2391m. Grip release at physics frame 139.
- Browser emulated mobile tap: Rapier boot, touch throw and 60Hz steps pass with 0 page errors. Physical iPhone NOT tested.
- Foot/COM kinetic chain and Blue left elbow are illustrative; joint angular limits, actual V2 entry, real full-match button-to-throw and anatomically realistic ground/impact unverified. Visual style preserves simplified Fuji 2.5D presentation, but **user has not approved**.
- SHA protected original `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`, accepted V2 `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac`, accepted C0802 `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b`; immutable; none edited.

## Mechanics and next safe change
1. **Balance/COM:** Red currently begins staged near Blue's shoulder; complete V2 kuzushi entry remains to be integrated without teleports.
2. **Support foot:** Blue's stick feet are visual only; future physical support foot must prevent slippage during load.
3. **Kinetic chain:** kinematic Blue wrist drives spherical Rapier constraints, with no anthropomorphic angular stops. Fix constraints instead of retiming pose keyframes.
4. **Grip/trajectory:** joint anchor drift of 30cm and shin first are physics defects. Work first on physically meaningful initial leg posture and joint angular limits; enforce upper-back-first event and actual sleeve reach. No false grip-release easing.
5. **Recovery:** later head-floor near miss violates 15cm head safety. Add anatomically restricted ragdoll response and post-contact head guarding, test no rebound.

**Verdict REVISE / actual physics capture PASS / realistic throw FAIL.** No production merge or user approval. At Nov 3 07:22 CST stop focused throw optimization as directed; next scheduled run after switches to roster. New user-approved direction of introducing Rapier is fulfilled only as isolated working prototype, not production integration.

## Review evidence
Normal: `Dojo_World_C0835_Actual_Rapier_Normal.mp4`, slow: `Dojo_World_C0835_Actual_Rapier_Slow_025x.mp4`, gif, frame sheet, full telemetry `Dojo_World_C0835_Actual_Rapier_Evidence.json`, self-contained runnable offline html `Dojo_World_C0835_Rapier_Actual_Physics_Offline.html`. Review presented at approximately 2026-11-02T18:12:36.302464+00:00 UTC within the user's current chat. On next hourly run after 15min, use their latest verdict or evidence-based revise; no automatic approval.
