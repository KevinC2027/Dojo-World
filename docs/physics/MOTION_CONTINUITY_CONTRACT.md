# Dojo World — Owner's Motion Continuity Contract (2026-11-03)

**Authority: NEW OWNER DIRECTIVE; governs all future Codex combat-physics revisions.** Read before engineering. Supersedes any earlier workflow that treats pose/solver changes as independent or declares success based only on one local metric. This is **process guidance, not approved gameplay code**.

**Central principle:** **A move is a temporally continuous, physically legible event from initiation through grip/contact, transfer, flight, landing and recovery. The unit of correctness is the whole event and its phase interfaces, not one solver frame.** A locally better segment length that worsens a phase seam is a failed improvement. Existing blocked PRs #6 and #8 stay blocked, unmerged and unpromoted.

## Six non-negotiable rules

### 1. Never fix a phase in isolation
- For each proposed change, identify its **incoming and outgoing phase**, boundary tick, pose/constraint state and the adjacent phase's expected geometry. Always measure both sides with position, velocity and bend orientation; include the frames before and after.
- Example from owner: last-carry right elbow shifted under a fixed 0.40 m segment constraint, while first-air pose remained authored and unchanged; release step **0.0117 → 0.0294 m**, 2.5×, and the sorted-rank-zero comparator rejected it. The exact numbers identify one observed seam, **not** a universal threshold or proof a different case will behave identically.
- Rule: **Changing one side of a boundary requires validating and, where necessary, coherently adapting the other side or the interface state**. A local fix is not 'done' until the neighboring phase and the full trace pass.

### 2. No hard phase switch without state carried across
- Build a **phase interface contract** for grab→carry, carry→air, grip→release, air→floor contact, down→getup, getup→idle, and any other changed seam.
- Pass the **final solved world-space pose, joint linear/angular velocity or reliable finite-difference estimate, bend-pole orientation, contact/grip constraints, planted-foot and simulation state** into the next phase. Do not recompute a conflicting authored pose in isolation at frame 0.
- Owner's default: **short 4–6 simulation-tick constrained transition blend** anchored at the last solved pose. Choose duration by measured dynamics; maintain physical reach, joint lengths, actual gameplay timing/inputs/outcomes, and causal contact. No fake safety freeze or hidden teleport.
- If the 4–6-tick blend is **mathematically or physically infeasible** under fixed endpoints and the strict gate, **stop and document the conflict**. Do not silently retime gameplay, change locked endpoints, lengthen the blend, or relax an acceptance bound without a reviewed decision.
- Require per-boundary position (C0) and velocity (C1) comparisons, plus acceleration/jerk trend, limb-length bounds, pole bend-side, foot slip and grip continuity in both directions. State whether those metrics are real physics or kinematic presentation proxies.

### 3. Motion solves the throw; safety gates cannot conceal a broken throw
- User-observed anti-pattern: upper-back clearance **0.31 m**, **0 safe back-first samples**, head at floor with **0 m clearance**, sleeve released before landing. An 'impact safety gate' cannot make that motion believable.
- For **ippon seoi nage** as a reference target, build a continuous partner pelvis/root and spine trajectory that rotates around a **moving anatomical shoulder/back pivot**, coupled to the thrower's step, hip load and forward hinge; continuous arm/sleeve contact drives control through load and forward rotation. Do not impose an arbitrary free-flight horizontal toss.
- Maintain grip **until the opponent is actually supported at floor contact** in the specified visual variant, then release in a physically coherent, continuous manner; allow a documented alternate legitimate technique variant only with owner approval. Avoid nonphysical grip stretching or hand teleport.
- Measure shoulder-pivot path, connected grip distance, relative pose and momentum, victim support/lift timing, initial collision body part, head/floor clearance, falling torso and later hips/legs, ground settle and post-impact rebound. The recovered stick game cannot establish accurate mass/rigid contacts from its current geometry alone. Label those as **proxies**, not validated collision truth.
- Do not rewrite/bind the isolated ippon variant while trying to solve the **currently shipped back-style right-elbow seam**. A new end-to-end ippon implementation needs its own approved scope.

