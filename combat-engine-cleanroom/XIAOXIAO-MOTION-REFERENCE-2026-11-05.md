# Xiao Xiao motion-reference registry — Blue and Red

**Date:** 2026-11-05 · **Status:** REFERENCE STUDY ONLY; original-video frame measurement **NOT COMPLETE**.

## Provenance and limitation
The original Zhu Zhiqiang Xiao Xiao videos were indexed through [Albino Blacksheep](https://www.albinoblacksheep.com/flash/xiaoxiao/), [Bilibili](https://www.bilibili.com/video/BV1eS4y1J7g2/) and [UltraVid](https://ultravid.io/topic/xiao-xiao/). Playback source files could not be downloaded/decoded by the session's analysis environment. Some providers publish materially different runtimes for the same episode, so **do not invent original frame numbers, timing, velocity, measured angles or contacts** from published video durations or stills. Original video clips are not included and should not be copied into game assets. Work uses general motion-design insights, not copyrighted choreography or code.

## Episode-by-episode application matrix

| Episode | Reference purpose | Blue (Kung Fu) candidate | Red (boxing-inspired) candidate | Footage annotation to complete |
|---|---|---|---|---|
| #1 | Readable one-on-one silhouette, transitions | Kick entry and credible landing | Direct strike-to-guard | Stance/startup/contact/airborne/landing/recovery |
| #2 | Input commitment and jumping/response readability | Grounded push-off, extension and landing | Guard/retreat response | Game input cue vs frame of motion onset |
| #3 | Continuous fight flow, changing targets and attack lines | Foot-led pivot, chained strikes and range change | Check/counter/reacquire distance | Per-exchange foot anchors, contact, opposing reaction |
| #4 | Interactive threat signalling, less useful for unarmed melee | Anticipation/facing only | Cue/response readability | Cue and response frames; no shooting feature transfer |
| #5 | Clear alternation of actions and reactions | Blocked attack -> pivot -> new attack line | Guard -> compact counter | Block, turn, support transfer, reset |
| #6 | Player input into visible movement state | Button-to-attack commitment | Startup/active/recovery continuity | First visible change and action boundaries |
| #7 | 3D / three-quarter body action | Whole-body turn-in, planted rotation | Depth-aware tracking while guarding | Facing, feet, trunk and shoulder alignment across views |
| #8 | Pursuit -> stop -> direction change -> fight | Support-preserving enter/exit attack | Stop/reverse/re-entry | Deceleration, pivots, foot contact, recovery |
| #9 | Playable beat-em-up responsiveness | Readable attack variety and grounded kicks | Direct combinations with purposeful guard | Input/active/contact/whiff/block/recovery |

Commercials CityPlaza and Heineken variations are secondary context; fan edits and unrelated works are not original episode evidence.

## Required whole-body motion grammar
Each attack is a continuous physical transaction: **intent and range -> grounded support transfer -> pelvis/trunk rotation -> extremity action -> verified contact or miss -> defender's balance/guard reaction -> recovery, pursuit or retreat**. At 60 Hz carry planted foot anchors, root position and velocity, orientation, solved joint poses, contact constraints and opponent trajectory across *every* state handoff. Do not update one neighboring pose without preserving boundary continuity. A character may not float, teleport or stretch limbs as a substitute for animation. The camera cannot be used to hide bad foot support.

**Blue:** spatially angular entries, hip-led movement and kick support with controlled recovery. **Red:** direct hand combinations, opposing-hand guard, trunk/hip power transfer, grounded slips and pivots. Red's existing kicks stay unchanged until creator approval.

**Rendering/game constraints:** retain HIT/Fuji cherry-blossom scene, blue/red solid figures, no health bars, deterministic server-authoritative combat and fixed limb segment lengths. References inform original animation, not imported art, timing or source code.

## Required completion of real per-frame measurements
For each actual episode file: record SHA-256, decoded FPS/count/duration, duplicate frames, scene cuts, frame timestamps, visual-tracking confidence, and hand-confirmed start/peak/contact/reaction/recovery frame indices for representative moves. Mark support foot plants/releases, body rotations, and 2D occlusion. Pixel displacement is not physical meters; encoded FPS is not necessarily original Flash animation FPS. Distinguish animation exaggeration from believable body kinetics. The separate OpenCV analysis kit generated during this session was validated on a **synthetic** 60-frame, 20-FPS clip only; its automatic movement peaks are *review candidates*, not strikes or collisions.

## Dojo World qualification
Respect `ANATOMICAL-MOVEMENT-STANDARD.md`, `MOVEMENT-QUALIFICATION.md`, `HIT-VISUAL-STANDARD.md` and `ARM-POSTURE-REVIEW-2026-11-05.md`. Current recorded local tests (164/164) and static support flags (18/24 moving cases) are **not** full visual or balance sign-off. Do not add ordinary moves until both fighters' independent movement is qualified from actual source-driven side and three-quarter playback.

Candidate first engine-only fixture: Blue advance->stop->pivot->guarded step->one strike->recovery against Red retreat->guard->short slip/pivot->one counter, measuring both bodies simultaneously. This is a proposed test, not a passed result.
