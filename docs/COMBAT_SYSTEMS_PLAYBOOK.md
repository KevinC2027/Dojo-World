# Dojo World — Combat Systems Playbook & Move Set Registry

**Status:** v1 — persistent engineering reference, not acceptance of any new animation.  
**Date:** 2026-10-31 (Chicago). **Maintainer:** ChatGPT. **User:** final aesthetic/gameplay authority.  
**Protected shipped-engine SHA-256:** `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`.  
**Preferred experimental throw source:** V2 ippon motion study. V3/V4 were rejected. The landing photo (`IMG_7944.jpeg`) is a *pose* reference, not mocap.

## Product mission and order of work

1. **Complete each fighter's recognizable core moveset** — every move must be playable, legible, mechanically coherent, useful in combat, and consistently recover to stance. Existing attack implementations are *not* equivalent to visual signoff.
2. **Reliable, realistic combat sequences** — prove unscripted exchanges using genuine inputs, footwork, guard, hit/whiff, reaction, KO, and transitions between several distinct moves. Avoid canned choreography; player agency determines what happens.
3. **Special moves** — only after the first two phases meet the user's quality standard. Classify authentic named moves vs bonus/original moves with reference support; add timing costs, counters and fair opportunity for response.

**Cadence:** one bounded change per hourly development cycle; choose the highest-value blocker across *the whole roster* rather than endlessly polishing a single move. 15-minute no-response rule permits provisional advancement only in isolated candidates, never automatic production promotion.

## Current roster from shipped source (implemented ≠ realism-approved)

The code has class inputs P (6 startup / 3 active / 10 recovery frames), K (9 / 4 / 18), L (13 / 3 / 28), T (5 / 2 / 26), at 60 Hz. These are **shared class timings**, not verified timing for each stylized animation variant. Guard, movement and sidestep are defensive primitives. These names are engine descriptions, not independent authenticity certification.

| Fighter | Five P variants (power by index) | Three K variants (power) | Other |
|---|---|---|---|
| **Blue — kung-fu-inspired** | lead palm (8), rear straight (10), lead chop (12), flowing rear palm (14), sweeping back palm (16) | snapping front kick (14), low sweep (12), side kick (15) | launcher (16), arm-grab turning throw (22), guard and footwork |
| **Red — boxing-inspired** | jab (8), cross (10), hook (12), uppercut (14), overhand (16) | front kick (14), roundhouse (16), crescent (13) | launcher (16), clinch hip/body toss (22), guard and footwork |

**Design caveat:** Red's kick set exists in the engine even though the style label is boxing. Preserve these until the user chooses whether Red is strictly boxing or a mixed-style fighter. No silent roster changes.

Every P/K/L/T attack above has an entry in `Dojo_World_Combat_Logic_Registry_v1.json` with a **stable move ID** (e.g., `BLUE-P0`, `RED-K1`). All start as `IMPLEMENTED_UNVERIFIED_REALISM`. Neither a code path nor a scripted replay qualifies as a user-approved finished technique.

## Reusable movement logic — single contract for every move

- **Pose origin and balance:** record starting stance, center of mass relative to each foot and supported limb. Never teleport into the ideal pose.
- **Root + ground contact:** record actual world-space support foot through startup, contact and recovery; release/step only when load transfers. Measure sliding and joint/hip translation.
- **Kinetic chain:** legs generate the impulse, hips commit, torso transfers it, hand/foot applies it at the target. Each move stores phase times and causally-linked tracks, not independent cosmetic curves.
- **Target and contact:** document limb swept volume, reach based on actual posture, timing of strike contact or throw grip, opponent response. Whiffs and guards require authentic alternate transitions.
- **Throw-specific coupling:** track thrower and victim together; grip constraints and step-under, pelvis/shoulder support, controlled downward follow-through close to the thrower, near-impact release, back-first contact and natural settle. Victim motion cannot be hand-authored solely to hit a final still.
- **Recovery:** keep intentional move recovery frames, weight settling, stance integrity and chained-input restrictions. No instant snapping, T-pose teleport, or hidden aim assistance.
- **Reactions:** damage, hitstun/blockstun, stumble, stagger, fall, clinch break, KO and getup should follow the actual impact class and outcome; do not mistake cinematic pose change for an authoritative state transition.

## New move authoring record — fill BEFORE coding