### 4. Feasibility proof BEFORE gameplay edits
- Before writing a candidate, specify **fixed and negotiable** constraints: root and endpoint trajectories, bone segment lengths (arm half `0.40 m` where applicable), elbow bend side, phase duration, release pose/velocity and strict comparator thresholds.
- For a two-segment chain with equal length `L` and endpoints `A,B`, test `|A-B| <= 2L`. If attainable, the elbow's reachable locus is a circle in 3D around midpoint `M=(A+B)/2`, radius `r=sqrt(L²-(|A-B|/2)²)` in the plane perpendicular to `B-A` (with degenerate cases handled). Compute **the closest feasible elbow to the required outgoing pose/velocity envelope** and compare its minimum displacement/step against the strict gate.
- Owner example: the closest reachable point was **0.0228 m** away, but the local step limit was **0.0117 m**. **Provably infeasible with those locked endpoints and lengths.** No iteration may tune a solver under those fixed constraints and then claim it could satisfy the gate.
- If infeasible, stop and propose the **smallest interface-level constraint redesign** (e.g. continuity-preserving change to endpoint trajectory, blend window, neighboring pose, or permitted timing) with explicit before/after test prediction. **Do not simply loosen a safety or visual gate.** Get owner review for any changed locked constraint.

### 5. Every revision includes actual video
- **Mandatory each candidate revision**, including failed/rejected ones: actual captured runtime footage, labeled baseline vs candidate, **normal-speed and 0.25× slow motion**, covering at minimum **pre-grip/entry → carry/load → release/air → floor contact → recovery**, plus focused seam frames; include both relevant fighter directions/facings when testing that scope.
- Attach timestamp/frame index, candidate SHA, actual input path, phase markers and, where feasible, diagnostic skeleton/constraint overlays. A still photo, static test report, or hand-authored animation is not substitute video evidence.
- Numeric tests and visual quality are **separate gates**. If video obviously looks wrong, mark candidate **NOT VISUALLY ACCEPTED** even if numerical comparator is green. If video looks plausible but comparator fails, keep candidate **BLOCKED** and explain conflict. Never redefine success or silently waive one gate; present both results for the owner to decide.
- If recording fails, mark visual test **NOT RUN**, retain code/evidence and don't report acceptance.

### 6. Full move validation before 'fixed'
- Limit to **one measurable hypothesis per revision**, but evaluate the **complete affected movement**, both upstream and downstream phase interfaces, and the entire established comparator. One local improvement can introduce a later landing or recovery defect.
- Re-run **8/8 deterministic throw conditions**, observer neutrality, **25/25 browser smoke checks** and dedicated full-distribution physics comparator; include video and any phase-specific contact/landing checks. Identify missing/skipped/unrun checks, and state which are genuine physics vs presentation proxies.
- Label status accurately: `HYPOTHESIS` → `TESTED LOCAL` → `FULL GATE PASS / FAIL` → `VISUAL REVIEW PENDING / REJECTED` → `OWNER-APPROVED` only after actual signoff. Never call it 'fixed' on a local metric alone.
- **Red comparator = BLOCKED.** Do not merge, promote, deploy, change protected originals, or modify gate thresholds merely to obtain green. Persist the failure, evidence and next single action.

## Required deliverables for each Codex candidate
1. **Feasibility memo before code:** endpoint ranges, reachable set, lower bound vs gate, phase boundary map, explicit infeasibility check and negotiable constraints.
2. **Whole-event state trace:** fixed-step positions, velocities, accelerations, pole and grip/contact states, support/contact proxies and all phase transitions, both fighter directions.
3. **Before/after numerical report:** target metric plus p50/p95/p99/RMS/max for motion distribution and every changed seam, test inventory PASS/FAIL/SKIP/UNRUN.
4. **Video evidence:** normal and 0.25×, side-by-side or sequential baseline/candidate labels, whole move and annotated seam.
5. **Disposition:** Green gameplay + red physics -> BLOCKED. Green physics + wrong visual -> NOT ACCEPTED. Only full measured and visual signoff allows owner-approved promotion.
6. **Reproducible checkpoint:** commit SHA, candidate hash, unchanged protected hash, actual reproducible commands, explicit next single hypothesis. Remain within Codex usage cap; no extra paid credits, no auto-merge.

## Immediate application to Issue #7 and draft PR #8
- Remain on **diagnosis**, not more solver tuning, for the first remaining right-elbow `er` carry→air distribution failure in `back-slot0-face+1-gap0.85`. Use existing matched Cycle 1 / Cycle 2 traces.
- First compute feasibility under fixed endpoints, fixed arm half length 0.40 m, unchanged first-air pose and release-step limit. Document closest-point lower bound and compare to the actual case's threshold; do not automatically apply the owner's example 0.0228/0.0117 m numbers to a different case.
- Map transfer of elbow world position, velocity and bend-pole across the transition. Propose a 4–6-tick constrained handoff only **if feasible**, otherwise flag which upstream/downstream constraints need coordinated change and ask for scope approval.
- If implementing later, video **every revision**, run full affected move and all regression gates before claiming success. Keep the current Cycle 2 candidate BLOCKED and do not rewrite historical evidence.

**This document is an owner-approved engineering evaluation directive; it is not approval of a specific physical throw animation, ippon binding, or any PR merge.**
