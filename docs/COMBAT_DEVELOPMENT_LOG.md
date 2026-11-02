# Dojo World — Continuous Combat Development Log

Status: initialized 2026-10-31. This file records work that actually occurred. No fictional run or predicted test result may be logged as completed.

## Initial governance entry — 2026-10-31
- Goal updated by user: complete both fighters' move sets; prove authentic, repeatable real-input combat sequences; then develop special moves.
- Protected shipped source: `index.html` SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b` (verified against uploaded source).
- Preferred visual reference: V2 ippon shoulder throw; user rejected V3/V4 throw trajectories and supplied back/shoulder-first impact pose photo.
- Existing core roster inventoried from engine P/K/L/T and style counters. Registry status: IMPLEMENTED_UNVERIFIED_REALISM for all 20 style/variant records; no new source build was produced by this governance entry.
- Acceptance rule: user final signoff; 15-minute no-response permits provisional isolated-candidate advancement after reference and actual motion review at next scheduled cycle; never auto-merge live build.
- Next actual engineering task: capture a roster-wide movement/attack baseline and fix the highest-impact repeatable defect, beginning with V2 throw landing while avoiding a permanent single-move bottleneck.

## Isolated landing study — 2026-10-31 22:10:02 CDT (2026-11-01T03:10:02Z)
- **Move:** `BLUE-IPPN-V2` experimental ippon study; `BLUE-T0` remains an unverified shipped move, unchanged and not rebound.
- **Biomechanics plan, before coding:** preserve Blue's V2 balance and planted support; preserve pull/hip/shoulder chain through the load; tuck Red's head, keep the legs raised at shoulder landing, and guide the free hand above the mat; let the legs settle without changing recovery timing.
- **Source hashes:** shipped `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`; V2 `eb90e76c621187408939eb15cfc0ece887e70ad9ba8b08e5ac2c47b56301a8ed`; first failed revision `8831850d9b2465135bdc309cbce997979b19e15aa9c205f536105c9bad21646b`; second isolated candidate `e6643d50000d61cabdd20642b4336aa157fce9e80fd8eaa139545f7b5135b073`.
- **Changes:** late head tuck, leg descent and shoulder height, then free-hand floor clearance. First revision dipped the free-hand center 0.071 m below ground at frame 65; that failed source and results are retained in the evidence ZIP. V2 world-space joint positions at frames 0–44 remain identical.
- **Measures:** 60 Hz max joint step 0.196907 m, zero steps over 0.20 m; maximum measured segment-length error 0.007468 m. Geometric shoulder-contact proxy at frame 65: head sphere 0.063821 m above plane; foot centers 0.951/0.981 m above plane. V2's head-sphere proxy first crosses the plane at frame 57. These are pose approximations, not collision physics.
- **Blocking failure:** sleeve separation first exceeds 0.10 m at frame 45, before the frame-65 shoulder contact; separation is 2.233 m at the contact proxy. REVISE, never advance or bind this candidate as a finished throw.
- **Regressions:** VM replay, movement-authority and rapid-sequence outputs match the shipped engine apart from hash/path metadata. VM UI smoke tested replay, half-speed, normal-combat switch and normal G+P damage 100→78. Browser, physical devices, real touch controls, ippon input-to-impact, dynamics/contact and full match not tested in this iteration.
- **Artifacts:** `Dojo_World_Ippon_Landing_Study_20261031_2204.html`, `Dojo_World_Ippon_Landing_Study_20261031_2204.mp4`, `Dojo_World_Ippon_Before_After_20261031_2204.png`, `Dojo_World_Combat_Evidence_20261031_2204.zip`. Video uses scripted actual canvas renderer; not user gameplay.
- **User approval:** not granted. **Autonomous advance:** none. **Presentation time:** pending actual conversation delivery; no delivered-time claim or 15-minute review timer has been made.
- **Next:** solve reachable arm/shoulder coupling and planted or stepping follow-through in an isolated revision, while auditing the complete roster.

## User correction and downward study — 2026-10-31 22:28:35 CDT (2026-11-01T03:28:35Z)
- **User correction:** Red is still being tossed forward instead of slammed into the ground. Prior candidate's outward finish requires revision; preferred shoulder-load and pivot stay as reference.
- **Five-point motion plan:** preserve the loaded stance; plant Blue's feet; use knee/torso/arm follow-through to guide Red down; retain reachable sleeve control until the landing, with Red's head clear and feet raised; settle the legs and recover Blue's stance.
- **Hashes:** protected engine `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`; prior study `e6643d50000d61cabdd20642b4336aa157fce9e80fd8eaa139545f7b5135b073`; new isolated candidate `3d8f802205c75b402b3e912085ce4952d261997936d21a1504461db5f0a8bff3`.
- **Authored trajectory:** frame 43→65 Red pelvis horizontal travel reduced from 1.37 m to approximately 0 m while descending 1.26 m. The final downward step is 0.1083 m versus 0.0107 m in the previous eased landing. This is authored pose geometry, not a force simulation.
- **Contact measurements:** grip gap 0.0411 m at frame 64, exceeds 0.10 m at frame 65; shoulder-contact proxy frame 65, head sphere clearance 0.0638 m, both feet centers 1.18 m above plane. Blue support-foot drift 0 m across frames 38–73.
- **Anatomy measurements:** max 60 Hz joint step 0.1818 m, no steps >0.20 m; max limb-length error 0.00747 m; Red's minimum carried knee angle 95.99°. After impact Red's minimum knee angle is 30.50°: keep ground recovery under review. 3D fighter interpenetration is not instrumented.
- **Regressions:** Node VM replay, movement-authority and rapid-input outputs match the shipped engine apart from metadata. Mocked UI replay/slow/normal control and ordinary G+P damage 100→78 passed. The new ippon remains unbound; real input-to-impact, browser/mobile emulation, physical devices, collision dynamics, and full match remain untested.
- **Artifacts:** `Dojo_World_Ippon_Downward_Control_20261031.html`, `Dojo_World_Downward_Slam_Study_20261031.mp4`, `Dojo_World_Downward_Slam_Comparison_20261031.png`, `Dojo_World_Downward_Slam_Evidence_20261031.zip`. The video is a scripted render at half speed, not human gameplay.
- **Verdict:** new candidate awaiting user review; no autonomous advance or live promotion. The earlier outward toss is revision-requested. **Presentation time:** pending actual delivery, no review timer claimed.
- **Next:** inspect post-impact leg recovery and body contact, then continue roster-wide auditing; special moves remain deferred.

## User approval of isolated ippon study v2 — recorded 2026-11-01T04:35:36+00:00
- **User verdict:** explicit **“I approve this”** immediately after pasting v2 HTML. Approval applies to the supplied isolated visual study and its aesthetic/throw sequence; **not** to production engine integration or a claim of physically proven gameplay.
- **Immutable approved reference:** `Dojo_World_Ippon_Seoi_Nage_User_V2.html` SHA-256 `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac`. Preserve without edits. Previous downward candidate `3d8f802205c75b402b3e912085ce4952d261997936d21a1504461db5f0a8bff3` is kept in history as unapproved/revise; shipped `index.html` hash unchanged (`786ac6bf...`).
- **Browser smoke performed:** Chromium rendered supplied HTML through in-memory set_content without page errors. Self-check reports grip gap with full grip weight at machine epsilon, leg segment chain 0.9 m across samples, first held=false frame 2.0667 s, nominal impact 1.84 s, min head clearance 0 m (floor clamp). Six exact-frame canvas screenshots saved as a reference montage. NOT a video of genuine gameplay.
- **Important new inspection result:** grip gap frame 55 (t=1.8333 s) virtually zero, but frame 61 (t=2.0333 s) has gap ~0.645 m while `held=true` because release blending and held status diverge. Red root floor correction at frame 55 ~0.310 m. Requires further engineering tests; user visual approval remains intact.
- **No code edits to submitted study, no live integration, and no production deployment.** Full input-driven and physics/collision tests still unrun.
- **Next:** treat supplied v2 as golden visual reference; develop isolated constraints and accurate release/contact instrumentation, then audit Blue/Red full move sets.

## 2026-11-01T04:45:39+00:00 — Style bridge pre-midnight integration cycle
- Source: shipped original SHA `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b` verified from original seed ZIP; user-approved V2 isolated study SHA `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac`.
- Biomechanics reasoning before integration: center of mass / hip path from approved v2 unchanged; Blue's v2 supporting feet mapped into world; shoulder/pelvis & hand IK are converted to original figure coordinates with no change to the v2 pull/load/throw keyframes; visual follow-through is drawn by legacy renderer; recover pose remains v2, physical ground collisions unverified. The adapter does not claim new biomechanical physics.
- Work: produced new isolated runnable full original-style engine HTML with opt-in preview mode (default) and legacy normal gameplay switch `?mode=playable`. Preserved original `drawF` stick style, Fuji scene and visual geometry. Source hash `970d1cc12d2b269bfa7e9c012ea37fb691e3ad9509bdda0262d405a0fe23b773`.
- Tests: render 108 frames at 30fps; browser page errors 0; desktop scene/legacy controls toggling smoke passed; mobile emulated browser canvas and preview controls present. Pre-impact grip distance ~zero. 960x554 MP4 and GIF exported; frame sheet created. Not tested: physical device, physics impact, actual button input for the imported throw, full-match regression.
- Review: **PRESENTED** at `2026-11-01T04:45:39+00:00`. Proposed verdict remains REVIEW_REQUIRED. 15-minute no-response fallback applies at next hourly cycle. User-approved v2 mechanics and shipped original remain immutable, not promoted.
- Next scheduled work: focus on an isolated input-driven contact / recovery / state-transition bridge for G+P and roster audit, not art style redraw. Verify release-window grip semantic defect before any gameplay integration.

## Touch usability defect repair — 2026-11-01T05:04:30+00:00
- User reported: "The html isn’t usable." Reproduced design defect in prior input-gate file: default mode rendered an automated study; actual command harness required URL query and keyboard input, inaccessible through obvious iPhone controls.
- Isolated new deliverable: `Dojo_World_Touch_Playable_Throw_Lab_20261101.html`, SHA256 `b9a1d89e8ab9ced36f310c7002da34c4c838e2736343c040787ae93422ed7ba0`. The source preserved original 2.5D render and v2 mechanical trajectories, adding touch controls for spacing, Red guard toggle, G+P throw, reset, and in-page lab/study/original-game switching. No production bind or shipped engine rewrite.
- Pre-change biomechanics plan: (1) preserve hip/center-of-mass path, (2) preserve planted Blue support leg geometry, (3) preserve approved lift/turn force-sequence keyframes, (4) only gate grip/throw by visible spacing and Red guard, with a smooth 0.4s entry spacing blend; (5) retain existing v2 recovery timeline and explicit reset. Mechanical changes constrained to a reversible UI harness; no physics simulator is claimed.
- Verification: actual Chromium Playwright touch emulation in 390x844, 844x390, and desktop 1200x800; tested whiff when out-of-range, approach, guard refusal, accepted throw animation progression, reset, studio/full-motion player view, original playable mode and returns. All PASS with no JavaScript errors. No horizontal overflow in all three. Evidence JSON and mobile screenshot saved.
- Limitations: physical device not tested, ChatGPT HTML preview behavior unverified, no genuine real-match input-to-impact or collision physics, known v2 release semantics unresolved. Candidate provisional and user-unreviewed.
- Next: get user confirmation controls open in their iPhone browser; improve discrete throw collision and recovery in isolated game mode, then multi-move genuine-input exchange tests.


### 2026-11-01 03:00 CT — cycle 4 — REVERT
Read charter, source seed, playbook, registry, latest grip audit and v2 reference. Isolated timing change synchronized Blue/Red grip release over 0.10s before T.release, source SHA256 60a970ea80ef2daf6482aef8e78227b0814ce6c5bfab04d1aace9a77e09ea4be. Chromium sampled 108 frames with no page errors; grip reach failure frames 2 -> 1, but max Blue hand displacement at 30Hz rose to 0.553m at frame 57, far above 0.20m/60Hz continuity gate. **REVERT**, no promotion. Real collision, 60Hz full joint tests, device unrun. New browser input gameplay capture MP4/GIF from prior playable original mode, keyboard D/J/K/L; footage does not demonstrate the experimental throw. Next: continuous IK constraint and 60Hz per-joint tests before another throw release change. Shipped original 786ac6bf and approved V2 c098b240 unchanged.

## 2026-11-01 06:00 CST — isolated grip truth + touch capture
- Pre-code five-point biomechanics: Balance: preserve V2 hip/COM. Plant: preserve Blue support-foot tracks. Chain: preserve leg-to-hip-to-torso-to-sleeve motion unchanged. Grip: classify connected only when gap <=0.10m, not just pull weight; do not move joints artificially. Recovery: preserve V2 authored return and keep live collision unverified.
- Candidate SHA256 `47e035d1722cad568ceebb9767cf8032d2318f52bb981198e61f32a10ef350f0`. Branch from touch lab; changed only grip `held` semantics and exposed reach violation telemetry. Approved V2 and shipped engine untouched.
- Chromium mobile emulation: real DOM touch button produced initial whiff at 0.97m, then accepted throw after two step-closer taps at 0.57m. No JS errors. 108 authored animation frames captured from original visual renderer. 2 reach violation frames (60,61), 0 falsely connected grip labels after instrumentation. This does NOT fix the 2 reach violations or demonstrate physics collision/live match.
- Evidence: `Dojo_World_Grip_Truth_Touch_Candidate_0600.html`, `test.json`, `Dojo_World_Input_Gated_Throw_0600.mp4`, `_Slow.mp4`, `.gif`, contact sheet. Footage is button-triggered authored animation in original-game style, NOT full genuine combat engine integration.
- Verdict REVISE; no candidate promotion. 60Hz full joint/leg/contact tests, physical iPhone, multi-move unscripted match UNRUN. Next: physically constrained grip coupling in isolated real input state machine; move toward complete roster audits.


## 2026-11-01 07:00 CST — C0700 — REVISE (isolated only)
- **Evidence vs reasoning:** Actual Chromium 60Hz sampled 216 poses; two independent sleeve hands now share a feasible grip anchor constrained by both shoulders' two-bone arm reach discs. The desired biomechanical reason is an uninterrupted sleeve connection during Blue's planted pivot and downward shoulder follow-through; physical momentum and actual back-first contact remain unproven.
- **Five-point pre-code reasoning:** (1) Keep V2 pelvis/COM trajectory; (2) preserve both Blue foot plants; (3) preserve legs→hips→torso motion and solve arm geometry from shoulders; (4) solve one common grip anchor in reachable shoulder intersection, release when geometrically impossible, blend after nominal 1.84s impact; (5) preserve authored stance recovery. No root-coordinate hacks or shipped edits.
- **Source:** Dojo_World_Reach_Coupled_Grip_C0700.html SHA256 f53c4cd83015e2bd2cf1385a5ae08ab080f6e8a407f3879868c814e35b04844b. Protected shipped SHA256 786ac6bf… and user-approved V2 SHA256 c098b240… unchanged.
- **Observed tests:** baseline 60Hz sample grip violation 4/216 vs candidate 0/216; pre-impact max gap ~0; max blue hand step 0.2608m→0.1357m; touch whiff at 0.97m then accepted at 0.57m; zero page errors; 60Hz max any joint displacement 0.7727m with 8 joint steps above 0.20m; fixed leg lengths max deviation 2.78e-16m. Head bottom minimum near zero, not verified head clearance at impact.
- **Verdict:** REVISE, **not user-approved**, **not autonomously advanced**. The shoulder/arm IK branch still flips elbows at frames 33/36/52/57 and has 0.7727m 60Hz discontinuity. Grip truth improved but continuity gate failed. No full-match genuine-input throw, physical contact, 60Hz angular floors or iPhone device validation.
- **Video:** fresh normal and 0.25x MP4 from actual DOM touch-accepted isolated throw lab, then deterministic renderFrame sampling of the authored animation; NOT true gameplay physics or a live match. GIF and 8-frame sheet attached.
- **Next:** stabilize elbow bend sign and reach-constrained arm continuity before any isolated advancement; then test shoulder/back-first impact, head clearance and genuine move-to-move exchange.


## 2026-11-01T13:27:32.679310+00:00 — C0801 — SOLVER PASS / THROW REVISE
- Read full Charter/seed, v1 playbook/registry/log, newer C0700 snapshots, reviewed actual HTML and user-supplied Unity `TwoBoneGripIK`. Verified protected source SHA256 786ac6bf... and approved isolated V2 SHA256 c098b240... unchanged.
- Observed root cause: C0700 Blue gripping elbow sign(dot(perp,animated bend hint)) reverses, six >0.2m 60Hz pose jumps; the wrist also passes 0.038m from shoulder at t≈0.80s, violating comfortable elbow folding.
- Implemented independent, reversible HTML/JS C0800 (stable bend side; 6→0 large jumps but failed elbow angle floor), then C0801 min-fold/continuous pole-angle update. C0801 SHA256 6c71373d646f81548d55357a647181f9c37db7d046a16f05b9b7067e0593f20c.
- Five-point reasoning: preserve V2 pelvis/COM, feet, leg-to-hip-to-torso chain; constrain one shared grip anchor with min elbow bend 30deg and exact arm lengths; retain recovery and report unverified landing. No head/root teleport/hack, no production bind.
- Tests: 217 pose samples 60Hz, max joint step 0.18107m vs baseline 0.77272m; elbow peak 0.10675m vs baseline 0.77272m; >0.2m failures 6→0; arm deviations 0; grip reach failures 0; min Blue grip elbow angle 35.72° vs baseline 4.75°. Touch DOM: initial whiff and accepted throw after 2 approaches. Desktop render and mobile emulator browser errors 0.
- Normal and 0.25× MP4, GIF, comparison sheet captured from actual touch-accepted isolated animation. This IS NOT live full-match input-to-impact or physically grounded collision. Shoulder center 0.409m at nominal impact t=1.84s, no proven back-first impact; physical iPhone unrun.
- Verdict SOLVER CONTINUITY PASSED. Overall throw REVISE until contact and real combat integration tests pass. User approval for this candidate: NONE, autonomous advancement NONE. Review presented_at assigned on user-visible delivery.
- Next highest-value: back-first collision test and playable input-to-impact bridge in isolated game while auditing other core moves, rather than retuning grip easing again.


### 2026-11-01T13:42:42.449829+00:00 — C0802 ANATOMICAL ELBOW DIRECTION FIX (isolated)
**User feedback:** C0801 elbow visibly bends in reverse; considered anatomically incorrect despite earlier continuity success. **Source** SHA256 `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b`.
**Actual change:** one isolated authored JS source patch switches the fixed Blue gripping-elbow side in the continuous two-bone analytic solver (`-1` to `+1`); all approved V2 pose keys, shared grip anchor and original game visuals preserved. Five-point biomechanical reasoning is logged in C0802 playbook.
**Evidence:** 217 at 60Hz; wrong signed elbow bend samples through impact 111→0; joint discontinuities >20cm remain 0, max studied joint step 0.1357m, zero arm/leg length or grip failures; Chromium mobile emulator throw/guard/whiff interactions passed, JS errors 0.
**Video:** Dojo_World_C0802_Normal.mp4, Dojo_World_C0802_QuarterSpeed.mp4 (same original frames 0.25×), GIF. Comparison frame sheet positions are indexed via deterministic renderFrame calls, not async playhead capture.
**Verdict:** elbow plane regression tests PASS, visual approval pending. No claim of physiologically complete elbow articulation or physically credible upper-back impact. Game release still blocked and user-approved V2 source immutable.
**Next:** user visual review; back-first shoulder contact/collision plus match input→throw→recovery; audit roster.


### 2026-11-01T13:46:20.961876+00:00 — C0802 USER VISUAL APPROVAL (NO NEW CODE BUILD)
- **Direct observed user verdict:** “Much better. I approve” in response to C0802 elbow bending correction visual preview. Explicit **USER APPROVED** for C0802 visible elbow direction/overall revised throw animation; this supersedes prior C0802 `VISUAL_REVIEW_PENDING`.
- **Frozen isolated candidate:** `Dojo_World_Anterior_Elbow_C0802.html`, SHA-256 `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b` — file bytes verified unchanged. C0802 normal/0.25× videos and comparison are review artifacts.
- **Scope boundary:** This approval does *not* establish real 3D anatomy, physical upper-back-first ground collision, full-match gameplay binding, special moves, or deployment. Shipped engine SHA256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b` and original user-approved V2 SHA256 `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac` are immutable.
- **Prior C0802 measured evidence (not retested on this approval-only turn):** 217 samples at 60Hz, wrong-side elbow samples 111→0, 0 grip-reach violations, 0 limb-length violations, 0 joint jumps over 0.20m; browser touch whiff/guard/in-range tested. Do not claim new test/build here.
- **Next action:** Preserve C0802 elbow direction; quantify and correct Red upper-back-first impact/head clearance/leg elevation with continuous momentum, and run real button-driven multi-move exchange regression in isolated source. Resume normal and 0.25× video updates for actual future engineering iterations.