Use all fields in the JSON `motion_logic_template`. In human terms: **(1) weight start, (2) support foot, (3) force sequence, (4) contact/grip trajectory, (5) balanced recovery.** Then log move identity and authenticity source; input binding; phase-frame table; root/joint/foot/grip targets; attack and guard windows; damage and reaction; options on hit/block/whiff; measured reach and continuity; before/after capture; exact source hash; tests that passed or were not run; and user verdict.

All named martial arts should match documented techniques. If a formal name cannot be verified, tag `UNVERIFIED_LABEL`, not `authentic_core`. Original moves are future bonus content, not substitutes for missing core movement.

## Quality gates for a complete core moveset

| Gate | Passing evidence |
|---|---|
| **Inventory** | Both fighters have complete P0–P4, K0–K2, L0 and T0 plus locomotion/guard; no moves missing from input path |
| **Readability** | Every move visually distinguishable and technically plausible in normal speed and slow motion, not just a photogenic pose |
| **Physics/IK** | Feet stay planted where supported; body-weight transfer and hip-to-limb sequence plausible; limb lengths stable; no severe joint snaps or penetration |
| **Contact truth** | Only real contact within active hit window causes hit; correct guard, damage, whiff, distance, momentum and interruption rules |
| **Transitions** | Idle→attack→recover, attack→chain, attack→whiff/block, hit→stumble/down/KO/getup, and grab→carry→release→land all preserve pose and state continuity |
| **Actual combat** | At least several unscripted, real-input exchange captures: Blue offense, Red offense, defense/counters, combo interruptions, throws and recovery; deterministic replay and full-match testing |
| **Devices** | Desktop and mobile-browser emulation passing; real-device test results documented separately, never guessed |
| **User signoff** | User explicitly accepts the set and the exchange feel; autonomous fallback approval is only a working-branch decision |

These are completion *criteria*, not claims that current code already passes them.

## Current highest-value queue

1. Preserve V2 shoulder-load and pivot; finish by driving Red downward close to Blue, using the provided upper-back landing photo; keep Blue sleeve grip until just before impact; don't repeat rejected V3/V4 flight trajectories.
2. Perform a **roster-wide move audit**: for each P/K/L/T, collect one genuine input-driven clip, hit/block/whiff evidence, and a gap list; prioritize defects by visible impact. No gameplay-binding of unapproved ippon.
3. Eliminate universal continuity issues shared across moves (stance origin, foot plant, kinetic chain, hit-to-reaction, recovery) through reusable code/tests rather than one-off pose tweaks.
4. Build and validate short *unscripted* sequences using P/K, guard, footwork, launcher, throw, impact and recovery for **both** fighters. Preserve player agency, current button inputs, and accepted stats.
5. Only after quality approval, design/scope special moves and bonus-original techniques.

## Development log / revision control

Append each hourly iteration to `Dojo_World_Combat_Development_Log.md` with a unique run timestamp, changed move IDs, previous/new candidate SHA-256, measured changes, evidence files, test results and any user or autonomous verdict. Update the JSON entry status and add evidence links only after actual execution. If no code changed, log `NO_BUILD` and the blocker. **Never claim a move is finished simply because its source exists.**

## Approved throw study revision — recorded 2026-11-01T04:35:36+00:00
User explicitly approved their supplied `Dojo_World_Ippon_Seoi_Nage_User_V2.html` visual study (SHA-256 `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac`). This supersedes the prior pending visual judgment about the unapproved downward candidate. Preservation: never overwrite accepted v2 study or shipped engine; changes must branch into reversible candidates. Approval is VISUAL_REFERENCE_ONLY, not physics or genuine input approval. Screenshot montage `Dojo_World_UserV2_Approved_Reference_Frames.png`; test evidence `Dojo_World_UserV2_Approval_Verification.json`. Browser smoke passed, but blended release reports `held=true` at frame 61 while hand distance is ~0.645 m; physical contact and gameplay integration untested. Do not revert to rejected long outward toss. Continue full basic moveset and unscripted exchange objectives before special moves.

