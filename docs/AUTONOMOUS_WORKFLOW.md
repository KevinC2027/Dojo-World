# Dojo World — Autonomous Development Operating System

**Current mode: SOURCE RECOVERY / READ-ONLY AUDIT.** Gameplay development remains paused; do not write, merge, or schedule new combat implementation until the owner explicitly resumes it.

## Architecture (Chromebook-compatible)
GitHub is the durable source of truth: issues are work orders; branches hold isolated changes; pull requests are review packages; CI checks integrity; AGENTS.md and this document supply cross-task memory. Codex Cloud is the coding/research worker. The owner retains approval authority.

### Work states
1. `RECOVERY`: inventory, hash and identify existing source. No gameplay edits.
2. `AUDIT`: inspect source architecture, setup and CI, log open uncertainties.
3. `READY`: complete canonical playable build present, smoke tests reproducible, test scope documented. Ready does not authorize gameplay editing.
4. `ACTIVE`: only after express owner approval to resume. Issues may assign individual source edits.
5. `REVIEW`: every change goes to a PR with tests and visual evidence.
6. `APPROVED`: owner signs off and authorizes merge. No agent or GitHub automation auto-merges gameplay.

### Agent decision loop (ACTIVE only)
Select ONE bounded approved issue -> read source + AGENTS.md + playbook + status -> explain movement mechanics before coding -> implement in feature branch -> run unit/build/smoke tests -> provide video/screenshot evidence for animations -> record test results + source changes + failure modes -> open PR -> stop at review gate. Never use a passing static check to claim a real-time animation is visually correct.

### Guardrails
- No unattended code editing while paused.
- No gameplay logic in GitHub Actions; CI only validates recovered file presence and structural integrity.
- No auto-merge, direct push to main, force push, deletion of snapshots, or branch contamination.
- Working game, environment, experimental Rapier studies, and move studies are separate origins. Never blend them automatically.
- Don't place API keys or billing credentials in GitHub workflows. Existing ChatGPT Plus access is not a metered OpenAI API key.
- Read-only scans must not execute imported untrusted JS/HTML or install project dependencies.
- Distinguish automated static inventory from verified runtime or visual functionality.
- Record any failed validation as a finding; do not silently generate replacement assets.

### Current operational cadence
**On each GitHub pull request:** safe inventory CI can run automatically once this proposed workflow is merged or allowed on the branch. Review findings before merge. CI does not initiate Codex agent tasks.

**While paused:** start a Codex Cloud task manually against the recovery branch using the read-only audit prompt. It can work while the Chromebook is off once started.

**Later, only after owner authorization:** add an eligible Codex automation or ChatGPT Work GitHub-event task to triage issues or review PR activity. For unattended code generation, confirm the chosen feature is available on the account and set usage limits; do not assume it is included or already connected. Keep automatic review separate from automatic merge.

### First Codex Cloud prompt — copy verbatim
> Work on branch `recovery/import-source-2026-11-02`. Read `AGENTS.md`, `docs/SOURCE_RECOVERY_STATUS.md`, and `docs/AUTONOMOUS_WORKFLOW.md`. This repository has only a partial recovered source import. Perform a read-only architecture and provenance audit. Identify what actually runs, what is missing from the complete game, what tests can safely be run, and whether separate branches are incorrectly assumed to be one project. Do not create or modify gameplay, do not merge anything, and do not claim the full game is recovered. Return a concise source inventory, missing-file list, conservative validation results, a ranked recovery backlog, and exactly what I should approve next.

### Completion criteria for source recovery
- Full source archives can be provenance-checked against the selected playable baseline.
- Dependencies and assets are present.
- At least one reproducible startup or smoke-test exists.
- Specs and current source match, and gaps remain explicitly listed.
- Separate experimental work is named, tracked, and isolated.
- Every new source change has a reviewable PR and an owner approval step.
