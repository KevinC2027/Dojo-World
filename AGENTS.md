# Dojo World — Codex Engineering Instructions (current program)

Updated 2026-11-02 by owner's directive. **Combat physics development is resumed in isolated candidate branches.** The earlier instruction to pause gameplay in `recovered_source/AGENTS.md` is a **historical snapshot** preserved verbatim for provenance. Do not rewrite it. It does not represent the owner's current intent for the new combat workbench.

## Mission
Continuously improve believable, grounded, expressive, responsive combat physics. Build a **simulation core that can eventually support a server-authoritative open-world MMO**, while making the current combat prototype better today. Realism and player control both matter. Do not mistake polished pose animation, a static screenshot, or 25 green browser smoke checks for physically sound combat.

## Source boundaries
- **Immutable reference:** `recovered_source/index.html` SHA-256 `786ac6bf36413459be491609ebe986106de0a09b4753e233854cad80f0e2968b`, plus every byte under `recovered_source/`. Preserve all original source manifests, evidence, and historical reference branches.
- **Current test support:** `tests/browser_smoke/` and `.github/workflows/browser-smoke.yml` from draft PR #4, which are not yet merged. The branch from which this program starts includes that infrastructure. Never claim that required branch protection is configured.
- **Development location:** put proposed physics/game code in clearly named new workbench/candidate files outside `recovered_source/` and outside historical reference trees, on independent short-lived branches. Do not edit `main`, mix historical v3.9/world/Rapier labs into the combat runtime without review, or modify source in place.
- The recovered `reference/rapier-c0836/` is an isolated physics lab with historical defects, not an approved integrated game engine.
- Current controls: **buttons**, not dual-stick. Blue's style is Kung Fu; Red is boxing-inspired, but the existing eight ordinary hand/kick attacks and launcher/throw variants must be preserved pending explicit style decision.
- Retain the three-stage roadmap: complete ordinary move sets, verify natural combat exchanges, then develop special moves.

## Non-negotiable engineering loop
1. **Read:** identify current baseline SHA, owner directives, archived accepted decisions, open defects, last comparable candidate, and actual input path that triggers the behavior.
2. **Measure before editing:** reproduce one highest-impact physics defect through actual gameplay input when possible; save deterministic state traces, geometry/physics measurements, and relevant video/frame evidence. Label forced tests distinctly.
3. **Explain first:** state load-bearing foot, center of mass/weight origin, contact/grip geometry, force path (feet -> hips -> torso -> limb), target reach, and return to balanced stance. For throws, model kuzushi -> entry -> load -> arc -> contact -> settle, with physically coherent continuous constraints.
4. **Isolate one meaningful hypothesis:** change the smallest surface necessary in a candidate or modular physics layer, not a collection of unrelated motions. New candidate must be independently revertible.
5. **Verify:** existing 25 browser checks must stay green. Add/execute appropriate deterministic physics probes (both fighters, both facing directions, no unintended change to reach, damage, timing, input response, hit/KO/round rules). Don't equate process exit 0 with test success; inspect structured counts, skips, and invariant data.
6. **Compare against baseline:** report before/after for affected metrics, all hard invariants, original source hash, accepted behavior preservation, representative input sequence, and any unverified subjective qualities. On failed invariants or regression, discard/revert candidate and retain failure evidence. Max three focused repair attempts per candidate.
7. **Document and propose:** update the living physics ledger, candidate provenance, and repeatable tests, then submit a draft PR with evidence. **Never auto-merge**, never change production state automatically, and never call a candidate owner-approved without owner's signoff. Continue to next independent diagnostic or test-development task without asking for routine approval, as long as a Codex session/task is running.

## Physics metrics to establish and trend
- Local/world-space segment-length error; elbow/knee range and bend direction; joint continuity/velocity spikes
- COM and foot support; foot slide while planted; stance recovery time; balance under contact forces
- Actual contact-point distance, swept collision, impulse direction, penetration and separation
- Grip/sleeve connection and release timing; upper-back/shoulder-first landing where required, head clearance, vertical velocity before/after impact, bounce/rebound
- Attack responsiveness and hit timing; reliable recovery under chained, defended, and interrupted moves
- Deterministic fixed-step simulation and replay; frame-rate invariance; separate simulation results from presentation

Start with baselines taken from actual recovered code and tests. Existing historical thresholds are **reference targets, not proof of current performance**. Define scientifically meaningful hard constraints where possible, and trend softer visual scores separately. Use real video/mocap or biomechanics references when actually available and licensed; don't invent measurements.

## Open-world MMO constraints (future architecture, not integration authorization)
Favor a deterministic/traceable, engine-agnostic physics interface with simulation and presentation separated; design for eventual server-authoritative outcomes, replication/interpolation, lag-compensated contact and repeatable 100–150 ms simulated-latency tests. **The recovered browser game has no production server/network layer.** Do not claim one exists. Do not port to Unreal, implement networking, or integrate neighborhood/world branches without a separately reviewed plan.

## High-priority initial diagnostic queue
- Real-input Blue and Red shipped throws: grip-before-lift, center of mass, foot support, correct impact and no artificial rebound; both directions.
- Historical protected build defect markers: Red victim knee jump ~0.379 m, Red thigh deviation ~0.416 m, Blue victim forearm deviation ~0.263 m (historical measurements; reproduce before prioritizing).
- Compare and **isolate** the Rapier reference failure (right-shin-first initial contact, head clearance -0.005 m). Do not promote or combine that lab automatically.
- Ordinary strikes: planted support foot, believable hip-first force chain, no limb teleports, credible hit-reaction impulses; then multi-move exchanges.

## Task / autonomy boundary
The owner's latest instruction authorizes **ongoing isolated, test-driven combat physics improvement**, not automatic deployment, merges, expense, credential changes, or new subscriptions. Codex may implement and test successive bounded improvements in its active task/Goal, capture results, and create draft PRs. A scheduled/continuous loop exists only if it is **actually configured** in Codex/Work; do not claim a future run will occur without such a schedule. Stop on broken provenance, unrepeatable tests, unavailable dependencies, security barriers, or exhausted retry budgets, and file a blocker with evidence.