## Isolated v2 mechanics / original visual style bridge — 2026-11-01T04:45:39+00:00
- Explicit user request: retain the prior *playable engine* animation style (uniform solid stick limbs, 2.5D camera, original Fuji arena, idle / stance vocabulary); maintain user-approved v2 seoi nage *mechanics* instead of copying the new study's flat scene. Do not confuse rendered studio aesthetic with motion acceptance.
- Implemented **unbound** study candidate `Dojo_World_V2_Original_Style_Bridge_CANDIDATE_20261101.html` SHA-256 `970d1cc12d2b269bfa7e9c012ea37fb691e3ad9509bdda0262d405a0fe23b773`. Built on immutable original `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`, using unmodified v2 pose/motion code SHA-256 `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac` in namespaced motion adapter. Rendered with original `drawF()` visual style, ring/fuji backdrop; button input remains unchanged only when candidate runs original playable mode.
- Verified 108 standalone frames in Chromium, desktop + mobile emulation smoke, no page errors, pre-impact frame hand grip gap ~0. Video MP4 and GIF and six-frame contact sheet exported. Original playable engine was NOT overwritten or deployed.
- **Still unresolved:** consent-based live binding, true input to impact, physics contacts, real mobile device, full move-set regressions. Post-impact grip HOLD label is not proof of physical contact. This candidate is **NOT user-approved**, pending visual review under 15-minute fallback protocol.
- **Next scheduled cycle must focus forward:** review this style bridge against original game and image evidence; if adequate, build *isolated input-driven test* and audit core move set, not another standalone artwork restyling. Maintain all previous approved originals.

### Touch-lab usability gate (2026-11-01T05:04:30+00:00)
No future HTML-only input-gate delivery counts as usable unless a touch interface is immediately visible on mobile without special query parameters, with visible action feedback and an actual on-screen trigger, and the delivered HTML passes mobile/desktop browser smoke tests. The latest isolated touch lab SHA256 `b9a1d89e8ab9ced36f310c7002da34c4c838e2736343c040787ae93422ed7ba0` passes emulated touch tests but is not a real integrated match or physical-device test. Preserve approved style and source as references.


Cycle 4 evidence (2026-11-01 03:00 CT): synchronized grip-release timing experiment REVERTED: 1 reach failure remains and 0.553m 30Hz hand step. Require bounded velocity/acceleration and 60Hz full-joint continuity before revisiting release. Gameplay MP4 shows original playable input mode, not new throw.

### 2026-11-01 06:00 grip semantics
Button-gated authored throw is NOT full combat gameplay. Grip held requires actual hand gap <=0.10m; two 30Hz violation frames 60–61 remain, and physics, full 60Hz and live match unverified. Retain approved V2, original visuals, and immutable shipped source.


### C0700 2026-11-01 07:00 CST — shared reach-constrained grip experiment
The isolated touch study now computes a single reachable sleeve anchor from intersecting shoulder reach discs (each arm 0.78m minus margin) instead of independently blended hands. It preserves V2 pelvis and planted foot keyframes. Tests at 60Hz: grip violations 4→0 / 216 samples, but 8 joint discontinuities >0.20m and maximum 0.7727m due to elbow IK bend instability. **REVISE; do not advance**. Source SHA f53c4cd83015e2bd2cf1385a5ae08ab080f6e8a407f3879868c814e35b04844b. The normal and 0.25x videos show a touch-triggered authored study, not physics gameplay. Next solve elbow branch continuity and contact before live-match integration.