## C0825 — 2026-11-02T12:02:52+00:00 (2026-11-02 06:02 CST) — REVISE/THROW_BLOCKED
- Read persistent Charter, source ZIP, v1 Playbook, v1 Registry, master Log, C0824 and C0816 HTML, C0802 approved visual reference and IMG_7944 landing still, last user critique about Chromium and real impact evidence. Verified shipped original SHA256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`, approved V2 source `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac`, C0802 `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b`.
- Observed defect: C0816 contact solver cannot claim physical contact; nearest upper-back proxy across 21 offsets remains 0.364m from ground and one later Red gripping-hand joint step jumps >0.2m. Proposed root-cause reasoning: missing authoritative collision surface and release transition; cannot be solved by scalar grip easing.
- Five-part pre-change reasoning: Blue weight/COM unchanged; two support feet unchanged; leg→hip→torso→shoulder pivot unchanged; keep one reachable sleeve constraint and test down-arc/contact instead of faking coordinates; recovery cannot pass until collision velocity settles. No changes to protected sources.
- Actual implementation: branching isolated C0816 motion candidate, enabled existing C0816 experimental contact mode and added a reversible on-screen `Run 60Hz landing audit (21 offsets)` panel with deterministic JS assertions for leg lengths, grip, COM/foot plant, joint continuity, first upper-back floor crossing, head/feet/velocity, and recovery. Candidate SHA256 `3e6b4f197d4189c3464c3b27eb8d515eeb50a2844d923479939f454110158694`; source diff saved. C0824 diagnostic line preserved untouched.
- Measured: 4557 samples (217×21 at 60Hz), back-floor contact 0/21 FAIL, safe contact 0/21 FAIL, joint continuity 0/21 FAIL (worst 0.749m/step), leg lengths 21/21 PASS, grip while loaded 21/21 PASS. Nominal joint #25 Red gripping-hand jump 0.637m at frame 164; earliest real collision not observed.
- Playwright Chromium 144 on mobile emulation via in-memory HTML, no page JS errors. UI whiff/guard/in-range throw accepted pass. Captured 108 frames after accepted touch input; MP4s **normal 30fps 3.6s / 0.25× 7.5fps 14.4s** (same exact source frame sequence), animated GIF and static 6-frame/reference contact sheets. These prove *rendered authored animation after touch*, NOT full match, physical impact or real-device success.
- Decision: **REVISE**; no visual approval/isolated advancement; 15-minute fallback only if actual review media is presented, and failures prohibit advancement. Physical iPhone, network, opponent AI/real match and complete 20-move roster not tested in C0825. No live code bindings, production changes, external push or spend.
- Next step: implement real isolated back-contact manifold/penetration solver that preserves joint lengths and holds sleeve until near contact, retest 21 offsets, then import into genuine button-driven multi-move fight and resume 20-move roster QA.


## C0826 — 2026-11-02T12:35:33.879756+00:00 — REVISE (user feedback: float + 3D left elbow)
- Branch C0825 SHA `3e6b4f19...` into isolated C0826 SHA `ef0f927fee49290d84e108054fe8e171ea1619baabb7bd5c433d35206d405083`; protected shipped/V2/C0802 unchanged.
- Actual patch: replace rising terminal C0816 authored arc at t>2.35s with seekable gravity-driven linked-body descent and a no-rebound upper-back ground proxy; gradual 20-degree neck/head tuck; 3D positive-pole two-bone left elbow in preserved original renderer. Exact source diff attached.
- Fixed-timestep/Chromium tests: 21/21 proxy contacts, zero post-contact rise, minimum head proxy clearance 15.93cm, 108 rendered frames left elbow .38/.40m with ≤3.4e-16m error, JS errors 0, touch whiff/guard/accept PASS.
- Failed/unverified: 0/21 full safe-landings (one foot ≈19.5cm <25cm target); grip releases ≈.25s early due to arm reach, 0/21 full 60Hz joint continuity (max step 59.1cm), no 3D rigid-body or friction physics, no physical device, no full-game input-to-impact, no recovery. Not all moves audited.
- Videos from C0826 touch-accepted authored animation are 30fps normal and same frames 7.5fps slow (H.264). File names `Dojo_World_C0826_Normal.mp4`, `Dojo_World_C0826_Slow_025x.mp4`; GIF and original-vs-current frame comparison.
- Review pending; no approval claim, no production bind/deploy; next: 3D grip/torso coupling, continuity, safe landing/recovery, then larger moveset testing.


## 2026-11-02T13:04:55.989489+00:00 C0827 — 3D elbow continuity diagnostic
Isolated C0826-derived HTML fea5ea247c358e664df2f4a776e00a095f74a62eb6ec91d35ce45ef2d1c3ace2. Five biomechanics invariants: Blue support/balance unchanged; planted feet unchanged; kinetic chain unchanged; sleeve path unchanged; recovery unchanged. Added explicit three-dimensional elbow segment-length and frame-continuity assertions; no animation pose changed. Chromium mobile in-memory loaded with 0 page errors. 21 x 217 samples: 3D elbow continuity 0/21, maximum elbow step 0.335m, segment lengths error 3.33e-16 m; safe landing 0/21, complete throw 0/21. Touch THROW accepted in isolated lab; rendered frames remain authored motion, not true rigid-body collision or full match. Verdict REVISE/THROW_BLOCKED. Next architectural work: replace authored post-impact pose with constraint-based articulated rigid body, stabilize elbow pole over time; avoid more easing tweaks. No user approval, promotion, device validation.


# C0828 current state — 2026-11-02T13:36:09.666970+00:00

## Protected / scope
- Shipped full original engine: `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b` (verified from nested seed ZIP original/index.html; unchanged).
- User-approved *visual* V2 reference: `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac` (verified by prior cycle, untouched).
- User-approved C0802 anterior gripping elbow visual: `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b` (unchanged).
- Current C0828 reversible isolated HTML `Dojo_World_C0828_Clinch_Followthrough_20261102.html` SHA `787fb55f0f861615da6d8108776e835c655c408e3c90140331bfca32d0cfdb6d`, branch from C0827 `fea5ea247c358e664df2f4a776e00a095f74a62eb6ec91d35ce45ef2d1c3ace2`; **NOT user-approved, not live full-match input-bound, not deployed**.
- World: prior-game Fuji 2.5D projected visuals preserved; target world mechanics genuinely 3D. Current torso/ground approximation still 2D-plane ballistic proxy, not 3D articulated solver.

## Fighter roster and controls
- Blue Kung-Fu-inspired and Red boxing-inspired, each P0..P4 (5), K0..K2 (3), L and T (1 each), total 20 attack variants, status `IMPLEMENTED_UNVERIFIED_REALISM` (no move promotion); Red's original kicks retained.
- Existing button inputs P, K, G, P+K and G+P, direction; no dual-stick conversion.
- This isolated touch lab has visible STEP CLOSER, GUARD, THROW, RESET actions; tap-accepted authored animation is NOT full-match physics.

## Five-point biomechanics reasoning before code
1. COM: Blue stays lowered during off-balance, shoulder load and follow-through; return to upright only after impact event.
2. Foot plant: Blue's two support foot constraints from V2 remain fixed in world coordinates, knee IK maintains bone lengths.
3. Kinetic chain: leg/knee bracing supports hip/torso forward fold; no independent arm pulling an unreachable Red body.
4. Clinch/contact: maintain 2-arm-length reachable sleeve point with shared Blue hand until about two 60Hz steps before predicted contact; no midair root teleport. Red's arc itself remains authored and gravity-proxy controlled (limitation).
5. Recovery: Blue only straightens after contact; Red's current planted state is proxy, articulated impact/recovery remains missing.

## Observed evidence (21 timing offsets, 217 samples each, 4,557 total)
- Source diff adds contact-synchronized low-follow-through phase to Blue; original V2 entry and Red trajectory unchanged.
- C0827 last held at 2.35s, C0828 at 2.566667s; predicted contact ≈2.608719s. Last held-to-contact reduced ≈258.7ms → ≈42.1ms. 3D reach to Red hand at 2.55s: baseline ≈1.138m, candidate ≈0.443m; arm max ≈0.774m. These are geometric, not force telemetry.
- Worst major-joint step across all offsets: 0.590812m → 0.331945m per 60Hz (still FAIL >0.20m).
- **Self-corrected test**: C0827 3D audit mistakenly read a 2D fallback elbow. C0828 uses identical 3D elbow calculation for both rendering and QA; actual nominal 3D elbow step 0.284517m >0.20m. Limb length numerical error 3.33e-16m.
- Ground *proxy* crossing 21/21; geometry safe 0/21; complete throw 0/21; leg length 21/21; grip *during previously defined load interval* 21/21. Red's feet at nominal detector's first 2.6s threshold ~0.218m <0.25m target. Head >=0.15m proxy at true contact; not proof of realistic impact.
- Existing legacy audit requires `held` at a 2.5cm pre-contact threshold, although user wants release shortly *before* contact. That assertion conflates release semantics; must fix independently with explicit lastHeldTime and physical contact event before counting a safe pass. Other failing gates (leg elevation, joint continuity and absent physics) remain regardless.
- Chromium in-memory browser: no page JS errors; touch out-of-range whiff, guard refusal and in-range throw accepted. 108 current authored frames captured after input; H.264 normal 3.6s / same frames 0.25× 14.4s, GIF, C0827-C0828 frames and user's IMG_7944 landing still comparison. Physical iPhone and actual 3D articulated collision, natural Red limb settle, network/game-match sequence: UNRUN / NOT PRESENT.

## Autonomous/user review and next action
- Previous user feedback to C0827 demanded realism, clinch, accurate gravity, smooth 3D elbow: treated as explicit **REVISE**, overriding silence.
- C0828 engineering verdict: **REVISE, THROW_BLOCKED**, source not promoted. User visual response pending; present_at to be logged at actual chat delivery, not preclaimed. Even after 15-minute no-response, fails full objective gates so next hourly verdict must remain REVISE.
- **Next:** implement actual 3D/articulated ground contact constraints including body angular momentum, elbow pole continuity 60Hz, foot drop/ukemi, neck clearance and physically reachable sleeve control; use IFJ 3D animation and user's IMG_7944 as geometry references. No endless scalar easing. Preserve 24-hour focus through 2026-11-03 07:22 CT, then at first hourly run 08:00 CT switch to rest of two fighter ordinary movesets, irrespective of throw completion.

C0828 review media presented in chat: 2026-11-02T13:36:44.993197+00:00 (timestamp recorded just after visible delivery). Await user review; failed objective gates prohibit autonomous advance.


## C0829 — 2026-11-02T13:55:11.153834+00:00 — Rapier 3D ISOLATED BRANCH / REVISE / Runtime blocked
- User requested introduction of Rapier into Dojo World; protected original, V2, and C0802 snapshots verified unchanged. C0828 remains unapproved REVISE/THROW_BLOCKED.
- Five-point biomechanics plan in C0829 README: loaded COM, support feet (illustrative), connected torso force chain, kinematic sleeve joint with actual ground events, gravity-settling recovery.
- Actual source: `Dojo_World_C0829_Rapier_3D_Prototype.zip` contains new Rapier 0.21.0 scene, skeletal bodies and spherical joints, floor contacts, fixed step, user controls, local server, tests. This code is separate from shipped engine and older C0828 HTML.
- Executed: Node/inline script syntax pass; 11 contract tests PASS, 1 actual WASM physics test SKIPPED (Rapier package absent); mobile Chromium markup smoke PASS with physics disabled. `npm view` failed `EAI_AGAIN`. No Rapier solver steps, physically grounded footage, physical device, 3D head clearance or actual collision numbers.
- VERDICT **REVISE**, NOT user-approved and NOT autonomously advanced. Video NORMAL/SLOW **NOT AVAILABLE**, blocker: missing package; no authored-video substitution.
- Next: run actual Rapier WASM in a package-accessible environment; measure joint drift, real contact order, head clearance, sleeve gap and rebound. Keep 24-hour throw deadline Nov 3 07:22 CST and switch to other core moves at the first hourly run after it.

### C0832 — 2026-11-02 10:00 CST — 3D joint continuity instrumentation
Isolated Rapier lab only; unchanged original/V2/C0802. Pre-code biomechanics: Blue stance/COM and support foot remain illustrative; kinematic grip drives constrained Red; back-first impact and recovery unverified. Added world-space residuals for eight skeletal joints plus maximum body-center displacement each 60Hz step, not a pose retune. Source SHA256 dbe861eb09a86ee260db28df0bf72ca73fdd4058ddc8eb850b7616a37ff3e347. 15 Node tests passed, 1 actual Rapier test skipped (dependency unavailable), 0 failed. VIDEO NOT AVAILABLE. No real physics results or user visual approval. BLOCKED/REVISE. Next: run actual Rapier WASM and inspect joint gaps, elbow, head, contact, grip, rebound. Nov 3 07:22 CST cutoff unchanged.

---

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


## C0836 — source handoff policy and user-proposed throw controller compatibility audit (2026-11-02T18:37:36.386250+00:00)

**Latest user directive:** Whenever an animation or real-physics build/quality test fails, deliver the exact source code and a Claude-ready handoff. Claude may review it independently at the user's discretion; GPT remains responsible for the actual ongoing development. This does not constitute authorization to deploy or replace original shipped Dojo World.

Deliverables: `Dojo_World_C0836_Claude_Debug_Source.zip` SHA256 `c2cf2e6ea0d26a1e60b83d2e6706112a469f354855d12b9423ca5ceb9bb0a892`; `Dojo_World_C0836_Claude_Handoff_Instructions.md` and unintegrated `USER_PROPOSED_throwController.mjs` inside ZIP. Includes exact runnable C0835 offline HTML, actual physics module, user-proposed controller (distinct and labeled), pinned offline npm package, existing tests, full physics telemetry and screenshot, compatibility checks and detailed Claude questions.

**Observed:** Existing C0835 Rapier WASM physics executes (18/18 existing automated tests pass) but realism fails: shinR contacts floor 0.233s vs back at 2.217s; minimum head clearance -0.005m; connected grip gap up to 0.300m. C0836 proposed controller static mock compatibility tests: 1 PASS, 5 FAIL (rig torso key mismatch; accepting torso even after prior shin floor hit; release scheduled 0.15s after contact; per-frame rather than dt smoothing; +X rotation from neutral drives back further from downward). These five were **not** validated by integrated Rapier simulation; no newly rendered throw or user approval.

**Verdict:** Unintegrated user controller remains REVIEW_REQUIRED / SOURCE_HANDOFF_DELIVERED, with no changed live gameplay and no updated physical outcome. Next code change should correct rotation sign/rig mapping/contact event owner then test true Rapier collision and skeletal dynamics. Continue hourly work through Nov 3 timebox, then switch to rest of move roster.