## 2026-11-01 — C0801 stable two-bone elbow/connected-grip solver
- User supplied a Unity `TwoBoneGripIK` C# candidate; this is conceptual input, not a loadable component in the current HTML/JS engine.
- Protected source: shipped original SHA256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`; approved visual V2 SHA256 `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac`. Both rehashed from preserved files.
- C0800 first stable pole corrected joint jumps 6→0, but remaining elbow fold under 30° revealed need for a minimum shoulder-to-wrist radius; C0800 preserved as evidence.
- C0801 isolated new source SHA256 `6c71373d646f81548d55357a647181f9c37db7d046a16f05b9b7067e0593f20c`. Exact fixed 2D elbow bend branch (C0700 `dot(perp,bendBack)` branch flipped), 0.24 m minimum shoulder/wrist separation during shared-grip pivot, deterministic smoothly varying pole direction; approved pelvis, Blue foot plants, Red trajectory and V2 art constraints remain intact.
- Pre-code biomechanics (1) Blue COM/pelvis unchanged, (2) feet planted at original positions, (3) leg→hip→torso pivot follows V2 keys while arm law-of-cosines preserves segment lengths, (4) one feasible wrist anchor through grip and minimum elbow bend ≥30°, (5) original landing/recovery phase unchanged with *no physical contact claim*.
- Independent 60 Hz Chromium pose audit, 217 samples: large joint discontinuities >0.20m reduced **6→0**; largest any joint step **0.77272→0.18107 m**, Blue gripping elbow step **0.77272→0.10675m**; grip reach failures 0; arm-length violations 0; elbow angle minimum **4.75°→35.72°** (passes 30° floor). Mobile Chromium touch whiff + in-range accept; 0 errors.
- **Critical remaining issue:** authored impact 1.84s has Red shoulder center 0.409m above ground and head-bottom 0.280m above ground, so the observed touchdown is not verified back-first physical contact. Later source clamps head height to floor. Do not claim safe impact mechanics from these pose values alone. Full-match input-to-throw and physical iPhone tests unrun.
- Verdict: SOLVER DIAGNOSTIC PASS, OVERALL THROW REVISE; not user approved, not autonomously advanced, not shipped. Preserve usable touch controls; normal and 0.25× MP4s must demonstrate actual touch-triggered isolated throw animation, not unrelated original-game punches.
- Next: shared contact/collision pipeline with back-first capsule proxy, impact timer from actual collision event, and recover into at least two ordinary roster moves; full Blue/Red roster still IMPLEMENTED_UNVERIFIED_REALISM.


## 2026-11-01 C0802 — Human elbow hemisphere correction (user correction)
- User observed that Blue's elbow bent backward in C0801 despite numeric continuity passing. Treat C0801 visual as rejected for that arm orientation; never call its 35.7° flexion result proof of correct elbow anatomy.
- Five-point reasoning: **balance** same pelvis/COM; **stance** same planted feet; **kinetic chain** same Blue shoulder and hip pivot and V2 Red trajectory; **grip** one shared anchor and analytic 0.38m/0.40m arms, with elbow hemisphere switched from posterior (-1) to anterior (+1) only for Blue grip arm; **recovery** unchanged. No independent wrist/path hack.
- C0802 candidate SHA256 `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b`; inherited C0801 SHA256 `6c71373d646f81548d55357a647181f9c37db7d046a16f05b9b7067e0593f20c`. Shipped engine verified hash `786ac6bf...`, approved V2 study `c098b240...` unchanged.
- **Observed 60Hz pose audit (217 samples):** pre-impact wrong bend-side samples 111→0; >0.20m limb jumps 0→0; max studied joint step 0.1357m, arm/leg length violations 0, shared-grip reach violations 0. Mobile-emulated touch whiff, guard and valid throw accepted; 0 Chromium JS errors. These numbers establish a consistent 2D elbow branch; they do not independently establish 3D anatomical plausibility.
- **Footage:** C0802 normal and 0.25× MP4 + inline GIF directly from new candidate after emulated touch-triggered gate. Motion is still authored v2 pose track, **not** physically simulated combat. Before/after sheet matches frame indices with browser animation loop suspended.
- **Blocking/untested:** back-first physical collision, Red center-of-shoulder ≈0.409m above floor at authored impact in preceding iteration, 3D elbow axis and forearm roll, match input-to-impact, physical iPhone, unscripted multi-move roster.
- **Status:** 2D elbow solver diagnostic PASS; **visual approval pending** for C0802, production/shipped engine untouched. At next scheduled review apply user verdict first, 15-minute fallback only to isolated candidates, and do not advance failed collision claims.


## User visual signoff — C0802 elbow correction (2026-11-01T13:46:20.961876+00:00)
The user explicitly stated **“Much better. I approve”** after viewing the C0802 normal/slow videos. Treat the **correct anterior elbow bend in C0802** as visually approved and a locked isolated reference. This is **not** approval to merge it into the shipped source or treat Red's contact/physics as complete. Preserve C0802 SHA-256 `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b` alongside the immutable V2 motion reference and original game style.

**Next test gate:** measured shoulder/upper-back collision and head clearance/leg elevation at impact; visible downward follow-through without outward toss; then input-driven Blue/Red multi-move exchanges, explicit phase recovery and core roster audit. No reason to continue isolated elbow flip revisions absent contrary user feedback.


## C0825 60Hz reproducible landing gate — 2026-11-02T12:02:52+00:00
- Source: isolated C0816 contact experiment + new **read-only geometry audit panel**, `Dojo_World_C0825_Throw_Impact_Gate_20261102.html` SHA256 `3e6b4f197d4189c3464c3b27eb8d515eeb50a2844d923479939f454110158694`. This is **not** derived from C0824 telemetry; both branches are preserved.
- Five-point biomechanics guardrails before code: preserve Blue balance/COM; preserve both planted support feet; preserve V2 legs→hip→torso→shoulder path; instrument one shared anatomically reachable sleeve grip rather than arbitrary hand relocation; forbid recovery certification until real back-first impact and velocity response are observed.
- Executed Chromium in-memory `page.set_content` (works despite URLBlocklist) and fixed frame sampling at 60Hz, 217 frames × 21 offsets = 4557 pose samples. Back-floor crossings **0/21**, safe impact geometry **0/21**, max joint step **0.749m** vs 0.20m gate, leg-length PASS **21/21**, sleeve load PASS **21/21**. Nearest back proxy **0.364m** above floor. No measured impact therefore no claim of head clearance *at impact* or release *at impact*.
- Browser touch: out-of-range whiff, guard refusal, in-range accepted ALL pass, no page errors. This is a **touch-gated authored clip**, not live full-match input-to-physics or device testing. Same 108 actual rendered frames are in normal 30fps and 0.25× 7.5fps H.264 MP4s, plus GIF and contact sheet.
- Verdict **REVISE**; no user approval/autonomous promotion. Required next architecture: rigid body/contact-event collision resolution and hand/arm release semantics, then unscripted move-set audit for both fighters.


# Dojo World C0826 authoritative state (2026-11-02T12:35:33.879756+00:00)

Protected original game SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b` (previously verified against seed). User-approved V2 visual reference `c098b2401aa4271f70f8ccaea03d181ee8101be84ea55758bb62b5c4756777ac` (verified now). User-approved C0802 anterior elbow direction `c1b1f876f63c93cb234c7f1080e9b61ddd5cb3ab79c95c564222d8a4fb3edf5b` (previously verified). No protected source modified. Rejected V3/V4 and outward toss. Source branch C0826 SHA256 `ef0f927fee49290d84e108054fe8e171ea1619baabb7bd5c433d35206d405083`. Style locked to original Fuji arena. Blue Kung Fu and Red boxing-inspired, each five P, three K, L, T plus button movement/guard, all IMPLEMENTED_UNVERIFIED_REALISM. Red K retained. 

## User feedback
C0825 throw looked improved but Red floated upward after landing. Blue left elbow looks wrong; user emphasized three-dimensional environment. The newest C0826 user visual verdict is pending; no autonomous advancement or live bind.

## Five-point reasoning before patch
1. Balance: preserve Blue pelvis COM curve and planted support feet.
2. Planted foot: do not shift Blue support positions to disguise a landing.
3. Kinetic chain: retain the approved over-shoulder loading arc, convert terminal descent to linked-body gravitational translation instead of upward authored arc.
4. Grip/trajectory: preserve anterior positive elbow side, solve Blue elbow in three spatial dimensions with depth and exact .38m/.40m segments; only call grip held if within reach, release if not.
5. Recovery: suppress rebound only after a floor crossing; do not mark timer-driven reset as verified anatomical recovery.

## Observed evidence
- 21 offsets x 217 fixed-timestep pose samples = 4,557. All 21 have upper-back plane PROXY contact; all 21 had zero upward post-contact rise. Prior C0825 had 0/21 contacts. These are kinematic proxy contacts, not 3D rigid-body collisions.
- Minimum head-bottom clearance at proxy contact `15.93cm` across offsets (>=15cm). A proposed chin tuck is rotational, max 20deg around shoulder pivot.
- Nominal first ground-proxy contact t≈2.617s; minimum foot height ≈19.52cm, below 25cm elevation gate. Full safe landing **FAIL 0/21**.
- Gravity acceleration 9.81m/s² applied to all linked Red joints through descent, terminal speed ~2.71m/s; inelastic clamp suppresses bounce. Energy absorption, friction, torque and impact compression remain unmodeled.
- Blue left elbow 3D projected solver segment lengths verified at 108 30Hz render frames: max error ≤3.4e-16m. C0802 anterior sign retained. Full 60Hz 3D angular continuity NOT confirmed; full all-joint continuity still **FAIL 0/21** (worst step ≈59.1cm).
- Sleeve grip at load passes 21/21; after 2.35s Blue's wrist cannot reach Red's fixed grip target so held becomes false at ≈2.367s — **~0.25s prematurely before contact**. Reach is truthfully failed, not teleported. Requires 3D torso/shoulder and sleeve coupling.
- Chromium 144 via in-memory page.set_content; touch whiff, guard reject, accepted input all passed, JS errors 0. 108 source render frames exported as H.264 normal (30fps, 3.6s), same at .25x (7.5fps, 14.4s), plus GIF. This is touch-gated authored motion, NOT full match or actual physics simulation. iPhone physical device unrun.

## Verdict
REVISE / NOT USER APPROVED / NOT ADVANCED. Rendered elbow and no-rebound correction useful as isolated development only. Style and approved V2/C0802 visual sources immutable. Next work: physically feasible shared sleeve anchor with articulated 3D torso/COM and late release, enforce joint angular velocity and safe raised-feet contact with continuous recovery. Parallel roster-wide move audit and genuine multiaction input-driven sequences. No special moves.

## Review
C0826 new candidate presented_at is logged in companion manifest immediately before reply; 15-minute fallback decision on next eligible hourly run subject to evidence, never auto-promotes shipped code.


## 2026-11-02T13:04:55.989489+00:00 C0827 — 3D elbow continuity diagnostic
Isolated C0826-derived HTML fea5ea247c358e664df2f4a776e00a095f74a62eb6ec91d35ce45ef2d1c3ace2. Five biomechanics invariants: Blue support/balance unchanged; planted feet unchanged; kinetic chain unchanged; sleeve path unchanged; recovery unchanged. Added explicit three-dimensional elbow segment-length and frame-continuity assertions; no animation pose changed. Chromium mobile in-memory loaded with 0 page errors. 21 x 217 samples: 3D elbow continuity 0/21, maximum elbow step 0.335m, segment lengths error 3.33e-16 m; safe landing 0/21, complete throw 0/21. Touch THROW accepted in isolated lab; rendered frames remain authored motion, not true rigid-body collision or full match. Verdict REVISE/THROW_BLOCKED. Next architectural work: replace authored post-impact pose with constraint-based articulated rigid body, stabilize elbow pole over time; avoid more easing tweaks. No user approval, promotion, device validation.


## C0828 contact-driven clinch follow-through, 2026-11-02
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


### C0829 — Rapier isolated physics architecture (UNVERIFIED)
- Introduced isolated 3D Rapier 0.21.0 adapter, dynamic upper-back/head/pelvis/limbs, spherical 3D joints, Blue kinematic sleeve anchor, real ground-event API and fixed timestep. No production or V2/C0802 edits.
- **Critical:** installation failed due network EAI_AGAIN; 0 verified Rapier physics steps, and no visual/live approval. Treat `C0829` as implemented code pending runtime, not a new passing physical throw. Spherical joints do not ensure anatomical hinge limits. C0828 remains current visually recorded diagnostic.
- To advance: package installed, actual 3D simulation and contact events; verify back-first head >=0.15m, no head-first contact, grip retained through fall, no rebound, elbow stability, 60Hz continuity, guard/whiff/throw and real match input. Save normal+0.25x actual physics video, not authored reference.
- Within 24h timebox until Nov 3 07:22 CST; then switch to 20 core attacks.

### C0832 isolated Rapier instrumentation (2026-11-02)
The physics lab now exports 60Hz 3D `jointAnchorGaps` for neck, spine, both shoulders, hips and knees, `maxJointGap` and `maxCenterStep`. They are **measurement interfaces only** until actual Rapier WASM stepping produces numeric evidence. Source SHA256 dbe861eb09a86ee260db28df0bf72ca73fdd4058ddc8eb850b7616a37ff3e347; 15 source/unit tests passed, 1 physics test skipped. BLOCKED/REVISE; no video or gameplay integration. Do not infer anatomical elbow angle correctness from spherical joint anchors alone.

---

## C0835 — real Rapier WASM running + physics landing failure
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